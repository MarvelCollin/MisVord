#!/bin/bash

# Check if all required ports are open and containers are running

echo "=== MiscVord Port and Service Check ==="
echo "Checking if all required ports are open and services are running..."

# Check if netstat is installed
if ! command -v netstat &> /dev/null; then
    echo "netstat not found. Installing net-tools..."
    sudo apt-get update
    sudo apt-get install -y net-tools
fi

# Check if curl is installed
if ! command -v curl &> /dev/null; then
    echo "curl not found. Installing curl..."
    sudo apt-get update
    sudo apt-get install -y curl
fi

# Function to check if a port is in use
check_port() {
    PORT=$1
    SERVICE=$2
    if netstat -tuln | grep -q ":$PORT "; then
        echo "✅ Port $PORT is open and in use by $SERVICE"
    else
        echo "❌ Port $PORT is not in use. $SERVICE may not be running correctly."
    fi
}

# Check Docker status
if command -v systemctl &> /dev/null && systemctl is-active --quiet docker; then
    echo "✅ Docker service is running"
elif docker info &> /dev/null; then
    echo "✅ Docker is running (non-systemd)"
else
    echo "❌ Docker service is not running. Try: sudo systemctl start docker"
    echo "   or run: sudo service docker start"
    exit 1
fi

# Check if Docker containers are running
if docker ps | grep -q "miscvord_php"; then
    echo "✅ PHP Application container is running"
else
    echo "❌ PHP Application container is not running"
    echo "   Try: docker-compose up -d"
fi

if docker ps | grep -q "miscvord_socket"; then
    echo "✅ Socket.io server container is running"
else
    echo "❌ Socket.io server container is not running"
    echo "   Try: docker-compose up -d"
fi

if docker ps | grep -q "miscvord_db"; then
    echo "✅ MySQL database container is running"
else
    echo "❌ MySQL database container is not running"
    echo "   Try: docker-compose up -d"
fi

# Check ports
echo ""
echo "Checking ports..."
check_port 1001 "PHP Application"
check_port 1002 "Socket.io Server"
check_port 1003 "MySQL Database"
check_port 1004 "PHPMyAdmin"
check_port 1005 "Adminer"

# Check domain connectivity
echo ""
echo "Checking domain connectivity..."
if ping -c 1 marvelcollin.my.id &> /dev/null; then
    echo "✅ Domain marvelcollin.my.id is pingable"
else
    echo "❌ Domain marvelcollin.my.id is not pingable. Check DNS settings."
fi

# Curl tests for HTTP/HTTPS connectivity
echo ""
echo "Testing HTTP/HTTPS connectivity..."

# Test HTTP
echo "Testing HTTP connections..."
timeout 5 curl -I -s http://localhost:1001 > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ HTTP connection to main application is working"
elif [ $? -eq 124 ]; then
    echo "⚠️ HTTP connection to main application timed out"
else
    echo "❌ HTTP connection to main application failed"
fi

timeout 5 curl -I -s http://localhost:1002 > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ HTTP connection to socket server is working"
elif [ $? -eq 124 ]; then
    echo "⚠️ HTTP connection to socket server timed out"
else
    echo "❌ HTTP connection to socket server failed"
fi

# Test HTTPS if available
echo "Testing HTTPS connections..."
if timeout 5 curl -I -s -k https://localhost:1001 > /dev/null; then
    echo "✅ HTTPS connection to main application is working"
else
    echo "ℹ️ HTTPS might not be configured for main application yet"
fi

if timeout 5 curl -I -s -k https://localhost:1002 > /dev/null; then
    echo "✅ HTTPS connection to socket server is working"
else
    echo "ℹ️ HTTPS might not be configured for socket server yet"
fi

# Check public URL if domain is set up
if host marvelcollin.my.id &> /dev/null; then
    echo "Testing public domain connections..."
    if timeout 5 curl -I -s -k https://marvelcollin.my.id:1001 > /dev/null; then
        echo "✅ Public HTTPS connection to main application is working"
    else
        echo "⚠️ Public HTTPS connection to main application failed"
    fi
fi

echo ""
echo "=== Check Complete ==="
echo "If any services are not running, check Docker logs with:"
echo "docker logs miscvord_php"
echo "docker logs miscvord_socket"
echo "docker logs miscvord_db"
echo ""
echo "To restart services:"
echo "docker-compose restart" 