import { NextResponse } from 'next/server';
import { authService } from '@/modules/auth/auth.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await authService.getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ user: session.user });
}
