import { redirect } from 'next/navigation';
import { authService } from '@/modules/auth/auth.service';
import { DashboardShell } from '@/shared/components/dashboard-shell';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await authService.getCurrentSession();
  if (!session) {
    redirect('/login');
  }

  return <DashboardShell user={session.user}>{children}</DashboardShell>;
}
