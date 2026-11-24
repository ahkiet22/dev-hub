import { notFound } from 'next/navigation';
import { authService } from '@/modules/auth/auth.service';
import { frontendService } from '@/modules/frontend/frontend.service';
import { DynamicRemoteHost } from '@/modules/frontend/components/dynamic-remote-host';
import { isTrustedRemoteOrigin } from '@/platform/federation/origin-policy';
import { NotFoundError } from '@/shared/errors/app-error';

export const dynamic = 'force-dynamic';

export default async function EmbeddedAppPage({
  params,
}: {
  params: Promise<{ projectId: string; slug: string }>;
}) {
  const { user } = await authService.requireSession();
  const { projectId, slug } = await params;

  let frontend;
  try {
    frontend = await frontendService.getByProjectAndSlug(user.id, projectId, slug);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  const targetUrl =
    frontend.integrationType === 'MODULE_FEDERATION'
      ? frontend.entryUrl
      : frontend.applicationUrl || frontend.entryUrl;

  const originCheck = targetUrl
    ? isTrustedRemoteOrigin(targetUrl, process.env.ALLOWED_REMOTE_ORIGINS)
    : { allowed: false, reason: 'Missing target URL' };

  return (
    <div className="mx-auto max-w-7xl">
      <DynamicRemoteHost
        projectId={frontend.projectId}
        slug={frontend.slug}
        name={frontend.name}
        integrationType={frontend.integrationType}
        applicationUrl={frontend.applicationUrl}
        entryUrl={frontend.entryUrl}
        remoteName={frontend.remoteName}
        exposedModule={frontend.exposedModule}
        originAllowed={originCheck.allowed}
        originReason={originCheck.reason}
      />
    </div>
  );
}
