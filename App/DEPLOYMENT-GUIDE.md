# MiscVord Deployment Guide

This guide provides step-by-step instructions for deploying the MiscVord application to a VPS, with special focus on fixing WebSocket connection issues.

## Prerequisites

- Docker and Docker Compose installed
- NGINX installed on the host machine
- Domain name with SSL certificates (Let's Encrypt recommended)

## Step 1: Configure Environment Variables

Create a `.env` file with the following settings:

```
# MiscVord environment configuration
APP_ENV=production
APP_DEBUG=false

# Docker ports configuration
APP_PORT=1001
SOCKET_PORT=1002
SOCKET_SECURE_PORT=1443
DB_PORT=1003
PMA_PORT=1004
ADMINER_PORT=1005

# Database configuration
DB_HOST=db
DB_NAME=misvord
DB_USER=root
DB_PASS=password
DB_CHARSET=utf8mb4

# Socket server configuration - CRITICAL FOR WEBSOCKET
SOCKET_SERVER=http://miscvord_socket:1002
SOCKET_SERVER_LOCAL=http://localhost:1002
SOCKET_PATH=/misvord/socket/socket.io
SOCKET_API_KEY=kolin123
CORS_ALLOWED_ORIGINS=https://marvelcollin.my.id

# VPS deployment specific - CRITICAL FOR WEBSOCKET
IS_VPS=true
USE_HTTPS=true
DOMAIN=marvelcollin.my.id
SUBPATH=misvord
```

**IMPORTANT**: Make sure these environment variables are set correctly, especially:
- `IS_VPS=true`
- `SOCKET_PATH=/misvord/socket/socket.io`
- `DOMAIN=marvelcollin.my.id`

## Step 2: Configure NGINX

Create an NGINX configuration file with the following settings:

```nginx
server {
    listen 443 ssl;
    server_name marvelcollin.my.id;
    
    ssl_certificate /etc/letsencrypt/live/marvelcollin.my.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/marvelcollin.my.id/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    # Main application under /misvord
    location /misvord/ {
        proxy_pass http://localhost:1001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
    }

    # Socket server under /misvord/socket
    location /misvord/socket/ {
        proxy_pass http://localhost:1002/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
        # Add CORS headers for WebSocket
        add_header 'Access-Control-Allow-Origin' 'https://marvelcollin.my.id' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
    }

    # Socket.IO specific path for connections
    location /misvord/socket/socket.io/ {
        proxy_pass http://localhost:1002/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
        # Add CORS headers for WebSocket
        add_header 'Access-Control-Allow-Origin' 'https://marvelcollin.my.id' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name marvelcollin.my.id;
    return 301 https://$host$request_uri;
}
```

**IMPORTANT**: The WebSocket proxy configuration is critical. Make sure these sections are correct:
- `location /misvord/socket/`
- `location /misvord/socket/socket.io/`

Pay special attention to:
1. The `proxy_set_header` directives must be present and correct
2. CORS headers are properly configured for WebSockets
3. The paths in the `location` blocks match your environment variables

## Step 3: Testing NGINX Configuration

After setting up your NGINX configuration, test it:

```bash
# Test NGINX configuration
sudo nginx -t

# If successful, reload NGINX
sudo systemctl reload nginx
```

## Step 4: Deploy the Application

Run the following commands to deploy the application:

```bash
# Stop any running containers
docker-compose down

# Build the containers
docker-compose build

# Start the containers
docker-compose up -d
```

## Step 5: Verify the Deployment

1. Check that all containers are running:
   ```bash
   docker-compose ps
   ```

2. Check the socket server logs:
   ```bash
   docker-compose logs socket-server
   ```

3. Test the WebSocket connection:
   - Visit: `https://marvelcollin.my.id/misvord/`
   - Open browser console and check for WebSocket connection errors
   - Test WebSocket directly at: `http://localhost:1002/websocket-test`

## Troubleshooting

### WebSocket "Invalid namespace" Error

If you see an "Invalid namespace" error:

1. Check that `SOCKET_PATH` is set correctly in `.env`:
   ```
   SOCKET_PATH=/misvord/socket/socket.io
   ```

2. Verify that the socket server is using the correct path:
   ```bash
   docker-compose exec socket-server env | grep SOCKET_PATH
   ```

3. Check the NGINX configuration for the Socket.IO path:
   ```
   location /misvord/socket/socket.io/ {
       proxy_pass http://localhost:1002/socket.io/;
       ...
   }
   ```

4. Test using the browser console:
   ```javascript
   const socket = io('https://marvelcollin.my.id', {
     path: '/misvord/socket/socket.io',
     transports: ['websocket', 'polling']
   });
   socket.on('connect', () => console.log('Connected!'));
   socket.on('connect_error', (e) => console.error('Connection error:', e));
   ```

### WebSocket Connection Failed

If the WebSocket connection fails:

1. Test the socket server directly:
   ```
   curl http://localhost:1002/health
   ```

2. Check the socket server configuration:
   ```
   curl http://localhost:1002/debug-config
   ```

3. Visit the WebSocket test page:
   ```
   http://localhost:1002/websocket-test
   ```

4. Verify NGINX is properly forwarding WebSocket connections by checking its logs:
   ```bash
   sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log
   ```

5. Test SSL configuration:
   ```bash
   curl -v https://marvelcollin.my.id/misvord/socket/socket.io/
   ```

## Common Issues and Solutions

### 1. Cross-Origin (CORS) Issues

If you see CORS errors in the console:

- Make sure `CORS_ALLOWED_ORIGINS` in `.env` is set to `https://marvelcollin.my.id`
- Check that NGINX is adding the appropriate CORS headers
- Test with a browser extension that disables CORS for testing purposes

### 2. SSL/HTTPS Issues

For secure WebSocket (WSS) issues:

- Ensure SSL certificates are valid and properly configured in NGINX
- Verify that `USE_HTTPS=true` is set in `.env`
- Check that client-side code is using WSS protocol for WebSockets

### 3. Subpath Issues

For problems with the `/misvord/` subpath:

- Ensure `SUBPATH=misvord` is set in `.env`
- Verify all NGINX location blocks are correctly configured with `/misvord/` prefix
- Check that Socket.IO client correctly uses `/misvord/socket/socket.io` path

By following this guide, you should have a properly functioning MiscVord deployment with working WebSocket connections. 