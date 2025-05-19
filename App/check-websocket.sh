#!/bin/bash

# Exit on error
set -e

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}MiscVord WebSocket Connection Tester${NC}"

# Load environment variables from .env if it exists
if [ -f .env ]; then
    echo -e "${BLUE}Loading environment from .env file...${NC}"
    export $(grep -v '^#' .env | xargs)
    echo -e "${GREEN}Environment loaded successfully${NC}"
else
    echo -e "${RED}No .env file found. Run deploy.sh first to generate configuration.${NC}"
    exit 1
fi

# Check if this is the marvelcollin.my.id deployment
IS_MARVELCOLLIN=false
if [ "$DOMAIN" = "marvelcollin.my.id" ]; then
    IS_MARVELCOLLIN=true
    echo -e "${GREEN}Detected marvelcollin.my.id deployment configuration${NC}"
fi

# Use environment variables or defaults
DOMAIN=${DOMAIN:-"localhost"}
SUBPATH=${SUBPATH:-"misvord"}
IS_VPS=${IS_VPS:-"false"}
USE_HTTPS=${USE_HTTPS:-"false"}
SOCKET_PORT=${SOCKET_PORT:-"1002"}

# Determine protocol based on HTTPS setting
if [ "$USE_HTTPS" = "true" ]; then
    PROTOCOL="https"
    WS_PROTOCOL="wss"
else
    PROTOCOL="http"
    WS_PROTOCOL="ws"
fi

# Determine URL structure based on environment
if [ "$IS_VPS" = "true" ]; then
    # VPS environment with subpath
    SOCKET_URL="$PROTOCOL://$DOMAIN/$SUBPATH/socket"
    SOCKET_WS_URL="$WS_PROTOCOL://$DOMAIN/$SUBPATH/socket/socket.io/?EIO=4&transport=websocket"
    ENV_TYPE="Production VPS (Subpath Deployment)"
    ENV_COLOR="${RED}"
    
    if [ "$IS_MARVELCOLLIN" = "true" ]; then
        ENV_TYPE="Production VPS on marvelcollin.my.id"
    fi
else
    # Local environment with direct port
    SOCKET_URL="$PROTOCOL://localhost:$SOCKET_PORT"
    SOCKET_WS_URL="$WS_PROTOCOL://localhost:$SOCKET_PORT/socket.io/?EIO=4&transport=websocket"
    ENV_TYPE="Local Development"
    ENV_COLOR="${GREEN}"
fi

echo -e "\n${YELLOW}========================================${NC}"
echo -e "${YELLOW}|       ENVIRONMENT CONFIGURATION       |${NC}"
echo -e "${YELLOW}========================================${NC}"
echo -e "  ${BLUE}• Environment Type:${NC} ${ENV_COLOR}${ENV_TYPE}${NC}"
echo -e "  ${BLUE}• IS_VPS:${NC} ${ENV_COLOR}${IS_VPS}${NC}"
echo -e "  ${BLUE}• APP_ENV:${NC} ${ENV_COLOR}$([ "$IS_VPS" = "true" ] && echo "production" || echo "local")${NC}"
echo -e "  ${BLUE}• Domain:${NC} ${DOMAIN}"
echo -e "  ${BLUE}• Subpath:${NC} /${SUBPATH}"
echo -e "  ${BLUE}• HTTPS:${NC} $([ "$USE_HTTPS" = "true" ] && echo "${GREEN}Enabled${NC}" || echo "${YELLOW}Disabled${NC}")"
echo -e "  ${BLUE}• Socket URL:${NC} ${SOCKET_URL}"
echo -e "  ${BLUE}• WebSocket URL:${NC} ${SOCKET_WS_URL}"
echo -e "  ${BLUE}• APP_PORT:${NC} ${APP_PORT:-1001}"
echo -e "  ${BLUE}• SOCKET_PORT:${NC} ${SOCKET_PORT:-1002}"
echo -e "  ${BLUE}• DB_PORT:${NC} ${DB_PORT:-1003}"

echo -e "\n${YELLOW}Testing Socket Server Health Endpoint...${NC}"
if command -v curl &> /dev/null; then
    echo -e "Trying primary socket URL: ${SOCKET_URL}/health"
    if curl -s "$SOCKET_URL/health" | grep -q "healthy"; then
        echo -e "${GREEN}✓ Socket server is healthy${NC}"
    else
        echo -e "${RED}✗ Socket server health check failed on primary URL${NC}"
        echo -e "${YELLOW}Trying alternative URL...${NC}"
        
        # Try alternative URL for different environments
        if [ "$IS_VPS" = "true" ]; then
            ALT_URL="http://localhost:1002/health"
            echo -e "Trying direct port: ${ALT_URL}"
            if curl -s "$ALT_URL" | grep -q "healthy"; then
                echo -e "${GREEN}✓ Socket server is healthy on direct port${NC}"
                echo -e "${YELLOW}NOTE: Your server is running, but NGINX configuration may be incorrect${NC}"
                
                if [ "$IS_MARVELCOLLIN" = "true" ]; then
                    echo -e "${YELLOW}Verify NGINX configuration for marvelcollin.my.id/${SUBPATH}/socket/${NC}"
                fi
            else
                echo -e "${RED}✗ Socket server health check failed on all endpoints${NC}"
                echo -e "${RED}The socket server may not be running. Check with: docker-compose ps${NC}"
            fi
        else
            # For local dev, try without socket-server container name
            ALT_URL="http://localhost:1002/health" 
            echo -e "Trying direct localhost: ${ALT_URL}"
            if curl -s "$ALT_URL" | grep -q "healthy"; then
                echo -e "${GREEN}✓ Socket server is healthy on localhost${NC}"
            else
                echo -e "${RED}✗ Socket server health check failed on all endpoints${NC}"
                echo -e "${RED}The socket server may not be running. Check with: docker-compose ps${NC}"
            fi
        fi
    fi
