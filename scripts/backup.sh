#!/bin/bash

# Automated Backup System
# Handles database and file backups with retention policies

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/storage/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE=$(date +%Y-%m-%d)

# Load environment configuration
if [[ -f "$PROJECT_ROOT/.env" ]]; then
    source "$PROJECT_ROOT/.env"
elif [[ -f "$PROJECT_ROOT/.env.production" ]]; then
    source "$PROJECT_ROOT/.env.production"
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] $1" >> "$BACKUP_DIR/backup.log"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [SUCCESS] $1" >> "$BACKUP_DIR/backup.log"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [WARNING] $1" >> "$BACKUP_DIR/backup.log"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] $1" >> "$BACKUP_DIR/backup.log"
}

# Create backup directories
setup_backup_dirs() {
    mkdir -p "$BACKUP_DIR"/{database,files,full,logs}
    mkdir -p "$BACKUP_DIR/logs"
    
    # Ensure log file exists
    touch "$BACKUP_DIR/backup.log"
}

# Database backup
backup_database() {
    log_info "Starting database backup..."
    
    local db_backup_file="$BACKUP_DIR/database/portfolio_db_$TIMESTAMP.sql"
    local compressed_file="$db_backup_file.gz"
    
    # Check if database credentials are available
    if [[ -z "$DB_HOST" || -z "$DB_NAME" || -z "$DB_USERNAME" ]]; then
        log_error "Database credentials not found in environment"
        return 1
    fi
    
    # Create database dump
    if [[ -n "$DB_PASSWORD" ]]; then
        mysqldump -h"$DB_HOST" -u"$DB_USERNAME" -p"$DB_PASSWORD" \
            --single-transaction \
            --routines \
            --triggers \
            "$DB_NAME" > "$db_backup_file" 2>/dev/null
    else
        mysqldump -h"$DB_HOST" -u"$DB_USERNAME" \
            --single-transaction \
            --routines \
            --triggers \
            "$DB_NAME" > "$db_backup_file" 2>/dev/null
    fi
    
    if [[ $? -eq 0 ]]; then
        # Compress the backup
        gzip "$db_backup_file"
        
        local file_size=$(du -h "$compressed_file" | cut -f1)
        log_success "Database backup completed: $compressed_file ($file_size)"
        
        # Test backup integrity
        if zcat "$compressed_file" | head -10 | grep -q "MySQL dump"; then
            log_success "Database backup integrity verified"
            echo "$compressed_file" # Return backup file path
        else
            log_error "Database backup integrity check failed"
            return 1
        fi
    else
        log_error "Database backup failed"
        return 1
    fi
}

