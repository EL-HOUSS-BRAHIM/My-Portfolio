<?php

/**
 * Simplified Cache Warm Script
 * Tests basic caching without database dependencies
 */

require_once __DIR__ . '/../src/cache/ApplicationCache.php';
require_once __DIR__ . '/../src/config/ConfigManager.php';

use Portfolio\Cache\ApplicationCache;

echo "🔥 Starting simplified cache warming..." . PHP_EOL;

try {
    // Test ApplicationCache directly
    echo "⚙️ Testing ApplicationCache..." . PHP_EOL;
    $cache = new ApplicationCache();
    
    // Test configuration caching
    $testConfig = [
        'app' => ['name' => 'Portfolio', 'version' => '1.0.0'],
        'features' => ['testimonials' => true, 'contact' => true]
    ];
    
    $cache->cacheConfig($testConfig);
    $retrievedConfig = $cache->getConfig();
    
    if ($retrievedConfig === $testConfig) {
        echo "✅ Configuration caching works" . PHP_EOL;
    } else {
        echo "❌ Configuration caching failed" . PHP_EOL;
    }
    
    // Test basic cache operations
    $cache->set('test_key', 'test_value', 300, 'api');
    $value = $cache->get('test_key', 'api');
    
    if ($value === 'test_value') {
        echo "✅ Basic cache operations work" . PHP_EOL;
    } else {
        echo "❌ Basic cache operations failed" . PHP_EOL;
    }
    
    // Test remember pattern
    $remembered = $cache->remember('remember_test', function() {
        return ['data' => 'cached', 'time' => time()];
    }, 300, 'testimonials');
    
    if (is_array($remembered) && $remembered['data'] === 'cached') {
        echo "✅ Remember pattern works" . PHP_EOL;
    } else {
        echo "❌ Remember pattern failed" . PHP_EOL;
    }
    
    // Generate stats
    $stats = $cache->getStats();
    echo "📊 Cache statistics: " . json_encode($stats, JSON_PRETTY_PRINT) . PHP_EOL;
    
    echo "✅ Cache warming completed successfully!" . PHP_EOL;
    
} catch (Exception $e) {
    echo "❌ Cache warming failed: " . $e->getMessage() . PHP_EOL;
    exit(1);
}