#!/bin/bash

# MiscVord Deployment Script
# For use on marvelcollin.my.id VPS

echo "=== MiscVord Deployment Script ==="
echo "This script will deploy MiscVord to your VPS with domain marvelcollin.my.id"

# Check if Docker and Docker Compose are installed
if ! command -v docker &> /dev/null; then
    echo "Docker not found. Installing Docker..."
    sudo apt-get update
    sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
    sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
    sudo apt-get update
    sudo apt-get install -y docker-ce
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker $USER
    echo "Docker installed. You may need to log out and back in for group changes to take effect."
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose not found. Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "Docker Compose installed."
fi

# Create directory for the project if it doesn't exist
mkdir -p ~/miscvord
cd ~/miscvord

# Clone the repository (replace with your actual repository URL)
echo "Cloning repository..."
git clone https://github.com/YOUR_USERNAME/miscvord.git .

# Make sure the storage directory exists and is writable
mkdir -p storage
chmod -R 777 storage

# Update the socket connection URL in webrtc.js to use your domain
echo "Updating socket connection URL in client-side files..."
sed -i "s|const socket = io('https:.*|const socket = io('https://marvelcollin.my.id:1002', {|g" public/js/webrtc.js
sed -i "s|const remoteUrl = 'https:.*|const remoteUrl = 'https://marvelcollin.my.id:1002';|g" public/js/webrtc.js

# Start the Docker containers
echo "Starting Docker containers..."
docker-compose up -d

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