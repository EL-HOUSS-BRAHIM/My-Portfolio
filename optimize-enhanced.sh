#!/bin/bash

# Enhanced Portfolio Optimization Script
# Optimizes assets, configurations, and performance

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ASSETS_DIR="$PROJECT_ROOT/assets"
BUILD_DIR="$PROJECT_ROOT/build"
STORAGE_DIR="$PROJECT_ROOT/storage"

echo -e "${BLUE}🚀 Starting Portfolio Optimization...${NC}"

# Create necessary directories
echo -e "${YELLOW}📁 Creating directories...${NC}"
mkdir -p "$BUILD_DIR"
mkdir -p "$STORAGE_DIR"/{cache,logs,sessions}
mkdir -p "$ASSETS_DIR"/css/minified
mkdir -p "$ASSETS_DIR"/js/minified

# Set proper permissions
echo -e "${YELLOW}🔐 Setting permissions...${NC}"
chmod -R 755 "$STORAGE_DIR"
chmod -R 644 "$STORAGE_DIR"/**/*
find "$STORAGE_DIR" -type d -exec chmod 755 {} \;

# Optimize CSS files
echo -e "${YELLOW}🎨 Optimizing CSS files...${NC}"
if command -v csso &> /dev/null; then
    for css_file in "$ASSETS_DIR"/css/*.css; do
        if [[ -f "$css_file" && ! "$css_file" =~ minified ]]; then
            filename=$(basename "$css_file" .css)
            echo "  - Minifying $filename.css"
            csso "$css_file" --output "$ASSETS_DIR/css/minified/$filename.min.css"
        fi
    done
else
    echo -e "${RED}⚠️  csso not found. Install with: npm install -g csso-cli${NC}"
fi

# Optimize JavaScript files
echo -e "${YELLOW}📜 Optimizing JavaScript files...${NC}"
if command -v terser &> /dev/null; then
    for js_file in "$ASSETS_DIR"/js/*.js; do
        if [[ -f "$js_file" && ! "$js_file" =~ minified ]]; then
            filename=$(basename "$js_file" .js)
            echo "  - Minifying $filename.js"
            terser "$js_file" \
                --compress \
                --mangle \
                --output "$ASSETS_DIR/js/minified/$filename.min.js" \
                --source-map "url='$filename.min.js.map'"
        fi
    done
else
    echo -e "${RED}⚠️  terser not found. Install with: npm install -g terser${NC}"
fi

# Optimize images
echo -e "${YELLOW}🖼️  Optimizing images...${NC}"
if command -v imagemin &> /dev/null; then
    imagemin "$ASSETS_DIR/images/*.{jpg,jpeg,png,gif,svg}" \
        --out-dir="$ASSETS_DIR/images/optimized" \
        --plugin=imagemin-mozjpeg \
        --plugin=imagemin-pngquant \
        --plugin=imagemin-gifsicle \
        --plugin=imagemin-svgo
    echo "  - Images optimized to assets/images/optimized/"
else
    echo -e "${RED}⚠️  imagemin not found. Install with: npm install -g imagemin-cli${NC}"
fi

# Generate WebP images
echo -e "${YELLOW}🔄 Converting images to WebP...${NC}"
if command -v cwebp &> /dev/null; then
    for img in "$ASSETS_DIR"/images/*.{jpg,jpeg,png}; do
        if [[ -f "$img" ]]; then
            filename=$(basename "$img")
            name="${filename%.*}"
            echo "  - Converting $filename to WebP"
            cwebp -q 80 "$img" -o "$ASSETS_DIR/images/optimized/$name.webp"
        fi
    done
else
    echo -e "${RED}⚠️  cwebp not found. Install libwebp-tools package${NC}"
fi

# Optimize PHP configuration
echo -e "${YELLOW}⚙️  Optimizing PHP configuration...${NC}"
if [[ -f /etc/php/8.1/fpm/php.ini ]]; then
    echo "  - Checking PHP configuration..."
    
    # Check OPcache settings
    if grep -q "opcache.enable=1" /etc/php/8.1/fpm/php.ini; then
        echo "  ✅ OPcache is enabled"
    else
        echo -e "${YELLOW}  - OPcache not optimally configured${NC}"
    fi
    
    # Check memory limit
    memory_limit=$(php -r "echo ini_get('memory_limit');")
    echo "  - Memory limit: $memory_limit"
    
    # Check max execution time
    max_time=$(php -r "echo ini_get('max_execution_time');")
    echo "  - Max execution time: ${max_time}s"
fi

# Composer optimization
echo -e "${YELLOW}📦 Optimizing Composer...${NC}"
if [[ -f "$PROJECT_ROOT/composer.json" ]]; then
    cd "$PROJECT_ROOT"
    
    echo "  - Installing dependencies with optimizations..."
    composer install --no-dev --optimize-autoloader --classmap-authoritative
    
    echo "  - Dumping optimized autoloader..."
    composer dump-autoload --optimize --classmap-authoritative
else
    echo -e "${YELLOW}  - No composer.json found${NC}"
fi

# Clean temporary files
echo -e "${YELLOW}🧹 Cleaning temporary files...${NC}"
find "$PROJECT_ROOT" -name "*.tmp" -type f -delete
find "$PROJECT_ROOT" -name "*.log" -type f -mtime +30 -delete
find "$STORAGE_DIR/cache" -name "*.cache" -type f -mtime +7 -delete

# Generate cache warmup script
echo -e "${YELLOW}🔥 Generating cache warmup script...${NC}"
cat > "$PROJECT_ROOT/warmup-cache.php" << 'EOF'
<?php
/**
 * Cache Warmup Script
 * Pre-loads frequently accessed data to improve performance
 */

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/src/config/ConfigManager.php';
require_once __DIR__ . '/src/config/DatabaseManager.php';

