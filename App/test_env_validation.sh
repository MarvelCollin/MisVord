#!/bin/bash

# Extract just the environment validation logic from deploy.sh
get_env_value() {
    local key="$1"
    grep "^$key=" .env 2>/dev/null | cut -d '=' -f2- | tr -d '"'"'"
}

# Test the updated validation logic
echo "Testing environment validation for production..."

missing_vars=()
is_vps=$(get_env_value 'IS_VPS')

echo "IS_VPS value: '$is_vps'"

# Base required variables
required_vars=("APP_PORT" "SOCKET_BIND_HOST" "DB_PASS")

# SOCKET_PORT is only required for development/non-VPS environments
if [ "$is_vps" != "true" ]; then
    required_vars+=("SOCKET_PORT")
    echo "Development mode detected - SOCKET_PORT is required"
else
    echo "VPS mode detected - SOCKET_PORT is optional"
fi

echo "Required variables: ${required_vars[@]}"

for var in "${required_vars[@]}"; do
    value=$(get_env_value "$var")
    echo "Checking $var: '$value'"
    if [ -z "$value" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo "❌ Missing required environment variables:"
    for var in "${missing_vars[@]}"; do
        echo "  - $var"
    done
    echo "⚠️ Please update your .env file before proceeding"
else
    echo "✅ All required environment variables are present"
fi
