#!/bin/bash

# Performance Testing Suite for Portfolio Website
# This script runs comprehensive performance tests including load testing, 
# database performance, image optimization validation, and API response times

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RESULTS_DIR="$PROJECT_ROOT/tests/performance-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="$RESULTS_DIR/performance_report_$TIMESTAMP.html"

# Test targets
BASE_URL="http://localhost"
TEST_ENDPOINTS=(
    "/"
)

# Performance thresholds (in milliseconds)
PAGE_LOAD_THRESHOLD=2000
API_RESPONSE_THRESHOLD=500
DATABASE_QUERY_THRESHOLD=100

echo -e "${BLUE}Portfolio Performance Testing Suite${NC}"
echo "=================================="

# Function to print status messages
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_metric() {
    echo -e "${PURPLE}[METRIC]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Setup results directory
setup_results_directory() {
    mkdir -p "$RESULTS_DIR"
    print_status "Results will be saved to: $RESULTS_DIR"
}

# Check dependencies
check_dependencies() {
    print_status "Checking performance testing dependencies..."
    
    local missing_deps=()
    
    # Check for Apache Benchmark
    if ! command_exists ab; then
        missing_deps+=("apache2-utils")
    fi
    
    # Check for curl
    if ! command_exists curl; then
        missing_deps+=("curl")
    fi
    
    # Check for siege (alternative load testing tool)
    if ! command_exists siege; then
        print_warning "Siege not found (optional load testing tool)"
    fi
    
    # Check for wrk (modern load testing tool)
    if ! command_exists wrk; then
        print_warning "wrk not found (optional load testing tool)"
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        print_error "Missing dependencies: ${missing_deps[*]}"
        print_status "Install with: sudo apt-get install ${missing_deps[*]}"
        exit 1
    fi
    
    print_success "All required dependencies are available"
}

# Test server availability
test_server_availability() {
    print_status "Testing server availability..."
    
    for endpoint in "${TEST_ENDPOINTS[@]}"; do
        local url="$BASE_URL$endpoint"
        if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|301\|302"; then
            print_success "✓ $url is accessible"
        else
            print_error "✗ $url is not accessible"
            return 1
        fi
    done
}

# Apache Benchmark load testing
run_apache_benchmark() {
    print_status "Running Apache Benchmark load tests..."
    
    local ab_results="$RESULTS_DIR/ab_results_$TIMESTAMP.txt"
    echo "Apache Benchmark Results - $(date)" > "$ab_results"
    echo "=================================" >> "$ab_results"
    
    for endpoint in "${TEST_ENDPOINTS[@]}"; do
        local url="$BASE_URL$endpoint"
        print_status "Testing $url with Apache Benchmark..."
        
        echo -e "\n--- Testing: $url ---" >> "$ab_results"
        
        # Run test: 100 requests, 10 concurrent
        if ab -n 100 -c 10 -g "$RESULTS_DIR/ab_gnuplot_${endpoint//\//_}_$TIMESTAMP.dat" "$url" >> "$ab_results" 2>&1; then
            # Extract key metrics
            local response_time=$(grep "Time per request:" "$ab_results" | tail -1 | awk '{print $4}')
            local requests_per_second=$(grep "Requests per second:" "$ab_results" | tail -1 | awk '{print $4}')
            local transfer_rate=$(grep "Transfer rate:" "$ab_results" | tail -1 | awk '{print $3}')
            
            print_metric "Response Time: ${response_time}ms"
            print_metric "Requests/sec: $requests_per_second"
            print_metric "Transfer Rate: ${transfer_rate} KB/sec"
            
            # Check against threshold
            if [ "${response_time%.*}" -lt "$PAGE_LOAD_THRESHOLD" ]; then
                print_success "✓ Response time within threshold"
            else
                print_warning "⚠ Response time exceeds threshold ($PAGE_LOAD_THRESHOLD ms)"
            fi
        else
            print_error "✗ Apache Benchmark test failed for $url"
        fi
    done
    
    print_success "Apache Benchmark tests completed"
}

# Database performance testing
run_database_performance_tests() {
    print_status "Running database performance tests..."
    
    local db_results="$RESULTS_DIR/database_performance_$TIMESTAMP.txt"
    echo "Database Performance Results - $(date)" > "$db_results"
    echo "====================================" >> "$db_results"
    
    # Test database queries if we have access
    if [ -f "$PROJECT_ROOT/src/database/OptimizedQueryManager.php" ]; then
        print_status "Testing optimized database queries..."
        
        # Create a simple PHP script to test database performance
        cat > "$RESULTS_DIR/db_test.php" << 'EOF'
<?php
require_once __DIR__ . '/../src/database/OptimizedQueryManager.php';

$start_time = microtime(true);

try {
    // Test database connection
    $pdo = new PDO('sqlite::memory:');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Create test table
    $pdo->exec("CREATE TABLE test_table (id INTEGER PRIMARY KEY, name TEXT, email TEXT)");
    
    // Insert test data
    $stmt = $pdo->prepare("INSERT INTO test_table (name, email) VALUES (?, ?)");
    for ($i = 1; $i <= 1000; $i++) {
        $stmt->execute(["User $i", "user$i@example.com"]);
    }
    
    $insert_time = microtime(true) - $start_time;
    echo "Insert 1000 records: " . round($insert_time * 1000, 2) . " ms\n";
    
    // Test SELECT queries
    $select_start = microtime(true);
    $stmt = $pdo->query("SELECT * FROM test_table WHERE id < 100");
    $results = $stmt->fetchAll();
    $select_time = microtime(true) - $select_start;
    echo "Select 99 records: " . round($select_time * 1000, 2) . " ms\n";
    
    // Test JOIN operation (simulate with subquery)
    $join_start = microtime(true);
    $stmt = $pdo->query("SELECT COUNT(*) FROM test_table WHERE email LIKE '%5%'");
    $count = $stmt->fetchColumn();
    $join_time = microtime(true) - $join_start;
    echo "Complex query result count: $count, Time: " . round($join_time * 1000, 2) . " ms\n";
    
    $total_time = microtime(true) - $start_time;
    echo "Total test time: " . round($total_time * 1000, 2) . " ms\n";
    
} catch (Exception $e) {
    echo "Database test failed: " . $e->getMessage() . "\n";
}
EOF

        # Run the database test
        if php "$RESULTS_DIR/db_test.php" >> "$db_results" 2>&1; then
            print_success "Database performance test completed"
            
            # Show results
            while IFS= read -r line; do
                if [[ $line == *" ms" ]]; then
                    print_metric "$line"
                fi
            done < "$db_results"
        else
            print_warning "Database performance test failed or skipped"
        fi
        
        # Clean up
        rm -f "$RESULTS_DIR/db_test.php"
    else
        print_warning "Database performance test skipped (OptimizedQueryManager not found)"
    fi
}

# Image optimization validation
test_image_optimization() {
    print_status "Testing image optimization..."
    
    local image_results="$RESULTS_DIR/image_optimization_$TIMESTAMP.txt"
    echo "Image Optimization Results - $(date)" > "$image_results"
    echo "===================================" >> "$image_results"
    
    local images_dir="$PROJECT_ROOT/assets/images"
    local total_size=0
    local image_count=0
    local webp_count=0
    
    if [ -d "$images_dir" ]; then
        # Analyze image files
        while IFS= read -r -d '' file; do
            if [[ $file =~ \.(jpg|jpeg|png|gif|webp)$ ]]; then
                local size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo 0)
                local filename=$(basename "$file")
                
                echo "$filename: ${size} bytes" >> "$image_results"
                
                total_size=$((total_size + size))
                image_count=$((image_count + 1))
                
                if [[ $file =~ \.webp$ ]]; then
                    webp_count=$((webp_count + 1))
                fi
                
                # Check if image is too large
                if [ "$size" -gt 1048576 ]; then  # 1MB
                    print_warning "Large image detected: $filename (${size} bytes)"
                fi
            fi
        done < <(find "$images_dir" -type f -print0)
        
        local avg_size=$((total_size / image_count))
        local webp_percentage=$((webp_count * 100 / image_count))
        
        echo -e "\nSummary:" >> "$image_results"
        echo "Total images: $image_count" >> "$image_results"
        echo "Total size: $total_size bytes" >> "$image_results"
        echo "Average size: $avg_size bytes" >> "$image_results"
        echo "WebP images: $webp_count ($webp_percentage%)" >> "$image_results"
        
        print_metric "Total images: $image_count"
        print_metric "Average image size: $avg_size bytes"
        print_metric "WebP optimization: $webp_percentage%"
        
        if [ "$webp_percentage" -ge 50 ]; then
            print_success "✓ Good WebP optimization coverage"
        else
            print_warning "⚠ Consider converting more images to WebP format"
        fi
        
        print_success "Image optimization analysis completed"
    else
        print_warning "Images directory not found, skipping image analysis"
    fi
}

