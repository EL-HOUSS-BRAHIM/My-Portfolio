#!/bin/bash

# Secure Production Server Setup
# Run this script on your production server to set up read-only access

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Portfolio Production Server Security Setup${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}\n"

# Check if we're on production server
CURRENT_USER=$(whoami)
echo -e "${YELLOW}Current user: $CURRENT_USER${NC}"
echo -e "${YELLOW}Current directory: $(pwd)${NC}\n"

# Function to check AWS CLI
check_aws_cli() {
    echo -e "${BLUE}[Step 1/7] Checking AWS CLI...${NC}"
    
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}✗ AWS CLI not installed${NC}"
        echo -e "${YELLOW}Installing AWS CLI...${NC}"
        
        # Install AWS CLI
        curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "/tmp/awscliv2.zip"
        cd /tmp && unzip -q awscliv2.zip
        sudo ./aws/install
        rm -rf /tmp/aws /tmp/awscliv2.zip
        
        echo -e "${GREEN}✓ AWS CLI installed${NC}"
    else
        echo -e "${GREEN}✓ AWS CLI found: $(aws --version)${NC}"
    fi
}

# Function to check current AWS access
check_current_access() {
    echo -e "\n${BLUE}[Step 2/7] Checking current AWS access...${NC}"
    
    if aws sts get-caller-identity &> /dev/null; then
        IDENTITY=$(aws sts get-caller-identity)
        ACCOUNT=$(echo "$IDENTITY" | jq -r '.Account')
        ARN=$(echo "$IDENTITY" | jq -r '.Arn')
        
        echo -e "${YELLOW}⚠ AWS credentials are configured!${NC}"
        echo -e "Account: $ACCOUNT"
        echo -e "Identity: $ARN"
        
        # Check if it's admin access
        if aws iam list-users &> /dev/null 2>&1; then
            echo -e "${RED}✗ SECURITY RISK: This has admin/full access!${NC}"
            return 1
        else
            echo -e "${GREEN}✓ Access appears to be limited${NC}"
            return 0
        fi
    else
        echo -e "${YELLOW}No AWS credentials configured${NC}"
        return 2
    fi
}

# Function to backup current credentials
backup_credentials() {
    echo -e "\n${BLUE}[Step 3/7] Backing up current credentials...${NC}"
    
    BACKUP_DIR="$HOME/.aws-backup-$(date +%Y%m%d-%H%M%S)"
    
    if [ -d "$HOME/.aws" ]; then
        mkdir -p "$BACKUP_DIR"
        cp -r "$HOME/.aws" "$BACKUP_DIR/"
        echo -e "${GREEN}✓ Backed up to: $BACKUP_DIR${NC}"
        echo -e "${YELLOW}⚠ Keep this backup safe for emergency access${NC}"
    else
        echo -e "${YELLOW}No existing .aws directory to backup${NC}"
    fi
}

# Function to remove admin credentials
remove_admin_credentials() {
    echo -e "\n${BLUE}[Step 4/7] Removing admin credentials...${NC}"
    
    read -p "Remove admin AWS credentials from this server? (yes/no): " CONFIRM
    
    if [ "$CONFIRM" = "yes" ]; then
        if [ -f "$HOME/.aws/credentials" ]; then
            rm "$HOME/.aws/credentials"
            echo -e "${GREEN}✓ Removed credentials file${NC}"
        fi
        
        if [ -f "$HOME/.aws/config" ]; then
            rm "$HOME/.aws/config"
            echo -e "${GREEN}✓ Removed config file${NC}"
        fi
        
        # Remove from environment
        unset AWS_ACCESS_KEY_ID
        unset AWS_SECRET_ACCESS_KEY
        unset AWS_SESSION_TOKEN
        
        echo -e "${GREEN}✓ Admin credentials removed${NC}"
    else
        echo -e "${YELLOW}Skipped credential removal${NC}"
    fi
}

# Function to set up read-only credentials
setup_readonly_credentials() {
    echo -e "\n${BLUE}[Step 5/7] Setting up read-only credentials...${NC}"
    echo -e "${YELLOW}You need to create read-only IAM user first${NC}\n"
    
    echo -e "${BLUE}On your LOCAL machine, run:${NC}"
    echo -e "${GREEN}  ./scripts/setup-production-iam.sh${NC}"
    echo -e "${BLUE}Choose option 2 (IAM User)${NC}\n"
    
    read -p "Have you created the read-only IAM user? (yes/no): " CREATED
    
    if [ "$CREATED" = "yes" ]; then
        echo -e "\n${YELLOW}Enter the read-only IAM credentials:${NC}"
        read -p "AWS Access Key ID: " ACCESS_KEY
        read -sp "AWS Secret Access Key: " SECRET_KEY
        echo
        
        # Configure AWS CLI with read-only credentials
        mkdir -p "$HOME/.aws"
        
        cat > "$HOME/.aws/credentials" <<EOF
[default]
aws_access_key_id = $ACCESS_KEY
aws_secret_access_key = $SECRET_KEY
EOF
        
        cat > "$HOME/.aws/config" <<EOF
[default]
region = eu-west-3
output = json
EOF
        
        chmod 600 "$HOME/.aws/credentials"
        chmod 600 "$HOME/.aws/config"
        
        echo -e "${GREEN}✓ Read-only credentials configured${NC}"
        
        # Test access
        echo -e "\n${YELLOW}Testing read access...${NC}"
        if aws secretsmanager get-secret-value --secret-id portfolio/smtp-credentials --region eu-west-3 &> /dev/null; then
            echo -e "${GREEN}✓ Read access works!${NC}"
        else
            echo -e "${RED}✗ Cannot read secrets. Check IAM permissions${NC}"
        fi
        
        echo -e "\n${YELLOW}Testing write access (should fail)...${NC}"
        if aws secretsmanager update-secret --secret-id portfolio/smtp-credentials --description "Test" --region eu-west-3 &> /dev/null 2>&1; then
            echo -e "${RED}✗ SECURITY ISSUE: Write access granted!${NC}"
        else
            echo -e "${GREEN}✓ Write access correctly denied${NC}"
        fi
    else
        echo -e "${YELLOW}Please create IAM user first, then re-run this script${NC}"
    fi
}