# File backup
backup_files() {
    log_info "Starting file backup..."
    
    local files_backup_file="$BACKUP_DIR/files/portfolio_files_$TIMESTAMP.tar.gz"
    
    # Files and directories to backup
    local backup_paths=(
        "assets/uploads"
        "storage/sessions"
        "config"
        ".env*"
        "composer.json"
        "composer.lock"
        "package.json"
        "package-lock.json"
    )
    
    # Create file backup
    cd "$PROJECT_ROOT"
    
    # Build tar command with existing paths only
    local tar_args=()
    for path in "${backup_paths[@]}"; do
        if [[ -e "$path" ]]; then
            tar_args+=("$path")
        fi
    done
    
    if [[ ${#tar_args[@]} -gt 0 ]]; then
        tar -czf "$files_backup_file" "${tar_args[@]}" 2>/dev/null
        
        if [[ $? -eq 0 ]]; then
            local file_size=$(du -h "$files_backup_file" | cut -f1)
            log_success "File backup completed: $files_backup_file ($file_size)"
            echo "$files_backup_file" # Return backup file path
        else
            log_error "File backup failed"
            return 1
        fi
    else
        log_warning "No files found to backup"
        return 1
    fi
}

# Full system backup
backup_full() {
    log_info "Starting full system backup..."
    
    local full_backup_file="$BACKUP_DIR/full/portfolio_full_$TIMESTAMP.tar.gz"
    
    # Exclude directories
    local exclude_dirs=(
        "node_modules"
        "vendor"
        ".git"
        "storage/logs"
        "storage/cache"
        "storage/backups"
        "tests"
        ".github"
    )
    
    # Build exclude arguments
    local exclude_args=()
    for dir in "${exclude_dirs[@]}"; do
        exclude_args+=("--exclude=$dir")
    done
    
    # Create full backup
    cd "$(dirname "$PROJECT_ROOT")"
    tar -czf "$full_backup_file" "${exclude_args[@]}" "$(basename "$PROJECT_ROOT")" 2>/dev/null
    
    if [[ $? -eq 0 ]]; then
        local file_size=$(du -h "$full_backup_file" | cut -f1)
        log_success "Full backup completed: $full_backup_file ($file_size)"
        echo "$full_backup_file" # Return backup file path
    else
        log_error "Full backup failed"
        return 1
    fi
}

# Upload to cloud storage (if configured)
upload_to_cloud() {
    local backup_file=$1
    local backup_type=$2
    
    if [[ -z "$AWS_BUCKET" ]]; then
        log_info "Cloud storage not configured, skipping upload"
        return 0
    fi
    
    log_info "Uploading $backup_type backup to cloud storage..."
    
    # Check if AWS CLI is available
    if ! command -v aws &> /dev/null; then
        log_warning "AWS CLI not found, skipping cloud upload"
        return 0
    fi
    
    # Upload to S3
    local s3_path="s3://$AWS_BUCKET/portfolio-backups/$backup_type/$(basename "$backup_file")"
    
    aws s3 cp "$backup_file" "$s3_path" --storage-class STANDARD_IA
    
    if [[ $? -eq 0 ]]; then
        log_success "Backup uploaded to cloud: $s3_path"
    else
        log_error "Cloud upload failed for: $backup_file"
        return 1
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    log_info "Cleaning up old backups..."
    
    local retention_days=${BACKUP_RETENTION_DAYS:-30}
    local cleanup_count=0
    
    # Clean up each backup type
    for backup_type in database files full; do
        local backup_path="$BACKUP_DIR/$backup_type"
        
        if [[ -d "$backup_path" ]]; then
            # Find and delete old backups
            find "$backup_path" -name "*.gz" -type f -mtime +$retention_days -print0 | \
            while IFS= read -r -d '' file; do
                rm "$file"
                ((cleanup_count++))
                log_info "Removed old backup: $(basename "$file")"
            done
        fi
    done
    
    if [[ $cleanup_count -gt 0 ]]; then
        log_success "Cleaned up $cleanup_count old backups"
    else
        log_info "No old backups to clean up"
    fi
}

# Verify backup integrity
verify_backup() {
    local backup_file=$1
    local backup_type=$2
    
    log_info "Verifying $backup_type backup integrity..."
    
    case "$backup_type" in
        "database")
            # Test database backup
            if zcat "$backup_file" | head -20 | grep -q "MySQL dump"; then
                log_success "Database backup integrity verified"
                return 0
            else
                log_error "Database backup integrity check failed"
                return 1
            fi
            ;;
        "files"|"full")
            # Test archive integrity
            if tar -tzf "$backup_file" >/dev/null 2>&1; then
                log_success "Archive backup integrity verified"
                return 0
            else
                log_error "Archive backup integrity check failed"
                return 1
            fi
            ;;
        *)
            log_warning "Unknown backup type for verification: $backup_type"
            return 0
            ;;
    esac
}

# Send backup notification
send_notification() {
    local backup_status=$1
    local backup_details=$2
    
    if [[ -z "$BACKUP_NOTIFICATION_EMAIL" ]]; then
        return 0
    fi
    
    local subject
    local body
    
    if [[ "$backup_status" == "success" ]]; then
        subject="Portfolio Backup Successful - $DATE"
        body="Backup completed successfully on $DATE at $(date '+%H:%M:%S')

Backup Details:
$backup_details

System: $(hostname)
Backup Location: $BACKUP_DIR"
    else
        subject="Portfolio Backup Failed - $DATE"
        body="Backup failed on $DATE at $(date '+%H:%M:%S')

Error Details:
$backup_details

System: $(hostname)
Please check the backup logs for more information."
    fi
    
    # Send email notification
    echo "$body" | mail -s "$subject" "$BACKUP_NOTIFICATION_EMAIL" 2>/dev/null || \
    log_warning "Failed to send backup notification email"
}

