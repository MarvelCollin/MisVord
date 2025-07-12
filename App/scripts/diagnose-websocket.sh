#!/bin/bash

# WebSocket Diagnostic Script for MisVord
# This script tests WebSocket connectivity from both client and server perspectives

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to get environment value
get_env_value() {
    local key="$1"
    grep "^${key}=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- | sed 's/^"//' | sed 's/"$//' || echo ""
}

# Test Socket.IO server health
test_socket_health() {
    print_info "Testing Socket.IO server health..."
    
    local socket_port=$(get_env_value 'SOCKET_PORT')
    local domain=$(get_env_value 'DOMAIN')
    local is_vps=$(get_env_value 'IS_VPS')
    
    if [ "$is_vps" = "true" ]; then
        # Test via nginx proxy
        local health_url="https://$domain/socket-health"
        print_info "Testing VPS socket health: $health_url"
        
        if curl -s -k "$health_url" > /dev/null; then
            print_success "Socket server is healthy via nginx proxy"
            curl -s -k "$health_url" | jq . 2>/dev/null || curl -s -k "$health_url"
        else
            print_error "Socket server health check failed via nginx proxy"
            
            # Fallback to direct connection
            local direct_url="http://localhost:1002/health"
            print_info "Testing direct socket connection: $direct_url"
            
            if curl -s "$direct_url" > /dev/null; then
                print_warning "Socket server is healthy directly but nginx proxy is failing"
                curl -s "$direct_url" | jq . 2>/dev/null || curl -s "$direct_url"
            else
                print_error "Socket server is not responding at all"
            fi
        fi
    else
        # Test local development
        local health_url="http://localhost:${socket_port:-1002}/health"
        print_info "Testing local socket health: $health_url"
        
        if curl -s "$health_url" > /dev/null; then
            print_success "Socket server is healthy locally"
            curl -s "$health_url" | jq . 2>/dev/null || curl -s "$health_url"
        else
            print_error "Local socket server health check failed"
        fi
    fi
}

# Test WebSocket connection using wscat if available
test_websocket_connection() {
    print_info "Testing WebSocket connection..."
    
    local domain=$(get_env_value 'DOMAIN')
    local socket_secure=$(get_env_value 'SOCKET_SECURE')
    local is_vps=$(get_env_value 'IS_VPS')
    
    if [ "$is_vps" = "true" ]; then
        local protocol="ws"
        if [ "$socket_secure" = "true" ]; then
            protocol="wss"
        fi
        
        local ws_url="${protocol}://${domain}/socket.io/?EIO=4&transport=websocket"
        print_info "Testing VPS WebSocket: $ws_url"
        
        # Test with curl upgrade
        if command -v curl >/dev/null 2>&1; then
            local result=$(curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" "$ws_url" 2>&1 || true)
            
            if echo "$result" | grep -q "101 Switching Protocols"; then
                print_success "WebSocket upgrade successful"
            elif echo "$result" | grep -q "200 OK"; then
                print_warning "HTTP connection successful but WebSocket upgrade may have issues"
            else
                print_error "WebSocket connection failed"
                echo "Response: $result"
            fi
        fi
    else
        local ws_url="ws://localhost:1002/socket.io/?EIO=4&transport=websocket"
        print_info "Testing local WebSocket: $ws_url"
        
        if command -v wscat >/dev/null 2>&1; then
            print_info "Using wscat for WebSocket test..."
            timeout 5 wscat -c "$ws_url" --subprotocol echo-protocol 2>&1 || print_warning "wscat test completed (timeout is normal)"
        else
            print_warning "wscat not available, skipping direct WebSocket test"
        fi
    fi
}

# Test Socket.IO polling endpoint
test_socket_polling() {
    print_info "Testing Socket.IO polling endpoint..."
    
    local domain=$(get_env_value 'DOMAIN')
    local use_https=$(get_env_value 'USE_HTTPS')
    local is_vps=$(get_env_value 'IS_VPS')
    
    if [ "$is_vps" = "true" ]; then
        local protocol="http"
        if [ "$use_https" = "true" ]; then
            protocol="https"
        fi
        
        local polling_url="${protocol}://${domain}/socket.io/?EIO=4&transport=polling"
        print_info "Testing VPS Socket.IO polling: $polling_url"
        
        local response=$(curl -s -k "$polling_url" 2>&1 || true)
        
        if echo "$response" | grep -q "0{"; then
            print_success "Socket.IO polling endpoint is working"
            echo "Response: ${response:0:100}..."
        else
            print_error "Socket.IO polling endpoint failed"
            echo "Response: $response"
        fi
    else
        local polling_url="http://localhost:1002/socket.io/?EIO=4&transport=polling"
        print_info "Testing local Socket.IO polling: $polling_url"
        
        local response=$(curl -s "$polling_url" 2>&1 || true)
        
        if echo "$response" | grep -q "0{"; then
            print_success "Socket.IO polling endpoint is working"
            echo "Response: ${response:0:100}..."
        else
            print_error "Socket.IO polling endpoint failed"
            echo "Response: $response"
        fi
    fi
}

# Check Docker container status
check_docker_containers() {
    print_info "Checking Docker container status..."
    
    if command -v docker >/dev/null 2>&1; then
        local containers=("misvord_php" "misvord_socket" "misvord_db")
        
        for container in "${containers[@]}"; do
            if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$container"; then
                local status=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep "$container" | awk '{for(i=2;i<=NF;i++) printf "%s ", $i; print ""}')
                print_success "$container: $status"
            else
                print_error "$container: Not running"
            fi
        done
        
        # Check socket container logs
        print_info "Recent socket container logs:"
        docker logs misvord_socket --tail 10 2>/dev/null || print_warning "Cannot access socket container logs"
        
    else
        print_warning "Docker not available, skipping container check"
    fi
}

