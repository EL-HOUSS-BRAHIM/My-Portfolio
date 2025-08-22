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
