#!/bin/bash

# ====================================
# Portfolio Server Bootstrap Script
# ====================================
# This script sets up production and staging servers
# and generates GitHub secrets for CI/CD deployment
#
# Usage Examples:
#   Basic setup:
#     ./bootstrap-server.sh
#
#   Custom app name (creates deploy-portfolio user):
#     APP_NAME="portfolio" ./bootstrap-server.sh
#
#   Multiple apps on same server:
#     APP_NAME="portfolio" DOMAIN="site1.com" ./bootstrap-server.sh
#     APP_NAME="blog" DOMAIN="blog.com" DEPLOY_USER="deploy-blog" ./bootstrap-server.sh
#     APP_NAME="api" DOMAIN="api.com" DEPLOY_USER="deploy-api" ./bootstrap-server.sh
#
#   Custom deploy user:
#     DEPLOY_USER="deploy-myapp" ./bootstrap-server.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="${APP_NAME:-portfolio}"
DOMAIN="${DOMAIN:-brahim-elhouss.me}"
STAGING_DOMAIN="${STAGING_DOMAIN:-staging.brahim-elhouss.me}"
PRODUCTION_PATH="${PRODUCTION_PATH:-/var/www/$APP_NAME}"
STAGING_PATH="${STAGING_PATH:-/var/www/staging-$APP_NAME}"
DEPLOY_USER="${DEPLOY_USER:-deploy-$APP_NAME}"
SSH_PORT="${SSH_PORT:-22}"

# Output directory for secrets (app-specific to avoid conflicts)
SECRETS_DIR="./deployment-secrets-${APP_NAME}"
mkdir -p "$SECRETS_DIR"

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "This script should NOT be run as root"
        print_info "Run as a regular user with sudo privileges"
        exit 1
    fi
    
    # Check for sudo
    if ! sudo -n true 2>/dev/null; then
        print_info "This script requires sudo access"
        sudo -v
    fi
}

# Detect OS and package manager
detect_os() {
    print_header "Detecting Operating System"
    
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$ID
        OS_VERSION=$VERSION_ID
        print_success "Detected: $PRETTY_NAME"
    else
        print_error "Cannot detect OS"
        exit 1
    fi
    
    case $OS in
        ubuntu|debian)
            PKG_MANAGER="apt"
            ;;
        centos|rhel|fedora)
            PKG_MANAGER="yum"
            ;;
        *)
            print_error "Unsupported OS: $OS"
            exit 1
            ;;
    esac
}

# Install required packages
install_dependencies() {
    print_header "Installing Dependencies"
    
    case $PKG_MANAGER in
        apt)
            sudo apt update
            
            # Add Ondřej Surý PPA for latest PHP versions
            print_info "Adding PHP repository..."
            sudo apt install -y software-properties-common
            sudo add-apt-repository -y ppa:ondrej/php
            sudo apt update
            
            print_info "Installing packages..."
            sudo apt install -y \
                nginx \
                php8.2-fpm \
                php8.2-cli \
                php8.2-common \
                php8.2-mysql \
                php8.2-xml \
                php8.2-mbstring \
                php8.2-curl \
                php8.2-zip \
                php8.2-gd \
                php8.2-bcmath \
                php8.2-sqlite3 \
                mysql-server \
                git \
                curl \
                wget \
                unzip \
                ufw \
                certbot \
                python3-certbot-nginx \
                fail2ban
            ;;
        yum)
            sudo yum install -y epel-release
            sudo yum install -y \
                nginx \
                php-fpm \
                php-cli \
                php-common \
                php-mysqlnd \
                php-xml \
                php-mbstring \
                php-curl \
                php-zip \
                php-gd \
                php-bcmath \
                mariadb-server \
                git \
                curl \
                wget \
                unzip \
                firewalld \
                certbot \
                python3-certbot-nginx \
                fail2ban
            ;;
    esac
    
    print_success "Dependencies installed"
}

