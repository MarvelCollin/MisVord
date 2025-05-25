@echo off
REM WebRTC Docker System Validation Script for Windows
REM This script validates that the WebRTC system is working properly in Docker

echo 🔍 WebRTC Docker System Validation
echo ==================================
echo.

echo 📊 1. Checking Docker Containers...
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | findstr miscvord
echo.

echo 🏥 2. Testing Socket Server Health...
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:1002/health'; Write-Host 'Health Check: HTTP' $r.StatusCode; $r.Content | ConvertFrom-Json | ConvertTo-Json } catch { Write-Host 'Health Check Failed:' $_.Exception.Message }"
echo.

echo 🌐 3. Testing Main Application...
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:1001/webrtc'; Write-Host 'WebRTC Page: HTTP' $r.StatusCode } catch { Write-Host 'WebRTC Page Failed:' $_.Exception.Message }"
echo.

echo 📋 4. Testing Socket.IO Endpoint...
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:1002/socket.io/'; Write-Host 'Socket.IO: HTTP' $r.StatusCode } catch { Write-Host 'Socket.IO Failed:' $_.Exception.Message }"
echo.

echo 🔧 5. Container Environment Check...
docker exec miscvord_socket printenv | findstr /I "PORT SOCKET CORS"
echo.

echo 📝 6. Recent Socket Server Logs...
docker logs miscvord_socket --tail 5
echo.

echo ✅ Validation Complete!
echo.
echo 📖 Manual Testing Steps:
echo 1. Open: http://localhost:1001/webrtc
echo 2. Open: http://localhost:1001/webrtc-full-test.html
echo 3. Test socket connection, media permissions, and video calling
echo 4. Open multiple browser tabs to test peer-to-peer connections
echo 5. Test screen sharing functionality
echo.
echo 🚀 If all tests pass, your WebRTC Docker system is ready!
echo.
pause