# Check nginx configuration (if running on VPS)
check_nginx_config() {
    local is_vps=$(get_env_value 'IS_VPS')
    
    if [ "$is_vps" = "true" ]; then
        print_info "Checking nginx configuration..."
        
        local domain=$(get_env_value 'DOMAIN')
        local nginx_config="/etc/nginx/sites-available/$domain"
        
        if [ -f "$nginx_config" ]; then
            print_success "Nginx config found: $nginx_config"
            
            # Check if socket.io location is configured
            if grep -q "location /socket.io/" "$nginx_config"; then
                print_success "Socket.IO proxy configuration found"
            else
                print_error "Socket.IO proxy configuration missing"
            fi
            
            # Check nginx syntax
            if command -v nginx >/dev/null 2>&1; then
                if nginx -t 2>/dev/null; then
                    print_success "Nginx configuration syntax is valid"
                else
                    print_error "Nginx configuration syntax error"
                    nginx -t
                fi
            fi
            
        else
            print_error "Nginx config not found: $nginx_config"
        fi
    else
        print_info "Not running in VPS mode, skipping nginx check"
    fi
}

# Generate comprehensive report
generate_report() {
    print_info "Generating comprehensive WebSocket diagnostic report..."
    
    echo ""
    echo "=== ENVIRONMENT CONFIGURATION ==="
    echo "IS_VPS: $(get_env_value 'IS_VPS')"
    echo "IS_DOCKER: $(get_env_value 'IS_DOCKER')"
    echo "DOMAIN: $(get_env_value 'DOMAIN')"
    echo "USE_HTTPS: $(get_env_value 'USE_HTTPS')"
    echo "SOCKET_HOST: $(get_env_value 'SOCKET_HOST')"
    echo "SOCKET_PORT: $(get_env_value 'SOCKET_PORT')"
    echo "SOCKET_SECURE: $(get_env_value 'SOCKET_SECURE')"
    echo "CORS_ALLOWED_ORIGINS: $(get_env_value 'CORS_ALLOWED_ORIGINS')"
    
    echo ""
    echo "=== EXPECTED FRONTEND SOCKET URL ==="
    local domain=$(get_env_value 'DOMAIN')
    local socket_secure=$(get_env_value 'SOCKET_SECURE')
    local socket_port=$(get_env_value 'SOCKET_PORT')
    
    local protocol="ws"
    if [ "$socket_secure" = "true" ]; then
        protocol="wss"
    fi
    
    if [ -n "$socket_port" ]; then
        echo "${protocol}://${domain}:${socket_port}/socket.io/"
    else
        echo "${protocol}://${domain}/socket.io/"
    fi
    
    echo ""
    check_docker_containers
    echo ""
    test_socket_health
    echo ""
    test_socket_polling
    echo ""
    test_websocket_connection
    echo ""
    check_nginx_config
}

# Main execution
main() {
    local command="$1"
    
    if [ ! -f "$ENV_FILE" ]; then
        print_error ".env file not found at $ENV_FILE"
        exit 1
    fi
    
    case "$command" in
        "health")
            test_socket_health
            ;;
        
        "websocket")
            test_websocket_connection
            ;;
        
        "polling")
            test_socket_polling
            ;;
        
        "containers")
            check_docker_containers
            ;;
        
        "nginx")
            check_nginx_config
            ;;
        
        "report"|"")
            generate_report
            ;;
        
        *)
            echo "Usage: $0 {health|websocket|polling|containers|nginx|report}"
            echo ""
            echo "Commands:"
            echo "  health    - Test Socket.IO server health endpoint"
            echo "  websocket - Test WebSocket connection"
            echo "  polling   - Test Socket.IO polling endpoint"
            echo "  containers- Check Docker container status"
            echo "  nginx     - Check nginx configuration"
            echo "  report    - Generate comprehensive diagnostic report"
            exit 1
            ;;
    esac
}

# Execute main function with all arguments
main "$@"
