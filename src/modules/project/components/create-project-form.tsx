'use client';

import { useActionState } from 'react';
import { createProjectAction, type ProjectActionState } from '../project.actions';

const initialState: ProjectActionState = { error: null };

export function CreateProjectForm() {
  const [state, formAction, pending] = useActionState(createProjectAction, initialState);

  return (
    <form
      action={formAction}
      className="grid gap-3 rounded-lg border bg-[hsl(var(--card))] p-4 sm:grid-cols-2 lg:grid-cols-5"
    >
      {state.error && (
        <div className="sm:col-span-2 lg:col-span-5 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
          {state.error}
        </div>
      )}
      <input
        name="code"
        required
        placeholder="code (e.g. concert-hub)"
        className="h-9 rounded-md border bg-transparent px-3 font-mono text-xs outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
      />
      <input
        name="name"
        required
        placeholder="Project name"
        className="h-9 rounded-md border bg-transparent px-3 text-xs outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
      />
      <input
        name="description"
        placeholder="Short description (optional)"
        className="h-9 rounded-md border bg-transparent px-3 text-xs outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
      />
      <select
        name="status"
        defaultValue="ACTIVE"
        className="h-9 rounded-md border bg-[hsl(var(--card))] px-3 text-xs outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
      >
        <option value="ACTIVE">ACTIVE</option>
        <option value="INACTIVE">INACTIVE</option>
        <option value="ARCHIVED">ARCHIVED</option>
      </select>
      <button
        type="submit"
        disabled={pending}
        className="h-9 rounded-md bg-[hsl(var(--primary))] px-4 text-xs font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90 disabled:opacity-50"
      >
        {pending ? 'Creating...' : 'Create Project'}
      </button>
    </form>
  );
}
