# Cloudflare Configuration Guide for brahim-elhouss.me

## Overview
This guide will help you configure Cloudflare for optimal performance and security with your portfolio website.

## 🌐 DNS Configuration

### 1. Add DNS Records
In your Cloudflare DNS dashboard, add these records:

```
Type: A
Name: @
Value: YOUR_SERVER_IP
Proxy status: Proxied (orange cloud)
TTL: Auto

Type: A  
Name: www
Value: YOUR_SERVER_IP
Proxy status: Proxied (orange cloud)
TTL: Auto

Type: CNAME
Name: api
Value: brahim-elhouss.me
Proxy status: Proxied (orange cloud)
TTL: Auto
```

## 🔒 SSL/TLS Configuration

### 1. SSL Mode
- Go to **SSL/TLS** → **Overview**
- Set SSL mode to: **Full (strict)**
- This ensures end-to-end encryption

### 2. Always Use HTTPS
- Go to **SSL/TLS** → **Edge Certificates**
- Enable **Always Use HTTPS**
- Enable **HTTP Strict Transport Security (HSTS)**
  - Max Age Header: 12 months
  - Include Subdomains: Yes
  - Preload: Yes
  - No-Sniff Header: Yes

### 3. TLS Version
- Set **Minimum TLS Version** to: **TLS 1.2**

## 🚀 Performance Optimization

### 1. Speed Settings
- Go to **Speed** → **Optimization**
- Enable **Auto Minify** for:
  - JavaScript: ✅
  - CSS: ✅  
  - HTML: ✅
- Enable **Brotli**: ✅

### 2. Caching
- Go to **Caching** → **Configuration**
- Set **Caching Level** to: **Standard**
- Set **Cache TTL** to: **Respect Existing Headers**

### 3. Page Rules (Optional)
Create these page rules in order:

```
1. brahim-elhouss.me/assets/*
   Settings: Cache Level: Cache Everything, Edge Cache TTL: 1 month

2. brahim-elhouss.me/api/*
   Settings: Cache Level: Bypass, Disable Security

3. brahim-elhouss.me/*
   Settings: Always Use HTTPS, Cache Level: Standard
```

## 🛡️ Security Configuration

### 1. Firewall Rules
- Go to **Security** → **WAF**
- Set **Security Level** to: **Medium**
- Enable **Bot Fight Mode**

### 2. Rate Limiting (Optional - Premium Feature)
If you have a Pro/Business plan:
```
Rule 1: API Protection
- URL: brahim-elhouss.me/api/*
- Threshold: 100 requests per 10 minutes
- Action: Challenge

Rule 2: Contact Form Protection  
- URL: brahim-elhouss.me/contact*
- Threshold: 10 requests per 10 minutes
- Action: Challenge
```

### 3. Security Headers
Your Nginx config already handles security headers, but you can also set them in Cloudflare:

- Go to **Security** → **Settings**
- **Security Headers**:
  - Enable **HSTS**
  - Certificate Transparency Monitoring: ✅

## 🔧 Additional Settings

### 1. Network
- **HTTP/2**: Enabled (default)
- **0-RTT Connection Resumption**: Enabled
- **IPv6 Compatibility**: Enabled

### 2. Scrape Shield
- **Email Address Obfuscation**: Enabled
- **Server-side Excludes**: Enabled
- **Hotlink Protection**: Enabled

### 3. Custom Domain (If using subdomain)
If you want to use a custom subdomain like `portfolio.brahim-elhouss.me`:
- Add CNAME record: `portfolio` → `brahim-elhouss.me`
- Update your Nginx server_name directive

## 📊 Analytics & Monitoring

### 1. Web Analytics
- Go to **Analytics & Logs** → **Web Analytics**
- Enable **Cloudflare Web Analytics**
- Add the beacon to your HTML head section

### 2. Real User Monitoring (RUM)
- Enable **Browser Insights** for performance monitoring

## 🚨 Troubleshooting

### Common Issues:

1. **Flexible SSL Error**
   - Make sure SSL mode is set to **Full (strict)**
   - Verify your server has valid SSL certificates

2. **Too Many Redirects**
   - Check that your Nginx config doesn't conflict with Cloudflare's HTTPS redirects
   - Ensure **Always Use HTTPS** is enabled in Cloudflare

3. **API Not Working**
   - Verify **Development Mode** is disabled
   - Check that API endpoints aren't being cached

### Testing Commands:
```bash
# Test SSL certificate
curl -I https://brahim-elhouss.me

# Check headers
curl -H "Accept-Encoding: gzip, deflate, br" -I https://brahim-elhouss.me

# Test API endpoint
curl -X GET https://brahim-elhouss.me/api/health

# Verify real IP forwarding
curl -H "CF-Connecting-IP: 1.2.3.4" https://brahim-elhouss.me/health
```

## 📱 Mobile Optimization

### AMP (Accelerated Mobile Pages)
If you implement AMP pages:
- Enable **AMP Real URL** in Speed settings
- Configure AMP-specific caching rules

## 🔄 Deployment Checklist

Before going live:
- [ ] DNS records configured and propagated
- [ ] SSL mode set to Full (strict)
- [ ] Always Use HTTPS enabled
- [ ] Security level configured
- [ ] Caching rules in place
- [ ] Page rules configured (if needed)
- [ ] Analytics enabled
- [ ] Test all functionality
- [ ] Monitor error logs

## 📞 Support

For Cloudflare-specific issues:
- Check [Cloudflare Status](https://www.cloudflarestatus.com/)
- Review [Cloudflare Documentation](https://developers.cloudflare.com/)
- Use Cloudflare Support (for paid plans)

---

**Note**: After configuring Cloudflare, it may take up to 24-48 hours for all changes to propagate globally. Monitor your site's performance and adjust settings as needed.
