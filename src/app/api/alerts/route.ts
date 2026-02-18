import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const deviceId = searchParams.get('device_id')
    const isResolved = searchParams.get('is_resolved')
    const limit = parseInt(searchParams.get('limit') || '100')

    const supabase = createAdminClient()

    let query = supabase
      .from('alerts')
      .select('*, devices(device_name, location)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (deviceId) {
      query = query.eq('device_id', deviceId)
    }

    if (isResolved !== null) {
      query = query.eq('is_resolved', isResolved === 'true')
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch alerts', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      count: data?.length || 0,
    })
  } catch (error) {
    console.error('Error in alerts endpoint:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { alert_id, is_resolved, resolved_by } = body

    if (!alert_id) {
      return NextResponse.json(
        { error: 'alert_id is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const updateData: Record<string, boolean | string | null> = {}

    if (typeof is_resolved === 'boolean') {
      updateData.is_resolved = is_resolved
      updateData.resolved_at = is_resolved ? new Date().toISOString() : null
      updateData.resolved_by = is_resolved ? resolved_by : null
    }

    const { data, error } = await supabase
      .from('alerts')
      .update(updateData as never)
      .eq('id', alert_id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update alert', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Error updating alert:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
