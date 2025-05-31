# MisVord Application

## Project Overview
MisVord is a communication platform that allows users to create servers, channels, and exchange messages. The application provides features similar to Discord with user authentication, server management, and real-time messaging capabilities.

## Directory Structure

### Root Files
- `index.php` - Main application entry point that redirects to the public directory
- `router.php` - URL routing system that handles HTTP requests
- `serve.php` - Development server script
- `artisan` - Command-line interface for application management
- `.htaccess` - Apache configuration rules

### Configuration
- `/config/` - Contains configuration files for the application
  - `app.php` - Core application settings
  - `web.php` - Web routing configuration

### Controllers
- `/controllers/` - Contains the application logic to handle requests
  - `AuthenticationController.php` - Handles user authentication
  - `ChannelController.php` - Manages channel operations
  - `GoogleAuthController.php` - Handles Google authentication
  - `MessageController.php` - Manages messages
  - `ServerController.php` - Handles server operations

### Database
- `/database/` - Database-related files
  - `/models/` - Data models representing database tables
    - `User.php` - User model
    - `Server.php` - Server model
    - `Channel.php` - Channel model
    - `Message.php` - Message model
    - `UserServerMembership.php` - Handles user membership to servers
    - `ChannelMessage.php` - Maps messages to channels
    - `Category.php` - Category model

### Migrations
- `/migrations/` - Database schema migrations

### Views
- `/views/` - Contains template files for the application's user interface
  - `/components/` - Reusable UI components
    - `/app-sections/` - Components for the main application
    - `/landing-sections/` - Components for the landing page
  - `/layout/` - Layout templates (headers, footers, etc.)
  - `/pages/` - Full page templates
    - `landing-page.php` - Homepage for non-authenticated users
    - `authentication-page.php` - Login/signup page
    - `home.php` - Dashboard for authenticated users
    - `server-page.php` - Server view
    - `explore-servers.php` - Server discovery page
    - `call.php` - Voice/video call interface
    - `404.php` - Error page

### Public
- `/public/` - Publicly accessible files
  - `/assets/` - Static assets like images and fonts
    - `/landing-page/` - Assets specific to the landing page
  - `/css/` - Stylesheet files
  - `/js/` - JavaScript files
    - `/sections/` - JavaScript modules for specific sections

### Bootstrap
- `/bootstrap/` - Application initialization files

### Utils
- `/utils/` - Utility functions and helper classes

### Vendor
- `/vendor/` - Third-party dependencies managed by Composer
  - `google/apiclient` - Google API Client for authentication
  - Other dependencies for HTTP requests, logging, etc.

### Docker
- `/docker/` - Docker configuration files
  - `/apache/` - Apache web server configuration
  - `/php/` - PHP configuration
- `docker-compose.yml` - Docker Compose configuration
- `Dockerfile.php` - Docker configuration for PHP

### GitHub
- `/.github/` - GitHub-specific files
  - `/workflows/` - GitHub Actions workflows for CI/CD

## Getting Started

### Prerequisites
- PHP 7.4 or higher
- MySQL/MariaDB
- Composer

### Installation
1. Clone the repository
2. Run `composer install` to install dependencies
3. Configure your database settings in the `.env` file
4. Run migrations to set up the database structure

### Running with Docker
You can use Docker to run the application:

```bash
docker-compose up -d
```

### Development Server
For local development, you can use the PHP built-in server:

```bash
php serve.php
```

## Features
- User authentication (including Google OAuth)
- Server creation and management
- Channel creation within servers
- Real-time messaging
- Voice/video calls

## License
This project is proprietary and not licensed for public use.
