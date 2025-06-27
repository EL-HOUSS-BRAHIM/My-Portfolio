# Portfolio Website Deployment Guide

This guide will help you deploy your portfolio website to your server with the domain `brahim-elhouss.me`.

## Prerequisites

1. **Server Requirements:**
   - Ubuntu/Debian server
   - Nginx web server
   - PHP 8.1 or higher with PHP-FPM
   - Composer (for PHP dependencies)

2. **Domain Setup:**
   - Domain `brahim-elhouss.me` pointing to your server's IP
   - Cloudflare configured for SSL (recommended)

## Installation Steps

### 1. Install Required Packages

```bash
sudo apt update
sudo apt install nginx php8.1-fpm php8.1-mysql php8.1-curl php8.1-json php8.1-mbstring php8.1-xml php8.1-zip composer
```

### 2. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file with your actual configuration:
   ```bash
   nano .env
   ```

   Update the following variables:
   - Database credentials
   - SMTP settings for email
   - JWT secret key (generate a random string)
   - Your domain name

### 3. Install PHP Dependencies

```bash
composer install --no-dev --optimize-autoloader
```

### 4. Deploy Nginx Configuration

Run the deployment script:
```bash
sudo ./deploy.sh
```

Or manually:
```bash
# Copy nginx configuration
sudo cp brahim-elhouss.me.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/brahim-elhouss.me.conf /etc/nginx/sites-enabled/

# Test and reload nginx
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Set Proper Permissions

```bash
# Set ownership
sudo chown -R www-data:www-data /home/bross/Desktop/portfolio

# Set permissions
sudo chmod -R 755 /home/bross/Desktop/portfolio
sudo chmod -R 644 /home/bross/Desktop/portfolio/.env
```

### 6. Start/Enable Services

```bash
sudo systemctl enable nginx php8.1-fpm
sudo systemctl start nginx php8.1-fpm
```

## Security Considerations

1. **Environment File Protection:**
   - The `.env` file is protected by nginx configuration
   - Never commit `.env` to version control

2. **File Permissions:**
   - Ensure proper file permissions are set
   - Web server should not have write access to code files

3. **Database Security:**
   - Use strong passwords
   - Consider using SSL for database connections

4. **Cloudflare Settings:**
   - Enable "Always Use HTTPS"
   - Configure appropriate security settings
   - Use "Full (strict)" SSL mode if you have SSL certificates on your server

## Troubleshooting

### Common Issues

1. **PHP-FPM Socket Error:**
   ```bash
   sudo systemctl status php8.1-fpm
   ```
   Adjust the socket path in nginx config if needed.

2. **Permission Denied:**
   ```bash
   sudo chown -R www-data:www-data /path/to/website
   ```

3. **Environment Variables Not Loading:**
   - Check if composer dependencies are installed
   - Verify `.env` file exists and has correct syntax

### Log Files

- Nginx access logs: `/var/log/nginx/brahim-elhouss.me.access.log`
- Nginx error logs: `/var/log/nginx/brahim-elhouss.me.error.log`
- PHP-FPM logs: `/var/log/php8.1-fpm.log`

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | Database host | `localhost` |
| `DB_NAME` | Database name | `portfolio_db` |
| `DB_USER` | Database username | `portfolio_user` |
| `DB_PASS` | Database password | `secure_password` |
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `SMTP_USERNAME` | SMTP username | `your-email@gmail.com` |
| `SMTP_PASSWORD` | SMTP password | `app_password` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_ENCRYPTION` | Encryption type | `tls` |
| `FROM_EMAIL` | Sender email | `noreply@yourdomain.com` |
| `FROM_NAME` | Sender name | `Your Name` |
| `TO_EMAIL` | Recipient email | `your-email@gmail.com` |
| `TO_NAME` | Recipient name | `Your Name` |
| `SECRET_KEY` | JWT secret key | `random_string_here` |
| `DOMAIN` | Your domain | `brahim-elhouss.me` |

## Files Created/Modified

- `.env` - Environment variables (contains secrets)
- `.env.example` - Example environment file
- `brahim-elhouss.me.conf` - Nginx configuration
- `deploy.sh` - Deployment script
- `contact.php` - Updated to use environment variables
- `db_config.php` - Updated to use environment variables

The deployment is now ready for your `brahim-elhouss.me` domain with Cloudflare SSL!
