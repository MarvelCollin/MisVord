# Deployment Instructions

This document provides step-by-step instructions for deploying the application in both development and production environments.

## Development Environment

To start the application in development mode:

1. Start the socket server:
   ```
   set DISABLE_DOTENV=true && set IS_VPS=false && set SOCKET_PATH=/socket.io && set DOMAIN=localhost && node socket-server.js
   ```
   
   Alternatively, you can use the batch script:
   ```
   start-dev-socket-server.bat
   ```

2. The socket server will run on port 1002 with the path `/socket.io` (standard Socket.IO path)

3. You can test the socket connection using the `socket-test.html` file:
   ```
   start socket-test.html
   ```

## Production Environment

To deploy the application in production:

1. Start the socket server using the production environment variables:
   ```
   set DISABLE_DOTENV=true && set IS_VPS=true && set SOCKET_PATH=/misvord/socket/socket.io && set DOMAIN=marvelcollin.my.id && set SUBPATH=misvord && set USE_HTTPS=true && node socket-server.js
   ```

   Alternatively, you can use the batch script:
   ```
   start-prod-socket-server.bat
   ```

2. The socket server will run on port 1002 with the path `/misvord/socket/socket.io`

3. Configure your NGINX server to proxy WebSocket connections to the socket server:
   ```nginx
   location /misvord/socket/ {
       proxy_pass http://localhost:1002;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }
   ```

## Troubleshooting

If you encounter WebSocket connection issues:

1. Verify the socket server is running:
   ```
   curl http://localhost:1002/health
   ```

2. Verify the Socket.IO path is accessible:
   - Development: `curl http://localhost:1002/socket.io/?EIO=4&transport=polling`
   - Production: `curl http://localhost:1002/misvord/socket/socket.io/?EIO=4&transport=polling`

3. Check the socket server logs for any errors

4. Make sure the client-side configuration matches the server configuration:
   - The meta tags in the HTML should have the correct values:
     ```html
     <meta name="socket-server" content="https://yourdomain.com/misvord/socket">
     <meta name="socket-path" content="/misvord/socket/socket.io">
     ```

5. Use the socket-test.html tool to test direct connections:
   ```
   start socket-test.html
   ``` 