<?php

/**
 * Database Performance Monitor
 * 
 * Monitors database performance and generates optimization reports
 */

require_once __DIR__ . '/../src/database/OptimizedQueryManager.php';

$queryManager = new OptimizedQueryManager();

echo "🔍 Database Performance Analysis\n";
echo "================================\n\n";

try {
    // Test basic operations
    echo "📊 Testing query performance...\n";
    
    $startTime = microtime(true);
    $testimonials = $queryManager->getApprovedTestimonials(5);
    $queryTime = microtime(true) - $startTime;
    
    echo "✅ Retrieved " . count($testimonials) . " testimonials in " . 
         number_format($queryTime * 1000, 2) . "ms\n";
    
    // Get statistics
    $stats = $queryManager->getTestimonialStats();
    echo "📈 Statistics: " . json_encode($stats, JSON_PRETTY_PRINT) . "\n";
    
    // Test query analysis
    echo "\n🔬 Query Analysis:\n";
    $analysis = $queryManager->analyzeQuery(
        "SELECT * FROM testimonials WHERE status = ? ORDER BY created_at DESC LIMIT ?",
        ['approved', 10]
    );
    
    if (isset($analysis['explain'])) {
        echo "Execution time: " . number_format($analysis['execution_time'] * 1000, 2) . "ms\n";
        
        if (!empty($analysis['recommendations'])) {
            echo "Recommendations:\n";
            foreach ($analysis['recommendations'] as $rec) {
                echo "  • $rec\n";
            }
        } else {
            echo "✅ Query appears to be well optimized\n";
        }
    }
    
    // Get query statistics
    $queryStats = $queryManager->getQueryStats();
    echo "\n📊 Query Statistics:\n";
    echo "Total queries: " . $queryStats['total_queries'] . "\n";
    echo "Cache hits: " . $queryStats['cache_hits'] . "\n";
    echo "Executed queries: " . $queryStats['executed_queries'] . "\n";
    echo "Average time: " . number_format($queryStats['average_time'] * 1000, 2) . "ms\n";
    
    // Test optimization
    echo "\n🔧 Running table optimization...\n";
    $optimization = $queryManager->optimizeTables();
    foreach ($optimization as $table => $result) {
        $status = $result['status'] ?? 'unknown';
        echo "$table: $status\n";
    }
    
    echo "\n✅ Performance analysis completed successfully!\n";
    
} catch (Exception $e) {
    echo "\n❌ Performance analysis failed: " . $e->getMessage() . "\n";
    exit(1);
}
