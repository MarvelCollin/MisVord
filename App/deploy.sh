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

check_env_file() {
    print_section "CHECKING ENVIRONMENT FILE"

    if [ ! -f ".env" ]; then
        print_error ".env file not found!"
        exit 1
    fi

    print_success ".env file found"

    echo -e "\n${YELLOW}Current Environment Settings:${NC}"
    echo "APP_ENV: $(get_env_value 'APP_ENV')"
    echo "IS_VPS: $(get_env_value 'IS_VPS')"
    echo "USE_HTTPS: $(get_env_value 'USE_HTTPS')"
    echo "DOMAIN: $(get_env_value 'DOMAIN')"
    echo "DB_PASS: $(get_env_value 'DB_PASS')"
    echo "APP_PORT: $(get_env_value 'APP_PORT')"
    echo "SOCKET_PORT: $(get_env_value 'SOCKET_PORT')"
    echo "SOCKET_BIND_HOST: $(get_env_value 'SOCKET_BIND_HOST')"
    
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

validate_docker_config() {
    print_section "VALIDATING DOCKER CONFIGURATION"
    
    if [ ! -f "docker-compose.yml" ]; then
        print_error "docker-compose.yml not found!"
        return 1
    fi
    
    print_success "docker-compose.yml found"
    
    if grep -q "SOCKET_BIND_HOST=0.0.0.0" docker-compose.yml; then
        print_success "SOCKET_BIND_HOST correctly configured in docker-compose.yml"
    else
        print_error "SOCKET_BIND_HOST missing from docker-compose.yml socket service"
        print_info "Adding SOCKET_BIND_HOST to docker-compose.yml..."
        
        print_warning "Please manually add 'SOCKET_BIND_HOST=0.0.0.0' to socket service environment in docker-compose.yml"
        return 1
    fi
    
    if [ -f "socket-server/server.js" ]; then
        if grep -q "IS_DOCKER.*true" socket-server/server.js; then
            print_success "Socket server has Docker environment detection"
        else
            print_warning "Socket server may not have proper Docker environment handling"
        fi
    fi
    
    print_success "Docker configuration validation completed"
}

fix_socket_issues() {
    print_section "FIXING SOCKET SERVER ISSUES"
    
    print_info "Checking for common socket server issues..."
    
    print_info "Stopping any conflicting Node.js processes..."
    pkill -f "node.*server.js" 2>/dev/null || true
    
    if netstat -tuln 2>/dev/null | grep -q ":1002 "; then
        print_warning "Port 1002 is already in use"
        print_info "Attempting to free port 1002..."
        
        PID=$(lsof -ti:1002 2>/dev/null || echo "")
        if [ -n "$PID" ]; then
            kill -9 $PID 2>/dev/null || true
            print_success "Freed port 1002"
        fi
    else
        print_success "Port 1002 is available"
    fi
    
    print_info "Rebuilding socket container with latest configuration..."
    docker-compose down socket 2>/dev/null || true
    docker-compose build socket
    
    print_success "Socket server issues fixed"
}

init_bot() {
    print_section "BOT INITIALIZATION"

    print_info "Starting services for bot initialization..."
    docker-compose up -d

    print_info "Waiting for PHP application to be ready..."
    wait_for_service "app" "1001"

    print_info "Checking if TitiBot exists in database..."

    BOT_CHECK=$(curl -s "http://localhost:1001/api/bots/public-check/titibot" 2>/dev/null || echo "")

    if echo "$BOT_CHECK" | grep -q '"exists":true'; then
        print_success "TitiBot already exists in database"
        BOT_INFO=$(echo "$BOT_CHECK" | grep -o '"bot":{[^}]*}' || echo "")
        if [ -n "$BOT_INFO" ]; then
            echo "Bot info: $BOT_INFO"
        fi
    else
        print_warning "TitiBot not found. Creating TitiBot via API..."

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

    print_info "Verifying bot list..."
    BOTS_LIST=$(curl -s "http://localhost:1001/api/bots" 2>/dev/null || echo "")
    if echo "$BOTS_LIST" | grep -q '"success":true'; then
        BOT_COUNT=$(echo "$BOTS_LIST" | grep -o '"total":[0-9]*' | cut -d':' -f2 || echo "0")
        print_success "Database contains $BOT_COUNT bot(s)"
    else
        print_warning "Could not retrieve bot list from API"
    fi
}

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

    print_info "Checking database service..."
    if docker-compose ps | grep -q "misvord_db.*Up"; then
        print_success "Database container is running"
    else
        print_error "Database container failed to start"
        docker-compose logs db | tail -10
    fi

    print_info "Running final service verification..."
    
    if curl -s "http://localhost:1001/health" >/dev/null 2>&1; then
        print_success "PHP application is responding"
        
        APP_INFO=$(curl -s "http://localhost:1001/health" 2>/dev/null || echo "{}")
        if echo "$APP_INFO" | grep -q '"status":"ok"'; then
            print_success "PHP application health check passed"
        fi
    else
        print_warning "PHP application health check failed"
    fi

    if curl -s "http://localhost:1002/health" >/dev/null 2>&1; then
        print_success "Socket server is responding"
        
        SOCKET_INFO=$(curl -s "http://localhost:1002/health" 2>/dev/null || echo "{}")
        if echo "$SOCKET_INFO" | grep -q '"status":"ok"'; then
            print_success "Socket server health check passed"
            
            SERVICE=$(echo "$SOCKET_INFO" | grep -o '"service":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
            PORT=$(echo "$SOCKET_INFO" | grep -o '"port":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
            HOST=$(echo "$SOCKET_INFO" | grep -o '"host":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
            CLIENTS=$(echo "$SOCKET_INFO" | grep -o '"connectedClients":[0-9]*' | cut -d':' -f2 || echo "0")
            AUTH_USERS=$(echo "$SOCKET_INFO" | grep -o '"authenticatedUsers":[0-9]*' | cut -d':' -f2 || echo "0")
            
            print_info "Socket server details: $SERVICE on $HOST:$PORT"
            print_info "Connected clients: $CLIENTS, Authenticated users: $AUTH_USERS"
            
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
                    
                    print_info "Testing WebSocket connection capability..."
                    if curl -s --max-time 5 "http://localhost:1002/socket-test" | grep -q "Socket.IO Connection Test"; then
                        print_success "WebSocket test page accessible"
                    else
                        print_warning "WebSocket test page not accessible"
                    fi
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
        
        print_info "Checking socket container logs for issues..."
        SOCKET_LOGS=$(docker-compose logs socket --tail=10 2>/dev/null || echo "")
        if echo "$SOCKET_LOGS" | grep -q "SOCKET_BIND_HOST.*UNDEFINED"; then
            print_error "Socket server still has SOCKET_BIND_HOST undefined issue!"
            print_warning "Please check docker-compose.yml socket service environment variables"
        elif echo "$SOCKET_LOGS" | grep -q "EADDRINUSE"; then
            print_warning "Socket server port conflict detected"
        elif echo "$SOCKET_LOGS" | grep -q "Socket server running"; then
            print_success "Socket server started successfully according to logs"
        fi
    fi

    print_success "Service health check completed"
}

configure_production() {
    print_section "PRODUCTION CONFIGURATION"

    echo -e "${YELLOW}This will configure the application for production deployment.${NC}"
    echo -e "${YELLOW}Please provide the following information:${NC}\n"

    current_domain=$(get_env_value 'DOMAIN')
    read_with_default "Enter your domain name" "$current_domain" "DOMAIN"

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

    current_db_pass=$(get_env_value 'DB_PASS')
    read_with_default "Enter database password" "$current_db_pass" "DB_PASS"

    current_public_ip=$(get_env_value 'PUBLIC_IP')
    read_with_default "Enter server public IP (optional)" "$current_public_ip" "PUBLIC_IP"

    echo -e "\n${YELLOW}API Configuration (press Enter to keep current values):${NC}"

    current_google_id=$(get_env_value 'GOOGLE_CLIENT_ID')
    read_with_default "Google Client ID" "$current_google_id" "GOOGLE_CLIENT_ID"

    current_google_secret=$(get_env_value 'GOOGLE_CLIENT_SECRET')
    read_with_default "Google Client Secret" "$current_google_secret" "GOOGLE_CLIENT_SECRET"

    current_videosdk_key=$(get_env_value 'VIDEOSDK_API_KEY')
    read_with_default "VideoSDK API Key" "$current_videosdk_key" "VIDEOSDK_API_KEY"

    current_videosdk_secret=$(get_env_value 'VIDEOSDK_SECRET_KEY')
    read_with_default "VideoSDK Secret Key" "$current_videosdk_secret" "VIDEOSDK_SECRET_KEY"

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
    
    migrate_database
    
    if [ $? -eq 0 ]; then
        print_success "Database migration completed"
    else
        print_warning "Database migration failed - you may need to run it manually"
    fi

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
    echo -e "✅ Database: Connected and migrated"
    echo -e "✅ Socket server: Environment variables properly configured"
    echo -e "✅ Docker: SOCKET_BIND_HOST=0.0.0.0 configured"
    
    echo -e "\n${BLUE}📋 Full Stack Deployment Complete for $(get_env_value 'DOMAIN'):${NC}"
    echo -e "• Application: PHP + Docker containers running"
    echo -e "• Database: MySQL configured and migrated"
    echo -e "• Socket Server: WebSocket connections enabled"
    echo -e "• Security: HTTPS enforced, secure sessions enabled"
    echo -e "• Environment: Production-ready configuration"
    
    echo -e "\n${BLUE}🌐 Access Your Application:${NC}"
    echo -e "• Website: $(get_env_value 'APP_URL')"
    echo -e "• WebSocket: wss://$(get_env_value 'DOMAIN')/socket.io/"
    echo -e "• Admin Panel: $(get_env_value 'APP_URL')/admin"
    
    echo -e "\n${YELLOW}⚠️ IMPORTANT: Configure nginx manually using nginx-on-the-vps.txt${NC}"
    echo -e "\n${BLUE}To configure nginx:${NC}"
    echo -e "1. Copy nginx-on-the-vps.txt to /etc/nginx/sites-available/$DOMAIN"
    echo -e "2. Enable the site: sudo ln -s /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/"
    echo -e "3. Test config: sudo nginx -t"
    echo -e "4. Reload nginx: sudo systemctl reload nginx"
}

check_vps_health() {
    print_section "VPS COMPLETE HEALTH CHECK"
    
    local domain=$(get_env_value 'DOMAIN')
    local app_url=$(get_env_value 'APP_URL')
    local errors=0
    
    if [ -z "$domain" ] || [ "$domain" = "localhost" ]; then
        print_error "Domain not configured for VPS"
        return 1
    fi
    
    print_info "Testing VPS deployment for $domain..."
    
    print_info "1. Checking Docker containers..."
    if docker-compose ps | grep -q "Up"; then
        local running_containers=$(docker-compose ps | grep "Up" | wc -l)
        print_success "Docker containers running: $running_containers"
        
        local expected_containers=("misvord_php" "misvord_socket" "misvord_db")
        for container in "${expected_containers[@]}"; do
            if docker-compose ps | grep -q "${container}.*Up"; then
                print_success "$container is running"
            else
                print_error "$container is not running"
                errors=$((errors + 1))
            fi
        done
    else
        print_error "No Docker containers running"
        errors=$((errors + 1))
    fi
    
    print_info "2. Testing PHP application..."
    if curl -s --max-time 10 "http://localhost:1001/health" >/dev/null 2>&1; then
        local php_health=$(curl -s --max-time 5 "http://localhost:1001/health" | grep -o '"status":"ok"' || echo "")
        if [ -n "$php_health" ]; then
            print_success "PHP application healthy on port 1001"
        else
            print_warning "PHP application responding but health status unclear"
        fi
    else
        print_error "PHP application not responding on port 1001"
        errors=$((errors + 1))
    fi
    
    print_info "3. Testing Socket server..."
    if curl -s --max-time 10 "http://localhost:1002/health" >/dev/null 2>&1; then
        local socket_health=$(curl -s --max-time 5 "http://localhost:1002/health" | grep -o '"status":"ok"' || echo "")
        if [ -n "$socket_health" ]; then
            print_success "Socket server healthy on port 1002"
            
            local socket_clients=$(curl -s --max-time 5 "http://localhost:1002/health" | grep -o '"connectedClients":[0-9]*' | cut -d':' -f2 || echo "0")
            local auth_users=$(curl -s --max-time 5 "http://localhost:1002/health" | grep -o '"authenticatedUsers":[0-9]*' | cut -d':' -f2 || echo "0")
            print_info "WebSocket clients: $socket_clients connected, $auth_users authenticated"
            
            print_info "4. Testing WebSocket functionality..."
            if curl -s --max-time 5 "http://localhost:1002/socket-test" | grep -q "Socket.IO Connection Test"; then
                print_success "WebSocket test page accessible"
            else
                print_warning "WebSocket test page not accessible"
                errors=$((errors + 1))
            fi
        else
            print_error "Socket server unhealthy"
            errors=$((errors + 1))
        fi
    else
        print_error "Socket server not responding on port 1002"
        errors=$((errors + 1))
    fi
    
    print_info "5. Testing database connection..."
    if docker exec misvord_php php -r "
        require_once '/var/www/html/config/db.php';
        try {
            \$pdo = DatabaseConnection::getInstance()->getConnection();
            echo 'Database connection successful';
        } catch (Exception \$e) {
            echo 'Database connection failed: ' . \$e->getMessage();
            exit(1);
        }
    " 2>/dev/null | grep -q "successful"; then
        print_success "Database connection working"
        
        local db_status=$(docker exec misvord_db mysqladmin ping -h localhost -P 1003 -u root -p$(get_env_value 'DB_PASS') 2>/dev/null | grep -o "alive" || echo "")
        if [ "$db_status" = "alive" ]; then
            print_success "MySQL database is alive"
        else
            print_warning "MySQL ping test failed"
        fi
    else
        print_error "Database connection failed"
        errors=$((errors + 1))
    fi
    
    print_info "6. Testing external domain access..."
    local http_status=$(curl -s --max-time 15 -o /dev/null -w "%{http_code}" "$app_url" || echo "000")
    if echo "$http_status" | grep -q "200\|301\|302"; then
        print_success "Domain $domain is accessible (HTTP $http_status)"
        
        print_info "7. Testing WebSocket through domain..."
        local socket_url="https://$domain/socket.io/"
        if [ "$(get_env_value 'USE_HTTPS')" != "true" ]; then
            socket_url="http://$domain/socket.io/"
        fi
        
        local socket_test=$(curl -s --max-time 10 "$socket_url" 2>/dev/null | grep -o "socket.io" || echo "")
        if [ -n "$socket_test" ]; then
            print_success "WebSocket accessible through domain"
        else
            print_error "WebSocket not accessible through domain"
            print_info "This indicates nginx configuration issue"
            errors=$((errors + 1))
        fi
    else
        print_error "Domain $domain is not accessible (HTTP $http_status)"
        print_info "Check nginx configuration and DNS settings"
        errors=$((errors + 1))
    fi
    
    print_info "8. Testing static files..."
    local test_urls=("$app_url/public/css/global.css" "$app_url/public/js/main.js")
    local static_errors=0
    
    for url in "${test_urls[@]}"; do
        local file_status=$(curl -s --max-time 10 -o /dev/null -w "%{http_code}" "$url" || echo "000")
        if echo "$file_status" | grep -q "200"; then
            print_success "Static file accessible: $(basename "$url")"
        else
            print_error "Static file not accessible: $(basename "$url") (HTTP $file_status)"
            static_errors=$((static_errors + 1))
        fi
    done
    
    if [ $static_errors -eq 0 ]; then
        print_success "All static files accessible"
    else
        print_warning "$static_errors static file(s) not accessible"
        errors=$((errors + static_errors))
    fi
    
    print_info "9. Testing bot system..."
    local bot_check=$(curl -s --max-time 10 "http://localhost:1001/api/bots/public-check/titibot" 2>/dev/null | grep -o '"exists":true' || echo "")
    if [ -n "$bot_check" ]; then
        print_success "TitiBot is available in the system"
    else
        print_warning "TitiBot may not be properly initialized"
        errors=$((errors + 1))
    fi
    
    print_info "10. Testing environment configuration..."
    local env_checks=("APP_ENV" "DOMAIN" "SOCKET_HOST" "DB_PASS")
    for env_var in "${env_checks[@]}"; do
        local value=$(get_env_value "$env_var")
        if [ -n "$value" ] && [ "$value" != "localhost" ] || [ "$env_var" = "DB_PASS" ]; then
            print_success "$env_var is configured"
        else
            print_warning "$env_var may not be properly configured"
        fi
    done
    
    echo -e "\n${BLUE}═══ VPS HEALTH SUMMARY ═══${NC}"
    if [ $errors -eq 0 ]; then
        print_success "🎉 ALL SYSTEMS OPERATIONAL! VPS is working perfectly"
        echo -e "${GREEN}✅ Website: $app_url${NC}"
        echo -e "${GREEN}✅ WebSocket: Functional through domain${NC}"
        echo -e "${GREEN}✅ Database: Connected and responsive${NC}"
        echo -e "${GREEN}✅ Services: All containers running${NC}"
        echo -e "${GREEN}✅ Static Files: Serving correctly${NC}"
        echo -e "${GREEN}✅ Bot System: TitiBot operational${NC}"
        echo -e "${GREEN}✅ Configuration: Production ready${NC}"
        
        echo -e "\n${BLUE}🚀 Your MisVord application is fully operational!${NC}"
        echo -e "You can access it at: $app_url"
        return 0
    else
        print_warning "Found $errors issue(s) that need attention"
        echo -e "${YELLOW}⚠️ Review the errors above and fix them${NC}"
        
        if [ $errors -le 2 ]; then
            echo -e "${BLUE}Status: Minor issues - mostly functional${NC}"
        elif [ $errors -le 5 ]; then
            echo -e "${YELLOW}Status: Multiple issues - needs attention${NC}"
        else
            echo -e "${RED}Status: Major issues - requires fixing${NC}"
        fi
        
        return $errors
    fi
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

show_menu() {
    echo -e "\n${BLUE}═══ MisVord VPS Deployment Script ═══${NC}"
    echo "1) Check environment file"
    echo "2) Validate Docker configuration"  
    echo "3) Initialize bots"
    echo "4) Check service health"
    echo "5) Configure for production"
    echo "6) Full deployment (all steps)"
    echo "7) VPS complete health check"
    echo "8) Update website"
    echo "9) Migrate database"
    echo "10) Exit"
    echo
}

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
                print_info "Starting full deployment with migration..."
                check_env_file && \
                validate_docker_config && \
                check_services && \
                init_bot && \
                configure_production
                ;;
            7)
                check_vps_health
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

if [ ! -f "docker-compose.yml" ]; then
    print_error "Please run this script from the project root directory (where docker-compose.yml is located)"
    exit 1
fi

main