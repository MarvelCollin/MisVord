@echo off
echo Starting Socket.IO server in production mode...

REM Kill any running Node.js processes
taskkill /F /IM node.exe 2>nul

REM Set environment variables for production
set DISABLE_DOTENV=true
set IS_VPS=true
set USE_HTTPS=true
set DOMAIN=marvelcollin.my.id
set PORT=1002

REM Production-specific settings
set CORS_ALLOWED_ORIGINS=https://marvelcollin.my.id
set DEBUG=false
set NODE_ENV=production

echo Using the following environment variables:
echo DISABLE_DOTENV: %DISABLE_DOTENV%
echo IS_VPS: %IS_VPS%
echo USE_HTTPS: %USE_HTTPS%
echo DOMAIN: %DOMAIN%
echo PORT: %PORT%
echo CORS_ALLOWED_ORIGINS: %CORS_ALLOWED_ORIGINS%

REM Start the server
echo Starting node with production environment...
node --unhandled-rejections=strict socket-server.js 