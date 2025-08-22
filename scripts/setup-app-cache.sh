#!/bin/bash

# Application Cache Setup Script
# Sets up comprehensive application-level caching for the portfolio

set -euo pipefail

PROJECT_ROOT="/home/bross/Desktop/My-Portfolio"
CACHE_DIR="${PROJECT_ROOT}/storage/cache"
LOGS_DIR="${PROJECT_ROOT}/storage/logs"

echo "🚀 Setting up application-level caching..."

# Ensure cache directories exist
echo "📁 Creating cache directories..."
mkdir -p "${CACHE_DIR}"/{config,database,testimonials,api,templates}
mkdir -p "${LOGS_DIR}"

# Set proper permissions
echo "🔐 Setting cache directory permissions..."
chmod -R 755 "${CACHE_DIR}"
chmod -R 755 "${LOGS_DIR}"

# Create cache configuration
echo "⚙️ Creating cache configuration..."
cat > "${PROJECT_ROOT}/config/cache.php" << 'EOF'
<?php

/**
 * Cache Configuration
 * 
 * Application-level caching settings
 */

return [
    // Default cache driver
    'default' => $_ENV['CACHE_DRIVER'] ?? 'file',
    
    // Cache stores configuration
    'stores' => [
        'file' => [
            'driver' => 'file',
            'path' => __DIR__ . '/../storage/cache',
            'ttl' => 3600, // 1 hour default
        ],
        
        'database' => [
            'driver' => 'database',
            'table' => 'cache',
            'ttl' => 3600,
        ],
        
        'memory' => [
            'driver' => 'array',
            'ttl' => 600, // 10 minutes
        ],
    ],
    
    // Cache type-specific settings
    'types' => [
        'config' => [
            'ttl' => 86400, // 24 hours
            'store' => 'file',
        ],
        
        'database' => [
            'ttl' => 3600, // 1 hour
            'store' => 'file',
        ],
        
        'testimonials' => [
            'ttl' => 1800, // 30 minutes
            'store' => 'file',
        ],
        
        'api' => [
            'ttl' => 300, // 5 minutes
            'store' => 'file',
        ],
        
        'templates' => [
            'ttl' => 7200, // 2 hours
            'store' => 'file',
        ],
    ],
    
    // Cache prefix
    'prefix' => $_ENV['CACHE_PREFIX'] ?? 'portfolio_',
    
    // Enable cache
    'enabled' => $_ENV['CACHE_ENABLED'] ?? true,
    
    // Cache statistics
    'stats' => [
        'enabled' => true,
        'file' => __DIR__ . '/../storage/logs/cache-stats.log',
    ],
    
    // Cache cleanup
    'cleanup' => [
        'auto' => true,
        'probability' => 2, // 2% chance on each request
        'expired_only' => true,
    ],
];
EOF

# Create cache cleanup script
echo "🧹 Creating cache cleanup script..."
cat > "${PROJECT_ROOT}/scripts/cache-cleanup.sh" << 'EOF'
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
EOF

chmod +x "${PROJECT_ROOT}/scripts/cache-cleanup.sh"

# Create cache statistics script
echo "📊 Creating cache statistics script..."
cat > "${PROJECT_ROOT}/scripts/cache-stats.php" << 'EOF'
<?php

/**
 * Cache Statistics Generator
 * 
 * Generates detailed cache statistics and performance metrics
 */

require_once __DIR__ . '/../src/cache/ApplicationCache.php';

use Portfolio\Cache\ApplicationCache;

$cache = new ApplicationCache();
$stats = $cache->getStats();

echo "=== Cache Statistics ===" . PHP_EOL;
echo "Generated at: " . date('Y-m-d H:i:s') . PHP_EOL;
echo "Total cache files: " . $stats['total_files'] . PHP_EOL;
echo "Total cache size: " . formatBytes($stats['total_size']) . PHP_EOL;
echo "Cache hits: " . ($stats['hits'] ?? 0) . PHP_EOL;
echo "Cache misses: " . ($stats['misses'] ?? 0) . PHP_EOL;
echo "Cache writes: " . ($stats['writes'] ?? 0) . PHP_EOL;
echo "Cache deletes: " . ($stats['deletes'] ?? 0) . PHP_EOL;
echo "Expired entries: " . ($stats['expired'] ?? 0) . PHP_EOL;
echo "Cleaned entries: " . ($stats['cleaned'] ?? 0) . PHP_EOL;

