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
