import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Archive, ArrowLeft, ExternalLink, Trash2 } from 'lucide-react';
import { authService } from '@/modules/auth/auth.service';
import { projectService } from '@/modules/project/project.service';
import {
  archiveProjectAction,
  deleteProjectAction,
} from '@/modules/project/project.actions';
import { backendService } from '@/modules/backend/backend.service';
import {
  deleteBackendAction,
  toggleBackendAction,
} from '@/modules/backend/backend.actions';
import { CreateBackendForm } from '@/modules/backend/components/create-backend-form';
import { frontendService } from '@/modules/frontend/frontend.service';
import {
  deleteFrontendAction,
  toggleFrontendAction,
} from '@/modules/frontend/frontend.actions';
import { CreateFrontendForm } from '@/modules/frontend/components/create-frontend-form';
import { platformService } from '@/modules/deployment-platform/platform.service';
import { StatusBadge } from '@/shared/components/status-badge';
import { NotFoundError } from '@/shared/errors/app-error';

export const dynamic = 'force-dynamic';

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = await authService.requireSession();
  const { id } = await params;

  let project;
  try {
    project = await projectService.getById(user.id, id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  const [backends, frontends, platforms] = await Promise.all([
    backendService.listByProject(user.id, project.id),
    frontendService.listByProject(user.id, project.id),
    platformService.listAll(true),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Link
            href="/projects"
            className="inline-flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          >
            <ArrowLeft className="h-3 w-3" /> Back to Projects
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
            <StatusBadge status={project.status} />
          </div>
          <p className="font-mono text-xs text-[hsl(var(--muted-foreground))]">
            {project.code}
          </p>
          {project.description && (
            <p className="max-w-2xl pt-1 text-sm text-[hsl(var(--muted-foreground))]">
              {project.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {project.status !== 'ARCHIVED' && (
            <form
              action={async () => {
                'use server';
                await archiveProjectAction(project.id);
              }}
            >
              <button
                type="submit"
                className="inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium hover:bg-[hsl(var(--accent))]"
              >
                <Archive className="h-3.5 w-3.5" /> Archive
              </button>
            </form>
          )}
          <form
            action={async () => {
              'use server';
              await deleteProjectAction(project.id);
            }}
          >
            <button
              type="submit"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-red-500/30 px-3 text-xs font-medium text-red-500 hover:bg-red-500/10"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </form>
        </div>
      </div>

      {/* Backends Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            Backends ({backends.length})
          </h2>
        </div>
        <CreateBackendForm projectId={project.id} platforms={platforms} />

        {backends.length > 0 && (
          <div className="overflow-x-auto rounded-lg border bg-[hsl(var(--card))]">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-xs text-[hsl(var(--muted-foreground))]">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Service</th>
                  <th className="px-4 py-2.5 font-medium">Platform</th>
                  <th className="px-4 py-2.5 font-medium">Health</th>
                  <th className="px-4 py-2.5 font-medium">Latency</th>
                  <th className="px-4 py-2.5 text-right font-medium">Actions</th>
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
                    <td className="px-4 py-3 text-xs text-[hsl(var(--muted-foreground))]">
                      {b.platformName ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.healthStatus} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs tabular-nums">
                      {b.responseTimeMs !== null ? `${b.responseTimeMs}ms` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <form
                          action={async () => {
                            'use server';
                            await toggleBackendAction(b.id, project.id, !b.isActive);
                          }}
                        >
                          <button
                            type="submit"
                            className="rounded-md border px-2 py-1 text-xs hover:bg-[hsl(var(--accent))]"
                          >
                            {b.isActive ? 'Disable' : 'Enable'}
                          </button>
                        </form>
                        <form
                          action={async () => {
                            'use server';
                            await deleteBackendAction(b.id, project.id);
                          }}
                        >
                          <button
                            type="submit"
                            className="rounded-md border border-red-500/30 px-2 py-1 text-xs text-red-500 hover:bg-red-500/10"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Frontends Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            Frontends ({frontends.length})
          </h2>
        </div>
        <CreateFrontendForm projectId={project.id} platforms={platforms} />

        {frontends.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {frontends.map((f) => (
              <div
                key={f.id}
                className="flex flex-col justify-between rounded-lg border bg-[hsl(var(--card))] p-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold">{f.name}</h3>
                      <p className="font-mono text-[11px] text-[hsl(var(--muted-foreground))]">
                        {f.slug} · {f.integrationType}
                      </p>
                    </div>
                    <StatusBadge status={f.isActive ? 'ACTIVE' : 'INACTIVE'} />
                  </div>
                  <p className="mt-2 truncate font-mono text-[11px] text-[hsl(var(--muted-foreground))]">
                    {f.entryUrl || f.applicationUrl}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <Link
                    href={`/apps/${project.id}/${f.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
                  >
                    Open App <ExternalLink className="h-3 w-3" />
                  </Link>
                  <div className="flex items-center gap-1.5">
                    <form
                      action={async () => {
                        'use server';
                        await toggleFrontendAction(f.id, project.id, !f.isActive);
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-md border px-2 py-1 text-[11px] hover:bg-[hsl(var(--accent))]"
                      >
                        {f.isActive ? 'Disable' : 'Enable'}
                      </button>
                    </form>
                    <form
                      action={async () => {
                        'use server';
                        await deleteFrontendAction(f.id, project.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-md border border-red-500/30 px-2 py-1 text-[11px] text-red-500 hover:bg-red-500/10"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
