#!/bin/bash

echo "=== MisVord Development Environment Fix ==="

echo "Ensuring development environment configuration..."
if ! grep -q "IS_VPS=false" .env; then
    echo "Fixing .env for development..."
    sed -i 's/IS_VPS=true/IS_VPS=false/' .env
    sed -i 's/USE_HTTPS=true/USE_HTTPS=false/' .env
    sed -i 's/DOMAIN=marvelcollin.my.id/DOMAIN=localhost/' .env
    echo "✅ Environment fixed for development"
fi

echo "Stopping containers for clean restart..."
docker compose down

echo "Cleaning up any port conflicts..."
pkill -f "php.*localhost:1001" 2>/dev/null || true
pkill -f "node.*server.js" 2>/dev/null || true

echo "Restarting containers in development mode..."
docker compose up -d --build

echo "Waiting for containers to be ready..."
sleep 20

echo ""
echo "=== DEVELOPMENT STATUS CHECK ==="
docker compose ps
echo ""
echo "Testing internal health:"
curl -s http://localhost:1001/health | head -1
echo ""
echo "Checking for SSL handshake errors in logs:"
docker compose logs app --tail=10 | grep -E "\\x16\\x03\\x01|400 485" || echo "No SSL errors found"

echo ""
echo "✅ Development environment fixed!"
echo "🌐 Your app should work on:"
echo "   - http://localhost:1001"
echo "   - http://127.0.0.1:1001"
echo ""
echo "📋 If you still see SSL errors, they're coming from external traffic to your VPS."
echo "📋 Use git to pull these changes to VPS, then run VPS-specific SSL setup."
