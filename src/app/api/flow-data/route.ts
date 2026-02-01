import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const deviceId = searchParams.get('device_id')
    const startTime = searchParams.get('start_time')
    const endTime = searchParams.get('end_time')
    const limit = parseInt(searchParams.get('limit') || '1000')

    const supabase = createAdminClient()

    // Force fresh query by ordering by id desc (primary key)
    let query = supabase
      .from('flow_data')
      .select('*')
      .order('id', { ascending: false })
      .limit(limit)

    if (deviceId) {
      query = query.eq('device_id', deviceId)
    }

    if (startTime) {
      query = query.gte('created_at', startTime)
    }

    if (endTime) {
      query = query.lte('created_at', endTime)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch flow data', details: error.message },
        { status: 500 }
      )
    }

    const response = NextResponse.json({
      success: true,
      data,
      count: data?.length || 0,
      timestamp: new Date().toISOString(),
    })

    // Prevent any caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response
  } catch (error) {
    console.error('Error in flow-data endpoint:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
