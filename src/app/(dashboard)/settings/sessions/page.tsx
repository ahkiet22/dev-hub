import Link from 'next/link';
import { authService } from '@/modules/auth/auth.service';
import {
  logoutAllSessionsAction,
  revokeSessionAction,
} from '@/modules/auth/auth-settings.actions';

export const dynamic = 'force-dynamic';

export default async function SessionsSettingsPage() {
  const { user, session: current } = await authService.requireSession();
  const sessions = await authService.listActiveSessions(user.id);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Active Sessions</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Revoke individual device sessions or sign out everywhere.{' '}
            <Link href="/settings/profile" className="underline">
              Back to Profile
            </Link>
          </p>
        </div>

        <form action={logoutAllSessionsAction}>
          <button
            type="submit"
            className="h-8 rounded-md border border-red-500/30 px-3 text-xs font-medium text-red-500 hover:bg-red-500/10"
          >
            Sign Out All Sessions
          </button>
        </form>
      </div>

      <div className="divide-y rounded-lg border bg-[hsl(var(--card))]">
        {sessions.map((s) => {
          const isCurrent = s.id === current.id;
          return (
            <div
              key={s.id}
              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-medium">
                    {s.ipAddress ?? 'Unknown IP'}
                  </span>
                  {isCurrent && (
                    <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] text-emerald-500">
                      CURRENT
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-[hsl(var(--muted-foreground))]">
                  {s.userAgent ?? 'Unknown User-Agent'}
                </p>
                <p className="font-mono text-[11px] text-[hsl(var(--muted-foreground))]">
                  Expires: {new Date(s.expiresAt).toLocaleString()}
                </p>
              </div>

              {!isCurrent && (
                <form
                  action={async () => {
                    'use server';
                    await revokeSessionAction(s.id);
                  }}
                >
                  <button
                    type="submit"
                    className="h-7 rounded border border-red-500/30 px-2.5 text-xs text-red-500 hover:bg-red-500/10"
                  >
                    Revoke
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
