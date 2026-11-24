-- 0001_init_schema.sql
-- Dev Hub initial PostgreSQL schema inside "dev-hub" (no ORM).

CREATE SCHEMA IF NOT EXISTS "dev-hub";

-- Custom Enum Types
DO $$ BEGIN
  CREATE TYPE "dev-hub".project_status AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "dev-hub".health_status AS ENUM (
    'UNKNOWN',
    'HEALTHY',
    'DEGRADED',
    'UNHEALTHY',
    'UNREACHABLE',
    'INVALID_RESPONSE'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "dev-hub".frontend_integration_type AS ENUM (
    'MODULE_FEDERATION',
    'IFRAME',
    'EXTERNAL'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1. users
CREATE TABLE IF NOT EXISTS "dev-hub".users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) NOT NULL,
  username varchar(64) NOT NULL,
  password_hash text NOT NULL,
  full_name varchar(120),
  avatar_url text,
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT chk_users_email_normalized CHECK (email = lower(btrim(email))),
  CONSTRAINT chk_users_username_trimmed CHECK (username = btrim(username) AND char_length(username) >= 2)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_active
  ON "dev-hub".users (email)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_username_active
  ON "dev-hub".users (username)
  WHERE deleted_at IS NULL;

-- 2. user_sessions
CREATE TABLE IF NOT EXISTS "dev-hub".user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES "dev-hub".users(id) ON DELETE CASCADE,
  token_hash char(64) NOT NULL,
  ip_address inet,
  user_agent text,
  expires_at timestamptz NOT NULL,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_sessions_token_hash
  ON "dev-hub".user_sessions (token_hash);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id
  ON "dev-hub".user_sessions (user_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at
  ON "dev-hub".user_sessions (expires_at);

-- 3. projects
CREATE TABLE IF NOT EXISTS "dev-hub".projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES "dev-hub".users(id) ON DELETE RESTRICT,
  code varchar(64) NOT NULL,
  name varchar(120) NOT NULL,
  description text,
  icon_url text,
  status "dev-hub".project_status NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_projects_user_code_active
  ON "dev-hub".projects (user_id, code)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_projects_user_status
  ON "dev-hub".projects (user_id, status)
  WHERE deleted_at IS NULL;

-- 4. deployment_platforms
CREATE TABLE IF NOT EXISTS "dev-hub".deployment_platforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(64) NOT NULL UNIQUE,
  name varchar(120) NOT NULL,
  description text,
  website_url text,
  console_url text,
  icon_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. project_backends
CREATE TABLE IF NOT EXISTS "dev-hub".project_backends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES "dev-hub".projects(id) ON DELETE CASCADE,
  deployment_platform_id uuid REFERENCES "dev-hub".deployment_platforms(id) ON DELETE SET NULL,
  name varchar(120) NOT NULL,
  description text,
  repository_url text,
  base_url text,
  health_url text NOT NULL,
  deployment_console_url text,
  health_status "dev-hub".health_status NOT NULL DEFAULT 'UNKNOWN',
  check_interval_seconds integer NOT NULL DEFAULT 60,
  timeout_ms integer NOT NULL DEFAULT 5000,
  last_checked_at timestamptz,
  last_healthy_at timestamptz,
  response_time_ms integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT chk_backend_interval CHECK (check_interval_seconds BETWEEN 10 AND 86400),
  CONSTRAINT chk_backend_timeout CHECK (timeout_ms BETWEEN 500 AND 30000),
  CONSTRAINT chk_backend_response_time CHECK (response_time_ms IS NULL OR response_time_ms >= 0)
);

CREATE INDEX IF NOT EXISTS idx_project_backends_project_id
  ON "dev-hub".project_backends (project_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_project_backends_due_checks
  ON "dev-hub".project_backends (is_active, last_checked_at)
  WHERE deleted_at IS NULL AND is_active = true;

-- 6. backend_health_checks
CREATE TABLE IF NOT EXISTS "dev-hub".backend_health_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  backend_id uuid NOT NULL REFERENCES "dev-hub".project_backends(id) ON DELETE CASCADE,
  status "dev-hub".health_status NOT NULL,
  http_status_code integer,
  response_time_ms integer,
  response_body jsonb,
  error_message text,
  checked_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_backend_health_checks_backend_checked
  ON "dev-hub".backend_health_checks (backend_id, checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_backend_health_checks_checked_at
  ON "dev-hub".backend_health_checks (checked_at);

-- 7. project_frontends
CREATE TABLE IF NOT EXISTS "dev-hub".project_frontends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES "dev-hub".projects(id) ON DELETE CASCADE,
  deployment_platform_id uuid REFERENCES "dev-hub".deployment_platforms(id) ON DELETE SET NULL,
  name varchar(120) NOT NULL,
  slug varchar(80) NOT NULL,
  description text,
  repository_url text,
  application_url text,
  deployment_console_url text,
  integration_type "dev-hub".frontend_integration_type NOT NULL DEFAULT 'MODULE_FEDERATION',
  entry_url text,
  remote_name varchar(120),
  exposed_module varchar(120),
  icon_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT chk_frontend_integration_config CHECK (
    (
      integration_type = 'MODULE_FEDERATION'
      AND entry_url IS NOT NULL
      AND remote_name IS NOT NULL
      AND exposed_module IS NOT NULL
    )
    OR (
      integration_type IN ('IFRAME', 'EXTERNAL')
      AND (application_url IS NOT NULL OR entry_url IS NOT NULL)
    )
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_project_frontends_project_slug_active
  ON "dev-hub".project_frontends (project_id, slug)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_project_frontends_project_sort
  ON "dev-hub".project_frontends (project_id, sort_order)
  WHERE deleted_at IS NULL;

-- 8. ai_providers
CREATE TABLE IF NOT EXISTS "dev-hub".ai_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(64) NOT NULL UNIQUE,
  name varchar(120) NOT NULL,
  website_url text NOT NULL,
  logo_url text,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 9. ai_accounts
CREATE TABLE IF NOT EXISTS "dev-hub".ai_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES "dev-hub".users(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES "dev-hub".ai_providers(id) ON DELETE RESTRICT,
  email varchar(255) NOT NULL,
  note text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_ai_accounts_email_normalized CHECK (email = lower(btrim(email)))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ai_accounts_user_provider_email
  ON "dev-hub".ai_accounts (user_id, provider_id, email);

CREATE INDEX IF NOT EXISTS idx_ai_accounts_user_provider
  ON "dev-hub".ai_accounts (user_id, provider_id);
