import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { hashPassword } from '@/lib/auth/password';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, password, username } = body;

    // Validation
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Full name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check if email already exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingUser } = await (supabase as any)
      .from('users')
      .select('id, is_active')
      .eq('email', email)
      .single();

    if (existingUser) {
      if (!existingUser.is_active) {
        return NextResponse.json(
          { error: 'An account with this email is pending verification. Please wait for superadmin approval.' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Check if username already exists (if provided)
    if (username) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingUsername } = await (supabase as any)
        .from('users')
        .select('id')
        .eq('username', username)
        .single();

      if (existingUsername) {
        return NextResponse.json(
          { error: 'This username is already taken' },
          { status: 400 }
        );
      }
    }

    // Hash the password
    const passwordHash = await hashPassword(password);

    // Generate a username from email if not provided
    const generatedUsername = username || email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_');

    // Create the user with is_active = false (pending verification)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newUser, error: insertError } = await (supabase as any)
      .from('users')
      .insert({
        email: email.toLowerCase(),
        username: generatedUsername,
        full_name: fullName,
        password_hash: passwordHash,
        role: 'viewer', // Default role for new users
        is_superadmin: false,
        is_active: false, // Requires superadmin verification
        permissions: { view: true }, // Basic view permission
      })
      .select('id, email, username, full_name')
      .single();

    if (insertError) {
      console.error('Error creating user:', insertError);

      if (insertError.message?.includes('duplicate')) {
        return NextResponse.json(
          { error: 'An account with this email or username already exists' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create account. Please try again.' },
        { status: 500 }
      );
    }

    // Log the registration
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('audit_logs').insert({
      user_id: newUser.id,
      action: 'register',
      resource_type: 'user',
      details: {
        email: newUser.email,
        username: newUser.username,
        status: 'pending_verification',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully. Please wait for superadmin verification before you can log in.',
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        fullName: newUser.full_name,
        status: 'pending_verification',
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
