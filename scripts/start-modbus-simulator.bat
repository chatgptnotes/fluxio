@echo off
REM ===========================================
REM  FluxIO Modbus TCP Simulator Launcher
REM ===========================================
REM
REM This script starts the Modbus TCP simulator.
REM Run as Administrator for port 502, or use port 5020.
REM
REM Usage:
REM   start-modbus-simulator.bat           (port 502, needs admin)
REM   start-modbus-simulator.bat 5020      (custom port)
REM ===========================================

echo.
echo ============================================
echo   FluxIO Modbus TCP Simulator
echo ============================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

REM Check if pymodbus is installed
python -c "import pymodbus" >nul 2>&1
if errorlevel 1 (
    echo pymodbus not found. Installing...
    pip install pymodbus
    if errorlevel 1 (
        echo ERROR: Failed to install pymodbus
        pause
        exit /b 1
    )
)

REM Get the script directory
set SCRIPT_DIR=%~dp0

REM Set port (default 502, or use first argument)
set PORT=502
if not "%1"=="" set PORT=%1

echo Starting Modbus TCP Simulator on port %PORT%...
echo.
echo TRB246 Configuration:
echo   IP Address: 192.168.2.100
echo   Port: %PORT%
echo.

REM Run the simulator
python "%SCRIPT_DIR%modbus-simulator.py" --port %PORT%

pause
