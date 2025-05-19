# MiscVord

A modern communications platform with text and video chat capabilities.

## Quick Start

### Local Development
1. Clone the repository
2. Run `./deploy.sh` (the script will automatically detect local environment)
3. Access the application at `http://localhost:1001`

### VPS Deployment
1. Clone the repository to your VPS
2. Run `./deploy.sh` (the script will detect VPS environment and prompt for domain)
3. Follow the instructions to configure NGINX
4. Access the application at `https://your-domain/misvord`

## Docker Services

| Service | Local Port | Description |
|---------|------------|-------------|
| app | 1001 | PHP application serving the web interface |
| socket-server | 1002 | Node.js server for real-time communication |
| db | 1003 | MySQL database for data storage |
| phpmyadmin | 1004 | Database management web interface |
| adminer | 1005 | Alternative database management tool |

## Environment Configuration

The application now uses dynamic configuration through environment variables.
You can create a `.env` file or let the deploy script auto-generate one for you.

Key environment variables:
- `APP_ENV`: local/production
- `IS_VPS`: true/false
- `DOMAIN`: your domain name
- `SUBPATH`: deployment subpath (default: misvord)
- `USE_HTTPS`: true/false

See `docs-env.md` for complete environment configuration details.

## WebRTC Video Chat

The video chat functionality uses WebRTC with a Socket.IO signaling server:

- `check-websocket.sh` - Test WebSocket connectivity
- `public/js/webrtc-modules/` - WebRTC modules for video chat

## Troubleshooting

If you encounter any issues:

1. Container status: `docker-compose ps`
2. Service logs: `docker-compose logs -f [service]`
3. WebSocket connectivity: `./check-websocket.sh`
4. Restart services: `docker-compose restart`

## Security Notes

For production environments:
- Use HTTPS with proper SSL certificates (Let's Encrypt)
- Set strong database passwords
- Use a reverse proxy like NGINX for cleaner URLs and security

## Deploying to Subpath

For deploying to a subpath on existing servers:
1. Run `./deploy-subpath.sh`
2. Follow the prompts to configure domain and subpath
3. Use the generated NGINX configuration
4. Access at `https://your-domain/your-subpath` 