# Generate backup report
generate_report() {
    local backup_files=("$@")
    
    local report_file="$BACKUP_DIR/logs/backup_report_$DATE.txt"
    
    cat > "$report_file" << EOF
Portfolio Backup Report
Date: $DATE
Time: $(date '+%H:%M:%S')
System: $(hostname)

Backup Summary:
===============
EOF
    
    local total_size=0
    local backup_count=0
    
    for backup_file in "${backup_files[@]}"; do
        if [[ -f "$backup_file" ]]; then
            local file_size_bytes=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file" 2>/dev/null || echo "0")
            local file_size_human=$(du -h "$backup_file" | cut -f1)
            local backup_type=$(basename "$(dirname "$backup_file")")
            
            echo "- $backup_type: $(basename "$backup_file") ($file_size_human)" >> "$report_file"
            
            total_size=$((total_size + file_size_bytes))
            ((backup_count++))
        fi
    done
    
    # Convert total size to human readable
    local total_size_human
    if [[ $total_size -gt 1073741824 ]]; then
        total_size_human="$(echo "scale=2; $total_size / 1073741824" | bc)GB"
    elif [[ $total_size -gt 1048576 ]]; then
        total_size_human="$(echo "scale=2; $total_size / 1048576" | bc)MB"
    else
        total_size_human="$(echo "scale=2; $total_size / 1024" | bc)KB"
    fi
    
    cat >> "$report_file" << EOF

Total Backups: $backup_count
Total Size: $total_size_human

Backup Locations:
=================
Database: $BACKUP_DIR/database/
Files: $BACKUP_DIR/files/
Full: $BACKUP_DIR/full/

Storage Information:
====================
Available Space: $(df -h "$BACKUP_DIR" | tail -1 | awk '{print $4}')
Used Space: $(df -h "$BACKUP_DIR" | tail -1 | awk '{print $3}')

Report generated at: $(date)
EOF
    
    log_success "Backup report generated: $report_file"
    echo "$total_size_human"
}

# Main backup function
run_backup() {
    local backup_type=${1:-"full"}
    
    log_info "Starting $backup_type backup process..."
    
    setup_backup_dirs
    
    local backup_files=()
    local backup_details=""
    local success=true
    
    case "$backup_type" in
        "database")
            if backup_file=$(backup_database); then
                backup_files+=("$backup_file")
                verify_backup "$backup_file" "database"
                upload_to_cloud "$backup_file" "database"
            else
                success=false
            fi
            ;;
        "files")
            if backup_file=$(backup_files); then
                backup_files+=("$backup_file")
                verify_backup "$backup_file" "files"
                upload_to_cloud "$backup_file" "files"
            else
                success=false
            fi
            ;;
        "full")
            # Run database backup
            if db_backup_file=$(backup_database); then
                backup_files+=("$db_backup_file")
                verify_backup "$db_backup_file" "database"
                upload_to_cloud "$db_backup_file" "database"
            else
                success=false
            fi
            
            # Run file backup
            if files_backup_file=$(backup_files); then
                backup_files+=("$files_backup_file")
                verify_backup "$files_backup_file" "files"
                upload_to_cloud "$files_backup_file" "files"
            else
                success=false
            fi
            
            # Run full system backup
            if full_backup_file=$(backup_full); then
                backup_files+=("$full_backup_file")
                verify_backup "$full_backup_file" "full"
                upload_to_cloud "$full_backup_file" "full"
            else
                success=false
            fi
            ;;
        *)
            log_error "Unknown backup type: $backup_type"
            exit 1
            ;;
    esac
    
    # Generate report
    if [[ ${#backup_files[@]} -gt 0 ]]; then
        total_size=$(generate_report "${backup_files[@]}")
        backup_details="Backup Type: $backup_type
Files Created: ${#backup_files[@]}
Total Size: $total_size"
    fi
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Send notification
    if [[ "$success" == "true" ]]; then
        log_success "Backup process completed successfully"
        send_notification "success" "$backup_details"
    else
        log_error "Backup process completed with errors"
        send_notification "failure" "$backup_details"
        exit 1
    fi
}

# Restore function
restore_backup() {
    local backup_file=$1
    local restore_type=$2
    
    if [[ ! -f "$backup_file" ]]; then
        log_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    log_info "Starting restore from: $backup_file"
    
    case "$restore_type" in
        "database")
            log_info "Restoring database..."
            
            # Create database if it doesn't exist
            mysql -h"$DB_HOST" -u"$DB_USERNAME" -p"$DB_PASSWORD" \
                -e "CREATE DATABASE IF NOT EXISTS $DB_NAME" 2>/dev/null
            
            # Restore database
            zcat "$backup_file" | mysql -h"$DB_HOST" -u"$DB_USERNAME" -p"$DB_PASSWORD" "$DB_NAME"
            
            if [[ $? -eq 0 ]]; then
                log_success "Database restored successfully"
            else
                log_error "Database restore failed"
                exit 1
            fi
            ;;
        "files")
            log_info "Restoring files..."
            
            # Extract files
            cd "$PROJECT_ROOT"
            tar -xzf "$backup_file"
            
            if [[ $? -eq 0 ]]; then
                log_success "Files restored successfully"
            else
                log_error "File restore failed"
                exit 1
            fi
            ;;
        *)
            log_error "Unknown restore type: $restore_type"
            exit 1
            ;;
    esac
}

