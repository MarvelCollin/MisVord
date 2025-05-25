#!/bin/bash

# WebSocket Server Health Check Script
# This script checks if the WebSocket server is running properly
# and provides diagnostic information

# Configuration - adjust these values as needed
SOCKET_PORT=${1:-1002}
HEALTH_ENDPOINT="http://localhost:$SOCKET_PORT/health"
SOCKET_TEST_ENDPOINT="http://localhost:$SOCKET_PORT/socket-test"
TIMEOUT=5

echo "===== WebSocket Server Health Check ====="
echo "Checking WebSocket server on port $SOCKET_PORT..."

# Check if curl is available
if ! command -v curl &> /dev/null; then
    echo "Error: curl is not installed. Please install curl to run this script."
    exit 1
fi

# Check if the server is running
echo -n "Server status: "
HEALTH_CHECK=$(curl -s -m $TIMEOUT $HEALTH_ENDPOINT)
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
    echo "OFFLINE"
    echo "The WebSocket server is not responding. Make sure it's running."
    
    # Check if the port is in use
    if command -v netstat &> /dev/null; then
        echo -n "Checking port $SOCKET_PORT: "
        if netstat -tuln | grep -q ":$SOCKET_PORT "; then
            echo "IN USE (but not responding to health check)"
        else
            echo "NOT IN USE (no process is listening on this port)"
        fi
    fi
    
    # Check for Node.js processes
    echo "Active Node.js processes:"
    ps aux | grep -i "node" | grep -v grep
    
    echo "Possible solutions:"
    echo "1. Start the socket server using the appropriate script:"
    echo "   - For development: ./start-dev-socket-server.bat"
    echo "   - For production: ./start-prod-socket-server.bat"
    echo "2. Make sure the port is not blocked by a firewall"
    echo "3. Check the logs for errors"
    
    exit 1
else
    echo "ONLINE"
    
    # Parse the health check response
    echo "Server details:"
    echo "$HEALTH_CHECK" | grep -v "[{},]" | sed 's/:/: /g' | sed 's/"//g' | sed 's/^/  /'
    
    # Check WebSocket connectivity
    echo -n "Testing Socket.IO endpoint: "
    SOCKET_TEST=$(curl -s -m $TIMEOUT $SOCKET_TEST_ENDPOINT)
    if [ $? -eq 0 ]; then
        echo "SUCCESS"
        echo "Socket test response:"
        echo "$SOCKET_TEST" | grep -v "[{},]" | sed 's/:/: /g' | sed 's/"//g' | sed 's/^/  /'
    else
        echo "FAILED"
        echo "Could not connect to Socket.IO test endpoint"
    fi
    
    echo "===== Environment Variables ====="
    if [ -f .env ]; then
        grep -E "^(SOCKET_|IS_VPS|USE_HTTPS|DOMAIN|PORT)" .env | sed 's/^/  /'
    else
        echo "  No .env file found"
        echo "  Using environment variables from start script"
    fi
    
    # Check server's socket path configuration
    echo "===== Socket Path Configuration ====="
    SOCKET_PATH=$(echo "$HEALTH_CHECK" | grep -o '"socketPath":"[^"]*"' | cut -d'"' -f4)
    IS_VPS=$(echo "$HEALTH_CHECK" | grep -o '"isVps":[^,}]*' | cut -d':' -f2)
    
    echo "  Socket Path: $SOCKET_PATH"
    echo "  Production Mode: $IS_VPS"
    
    if [ "$IS_VPS" = "true" ] && [ "$SOCKET_PATH" != "/misvord/socket/socket.io" ]; then
        echo "  ⚠️ WARNING: Path mismatch for production environment!"
        echo "  Production should use: /misvord/socket/socket.io"
    elif [ "$IS_VPS" = "false" ] && [ "$SOCKET_PATH" != "/socket.io" ]; then
        echo "  ⚠️ WARNING: Path mismatch for development environment!"
        echo "  Development should use: /socket.io"
    else
        echo "  ✅ Socket path configuration matches environment"
    fi
    
    echo "===== WebSocket Server Status: HEALTHY ====="
    
    # Provide helpful usage information
    echo "To test WebSocket connection in browser:"
    echo "  - Development: http://localhost:1002/socket-test"
    echo "  - Production: https://marvelcollin.my.id/misvord/socket/socket-test"
    echo ""
    echo "To check video chat users:"
    echo "  - Development: http://localhost:1002/video-users"
    echo "  - Production: https://marvelcollin.my.id/misvord/socket/video-users"
    
    exit 0
fi
