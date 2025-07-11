@echo off
echo Starting Docker containers...
cd "c:\BINUS\CASEMAKE\MisVord - BP WDP 25-2\App"
docker-compose up -d

echo.
echo Waiting for containers to start...
timeout 30

echo.
echo Checking container status:
docker ps

echo.
echo Your Docker services will be available at:
echo - PHP App: http://localhost:1001
echo - Socket.IO: http://localhost:1002  
echo - Database: localhost:1003
echo - PhpMyAdmin: http://localhost:1004
echo.
echo Now configure IIS to proxy to port 1001
pause
