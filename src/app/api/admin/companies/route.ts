import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canManagePermissions } from '@/lib/auth/permissions';

// GET /api/admin/companies - List all companies
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || !canManagePermissions(user)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const supabase = createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: companies, error } = await (supabase as any)
      .from('companies')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching companies:', error);
      return NextResponse.json(
        { error: 'Failed to fetch companies' },
        { status: 500 }
      );
    }

    return NextResponse.json({ companies });
  } catch (error) {
    console.error('Error in GET /api/admin/companies:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/companies - Create a new company
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.isSuperadmin) {
      return NextResponse.json(
        { error: 'Only superadmin can create companies' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, code, description } = body;

    if (!name || !code) {
      return NextResponse.json(
        { error: 'Name and code are required' },
        { status: 400 }
      );
    }

    // Validate code format (uppercase alphanumeric)
    if (!/^[A-Z0-9_]+$/.test(code)) {
      return NextResponse.json(
        { error: 'Code must be uppercase alphanumeric with underscores only' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Check if code already exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from('companies')
      .select('id')
      .eq('code', code)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Company code already exists' },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: company, error } = await (supabase as any)
      .from('companies')
      .insert({
        name,
        code,
        description,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating company:', error);
      return NextResponse.json(
        { error: 'Failed to create company' },
        { status: 500 }
      );
    }

    // Log the action
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('audit_logs').insert({
      user_id: user.id,
      action: 'create_company',
      resource_type: 'company',
      resource_id: company.id,
      details: {
        name: company.name,
        code: company.code,
      },
    });

    return NextResponse.json({ success: true, company });
  } catch (error) {
    console.error('Error in POST /api/admin/companies:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
