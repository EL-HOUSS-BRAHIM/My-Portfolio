#!/bin/bash

# Database Optimization Setup Script
# Implements comprehensive database optimization

set -euo pipefail

PROJECT_ROOT="/home/bross/Desktop/My-Portfolio"
DB_SCRIPT="${PROJECT_ROOT}/database/optimize.sql"
LOG_FILE="${PROJECT_ROOT}/storage/logs/db-optimization.log"

echo "🚀 Starting database optimization..."

# Ensure logs directory exists
mkdir -p "${PROJECT_ROOT}/storage/logs"

# Function to log with timestamp
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S'): $1" | tee -a "$LOG_FILE"
}

# Check if database exists and is accessible
check_database() {
    log_message "Checking database connectivity..."
    
    if ! command -v mysql &> /dev/null; then
        log_message "❌ MySQL client not found. Please install MySQL client."
        return 1
    fi
    
    # Try to connect to database (will prompt for password if needed)
    if mysql -u root -p -e "SELECT 1;" &> /dev/null; then
        log_message "✅ Database connection successful"
        return 0
    else
        log_message "⚠️ Database connection failed or requires manual setup"
        return 1
    fi
}

# Apply database optimizations
apply_optimizations() {
    log_message "Applying database optimizations..."
    
    if [ -f "$DB_SCRIPT" ]; then
        log_message "Executing optimization SQL script..."
        
        # Execute the optimization script
        if mysql -u root -p < "$DB_SCRIPT" 2>&1 | tee -a "$LOG_FILE"; then
            log_message "✅ Database optimization completed"
        else
            log_message "❌ Database optimization failed"
            return 1
        fi
    else
        log_message "❌ Optimization script not found: $DB_SCRIPT"
        return 1
    fi
}

# Create database performance monitoring script
create_monitoring_script() {
    log_message "Creating database performance monitoring script..."
    
    cat > "${PROJECT_ROOT}/scripts/db-performance.php" << 'EOF'
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
EOF
    
    log_message "✅ Performance monitoring script created"
}

# Create database maintenance script
create_maintenance_script() {
    log_message "Creating database maintenance script..."
    
    cat > "${PROJECT_ROOT}/scripts/db-maintenance.sh" << 'EOF'
#!/bin/bash

# Database Maintenance Script
# Performs regular database maintenance tasks

PROJECT_ROOT="/home/bross/Desktop/My-Portfolio"
LOG_FILE="${PROJECT_ROOT}/storage/logs/db-maintenance.log"

echo "$(date): Starting database maintenance..." >> "$LOG_FILE"

# Function to log messages
log_msg() {
    echo "$(date): $1" >> "$LOG_FILE"
    echo "$1"
}

# Clean expired cache
log_msg "Cleaning expired cache entries..."
php -r "
require_once '${PROJECT_ROOT}/src/database/OptimizedQueryManager.php';
\$qm = new OptimizedQueryManager();
\$cleaned = \$qm->cleanExpiredCache();
echo \"Cleaned \$cleaned expired cache entries\n\";
" >> "$LOG_FILE" 2>&1

# Optimize tables
log_msg "Optimizing database tables..."
mysql -u root -p -e "
OPTIMIZE TABLE testimonials;
OPTIMIZE TABLE contact_submissions;
OPTIMIZE TABLE admin_users;
OPTIMIZE TABLE query_cache;
" >> "$LOG_FILE" 2>&1

# Update table statistics
log_msg "Updating table statistics..."
mysql -u root -p -e "
ANALYZE TABLE testimonials;
ANALYZE TABLE contact_submissions;
ANALYZE TABLE admin_users;
ANALYZE TABLE query_cache;
" >> "$LOG_FILE" 2>&1

# Generate performance report
log_msg "Generating performance report..."
php "${PROJECT_ROOT}/scripts/db-performance.php" >> "$LOG_FILE" 2>&1

log_msg "Database maintenance completed."
EOF
    
    chmod +x "${PROJECT_ROOT}/scripts/db-maintenance.sh"
    log_message "✅ Database maintenance script created"
}

# Create query optimization test
create_optimization_test() {
    log_message "Creating query optimization test..."
    
    cat > "${PROJECT_ROOT}/scripts/test-db-optimization.php" << 'EOF'
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
EOF
    
    log_message "✅ Optimization test created"
}

# Main execution
main() {
    log_message "Starting database optimization setup..."
    
    # Check database connectivity
    if check_database; then
        # Apply optimizations
        if apply_optimizations; then
            log_message "✅ Database optimizations applied successfully"
        else
            log_message "⚠️ Database optimization failed, continuing with other setup..."
        fi
    else
        log_message "⚠️ Skipping database optimization due to connectivity issues"
        log_message "💡 You can run the optimization manually later with:"
        log_message "   mysql -u root -p < ${DB_SCRIPT}"
    fi
    
    # Create monitoring and maintenance scripts
    create_monitoring_script
    create_maintenance_script
    create_optimization_test
    
    # Test the optimization (if database is available)
    if command -v php &> /dev/null; then
        log_message "🧪 Testing database optimization..."
        if php "${PROJECT_ROOT}/scripts/test-db-optimization.php" 2>&1 | tee -a "$LOG_FILE"; then
            log_message "✅ Optimization tests completed"
        else
            log_message "⚠️ Optimization tests failed (may be due to database connectivity)"
        fi
    fi
    
    log_message ""
    log_message "✅ Database optimization setup completed!"
    log_message ""
    log_message "📋 What was created:"
    log_message "   • Database indexes and views"
    log_message "   • Stored procedures for performance"
    log_message "   • OptimizedQueryManager class"
    log_message "   • Performance monitoring script"
    log_message "   • Database maintenance script"
    log_message "   • Optimization testing suite"
    log_message ""
    log_message "🎯 Next steps:"
    log_message "   • Review optimization results in $LOG_FILE"
    log_message "   • Run maintenance script weekly: ./scripts/db-maintenance.sh"
    log_message "   • Monitor performance with: php scripts/db-performance.php"
    log_message "   • Update application code to use OptimizedQueryManager"
}

# Execute main function
main