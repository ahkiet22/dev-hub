-- 0002_seed_catalogs.sql
-- Idempotent seed data for shared catalogs: deployment_platforms and ai_providers.

INSERT INTO "dev-hub".deployment_platforms (code, name, description, website_url, console_url)
VALUES
  ('aws', 'AWS', 'Amazon Web Services cloud platform', 'https://aws.amazon.com', 'https://console.aws.amazon.com'),
  ('gcp', 'Google Cloud Platform', 'Google Cloud infrastructure and services', 'https://cloud.google.com', 'https://console.cloud.google.com'),
  ('azure', 'Microsoft Azure', 'Microsoft cloud computing services', 'https://azure.microsoft.com', 'https://portal.azure.com'),
  ('render', 'Render', 'Unified cloud to build and run apps and websites', 'https://render.com', 'https://dashboard.render.com'),
  ('vercel', 'Vercel', 'Frontend cloud and Next.js deployment platform', 'https://vercel.com', 'https://vercel.com/dashboard'),
  ('railway', 'Railway', 'Instant infrastructure and app deployments', 'https://railway.com', 'https://railway.com/dashboard'),
  ('netlify', 'Netlify', 'Web development and edge hosting platform', 'https://www.netlify.com', 'https://app.netlify.com'),
  ('cloudflare', 'Cloudflare', 'Workers, Pages, and edge network platform', 'https://www.cloudflare.com', 'https://dash.cloudflare.com'),
  ('digitalocean', 'DigitalOcean', 'Developer cloud infrastructure and App Platform', 'https://www.digitalocean.com', 'https://cloud.digitalocean.com'),
  ('fly-io', 'Fly.io', 'Global application platform close to users', 'https://fly.io', 'https://fly.io/dashboard'),
  ('on-premises', 'On-premises', 'Self-hosted hardware or private data center', NULL, NULL),
  ('vps', 'VPS', 'Virtual Private Server hosting', NULL, NULL),
  ('local', 'Local Machine', 'Local developer workstation environment', NULL, NULL),
  ('other', 'Other', 'Other hosting or deployment platform', NULL, NULL)
ON CONFLICT (code) DO NOTHING;

INSERT INTO "dev-hub".ai_providers (code, name, website_url, description)
VALUES
  ('openai', 'OpenAI / ChatGPT', 'https://chatgpt.com', 'OpenAI ChatGPT and developer platform'),
  ('anthropic', 'Anthropic / Claude', 'https://claude.ai', 'Anthropic Claude AI assistant'),
  ('google', 'Google / Gemini', 'https://gemini.google.com', 'Google Gemini AI assistant'),
  ('deepseek', 'DeepSeek', 'https://chat.deepseek.com', 'DeepSeek AI chat and models'),
  ('perplexity', 'Perplexity', 'https://www.perplexity.ai', 'Perplexity AI answer engine'),
  ('xai', 'xAI / Grok', 'https://grok.com', 'xAI Grok assistant'),
  ('microsoft', 'Microsoft / Copilot', 'https://copilot.microsoft.com', 'Microsoft Copilot AI assistant')
ON CONFLICT (code) DO NOTHING;
