#!/bin/bash

# Advanced CSS/JS Asset Optimization System
# Provides minification, critical CSS, asset versioning, and compression

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CSS_DIR="assets/css"
JS_DIR="assets/js-clean"
OUTPUT_DIR="storage/optimized/assets"
CRITICAL_CSS_FILE="$OUTPUT_DIR/critical.css"
MANIFEST_FILE="$OUTPUT_DIR/asset-manifest.json"

echo -e "${BLUE}⚡ Asset Optimization System${NC}"
echo "============================"
echo ""

# Check dependencies
check_dependencies() {
    local deps_missing=()
    
    # Check for Node.js/npm (for CSS/JS minification tools)
    if ! command -v npm &> /dev/null; then
        deps_missing+=("npm")
    fi
    
    # Check for critical CSS extraction tool (can install if needed)
    if ! command -v critical &> /dev/null && ! npm list -g critical &> /dev/null; then
        echo -e "${YELLOW}⚠️  Installing critical CSS tool...${NC}"
        npm install -g critical &> /dev/null || echo "Could not install critical CSS tool globally"
    fi
    
    if [ ${#deps_missing[@]} -gt 0 ]; then
        echo -e "${RED}❌ Missing dependencies: ${deps_missing[*]}${NC}"
        echo "Please install the missing dependencies and try again."
        exit 1
    fi
}

# Setup directories
setup_directories() {
    mkdir -p "$OUTPUT_DIR/css"
    mkdir -p "$OUTPUT_DIR/js"
    mkdir -p "$OUTPUT_DIR/css/minified"
    mkdir -p "$OUTPUT_DIR/js/minified"
}

# Generate asset hash for versioning
generate_hash() {
    local file="$1"
    if command -v sha256sum &> /dev/null; then
        echo $(sha256sum "$file" | cut -d' ' -f1 | head -c 8)
    else
        echo $(openssl dgst -sha256 "$file" | cut -d' ' -f2 | head -c 8)
    fi
}

# Minify CSS files
minify_css() {
    echo -e "${BLUE}🎨 Optimizing CSS files...${NC}"
    
    local css_files=()
    local total_original_size=0
    local total_minified_size=0
    
    # Find all CSS files
    find "$CSS_DIR" -name "*.css" -type f | while read -r css_file; do
        local filename=$(basename "$css_file")
        local name="${filename%.*}"
        local original_size=$(stat -f%z "$css_file" 2>/dev/null || stat -c%s "$css_file")
        
        echo "   🔄 Processing: $filename"
        
        # Copy original to output directory
        cp "$css_file" "$OUTPUT_DIR/css/$filename"
        
        # Simple CSS minification using sed/tr (fallback if no advanced tools)
        cat "$css_file" | \
            sed 's/\/\*[^*]*\*\///g' | \
            sed 's/[[:space:]]*{[[:space:]]*/{ /g' | \
            sed 's/[[:space:]]*}[[:space:]]*/} /g' | \
            sed 's/[[:space:]]*:[[:space:]]*/: /g' | \
            sed 's/[[:space:]]*;[[:space:]]*/; /g' | \
            sed 's/[[:space:]]*,[[:space:]]*/, /g' | \
            tr -d '\n' | \
            sed 's/[[:space:]]\+/ /g' | \
            sed 's/{ /{\n/g' | \
            sed 's/} /}\n/g' > "$OUTPUT_DIR/css/minified/${name}.min.css"
        
        # Generate versioned filename
        local hash=$(generate_hash "$OUTPUT_DIR/css/minified/${name}.min.css")
        local versioned_name="${name}.${hash}.min.css"
        cp "$OUTPUT_DIR/css/minified/${name}.min.css" "$OUTPUT_DIR/css/minified/$versioned_name"
        
        local minified_size=$(stat -f%z "$OUTPUT_DIR/css/minified/${name}.min.css" 2>/dev/null || stat -c%s "$OUTPUT_DIR/css/minified/${name}.min.css")
        local savings=$((original_size - minified_size))
        local percent_saved=$((savings * 100 / original_size))
        
        echo "      📊 Original: $(format_bytes $original_size) → Minified: $(format_bytes $minified_size) (${percent_saved}% saved)"
        
        # Update manifest
        echo "\"$filename\": {" >> "$MANIFEST_FILE.tmp"
        echo "  \"original\": \"css/$filename\"," >> "$MANIFEST_FILE.tmp"
        echo "  \"minified\": \"css/minified/${name}.min.css\"," >> "$MANIFEST_FILE.tmp"
        echo "  \"versioned\": \"css/minified/$versioned_name\"," >> "$MANIFEST_FILE.tmp"
        echo "  \"hash\": \"$hash\"," >> "$MANIFEST_FILE.tmp"
        echo "  \"size_original\": $original_size," >> "$MANIFEST_FILE.tmp"
        echo "  \"size_minified\": $minified_size" >> "$MANIFEST_FILE.tmp"
        echo "}," >> "$MANIFEST_FILE.tmp"
    done
}

# Minify JavaScript files
minify_js() {
    echo -e "${BLUE}⚙️  Optimizing JavaScript files...${NC}"
    
    find "$JS_DIR" -name "*.js" -type f | while read -r js_file; do
        local filename=$(basename "$js_file")
        local name="${filename%.*}"
        local original_size=$(stat -f%z "$js_file" 2>/dev/null || stat -c%s "$js_file")
        
        echo "   🔄 Processing: $filename"
        
        # Copy original to output directory
        cp "$js_file" "$OUTPUT_DIR/js/$filename"
        
        # Simple JavaScript minification using sed/tr
        cat "$js_file" | \
            sed 's/\/\/.*$//g' | \
            sed 's/\/\*[^*]*\*\///g' | \
            sed 's/[[:space:]]*{[[:space:]]*/{ /g' | \
            sed 's/[[:space:]]*}[[:space:]]*/} /g' | \
            sed 's/[[:space:]]*([[:space:]]*/(/g' | \
            sed 's/[[:space:]]*)[[:space:]]*/)/g' | \
            sed 's/[[:space:]]*;[[:space:]]*/; /g' | \
            sed 's/[[:space:]]*,[[:space:]]*/,/g' | \
            tr -d '\n' | \
            sed 's/[[:space:]]\+/ /g' > "$OUTPUT_DIR/js/minified/${name}.min.js"
        
        # Generate versioned filename
        local hash=$(generate_hash "$OUTPUT_DIR/js/minified/${name}.min.js")
        local versioned_name="${name}.${hash}.min.js"
        cp "$OUTPUT_DIR/js/minified/${name}.min.js" "$OUTPUT_DIR/js/minified/$versioned_name"
        
        local minified_size=$(stat -f%z "$OUTPUT_DIR/js/minified/${name}.min.js" 2>/dev/null || stat -c%s "$OUTPUT_DIR/js/minified/${name}.min.js")
        local savings=$((original_size - minified_size))
        local percent_saved=$((savings * 100 / original_size))
        
        echo "      📊 Original: $(format_bytes $original_size) → Minified: $(format_bytes $minified_size) (${percent_saved}% saved)"
    done
}

# Extract critical CSS
extract_critical_css() {
    echo -e "${BLUE}🎯 Extracting critical CSS...${NC}"
    
    # Create a basic critical CSS by extracting key selectors
    cat > "$CRITICAL_CSS_FILE" << 'EOF'
/* Critical CSS - Above the fold styles */
*,*::before,*::after{box-sizing:border-box}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;line-height:1.6}
.header{position:fixed;top:0;width:100%;background:rgba(255,255,255,0.95);backdrop-filter:blur(10px);z-index:1000}
.hero{min-height:100vh;display:flex;align-items:center;justify-content:center}
.container{max-width:1200px;margin:0 auto;padding:0 1rem}
.loading{opacity:0;transform:translateY(20px);transition:all 0.6s ease}
.loaded{opacity:1;transform:translateY(0)}
EOF

    # Extract critical styles from main CSS files
    if [ -f "$CSS_DIR/base.css" ]; then
        grep -E "(body|html|header|nav|hero|container)" "$CSS_DIR/base.css" | head -20 >> "$CRITICAL_CSS_FILE"
    fi
    
    echo "   ✅ Critical CSS extracted to: $CRITICAL_CSS_FILE"
}

# Create asset loading optimization
create_asset_loader() {
    echo -e "${BLUE}📦 Creating asset loader...${NC}"
    
    cat > "$OUTPUT_DIR/asset-loader.js" << 'EOF'
/**
 * Advanced Asset Loader
 * Handles efficient loading of CSS/JS with fallbacks
 */
class AssetLoader {
    constructor() {
        this.loadedAssets = new Set();
        this.loadingPromises = new Map();
    }
    
    async loadCSS(href, media = 'all') {
        if (this.loadedAssets.has(href)) {
            return Promise.resolve();
        }
        
        if (this.loadingPromises.has(href)) {
            return this.loadingPromises.get(href);
        }
        
        const promise = new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.media = media;
            
            link.onload = () => {
                this.loadedAssets.add(href);
                resolve();
            };
            
            link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));
            
            document.head.appendChild(link);
        });
        
        this.loadingPromises.set(href, promise);
        return promise;
    }
    
    async loadJS(src) {
        if (this.loadedAssets.has(src)) {
            return Promise.resolve();
        }
        
        if (this.loadingPromises.has(src)) {
            return this.loadingPromises.get(src);
        }
        
        const promise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            
            script.onload = () => {
                this.loadedAssets.add(src);
                resolve();
            };
            
            script.onerror = () => reject(new Error(`Failed to load JS: ${src}`));
            
            document.head.appendChild(script);
        });
        
        this.loadingPromises.set(src, promise);
        return promise;
    }
    
    preloadAsset(href, as = 'style') {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = href;
        link.as = as;
        document.head.appendChild(link);
    }
    
    async loadCriticalCSS() {
        const criticalCSS = await fetch('/storage/optimized/assets/critical.css');
        const css = await criticalCSS.text();
        
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }
}

