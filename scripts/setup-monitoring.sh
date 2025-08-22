#!/bin/bash

# Monitoring and Alerting Setup Script
# Sets up comprehensive monitoring for the portfolio application

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
STORAGE_DIR="$PROJECT_ROOT/storage"
LOGS_DIR="$STORAGE_DIR/logs"
MONITORING_DIR="$STORAGE_DIR/monitoring"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create monitoring directories
setup_directories() {
    log_info "Setting up monitoring directories..."
    
    mkdir -p "$MONITORING_DIR"/{alerts,reports,metrics,uptime}
    mkdir -p "$LOGS_DIR"
    
    # Set proper permissions
    chmod -R 755 "$STORAGE_DIR"
    
    log_success "Monitoring directories created"
}

# Setup log rotation
setup_log_rotation() {
    log_info "Setting up log rotation..."
    
    # Create logrotate configuration
    cat > "$PROJECT_ROOT/logrotate.conf" << 'EOF'
/home/bross/Desktop/My-Portfolio/storage/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        # Restart PHP-FPM if running
        if [ -f /var/run/php/php-fpm.pid ]; then
            /usr/sbin/service php8.1-fpm reload > /dev/null
        fi
    endscript
}
EOF
    
    log_success "Log rotation configured"
}

# Setup uptime monitoring
setup_uptime_monitoring() {
    log_info "Setting up uptime monitoring..."
    
    cat > "$MONITORING_DIR/uptime-check.sh" << 'EOF'
#!/bin/bash

# Uptime monitoring script
URL="http://localhost:8000"
TIMEOUT=10
UPTIME_LOG="/home/bross/Desktop/My-Portfolio/storage/monitoring/uptime/uptime.log"
ALERT_FILE="/home/bross/Desktop/My-Portfolio/storage/monitoring/alerts/uptime-alert.flag"

# Ensure directories exist
mkdir -p "$(dirname "$UPTIME_LOG")"
mkdir -p "$(dirname "$ALERT_FILE")"

# Check website
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$URL" || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    echo "$TIMESTAMP - UP - HTTP $HTTP_CODE" >> "$UPTIME_LOG"
    
    # Remove alert flag if site is back up
    if [ -f "$ALERT_FILE" ]; then
        rm "$ALERT_FILE"
        echo "$TIMESTAMP - RECOVERY - Site is back online" >> "$UPTIME_LOG"
        
        # Send recovery notification
        echo "Portfolio website is back online at $TIMESTAMP" | mail -s "Website Recovery Alert" admin@localhost 2>/dev/null || true
    fi
else
    echo "$TIMESTAMP - DOWN - HTTP $HTTP_CODE" >> "$UPTIME_LOG"
    
    # Create alert flag if not exists
    if [ ! -f "$ALERT_FILE" ]; then
        echo "$TIMESTAMP" > "$ALERT_FILE"
        
        # Send alert
        echo "Portfolio website is down. HTTP Code: $HTTP_CODE at $TIMESTAMP" | mail -s "Website Down Alert" admin@localhost 2>/dev/null || true
    fi
fi

# Rotate uptime log (keep last 1000 lines)
tail -n 1000 "$UPTIME_LOG" > "$UPTIME_LOG.tmp" && mv "$UPTIME_LOG.tmp" "$UPTIME_LOG"
EOF
    
    chmod +x "$MONITORING_DIR/uptime-check.sh"
    
    log_success "Uptime monitoring script created"
}

