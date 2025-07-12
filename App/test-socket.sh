#!/bin/bash

echo "🔌 Testing MisVord Socket Server"
echo "================================"

SOCKET_URL="http://localhost:1002"

echo "1. Testing Health Endpoint..."
echo "URL: $SOCKET_URL/health"
echo ""

# Test health endpoint
HEALTH_RESPONSE=$(curl -s "$SOCKET_URL/health" 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "✅ Health endpoint accessible"
    echo "Response: $HEALTH_RESPONSE"
    
    # Parse JSON response
    STATUS=$(echo "$HEALTH_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    UPTIME=$(echo "$HEALTH_RESPONSE" | grep -o '"uptime":[^,}]*' | cut -d':' -f2)
    CLIENTS=$(echo "$HEALTH_RESPONSE" | grep -o '"connectedClients":[^,}]*' | cut -d':' -f2)
    
    if [ "$STATUS" = "ok" ]; then
        echo "✅ Server status: OK"
        echo "⏱️  Uptime: ${UPTIME}s"
        echo "👥 Connected clients: $CLIENTS"
    else
        echo "⚠️  Server status: $STATUS"
    fi
else
    echo "❌ Health endpoint not accessible"
    echo "   Make sure the socket server is running on port 1002"
fi

echo ""
echo "2. Testing Socket.IO Availability..."

# Test Socket.IO client library
SOCKETIO_RESPONSE=$(curl -s "$SOCKET_URL/socket.io/socket.io.js" 2>/dev/null | head -c 100)

if [ $? -eq 0 ] && [ ! -z "$SOCKETIO_RESPONSE" ]; then
    echo "✅ Socket.IO client library accessible"
else
    echo "❌ Socket.IO client library not accessible"
fi

echo ""
echo "3. Available Endpoints:"
echo "   📊 Health Check: $SOCKET_URL/health"
echo "   🧪 Socket Test Page: $SOCKET_URL/socket-test"
echo "   📚 Socket.IO Client: $SOCKET_URL/socket.io/socket.io.js"
echo "   🌐 Web Health Check: http://localhost:1001/socket-health-check.html"

echo ""
echo "4. Docker Status Check:"

# Check if Docker containers are running
if command -v docker >/dev/null 2>&1; then
    echo "🐳 Checking Docker containers..."
    
    if docker ps --filter "name=misvord_socket" --format "table {{.Names}}\t{{.Status}}" | grep -q "misvord_socket"; then
        SOCKET_STATUS=$(docker ps --filter "name=misvord_socket" --format "{{.Status}}")
        echo "✅ Socket container: $SOCKET_STATUS"
    else
        echo "❌ Socket container not running"
        echo "   Run: docker-compose up -d socket"
    fi
    
    if docker ps --filter "name=misvord_php" --format "table {{.Names}}\t{{.Status}}" | grep -q "misvord_php"; then
        PHP_STATUS=$(docker ps --filter "name=misvord_php" --format "{{.Status}}")
        echo "✅ PHP container: $PHP_STATUS"
    else
        echo "❌ PHP container not running"
        echo "   Run: docker-compose up -d app"
    fi
else
    echo "⚠️  Docker not available - testing local setup"
fi

echo ""
echo "Quick Commands:"
echo "  Start all services: docker-compose up -d"
echo "  View socket logs: docker-compose logs socket"
echo "  Restart socket: docker-compose restart socket"
