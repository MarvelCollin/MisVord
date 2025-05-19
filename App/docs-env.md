# MiscVord Deployment Guide

This document explains how to configure MiscVord for both local development and VPS deployment.

## Environment Setup

MiscVord uses environment variables to dynamically configure its behavior. You can use one of our automated scripts to generate a proper `.env` file:

- `./deploy.sh` - Auto-detects environment and configures accordingly
- `./deploy-subpath.sh` - Specifically configures for VPS with subpath routing

## Environment Variables

These are the key environment variables used in the application:

| Variable | Description | Local Value | VPS Value |
|----------|-------------|-------------|-----------|
| APP_ENV | Environment mode | local | production |
| APP_DEBUG | Debug messages | true | false |
| IS_VPS | VPS deployment mode | false | true |
| DOMAIN | Server domain name | localhost | your-domain.com |
| SUBPATH | Subpath for deployment | misvord | your-subpath |
| USE_HTTPS | HTTPS enabled | false | true (recommended) |
| APP_PORT | HTTP server port | 1001 | 80 |
| SOCKET_PORT | WebSocket server port | 1002 | 1002 |
| SOCKET_PATH | Socket.IO path | /socket.io | /subpath/socket/socket.io |

## Local Development

For local development, the `.env` file should have:

```bash
APP_ENV=local
APP_DEBUG=true
IS_VPS=false
DOMAIN=localhost
# Default ports for direct access
APP_PORT=1001
SOCKET_PORT=1002
```

## VPS Deployment

For VPS deployment, the `.env` file should have:

```bash
APP_ENV=production
APP_DEBUG=false
IS_VPS=true
DOMAIN=your-domain.com
SUBPATH=your-subpath
USE_HTTPS=true
# Use standard ports behind NGINX
APP_PORT=80
SOCKET_PORT=1002
SOCKET_PATH=/your-subpath/socket/socket.io
```

## Automatic Environment Detection

The `deploy.sh` script automatically detects if you're running on a VPS by checking for:
- Presence of NGINX or Apache installations
- Linux OS release file
- Server hostname

When running on a VPS, it will:
1. Set `IS_VPS=true`
2. Set `APP_ENV=production`
3. Set `APP_DEBUG=false`
4. Configure socket paths for subpath deployment
5. Generate NGINX configuration

## Manual Configuration

If you prefer to manually configure your environment:

1. Copy `.env-example` to `.env`
2. Edit the variables as needed
3. Restart the containers with `docker-compose up -d`

## Testing Your Configuration

After deployment, verify your configuration:

1. Run `./check-websocket.sh` to test socket connectivity
2. Check that `IS_VPS` is correctly set in the output
3. Verify that the WebSocket URL uses the correct path format
4. Ensure NGINX configuration matches your environment settings

## Troubleshooting

If you encounter issues with the environment detection:

- For VPS: `./deploy-subpath.sh` will explicitly set VPS mode
- For local: Edit `.env` and set `IS_VPS=false`
- Restart with: `docker-compose down && docker-compose up -d`