# Setup performance monitoring
setup_performance_monitoring() {
    log_info "Setting up performance monitoring..."
    
    cat > "$MONITORING_DIR/performance-check.sh" << 'EOF'
#!/bin/bash

# Performance monitoring script
URL="http://localhost:8000"
TIMEOUT=30
PERFORMANCE_LOG="/home/bross/Desktop/My-Portfolio/storage/monitoring/metrics/performance.log"
THRESHOLD_WARNING=2
THRESHOLD_CRITICAL=5

# Ensure directory exists
mkdir -p "$(dirname "$PERFORMANCE_LOG")"

# Check response time
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" --max-time $TIMEOUT "$URL" 2>/dev/null || echo "999")

# Check if response time is a valid number
if ! [[ "$RESPONSE_TIME" =~ ^[0-9]+\.?[0-9]*$ ]]; then
    RESPONSE_TIME=999
fi

# Log performance
echo "$TIMESTAMP,$RESPONSE_TIME" >> "$PERFORMANCE_LOG"

# Check thresholds
if (( $(echo "$RESPONSE_TIME > $THRESHOLD_CRITICAL" | bc -l) )); then
    echo "CRITICAL: Portfolio response time is ${RESPONSE_TIME}s (threshold: ${THRESHOLD_CRITICAL}s) at $TIMESTAMP" | mail -s "Performance Critical Alert" admin@localhost 2>/dev/null || true
elif (( $(echo "$RESPONSE_TIME > $THRESHOLD_WARNING" | bc -l) )); then
    echo "WARNING: Portfolio response time is ${RESPONSE_TIME}s (threshold: ${THRESHOLD_WARNING}s) at $TIMESTAMP" | mail -s "Performance Warning Alert" admin@localhost 2>/dev/null || true
fi

# Rotate performance log (keep last 10000 lines)
tail -n 10000 "$PERFORMANCE_LOG" > "$PERFORMANCE_LOG.tmp" && mv "$PERFORMANCE_LOG.tmp" "$PERFORMANCE_LOG"
EOF
    
    chmod +x "$MONITORING_DIR/performance-check.sh"
    
    log_success "Performance monitoring script created"
}

# Setup disk space monitoring
setup_disk_monitoring() {
    log_info "Setting up disk space monitoring..."
    
    cat > "$MONITORING_DIR/disk-check.sh" << 'EOF'
#!/bin/bash

# Disk space monitoring script
DISK_LOG="/home/bross/Desktop/My-Portfolio/storage/monitoring/metrics/disk.log"
THRESHOLD_WARNING=80
THRESHOLD_CRITICAL=90

# Ensure directory exists
mkdir -p "$(dirname "$DISK_LOG")"

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')

# Log disk usage
echo "$TIMESTAMP,$DISK_USAGE" >> "$DISK_LOG"

# Check thresholds
if [ "$DISK_USAGE" -gt "$THRESHOLD_CRITICAL" ]; then
    echo "CRITICAL: Disk usage is ${DISK_USAGE}% (threshold: ${THRESHOLD_CRITICAL}%) at $TIMESTAMP" | mail -s "Disk Space Critical Alert" admin@localhost 2>/dev/null || true
elif [ "$DISK_USAGE" -gt "$THRESHOLD_WARNING" ]; then
    echo "WARNING: Disk usage is ${DISK_USAGE}% (threshold: ${THRESHOLD_WARNING}%) at $TIMESTAMP" | mail -s "Disk Space Warning Alert" admin@localhost 2>/dev/null || true
fi

# Rotate disk log (keep last 1000 lines)
tail -n 1000 "$DISK_LOG" > "$DISK_LOG.tmp" && mv "$DISK_LOG.tmp" "$DISK_LOG"
EOF
    
    chmod +x "$MONITORING_DIR/disk-check.sh"
    
    log_success "Disk space monitoring script created"
}

