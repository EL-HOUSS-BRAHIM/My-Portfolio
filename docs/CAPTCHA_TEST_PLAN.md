# reCAPTCHA Integration Test Plan

## Overview
This document outlines the testing procedures to verify that reCAPTCHA integration is working correctly on both the contact form and testimonial form.

## Pre-Test Setup

### 1. Verify Configuration
```bash
# Check that reCAPTCHA is enabled
grep "RECAPTCHA_ENABLED" .env

# Verify keys are set (should show actual keys, not placeholders)
grep "RECAPTCHA_SITE_KEY" .env
grep "RECAPTCHA_SECRET_KEY" .env
```

### 2. Enable Debug Mode (Temporary)
```bash
# Edit .env file
sed -i 's/APP_DEBUG=false/APP_DEBUG=true/' .env
```

## Test Scenarios

### A. Contact Form Tests

#### Test A1: Successful Submission with CAPTCHA
**Objective**: Verify contact form works with valid reCAPTCHA

**Steps**:
1. Navigate to portfolio website
2. Scroll to contact section
3. Fill out all required fields:
   - Name: "Test User"
   - Email: "test@example.com"
   - Message: "This is a test message"
4. Complete the reCAPTCHA challenge
5. Click "Send Message"

**Expected Result**: 
- Form submits successfully
- Success message displayed
- Form resets (including reCAPTCHA)
- Email received (if email is configured)

#### Test A2: Submission Without CAPTCHA
**Objective**: Verify form prevents submission without reCAPTCHA

**Steps**:
1. Fill out contact form completely
2. Do NOT complete reCAPTCHA
3. Click "Send Message"

**Expected Result**:
- Form submission blocked
- Error message: "Please complete the reCAPTCHA verification."
- Form data preserved

#### Test A3: Invalid CAPTCHA Handling
**Objective**: Test server-side CAPTCHA validation

**Steps**:
1. Fill out contact form
2. Complete reCAPTCHA
3. Submit form
4. In browser dev tools, modify the form to submit invalid CAPTCHA token

**Expected Result**:
- Server rejects submission
- Error message: "Please verify that you are not a robot."

### B. Testimonial Form Tests

#### Test B1: Successful Testimonial with CAPTCHA
**Objective**: Verify testimonial form works with valid reCAPTCHA

**Steps**:
1. Navigate to testimonials section
2. Click "Add Your Testimonial"
3. Fill out form:
   - Name: "Test Client"
   - Rating: 5
   - Testimonial: "Great work!"
   - Upload a test image
4. Complete reCAPTCHA
5. Click "Submit Testimonial"

**Expected Result**:
- Form submits successfully
- Success message displayed
- Form resets (including reCAPTCHA)
- Form hides after submission

#### Test B2: Testimonial Without CAPTCHA
**Objective**: Verify testimonial form requires reCAPTCHA

**Steps**:
1. Fill out testimonial form completely
2. Do NOT complete reCAPTCHA
3. Submit form

**Expected Result**:
- Form submission blocked
- Error alert: "Please complete the reCAPTCHA verification."

### C. Configuration Tests

#### Test C1: CAPTCHA Disabled
**Objective**: Verify forms work when reCAPTCHA is disabled

**Steps**:
1. Edit .env: `RECAPTCHA_ENABLED=false`
2. Reload website
3. Check both forms

**Expected Result**:
- reCAPTCHA widgets not displayed
- Forms submit without CAPTCHA requirement
- No JavaScript errors

#### Test C2: Missing Configuration
**Objective**: Test graceful handling of missing keys

**Steps**:
1. Temporarily remove reCAPTCHA keys from .env
2. Reload website
3. Check browser console and server logs

**Expected Result**:
- Error logged about missing configuration
- Forms still function (fallback behavior)

## Verification Steps

### 1. Check Server Logs
```bash
# Monitor logs during testing
tail -f /var/log/apache2/error.log

# Or check application logs
tail -f storage/logs/app.log
```

### 2. Verify Email Delivery (Contact Form)
- Check configured email address for test messages
- Verify sender information is correct
- Confirm message content includes all form fields

### 3. Verify Database Storage (Testimonials)
```sql
-- Check testimonials table for test submissions
SELECT * FROM testimonials ORDER BY created_at DESC LIMIT 5;
```

### 4. Network Request Analysis
- Use browser dev tools Network tab
- Verify reCAPTCHA API calls to Google
- Check form submission POST requests
- Confirm server responses

## Performance Tests

### 1. Load Time Impact
- Measure page load time with/without reCAPTCHA
- Check for any blocking JavaScript issues

### 2. Mobile Responsiveness
- Test reCAPTCHA on mobile devices
- Verify touch interactions work correctly
- Check responsive design of CAPTCHA widget

## Security Tests

### 1. Rate Limiting
- Submit multiple forms rapidly
- Verify rate limiting still works with reCAPTCHA

### 2. Cross-Site Testing
- Test from different domains (should fail)
- Verify domain restrictions work

## Post-Test Cleanup

### 1. Disable Debug Mode
```bash
sed -i 's/APP_DEBUG=true/APP_DEBUG=false/' .env
```

### 2. Remove Test Data
```sql
-- Remove test testimonials
DELETE FROM testimonials WHERE name LIKE 'Test%';
```

### 3. Check Configuration
```bash
# Verify production settings
grep "APP_DEBUG\|RECAPTCHA_ENABLED" .env
```

## Test Results Template

### Contact Form Results
- [ ] A1: Successful submission with CAPTCHA
- [ ] A2: Submission blocked without CAPTCHA
- [ ] A3: Invalid CAPTCHA handled correctly

### Testimonial Form Results
- [ ] B1: Successful submission with CAPTCHA
- [ ] B2: Submission blocked without CAPTCHA

### Configuration Results
- [ ] C1: Works correctly when disabled
- [ ] C2: Handles missing configuration gracefully

### Performance Results
- [ ] Page load time acceptable
- [ ] Mobile responsiveness maintained
- [ ] No blocking JavaScript issues

### Security Results
- [ ] Rate limiting functional
- [ ] Domain restrictions enforced
- [ ] Server-side validation working

## Issues Found
_(Document any issues discovered during testing)_

## Sign-off
- [ ] All tests passed
- [ ] No critical issues found
- [ ] Ready for production deployment

**Tested by**: ________________  
**Date**: ________________  
**Environment**: ________________