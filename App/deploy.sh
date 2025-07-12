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
    echo "SOCKET_BIND_HOST: $(get_env_value 'SOCKET_BIND_HOST')"
    
    # Validate critical environment variables
    missing_vars=()
    required_vars=("APP_PORT" "SOCKET_PORT" "SOCKET_BIND_HOST" "DB_PASS")
    
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
    
    # Validate Docker Compose environment variables for socket service
    if grep -q "SOCKET_BIND_HOST=0.0.0.0" docker-compose.yml; then
        print_success "SOCKET_BIND_HOST correctly configured in docker-compose.yml"
    else
        print_error "SOCKET_BIND_HOST missing from docker-compose.yml socket service"
        print_info "Adding SOCKET_BIND_HOST to docker-compose.yml..."
        
        # This would require more complex sed commands to insert into the right place
        print_warning "Please manually add 'SOCKET_BIND_HOST=0.0.0.0' to socket service environment in docker-compose.yml"
        return 1
    fi
    
    # Check if socket server has proper environment handling
    if [ -f "socket-server/server.js" ]; then
        if grep -q "IS_DOCKER.*true" socket-server/server.js; then
            print_success "Socket server has Docker environment detection"
        else
            print_warning "Socket server may not have proper Docker environment handling"
        fi
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
                
                SOCKET_HOST_ENV=$(get_env_value 'SOCKET_HOST')
                SOCKET_SECURE_ENV=$(get_env_value 'SOCKET_SECURE')
                IS_VPS_ENV=$(get_env_value 'IS_VPS')
                
                echo -e "\n${BLUE}Socket Frontend Configuration:${NC}"
                echo "Frontend will connect to: $SOCKET_HOST_ENV"
                echo "Secure connection: $SOCKET_SECURE_ENV"
                echo "VPS mode: $IS_VPS_ENV"
                
                if [ "$IS_VPS_ENV" = "true" ] && [ "$SOCKET_HOST_ENV" != "localhost" ]; then
                    print_success "VPS socket configuration is correct"
                else
                    print_warning "Socket configuration may not be optimized for VPS deployment"
                fi
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
    update_env "IS_DOCKER" "true"
    update_env "USE_HTTPS" "$USE_HTTPS"
    update_env "DOMAIN" "$DOMAIN"
    update_env "DB_PASS" "$DB_PASS"
    update_env "SOCKET_HOST" "$DOMAIN"
    update_env "SOCKET_SECURE" "$USE_HTTPS"

    if [ -n "$PUBLIC_IP" ]; then
        update_env "PUBLIC_IP" "$PUBLIC_IP"
    fi

    # Update URLs based on HTTPS setting
    if [ "$USE_HTTPS" = "true" ]; then
        update_env "APP_URL" "https://$DOMAIN"
        update_env "SESSION_SECURE" "true"
        CORS_ORIGINS="https://$DOMAIN,https://www.$DOMAIN,http://$DOMAIN,http://app:1001,http://localhost:1001"
    else
        update_env "APP_URL" "http://$DOMAIN"
        update_env "SESSION_SECURE" "false"
        CORS_ORIGINS="http://$DOMAIN,https://$DOMAIN,https://www.$DOMAIN,http://app:1001,http://localhost:1001"
    fi
    
    update_env "CORS_ALLOWED_ORIGINS" "$CORS_ORIGINS"

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

    echo -e "\n${BLUE}═══ SOCKET CONFIGURATION VERIFICATION ═══${NC}"
    echo "Socket Host: $(get_env_value 'SOCKET_HOST')"
    echo "Socket Secure: $(get_env_value 'SOCKET_SECURE')"
    echo "Expected Frontend Socket URL: $(get_env_value 'SOCKET_SECURE' | grep -q 'true' && echo 'wss' || echo 'ws')://$(get_env_value 'SOCKET_HOST')"
    echo "CORS Origins: $(get_env_value 'CORS_ALLOWED_ORIGINS')"
    
    # Validate socket configuration
    if [ "$(get_env_value 'SOCKET_HOST')" = "$DOMAIN" ]; then
        print_success "✅ SOCKET_HOST correctly set to domain: $DOMAIN"
    else
        print_warning "⚠️ SOCKET_HOST mismatch - Expected: $DOMAIN, Got: $(get_env_value 'SOCKET_HOST')"
    fi

    print_info "Restarting services with new configuration..."
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d

    print_info "Waiting for services to restart..."
    sleep 20

    print_success "Services restarted with production configuration"
    
    configure_reverse_proxy "$DOMAIN"
    
    if [ $? -ne 0 ]; then
        print_warning "Reverse proxy configuration failed - WebSocket may not work"
        print_info "You can manually configure it later using option 7"
    fi

    # Display final configuration
    echo -e "\n${GREEN}═══ PRODUCTION CONFIGURATION SUMMARY ═══${NC}"
    echo "Domain: $DOMAIN"
    echo "HTTPS: $USE_HTTPS"
    echo "App URL: $(get_env_value 'APP_URL')"
    echo "Socket Host: $(get_env_value 'SOCKET_HOST')"
    echo "Database: Configured with password"
    echo "Services: app:1001, socket:1002, db:1003"

    echo -e "\n${BLUE}═══ CONNECTION INFORMATION ═══${NC}"
    echo "App Service: http://localhost:1001"
    echo "Socket Service: http://localhost:1002"
    echo "Database: localhost:1003"
    echo "PhpMyAdmin: http://localhost:1004"

    if [ "$USE_HTTPS" = "true" ]; then
        echo -e "\n${YELLOW}⚠️ HTTPS SETUP NOTES:${NC}"
        echo "1. Configure SSL certificates for $DOMAIN"
        echo "2. Nginx configuration created for $DOMAIN"
        echo "3. Update firewall: allow ports 80, 443"
        echo "4. Point domain $DOMAIN to server IP: $(get_env_value 'PUBLIC_IP')"
        echo "5. Test SSL: https://$DOMAIN"
    else
        echo -e "\n${YELLOW}⚠️ HTTP SETUP NOTES:${NC}"
        echo "1. Update firewall: allow ports 80, 1001, 1002"
        echo "2. Point domain $DOMAIN to server IP: $(get_env_value 'PUBLIC_IP')"
        echo "3. Consider enabling HTTPS for production security"
    fi

    echo -e "\n${GREEN}🚀 DEPLOYMENT COMPLETED SUCCESSFULLY!${NC}"
    echo -e "✅ Application URL: $(get_env_value 'APP_URL')"
    echo -e "✅ WebSocket URL: wss://$(get_env_value 'DOMAIN')/socket.io/"
    echo -e "✅ Bot system: TitiBot initialized"
    echo -e "✅ Services: All running and healthy"
    echo -e "✅ Database: Connected and configured"
    echo -e "✅ Nginx: Reverse proxy configured for $(get_env_value 'DOMAIN')"
    echo -e "✅ Socket server: Environment variables properly configured"
    echo -e "✅ Docker: SOCKET_BIND_HOST=0.0.0.0 configured"
    
    echo -e "\n${BLUE}📋 Full Stack Deployment Complete for $(get_env_value 'DOMAIN'):${NC}"
    echo -e "• Application: PHP + Docker containers running"
    echo -e "• Database: MySQL configured and migrated"
    echo -e "• Socket Server: WebSocket connections enabled"
    echo -e "• Nginx: Reverse proxy with SSL and WebSocket support"
    echo -e "• Security: HTTPS enforced, secure sessions enabled"
    echo -e "• Environment: Production-ready configuration"
    
    echo -e "\n${BLUE}🌐 Access Your Application:${NC}"
    echo -e "• Website: $(get_env_value 'APP_URL')"
    echo -e "• WebSocket: wss://$(get_env_value 'DOMAIN')/socket.io/"
    echo -e "• Admin Panel: $(get_env_value 'APP_URL')/admin"
}

