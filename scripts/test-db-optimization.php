<?php

/**
 * Database Optimization Test
 * 
 * Tests the performance improvements from optimization
 */

require_once __DIR__ . '/../src/database/OptimizedQueryManager.php';
require_once __DIR__ . '/../src/config/DatabaseManager.php';

echo "🧪 Testing database optimization...\n";

$queryManager = new OptimizedQueryManager();
$db = DatabaseManager::getInstance();

// Performance tests
$tests = [
    'Cache Performance Test' => function() use ($queryManager) {
        // Test cache vs no cache
        $start = microtime(true);
        $result1 = $queryManager->getApprovedTestimonials(10);
        $timeWithCache = microtime(true) - $start;
        
        // Clear cache and test again
        $queryManager->cache->clearByType('testimonials');
        
        $start = microtime(true);
        $result2 = $queryManager->getApprovedTestimonials(10);
        $timeWithoutCache = microtime(true) - $start;
        
        $improvement = $timeWithoutCache > 0 ? 
            ($timeWithoutCache - $timeWithCache) / $timeWithoutCache * 100 : 0;
        
        return [
            'with_cache' => number_format($timeWithCache * 1000, 2) . 'ms',
            'without_cache' => number_format($timeWithoutCache * 1000, 2) . 'ms',
            'improvement' => number_format($improvement, 1) . '%'
        ];
    },
    
    'Index Performance Test' => function() use ($queryManager) {
        // Test queries that should benefit from indexes
        $start = microtime(true);
        $stats = $queryManager->getTestimonialStats();
        $statsTime = microtime(true) - $start;
        
        $start = microtime(true);
        $approved = $queryManager->getApprovedTestimonials(5);
        $approvedTime = microtime(true) - $start;
        
        return [
            'stats_query' => number_format($statsTime * 1000, 2) . 'ms',
            'approved_query' => number_format($approvedTime * 1000, 2) . 'ms',
            'total_records' => $stats['total_count'] ?? 0
        ];
    },
    
    'Pagination Performance Test' => function() use ($queryManager) {
        // Test paginated queries
        $start = microtime(true);
        $page1 = $queryManager->getTestimonials(null, 10, 0);
        $page1Time = microtime(true) - $start;
        
        $start = microtime(true);
        $page2 = $queryManager->getTestimonials(null, 10, 10);
        $page2Time = microtime(true) - $start;
        
        return [
            'page_1' => number_format($page1Time * 1000, 2) . 'ms',
            'page_2' => number_format($page2Time * 1000, 2) . 'ms',
            'records_page_1' => count($page1),
            'records_page_2' => count($page2)
        ];
    }
];

// Run all tests
foreach ($tests as $testName => $testFunction) {
    echo "\n🔬 Running: $testName\n";
    try {
        $results = $testFunction();
        foreach ($results as $key => $value) {
            echo "  $key: $value\n";
        }
        echo "✅ Test completed\n";
    } catch (Exception $e) {
        echo "❌ Test failed: " . $e->getMessage() . "\n";
    }
}

// Final statistics
echo "\n📊 Final Query Statistics:\n";
$stats = $queryManager->getQueryStats();
foreach ($stats as $key => $value) {
    if (is_array($value)) continue;
    echo "  $key: $value\n";
}

echo "\n✅ All optimization tests completed!\n";
