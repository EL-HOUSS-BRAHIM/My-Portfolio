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
