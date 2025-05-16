#!/bin/bash

# MiscVord Deployment Script
# For use on marvelcollin.my.id VPS

echo "=== MiscVord Deployment Script ==="
echo "This script will deploy MiscVord to your VPS with domain marvelcollin.my.id"
echo "Assumes Docker and Docker Compose are already installed"

# Make sure the storage directory exists and is writable
mkdir -p storage
chmod -R 777 storage

# Update the docker-compose.yml file with the correct ports
echo "Updating docker-compose.yml with custom ports..."
sed -i 's/"8000:80"/"1001:80"/g' docker-compose.yml
sed -i 's/"3001:3000"/"1002:3000"/g' docker-compose.yml
sed -i 's/"3306:3306"/"1003:3306"/g' docker-compose.yml
sed -i 's/"8080:80"/"1004:80"/g' docker-compose.yml
sed -i 's/"8081:8080"/"1005:8080"/g' docker-compose.yml

# Update the socket connection URL in webrtc.js to use your domain
echo "Updating socket connection URL in client-side files..."
if [ -f public/js/webrtc.js ]; then
    sed -i "s|const socket = io('https:.*|const socket = io('https://marvelcollin.my.id:1002', {|g" public/js/webrtc.js
    sed -i "s|const remoteUrl = 'https:.*|const remoteUrl = 'https://marvelcollin.my.id:1002';|g" public/js/webrtc.js
    echo "Socket URLs updated successfully."
else
    echo "Warning: Could not find webrtc.js file. Socket URLs not updated."
fi

# Make check-ports.sh executable if it exists
if [ -f check-ports.sh ]; then
    chmod +x check-ports.sh
    echo "Made check-ports.sh executable."
fi

# Start the Docker containers
echo "Starting Docker containers..."
docker-compose up -d

# Verify services started correctly
echo "Verifying services..."
sleep 5  # Give containers a moment to start
docker ps

echo ""
echo "=== Deployment Completed ==="
echo ""
echo "MiscVord should now be running at:"
echo "Main Application: https://marvelcollin.my.id:1001"
echo "Socket Server: https://marvelcollin.my.id:1002"
echo "PHPMyAdmin: https://marvelcollin.my.id:1004"
echo "Adminer: https://marvelcollin.my.id:1005"
echo ""
echo "Important: Make sure to configure your domain DNS and open the necessary ports in your firewall."
echo "You might also want to set up SSL certificates using Let's Encrypt for HTTPS."
echo ""
echo "Run ./check-ports.sh to verify all services are running correctly." 