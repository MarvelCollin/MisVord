@echo off
echo MiscVord WebSocket Connection Tester for VPS Deployment
echo.
echo Testing WebSocket connection to marvelcollin.my.id...
echo.

echo ===== NGINX CONFIGURATION CHECK =====
echo Make sure your NGINX configuration includes:
echo.
echo location /misvord/socket/ {
echo     proxy_pass http://miscvord_socket:1002/;
echo     proxy_http_version 1.1;
echo     proxy_set_header Upgrade $http_upgrade;
echo     proxy_set_header Connection "upgrade";
echo     proxy_set_header Host $host;
echo     proxy_set_header X-Real-IP $remote_addr;
echo     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
echo     proxy_set_header X-Forwarded-Proto $scheme;
echo     proxy_set_header X-Forwarded-Host $host;
echo }
echo.
echo location /misvord/socket/socket.io/ {
echo     proxy_pass http://miscvord_socket:1002/socket.io/;
echo     proxy_http_version 1.1;
echo     proxy_set_header Upgrade $http_upgrade;
echo     proxy_set_header Connection "upgrade";
echo     proxy_set_header Host $host;
echo }
echo.

echo ===== VPS ENVIRONMENT VARIABLES =====
echo Ensure these environment variables are set:
echo.
echo IS_VPS=true
echo USE_HTTPS=true
echo DOMAIN=marvelcollin.my.id
echo SUBPATH=misvord
echo SOCKET_PATH=/misvord/socket/socket.io
echo CORS_ALLOWED_ORIGINS=https://marvelcollin.my.id
echo.

echo ===== DEPLOYMENT CHECKS =====
echo 1. Verify SSL certificates are properly installed
echo 2. Check that all containers are running: docker-compose ps
echo 3. Visit https://marvelcollin.my.id/misvord/ in your browser
echo 4. Check server logs: docker-compose logs socket-server
echo.

pause 