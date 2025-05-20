#!/bin/bash
set -e  # Exit on any error

echo "========================================================="
echo "         MiscVord Application Deployment Script          "
echo "========================================================="
echo ""

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to display steps with colored output
step() {
    echo -e "${GREEN}[STEP]${NC} $1"
}

info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Add a special MySQL function for safer database operations
mysql_safe() {
    local command="$1"
    local error_message="$2"
    local retry_count=0
    local max_retries=3
    local result=1

    while [ $retry_count -lt $max_retries ] && [ $result -ne 0 ]; do
        docker exec miscvord_db mysql -h db -u root -p"${DB_PASS}" -e "$command" &>/dev/null
        result=$?
        
        if [ $result -ne 0 ]; then
            retry_count=$(expr $retry_count + 1)
            if [ $retry_count -lt $max_retries ]; then
                info "MySQL command failed. Retrying in 3 seconds... ($retry_count/$max_retries)"
                sleep 3
            else
                info "$error_message"
                info "MySQL error. Here are some troubleshooting tips:"
                info "1. Check if MySQL container is running: docker ps | grep miscvord_db"
                info "2. Check MySQL logs: docker logs miscvord_db"
                info "3. Try connecting manually: docker exec -it miscvord_db mysql -u root -p\"${DB_PASS}\""
                info "4. Verify .env and docker-compose.yml have matching password configuration"
                return 1
            fi
        fi
    done

    return 0
}

# Check if running as root (needed for some operations)
if [ "$EUID" -ne 0 ]; then
    info "Note: Some operations may require sudo privileges"
    info "You may be prompted for your password during execution"
fi

# Add a check for critical environment variables before doing anything else
step "Checking essential environment variables"

# Ensure DB_PASS is set to the default if not explicitly defined
if [ -z "${DB_PASS}" ]; then
    info "DB_PASS is not set. Setting to default 'password'"
    export DB_PASS="password"
    
    # Also update .env file if it exists
    if [ -f .env ]; then
        # Check if DB_PASS is in .env
        if grep -q "DB_PASS=" .env; then
            # Update existing
            sed -i 's/DB_PASS=.*/DB_PASS=password/' .env
        else
            # Add if doesn't exist
            echo "DB_PASS=password" >> .env
        fi
        info "Updated DB_PASS in .env"
    fi
fi

# Step 1: Setup environment variables
step "Setting up environment variables"
if [ ! -f .env ]; then
    info "Creating .env file from .env-example"
    cp .env-example .env
    
    # Let user edit the .env file if needed
    read -p "Do you want to edit the .env file before continuing? (y/n): " edit_env
    if [[ "$edit_env" == "y" || "$edit_env" == "Y" ]]; then
        if command -v nano &> /dev/null; then
            nano .env
        elif command -v vim &> /dev/null; then
            vim .env
        else
            info "No text editor found. Please manually edit .env file later."
        fi
    fi
else
    info ".env file already exists"
    read -p "Do you want to update .env file from .env-example? (y/n): " update_env
    if [[ "$update_env" == "y" || "$update_env" == "Y" ]]; then
        info "Backing up existing .env to .env.backup"
        cp .env .env.backup
        info "Updating .env file from .env-example"
        cp .env-example .env
        info "The original .env file has been backed up to .env.backup"
    fi
fi

# Add SSL_EMAIL variable to .env-example if it doesn't exist
step "Ensuring required environment variables are present"
if ! grep -q "SSL_EMAIL" .env; then
    info "Adding SSL_EMAIL variable to .env"
    echo "SSL_EMAIL=admin@${DOMAIN:-localhost}" >> .env
fi

# Load environment variables again to pick up any changes
set -a
source .env
set +a

