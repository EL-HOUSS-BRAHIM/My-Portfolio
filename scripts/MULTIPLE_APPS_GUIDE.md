# Multiple Apps Deployment Guide

## Overview

The bootstrap script now supports deploying **multiple applications** on the same server, each with its own:
- ✅ Dedicated deploy user (e.g., `deploy-portfolio`, `deploy-blog`, `deploy-api`)
- ✅ Isolated directory structure
- ✅ Separate Nginx configurations
- ✅ Individual log files
- ✅ Unique SSH keys
- ✅ Independent GitHub secrets

---

## Default Behavior

When you run the script **without** environment variables:

```bash
./bootstrap-server.sh
```

It creates:
- **Deploy User**: `deploy-portfolio`
- **Production Path**: `/var/www/portfolio`
- **Staging Path**: `/var/www/staging-portfolio`
- **Secrets Directory**: `./deployment-secrets-portfolio`

---

## Setup Multiple Apps on One Server

### Example: Portfolio, Blog, and API

#### 1. Setup Portfolio (First App)
```bash
APP_NAME="portfolio" \
DOMAIN="brahim-elhouss.me" \
STAGING_DOMAIN="staging.brahim-elhouss.me" \
./bootstrap-server.sh
```

**Creates:**
- Deploy user: `deploy-portfolio`
- Paths: `/var/www/portfolio` and `/var/www/staging-portfolio`
- Secrets in: `deployment-secrets-portfolio/`
- Nginx config: `/etc/nginx/sites-available/portfolio`

---

#### 2. Setup Blog (Second App)
```bash
APP_NAME="blog" \
DOMAIN="blog.brahim-elhouss.me" \
STAGING_DOMAIN="staging-blog.brahim-elhouss.me" \
./bootstrap-server.sh
```

**Creates:**
- Deploy user: `deploy-blog`
- Paths: `/var/www/blog` and `/var/www/staging-blog`
- Secrets in: `deployment-secrets-blog/`
- Nginx config: `/etc/nginx/sites-available/blog`

---

#### 3. Setup API (Third App)
```bash
APP_NAME="api" \
DOMAIN="api.brahim-elhouss.me" \
STAGING_DOMAIN="staging-api.brahim-elhouss.me" \
./bootstrap-server.sh
```

**Creates:**
- Deploy user: `deploy-api`
- Paths: `/var/www/api` and `/var/www/staging-api`
- Secrets in: `deployment-secrets-api/`
- Nginx config: `/etc/nginx/sites-available/api`

---

## What Gets Isolated Per App?

### 1. **Deploy Users** (Completely Isolated)
```bash
deploy-portfolio  # Only accesses /var/www/portfolio
deploy-blog       # Only accesses /var/www/blog
deploy-api        # Only accesses /var/www/api
```

Each deploy user:
- Has its own SSH key pair
- Can only deploy to its own app directory
- Has limited sudo permissions for its own app
- Cannot interfere with other apps

### 2. **Directory Structure**
```
/var/www/
├── portfolio/           # Owned by deploy-portfolio
│   ├── storage/
│   └── ...
├── staging-portfolio/   # Owned by deploy-portfolio
├── blog/                # Owned by deploy-blog
│   ├── storage/
│   └── ...
├── staging-blog/        # Owned by deploy-blog
├── api/                 # Owned by deploy-api
│   ├── storage/
│   └── ...
└── staging-api/         # Owned by deploy-api
```

### 3. **Nginx Configurations**
```bash
/etc/nginx/sites-available/
├── portfolio           # Server block for portfolio
├── portfolio-staging   # Server block for staging portfolio
├── blog                # Server block for blog
├── blog-staging        # Server block for staging blog
├── api                 # Server block for api
└── api-staging         # Server block for staging api
```

