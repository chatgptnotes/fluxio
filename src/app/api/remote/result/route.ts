import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const MAX_OUTPUT_BYTES = 10240 // 10KB max output

// POST /api/remote/result - TRB246 posts command execution result
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { command_id, exit_code, output, error_message } = body

    if (!command_id || typeof command_id !== 'string') {
      return NextResponse.json(
        { error: 'Validation error', message: 'command_id is required' },
        { status: 400 }
      )
    }

    if (typeof exit_code !== 'number') {
      return NextResponse.json(
        { error: 'Validation error', message: 'exit_code (number) is required' },
        { status: 400 }
      )
    }

    // Truncate output to 10KB
    let truncatedOutput = typeof output === 'string' ? output : ''
    if (truncatedOutput.length > MAX_OUTPUT_BYTES) {
      truncatedOutput = truncatedOutput.substring(0, MAX_OUTPUT_BYTES) + '\n... [output truncated at 10KB]'
    }

    const status = exit_code === 0 ? 'completed' : 'failed'

    const supabase = createAdminClient()

    // Update the command with results
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('remote_commands')
      .update({
        status,
        exit_code,
        output: truncatedOutput,
        error_message: error_message || null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', command_id)
      .in('status', ['running', 'pending']) // Only update if still running or pending
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Not found', message: 'Command not found or already completed' },
          { status: 404 }
        )
      }
      console.error('Error updating command result:', error)
      return NextResponse.json(
        { error: 'Internal error', message: 'Failed to update command result' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      command: data,
    })
  } catch (error) {
    console.error('Error in remote result endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