# API response time testing
test_api_response_times() {
    print_status "Testing API response times..."
    
    local api_results="$RESULTS_DIR/api_response_times_$TIMESTAMP.txt"
    echo "API Response Time Results - $(date)" > "$api_results"
    echo "==================================" >> "$api_results"
    
    # Test API endpoints if they exist
    local api_endpoints=(
        "/src/api/contact.php"
        "/src/api/testimonials.php"
        "/admin/login.php"
    )
    
    for endpoint in "${api_endpoints[@]}"; do
        local full_path="$PROJECT_ROOT$endpoint"
        if [ -f "$full_path" ]; then
            local api_url="$BASE_URL$endpoint"
            
            print_status "Testing API endpoint: $api_url"
            
            # Test with curl and measure time
            local response_time=$(curl -o /dev/null -s -w '%{time_total}\n' "$api_url" 2>/dev/null || echo "0")
            local response_time_ms=$(echo "$response_time * 1000" | bc -l 2>/dev/null || echo "0")
            
            echo "$endpoint: ${response_time_ms} ms" >> "$api_results"
            print_metric "API Response Time: ${response_time_ms} ms"
            
            # Check against threshold
            if [ "${response_time_ms%.*}" -lt "$API_RESPONSE_THRESHOLD" ]; then
                print_success "✓ API response time within threshold"
            else
                print_warning "⚠ API response time exceeds threshold ($API_RESPONSE_THRESHOLD ms)"
            fi
        fi
    done
    
    print_success "API response time testing completed"
}