### 4. **Log Files**
```bash
/var/log/nginx/
├── portfolio_access.log
├── portfolio_error.log
├── portfolio_staging_access.log
├── portfolio_staging_error.log
├── blog_access.log
├── blog_error.log
├── blog_staging_access.log
├── blog_staging_error.log
├── api_access.log
├── api_error.log
├── api_staging_access.log
└── api_staging_error.log
```

### 5. **GitHub Secrets** (Per Repository)

Each app gets its own set of secrets stored in separate directories:

**Portfolio Secrets** (`deployment-secrets-portfolio/`):
```
DEPLOY_HOST=YOUR_SERVER_IP
DEPLOY_USER=deploy-portfolio
DEPLOY_KEY=<portfolio-specific-ssh-key>
DEPLOY_PORT=22
DEPLOY_URL=https://brahim-elhouss.me
```

**Blog Secrets** (`deployment-secrets-blog/`):
```
DEPLOY_HOST=YOUR_SERVER_IP
DEPLOY_USER=deploy-blog
DEPLOY_KEY=<blog-specific-ssh-key>
DEPLOY_PORT=22
DEPLOY_URL=https://blog.brahim-elhouss.me
```

**API Secrets** (`deployment-secrets-api/`):
```
DEPLOY_HOST=YOUR_SERVER_IP
DEPLOY_USER=deploy-api
DEPLOY_KEY=<api-specific-ssh-key>
DEPLOY_PORT=22
DEPLOY_URL=https://api.brahim-elhouss.me
```

---

## Advanced Configuration

### Custom Deploy User Name
```bash
APP_NAME="myapp" \
DEPLOY_USER="custom-deploy-name" \
DOMAIN="myapp.com" \
./bootstrap-server.sh
```

### Custom Paths
```bash
APP_NAME="myapp" \
PRODUCTION_PATH="/opt/myapp/production" \
STAGING_PATH="/opt/myapp/staging" \
./bootstrap-server.sh
```

### Custom SSH Port
```bash
APP_NAME="myapp" \
SSH_PORT="2222" \
./bootstrap-server.sh
```

---

## Security Benefits

### Why Separate Deploy Users?

1. **Isolation**: If one app is compromised, others remain secure
2. **Permissions**: Each user only has access to their app
3. **Auditing**: Easier to track which app performed which action
4. **Key Management**: Different SSH keys for different apps
5. **Rollback**: Can restore one app without affecting others

### Example Security Model:

```bash
# Portfolio deploy user can only:
- Access /var/www/portfolio
- Reload nginx (limited sudo)
- Restart php-fpm (limited sudo)
- Cannot access blog or api directories

# Blog deploy user can only:
- Access /var/www/blog
- Reload nginx (limited sudo)
- Restart php-fpm (limited sudo)
- Cannot access portfolio or api directories
```

---

## GitHub Actions Workflow

Each repository uses its own secrets:

### Portfolio Repository
```yaml
deploy-production:
  steps:
    - uses: appleboy/ssh-action@v1.0.0
      with:
        host: ${{ secrets.DEPLOY_HOST }}
        username: ${{ secrets.DEPLOY_USER }}  # deploy-portfolio
        key: ${{ secrets.DEPLOY_KEY }}        # portfolio-specific key
```

### Blog Repository
```yaml
deploy-production:
  steps:
    - uses: appleboy/ssh-action@v1.0.0
      with:
        host: ${{ secrets.DEPLOY_HOST }}      # same server
        username: ${{ secrets.DEPLOY_USER }}  # deploy-blog
        key: ${{ secrets.DEPLOY_KEY }}        # blog-specific key
```

---

## DNS Configuration for Multiple Apps

```
# Portfolio
brahim-elhouss.me          A    YOUR_SERVER_IP
www.brahim-elhouss.me      A    YOUR_SERVER_IP
staging.brahim-elhouss.me  A    YOUR_SERVER_IP

# Blog
blog.brahim-elhouss.me           A    YOUR_SERVER_IP
staging-blog.brahim-elhouss.me   A    YOUR_SERVER_IP

# API
api.brahim-elhouss.me            A    YOUR_SERVER_IP
staging-api.brahim-elhouss.me    A    YOUR_SERVER_IP
```

