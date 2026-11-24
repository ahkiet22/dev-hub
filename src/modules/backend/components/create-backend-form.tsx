'use client';

import { useActionState } from 'react';
import type { DeploymentPlatform } from '@/modules/deployment-platform/platform.types';
import { createBackendAction, type BackendActionState } from '../backend.actions';

const initialState: BackendActionState = { error: null };

export function CreateBackendForm({
  projectId,
  platforms,
}: {
  projectId: string;
  platforms: DeploymentPlatform[];
}) {
  const boundAction = createBackendAction.bind(null, projectId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form
      action={formAction}
      className="grid gap-3 rounded-lg border bg-[hsl(var(--card))] p-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {state.error && (
        <div className="sm:col-span-2 lg:col-span-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
          {state.error}
        </div>
      )}
      <input
        name="name"
        required
        placeholder="Backend name (e.g. Ticket API)"
        className="h-9 rounded-md border bg-transparent px-3 text-xs outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
      />
      <input
        name="healthUrl"
        type="url"
        required
        placeholder="Health URL (https://api.example.com/health)"
        className="h-9 rounded-md border bg-transparent px-3 font-mono text-xs outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
      />
      <select
        name="deploymentPlatformId"
        defaultValue=""
        className="h-9 rounded-md border bg-[hsl(var(--card))] px-3 text-xs outline-none"
      >
        <option value="">Platform (optional)</option>
        {platforms.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <input
        name="baseUrl"
        type="url"
        placeholder="Base API URL (optional)"
        className="h-9 rounded-md border bg-transparent px-3 font-mono text-xs outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
      />
      <input
        name="repositoryUrl"
        type="url"
        placeholder="Repository URL (optional)"
        className="h-9 rounded-md border bg-transparent px-3 font-mono text-xs outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
      />
      <div className="flex items-center gap-2">
        <input
          name="checkIntervalSeconds"
          type="number"
          min={10}
          max={86400}
          defaultValue={60}
          title="Check interval (seconds)"
          className="h-9 w-24 rounded-md border bg-transparent px-2.5 font-mono text-xs outline-none"
        />
        <input
          name="timeoutMs"
          type="number"
          min={500}
          max={30000}
          defaultValue={5000}
          title="Timeout (ms)"
          className="h-9 w-24 rounded-md border bg-transparent px-2.5 font-mono text-xs outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-9 flex-1 rounded-md bg-[hsl(var(--primary))] px-3 text-xs font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90 disabled:opacity-50"
        >
          {pending ? 'Adding...' : 'Add Backend'}
        </button>
      </div>
    </form>
  );
}
