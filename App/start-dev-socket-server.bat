@echo off
echo Starting Socket.IO server in development mode...

REM Kill any running Node.js processes
taskkill /F /IM node.exe 2>nul

REM Set environment variables for development
set DISABLE_DOTENV=true
set IS_VPS=false
set USE_HTTPS=false
set DOMAIN=localhost
set PORT=1002

REM Development-specific settings
set CORS_ALLOWED_ORIGINS=*
set DEBUG=true
set NODE_ENV=development

echo Using the following environment variables:
echo DISABLE_DOTENV: %DISABLE_DOTENV%
echo IS_VPS: %IS_VPS%
echo USE_HTTPS: %USE_HTTPS%
echo DOMAIN: %DOMAIN%
echo PORT: %PORT%
echo CORS_ALLOWED_ORIGINS: %CORS_ALLOWED_ORIGINS%

REM Start the server
echo Starting node with development environment...
node socket-server.js 