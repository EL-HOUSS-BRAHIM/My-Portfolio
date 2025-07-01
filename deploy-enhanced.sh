#!/bin/bash

# Enhanced Deployment Script for brahim-elhouss.me
# This script handles SSL certificate generation and Nginx configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="/home/bross/Desktop/My-Portfolio"
NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"
WEB_ROOT="/var/www/html/brahim/portfolio"

echo -e "${BLUE}🚀 Enhanced Deployment for brahim-elhouss.me${NC}"
echo "=============================================="
echo ""

# Function to check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        echo -e "${RED}❌ This script should not be run as root!${NC}"
        echo "Please run as a regular user with sudo privileges."
        exit 1
    fi
}

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"
    
    # Check if nginx is installed
    if ! command -v nginx &> /dev/null; then
        echo -e "${RED}❌ Nginx is not installed!${NC}"
        echo "Please install nginx first: sudo apt update && sudo apt install nginx"
        exit 1
    fi
    
    # Check if openssl is installed
    if ! command -v openssl &> /dev/null; then
        echo -e "${RED}❌ OpenSSL is not installed!${NC}"
        echo "Please install openssl first: sudo apt update && sudo apt install openssl"
        exit 1
    fi
    
    # Check if PHP-FPM is installed
    if ! systemctl is-active --quiet php8.1-fpm; then
        echo -e "${YELLOW}⚠️  PHP-FPM 8.1 is not running!${NC}"
        echo "Please install and start PHP-FPM: sudo apt install php8.1-fpm && sudo systemctl start php8.1-fpm"
    fi
    
    echo -e "${GREEN}✅ Prerequisites check passed!${NC}"
    echo ""
}

# Function to create web directory
create_web_directory() {
    echo -e "${YELLOW}📁 Creating web directory...${NC}"
    
    if [ ! -d "$WEB_ROOT" ]; then
        sudo mkdir -p "$WEB_ROOT"
        echo -e "${GREEN}✅ Created $WEB_ROOT${NC}"
    else
        echo -e "${BLUE}ℹ️  Directory $WEB_ROOT already exists${NC}"
    fi
    
    # Set proper ownership
    sudo chown -R www-data:www-data "$WEB_ROOT"
    sudo chmod -R 755 "$WEB_ROOT"
    
    echo ""
}

# Function to generate SSL certificates
generate_ssl_certificates() {
    echo -e "${YELLOW}🔒 Generating SSL certificates...${NC}"
    
    if [ -f "$PROJECT_ROOT/generate-ssl-certs.sh" ]; then
        sudo "$PROJECT_ROOT/generate-ssl-certs.sh"
    else
        echo -e "${RED}❌ SSL certificate generation script not found!${NC}"
        exit 1
    fi
    
    echo ""
}

# Function to deploy nginx configuration
deploy_nginx_config() {
    echo -e "${YELLOW}⚙️  Deploying Nginx configuration...${NC}"
    
    # Backup existing configuration if it exists
    if [ -f "$NGINX_SITES_AVAILABLE/brahim-elhouss.me.conf" ]; then
        sudo cp "$NGINX_SITES_AVAILABLE/brahim-elhouss.me.conf" \
                "$NGINX_SITES_AVAILABLE/brahim-elhouss.me.conf.backup.$(date +%Y%m%d_%H%M%S)"
        echo -e "${BLUE}ℹ️  Backed up existing configuration${NC}"
    fi
    
    # Copy new configuration
    sudo cp "$PROJECT_ROOT/config/brahim-elhouss.me.conf" "$NGINX_SITES_AVAILABLE/"
    echo -e "${GREEN}✅ Copied configuration to sites-available${NC}"
    
    # Enable the site
    sudo ln -sf "$NGINX_SITES_AVAILABLE/brahim-elhouss.me.conf" "$NGINX_SITES_ENABLED/"
    echo -e "${GREEN}✅ Enabled site configuration${NC}"
    
    # Remove default nginx site if it exists
    if [ -f "$NGINX_SITES_ENABLED/default" ]; then
        sudo rm "$NGINX_SITES_ENABLED/default"
        echo -e "${BLUE}ℹ️  Removed default nginx site${NC}"
    fi
    
    echo ""
}

# Function to test nginx configuration
test_nginx_config() {
    echo -e "${YELLOW}🧪 Testing Nginx configuration...${NC}"
    
    if sudo nginx -t; then
        echo -e "${GREEN}✅ Nginx configuration test passed!${NC}"
    else
        echo -e "${RED}❌ Nginx configuration test failed!${NC}"
        echo "Please check the configuration and try again."
        exit 1
    fi
    
    echo ""
}

