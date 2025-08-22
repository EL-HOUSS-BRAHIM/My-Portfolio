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
