// Company Settings API
// GET/PATCH company settings (including daily report configuration)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/auth/session'
import { CompanySettings } from '@/types/database'

// Create admin client with service role key for bypassing RLS
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/admin/companies/[id]/settings - Get company settings
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: companyId } = await context.params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only superadmin or company admin can view settings
    if (!user.isSuperadmin && user.companyId !== companyId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const supabase = createAdminClient()

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    const { data: company, error } = await supabase
      .from('companies')
      .select('id, name, code, settings')
      .eq('id', companyId)
      .single()

    if (error) {
      console.error('Error fetching company settings:', error)
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const companyData = company as any

    // Return settings with defaults
    const settings: CompanySettings = {
      dailyReportEnabled: false,
      reportRecipients: 'operators',
      ...(companyData.settings || {}),
    }

    return NextResponse.json({
      companyId: companyData.id,
      companyName: companyData.name,
      companyCode: companyData.code,
      settings,
    })
  } catch (error) {
    console.error('Error in GET /api/admin/companies/[id]/settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/companies/[id]/settings - Update company settings
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: companyId } = await context.params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only superadmin can update company settings
    if (!user.isSuperadmin) {
      return NextResponse.json(
        { error: 'Only superadmin can update company settings' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { dailyReportEnabled, reportRecipients } = body

    // Validate reportRecipients if provided
    if (reportRecipients && !['operators', 'admins', 'all'].includes(reportRecipients)) {
      return NextResponse.json(
        { error: 'Invalid reportRecipients value. Must be: operators, admins, or all' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    // Get current settings
    const { data: current, error: fetchError } = await supabase
      .from('companies')
      .select('settings')
      .eq('id', companyId)
      .single()

    if (fetchError) {
      console.error('Error fetching current settings:', fetchError)
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Merge with existing settings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentSettings: CompanySettings = (current as any).settings || {}
    const newSettings: CompanySettings = {
      ...currentSettings,
      ...(dailyReportEnabled !== undefined && { dailyReportEnabled }),
      ...(reportRecipients && { reportRecipients }),
    }

    // Update settings
    const { data: updated, error: updateError } = await supabase
      .from('companies')
      .update({ settings: newSettings })
      .eq('id', companyId)
      .select('id, name, code, settings')
      .single()

    if (updateError) {
      console.error('Error updating company settings:', updateError)
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      )
    }

    // Log the action
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'update_company_settings',
      resource_type: 'company',
      resource_id: companyId,
      details: {
        previousSettings: currentSettings,
        newSettings,
      },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedCompany = updated as any

    return NextResponse.json({
      success: true,
      companyId: updatedCompany.id,
      companyName: updatedCompany.name,
      settings: updatedCompany.settings,
    })
  } catch (error) {
    console.error('Error in PATCH /api/admin/companies/[id]/settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
