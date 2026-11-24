import { describe, expect, it } from 'vitest';
import { isTrustedRemoteOrigin } from '@/platform/federation/origin-policy';

describe('Microfrontend origin policy', () => {
  it('allows HTTPS origins and localhost HTTP in dev', () => {
    expect(isTrustedRemoteOrigin('https://app.example.com/mf-manifest.json').allowed).toBe(true);
    expect(isTrustedRemoteOrigin('http://localhost:3001/mf-manifest.json').allowed).toBe(true);
  });

  it('blocks non-localhost HTTP and non-HTTP protocols', () => {
    expect(isTrustedRemoteOrigin('http://evil.example.com/mf-manifest.json').allowed).toBe(false);
    expect(isTrustedRemoteOrigin('javascript:alert(1)').allowed).toBe(false);
  });

  it('enforces ALLOWED_REMOTE_ORIGINS when configured', () => {
    const allowed = 'https://trusted.example.com,http://localhost:3001';
    expect(isTrustedRemoteOrigin('https://trusted.example.com/mf-manifest.json', allowed).allowed).toBe(true);
    expect(isTrustedRemoteOrigin('https://other.example.com/mf-manifest.json', allowed).allowed).toBe(false);
  });
});