# Setup error monitoring
setup_error_monitoring() {
    log_info "Setting up error monitoring..."
    
    cat > "$MONITORING_DIR/error-check.sh" << 'EOF'
#!/bin/bash

# Error monitoring script
ERROR_LOG="/home/bross/Desktop/My-Portfolio/storage/logs/app-$(date +%Y-%m-%d).log"
ERROR_COUNT_FILE="/home/bross/Desktop/My-Portfolio/storage/monitoring/alerts/error-count.txt"
ALERT_THRESHOLD=10

# Ensure directories exist
mkdir -p "$(dirname "$ERROR_COUNT_FILE")"

if [ -f "$ERROR_LOG" ]; then
    # Count errors in the last hour
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    ONE_HOUR_AGO=$(date -d '1 hour ago' '+%Y-%m-%d %H:%M:%S')
    
    # Count ERROR, CRITICAL, EMERGENCY entries in the last hour
    ERROR_COUNT=$(awk -v start="$ONE_HOUR_AGO" -v end="$TIMESTAMP" '
        BEGIN { count = 0 }
        /\[(ERROR|CRITICAL|EMERGENCY)\]/ {
            # Extract timestamp from log line
            match($0, /\[([^\]]+)\]/, ts)
            if (ts[1] >= start && ts[1] <= end) count++
        }
        END { print count }
    ' "$ERROR_LOG" 2>/dev/null || echo "0")
    
    # Store current count
    echo "$ERROR_COUNT" > "$ERROR_COUNT_FILE"
    
    # Check threshold
    if [ "$ERROR_COUNT" -gt "$ALERT_THRESHOLD" ]; then
        echo "ALERT: $ERROR_COUNT errors detected in the last hour (threshold: $ALERT_THRESHOLD) at $TIMESTAMP" | mail -s "Error Threshold Alert" admin@localhost 2>/dev/null || true
    fi
else
    echo "0" > "$ERROR_COUNT_FILE"
fi
EOF
    
    chmod +x "$MONITORING_DIR/error-check.sh"
    
    log_success "Error monitoring script created"
}

# Setup health check endpoint
setup_health_check() {
    log_info "Setting up health check endpoint..."
    
    cat > "$PROJECT_ROOT/health.php" << 'EOF'
<?php
/**
 * Health Check Endpoint
 * Provides system health information
 */

header('Content-Type: application/json');

$health = [
    'status' => 'ok',
    'timestamp' => date('c'),
    'checks' => []
];

// Check database connection
try {
    if (file_exists(__DIR__ . '/.env')) {
        $env = parse_ini_file(__DIR__ . '/.env');
        $dsn = "mysql:host={$env['DB_HOST']};dbname={$env['DB_NAME']}";
        $pdo = new PDO($dsn, $env['DB_USERNAME'], $env['DB_PASSWORD']);
        $pdo->query('SELECT 1');
        $health['checks']['database'] = 'ok';
    } else {
        $health['checks']['database'] = 'warning - no env file';
    }
} catch (Exception $e) {
    $health['checks']['database'] = 'error';
    $health['status'] = 'degraded';
}

// Check file permissions
$storageDir = __DIR__ . '/storage';
if (is_dir($storageDir) && is_writable($storageDir)) {
    $health['checks']['storage'] = 'ok';
} else {
    $health['checks']['storage'] = 'error';
    $health['status'] = 'degraded';
}

// Check log directory
$logsDir = __DIR__ . '/storage/logs';
if (is_dir($logsDir) && is_writable($logsDir)) {
    $health['checks']['logs'] = 'ok';
} else {
    $health['checks']['logs'] = 'error';
    $health['status'] = 'degraded';
}

// Check disk space
$diskFree = disk_free_space(__DIR__);
$diskTotal = disk_total_space(__DIR__);
$diskUsagePercent = (($diskTotal - $diskFree) / $diskTotal) * 100;

if ($diskUsagePercent < 90) {
    $health['checks']['disk_space'] = 'ok';
} elseif ($diskUsagePercent < 95) {
    $health['checks']['disk_space'] = 'warning';
    $health['status'] = 'degraded';
} else {
    $health['checks']['disk_space'] = 'critical';
    $health['status'] = 'error';
}

// Check memory usage
$memoryUsage = memory_get_usage(true);
$memoryLimit = ini_get('memory_limit');

if ($memoryLimit !== '-1') {
    $limitBytes = $memoryLimit;
    // Convert to bytes
    $unit = strtolower(substr($memoryLimit, -1));
    $limitBytes = (int) $memoryLimit;
    if ($unit === 'g') $limitBytes *= 1024 * 1024 * 1024;
    elseif ($unit === 'm') $limitBytes *= 1024 * 1024;
    elseif ($unit === 'k') $limitBytes *= 1024;
    
    $memoryPercent = ($memoryUsage / $limitBytes) * 100;
    
    if ($memoryPercent < 80) {
        $health['checks']['memory'] = 'ok';
    } elseif ($memoryPercent < 90) {
        $health['checks']['memory'] = 'warning';
        $health['status'] = 'degraded';
    } else {
        $health['checks']['memory'] = 'critical';
        $health['status'] = 'error';
    }
} else {
    $health['checks']['memory'] = 'ok';
}

// Add metrics
$health['metrics'] = [
    'memory_usage' => $memoryUsage,
    'memory_peak' => memory_get_peak_usage(true),
    'disk_usage_percent' => round($diskUsagePercent, 2),
    'uptime' => file_exists('/proc/uptime') ? (float) explode(' ', file_get_contents('/proc/uptime'))[0] : null
];

http_response_code($health['status'] === 'ok' ? 200 : ($health['status'] === 'degraded' ? 200 : 503));
echo json_encode($health, JSON_PRETTY_PRINT);
EOF
    
    log_success "Health check endpoint created"
}

