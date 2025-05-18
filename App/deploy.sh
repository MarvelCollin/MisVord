#!/bin/bash

# Exit on error
set -e

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment process...${NC}"

# Check if docker-compose.yml exists
if [ ! -f docker-compose.yml ]; then
    echo -e "${RED}docker-compose.yml not found!${NC}"
    exit 1
fi

# Update port mappings for production
echo -e "${YELLOW}Updating port mappings for production...${NC}"
sed -i 's/"1003:1003"/"1003:1003"/g' docker-compose.yml
sed -i 's/"1001:80"/"80:80"/g' docker-compose.yml
sed -i 's/"1002:1002"/"1002:1002"/g' docker-compose.yml

# Remove development services
echo -e "${YELLOW}Removing development services...${NC}"
sed -i '/phpmyadmin:/,/^$/d' docker-compose.yml
sed -i '/adminer:/,/^$/d' docker-compose.yml

# Set production environment variables
echo -e "${YELLOW}Setting production environment variables...${NC}"
sed -i 's/APP_ENV=development/APP_ENV=production/g' docker-compose.yml
sed -i 's/NODE_ENV=development/NODE_ENV=production/g' docker-compose.yml

# Build and start containers
echo -e "${YELLOW}Building and starting containers...${NC}"
docker-compose build --no-cache
docker-compose up -d

echo -e "${GREEN}Deployment completed successfully!${NC}"

# Check container status
echo -e "${YELLOW}Container status:${NC}"
docker-compose ps 