import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Get all devices with their latest data
    const { data: devices, error: devicesError } = await supabase
      .from('devices')
      .select('*')
      .order('created_at', { ascending: false })

    if (devicesError) {
      return NextResponse.json(
        { error: 'Failed to fetch devices', details: devicesError.message },
        { status: 500 }
      )
    }

    // Get latest flow data for each device
    const { data: latestData } = await supabase.rpc('get_latest_flow_data')

    // Merge devices with their latest data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const devicesWithData = devices?.map((device: any) => {
      const latest = (latestData as any[] | null)?.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (d: any) => d.device_id === device.device_id
      )
      return {
        ...device,
        latest_data: latest || null,
      }
    })

    return NextResponse.json({
      success: true,
      data: devicesWithData,
    })
  } catch (error) {
    console.error('Error in devices endpoint:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('devices')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({
        device_id: body.device_id,
        device_name: body.device_name,
        device_type: body.device_type || 'nivus_flow_transmitter',
        location: body.location,
        description: body.description,
        status: body.status || 'active',
        metadata: body.metadata || {},
      } as any)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create device', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Error creating device:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
