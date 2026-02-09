@echo off
REM ===========================================
REM  FluxIO Modbus Connection Test
REM ===========================================
REM
REM Tests connectivity to the Modbus TCP simulator.
REM Run this in a separate terminal while the simulator is running.
REM
REM Usage:
REM   test-modbus-connection.bat              (localhost:502)
REM   test-modbus-connection.bat 5020         (localhost:5020)
REM   test-modbus-connection.bat 502 192.168.2.100  (remote host)
REM ===========================================

echo.
echo ============================================
echo   FluxIO Modbus Connection Test
echo ============================================
echo.

REM Get the script directory
set SCRIPT_DIR=%~dp0

REM Set defaults
set PORT=502
set HOST=127.0.0.1

if not "%1"=="" set PORT=%1
if not "%2"=="" set HOST=%2

echo Testing connection to %HOST%:%PORT%...
echo.

python "%SCRIPT_DIR%test-modbus-client.py" --host %HOST% --port %PORT%

pause
