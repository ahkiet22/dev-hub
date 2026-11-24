import 'server-only';
import dns from 'node:dns/promises';
import net from 'node:net';

const MAX_RESPONSE_BYTES = 65_536; // 64 KB

function ipv4ToInt(ip: string): number {
  const parts = ip.split('.').map(Number);
  return (
    (((parts[0] ?? 0) << 24) |
      ((parts[1] ?? 0) << 16) |
      ((parts[2] ?? 0) << 8) |
      (parts[3] ?? 0)) >>>
    0
  );
}

function isIpInCidrV4(ip: string, cidrBase: string, prefix: number): boolean {
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(cidrBase) & mask);
}

export function isPrivateOrReservedIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    return (
      isIpInCidrV4(ip, '0.0.0.0', 8) ||
      isIpInCidrV4(ip, '10.0.0.0', 8) ||
      isIpInCidrV4(ip, '100.64.0.0', 10) ||
      isIpInCidrV4(ip, '127.0.0.0', 8) ||
      isIpInCidrV4(ip, '169.254.0.0', 16) ||
      isIpInCidrV4(ip, '172.16.0.0', 12) ||
      isIpInCidrV4(ip, '192.168.0.0', 16)
    );
  }

  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    if (normalized === '::1' || normalized === '::') return true;
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
    if (normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb')) {
      return true;
    }
    if (normalized.startsWith('::ffff:')) {
      const mapped = normalized.slice('::ffff:'.length);
      if (net.isIPv4(mapped)) return isPrivateOrReservedIp(mapped);
    }
  }

  return false;
}

function isTrustedTarget(hostname: string, ip: string): boolean {
  const raw = process.env.TRUSTED_PRIVATE_NETWORKS ?? '';
  if (!raw.trim()) return false;
  const entries = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  for (const entry of entries) {
    if (entry === hostname.toLowerCase() || entry === ip.toLowerCase()) {
      return true;
    }
    if (entry.includes('/') && net.isIPv4(ip)) {
      const [base, bitsStr] = entry.split('/');
      const bits = Number(bitsStr);
      if (base && net.isIPv4(base) && Number.isInteger(bits) && bits >= 0 && bits <= 32) {
        if (isIpInCidrV4(ip, base, bits)) return true;
      }
    }
  }
  return false;
}

export async function validateSsrfTarget(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('Invalid health URL');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`Disallowed protocol: ${url.protocol}`);
  }

  const hostname = url.hostname;
  if (!hostname) {
    throw new Error('Missing hostname');
  }

  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname) && !isTrustedTarget(hostname, hostname)) {
      throw new Error('Blocked private or reserved IP address');
    }
    return url;
  }

  const records = await dns.lookup(hostname, { all: true });
  if (records.length === 0) {
    throw new Error('DNS resolution returned no addresses');
  }

  for (const rec of records) {
    if (isPrivateOrReservedIp(rec.address) && !isTrustedTarget(hostname, rec.address)) {
      throw new Error('Blocked private or reserved IP address');
    }
  }

  return url;
}

export interface SsrfFetchResult {
  httpStatus: number;
  bodyText: string;
  durationMs: number;
}

export async function ssrfSafeGet(
  rawUrl: string,
  timeoutMs: number
): Promise<SsrfFetchResult> {
  const url = await validateSsrfTarget(rawUrl);
  const start = performance.now();

  const response = await fetch(url.toString(), {
    method: 'GET',
    redirect: 'manual',
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      Accept: 'application/json',
      'User-Agent': 'DevHub-HealthMonitor/1.0',
    },
  });

  if (response.status >= 300 && response.status < 400) {
    throw new Error(`Redirects are not allowed (HTTP ${response.status})`);
  }

  const reader = response.body?.getReader();
  let received = 0;
  const chunks: Uint8Array[] = [];

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        received += value.byteLength;
        if (received > MAX_RESPONSE_BYTES) {
          await reader.cancel();
          throw new Error('Health response exceeded 64 KB size limit');
        }
        chunks.push(value);
      }
    }
  }

  const durationMs = Math.max(0, Math.round(performance.now() - start));
  const merged = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  const bodyText = new TextDecoder().decode(merged);
  return {
    httpStatus: response.status,
    bodyText,
    durationMs,
  };
}
