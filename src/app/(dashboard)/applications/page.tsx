import Link from 'next/link';
import { AppWindow, ExternalLink } from 'lucide-react';
import { authService } from '@/modules/auth/auth.service';
import { frontendService } from '@/modules/frontend/frontend.service';
import { StatusBadge } from '@/shared/components/status-badge';

export const dynamic = 'force-dynamic';

export default async function ApplicationsPage() {
  const { user } = await authService.requireSession();
  const frontends = await frontendService.listByUser(user.id);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Applications</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Launch or embed registered frontend applications.
        </p>
      </div>

      {frontends.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-[hsl(var(--card))] py-12 text-center">
          <AppWindow className="h-8 w-8 text-[hsl(var(--muted-foreground))]" />
          <p className="mt-2 text-sm font-medium">No applications registered</p>
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            Open a project to register a frontend application.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {frontends.map((f) => (
            <Link
              key={f.id}
              href={`/apps/${f.projectId}/${f.slug}`}
              className="group flex flex-col justify-between rounded-lg border bg-[hsl(var(--card))] p-4 transition-colors hover:border-[hsl(var(--foreground))]/30"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-semibold group-hover:underline">
                      {f.name}
                    </h2>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {f.projectName}
                    </p>
                  </div>
                  <StatusBadge status={f.isActive ? 'ACTIVE' : 'INACTIVE'} />
                </div>
                <p className="mt-2 font-mono text-[11px] text-[hsl(var(--muted-foreground))]">
                  {f.integrationType} · {f.platformName ?? 'Unassigned'}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs font-medium">
                <span>Launch Workspace</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