# Function to create cache directories
create_cache_directories() {
    echo -e "${YELLOW}📦 Creating cache directories...${NC}"
    
    sudo mkdir -p /var/cache/nginx/portfolio
    sudo chown -R www-data:www-data /var/cache/nginx
    sudo chmod -R 755 /var/cache/nginx
    
    echo -e "${GREEN}✅ Cache directories created${NC}"
    echo ""
}

# Function to copy website files
copy_website_files() {
    echo -e "${YELLOW}📋 Copying website files...${NC}"
    
    # Copy files to web root (excluding config and deployment files)
    sudo rsync -av --exclude='config/' \
                   --exclude='*.sh' \
                   --exclude='.git/' \
                   --exclude='README.md' \
                   --exclude='DEPLOYMENT.md' \
                   --exclude='ENHANCEMENT_DOCUMENTATION.md' \
                   "$PROJECT_ROOT/" "$WEB_ROOT/"
    
    # Set proper permissions
    sudo chown -R www-data:www-data "$WEB_ROOT"
    sudo find "$WEB_ROOT" -type f -exec chmod 644 {} \;
    sudo find "$WEB_ROOT" -type d -exec chmod 755 {} \;
    
    # Make uploads directory writable
    if [ -d "$WEB_ROOT/assets/uploads" ]; then
        sudo chmod -R 775 "$WEB_ROOT/assets/uploads"
    fi
    
    echo -e "${GREEN}✅ Website files copied and permissions set${NC}"
    echo ""
}

# Function to restart services
restart_services() {
    echo -e "${YELLOW}🔄 Restarting services...${NC}"
    
    # Restart PHP-FPM
    if systemctl is-active --quiet php8.1-fpm; then
        sudo systemctl restart php8.1-fpm
        echo -e "${GREEN}✅ PHP-FPM restarted${NC}"
    fi
    
    # Restart Nginx
    sudo systemctl restart nginx
    echo -e "${GREEN}✅ Nginx restarted${NC}"
    
    # Enable services to start on boot
    sudo systemctl enable nginx php8.1-fpm
    echo -e "${GREEN}✅ Services enabled for startup${NC}"
    
    echo ""
}

# Function to create firewall rules
setup_firewall() {
    echo -e "${YELLOW}🔥 Setting up firewall rules...${NC}"
    
    if command -v ufw &> /dev/null; then
        sudo ufw allow 'Nginx Full'
        sudo ufw allow 22  # SSH
        echo -e "${GREEN}✅ Firewall rules configured${NC}"
    else
        echo -e "${BLUE}ℹ️  UFW not installed, skipping firewall configuration${NC}"
    fi
    
    echo ""
}

# Function to display final information
display_final_info() {
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo "========================================="
    echo ""
    echo -e "${YELLOW}📋 Next Steps:${NC}"
    echo "1. Point your domain DNS to your server IP"
    echo "2. Configure Cloudflare:"
    echo "   - Set SSL mode to 'Full (strict)'"
    echo "   - Enable 'Always Use HTTPS'"
    echo "   - Configure appropriate security settings"
    echo ""
    echo -e "${YELLOW}🔧 Important URLs:${NC}"
    echo "Website: https://brahim-elhouss.me"
    echo "Alt URL: https://www.brahim-elhouss.me"
    echo "Health Check: https://brahim-elhouss.me/health"
    echo ""
    echo -e "${YELLOW}📁 Important Paths:${NC}"
    echo "Web Root: $WEB_ROOT"
    echo "Nginx Config: $NGINX_SITES_AVAILABLE/brahim-elhouss.me.conf"
    echo "SSL Certificates: /etc/ssl/certs/brahim-elhouss.me/"
    echo "Access Logs: /var/log/nginx/brahim-elhouss.me.access.log"
    echo "Error Logs: /var/log/nginx/brahim-elhouss.me.error.log"
    echo ""
    echo -e "${YELLOW}🔒 Security Notes:${NC}"
    echo "- SSL certificates are self-signed (for local development)"
    echo "- In production, Cloudflare will provide real certificates"
    echo "- All HTTP traffic is redirected to HTTPS"
    echo "- Rate limiting is enabled for API and contact endpoints"
    echo ""
    echo -e "${BLUE}🚀 Your portfolio is now live!${NC}"
}

# Main execution flow
main() {
    check_root
    check_prerequisites
    create_web_directory
    generate_ssl_certificates
    create_cache_directories
    deploy_nginx_config
    test_nginx_config
    copy_website_files
    setup_firewall
    restart_services
    display_final_info
}

# Run main function
main "$@"
