import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/remote/pending - TRB246 polls for next pending command
export async function GET(request: NextRequest) {
  try {
    // API key auth only (TRB246 agent)
    const apiKey = request.headers.get('x-api-key')
    const expectedKey = process.env.API_SECRET_KEY

    if (!apiKey || apiKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid API key' },
        { status: 401 }
      )
    }

    const deviceId = request.nextUrl.searchParams.get('device_id')
    if (!deviceId) {
      return NextResponse.json(
        { error: 'Validation error', message: 'device_id query parameter is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Get the oldest pending command for this device
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: command, error: fetchError } = await (supabase as any)
      .from('remote_commands')
      .select('*')
      .eq('device_id', deviceId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (fetchError) {
      // PGRST116 = no rows found, which is normal
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ command: null })
      }
      console.error('Error fetching pending command:', fetchError)
      return NextResponse.json(
        { error: 'Internal error', message: 'Failed to fetch pending command' },
        { status: 500 }
      )
    }

    // Atomically update status to 'running'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error: updateError } = await (supabase as any)
      .from('remote_commands')
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .eq('id', command.id)
      .eq('status', 'pending') // Only update if still pending (optimistic lock)
      .select()
      .single()

    if (updateError) {
      // Another agent might have claimed it
      if (updateError.code === 'PGRST116') {
        return NextResponse.json({ command: null })
      }
      console.error('Error updating command status:', updateError)
      return NextResponse.json(
        { error: 'Internal error', message: 'Failed to claim command' },
        { status: 500 }
      )
    }

    return NextResponse.json({ command: updated })
  } catch (error) {
    console.error('Error in remote pending endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
