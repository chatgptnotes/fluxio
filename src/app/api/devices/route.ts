import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

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
    const { data: latestData, error: dataError } = await supabase.rpc(
      'get_latest_flow_data'
    )

    if (dataError) {
      console.error('Error fetching latest data:', dataError)
    }

    // Merge devices with their latest data
    const devicesWithData = devices?.map((device) => {
      const latest = latestData?.find((d) => d.device_id === device.device_id)
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
    const supabase = createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('devices')
      .insert({
        device_id: body.device_id,
        device_name: body.device_name,
        device_type: body.device_type || 'nivus_flow_transmitter',
        location: body.location,
        description: body.description,
        status: body.status || 'active',
        metadata: body.metadata || {},
      })
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
