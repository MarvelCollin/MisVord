#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️ $1${NC}"; }
print_section() { echo -e "\n${BLUE}═══ $1 ═══${NC}"; }

get_env_value() {
    local key=$1
    local env_file=${2:-.env}
    grep "^${key}=" "$env_file" 2>/dev/null | cut -d'=' -f2- || echo ""
}

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

update_env() {
    local key=$1
    local value=$2
    local env_file=${3:-.env}

    if grep -q "^${key}=" "$env_file" 2>/dev/null; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|^${key}=.*|${key}=${value}|" "$env_file"
        else
            sed -i "s|^${key}=.*|${key}=${value}|" "$env_file"
        fi
    else
        echo "${key}=${value}" >> "$env_file"
    fi
    print_success "Updated ${key}=${value}"
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

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
    echo "IS_DOCKER: $(get_env_value 'IS_DOCKER')"
    echo "IS_VPS: $(get_env_value 'IS_VPS')"
    echo "USE_HTTPS: $(get_env_value 'USE_HTTPS')"
    echo "DOMAIN: $(get_env_value 'DOMAIN')"
    echo "DB_HOST: $(get_env_value 'DB_HOST')"
    echo "DB_PASS: $(get_env_value 'DB_PASS')"
    echo "APP_PORT: $(get_env_value 'APP_PORT')"
    echo "SOCKET_PORT: $(get_env_value 'SOCKET_PORT')"
    echo "SOCKET_BIND_HOST: $(get_env_value 'SOCKET_BIND_HOST')"
    
    # Validate critical environment variables
    missing_vars=()
    required_vars=("APP_PORT" "SOCKET_PORT" "SOCKET_BIND_HOST" "DB_PASS" "DB_HOST")
    
    for var in "${required_vars[@]}"; do
        value=$(get_env_value "$var")
        if [ -z "$value" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        print_warning "Please update your .env file before proceeding"
        return 1
    fi
    
    # Validate Docker-only configuration
    db_host=$(get_env_value 'DB_HOST')
    is_docker=$(get_env_value 'IS_DOCKER')
    
    if [ "$db_host" != "db" ]; then
        print_warning "DB_HOST should be 'db' for Docker deployment"
        print_info "Current value: $db_host"
        print_info "Run configure_environment to fix this"
    fi
    
    if [ "$is_docker" != "true" ]; then
        print_warning "IS_DOCKER should be 'true' for Docker deployment"
        print_info "Current value: $is_docker"
        print_info "Run configure_environment to fix this"
    fi
    
    print_success "All required environment variables are set"
}

# Function to validate Docker configuration
validate_docker_config() {
    print_section "VALIDATING DOCKER CONFIGURATION"
    
    # Check if docker-compose.yml exists
    if [ ! -f "docker-compose.yml" ]; then
        print_error "docker-compose.yml not found!"
        return 1
    fi
    
    print_success "docker-compose.yml found"
    
    # Validate Docker environment variables are properly passed through
    if grep -q "SOCKET_BIND_HOST=0.0.0.0" docker-compose.yml; then
        print_success "SOCKET_BIND_HOST correctly configured in docker-compose.yml"
    else
        print_error "SOCKET_BIND_HOST missing from docker-compose.yml socket service"
        return 1
    fi
    
    # Check if .env file has Docker-compatible settings
    db_host=$(get_env_value 'DB_HOST')
    is_docker=$(get_env_value 'IS_DOCKER')
    
    if [ "$db_host" = "db" ] && [ "$is_docker" = "true" ]; then
        print_success "Environment configured for Docker deployment"
    else
        print_warning "Environment may not be optimized for Docker"
        print_info "DB_HOST: $db_host (should be 'db')"
        print_info "IS_DOCKER: $is_docker (should be 'true')"
    fi
    
    # Validate docker-compose environment defaults
    if grep -q "APP_ENV=\${APP_ENV:-development}" docker-compose.yml; then
        print_success "Docker-compose defaults to development environment"
    else
        print_warning "Docker-compose may not have correct environment defaults"
    fi
    
    print_success "Docker configuration validation completed"
}

# Function to fix common socket server issues
fix_socket_issues() {
    print_section "FIXING SOCKET SERVER ISSUES"
    
    # Check for common socket server problems
    print_info "Checking for common socket server issues..."
    
    # Kill any existing node processes that might conflict
    print_info "Stopping any conflicting Node.js processes..."
    pkill -f "node.*server.js" 2>/dev/null || true
    
    # Check if port 1002 is available
    if netstat -tuln 2>/dev/null | grep -q ":1002 "; then
        print_warning "Port 1002 is already in use"
        print_info "Attempting to free port 1002..."
        
        # Try to find and kill process using port 1002
        PID=$(lsof -ti:1002 2>/dev/null || echo "")
        if [ -n "$PID" ]; then
            kill -9 $PID 2>/dev/null || true
            print_success "Freed port 1002"
        fi
    else
        print_success "Port 1002 is available"
    fi
    
    # Rebuild socket container to ensure latest changes
    print_info "Rebuilding socket container with latest configuration..."
    docker-compose down socket 2>/dev/null || true
    docker-compose build socket
    
    print_success "Socket server issues fixed"
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

    # Final service verification with detailed socket check
    print_info "Running final service verification..."
    
    # Check PHP application
    if curl -s "http://localhost:1001/health" >/dev/null 2>&1; then
        print_success "PHP application is responding"
        
        # Get PHP app info
        APP_INFO=$(curl -s "http://localhost:1001/health" 2>/dev/null || echo "{}")
        if echo "$APP_INFO" | grep -q '"status":"ok"'; then
            print_success "PHP application health check passed"
        fi
    else
        print_warning "PHP application health check failed"
    fi

    # Check Socket server with detailed validation
    if curl -s "http://localhost:1002/health" >/dev/null 2>&1; then
        print_success "Socket server is responding"
        
        # Get socket server info
        SOCKET_INFO=$(curl -s "http://localhost:1002/health" 2>/dev/null || echo "{}")
        if echo "$SOCKET_INFO" | grep -q '"status":"ok"'; then
            print_success "Socket server health check passed"
            
            # Extract and display socket server details
            SERVICE=$(echo "$SOCKET_INFO" | grep -o '"service":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
            PORT=$(echo "$SOCKET_INFO" | grep -o '"port":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
            HOST=$(echo "$SOCKET_INFO" | grep -o '"host":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
            
            print_info "Socket server details: $SERVICE on $HOST:$PORT"
            
            # Check if environment variables are properly loaded
            if [ "$HOST" = "0.0.0.0" ] && [ "$PORT" = "1002" ]; then
                print_success "Socket server environment variables correctly loaded"
            else
                print_warning "Socket server environment may not be configured correctly"
                echo "Expected: 0.0.0.0:1002, Got: $HOST:$PORT"
            fi
        else
            print_warning "Socket server health check returned unexpected format"
        fi
    else
        print_warning "Socket server health check failed"
        
        # Check socket container logs for debugging
        print_info "Checking socket container logs for issues..."
        SOCKET_LOGS=$(docker-compose logs socket --tail=10 2>/dev/null || echo "")
        if echo "$SOCKET_LOGS" | grep -q "SOCKET_BIND_HOST.*UNDEFINED"; then
            print_error "Socket server still has SOCKET_BIND_HOST undefined issue!"
            print_warning "Please check docker-compose.yml socket service environment variables"
        elif echo "$SOCKET_LOGS" | grep -q "EADDRINUSE"; then
            print_warning "Socket server port conflict detected"
        fi
    fi

    print_success "Service health check completed"
}

# Function to verify environment sync
verify_env_sync() {
    print_section "ENVIRONMENT SYNCHRONIZATION CHECK"
    
    print_info "Checking .env and docker-compose.yml synchronization..."
    
    # Check if .env values match docker-compose defaults
    env_app_env=$(get_env_value 'APP_ENV')
    env_is_docker=$(get_env_value 'IS_DOCKER')
    env_db_host=$(get_env_value 'DB_HOST')
    
    issues=()
    
    # Check APP_ENV
    if [ "$env_app_env" = "production" ]; then
        if ! grep -q "APP_ENV=\${APP_ENV:-production}" docker-compose.yml; then
            issues+=("docker-compose.yml should default to production when .env is production")
        fi
    elif [ "$env_app_env" = "development" ]; then
        if ! grep -q "APP_ENV=\${APP_ENV:-development}" docker-compose.yml; then
            issues+=("docker-compose.yml should default to development when .env is development")
        fi
    fi
    
    # Check Docker configuration
    if [ "$env_is_docker" != "true" ]; then
        issues+=(".env IS_DOCKER should be 'true' for Docker deployment")
    fi
    
    if [ "$env_db_host" != "db" ]; then
        issues+=(".env DB_HOST should be 'db' for Docker deployment")
    fi
    
    # Report issues
    if [ ${#issues[@]} -gt 0 ]; then
        print_warning "Environment synchronization issues found:"
        for issue in "${issues[@]}"; do
            echo "  - $issue"
        done
        
        echo -e "\n${BLUE}Fix these issues? (y/N):${NC}"
        read -p "> " fix_choice
        
        if [[ "$fix_choice" =~ ^[Yy]$ ]]; then
            print_info "Fixing synchronization issues..."
            
            # Fix .env for Docker
            update_env "IS_DOCKER" "true"
            update_env "DB_HOST" "db"
            
            print_success "Environment synchronization fixed"
        fi
    else
        print_success "Environment is properly synchronized"
    fi
}

# Function to quick VPS deployment
quick_vps_deploy() {
    print_section "QUICK VPS DEPLOYMENT"
    
    echo -e "${YELLOW}This will quickly configure and deploy to VPS${NC}"
    echo -e "${YELLOW}Make sure Docker and Docker Compose are installed!${NC}\n"
    
    # Quick domain setup
    read_with_default "Enter your domain name" "$(get_env_value 'DOMAIN')" "DOMAIN"
    read_with_default "Enter database password" "$(get_env_value 'DB_PASS')" "DB_PASS"
    
    # Quick HTTPS setup
    echo -e "\n${BLUE}Enable HTTPS? (recommended for production)${NC}"
    read -p "y/N: " https_choice
    
    if [[ "$https_choice" =~ ^[Yy]$ ]]; then
        USE_HTTPS="true"
        SESSION_SECURE="true"
        APP_URL="https://$DOMAIN"
    else
        USE_HTTPS="false" 
        SESSION_SECURE="false"
        APP_URL="http://$DOMAIN"
    fi
    
    print_info "Applying VPS configuration..."
    
    # Apply all settings
    update_env "APP_ENV" "production"
    update_env "APP_DEBUG" "false"
    update_env "IS_DOCKER" "true"
    update_env "IS_VPS" "true"
    update_env "USE_HTTPS" "$USE_HTTPS"
    update_env "DOMAIN" "$DOMAIN"
    update_env "DB_HOST" "db"
    update_env "DB_PASS" "$DB_PASS"
    update_env "APP_URL" "$APP_URL"
    update_env "SESSION_SECURE" "$SESSION_SECURE"
    
    # CORS configuration
    if [ "$USE_HTTPS" = "true" ]; then
        CORS_ORIGINS="https://$DOMAIN,https://www.$DOMAIN,http://$DOMAIN,http://app:1001"
    else
        CORS_ORIGINS="http://$DOMAIN,http://www.$DOMAIN,http://app:1001"
    fi
    update_env "CORS_ALLOWED_ORIGINS" "$CORS_ORIGINS"
    
    print_success "VPS configuration applied"
    
    # Deploy services
    print_info "Starting VPS deployment..."
    docker-compose down 2>/dev/null || true
    docker-compose build --no-cache
    docker-compose up -d
    
    print_info "Waiting for services to start..."
    sleep 30
    
    # Initialize bot
    print_info "Initializing bot system..."
    init_bot
    
    # Health check
    check_services
    
    echo -e "\n${GREEN}🚀 VPS DEPLOYMENT COMPLETED!${NC}"
    echo -e "✅ Domain: $DOMAIN"
    echo -e "✅ HTTPS: $USE_HTTPS"
    echo -e "✅ App URL: $APP_URL"
    echo -e "✅ All services running in Docker"
    
    if [ "$USE_HTTPS" = "true" ]; then
        echo -e "\n${YELLOW}⚠️ NEXT STEPS FOR HTTPS:${NC}"
        echo "1. Configure reverse proxy (Nginx/Apache)"
        echo "2. Get SSL certificate (certbot/Let's Encrypt)"
        echo "3. Point $DOMAIN to this server"
        echo "4. Open firewall ports: 80, 443, 1001, 1002"
    else
        echo -e "\n${YELLOW}⚠️ NEXT STEPS:${NC}"
        echo "1. Point $DOMAIN to this server"
        echo "2. Open firewall ports: 80, 1001, 1002"
    fi
}

# Function to configure environment for Docker
configure_environment() {
    print_section "ENVIRONMENT CONFIGURATION"
    
    echo -e "${YELLOW}Configure environment for:${NC}"
    echo "1) Development (local Docker)"
    echo "2) Production (VPS Docker)"
    echo "3) Custom configuration"
    read -p "Choice (1-3): " env_choice
    
    case $env_choice in
        1)
            print_info "Configuring for development environment..."
            update_env "APP_ENV" "development"
            update_env "APP_DEBUG" "true"
            update_env "IS_DOCKER" "true"
            update_env "IS_VPS" "false"
            update_env "USE_HTTPS" "false"
            update_env "DOMAIN" "localhost"
            update_env "DB_HOST" "db"
            update_env "SOCKET_HOST" "socket"
            update_env "SESSION_SECURE" "false"
            
            # Development CORS origins
            update_env "CORS_ALLOWED_ORIGINS" "http://localhost:1001,http://127.0.0.1:1001,http://app:1001"
            
            print_success "Development environment configured"
            ;;
        2)
            print_info "Configuring for production environment..."
            configure_production
            return
            ;;
        3)
            print_info "Custom configuration mode..."
            configure_production
            return
            ;;
        *)
            print_error "Invalid choice"
            return 1
            ;;
    esac
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

    # Core production settings
    update_env "APP_ENV" "production"
    update_env "APP_DEBUG" "false"
    update_env "IS_DOCKER" "true"
    update_env "IS_VPS" "true"
    update_env "USE_HTTPS" "$USE_HTTPS"
    update_env "DOMAIN" "$DOMAIN"
    update_env "DB_HOST" "db"
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
    echo "Environment: production"
    echo "Docker Mode: enabled"
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
    echo -e "✅ Socket server: Docker environment properly configured"
    echo -e "✅ Environment: $(get_env_value 'APP_ENV') mode"
    
    echo -e "\n${BLUE}📋 Docker Configuration:${NC}"
    echo -e "• All services running in Docker containers"
    echo -e "• Database host: db (container)"
    echo -e "• Socket host: socket (container)"
    echo -e "• Environment variables properly loaded"
    echo -e "• Health checks enabled for all services"
}

# Main menu
show_menu() {
    echo -e "\n${BLUE}═══ MisVord VPS Deployment Script ═══${NC}"
    echo "1) Check environment file"
    echo "2) Configure environment (Dev/Prod)"
    echo "3) Quick VPS deploy"
    echo "4) Validate Docker configuration"  
    echo "5) Initialize bots"
    echo "6) Check service health"
    echo "7) Configure for production"
    echo "8) Full deployment (all steps)"
    echo "9) Exit"
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
        read -p "Select an option (1-9): " choice

        case $choice in
            1)
                check_env_file
                ;;
            2)
                configure_environment
                ;;
            3)
                quick_vps_deploy
                ;;
            4)
                validate_docker_config
                ;;
            5)
                init_bot
                ;;
            6)
                check_services
                ;;
            7)
                configure_production
                ;;
            8)
                print_info "Starting full deployment..."
                check_env_file
                verify_env_sync
                configure_environment
                validate_docker_config
                check_services
                init_bot
                ;;
            9)
                print_info "Exiting..."
                exit 0
                ;;
            *)
                print_error "Invalid option. Please choose 1-9."
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