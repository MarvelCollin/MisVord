#!/bin/bash

# WebRTC Docker System Validation Script
# This script validates that the WebRTC system is working properly in Docker

echo "🔍 WebRTC Docker System Validation"
echo "=================================="

echo
echo "📊 1. Checking Docker Containers..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep miscvord

echo
echo "🏥 2. Testing Socket Server Health..."
curl -s -w "HTTP Status: %{http_code}\n" http://localhost:1002/health | jq . 2>/dev/null || echo "Raw response: $(curl -s http://localhost:1002/health)"

echo
echo "🌐 3. Testing Main Application..."
curl -s -o /dev/null -w "WebRTC Page HTTP Status: %{http_code}\n" http://localhost:1001/webrtc

echo
echo "📋 4. Testing Socket.IO Endpoint..."
curl -s -o /dev/null -w "Socket.IO HTTP Status: %{http_code}\n" http://localhost:1002/socket.io/

echo
echo "🔧 5. Environment Variables Check..."
docker exec miscvord_socket printenv | grep -E "(PORT|SOCKET|CORS)" | sort

echo
echo "📝 6. Recent Socket Server Logs..."
docker logs miscvord_socket --tail 10

echo
echo "✅ Validation Complete!"
echo
echo "📖 Manual Testing Steps:"
echo "1. Open: http://localhost:1001/webrtc"
echo "2. Open: http://localhost:1001/webrtc-full-test.html"
echo "3. Test socket connection, media permissions, and video calling"
echo "4. Open multiple browser tabs to test peer-to-peer connections"
echo "5. Test screen sharing functionality"
echo
echo "🚀 If all tests pass, your WebRTC Docker system is ready!"
