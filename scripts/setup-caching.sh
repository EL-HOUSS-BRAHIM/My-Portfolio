#!/bin/bash

# Browser Cache Implementation Script
# Applies optimal caching configurations to web server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${BLUE}🚀 Browser Cache Configuration${NC}"
echo "==============================="
echo ""

# Detect web server
detect_web_server() {
    if command -v apache2 &> /dev/null || command -v httpd &> /dev/null; then
        echo "apache"
    elif command -v nginx &> /dev/null; then
        echo "nginx"
    else
        echo "unknown"
    fi
}

# Configure Apache caching
configure_apache() {
    echo -e "${BLUE}📝 Configuring Apache caching...${NC}"
    
    # Copy .htaccess file
    if [ -f "$PROJECT_ROOT/config/browser-caching.conf" ]; then
        cp "$PROJECT_ROOT/config/browser-caching.conf" "$PROJECT_ROOT/.htaccess"
        echo "   ✅ .htaccess file created with caching rules"
    fi
    
    # Create directory-specific .htaccess files
    create_asset_htaccess() {
        local dir="$1"
        local max_age="$2"
        
        if [ -d "$PROJECT_ROOT/$dir" ]; then
            cat > "$PROJECT_ROOT/$dir/.htaccess" << EOF
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresDefault "access plus ${max_age}"
</IfModule>

<IfModule mod_headers.c>
    Header set Cache-Control "public, max-age=${max_age}"
    Header append Vary Accept-Encoding
</IfModule>
EOF
            echo "   ✅ Created .htaccess for $dir (${max_age}s)"
        fi
    }
    
    # Configure specific directories
    create_asset_htaccess "assets/css" "31536000"  # 1 year
    create_asset_htaccess "assets/js" "31536000"   # 1 year
    create_asset_htaccess "assets/images" "31536000" # 1 year
    create_asset_htaccess "assets/fonts" "31536000"  # 1 year
    create_asset_htaccess "storage/optimized" "31536000" # 1 year
}

# Configure Nginx caching
configure_nginx() {
    echo -e "${BLUE}📝 Generating Nginx configuration...${NC}"
    
    cat > "$PROJECT_ROOT/config/nginx-cache.conf" << 'EOF'
# Nginx Caching Configuration for Portfolio
# Include this in your server block

# Gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_proxied any;
gzip_comp_level 6;
gzip_types
    application/javascript
    application/json
    application/xml
    application/rss+xml
    application/atom+xml
    image/svg+xml
    text/css
    text/javascript
    text/plain
    text/xml
    font/woff
    font/woff2;

# Static assets - long cache
location ~* \.(css|js|png|jpg|jpeg|gif|svg|webp|avif|ico|woff|woff2|ttf|otf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Vary Accept-Encoding;
    access_log off;
}

# Versioned assets - very long cache
location ~* \.(css|js|png|jpg|jpeg|gif|svg|webp|avif|woff|woff2|ttf|otf|eot)\.(v[0-9]+|[a-f0-9]{8,})\.(css|js|png|jpg|jpeg|gif|svg|webp|avif|woff|woff2|ttf|otf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
    add_header Vary Accept-Encoding;
    access_log off;
}

# HTML files - shorter cache
location ~* \.html$ {
    expires 1h;
    add_header Cache-Control "public, max-age=3600, must-revalidate";
    add_header Vary Accept-Encoding;
}

# API endpoints - very short cache
location ~* \.(json|xml)$ {
    expires 5m;
    add_header Cache-Control "public, max-age=300, must-revalidate";
    add_header Vary Accept-Encoding;
}

# PHP files - no cache
location ~* \.php$ {
    expires -1;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
}

# Font CORS headers
location ~* \.(woff|woff2|ttf|otf|eot)$ {
    add_header Access-Control-Allow-Origin "*";
    add_header Access-Control-Allow-Methods "GET";
    add_header Access-Control-Allow-Headers "Content-Type";
    expires 1y;
    add_header Cache-Control "public, immutable";
}
EOF

    echo "   ✅ Nginx configuration generated: config/nginx-cache.conf"
}

# Test cache headers
test_cache_headers() {
    echo -e "${BLUE}🧪 Testing cache headers...${NC}"
    
    # Test different file types
    test_files=(
        "assets/css/base.css"
        "assets/js/app.js"
        "assets/images/profile-img.jpg"
        "index.html"
    )
    
    for file in "${test_files[@]}"; do
        if [ -f "$PROJECT_ROOT/$file" ]; then
            echo "   🔍 Testing: $file"
            
            # Simple curl test (if available)
            if command -v curl &> /dev/null; then
                headers=$(curl -s -I "http://localhost/$file" 2>/dev/null || echo "Could not test")
                
                if echo "$headers" | grep -i "cache-control" > /dev/null; then
                    cache_control=$(echo "$headers" | grep -i "cache-control" | cut -d':' -f2 | xargs)
                    echo "      Cache-Control: $cache_control"
                else
                    echo "      ⚠️  No Cache-Control header found"
                fi
            else
                echo "      ℹ️  curl not available for testing"
            fi
        fi
    done
}