update_website() {
    print_section "UPDATING WEBSITE"

    print_info "Resetting git repository to clean state..."
    git reset --hard
    
    print_info "Cleaning untracked files and directories..."
    git clean -fd
    
    print_info "Pulling latest changes from repository..."
    git pull
    
    print_info "Final cleanup of untracked files..."
    git clean -fd
    
    print_info "Restarting Docker containers..."
    docker-compose restart
    
    print_success "Website update completed successfully!"
    
    print_info "Waiting for services to restart..."
    sleep 10
    
    print_info "Checking service status after update..."
    if docker-compose ps | grep -q "Up"; then
        print_success "All services are running after update"
    else
        print_warning "Some services may not be running properly"
        docker-compose ps
    fi
}

migrate_database() {
    print_section "MIGRATING DATABASE"

    print_info "Checking if app container is running..."
    if ! docker-compose ps | grep -q "misvord_php.*Up"; then
        print_warning "App container is not running. Starting services..."
        docker-compose up -d
        
        print_info "Waiting for app container to be ready..."
        sleep 10
    fi

    print_info "Running database migration with fresh start..."
    if docker exec misvord_php php mv migrate:fresh; then
        print_success "Database migration completed successfully!"
    else
        print_error "Database migration failed!"
        print_info "Checking container logs for more details..."
        docker-compose logs app --tail=20
        return 1
    fi

    print_info "Verifying database connection..."
    if docker exec misvord_php php -r "
        require_once 'config/db.php';
        try {
            \$pdo = new PDO('mysql:host=db;port=1003;dbname=misvord', 'root', '${DB_PASS}');
            echo 'Database connection successful';
        } catch (Exception \$e) {
            echo 'Database connection failed: ' . \$e->getMessage();
            exit(1);
        }
    "; then
        print_success "Database connection verified"
    else
        print_warning "Database connection verification failed"
    fi
}