# Install Composer
install_composer() {
    print_header "Installing Composer"
    
    if command -v composer &> /dev/null; then
        print_warning "Composer already installed"
        composer --version
    else
        EXPECTED_CHECKSUM="$(php -r 'copy("https://composer.github.io/installer.sig", "php://stdout");')"
        php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
        ACTUAL_CHECKSUM="$(php -r "echo hash_file('sha384', 'composer-setup.php');")"
        
        if [ "$EXPECTED_CHECKSUM" != "$ACTUAL_CHECKSUM" ]; then
            print_error "Invalid composer installer checksum"
            rm composer-setup.php
            exit 1
        fi
        
        sudo php composer-setup.php --quiet --install-dir=/usr/local/bin --filename=composer
        rm composer-setup.php
        print_success "Composer installed"
    fi
}

# Create deployment user
create_deploy_user() {
    print_header "Creating Deployment User"
    
    if id "$DEPLOY_USER" &>/dev/null; then
        print_warning "User $DEPLOY_USER already exists"
    else
        sudo useradd -m -s /bin/bash "$DEPLOY_USER"
        sudo usermod -aG www-data "$DEPLOY_USER"
        print_success "User $DEPLOY_USER created"
    fi
    
    # Create SSH directory
    sudo mkdir -p "/home/$DEPLOY_USER/.ssh"
    sudo chmod 700 "/home/$DEPLOY_USER/.ssh"
    
    # Generate SSH key pair for deployment
    DEPLOY_KEY_PATH="$SECRETS_DIR/deploy_key"
    if [[ ! -f "$DEPLOY_KEY_PATH" ]]; then
        ssh-keygen -t ed25519 -C "github-actions-deploy" -f "$DEPLOY_KEY_PATH" -N ""
        print_success "SSH key pair generated"
    fi
    
    # Add public key to authorized_keys
    cat "${DEPLOY_KEY_PATH}.pub" | sudo tee "/home/$DEPLOY_USER/.ssh/authorized_keys" > /dev/null
    sudo chmod 600 "/home/$DEPLOY_USER/.ssh/authorized_keys"
    sudo chown -R "$DEPLOY_USER:$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
    
    # Add to sudoers for deployment tasks
    echo "$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/systemctl restart nginx, /bin/systemctl reload nginx, /bin/systemctl restart php*-fpm, /bin/chown, /bin/chmod, /bin/mkdir, /bin/rm, /bin/mv, /bin/tar" | sudo tee "/etc/sudoers.d/$DEPLOY_USER" > /dev/null
    
    print_success "Deployment user configured"
}

# Create directory structure
create_directories() {
    print_header "Creating Directory Structure"
    
    # Production
    sudo mkdir -p "$PRODUCTION_PATH"
    sudo mkdir -p "$PRODUCTION_PATH/storage/logs"
    sudo mkdir -p "$PRODUCTION_PATH/storage/cache"
    sudo mkdir -p "$PRODUCTION_PATH/storage/sessions"
    
    # Staging
    sudo mkdir -p "$STAGING_PATH"
    sudo mkdir -p "$STAGING_PATH/storage/logs"
    sudo mkdir -p "$STAGING_PATH/storage/cache"
    sudo mkdir -p "$STAGING_PATH/storage/sessions"
    
    # Set ownership
    sudo chown -R www-data:www-data "$PRODUCTION_PATH"
    sudo chown -R www-data:www-data "$STAGING_PATH"
    
    # Set permissions
    sudo find "$PRODUCTION_PATH" -type d -exec chmod 755 {} \;
    sudo find "$PRODUCTION_PATH" -type f -exec chmod 644 {} \;
    sudo find "$STAGING_PATH" -type d -exec chmod 755 {} \;
    sudo find "$STAGING_PATH" -type f -exec chmod 644 {} \;
    
    print_success "Directory structure created"
}

