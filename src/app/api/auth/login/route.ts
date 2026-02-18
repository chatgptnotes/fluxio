import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyPassword, hashPassword, SUPERADMIN_PASSWORD_HASH } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Find user by username or email (without checking is_active first)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let { data: user, error: userError } = await (supabase as any)
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    // If not found by username, try email
    if (userError || !user) {
      const { data: userByEmail, error: emailError } = await supabase
        .from('users')
        .select('*')
        .eq('email', username.toLowerCase())
        .single();

      if (!emailError && userByEmail) {
        user = userByEmail;
        userError = null;
      }
    }

    if (userError || !user) {
      console.log(`Failed login attempt for username: ${username} - user not found`);
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userData = user as any;

    // Check if user account is pending verification
    if (!userData.is_active) {
      console.log(`Login attempt for inactive account: ${username}`);
      return NextResponse.json(
        {
          error: 'Your account is pending verification. Please wait for superadmin approval before logging in.',
          code: 'PENDING_VERIFICATION'
        },
        { status: 403 }
      );
    }

    // Check if user has a password hash set
    let isValidPassword = false;

    if (userData.password_hash) {
      // Verify against stored hash
      isValidPassword = await verifyPassword(password, userData.password_hash);
    } else if (userData.is_superadmin && userData.username === 'buzzlightyear_42') {
      // For superadmin without password hash, check against known password
      // and set the hash for future logins
      isValidPassword = await verifyPassword(password, SUPERADMIN_PASSWORD_HASH);

      if (isValidPassword) {
        // Store the hash for future logins
        const newHash = await hashPassword(password);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('users')
          .update({ password_hash: newHash })
          .eq('id', userData.id);
      }
    }

    if (!isValidPassword) {
      console.log(`Failed login attempt for username: ${username} - invalid password`);
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Create session
    const session = await createSession(userData.id);

    if (!session) {
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    // Log successful login
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('audit_logs').insert({
      user_id: userData.id,
      action: 'login',
      resource_type: 'session',
      details: {
        username: userData.username,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: session.user.id,
        username: session.user.username,
        email: session.user.email,
        fullName: session.user.fullName,
        role: session.user.role,
        isSuperadmin: session.user.isSuperadmin,
        companyId: userData.company_id || null,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