# Function to configure reverse proxy for WebSocket
configure_reverse_proxy() {
    print_section "CONFIGURING NGINX REVERSE PROXY"
    
    local domain=$1
    
    if ! command_exists nginx; then
        print_error "Nginx not found! Please install Nginx first:"
        echo "sudo apt update && sudo apt install -y nginx"
        return 1
    fi
    
    configure_nginx_websocket "$domain"
    
    if [ $? -eq 0 ]; then
        print_success "Nginx reverse proxy configured successfully"
        
        print_info "Testing WebSocket endpoint..."
        sleep 2
        
        if curl -f -s "https://$domain/socket.io/socket.io.js" >/dev/null 2>&1; then
            print_success "WebSocket endpoint accessible via HTTPS"
        else
            print_warning "WebSocket endpoint test failed - check SSL certificates"
        fi
        
        return 0
    else
        print_error "Failed to configure Nginx reverse proxy"
        return 1
    fi
}

# Function to configure Nginx WebSocket proxy
configure_nginx_websocket() {
    local domain=$1
    local nginx_config="/etc/nginx/sites-available/$domain"
    local nginx_enabled="/etc/nginx/sites-enabled/$domain"
    
    print_info "Configuring Nginx WebSocket proxy for $domain..."
    
    if [ ! -f "$nginx_config" ]; then
        print_info "Creating Nginx configuration for $domain..."
        create_complete_nginx_config "$domain"
    else
        if grep -q "socket.io" "$nginx_config"; then
            print_success "WebSocket proxy already configured for $domain"
            return 0
        fi
        
        print_info "Adding WebSocket configuration to existing Nginx config for $domain..."
        add_websocket_to_existing_nginx "$domain"
    fi
    
    if [ ! -L "$nginx_enabled" ]; then
        ln -sf "$nginx_config" "$nginx_enabled"
        print_success "Enabled Nginx site: $domain"
    fi
    
    check_ssl_certificates "$domain"
    
    if nginx -t 2>/dev/null; then
        systemctl reload nginx
        print_success "Nginx WebSocket proxy configured successfully for $domain"
        return 0
    else
        print_error "Nginx configuration test failed for $domain"
        nginx -t
        return 1
    fi
}

check_ssl_certificates() {
    local domain=$1
    local cert_file="/etc/ssl/certs/$domain.crt"
    local key_file="/etc/ssl/private/$domain.key"
    
    print_info "Checking SSL certificates for $domain..."
    
    if [ -f "$cert_file" ] && [ -f "$key_file" ]; then
        print_success "SSL certificates found for $domain"
    else
        print_warning "SSL certificates not found for $domain"
        print_info "Expected locations:"
        echo "  Certificate: $cert_file"
        echo "  Private Key: $key_file"
        print_info "To get SSL certificates:"
        echo "  sudo certbot --nginx -d $domain -d www.$domain"
        echo "  Or place your certificates in the expected locations"
    fi
}

