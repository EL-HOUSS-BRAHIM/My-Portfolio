#!/bin/bash

# Portfolio Status Check Script
# Quick health check for brahim-elhouss.me

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Portfolio Status Check${NC}"
echo "========================"
echo ""

# Check Nginx status
echo -e "${YELLOW}📋 Service Status:${NC}"
if systemctl is-active --quiet nginx; then
    echo -e "  Nginx: ${GREEN}✅ Running${NC}"
else
    echo -e "  Nginx: ${RED}❌ Not running${NC}"
fi

if systemctl is-active --quiet php8.1-fpm; then
    echo -e "  PHP-FPM: ${GREEN}✅ Running${NC}"
else
    echo -e "  PHP-FPM: ${RED}❌ Not running${NC}"
fi

echo ""

# Check SSL certificates
echo -e "${YELLOW}🔒 SSL Certificate Status:${NC}"
SSL_CERT="/etc/ssl/certs/brahim-elhouss.me/brahim-elhouss.me.crt"
if [ -f "$SSL_CERT" ]; then
    EXPIRY=$(openssl x509 -enddate -noout -in "$SSL_CERT" | cut -d= -f2)
    echo -e "  Certificate: ${GREEN}✅ Found${NC}"
    echo -e "  Expires: ${BLUE}$EXPIRY${NC}"
else
    echo -e "  Certificate: ${RED}❌ Not found${NC}"
fi

echo ""

# Check web directory
echo -e "${YELLOW}📁 Web Directory:${NC}"
WEB_ROOT="/var/www/html/brahim/portfolio"
if [ -d "$WEB_ROOT" ]; then
    echo -e "  Directory: ${GREEN}✅ Exists${NC}"
    FILE_COUNT=$(find "$WEB_ROOT" -type f | wc -l)
    echo -e "  Files: ${BLUE}$FILE_COUNT${NC}"
else
    echo -e "  Directory: ${RED}❌ Not found${NC}"
fi

echo ""

# Test HTTP/HTTPS
echo -e "${YELLOW}🌐 Connectivity Test:${NC}"

# Test HTTP redirect
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time 10 http://localhost/ 2>/dev/null || echo "000")
if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "301" ] || [ "$HTTP_STATUS" = "302" ]; then
    echo -e "  HTTP: ${GREEN}✅ Responding (Status: $HTTP_STATUS)${NC}"
else
    echo -e "  HTTP: ${RED}❌ Not responding (Status: $HTTP_STATUS)${NC}"
fi

# Test HTTPS
HTTPS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -k --max-time 10 https://localhost/ 2>/dev/null || echo "000")
if [ "$HTTPS_STATUS" = "200" ]; then
    echo -e "  HTTPS: ${GREEN}✅ Responding (Status: $HTTPS_STATUS)${NC}"
else
    echo -e "  HTTPS: ${RED}❌ Not responding (Status: $HTTPS_STATUS)${NC}"
fi

echo ""

# Check log files
echo -e "${YELLOW}📊 Recent Logs:${NC}"
ACCESS_LOG="/var/log/nginx/brahim-elhouss.me.access.log"
ERROR_LOG="/var/log/nginx/brahim-elhouss.me.error.log"

if [ -f "$ACCESS_LOG" ]; then
    RECENT_REQUESTS=$(tail -n 100 "$ACCESS_LOG" 2>/dev/null | wc -l)
    echo -e "  Recent requests: ${BLUE}$RECENT_REQUESTS${NC}"
else
    echo -e "  Access log: ${YELLOW}⚠️  Not found${NC}"
fi

if [ -f "$ERROR_LOG" ]; then
    RECENT_ERRORS=$(tail -n 100 "$ERROR_LOG" 2>/dev/null | wc -l)
    if [ "$RECENT_ERRORS" -gt 0 ]; then
        echo -e "  Recent errors: ${RED}$RECENT_ERRORS${NC}"
        echo -e "    ${YELLOW}Last error:${NC}"
        tail -n 1 "$ERROR_LOG" 2>/dev/null | sed 's/^/    /'
    else
        echo -e "  Recent errors: ${GREEN}0${NC}"
    fi
else
    echo -e "  Error log: ${YELLOW}⚠️  Not found${NC}"
fi

echo ""

# Performance check
echo -e "${YELLOW}⚡ Performance Check:${NC}"
if command -v nginx &> /dev/null; then
    NGINX_VERSION=$(nginx -v 2>&1 | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+')
    echo -e "  Nginx version: ${BLUE}$NGINX_VERSION${NC}"
fi

# Check disk space
DISK_USAGE=$(df -h /var/www/ | awk 'NR==2{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    echo -e "  Disk usage: ${GREEN}$DISK_USAGE%${NC}"
elif [ "$DISK_USAGE" -lt 90 ]; then
    echo -e "  Disk usage: ${YELLOW}$DISK_USAGE%${NC}"
else
    echo -e "  Disk usage: ${RED}$DISK_USAGE%${NC}"
fi

echo ""
echo -e "${BLUE}📋 Status check complete!${NC}"
