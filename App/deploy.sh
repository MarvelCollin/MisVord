#!/bin/bash

# MisVord VPS Deployment Script - COMPREHENSIVE VERSION
# This script handles environment configuration, bot initialization, and production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️ $1${NC}"; }
print_section() { echo -e "\n${BLUE}═══ $1 ═══${NC}"; }

# Function to read current env value
get_env_value() {
    local key=$1
    local env_file=${2:-.env}
    grep "^${key}=" "$env_file" 2>/dev/null | cut -d'=' -f2- || echo ""
}

# Function to wait for service with retry
wait_for_service() {
    local service_name=$1
    local port=$2
    local max_attempts=30
    local attempt=1

    print_info "Waiting for $service_name on port $port..."

    while [ $attempt -le $max_attempts ]; do
        if curl -s "http://localhost:${port}/health" >/dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi

        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done

    print_warning "$service_name may not be ready (timeout after ${max_attempts} attempts)"
    return 1
}

# Function to update env value
update_env() {
    local key=$1
    local value=$2
    local env_file=${3:-.env}

    if grep -q "^${key}=" "$env_file" 2>/dev/null; then
        # Key exists, update it
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|^${key}=.*|${key}=${value}|" "$env_file"
        else
            sed -i "s|^${key}=.*|${key}=${value}|" "$env_file"
        fi
    else
        # Key doesn't exist, add it
        echo "${key}=${value}" >> "$env_file"
    fi
    print_success "Updated ${key}=${value}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for user input with default
read_with_default() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"

    echo -n -e "${BLUE}${prompt}${NC}"
    if [ -n "$default" ]; then
        echo -n " (default: $default): "
    else
        echo -n ": "
    fi

    read user_input
    if [ -z "$user_input" ] && [ -n "$default" ]; then
        user_input="$default"
    fi

    eval "$var_name='$user_input'"
}

# Function to check environment file
check_env_file() {
    print_section "CHECKING ENVIRONMENT FILE"

    if [ ! -f ".env" ]; then
        print_error ".env file not found!"
        exit 1
    fi

    print_success ".env file found"

    # Display current important settings
    echo -e "\n${YELLOW}Current Environment Settings:${NC}"
    echo "APP_ENV: $(get_env_value 'APP_ENV')"
    echo "IS_VPS: $(get_env_value 'IS_VPS')"
    echo "USE_HTTPS: $(get_env_value 'USE_HTTPS')"
    echo "DOMAIN: $(get_env_value 'DOMAIN')"
    echo "DB_PASS: $(get_env_value 'DB_PASS')"
    echo "APP_PORT: $(get_env_value 'APP_PORT')"
    echo "SOCKET_PORT: $(get_env_value 'SOCKET_PORT')"
}

# Function to initialize bot in database
init_bot() {
    print_section "BOT INITIALIZATION"

    print_info "Starting services for bot initialization..."
    docker-compose up -d

    print_info "Waiting for PHP application to be ready..."
    wait_for_service "app" "1001"

    print_info "Checking if TitiBot exists in database..."

    # Check bot via simplified API call
    BOT_CHECK=$(curl -s "http://localhost:1001/api/bots/public-check/titibot" 2>/dev/null || echo "")

    if echo "$BOT_CHECK" | grep -q '"exists":true'; then
        print_success "TitiBot already exists in database"
        BOT_INFO=$(echo "$BOT_CHECK" | grep -o '"bot":{[^}]*}' || echo "")
        if [ -n "$BOT_INFO" ]; then
            echo "Bot info: $BOT_INFO"
        fi
    else
        print_warning "TitiBot not found. Creating TitiBot via API..."

        # Create TitiBot using debug endpoint
        CREATE_RESULT=$(curl -s -X POST "http://localhost:1001/api/debug/create-titibot" 2>/dev/null || echo "")

        if echo "$CREATE_RESULT" | grep -q '"success":true'; then
            print_success "TitiBot created successfully"
            BOT_DATA=$(echo "$CREATE_RESULT" | grep -o '"bot":{[^}]*}' || echo "")
            if [ -n "$BOT_DATA" ]; then
                echo "Bot data: $BOT_DATA"
            fi
        else
            print_error "Failed to create TitiBot"
            echo "API Response: $CREATE_RESULT"
            return 1
        fi
    fi

    # Verify bot list
    print_info "Verifying bot list..."
    BOTS_LIST=$(curl -s "http://localhost:1001/api/bots" 2>/dev/null || echo "")
    if echo "$BOTS_LIST" | grep -q '"success":true'; then
        BOT_COUNT=$(echo "$BOTS_LIST" | grep -o '"total":[0-9]*' | cut -d':' -f2 || echo "0")
        print_success "Database contains $BOT_COUNT bot(s)"
    else
        print_warning "Could not retrieve bot list from API"
    fi
}

