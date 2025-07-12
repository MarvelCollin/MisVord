#!/bin/bash

echo "🔍 DOCKER SOCKET & MESSAGE SYSTEM TEST"
echo "======================================"

echo "1. Testing Docker Container Status..."
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker not running"
    exit 1
fi

echo "📦 Container Status:"
docker-compose ps

echo ""
echo "2. Testing Container Network Communication..."

echo "🔌 PHP App → Socket Server Communication:"
docker-compose exec app curl -s http://socket:1002/health | jq '.' 2>/dev/null || echo "❌ Failed to connect to socket server from PHP app"

echo ""
echo "🔄 Socket Server → PHP App Communication:"
docker-compose exec socket curl -s http://app:1001/health | jq '.' 2>/dev/null || echo "❌ Failed to connect to PHP app from socket server"

echo ""
echo "3. Testing External Port Access..."

echo "🌐 External Socket Access (port 1002):"
curl -s http://localhost:1002/health | jq '.' 2>/dev/null || echo "❌ Socket server not accessible externally"

echo ""
echo "🌐 External PHP Access (port 1001):"
curl -s http://localhost:1001/health | jq '.' 2>/dev/null || echo "❌ PHP app not accessible externally"

echo ""
echo "4. Testing Message System Flow..."

echo "📨 Testing Socket Event API:"
curl -s -X POST http://localhost:1002/api/test-event \
  -H "Content-Type: application/json" \
  -d '{"event": "test", "data": {"message": "Docker test"}}' || echo "❌ Socket event API not responding"

echo ""
echo "5. Testing Database Connectivity..."

echo "🗄️  Database Connection from PHP:"
docker-compose exec app php -r "
try {
    \$pdo = new PDO('mysql:host=db;port=1003;dbname=misvord', 'root', 'kolin123');
    echo '✅ Database connection successful\n';
} catch (Exception \$e) {
    echo '❌ Database connection failed: ' . \$e->getMessage() . '\n';
}
"

echo ""
echo "6. Testing CORS Configuration..."

echo "🔐 CORS Test:"
curl -s -H "Origin: http://localhost:1001" -I http://localhost:1002/health | grep -i "access-control" || echo "⚠️  CORS headers not found"

echo ""
echo "✅ Docker Test Complete!"
echo ""
echo "🔗 Quick Access URLs:"
echo "   - Main App: http://localhost:1001"
echo "   - Socket Server: http://localhost:1002/health"
echo "   - Socket Test: http://localhost:1002/socket-test"
echo "   - Health Check: http://localhost:1001/socket-health-check.html"
