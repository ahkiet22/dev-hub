import { redirect } from 'next/navigation';
import { authService } from '@/modules/auth/auth.service';
import { LoginForm } from '@/modules/auth/components/login-form';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const session = await authService.getCurrentSession();
  if (session) {
    redirect('/overview');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))] px-4">
      <div className="w-full max-w-sm rounded-lg border bg-[hsl(var(--card))] p-6 shadow-sm">
        <div className="mb-6 space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[hsl(var(--primary))] text-xs font-bold text-[hsl(var(--primary-foreground))]">
              DH
            </div>
            <h1 className="text-lg font-semibold tracking-tight">Dev Hub</h1>
          </div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Sign in to your developer workspace.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
