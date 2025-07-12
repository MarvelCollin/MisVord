# MisVord Docker Setup Guide

## Prerequisites
- Docker and Docker Compose installed
- Git installed

## Quick Start for New Users

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd App
   ```

2. **Setup Environment Variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file and set your values:
   - `DB_PASS` - Database password
   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` - Google OAuth credentials
   - `VIDEOSDK_API_KEY`, `VIDEOSDK_SECRET_KEY`, `VIDEOSDK_TOKEN` - VideoSDK credentials
   - `DOMAIN` - Your domain (use `localhost` for local development)

3. **Start the Application**
   ```bash
   docker-compose up -d
   ```

4. **Access the Application**
   - Main App: http://localhost:1001
   - Socket Server: http://localhost:1002
   - Database Admin: http://localhost:1004

## Port Configuration
- **1001**: PHP Application (Apache)
- **1002**: Socket.IO Server (Node.js)
- **1003**: MySQL Database
- **1004**: PHPMyAdmin

## Environment Variables

### Database Configuration
- `DB_HOST=db` (Docker service name)
- `DB_PORT=1003`
- `DB_USER=root`
- `DB_PASS=your_password`
- `DB_NAME=misvord`

### Socket Configuration
- `SOCKET_HOST=socket` (Docker service name for internal communication)
- `SOCKET_PORT=1002`
- `SOCKET_BIND_HOST=0.0.0.0` (Bind to all interfaces)
- `CORS_ALLOWED_ORIGINS=http://localhost:1001,http://127.0.0.1:1001`

### Application Configuration
- `APP_ENV=production`
- `APP_DEBUG=false`
- `IS_VPS=false` (Set to true for production)
- `USE_HTTPS=false` (Set to true for production)
- `DOMAIN=localhost` (Change to your domain in production)

## Troubleshooting

### Socket Connection Issues
1. Check if socket container is running: `docker-compose ps`
2. Check socket logs: `docker-compose logs socket`
3. Verify CORS configuration in `.env`

### Database Connection Issues
1. Check if database is ready: `docker-compose logs db`
2. Verify database credentials in `.env`
3. Check database connectivity: `docker-compose exec app php -r "echo 'DB Test';;"`

### File Permissions
If you encounter permission issues:
```bash
sudo chown -R $USER:$USER storage/
sudo chmod -R 775 storage/
```

## Development vs Production

### Development Setup (Local)
- `DOMAIN=localhost`
- `USE_HTTPS=false`
- `APP_DEBUG=true`
- `IS_VPS=false`

### Production Setup (VPS/Cloud)
- `DOMAIN=your-domain.com`
- `USE_HTTPS=true`
- `APP_DEBUG=false`
- `IS_VPS=true`
- Update CORS origins to include your domain

## Health Checks
All services include health checks:
- App: http://localhost:1001/health
- Socket: http://localhost:1002/health
- Database: Internal MySQL ping

## Logs
View logs for specific services:
```bash
docker-compose logs app
docker-compose logs socket
docker-compose logs db
```
