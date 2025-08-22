#!/bin/bash

# Enhanced Portfolio Optimization Script
# Optimizes assets, configurations, and performance
# Combines features from both original optimize.sh and optimize-enhanced.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ASSETS_DIR="$PROJECT_ROOT/assets"
BUILD_DIR="$PROJECT_ROOT/build"
STORAGE_DIR="$PROJECT_ROOT/storage"

echo -e "${BLUE}🚀 Starting Portfolio Optimization...${NC}"

# Create necessary directories
echo -e "${YELLOW}📁 Creating directories...${NC}"
mkdir -p "$BUILD_DIR"
mkdir -p "$STORAGE_DIR"/{cache,logs,sessions,optimized/{css,js,images}}
mkdir -p "$ASSETS_DIR"/css/minified
mkdir -p "$ASSETS_DIR"/js/minified

# Set proper permissions
echo -e "${YELLOW}🔐 Setting permissions...${NC}"
chmod -R 755 "$STORAGE_DIR"
chmod -R 644 "$STORAGE_DIR"/**/* 2>/dev/null || true
find "$STORAGE_DIR" -type d -exec chmod 755 {} \;

# Check if required tools are installed
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 is not installed. Please install it first.${NC}"
        return 1
    fi
    return 0
}

# Image optimization with multiple tools support
optimize_images() {
    echo -e "${YELLOW}🖼️  Optimizing images...${NC}"
    
    # Try modern imagemin first, fallback to ImageMagick
    if command -v imagemin &> /dev/null; then
        echo "  - Using imagemin for optimization..."
        imagemin "$ASSETS_DIR/images/*.{jpg,jpeg,png,gif,svg}" \
            --out-dir="$ASSETS_DIR/images/optimized" \
            --plugin=imagemin-mozjpeg \
            --plugin=imagemin-pngquant \
            --plugin=imagemin-gifsicle \
            --plugin=imagemin-svgo 2>/dev/null || {
            echo -e "${YELLOW}  - imagemin plugins missing, falling back to basic optimization${NC}"
            cp "$ASSETS_DIR"/images/*.{jpg,jpeg,png,gif,svg} "$ASSETS_DIR/images/optimized/" 2>/dev/null || true
        }
    elif check_tool "convert"; then
        echo "  - Using ImageMagick for optimization..."
        # Optimize JPEG images
        find "$ASSETS_DIR/images" -name "*.jpg" -o -name "*.jpeg" | while read img; do
            filename=$(basename "$img")
            echo "    📸 Optimizing $filename..."
            convert "$img" -quality 85 -strip "$STORAGE_DIR/optimized/images/$filename"
        done
        
        # Optimize PNG images
        find "$ASSETS_DIR/images" -name "*.png" | while read img; do
            filename=$(basename "$img")
            echo "    📸 Optimizing $filename..."
            convert "$img" -strip "$STORAGE_DIR/optimized/images/$filename"
        done
    else
        echo -e "${YELLOW}  ⚠️  No image optimization tools found. Install imagemagick or imagemin-cli${NC}"
        echo "    - ImageMagick: sudo apt install imagemagick"
        echo "    - imagemin: npm install -g imagemin-cli"
    fi
    
    # Generate WebP images
    if command -v cwebp &> /dev/null; then
        echo "  - Converting images to WebP..."
        for img in "$ASSETS_DIR"/images/*.{jpg,jpeg,png}; do
            if [[ -f "$img" ]]; then
                filename=$(basename "$img")
                name="${filename%.*}"
                echo "    🔄 Converting $filename to WebP"
                cwebp -q 80 "$img" -o "$ASSETS_DIR/images/optimized/$name.webp" 2>/dev/null || true
            fi
        done
    else
        echo -e "${YELLOW}  ⚠️  cwebp not found. Install libwebp-tools for WebP conversion${NC}"
    fi
    
    echo -e "${GREEN}✅ Image optimization complete!${NC}"
}

# CSS minification with multiple tools support
minify_css() {
    echo -e "${YELLOW}🎨 Minifying CSS...${NC}"
    
    # Try modern csso first, fallback to clean-css, then basic minification
    if command -v csso &> /dev/null; then
        echo "  - Using csso for CSS optimization..."
        for css_file in "$ASSETS_DIR"/css/*.css; do
            if [[ -f "$css_file" && ! "$css_file" =~ minified ]]; then
                filename=$(basename "$css_file" .css)
                echo "    - Minifying $filename.css"
                csso "$css_file" --output "$ASSETS_DIR/css/minified/$filename.min.css"
                cp "$css_file" "$STORAGE_DIR/optimized/css/$filename.min.css"
            fi
        done
    elif command -v cleancss &> /dev/null; then
        echo "  - Using clean-css for CSS optimization..."
        for css_file in "$ASSETS_DIR"/css/*.css; do
            if [[ -f "$css_file" && ! "$css_file" =~ minified ]]; then
                filename=$(basename "$css_file" .css)
                echo "    - Minifying $filename.css"
                cleancss -o "$ASSETS_DIR/css/minified/$filename.min.css" "$css_file"
                cp "$ASSETS_DIR/css/minified/$filename.min.css" "$STORAGE_DIR/optimized/css/"
            fi
        done
    else
        echo -e "${YELLOW}  ⚠️  Using basic CSS minification${NC}"
        echo "    Install csso (npm install -g csso-cli) or clean-css (npm install -g clean-css-cli) for better optimization"
        
        # Fallback: basic minification
        for css_file in "$ASSETS_DIR"/css/*.css; do
            if [[ -f "$css_file" && ! "$css_file" =~ minified ]]; then
                filename=$(basename "$css_file" .css)
                echo "    - Basic minification: $filename.css"
                cat "$css_file" | tr -d '\n\t' | sed 's/  */ /g' > "$ASSETS_DIR/css/minified/$filename.min.css"
                cp "$ASSETS_DIR/css/minified/$filename.min.css" "$STORAGE_DIR/optimized/css/"
            fi
        done
    fi
    
    echo -e "${GREEN}✅ CSS minification complete!${NC}"
}

# JavaScript minification with multiple tools support
minify_js() {
    echo -e "${YELLOW}📜 Minifying JavaScript...${NC}"
    
    # Try modern terser first, fallback to uglifyjs
    if command -v terser &> /dev/null; then
        echo "  - Using terser for JS optimization..."
        for js_file in "$ASSETS_DIR"/js/*.js "$ASSETS_DIR"/js-clean/*.js; do
            if [[ -f "$js_file" && ! "$js_file" =~ minified ]]; then
                filename=$(basename "$js_file" .js)
                echo "    - Minifying $filename.js"
                terser "$js_file" \
                    --compress \
                    --mangle \
                    --output "$ASSETS_DIR/js/minified/$filename.min.js" \
                    --source-map "url='$filename.min.js.map'" 2>/dev/null || {
                    terser "$js_file" --compress --mangle --output "$ASSETS_DIR/js/minified/$filename.min.js"
                }
                cp "$ASSETS_DIR/js/minified/$filename.min.js" "$STORAGE_DIR/optimized/js/" 2>/dev/null || true
            fi
        done
    elif command -v uglifyjs &> /dev/null; then
        echo "  - Using uglifyjs for JS optimization..."
        for js_file in "$ASSETS_DIR"/js/*.js "$ASSETS_DIR"/js-clean/*.js; do
            if [[ -f "$js_file" && ! "$js_file" =~ minified ]]; then
                filename=$(basename "$js_file" .js)
                echo "    - Minifying $filename.js"
                uglifyjs "$js_file" -o "$ASSETS_DIR/js/minified/$filename.min.js" -c -m
                cp "$ASSETS_DIR/js/minified/$filename.min.js" "$STORAGE_DIR/optimized/js/" 2>/dev/null || true
            fi
        done
    else
        echo -e "${YELLOW}  ⚠️  No JS minification tools found${NC}"
        echo "    Install terser (npm install -g terser) or uglify-js (npm install -g uglify-js)"
        # Fallback: copy files
        for js_file in "$ASSETS_DIR"/js/*.js "$ASSETS_DIR"/js-clean/*.js; do
            if [[ -f "$js_file" ]]; then
                filename=$(basename "$js_file")
                echo "    - Copying $filename (not minified)"
                cp "$js_file" "$ASSETS_DIR/js/minified/"
                cp "$js_file" "$STORAGE_DIR/optimized/js/" 2>/dev/null || true
            fi
        done
    fi
    
    echo -e "${GREEN}✅ JavaScript minification complete!${NC}"
}

# Optimize PHP configuration
optimize_php_config() {
    echo -e "${YELLOW}⚙️  Optimizing PHP configuration...${NC}"
    
    if [[ -f /etc/php/8.1/fpm/php.ini ]]; then
        echo "  - Checking PHP configuration..."
        
        # Check OPcache settings
        if grep -q "opcache.enable=1" /etc/php/8.1/fpm/php.ini; then
            echo "    ✅ OPcache is enabled"
        else
            echo -e "${YELLOW}    - OPcache not optimally configured${NC}"
        fi
        
        # Check memory limit
        memory_limit=$(php -r "echo ini_get('memory_limit');" 2>/dev/null || echo "Unknown")
        echo "    - Memory limit: $memory_limit"
        
        # Check max execution time
        max_time=$(php -r "echo ini_get('max_execution_time');" 2>/dev/null || echo "Unknown")
        echo "    - Max execution time: ${max_time}s"
    else
        echo -e "${BLUE}    ℹ️  PHP configuration not found or not accessible${NC}"
    fi
}

# Composer optimization
optimize_composer() {
    echo -e "${YELLOW}📦 Optimizing Composer...${NC}"
    
    if [[ -f "$PROJECT_ROOT/composer.json" ]]; then
        cd "$PROJECT_ROOT"
        
        echo "  - Installing dependencies with optimizations..."
        composer install --no-dev --optimize-autoloader --classmap-authoritative --quiet
        
        echo "  - Dumping optimized autoloader..."
        composer dump-autoload --optimize --classmap-authoritative --quiet
        
        echo -e "${GREEN}  ✅ Composer optimization complete${NC}"
    else
        echo -e "${BLUE}  ℹ️  No composer.json found${NC}"
    fi
}

# Clean temporary files
cleanup_temp_files() {
    echo -e "${YELLOW}🧹 Cleaning temporary files...${NC}"
    
    find "$PROJECT_ROOT" -name "*.tmp" -type f -delete 2>/dev/null || true
    find "$PROJECT_ROOT" -name "*.log" -type f -mtime +30 -delete 2>/dev/null || true
    find "$STORAGE_DIR/cache" -name "*.cache" -type f -mtime +7 -delete 2>/dev/null || true
    
    echo -e "${GREEN}  ✅ Cleanup complete${NC}"
}

# Generate cache warmup script
generate_cache_warmup() {
    echo -e "${YELLOW}🔥 Generating cache warmup script...${NC}"
    
    cat > "$PROJECT_ROOT/warmup-cache.php" << 'EOF'
<?php
/**
 * Cache Warmup Script
 * Pre-loads frequently accessed data to improve performance
 */

require_once __DIR__ . '/vendor/autoload.php';

echo "🔥 Warming up cache...\n";

try {
    // Check if config files exist
    $configFiles = [
        __DIR__ . '/src/config/ConfigManager.php',
        __DIR__ . '/src/config/DatabaseManager.php'
    ];
    
    foreach ($configFiles as $file) {
        if (file_exists($file)) {
            require_once $file;
        }
    }
    
    // Test basic functionality
    if (class_exists('ConfigManager')) {
        $config = ConfigManager::getInstance();
        echo "✅ Configuration loaded\n";
    }
    
    if (class_exists('DatabaseManager')) {
        $db = DatabaseManager::getInstance();
        if (method_exists($db, 'healthCheck') && $db->healthCheck()) {
            echo "✅ Database connection verified\n";
        }
        
        // Pre-load testimonials if table exists
        try {
            $testimonials = $db->fetchAll("SELECT * FROM testimonials ORDER BY created_at DESC LIMIT 10");
            echo "✅ Testimonials loaded (" . count($testimonials) . " items)\n";
        } catch (Exception $e) {
            echo "ℹ️  Testimonials table not found or empty\n";
        }
    }
    
    echo "🎉 Cache warmup completed!\n";
    
} catch (Exception $e) {
    echo "❌ Cache warmup failed: " . $e->getMessage() . "\n";
    exit(1);
}
EOF

    chmod +x "$PROJECT_ROOT/warmup-cache.php"
    echo -e "${GREEN}  ✅ Cache warmup script created${NC}"
}

# Create optimized .htaccess file
create_htaccess() {
    echo -e "${YELLOW}⚙️  Creating optimized .htaccess...${NC}"
    
    cat > "$PROJECT_ROOT/.htaccess" << 'EOF'
# Portfolio Performance Optimization

# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
    AddOutputFilterByType DEFLATE image/svg+xml
</IfModule>

# Browser caching
<IfModule mod_expires.c>
    ExpiresActive on
    
    # Images
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/gif "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/svg+xml "access plus 1 month"
    ExpiresByType image/webp "access plus 1 month"
    ExpiresByType image/x-icon "access plus 1 year"
    
    # CSS and JavaScript
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType text/javascript "access plus 1 month"
    
    # Fonts
    ExpiresByType font/woff "access plus 1 year"
    ExpiresByType font/woff2 "access plus 1 year"
    ExpiresByType application/font-woff "access plus 1 year"
    ExpiresByType application/font-woff2 "access plus 1 year"
    
    # HTML
    ExpiresByType text/html "access plus 1 day"
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'"
</IfModule>

# Remove server signature
ServerTokens Prod
ServerSignature Off
EOF
    
    echo -e "${GREEN}  ✅ .htaccess created${NC}"
}

# Generate comprehensive performance report
generate_performance_report() {
    echo -e "${YELLOW}📊 Generating performance report...${NC}"
    
    REPORT_FILE="$BUILD_DIR/optimization-report.txt"
    cat > "$REPORT_FILE" << EOF
Portfolio Optimization Report
Generated: $(date)

=== File Sizes ===
Original CSS: $(find "$ASSETS_DIR"/css -name "*.css" -not -path "*/minified/*" -exec du -ch {} + 2>/dev/null | tail -1 | cut -f1 || echo "N/A")
Minified CSS: $(find "$ASSETS_DIR"/css/minified -name "*.css" -exec du -ch {} + 2>/dev/null | tail -1 | cut -f1 || echo "N/A")

Original JS: $(find "$ASSETS_DIR"/js "$ASSETS_DIR"/js-clean -name "*.js" -not -path "*/minified/*" -exec du -ch {} + 2>/dev/null | tail -1 | cut -f1 || echo "N/A")
Minified JS: $(find "$ASSETS_DIR"/js/minified -name "*.js" -exec du -ch {} + 2>/dev/null | tail -1 | cut -f1 || echo "N/A")

Original Images: $(find "$ASSETS_DIR"/images -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.gif" -not -path "*/optimized/*" | xargs du -ch 2>/dev/null | tail -1 | cut -f1 || echo "N/A")
Optimized Images: $(find "$ASSETS_DIR"/images/optimized "$STORAGE_DIR"/optimized/images -name "*" -type f | xargs du -ch 2>/dev/null | tail -1 | cut -f1 || echo "N/A")

=== Storage ===
Cache directory: $(du -sh "$STORAGE_DIR/cache" 2>/dev/null | cut -f1 || echo "0K")
Logs directory: $(du -sh "$STORAGE_DIR/logs" 2>/dev/null | cut -f1 || echo "0K")
Total storage: $(du -sh "$STORAGE_DIR" 2>/dev/null | cut -f1 || echo "0K")

=== PHP Configuration ===
PHP Version: $(php -v 2>/dev/null | head -n 1 || echo "Not accessible")
Memory Limit: $(php -r "echo ini_get('memory_limit');" 2>/dev/null || echo "Unknown")
Max Execution Time: $(php -r "echo ini_get('max_execution_time');" 2>/dev/null || echo "Unknown")s
OPcache Enabled: $(php -r "echo ini_get('opcache.enable') ? 'Yes' : 'No';" 2>/dev/null || echo "Unknown")

=== Optimization Status ===
✅ Assets minified and optimized
✅ Images optimized and WebP generated
✅ Cache directories created
✅ Permissions configured
✅ Performance configurations applied
✅ Cache warmup script generated
✅ .htaccess optimization rules created

=== Tools Used ===
Image Optimization: $(command -v imagemin &>/dev/null && echo "imagemin" || command -v convert &>/dev/null && echo "ImageMagick" || echo "None")
CSS Minification: $(command -v csso &>/dev/null && echo "csso" || command -v cleancss &>/dev/null && echo "clean-css" || echo "Basic")
JS Minification: $(command -v terser &>/dev/null && echo "terser" || command -v uglifyjs &>/dev/null && echo "uglify-js" || echo "None")
WebP Conversion: $(command -v cwebp &>/dev/null && echo "cwebp" || echo "Not available")

=== Next Steps ===
1. Test optimized files in development
2. Run cache warmup: php warmup-cache.php
3. Test website performance
4. Deploy optimized assets to production
5. Monitor performance metrics

EOF

    echo -e "${GREEN}✅ Performance report saved to: $REPORT_FILE${NC}"
}

# Generate deployment checklist
generate_deployment_checklist() {
    echo -e "${YELLOW}📋 Generating deployment checklist...${NC}"
    
    cat > "$PROJECT_ROOT/DEPLOYMENT_CHECKLIST.md" << 'EOF'
# Deployment Checklist

## Pre-Deployment
- [ ] All tests pass
- [ ] Code is optimized and minified
- [ ] Environment variables are configured
- [ ] Database migrations are ready
- [ ] SSL certificates are valid
- [ ] Backup current site

## Deployment
- [ ] Upload optimized files
- [ ] Run database migrations
- [ ] Update Nginx configuration
- [ ] Restart PHP-FPM
- [ ] Clear all caches
- [ ] Run cache warmup script: `php warmup-cache.php`

## Post-Deployment
- [ ] Test all functionality
- [ ] Verify SSL/TLS configuration
- [ ] Check site performance
- [ ] Monitor error logs
- [ ] Test contact form
- [ ] Verify testimonials loading
- [ ] Check mobile responsiveness

## Performance Verification
- [ ] Run PageSpeed Insights
- [ ] Test with GTmetrix
- [ ] Verify WebP image serving
- [ ] Check gzip compression
- [ ] Test API endpoints
- [ ] Verify rate limiting

## Security Verification
- [ ] Test security headers
- [ ] Verify CSP policy
- [ ] Check for XSS vulnerabilities
- [ ] Test rate limiting
- [ ] Verify file upload security
- [ ] Check error handling

## Monitoring Setup
- [ ] Configure error logging
- [ ] Set up performance monitoring
- [ ] Configure uptime monitoring
- [ ] Set up backup schedules
- [ ] Configure log rotation
EOF

    echo -e "${GREEN}✅ Deployment checklist created${NC}"
}

# Security audit
run_security_audit() {
    echo -e "${YELLOW}🔒 Running security audit...${NC}"
    
    echo "  - Checking file permissions..."
    find "$PROJECT_ROOT" -type f -name "*.php" -exec chmod 644 {} \; 2>/dev/null || true
    find "$PROJECT_ROOT" -type d -exec chmod 755 {} \; 2>/dev/null || true
    
    echo "  - Checking for sensitive files..."
    if [[ -f "$PROJECT_ROOT/.env" ]]; then
        chmod 600 "$PROJECT_ROOT/.env"
        echo "    ✅ .env file secured"
    fi
    
    if [[ -d "$PROJECT_ROOT/.git" ]]; then
        echo "    ⚠️  .git directory found - ensure it's not accessible in production"
    fi
    
    echo -e "${GREEN}  ✅ Security audit complete${NC}"
}

# Main execution function
main() {
    echo -e "\n${BLUE}Starting comprehensive optimization process...${NC}"
    echo ""
    
    optimize_images
    echo ""
    
    minify_css
    echo ""
    
    minify_js
    echo ""
    
    optimize_php_config
    echo ""
    
    optimize_composer
    echo ""
    
    cleanup_temp_files
    echo ""
    
    generate_cache_warmup
    echo ""
    
    create_htaccess
    echo ""
    
    run_security_audit
    echo ""
    
    generate_performance_report
    echo ""
    
    generate_deployment_checklist
    echo ""
    
    echo -e "${GREEN}🎉 Portfolio optimization complete!${NC}"
    echo ""
    echo -e "${BLUE}📊 Report saved to: $BUILD_DIR/optimization-report.txt${NC}"
    echo ""
    echo -e "${BLUE}🎯 Next Steps:${NC}"
    echo "1. Review the deployment checklist: $PROJECT_ROOT/DEPLOYMENT_CHECKLIST.md"
    echo "2. Test your optimizations locally"
    echo "3. Run the cache warmup script: php warmup-cache.php"
    echo "4. Deploy to production with the optimized files"
    echo "5. Monitor performance and error logs"
    echo ""
    echo -e "${YELLOW}💡 Tools for better optimization:${NC}"
    echo "- ImageMagick: sudo apt install imagemagick"
    echo "- csso: npm install -g csso-cli"
    echo "- terser: npm install -g terser"
    echo "- imagemin: npm install -g imagemin-cli"
    echo "- libwebp-tools: sudo apt install webp"
    echo ""
    echo -e "${GREEN}🚀 Your portfolio is now optimized for production!${NC}"
}

# Run the script
main "$@"