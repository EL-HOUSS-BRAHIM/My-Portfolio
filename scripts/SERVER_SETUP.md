# Server Setup Guide

This guide will help you set up your production and staging servers for automated deployment.

## Prerequisites

- A fresh Ubuntu 20.04+ or Debian 11+ server (VPS or dedicated)
- Root or sudo access to the server
- Domain name configured with your DNS provider
- SSH access to the server

## Quick Start

### 1. Connect to Your Server

```bash
ssh root@your-server-ip
# or
ssh your-user@your-server-ip
```

### 2. Download and Run Bootstrap Script

```bash
# Clone your repository or download the script
curl -O https://raw.githubusercontent.com/EL-HOUSS-BRAHIM/My-Portfolio/main/scripts/bootstrap-server.sh

# Or if you have git installed
git clone https://github.com/EL-HOUSS-BRAHIM/My-Portfolio.git
cd My-Portfolio/scripts

# Make it executable
chmod +x bootstrap-server.sh

# Run the script
./bootstrap-server.sh
```

### 3. Custom Configuration (Optional)

You can customize the setup by setting environment variables:

```bash
# Custom domain and user
DOMAIN="yourdomain.com" \
STAGING_DOMAIN="staging.yourdomain.com" \
DEPLOY_USER="deployer" \
./bootstrap-server.sh
```

## What the Script Does

### 1. **System Setup**
- Detects OS and installs required packages
- Installs Nginx, PHP 8.2, MySQL, and dependencies
- Installs Composer for PHP dependency management
- Configures firewall (UFW/firewalld)
- Sets up fail2ban for security

### 2. **Deployment User**
- Creates a dedicated deployment user
- Generates SSH key pair for GitHub Actions
- Configures limited sudo access for deployment tasks
- Sets up proper permissions

### 3. **Directory Structure**
- Production: `/var/www/portfolio`
- Staging: `/var/www/staging-portfolio`
- Creates storage directories for logs, cache, and sessions

### 4. **Web Server Configuration**
- Configures Nginx for both production and staging
- Sets up PHP-FPM
- Configures security headers
- Enables caching for static assets
- Adds basic authentication for staging

### 5. **Security**
- Configures firewall rules
- Sets up fail2ban
- Prepares for SSL certificate installation
- Implements secure file permissions

### 6. **GitHub Secrets Generation**
- Generates all required secrets for GitHub Actions
- Creates formatted files for easy copy-paste
- Provides server information and DNS configuration

## After Bootstrap Completes

The script creates a `deployment-secrets` directory with several files:

### Files Created

```
deployment-secrets/
├── deploy_key              # Private SSH key (add to GitHub)
├── deploy_key.pub          # Public SSH key
├── server_info.txt         # Server details and DNS config
├── github_secrets.txt      # All secrets formatted for GitHub
├── secrets_formatted.sh    # Script to display secrets
├── staging_password.txt    # Staging area password
└── test_deployment.sh      # Test deployment connection
```

### Step-by-Step: Add Secrets to GitHub

1. Go to your GitHub repository
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Open `deployment-secrets/github_secrets.txt` and add each secret:

#### Required Production Secrets

| Secret Name | Description | Get From |
|-------------|-------------|----------|
| `DEPLOY_HOST` | Server IP address | `server_info.txt` |
| `DEPLOY_USER` | Deployment username | `server_info.txt` |
| `DEPLOY_KEY` | Private SSH key | `deploy_key` file |
| `DEPLOY_PORT` | SSH port (usually 22) | `server_info.txt` |
| `DEPLOY_URL` | Production URL | `server_info.txt` |

#### Required Staging Secrets

| Secret Name | Description | Get From |
|-------------|-------------|----------|
| `STAGING_HOST` | Server IP address | `server_info.txt` |
| `STAGING_USER` | Deployment username | `server_info.txt` |
| `STAGING_KEY` | Private SSH key | `deploy_key` file |
| `STAGING_PORT` | SSH port (usually 22) | `server_info.txt` |

#### Optional Secrets

| Secret Name | Description |
|-------------|-------------|
| `SLACK_WEBHOOK_URL` | Slack webhook for notifications |

### Quick Copy-Paste Method

Run this script to display all secrets in your terminal for easy copying:

```bash
cd deployment-secrets
./secrets_formatted.sh
```

Then copy each value and paste into GitHub Secrets UI.

## DNS Configuration

Before enabling SSL, configure your DNS records:

```
Type    Name                Value
────────────────────────────────────────
A       @                   YOUR_SERVER_IP
A       www                 YOUR_SERVER_IP
A       staging             YOUR_SERVER_IP
```

