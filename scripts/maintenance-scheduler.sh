#!/bin/bash

# Maintenance Workflow Scheduler
# Sets up and manages automated maintenance tasks

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MAINTENANCE_LOG_DIR="$PROJECT_ROOT/storage/logs/maintenance"
CRON_BACKUP_FILE="$PROJECT_ROOT/storage/maintenance/cron-backup.txt"

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

# Setup maintenance directories
setup_maintenance() {
    mkdir -p "$MAINTENANCE_LOG_DIR"
    mkdir -p "$(dirname "$CRON_BACKUP_FILE")"
    
    log_info "Maintenance directories created"
}

# Check if running as correct user
check_user() {
    local current_user=$(whoami)
    
    if [[ "$current_user" == "root" ]]; then
        log_warning "Running as root. Consider running as the web server user for better security."
    fi
    
    log_info "Running as user: $current_user"
}

# Backup current crontab
backup_crontab() {
    log_info "Backing up current crontab..."
    
    if crontab -l > "$CRON_BACKUP_FILE" 2>/dev/null; then
        log_success "Crontab backed up to $CRON_BACKUP_FILE"
    else
        log_info "No existing crontab found"
        touch "$CRON_BACKUP_FILE"
    fi
}

# Install maintenance cron jobs
install_cron_jobs() {
    log_info "Installing maintenance cron jobs..."
    
    # Create temporary cron file
    local temp_cron=$(mktemp)
    
    # Copy existing crontab
    crontab -l > "$temp_cron" 2>/dev/null || true
    
    # Remove existing maintenance jobs (if any)
    sed -i '/# Portfolio Maintenance/d' "$temp_cron" 2>/dev/null || true
    sed -i '/portfolio.*backup/d' "$temp_cron" 2>/dev/null || true
    sed -i '/portfolio.*security/d' "$temp_cron" 2>/dev/null || true
    sed -i '/portfolio.*dependency/d' "$temp_cron" 2>/dev/null || true
    sed -i '/portfolio.*cleanup/d' "$temp_cron" 2>/dev/null || true
    
    # Add maintenance jobs
    cat >> "$temp_cron" << EOF

# Portfolio Maintenance Tasks - Auto-generated $(date)
# Daily backup at 2:00 AM
0 2 * * * $SCRIPT_DIR/backup.sh --type full --retention 30 >> $MAINTENANCE_LOG_DIR/backup.log 2>&1

# Weekly security audit on Sundays at 3:00 AM
0 3 * * 0 $SCRIPT_DIR/security-audit.sh --full >> $MAINTENANCE_LOG_DIR/security.log 2>&1

# Monthly dependency updates on 1st day at 4:00 AM
0 4 1 * * $SCRIPT_DIR/dependency-update.sh --security-only >> $MAINTENANCE_LOG_DIR/dependency.log 2>&1

# Weekly log cleanup on Saturdays at 1:00 AM
0 1 * * 6 $SCRIPT_DIR/maintenance-scheduler.sh --cleanup-logs >> $MAINTENANCE_LOG_DIR/cleanup.log 2>&1

# Daily health check at 6:00 AM
0 6 * * * $SCRIPT_DIR/maintenance-scheduler.sh --health-check >> $MAINTENANCE_LOG_DIR/health.log 2>&1

EOF
    
    # Install new crontab
    if crontab "$temp_cron"; then
        log_success "Maintenance cron jobs installed successfully"
    else
        log_error "Failed to install cron jobs"
        return 1
    fi
    
    # Cleanup
    rm -f "$temp_cron"
    
    # Show installed jobs
    log_info "Installed maintenance schedule:"
    echo "  - Daily backup: 2:00 AM"
    echo "  - Weekly security audit: Sunday 3:00 AM"
    echo "  - Monthly dependency updates: 1st day 4:00 AM"
    echo "  - Weekly log cleanup: Saturday 1:00 AM"
    echo "  - Daily health check: 6:00 AM"
}

