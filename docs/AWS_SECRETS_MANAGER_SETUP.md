# AWS Secrets Manager Setup for Portfolio SMTP

This guide explains how to securely store and rotate SMTP credentials using AWS Secrets Manager.

## Prerequisites

- AWS CLI installed and configured with admin access
- AWS SES configured and verified email addresses
- Composer dependencies installed

## Setup Steps

### 1. Install AWS SDK

```bash
composer install
```

### 2. Create SMTP Credentials in AWS Secrets Manager

Run the setup script:

```bash
./scripts/aws-secrets-setup.sh create
```

The script will prompt you for:
- SMTP Host (default: email-smtp.eu-west-3.amazonaws.com)
- SMTP Username (IAM Access Key from SES)
- SMTP Password (SMTP password from SES)
- SMTP Port (default: 587)
- From Email
- From Name
- To Email
- To Name

### 3. Update Environment Variables

Add to your `.env` file:

```bash
# AWS Secrets Manager Configuration
AWS_SECRETS_ENABLED=true
AWS_SECRETS_REGION=eu-west-3
AWS_SMTP_SECRET_NAME=portfolio/smtp-credentials
```

### 4. Remove Hardcoded Credentials

After confirming Secrets Manager works, remove these from `.env`:

```bash
# Remove or comment out:
# SMTP_HOST=
# SMTP_USERNAME=
# SMTP_PASSWORD=
# FROM_EMAIL=
# FROM_NAME=
# TO_EMAIL=
# TO_NAME=
```

## Usage Commands

### View Current Secret

```bash
./scripts/aws-secrets-setup.sh view
```

### Update Secret (Credential Rotation)

```bash
./scripts/aws-secrets-setup.sh update
```

### Delete Secret

```bash
./scripts/aws-secrets-setup.sh delete
```

## How It Works

1. **Config.php** checks if `AWS_SECRETS_ENABLED=true`
2. If enabled, initializes **SecretsManager** client
3. Retrieves SMTP credentials from AWS Secrets Manager
4. Caches credentials locally for 5 minutes (reduces API calls)
5. Falls back to `.env` values if Secrets Manager fails

## Security Benefits

✅ **No credentials in source code**
✅ **Centralized secret management**
✅ **Easy credential rotation**
✅ **Audit trail via CloudTrail**
✅ **Encrypted at rest and in transit**
✅ **IAM-based access control**

## Production Deployment

⚠️ **IMPORTANT:** Your production server should have **READ-ONLY** access to secrets!

See `docs/AWS_SECRETS_SECURITY.md` for complete security guide.

### Option 1: EC2 with IAM Role (Recommended)

Use the automated setup script:

```bash
./scripts/setup-production-iam.sh
```

Or manually:

1. Create IAM role with read-only permissions (see `docs/iam-policies/web-server-policy.json`)
2. Attach role to EC2 instance
3. No credentials needed on server!

### Option 2: IAM User with Limited Permissions

1. Create IAM user with SecretsManager read-only access
2. Configure AWS CLI on server:

```bash
aws configure
```

3. Or set environment variables:

```bash
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
export AWS_DEFAULT_REGION=eu-west-3
```

## Credential Rotation

### Manual Rotation

1. Generate new SMTP credentials in AWS SES
2. Run: `./scripts/aws-secrets-setup.sh update`
3. Test contact form
4. Delete old credentials from SES

### Automatic Rotation (Future)

AWS Secrets Manager supports automatic rotation using Lambda functions. This will be implemented in a future update.

## Troubleshooting

### Secret not found

```bash
aws secretsmanager list-secrets --region eu-west-3
```

### Permission denied

Check IAM permissions:

```bash
aws sts get-caller-identity
aws iam get-user
```

### Cache issues

Clear cache:

```bash
rm -rf storage/cache/secrets/*.cache
```

### Test connection

```bash
php -r "require 'src/config/Config.php'; \$c = Portfolio\Config\Config::getInstance(); print_r(\$c->get('email'));"
```

## Cost

- **AWS Secrets Manager**: $0.40/month per secret
- **API calls**: $0.05 per 10,000 calls
- **With caching**: ~1-2 calls/day = < $0.01/month

Total: ~$0.41/month

## Files Created

- `src/utils/SecretsManager.php` - AWS integration
- `scripts/aws-secrets-setup.sh` - Setup script
- `storage/cache/secrets/` - Local cache directory

## Next Steps

1. Run `./scripts/aws-secrets-setup.sh create`
2. Test contact form
3. Remove credentials from `.env`
4. Configure IAM role for production
5. Set up CloudWatch alarms for monitoring

## Support

For issues or questions, check AWS Secrets Manager docs:
https://docs.aws.amazon.com/secretsmanager/
