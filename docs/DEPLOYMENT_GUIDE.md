# Deployment Guide - Mobile Responsive Portfolio with CAPTCHA Integration

## Overview
This deployment guide covers the updated portfolio website with enhanced mobile responsiveness and reCAPTCHA security integration.

## Pre-Deployment Checklist

### 1. Environment Configuration
```bash
# Verify all required environment variables are set
grep -E "RECAPTCHA_|APP_DEBUG|DB_|SMTP_" .env
```

### 2. Get reCAPTCHA Keys
Follow the instructions in `docs/RECAPTCHA_SETUP.md` to:
- Create Google reCAPTCHA v2 keys
- Add domains to reCAPTCHA admin console
- Update `.env` with actual keys

### 3. File Updates Required
- **Main file**: Use `index.php` instead of `index.html` (now includes PHP configuration)
- **Environment**: Update `.env` with real reCAPTCHA keys
- **Dependencies**: Ensure all files in `src/utils/` are uploaded

## Deployment Steps

### Step 1: Backup Current Site
```bash
# On server, create backup
tar -czf portfolio_backup_$(date +%Y%m%d_%H%M%S).tar.gz /path/to/current/site
```

### Step 2: Upload Files
```bash
# Upload all files via FTP, SCP, or your preferred method
# Ensure proper file permissions
chmod 644 *.php *.html *.css *.js
chmod 755 scripts/ src/
chmod 600 .env
```

### Step 3: Configure Web Server

#### For Apache (.htaccess updates)
```apache
# Add to .htaccess for index.php as default
DirectoryIndex index.php index.html

# PHP configuration
php_value upload_max_filesize 5M
php_value post_max_size 10M
php_value max_execution_time 30
```

#### For Nginx
```nginx
# Update server block
index index.php index.html;

location ~ \.php$ {
    fastcgi_pass php-fpm;
    fastcgi_index index.php;
    include fastcgi_params;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
}
```

### Step 4: Environment Setup
```bash
# Copy environment template and configure
cp .env.example .env

# Update with production values
nano .env
```

Required environment variables:
```bash
# Database
DB_HOST=localhost
DB_NAME=portfolio
DB_USERNAME=your_db_user
DB_PASSWORD=your_secure_password

# Email (AWS SES)
SMTP_HOST=email-smtp.your-region.amazonaws.com
SMTP_USERNAME=your_smtp_username
SMTP_PASSWORD=your_smtp_password
FROM_EMAIL=no_reply@yourdomain.com
TO_EMAIL=your-email@domain.com

# reCAPTCHA (CRITICAL - Replace with real keys)
RECAPTCHA_SITE_KEY=6LeYourActualSiteKeyHere
RECAPTCHA_SECRET_KEY=6LeYourActualSecretKeyHere
RECAPTCHA_ENABLED=true

# Application
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com
```

### Step 5: Database Setup
```bash
# Run database migrations if needed
mysql -u username -p portfolio < database/setup.sql
```

### Step 6: Test reCAPTCHA Integration
```bash
# Test CAPTCHA configuration
curl -X POST https://yourdomain.com/src/api/contact.php \
  -F "name=Test User" \
  -F "email=test@example.com" \
  -F "message=Test message" \
  -F "g-recaptcha-response=test"
```

### Step 7: Verify Mobile Responsiveness
Test on various devices:
- Phone (320px - 768px)
- Tablet (768px - 1024px)  
- Desktop (1024px+)

Key mobile features to verify:
- Navigation hamburger menu
- Form touch targets (minimum 44px)
- Responsive images and text
- Contact and testimonial forms
- reCAPTCHA widget responsiveness

## Post-Deployment Verification

### 1. Functional Testing
```bash
# Test contact form
curl -X POST https://yourdomain.com/src/api/contact.php \
  -F "name=Test" \
  -F "email=test@example.com" \
  -F "message=Test" \
  -F "g-recaptcha-response=VALID_CAPTCHA_RESPONSE"

# Test testimonial form  
curl -X POST https://yourdomain.com/src/api/add_testimonial.php \
  -F "name=Test" \
  -F "rating=5" \
  -F "testimonial=Great!" \
  -F "image=@test_image.jpg" \
  -F "g-recaptcha-response=VALID_CAPTCHA_RESPONSE"
```

### 2. Security Verification
- [ ] reCAPTCHA appears on both forms
- [ ] Forms reject submissions without valid CAPTCHA
- [ ] Rate limiting still functional
- [ ] HTTPS redirects working
- [ ] No debug information exposed

### 3. Performance Testing
```bash
# Check page load speed
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com/

# Mobile performance
# Use Google PageSpeed Insights or similar tools
```

### 4. Error Monitoring
```bash
# Monitor logs for errors
tail -f /var/log/apache2/error.log
tail -f storage/logs/app.log
```

## Rollback Plan

If issues arise:

### Quick Rollback
```bash
# Restore from backup
tar -xzf portfolio_backup_YYYYMMDD_HHMMSS.tar.gz -C /path/to/site/

# Disable reCAPTCHA temporarily
echo "RECAPTCHA_ENABLED=false" >> .env
```

### Gradual Rollback
1. Revert to `index.html` in web server config
2. Disable reCAPTCHA in environment
3. Test basic functionality
4. Plan fixes for next deployment

## Monitoring and Maintenance

### Daily Checks
- [ ] Forms accepting submissions
- [ ] reCAPTCHA service operational  
- [ ] Email delivery working
- [ ] Mobile responsiveness intact
- [ ] No PHP errors in logs

### Weekly Tasks
- [ ] Review reCAPTCHA usage in Google console
- [ ] Check mobile performance metrics
- [ ] Verify backup systems
- [ ] Update dependencies if needed

### Monthly Reviews
- [ ] Analyze form submission patterns
- [ ] Review security logs
- [ ] Update reCAPTCHA configuration if needed
- [ ] Performance optimization review

## Troubleshooting

### Common Issues

#### reCAPTCHA Not Loading
```bash
# Check configuration
grep RECAPTCHA .env

# Verify domain in Google console
# Check browser console for errors
```

#### Mobile Layout Issues
```bash
# Check CSS compilation
ls -la assets/css/

# Verify viewport meta tag
grep -n viewport index.php
```

#### Form Submission Failures
```bash
# Check PHP error logs
tail -f /var/log/php_errors.log

# Verify file permissions
ls -la src/api/
```

#### Database Connection Issues
```bash
# Test database connection
mysql -u $DB_USERNAME -p$DB_PASSWORD -h $DB_HOST $DB_NAME -e "SELECT 1;"
```

### Support Contacts

**Developer**: Brahim El Houss  
**Email**: brahim.crafts.tech@gmail.com  
**Documentation**: `docs/` folder  
**Test Plans**: `docs/CAPTCHA_TEST_PLAN.md`  

## Security Notes

- Never commit `.env` with real credentials
- Regularly update reCAPTCHA keys if compromised
- Monitor form submissions for unusual patterns
- Keep PHP and dependencies updated
- Review access logs for suspicious activity

## Success Criteria

Deployment is successful when:
- [x] Website loads on `yourdomain.com`
- [x] Mobile responsiveness verified on all devices
- [x] Contact form submits with reCAPTCHA validation
- [x] Testimonial form accepts submissions with CAPTCHA
- [x] Email delivery functional
- [x] No console errors or PHP warnings
- [x] Security headers and HTTPS working
- [x] Performance metrics acceptable
- [x] All documentation updated

---

**Deployment Date**: _________________  
**Deployed By**: _________________  
**Version**: v2.1.0 (Mobile + CAPTCHA)  
**Status**: _________________ 