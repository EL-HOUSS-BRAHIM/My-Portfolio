# GitHub Secrets Setup for Deployment

## SSH Connection Fixed! ✅

The SSH connection issue has been resolved. The problem was:
- **Home directory ownership**: `/home/deploy-portfolio` was owned by `www-data` instead of `deploy-portfolio`
- **SSH was rejecting the connection** due to "bad ownership or modes"

### What Was Fixed:
1. Generated a new deployment SSH key pair (`~/.ssh/portfolio-deploy`)
2. Added the public key to the server's `authorized_keys`
3. **Fixed ownership** of `/home/deploy-portfolio` to `deploy-portfolio:deploy-portfolio`
4. Set correct permissions (755 for home dir, 700 for .ssh, 600 for authorized_keys)

---

## Required GitHub Secrets

You need to add the following secrets to your GitHub repository:

### Go to: `https://github.com/EL-HOUSS-BRAHIM/My-Portfolio/settings/secrets/actions`

### Add these secrets:

#### 1. `DEPLOY_KEY` (Private Key)
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACAijg4UDgjZBMmvRiX8thvqTjCGGePpH+7oLAEyZ0xtZwAAAJhoi5/6aIuf
+gAAAAtzc2gtZWQyNTUxOQAAACAijg4UDgjZBMmvRiX8thvqTjCGGePpH+7oLAEyZ0xtZw
AAAEBPDL5xRVopfX7hHMY9c3ZSTlHBVdSKohX+Cs1dtrQViyKODhQOCNkEya9GJfy2G+pO
MIYZ4+kf7ugsATJnTG1nAAAAFWdpdGh1Yi1hY3Rpb25zLWRlcGxveQ==
-----END OPENSSH PRIVATE KEY-----
```

#### 2. `DEPLOY_HOST`
```
35.181.208.71
```

#### 3. `DEPLOY_USER`
```
deploy-portfolio
```

#### 4. `DEPLOY_PORT`
```
22
```

---

## How to Add Secrets:

### Option 1: Using GitHub Web Interface
1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with the exact name and value above

### Option 2: Using GitHub CLI (gh)
```bash
# Make sure you're in the repository directory
cd /home/bross/Desktop/My-Portfolio

# Add DEPLOY_KEY
gh secret set DEPLOY_KEY < ~/.ssh/portfolio-deploy

# Add DEPLOY_HOST
echo "35.181.208.71" | gh secret set DEPLOY_HOST

# Add DEPLOY_USER
echo "deploy-portfolio" | gh secret set DEPLOY_USER

# Add DEPLOY_PORT
echo "22" | gh secret set DEPLOY_PORT
```

---

## Verify the Setup

After adding the secrets, you can test the deployment:

### Option 1: Push to trigger automatic deployment
```bash
git add .
git commit -m "Test deployment with fixed SSH keys"
git push origin main
```

### Option 2: Manually trigger the workflow
1. Go to GitHub → **Actions** tab
2. Select **Portfolio CI/CD Pipeline**
3. Click **Run workflow** → **Run workflow**

---

## Testing Locally (Optional)

You can test the SSH connection locally:
```bash
# Test connection
ssh -i ~/.ssh/portfolio-deploy deploy-portfolio@35.181.208.71 "whoami"

# Should output: deploy-portfolio
```

---

## Staging Secrets (If Using Staging)

If you're also deploying to staging, add these secrets:
- `STAGING_KEY` - Same as DEPLOY_KEY or a separate key
- `STAGING_HOST` - Your staging server IP
- `STAGING_USER` - Staging server username
- `STAGING_PORT` - SSH port (usually 22)

---

## Security Notes

✅ **What's Secure:**
- Private key is stored in GitHub Secrets (encrypted)
- Key is only used during deployment in GitHub Actions
- Local key file has proper permissions (600)

⚠️ **Important:**
- Never commit the private key to the repository
- Keep `~/.ssh/portfolio-deploy` secure on your local machine
- The private key is already in `.gitignore` patterns

---

## Troubleshooting

If deployment still fails:

1. **Check GitHub Secrets are set correctly**
   - Go to Settings → Secrets and variables → Actions
   - Verify all 4 secrets exist

2. **Verify SSH connection from GitHub Actions**
   - Look at the workflow logs in the Actions tab
   - Check the "Deploy to server via SCP and SSH" step

3. **Check server logs**
   ```bash
   ssh ubuntu@35.181.208.71 "sudo tail -50 /var/log/auth.log | grep deploy-portfolio"
   ```

4. **Verify server permissions**
   ```bash
   ssh ubuntu@35.181.208.71 "sudo ls -ld /home/deploy-portfolio /home/deploy-portfolio/.ssh /home/deploy-portfolio/.ssh/authorized_keys"
   ```
   Should show:
   - `/home/deploy-portfolio` → 755, owned by deploy-portfolio
   - `/.ssh` → 700, owned by deploy-portfolio
   - `/authorized_keys` → 600, owned by deploy-portfolio

---

## Next Steps

1. ✅ SSH connection is working
2. 🔄 Add the 4 GitHub Secrets
3. 🚀 Push to main branch or manually trigger deployment
4. 🎉 Watch your portfolio deploy successfully!

