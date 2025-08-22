#!/bin/bash

# Cache Cleanup Script
# Cleans expired cache entries and optimizes cache storage

PROJECT_ROOT="/home/bross/Desktop/My-Portfolio"
CACHE_DIR="${PROJECT_ROOT}/storage/cache"
LOG_FILE="${PROJECT_ROOT}/storage/logs/cache-cleanup.log"

echo "$(date): Starting cache cleanup..." >> "$LOG_FILE"

# Function to clean expired cache files
clean_expired_cache() {
    local cache_type="$1"
    local type_dir="${CACHE_DIR}/${cache_type}"
    local cleaned=0
    
    if [[ -d "$type_dir" ]]; then
        echo "Cleaning ${cache_type} cache..."
        
        # Find and process cache files
        find "$type_dir" -name "*.cache" -type f | while read -r cache_file; do
            # Check if file is older than TTL
            if php -r "
                \$data = json_decode(file_get_contents('$cache_file'), true);
                if (\$data && isset(\$data['expires']) && time() > \$data['expires']) {
                    unlink('$cache_file');
                    echo 'expired';
                } else {
                    echo 'valid';
                }
            " | grep -q "expired"; then
                cleaned=$((cleaned + 1))
            fi
        done
        
        echo "$(date): Cleaned $cleaned expired ${cache_type} cache files" >> "$LOG_FILE"
    fi
}

# Clean each cache type
for cache_type in config database testimonials api templates; do
    clean_expired_cache "$cache_type"
done

# Clean empty directories
find "$CACHE_DIR" -type d -empty -delete 2>/dev/null || true

# Generate cache statistics
echo "$(date): Generating cache statistics..." >> "$LOG_FILE"
php "${PROJECT_ROOT}/scripts/cache-stats.php" >> "$LOG_FILE" 2>&1

echo "$(date): Cache cleanup completed" >> "$LOG_FILE"
