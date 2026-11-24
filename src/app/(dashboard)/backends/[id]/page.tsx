import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink, Play } from 'lucide-react';
import { authService } from '@/modules/auth/auth.service';
import { backendService } from '@/modules/backend/backend.service';
import { toggleBackendAction } from '@/modules/backend/backend.actions';
import { healthService } from '@/modules/health/health.service';
import { runManualHealthCheckAction } from '@/modules/health/health.actions';
import { ResponseTimeChart } from '@/modules/health/components/response-time-chart';
import { StatusBadge } from '@/shared/components/status-badge';
import { NotFoundError } from '@/shared/errors/app-error';

export const dynamic = 'force-dynamic';

export default async function BackendDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = await authService.requireSession();
  const { id } = await params;

  let backend;
  try {
    backend = await backendService.getById(user.id, id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  const history = await healthService.getHistory(user.id, backend.id, 40);
  const latest = history[0] ?? null;
  const chartData = [...history]
    .reverse()
    .filter((h) => h.responseTimeMs !== null)
    .map((h) => ({
      time: new Date(h.checkedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      ms: h.responseTimeMs ?? 0,
      status: h.status,
    }));

  const dependencyChecks = latest?.responseBody?.checks
    ? Object.entries(latest.responseBody.checks)
    : [];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Link
            href={`/projects/${backend.projectId}`}
            className="inline-flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          >
            <ArrowLeft className="h-3 w-3" /> {backend.projectName ?? 'Back to Project'}
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{backend.name}</h1>
            <StatusBadge status={backend.healthStatus} />
          </div>
          <p className="font-mono text-xs text-[hsl(var(--muted-foreground))]">
            {backend.healthUrl}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <form
            action={async () => {
              'use server';
              await runManualHealthCheckAction(backend.id);
            }}
          >
            <button
              type="submit"
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[hsl(var(--primary))] px-3 text-xs font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90"
            >
              <Play className="h-3 w-3" /> Check Now
            </button>
          </form>
          <form
            action={async () => {
              'use server';
              await toggleBackendAction(backend.id, backend.projectId, !backend.isActive);
            }}
          >
            <button
              type="submit"
              className="h-8 rounded-md border px-3 text-xs font-medium hover:bg-[hsl(var(--accent))]"
            >
              {backend.isActive ? 'Pause Monitoring' : 'Resume Monitoring'}
            </button>
          </form>
        </div>
      </div>

      {/* Metadata Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-[hsl(var(--card))] p-4">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Platform</p>
          <p className="mt-1 text-sm font-medium">{backend.platformName ?? 'Unassigned'}</p>
        </div>
        <div className="rounded-lg border bg-[hsl(var(--card))] p-4">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Latest Latency</p>
          <p className="mt-1 font-mono text-sm font-medium tabular-nums">
            {backend.responseTimeMs !== null ? `${backend.responseTimeMs} ms` : '—'}
          </p>
        </div>
        <div className="rounded-lg border bg-[hsl(var(--card))] p-4">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Version</p>
          <p className="mt-1 font-mono text-sm font-medium">
            {latest?.responseBody?.version ?? '—'}
          </p>
        </div>
        <div className="rounded-lg border bg-[hsl(var(--card))] p-4">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Links</p>
          <div className="mt-1 flex items-center gap-3 text-xs">
            {backend.repositoryUrl && (
              <a
                href={backend.repositoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:underline"
              >
                Repo <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {backend.deploymentConsoleUrl && (
              <a
                href={backend.deploymentConsoleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:underline"
              >
                Console <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {!backend.repositoryUrl && !backend.deploymentConsoleUrl && '—'}
          </div>
        </div>
      </div>

      {/* Response Time Chart */}
      <div className="rounded-lg border bg-[hsl(var(--card))] p-4">
        <h2 className="mb-3 text-sm font-semibold">Response Time Trend</h2>
        <ResponseTimeChart data={chartData} />
      </div>

      {/* Dependency Checks */}
      {dependencyChecks.length > 0 && (
        <div className="rounded-lg border bg-[hsl(var(--card))] p-4">
          <h2 className="mb-3 text-sm font-semibold">Dependency Health</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {dependencyChecks.map(([dep, info]) => (
              <div key={dep} className="flex items-center justify-between rounded-md border p-3">
                <span className="font-mono text-xs font-medium">{dep}</span>
                <StatusBadge status={info.status.toUpperCase()} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Health Check History */}
      <div className="overflow-x-auto rounded-lg border bg-[hsl(var(--card))]">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Recent Health Checks</h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="border-b text-xs text-[hsl(var(--muted-foreground))]">
            <tr>
              <th className="px-4 py-2.5 font-medium">Checked At</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">HTTP</th>
              <th className="px-4 py-2.5 font-medium">Latency</th>
              <th className="px-4 py-2.5 font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {history.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-xs text-[hsl(var(--muted-foreground))]"
                >
                  No health checks recorded yet.
                </td>
              </tr>
            ) : (
              history.map((h) => (
                <tr key={h.id} className="hover:bg-[hsl(var(--accent))]/40">
                  <td className="px-4 py-2.5 font-mono text-xs tabular-nums">
                    {new Date(h.checkedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={h.status} />
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs">
                    {h.httpStatusCode ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs tabular-nums">
                    {h.responseTimeMs !== null ? `${h.responseTimeMs}ms` : '—'}
                  </td>
                  <td className="max-w-xs truncate px-4 py-2.5 font-mono text-xs text-[hsl(var(--muted-foreground))]">
                    {h.errorMessage ?? h.responseBody?.service ?? 'OK'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
