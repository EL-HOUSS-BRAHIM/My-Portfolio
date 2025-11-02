#!/bin/bash

# AWS Secrets Manager Setup Script for Portfolio SMTP
# This script helps you create and manage secrets in AWS Secrets Manager

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SECRET_NAME="portfolio/smtp-credentials"
REGION="eu-west-3"

echo -e "${BLUE}=== AWS Secrets Manager Setup for Portfolio SMTP ===${NC}\n"

# Check if AWS CLI is installed and configured
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    echo "Please install AWS CLI: https://aws.amazon.com/cli/"
    exit 1
fi

# Verify AWS credentials
echo -e "${YELLOW}Checking AWS credentials...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS credentials not configured properly${NC}"
    echo "Run: aws configure"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✓ AWS credentials valid (Account: $ACCOUNT_ID)${NC}\n"

# Function to create secret
create_secret() {
    echo -e "${YELLOW}Creating new secret: $SECRET_NAME${NC}"
    
    # Prompt for SMTP credentials
    echo -e "\n${BLUE}Enter your AWS SES SMTP credentials:${NC}"
    read -p "SMTP Host (default: email-smtp.$REGION.amazonaws.com): " SMTP_HOST
    SMTP_HOST=${SMTP_HOST:-"email-smtp.$REGION.amazonaws.com"}
    
    read -p "SMTP Username (IAM Access Key): " SMTP_USERNAME
    read -sp "SMTP Password (IAM Secret converted to SMTP): " SMTP_PASSWORD
    echo
    read -p "SMTP Port (default: 587): " SMTP_PORT
    SMTP_PORT=${SMTP_PORT:-587}
    
    read -p "From Email: " FROM_EMAIL
    read -p "From Name: " FROM_NAME
    read -p "To Email (your email): " TO_EMAIL
    read -p "To Name: " TO_NAME
    
    # Create JSON secret
    SECRET_JSON=$(cat <<EOF
{
  "smtp_host": "$SMTP_HOST",
  "smtp_username": "$SMTP_USERNAME",
  "smtp_password": "$SMTP_PASSWORD",
  "smtp_port": $SMTP_PORT,
  "smtp_encryption": "tls",
  "from_email": "$FROM_EMAIL",
  "from_name": "$FROM_NAME",
  "to_email": "$TO_EMAIL",
  "to_name": "$TO_NAME"
}
EOF
)
    
    # Create the secret
    if aws secretsmanager create-secret \
        --name "$SECRET_NAME" \
        --description "SMTP credentials for Portfolio contact form" \
        --secret-string "$SECRET_JSON" \
        --region "$REGION" &> /dev/null; then
        echo -e "${GREEN}✓ Secret created successfully${NC}"
    else
        echo -e "${RED}Failed to create secret. It may already exist.${NC}"
        echo -e "${YELLOW}Try updating instead: ./scripts/aws-secrets-setup.sh update${NC}"
        exit 1
    fi
}

# Function to update secret
update_secret() {
    echo -e "${YELLOW}Updating existing secret: $SECRET_NAME${NC}"
    
    # Get current secret
    CURRENT_SECRET=$(aws secretsmanager get-secret-value \
        --secret-id "$SECRET_NAME" \
        --region "$REGION" \
        --query SecretString \
        --output text 2>/dev/null || echo "")
    
    if [ -z "$CURRENT_SECRET" ]; then
        echo -e "${RED}Secret not found. Creating new one...${NC}"
        create_secret
        return
    fi
    
    echo -e "${GREEN}Current secret found${NC}"
    echo -e "${BLUE}Enter new values (press Enter to keep current):${NC}\n"
    
    # Parse current values
    CURRENT_HOST=$(echo "$CURRENT_SECRET" | jq -r '.smtp_host // empty')
    CURRENT_USER=$(echo "$CURRENT_SECRET" | jq -r '.smtp_username // empty')
    CURRENT_PORT=$(echo "$CURRENT_SECRET" | jq -r '.smtp_port // empty')
    CURRENT_FROM=$(echo "$CURRENT_SECRET" | jq -r '.from_email // empty')
    
    read -p "SMTP Host [$CURRENT_HOST]: " SMTP_HOST
    SMTP_HOST=${SMTP_HOST:-$CURRENT_HOST}
    
    read -p "SMTP Username [$CURRENT_USER]: " SMTP_USERNAME
    SMTP_USERNAME=${SMTP_USERNAME:-$CURRENT_USER}
    
    read -sp "SMTP Password (leave empty to keep current): " SMTP_PASSWORD
    echo
    if [ -z "$SMTP_PASSWORD" ]; then
        SMTP_PASSWORD=$(echo "$CURRENT_SECRET" | jq -r '.smtp_password')
    fi
    
    read -p "SMTP Port [$CURRENT_PORT]: " SMTP_PORT
    SMTP_PORT=${SMTP_PORT:-$CURRENT_PORT}
    
    read -p "From Email [$CURRENT_FROM]: " FROM_EMAIL
    FROM_EMAIL=${FROM_EMAIL:-$CURRENT_FROM}
    
    read -p "From Name: " FROM_NAME
    read -p "To Email: " TO_EMAIL
    read -p "To Name: " TO_NAME
    
    # Create updated JSON
    SECRET_JSON=$(cat <<EOF
{
  "smtp_host": "$SMTP_HOST",
  "smtp_username": "$SMTP_USERNAME",
  "smtp_password": "$SMTP_PASSWORD",
  "smtp_port": $SMTP_PORT,
  "smtp_encryption": "tls",
  "from_email": "$FROM_EMAIL",
  "from_name": "$FROM_NAME",
  "to_email": "$TO_EMAIL",
  "to_name": "$TO_NAME"
}
EOF
)
    
    # Update the secret
    if aws secretsmanager update-secret \
        --secret-id "$SECRET_NAME" \
        --secret-string "$SECRET_JSON" \
        --region "$REGION" &> /dev/null; then
        echo -e "${GREEN}✓ Secret updated successfully${NC}"
    else
        echo -e "${RED}Failed to update secret${NC}"
        exit 1
    fi
}