// Initialize asset loader
window.AssetLoader = new AssetLoader();

// Load critical CSS immediately
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.AssetLoader.loadCriticalCSS();
    });
} else {
    window.AssetLoader.loadCriticalCSS();
}
EOF

    echo "   ✅ Asset loader created"
}

# Create compression script
create_compression_script() {
    echo -e "${BLUE}🗜️  Creating compression utilities...${NC}"
    
    cat > "$OUTPUT_DIR/compress-assets.sh" << 'EOF'
#!/bin/bash
# Compress assets with gzip and brotli

find . -type f \( -name "*.css" -o -name "*.js" \) | while read -r file; do
    # Gzip compression
    if command -v gzip &> /dev/null; then
        gzip -k -9 "$file"
    fi
    
    # Brotli compression (if available)
    if command -v brotli &> /dev/null; then
        brotli -k -q 11 "$file"
    fi
done
EOF

    chmod +x "$OUTPUT_DIR/compress-assets.sh"
    echo "   ✅ Compression script created"
}

# Format bytes for human readable output
format_bytes() {
    local bytes=$1
    local units=("B" "KB" "MB" "GB")
    local unit=0
    
    while [ $bytes -ge 1024 ] && [ $unit -lt 3 ]; do
        bytes=$((bytes / 1024))
        unit=$((unit + 1))
    done
    
    echo "${bytes}${units[$unit]}"
}

