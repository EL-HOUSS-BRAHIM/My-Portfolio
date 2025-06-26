#!/bin/bash

# Deployment script for brahim-elhouss.me portfolio
# This script sets up the nginx configuration

echo "Setting up nginx configuration for brahim-elhouss.me..."

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "Error: nginx is not installed. Please install nginx first."
    exit 1
fi

# Copy nginx configuration
sudo cp brahim-elhouss.me.conf /etc/nginx/sites-available/

# Create symbolic link to enable the site
sudo ln -sf /etc/nginx/sites-available/brahim-elhouss.me.conf /etc/nginx/sites-enabled/

# Remove default nginx site if it exists
if [ -f /etc/nginx/sites-enabled/default ]; then
    sudo rm /etc/nginx/sites-enabled/default
fi

# Test nginx configuration
echo "Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "Nginx configuration is valid!"
    
    # Reload nginx
    echo "Reloading nginx..."
    sudo systemctl reload nginx
    
    echo "Setup complete!"
    echo "Your website should now be accessible at http://brahim-elhouss.me"
    echo "Make sure:"
    echo "1. Your domain DNS points to this server"
    echo "2. Cloudflare SSL is properly configured"
    echo "3. PHP-FPM is running (check with: sudo systemctl status php8.1-fpm)"
else
    echo "Error: Nginx configuration test failed!"
    echo "Please check the configuration file for errors."
    exit 1
fi
