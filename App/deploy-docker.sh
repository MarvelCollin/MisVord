#!/bin/bash

# MisVord Docker Deployment Script
# This script ensures only Docker containers are used for the application

echo "🚀 Starting MisVord Docker containers..."

# Stop any local processes that might conflict
echo "🛑 Stopping any conflicting local processes..."

# Kill any local Node.js processes (but not Docker containers)
echo "⚠️  Checking for local Node.js processes..."
LOCAL_NODE_PIDS=$(ps aux | grep "node server.js" | grep -v docker | grep -v grep | awk '{print $2}' || true)
if [ ! -z "$LOCAL_NODE_PIDS" ]; then
    echo "🔴 Found local Node.js processes: $LOCAL_NODE_PIDS"
    echo "❌ Killing local Node.js processes to avoid conflicts..."
    echo "$LOCAL_NODE_PIDS" | xargs kill -9 2>/dev/null || true
else
    echo "✅ No conflicting local Node.js processes found"
fi

# Kill any local PHP servers (but keep Docker containers)
echo "⚠️  Checking for local PHP servers..."
LOCAL_PHP_PIDS=$(ps aux | grep "php.*-S" | grep -v docker | grep -v grep | awk '{print $2}' || true)
if [ ! -z "$LOCAL_PHP_PIDS" ]; then
    echo "🔴 Found local PHP servers: $LOCAL_PHP_PIDS"
    echo "❌ Killing local PHP servers to avoid conflicts..."
    echo "$LOCAL_PHP_PIDS" | xargs kill -9 2>/dev/null || true
else
    echo "✅ No conflicting local PHP servers found"
fi

# Start Docker containers
echo "🐳 Starting Docker containers..."

# Stop existing containers if running
docker-compose down

# Build and start containers
docker-compose up -d --build

# Wait for containers to be ready
echo "⏳ Waiting for containers to be ready..."
sleep 10

# Check container status
echo "📊 Container Status:"
docker-compose ps

# Test connectivity
echo "🔍 Testing container connectivity..."

# Test PHP app
echo "Testing PHP app..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:1001/health || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ PHP app is running (HTTP $HTTP_STATUS)"
else
    echo "❌ PHP app is not responding (HTTP $HTTP_STATUS)"
fi

# Test Socket server
echo "Testing Socket server..."
SOCKET_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:1002/health || echo "000")
if [ "$SOCKET_STATUS" = "200" ]; then
    echo "✅ Socket server is running (HTTP $SOCKET_STATUS)"
else
    echo "❌ Socket server is not responding (HTTP $SOCKET_STATUS)"
fi

# Test Database
echo "Testing Database..."
DB_STATUS=$(docker-compose exec -T db mysqladmin ping -h localhost -P 1003 -u root -pkolin123 2>/dev/null && echo "OK" || echo "FAIL")
if [ "$DB_STATUS" = "OK" ]; then
    echo "✅ Database is running"
else
    echo "❌ Database is not responding"
fi

echo ""
echo "🎯 Docker-only deployment complete!"
echo "📱 Application: http://localhost:1001"
echo "🔌 Socket Test: http://localhost:1001/socket-test.html"
echo "💾 Database Admin: http://localhost:1004 (phpMyAdmin)"
echo ""
echo "🔧 Configuration:"
echo "   - Socket transport: WebSocket only (no polling fallback)"
echo "   - Socket host: Docker container 'socket'"
echo "   - Socket port: 1002"
echo "   - Database: Docker container 'db' on port 1003"
echo ""
echo "📝 To check logs:"
echo "   docker-compose logs -f app"
echo "   docker-compose logs -f socket"
echo "   docker-compose logs -f db"
