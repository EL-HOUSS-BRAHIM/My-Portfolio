# SPF Record Configuration Guide

## What is an SPF Record?

An SPF (Sender Policy Framework) record is a DNS TXT record that specifies which mail servers are authorized to send email on behalf of your domain. This helps prevent email spoofing and improves email deliverability.

## Why You Need It

Without an SPF record:
- Spammers can easily spoof emails from your domain
- Your legitimate emails may be marked as spam
- Email security and deliverability issues may occur

## Recommended SPF Record

For the domain `brahim-elhouss.me`, add the following TXT record to your DNS:

```
v=spf1 mx a include:_spf.google.com include:amazonses.com ~all
```

### What This Record Means:

- `v=spf1` - Identifies this as an SPF record (version 1)
- `mx` - Authorizes the domain's MX (mail exchange) servers
- `a` - Authorizes the domain's A record (website IP)
- `include:_spf.google.com` - Authorizes Google's mail servers (if using Gmail/Google Workspace)
- `include:amazonses.com` - Authorizes Amazon SES servers (as used by this portfolio)
- `~all` - Soft fail for all other servers (recommended for testing)

### Adjustment for Production:

Once you've verified email is working correctly, you can make it stricter:

```
v=spf1 mx a include:_spf.google.com include:amazonses.com -all
```

The `-all` means "hard fail" for unauthorized servers, which is more secure.

## How to Add the SPF Record

### For Most DNS Providers:

1. Log in to your DNS provider (e.g., Cloudflare, GoDaddy, Namecheap, etc.)
2. Navigate to DNS management for `brahim-elhouss.me`
3. Add a new TXT record:
   - **Name/Host**: `@` or leave blank (represents the root domain)
   - **Type**: `TXT`
   - **Value**: `v=spf1 mx a include:_spf.google.com include:amazonses.com ~all`
   - **TTL**: `3600` (1 hour) or `Auto`

4. Save the record
5. Wait for DNS propagation (usually 5-60 minutes)

### For Cloudflare:

1. Log in to Cloudflare dashboard
2. Select your domain `brahim-elhouss.me`
3. Go to DNS → Records
4. Click "Add record"
5. Configure:
   - Type: `TXT`
   - Name: `@`
   - Content: `v=spf1 mx a include:_spf.google.com include:amazonses.com ~all`
   - TTL: `Auto`
   - Proxy status: DNS only
6. Click "Save"

## Verification

After adding the SPF record, verify it using:

### Command Line:
```bash
dig TXT brahim-elhouss.me +short
```

or

```bash
nslookup -type=TXT brahim-elhouss.me
```

### Online Tools:
- [MXToolbox SPF Check](https://mxtoolbox.com/spf.aspx)
- [dmarcian SPF Surveyor](https://dmarcian.com/spf-survey/)
- [Kitterman SPF Validator](https://www.kitterman.com/spf/validate.html)

## Additional Email Security (Recommended)

Consider also adding:

### DKIM Record
Contact your email provider (Amazon SES) for DKIM record values to add.

### DMARC Record
Add a DMARC policy to specify what to do with emails that fail SPF/DKIM:

```
_dmarc.brahim-elhouss.me TXT "v=DMARC1; p=quarantine; rua=mailto:brahim.crafts.tech@gmail.com"
```

## Current Status

⚠️ **Action Required**: The SPF record must be added through your DNS provider's control panel. This cannot be configured in the application code.

## References

- [SPF Record Syntax](https://www.rfc-editor.org/rfc/rfc7208.html)
- [Amazon SES SPF Setup](https://docs.aws.amazon.com/ses/latest/dg/send-email-authentication-spf.html)
- [Google Workspace SPF Setup](https://support.google.com/a/answer/33786)
