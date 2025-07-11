#!/bin/bash

# Environment Switcher Script for MisVord
# Usage: ./switch-env.sh [development|production]

ENV_TYPE=${1:-development}

case $ENV_TYPE in
    "development"|"dev")
        echo "🔧 Switching to DEVELOPMENT environment..."
        cp .env.example .env
        echo "✅ Development .env file ready"
        echo "📝 Edit .env file with your local development values"
        ;;
    "production"|"prod")
        echo "🚀 Switching to PRODUCTION environment..."
        if [ -f ".env.production" ]; then
            cp .env.production .env
            echo "✅ Production .env file applied"
            echo "⚠️  Make sure to update DOMAIN in .env with your actual domain!"
        else
            echo "❌ .env.production file not found!"
            exit 1
        fi
        ;;
    *)
        echo "❌ Invalid environment type: $ENV_TYPE"
        echo "Usage: ./switch-env.sh [development|production]"
        exit 1
        ;;
esac

echo ""
echo "📋 Current environment settings:"
echo "   DOMAIN: $(grep DOMAIN .env | cut -d'=' -f2)"
echo "   APP_URL: $(grep APP_URL .env | cut -d'=' -f2)"
echo "   USE_HTTPS: $(grep USE_HTTPS .env | cut -d'=' -f2)"
echo "   IS_VPS: $(grep IS_VPS .env | cut -d'=' -f2)"
echo ""
echo "🔄 Restart your containers for changes to take effect:"
echo "   docker-compose down && docker-compose up -d"
