# MiscVord - Voice and Text Chat Application

MiscVord is a Discord-like communication platform with text and voice/video chat capabilities.

## Deployment Instructions

### Prerequisites
- A VPS with Docker and Docker Compose installed
- Domain pointing to your VPS
- Open ports: 1001-1005

### Quick Start
1. Clone the repository to your VPS
2. Navigate to the App directory: `cd MisVord/App`
3. Run the deployment script: `./deploy.sh`
4. Access the application at: `http://your-domain:1001`

### Service Ports
- PHP App: 1001
- Socket Server: 1002 
- MySQL Database: 1003
- PHPMyAdmin: 1004
- Adminer: 1005

### Troubleshooting
If you encounter issues:
1. Check container logs: `docker logs miscvord_php`
2. Verify port accessibility: `sudo netstat -tulpn | grep 1001`
3. Ensure firewall allows connections: `sudo ufw allow 1001/tcp`

### Note About HTTPS
To enable HTTPS:
1. Install Nginx and Certbot
2. Set up a reverse proxy using the provided nginx-config.conf
3. Run Certbot to get SSL certificates

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