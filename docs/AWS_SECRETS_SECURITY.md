# Security Best Practices for AWS Secrets Manager

## ⚠️ IMPORTANT: Principle of Least Privilege

### DO NOT give your web server admin/full access to AWS!

## Production Setup

### Web Server Permissions (Read-Only)

Your production web server should **ONLY** have read access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:eu-west-3:*:secret:portfolio/smtp-credentials-*"
    }
  ]
}
```

**Why?** If your server is compromised, attackers can only READ secrets, not delete/modify them.

### Setup for Production

#### Option 1: EC2 Instance Role (Recommended)

1. Create IAM role with policy from `docs/iam-policies/web-server-policy.json`
2. Attach to EC2 instance
3. No credentials on server needed!

```bash
aws iam create-role --role-name PortfolioWebServerRole \
  --assume-role-policy-document file://ec2-trust-policy.json

aws iam put-role-policy --role-name PortfolioWebServerRole \
  --policy-name SecretsReadOnly \
  --policy-document file://docs/iam-policies/web-server-policy.json

aws ec2 associate-iam-instance-profile \
  --instance-id i-1234567890abcdef0 \
  --iam-instance-profile Name=PortfolioWebServerRole
```

#### Option 2: IAM User (Less Secure)

1. Create IAM user with read-only policy
2. Generate access keys
3. Store in `.env` or use AWS CLI config

```bash
aws iam create-user --user-name portfolio-web-server

aws iam put-user-policy --user-name portfolio-web-server \
  --policy-name SecretsReadOnly \
  --policy-document file://docs/iam-policies/web-server-policy.json

aws iam create-access-key --user-name portfolio-web-server
```

## Secret Management (Admin Only)

### Where to Manage Secrets

**✅ DO:**
- Use AWS Console (logged in as admin)
- Use AWS CLI from your local machine
- Use `aws-secrets-setup.sh` from your development machine
- Use CI/CD pipeline with dedicated credentials

**❌ DON'T:**
- Give production server write access
- Store admin credentials on web server
- Allow web application to modify secrets

### Creating/Updating Secrets

From your **local machine** (with admin access):

```bash
# Using the setup script
./scripts/aws-secrets-setup.sh create
./scripts/aws-secrets-setup.sh update

# Or directly via AWS CLI
aws secretsmanager create-secret \
  --name portfolio/smtp-credentials \
  --secret-string file://secret.json \
  --region eu-west-3
```

## Security Layers

### 1. Network Security
```
✓ Use VPC with private subnets
✓ Security groups restrict access
✓ Only HTTPS traffic allowed
✓ Use AWS PrivateLink for Secrets Manager (no internet)
```

### 2. IAM Security
```
✓ Web server: Read-only access
✓ Admin user: Full access (MFA required)
✓ Separate IAM users for dev/staging/prod
✓ Regular credential rotation
```

### 3. Application Security
```
✓ Secrets cached for max 5 minutes
✓ Cache files have 0600 permissions
✓ No secrets in logs
✓ SecretsManager.php is read-only by design
```

### 4. Monitoring
```
✓ CloudTrail logs all API calls
✓ CloudWatch alarms on unusual access
✓ Regular security audits
```

## What If Server Is Compromised?

### With Read-Only Access (Secure ✅)
- Attacker can read current SMTP credentials
- You rotate credentials via AWS Console
- Attacker's cached copy expires in 5 minutes
- New credentials are safe

### With Full Access (Insecure ❌)
- Attacker can delete all secrets
- Attacker can modify secrets to redirect emails
- Attacker can create backdoor secrets
- Much harder to recover

## Recommended Architecture

```
┌─────────────────────────────────────────────────┐
│ Your Local Machine (Admin Access)              │
│ • Create/Update/Delete secrets                 │
│ • aws-secrets-setup.sh                         │
│ • Full AWS CLI access                          │
└─────────────────────────────────────────────────┘
                      │
                      ▼
         ┌─────────────────────────┐
         │  AWS Secrets Manager    │
         │  • Encrypted at rest    │
         │  • Audit logs           │
         └─────────────────────────┘
                      │
                      ▼ (READ ONLY)