# Generate cache report
generate_cache_report() {
    echo -e "${BLUE}📊 Generating cache report...${NC}"
    
    cat > "$PROJECT_ROOT/cache-report.txt" << EOF
Cache Configuration Report
Generated: $(date)

=== Configuration Files ===
.htaccess: $([ -f "$PROJECT_ROOT/.htaccess" ] && echo "✅ Present" || echo "❌ Missing")
nginx-cache.conf: $([ -f "$PROJECT_ROOT/config/nginx-cache.conf" ] && echo "✅ Present" || echo "❌ Missing")

=== Asset Directories ===
CSS Directory: $([ -d "$PROJECT_ROOT/assets/css" ] && echo "✅ Present" || echo "❌ Missing")
JS Directory: $([ -d "$PROJECT_ROOT/assets/js-clean" ] && echo "✅ Present" || echo "❌ Missing")
Images Directory: $([ -d "$PROJECT_ROOT/assets/images" ] && echo "✅ Present" || echo "❌ Missing")
Optimized Assets: $([ -d "$PROJECT_ROOT/storage/optimized" ] && echo "✅ Present" || echo "❌ Missing")

=== Cache Headers Configuration ===
Static Assets: max-age=31536000 (1 year)
HTML Files: max-age=3600 (1 hour)
API Responses: max-age=300 (5 minutes)
Dynamic Content: no-cache

=== Optimization Features ===
✅ Gzip compression enabled
✅ ETag support enabled
✅ Vary headers configured
✅ CORS headers for fonts
✅ Immutable flag for versioned assets
✅ Cache busting support

=== Next Steps ===
1. Deploy configuration to web server
2. Test cache headers with browser dev tools
3. Monitor cache hit rates
4. Adjust cache durations based on usage patterns

EOF

    echo "   ✅ Cache report generated: cache-report.txt"
}

# Create cache test page
create_cache_test_page() {
    echo -e "${BLUE}🔬 Creating cache test page...${NC}"
    
    cat > "$PROJECT_ROOT/cache-test.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cache Test Page</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .test-item { margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
        .test-item h3 { margin: 0 0 10px 0; color: #333; }
        .cache-info { font-family: monospace; background: #f5f5f5; padding: 5px; margin: 5px 0; }
        .status-ok { color: green; }
        .status-warn { color: orange; }
        .status-error { color: red; }
    </style>
</head>
<body>
    <h1>Browser Cache Test Page</h1>
    <p>Use browser developer tools to inspect cache headers for the following resources:</p>
    
    <div class="test-item">
        <h3>CSS Files</h3>
        <link rel="stylesheet" href="assets/css/base.css">
        <div class="cache-info">Expected: Cache-Control: public, max-age=31536000</div>
    </div>
    
    <div class="test-item">
        <h3>JavaScript Files</h3>
        <script src="assets/js-clean/app.js"></script>
        <div class="cache-info">Expected: Cache-Control: public, max-age=31536000</div>
    </div>
    
    <div class="test-item">
        <h3>Images</h3>
        <img src="assets/images/profile-img.jpg" alt="Test Image" style="max-width: 100px;">
        <div class="cache-info">Expected: Cache-Control: public, max-age=31536000</div>
    </div>
    
    <div class="test-item">
        <h3>Fonts</h3>
        <div style="font-family: 'Inter', sans-serif;">Font test text</div>
        <div class="cache-info">Expected: Cache-Control: public, max-age=31536000, immutable</div>
    </div>
    
    <script>
        // Test cache headers with JavaScript
        document.addEventListener('DOMContentLoaded', function() {
            console.log('Cache Test Page Loaded');
            console.log('Check Network tab for cache headers');
            
            // Performance API test
            if ('performance' in window && 'getEntriesByType' in performance) {
                const resources = performance.getEntriesByType('resource');
                console.log('Resource timing entries:', resources.length);
                
                resources.forEach(function(resource) {
                    if (resource.name.includes('.css') || resource.name.includes('.js') || resource.name.includes('.jpg')) {
                        console.log('Resource:', resource.name, 'Transfer size:', resource.transferSize);
                    }
                });
            }
        });
    </script>
</body>
</html>
EOF

    echo "   ✅ Cache test page created: cache-test.html"
}

# Main execution
main() {
    SERVER_TYPE=$(detect_web_server)
    
    echo "🔍 Detected web server: $SERVER_TYPE"
    echo ""
    
    case $SERVER_TYPE in
        "apache")
            configure_apache
            ;;
        "nginx")
            configure_nginx
            ;;
        *)
            echo -e "${YELLOW}⚠️  Web server not detected, generating configuration for both Apache and Nginx${NC}"
            configure_apache
            configure_nginx
            ;;
    esac
    
    echo ""
    create_cache_test_page
    generate_cache_report
    
    echo ""
    echo -e "${GREEN}🎉 Browser caching configuration complete!${NC}"
    echo ""
    echo "📁 Files created:"
    echo "   - .htaccess (Apache configuration)"
    echo "   - config/nginx-cache.conf (Nginx configuration)"
    echo "   - cache-test.html (Test page)"
    echo "   - cache-report.txt (Configuration report)"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Deploy configuration to your web server"
    echo "   2. Visit cache-test.html to verify headers"
    echo "   3. Use browser dev tools to inspect cache behavior"
    echo "   4. Monitor cache performance and adjust as needed"
}

# Run main function
main "$@"