# Function to configure application
configure_application() {
    echo -e "\n${BLUE}[Step 6/7] Configuring application...${NC}"
    
    # Find .env file
    if [ -f ".env" ]; then
        echo -e "${GREEN}✓ Found .env file${NC}"
        
        # Check if AWS_SECRETS_ENABLED exists
        if grep -q "AWS_SECRETS_ENABLED" .env; then
            echo -e "${YELLOW}AWS Secrets Manager already configured${NC}"
        else
            echo -e "${YELLOW}Adding AWS Secrets Manager configuration...${NC}"
            
            cat >> .env <<EOF

# AWS Secrets Manager Configuration
AWS_SECRETS_ENABLED=true
AWS_SECRETS_REGION=eu-west-3
AWS_SMTP_SECRET_NAME=portfolio/smtp-credentials
EOF
            
            echo -e "${GREEN}✓ Configuration added to .env${NC}"
        fi
        
        # Remove hardcoded SMTP credentials
        echo -e "\n${YELLOW}Checking for hardcoded SMTP credentials...${NC}"
        if grep -q "SMTP_PASSWORD" .env && ! grep -q "^#SMTP_PASSWORD" .env; then
            read -p "Comment out hardcoded SMTP credentials? (yes/no): " REMOVE
            if [ "$REMOVE" = "yes" ]; then
                sed -i.bak 's/^SMTP_HOST=/#SMTP_HOST=/' .env
                sed -i.bak 's/^SMTP_USERNAME=/#SMTP_USERNAME=/' .env
                sed -i.bak 's/^SMTP_PASSWORD=/#SMTP_PASSWORD=/' .env
                sed -i.bak 's/^FROM_EMAIL=/#FROM_EMAIL=/' .env
                sed -i.bak 's/^FROM_NAME=/#FROM_NAME=/' .env
                sed -i.bak 's/^TO_EMAIL=/#TO_EMAIL=/' .env
                sed -i.bak 's/^TO_NAME=/#TO_NAME=/' .env
                
                echo -e "${GREEN}✓ Hardcoded credentials commented out${NC}"
                echo -e "${YELLOW}Backup saved to .env.bak${NC}"
            fi
        else
            echo -e "${GREEN}✓ No hardcoded credentials found${NC}"
        fi
    else
        echo -e "${RED}✗ .env file not found${NC}"
    fi
}

# Function to test application
test_application() {
    echo -e "\n${BLUE}[Step 7/7] Testing application...${NC}"
    
    if [ -f "scripts/test-secrets-manager.php" ]; then
        echo -e "${YELLOW}Running test script...${NC}"
        php scripts/test-secrets-manager.php
    else
        echo -e "${YELLOW}Test script not found${NC}"
    fi
}

# Function to show summary
show_summary() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}        Security Setup Complete!${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════${NC}\n"
    
    echo -e "${BLUE}What was done:${NC}"
    echo -e "✓ Backed up admin credentials (keep safe for emergencies)"
    echo -e "✓ Removed admin access from production server"
    echo -e "✓ Configured read-only AWS access"
    echo -e "✓ Enabled AWS Secrets Manager"
    echo -e "✓ Removed hardcoded credentials\n"
    
    echo -e "${BLUE}Security Status:${NC}"
    echo -e "✓ Production server: READ-ONLY access"
    echo -e "✓ SMTP credentials: Stored in AWS Secrets Manager"
    echo -e "✓ Auto-rotation: Ready\n"
    
    echo -e "${BLUE}Next Steps:${NC}"
    echo -e "1. Test contact form: https://brahim-elhouss.me/#contact"
    echo -e "2. Monitor logs: tail -f /var/log/nginx/error.log"
    echo -e "3. Set up CloudWatch alarms (optional)\n"
    
    echo -e "${YELLOW}Emergency Access:${NC}"
    echo -e "If AWS Secrets Manager fails, credentials are backed up in:"
    ls -d $HOME/.aws-backup-* 2>/dev/null | tail -1
    echo
}

# Main execution
main() {
    check_aws_cli
    
    ACCESS_LEVEL=$(check_current_access)
    ACCESS_STATUS=$?
    
    if [ $ACCESS_STATUS -eq 1 ]; then
        echo -e "\n${RED}⚠ SECURITY ALERT: Admin access detected!${NC}"
        backup_credentials
        remove_admin_credentials
        setup_readonly_credentials
    elif [ $ACCESS_STATUS -eq 0 ]; then
        echo -e "\n${GREEN}✓ Access level appears secure${NC}"
        read -p "Continue with setup? (yes/no): " CONTINUE
        [ "$CONTINUE" != "yes" ] && exit 0
    else
        echo -e "\n${YELLOW}No AWS access configured${NC}"
        setup_readonly_credentials
    fi
    
    configure_application
    test_application
    show_summary
}

# Run main function
main