# Remove maintenance cron jobs
remove_cron_jobs() {
    log_info "Removing maintenance cron jobs..."
    
    # Create temporary cron file
    local temp_cron=$(mktemp)
    
    # Copy existing crontab and remove maintenance jobs
    crontab -l > "$temp_cron" 2>/dev/null || true
    
    # Remove maintenance jobs
    sed -i '/# Portfolio Maintenance/,+10d' "$temp_cron" 2>/dev/null || true
    
    # Install cleaned crontab
    if crontab "$temp_cron"; then
        log_success "Maintenance cron jobs removed"
    else
        log_error "Failed to remove cron jobs"
        return 1
    fi
    
    # Cleanup
    rm -f "$temp_cron"
}

# Restore crontab from backup
restore_crontab() {
    log_info "Restoring crontab from backup..."
    
    if [[ -f "$CRON_BACKUP_FILE" ]]; then
        if crontab "$CRON_BACKUP_FILE"; then
            log_success "Crontab restored from backup"
        else
            log_error "Failed to restore crontab"
            return 1
        fi
    else
        log_error "No crontab backup found"
        return 1
    fi
}

# Show current maintenance schedule
show_schedule() {
    log_info "Current maintenance schedule:"
    echo
    
    if crontab -l 2>/dev/null | grep -A 10 "Portfolio Maintenance" >/dev/null; then
        crontab -l 2>/dev/null | grep -A 10 "Portfolio Maintenance"
    else
        log_warning "No maintenance cron jobs found"
    fi
    
    echo
    log_info "All cron jobs:"
    crontab -l 2>/dev/null || log_info "No cron jobs configured"
}

# Health check function
run_health_check() {
    local health_log="$MAINTENANCE_LOG_DIR/health_check_$(date +%Y%m%d_%H%M%S).log"
    local issues_found=0
    
    {
        echo "Portfolio Health Check - $(date)"
        echo "================================="
        echo
        
        # Check disk space
        echo "Disk Space Usage:"
        df -h "$PROJECT_ROOT"
        
        local disk_usage=$(df "$PROJECT_ROOT" | awk 'NR==2 {print $5}' | sed 's/%//')
        if [[ "$disk_usage" -gt 80 ]]; then
            echo "WARNING: Disk usage is at ${disk_usage}%"
            ((issues_found++))
        fi
        echo
        
        # Check memory usage
        echo "Memory Usage:"
        free -h
        echo
        
        # Check load average
        echo "System Load:"
        uptime
        echo
        
        # Check web server status
        echo "Web Server Status:"
        if command -v systemctl &> /dev/null; then
            if systemctl is-active --quiet apache2 2>/dev/null; then
                echo "Apache2: Running"
            elif systemctl is-active --quiet nginx 2>/dev/null; then
                echo "Nginx: Running"
            else
                echo "WARNING: No web server detected running"
                ((issues_found++))
            fi
        else
            echo "Systemctl not available - cannot check web server"
        fi
        echo
        
        # Check PHP status
        echo "PHP Status:"
        if command -v php &> /dev/null; then
            echo "PHP Version: $(php --version | head -1)"
            
            # Check for PHP errors in logs
            local php_error_log="/var/log/php_errors.log"
            if [[ -f "$php_error_log" ]]; then
                local recent_errors=$(tail -100 "$php_error_log" | grep "$(date +%Y-%m-%d)" | wc -l)
                if [[ "$recent_errors" -gt 0 ]]; then
                    echo "WARNING: $recent_errors PHP errors found today"
                    ((issues_found++))
                fi
            fi
        else
            echo "WARNING: PHP not found"
            ((issues_found++))
        fi
        echo
        
        # Check database connectivity
        echo "Database Status:"
        if [[ -f "$PROJECT_ROOT/config/database.php" ]] || [[ -f "$PROJECT_ROOT/.env" ]]; then
            # Simple database check (if applicable)
            if command -v mysql &> /dev/null; then
                echo "MySQL client available"
            else
                echo "No MySQL client found"
            fi
        fi
        echo
        
        # Check log file sizes
        echo "Log File Sizes:"
        if [[ -d "$PROJECT_ROOT/storage/logs" ]]; then
            find "$PROJECT_ROOT/storage/logs" -name "*.log" -type f -exec ls -lh {} \; | awk '{print $5, $9}'
            
            # Check for large log files
            local large_logs=$(find "$PROJECT_ROOT/storage/logs" -name "*.log" -type f -size +50M)
            if [[ -n "$large_logs" ]]; then
                echo "WARNING: Large log files found:"
                echo "$large_logs"
                ((issues_found++))
            fi
        fi
        echo
        
        # Check SSL certificate (if applicable)
        echo "SSL Certificate Status:"
        if [[ -f "$PROJECT_ROOT/config/ssl/certificate.crt" ]]; then
            local cert_expiry=$(openssl x509 -enddate -noout -in "$PROJECT_ROOT/config/ssl/certificate.crt" 2>/dev/null | cut -d= -f2)
            if [[ -n "$cert_expiry" ]]; then
                echo "Certificate expires: $cert_expiry"
                
                local expiry_timestamp=$(date -d "$cert_expiry" +%s 2>/dev/null || echo "0")
                local current_timestamp=$(date +%s)
                local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
                
                if [[ "$days_until_expiry" -lt 30 ]]; then
                    echo "WARNING: SSL certificate expires in $days_until_expiry days"
                    ((issues_found++))
                fi
            fi
        else
            echo "No SSL certificate file found"
        fi
        echo
        
        # Summary
        echo "Health Check Summary:"
        echo "Issues Found: $issues_found"
        if [[ "$issues_found" -eq 0 ]]; then
            echo "Status: HEALTHY"
        else
            echo "Status: NEEDS ATTENTION"
        fi
        echo "Check completed at: $(date)"
        
    } > "$health_log"
    
    # Show summary
    if [[ "$issues_found" -eq 0 ]]; then
        log_success "Health check completed - System is healthy"
    else
        log_warning "Health check completed - $issues_found issues found"
    fi
    
    log_info "Full health report: $health_log"
    
    # Send notification if issues found
    if [[ "$issues_found" -gt 0 ]] && [[ -n "${MAINTENANCE_EMAIL:-}" ]]; then
        echo "Portfolio health check found $issues_found issues. See $health_log for details." | \
            mail -s "Portfolio Health Check Alert" "${MAINTENANCE_EMAIL}" 2>/dev/null || true
    fi
}

