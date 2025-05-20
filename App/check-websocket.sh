#!/bin/bash

echo "Socket.IO Connection Checker"
echo "============================"
echo "Testing connection to socket server on port 1002..."

# Test both standard and standardized paths
echo "Testing standard Socket.IO path (might fail if configured differently):"
echo "Testing: http://localhost:1002/socket.io/"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" "http://localhost:1002/socket.io/"

echo ""
echo "Testing standardized Socket.IO path (should work with our configuration):"
echo "Testing: http://localhost:1002/misvord/socket/socket.io/"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" "http://localhost:1002/misvord/socket/socket.io/"

# Check socket.io.js endpoint with both paths
echo ""
echo "Testing: http://localhost:1002/socket.io/socket.io.js"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" "http://localhost:1002/socket.io/socket.io.js"

echo ""
echo "Testing: http://localhost:1002/misvord/socket/socket.io/socket.io.js"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" "http://localhost:1002/misvord/socket/socket.io/socket.io.js"

# Try polling transport with standardized path
echo ""
echo "Testing socket.io polling transport with standard path..."
POLL_RESULT=$(curl -s "http://localhost:1002/socket.io/?EIO=4&transport=polling")
echo "Polling response (standard path): $POLL_RESULT"

echo ""
echo "Testing socket.io polling transport with standardized path..."
POLL_RESULT_STD=$(curl -s "http://localhost:1002/misvord/socket/socket.io/?EIO=4&transport=polling")
echo "Polling response (standardized path): $POLL_RESULT_STD"

# Check socket server health endpoint
echo ""
echo "Testing health endpoint..."
curl -s "http://localhost:1002/health" | json_pp

echo "============================"
echo "Note: For successful connections, use the standardized path: /misvord/socket/socket.io"
echo "Make sure the socket server is running with correct environment variables:"
echo "./start-dev-socket-server.bat (Windows) or node socket-server.js (with proper env vars)"