else
    echo -e "${RED}curl command not found. Cannot check socket server health.${NC}"
fi

echo -e "\n${YELLOW}Testing WebSocket Connection...${NC}"
if command -v wscat &> /dev/null; then
    echo -e "Attempting WebSocket connection to $SOCKET_WS_URL"
    timeout 5s wscat -c "$SOCKET_WS_URL" || echo -e "${RED}❌ WebSocket connection failed${NC}"
else
    echo -e "${RED}wscat command not found. Install it with: npm install -g wscat${NC}"
    echo -e "${YELLOW}Alternative: Use the browser console to test the connection:${NC}"
    echo -e "${BLUE}const socket = io('$SOCKET_URL', {"
    echo -e "  path: '$([ "$IS_VPS" = "true" ] && echo "/$SUBPATH/socket/socket.io" || echo "/socket.io")',"
    echo -e "  transports: ['websocket', 'polling']"
    echo -e "});"
    echo -e "socket.on('connect', () => console.log('Connected!'));"
    echo -e "socket.on('connect_error', (err) => console.error('Connection error:', err));${NC}"
fi

# Generate configuration recommendation based on environment
if [ "$IS_VPS" = "true" ]; then
    if [ "$IS_MARVELCOLLIN" = "true" ]; then
        echo -e "\n${YELLOW}==== NGINX CONFIGURATION FOR marvelcollin.my.id ====${NC}"
    else
        echo -e "\n${YELLOW}==== NGINX CONFIGURATION FOR VPS ====${NC}"
    fi
    
    echo -e "Make sure your NGINX configuration includes the following WebSocket settings:"
    echo -e "${BLUE}"
    echo -e "location /${SUBPATH}/socket/ {"
    echo -e "    proxy_pass http://localhost:1002/;"
    echo -e "    proxy_http_version 1.1;"
    echo -e "    proxy_set_header Upgrade \$http_upgrade;"
    echo -e "    proxy_set_header Connection \"upgrade\";"
    echo -e "    proxy_set_header Host \$host;"
    echo -e "    proxy_set_header X-Real-IP \$remote_addr;"
    echo -e "    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;"
    echo -e "    proxy_set_header X-Forwarded-Proto \$scheme;"
    echo -e "    proxy_cache_bypass \$http_upgrade;"
    echo -e "    proxy_read_timeout 86400;"
    echo -e "}"
    echo -e "${NC}"
    
    # For marvelcollin.my.id domain, show SSL configuration as well
    if [ "$IS_MARVELCOLLIN" = "true" ]; then
        echo -e "${YELLOW}Make sure SSL is properly configured:${NC}"
        echo -e "${BLUE}sudo certbot --nginx -d marvelcollin.my.id${NC}"
    fi
    
else
    echo -e "\n${YELLOW}==== LOCAL DEVELOPMENT CONFIGURATION ====${NC}"
    echo -e "Your socket server is running directly on port 1002"
    
    # Add message about how to change environment if needed
    echo -e "\n${YELLOW}To deploy to marvelcollin.my.id:${NC}"
    echo -e "Run: ${BLUE}./deploy.sh${NC} (now configured to always deploy for marvelcollin.my.id)"
fi

echo -e "\n${YELLOW}For complete testing:${NC}"
echo -e "1. Check server logs for connection issues:"
echo -e "   ${BLUE}docker-compose logs -f socket-server${NC}"
echo -e "2. Verify the socket server is running:" 
echo -e "   ${BLUE}docker-compose ps${NC}"
echo -e "3. Test with browser console code shown above"
echo -e "4. Test complete WebRTC functionality by accessing:"

if [ "$IS_MARVELCOLLIN" = "true" ]; then
    echo -e "   ${BLUE}https://marvelcollin.my.id/${SUBPATH}/${NC}"
else
    echo -e "   ${BLUE}$PROTOCOL://$DOMAIN/$([ "$IS_VPS" = "true" ] && echo "$SUBPATH" || echo "")${NC}"
fi

echo -e "\n${YELLOW}Port Summary:${NC}"
echo -e "  ${BLUE}• App Server:${NC} http://localhost:1001"
echo -e "  ${BLUE}• Socket Server:${NC} http://localhost:1002"
echo -e "  ${BLUE}• Database:${NC} port 1003"
echo -e "  ${BLUE}• PHPMyAdmin:${NC} http://localhost:1004"
echo -e "  ${BLUE}• Adminer:${NC} http://localhost:1005" 