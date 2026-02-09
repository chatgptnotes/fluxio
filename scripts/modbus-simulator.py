#!/usr/bin/env python3
"""
Modbus TCP Simulator - Mimics Nivus Flow Transmitter
====================================================

This script creates a Modbus TCP server that simulates a Nivus flow transmitter.
It provides realistic flow data that updates automatically for testing TRB246 gateway integration.

Register Layout (Big Endian Float32):
- Registers 0-1:  Flow Rate (m3/h)
- Registers 2-3:  Totalizer (m3)
- Registers 4-5:  Temperature (C)
- Registers 6-7:  Water Level (mm)
- Registers 8-9:  Flow Velocity (m/s)

Usage:
    python modbus-simulator.py                  # Default port 502 (requires admin)
    python modbus-simulator.py --port 5020      # Custom port (no admin needed)
    python modbus-simulator.py --help           # Show help

Author: FluxIO Team
Version: 1.3
"""

import argparse
import logging
import struct
import threading
import time
import random
import math
from datetime import datetime

try:
    from pymodbus.server import StartTcpServer
    from pymodbus.datastore import (
        ModbusSequentialDataBlock,
        ModbusServerContext,
        ModbusDeviceContext,
    )
except ImportError as e:
    print(f"ERROR: pymodbus import failed: {e}")
    print("Install with: pip install pymodbus")
    exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-7s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


class NivusSimulator:
    """Simulates realistic Nivus flow transmitter data."""

    def __init__(self):
        # Base values for simulation
        self.base_flow_rate = 120.0      # m3/h
        self.totalizer = 458920.0        # m3 (starting total)
        self.base_temperature = 24.5     # Celsius
        self.base_level = 350.0          # mm
        self.base_velocity = 1.2         # m/s

        # Simulation parameters
        self.time_offset = 0
        self.last_update = time.time()

    def get_flow_rate(self):
        """Generate realistic flow rate with daily patterns and noise."""
        # Simulate daily pattern (higher during day, lower at night)
        hour = datetime.now().hour
        daily_factor = 0.7 + 0.3 * math.sin((hour - 6) * math.pi / 12)

        # Add some random variation
        noise = random.gauss(0, 5)

        return max(0, self.base_flow_rate * daily_factor + noise)

    def get_totalizer(self):
        """Accumulate total flow based on flow rate."""
        current_time = time.time()
        elapsed_hours = (current_time - self.last_update) / 3600

        flow_rate = self.get_flow_rate()
        self.totalizer += flow_rate * elapsed_hours
        self.last_update = current_time

        return self.totalizer

    def get_temperature(self):
        """Generate temperature with slight variations."""
        # Small random walk
        return self.base_temperature + random.gauss(0, 0.5)

    def get_level(self):
        """Generate water level correlated with flow."""
        flow_rate = self.get_flow_rate()
        # Level increases with flow
        level_factor = flow_rate / self.base_flow_rate
        noise = random.gauss(0, 10)
        return max(0, self.base_level * level_factor + noise)

    def get_velocity(self):
        """Generate velocity correlated with flow."""
        flow_rate = self.get_flow_rate()
        velocity_factor = flow_rate / self.base_flow_rate
        noise = random.gauss(0, 0.05)
        return max(0, self.base_velocity * velocity_factor + noise)


def float_to_registers(value):
    """Convert float32 to two 16-bit registers (Big Endian)."""
    packed = struct.pack('>f', value)
    reg1 = struct.unpack('>H', packed[0:2])[0]
    reg2 = struct.unpack('>H', packed[2:4])[0]
    return [reg1, reg2]


def registers_to_float(reg1, reg2):
    """Convert two 16-bit registers back to float32 (Big Endian)."""
    packed = struct.pack('>HH', reg1, reg2)
    return struct.unpack('>f', packed)[0]


class DataUpdater:
    """Background thread that updates Modbus registers with simulated data."""

    def __init__(self, context, simulator, update_interval=5):
        self.context = context
        self.simulator = simulator
        self.update_interval = update_interval
        self.running = False
        self.thread = None

    def start(self):
        """Start the data updater thread."""
        self.running = True
        self.thread = threading.Thread(target=self._update_loop, daemon=True)
        self.thread.start()
        logger.info(f"Data updater started (interval: {self.update_interval}s)")

    def stop(self):
        """Stop the data updater thread."""
        self.running = False
        if self.thread:
            self.thread.join(timeout=2)
        logger.info("Data updater stopped")

    def _update_loop(self):
        """Continuously update register values."""
        while self.running:
            try:
                self._update_registers()
                time.sleep(self.update_interval)
            except Exception as e:
                logger.error(f"Error updating registers: {e}")
                time.sleep(1)

    def _update_registers(self):
        """Update all Modbus registers with new simulated values."""
        # Get simulated values
        flow_rate = self.simulator.get_flow_rate()
        totalizer = self.simulator.get_totalizer()
        temperature = self.simulator.get_temperature()
        level = self.simulator.get_level()
        velocity = self.simulator.get_velocity()

        # Convert to registers
        registers = []
        registers.extend(float_to_registers(flow_rate))      # 0-1
        registers.extend(float_to_registers(totalizer))      # 2-3
        registers.extend(float_to_registers(temperature))    # 4-5
        registers.extend(float_to_registers(level))          # 6-7
        registers.extend(float_to_registers(velocity))       # 8-9

        # Update holding registers (function code 3)
        # In pymodbus 3.x, use context[0] to get the slave context
        slave_context = self.context[0]
        slave_context.setValues(3, 0, registers)

        # Log current values
        logger.info(
            f"Updated: Flow={flow_rate:7.2f} m3/h | "
            f"Total={totalizer:10.1f} m3 | "
            f"Temp={temperature:5.1f} C | "
            f"Level={level:6.1f} mm | "
            f"Vel={velocity:5.2f} m/s"
        )