# Cleanup old log files
cleanup_logs() {
    log_info "Cleaning up old log files..."
    
    local cleaned_count=0
    
    # Clean logs older than 30 days
    if [[ -d "$PROJECT_ROOT/storage/logs" ]]; then
        local old_logs=$(find "$PROJECT_ROOT/storage/logs" -name "*.log" -type f -mtime +30)
        
        if [[ -n "$old_logs" ]]; then
            echo "$old_logs" | while read -r logfile; do
                rm -f "$logfile"
                ((cleaned_count++))
                log_info "Removed old log file: $(basename "$logfile")"
            done
        fi
    fi
    
    # Rotate large log files
    if [[ -d "$PROJECT_ROOT/storage/logs" ]]; then
        local large_logs=$(find "$PROJECT_ROOT/storage/logs" -name "*.log" -type f -size +10M)
        
        if [[ -n "$large_logs" ]]; then
            echo "$large_logs" | while read -r logfile; do
                local rotated_name="${logfile}.$(date +%Y%m%d_%H%M%S).old"
                mv "$logfile" "$rotated_name"
                touch "$logfile"
                log_info "Rotated large log file: $(basename "$logfile")"
            done
        fi
    fi
    
    log_success "Log cleanup completed"
}

# Show maintenance status
show_status() {
    log_info "Portfolio Maintenance Status"
    echo "============================"
    echo
    
    # Check if cron jobs are installed
    if crontab -l 2>/dev/null | grep -q "Portfolio Maintenance"; then
        log_success "Maintenance cron jobs are installed"
    else
        log_warning "Maintenance cron jobs are not installed"
    fi
    
    # Show recent maintenance activities
    echo
    log_info "Recent maintenance logs:"
    
    local log_types=("backup" "security" "dependency" "health" "cleanup")
    
    for log_type in "${log_types[@]}"; do
        local latest_log=$(find "$MAINTENANCE_LOG_DIR" -name "${log_type}*.log" -type f 2>/dev/null | head -1)
        
        if [[ -n "$latest_log" ]]; then
            local log_date=$(stat -c %y "$latest_log" 2>/dev/null | cut -d' ' -f1)
            echo "  - $log_type: $log_date"
        else
            echo "  - $log_type: No logs found"
        fi
    done
    
    # Show disk usage
    echo
    log_info "Storage usage:"
    echo "  - Project size: $(du -sh "$PROJECT_ROOT" 2>/dev/null | cut -f1)"
    echo "  - Log directory: $(du -sh "$MAINTENANCE_LOG_DIR" 2>/dev/null | cut -f1)"
    
    if [[ -d "$PROJECT_ROOT/storage/backups" ]]; then
        echo "  - Backup directory: $(du -sh "$PROJECT_ROOT/storage/backups" 2>/dev/null | cut -f1)"
    fi
}

