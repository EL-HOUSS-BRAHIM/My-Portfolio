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