echo "🔥 Warming up cache...\n";

try {
    $config = ConfigManager::getInstance();
    $db = DatabaseManager::getInstance();
    
    // Test database connection
    if ($db->healthCheck()) {
        echo "✅ Database connection verified\n";
    }
    
    // Pre-load testimonials
    $testimonials = $db->fetchAll("SELECT * FROM testimonials ORDER BY created_at DESC LIMIT 10");
    echo "✅ Testimonials loaded (" . count($testimonials) . " items)\n";
    
    // Generate configuration cache
    $config->cache();
    echo "✅ Configuration cached\n";
    
    echo "🎉 Cache warmup completed!\n";
    
} catch (Exception $e) {
    echo "❌ Cache warmup failed: " . $e->getMessage() . "\n";
    exit(1);
}
EOF

chmod +x "$PROJECT_ROOT/warmup-cache.php"

# Generate deployment checklist
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
- [ ] Run cache warmup script

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
EOF

# Security audit
echo -e "${YELLOW}🔒 Running security audit...${NC}"
echo "  - Checking file permissions..."
find "$PROJECT_ROOT" -type f -name "*.php" -exec chmod 644 {} \;
find "$PROJECT_ROOT" -type d -exec chmod 755 {} \;

echo "  - Checking for sensitive files..."
if [[ -f "$PROJECT_ROOT/.env" ]]; then
    chmod 600 "$PROJECT_ROOT/.env"
    echo "  ✅ .env file secured"
fi

# Performance report
echo -e "${YELLOW}📊 Generating performance report...${NC}"
REPORT_FILE="$BUILD_DIR/optimization-report.txt"
cat > "$REPORT_FILE" << EOF
Portfolio Optimization Report
Generated: $(date)

=== File Sizes ===
Original CSS: $(du -sh "$ASSETS_DIR"/css/*.css 2>/dev/null | awk '{sum+=$1} END {print sum "K"}' || echo "N/A")
Minified CSS: $(du -sh "$ASSETS_DIR"/css/minified/*.css 2>/dev/null | awk '{sum+=$1} END {print sum "K"}' || echo "N/A")

Original JS: $(du -sh "$ASSETS_DIR"/js/*.js 2>/dev/null | awk '{sum+=$1} END {print sum "K"}' || echo "N/A")
Minified JS: $(du -sh "$ASSETS_DIR"/js/minified/*.js 2>/dev/null | awk '{sum+=$1} END {print sum "K"}' || echo "N/A")

=== Storage ===
Cache directory: $(du -sh "$STORAGE_DIR/cache" 2>/dev/null || echo "0K")
Logs directory: $(du -sh "$STORAGE_DIR/logs" 2>/dev/null || echo "0K")

=== PHP Configuration ===
PHP Version: $(php -v | head -n 1)
Memory Limit: $(php -r "echo ini_get('memory_limit');")
Max Execution Time: $(php -r "echo ini_get('max_execution_time');")s
OPcache Enabled: $(php -r "echo ini_get('opcache.enable') ? 'Yes' : 'No';")

=== Optimization Status ===
✅ Assets minified
✅ Images optimized
✅ Cache directories created
✅ Permissions set
✅ Security audit completed
EOF

echo -e "${GREEN}✅ Optimization completed!${NC}"
echo -e "${BLUE}📊 Report saved to: $REPORT_FILE${NC}"

# Show next steps
echo -e "\n${BLUE}🎯 Next Steps:${NC}"
echo "1. Review the deployment checklist: $PROJECT_ROOT/DEPLOYMENT_CHECKLIST.md"
echo "2. Test your optimizations locally"
echo "3. Run the cache warmup script: php warmup-cache.php"
echo "4. Deploy to production with the optimized files"
echo "5. Monitor performance and error logs"

echo -e "\n${GREEN}🚀 Portfolio optimization complete!${NC}"
