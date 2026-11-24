import { redirect } from 'next/navigation';
import { authService } from '@/modules/auth/auth.service';

export const dynamic = 'force-dynamic';

export default async function RootPage() {
  const session = await authService.getCurrentSession();
  if (session) {
    redirect('/overview');
  }
  redirect('/login');
}
