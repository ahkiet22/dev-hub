import { describe, expect, it } from 'vitest';
import { createProjectSchema } from '@/modules/project/project.validation';
import { createBackendSchema } from '@/modules/backend/backend.validation';
import { createFrontendSchema } from '@/modules/frontend/frontend.validation';

const VALID_UUID = '11111111-1111-4111-8111-111111111111';

describe('Phase 2 domain validation schemas', () => {
  it('validates project code formatting and normalizes to lowercase', () => {
    const ok = createProjectSchema.safeParse({
      code: 'Concert-Hub',
      name: 'Concert Hub',
    });
    expect(ok.success).toBe(true);
    if (ok.success) expect(ok.data.code).toBe('concert-hub');

    const bad = createProjectSchema.safeParse({
      code: 'invalid code!',
      name: 'Test',
    });
    expect(bad.success).toBe(false);
  });

  it('rejects non-HTTP/HTTPS healthUrl and out-of-range intervals', () => {
    const badProtocol = createBackendSchema.safeParse({
      projectId: VALID_UUID,
      name: 'API',
      healthUrl: 'ftp://example.com/health',
    });
    expect(badProtocol.success).toBe(false);

    const badInterval = createBackendSchema.safeParse({
      projectId: VALID_UUID,
      name: 'API',
      healthUrl: 'https://example.com/health',
      checkIntervalSeconds: 2,
    });
    expect(badInterval.success).toBe(false);
  });

  it('enforces integrationType-specific fields on frontends', () => {
    const mfMissing = createFrontendSchema.safeParse({
      projectId: VALID_UUID,
      name: 'Admin',
      slug: 'admin',
      integrationType: 'MODULE_FEDERATION',
    });
    expect(mfMissing.success).toBe(false);

    const mfValid = createFrontendSchema.safeParse({
      projectId: VALID_UUID,
      name: 'Admin',
      slug: 'admin',
      integrationType: 'MODULE_FEDERATION',
      entryUrl: 'https://admin.example.com/mf-manifest.json',
      remoteName: 'adminApp',
      exposedModule: './App',
    });
    expect(mfValid.success).toBe(true);

    const iframeValid = createFrontendSchema.safeParse({
      projectId: VALID_UUID,
      name: 'Docs',
      slug: 'docs',
      integrationType: 'IFRAME',
      applicationUrl: 'https://docs.example.com',
    });
    expect(iframeValid.success).toBe(true);
  });
});
