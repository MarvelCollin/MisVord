#!/bin/bash

# Environment Configuration Script for MisVord
# This script ensures proper socket configuration for both Docker and VPS environments

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

# Function to update environment value
update_env() {
    local key="$1"
    local value="$2"
    
    if [ -f "$ENV_FILE" ]; then
        if grep -q "^${key}=" "$ENV_FILE"; then
            sed -i.bak "s|^${key}=.*|${key}=\"${value}\"|" "$ENV_FILE"
        else
            echo "${key}=\"${value}\"" >> "$ENV_FILE"
        fi
    else
        echo "${key}=\"${value}\"" > "$ENV_FILE"
    fi
}

# Function to configure environment for Docker + VPS
configure_vps_environment() {
    local domain="$1"
    local use_https="$2"
    
    print_info "Configuring environment for VPS deployment..."
    
    # Core VPS settings
    update_env "IS_VPS" "true"
    update_env "IS_DOCKER" "true"
    update_env "DOMAIN" "$domain"
    update_env "USE_HTTPS" "$use_https"
    
    # Socket configuration for VPS
    update_env "SOCKET_HOST" "$domain"
    update_env "SOCKET_PORT" ""  # Empty for VPS (uses nginx proxy)
    update_env "SOCKET_SECURE" "$use_https"
    update_env "SOCKET_BASE_PATH" "/socket.io"
    
    # CORS configuration
    if [ "$use_https" = "true" ]; then
        update_env "APP_URL" "https://$domain"
        CORS_ORIGINS="https://$domain,https://www.$domain,http://$domain,http://www.$domain,http://app:1001,http://localhost:1001,https://localhost:1001"
    else
        update_env "APP_URL" "http://$domain"
        CORS_ORIGINS="http://$domain,https://$domain,https://www.$domain,http://www.$domain,http://app:1001,http://localhost:1001,https://localhost:1001"
    fi
    
    update_env "CORS_ALLOWED_ORIGINS" "$CORS_ORIGINS"
    
    print_success "VPS environment configured"
}

# Function to configure environment for local Docker
configure_local_environment() {
    print_info "Configuring environment for local Docker development..."
    
    # Core local settings
    update_env "IS_VPS" "false"
    update_env "IS_DOCKER" "true"
    update_env "DOMAIN" "localhost"
    update_env "USE_HTTPS" "false"
    
    # Socket configuration for local
    update_env "SOCKET_HOST" "localhost"
    update_env "SOCKET_PORT" "1002"
    update_env "SOCKET_SECURE" "false"
    update_env "SOCKET_BASE_PATH" "/socket.io"
    
    # CORS configuration for local
    update_env "APP_URL" "http://localhost:1001"
    update_env "CORS_ALLOWED_ORIGINS" "http://localhost:1001,http://127.0.0.1:1001,http://app:1001"
    
    print_success "Local environment configured"
}

# Function to verify socket configuration
verify_socket_configuration() {
    print_info "Verifying socket configuration..."
    
    local is_vps=$(get_env_value 'IS_VPS')
    local domain=$(get_env_value 'DOMAIN')
    local socket_host=$(get_env_value 'SOCKET_HOST')
    local socket_port=$(get_env_value 'SOCKET_PORT')
    local socket_secure=$(get_env_value 'SOCKET_SECURE')
    local use_https=$(get_env_value 'USE_HTTPS')
    
    echo "Current configuration:"
    echo "  IS_VPS: $is_vps"
    echo "  DOMAIN: $domain"
    echo "  SOCKET_HOST: $socket_host"
    echo "  SOCKET_PORT: $socket_port"
    echo "  SOCKET_SECURE: $socket_secure"
    echo "  USE_HTTPS: $use_https"
    
    # Determine expected frontend socket URL
    local protocol="ws"
    if [ "$socket_secure" = "true" ]; then
        protocol="wss"
    fi
    
    local socket_url
    if [ -n "$socket_port" ]; then
        socket_url="${protocol}://${socket_host}:${socket_port}/socket.io/"
    else
        socket_url="${protocol}://${socket_host}/socket.io/"
    fi
    
    echo "  Expected Socket URL: $socket_url"
    
    # Validate configuration
    local valid=true
    
    if [ "$is_vps" = "true" ]; then
        if [ "$socket_host" != "$domain" ]; then
            print_warning "VPS mode: SOCKET_HOST should match DOMAIN"
            valid=false
        fi
        
        if [ -n "$socket_port" ]; then
            print_warning "VPS mode: SOCKET_PORT should be empty (nginx proxy)"
            valid=false
        fi
        
        if [ "$use_https" = "true" ] && [ "$socket_secure" != "true" ]; then
            print_warning "HTTPS enabled but SOCKET_SECURE is not true"
            valid=false
        fi
    else
        if [ "$socket_host" != "localhost" ]; then
            print_warning "Local mode: SOCKET_HOST should be localhost"
            valid=false
        fi
        
        if [ "$socket_port" != "1002" ]; then
            print_warning "Local mode: SOCKET_PORT should be 1002"
            valid=false
        fi
    fi
    
    if [ "$valid" = "true" ]; then
        print_success "Socket configuration is valid"
    else
        print_error "Socket configuration issues detected"
        return 1
    fi
}

# Main execution
main() {
    local mode="$1"
    local domain="$2"
    local use_https="$3"
    
    if [ ! -f "$ENV_FILE" ]; then
        print_warning ".env file not found, creating new one"
        touch "$ENV_FILE"
    fi
    
    case "$mode" in
        "vps")
            if [ -z "$domain" ]; then
                print_error "Domain required for VPS mode"
                echo "Usage: $0 vps <domain> [true|false]"
                exit 1
            fi
            
            use_https="${use_https:-true}"
            configure_vps_environment "$domain" "$use_https"
            ;;
        
        "local")
            configure_local_environment
            ;;
        
        "verify")
            verify_socket_configuration
            ;;
        
        *)
            echo "Usage: $0 {vps|local|verify} [domain] [use_https]"
            echo ""
            echo "Examples:"
            echo "  $0 vps marvelcollin.my.id true"
            echo "  $0 local"
            echo "  $0 verify"
            exit 1
            ;;
    esac
    
    # Always verify after configuration
    if [ "$mode" != "verify" ]; then
        echo ""
        verify_socket_configuration
    fi
}

# Execute main function with all arguments
main "$@"
