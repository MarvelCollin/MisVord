#!/bin/bash

# Quick WebSocket Test Script
# This script performs a rapid WebSocket connectivity test

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Get environment value
get_env_value() {
    local key="$1"
    grep "^${key}=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- | sed 's/^"//' | sed 's/"$//' || echo ""
}

# Main test function
run_websocket_test() {
    print_status "Starting WebSocket connectivity test..."
    
    local domain=$(get_env_value 'DOMAIN')
    local is_vps=$(get_env_value 'IS_VPS')
    local socket_secure=$(get_env_value 'SOCKET_SECURE')
    local use_https=$(get_env_value 'USE_HTTPS')
    
    echo "Configuration:"
    echo "  Domain: $domain"
    echo "  VPS Mode: $is_vps"
    echo "  Socket Secure: $socket_secure"
    echo "  Use HTTPS: $use_https"
    echo ""
    
    # Test 1: Socket health endpoint
    print_status "Test 1: Socket health endpoint"
    
    if [ "$is_vps" = "true" ]; then
        local health_url="https://$domain/socket-health"
        if curl -s -k --max-time 10 "$health_url" | grep -q '"status":"ok"'; then
            print_pass "Socket health endpoint accessible via HTTPS"
        else
            print_fail "Socket health endpoint not accessible via HTTPS"
            
            # Try HTTP fallback
            local http_health_url="http://$domain/socket-health"
            if curl -s --max-time 10 "$http_health_url" | grep -q '"status":"ok"'; then
                print_warn "Socket health accessible via HTTP but not HTTPS"
            else
                print_fail "Socket health not accessible via HTTP either"
            fi
        fi
    else
        local health_url="http://localhost:1002/health"
        if curl -s --max-time 10 "$health_url" | grep -q '"status":"ok"'; then
            print_pass "Local socket health endpoint accessible"
        else
            print_fail "Local socket health endpoint not accessible"
        fi
    fi
    
    # Test 2: Socket.IO polling endpoint
    print_status "Test 2: Socket.IO polling endpoint"
    
    if [ "$is_vps" = "true" ]; then
        local protocol="https"
        if [ "$use_https" != "true" ]; then
            protocol="http"
        fi
        
        local polling_url="${protocol}://${domain}/socket.io/?EIO=4&transport=polling"
        local response=$(curl -s -k --max-time 10 "$polling_url" 2>/dev/null || echo "")
        
        if echo "$response" | grep -q "0{"; then
            print_pass "Socket.IO polling endpoint working"
        else
            print_fail "Socket.IO polling endpoint not working"
            echo "  Response: ${response:0:50}..."
        fi
    else
        local polling_url="http://localhost:1002/socket.io/?EIO=4&transport=polling"
        local response=$(curl -s --max-time 10 "$polling_url" 2>/dev/null || echo "")
        
        if echo "$response" | grep -q "0{"; then
            print_pass "Local Socket.IO polling endpoint working"
        else
            print_fail "Local Socket.IO polling endpoint not working"
            echo "  Response: ${response:0:50}..."
        fi
    fi
    
    # Test 3: WebSocket upgrade test
    print_status "Test 3: WebSocket upgrade capability"
    
    if [ "$is_vps" = "true" ]; then
        local protocol="wss"
        if [ "$socket_secure" != "true" ]; then
            protocol="ws"
        fi
        
        local ws_url="${protocol}://${domain}/socket.io/?EIO=4&transport=websocket"
        
        # Test WebSocket upgrade headers
        local upgrade_response=$(curl -i -s -k --max-time 10 \
            -H "Connection: Upgrade" \
            -H "Upgrade: websocket" \
            -H "Sec-WebSocket-Version: 13" \
            -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
            "$ws_url" 2>/dev/null || echo "")
        
        if echo "$upgrade_response" | grep -q "101 Switching Protocols"; then
            print_pass "WebSocket upgrade successful"
        elif echo "$upgrade_response" | grep -q "200 OK"; then
            print_warn "HTTP connection works but WebSocket upgrade may have issues"
        else
            print_fail "WebSocket upgrade failed"
            echo "  Response: ${upgrade_response:0:100}..."
        fi
    else
        print_warn "Local WebSocket upgrade test skipped (requires wscat)"
    fi
    
    # Test 4: Docker container status
    print_status "Test 4: Docker container status"
    
    if command -v docker >/dev/null 2>&1; then
        local socket_status=$(docker ps --format "{{.Names}}\t{{.Status}}" | grep "misvord_socket" || echo "")
        local app_status=$(docker ps --format "{{.Names}}\t{{.Status}}" | grep "misvord_php" || echo "")
        
        if [ -n "$socket_status" ]; then
            print_pass "Socket container running: $socket_status"
        else
            print_fail "Socket container not running"
        fi
        
        if [ -n "$app_status" ]; then
            print_pass "App container running: $app_status"
        else
            print_fail "App container not running"
        fi
    else
        print_warn "Docker not available, skipping container check"
    fi
    
    echo ""
    print_status "WebSocket test complete"
    
    # Summary and recommendations
    echo ""
    echo "=== RECOMMENDATIONS ==="
    
    if [ "$is_vps" = "true" ]; then
        echo "1. Ensure nginx configuration includes Socket.IO proxy"
        echo "2. Verify SSL certificates are properly configured"
        echo "3. Check that ports 80 and 443 are open in firewall"
        echo "4. Run full diagnostics: ./scripts/diagnose-websocket.sh"
    else
        echo "1. Ensure Docker containers are running: docker-compose up -d"
        echo "2. Check that port 1002 is not blocked"
        echo "3. Verify local environment: ./scripts/configure-environment.sh verify"
    fi
    
    echo ""
    echo "Expected frontend WebSocket URL:"
    if [ "$is_vps" = "true" ]; then
        local protocol="wss"
        if [ "$socket_secure" != "true" ]; then
            protocol="ws"
        fi
        echo "  ${protocol}://${domain}/socket.io/"
    else
        echo "  ws://localhost:1002/socket.io/"
    fi
}

# Execute the test
if [ ! -f "$ENV_FILE" ]; then
    print_fail ".env file not found at $ENV_FILE"
    exit 1
fi

run_websocket_test
