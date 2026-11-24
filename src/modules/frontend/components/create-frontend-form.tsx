'use client';

import { useActionState, useState } from 'react';
import type { DeploymentPlatform } from '@/modules/deployment-platform/platform.types';
import { createFrontendAction, type FrontendActionState } from '../frontend.actions';
import type { FrontendIntegrationType } from '../frontend.types';

const initialState: FrontendActionState = { error: null };

export function CreateFrontendForm({
  projectId,
  platforms,
}: {
  projectId: string;
  platforms: DeploymentPlatform[];
}) {
  const boundAction = createFrontendAction.bind(null, projectId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const [integrationType, setIntegrationType] =
    useState<FrontendIntegrationType>('MODULE_FEDERATION');

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
        placeholder="Frontend name (e.g. Ticket Admin)"
        className="h-9 rounded-md border bg-transparent px-3 text-xs outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
      />
      <input
        name="slug"
        required
        placeholder="slug (e.g. ticket-admin)"
        className="h-9 rounded-md border bg-transparent px-3 font-mono text-xs outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
      />
      <select
        name="integrationType"
        value={integrationType}
        onChange={(e) => setIntegrationType(e.target.value as FrontendIntegrationType)}
        className="h-9 rounded-md border bg-[hsl(var(--card))] px-3 text-xs outline-none"
      >
        <option value="MODULE_FEDERATION">MODULE_FEDERATION</option>
        <option value="IFRAME">IFRAME</option>
        <option value="EXTERNAL">EXTERNAL</option>
      </select>

      {integrationType === 'MODULE_FEDERATION' ? (
        <>
          <input
            name="entryUrl"
            type="url"
            required
            placeholder="Entry URL (https://app.example.com/mf-manifest.json)"
            className="h-9 rounded-md border bg-transparent px-3 font-mono text-xs outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
          />
          <input
            name="remoteName"
            required
            placeholder="Remote Name (e.g. ticketAdmin)"
            className="h-9 rounded-md border bg-transparent px-3 font-mono text-xs outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
          />
          <input
            name="exposedModule"
            required
            defaultValue="./App"
            placeholder="Exposed Module (./App)"
            className="h-9 rounded-md border bg-transparent px-3 font-mono text-xs outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
          />
        </>
      ) : (
        <input
          name="applicationUrl"
          type="url"
          required
          placeholder="Application URL (https://app.example.com)"
          className="sm:col-span-2 h-9 rounded-md border bg-transparent px-3 font-mono text-xs outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
        />
      )}

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
        name="repositoryUrl"
        type="url"
        placeholder="Repository URL (optional)"
        className="h-9 rounded-md border bg-transparent px-3 font-mono text-xs outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
      />
      <button
        type="submit"
        disabled={pending}
        className="h-9 rounded-md bg-[hsl(var(--primary))] px-4 text-xs font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90 disabled:opacity-50"
      >
        {pending ? 'Adding...' : 'Add Frontend'}
      </button>
    </form>
  );
}
