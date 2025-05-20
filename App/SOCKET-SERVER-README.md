# Socket.IO Server Configuration

This document explains how to run the WebSocket server for both development and production environments.

## Socket Path Configuration

The Socket.IO server uses different paths depending on the environment:

- **Development/Localhost**: `/socket.io` (standard Socket.IO path)
- **Production/VPS**: `/misvord/socket/socket.io` (custom path for subpath deployment)

## Running in Development Mode

To run the server in development mode (on localhost):

```bash
# Using the batch script
start-dev-socket-server.bat

# OR manually setting environment variables
set IS_VPS=false
set SOCKET_PATH=/socket.io
set DOMAIN=localhost
node socket-server.js
```

## Running in Production Mode

To run the server in production mode (on VPS):

```bash
# Using the batch script
start-prod-socket-server.bat

# OR manually setting environment variables
set IS_VPS=true
set SOCKET_PATH=/misvord/socket/socket.io
set DOMAIN=marvelcollin.my.id
set SUBPATH=misvord
node socket-server.js
```

## Testing the Connection

You can test the connection using:

1. Open `socket-test.html` in your browser
2. Use the health endpoint: `http://localhost:1002/health`
3. Check the server's socket path config: `http://localhost:1002/info`

## Troubleshooting

If you encounter WebSocket connection issues:

1. Ensure the client and server are using the same Socket.IO path
2. Check that the port (1002) is not blocked by a firewall
3. Verify CORS settings if connecting from a different origin
4. Look for "WebSocket upgrade conflict" messages - these are normal during development

## Notes for Deployment

When deploying to production:
- The server must be accessible at the subdirectory `/misvord/socket/`
- NGINX configuration needs: `proxy_pass http://localhost:1002/misvord/socket/socket.io`
- Header files should include the meta tags:
  ```html
  <meta name="socket-server" content="https://yourdomain.com/misvord/socket">
  <meta name="socket-path" content="/misvord/socket/socket.io">
  ``` 