'use client';

import React from 'react';
import ReactDOM from 'react-dom';
import {
  init,
  loadRemote,
  registerRemotes,
} from '@module-federation/enhanced/runtime';

let initialized = false;

function ensureHostInitialized() {
  if (initialized) return;
  init({
    name: 'devhub_host',
    remotes: [],
    shared: {
      react: {
        version: React.version,
        lib: () => React,
        shareConfig: {
          singleton: true,
          requiredVersion: `^${React.version.split('.')[0]}.0.0`,
        },
      },
      'react-dom': {
        version: React.version,
        lib: () => ReactDOM,
        shareConfig: {
          singleton: true,
          requiredVersion: `^${React.version.split('.')[0]}.0.0`,
        },
      },
    },
  });
  initialized = true;
}

export async function loadFederatedApp(params: {
  remoteName: string;
  entryUrl: string;
  exposedModule: string;
  timeoutMs?: number;
}): Promise<React.ComponentType<{ basePath?: string }>> {
  ensureHostInitialized();

  const normalizedModule = params.exposedModule.startsWith('./')
    ? params.exposedModule.slice(2)
    : params.exposedModule;

  registerRemotes(
    [
      {
        name: params.remoteName,
        entry: params.entryUrl,
      },
    ],
    { force: true }
  );

  const timeoutMs = params.timeoutMs ?? 10_000;
  const loadPromise = loadRemote<{
    default?: React.ComponentType<{ basePath?: string }>;
  }>(`${params.remoteName}/${normalizedModule}`);

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error(`Remote "${params.remoteName}" timed out after ${timeoutMs}ms`)),
      timeoutMs
    )
  );

  const mod = await Promise.race([loadPromise, timeoutPromise]);
  if (!mod || !mod.default) {
    throw new Error(
      `Remote "${params.remoteName}/${normalizedModule}" did not export a default React component`
    );
  }

  return mod.default;
}