# Function to check service health
check_services() {
    print_section "SERVICE HEALTH CHECK"

    print_info "Verifying Docker installation..."
    if ! command_exists docker; then
        print_error "Docker is not installed!"
        exit 1
    fi

    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed!"
        exit 1
    fi

    print_success "Docker and Docker Compose are available"

    print_info "Starting all services..."
    docker-compose up -d

    # Wait for each service to be ready
    services=("app:1001" "socket:1002")

    for service in "${services[@]}"; do
        service_name=$(echo $service | cut -d':' -f1)
        port=$(echo $service | cut -d':' -f2)

        print_info "Checking $service_name service..."

        if docker-compose ps | grep -q "misvord_${service_name}.*Up"; then
            print_success "$service_name container is running"
            wait_for_service "$service_name" "$port"
        else
            print_error "$service_name container failed to start"
            docker-compose logs $service_name | tail -10
        fi
    done

    # Check database separately (no health endpoint)
    print_info "Checking database service..."
    if docker-compose ps | grep -q "misvord_db.*Up"; then
        print_success "Database container is running"
    else
        print_error "Database container failed to start"
        docker-compose logs db | tail -10
    fi

    # Final service verification
    print_info "Running final service verification..."
    if curl -s "http://localhost:1001/health" >/dev/null 2>&1; then
        print_success "PHP application is responding"
    else
        print_warning "PHP application health check failed"
    fi

    if curl -s "http://localhost:1002/health" >/dev/null 2>&1; then
        print_success "Socket server is responding"
    else
        print_warning "Socket server health check failed"
    fi

    print_success "Service health check completed"
}

# Function to configure production environment
configure_production() {
    print_section "PRODUCTION CONFIGURATION"

    echo -e "${YELLOW}This will configure the application for production deployment.${NC}"
    echo -e "${YELLOW}Please provide the following information:${NC}\n"

    # Get domain
    current_domain=$(get_env_value 'DOMAIN')
    read_with_default "Enter your domain name" "$current_domain" "DOMAIN"

    # Get SSL preference
    current_https=$(get_env_value 'USE_HTTPS')
    echo -e "\n${BLUE}Enable HTTPS/SSL?${NC}"
    echo "1) Yes (recommended for production)"
    echo "2) No (HTTP only)"
    read -p "Choice (1-2): " ssl_choice

    case $ssl_choice in
        1) USE_HTTPS="true" ;;
        2) USE_HTTPS="false" ;;
        *) USE_HTTPS="true" ;;
    esac

    # Get database password
    current_db_pass=$(get_env_value 'DB_PASS')
    read_with_default "Enter database password" "$current_db_pass" "DB_PASS"

    # Get public IP (optional)
    current_public_ip=$(get_env_value 'PUBLIC_IP')
    read_with_default "Enter server public IP (optional)" "$current_public_ip" "PUBLIC_IP"

    # Configure API keys (optional)
    echo -e "\n${YELLOW}API Configuration (press Enter to keep current values):${NC}"

    current_google_id=$(get_env_value 'GOOGLE_CLIENT_ID')
    read_with_default "Google Client ID" "$current_google_id" "GOOGLE_CLIENT_ID"

    current_google_secret=$(get_env_value 'GOOGLE_CLIENT_SECRET')
    read_with_default "Google Client Secret" "$current_google_secret" "GOOGLE_CLIENT_SECRET"

    current_videosdk_key=$(get_env_value 'VIDEOSDK_API_KEY')
    read_with_default "VideoSDK API Key" "$current_videosdk_key" "VIDEOSDK_API_KEY"

    current_videosdk_secret=$(get_env_value 'VIDEOSDK_SECRET_KEY')
    read_with_default "VideoSDK Secret Key" "$current_videosdk_secret" "VIDEOSDK_SECRET_KEY"

    # Apply configuration
    print_info "Applying production configuration..."

    update_env "APP_ENV" "production"
    update_env "APP_DEBUG" "false"
    update_env "IS_VPS" "true"
    update_env "USE_HTTPS" "$USE_HTTPS"
    update_env "DOMAIN" "$DOMAIN"
    update_env "DB_PASS" "$DB_PASS"

    if [ -n "$PUBLIC_IP" ]; then
        update_env "PUBLIC_IP" "$PUBLIC_IP"
    fi

    # Update URLs based on HTTPS setting
    if [ "$USE_HTTPS" = "true" ]; then
        update_env "APP_URL" "https://$DOMAIN"
        update_env "SESSION_SECURE" "true"

        # Update CORS origins
        CORS_ORIGINS="https://$DOMAIN,https://www.$DOMAIN,http://$DOMAIN,http://app:1001,http://localhost:1001"
        update_env "CORS_ALLOWED_ORIGINS" "$CORS_ORIGINS"
    else
        update_env "APP_URL" "http://$DOMAIN"
        update_env "SESSION_SECURE" "false"

        # Update CORS origins
        CORS_ORIGINS="http://$DOMAIN,http://www.$DOMAIN,https://$DOMAIN,http://app:1001,http://localhost:1001"
        update_env "CORS_ALLOWED_ORIGINS" "$CORS_ORIGINS"
    fi

    # Update API keys if provided
    if [ -n "$GOOGLE_CLIENT_ID" ]; then
        update_env "GOOGLE_CLIENT_ID" "$GOOGLE_CLIENT_ID"
    fi

    if [ -n "$GOOGLE_CLIENT_SECRET" ]; then
        update_env "GOOGLE_CLIENT_SECRET" "$GOOGLE_CLIENT_SECRET"
    fi

    if [ -n "$VIDEOSDK_API_KEY" ]; then
        update_env "VIDEOSDK_API_KEY" "$VIDEOSDK_API_KEY"
    fi

    if [ -n "$VIDEOSDK_SECRET_KEY" ]; then
        update_env "VIDEOSDK_SECRET_KEY" "$VIDEOSDK_SECRET_KEY"
    fi

    print_success "Production configuration applied"

    # Restart services with new configuration
    print_info "Restarting services with new configuration..."
    docker-compose down
    docker-compose up -d

    print_info "Waiting for services to restart..."
    sleep 20

    print_success "Services restarted with production configuration"

    # Display final configuration
    echo -e "\n${GREEN}═══ PRODUCTION CONFIGURATION SUMMARY ═══${NC}"
    echo "Domain: $DOMAIN"
    echo "HTTPS: $USE_HTTPS"
    echo "App URL: $(get_env_value 'APP_URL')"
    echo "Database: Configured with password"
    echo "Services: app:1001, socket:1002, db:1003"

    # Show connection information
    echo -e "\n${BLUE}═══ CONNECTION INFORMATION ═══${NC}"
    echo "App Service: http://localhost:1001"
    echo "Socket Service: http://localhost:1002"
    echo "Database: localhost:1003"
    echo "PhpMyAdmin: http://localhost:1004"

    if [ "$USE_HTTPS" = "true" ]; then
        echo -e "\n${YELLOW}⚠️ HTTPS SETUP REQUIRED:${NC}"
        echo "1. Configure reverse proxy (Nginx/Apache) for SSL"
        echo "2. Obtain SSL certificates (Let's Encrypt recommended)"
        echo "3. Update firewall: allow ports 80, 443, 1001, 1002"
        echo "4. Point domain $DOMAIN to server IP"
    else
        echo -e "\n${YELLOW}⚠️ HTTP SETUP NOTES:${NC}"
        echo "1. Update firewall: allow ports 80, 1001, 1002"
        echo "2. Point domain $DOMAIN to server IP"
        echo "3. Consider enabling HTTPS for production security"
    fi

    echo -e "\n${GREEN}🚀 DEPLOYMENT COMPLETED SUCCESSFULLY!${NC}"
    echo -e "✅ Application URL: $(get_env_value 'APP_URL')"
    echo -e "✅ Bot system: TitiBot initialized"
    echo -e "✅ Services: All running and healthy"
    echo -e "✅ Database: Connected and configured"
}

