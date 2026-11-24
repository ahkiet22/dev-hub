-- 0002_seed_catalogs.down.sql
-- Rollback seeded deployment_platforms and ai_providers catalogs.

DELETE FROM "dev-hub".deployment_platforms
WHERE code IN (
  'aws', 'gcp', 'azure', 'render', 'vercel', 'railway', 'netlify',
  'cloudflare', 'digitalocean', 'fly-io', 'on-premises', 'vps', 'local', 'other'
);

DELETE FROM "dev-hub".ai_providers
WHERE code IN (
  'openai', 'anthropic', 'google', 'deepseek', 'perplexity', 'xai', 'microsoft'
);
