#!/bin/bash

# Production Server Setup - Read-Only Access
# This script sets up IAM permissions for production web server

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Production Server IAM Setup (Read-Only) ===${NC}\n"

REGION="eu-west-3"
ROLE_NAME="PortfolioWebServerRole"
POLICY_NAME="SecretsReadOnly"
PROFILE_NAME="PortfolioWebServerProfile"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI not installed${NC}"
    exit 1
fi

# Verify admin credentials
echo -e "${YELLOW}Checking AWS credentials...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS credentials not configured${NC}"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✓ Authenticated (Account: $ACCOUNT_ID)${NC}\n"

# Function to create IAM role
create_role() {
    echo -e "${YELLOW}Creating IAM role: $ROLE_NAME${NC}"
    
    if aws iam get-role --role-name "$ROLE_NAME" &> /dev/null; then
        echo -e "${YELLOW}Role already exists${NC}"
    else
        aws iam create-role \
            --role-name "$ROLE_NAME" \
            --assume-role-policy-document file://docs/iam-policies/ec2-trust-policy.json \
            --description "Read-only access to Secrets Manager for Portfolio web server" \
            --tags Key=Project,Value=Portfolio Key=Environment,Value=Production
        
        echo -e "${GREEN}✓ Role created${NC}"
    fi
    
    # Attach policy
    echo -e "${YELLOW}Attaching read-only policy...${NC}"
    aws iam put-role-policy \
        --role-name "$ROLE_NAME" \
        --policy-name "$POLICY_NAME" \
        --policy-document file://docs/iam-policies/web-server-policy.json
    
    echo -e "${GREEN}✓ Policy attached${NC}"
}

# Function to create instance profile
create_instance_profile() {
    echo -e "${YELLOW}Creating instance profile...${NC}"
    
    if aws iam get-instance-profile --instance-profile-name "$PROFILE_NAME" &> /dev/null; then
        echo -e "${YELLOW}Instance profile already exists${NC}"
    else
        aws iam create-instance-profile \
            --instance-profile-name "$PROFILE_NAME"
        
        echo -e "${GREEN}✓ Instance profile created${NC}"
    fi
    
    # Add role to profile
    aws iam add-role-to-instance-profile \
        --instance-profile-name "$PROFILE_NAME" \
        --role-name "$ROLE_NAME" 2>/dev/null || true
    
    echo -e "${GREEN}✓ Role added to instance profile${NC}"
}

# Function to create IAM user (alternative to instance role)
create_iam_user() {
    USER_NAME="portfolio-web-server"
    
    echo -e "${YELLOW}Creating IAM user: $USER_NAME${NC}"
    
    if aws iam get-user --user-name "$USER_NAME" &> /dev/null; then
        echo -e "${YELLOW}User already exists${NC}"
    else
        aws iam create-user \
            --user-name "$USER_NAME" \
            --tags Key=Project,Value=Portfolio Key=Purpose,Value=WebServer
        
        echo -e "${GREEN}✓ User created${NC}"
    fi
    
    # Attach policy
    echo -e "${YELLOW}Attaching read-only policy...${NC}"
    aws iam put-user-policy \
        --user-name "$USER_NAME" \
        --policy-name "$POLICY_NAME" \
        --policy-document file://docs/iam-policies/web-server-policy.json
    
    echo -e "${GREEN}✓ Policy attached${NC}"
    
    # Generate access keys
    echo -e "${YELLOW}Generating access keys...${NC}"
    KEYS=$(aws iam create-access-key --user-name "$USER_NAME" --output json 2>/dev/null || echo "")
    
    if [ -n "$KEYS" ]; then
        ACCESS_KEY=$(echo "$KEYS" | jq -r '.AccessKey.AccessKeyId')
        SECRET_KEY=$(echo "$KEYS" | jq -r '.AccessKey.SecretAccessKey')
        
        echo -e "${GREEN}✓ Access keys generated${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${RED}⚠️  SAVE THESE CREDENTIALS - They won't be shown again!${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "AWS_ACCESS_KEY_ID=$ACCESS_KEY"
        echo -e "AWS_SECRET_ACCESS_KEY=$SECRET_KEY"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
    else
        echo -e "${YELLOW}User already has access keys${NC}"
    fi
}

# Test permissions
test_permissions() {
    echo -e "\n${YELLOW}Testing permissions...${NC}"
    
    # Test read access
    echo -e "Testing read access (should work)..."
    if aws secretsmanager get-secret-value \
        --secret-id portfolio/smtp-credentials \
        --region "$REGION" &> /dev/null; then
        echo -e "${GREEN}✓ Read access works${NC}"
    else
        echo -e "${YELLOW}⚠ Secret not found or no access${NC}"
    fi
    
    # Test write access (should fail)
    echo -e "Testing write access (should fail)..."
    if aws secretsmanager update-secret \
        --secret-id portfolio/smtp-credentials \
        --description "Test" \
        --region "$REGION" &> /dev/null; then
        echo -e "${RED}✗ SECURITY ISSUE: Write access granted!${NC}"
        echo -e "${RED}Please review IAM permissions${NC}"
    else
        echo -e "${GREEN}✓ Write access correctly denied${NC}"
    fi
}

# Main menu
echo -e "${BLUE}Choose setup method:${NC}"
echo "1. EC2 Instance Role (Recommended for EC2)"
echo "2. IAM User (For non-EC2 or VPS)"
echo "3. Both"
echo "4. Test existing permissions"
read -p "Enter choice (1-4): " CHOICE

case $CHOICE in
    1)
        create_role
        create_instance_profile
        echo -e "\n${GREEN}=== Setup Complete ===${NC}"
        echo -e "${BLUE}Next steps:${NC}"
        echo "1. Attach instance profile to EC2:"
        echo "   aws ec2 associate-iam-instance-profile \\"
        echo "     --instance-id i-xxxxx \\"
        echo "     --iam-instance-profile Name=$PROFILE_NAME"
        echo "2. Restart your application"
        ;;
    2)
        create_iam_user
        echo -e "\n${GREEN}=== Setup Complete ===${NC}"
        echo -e "${BLUE}Next steps:${NC}"
        echo "1. Add credentials to server .env or AWS CLI config"
        echo "2. Test: aws secretsmanager get-secret-value --secret-id portfolio/smtp-credentials"
        ;;
    3)
        create_role
        create_instance_profile
        create_iam_user
        ;;
    4)
        test_permissions
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo
