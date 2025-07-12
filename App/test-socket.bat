@echo off
echo 🔌 Testing MisVord Socket Server
echo ================================

set SOCKET_URL=http://localhost:1002

echo 1. Testing Health Endpoint...
echo URL: %SOCKET_URL%/health
echo.

REM Test health endpoint using PowerShell
powershell -Command "try { $response = Invoke-RestMethod -Uri '%SOCKET_URL%/health' -TimeoutSec 5; Write-Host '✅ Health endpoint accessible'; Write-Host 'Response:' $response; if ($response.status -eq 'ok') { Write-Host '✅ Server status: OK'; Write-Host '⏱️  Uptime:' $response.uptime 's'; Write-Host '👥 Connected clients:' $response.connectedClients } else { Write-Host '⚠️  Server status:' $response.status } } catch { Write-Host '❌ Health endpoint not accessible'; Write-Host '   Make sure the socket server is running on port 1002' }"

echo.
echo 2. Testing Socket.IO Availability...

REM Test Socket.IO client library
powershell -Command "try { $response = Invoke-WebRequest -Uri '%SOCKET_URL%/socket.io/socket.io.js' -TimeoutSec 5; if ($response.Content.Length -gt 0) { Write-Host '✅ Socket.IO client library accessible' } else { Write-Host '❌ Socket.IO client library not accessible' } } catch { Write-Host '❌ Socket.IO client library not accessible' }"

echo.
echo 3. Available Endpoints:
echo    📊 Health Check: %SOCKET_URL%/health
echo    🧪 Socket Test Page: %SOCKET_URL%/socket-test
echo    📚 Socket.IO Client: %SOCKET_URL%/socket.io/socket.io.js
echo    🌐 Web Health Check: http://localhost:1001/socket-health-check.html

echo.
echo 4. Docker Status Check:

REM Check if Docker containers are running
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo 🐳 Checking Docker containers...
    
    docker ps --filter "name=misvord_socket" --format "table {{.Names}}\t{{.Status}}" | findstr "misvord_socket" >nul
    if %errorlevel% equ 0 (
        echo ✅ Socket container is running
    ) else (
        echo ❌ Socket container not running
        echo    Run: docker-compose up -d socket
    )
    
    docker ps --filter "name=misvord_php" --format "table {{.Names}}\t{{.Status}}" | findstr "misvord_php" >nul
    if %errorlevel% equ 0 (
        echo ✅ PHP container is running
    ) else (
        echo ❌ PHP container not running
        echo    Run: docker-compose up -d app
    )
) else (
    echo ⚠️  Docker not available - testing local setup
)

echo.
echo Quick Commands:
echo   Start all services: docker-compose up -d
echo   View socket logs: docker-compose logs socket
echo   Restart socket: docker-compose restart socket

pause