# Configure Nginx
configure_nginx() {
    print_header "Configuring Nginx"
    
    # Production config
    sudo tee /etc/nginx/sites-available/$APP_NAME > /dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    
    root $PRODUCTION_PATH;
    index index.php index.html;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Logging
    access_log /var/log/nginx/${APP_NAME}_access.log;
    error_log /var/log/nginx/${APP_NAME}_error.log;
    
    # Main location
    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }
    
    # PHP processing
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        include fastcgi_params;
    }
    
    # Deny access to sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~ /\.env {
        deny all;
    }
    
    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    # Staging config
    sudo tee /etc/nginx/sites-available/$APP_NAME-staging > /dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $STAGING_DOMAIN;
    
    root $STAGING_PATH;
    index index.php index.html;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Robots-Tag "noindex, nofollow" always;
    
    # Logging
    access_log /var/log/nginx/${APP_NAME}_staging_access.log;
    error_log /var/log/nginx/${APP_NAME}_staging_error.log;
    
    # Basic auth for staging
    auth_basic "Staging Area";
    auth_basic_user_file /etc/nginx/.htpasswd;
    
    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }
    
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        include fastcgi_params;
    }
    
    location ~ /\. {
        deny all;
    }
}
EOF
    
    # Enable sites
    sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
    sudo ln -sf /etc/nginx/sites-available/$APP_NAME-staging /etc/nginx/sites-enabled/
    
    # Create htpasswd for staging
    STAGING_PASSWORD=$(openssl rand -base64 16)
    echo -n "admin:$(openssl passwd -apr1 $STAGING_PASSWORD)" | sudo tee /etc/nginx/.htpasswd > /dev/null
    echo "$STAGING_PASSWORD" > "$SECRETS_DIR/staging_password.txt"
    
    # Test and reload nginx
    sudo nginx -t && sudo systemctl reload nginx
    
    print_success "Nginx configured"
}

# Configure firewall
configure_firewall() {
    print_header "Configuring Firewall"
    
    if command -v ufw &> /dev/null; then
        sudo ufw --force enable
        sudo ufw allow 22/tcp
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        print_success "UFW firewall configured"
    elif command -v firewall-cmd &> /dev/null; then
        sudo systemctl enable firewalld
        sudo systemctl start firewalld
        sudo firewall-cmd --permanent --add-service=ssh
        sudo firewall-cmd --permanent --add-service=http
        sudo firewall-cmd --permanent --add-service=https
        sudo firewall-cmd --reload
        print_success "Firewalld configured"
    fi
}

# Configure fail2ban
configure_fail2ban() {
    print_header "Configuring Fail2ban"
    
    sudo systemctl enable fail2ban
    sudo systemctl start fail2ban
    
    # Create nginx jail for this app
    sudo tee /etc/fail2ban/jail.d/nginx-$APP_NAME.conf > /dev/null <<EOF
[nginx-http-auth-$APP_NAME]
enabled = true
port = http,https
logpath = /var/log/nginx/${APP_NAME}*error.log

[nginx-noscript-$APP_NAME]
enabled = true
port = http,https
logpath = /var/log/nginx/${APP_NAME}*access.log
EOF
    
    sudo systemctl restart fail2ban
    print_success "Fail2ban configured"
}

# Setup SSL certificates
setup_ssl() {
    print_header "SSL Certificate Setup"
    
    print_info "To enable SSL certificates, run:"
    echo -e "${YELLOW}sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN${NC}"
    echo -e "${YELLOW}sudo certbot --nginx -d $STAGING_DOMAIN${NC}"
    print_warning "Make sure DNS records are pointing to this server first"
}

# Get server information
get_server_info() {
    print_header "Gathering Server Information"
    
    # Get public IP
    PUBLIC_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "Unable to detect")
    
    # Get SSH port
    ACTUAL_SSH_PORT=$(sudo grep -E "^Port " /etc/ssh/sshd_config | awk '{print $2}' || echo "22")
    [[ -z "$ACTUAL_SSH_PORT" ]] && ACTUAL_SSH_PORT="22"
    
    # Save server info
    cat > "$SECRETS_DIR/server_info.txt" <<EOF
