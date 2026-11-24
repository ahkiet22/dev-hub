import Link from 'next/link';
import { FolderKanban, Search } from 'lucide-react';
import { authService } from '@/modules/auth/auth.service';
import { projectService } from '@/modules/project/project.service';
import type { ProjectStatus } from '@/modules/project/project.types';
import { CreateProjectForm } from '@/modules/project/components/create-project-form';
import { StatusBadge } from '@/shared/components/status-badge';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { user } = await authService.requireSession();
  const params = await searchParams;
  const search = params.q?.trim() || undefined;
  const status =
    params.status && ['ACTIVE', 'INACTIVE', 'ARCHIVED'].includes(params.status)
      ? (params.status as ProjectStatus)
      : undefined;

  const projects = await projectService.listByUser(user.id, { search, status });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Manage your personal software projects, backends, and frontends.
          </p>
        </div>

        <form method="GET" className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
            <input
              name="q"
              defaultValue={search ?? ''}
              placeholder="Search projects..."
              className="h-8 rounded-md border bg-transparent pl-8 pr-3 text-xs outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
            />
          </div>
          <select
            name="status"
            defaultValue={status ?? ''}
            className="h-8 rounded-md border bg-[hsl(var(--card))] px-2.5 text-xs outline-none"
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
          <button
            type="submit"
            className="h-8 rounded-md border px-3 text-xs font-medium hover:bg-[hsl(var(--accent))]"
          >
            Filter
          </button>
        </form>
      </div>

      <CreateProjectForm />

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-[hsl(var(--card))] py-12 text-center">
          <FolderKanban className="h-8 w-8 text-[hsl(var(--muted-foreground))]" />
          <p className="mt-2 text-sm font-medium">No projects found</p>
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            Create your first project above to register backends and frontends.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="group rounded-lg border bg-[hsl(var(--card))] p-4 transition-colors hover:border-[hsl(var(--foreground))]/30"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold group-hover:underline">
                    {p.name}
                  </h2>
                  <p className="font-mono text-xs text-[hsl(var(--muted-foreground))]">
                    {p.code}
                  </p>
                </div>
                <StatusBadge status={p.status} />
              </div>
              {p.description && (
                <p className="mt-2 line-clamp-2 text-xs text-[hsl(var(--muted-foreground))]">
                  {p.description}
                </p>
              )}
              <div className="mt-4 flex items-center gap-4 border-t pt-3 text-xs text-[hsl(var(--muted-foreground))]">
                <span className="tabular-nums">{p.backendCount} Backends</span>
                <span className="tabular-nums">{p.frontendCount} Frontends</span>
                {p.unhealthyBackends > 0 && (
                  <span className="font-mono text-red-500">
                    {p.unhealthyBackends} issue
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