if (isset($stats['by_type'])) {
    echo PHP_EOL . "=== By Cache Type ===" . PHP_EOL;
    foreach ($stats['by_type'] as $type => $typeStats) {
        echo sprintf(
            "%s: %d files, %s",
            ucfirst($type),
            $typeStats['files'],
            formatBytes($typeStats['size'])
        ) . PHP_EOL;
    }
}

// Calculate hit rate
$totalRequests = ($stats['hits'] ?? 0) + ($stats['misses'] ?? 0);
if ($totalRequests > 0) {
    $hitRate = (($stats['hits'] ?? 0) / $totalRequests) * 100;
    echo PHP_EOL . "Cache hit rate: " . number_format($hitRate, 2) . "%" . PHP_EOL;
}

function formatBytes($bytes, $precision = 2) {
    $units = array('B', 'KB', 'MB', 'GB', 'TB');
    
    for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
        $bytes /= 1024;
    }
    
    return round($bytes, $precision) . ' ' . $units[$i];
}
EOF

# Create cache warming script
echo "🔥 Creating cache warming script..."
cat > "${PROJECT_ROOT}/scripts/cache-warm.php" << 'EOF'
<?php

/**
 * Cache Warming Script
 * 
 * Pre-loads frequently accessed data into cache to improve performance
 */

require_once __DIR__ . '/../src/cache/ApplicationCache.php';
require_once __DIR__ . '/../src/config/ConfigManager.php';
require_once __DIR__ . '/../src/testimonials/CachedTestimonialsManager.php';

echo "🔥 Starting cache warming..." . PHP_EOL;

try {
    // Warm configuration cache
    echo "⚙️ Warming configuration cache..." . PHP_EOL;
    $configManager = ConfigManager::getInstance();
    $configManager->loadFromCache() || $configManager->cache();
    
    // Warm testimonials cache
    echo "💬 Warming testimonials cache..." . PHP_EOL;
    $testimonialsManager = new CachedTestimonialsManager();
    $testimonialsManager->getAllTestimonials();
    $testimonialsManager->getApprovedTestimonials();
    $testimonialsManager->getTestimonialStats();
    
    echo "✅ Cache warming completed successfully!" . PHP_EOL;
    
} catch (Exception $e) {
    echo "❌ Cache warming failed: " . $e->getMessage() . PHP_EOL;
    exit(1);
}
EOF

# Create cache test script
echo "🧪 Creating cache test script..."
cat > "${PROJECT_ROOT}/scripts/cache-test.php" << 'EOF'
<?php

/**
 * Cache Test Script
 * 
 * Tests cache functionality and performance
 */

require_once __DIR__ . '/../src/cache/ApplicationCache.php';

use Portfolio\Cache\ApplicationCache;

echo "🧪 Testing application cache..." . PHP_EOL;

$cache = new ApplicationCache();

// Test basic operations
echo "Testing basic cache operations..." . PHP_EOL;

// Test set/get
$testData = ['test' => 'data', 'timestamp' => time()];
$cache->set('test_key', $testData, 60, 'api');

$retrieved = $cache->get('test_key', 'api');
if ($retrieved === $testData) {
    echo "✅ Set/Get test passed" . PHP_EOL;
} else {
    echo "❌ Set/Get test failed" . PHP_EOL;
}

// Test has
if ($cache->has('test_key', 'api')) {
    echo "✅ Has test passed" . PHP_EOL;
} else {
    echo "❌ Has test failed" . PHP_EOL;
}

// Test remember pattern
$remembered = $cache->remember('remember_test', function() {
    return 'remembered_value';
}, 60, 'api');

if ($remembered === 'remembered_value') {
    echo "✅ Remember test passed" . PHP_EOL;
} else {
    echo "❌ Remember test failed" . PHP_EOL;
}

// Test delete
$cache->delete('test_key', 'api');
if (!$cache->has('test_key', 'api')) {
    echo "✅ Delete test passed" . PHP_EOL;
} else {
    echo "❌ Delete test failed" . PHP_EOL;
}

// Performance test
echo "Running performance test..." . PHP_EOL;
$startTime = microtime(true);

