#!/bin/bash

echo "Socket.IO Connection Checker"
echo "============================"
echo "Testing connection to socket server on port 1002..."

# Only test the standardized path that we're using for consistency
echo "Testing standardized Socket.IO path:"
echo "Testing: http://localhost:1002/misvord/socket/socket.io/"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" "http://localhost:1002/misvord/socket/socket.io/"

# Check socket.io.js endpoint
echo ""
echo "Testing socket.io.js access:"
echo "Testing: http://localhost:1002/misvord/socket/socket.io/socket.io.js"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" "http://localhost:1002/misvord/socket/socket.io/socket.io.js"

# Try polling transport with standardized path
echo ""
echo "Testing socket.io polling transport with standardized path..."
POLL_RESULT=$(curl -s "http://localhost:1002/misvord/socket/socket.io/?EIO=4&transport=polling")
echo "Polling response: $POLL_RESULT"

# Check socket server health endpoint
echo ""
echo "Testing health endpoint..."
curl -s "http://localhost:1002/health" | json_pp

echo "============================"
echo "Note: The system is configured to ONLY use the standardized path: /misvord/socket/socket.io"
echo "Make sure the socket server is running with correct environment variables:"
echo "./start-dev-socket-server.bat (Windows) or node socket-server.js (with proper env vars)"
