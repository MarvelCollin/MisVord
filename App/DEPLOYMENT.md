# MiscVord Deployment Guide

This guide explains how to deploy MiscVord on a VPS with the domain marvelcollin.my.id.

## Prerequisites

- VPS with Ubuntu/Debian 
- Domain name (marvelcollin.my.id) pointing to your VPS IP
- SSH access to your VPS
- Git installed

## Deployment Steps

### 1. Set Up Your VPS

First, update your system:

```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Clone and Deploy the Application

1. SSH into your VPS:
   ```bash
   ssh username@your-vps-ip
   ```

2. Download the deployment script:
   ```bash
   curl -O https://raw.githubusercontent.com/YOUR_USERNAME/miscvord/main/deploy.sh
   chmod +x deploy.sh
   ```

3. Run the deployment script:
   ```bash
   ./deploy.sh
   ```

   This script will:
   - Install Docker and Docker Compose if not already installed
   - Clone the MiscVord repository
   - Update configuration to use your domain
   - Start the Docker containers

### 3. Configure Nginx (Optional - for cleaner URLs)

If you want to use Nginx as a reverse proxy to provide cleaner URLs:

1. Install Nginx:
   ```bash
   sudo apt install nginx -y
   ```

2. Download the Nginx configuration:
   ```bash
   sudo curl -o /etc/nginx/sites-available/miscvord.conf https://raw.githubusercontent.com/YOUR_USERNAME/miscvord/main/nginx-config.conf
   ```

3. Enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/miscvord.conf /etc/nginx/sites-enabled/
   ```

4. Set up SSL with Let's Encrypt:
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d marvelcollin.my.id -d www.marvelcollin.my.id
   ```

5. Restart Nginx:
   ```bash
   sudo systemctl restart nginx
   ```

### 4. Firewall Configuration

Make sure to open the necessary ports:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 1001/tcp
sudo ufw allow 1002/tcp
sudo ufw allow 1004/tcp
sudo ufw allow 1005/tcp
sudo ufw enable
```

## Accessing Your Application

After deployment, you can access the different components of your application:

- **Main Application**: https://marvelcollin.my.id (via Nginx) or https://marvelcollin.my.id:1001 (direct)
- **Socket Server**: Automatically connected through the application
- **PHPMyAdmin**: https://marvelcollin.my.id/phpmyadmin/ (via Nginx) or https://marvelcollin.my.id:1004 (direct)
- **Adminer**: https://marvelcollin.my.id/adminer/ (via Nginx) or https://marvelcollin.my.id:1005 (direct)

## Troubleshooting

### Check Docker Container Status

```bash
docker ps -a
```

### View Container Logs

```bash
docker logs miscvord_php
docker logs miscvord_socket
docker logs miscvord_db
```

### Restart Containers

```bash
docker-compose restart
```

### Full Reset (Caution: Removes All Data)

```bash
docker-compose down -v
docker-compose up -d
```

## Security Considerations

1. Never expose Docker API to the internet
2. Keep your system and Docker updated
3. Use strong passwords for MySQL
4. Restrict access to database management tools (PHPMyAdmin, Adminer)
5. Set up a firewall and only allow necessary ports 