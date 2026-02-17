import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/session'

// GET /api/remote/history - Fetch command history for a device
export async function GET(request: NextRequest) {
  try {
    // Check session auth (dashboard) or API key auth
    const apiKey = request.headers.get('x-api-key')
    const expectedKey = process.env.API_SECRET_KEY

    if (apiKey && apiKey === expectedKey) {
      // API key auth OK
    } else {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Valid session or API key required' },
          { status: 401 }
        )
      }
      // Only admin/superadmin can view remote command history
      if (user.role !== 'admin' && !user.isSuperadmin) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Admin access required' },
          { status: 403 }
        )
      }
    }

    const { searchParams } = request.nextUrl
    const deviceId = searchParams.get('device_id')
    const limit = Math.min(Math.max(1, Number(searchParams.get('limit')) || 50), 200)
    const offset = Math.max(0, Number(searchParams.get('offset')) || 0)

    if (!deviceId) {
      return NextResponse.json(
        { error: 'Validation error', message: 'device_id query parameter is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error, count } = await (supabase as any)
      .from('remote_commands')
      .select('*', { count: 'exact' })
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching command history:', error)
      return NextResponse.json(
        { error: 'Internal error', message: 'Failed to fetch command history' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      commands: data || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error in remote history endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
