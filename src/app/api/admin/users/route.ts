import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth/session';
import { canCreateUsers, canManagePermissions } from '@/lib/auth/permissions';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';

// GET /api/admin/users - List all users
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !canManagePermissions(user)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    let query = supabase
      .from('users')
      .select(`
        id,
        username,
        email,
        full_name,
        role,
        is_superadmin,
        company_id,
        permissions,
        is_active,
        last_login,
        created_at,
        companies (
          id,
          name,
          code
        )
      `)
      .order('created_at', { ascending: false });

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data: users, error } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || !canCreateUsers(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      username,
      email,
      password,
      fullName,
      role = 'viewer',
      companyId,
      permissions = {},
    } = body;

    // Validate required fields
    if (!username || !email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Username, email, password, and full name are required' },
        { status: 400 }
      );
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { error: 'Username can only contain letters, numbers, and underscores' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.errors.join(', ') },
        { status: 400 }
      );
    }

    // Validate role
    if (!['admin', 'operator', 'viewer'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be admin, operator, or viewer' },
        { status: 400 }
      );
    }

    // Only superadmin can create admin users
    if (role === 'admin' && !currentUser.isSuperadmin) {
      return NextResponse.json(
        { error: 'Only superadmin can create admin users' },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();

    // Check if username already exists
    const { data: existingUsername } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newUser, error: createError } = await (supabase as any)
      .from('users')
      .insert({
        username,
        email,
        password_hash: passwordHash,
        full_name: fullName,
        role,
        company_id: companyId || null,
        permissions,
        is_superadmin: false,
        is_active: true,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating user:', createError);
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Log the action
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('audit_logs').insert({
      user_id: currentUser.id,
      action: 'create_user',
      resource_type: 'user',
      resource_id: newUser.id,
      details: {
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        fullName: newUser.full_name,
        role: newUser.role,
        companyId: newUser.company_id,
        isActive: newUser.is_active,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/admin/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