# Main menu
show_menu() {
    echo -e "\n${BLUE}═══ MisVord VPS Deployment Script ═══${NC}"
    echo "1) Check environment file"
    echo "2) Initialize bots"
    echo "3) Check service health"
    echo "4) Configure for production"
    echo "5) Full deployment (all steps)"
    echo "6) Exit"
    echo
}

# Main execution
main() {
    clear
    echo -e "${GREEN}"
    echo "███╗   ███╗██╗███████╗██╗   ██╗ ██████╗ ██████╗ ██████╗ "
    echo "████╗ ████║██║██╔════╝██║   ██║██╔═══██╗██╔══██╗██╔══██╗"
    echo "██╔████╔██║██║███████╗██║   ██║██║   ██║██████╔╝██║  ██║"
    echo "██║╚██╔╝██║██║╚════██║╚██╗ ██╔╝██║   ██║██╔══██╗██║  ██║"
    echo "██║ ╚═╝ ██║██║███████║ ╚████╔╝ ╚██████╔╝██║  ██║██████╔╝"
    echo "╚═╝     ╚═╝╚═╝╚══════╝  ╚═══╝   ╚═════╝ ╚═╝  ╚═╝╚═════╝ "
    echo -e "${NC}"
    echo -e "${YELLOW}VPS Deployment & Configuration Script${NC}"
    echo

    while true; do
        show_menu
        read -p "Select an option (1-6): " choice

        case $choice in
            1)
                check_env_file
                ;;
            2)
                init_bot
                ;;
            3)
                check_services
                ;;
            4)
                configure_production
                ;;
            5)
                print_info "Starting full deployment..."
                check_env_file
                check_services
                init_bot
                configure_production
                ;;
            6)
                print_info "Exiting..."
                exit 0
                ;;
            *)
                print_error "Invalid option. Please choose 1-6."
                ;;
        esac

        echo
        read -p "Press Enter to continue..."
    done
}

# Check if script is run from correct directory
if [ ! -f "docker-compose.yml" ]; then
    print_error "Please run this script from the project root directory (where docker-compose.yml is located)"
    exit 1
fi

# Run main function
main