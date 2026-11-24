import { NextRequest } from 'next/server';
import { ForbiddenError } from '@/shared/errors/app-error';

export function assertSameOrigin(req: NextRequest): void {
  const origin = req.headers.get('origin');
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');

  if (!origin) {
    // Allow non-browser requests only if no Origin is sent? For state-changing browser APIs, require Origin or Referer.
    const referer = req.headers.get('referer');
    if (!referer || !host) {
      throw new ForbiddenError('Missing request origin');
    }
    const refererHost = new URL(referer).host;
    if (refererHost !== host) {
      throw new ForbiddenError('Invalid request origin');
    }
    return;
  }

  if (!host) {
    throw new ForbiddenError('Missing host header');
  }

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new ForbiddenError('Malformed origin header');
  }

  if (originHost !== host) {
    throw new ForbiddenError('Cross-origin request rejected');
  }
}