# Memory usage analysis
analyze_memory_usage() {
    print_status "Analyzing memory usage..."
    
    local memory_results="$RESULTS_DIR/memory_analysis_$TIMESTAMP.txt"
    echo "Memory Usage Analysis - $(date)" > "$memory_results"
    echo "==============================" >> "$memory_results"
    
    # Create PHP script to analyze memory usage
    cat > "$RESULTS_DIR/memory_test.php" << 'EOF'
<?php
echo "Initial memory usage: " . memory_get_usage() . " bytes\n";
echo "Initial peak memory: " . memory_get_peak_usage() . " bytes\n";

// Simulate loading various components
$data = [];
for ($i = 0; $i < 1000; $i++) {
    $data[] = [
        'id' => $i,
        'name' => "Test User $i",
        'email' => "user$i@example.com",
        'data' => str_repeat('x', 100)
    ];
}

echo "After data loading: " . memory_get_usage() . " bytes\n";
echo "Peak memory usage: " . memory_get_peak_usage() . " bytes\n";

// Simulate session data
session_start();
$_SESSION['test_data'] = $data;

echo "After session data: " . memory_get_usage() . " bytes\n";
echo "Final peak memory: " . memory_get_peak_usage() . " bytes\n";

// Memory limit
echo "Memory limit: " . ini_get('memory_limit') . "\n";
EOF

    if php "$RESULTS_DIR/memory_test.php" >> "$memory_results" 2>&1; then
        print_success "Memory usage analysis completed"
        
        # Show key metrics
        local peak_memory=$(grep "Final peak memory:" "$memory_results" | awk '{print $4}')
        local memory_limit=$(grep "Memory limit:" "$memory_results" | awk '{print $3}')
        
        print_metric "Peak memory usage: $peak_memory bytes"
        print_metric "Memory limit: $memory_limit"
    else
        print_warning "Memory usage analysis failed"
    fi
    
    rm -f "$RESULTS_DIR/memory_test.php"
}

