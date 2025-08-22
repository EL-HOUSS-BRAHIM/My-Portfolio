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
