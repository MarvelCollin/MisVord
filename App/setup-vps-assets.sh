#!/bin/bash

echo "=== VPS Static Assets Fix ==="

echo "This will configure Nginx to properly route static assets"
echo "for the /misvord/public/ path structure."
echo ""

if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    sudo apt update
    sudo apt install nginx -y
else
    echo "✅ Nginx already installed"
fi

echo "Setting up SSL certificates..."
sudo mkdir -p /etc/ssl/certs /etc/ssl/private

if [ ! -f /etc/ssl/certs/ssl-cert-snakeoil.pem ]; then
    echo "Creating self-signed certificate..."
    sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/ssl/private/ssl-cert-snakeoil.key \
        -out /etc/ssl/certs/ssl-cert-snakeoil.pem \
        -subj "/C=ID/ST=Jakarta/L=Jakarta/O=MisVord/CN=marvelcollin.my.id"
    echo "✅ SSL certificate created"
else
    echo "✅ SSL certificate already exists"
fi

echo "Configuring Nginx for MisVord..."
sudo cp nginx-vps.conf /etc/nginx/sites-available/misvord
sudo ln -sf /etc/nginx/sites-available/misvord /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

echo "Testing Nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx configuration valid"
    sudo systemctl restart nginx
    sudo systemctl enable nginx
else
    echo "❌ Nginx configuration invalid"
    exit 1
fi

echo ""
echo "✅ VPS Static Assets Fix Complete!"
echo ""
echo "🧪 Testing static asset routing:"
curl -I https://marvelcollin.my.id/misvord/public/css/global.css || echo "CSS test failed"
curl -I https://marvelcollin.my.id/misvord/public/js/sections/carousel-section.js || echo "JS test failed"

echo ""
echo "📊 Nginx status:"
sudo systemctl status nginx --no-pager -l | head -10

echo ""
echo "🌐 Your static assets should now load correctly!"
echo "📋 Asset URLs working:"
echo "   - https://marvelcollin.my.id/misvord/public/css/*.css"
echo "   - https://marvelcollin.my.id/misvord/public/js/*.js"
echo "   - https://marvelcollin.my.id/misvord/public/assets/*"
