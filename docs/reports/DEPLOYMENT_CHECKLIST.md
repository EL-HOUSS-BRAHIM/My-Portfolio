# Deployment Checklist

## Pre-Deployment
- [ ] All tests pass
- [ ] Code is optimized and minified
- [ ] Environment variables are configured
- [ ] Database migrations are ready
- [ ] SSL certificates are valid
- [ ] Backup current site

## Deployment
- [ ] Upload optimized files
- [ ] Run database migrations
- [ ] Update Nginx configuration
- [ ] Restart PHP-FPM
- [ ] Clear all caches
- [ ] Run cache warmup script: `php warmup-cache.php`

## Post-Deployment
- [ ] Test all functionality
- [ ] Verify SSL/TLS configuration
- [ ] Check site performance
- [ ] Monitor error logs
- [ ] Test contact form
- [ ] Verify testimonials loading
- [ ] Check mobile responsiveness

## Performance Verification
- [ ] Run PageSpeed Insights
- [ ] Test with GTmetrix
- [ ] Verify WebP image serving
- [ ] Check gzip compression
- [ ] Test API endpoints
- [ ] Verify rate limiting

## Security Verification
- [ ] Test security headers
- [ ] Verify CSP policy
- [ ] Check for XSS vulnerabilities
- [ ] Test rate limiting
- [ ] Verify file upload security
- [ ] Check error handling

## Monitoring Setup
- [ ] Configure error logging
- [ ] Set up performance monitoring
- [ ] Configure uptime monitoring
- [ ] Set up backup schedules
- [ ] Configure log rotation