Server Information for: $APP_NAME
==================================

Public IP: $PUBLIC_IP
SSH Port: $ACTUAL_SSH_PORT
Deploy User: $DEPLOY_USER (dedicated for $APP_NAME)

Production Domain: $DOMAIN
Production Path: $PRODUCTION_PATH

Staging Domain: $STAGING_DOMAIN
Staging Path: $STAGING_PATH
Staging Auth: admin / $(cat $SECRETS_DIR/staging_password.txt)

DNS Configuration Required:
---------------------------
$DOMAIN          A    $PUBLIC_IP
www.$DOMAIN      A    $PUBLIC_IP
$STAGING_DOMAIN  A    $PUBLIC_IP

NOTE: This deploy user ($DEPLOY_USER) is isolated for $APP_NAME only.
You can run this script again with different APP_NAME to create
separate deploy users for other applications on the same server.
EOF
    
    print_success "Server information saved"
}

# Generate GitHub Secrets
generate_github_secrets() {
    print_header "Generating GitHub Secrets"
    
    PUBLIC_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "Unable to detect")
    ACTUAL_SSH_PORT=$(sudo grep -E "^Port " /etc/ssh/sshd_config | awk '{print $2}' || echo "22")
    [[ -z "$ACTUAL_SSH_PORT" ]] && ACTUAL_SSH_PORT="22"
    
    # Create secrets file
    cat > "$SECRETS_DIR/github_secrets.txt" <<EOF
GitHub Repository Secrets for: $APP_NAME
=========================================

Add these secrets to your GitHub repository:
Settings > Secrets and variables > Actions > New repository secret

Deploy User: $DEPLOY_USER (isolated for $APP_NAME)

Production Deployment Secrets:
-------------------------------
DEPLOY_HOST
Value: $PUBLIC_IP

DEPLOY_USER
Value: $DEPLOY_USER

DEPLOY_KEY
Value: $(cat $DEPLOY_KEY_PATH | sed 's/^/       /')

DEPLOY_PORT
Value: $ACTUAL_SSH_PORT

DEPLOY_URL
Value: https://$DOMAIN


Staging Deployment Secrets:
---------------------------
STAGING_HOST
Value: $PUBLIC_IP

STAGING_USER
Value: $DEPLOY_USER

STAGING_KEY
Value: $(cat $DEPLOY_KEY_PATH | sed 's/^/       /')

STAGING_PORT
Value: $ACTUAL_SSH_PORT


Optional Secrets:
-----------------
SLACK_WEBHOOK_URL
Value: <your-slack-webhook-url-here>


IMPORTANT SECURITY NOTES:
========================
1. The private key is in: $DEPLOY_KEY_PATH
2. Keep this file secure and delete after adding to GitHub
3. Never commit the private key to your repository
4. The deploy user has limited sudo access for deployment tasks only
EOF
    
    # Create a formatted secrets file for easy copy-paste
    cat > "$SECRETS_DIR/secrets_formatted.sh" <<EOF
#!/bin/bash
# GitHub Secrets - Copy and paste these into GitHub UI

echo "=== DEPLOY_HOST ==="
echo "$PUBLIC_IP"
echo ""

echo "=== DEPLOY_USER ==="
echo "$DEPLOY_USER"
echo ""

echo "=== DEPLOY_KEY ==="
cat "$DEPLOY_KEY_PATH"
echo ""

echo "=== DEPLOY_PORT ==="
echo "$ACTUAL_SSH_PORT"
echo ""

echo "=== DEPLOY_URL ==="
echo "https://$DOMAIN"
echo ""

echo "=== STAGING_HOST ==="
echo "$PUBLIC_IP"
echo ""

