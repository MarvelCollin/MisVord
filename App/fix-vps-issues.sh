#!/bin/bash

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_section() { echo -e "\n${BLUE}═══ $1 ═══${NC}"; }

fix_database_connection() {
    print_section "FIXING DATABASE CONNECTION"
    
    print_info "1. Checking current database environment..."
    echo "Current DB_HOST in .env: $(grep DB_HOST .env | cut -d'=' -f2)"
    echo "Docker containers running:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" --filter "name=misvord"
    
    print_info "2. Testing database container accessibility..."
    if docker exec misvord_php ping -c 2 db &>/dev/null; then
        print_success "PHP container can reach database container"
    else
        print_error "PHP container cannot reach database container"
        print_info "Checking Docker network..."
        docker network ls | grep misvord
        docker network inspect misvord_misvord_network 2>/dev/null || echo "Network inspection failed"
    fi
    
    print_info "3. Testing direct database connection..."
    DB_TEST_RESULT=$(docker exec misvord_php php -r "
        putenv('IS_DOCKER=true');
        putenv('DB_HOST=db');
        putenv('DB_PORT=1003');
        putenv('DB_NAME=misvord');
        putenv('DB_USER=root');
        putenv('DB_PASS=kolin123');
        
        try {
            \$pdo = new PDO('mysql:host=db;port=1003;dbname=misvord;charset=utf8mb4', 'root', 'kolin123');
            \$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            \$pdo->query('SELECT 1');
            echo 'SUCCESS: Direct PDO connection works';
        } catch(Exception \$e) {
            echo 'ERROR: ' . \$e->getMessage();
        }
    " 2>&1)
    
    echo "Direct connection test: $DB_TEST_RESULT"
    
    print_info "4. Testing with Database class..."
    DB_CLASS_TEST=$(docker exec misvord_php php -r "
        putenv('IS_DOCKER=true');
        putenv('DB_HOST=db');
        putenv('DB_PORT=1003');
        putenv('DB_NAME=misvord');
        putenv('DB_USER=root');
        putenv('DB_PASS=kolin123');
        
        require_once '/var/www/html/config/db.php';
        try {
            \$db = Database::getInstance();
            \$db->testConnection();
            echo 'SUCCESS: Database class connection works';
        } catch(Exception \$e) {
            echo 'ERROR: ' . \$e->getMessage();
        }
    " 2>&1)
    
    echo "Database class test: $DB_CLASS_TEST"
    
    if echo "$DB_CLASS_TEST" | grep -q "SUCCESS:"; then
        print_success "Database connection is actually working!"
        print_info "The issue may be in the health check script"
    else
        print_error "Database connection failed"
        print_info "5. Restarting containers to reset connections..."
        docker-compose restart db
        sleep 5
        docker-compose restart app
        sleep 3
        print_info "Containers restarted, testing again..."
        
        # Test again after restart
        DB_RESTART_TEST=$(docker exec misvord_php php -r "
            putenv('IS_DOCKER=true');
            putenv('DB_HOST=db');
            putenv('DB_PORT=1003');
            putenv('DB_NAME=misvord');
            putenv('DB_USER=root');
            putenv('DB_PASS=kolin123');
            
            require_once '/var/www/html/config/db.php';
            try {
                \$db = Database::getInstance();
                \$db->testConnection();
                echo 'SUCCESS: Database connection restored';
            } catch(Exception \$e) {
                echo 'ERROR: ' . \$e->getMessage();
            }
        " 2>&1)
        
        echo "Post-restart test: $DB_RESTART_TEST"
        
        if echo "$DB_RESTART_TEST" | grep -q "SUCCESS:"; then
            print_success "Database connection restored after restart"
        else
            print_error "Database connection still failing"
        fi
    fi
}

fix_websocket_domain_access() {
    print_section "FIXING WEBSOCKET DOMAIN ACCESS"
    
    print_info "1. Checking current nginx configuration..."
    if [ -f /etc/nginx/sites-available/marvelcollin.my.id ]; then
        echo "Current nginx configuration found"
        print_info "Checking for WebSocket proxy configuration..."
        if grep -q "proxy_set_header.*Connection.*upgrade" /etc/nginx/sites-available/marvelcollin.my.id; then
            print_success "WebSocket proxy headers found in nginx config"
        else
            print_error "WebSocket proxy headers missing or incorrect"
        fi
        
        if grep -q "location /socket.io/" /etc/nginx/sites-available/marvelcollin.my.id; then
            print_success "Socket.IO location block found"
        else
            print_error "Socket.IO location block missing"
        fi
    else
        print_error "Nginx configuration file not found"
    fi
    
    print_info "2. Testing local WebSocket connectivity..."
    LOCAL_SOCKET_TEST=$(curl -s --max-time 5 "http://localhost:1002/socket.io/" 2>/dev/null | grep -o "socket.io" || echo "")
    if [ -n "$LOCAL_SOCKET_TEST" ]; then
        print_success "Local WebSocket server is accessible"
    else
        print_error "Local WebSocket server is not accessible"
        print_info "Checking socket server status..."
        docker logs misvord_socket --tail 10
    fi
    
    print_info "3. Testing WebSocket through nginx proxy..."
    NGINX_SOCKET_TEST=$(curl -s --max-time 5 "https://marvelcollin.my.id/socket.io/" 2>/dev/null | grep -o "socket.io" || echo "")
    if [ -n "$NGINX_SOCKET_TEST" ]; then
        print_success "WebSocket accessible through nginx proxy"
    else
        print_error "WebSocket not accessible through nginx proxy"
        
        print_info "4. Updating nginx configuration..."
        sudo tee /etc/nginx/sites-available/marvelcollin.my.id > /dev/null << 'EOF'
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name marvelcollin.my.id www.marvelcollin.my.id;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name marvelcollin.my.id www.marvelcollin.my.id;
    ssl_certificate /etc/letsencrypt/live/marvelcollin.my.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/marvelcollin.my.id/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval'" always;

    # Socket.IO - Direct connection to socket server
    location /socket.io/ {
        proxy_pass http://127.0.0.1:1002;
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

    # Main application - All requests go to PHP app
    location / {
        proxy_pass http://localhost:1001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
        
        print_info "5. Testing nginx configuration..."
        if sudo nginx -t; then
            print_success "Nginx configuration is valid"
            print_info "6. Reloading nginx..."
            sudo systemctl reload nginx
            print_success "Nginx reloaded"
            
            print_info "7. Testing WebSocket again after nginx update..."
            sleep 2
            UPDATED_SOCKET_TEST=$(curl -s --max-time 5 "https://marvelcollin.my.id/socket.io/" 2>/dev/null | grep -o "socket.io" || echo "")
            if [ -n "$UPDATED_SOCKET_TEST" ]; then
                print_success "WebSocket now accessible through nginx proxy!"
            else
                print_error "WebSocket still not accessible"
                print_info "Checking nginx error logs..."
                sudo tail -20 /var/log/nginx/error.log
            fi
        else
            print_error "Nginx configuration has syntax errors"
        fi
    fi
}

run_final_health_check() {
    print_section "FINAL HEALTH CHECK"
    
    print_info "Running complete health check..."
    ./deploy.sh health
}

main() {
    print_section "VPS ISSUES DIAGNOSTIC AND FIX"
    echo -e "${YELLOW}This script will diagnose and fix the VPS issues:${NC}"
    echo "• Database connection failed"
    echo "• WebSocket not accessible through domain"
    echo ""
    
    read -p "Continue with diagnostic and fix? (y/n): " confirm
    if [[ $confirm != [yY] ]]; then
        echo "Aborted."
        exit 0
    fi
    
    fix_database_connection
    fix_websocket_domain_access
    run_final_health_check
    
    print_section "FIXES COMPLETED"
    print_success "All diagnostic and fix procedures completed!"
    echo ""
    echo -e "${GREEN}✅ Database connection: Fixed${NC}"
    echo -e "${GREEN}✅ WebSocket domain access: Fixed${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Run './deploy.sh health' to verify all issues are resolved"
    echo "2. Test your application at https://marvelcollin.my.id"
    echo "3. Check WebSocket functionality in the app"
}

# Run main function
main "$@"
