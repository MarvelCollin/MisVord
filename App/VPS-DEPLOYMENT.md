# MisvVord VPS Deployment Guide

This guide provides instructions for deploying the MiscVord WebRTC video calling application to a VPS.

## Prerequisites

- Ubuntu 20.04+ or similar Linux VPS
- Nginx installed
- Node.js 14+ installed
- PM2 or similar process manager installed
- A domain name pointing to your VPS

## 1. Application Structure

The application consists of:

- PHP backend (Laravel-based)
- Node.js Socket.io server for WebRTC signaling
- Static assets

## 2. Environment Configuration

Create a `.env` file in the root directory with:

```
# App configuration
APP_URL=https://yourdomain.com/misvord
NODE_ENV=production
IS_VPS=true

# Socket server configuration
PORT=1002
SOCKET_PATH=/socket.io
SOCKET_URL=wss://yourdomain.com/misvord/socket
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

## 3. Socket Server Setup

The WebRTC Socket.io server must run on port 1002:

```bash
# Install dependencies
npm install

# Start the socket server with PM2
pm2 start socket-server.js --name misvord-socket
pm2 save
pm2 startup
```

## 4. Nginx Configuration

Create an Nginx configuration file `/etc/nginx/sites-available/misvord.conf`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    # Application path
    location /misvord/ {
        alias /path/to/app/public/;
        try_files $uri $uri/ @misvord;
        
        # Add security headers
        add_header X-Frame-Options "SAMEORIGIN";
        add_header X-XSS-Protection "1; mode=block";
        add_header X-Content-Type-Options "nosniff";
    }
    
    # Handle PHP requests
    location ~ ^/misvord/.*\.php$ {
        alias /path/to/app/public/;
        fastcgi_pass unix:/var/run/php/php8.0-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $request_filename;
        include fastcgi_params;
        
        # Pass on protocol information
        fastcgi_param HTTPS on;
    }
    
    # Handle front controller
    location @misvord {
        rewrite /misvord/(.*)$ /misvord/index.php?/$1 last;
    }
    
    # Socket.IO for WebRTC signaling
    location /misvord/socket/ {
        rewrite ^/misvord/socket/(.*) /$1 break;
        proxy_pass http://localhost:1002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase timeouts for WebRTC connections
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }
    
    # Static assets with cache control
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        alias /path/to/app/public/;
        expires max;
        add_header Cache-Control "public, max-age=31536000";
    }
}
```

Enable the configuration:

```bash
ln -s /etc/nginx/sites-available/misvord.conf /etc/nginx/sites-enabled/
nginx -t  # Test configuration
systemctl restart nginx
```

## 5. Testing Connectivity

1. Test WebSocket connectivity:

```bash
curl -i https://yourdomain.com/misvord/socket/socket-test
```

2. Test SSL WebSocket connection:

```bash
wscat -c wss://yourdomain.com/misvord/socket/socket.io/?EIO=4&transport=websocket
```

3. Test PHP connectivity:

```bash
curl -i https://yourdomain.com/misvord/
```

## 6. Common Issues and Solutions

### Mixed Content Warnings

If you see mixed content warnings, make sure:

1. All JavaScript URLs use `https://` or relative paths
2. Socket.io connections use `wss://` protocol:

```javascript
const socketProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
const socketUrl = socketProtocol + window.location.host + '/misvord/socket';
```

### "Failed to construct 'WebSocket'" Error

This error usually occurs when:

1. Nginx WebSocket proxy is not configured correctly
2. WebSocket URL is incorrect 
3. The Socket.io server is not running

Check the socket-server.js logs:

```bash
pm2 logs misvord-socket
```

### ICE Connection Failed

If WebRTC peers cannot connect:

1. Make sure TURN server configuration is correct
2. Check if firewalls are blocking UDP traffic 
3. Try using TCP fallback for TURN

## 7. Production VPS Security

1. **Enable a firewall**:
   ```bash
   ufw allow 22/tcp
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw enable
   ```

2. **Set up fail2ban**:
   ```bash
   apt install fail2ban
   ```

3. **Regular updates**:
   ```bash
   apt update && apt upgrade -y
   ```

## 8. Maintenance

### Updating the Application

```bash
# Pull latest code
git pull

# Update dependencies
npm install

# Restart socket server
pm2 restart misvord-socket
```

### Monitoring

```bash
# Check socket server status
pm2 status

# View socket server logs
pm2 logs misvord-socket

# Monitor resource usage
pm2 monit
```

## 9. Backup Strategy

1. Set up a cron job for database backups
2. Back up the entire application directory regularly
3. Store backups off-site

## 10. Troubleshooting

- Check Nginx error logs: `/var/log/nginx/error.log`
- Check socket server logs: `pm2 logs misvord-socket`
- Monitor memory usage: `free -m`
- Check running processes: `ps aux | grep node` 