echo "=== STAGING_USER ==="
echo "$DEPLOY_USER"
echo ""

echo "=== STAGING_KEY ==="
cat "$DEPLOY_KEY_PATH"
echo ""

echo "=== STAGING_PORT ==="
echo "$ACTUAL_SSH_PORT"
echo ""
EOF
    
    chmod +x "$SECRETS_DIR/secrets_formatted.sh"
    
    print_success "GitHub secrets generated"
}

# Create deployment test script
create_test_script() {
    cat > "$SECRETS_DIR/test_deployment.sh" <<'EOF'
#!/bin/bash
# Test deployment connection

DEPLOY_KEY="./deploy_key"
DEPLOY_USER="deploy"
DEPLOY_HOST="localhost"

if [[ ! -f "$DEPLOY_KEY" ]]; then
    echo "Error: Deploy key not found at $DEPLOY_KEY"
    exit 1
fi

chmod 600 "$DEPLOY_KEY"

echo "Testing SSH connection..."
ssh -i "$DEPLOY_KEY" -o StrictHostKeyChecking=no "$DEPLOY_USER@$DEPLOY_HOST" "echo 'Connection successful!'"

if [[ $? -eq 0 ]]; then
    echo "✓ SSH connection works!"
else
    echo "✗ SSH connection failed"
    exit 1
fi
EOF
    
    chmod +x "$SECRETS_DIR/test_deployment.sh"
}

# Print final instructions
print_final_instructions() {
    print_header "Setup Complete!"
    
    echo ""
    print_success "Server bootstrap completed successfully!"
    echo ""
    
    print_info "Application: $APP_NAME"
    print_info "Deploy User: $DEPLOY_USER"
    echo ""
    print_info "Next Steps:"
    echo ""
    echo "1. Configure DNS records (see $SECRETS_DIR/server_info.txt)"
    echo "2. Add GitHub secrets from: $SECRETS_DIR/github_secrets.txt"
    echo "3. Or run: $SECRETS_DIR/secrets_formatted.sh"
    echo "4. Setup SSL certificates:"
    echo "   sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    echo "   sudo certbot --nginx -d $STAGING_DOMAIN"
    echo "5. Test deployment: $SECRETS_DIR/test_deployment.sh"
    echo ""
    print_info "To setup another app on this server:"
    echo "   APP_NAME=\"another-app\" DOMAIN=\"another.com\" ./bootstrap-server.sh"
    echo ""
    
    print_warning "Security Reminders:"
    echo "• Delete $SECRETS_DIR after adding secrets to GitHub"
    echo "• Never commit private keys to your repository"
    echo "• Change staging password regularly"
    echo "• Keep server packages updated: sudo apt update && sudo apt upgrade"
    echo ""
    
    print_info "Files created in: $SECRETS_DIR/"
    ls -lh "$SECRETS_DIR/"
    echo ""
    
    echo -e "${GREEN}═══════════════════════════════════════${NC}"
    echo -e "${GREEN}  Server is ready for deployment! 🚀  ${NC}"
    echo -e "${GREEN}═══════════════════════════════════════${NC}"
}

# Main execution
main() {
    clear
    echo -e "${BLUE}"
    cat << "EOF"
╔═══════════════════════════════════════════════╗
║   Portfolio Server Bootstrap Script          ║
║   Automated server setup and configuration   ║
╚═══════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    echo ""
    print_info "Application Name: $APP_NAME"
    print_info "Deploy User: $DEPLOY_USER"
    print_info "Production Path: $PRODUCTION_PATH"
    print_info "Staging Path: $STAGING_PATH"
    echo ""
    
    check_root
    detect_os
    install_dependencies
    install_composer
    create_deploy_user
    create_directories
    configure_nginx
    configure_firewall
    configure_fail2ban
    get_server_info
    generate_github_secrets
    create_test_script
    setup_ssl
    print_final_instructions
}

# Run main function
main "$@"
