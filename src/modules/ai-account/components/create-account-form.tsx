'use client';

import { useActionState } from 'react';
import type { AiProvider } from '@/modules/ai-provider/ai-provider.types';
import { createAiAccountAction, type AccountActionState } from '../ai-account.actions';

const initialState: AccountActionState = { error: null };

export function CreateAccountForm({ providers }: { providers: AiProvider[] }) {
  const [state, formAction, pending] = useActionState(createAiAccountAction, initialState);

  return (
    <form
      action={formAction}
      className="grid gap-3 rounded-lg border bg-[hsl(var(--card))] p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {state.error && (
        <div className="sm:col-span-2 lg:col-span-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
          {state.error}
        </div>
      )}
      <select
        name="providerId"
        required
        defaultValue=""
        className="h-9 rounded-md border bg-[hsl(var(--card))] px-3 text-xs outline-none"
      >
        <option value="" disabled>
          Select AI Provider...
        </option>
        {providers.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <input
        name="email"
        type="email"
        required
        placeholder="Registered email address"
        className="h-9 rounded-md border bg-transparent px-3 font-mono text-xs outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
      />
      <input
        name="note"
        placeholder="Note (e.g. Pro plan, Personal)"
        className="h-9 rounded-md border bg-transparent px-3 text-xs outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
      />
      <button
        type="submit"
        disabled={pending}
        className="h-9 rounded-md bg-[hsl(var(--primary))] px-4 text-xs font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90 disabled:opacity-50"
      >
        {pending ? 'Adding...' : 'Register Account'}
      </button>
    </form>
  );
}
