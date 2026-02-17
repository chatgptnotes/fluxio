import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/session'

// Commands that are blocked for safety
const BLOCKED_PATTERNS = [
  /\brm\s+(-[a-zA-Z]*f[a-zA-Z]*\s+)?\/\s*$/,  // rm -rf /
  /\brm\s+-[a-zA-Z]*r[a-zA-Z]*\s+-[a-zA-Z]*f[a-zA-Z]*\s+\/\s*$/,
  /\bsysupgrade\b/,
  /\bmkfs\b/,
  /\bfirstboot\b/,
  /\bdd\s+.*of=\/dev\//,
  /\bpasswd\b/,
  /\breboot\b.*-f/,
  />\s*\/dev\/sd/,
  /\bcurl\b.*\|\s*(sh|bash)/,
  /\bwget\b.*\|\s*(sh|bash)/,
  /\bopkg\s+remove\b/,
]

const MAX_TIMEOUT_SECS = 120
const MAX_PENDING_PER_DEVICE = 5

function isCommandBlocked(command: string): boolean {
  return BLOCKED_PATTERNS.some(pattern => pattern.test(command))
}

// POST /api/remote/command - Submit a command for execution on a device
export async function POST(request: NextRequest) {
  try {
    // Check session auth (dashboard) or API key auth
    const apiKey = request.headers.get('x-api-key')
    const expectedKey = process.env.API_SECRET_KEY
    let submittedBy = 'api'

    if (apiKey && apiKey === expectedKey) {
      submittedBy = 'api-key'
    } else {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Valid session or API key required' },
          { status: 401 }
        )
      }
      // Only admin/superadmin can submit commands
      if (user.role !== 'admin' && !user.isSuperadmin) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Admin access required' },
          { status: 403 }
        )
      }
      submittedBy = user.username || user.email
    }

    const body = await request.json()
    const { device_id, command, timeout_secs } = body

    // Validate required fields
    if (!device_id || typeof device_id !== 'string') {
      return NextResponse.json(
        { error: 'Validation error', message: 'device_id is required' },
        { status: 400 }
      )
    }

    if (!command || typeof command !== 'string' || command.trim().length === 0) {
      return NextResponse.json(
        { error: 'Validation error', message: 'command is required' },
        { status: 400 }
      )
    }

    // Check command blocklist
    if (isCommandBlocked(command.trim())) {
      return NextResponse.json(
        { error: 'Blocked', message: 'This command is blocked for safety reasons' },
        { status: 403 }
      )
    }

    // Validate timeout
    const resolvedTimeout = Math.min(
      Math.max(1, Number(timeout_secs) || 30),
      MAX_TIMEOUT_SECS
    )

    const supabase = createAdminClient()

    // Rate limit: max pending commands per device
    const { count, error: countError } = await supabase
      .from('remote_commands')
      .select('*', { count: 'exact', head: true })
      .eq('device_id', device_id)
      .eq('status', 'pending')

    if (countError) {
      console.error('Error checking pending count:', countError)
      return NextResponse.json(
        { error: 'Internal error', message: 'Failed to check rate limit' },
        { status: 500 }
      )
    }

    if ((count ?? 0) >= MAX_PENDING_PER_DEVICE) {
      return NextResponse.json(
        { error: 'Rate limited', message: `Maximum ${MAX_PENDING_PER_DEVICE} pending commands per device` },
        { status: 429 }
      )
    }

    // Insert the command
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
      .from('remote_commands')
      .insert({
        device_id: device_id.trim(),
        command: command.trim(),
        submitted_by: submittedBy,
        timeout_secs: resolvedTimeout,
        metadata: {
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
        },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      .select()
      .single()

    if (error) {
      console.error('Error inserting command:', error)
      return NextResponse.json(
        { error: 'Internal error', message: 'Failed to submit command' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      command: data,
    })
  } catch (error) {
    console.error('Error in remote command endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