# Setup cron jobs
setup_cron_jobs() {
    log_info "Setting up monitoring cron jobs..."
    
    # Create cron configuration
    cat > "$MONITORING_DIR/monitoring-crontab" << EOF
# Portfolio Monitoring Cron Jobs
# Edit this file and load with: crontab monitoring-crontab

# Uptime check every 5 minutes
*/5 * * * * $MONITORING_DIR/uptime-check.sh

# Performance check every 10 minutes
*/10 * * * * $MONITORING_DIR/performance-check.sh

# Disk space check every hour
0 * * * * $MONITORING_DIR/disk-check.sh

# Error monitoring every 15 minutes
*/15 * * * * $MONITORING_DIR/error-check.sh

# Log rotation daily at 2 AM
0 2 * * * /usr/sbin/logrotate $PROJECT_ROOT/logrotate.conf

# Generate daily report at 6 AM
0 6 * * * $MONITORING_DIR/generate-report.sh
EOF
    
    log_success "Cron jobs configuration created"
    log_info "To activate monitoring, run: crontab $MONITORING_DIR/monitoring-crontab"
}

# Setup daily reports
setup_reports() {
    log_info "Setting up daily reports..."
    
    cat > "$MONITORING_DIR/generate-report.sh" << 'EOF'
#!/bin/bash

# Daily monitoring report generator
REPORT_DIR="/home/bross/Desktop/My-Portfolio/storage/monitoring/reports"
LOGS_DIR="/home/bross/Desktop/My-Portfolio/storage/logs"
MONITORING_DIR="/home/bross/Desktop/My-Portfolio/storage/monitoring"
DATE=$(date +%Y-%m-%d)
REPORT_FILE="$REPORT_DIR/daily-report-$DATE.txt"

# Ensure directory exists
mkdir -p "$REPORT_DIR"

# Generate report
cat > "$REPORT_FILE" << EOL
Portfolio Daily Monitoring Report
Date: $DATE
Generated: $(date '+%Y-%m-%d %H:%M:%S')

================================

UPTIME SUMMARY
--------------
EOL

# Uptime statistics
if [ -f "$MONITORING_DIR/uptime/uptime.log" ]; then
    TOTAL_CHECKS=$(grep -c "$(date +%Y-%m-%d)" "$MONITORING_DIR/uptime/uptime.log" || echo "0")
    UP_CHECKS=$(grep -c "$(date +%Y-%m-%d).*UP" "$MONITORING_DIR/uptime/uptime.log" || echo "0")
    DOWN_CHECKS=$(grep -c "$(date +%Y-%m-%d).*DOWN" "$MONITORING_DIR/uptime/uptime.log" || echo "0")
    
    if [ "$TOTAL_CHECKS" -gt 0 ]; then
        UPTIME_PERCENT=$(echo "scale=2; $UP_CHECKS * 100 / $TOTAL_CHECKS" | bc -l 2>/dev/null || echo "0")
    else
        UPTIME_PERCENT="0"
    fi
    
    cat >> "$REPORT_FILE" << EOL
Total Checks: $TOTAL_CHECKS
Successful: $UP_CHECKS
Failed: $DOWN_CHECKS
Uptime: ${UPTIME_PERCENT}%

EOL
else
    echo "No uptime data available" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

# Performance statistics
cat >> "$REPORT_FILE" << EOL
PERFORMANCE SUMMARY
-------------------
EOL

if [ -f "$MONITORING_DIR/metrics/performance.log" ]; then
    # Get today's performance data
    TODAY_PERF=$(grep "$(date +%Y-%m-%d)" "$MONITORING_DIR/metrics/performance.log" | cut -d',' -f2)
    
    if [ -n "$TODAY_PERF" ]; then
        AVG_RESPONSE=$(echo "$TODAY_PERF" | awk '{sum+=$1; count++} END {print sum/count}' 2>/dev/null || echo "0")
        MAX_RESPONSE=$(echo "$TODAY_PERF" | sort -n | tail -1)
        MIN_RESPONSE=$(echo "$TODAY_PERF" | sort -n | head -1)
        
        cat >> "$REPORT_FILE" << EOL
Average Response Time: ${AVG_RESPONSE}s
Max Response Time: ${MAX_RESPONSE}s
Min Response Time: ${MIN_RESPONSE}s

EOL
    else
        echo "No performance data for today" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    fi
else
    echo "No performance data available" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

# Error summary
cat >> "$REPORT_FILE" << EOL
ERROR SUMMARY
-------------
EOL

if [ -f "$LOGS_DIR/app-$DATE.log" ]; then
    ERROR_COUNT=$(grep -c "\[ERROR\]" "$LOGS_DIR/app-$DATE.log" 2>/dev/null || echo "0")
    WARNING_COUNT=$(grep -c "\[WARNING\]" "$LOGS_DIR/app-$DATE.log" 2>/dev/null || echo "0")
    CRITICAL_COUNT=$(grep -c "\[CRITICAL\]" "$LOGS_DIR/app-$DATE.log" 2>/dev/null || echo "0")
    
    cat >> "$REPORT_FILE" << EOL
Errors: $ERROR_COUNT
Warnings: $WARNING_COUNT
Critical: $CRITICAL_COUNT

EOL
else
    echo "No error logs for today" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

# Disk usage
cat >> "$REPORT_FILE" << EOL
DISK USAGE
----------
EOL

if [ -f "$MONITORING_DIR/metrics/disk.log" ]; then
    LATEST_DISK=$(tail -1 "$MONITORING_DIR/metrics/disk.log" | cut -d',' -f2)
    echo "Current Disk Usage: ${LATEST_DISK}%" >> "$REPORT_FILE"
else
    echo "No disk usage data available" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"
echo "Report generated at $(date)" >> "$REPORT_FILE"

# Send report by email (if mail is configured)
mail -s "Portfolio Daily Report - $DATE" admin@localhost < "$REPORT_FILE" 2>/dev/null || true

# Cleanup old reports (keep last 30 days)
find "$REPORT_DIR" -name "daily-report-*.txt" -mtime +30 -delete 2>/dev/null || true
EOF
    
    chmod +x "$MONITORING_DIR/generate-report.sh"
    
    log_success "Daily report generator created"
}

# Main setup function
main() {
    log_info "Setting up monitoring and alerting system..."
    
    setup_directories
    setup_log_rotation
    setup_uptime_monitoring
    setup_performance_monitoring
    setup_disk_monitoring
    setup_error_monitoring
    setup_health_check
    setup_cron_jobs
    setup_reports
    
    log_success "Monitoring system setup complete!"
    echo
    log_info "Next steps:"
    echo "1. Configure email delivery for alerts"
    echo "2. Load cron jobs: crontab $MONITORING_DIR/monitoring-crontab"
    echo "3. Test health check: curl http://localhost:8000/health.php"
    echo "4. Review monitoring configuration in $MONITORING_DIR"
}

# Run main function
main "$@"