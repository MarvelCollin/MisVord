#!/bin/bash

# Script to restart the application containers after fixing routing issues

echo "Stopping containers..."
docker-compose down

echo "Rebuilding PHP application container..."
docker-compose build app

echo "Starting all containers..."
docker-compose up -d

echo "Checking container status..."
docker-compose ps

echo "Waiting for services to stabilize..."
sleep 5

echo "Checking Apache error logs for routing issues:"
docker logs miscvord_php 2>&1 | grep -i "error" | tail -n 20

echo ""
echo "Application restarted. Check http://localhost:1001/webrtc to verify the fix." 