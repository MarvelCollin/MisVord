    #!/bin/bash

    # Socket Connection Debugging Script for VPS
    # Run this on your VPS to diagnose the Socket.IO connection issue

    echo "🔍 SOCKET.IO CONNECTION DEBUGGING"
    echo "=================================="

    echo ""
    echo "1️⃣ Checking if Socket.IO server is running locally..."
    if curl -s http://localhost:1002/health >/dev/null 2>&1; then
        echo "✅ Socket server responding on localhost:1002"
        curl -s http://localhost:1002/health | jq . 2>/dev/null || curl -s http://localhost:1002/health
    else
        echo "❌ Socket server NOT responding on localhost:1002"
        echo "   This is the problem! Socket server is down."
        exit 1
    fi

    echo ""
    echo "2️⃣ Checking Socket.IO endpoint locally..."
    if curl -s http://localhost:1002/socket.io/ >/dev/null 2>&1; then
        echo "✅ Socket.IO endpoint responding on localhost:1002/socket.io/"
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:1002/socket.io/)
        echo "   HTTP Status: $HTTP_STATUS"
    else
        echo "❌ Socket.IO endpoint NOT responding on localhost:1002/socket.io/"
        echo "   Socket server might not have Socket.IO properly configured"
    fi

    echo ""
    echo "3️⃣ Checking nginx configuration..."
    if nginx -t >/dev/null 2>&1; then
        echo "✅ Nginx configuration is valid"
    else
        echo "❌ Nginx configuration has errors:"
        nginx -t
    fi

    echo ""
    echo "4️⃣ Checking if nginx is proxying Socket.IO..."
    echo "   Testing: https://marvelcollin.my.id/socket.io/"
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://marvelcollin.my.id/socket.io/ 2>/dev/null || echo "FAILED")

    if [ "$HTTP_STATUS" = "200" ]; then
        echo "✅ Nginx is successfully proxying Socket.IO (HTTP 200)"
    elif [ "$HTTP_STATUS" = "400" ]; then
        echo "✅ Socket.IO endpoint accessible (HTTP 400 is normal for browser requests)"
    elif [ "$HTTP_STATUS" = "FAILED" ]; then
        echo "❌ Cannot reach Socket.IO through domain (connection failed)"
        echo "   This means nginx is NOT proxying correctly"
    else
        echo "⚠️  Unexpected HTTP status: $HTTP_STATUS"
    fi

    echo ""
    echo "5️⃣ Checking nginx error logs for Socket.IO issues..."
    if [ -f /var/log/nginx/error.log ]; then
        echo "Recent nginx errors related to socket.io:"
        grep -i "socket\.io\|upstream" /var/log/nginx/error.log | tail -5 || echo "No socket.io related errors found"
    else
        echo "Nginx error log not found at /var/log/nginx/error.log"
    fi

    echo ""
    echo "6️⃣ Checking nginx access logs for Socket.IO requests..."
    if [ -f /var/log/nginx/access.log ]; then
        echo "Recent Socket.IO access attempts:"
        grep "socket\.io" /var/log/nginx/access.log | tail -3 || echo "No socket.io requests found in access log"
    else
        echo "Nginx access log not found at /var/log/nginx/access.log"
    fi

    echo ""
    echo "7️⃣ Checking current nginx configuration for socket.io location..."
    if [ -f /etc/nginx/sites-enabled/marvelcollin.my.id ]; then
        echo "Current nginx config has socket.io location:"
        grep -A 10 "location /socket\.io" /etc/nginx/sites-enabled/marvelcollin.my.id || echo "❌ No socket.io location block found!"
    else
        echo "❌ Nginx site config not found at /etc/nginx/sites-enabled/marvelcollin.my.id"
        echo "Available sites:"
        ls -la /etc/nginx/sites-enabled/
    fi

    echo ""
    echo "8️⃣ Testing raw WebSocket connection..."
    echo "   Attempting direct WebSocket connection to localhost:1002"
    if command -v wscat >/dev/null 2>&1; then
        timeout 5 wscat -c ws://localhost:1002/socket.io/?EIO=4&transport=websocket 2>&1 || echo "WebSocket connection failed or timed out"
    else
        echo "wscat not available for WebSocket testing"
        echo "Install with: npm install -g wscat"
    fi

    echo ""
    echo "9️⃣ Checking Docker containers status..."
    docker ps --filter "name=misvord" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

    echo ""
    echo "🔟 Checking Docker socket container logs..."
    echo "Last 10 lines of socket container logs:"
    docker logs misvord_socket --tail=10 2>/dev/null || echo "Could not retrieve socket container logs"

    echo ""
    echo "📋 SUMMARY & NEXT STEPS:"
    echo "========================"

    # Check if socket server is accessible locally
    if curl -s http://localhost:1002/health >/dev/null 2>&1; then
        echo "✅ Socket server is running locally"
        
        # Check if accessible through domain
        DOMAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://marvelcollin.my.id/socket.io/ 2>/dev/null || echo "FAILED")
        
        if [ "$DOMAIN_STATUS" = "200" ] || [ "$DOMAIN_STATUS" = "400" ]; then
            echo "✅ Socket.IO accessible through domain"
            echo "🔍 Issue might be in frontend configuration or WebSocket upgrade"
            echo ""
            echo "RECOMMENDED ACTIONS:"
            echo "1. Check browser developer tools Network tab"
            echo "2. Look for CORS or CSP errors in browser console"
            echo "3. Try the socket diagnostics: window.runSocketDiagnostics()"
        else
            echo "❌ Socket.IO NOT accessible through domain"
            echo "🔍 Nginx is not properly proxying to Socket.IO server"
            echo ""
            echo "RECOMMENDED ACTIONS:"
            echo "1. Verify nginx config is applied: sudo nginx -s reload"
            echo "2. Check nginx site is enabled: ls -la /etc/nginx/sites-enabled/"
            echo "3. Check nginx error logs: sudo tail -f /var/log/nginx/error.log"
            echo "4. Restart nginx: sudo systemctl restart nginx"
        fi
    else
        echo "❌ Socket server is NOT running locally"
        echo "🔍 The Socket.IO server container is down or not responding"
        echo ""
        echo "RECOMMENDED ACTIONS:"
        echo "1. Check Docker containers: docker ps"
        echo "2. Restart socket container: docker-compose restart socket"
        echo "3. Check socket logs: docker logs misvord_socket"
        echo "4. Check socket environment variables in docker-compose.yml"
    fi
