#!/bin/bash

# Portfolio Performance Optimization Script
# This script optimizes images, minifies CSS/JS, and sets up caching

echo "🚀 Starting Portfolio Performance Optimization..."

# Create optimization directories
mkdir -p storage/optimized/{css,js,images}

# Check if required tools are installed
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed. Please install it first."
        return 1
    fi
    return 0
}

# Image optimization (requires imagemagick)
optimize_images() {
    echo "🖼️  Optimizing images..."
    
    if check_tool "convert"; then
        # Optimize JPEG images
        find assets/images -name "*.jpg" -o -name "*.jpeg" | while read img; do
            filename=$(basename "$img")
            echo "  📸 Optimizing $filename..."
            convert "$img" -quality 85 -strip "storage/optimized/images/$filename"
        done
        
        # Optimize PNG images
        find assets/images -name "*.png" | while read img; do
            filename=$(basename "$img")
            echo "  📸 Optimizing $filename..."
            convert "$img" -strip "storage/optimized/images/$filename"
        done
        
        echo "✅ Image optimization complete!"
    else
        echo "⚠️  ImageMagick not found. Skipping image optimization."
    fi
}

# CSS minification
minify_css() {
    echo "🎨 Minifying CSS..."
    
    if check_tool "cleancss"; then
        cleancss -o storage/optimized/css/portfolio.min.css assets/css/portfolio.css
        echo "✅ CSS minification complete!"
    else
        echo "⚠️  clean-css not found. Install with: npm install -g clean-css-cli"
        # Fallback: simple minification
        cat assets/css/portfolio.css | tr -d '\n\t' | sed 's/  */ /g' > storage/optimized/css/portfolio.min.css
        echo "✅ Basic CSS minification complete!"
    fi
}

# JavaScript minification
minify_js() {
    echo "📜 Minifying JavaScript..."
    
    if check_tool "uglifyjs"; then
        uglifyjs assets/js/portfolio.js -o storage/optimized/js/portfolio.min.js -c -m
        uglifyjs assets/js/testimonials.js -o storage/optimized/js/testimonials.min.js -c -m
        uglifyjs assets/js/main.js -o storage/optimized/js/main.min.js -c -m
        echo "✅ JavaScript minification complete!"
    else
        echo "⚠️  UglifyJS not found. Install with: npm install -g uglify-js"
        # Fallback: copy files
        cp assets/js/*.js storage/optimized/js/
        echo "✅ JavaScript files copied (not minified)!"
    fi
}

# Generate performance report
generate_report() {
    echo "📊 Generating performance report..."
    
    report_file="storage/performance_report.txt"
    echo "Portfolio Performance Report - $(date)" > $report_file
    echo "=====================================" >> $report_file
    echo "" >> $report_file
    
    # File sizes
    echo "Original File Sizes:" >> $report_file
    echo "CSS: $(du -h assets/css/portfolio.css | cut -f1)" >> $report_file
    echo "JS Total: $(du -ch assets/js/*.js | tail -1 | cut -f1)" >> $report_file
    echo "Images: $(du -sh assets/images | cut -f1)" >> $report_file
    echo "" >> $report_file
    
    if [ -d "storage/optimized" ]; then
        echo "Optimized File Sizes:" >> $report_file
        if [ -f "storage/optimized/css/portfolio.min.css" ]; then
            echo "CSS: $(du -h storage/optimized/css/portfolio.min.css | cut -f1)" >> $report_file
        fi
        if [ -d "storage/optimized/js" ]; then
            echo "JS Total: $(du -ch storage/optimized/js/*.js | tail -1 | cut -f1)" >> $report_file
        fi
        if [ -d "storage/optimized/images" ]; then
            echo "Images: $(du -sh storage/optimized/images | cut -f1)" >> $report_file
        fi
    fi
    
    echo "✅ Performance report saved to $report_file"
}

# Create .htaccess for Apache (caching and compression)
create_htaccess() {
    echo "⚙️  Creating .htaccess for caching..."
    
    cat > .htaccess << 'EOF'
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
    
    echo "✅ .htaccess created for Apache optimization!"
}

# Main execution
main() {
    echo "Starting optimization process..."
    echo ""
    
    optimize_images
    echo ""
    
    minify_css
    echo ""
    
    minify_js
    echo ""
    
    generate_report
    echo ""
    
    create_htaccess
    echo ""
    
    echo "🎉 Portfolio optimization complete!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Test your website with the optimized files"
    echo "2. Update your HTML to use minified files (if desired)"
    echo "3. Check the performance report in storage/performance_report.txt"
    echo "4. Consider setting up a CDN for static assets"
    echo ""
    echo "💡 Tools to install for better optimization:"
    echo "- ImageMagick: sudo apt install imagemagick"
    echo "- clean-css: npm install -g clean-css-cli"
    echo "- uglify-js: npm install -g uglify-js"
}

# Run the script
main
