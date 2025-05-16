# MiscVord - Voice and Text Chat Application

MiscVord is a Discord-like communication platform with text and voice/video chat capabilities. This README provides a quick overview of the project and deployment instructions.

## Features

- Real-time text messaging
- Voice and video chat using WebRTC
- Server and channel organization
- User authentication system
- Invite link system for servers

## Tech Stack

- **Backend**: PHP and Node.js
- **Frontend**: HTML, CSS, JavaScript
- **Database**: MySQL
- **Real-time Communication**: Socket.io
- **Voice/Video**: WebRTC
- **Containerization**: Docker

## Deployment on VPS

### Prerequisites

- VPS with Ubuntu/Debian
- Domain name pointing to your VPS IP
- SSH access to your VPS

### Deployment Steps

1. Upload project files to your VPS using SFTP/SCP
   ```bash
   # Example using scp (run on your local machine)
   scp -r /path/to/project/* username@your-vps-ip:~/miscvord/
   ```

2. SSH into your server
   ```bash
   ssh username@your-vps-ip
   ```

3. Navigate to your project directory
   ```bash
   cd ~/miscvord
   ```

4. Make the deployment script executable
   ```bash
   chmod +x deploy.sh
   ```

5. Run the deployment script
   ```bash
   ./deploy.sh
   ```

6. Check that services are running
   ```bash
   ./check-ports.sh
   ```

7. Access your application
   - Main App: https://your-domain.com:1001
   - PHPMyAdmin: https://your-domain.com:1004
   - Adminer: https://your-domain.com:1005

## Service Ports

| Service       | Port | Description                      |
|---------------|------|----------------------------------|
| PHP App       | 1001 | Main web application             |
| Socket Server | 1002 | Real-time communication server   |
| MySQL         | 1003 | Database (not publicly exposed)  |
| PHPMyAdmin    | 1004 | Database management tool         |
| Adminer       | 1005 | Alternative database manager     |

## Docker Infrastructure

The project uses Docker for easy deployment, with these containers:

- **app**: PHP application serving the web interface
- **socket-server**: Node.js server for real-time communication
- **db**: MySQL database for data storage
- **phpmyadmin**: Database management web interface
- **adminer**: Alternative database management tool

## Troubleshooting

If you encounter any issues, check:

1. Container status with `docker ps -a`
2. Service logs with `docker logs [container_name]`
3. Connectivity with `./check-ports.sh`
4. Restart services with `docker-compose restart`

## Security Notes

For production environments:
- Configure proper SSL certificates with Let's Encrypt
- Set strong database passwords
- Use a reverse proxy like Nginx for cleaner URLs and security 