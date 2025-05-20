@echo off
echo Starting Socket.IO server in development mode...

REM Kill any running Node.js processes
taskkill /F /IM node.exe 2>nul

REM Set environment variables for development
set DISABLE_DOTENV=true
set IS_VPS=false
set SOCKET_PATH=/misvord/socket/socket.io
set DOMAIN=localhost
set CORS_ALLOWED_ORIGINS=*
set DEBUG=true
set SOCKET_SERVER=http://localhost:1002
set USE_HTTPS=false
set SUBPATH=misvord

echo Using the following environment variables:
echo DISABLE_DOTENV: %DISABLE_DOTENV%
echo IS_VPS: %IS_VPS%
echo SOCKET_PATH: %SOCKET_PATH%
echo DOMAIN: %DOMAIN%
echo CORS_ALLOWED_ORIGINS: %CORS_ALLOWED_ORIGINS%

REM Create temporary nodemon config to ignore .env file
echo { "env": { "DOTENV_CONFIG_PATH": "NO_ENV_FILE" } } > temp-nodemon.json

REM Start the server
echo Starting node with custom environment...
node socket-server.js

REM Clean up
del temp-nodemon.json 