for ($i = 0; $i < 1000; $i++) {
    $cache->set("perf_test_$i", "test_data_$i", 300, 'api');
}

$setTime = microtime(true) - $startTime;

$startTime = microtime(true);

for ($i = 0; $i < 1000; $i++) {
    $cache->get("perf_test_$i", 'api');
}

$getTime = microtime(true) - $startTime;

echo "✅ Performance test completed:" . PHP_EOL;
echo "   Set 1000 items: " . number_format($setTime * 1000, 2) . "ms" . PHP_EOL;
echo "   Get 1000 items: " . number_format($getTime * 1000, 2) . "ms" . PHP_EOL;

// Cleanup performance test data
for ($i = 0; $i < 1000; $i++) {
    $cache->delete("perf_test_$i", 'api');
}

echo "🎉 All cache tests completed!" . PHP_EOL;
EOF

# Update .htaccess for cache headers (if using Apache)
if command -v apache2 &> /dev/null || command -v httpd &> /dev/null; then
    echo "🌐 Updating .htaccess for cache headers..."
    
    # Add cache headers for dynamic content
    cat >> "${PROJECT_ROOT}/.htaccess" << 'EOF'

# Application Cache Headers
<IfModule mod_headers.c>
    # Cache dynamic API responses
    <Files "*.php">
        <If "%{QUERY_STRING} =~ /api/">
            Header set Cache-Control "private, max-age=300"
            Header set Vary "Accept-Encoding"
        </If>
    </Files>
    
    # Cache control for AJAX requests
    <If "%{HTTP:X-Requested-With} == 'XMLHttpRequest'">
        Header set Cache-Control "private, max-age=60"
    </If>
</IfModule>

EOF
fi

# Create systemd timer for cache cleanup (optional)
if command -v systemctl &> /dev/null; then
    echo "⏰ Creating systemd timer for cache cleanup..."
    
    sudo tee /etc/systemd/system/portfolio-cache-cleanup.service > /dev/null << EOF
[Unit]
Description=Portfolio Cache Cleanup
After=network.target

[Service]
Type=oneshot
User=$(whoami)
ExecStart=${PROJECT_ROOT}/scripts/cache-cleanup.sh
WorkingDirectory=${PROJECT_ROOT}

[Install]
WantedBy=multi-user.target
EOF

    sudo tee /etc/systemd/system/portfolio-cache-cleanup.timer > /dev/null << EOF
[Unit]
Description=Portfolio Cache Cleanup Timer
Requires=portfolio-cache-cleanup.service

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable portfolio-cache-cleanup.timer
    sudo systemctl start portfolio-cache-cleanup.timer
    
    echo "✅ Systemd timer created and started"
fi

# Test the cache system
echo "🧪 Testing application cache..."
php "${PROJECT_ROOT}/scripts/cache-test.php"

# Warm the cache
echo "🔥 Warming cache with initial data..."
php "${PROJECT_ROOT}/scripts/cache-warm.php"

# Generate initial statistics
echo "📊 Generating initial cache statistics..."
php "${PROJECT_ROOT}/scripts/cache-stats.php" > "${PROJECT_ROOT}/storage/logs/cache-stats.log"

echo ""
echo "✅ Application caching setup completed successfully!"
echo ""
echo "📋 Setup Summary:"
echo "   • Cache directories created in storage/cache/"
echo "   • Cache configuration created"
echo "   • Cache cleanup script installed"
echo "   • Cache statistics generator created"
echo "   • Cache warming script created"
echo "   • Cache testing completed successfully"
echo "   • Systemd timer for daily cleanup (if available)"
echo ""
echo "🎯 Next Steps:"
echo "   • Configure cache settings in config/cache.php"
echo "   • Integrate CachedTestimonialsManager for testimonials"
echo "   • Run cache warming after data updates"
echo "   • Monitor cache statistics regularly"
echo ""
echo "📊 Cache Statistics:"
cat "${PROJECT_ROOT}/storage/logs/cache-stats.log"
EOF

chmod +x "${PROJECT_ROOT}/scripts/setup-app-cache.sh"

# Run the setup script
echo "▶️ Executing application cache setup..."
"${PROJECT_ROOT}/scripts/setup-app-cache.sh"