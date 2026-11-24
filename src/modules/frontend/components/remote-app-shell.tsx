'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Maximize2, Minimize2, RefreshCw, ShieldAlert } from 'lucide-react';
import { loadFederatedApp } from '@/platform/federation/mf-runtime';
import type { FrontendIntegrationType } from '../frontend.types';
import { RemoteErrorBoundary } from './remote-error-boundary';

export interface RemoteAppShellProps {
  projectId: string;
  slug: string;
  name: string;
  integrationType: FrontendIntegrationType;
  applicationUrl: string | null;
  entryUrl: string | null;
  remoteName: string | null;
  exposedModule: string | null;
  originAllowed: boolean;
  originReason?: string;
}

export function RemoteAppShell(props: RemoteAppShellProps) {
  const [RemoteComp, setRemoteComp] = useState<React.ComponentType<{
    basePath?: string;
  }> | null>(null);
  const [loading, setLoading] = useState(
    props.integrationType === 'MODULE_FEDERATION' && props.originAllowed
  );
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const load = useCallback(async () => {
    if (props.integrationType !== 'MODULE_FEDERATION' || !props.originAllowed) {
      return;
    }
    if (!props.remoteName || !props.entryUrl || !props.exposedModule) {
      setError('Incomplete Module Federation configuration.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const comp = await loadFederatedApp({
        remoteName: props.remoteName,
        entryUrl: props.entryUrl,
        exposedModule: props.exposedModule,
        timeoutMs: 10_000,
      });
      setRemoteComp(() => comp);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load remote module');
      setRemoteComp(null);
    } finally {
      setLoading(false);
    }
  }, [
    props.integrationType,
    props.originAllowed,
    props.remoteName,
    props.entryUrl,
    props.exposedModule,
  ]);

  useEffect(() => {
    void load();
  }, [load, attempt]);

  const standaloneUrl = props.applicationUrl || props.entryUrl;

  return (
    <div
      className={
        fullscreen
          ? 'fixed inset-0 z-50 flex flex-col bg-[hsl(var(--background))] p-4'
          : 'flex flex-col space-y-4'
      }
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-[hsl(var(--card))] px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <h1 className="text-sm font-semibold">{props.name}</h1>
          <span className="rounded border px-1.5 py-0.5 font-mono text-[10px] text-[hsl(var(--muted-foreground))]">
            {props.integrationType}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {props.integrationType === 'MODULE_FEDERATION' && (
            <button
              type="button"
              onClick={() => setAttempt((a) => a + 1)}
              className="inline-flex h-7 items-center gap-1 rounded border px-2.5 text-xs hover:bg-[hsl(var(--accent))]"
            >
              <RefreshCw className="h-3 w-3" /> Reload
            </button>
          )}
          <button
            type="button"
            onClick={() => setFullscreen((f) => !f)}
            className="inline-flex h-7 items-center gap-1 rounded border px-2.5 text-xs hover:bg-[hsl(var(--accent))]"
          >
            {fullscreen ? (
              <>
                <Minimize2 className="h-3 w-3" /> Exit Fullscreen
              </>
            ) : (
              <>
                <Maximize2 className="h-3 w-3" /> Fullscreen
              </>
            )}
          </button>
          {standaloneUrl && (
            <a
              href={standaloneUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-7 items-center gap-1 rounded border px-2.5 text-xs hover:bg-[hsl(var(--accent))]"
            >
              Open Standalone <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      {/* Content */}
      {!props.originAllowed ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/5 p-8 text-center">
          <ShieldAlert className="h-8 w-8 text-amber-500" />
          <h2 className="mt-2 text-sm font-semibold">Untrusted Remote Origin</h2>
          <p className="mt-1 font-mono text-xs text-[hsl(var(--muted-foreground))]">
            {props.originReason ?? 'Origin is not permitted by ALLOWED_REMOTE_ORIGINS.'}
          </p>
        </div>
      ) : props.integrationType === 'EXTERNAL' ? (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-[hsl(var(--card))] p-10 text-center">
          <p className="text-sm font-medium">{props.name} is configured as an external app.</p>
          {standaloneUrl && (
            <a
              href={standaloneUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--primary))] px-4 py-2 text-xs font-medium text-[hsl(var(--primary-foreground))]"
            >
              Open Application <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      ) : props.integrationType === 'IFRAME' ? (
        <div className="flex-1 overflow-hidden rounded-lg border bg-[hsl(var(--card))]">
          <iframe
            src={standaloneUrl ?? undefined}
            title={props.name}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            referrerPolicy="no-referrer"
            className={fullscreen ? 'h-full w-full' : 'h-[75vh] w-full'}
          />
        </div>
      ) : loading ? (
        <div className="space-y-3 rounded-lg border bg-[hsl(var(--card))] p-6">
          <div className="h-5 w-48 animate-pulse rounded bg-[hsl(var(--muted))]" />
          <div className="h-40 w-full animate-pulse rounded bg-[hsl(var(--muted))]" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-red-500/30 bg-red-500/5 p-8 text-center">
          <p className="text-sm font-semibold text-red-500">Failed to load remote</p>
          <p className="mt-1 max-w-lg font-mono text-xs text-[hsl(var(--muted-foreground))]">
            {error}
          </p>
          <button
            type="button"
            onClick={() => setAttempt((a) => a + 1)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--primary))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--primary-foreground))]"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      ) : RemoteComp ? (
        <RemoteErrorBoundary
          appName={props.name}
          onRetry={() => setAttempt((a) => a + 1)}
        >
          <div className="devhub-remote-scope rounded-lg border bg-[hsl(var(--card))] p-4">
            <RemoteComp basePath={`/apps/${props.projectId}/${props.slug}`} />
          </div>
        </RemoteErrorBoundary>
      ) : null}
    </div>
  );
}