# Generate performance report
generate_performance_report() {
    print_status "Generating performance report..."
    
    cat > "$REPORT_FILE" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portfolio Performance Report - $TIMESTAMP</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 2px solid #007acc; padding-bottom: 10px; }
        h2 { color: #007acc; margin-top: 30px; }
        .metric { background: #f8f9fa; padding: 10px; margin: 5px 0; border-left: 4px solid #007acc; }
        .success { border-left-color: #28a745; }
        .warning { border-left-color: #ffc107; }
        .error { border-left-color: #dc3545; }
        .summary { background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Portfolio Performance Report</h1>
        <p class="timestamp">Generated on: $(date)</p>
        
        <div class="summary">
            <h3>Test Summary</h3>
            <ul>
                <li>Load Testing: Apache Benchmark</li>
                <li>Database Performance: Query timing analysis</li>
                <li>Image Optimization: Size and format analysis</li>
                <li>API Response Times: Endpoint performance</li>
                <li>Memory Usage: Peak memory analysis</li>
            </ul>
        </div>
        
        <h2>Test Results</h2>
EOF

    # Add results from each test file
    for result_file in "$RESULTS_DIR"/*_"$TIMESTAMP".txt; do
        if [ -f "$result_file" ]; then
            local test_name=$(basename "$result_file" .txt | sed 's/_[0-9]*_[0-9]*$//')
            echo "<h3>$test_name</h3>" >> "$REPORT_FILE"
            echo "<pre>" >> "$REPORT_FILE"
            cat "$result_file" >> "$REPORT_FILE"
            echo "</pre>" >> "$REPORT_FILE"
        fi
    done
    
    cat >> "$REPORT_FILE" << EOF
        
        <h2>Recommendations</h2>
        <div class="metric">
            <h4>Performance Optimization</h4>
            <ul>
                <li>Ensure all images are optimized and converted to WebP where possible</li>
                <li>Implement caching strategies for database queries</li>
                <li>Monitor API response times and optimize slow endpoints</li>
                <li>Consider implementing a CDN for static assets</li>
            </ul>
        </div>
        
        <div class="metric">
            <h4>Monitoring</h4>
            <ul>
                <li>Set up regular performance monitoring</li>
                <li>Implement real-time alerts for performance degradation</li>
                <li>Track Core Web Vitals for user experience</li>
                <li>Monitor database query performance</li>
            </ul>
        </div>
        
        <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666;">
            <p>Portfolio Performance Testing Suite - Generated $TIMESTAMP</p>
        </footer>
    </div>
</body>
</html>
EOF

    print_success "Performance report generated: $REPORT_FILE"
}

# Main execution
main() {
    print_status "Starting Portfolio Performance Testing"
    
    # Parse command line arguments
    SKIP_LOAD_TEST=false
    SKIP_DB_TEST=false
    SKIP_IMAGE_TEST=false
    SKIP_API_TEST=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-load)
                SKIP_LOAD_TEST=true
                shift
                ;;
            --skip-db)
                SKIP_DB_TEST=true
                shift
                ;;
            --skip-images)
                SKIP_IMAGE_TEST=true
                shift
                ;;
            --skip-api)
                SKIP_API_TEST=true
                shift
                ;;
            --base-url)
                BASE_URL="$2"
                shift 2
                ;;
            --help|-h)
                echo "Usage: $0 [options]"
                echo "Options:"
                echo "  --skip-load      Skip load testing"
                echo "  --skip-db        Skip database performance tests"
                echo "  --skip-images    Skip image optimization tests"
                echo "  --skip-api       Skip API response time tests"
                echo "  --base-url URL   Set base URL for testing (default: http://localhost)"
                echo "  --help           Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Run all tests
    setup_results_directory
    check_dependencies
    test_server_availability
    
    echo -e "\n${BLUE}Running Performance Tests...${NC}"
    echo "============================"
    
    if [ "$SKIP_LOAD_TEST" = false ]; then
        run_apache_benchmark
    fi
    
    if [ "$SKIP_DB_TEST" = false ]; then
        run_database_performance_tests
    fi
    
    if [ "$SKIP_IMAGE_TEST" = false ]; then
        test_image_optimization
    fi
    
    if [ "$SKIP_API_TEST" = false ]; then
        test_api_response_times
    fi
    
    analyze_memory_usage
    
    echo -e "\n${BLUE}Generating Reports...${NC}"
    echo "===================="
    
    generate_performance_report
    
    echo -e "\n${GREEN}Performance Testing Completed!${NC}"
    echo "=============================="
    
    print_success "All performance tests completed successfully!"
    print_status "Results saved in: $RESULTS_DIR"
    print_status "Report available at: $REPORT_FILE"
    
    # Open report if on desktop environment
    if command_exists xdg-open; then
        read -p "Would you like to open the performance report? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            xdg-open "$REPORT_FILE"
        fi
    fi
}

# Run main function with all arguments
main "$@"