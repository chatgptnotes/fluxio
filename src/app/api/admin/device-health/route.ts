// Device Health API
// GET device uptime/downtime history, polling session analysis for superadmin

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { cstpsPipes } from '@/lib/cstps-data'

interface PollingSession {
  start: string
  end: string
  durationMinutes: number
  dataPoints: number
  gapBeforeMinutes: number | null
}

interface DeviceHealth {
  deviceId: string
  deviceName: string
  pipeNumber: number
  location: string
  firstSeen: string | null
  lastSeen: string | null
  totalDataPoints: number
  sessions: PollingSession[]
  sessionCount: number
  uptimeMinutes: number
  downtimeMinutes: number
  uptimePercentage: number
  currentStatus: 'online' | 'offline'
  currentDurationMinutes: number
}

interface HealthSummary {
  totalDevices: number
  onlineCount: number
  offlineCount: number
  averageUptimePercentage: number
}

const SESSION_GAP_MINUTES = 5

function detectSessions(timestamps: string[]): PollingSession[] {
  if (timestamps.length === 0) return []

  const sessions: PollingSession[] = []
  let sessionStart = timestamps[0]
  let sessionEnd = timestamps[0]
  let sessionPoints = 1

  for (let i = 1; i < timestamps.length; i++) {
    const prev = new Date(timestamps[i - 1]).getTime()
    const curr = new Date(timestamps[i]).getTime()
    const gapMinutes = (curr - prev) / (1000 * 60)

    if (gapMinutes <= SESSION_GAP_MINUTES) {
      sessionEnd = timestamps[i]
      sessionPoints++
    } else {
      const sStart = new Date(sessionStart).getTime()
      const sEnd = new Date(sessionEnd).getTime()
      const dur = Math.max((sEnd - sStart) / (1000 * 60), 1)
      const gb =
        sessions.length > 0
          ? (sStart - new Date(sessions[sessions.length - 1].end).getTime()) / (1000 * 60)
          : null

      sessions.push({
        start: sessionStart,
        end: sessionEnd,
        durationMinutes: Math.round(dur * 10) / 10,
        dataPoints: sessionPoints,
        gapBeforeMinutes: gb !== null ? Math.round(gb * 10) / 10 : null,
      })

      sessionStart = timestamps[i]
      sessionEnd = timestamps[i]
      sessionPoints = 1
    }
  }

  // Push the last session
  const sStart = new Date(sessionStart).getTime()
  const sEnd = new Date(sessionEnd).getTime()
  const dur = Math.max((sEnd - sStart) / (1000 * 60), 1)
  const gb =
    sessions.length > 0
      ? (sStart - new Date(sessions[sessions.length - 1].end).getTime()) / (1000 * 60)
      : null

  sessions.push({
    start: sessionStart,
    end: sessionEnd,
    durationMinutes: Math.round(dur * 10) / 10,
    dataPoints: sessionPoints,
    gapBeforeMinutes: gb !== null ? Math.round(gb * 10) / 10 : null,
  })

  return sessions
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.isSuperadmin) {
      return NextResponse.json(
        { error: 'Only superadmin can view device health' },
        { status: 403 }
      )
    }

    const supabase = createAdminClient()

    const { searchParams } = new URL(request.url)
    const deviceIdFilter = searchParams.get('device_id')
    const days = Math.min(Math.max(parseInt(searchParams.get('days') || '7', 10) || 1, 1), 90)

    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    const now = new Date()
    const totalWindowMinutes = days * 24 * 60

    // Query flow_data for the time window
    let query = supabase
      .from('flow_data')
      .select('device_id, created_at')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: true })

    if (deviceIdFilter) {
      query = query.eq('device_id', deviceIdFilter)
    }

    const { data: flowData, error } = await query

    if (error) {
      console.error('Error fetching flow_data:', error)
      return NextResponse.json(
        { error: 'Failed to fetch device data' },
        { status: 500 }
      )
    }

    // Group timestamps by device_id
    const deviceTimestamps = new Map<string, string[]>()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of (flowData || []) as any[]) {
      const did = row.device_id as string
      if (!deviceTimestamps.has(did)) {
        deviceTimestamps.set(did, [])
      }
      deviceTimestamps.get(did)!.push(row.created_at as string)
    }

    // Build health data for each known device
    const devices: DeviceHealth[] = cstpsPipes.map((pipe) => {
      const timestamps = deviceTimestamps.get(pipe.deviceId) || []
      const totalDataPoints = timestamps.length

      if (totalDataPoints === 0) {
        return {
          deviceId: pipe.deviceId,
          deviceName: pipe.deviceName,
          pipeNumber: pipe.pipeNumber,
          location: pipe.location,
          firstSeen: null,
          lastSeen: null,
          totalDataPoints: 0,
          sessions: [],
          sessionCount: 0,
          uptimeMinutes: 0,
          downtimeMinutes: totalWindowMinutes,
          uptimePercentage: 0,
          currentStatus: 'offline' as const,
          currentDurationMinutes: totalWindowMinutes,
        }
      }

      // Detect polling sessions
      const sessions = detectSessions(timestamps)

      // Calculate uptime (sum of session durations)
      const uptimeMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0)
      const downtimeMinutes = Math.max(totalWindowMinutes - uptimeMinutes, 0)
      const uptimePercentage = Math.min(
        Math.round((uptimeMinutes / totalWindowMinutes) * 1000) / 10,
        100
      )

      // Current status: online if last data point within 5 minutes
      const lastTimestamp = new Date(timestamps[timestamps.length - 1])
      const minutesSinceLastData = (now.getTime() - lastTimestamp.getTime()) / (1000 * 60)
      const currentStatus = minutesSinceLastData <= SESSION_GAP_MINUTES ? 'online' : 'offline'

      // Current duration: how long in current state
      let currentDurationMinutes: number
      if (currentStatus === 'online') {
        // Online since last session start
        const lastSession = sessions[sessions.length - 1]
        currentDurationMinutes = (now.getTime() - new Date(lastSession.start).getTime()) / (1000 * 60)
      } else {
        // Offline since last data point
        currentDurationMinutes = minutesSinceLastData
      }

      return {
        deviceId: pipe.deviceId,
        deviceName: pipe.deviceName,
        pipeNumber: pipe.pipeNumber,
        location: pipe.location,
        firstSeen: timestamps[0],
        lastSeen: timestamps[timestamps.length - 1],
        totalDataPoints,
        sessions,
        sessionCount: sessions.length,
        uptimeMinutes: Math.round(uptimeMinutes * 10) / 10,
        downtimeMinutes: Math.round(downtimeMinutes * 10) / 10,
        uptimePercentage,
        currentStatus,
        currentDurationMinutes: Math.round(currentDurationMinutes * 10) / 10,
      }
    })

    // Also include any device_ids in flow_data that are not in cstpsPipes
    const knownDeviceIds = new Set(cstpsPipes.map((p) => p.deviceId))
    for (const [deviceId, timestamps] of deviceTimestamps) {
      if (knownDeviceIds.has(deviceId)) continue

      const totalDataPoints = timestamps.length
      const sessions = detectSessions(timestamps)

      const uptimeMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0)
      const downtimeMinutes = Math.max(totalWindowMinutes - uptimeMinutes, 0)
      const uptimePercentage = Math.min(
        Math.round((uptimeMinutes / totalWindowMinutes) * 1000) / 10,
        100
      )

      const lastTimestamp = new Date(timestamps[timestamps.length - 1])
      const minutesSinceLastData = (now.getTime() - lastTimestamp.getTime()) / (1000 * 60)
      const currentStatus = minutesSinceLastData <= SESSION_GAP_MINUTES ? 'online' : 'offline'

      let currentDurationMinutes: number
      if (currentStatus === 'online') {
        const lastSession = sessions[sessions.length - 1]
        currentDurationMinutes = (now.getTime() - new Date(lastSession.start).getTime()) / (1000 * 60)
      } else {
        currentDurationMinutes = minutesSinceLastData
      }

      devices.push({
        deviceId,
        deviceName: deviceId,
        pipeNumber: 0,
        location: 'Unknown',
        firstSeen: timestamps[0],
        lastSeen: timestamps[timestamps.length - 1],
        totalDataPoints,
        sessions,
        sessionCount: sessions.length,
        uptimeMinutes: Math.round(uptimeMinutes * 10) / 10,
        downtimeMinutes: Math.round(downtimeMinutes * 10) / 10,
        uptimePercentage,
        currentStatus,
        currentDurationMinutes: Math.round(currentDurationMinutes * 10) / 10,
      })
    }

    // Sort: online first, then by uptime % desc
    devices.sort((a, b) => {
      if (a.currentStatus !== b.currentStatus) {
        return a.currentStatus === 'online' ? -1 : 1
      }
      return b.uptimePercentage - a.uptimePercentage
    })

    const onlineCount = devices.filter((d) => d.currentStatus === 'online').length
    const offlineCount = devices.filter((d) => d.currentStatus === 'offline').length
    const avgUptime =
      devices.length > 0
        ? Math.round(
            (devices.reduce((sum, d) => sum + d.uptimePercentage, 0) / devices.length) * 10
          ) / 10
        : 0

    const summary: HealthSummary = {
      totalDevices: devices.length,
      onlineCount,
      offlineCount,
      averageUptimePercentage: avgUptime,
    }

    return NextResponse.json({ devices, summary })
  } catch (error) {
    console.error('Error in GET /api/admin/device-health:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
