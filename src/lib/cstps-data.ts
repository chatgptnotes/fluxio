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
    deviceName: 'Nivus750_Line1',
    deviceId: 'NIVUS_750_001',
    location: 'Pipe_1',
    installationDate: '2024-03-15',
    status: 'offline',
    parameters: {
      flowRate: 0,
      velocity: 0,
      waterLevel: 0,
      totalizer: 0,
      temperature: 0,
      batteryLevel: 100,
      signalStrength: -45,
      crossSectionalArea: 0.785,
      flowDirection: 'no-flow',
    },
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'pipe-2',
    pipeNumber: 2,
    deviceName: 'Nivus750_Line2',
    deviceId: 'NIVUS_750_002',
    location: 'Pipe_2',
    installationDate: '2024-03-15',
    status: 'offline',
    parameters: {
      flowRate: 0,
      velocity: 0,
      waterLevel: 0,
      totalizer: 0,
      temperature: 0,
      batteryLevel: 100,
      signalStrength: -52,
      crossSectionalArea: 0.785,
      flowDirection: 'no-flow',
    },
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'pipe-3',
    pipeNumber: 3,
    deviceName: 'Nivus750_Line3',
    deviceId: 'NIVUS_750_003',
    location: 'Pipe_3',
    installationDate: '2024-03-16',
    status: 'offline',
    parameters: {
      flowRate: 0,
      velocity: 0,
      waterLevel: 0,
      totalizer: 0,
      temperature: 0,
      batteryLevel: 100,
      signalStrength: -48,
      crossSectionalArea: 0.785,
      flowDirection: 'no-flow',
    },
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'pipe-4',
    pipeNumber: 4,
    deviceName: 'Nivus750_Line4',
    deviceId: 'NIVUS_750_004',
    location: 'Pipe_4',
    installationDate: '2024-03-16',
    status: 'offline',
    parameters: {
      flowRate: 0,
      velocity: 0,
      waterLevel: 0,
      totalizer: 0,
      temperature: 0,
      batteryLevel: 100,
      signalStrength: -68,
      crossSectionalArea: 0.785,
      flowDirection: 'no-flow',
    },
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'pipe-5',
    pipeNumber: 5,
    deviceName: 'Nivus750_Line5',
    deviceId: 'NIVUS_750_005',
    location: 'Pipe_5',
    installationDate: '2024-03-17',
    status: 'offline',
    parameters: {
      flowRate: 0,
      velocity: 0,
      waterLevel: 0,
      totalizer: 0,
      temperature: 0,
      batteryLevel: 100,
      signalStrength: -42,
      crossSectionalArea: 0.785,
      flowDirection: 'no-flow',
    },
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'pipe-6',
    pipeNumber: 6,
    deviceName: 'Nivus750_Line6',
    deviceId: 'NIVUS_750_006',
    location: 'Pipe_6',
    installationDate: '2024-03-17',
    status: 'offline',
    parameters: {
      flowRate: 0,
      velocity: 0,
      waterLevel: 0,
      totalizer: 0,
      temperature: 0,
      batteryLevel: 100,
      signalStrength: -85,
      crossSectionalArea: 0.785,
      flowDirection: 'no-flow',
    },
    lastUpdated: new Date(Date.now() - 3600000).toISOString(),
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
