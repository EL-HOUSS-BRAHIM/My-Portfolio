# Google Analytics Setup Guide

## Overview

Google Analytics (GA4) has been added to the portfolio website to track visitor behavior, traffic sources, and help diagnose potential SEO issues.

## Current Status

✅ Google Analytics tracking code is installed in `index.php`
⚠️ **Action Required**: Replace the placeholder tracking ID with your actual GA4 Measurement ID

## Setup Instructions

### Step 1: Create a Google Analytics Account

1. Go to [Google Analytics](https://analytics.google.com/)
2. Sign in with your Google account
3. Click "Start measuring" or "Admin" (gear icon)
4. Click "Create Account"
5. Enter account details:
   - Account name: `Brahim El Houss Portfolio`
   - Data sharing settings: Choose as needed
6. Click "Next"

### Step 2: Create a Property

1. Property name: `brahim-elhouss.me`
2. Reporting time zone: Your time zone (e.g., `Morocco - GMT+00:00`)
3. Currency: `USD` or your preferred currency
4. Click "Next"

### Step 3: Configure Business Details

1. Industry category: `Technology`
2. Business size: `Small` or as appropriate
3. Click "Next"

### Step 4: Choose Your Platform

1. Select "Web"
2. Website URL: `https://brahim-elhouss.me`
3. Stream name: `Portfolio Website`
4. Click "Create stream"

### Step 5: Get Your Measurement ID

After creating the stream, you'll see your **Measurement ID** in the format:
```
G-XXXXXXXXXX
```

### Step 6: Update the Website

Replace the placeholder ID in `index.php`:

**Find this code (around line 314-323):**
```html
<!-- Google Analytics (GA4) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX', {
        'anonymize_ip': true,
        'cookie_flags': 'SameSite=None;Secure'
    });
</script>
```

**Replace both instances of `G-XXXXXXXXXX` with your actual Measurement ID**, for example:
```javascript
<script async src="https://www.googletagmanager.com/gtag/js?id=G-ABC123XYZ7"></script>
<script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-ABC123XYZ7', {
        'anonymize_ip': true,
        'cookie_flags': 'SameSite=None;Secure'
    });
</script>
```

### Step 7: Deploy and Verify

1. Deploy the updated code to your website
2. Visit your website
3. Go back to Google Analytics
4. Navigate to "Reports" → "Realtime"
5. You should see yourself as an active user

## Optional: Enhanced Tracking

You can add custom events for better insights. Add this after the GA4 initialization:

```javascript
// Track button clicks
document.querySelectorAll('.cta-button').forEach(button => {
    button.addEventListener('click', function() {
        gtag('event', 'cta_click', {
            'button_text': this.textContent,
            'button_location': 'hero'
        });
    });
});

// Track contact form submissions
document.querySelector('#contactForm').addEventListener('submit', function() {
    gtag('event', 'form_submit', {
        'form_name': 'contact'
    });
});

// Track portfolio project views
document.querySelectorAll('.project-link').forEach(link => {
    link.addEventListener('click', function() {
        gtag('event', 'project_view', {
            'project_name': this.closest('.project-card').querySelector('h4').textContent
        });
    });
});
```

## Privacy Considerations

The current implementation includes:
- ✅ IP anonymization (`anonymize_ip: true`)
- ✅ Secure cookies (`cookie_flags: 'SameSite=None;Secure'`)
- ✅ GDPR-friendly configuration

Consider adding a cookie consent banner if targeting EU users.

## Useful Reports in GA4

Once data starts flowing, check these reports:

1. **Realtime**: See current visitors
2. **Acquisition Overview**: Where visitors come from (Google, social media, direct, etc.)
3. **Pages and Screens**: Most visited pages
4. **Events**: Track specific user actions
5. **Demographics**: Age, gender, interests (if enabled)
6. **Tech Details**: Browser, OS, device type

## Troubleshooting

### Not Seeing Data?

1. Verify the Measurement ID is correct
2. Check browser console for errors
3. Ensure ad blockers are disabled (for testing)
4. Wait 24-48 hours for initial data processing
5. Use "Realtime" report for immediate verification

### Verification Tools

- [Google Tag Assistant](https://tagassistant.google.com/)
- Browser DevTools → Network tab → Filter for "google-analytics" or "gtag"
- GA4 DebugView (enable in GA4 settings)

## SEO Benefits

Google Analytics helps with SEO by:
- Identifying high-traffic pages
- Understanding user behavior and bounce rates
- Tracking conversion goals
- Discovering search queries (when linked with Google Search Console)
- Identifying technical issues affecting user experience

## Next Steps

1. ✅ Install tracking code (completed)
2. ⚠️ Replace placeholder ID with actual Measurement ID
3. Deploy to production
4. Verify tracking is working
5. Link Google Search Console for SEO data
6. Set up conversion goals
7. Create custom reports for your needs

## Support

- [GA4 Documentation](https://support.google.com/analytics/answer/10089681)
- [GA4 Setup Assistant](https://support.google.com/analytics/answer/9304153)
- [GA4 Best Practices](https://support.google.com/analytics/topic/9303319)
