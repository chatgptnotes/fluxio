import { NextResponse } from 'next/server';
import { destroySession, getSession } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST() {
  try {
    const session = await getSession();

    if (session) {
      const supabase = createAdminClient();

      // Log logout action
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('audit_logs').insert({
        user_id: session.user.id,
        action: 'logout',
        resource_type: 'session',
        details: {
          username: session.user.username,
        },
      });
    }

    await destroySession();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