# List available backups
list_backups() {
    local backup_type=${1:-"all"}
    
    echo "Available Backups:"
    echo "=================="
    
    if [[ "$backup_type" == "all" || "$backup_type" == "database" ]]; then
        echo
        echo "Database Backups:"
        ls -lh "$BACKUP_DIR/database/"*.gz 2>/dev/null | awk '{print $9, $5, $6, $7, $8}' || echo "No database backups found"
    fi
    
    if [[ "$backup_type" == "all" || "$backup_type" == "files" ]]; then
        echo
        echo "File Backups:"
        ls -lh "$BACKUP_DIR/files/"*.gz 2>/dev/null | awk '{print $9, $5, $6, $7, $8}' || echo "No file backups found"
    fi
    
    if [[ "$backup_type" == "all" || "$backup_type" == "full" ]]; then
        echo
        echo "Full Backups:"
        ls -lh "$BACKUP_DIR/full/"*.gz 2>/dev/null | awk '{print $9, $5, $6, $7, $8}' || echo "No full backups found"
    fi
}

# Show help
show_help() {
    cat << EOF
Portfolio Backup System

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    backup [type]       Create backup (database, files, full)
    restore <file>      Restore from backup file
    list [type]         List available backups
    cleanup             Remove old backups
    help                Show this help

Examples:
    $0 backup database
    $0 backup full
    $0 restore /path/to/backup.sql.gz
    $0 list database
    $0 cleanup

Environment Variables:
    BACKUP_RETENTION_DAYS    Days to keep backups (default: 30)
    BACKUP_NOTIFICATION_EMAIL Email for backup notifications
    AWS_BUCKET              S3 bucket for cloud storage
EOF
}

# Main script logic
case "${1:-backup}" in
    backup)
        run_backup "${2:-full}"
        ;;
    restore)
        if [[ -z "$2" ]]; then
            log_error "Backup file path required for restore"
            show_help
            exit 1
        fi
        
        # Detect restore type from file path
        if [[ "$2" == *"database"* ]]; then
            restore_type="database"
        elif [[ "$2" == *"files"* ]]; then
            restore_type="files"
        else
            log_error "Cannot determine restore type from file path"
            exit 1
        fi
        
        restore_backup "$2" "$restore_type"
        ;;
    list)
        list_backups "${2:-all}"
        ;;
    cleanup)
        setup_backup_dirs
        cleanup_old_backups
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac