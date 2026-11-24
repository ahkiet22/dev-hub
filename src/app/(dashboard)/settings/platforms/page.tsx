import { ExternalLink } from 'lucide-react';
import { authService } from '@/modules/auth/auth.service';
import { platformService } from '@/modules/deployment-platform/platform.service';
import { togglePlatformAction } from '@/modules/deployment-platform/platform.actions';
import { PlatformForm } from '@/modules/deployment-platform/components/platform-form';
import { StatusBadge } from '@/shared/components/status-badge';

export const dynamic = 'force-dynamic';

export default async function DeploymentPlatformsPage() {
  await authService.requireSession();
  const platforms = await platformService.listAll(false);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Deployment Platforms</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Shared catalog of hosting platforms for backends and frontends.
        </p>
      </div>

      <PlatformForm />

      <div className="overflow-x-auto rounded-lg border bg-[hsl(var(--card))]">
        <table className="w-full text-left text-sm">
          <thead className="border-b text-xs text-[hsl(var(--muted-foreground))]">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Links</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {platforms.map((p) => (
              <tr key={p.id} className="hover:bg-[hsl(var(--accent))]/40">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-[hsl(var(--muted-foreground))]">
                  {p.code}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 text-xs">
                    {p.websiteUrl && (
                      <a
                        href={p.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                      >
                        Website <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {p.consoleUrl && (
                      <a
                        href={p.consoleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                      >
                        Console <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.isActive ? 'ACTIVE' : 'INACTIVE'} />
                </td>
                <td className="px-4 py-3 text-right">
                  <form
                    action={async () => {
                      'use server';
                      await togglePlatformAction(p.id, !p.isActive);
                    }}
                  >
                    <button
                      type="submit"
                      className="rounded-md border px-2.5 py-1 text-xs hover:bg-[hsl(var(--accent))]"
                    >
                      {p.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
