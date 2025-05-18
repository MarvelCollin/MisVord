#!/bin/bash

# Exit on error
set -e

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment for subpath configuration at marvelcollin.my.id/misvord...${NC}"

# Check if docker-compose.yml exists
if [ ! -f docker-compose.yml ]; then
    echo -e "${RED}docker-compose.yml not found!${NC}"
    exit 1
fi

# Configure environment variable for subpath deployment
echo -e "${YELLOW}Setting up environment variables for subpath deployment...${NC}"
cat > .env << EOL
APP_ENV=production
DB_HOST=db
DB_PORT=1003
DB_NAME=misvord
DB_USER=root
DB_PASS=password
DB_CHARSET=utf8mb4
SOCKET_SERVER=https://marvelcollin.my.id/misvord/socket
SOCKET_SERVER_LOCAL=http://localhost:1002
SOCKET_URL=http://socket-server:1002
SOCKET_PATH=/socket.io
SOCKET_API_KEY=kolin123
CORS_ALLOWED_ORIGINS=*
EOL

echo -e "${GREEN}Environment file created successfully!${NC}"

# Update docker-compose.yml file for production
echo -e "${YELLOW}Updating docker-compose.yml for production...${NC}"
cp docker-compose.yml docker-compose.yml.bak

# Add environment variable for Socket.IO path
sed -i 's/SOCKET_URL=http:\/\/socket-server:1002/SOCKET_URL=http:\/\/socket-server:1002\n      - SOCKET_PATH=\/socket.io/g' docker-compose.yml

echo -e "${GREEN}docker-compose.yml updated successfully!${NC}"

# Copy Nginx config to the right location
echo -e "${YELLOW}Setting up Nginx configuration...${NC}"
echo -e "${YELLOW}On your VPS, run the following commands:${NC}"
echo -e "${GREEN}sudo cp nginx-config.conf /etc/nginx/sites-available/misvord.conf${NC}"
echo -e "${GREEN}sudo ln -s /etc/nginx/sites-available/misvord.conf /etc/nginx/sites-enabled/misvord.conf${NC}"
echo -e "${GREEN}sudo nginx -t${NC}"
echo -e "${GREEN}sudo systemctl reload nginx${NC}"

# Start the application
echo -e "${YELLOW}Starting application with Docker Compose...${NC}"
echo -e "${GREEN}docker-compose down${NC}"
echo -e "${GREEN}docker-compose up -d${NC}"

echo -e "${YELLOW}===== DEPLOYMENT INSTRUCTIONS =====${NC}"
echo -e "${GREEN}1. Upload all files to your VPS${NC}"
echo -e "${GREEN}2. Run this script on the VPS: ./deploy-subpath.sh${NC}"
echo -e "${GREEN}3. Set up the Nginx configuration${NC}"
echo -e "${GREEN}4. Start Docker Compose${NC}"
echo -e "${GREEN}5. Access your application at https://marvelcollin.my.id/misvord/${NC}"

echo -e "${YELLOW}===== ACCESS INFORMATION =====${NC}"
echo -e "${GREEN}Main Application: https://marvelcollin.my.id/misvord/${NC}"
echo -e "${GREEN}Video Chat: https://marvelcollin.my.id/misvord/webrtc${NC}"
echo -e "${GREEN}Socket Server: https://marvelcollin.my.id/misvord/socket${NC}"
echo -e "${GREEN}PHPMyAdmin: https://marvelcollin.my.id/misvord/pma/${NC}"
echo -e "${GREEN}Adminer: https://marvelcollin.my.id/misvord/adminer/${NC}"

echo -e "${YELLOW}Deployment setup completed successfully!${NC}" 