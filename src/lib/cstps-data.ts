// CSTPS Pipeline - NIVUS 750 Flow Sensor Data

export interface NivusSensor {
  id: string
  pipeNumber: number
  deviceName: string
  deviceId: string
  location: string
  installationDate: string
  status: 'online' | 'warning' | 'offline'
  parameters: {
    flowRate: number // m³/h
    velocity: number // m/s
    waterLevel: number // mm
    totalizer: number // m³
    temperature: number // °C
    batteryLevel: number // %
    signalStrength: number // dBm
    crossSectionalArea: number // m²
    flowDirection: 'forward' | 'reverse' | 'no-flow'
  }
  lastUpdated: string
}

export const cstpsPipes: NivusSensor[] = [
  {
    id: 'pipe-1',
    pipeNumber: 1,
    deviceName: 'NIVUS 750 - Main Intake',
    deviceId: 'NIVUS_750_001',
    location: 'Dam Main Outlet - North',
    installationDate: '2024-03-15',
    status: 'online',
    parameters: {
      flowRate: 125.8,
      velocity: 2.45,
      waterLevel: 1250,
      totalizer: 458920,
      temperature: 18.5,
      batteryLevel: 95,
      signalStrength: -45,
      crossSectionalArea: 0.785,
      flowDirection: 'forward',
    },
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'pipe-2',
    pipeNumber: 2,
    deviceName: 'NIVUS 750 - Secondary Intake',
    deviceId: 'NIVUS_750_002',
    location: 'Dam Main Outlet - South',
    installationDate: '2024-03-15',
    status: 'online',
    parameters: {
      flowRate: 98.4,
      velocity: 1.92,
      waterLevel: 1180,
      totalizer: 385210,
      temperature: 18.2,
      batteryLevel: 88,
      signalStrength: -52,
      crossSectionalArea: 0.785,
      flowDirection: 'forward',
    },
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'pipe-3',
    pipeNumber: 3,
    deviceName: 'NIVUS 750 - Cooling Water',
    deviceId: 'NIVUS_750_003',
    location: 'Cooling Tower Feed',
    installationDate: '2024-03-16',
    status: 'online',
    parameters: {
      flowRate: 75.2,
      velocity: 1.47,
      waterLevel: 950,
      totalizer: 298450,
      temperature: 22.8,
      batteryLevel: 92,
      signalStrength: -48,
      crossSectionalArea: 0.785,
      flowDirection: 'forward',
    },
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'pipe-4',
    pipeNumber: 4,
    deviceName: 'NIVUS 750 - Auxiliary Feed',
    deviceId: 'NIVUS_750_004',
    location: 'Auxiliary Systems',
    installationDate: '2024-03-16',
    status: 'warning',
    parameters: {
      flowRate: 45.6,
      velocity: 0.89,
      waterLevel: 680,
      totalizer: 178920,
      temperature: 19.5,
      batteryLevel: 45,
      signalStrength: -68,
      crossSectionalArea: 0.785,
      flowDirection: 'forward',
    },
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'pipe-5',
    pipeNumber: 5,
    deviceName: 'NIVUS 750 - Emergency Supply',
    deviceId: 'NIVUS_750_005',
    location: 'Emergency Reservoir',
    installationDate: '2024-03-17',
    status: 'online',
    parameters: {
      flowRate: 12.3,
      velocity: 0.24,
      waterLevel: 420,
      totalizer: 52180,
      temperature: 17.8,
      batteryLevel: 98,
      signalStrength: -42,
      crossSectionalArea: 0.785,
      flowDirection: 'forward',
    },
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'pipe-6',
    pipeNumber: 6,
    deviceName: 'NIVUS 750 - Overflow Return',
    deviceId: 'NIVUS_750_006',
    location: 'Overflow Channel',
    installationDate: '2024-03-17',
    status: 'offline',
    parameters: {
      flowRate: 0,
      velocity: 0,
      waterLevel: 120,
      totalizer: 15840,
      temperature: 16.2,
      batteryLevel: 12,
      signalStrength: -85,
      crossSectionalArea: 0.785,
      flowDirection: 'no-flow',
    },
    lastUpdated: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  },
]

export function getPipeById(pipeId: string): NivusSensor | undefined {
  return cstpsPipes.find((pipe) => pipe.id === pipeId)
}

export function getStatusColor(status: NivusSensor['status']): string {
  switch (status) {
    case 'online':
      return '#22c55e' // green-500
    case 'warning':
      return '#eab308' // yellow-500
    case 'offline':
      return '#ef4444' // red-500
    default:
      return '#6b7280' // gray-500
  }
}

export function getFlowDirectionLabel(
  direction: NivusSensor['parameters']['flowDirection']
): string {
  switch (direction) {
    case 'forward':
      return 'Forward Flow'
    case 'reverse':
      return 'Reverse Flow'
    case 'no-flow':
      return 'No Flow'
    default:
      return 'Unknown'
  }
}
