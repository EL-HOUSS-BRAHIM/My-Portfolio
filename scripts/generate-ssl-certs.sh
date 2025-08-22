#!/bin/bash

# SSL Certificate Generation Script for brahim-elhouss.me
# This script generates self-signed certificates for local development
# In production, these will be replaced by Cloudflare's certificates

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔒 Generating SSL certificates for brahim-elhouss.me...${NC}"

# Create SSL directory
SSL_DIR="/etc/ssl/certs/brahim-elhouss.me"
SSL_PRIVATE_DIR="/etc/ssl/private/brahim-elhouss.me"

echo -e "${YELLOW}📁 Creating SSL directories...${NC}"
sudo mkdir -p "$SSL_DIR"
sudo mkdir -p "$SSL_PRIVATE_DIR"

# Certificate details
DOMAIN="brahim-elhouss.me"
COUNTRY="MA"
STATE="Casablanca"
CITY="Casablanca"
ORG="Brahim El Houss Portfolio"
OU="Web Development"
EMAIL="contact@brahim-elhouss.me"

# Generate private key
echo -e "${YELLOW}🔑 Generating private key...${NC}"
sudo openssl genrsa -out "$SSL_PRIVATE_DIR/$DOMAIN.key" 4096

# Generate certificate signing request
echo -e "${YELLOW}📝 Generating certificate signing request...${NC}"
sudo openssl req -new -key "$SSL_PRIVATE_DIR/$DOMAIN.key" -out "$SSL_DIR/$DOMAIN.csr" -subj "/C=$COUNTRY/ST=$STATE/L=$CITY/O=$ORG/OU=$OU/CN=$DOMAIN/emailAddress=$EMAIL"

# Create temporary config file for certificate extensions
TEMP_CONFIG="/tmp/ssl_config_$$.conf"
cat > "$TEMP_CONFIG" <<EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req

[req_distinguished_name]

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = $DOMAIN
DNS.2 = www.$DOMAIN
DNS.3 = api.$DOMAIN
EOF

# Generate self-signed certificate with SAN (Subject Alternative Names)
echo -e "${YELLOW}📜 Generating self-signed certificate...${NC}"
sudo openssl x509 -req -days 365 -in "$SSL_DIR/$DOMAIN.csr" -signkey "$SSL_PRIVATE_DIR/$DOMAIN.key" -out "$SSL_DIR/$DOMAIN.crt" -extensions v3_req -extfile "$TEMP_CONFIG"

# Clean up temporary config file
rm -f "$TEMP_CONFIG"

# Create DH parameters for enhanced security
echo -e "${YELLOW}🔐 Generating Diffie-Hellman parameters (this may take a while)...${NC}"
sudo openssl dhparam -out "$SSL_DIR/dhparam.pem" 2048

# Set proper permissions
echo -e "${YELLOW}🔒 Setting proper permissions...${NC}"
sudo chmod 644 "$SSL_DIR/$DOMAIN.crt"
sudo chmod 644 "$SSL_DIR/$DOMAIN.csr"
sudo chmod 644 "$SSL_DIR/dhparam.pem"
sudo chmod 600 "$SSL_PRIVATE_DIR/$DOMAIN.key"
sudo chown root:root "$SSL_DIR"/*
sudo chown root:root "$SSL_PRIVATE_DIR"/*

# Create combined certificate file for OCSP stapling
echo -e "${YELLOW}🔗 Creating certificate chain...${NC}"
sudo cat "$SSL_DIR/$DOMAIN.crt" > "$SSL_DIR/$DOMAIN-fullchain.crt"

echo -e "${GREEN}✅ SSL certificates generated successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 Certificate Details:${NC}"
echo "Certificate: $SSL_DIR/$DOMAIN.crt"
echo "Private Key: $SSL_PRIVATE_DIR/$DOMAIN.key"
echo "Certificate Chain: $SSL_DIR/$DOMAIN-fullchain.crt"
echo "DH Parameters: $SSL_DIR/dhparam.pem"
echo ""
echo -e "${YELLOW}⚠️  Important Notes:${NC}"
echo "1. These are self-signed certificates for local development"
echo "2. In production, Cloudflare will provide the actual SSL certificates"
echo "3. Make sure to update your DNS to point to Cloudflare"
echo "4. Configure Cloudflare SSL mode to 'Full (strict)' for maximum security"
echo ""
echo -e "${GREEN}🚀 Ready to configure Nginx!${NC}"