**Wait for DNS propagation** (can take up to 48 hours, usually much faster)

Check DNS propagation:
```bash
nslookup yourdomain.com
nslookup staging.yourdomain.com
```

## Enable SSL Certificates

Once DNS is configured, enable HTTPS:

```bash
# Production
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Staging
sudo certbot --nginx -d staging.yourdomain.com
```

Certbot will:
- Obtain free SSL certificates from Let's Encrypt
- Auto-configure Nginx
- Set up auto-renewal

## Test Deployment

Test the deployment connection:

```bash
cd deployment-secrets
./test_deployment.sh
```

This verifies that:
- SSH connection works
- Authentication is successful
- Deployment user has correct permissions

## Trigger First Deployment

Once secrets are added to GitHub:

1. Push any change to the `main` branch
2. GitHub Actions will automatically:
   - Run tests and quality checks
   - Deploy to staging
   - Deploy to production

Monitor the deployment:
```bash
# On GitHub
# Go to Actions tab and watch the workflow

# On Server
tail -f /var/log/nginx/portfolio_access.log
```

## Staging Access

Access staging site with basic auth:

- **URL**: https://staging.yourdomain.com
- **Username**: admin
- **Password**: (found in `deployment-secrets/staging_password.txt`)

## Troubleshooting

### SSH Connection Issues

```bash
# Test SSH connection
ssh -i deployment-secrets/deploy_key deploy@YOUR_SERVER_IP

# Check SSH service
sudo systemctl status ssh

# Check firewall
sudo ufw status
```

### Permission Issues

```bash
# Fix ownership
sudo chown -R www-data:www-data /var/www/portfolio
sudo chown -R www-data:www-data /var/www/staging-portfolio

# Fix permissions
sudo find /var/www/portfolio -type d -exec chmod 755 {} \;
sudo find /var/www/portfolio -type f -exec chmod 644 {} \;
```

### Nginx Issues

```bash
# Test configuration
sudo nginx -t

# Check logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### PHP-FPM Issues

```bash
# Check PHP-FPM status
sudo systemctl status php8.2-fpm

# Restart PHP-FPM
sudo systemctl restart php8.2-fpm

# Check logs
sudo tail -f /var/log/php8.2-fpm.log
```

## Security Best Practices

1. **Keep Server Updated**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Change Staging Password Regularly**
   ```bash
   sudo htpasswd /etc/nginx/.htpasswd admin
   ```

3. **Monitor Logs**
   ```bash
   sudo tail -f /var/log/nginx/portfolio_error.log
   sudo tail -f /var/log/auth.log
   ```

4. **Check Fail2ban Status**
   ```bash
   sudo fail2ban-client status
   sudo fail2ban-client status sshd
   ```

5. **Delete Secrets After Adding to GitHub**
   ```bash
   # After adding all secrets to GitHub
   rm -rf deployment-secrets/
   ```

## Manual Deployment (Emergency)

If you need to deploy manually:

```bash
# SSH to server
ssh -i deployment-secrets/deploy_key deploy@YOUR_SERVER_IP

# Navigate to site
cd /var/www/portfolio

# Pull latest changes
git pull origin main

# Install dependencies
composer install --no-dev --optimize-autoloader

# Set permissions
sudo chown -R www-data:www-data .
sudo systemctl reload nginx
```

## Maintenance

### Backup Database

```bash
sudo mysqldump -u root -p portfolio_db > backup_$(date +%Y%m%d).sql
```

### View Deployment History

```bash
# On server
ls -lah /tmp/portfolio-backup-*

# Restore from backup if needed
sudo tar -xzf /tmp/portfolio-backup-YYYYMMDD_HHMMSS.tar.gz -C /var/www/
```

### Update PHP Version

```bash
sudo apt update
sudo apt install php8.3-fpm php8.3-cli php8.3-common
# Update Nginx config to use new PHP version
sudo nano /etc/nginx/sites-available/portfolio
# Change: fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
sudo nginx -t && sudo systemctl reload nginx
```

## Support

If you encounter issues:

1. Check the [GitHub Actions logs](https://github.com/EL-HOUSS-BRAHIM/My-Portfolio/actions)
2. Review server logs: `/var/log/nginx/` and `/var/log/php8.2-fpm.log`
3. Verify secrets are correctly added to GitHub
4. Ensure DNS is properly configured
5. Check firewall rules aren't blocking connections

## Additional Resources

- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Fail2ban Documentation](https://www.fail2ban.org/wiki/index.php/Main_Page)
