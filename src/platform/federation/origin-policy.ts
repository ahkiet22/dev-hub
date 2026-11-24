export function parseAllowedRemoteOrigins(raw: string | undefined): Set<string> {
  if (!raw?.trim()) return new Set();
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((origin) => {
        try {
          return new URL(origin).origin;
        } catch {
          return '';
        }
      })
      .filter(Boolean)
  );
}

export function isTrustedRemoteOrigin(
  targetUrl: string,
  allowedOriginsRaw?: string
): { allowed: boolean; reason?: string } {
  let url: URL;
  try {
    url = new URL(targetUrl);
  } catch {
    return { allowed: false, reason: 'Malformed URL' };
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return { allowed: false, reason: `Unsupported protocol: ${url.protocol}` };
  }

  const isLocalhost =
    url.hostname === 'localhost' || url.hostname === '127.0.0.1';

  if (url.protocol === 'http:' && !isLocalhost) {
    return {
      allowed: false,
      reason: 'Non-localhost remote URLs must use HTTPS',
    };
  }

  const allowlist = parseAllowedRemoteOrigins(allowedOriginsRaw);
  if (allowlist.size > 0 && !allowlist.has(url.origin)) {
    return {
      allowed: false,
      reason: `Origin ${url.origin} is not in ALLOWED_REMOTE_ORIGINS`,
    };
  }

  return { allowed: true };
}
