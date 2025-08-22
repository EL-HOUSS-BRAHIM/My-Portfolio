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