# Step 2: Install required dependencies
step "Checking and installing required dependencies"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    info "Docker not found, installing..."
    if [ -f /etc/debian_version ]; then
        # For Debian/Ubuntu
        sudo apt-get update
        sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
        sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
        sudo apt-get update
        sudo apt-get install -y docker-ce
    elif [ -f /etc/redhat-release ]; then
        # For CentOS/RHEL
        sudo yum install -y yum-utils
        sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        sudo yum install -y docker-ce docker-ce-cli containerd.io
    else
        error "Unsupported distribution for automatic Docker installation"
    fi
else
    info "Docker is already installed"
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    info "Docker Compose not found, installing..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.18.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
else
    info "Docker Compose is already installed"
fi

# Make sure Docker service is running
if ! systemctl is-active --quiet docker; then
    info "Starting Docker service..."
    sudo systemctl start docker
fi

# Make sure current user can run docker commands
if ! groups | grep -q docker; then
    info "Adding current user to docker group..."
    sudo usermod -aG docker $USER
    info "You may need to log out and log back in for this to take effect"
fi

# Step 3: Set up Nginx
step "Setting up Nginx"

# Check if Nginx is installed
if ! command -v nginx &> /dev/null; then
    info "Installing Nginx..."
    if [ -f /etc/debian_version ]; then
        # For Debian/Ubuntu
        sudo apt-get update
        sudo apt-get install -y nginx
        
        # Install Certbot for SSL certificates
        info "Installing Certbot for SSL certificates..."
        sudo apt-get install -y certbot python3-certbot-nginx
    elif [ -f /etc/redhat-release ]; then
        sudo yum install -y nginx
    else
        error "Unsupported distribution for automatic Nginx installation"
    fi
else
    info "Nginx is already installed"
    
    # Check if Certbot is installed
    if ! command -v certbot &> /dev/null; then
        info "Installing Certbot for SSL certificates..."
        if [ -f /etc/debian_version ]; then
            sudo apt-get update
            sudo apt-get install -y certbot python3-certbot-nginx
        elif [ -f /etc/redhat-release ]; then
            sudo yum install -y certbot python3-certbot-nginx
        fi
    fi
fi

# Create Nginx configuration
nginx_config_path="/etc/nginx/sites-available/miscvord"
nginx_config_enabled="/etc/nginx/sites-enabled/miscvord"

