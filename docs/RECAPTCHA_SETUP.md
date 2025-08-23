# reCAPTCHA Setup Instructions

## Overview
This guide will help you obtain and configure Google reCAPTCHA v2 keys for your portfolio website.

## Step 1: Create reCAPTCHA Keys

1. **Visit Google reCAPTCHA Admin Console**
   - Go to: https://www.google.com/recaptcha/admin/create
   - Sign in with your Google account

2. **Register Your Site**
   - **Label**: Give your site a descriptive name (e.g., "My Portfolio Website")
   - **reCAPTCHA type**: Select "reCAPTCHA v2" > "I'm not a robot" Checkbox
   - **Domains**: Add your domain(s):
     - `brahim-elhouss.me`
     - `v2.brahim-elhouss.me`
     - `localhost` (for testing)
   - **Accept the reCAPTCHA Terms of Service**
   - Click **Submit**

3. **Copy Your Keys**
   After creating the site, you'll get two keys:
   - **Site Key** (starts with `6Le...`): Used in frontend HTML
   - **Secret Key** (starts with `6Le...`): Used in backend PHP

## Step 2: Update Environment Configuration

1. **Edit your .env file**
   ```bash
   nano .env
   ```

2. **Replace the placeholder values** with your actual keys:
   ```bash
   # reCAPTCHA Configuration
   RECAPTCHA_SITE_KEY=6LeYourActualSiteKeyHere
   RECAPTCHA_SECRET_KEY=6LeYourActualSecretKeyHere
   RECAPTCHA_ENABLED=true
   ```

## Step 3: Testing

1. **Local Testing**
   - Make sure `localhost` is added to your reCAPTCHA domains
   - Test both contact and testimonial forms
   - Verify CAPTCHA appears and validates properly

2. **Production Testing**
   - Deploy to your server
   - Test with your actual domain
   - Check both successful and failed CAPTCHA scenarios

## Step 4: Security Best Practices

1. **Protect Your Secret Key**
   - Never expose the secret key in frontend code
   - Keep it secure in your .env file
   - Don't commit it to version control

2. **Domain Restrictions**
   - Only add domains you actually use
   - Remove test domains from production configuration

3. **Monitor Usage**
   - Check the reCAPTCHA admin console for usage statistics
   - Watch for unusual patterns or potential abuse

## Troubleshooting

### Common Issues:

1. **"Invalid site key"**
   - Verify the site key matches exactly
   - Check that the domain is registered in reCAPTCHA admin
   - Ensure there are no extra spaces or characters

2. **"Verification failed"**
   - Check that the secret key is correct
   - Verify server can make HTTPS requests to Google
   - Check server logs for specific error messages

3. **CAPTCHA not appearing**
   - Check browser console for JavaScript errors
   - Verify reCAPTCHA script is loading
   - Ensure `RECAPTCHA_ENABLED=true` in configuration

### Debug Mode:

To enable debug logging, set in your .env:
```bash
APP_DEBUG=true
```

This will log CAPTCHA verification attempts to help troubleshoot issues.

## Support

- Google reCAPTCHA Documentation: https://developers.google.com/recaptcha/docs/display
- reCAPTCHA Admin Console: https://www.google.com/recaptcha/admin