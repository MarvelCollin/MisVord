#!/bin/bash

echo "🔍 MisVord Docker Configuration Verification"
echo "=========================================="

# Check if .env exists
if [ -f ".env" ]; then
    echo "✅ .env file exists"
else
    echo "❌ .env file missing - copy .env.example to .env"
    exit 1
fi

# Check if Docker is running
if docker info > /dev/null 2>&1; then
    echo "✅ Docker is running"
else
    echo "❌ Docker is not running"
    exit 1
fi

# Check if docker-compose is available
if command -v docker-compose > /dev/null 2>&1; then
    echo "✅ Docker Compose is available"
else
    echo "❌ Docker Compose is not available"
    exit 1
fi

# Validate environment variables
echo ""
echo "🔧 Validating Environment Variables:"

# Required variables
required_vars=("DB_PASS" "GOOGLE_CLIENT_ID" "GOOGLE_CLIENT_SECRET")

for var in "${required_vars[@]}"; do
    if grep -q "^${var}=" .env && ! grep -q "^${var}=your_" .env; then
        echo "✅ $var is configured"
    else
        echo "⚠️  $var needs to be configured in .env"
    fi
done

# Check port configurations
echo ""
echo "🔌 Port Configuration Check:"
ports=("1001" "1002" "1003" "1004")

for port in "${ports[@]}"; do
    if lsof -i:$port > /dev/null 2>&1; then
        echo "⚠️  Port $port is already in use"
    else
        echo "✅ Port $port is available"
    fi
done

echo ""
echo "🚀 Ready to start with: docker-compose up -d"
