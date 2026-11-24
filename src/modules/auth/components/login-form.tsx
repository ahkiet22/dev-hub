'use client';

import { useActionState } from 'react';
import { loginAction, type LoginActionState } from '../auth.actions';

const initialState: LoginActionState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div
          role="alert"
          className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500"
        >
          {state.error}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="identifier" className="block text-sm font-medium">
          Email or Username
        </label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          required
          placeholder="admin@devhub.local"
          className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-9 w-full items-center justify-center rounded-md bg-[hsl(var(--primary))] px-4 text-sm font-medium text-[hsl(var(--primary-foreground))] transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}
