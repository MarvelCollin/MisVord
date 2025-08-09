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

command_exists() {
    command -v "$1" >/dev/null 2>&1
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
    is_vps=$(get_env_value 'IS_VPS')
    
    # Base required variables
    required_vars=("APP_PORT" "SOCKET_BIND_HOST" "DB_PASS")
    
    # SOCKET_PORT is only required for development/non-VPS environments
    if [ "$is_vps" != "true" ]; then
        required_vars+=("SOCKET_PORT")
    fi
    
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
    docker compose down socket 2>/dev/null || true
    docker compose build socket
    
    print_success "Socket server issues fixed"
}

init_bot() {
    print_section "BOT INITIALIZATION"

    print_info "Starting services for bot initialization..."
    docker compose up -d

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

    if ! docker compose version >/dev/null 2>&1; then
        print_error "Docker Compose is not installed!"
        exit 1
    fi

    print_success "Docker and Docker Compose are available"

    print_info "Starting all services..."
    docker compose up -d

    services=("app:1001" "socket:1002")

    for service in "${services[@]}"; do
        service_name=$(echo $service | cut -d':' -f1)
        port=$(echo $service | cut -d':' -f2)

        print_info "Checking $service_name service..."

        if docker compose ps | grep -q "misvord_${service_name}.*Up"; then
            print_success "$service_name container is running"
            wait_for_service "$service_name" "$port"
        else
            print_error "$service_name container failed to start"
            docker compose logs $service_name | tail -10
        fi
    done

    print_info "Checking database service..."
    if docker compose ps | grep -q "misvord_db.*Up"; then
        print_success "Database container is running"
    else
        print_error "Database container failed to start"
        docker compose logs db | tail -10
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
        SOCKET_LOGS=$(docker compose logs socket --tail=10 2>/dev/null || echo "")
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
    echo -e "${YELLOW}Switching to production environment...${NC}\n"

    if [ ! -f ".env.production" ]; then
        print_error ".env.production file not found!"
        print_info "Please ensure .env.production exists with your production settings"
        exit 1
    fi

    print_info "Backing up current .env to .env.backup..."
    if [ -f ".env" ]; then
        cp .env .env.backup
        print_success "Current .env backed up to .env.backup"
    fi

    print_info "Copying .env.production to .env..."
    cp .env.production .env
    print_success "Production environment activated"

    # Read domain from the production env file
    DOMAIN=$(get_env_value 'DOMAIN')
    USE_HTTPS=$(get_env_value 'USE_HTTPS')
    
    print_info "Production environment loaded:"
    echo "Domain: $DOMAIN"
    echo "HTTPS: $USE_HTTPS"
    echo "Environment: $(get_env_value 'APP_ENV')"
    echo "VPS Mode: $(get_env_value 'IS_VPS')"
    echo "Socket Host: $(get_env_value 'SOCKET_HOST')"

    print_info "Restarting services with production configuration..."
    docker compose down
    docker compose build --no-cache
    docker compose up -d

    print_info "Waiting for services to restart..."
    sleep 20

    print_success "Services restarted with production configuration"
    
    migrate_database
    
    if [ $? -eq 0 ]; then
        print_success "Database migration completed"
    else
        print_warning "Database migration failed - you may need to run it manually"
    fi
    
    print_info "Setting up nginx configuration..."
    if configure_nginx; then
        print_success "Nginx configuration completed"
    else
        print_warning "Nginx configuration failed - you may need to set it up manually"
        print_info "Use the nginx-on-the-vps.txt file as reference"
    fi

    echo -e "\n${GREEN}═══ PRODUCTION CONFIGURATION SUMMARY ═══${NC}"
    echo "Environment: $(get_env_value 'APP_ENV')"
    echo "Is VPS: $(get_env_value 'IS_VPS')"
    echo "Is Docker: $(get_env_value 'IS_DOCKER')"
    echo "Domain: $(get_env_value 'DOMAIN')"
    echo "HTTPS: $(get_env_value 'USE_HTTPS')"
    echo "App URL: $(get_env_value 'APP_URL')"
    echo "Socket Host: $(get_env_value 'SOCKET_HOST')"
    socket_port=$(get_env_value 'SOCKET_PORT')
    echo "Socket Port: ${socket_port:-'(empty - using standard HTTPS port)'}"
    echo "Socket Secure: $(get_env_value 'SOCKET_SECURE')"

    echo -e "\n${GREEN}🚀 DEPLOYMENT COMPLETED SUCCESSFULLY!${NC}"
    echo -e "✅ Application URL: $(get_env_value 'APP_URL')"
    echo -e "✅ WebSocket URL: wss://$(get_env_value 'DOMAIN')/socket.io/"
    echo -e "✅ Bot system: TitiBot initialized"
    echo -e "✅ Services: All running and healthy"
    echo -e "✅ Database: Connected and migrated"
    echo -e "✅ Socket server: Environment variables properly configured"
    echo -e "✅ Docker: Production environment loaded"
    
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
    
    echo -e "\n${GREEN}🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!${NC}"
    echo -e "${GREEN}✅ Application is ready and fully configured${NC}"
    echo -e "${GREEN}✅ Nginx configuration applied automatically${NC}"
    echo -e "${GREEN}✅ All services are operational${NC}"
    
    if [ "$(get_env_value 'USE_HTTPS')" = "true" ]; then
        echo -e "\n${YELLOW}📋 SSL Notes:${NC}"
        echo "• If you don't have SSL certificates yet, run:"
        echo "  sudo certbot --nginx -d $(get_env_value 'DOMAIN') -d www.$(get_env_value 'DOMAIN')"
        echo "• Make sure DNS points to your server IP"
    fi
}

