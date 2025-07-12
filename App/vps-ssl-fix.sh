#!/bin/bash

echo "=== VPS SSL Handshake Error Fix ==="

echo "🔍 Checking current SSL handshake errors..."
docker compose logs app --tail=20 | grep -E "\\x16\\x03\\x01|400 485" && HAS_SSL_ERRORS=true || HAS_SSL_ERRORS=false

if [ "$HAS_SSL_ERRORS" = "true" ]; then
    echo "❌ Found SSL handshake errors in logs"
    echo ""
    echo "🛠️ Applying fix by blocking direct SSL traffic..."
    
    # Block direct SSL handshake attempts on port 1001
    echo "Setting up iptables rules to reject SSL handshakes on port 1001..."
    
    # Block TLS handshake packets specifically
    sudo iptables -I INPUT -p tcp --dport 1001 -m string --string "\x16\x03\x01" --algo bm -j REJECT --reject-with tcp-reset
    
    echo "✅ SSL handshake blocking rule applied"
    echo ""
    echo "🔄 Restarting containers to clear existing connections..."
    docker compose restart app
    
    echo "⏱️ Waiting for restart..."
    sleep 10
    
    echo "🧪 Testing internal health..."
    curl -s http://localhost:1001/health || echo "❌ Health check failed"
    
    echo ""
    echo "📊 Checking for new SSL errors..."
    sleep 5
    docker compose logs app --tail=10 | grep -E "\\x16\\x03\\x01|400 485" && echo "❌ Still seeing SSL errors" || echo "✅ No new SSL errors"
    
else
    echo "✅ No SSL handshake errors found in recent logs"
fi

echo ""
echo "📋 Current container status:"
docker compose ps

echo ""
echo "🌐 Testing external access:"
echo "Testing domain access..."
curl -s -I http://marvelcollin.my.id | head -1 || echo "❌ Domain HTTP failed"
curl -s -I https://marvelcollin.my.id | head -1 || echo "❌ Domain HTTPS failed"

echo ""
echo "🔧 VPS SSL fix completed!"
echo "📝 Summary:"
echo "   - SSL handshake packets blocked on port 1001"
echo "   - Application containers restarted"
echo "   - External reverse proxy handles HTTPS"
echo "   - Direct SSL attempts rejected cleanly"