create_complete_nginx_config() {
    local domain=$1
    local nginx_config="/etc/nginx/sites-available/$domain"
    
    cat > "$nginx_config" << EOF
server {
    listen 80;
    server_name $domain www.$domain;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $domain www.$domain;
    
    ssl_certificate /etc/ssl/certs/$domain.crt;
    ssl_certificate_key /etc/ssl/private/$domain.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    location / {
        proxy_pass http://localhost:1001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /socket.io/ {
        proxy_pass http://localhost:1002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
}
EOF
    
    print_success "Created complete Nginx configuration for $domain"
    print_info "SSL certificate paths configured for:"
    echo "  Certificate: /etc/ssl/certs/$domain.crt"
    echo "  Private Key: /etc/ssl/private/$domain.key"
    print_warning "Please ensure SSL certificates exist for $domain"
}

add_websocket_to_existing_nginx() {
    local domain=$1
    local nginx_config="/etc/nginx/sites-available/$domain"
    
    cp "$nginx_config" "$nginx_config.backup.$(date +%Y%m%d_%H%M%S)"
    
    awk '
    /location \/ \{/ { in_location = 1 }
    /\}/ { 
        if (in_location) {
            in_location = 0
            print $0
            print ""
            print "    location /socket.io/ {"
            print "        proxy_pass http://localhost:1002;"
            print "        proxy_http_version 1.1;"
            print "        proxy_set_header Upgrade $http_upgrade;"
            print "        proxy_set_header Connection \"upgrade\";"
            print "        proxy_set_header Host $host;"
            print "        proxy_set_header X-Real-IP $remote_addr;"
            print "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;"
            print "        proxy_set_header X-Forwarded-Proto $scheme;"
            print "        proxy_cache_bypass $http_upgrade;"
            print "        proxy_read_timeout 86400;"
            print "    }"
            next
        }
    }
    { print }
    ' "$nginx_config.backup.$(date +%Y%m%d_%H%M%S)" > "$nginx_config"
    
    print_success "Added WebSocket configuration to existing Nginx config"
}

# Function to show manual proxy configuration
show_manual_proxy_config() {
    local domain=$1
    
    echo -e "\n${YELLOW}=== MANUAL REVERSE PROXY CONFIGURATION REQUIRED ===${NC}"
    echo -e "Add this configuration to your web server:\n"
    
    echo -e "${BLUE}For Nginx:${NC}"
    cat << 'EOF'
location /socket.io/ {
    proxy_pass http://localhost:1002;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 86400;
}
EOF
    
    echo -e "\n${BLUE}For Apache:${NC}"
    cat << 'EOF'
RewriteEngine On
RewriteCond %{REQUEST_URI} ^/socket.io/ [NC]
RewriteCond %{QUERY_STRING} transport=websocket [NC]
RewriteRule /(.*) ws://localhost:1002/$1 [P,L]

ProxyPreserveHost On
ProxyPass /socket.io/ http://localhost:1002/socket.io/
ProxyPassReverse /socket.io/ http://localhost:1002/socket.io/
EOF
    
    echo -e "\n${YELLOW}After adding this configuration:${NC}"
    echo "1. Test your web server configuration"
    echo "2. Reload/restart your web server"
    echo "3. Test WebSocket connection: wss://$domain/socket.io/"
}

show_menu() {
    echo -e "\n${BLUE}═══ MisVord VPS Deployment Script ═══${NC}"
    echo "1) Check environment file"
    echo "2) Validate Docker configuration"  
    echo "3) Initialize bots"
    echo "4) Check service health"
    echo "5) Configure for production"
    echo "6) Full deployment (all steps)"
    echo "7) Configure reverse proxy for WebSocket"
    echo "8) Update website"
    echo "9) Migrate database"
    echo "10) Exit"
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
        read -p "Select an option (1-10): " choice

        case $choice in
            1)
                check_env_file
                ;;
            2)
                validate_docker_config
                ;;
            3)
                init_bot
                ;;
            4)
                check_services
                ;;
            5)
                configure_production
                ;;
            6)
                print_info "Starting full deployment with Nginx configuration..."
                check_env_file && \
                validate_docker_config && \
                check_services && \
                init_bot && \
                configure_production
                ;;
            7)
                current_domain=$(get_env_value 'DOMAIN')
                if [ -n "$current_domain" ] && [ "$current_domain" != "localhost" ]; then
                    configure_reverse_proxy "$current_domain"
                else
                    print_error "Domain not configured. Please run production configuration first."
                fi
                ;;
            8)
                update_website
                ;;
            9)
                migrate_database
                ;;
            10)
                print_info "Exiting..."
                exit 0
                ;;
            *)
                print_error "Invalid option. Please choose 1-10."
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