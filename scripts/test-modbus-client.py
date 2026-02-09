#!/usr/bin/env python3
"""
Modbus TCP Client Test Script
=============================

Tests connectivity to the Modbus TCP simulator and reads all register values.
Use this to verify the simulator is running correctly before configuring TRB246.

Usage:
    python test-modbus-client.py                    # Connect to localhost:502
    python test-modbus-client.py --port 5020        # Connect to localhost:5020
    python test-modbus-client.py --host 192.168.2.100  # Connect to specific host

Author: FluxIO Team
Version: 1.3
"""

import argparse
import struct
import sys

try:
    from pymodbus.client import ModbusTcpClient
except ImportError:
    print("ERROR: pymodbus not installed. Run: pip install pymodbus")
    sys.exit(1)


def registers_to_float(reg1, reg2):
    """Convert two 16-bit registers to float32 (Big Endian)."""
    packed = struct.pack('>HH', reg1, reg2)
    return struct.unpack('>f', packed)[0]


def main():
    parser = argparse.ArgumentParser(
        description='Test Modbus TCP connection to simulator'
    )
    parser.add_argument('--host', '-H', default='127.0.0.1', help='Host IP (default: 127.0.0.1)')
    parser.add_argument('--port', '-p', type=int, default=502, help='TCP port (default: 502)')
    parser.add_argument('--loop', '-l', action='store_true', help='Continuously read values')
    parser.add_argument('--interval', '-i', type=int, default=5, help='Read interval in seconds (with --loop)')

    args = parser.parse_args()

    print()
    print("=" * 60)
    print("  MODBUS TCP CLIENT TEST")
    print("=" * 60)
    print(f"  Connecting to: {args.host}:{args.port}")
    print()

    # Create client
    client = ModbusTcpClient(args.host, port=args.port)

    # Connect
    if not client.connect():
        print(f"ERROR: Could not connect to {args.host}:{args.port}")
        print()
        print("Troubleshooting:")
        print("  1. Is the simulator running?")
        print("  2. Is the firewall allowing connections?")
        print("  3. Is the port correct?")
        return 1

    print("  Connected successfully!")
    print()

    try:
        if args.loop:
            import time
            print("  Reading values continuously (Ctrl+C to stop)...")
            print()
            while True:
                read_and_display(client)
                time.sleep(args.interval)
        else:
            read_and_display(client)

    except KeyboardInterrupt:
        print("\n  Stopped by user")

    finally:
        client.close()
        print("  Connection closed")

    return 0


def read_and_display(client):
    """Read all registers and display values."""
    # Read 10 registers starting at address 0
    # pymodbus 3.x uses keyword argument for count
    result = client.read_holding_registers(0, count=10)

    if result.isError():
        print(f"  ERROR: {result}")
        return

    regs = result.registers

    # Parse float values
    flow_rate = registers_to_float(regs[0], regs[1])
    totalizer = registers_to_float(regs[2], regs[3])
    temperature = registers_to_float(regs[4], regs[5])
    level = registers_to_float(regs[6], regs[7])
    velocity = registers_to_float(regs[8], regs[9])

    # Display
    print("  " + "-" * 40)
    print(f"  | Flow Rate:   {flow_rate:10.2f} m3/h      |")
    print(f"  | Totalizer:   {totalizer:10.1f} m3        |")
    print(f"  | Temperature: {temperature:10.1f} C         |")
    print(f"  | Level:       {level:10.1f} mm        |")
    print(f"  | Velocity:    {velocity:10.2f} m/s       |")
    print("  " + "-" * 40)
    print()

    # Also show raw registers for debugging
    print("  Raw registers:")
    for i in range(0, 10, 2):
        print(f"    [{i}-{i+1}]: {regs[i]:5d}, {regs[i+1]:5d} -> {registers_to_float(regs[i], regs[i+1]):.4f}")
    print()


if __name__ == '__main__':
    sys.exit(main())
