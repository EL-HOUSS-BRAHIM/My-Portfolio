# Nginx Deployment Guide for brahim-elhouss.me

## Overview
This guide covers the Nginx-specific configuration for the portfolio website. Since the site uses **Nginx** (not Apache), the `.htaccess` file is not used by the web server.

## Important Files for SEO

### SEO Files Location
For proper SEO and search engine crawling, the following files must be accessible at the root of the domain:

- `robots.txt` - Located in repository root
- `sitemap.xml` - Located in repository root  
- `humans.txt` - Located in repository root

### Backup Copies
For backward compatibility, backup copies are maintained in `/public/`:
- `/public/robots.txt`
- `/public/humans.txt`

**Note:** `/public/sitemap.xml` was removed to avoid duplication and potential confusion.

## Nginx Configuration

### Configuration File
The main Nginx configuration is located at:
```
config/brahim-elhouss.me.conf
```

### Key SEO-Related Configuration

```nginx
# SEO files - serve from root with optimal caching
location = /robots.txt {
    access_log off;
    add_header Cache-Control "public, max-age=86400";
    try_files /robots.txt /public/robots.txt =404;
}

location = /sitemap.xml {
    access_log off;
    add_header Cache-Control "public, max-age=3600, must-revalidate";
    add_header X-Robots-Tag "index, follow";
    try_files /sitemap.xml /public/sitemap.xml =404;
}

location = /humans.txt {
    access_log off;
    add_header Cache-Control "public, max-age=86400";
    try_files /humans.txt /public/humans.txt =404;
}
```

### How It Works
1. Nginx first tries to serve files from the repository root
2. If not found, it falls back to `/public/` directory
3. SEO files have optimized cache headers for search engines

## Deployment Steps

### 1. Update Nginx Configuration
Copy the updated configuration to the server:
```bash
sudo cp config/brahim-elhouss.me.conf /etc/nginx/sites-available/brahim-elhouss.me
```

### 2. Test Configuration
Always test before reloading:
```bash
sudo nginx -t
```

### 3. Reload Nginx
If the test passes:
```bash
sudo systemctl reload nginx
```

### 4. Verify SEO Files Are Accessible
Test that the files are properly served:
```bash
curl https://brahim-elhouss.me/robots.txt
curl https://brahim-elhouss.me/sitemap.xml
curl https://brahim-elhouss.me/humans.txt
```

## Differences from Apache (.htaccess)

| Aspect | Apache (.htaccess) | Nginx (nginx.conf) |
|--------|-------------------|-------------------|
| Configuration | `.htaccess` in directory | Central config file |
| Rewrite Rules | RewriteRule directive | location + rewrite blocks |
| Performance | Checked on every request | Loaded once at startup |
| SEO Files | Can redirect to /public/ | Served from root or /public/ |

## Troubleshooting

### Sitemap Not Found (404)
**Problem:** `/sitemap.xml` returns 404

**Solution:**
1. Verify file exists: `ls -la /var/www/html/brahim/portfolio/sitemap.xml`
2. Check file permissions: `sudo chmod 644 /var/www/html/brahim/portfolio/sitemap.xml`
3. Verify Nginx config is loaded: `sudo nginx -t && sudo systemctl reload nginx`

### Robots.txt Showing Old Content
**Problem:** Old version of robots.txt is cached

**Solution:**
1. Update the file in repository root
2. Deploy to server
3. Clear browser cache
4. Test: `curl -I https://brahim-elhouss.me/robots.txt`

### Sitemap Not Detected by Google
**Problem:** Google Search Console shows "No referring sitemaps detected"

**Solution:**
1. Verify sitemap is accessible: `curl https://brahim-elhouss.me/sitemap.xml`
2. Verify robots.txt references sitemap: `curl https://brahim-elhouss.me/robots.txt | grep Sitemap`
3. Submit sitemap manually in Google Search Console
4. Request re-indexing of main pages
5. Wait 7-14 days for Google to re-crawl

## Cache Headers for SEO

The Nginx configuration includes optimal cache headers:

- **robots.txt**: 24 hours cache (`max-age=86400`)
- **sitemap.xml**: 1 hour cache with revalidation (`max-age=3600, must-revalidate`)
- **humans.txt**: 24 hours cache (`max-age=86400`)

These settings ensure:
- Search engines get fresh content quickly
- Reduced server load from repeated requests
- Proper cache revalidation for dynamic content

## Monitoring

### Check Access Logs
```bash
sudo tail -f /var/log/nginx/brahim-elhouss.me.access.log | grep -E "robots|sitemap|humans"
```

### Check Error Logs
```bash
sudo tail -f /var/log/nginx/brahim-elhouss.me.error.log
```

### Verify Headers
```bash
curl -I https://brahim-elhouss.me/sitemap.xml
```

Expected headers:
```
HTTP/2 200 
cache-control: public, max-age=3600, must-revalidate
x-robots-tag: index, follow
content-type: application/xml
```

## Recent Changes

### November 4, 2025
- ✅ Removed duplicate `/public/sitemap.xml`
- ✅ Added `robots.txt` to repository root
- ✅ Added `humans.txt` to repository root
- ✅ Updated Nginx config with explicit location blocks for SEO files
- ✅ Added backward compatibility fallbacks to `/public/` directory
- ✅ Updated sitemap lastmod dates to trigger re-crawl

## Next Steps

After deploying these changes:

1. **Deploy to Server**
   ```bash
   git pull origin main
   sudo cp config/brahim-elhouss.me.conf /etc/nginx/sites-available/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

2. **Verify Files**
   ```bash
   curl https://brahim-elhouss.me/sitemap.xml
   curl https://brahim-elhouss.me/robots.txt
   ```

3. **Submit to Search Engines**
   - Google Search Console: Add sitemap URL
   - Bing Webmaster Tools: Add sitemap URL
   - Request re-indexing for main pages

4. **Monitor Results** (7-14 days)
   - Check sitemap status in Google Search Console
   - Search for "brahim elhouss" to verify visibility
   - Monitor crawler access in logs

## Support

For issues or questions, refer to:
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - General deployment guide
- [SEO_IMPROVEMENTS_SUMMARY.md](SEO_IMPROVEMENTS_SUMMARY.md) - SEO optimization details
- [GOOGLE_SEARCH_CONSOLE_SETUP.md](GOOGLE_SEARCH_CONSOLE_SETUP.md) - Search Console setup

---

**Last Updated:** November 4, 2025  
**Author:** Brahim El Houss  
**Server:** Nginx with PHP-FPM
