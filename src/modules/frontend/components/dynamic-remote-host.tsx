'use client';

import dynamic from 'next/dynamic';
import type { RemoteAppShellProps } from './remote-app-shell';

const RemoteAppShellNoSsr = dynamic(
  () => import('./remote-app-shell').then((m) => m.RemoteAppShell),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-3 rounded-lg border bg-[hsl(var(--card))] p-6">
        <div className="h-5 w-40 animate-pulse rounded bg-[hsl(var(--muted))]" />
        <div className="h-40 w-full animate-pulse rounded bg-[hsl(var(--muted))]" />
      </div>
    ),
  }
);

export function DynamicRemoteHost(props: RemoteAppShellProps) {
  return <RemoteAppShellNoSsr {...props} />;
}