def create_server_context():
    """Create the Modbus server context with initial data."""
    # Create data block with 100 registers (more than needed)
    # Initialize with zeros
    block = ModbusSequentialDataBlock(0, [0] * 100)

    # Create device context (pymodbus 3.x)
    slave = ModbusDeviceContext(
        di=ModbusSequentialDataBlock(0, [0] * 100),  # Discrete Inputs
        co=ModbusSequentialDataBlock(0, [0] * 100),  # Coils
        hr=block,                                      # Holding Registers (main data)
        ir=ModbusSequentialDataBlock(0, [0] * 100),  # Input Registers
    )

    # Create server context (single slave, unit ID 1)
    # pymodbus 3.x uses 'devices' instead of 'slaves'
    context = ModbusServerContext(devices=slave, single=True)

    return context


def print_banner(host, port):
    """Print startup banner."""
    print()
    print("=" * 70)
    print("  NIVUS FLOW TRANSMITTER SIMULATOR")
    print("  Modbus TCP Server for TRB246 Testing")
    print("=" * 70)
    print()
    print(f"  Server Address:  {host}:{port}")
    print(f"  Unit ID:         1")
    print()
    print("  Register Map (Holding Registers, Function Code 3):")
    print("  " + "-" * 50)
    print("  | Register     | Address | Type    | Description      |")
    print("  " + "-" * 50)
    print("  | flow_rate    | 0-1     | Float32 | Flow rate (m3/h) |")
    print("  | totalizer    | 2-3     | Float32 | Total vol (m3)   |")
    print("  | temperature  | 4-5     | Float32 | Temp (C)         |")
    print("  | level        | 6-7     | Float32 | Water level (mm) |")
    print("  | velocity     | 8-9     | Float32 | Velocity (m/s)   |")
    print("  " + "-" * 50)
    print()
    print("  TRB246 Configuration:")
    print(f"    - IP Address: {host}")
    print(f"    - Port: {port}")
    print("    - Data Type: 32-bit Float (Big Endian)")
    print("    - Function: 3 (Read Holding Registers)")
    print()
    print("  Press Ctrl+C to stop the server")
    print("=" * 70)
    print()


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Modbus TCP Simulator - Mimics Nivus Flow Transmitter',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python modbus-simulator.py                    # Run on port 502 (admin required)
  python modbus-simulator.py --port 5020        # Run on port 5020 (no admin)
  python modbus-simulator.py --host 0.0.0.0     # Listen on all interfaces
  python modbus-simulator.py --interval 10     # Update every 10 seconds

TRB246 Quick Setup:
  1. Set laptop IP to 192.168.2.100 (static)
  2. Run this simulator
  3. Configure TRB246 Modbus TCP Client:
     - IP: 192.168.2.100
     - Port: 502 (or your custom port)
     - Function: 3 (Read Holding Registers)
     - Register 0, Count 2, Type Float32 for flow_rate
        """
    )

    parser.add_argument(
        '--host', '-H',
        default='0.0.0.0',
        help='Host IP to bind to (default: 0.0.0.0 = all interfaces)'
    )

    parser.add_argument(
        '--port', '-p',
        type=int,
        default=502,
        help='TCP port to listen on (default: 502, use 5020 without admin)'
    )

    parser.add_argument(
        '--interval', '-i',
        type=int,
        default=5,
        help='Data update interval in seconds (default: 5)'
    )

    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Enable verbose logging'
    )

    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    # Print banner
    print_banner(args.host, args.port)

    # Create simulator and server context
    simulator = NivusSimulator()
    context = create_server_context()

    # Start data updater
    updater = DataUpdater(context, simulator, args.interval)
    updater.start()

    # Initial update
    updater._update_registers()

    try:
        logger.info(f"Starting Modbus TCP server on {args.host}:{args.port}")

        # Start the server (blocking call)
        StartTcpServer(
            context=context,
            address=(args.host, args.port)
        )

    except PermissionError:
        logger.error(f"Permission denied for port {args.port}")
        logger.error("Port 502 requires administrator privileges.")
        logger.error("Options:")
        logger.error("  1. Run as Administrator")
        logger.error("  2. Use a different port: python modbus-simulator.py --port 5020")
        return 1

    except OSError as e:
        if "address already in use" in str(e).lower():
            logger.error(f"Port {args.port} is already in use")
            logger.error("Try a different port: python modbus-simulator.py --port 5020")
        else:
            logger.error(f"OS Error: {e}")
        return 1

    except KeyboardInterrupt:
        logger.info("Shutdown requested...")
        updater.stop()
        logger.info("Server stopped")
        return 0

    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return 1

    return 0


if __name__ == '__main__':
    exit(main())
