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

# Check if running as root (needed for some operations)
if [ "$EUID" -ne 0 ]; then
    info "Note: Some operations may require sudo privileges"
    info "You may be prompted for your password during execution"
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
if [ -f /etc/nginx/sites-enabled ]; then
    sudo ln -sf $nginx_config_path $nginx_config_enabled
fi

# Test Nginx configuration
info "Testing Nginx configuration..."
sudo nginx -t || error "Nginx configuration test failed"

# Step 4: Build and start Docker containers
step "Building Docker containers"

# Make sure to clear any existing containers with the same names
info "Stopping any existing containers..."
docker-compose down || true

# Build the containers
info "Building containers..."
docker-compose build || error "Docker build failed"

# Start the containers
step "Starting Docker containers"
info "Starting all services..."
docker-compose up -d || error "Failed to start Docker containers"

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
if docker exec miscvord_db mysql -u root -p"${DB_PASS:-password}" -e "SHOW DATABASES LIKE '${DB_NAME:-misvord}'" 2>/dev/null | grep -q "${DB_NAME:-misvord}"; then
    info "Database ${DB_NAME:-misvord} already exists"
else
    info "Initializing database schema..."
    # Check if a database schema file exists
    if [ -f "database/schema.sql" ]; then
        docker exec -i miscvord_db mysql -u root -p"${DB_PASS:-password}" < database/schema.sql
        info "Database initialized from schema file"
    else
        # Create an empty database
        docker exec miscvord_db mysql -u root -p"${DB_PASS:-password}" -e "CREATE DATABASE IF NOT EXISTS \`${DB_NAME:-misvord}\`"
        info "Empty database created. You'll need to set up the schema manually."
    fi
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
    
    # Allow docker ports if needed from outside
    # Uncomment if you need these ports accessible from outside the server
    # sudo ufw allow ${APP_PORT:-1001}/tcp
    # sudo ufw allow ${SOCKET_PORT:-1002}/tcp
    
    info "Firewall configured successfully"
else
    info "UFW firewall not found. Skipping firewall configuration."
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