# Create the Nginx configuration file
info "Creating Nginx configuration file..."
sudo tee $nginx_config_path > /dev/null << EOF
server {
    listen 80;
    server_name ${DOMAIN:-localhost};

    # Redirect HTTP to HTTPS if SSL is enabled
    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name ${DOMAIN:-localhost};

    # SSL Certificate Configuration
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers "EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH";
    ssl_dhparam /etc/ssl/certs/dhparam.pem;
    ssl_session_cache shared:SSL:10m;

    # Main application path
    location /${SUBPATH:-misvord}/ {
        proxy_pass http://localhost:${APP_PORT:-1001}/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Socket.IO WebSocket path
    location /${SUBPATH:-misvord}/socket/ {
        proxy_pass http://localhost:${SOCKET_PORT:-1002}/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Socket.IO WebSocket specific path for socket.io
    location /${SUBPATH:-misvord}/socket/socket.io/ {
        proxy_pass http://localhost:${SOCKET_PORT:-1002}/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # PHPMyAdmin (optional)
    location /${SUBPATH:-misvord}/phpmyadmin/ {
        proxy_pass http://localhost:${PMA_PORT:-1004}/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Adminer (optional)
    location /${SUBPATH:-misvord}/adminer/ {
        proxy_pass http://localhost:${ADMINER_PORT:-1005}/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Check if SSL certificates exist, otherwise provide guidance
ssl_dir="/etc/letsencrypt/live/${DOMAIN:-localhost}"
if [ ! -d "$ssl_dir" ] && [ "$DOMAIN" != "" ] && [ "$DOMAIN" != "localhost" ]; then
    info "SSL certificates not found at $ssl_dir"
    info "Attempting to generate SSL certificates with Certbot..."
    
    # Check if port 80 is free for the certbot challenge
    if ! lsof -i :80 &> /dev/null || pgrep nginx &> /dev/null; then
        # Try to generate certificates
        sudo certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos --email ${SSL_EMAIL:-admin@$DOMAIN}
        
        if [ $? -ne 0 ]; then
            info "Automated certificate generation failed."
            info "You will need to manually set up SSL certificates using Let's Encrypt:"
            info "sudo certbot --nginx -d ${DOMAIN:-localhost}"
        else
            info "SSL certificates generated successfully!"
        fi
    else
        info "Port 80 is in use by a process other than Nginx."
        info "Please stop that process and run this script again, or manually generate SSL certificates:"
        info "sudo certbot --nginx -d ${DOMAIN}"
    fi
else
    if [ "$DOMAIN" == "localhost" ] || [ "$DOMAIN" == "" ]; then
        info "Domain is set to localhost. Skipping SSL certificate generation."
        info "For local development, you may want to use self-signed certificates."
    elif [ -d "$ssl_dir" ]; then
        info "SSL certificates already exist at $ssl_dir"
    fi
fi

# Create a strong DH group for SSL
if [ ! -f /etc/ssl/certs/dhparam.pem ]; then
    info "Generating DHParam file (this may take a while)..."
    sudo openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048
fi

# Enable the site
info "Enabling Nginx site configuration..."
sudo ln -sf "$nginx_config_path" "$nginx_config_enabled"

# Test Nginx configuration
info "Testing Nginx configuration..."
sudo nginx -t || error "Nginx configuration test failed"

# Step 4: Docker container management
step "Docker container management"

# Create docker network if it doesn't exist
info "Ensuring docker network exists..."
docker network inspect miscvord_network >/dev/null 2>&1 || docker network create miscvord_network

# Check if docker containers already exist
CONTAINERS_EXIST=false
if docker ps -a | grep -q "miscvord_php\|miscvord_socket\|miscvord_db"; then
    CONTAINERS_EXIST=true
fi

# Ask user if they want to rebuild or just restart
if [ "$CONTAINERS_EXIST" = true ]; then
    echo ""
    echo -e "${YELLOW}Docker containers already exist. You have the following options:${NC}"
    echo "1. Rebuild all containers (takes longer but ensures latest code)"
    echo "2. Just restart existing containers (faster)"
    read -p "Enter your choice (1/2, default is 2): " rebuild_choice
    
    if [[ "$rebuild_choice" == "1" ]]; then
        info "Rebuilding all containers..."
        docker-compose down || true
        
        # Handle potential DB Password issues
        info "Note: MySQL default password is 'password'. If you're using a custom password in .env,"
        info "make sure it matches what's in your docker-compose.yml file."
        
        # Build the containers
        info "Building containers..."
        docker-compose build || error "Docker build failed"
        
        # Start the containers
        info "Starting all services..."
        docker-compose up -d || error "Failed to start Docker containers"
    else
        info "Restarting existing containers..."
        docker-compose restart || error "Failed to restart Docker containers"
    fi
else
    # No existing containers, need to build
    info "No existing containers found. Building new containers..."
    docker-compose down || true
    
    # Handle potential DB Password issues
    info "Note: MySQL default password is 'password'. If you're using a custom password in .env,"
    info "make sure it matches what's in your docker-compose.yml file."
    
    # Build the containers
    info "Building containers..."
    docker-compose build || error "Docker build failed"
    
    # Start the containers
    info "Starting all services..."
    docker-compose up -d || error "Failed to start Docker containers"
fi

# Step 5: Verify environment variables
step "Verifying environment variables"

# Ensure SOCKET_PATH matches the Nginx configuration
if [ "${SOCKET_PATH}" != "/${SUBPATH:-misvord}/socket/socket.io" ] && [ "${SOCKET_PATH}" != "" ]; then
    info "Warning: SOCKET_PATH in .env (${SOCKET_PATH}) doesn't match the expected path /${SUBPATH:-misvord}/socket/socket.io"
    read -p "Update SOCKET_PATH to match Nginx configuration? (y/n): " update_socket_path
    if [[ "$update_socket_path" == "y" || "$update_socket_path" == "Y" ]]; then
        # Update the .env file
        sed -i "s|SOCKET_PATH=.*|SOCKET_PATH=/${SUBPATH:-misvord}/socket/socket.io|g" .env
        info "SOCKET_PATH updated in .env"
        
        # Reload environment variables
        set -a
        source .env
        set +a
    else
        info "SOCKET_PATH not updated. Nginx configuration might need manual adjustment."
    fi
fi

# Step 6: Wait for services to be ready
step "Waiting for services to initialize..."
sleep 15

# Step 7: Initialize database if needed
step "Checking database initialization"

# Wait for MySQL to be ready
info "Waiting for MySQL to be fully initialized..."
attempt=1
max_attempts=30
until docker exec miscvord_db mysqladmin ping -h db -u root --password="${DB_PASS}" --silent &>/dev/null || [ $attempt -gt $max_attempts ]
do
    info "Waiting for MySQL to be ready... Attempt $attempt/$max_attempts"
    sleep 3
    ((attempt++))
done

if [ $attempt -gt $max_attempts ]; then
    error "MySQL did not become ready in time. Please check the Docker logs with: docker logs miscvord_db"
fi

info "MySQL is now ready"

# Try with default password first - connecting to the container's database service
if docker exec miscvord_db mysql -h db -u root -p"${DB_PASS}" -e "SHOW DATABASES LIKE '${DB_NAME:-misvord}'" 2>/dev/null | grep -q "${DB_NAME:-misvord}"; then
    info "Database ${DB_NAME:-misvord} already exists"
else
    info "Initializing database schema..."
    
    # Try creating database using safer method
    if ! mysql_safe "CREATE DATABASE IF NOT EXISTS \`${DB_NAME:-misvord}\`" "Failed to create database. Trying alternative methods..."; then
        info "Trying alternative connection method..."
        
        # Try option 2: MySQL native authentication
        if docker exec miscvord_db mysql -h db -u root -p"${DB_PASS}" --default-auth=mysql_native_password -e "CREATE DATABASE IF NOT EXISTS \`${DB_NAME:-misvord}\`" 2>/dev/null; then
            info "Successfully created database using native authentication"
        else
            # Try option 3: Connect without host specification
            if docker exec miscvord_db mysql -u root -p"${DB_PASS}" -e "CREATE DATABASE IF NOT EXISTS \`${DB_NAME:-misvord}\`" 2>/dev/null; then
                info "Successfully created database without host specification"
            else
                # Try option 4: Connect with localhost as host
                if docker exec miscvord_db mysql -h localhost -u root -p"${DB_PASS}" -e "CREATE DATABASE IF NOT EXISTS \`${DB_NAME:-misvord}\`" 2>/dev/null; then
                    info "Successfully created database using localhost"
                else
                    error "Failed to create database after trying multiple methods. Please check MySQL configuration manually."
                fi
            fi
        fi
    fi
    
    # Check if a database schema file exists
    if [ -f "database/schema.sql" ]; then
        info "Importing schema from database/schema.sql..."
        # Try different methods to import schema
        if ! cat database/schema.sql | docker exec -i miscvord_db mysql -h db -u root -p"${DB_PASS}" "${DB_NAME:-misvord}" 2>/dev/null; then
            if ! cat database/schema.sql | docker exec -i miscvord_db mysql -u root -p"${DB_PASS}" "${DB_NAME:-misvord}" 2>/dev/null; then
                error "Failed to import database schema. Please check the schema file and MySQL configuration."
            else
                info "Successfully imported schema using alternative method"
            fi
        else
            info "Database schema imported successfully"
        fi
    else
        info "No schema file found at database/schema.sql. You'll need to set up the schema manually."
    fi
fi

# Update the db configuration if needed
if [ "${DB_PASS}" != "password" ] && [ "${DB_PASS}" != "" ]; then
    info "Note: You've specified a custom database password in your .env file."
    info "Make sure your application is using the correct password."
    info "If you need to reset the password to default, you can run:"
    info "docker exec miscvord_db mysql -u root -p\\"${DB_PASS}\\" -e \\"ALTER USER 'root'@'%' IDENTIFIED BY 'password';\\""
fi

# Step 8: Verify deployment
step "Verifying deployment"

# Check that all containers are running
containers=("miscvord_php" "miscvord_socket" "miscvord_db" "miscvord_phpmyadmin" "miscvord_adminer")
for container in "${containers[@]}"; do
    if [ "$(docker inspect -f '{{.State.Running}}' $container 2>/dev/null)" != "true" ]; then
        error "Container $container is not running"
    else
        info "Container $container is running"
    fi
done

# Check health status for containers with health checks
containers_with_health=("miscvord_php" "miscvord_socket" "miscvord_db")
for container in "${containers_with_health[@]}"; do
    health_status=$(docker inspect -f '{{.State.Health.Status}}' $container 2>/dev/null)
    if [ "$health_status" != "healthy" ]; then
        error "Container $container health check: $health_status"
    else
        info "Container $container health check: $health_status"
    fi
done

# Restart Nginx to apply changes
step "Restarting Nginx to apply configuration"
sudo systemctl restart nginx

# Set up the Ubuntu firewall
step "Setting up firewall rules"
if command -v ufw &> /dev/null; then
    info "Configuring UFW firewall..."
    # Check if UFW is active
    if ! sudo ufw status | grep -q "Status: active"; then
        sudo ufw --force enable
    fi
    
    # Allow SSH to prevent being locked out
    sudo ufw allow ssh
    
    # Allow HTTP and HTTPS
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    
    # Allow Docker internal communication
    # This ensures containers can talk to each other
    sudo ufw allow in on docker0
    sudo ufw route allow in on docker0
    sudo ufw route allow out on docker0
    
    # Allow access to Docker published ports
    sudo ufw allow ${APP_PORT:-1001}/tcp
    sudo ufw allow ${SOCKET_PORT:-1002}/tcp
    sudo ufw allow ${DB_PORT:-1003}/tcp comment 'MySQL database port'
    sudo ufw allow ${PMA_PORT:-1004}/tcp comment 'PHPMyAdmin port'
    sudo ufw allow ${ADMINER_PORT:-1005}/tcp comment 'Adminer port'
    
    info "Firewall configured successfully"
else
    info "UFW firewall not found. Skipping firewall configuration."
fi

# Check if docker-compose.yml exists and contains proper MySQL configuration
if [ -f "docker-compose.yml" ]; then
    info "Checking Docker Compose configuration..."
    
    # Verify MySQL root password is correctly configured
    if ! grep -q "MYSQL_ROOT_PASSWORD.*password" docker-compose.yml; then
        info "Warning: MySQL root password in docker-compose.yml may not match the default 'password'"
        info "You may need to update your docker-compose.yml or explicitly set DB_PASS in .env"
    else
        info "MySQL root password configuration looks good"
    fi
else
    error "docker-compose.yml not found. This script requires docker-compose.yml to be present."
fi

# Final step - show access information
step "Deployment completed successfully!"
echo ""
echo "===== ACCESS INFORMATION ====="
echo "Main application: https://${DOMAIN:-localhost}/${SUBPATH:-misvord}/"
echo "PHPMyAdmin: https://${DOMAIN:-localhost}/${SUBPATH:-misvord}/phpmyadmin/"
echo "Adminer: https://${DOMAIN:-localhost}/${SUBPATH:-misvord}/adminer/"
echo "============================="
echo ""
info "You may need to adjust firewall settings to allow access to ports 80 and 443"
info "If you encounter any issues, check the container logs with: docker-compose logs -f"
echo ""
echo "Thank you for using MiscVord Deployment Script!" 