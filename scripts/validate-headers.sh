#!/bin/bash

###############################################################################
# Header Validation Script for SEO and Crawler Readiness
# Tests all critical HTTP headers for proper search engine indexing
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SITE_URL="${1:-http://localhost}"
VERBOSE="${2:-false}"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       Header Validation for Crawler Readiness             ║${NC}"
echo -e "${BLUE}╠════════════════════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║ Site: ${SITE_URL}${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to check header
check_header() {
    local url="$1"
    local header_name="$2"
    local expected_pattern="$3"
    local is_required="$4"
    
    echo -n "Checking ${header_name}... "
    
    header_value=$(curl -sI "$url" | grep -i "^${header_name}:" | cut -d' ' -f2- | tr -d '\r')
    
    if [ -z "$header_value" ]; then
        if [ "$is_required" = "true" ]; then
            echo -e "${RED}✗ MISSING (CRITICAL)${NC}"
            return 1
        else
            echo -e "${YELLOW}⚠ Missing (optional)${NC}"
            return 0
        fi
    fi
    
    if [ -n "$expected_pattern" ]; then
        if echo "$header_value" | grep -qiE "$expected_pattern"; then
            echo -e "${GREEN}✓ OK${NC}"
            [ "$VERBOSE" = "true" ] && echo "  Value: $header_value"
            return 0
        else
            echo -e "${RED}✗ INVALID${NC}"
            echo "  Expected: $expected_pattern"
            echo "  Got: $header_value"
            return 1
        fi
    else
        echo -e "${GREEN}✓ Present${NC}"
        [ "$VERBOSE" = "true" ] && echo "  Value: $header_value"
        return 0
    fi
}

# Function to test URL accessibility
test_url_accessibility() {
    echo ""
    echo -e "${BLUE}═══ Testing URL Accessibility ═══${NC}"
    
    status_code=$(curl -sIL -o /dev/null -w "%{http_code}" "$SITE_URL")
    
    if [ "$status_code" = "200" ]; then
        echo -e "${GREEN}✓ Site accessible (HTTP $status_code)${NC}"
    else
        echo -e "${RED}✗ Site not accessible (HTTP $status_code)${NC}"
        return 1
    fi
}

# Function to check critical SEO headers
check_seo_headers() {
    echo ""
    echo -e "${BLUE}═══ Critical SEO Headers ═══${NC}"
    
    check_header "$SITE_URL" "X-Robots-Tag" "index.*follow" "true"
    check_header "$SITE_URL" "Content-Type" "text/html" "true"
    check_header "$SITE_URL" "Cache-Control" ".*" "true"
    check_header "$SITE_URL" "Last-Modified" ".*" "false"
    check_header "$SITE_URL" "ETag" ".*" "false"
    check_header "$SITE_URL" "Vary" ".*" "true"
}

# Function to check security headers
check_security_headers() {
    echo ""
    echo -e "${BLUE}═══ Security Headers (Should not block crawlers) ═══${NC}"
    
    check_header "$SITE_URL" "X-Content-Type-Options" "nosniff" "true"
    check_header "$SITE_URL" "X-Frame-Options" "DENY|SAMEORIGIN" "true"
    check_header "$SITE_URL" "Referrer-Policy" ".*" "true"
    check_header "$SITE_URL" "Content-Security-Policy" ".*" "false"
    check_header "$SITE_URL" "Strict-Transport-Security" ".*" "false"
}

# Function to check compression
check_compression() {
    echo ""
    echo -e "${BLUE}═══ Compression (Performance) ═══${NC}"
    
    # Test with Accept-Encoding header
    compressed_size=$(curl -sI -H "Accept-Encoding: gzip" "$SITE_URL" | grep -i "content-length" | awk '{print $2}' | tr -d '\r')
    
    if [ -n "$compressed_size" ]; then
        echo -e "${GREEN}✓ Compression enabled${NC}"
        [ "$VERBOSE" = "true" ] && echo "  Compressed size: $compressed_size bytes"
    else
        content_encoding=$(curl -sI -H "Accept-Encoding: gzip" "$SITE_URL" | grep -i "content-encoding" | cut -d' ' -f2- | tr -d '\r')
        if [ -n "$content_encoding" ]; then
            echo -e "${GREEN}✓ Compression enabled (${content_encoding})${NC}"
        else
            echo -e "${YELLOW}⚠ Compression not detected${NC}"
        fi
    fi
}

