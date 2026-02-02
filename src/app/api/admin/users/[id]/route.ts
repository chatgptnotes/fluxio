import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canManagePermissions } from '@/lib/auth/permissions';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';

// GET /api/admin/users/[id] - Get a single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    const { id } = await params;

    if (!currentUser || !canManagePermissions(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const supabase = createClient();

    const { data: user, error } = await supabase
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
        updated_at,
        companies (
          id,
          name,
          code
        )
      `)
      .eq('id', id)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's pipeline access
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pipelineAccess } = await (supabase as any)
      .from('user_pipeline_access')
      .select('pipeline_id, permissions')
      .eq('user_id', id);

    return NextResponse.json({
      user: {
        ...(user as object),
        pipelineAccess: pipelineAccess || [],
      },
    });
  } catch (error) {
    console.error('Error in GET /api/admin/users/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users/[id] - Update a user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    const { id } = await params;

    if (!currentUser || !canManagePermissions(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      email,
      password,
      fullName,
      role,
      companyId,
      permissions,
      isActive,
    } = body;

    const supabase = createClient();

    // Get existing user
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Cannot modify superadmin unless you are superadmin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((existingUser as any).is_superadmin && !currentUser.isSuperadmin) {
      return NextResponse.json(
        { error: 'Cannot modify superadmin account' },
        { status: 403 }
      );
    }

    // Cannot change own admin status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (currentUser.id === id && role && role !== (existingUser as any).role) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      );
    }

    // Build update object
    const updates: Record<string, unknown> = {};

    if (email !== undefined) {
      // Check if email is taken by another user
      const { data: emailUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .neq('id', id)
        .single();

      if (emailUser) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        );
      }
      updates.email = email;
    }

    if (password !== undefined) {
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.valid) {
        return NextResponse.json(
          { error: passwordValidation.errors.join(', ') },
          { status: 400 }
        );
      }
      updates.password_hash = await hashPassword(password);
    }

    if (fullName !== undefined) {
      updates.full_name = fullName;
    }

    if (role !== undefined) {
      if (!['admin', 'operator', 'viewer'].includes(role)) {
        return NextResponse.json(
          { error: 'Invalid role' },
          { status: 400 }
        );
      }
      // Only superadmin can set admin role
      if (role === 'admin' && !currentUser.isSuperadmin) {
        return NextResponse.json(
          { error: 'Only superadmin can assign admin role' },
          { status: 403 }
        );
      }
      updates.role = role;
    }

    if (companyId !== undefined) {
      updates.company_id = companyId;
    }

    if (permissions !== undefined) {
      updates.permissions = permissions;
    }

    if (isActive !== undefined) {
      // Cannot deactivate yourself
      if (currentUser.id === id && !isActive) {
        return NextResponse.json(
          { error: 'Cannot deactivate your own account' },
          { status: 400 }
        );
      }
      updates.is_active = isActive;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedUser, error: updateError } = await (supabase as any)
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    // Log the action
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('audit_logs').insert({
      user_id: currentUser.id,
      action: 'update_user',
      resource_type: 'user',
      resource_id: id,
      details: {
        updatedFields: Object.keys(updates),
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        fullName: updatedUser.full_name,
        role: updatedUser.role,
        companyId: updatedUser.company_id,
        isActive: updatedUser.is_active,
      },
    });
  } catch (error) {
    console.error('Error in PATCH /api/admin/users/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete a user (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    const { id } = await params;

    if (!currentUser || !currentUser.isSuperadmin) {
      return NextResponse.json(
        { error: 'Only superadmin can delete users' },
        { status: 403 }
      );
    }

    // Cannot delete yourself
    if (currentUser.id === id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Check if user exists
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('username, is_superadmin')
      .eq('id', id)
      .single();

    if (fetchError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Cannot delete superadmin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((user as any).is_superadmin) {
      return NextResponse.json(
        { error: 'Cannot delete superadmin account' },
        { status: 403 }
      );
    }

    // Soft delete - just deactivate
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase as any)
      .from('users')
      .update({ is_active: false })
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      );
    }

    // Delete all sessions for this user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('user_sessions').delete().eq('user_id', id);

    // Log the action
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('audit_logs').insert({
      user_id: currentUser.id,
      action: 'delete_user',
      resource_type: 'user',
      resource_id: id,
      details: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        username: (user as any).username,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/users/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
