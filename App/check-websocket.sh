#!/bin/bash

# WebSocket Connectivity Diagnostic Tool for VPS
# This script checks for common WebSocket issues on a VPS environment
# Usage: ./check-websocket.sh [domain] [port]

DOMAIN=${1:-"$(hostname -f)"}
PORT=${2:-"1002"}
SUBPATH=${3:-"misvord"}

echo -e "\n===== WebSocket Connectivity Diagnostic Tool ====="
echo "Testing domain: $DOMAIN"
echo "Socket server port: $PORT"
echo "Subpath: $SUBPATH"
echo "=========================================="

echo -e "\n1. Checking if socket server is running..."
if pgrep -f "node.*socket-server" > /dev/null; then
    echo "✅ Socket server is running"
    SERVER_PID=$(pgrep -f "node.*socket-server")
    echo "   Process ID: $SERVER_PID"
else
    echo "❌ Socket server is NOT running"
    echo "   Try starting it with: pm2 start socket-server.js --name misvord-socket"
fi

echo -e "\n2. Checking if port $PORT is listening..."
if netstat -tuln | grep ":$PORT " > /dev/null; then
    echo "✅ Port $PORT is listening"
    netstat -tuln | grep ":$PORT "
else
    echo "❌ Port $PORT is NOT listening"
    echo "   Check if the server is configured to use port $PORT"
fi

echo -e "\n3. Checking if Nginx is running..."
if systemctl is-active nginx > /dev/null; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is NOT running"
    echo "   Try starting it with: systemctl start nginx"
fi

echo -e "\n4. Testing Socket.IO HTTP endpoint..."
SOCKET_URL="https://$DOMAIN/$SUBPATH/socket/socket-test"
HTTP_RESULT=$(curl -s -o /dev/null -w "%{http_code}" "$SOCKET_URL")
if [ "$HTTP_RESULT" == "200" ]; then
    echo "✅ Socket.IO HTTP endpoint is reachable ($SOCKET_URL)"
    echo "   Status code: $HTTP_RESULT"
else
    echo "❌ Socket.IO HTTP endpoint returned error: $HTTP_RESULT ($SOCKET_URL)"
    echo "   Full response:"
    curl -i "$SOCKET_URL"
fi

echo -e "\n5. Checking Nginx configuration for WebSocket support..."
CONFIG_FILE=$(find /etc/nginx -name "*$SUBPATH*" -o -name "*.conf" | xargs grep -l "$SUBPATH")
if [ -n "$CONFIG_FILE" ]; then
    echo "✅ Found Nginx configuration: $CONFIG_FILE"
    
    if grep -q "proxy_http_version 1.1" "$CONFIG_FILE"; then
        echo "✅ proxy_http_version 1.1 found"
    else
        echo "❌ Missing proxy_http_version 1.1"
    fi
    
    if grep -q "proxy_set_header Upgrade" "$CONFIG_FILE"; then
        echo "✅ proxy_set_header Upgrade found"
    else
        echo "❌ Missing proxy_set_header Upgrade"
    fi
    
    if grep -q "proxy_set_header Connection \"upgrade\"" "$CONFIG_FILE"; then
        echo "✅ proxy_set_header Connection 'upgrade' found"
    else
        echo "❌ Missing proxy_set_header Connection 'upgrade'"
    fi
    
    if grep -q "proxy_pass.*$PORT" "$CONFIG_FILE"; then
        echo "✅ proxy_pass to port $PORT found"
    else
        echo "❌ Missing proxy_pass to port $PORT"
    fi
else
    echo "❌ Could not find Nginx configuration for $SUBPATH"
fi

echo -e "\n6. Testing WebSocket connectivity with wscat (if installed)..."
if command -v wscat > /dev/null; then
    echo "Attempting WebSocket connection to wss://$DOMAIN/$SUBPATH/socket/socket.io/?EIO=4&transport=websocket"
    echo "This will timeout after 5 seconds if it fails..."
    timeout 5s wscat -c "wss://$DOMAIN/$SUBPATH/socket/socket.io/?EIO=4&transport=websocket" || echo "❌ WebSocket connection failed"
else
    echo "wscat not installed. Install with: npm install -g wscat"
fi

echo -e "\n7. Checking for firewall restrictions..."
if command -v ufw > /dev/null; then
    echo "UFW status:"
    ufw status verbose
    
    if ufw status | grep -q "$PORT/tcp.*ALLOW"; then
        echo "✅ Port $PORT is allowed in UFW"
    else
        echo "❌ Port $PORT might be blocked by UFW"
        echo "   Consider allowing it with: sudo ufw allow $PORT/tcp"
    fi
else
    echo "UFW is not installed or not accessible"
fi

echo -e "\n8. SSL Certificate check..."
if command -v openssl > /dev/null; then
    echo "Checking SSL certificate for $DOMAIN:"
    echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates
else
    echo "OpenSSL is not installed or not accessible"
fi

echo -e "\n===== FINAL RECOMMENDATIONS ====="
echo "If you're experiencing WebSocket issues:"
echo "1. Make sure Socket.IO server is running on port $PORT"
echo "2. Check Nginx config includes all WebSocket headers"
echo "3. Ensure SSL certificates are valid for WSS connections"
echo "4. Test with the socket-test.html page available at https://$DOMAIN/$SUBPATH/socket-test.html"
echo "5. Check browser console for detailed error messages"

echo -e "\nRecommended Nginx Configuration:"
echo "------------------------"
echo "location /$SUBPATH/socket/ {"
echo "    rewrite ^/$SUBPATH/socket/(.*) /\$1 break;"
echo "    proxy_pass http://localhost:$PORT;"
echo "    proxy_http_version 1.1;"
echo "    proxy_set_header Upgrade \$http_upgrade;"
echo "    proxy_set_header Connection \"upgrade\";"
echo "    proxy_set_header Host \$host;"
echo "    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;"
echo "    proxy_set_header X-Forwarded-Proto \$scheme;"
echo "}"
echo "------------------------" 