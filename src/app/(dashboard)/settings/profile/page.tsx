import Link from 'next/link';
import { authService } from '@/modules/auth/auth.service';
import { ProfileSettingsForms } from '@/modules/auth/components/profile-settings-forms';

export const dynamic = 'force-dynamic';

export default async function ProfileSettingsPage() {
  const { user } = await authService.requireSession();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Manage your profile, password, sessions, and deployment platforms.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Link
            href="/settings/sessions"
            className="rounded-md border px-3 py-1.5 hover:bg-[hsl(var(--accent))]"
          >
            Active Sessions
          </Link>
          <Link
            href="/settings/platforms"
            className="rounded-md border px-3 py-1.5 hover:bg-[hsl(var(--accent))]"
          >
            Platforms
          </Link>
        </div>
      </div>

      <ProfileSettingsForms user={user} />
    </div>
  );
}
