#!/bin/bash

# MisVord CLI Runner Script
# Runs commands from the mv file (PHP CLI tool)

set -e  # Exit on any error

echo "🚀 MisVord CLI Tool Runner"
echo "=========================="

# Check if Docker is available
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    DOCKER_AVAILABLE=true
    echo "🐳 Docker detected"
else
    DOCKER_AVAILABLE=false
    echo "💻 Local PHP mode"
fi

# Function to run command in Docker
run_docker_command() {
    local cmd="$1"
    echo "🐳 Running in Docker container: $cmd"
    docker-compose exec app php mv $cmd
}

# Function to run command locally
run_local_command() {
    local cmd="$1"
    echo "💻 Running locally: $cmd"
    php mv $cmd
}

# Function to run command (auto-detect environment)
run_command() {
    local cmd="$1"
    
    if [ "$DOCKER_AVAILABLE" = true ] && docker-compose ps | grep -q "misvord_php.*Up"; then
        run_docker_command "$cmd"
    else
        run_local_command "$cmd"
    fi
}

# Check if command provided
if [ $# -eq 0 ]; then
    echo ""
    echo "Usage: $0 <command> [arguments]"
    echo ""
    echo "📋 Available commands:"
    echo "  serve [host:port]       - Start development server"
    echo "  migrate                 - Run database migrations"
    echo "  migrate:fresh          - Drop all tables and re-run migrations"
    echo "  migrate:rollback       - Roll back last migration batch"
    echo "  migrate:status         - Show migration status"
    echo "  make:migration <name>  - Create new migration file"
    echo "  db:check              - Test database connection"
    echo ""
    echo "🔧 Special commands:"
    echo "  docker-setup          - Setup and start Docker containers"
    echo "  docker-logs           - Show Docker container logs"
    echo "  docker-restart        - Restart Docker containers"
    echo ""
    exit 1
fi

COMMAND="$1"
shift  # Remove first argument, keep the rest

case "$COMMAND" in
    "serve")
        HOST_PORT="${1:-localhost:8000}"
        echo "🌐 Starting development server on $HOST_PORT"
        run_command "serve $HOST_PORT"
        ;;
        
    "migrate")
        echo "📊 Running database migrations..."
        run_command "migrate"
        ;;
        
    "migrate:fresh")
        echo "⚠️  Warning: This will drop all tables!"
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "🔄 Dropping all tables and re-running migrations..."
            run_command "migrate:fresh"
        else
            echo "❌ Cancelled"
            exit 0
        fi
        ;;
        
    "migrate:rollback")
        echo "⏪ Rolling back last migration batch..."
        run_command "migrate:rollback"
        ;;
        
    "migrate:status")
        echo "📋 Checking migration status..."
        run_command "migrate:status"
        ;;
        
    "make:migration")
        if [ -z "$1" ]; then
            echo "❌ Error: Migration name required"
            echo "Usage: $0 make:migration <migration_name>"
            exit 1
        fi
        echo "📝 Creating migration: $1"
        run_command "make:migration $1"
        ;;
        
    "db:check")
        echo "🔍 Testing database connection..."
        run_command "db:check"
        ;;
        
    "docker-setup")
        echo "🐳 Setting up Docker environment..."
        if [ ! -f ".env" ]; then
            echo "📄 Creating .env from .env.example..."
            cp .env.example .env
            echo "⚠️  Please edit .env file with your configuration"
        fi
        
        echo "🚀 Starting Docker containers..."
        docker-compose up -d
        
        echo "⏳ Waiting for database to be ready..."
        sleep 10
        
        echo "📊 Running initial migrations..."
        run_command "migrate"
        
        echo "✅ Docker setup complete!"
        echo "🌐 Access your app at: http://localhost:1001"
        echo "🔌 Socket server at: http://localhost:1002"
        ;;
        
    "docker-logs")
        if [ -z "$1" ]; then
            echo "📋 All container logs:"
            docker-compose logs --tail=50 -f
        else
            echo "📋 Logs for service: $1"
            docker-compose logs --tail=50 -f "$1"
        fi
        ;;
        
    "docker-restart")
        echo "🔄 Restarting Docker containers..."
        docker-compose restart
        echo "✅ Containers restarted"
        ;;
        
    "help"|"--help"|"-h")
        echo ""
        echo "📚 MisVord CLI Tool Help"
        echo "======================="
        echo ""
        echo "🔧 Database Commands:"
        echo "  migrate                 - Run pending migrations"
        echo "  migrate:fresh          - Drop all tables and re-run migrations"
        echo "  migrate:rollback       - Roll back last migration batch"
        echo "  migrate:status         - Show migration status"
        echo "  make:migration <name>  - Create new migration file"
        echo "  db:check              - Test database connection"
        echo ""
        echo "🌐 Server Commands:"
        echo "  serve [host:port]      - Start development server (default: localhost:8000)"
        echo ""
        echo "🐳 Docker Commands:"
        echo "  docker-setup          - Complete Docker environment setup"
        echo "  docker-logs [service] - Show container logs (app, socket, db)"
        echo "  docker-restart        - Restart all containers"
        echo ""
        echo "📝 Examples:"
        echo "  $0 serve localhost:3000     # Start server on port 3000"
        echo "  $0 make:migration users     # Create migration for users table"
        echo "  $0 docker-logs app         # Show PHP app logs"
        echo ""
        ;;
        
    *)
        echo "❌ Unknown command: $COMMAND"
        echo "Run '$0 help' for available commands"
        exit 1
        ;;
esac

echo "✅ Command completed successfully!"
