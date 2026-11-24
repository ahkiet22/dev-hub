'use client';

import { useActionState } from 'react';
import {
  changePasswordAction,
  updateProfileAction,
  type SettingsActionState,
} from '../auth-settings.actions';
import type { AuthUser } from '../auth.types';

const initialState: SettingsActionState = { error: null, success: null };

export function ProfileSettingsForms({ user }: { user: AuthUser }) {
  const [profileState, profileAction, profilePending] = useActionState(
    updateProfileAction,
    initialState
  );
  const [passwordState, passwordAction, passwordPending] = useActionState(
    changePasswordAction,
    initialState
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        action={profileAction}
        className="space-y-4 rounded-lg border bg-[hsl(var(--card))] p-5"
      >
        <h2 className="text-sm font-semibold">Profile Information</h2>
        {profileState.error && (
          <p className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
            {profileState.error}
          </p>
        )}
        {profileState.success && (
          <p className="rounded border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-500">
            {profileState.success}
          </p>
        )}
        <div className="space-y-1">
          <label className="text-xs text-[hsl(var(--muted-foreground))]">Email</label>
          <input
            value={user.email}
            disabled
            className="h-9 w-full rounded-md border bg-[hsl(var(--muted))]/40 px-3 font-mono text-xs opacity-75"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-[hsl(var(--muted-foreground))]">Full Name</label>
          <input
            name="fullName"
            defaultValue={user.fullName ?? ''}
            className="h-9 w-full rounded-md border bg-transparent px-3 text-xs outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-[hsl(var(--muted-foreground))]">Avatar URL</label>
          <input
            name="avatarUrl"
            type="url"
            defaultValue={user.avatarUrl ?? ''}
            className="h-9 w-full rounded-md border bg-transparent px-3 font-mono text-xs outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
          />
        </div>
        <button
          type="submit"
          disabled={profilePending}
          className="h-9 rounded-md bg-[hsl(var(--primary))] px-4 text-xs font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90 disabled:opacity-50"
        >
          {profilePending ? 'Saving...' : 'Save Profile'}
        </button>
      </form>

      <form
        action={passwordAction}
        className="space-y-4 rounded-lg border bg-[hsl(var(--card))] p-5"
      >
        <div>
          <h2 className="text-sm font-semibold">Change Password</h2>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Changing your password revokes all active sessions.
          </p>
        </div>
        {passwordState.error && (
          <p className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
            {passwordState.error}
          </p>
        )}
        <div className="space-y-1">
          <label className="text-xs text-[hsl(var(--muted-foreground))]">
            Current Password
          </label>
          <input
            name="currentPassword"
            type="password"
            required
            className="h-9 w-full rounded-md border bg-transparent px-3 text-xs outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-[hsl(var(--muted-foreground))]">
            New Password (min 8 chars)
          </label>
          <input
            name="newPassword"
            type="password"
            minLength={8}
            required
            className="h-9 w-full rounded-md border bg-transparent px-3 text-xs outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
          />
        </div>
        <button
          type="submit"
          disabled={passwordPending}
          className="h-9 rounded-md bg-[hsl(var(--primary))] px-4 text-xs font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90 disabled:opacity-50"
        >
          {passwordPending ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}
