@echo off  
echo "Stopping containers..."  
docker-compose down  
echo "Rebuilding PHP application container..."  
docker-compose build app  
echo "Starting all containers..."  
docker-compose up -d  
echo "Checking container status..."  
docker-compose ps  
echo ""  
echo "Application restarted. Check http://localhost:1001/webrtc to verify the fix." 
