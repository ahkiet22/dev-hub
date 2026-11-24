'use client';

import { useActionState } from 'react';
import { createPlatformAction, type ActionResult } from '../platform.actions';

const initialState: ActionResult = { error: null };

export function PlatformForm() {
  const [state, formAction, pending] = useActionState(createPlatformAction, initialState);

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
        placeholder="code (e.g. hetzner)"
        className="h-9 rounded-md border bg-transparent px-3 font-mono text-xs outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
      />
      <input
        name="name"
        required
        placeholder="Platform name"
        className="h-9 rounded-md border bg-transparent px-3 text-xs outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
      />
      <input
        name="websiteUrl"
        type="url"
        placeholder="Website URL (optional)"
        className="h-9 rounded-md border bg-transparent px-3 text-xs outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
      />
      <input
        name="consoleUrl"
        type="url"
        placeholder="Console URL (optional)"
        className="h-9 rounded-md border bg-transparent px-3 text-xs outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
      />
      <button
        type="submit"
        disabled={pending}
        className="h-9 rounded-md bg-[hsl(var(--primary))] px-4 text-xs font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90 disabled:opacity-50"
      >
        {pending ? 'Adding...' : 'Add Platform'}
      </button>
    </form>
  );
}