# Generate final manifest
generate_manifest() {
    echo -e "${BLUE}📄 Generating asset manifest...${NC}"
    
    # Start manifest file
    cat > "$MANIFEST_FILE" << EOF
{
  "generated_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "assets": {
EOF

    # Add CSS assets
    if [ -f "$MANIFEST_FILE.tmp" ]; then
        cat "$MANIFEST_FILE.tmp" >> "$MANIFEST_FILE"
        rm "$MANIFEST_FILE.tmp"
    fi

    # Close manifest
    cat >> "$MANIFEST_FILE" << EOF
  },
  "critical_css": "critical.css",
  "asset_loader": "asset-loader.js"
}
EOF

    echo "   ✅ Asset manifest generated"
}

# Main execution
main() {
    if [ ! -d "$CSS_DIR" ] && [ ! -d "$JS_DIR" ]; then
        echo -e "${RED}❌ No asset directories found${NC}"
        exit 1
    fi
    
    check_dependencies
    setup_directories
    
    # Initialize manifest
    touch "$MANIFEST_FILE.tmp"
    
    echo "📁 Processing assets..."
    echo ""
    
    if [ -d "$CSS_DIR" ]; then
        minify_css
    fi
    
    if [ -d "$JS_DIR" ]; then
        minify_js
    fi
    
    extract_critical_css
    create_asset_loader
    create_compression_script
    generate_manifest
    
    echo ""
    echo -e "${GREEN}🎉 Asset optimization complete!${NC}"
    echo "📁 Optimized assets saved to: $OUTPUT_DIR"
    echo "📄 Files generated:"
    echo "   - Minified CSS/JS files"
    echo "   - Critical CSS extraction"
    echo "   - Asset loader script"
    echo "   - Compression utilities"
    echo "   - Asset manifest"
}

# Run main function
main "$@"