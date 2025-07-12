# MisVord WebSocket Diagnostic and Configuration Scripts

This directory contains scripts to help diagnose and fix WebSocket connectivity issues in the MisVord application.

## Scripts Overview

### 1. `configure-environment.sh`
Configures environment variables for different deployment scenarios.

**Usage:**
```bash
# Configure for VPS deployment with HTTPS
./scripts/configure-environment.sh vps marvelcollin.my.id true

# Configure for local development
./scripts/configure-environment.sh local

# Verify current configuration
./scripts/configure-environment.sh verify
```

### 2. `diagnose-websocket.sh`
Comprehensive WebSocket diagnostic tool that tests all aspects of connectivity.

**Usage:**
```bash
# Run full diagnostic report
./scripts/diagnose-websocket.sh

# Test specific components
./scripts/diagnose-websocket.sh health      # Test socket health endpoint
./scripts/diagnose-websocket.sh websocket  # Test WebSocket connection
./scripts/diagnose-websocket.sh polling    # Test Socket.IO polling
./scripts/diagnose-websocket.sh containers # Check Docker containers
./scripts/diagnose-websocket.sh nginx      # Check nginx configuration
```

### 3. `test-websocket.sh`
Quick WebSocket connectivity test for rapid troubleshooting.

**Usage:**
```bash
# Run quick connectivity test
./scripts/test-websocket.sh
```

## Common WebSocket Issues and Solutions

### Issue 1: "WebSocket connection failed" on VPS
**Symptoms:**
- Browser shows WebSocket connection errors
- Socket.IO falls back to polling

**Diagnosis:**
```bash
./scripts/diagnose-websocket.sh websocket
```

**Solutions:**
1. Check nginx configuration includes Socket.IO proxy
2. Verify SSL certificates are properly configured
3. Ensure firewall allows ports 80 and 443
4. Check CORS configuration in docker-compose.yml

### Issue 2: Environment variable mismatch
**Symptoms:**
- Socket connects locally but not on VPS
- Mixed HTTP/HTTPS protocols

**Diagnosis:**
```bash
./scripts/configure-environment.sh verify
```

**Solutions:**
1. Reconfigure environment for VPS:
   ```bash
   ./scripts/configure-environment.sh vps your-domain.com true
   ```
2. Rebuild Docker containers:
   ```bash
   docker-compose down && docker-compose up -d
   ```

### Issue 3: CORS errors
**Symptoms:**
- Console shows CORS policy errors
- Socket connection blocked by browser

**Solutions:**
1. Check CORS_ALLOWED_ORIGINS in .env file
2. Ensure it includes your domain with and without www
3. Restart socket container after changes

### Issue 4: Container not running
**Symptoms:**
- Socket health endpoint not accessible
- Docker container exits immediately

**Diagnosis:**
```bash
./scripts/diagnose-websocket.sh containers
docker logs misvord_socket
```

**Solutions:**
1. Check environment variables in .env
2. Verify socket-server dependencies are installed
3. Check for port conflicts

## Environment Configuration Matrix

| Mode | IS_VPS | IS_DOCKER | SOCKET_HOST | SOCKET_PORT | SOCKET_SECURE |
|------|--------|-----------|-------------|-------------|---------------|
| Local Dev | false | true | localhost | 1002 | false |
| VPS HTTP | true | true | domain.com | "" | false |
| VPS HTTPS | true | true | domain.com | "" | true |

## Expected Frontend URLs

### Local Development
- WebSocket: `ws://localhost:1002/socket.io/`
- Health: `http://localhost:1002/health`

### VPS HTTP
- WebSocket: `ws://domain.com/socket.io/`
- Health: `http://domain.com/socket-health`

### VPS HTTPS
- WebSocket: `wss://domain.com/socket.io/`
- Health: `https://domain.com/socket-health`

## Troubleshooting Workflow

1. **Quick Test**
   ```bash
   ./scripts/test-websocket.sh
   ```

2. **Full Diagnosis**
   ```bash
   ./scripts/diagnose-websocket.sh
   ```

3. **Fix Environment**
   ```bash
   ./scripts/configure-environment.sh vps your-domain.com true
   ```

4. **Restart Services**
   ```bash
   docker-compose restart socket
   ```

5. **Verify Fix**
   ```bash
   ./scripts/test-websocket.sh
   ```

## Dependencies

- `curl` - For HTTP/HTTPS testing
- `docker` - For container management
- `jq` - For JSON parsing (optional)
- `wscat` - For WebSocket testing (optional)

## Notes

- Always run scripts from the project root directory
- Make sure .env file exists before running diagnostics
- For VPS deployments, ensure nginx configuration is properly applied
- Check firewall settings if connection tests fail
