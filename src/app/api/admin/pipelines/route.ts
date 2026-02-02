import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canManagePermissions } from '@/lib/auth/permissions';
import { cstpsPipes } from '@/lib/cstps-data';

// GET /api/admin/pipelines - List all available pipelines/devices
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || !canManagePermissions(user)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Use the actual CSTPS pipeline data
    const pipelines = cstpsPipes.map((pipe) => ({
      id: pipe.id,
      name: `Pipe ${pipe.pipeNumber}`,
      deviceId: pipe.deviceId,
      deviceName: pipe.deviceName,
      location: pipe.location,
      status: pipe.status,
      flowRate: pipe.parameters.flowRate,
      totalizer: pipe.parameters.totalizer,
    }));

    return NextResponse.json({ pipelines });
  } catch (error) {
    console.error('Error in GET /api/admin/pipelines:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
