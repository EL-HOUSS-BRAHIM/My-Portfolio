#!/bin/bash

# Advanced Image Optimization Script
# Provides WebP conversion, compression, and responsive image generation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SOURCE_DIR="${1:-assets/images}"
OUTPUT_DIR="storage/optimized/images"
WEBP_QUALITY=85
JPEG_QUALITY=85
PNG_QUALITY=90

# Responsive sizes
declare -A SIZES=(
    ["xs"]=320
    ["sm"]=768
    ["md"]=1024
    ["lg"]=1440
    ["xl"]=1920
)

echo -e "${BLUE}🖼️  Image Optimization System${NC}"
echo "============================"
echo ""

# Check dependencies
check_dependencies() {
    local deps=("imagemagick" "cwebp")
    local missing=()
    
    # Check ImageMagick
    if ! command -v convert &> /dev/null; then
        missing+=("imagemagick")
    fi
    
    # Check WebP tools
    if ! command -v cwebp &> /dev/null; then
        missing+=("webp-tools")
    fi
    
    if [ ${#missing[@]} -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Missing dependencies: ${missing[*]}${NC}"
        echo "Installing required packages..."
        
        if command -v apt-get &> /dev/null; then
            sudo apt-get update
            sudo apt-get install -y imagemagick webp
        elif command -v yum &> /dev/null; then
            sudo yum install -y ImageMagick libwebp-tools
        elif command -v brew &> /dev/null; then
            brew install imagemagick webp
        else
            echo -e "${RED}❌ Cannot install dependencies automatically. Please install manually:${NC}"
            echo "   - ImageMagick (convert command)"
            echo "   - WebP tools (cwebp command)"
            exit 1
        fi
    fi
}

# Create output directory
setup_directories() {
    mkdir -p "$OUTPUT_DIR"
    mkdir -p "$OUTPUT_DIR/responsive"
    mkdir -p "$OUTPUT_DIR/webp"
}

# Process a single image
process_image() {
    local input_file="$1"
    local filename=$(basename "$input_file")
    local name="${filename%.*}"
    local ext="${filename##*.}"
    
    echo -e "${BLUE}🔄 Processing: $filename${NC}"
    
    # Validate image
    if ! identify "$input_file" &> /dev/null; then
        echo -e "${RED}❌ Invalid image: $filename${NC}"
        return 1
    fi
    
    # Get original dimensions
    local dimensions=$(identify -format "%wx%h" "$input_file")
    local original_width=$(echo $dimensions | cut -d'x' -f1)
    local original_size=$(stat -f%z "$input_file" 2>/dev/null || stat -c%s "$input_file")
    
    echo "   📏 Original: ${dimensions} ($(format_bytes $original_size))"
    
    # Generate responsive sizes
    for size_name in "${!SIZES[@]}"; do
        local max_width=${SIZES[$size_name]}
        
        # Skip if original is smaller than target
        if [ "$original_width" -le "$max_width" ]; then
            max_width=$original_width
        fi
        
        # Generate optimized original format
        local output_file="$OUTPUT_DIR/responsive/${name}-${size_name}.${ext}"
        
        case "${ext,,}" in
            jpg|jpeg)
                convert "$input_file" -resize "${max_width}x>" -quality $JPEG_QUALITY -strip "$output_file"
                ;;
            png)
                convert "$input_file" -resize "${max_width}x>" -quality $PNG_QUALITY -strip "$output_file"
                ;;
            *)
                convert "$input_file" -resize "${max_width}x>" -strip "$output_file"
                ;;
        esac
        
        # Generate WebP version
        local webp_file="$OUTPUT_DIR/webp/${name}-${size_name}.webp"
        cwebp -q $WEBP_QUALITY "$output_file" -o "$webp_file" &> /dev/null
        
        local optimized_size=$(stat -f%z "$output_file" 2>/dev/null || stat -c%s "$output_file")
        local webp_size=$(stat -f%z "$webp_file" 2>/dev/null || stat -c%s "$webp_file")
        
        echo "   📱 ${size_name}: $(format_bytes $optimized_size) | WebP: $(format_bytes $webp_size)"
    done
    
    # Generate full-size optimized version
    local full_output="$OUTPUT_DIR/${name}.${ext}"
    local full_webp="$OUTPUT_DIR/webp/${name}.webp"
    
    case "${ext,,}" in
        jpg|jpeg)
            convert "$input_file" -quality $JPEG_QUALITY -strip "$full_output"
            ;;
        png)
            convert "$input_file" -quality $PNG_QUALITY -strip "$full_output"
            ;;
        *)
            convert "$input_file" -strip "$full_output"
            ;;
    esac
    
    cwebp -q $WEBP_QUALITY "$full_output" -o "$full_webp" &> /dev/null
    
    echo -e "${GREEN}   ✅ Completed${NC}"
    return 0
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

# Generate lazy loading JavaScript
generate_lazy_loading() {
    cat > "$OUTPUT_DIR/lazy-loader.js" << 'EOF'
/**
 * Lightweight Lazy Loading System
 */
class LazyLoader {
    constructor() {
        this.images = document.querySelectorAll('[data-lazy]');
        this.init();
    }
    
    init() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver(this.handleIntersection.bind(this), {
                rootMargin: '50px 0px',
                threshold: 0.01
            });
            
            this.images.forEach(img => this.observer.observe(img));
        } else {
            this.loadAllImages();
        }
    }
    
    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.loadImage(entry.target);
                this.observer.unobserve(entry.target);
            }
        });
    }
    
    loadImage(img) {
        if (this.supportsWebP() && img.dataset.webp) {
            img.src = img.dataset.webp;
        } else if (img.dataset.src) {
            img.src = img.dataset.src;
        }
        
        img.classList.add('loaded');
        img.removeAttribute('data-lazy');
    }
    
    supportsWebP() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }
    
    loadAllImages() {
        this.images.forEach(img => this.loadImage(img));
    }
}

document.addEventListener('DOMContentLoaded', () => new LazyLoader());
EOF

    echo -e "${GREEN}📄 Generated lazy loading script${NC}"
}

# Generate responsive CSS
generate_responsive_css() {
    cat > "$OUTPUT_DIR/responsive-images.css" << 'EOF'
/* Responsive Image System */
.responsive-image {
    max-width: 100%;
    height: auto;
    display: block;
}

.responsive-image[data-lazy] {
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
    min-height: 200px;
}

.responsive-image.loaded {
    opacity: 1;
    animation: none;
    background: none;
}

@keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

/* Picture element responsive styles */
picture {
    display: block;
    width: 100%;
}

picture img {
    width: 100%;
    height: auto;
}
EOF

    echo -e "${GREEN}📄 Generated responsive CSS${NC}"
}

# Main execution
main() {
    if [ ! -d "$SOURCE_DIR" ]; then
        echo -e "${RED}❌ Source directory not found: $SOURCE_DIR${NC}"
        exit 1
    fi
    
    check_dependencies
    setup_directories
    
    local processed=0
    local errors=0
    
    echo "📁 Processing images from: $SOURCE_DIR"
    echo ""
    
    # Find and process all images
    find "$SOURCE_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.gif" \) | while read -r image; do
        if process_image "$image"; then
            ((processed++))
        else
            ((errors++))
        fi
    done
    
    generate_lazy_loading
    generate_responsive_css
    
    echo ""
    echo -e "${GREEN}🎉 Image optimization complete!${NC}"
    echo "📁 Optimized images saved to: $OUTPUT_DIR"
    echo "📄 Integration files:"
    echo "   - lazy-loader.js"
    echo "   - responsive-images.css"
}

# Run main function
main "$@"