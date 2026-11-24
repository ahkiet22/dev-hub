import Link from 'next/link';
import { Activity } from 'lucide-react';
import { authService } from '@/modules/auth/auth.service';
import { backendService } from '@/modules/backend/backend.service';
import { StatusBadge } from '@/shared/components/status-badge';

export const dynamic = 'force-dynamic';

export default async function BackendsPage() {
  const { user } = await authService.requireSession();
  const backends = await backendService.listByUser(user.id);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Backends</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          All registered backend services and their latest health status.
        </p>
      </div>

      {backends.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-[hsl(var(--card))] py-12 text-center">
          <Activity className="h-8 w-8 text-[hsl(var(--muted-foreground))]" />
          <p className="mt-2 text-sm font-medium">No backends registered</p>
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            Open a project to register your first backend service.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-[hsl(var(--card))]">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-xs text-[hsl(var(--muted-foreground))]">
              <tr>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Platform</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Response</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {backends.map((b) => (
                <tr key={b.id} className="hover:bg-[hsl(var(--accent))]/40">
                  <td className="px-4 py-3">
                    <Link
                      href={`/backends/${b.id}`}
                      className="font-medium hover:underline"
                    >
                      {b.name}
                    </Link>
                    <p className="font-mono text-[11px] text-[hsl(var(--muted-foreground))]">
                      {b.healthUrl}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <Link
                      href={`/projects/${b.projectId}`}
                      className="text-[hsl(var(--muted-foreground))] hover:underline"
                    >
                      {b.projectName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs text-[hsl(var(--muted-foreground))]">
                    {b.platformName ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={b.healthStatus} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs tabular-nums">
                    {b.responseTimeMs !== null ? `${b.responseTimeMs}ms` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