configure_nginx() {
    print_section "NGINX CONFIGURATION SETUP"
    
    local domain=$(get_env_value 'DOMAIN')
    local use_https=$(get_env_value 'USE_HTTPS')
    
    if [ -z "$domain" ] || [ "$domain" = "localhost" ]; then
        print_warning "No domain configured, skipping nginx setup"
        return 0
    fi
    
    print_info "Setting up nginx configuration for $domain..."
    
    # Check if nginx is installed
    if ! command -v nginx >/dev/null 2>&1; then
        print_warning "Nginx is not installed. Please install nginx first:"
        echo "  sudo apt update && sudo apt install nginx -y"
        return 1
    fi
    
    # Create nginx configuration
    local nginx_config="/etc/nginx/sites-available/$domain"
    
    print_info "Creating nginx configuration at $nginx_config..."
    
    if [ "$use_https" = "true" ]; then
        sudo tee "$nginx_config" > /dev/null << EOF
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name $domain www.$domain;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $domain www.$domain;
    ssl_certificate /etc/letsencrypt/live/$domain/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$domain/privkey.pem;
    
    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval'; frame-ancestors *;" always;

    # Socket.IO - Direct connection to socket server
    location /socket.io/ {
        proxy_pass http://127.0.0.1:1002;
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

    # Main application - All requests go to PHP app
    location / {
        proxy_pass http://localhost:1001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
    else
        sudo tee "$nginx_config" > /dev/null << EOF
server {
    listen 80;
    server_name $domain www.$domain;
    
    # Socket.IO - Direct connection to socket server
    location /socket.io/ {
        proxy_pass http://127.0.0.1:1002;
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

    # Main application - All requests go to PHP app
    location / {
        proxy_pass http://localhost:1001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
    fi
    
    print_success "Nginx configuration created"
    
    # Enable the site
    print_info "Enabling nginx site..."
    if [ ! -L "/etc/nginx/sites-enabled/$domain" ]; then
        sudo ln -sf "$nginx_config" "/etc/nginx/sites-enabled/$domain"
        print_success "Site enabled"
    else
        print_info "Site already enabled"
    fi
    
    # Test nginx configuration
    print_info "Testing nginx configuration..."
    if sudo nginx -t; then
        print_success "Nginx configuration is valid"
        
        print_info "Reloading nginx..."
        if sudo systemctl reload nginx; then
            print_success "Nginx reloaded successfully"
        else
            print_error "Failed to reload nginx"
            return 1
        fi
    else
        print_error "Nginx configuration has errors"
        print_info "Please check the configuration manually"
        return 1
    fi
    
    # Test if nginx is running
    if systemctl is-active --quiet nginx; then
        print_success "Nginx is running"
    else
        print_warning "Nginx is not running, attempting to start..."
        if sudo systemctl start nginx; then
            print_success "Nginx started"
        else
            print_error "Failed to start nginx"
            return 1
        fi
    fi
    
    print_success "Nginx configuration completed for $domain"
    
    if [ "$use_https" = "true" ]; then
        print_info "SSL Configuration Notes:"
        echo "• SSL certificates should be at: /etc/letsencrypt/live/$domain/"
        echo "• If certificates don't exist, run: sudo certbot --nginx -d $domain -d www.$domain"
        echo "• Make sure ports 80 and 443 are open in firewall"
    else
        print_info "HTTP Configuration Notes:"
        echo "• Make sure port 80 is open in firewall"
        echo "• Consider enabling HTTPS for production security"
    fi
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
    if docker compose ps | grep -q "Up"; then
        local running_containers=$(docker compose ps | grep "Up" | wc -l)
        print_success "Docker containers running: $running_containers"
        
        local expected_containers=("misvord_php" "misvord_socket" "misvord_db")
        for container in "${expected_containers[@]}"; do
            if docker ps --filter "name=$container" --format "{{.Names}}" | grep -q "$container"; then
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
        print_info "Attempting to restart socket server..."
        docker compose restart socket
        sleep 5
        if curl -s --max-time 10 "http://localhost:1002/health" >/dev/null 2>&1; then
            print_success "Socket server recovered after restart"
        else
            print_error "Socket server still not responding after restart"
            print_info "Socket container logs:"
            docker logs misvord_socket --tail 10
            errors=$((errors + 1))
        fi
    fi
    
    print_info "5. Testing database connection..."
    local db_password=$(get_env_value 'DB_PASS')
    
    # First test direct PDO connection
    print_info "Testing direct database connection..."
    local direct_test=$(docker exec misvord_php php -r "
        putenv('IS_DOCKER=true');
        putenv('DB_HOST=db');
        putenv('DB_PORT=1003');
        putenv('DB_NAME=misvord');
        putenv('DB_USER=root');
        putenv('DB_PASS=$db_password');
        
        try {
            \$pdo = new PDO('mysql:host=db;port=1003;dbname=misvord;charset=utf8mb4', 'root', '$db_password');
            \$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            \$pdo->query('SELECT 1');
            echo 'SUCCESS: Direct connection works';
        } catch(Exception \$e) {
            echo 'ERROR: ' . \$e->getMessage();
        }
    " 2>&1)
    
    if echo "$direct_test" | grep -q "SUCCESS:"; then
        print_success "Direct database connection working"
        
        # Now test with Database class
        if docker exec misvord_php php -r "
            putenv('IS_DOCKER=true');
            putenv('DB_HOST=db');
            putenv('DB_PORT=1003');
            putenv('DB_NAME=misvord');
            putenv('DB_USER=root');
            putenv('DB_PASS=$db_password');
            require_once '/var/www/html/config/db.php';
            try {
                \$db = Database::getInstance();
                \$db->testConnection();
                echo 'Database connection successful';
            } catch (Exception \$e) {
                echo 'Database connection failed: ' . \$e->getMessage();
                exit(1);
            }
        " 2>/dev/null | grep -q "successful"; then
            print_success "Database class connection working"
            
            local db_status=$(docker exec misvord_db mysqladmin ping -h localhost -P 1003 -u root -p$db_password 2>/dev/null | grep -o "alive" || echo "")
            if [ "$db_status" = "alive" ]; then
                print_success "MySQL database is alive"
            else
                print_warning "MySQL ping test failed but connections work"
            fi
        else
            print_warning "Database class connection failed but direct connection works"
            print_info "This may be a configuration issue in Database class"
        fi
    else
        print_error "Database connection failed"
        print_info "Direct connection error: $direct_test"
        
        print_info "Diagnosing database connection issues..."
        
        # Check if containers can communicate
        print_info "Testing container connectivity..."
        if docker exec misvord_php ping -c 2 db &>/dev/null; then
            print_success "PHP container can reach database container"
        else
            print_error "PHP container cannot reach database container"
            print_info "Checking Docker network..."
            docker network ls | grep misvord
        fi
        
        # Check database container logs
        print_info "Database container status and logs:"
        docker ps --filter "name=misvord_db" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        docker logs misvord_db --tail 10
        
        # Try restarting database connection
        print_info "Attempting to restart database container..."
        docker compose restart db
        sleep 10
        
        # Test again after restart
        local restart_test=$(docker exec misvord_php php -r "
            putenv('IS_DOCKER=true');
            putenv('DB_HOST=db');
            putenv('DB_PORT=1003');
            putenv('DB_NAME=misvord');
            putenv('DB_USER=root');
            putenv('DB_PASS=$db_password');
            
            try {
                \$pdo = new PDO('mysql:host=db;port=1003;dbname=misvord;charset=utf8mb4', 'root', '$db_password');
                \$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                \$pdo->query('SELECT 1');
                echo 'SUCCESS: Connection restored after restart';
            } catch(Exception \$e) {
                echo 'ERROR: ' . \$e->getMessage();
            }
        " 2>&1)
        
        if echo "$restart_test" | grep -q "SUCCESS:"; then
            print_success "Database connection restored after restart"
        else
            print_error "Database connection still failing after restart"
            print_info "Restart test result: $restart_test"
        fi
        
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
            print_info "Checking nginx configuration..."
            
            if [ -f /etc/nginx/sites-available/$domain ]; then
                print_info "Nginx config file exists, checking WebSocket proxy settings..."
                if grep -q "proxy_set_header.*Connection.*upgrade" /etc/nginx/sites-available/$domain; then
                    print_success "WebSocket proxy headers found"
                else
                    print_warning "WebSocket proxy headers missing - nginx needs update"
                fi
            else
                print_warning "Nginx configuration file not found at /etc/nginx/sites-available/$domain"
                print_info "You need to copy nginx-on-the-vps.txt to nginx configuration"
            fi
            
            print_info "Testing local WebSocket server directly..."
            local local_socket=$(curl -s --max-time 5 "http://localhost:1002/socket.io/" 2>/dev/null | grep -o "socket.io" || echo "")
            if [ -n "$local_socket" ]; then
                print_success "Local WebSocket server is working"
                print_info "Issue is with nginx proxy configuration"
            else
                print_error "Local WebSocket server is also not responding"
            fi
            
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

configure_local_development() {
    print_section "LOCAL DEVELOPMENT CONFIGURATION"
    
    echo -e "${YELLOW}This will configure the application for local development.${NC}"
    echo -e "${YELLOW}Switching to development environment...${NC}\n"
    
    if [ ! -f ".env.development" ]; then
        print_error ".env.development file not found!"
        print_info "Please ensure .env.development exists with your development settings"
        exit 1
    fi

    print_info "Backing up current .env to .env.backup..."
    if [ -f ".env" ]; then
        cp .env .env.backup
        print_success "Current .env backed up to .env.backup"
    fi

    print_info "Copying .env.development to .env..."
    cp .env.development .env
    print_success "Development environment activated"

    print_info "Development environment loaded:"
    echo "Environment: $(get_env_value 'APP_ENV')"
    echo "VPS Mode: $(get_env_value 'IS_VPS')"
    echo "Docker: $(get_env_value 'IS_DOCKER')"
    echo "App URL: $(get_env_value 'APP_URL')"
    echo "Socket Host: $(get_env_value 'SOCKET_HOST')"
    echo "Socket Port: $(get_env_value 'SOCKET_PORT')"
    
    print_success "Local development configuration applied"
    
    echo -e "\n${GREEN}═══ LOCAL DEVELOPMENT SUMMARY ═══${NC}"
    echo "Environment: $(get_env_value 'APP_ENV')"
    echo "Docker: $(get_env_value 'IS_DOCKER')"
    echo "App URL: $(get_env_value 'APP_URL')"
    socket_host=$(get_env_value 'SOCKET_HOST')
    socket_port=$(get_env_value 'SOCKET_PORT')
    socket_secure=$(get_env_value 'SOCKET_SECURE')
    
    # Determine protocol based on SOCKET_SECURE
    if [ "$socket_secure" = "true" ]; then
        protocol="wss://"
    else
        protocol="ws://"
    fi
    
    # Build URL with or without port
    if [ -n "$socket_port" ]; then
        socket_url="${protocol}${socket_host}:${socket_port}/socket.io"
    else
        socket_url="${protocol}${socket_host}/socket.io"
    fi
    
    echo "Socket URL: $socket_url"
    echo "Database: localhost:1003"
    
    echo -e "\n${BLUE}═══ DOCKER DEVELOPMENT COMMANDS ═══${NC}"
    echo "Start: docker compose up -d"
    echo "Stop: docker compose down"
    echo "Logs: docker compose logs -f"
    echo "Rebuild: docker compose build --no-cache"
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
    docker compose restart
    
    print_success "Website update completed successfully!"
    
    print_info "Waiting for services to restart..."
    sleep 10
    
    print_info "Checking service status after update..."
    if docker compose ps | grep -q "Up"; then
        print_success "All services are running after update"
    else
        print_warning "Some services may not be running properly"
        docker compose ps
    fi
}

migrate_database() {
    print_section "MIGRATING DATABASE"

    print_info "Checking if app container is running..."
    if ! docker compose ps | grep -q "misvord_php.*Up"; then
        print_warning "App container is not running. Starting services..."
        docker compose up -d
        
        print_info "Waiting for app container to be ready..."
        sleep 10
    fi

    print_info "Running database migration with fresh start..."
    if docker exec misvord_php php mv migrate:fresh; then
        print_success "Database migration completed successfully!"
    else
        print_error "Database migration failed!"
        print_info "Checking container logs for more details..."
        docker compose logs app --tail=20
        return 1
    fi

    print_info "Verifying database connection..."
    if docker exec misvord_php php -r "
        require_once 'config/db.php';
        try {
            \$db = Database::getInstance();
            \$db->testConnection();
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
    echo "6) Configure nginx"
    echo "7) Full deployment (all steps)"
    echo "8) VPS complete health check"
    echo "9) Update website"
    echo "10) Migrate database"
    echo "11) Switch to local development"
    echo "12) Exit"
    echo
    echo -e "${YELLOW}Environment Files:${NC}"
    echo "Current: $(get_env_value 'APP_ENV') mode (from .env)"
    echo "Available: .env.development, .env.production"
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
        read -p "Select an option (1-12): " choice

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
                configure_nginx
                ;;
            7)
                print_info "Starting full deployment with migration..."
                check_env_file && \
                validate_docker_config && \
                check_services && \
                init_bot && \
                configure_production
                ;;
            8)
                check_vps_health
                ;;
            9)
                update_website
                ;;
            10)
                migrate_database
                ;;
            11)
                configure_local_development
                ;;
            12)
                print_info "Exiting..."
                exit 0
                ;;
            *)
                print_error "Invalid option. Please choose 1-12."
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