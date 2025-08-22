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
