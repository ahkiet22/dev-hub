-- 0001_init_schema.down.sql
-- Rollback initial Dev Hub schema inside "dev-hub".

DROP TABLE IF EXISTS "dev-hub".ai_accounts;
DROP TABLE IF EXISTS "dev-hub".ai_providers;
DROP TABLE IF EXISTS "dev-hub".project_frontends;
DROP TABLE IF EXISTS "dev-hub".backend_health_checks;
DROP TABLE IF EXISTS "dev-hub".project_backends;
DROP TABLE IF EXISTS "dev-hub".deployment_platforms;
DROP TABLE IF EXISTS "dev-hub".projects;
DROP TABLE IF EXISTS "dev-hub".user_sessions;
DROP TABLE IF EXISTS "dev-hub".users;

DROP TYPE IF EXISTS "dev-hub".frontend_integration_type;
DROP TYPE IF EXISTS "dev-hub".health_status;
DROP TYPE IF EXISTS "dev-hub".project_status;
