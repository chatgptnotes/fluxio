import { NextResponse } from 'next/server';
import { getSession, refreshSession } from '@/lib/auth/session';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Refresh session to extend expiry
    await refreshSession();

    return NextResponse.json({
      user: {
        id: session.user.id,
        username: session.user.username,
        email: session.user.email,
        fullName: session.user.fullName,
        role: session.user.role,
        isSuperadmin: session.user.isSuperadmin,
        companyId: session.user.companyId,
        permissions: session.user.permissions,
      },
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
