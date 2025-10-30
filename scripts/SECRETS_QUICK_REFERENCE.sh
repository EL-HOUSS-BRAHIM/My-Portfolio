#!/bin/bash

# ================================================
# Quick GitHub Secrets Reference
# ================================================
# This is a quick reference for the secrets you need
# to add to GitHub after running bootstrap-server.sh

cat << 'EOF'

╔════════════════════════════════════════════════════════════╗
║          GitHub Repository Secrets Required               ║
╔════════════════════════════════════════════════════════════╝

After running bootstrap-server.sh, you'll find all values in:
    deployment-secrets/github_secrets.txt

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 HOW TO ADD SECRETS TO GITHUB:

1. Go to: https://github.com/YOUR-USERNAME/My-Portfolio
2. Click: Settings → Secrets and variables → Actions
3. Click: "New repository secret"
4. Add each secret below

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔐 REQUIRED PRODUCTION SECRETS (6 total):

┌──────────────────────────────────────────────────────────┐
│ Secret Name:  DEPLOY_HOST                                │
│ Description:  Your server's public IP address            │
│ Example:      203.0.113.45                               │
│ Get From:     deployment-secrets/server_info.txt         │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ Secret Name:  DEPLOY_USER                                │
│ Description:  Deployment username                        │
│ Default:      deploy                                     │
│ Get From:     deployment-secrets/server_info.txt         │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ Secret Name:  DEPLOY_KEY                                 │
│ Description:  Private SSH key for deployment             │
│ Note:         Copy ENTIRE contents including headers     │
│ Get From:     deployment-secrets/deploy_key              │
│                                                          │
│ Should look like:                                        │
│ -----BEGIN OPENSSH PRIVATE KEY-----                     │
│ b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAE...                 │
│ -----END OPENSSH PRIVATE KEY-----                       │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ Secret Name:  DEPLOY_PORT                                │
│ Description:  SSH port (usually 22)                      │
│ Default:      22                                         │
│ Get From:     deployment-secrets/server_info.txt         │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ Secret Name:  DEPLOY_URL                                 │
│ Description:  Your production website URL                │
│ Example:      https://brahim-elhouss.me                  │
│ Get From:     deployment-secrets/server_info.txt         │
└──────────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🧪 REQUIRED STAGING SECRETS (4 total):

┌──────────────────────────────────────────────────────────┐
│ Secret Name:  STAGING_HOST                               │
│ Description:  Your server's public IP (same as prod)     │
│ Example:      203.0.113.45                               │
│ Get From:     deployment-secrets/server_info.txt         │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ Secret Name:  STAGING_USER                               │
│ Description:  Deployment username (same as prod)         │
│ Default:      deploy                                     │
│ Get From:     deployment-secrets/server_info.txt         │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ Secret Name:  STAGING_KEY                                │
│ Description:  Private SSH key (same as prod)             │
│ Get From:     deployment-secrets/deploy_key              │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ Secret Name:  STAGING_PORT                               │
│ Description:  SSH port (usually 22, same as prod)        │
│ Default:      22                                         │
│ Get From:     deployment-secrets/server_info.txt         │
└──────────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📢 OPTIONAL SECRETS:

┌──────────────────────────────────────────────────────────┐
│ Secret Name:  SLACK_WEBHOOK_URL                          │
│ Description:  Slack webhook for deployment notifications │
│ Optional:     Only needed if you use Slack               │
│ Example:      https://hooks.slack.com/services/...       │
└──────────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚡ QUICK COPY-PASTE METHOD:

Run this command to display all secrets formatted for copying:

    cd deployment-secrets
    ./secrets_formatted.sh

Then just copy each value and paste into GitHub Secrets UI!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ VERIFICATION CHECKLIST:

After adding all secrets to GitHub:

□ All 6 production secrets added
□ All 4 staging secrets added  
□ DNS records configured (A records for domain)
□ Waited for DNS propagation (check with: nslookup yourdomain.com)
□ SSL certificates installed (run: sudo certbot --nginx -d yourdomain.com)
□ Test deployment connection (run: ./test_deployment.sh)
□ Deleted deployment-secrets/ folder for security

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 READY TO DEPLOY:

Once all secrets are added, simply push to main branch:

    git add .
    git commit -m "Your changes"
    git push origin main

GitHub Actions will automatically:
    ✓ Run tests
    ✓ Deploy to staging
    ✓ Deploy to production

Monitor deployment at:
    https://github.com/YOUR-USERNAME/My-Portfolio/actions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  SECURITY REMINDERS:

1. DELETE deployment-secrets/ folder after adding to GitHub
2. NEVER commit private keys to your repository
3. Keep deploy_key file secure (it's like a password)
4. Change staging password regularly
5. Keep server updated: sudo apt update && sudo apt upgrade

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 Need Help?

Read the full guide: scripts/SERVER_SETUP.md

EOF