---

## SSL Certificates for Multiple Apps

```bash
# Portfolio
sudo certbot --nginx -d brahim-elhouss.me -d www.brahim-elhouss.me
sudo certbot --nginx -d staging.brahim-elhouss.me

# Blog
sudo certbot --nginx -d blog.brahim-elhouss.me
sudo certbot --nginx -d staging-blog.brahim-elhouss.me

# API
sudo certbot --nginx -d api.brahim-elhouss.me
sudo certbot --nginx -d staging-api.brahim-elhouss.me
```

---

## Testing Connections

Test each app's deployment connection:

```bash
# Test portfolio
ssh -i deployment-secrets-portfolio/deploy_key deploy-portfolio@YOUR_SERVER_IP

# Test blog
ssh -i deployment-secrets-blog/deploy_key deploy-blog@YOUR_SERVER_IP

# Test api
ssh -i deployment-secrets-api/deploy_key deploy-api@YOUR_SERVER_IP
```

---

## Cleanup

After adding secrets to GitHub, clean up sensitive files:

```bash
# Delete secrets for all apps
rm -rf deployment-secrets-portfolio/
rm -rf deployment-secrets-blog/
rm -rf deployment-secrets-api/
```

**Never commit these directories to git!**

---

## Troubleshooting

### Check which apps are deployed:
```bash
ls -la /var/www/
ls -la /etc/nginx/sites-available/
cat /etc/passwd | grep deploy-
```

### Check permissions:
```bash
# Portfolio
ls -la /var/www/portfolio
sudo -u deploy-portfolio ls -la /var/www/portfolio

# Blog
ls -la /var/www/blog
sudo -u deploy-blog ls -la /var/www/blog
```

### View app-specific logs:
```bash
# Portfolio logs
sudo tail -f /var/log/nginx/portfolio_access.log
sudo tail -f /var/log/nginx/portfolio_error.log

# Blog logs
sudo tail -f /var/log/nginx/blog_access.log
sudo tail -f /var/log/nginx/blog_error.log
```

### Restart specific app:
```bash
# Restart nginx (affects all apps)
sudo systemctl reload nginx

# Only portfolio needs reload
sudo -u deploy-portfolio sudo systemctl reload nginx
```

---

## Migration from Single Deploy User

If you have an existing `deploy` user and want to migrate to app-specific users:

```bash
# 1. Run bootstrap for each app with new names
APP_NAME="portfolio" ./bootstrap-server.sh
APP_NAME="blog" ./bootstrap-server.sh

# 2. Copy existing files to new locations
sudo cp -r /var/www/old-location/* /var/www/portfolio/
sudo chown -R deploy-portfolio:www-data /var/www/portfolio/

# 3. Update GitHub secrets in each repository

# 4. Test deployments

# 5. Remove old deploy user (optional)
sudo userdel -r deploy
```

---

## Best Practices

1. **One app per deploy user** - Don't share deploy users between apps
2. **Unique SSH keys** - Each app should have its own key pair
3. **Separate secrets** - Never share secrets between repositories
4. **Monitor logs** - Each app has its own log files
5. **Regular updates** - Keep all apps and system packages updated
6. **Backup separately** - Back up each app independently
7. **Test staging first** - Always deploy to staging before production

---

## Summary

**Before (Old Way):**
- Single `deploy` user for all apps
- Shared SSH key
- Difficult to isolate issues
- Security risk if one app compromised

**After (New Way):**
- `deploy-portfolio`, `deploy-blog`, `deploy-api` users
- Separate SSH keys per app
- Complete isolation
- Enhanced security and management

The bootstrap script now makes it easy to manage multiple applications on a single server while maintaining security and isolation! 🚀