# Test maintenance scripts
test_scripts() {
    log_info "Testing maintenance scripts..."
    
    local scripts=(
        "backup.sh"
        "security-audit.sh"
        "dependency-update.sh"
    )
    
    local test_failed=false
    
    for script in "${scripts[@]}"; do
        local script_path="$SCRIPT_DIR/$script"
        
        if [[ -f "$script_path" ]] && [[ -x "$script_path" ]]; then
            log_success "$script is executable"
            
            # Test script syntax
            if bash -n "$script_path"; then
                log_success "$script syntax is valid"
            else
                log_error "$script has syntax errors"
                test_failed=true
            fi
        else
            log_error "$script is missing or not executable"
            test_failed=true
        fi
    done
    
    if [[ "$test_failed" = true ]]; then
        log_error "Some maintenance scripts have issues"
        return 1
    else
        log_success "All maintenance scripts are ready"
        return 0
    fi
}

# Show help
show_help() {
    cat << EOF
Portfolio Maintenance Scheduler

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    install         Install maintenance cron jobs
    remove          Remove maintenance cron jobs
    restore         Restore crontab from backup
    schedule        Show current maintenance schedule
    status          Show maintenance status
    health-check    Run system health check
    cleanup-logs    Clean up old log files
    test            Test maintenance scripts
    help            Show this help

Options:
    --force         Force operation without confirmation

Environment Variables:
    MAINTENANCE_EMAIL    Email address for maintenance notifications

Examples:
    $0 install                 # Install automated maintenance tasks
    $0 status                  # Check maintenance status
    $0 health-check           # Run health check manually
    $0 cleanup-logs           # Clean up old logs

Automated Schedule:
    - Daily backup: 2:00 AM
    - Weekly security audit: Sunday 3:00 AM  
    - Monthly dependency updates: 1st day 4:00 AM
    - Weekly log cleanup: Saturday 1:00 AM
    - Daily health check: 6:00 AM
EOF
}

# Main command handling
case "${1:-help}" in
    install)
        setup_maintenance
        check_user
        backup_crontab
        
        if test_scripts; then
            install_cron_jobs
        else
            log_error "Cannot install maintenance jobs - script tests failed"
            exit 1
        fi
        ;;
        
    remove)
        backup_crontab
        remove_cron_jobs
        ;;
        
    restore)
        restore_crontab
        ;;
        
    schedule)
        show_schedule
        ;;
        
    status)
        show_status
        ;;
        
    health-check)
        setup_maintenance
        run_health_check
        ;;
        
    cleanup-logs)
        cleanup_logs
        ;;
        
    test)
        test_scripts
        ;;
        
    help|--help)
        show_help
        ;;
        
    *)
        echo "Unknown command: $1"
        show_help
        exit 1
        ;;
esac