@echo off
echo Starting Socket.IO server in production mode...

REM Kill any running Node.js processes
taskkill /F /IM node.exe 2>nul

REM Set environment variables for production
set DISABLE_DOTENV=true
set IS_VPS=true
set SOCKET_PATH=/misvord/socket/socket.io
set DOMAIN=marvelcollin.my.id
set SUBPATH=misvord
set CORS_ALLOWED_ORIGINS=https://marvelcollin.my.id
set DEBUG=false
set USE_HTTPS=true
set ALWAYS_USE_STANDARD_PATH=true

echo Using the following environment variables:
echo DISABLE_DOTENV: %DISABLE_DOTENV%
echo IS_VPS: %IS_VPS%
echo SOCKET_PATH: %SOCKET_PATH%
echo DOMAIN: %DOMAIN%
echo SUBPATH: %SUBPATH%
echo CORS_ALLOWED_ORIGINS: %CORS_ALLOWED_ORIGINS%
echo ALWAYS_USE_STANDARD_PATH: %ALWAYS_USE_STANDARD_PATH%

REM Start the server
echo Starting node with production environment...
node --unhandled-rejections=strict socket-server.js 