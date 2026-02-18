import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth/session';
import { canManagePermissions } from '@/lib/auth/permissions';

// GET /api/admin/users/[id]/permissions - Get user's pipeline permissions
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

    const supabase = createAdminClient();

    // Get user's pipeline access
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pipelineAccess, error } = await (supabase as any)
      .from('user_pipeline_access')
      .select('*')
      .eq('user_id', id);

    if (error) {
      console.error('Error fetching permissions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch permissions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ pipelineAccess: pipelineAccess || [] });
  } catch (error) {
    console.error('Error in GET /api/admin/users/[id]/permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id]/permissions - Set user's pipeline permissions
export async function PUT(
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
    const { pipelines } = body;

    if (!Array.isArray(pipelines)) {
      return NextResponse.json(
        { error: 'pipelines must be an array' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, is_superadmin')
      .eq('id', id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Cannot modify superadmin permissions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((user as any).is_superadmin) {
      return NextResponse.json(
        { error: 'Cannot modify superadmin permissions' },
        { status: 403 }
      );
    }

    // Delete existing permissions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase as any)
      .from('user_pipeline_access')
      .delete()
      .eq('user_id', id);

    if (deleteError) {
      console.error('Error deleting existing permissions:', deleteError);
      return NextResponse.json(
        { error: `Failed to clear existing permissions: ${deleteError.message}` },
        { status: 500 }
      );
    }

    // Insert new permissions
    if (pipelines.length > 0) {
      const accessRecords = pipelines.map((p: { pipelineId: string; permissions: Record<string, boolean> }) => ({
        user_id: id,
        pipeline_id: p.pipelineId,
        permissions: {
          view: p.permissions?.view ?? true,
          reports: p.permissions?.reports ?? false,
          alarmAcknowledge: p.permissions?.alarmAcknowledge ?? false,
          edit: p.permissions?.edit ?? false,
        },
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase as any)
        .from('user_pipeline_access')
        .insert(accessRecords);

      if (insertError) {
        console.error('Error inserting permissions:', insertError);
        return NextResponse.json(
          { error: `Failed to save permissions: ${insertError.message}` },
          { status: 500 }
        );
      }
    }

    // Log the action
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('audit_logs').insert({
      user_id: currentUser.id,
      action: 'update_user_permissions',
      resource_type: 'user',
      resource_id: id,
      details: {
        pipelineCount: pipelines.length,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/admin/users/[id]/permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users/[id]/permissions - Add pipeline permission
export async function POST(
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
    const { pipelineId, permissions } = body;

    if (!pipelineId) {
      return NextResponse.json(
        { error: 'pipelineId is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify user exists and is not superadmin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, is_superadmin')
      .eq('id', id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((user as any).is_superadmin) {
      return NextResponse.json(
        { error: 'Cannot modify superadmin permissions' },
        { status: 403 }
      );
    }

    // Upsert permission
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: upsertError } = await (supabase as any)
      .from('user_pipeline_access')
      .upsert({
        user_id: id,
        pipeline_id: pipelineId,
        permissions: {
          view: permissions?.view ?? true,
          reports: permissions?.reports ?? false,
          alarmAcknowledge: permissions?.alarmAcknowledge ?? false,
          edit: permissions?.edit ?? false,
        },
      }, {
        onConflict: 'user_id,pipeline_id',
      });

    if (upsertError) {
      console.error('Error upserting permission:', upsertError);
      return NextResponse.json(
        { error: 'Failed to add permission' },
        { status: 500 }
      );
    }

    // Log the action
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('audit_logs').insert({
      user_id: currentUser.id,
      action: 'add_pipeline_permission',
      resource_type: 'user',
      resource_id: id,
      details: {
        pipelineId,
        permissions,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/admin/users/[id]/permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id]/permissions - Remove pipeline permission
export async function DELETE(
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

    const { searchParams } = new URL(request.url);
    const pipelineId = searchParams.get('pipelineId');

    if (!pipelineId) {
      return NextResponse.json(
        { error: 'pipelineId is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase as any)
      .from('user_pipeline_access')
      .delete()
      .eq('user_id', id)
      .eq('pipeline_id', pipelineId);

    if (deleteError) {
      console.error('Error deleting permission:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove permission' },
        { status: 500 }
      );
    }

    // Log the action
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('audit_logs').insert({
      user_id: currentUser.id,
      action: 'remove_pipeline_permission',
      resource_type: 'user',
      resource_id: id,
      details: {
        pipelineId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/users/[id]/permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
