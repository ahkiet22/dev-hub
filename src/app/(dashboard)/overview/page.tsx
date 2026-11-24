import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { authService } from '@/modules/auth/auth.service';
import { dashboardRepository } from '@/modules/dashboard/dashboard.repository';
import { StatusBadge } from '@/shared/components/status-badge';

export const dynamic = 'force-dynamic';

export default async function OverviewPage() {
  const { user } = await authService.requireSession();
  const data = await dashboardRepository.getOverview(user.id);
  const { counts } = data;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Welcome back, {user.fullName || user.username}. All your projects in one workspace.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-[hsl(var(--card))] p-4">
          <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
            Projects
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
            {counts.totalProjects}
          </p>
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            {counts.activeProjects} active
          </p>
        </div>

        <div className="rounded-lg border bg-[hsl(var(--card))] p-4">
          <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
            Backends Health
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
            {counts.healthyBackends}/{counts.totalBackends}
          </p>
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            {counts.degradedBackends} degraded ·{' '}
            {counts.unhealthyBackends + counts.unreachableBackends} down
          </p>
        </div>

        <div className="rounded-lg border bg-[hsl(var(--card))] p-4">
          <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
            Frontend Apps
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
            {counts.totalFrontends}
          </p>
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            Registered applications
          </p>
        </div>

        <div className="rounded-lg border bg-[hsl(var(--card))] p-4">
          <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
            AI Accounts
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
            {counts.totalAiAccounts}
          </p>
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            Across {counts.totalAiProviders} active providers
          </p>
        </div>
      </div>

      {/* Quick Access Applications */}
      {data.quickApps.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Quick Access Applications</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.quickApps.map((app) => (
              <Link
                key={app.id}
                href={`/apps/${app.projectId}/${app.slug}`}
                className="flex items-center justify-between rounded-lg border bg-[hsl(var(--card))] p-3.5 transition-colors hover:border-[hsl(var(--foreground))]/30"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{app.name}</p>
                  <p className="truncate text-xs text-[hsl(var(--muted-foreground))]">
                    {app.projectName}
                  </p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--muted-foreground))]" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Backends & Projects + Platform Distribution */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border bg-[hsl(var(--card))]">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Recently Checked Backends</h2>
            <Link href="/backends" className="text-xs text-[hsl(var(--muted-foreground))] hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y">
            {data.recentBackends.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-[hsl(var(--muted-foreground))]">
                No backends registered yet.
              </p>
            ) : (
              data.recentBackends.map((b) => (
                <Link
                  key={b.id}
                  href={`/backends/${b.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-[hsl(var(--accent))]/40"
                >
                  <div>
                    <p className="text-sm font-medium">{b.name}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {b.projectName}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs tabular-nums text-[hsl(var(--muted-foreground))]">
                      {b.responseTimeMs !== null ? `${b.responseTimeMs}ms` : '—'}
                    </span>
                    <StatusBadge status={b.healthStatus} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border bg-[hsl(var(--card))]">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-sm font-semibold">Recent Projects</h2>
              <Link href="/projects" className="text-xs text-[hsl(var(--muted-foreground))] hover:underline">
                View all
              </Link>
            </div>
            <div className="divide-y">
              {data.recentProjects.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-[hsl(var(--muted-foreground))]">
                  No projects yet.
                </p>
              ) : (
                data.recentProjects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-[hsl(var(--accent))]/40"
                  >
                    <span className="truncate text-sm font-medium">{p.name}</span>
                    <StatusBadge status={p.status} />
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="rounded-lg border bg-[hsl(var(--card))]">
            <div className="border-b px-4 py-3">
              <h2 className="text-sm font-semibold">Platform Distribution</h2>
            </div>
            <div className="divide-y">
              {data.platformDistribution.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-[hsl(var(--muted-foreground))]">
                  No deployed services yet.
                </p>
              ) : (
                data.platformDistribution.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between px-4 py-2.5 text-xs"
                  >
                    <span>{item.name}</span>
                    <span className="font-mono font-medium tabular-nums">
                      {item.count}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
