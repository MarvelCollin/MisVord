#!/bin/bash

echo "Socket.IO Connection Checker"
echo "============================"
echo "Testing connection to socket server on port 1002..."

# Try to curl the Socket.IO endpoint
echo "Testing: http://localhost:1002/socket.io/"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" "http://localhost:1002/socket.io/"

# Check socket.io.js endpoint
echo "Testing: http://localhost:1002/socket.io/socket.io.js"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" "http://localhost:1002/socket.io/socket.io.js"

# Try polling transport
echo "Testing socket.io polling transport..."
POLL_RESULT=$(curl -s "http://localhost:1002/socket.io/?EIO=4&transport=polling")
echo "Polling response: $POLL_RESULT"

# Check socket server health endpoint
echo "Testing health endpoint..."
curl -s "http://localhost:1002/health" | json_pp

echo "============================"
echo "Note: If you're seeing 404 errors, make sure the socket server is running:"
echo "node socket-server.js"