# Function to check HTTPS redirect
check_https_redirect() {
    echo ""
    echo -e "${BLUE}═══ HTTPS Configuration ═══${NC}"
    
    if [[ "$SITE_URL" == https://* ]]; then
        echo -e "${GREEN}✓ Using HTTPS${NC}"
        
        # Check HTTP to HTTPS redirect
        http_url="${SITE_URL/https:/http:}"
        redirect_location=$(curl -sI "$http_url" | grep -i "^location:" | cut -d' ' -f2- | tr -d '\r')
        
        if [[ "$redirect_location" == https://* ]]; then
            echo -e "${GREEN}✓ HTTP to HTTPS redirect configured${NC}"
        else
            echo -e "${YELLOW}⚠ HTTP to HTTPS redirect not detected${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ Not using HTTPS (recommended for SEO)${NC}"
    fi
}

# Function to check robots.txt
check_robots_txt() {
    echo ""
    echo -e "${BLUE}═══ robots.txt ═══${NC}"
    
    robots_url="${SITE_URL}/robots.txt"
    robots_status=$(curl -sI -o /dev/null -w "%{http_code}" "$robots_url")
    
    if [ "$robots_status" = "200" ]; then
        echo -e "${GREEN}✓ robots.txt accessible${NC}"
        
        if [ "$VERBOSE" = "true" ]; then
            echo "  Content preview:"
            curl -s "$robots_url" | head -5 | sed 's/^/  /'
        fi
        
        # Check if it allows crawling
        if curl -s "$robots_url" | grep -qi "Disallow: /"; then
            echo -e "${YELLOW}⚠ Some paths are disallowed${NC}"
        fi
    else
        echo -e "${RED}✗ robots.txt not accessible (HTTP $robots_status)${NC}"
    fi
}

# Function to check sitemap
check_sitemap() {
    echo ""
    echo -e "${BLUE}═══ sitemap.xml ═══${NC}"
    
    sitemap_url="${SITE_URL}/sitemap.xml"
    sitemap_status=$(curl -sI -o /dev/null -w "%{http_code}" "$sitemap_url")
    
    if [ "$sitemap_status" = "200" ]; then
        echo -e "${GREEN}✓ sitemap.xml accessible${NC}"
        
        # Count URLs in sitemap
        url_count=$(curl -s "$sitemap_url" | grep -c "<loc>" || echo "0")
        echo "  URLs found: $url_count"
        
        if [ "$VERBOSE" = "true" ]; then
            echo "  URLs in sitemap:"
            curl -s "$sitemap_url" | grep "<loc>" | sed 's/.*<loc>\(.*\)<\/loc>.*/  - \1/'
        fi
    else
        echo -e "${RED}✗ sitemap.xml not accessible (HTTP $sitemap_status)${NC}"
    fi
}

# Function to check meta tags
check_meta_tags() {
    echo ""
    echo -e "${BLUE}═══ Meta Tags (HTML) ═══${NC}"
    
    html_content=$(curl -s "$SITE_URL")
    
    # Check title
    if echo "$html_content" | grep -qi "<title>"; then
        title=$(echo "$html_content" | grep -i "<title>" | sed 's/.*<title>\(.*\)<\/title>.*/\1/' | head -1)
        echo -e "${GREEN}✓ Title tag present${NC}"
        [ "$VERBOSE" = "true" ] && echo "  Title: $title"
    else
        echo -e "${RED}✗ Title tag missing${NC}"
    fi
    
    # Check description
    if echo "$html_content" | grep -qi 'meta.*description'; then
        echo -e "${GREEN}✓ Meta description present${NC}"
    else
        echo -e "${YELLOW}⚠ Meta description missing${NC}"
    fi
    
    # Check robots meta
    if echo "$html_content" | grep -qi 'meta.*robots'; then
        robots_content=$(echo "$html_content" | grep -i 'meta.*robots' | head -1)
        echo -e "${GREEN}✓ Meta robots present${NC}"
        [ "$VERBOSE" = "true" ] && echo "  Content: $robots_content"
    else
        echo -e "${YELLOW}⚠ Meta robots missing (will default to index, follow)${NC}"
    fi
    
    # Check canonical
    if echo "$html_content" | grep -qi 'rel="canonical"'; then
        echo -e "${GREEN}✓ Canonical URL present${NC}"
    else
        echo -e "${YELLOW}⚠ Canonical URL missing${NC}"
    fi
    
    # Check structured data
    if echo "$html_content" | grep -qi 'application/ld+json'; then
        schema_count=$(echo "$html_content" | grep -c 'application/ld+json')
        echo -e "${GREEN}✓ Structured data (JSON-LD) present ($schema_count schemas)${NC}"
    else
        echo -e "${YELLOW}⚠ Structured data missing${NC}"
    fi
}

# Function to check response time
check_response_time() {
    echo ""
    echo -e "${BLUE}═══ Performance ═══${NC}"
    
    response_time=$(curl -o /dev/null -s -w "%{time_total}" "$SITE_URL")
    response_ms=$(echo "$response_time * 1000" | bc)
    
    if (( $(echo "$response_time < 1.0" | bc -l) )); then
        echo -e "${GREEN}✓ Fast response time: ${response_ms}ms${NC}"
    elif (( $(echo "$response_time < 3.0" | bc -l) )); then
        echo -e "${YELLOW}⚠ Moderate response time: ${response_ms}ms${NC}"
    else
        echo -e "${RED}✗ Slow response time: ${response_ms}ms${NC}"
    fi
}

# Function to generate summary
generate_summary() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                    SUMMARY                                 ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "✓ = Pass"
    echo "⚠ = Warning (optional or needs attention)"
    echo "✗ = Fail (critical issue)"
    echo ""
    echo "Next steps:"
    echo "1. Fix any ✗ critical issues"
    echo "2. Review ⚠ warnings"
    echo "3. Test with Google Search Console"
    echo "4. Submit sitemap to search engines"
    echo ""
    echo "For detailed output, run: $0 $SITE_URL true"
}

# Main execution
main() {
    test_url_accessibility || exit 1
    check_seo_headers
    check_security_headers
    check_compression
    check_https_redirect
    check_robots_txt
    check_sitemap
    check_meta_tags
    check_response_time
    generate_summary
}

# Run main function
main

exit 0