┌─────────────────────────────────────────────────┐
│ Production Web Server (Limited Access)         │
│ • EC2 Instance Role OR IAM User                │
│ • GetSecretValue only                          │
│ • DescribeSecret only                          │
│ • SecretsManager.php caches for 5 min         │
└─────────────────────────────────────────────────┘
```

## Setup Checklist

- [ ] Create read-only IAM policy
- [ ] Create EC2 instance role OR IAM user
- [ ] Attach policy to role/user
- [ ] Configure production server with credentials
- [ ] Test: server can READ secrets
- [ ] Test: server CANNOT create/update/delete secrets
- [ ] Enable CloudTrail logging
- [ ] Set up CloudWatch alarms
- [ ] Document rotation procedure
- [ ] Schedule quarterly security audit

## Testing Permissions

### Test Read Access (Should Work)
```bash
aws secretsmanager get-secret-value \
  --secret-id portfolio/smtp-credentials \
  --region eu-west-3
```

### Test Write Access (Should Fail)
```bash
# This should return "Access Denied"
aws secretsmanager update-secret \
  --secret-id portfolio/smtp-credentials \
  --secret-string '{"test": "value"}' \
  --region eu-west-3
```

If the update works, your permissions are too permissive!

## Credential Rotation

### Manual Rotation (Recommended for SMTP)

1. **From local machine** (admin access):
   ```bash
   ./scripts/aws-secrets-setup.sh update
   ```

2. **Generate new SES SMTP credentials** in AWS Console

3. **Update secret** with new credentials

4. **Test** contact form

5. **Delete old credentials** from SES

### Automatic Rotation (Advanced)

Requires Lambda function - see AWS docs:
https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html

## Cost Optimization

```
Secret storage:  $0.40/month
API calls:       $0.05 per 10,000
With caching:    ~100 calls/month = $0.0005

Total: ~$0.40/month
```

## Emergency Response

### If Server Compromised

1. **Immediately rotate credentials:**
   ```bash
   ./scripts/aws-secrets-setup.sh update
   ```

2. **Check CloudTrail logs:**
   ```bash
   aws cloudtrail lookup-events \
     --lookup-attributes AttributeKey=ResourceName,AttributeValue=portfolio/smtp-credentials
   ```

3. **Revoke IAM credentials** if using IAM user

4. **Review all secrets** for unauthorized changes

### If Admin Credentials Compromised

1. **Disable compromised IAM user**
2. **Rotate ALL secrets**
3. **Review CloudTrail for unauthorized access**
4. **Enable MFA for all admin users**

## Additional Hardening

### VPC Endpoints (Recommended)
```bash
# Create VPC endpoint for Secrets Manager
aws ec2 create-vpc-endpoint \
  --vpc-id vpc-xxxxx \
  --service-name com.amazonaws.eu-west-3.secretsmanager \
  --route-table-ids rtb-xxxxx
```

Benefits:
- Traffic never leaves AWS network
- No internet gateway needed
- Better security and performance

### Resource Tags
```bash
aws secretsmanager tag-resource \
  --secret-id portfolio/smtp-credentials \
  --tags Key=Project,Value=Portfolio \
         Key=Environment,Value=Production \
         Key=CostCenter,Value=Website
```

### Backup Strategy
- Secrets Manager automatically backs up for 7-30 days after deletion
- Export secrets to S3 for disaster recovery (encrypted)
- Document recovery procedures

## Resources

- [AWS Secrets Manager Best Practices](https://docs.aws.amazon.com/secretsmanager/latest/userguide/best-practices.html)
- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [Least Privilege Principle](https://aws.amazon.com/blogs/security/techniques-for-writing-least-privilege-iam-policies/)