# Function to view secret
view_secret() {
    echo -e "${YELLOW}Retrieving secret: $SECRET_NAME${NC}\n"
    
    SECRET_VALUE=$(aws secretsmanager get-secret-value \
        --secret-id "$SECRET_NAME" \
        --region "$REGION" \
        --query SecretString \
        --output text 2>/dev/null || echo "")
    
    if [ -z "$SECRET_VALUE" ]; then
        echo -e "${RED}Secret not found${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Secret contents:${NC}"
    echo "$SECRET_VALUE" | jq '.'
}

# Function to delete secret
delete_secret() {
    echo -e "${RED}WARNING: This will schedule secret deletion${NC}"
    read -p "Are you sure? (yes/no): " CONFIRM
    
    if [ "$CONFIRM" != "yes" ]; then
        echo "Cancelled"
        exit 0
    fi
    
    aws secretsmanager delete-secret \
        --secret-id "$SECRET_NAME" \
        --recovery-window-in-days 7 \
        --region "$REGION"
    
    echo -e "${YELLOW}Secret scheduled for deletion in 7 days${NC}"
}

# Function to enable rotation
enable_rotation() {
    echo -e "${YELLOW}Setting up automatic rotation...${NC}"
    echo -e "${RED}Note: Automatic rotation requires Lambda function${NC}"
    echo -e "${BLUE}For now, manually rotate by updating credentials in AWS SES and running:${NC}"
    echo -e "${GREEN}./scripts/aws-secrets-setup.sh update${NC}\n"
    
    # TODO: Implement Lambda-based rotation
    echo "Lambda-based rotation setup not yet implemented"
}

# Main menu
case "${1:-menu}" in
    create)
        create_secret
        ;;
    update)
        update_secret
        ;;
    view)
        view_secret
        ;;
    delete)
        delete_secret
        ;;
    rotate)
        enable_rotation
        ;;
    menu|*)
        echo -e "${BLUE}Usage: $0 {create|update|view|delete|rotate}${NC}\n"
        echo "Commands:"
        echo "  create  - Create a new secret"
        echo "  update  - Update existing secret"
        echo "  view    - View current secret"
        echo "  delete  - Delete secret"
        echo "  rotate  - Setup automatic rotation"
        echo
        exit 1
        ;;
esac

# Update .env file
echo -e "\n${YELLOW}Updating .env file...${NC}"
if [ -f .env ]; then
    # Add or update AWS Secrets Manager configuration
    if grep -q "AWS_SECRETS_ENABLED" .env; then
        sed -i 's/AWS_SECRETS_ENABLED=.*/AWS_SECRETS_ENABLED=true/' .env
    else
        echo "" >> .env
        echo "# AWS Secrets Manager Configuration" >> .env
        echo "AWS_SECRETS_ENABLED=true" >> .env
        echo "AWS_SECRETS_REGION=$REGION" >> .env
        echo "AWS_SMTP_SECRET_NAME=$SECRET_NAME" >> .env
    fi
    echo -e "${GREEN}✓ .env file updated${NC}"
fi

echo -e "\n${GREEN}=== Setup Complete ===${NC}"
echo -e "${BLUE}Your SMTP credentials are now stored securely in AWS Secrets Manager${NC}"
echo -e "${YELLOW}Remember to:${NC}"
echo "1. Remove hardcoded credentials from .env file"
echo "2. Ensure AWS credentials are configured on production server"
echo "3. Test the contact form"
echo
