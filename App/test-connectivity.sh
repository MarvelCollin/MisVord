#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting MiscVord connectivity tests...${NC}"

# Check if Docker is running and containers are up
echo -e "\n${YELLOW}Checking Docker containers:${NC}"
if ! docker ps >/dev/null 2>&1; then
  echo -e "${RED}Error: Docker is not running or you don't have permissions${NC}"
  exit 1
fi

# Check if all required containers are running
echo -e "\n${YELLOW}Checking required containers:${NC}"
for container in miscvord_php miscvord_socket miscvord_db; do
  if docker ps | grep -q $container; then
    echo -e "${GREEN}✓ $container is running${NC}"
  else
    echo -e "${RED}✗ $container is not running${NC}"
  fi
done

# Test MySQL connectivity
echo -e "\n${YELLOW}Testing MySQL connectivity:${NC}"
if docker exec miscvord_php sh -c "php -r '\$conn=new PDO(\"mysql:host=db;port=1003;dbname=misvord\", \"root\", \"password\"); echo \"Connected\";'" >/dev/null 2>&1; then
  echo -e "${GREEN}✓ PHP app can connect to MySQL${NC}"
else
  echo -e "${RED}✗ PHP app cannot connect to MySQL${NC}"
fi

# Test socket server health
echo -e "\n${YELLOW}Testing socket server health:${NC}"
if docker exec miscvord_php sh -c "curl -s http://socket-server:1002/health" | grep -q "healthy"; then
  echo -e "${GREEN}✓ Socket server is healthy${NC}"
else
  echo -e "${RED}✗ Socket server health check failed${NC}"
fi

# Test external ports
echo -e "\n${YELLOW}Testing exposed ports:${NC}"
host_ip=$(hostname -I | awk '{print $1}')
echo "Server IP: $host_ip"

for port in 1001 1002 1003 1004 1005; do
  if nc -z localhost $port >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Port $port is open locally${NC}"
  else
    echo -e "${RED}✗ Port $port is not accessible locally${NC}"
  fi
done

echo -e "\n${YELLOW}Socket Server URL Configuration:${NC}"
echo -e "SOCKET_SERVER env: $(docker exec miscvord_php sh -c 'echo $SOCKET_SERVER')"
echo -e "SOCKET_URL env in socket server: $(docker exec miscvord_socket sh -c 'echo $SOCKET_URL')"

# Check if port 1002 is accessible via the host IP
echo -e "\n${YELLOW}Testing WebRTC socket server connectivity:${NC}"
socket_url="http://$host_ip:1002/health"
if curl -s "$socket_url" | grep -q "healthy"; then
  echo -e "${GREEN}✓ Socket server is accessible at $socket_url${NC}"
else
  echo -e "${RED}✗ Socket server is not accessible at $socket_url${NC}"
fi

echo -e "\n${GREEN}Testing completed!${NC}\n"
echo -e "If all tests pass, MiscVord should be working correctly on your VPS."
echo -e "View the application at: http://$host_ip:1001" 