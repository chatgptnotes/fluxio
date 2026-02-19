import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const DEVICE_IDS = [
  'NIVUS_750_001',
  'NIVUS_750_002',
  'NIVUS_750_003',
  'NIVUS_750_004',
  'NIVUS_750_005',
  'NIVUS_750_006',
]

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const hours = parseInt(searchParams.get('hours') || '0')

    const supabase = createAdminClient()

    const results: { device_id: string; totalizer_value: number }[] = []

    if (hours === 0) {
      // Till Date: return the latest totalizer value per device
      for (const deviceId of DEVICE_IDS) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from('flow_data')
          .select('totalizer')
          .eq('device_id', deviceId)
          .order('created_at', { ascending: false })
          .limit(1)

        if (error) {
          console.error(`Error fetching totalizer for ${deviceId}:`, error)
          results.push({ device_id: deviceId, totalizer_value: 0 })
          continue
        }

        const rows = data as { totalizer: number | null }[] | null
        results.push({
          device_id: deviceId,
          totalizer_value: rows?.[0]?.totalizer ?? 0,
        })
      }
    } else {
      // Time-based: return MAX(totalizer) - MIN(totalizer) for each device
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

      for (const deviceId of DEVICE_IDS) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from('flow_data')
          .select('totalizer')
          .eq('device_id', deviceId)
          .gte('created_at', cutoff)
          .order('totalizer', { ascending: true })

        const rows = data as { totalizer: number | null }[] | null
        if (error || !rows || rows.length === 0) {
          if (error) console.error(`Error fetching totalizer for ${deviceId}:`, error)
          results.push({ device_id: deviceId, totalizer_value: 0 })
          continue
        }

        const totalizerValues = rows
          .map((r) => r.totalizer ?? 0)
          .filter((v) => v > 0)

        if (totalizerValues.length === 0) {
          results.push({ device_id: deviceId, totalizer_value: 0 })
          continue
        }

        const minVal = Math.min(...totalizerValues)
        const maxVal = Math.max(...totalizerValues)

        results.push({
          device_id: deviceId,
          totalizer_value: maxVal - minVal,
        })
      }
    }

    const response = NextResponse.json({
      success: true,
      data: results,
      hours,
      timestamp: new Date().toISOString(),
    })

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response
  } catch (error) {
    console.error('Error in totalizer endpoint:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
