#!/bin/bash

# Dependency Update Automation Script
# Automatically checks for and updates project dependencies

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
UPDATE_LOG_DIR="$PROJECT_ROOT/storage/logs/dependency-updates"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
UPDATE_LOG="$UPDATE_LOG_DIR/dependency_update_$TIMESTAMP.log"

# Notification settings
EMAIL_NOTIFY="${DEPENDENCY_UPDATE_EMAIL:-admin@brahim-elhouss.me}"
SLACK_WEBHOOK="${DEPENDENCY_UPDATE_SLACK_WEBHOOK:-}"

# Update modes
DRY_RUN=false
AUTO_APPROVE=false
SECURITY_ONLY=false
BACKUP_BEFORE_UPDATE=true

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    local msg="[INFO] $(date '+%Y-%m-%d %H:%M:%S') - $1"
    echo -e "${BLUE}$msg${NC}"
    echo "$msg" >> "$UPDATE_LOG"
}

log_success() {
    local msg="[SUCCESS] $(date '+%Y-%m-%d %H:%M:%S') - $1"
    echo -e "${GREEN}$msg${NC}"
    echo "$msg" >> "$UPDATE_LOG"
}

log_warning() {
    local msg="[WARNING] $(date '+%Y-%m-%d %H:%M:%S') - $1"
    echo -e "${YELLOW}$msg${NC}"
    echo "$msg" >> "$UPDATE_LOG"
}

log_error() {
    local msg="[ERROR] $(date '+%Y-%m-%d %H:%M:%S') - $1"
    echo -e "${RED}$msg${NC}"
    echo "$msg" >> "$UPDATE_LOG"
}

# Setup logging
setup_logging() {
    mkdir -p "$UPDATE_LOG_DIR"
    
    cat > "$UPDATE_LOG" << EOF
Dependency Update Log
=====================
Date: $(date)
Project: $PROJECT_ROOT
Mode: $([ "$DRY_RUN" = true ] && echo "Dry Run" || echo "Live Update")
Security Only: $SECURITY_ONLY
Auto Approve: $AUTO_APPROVE

EOF
}

# Send notification
send_notification() {
    local title="$1"
    local message="$2"
    local severity="$3"
    
    # Email notification
    if [[ -n "$EMAIL_NOTIFY" ]] && command -v mail &> /dev/null; then
        {
            echo "Subject: [$severity] $title"
            echo ""
            echo "$message"
            echo ""
            echo "Log file: $UPDATE_LOG"
        } | mail "$EMAIL_NOTIFY"
    fi
    
    # Slack notification
    if [[ -n "$SLACK_WEBHOOK" ]] && command -v curl &> /dev/null; then
        local color=""
        case "$severity" in
            "SUCCESS") color="good" ;;
            "WARNING") color="warning" ;;
            "ERROR") color="danger" ;;
            *) color="info" ;;
        esac
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"attachments\":[{\"color\":\"$color\",\"title\":\"$title\",\"text\":\"$message\"}]}" \
            "$SLACK_WEBHOOK" &> /dev/null || true
    fi
}

# Create backup before updates
create_backup() {
    if [[ "$BACKUP_BEFORE_UPDATE" = true ]]; then
        log_info "Creating backup before dependency updates..."
        
        local backup_script="$SCRIPT_DIR/backup.sh"
        
        if [[ -f "$backup_script" ]]; then
            if bash "$backup_script" --type files --tag "pre-dependency-update"; then
                log_success "Backup created successfully"
                return 0
            else
                log_error "Backup failed"
                return 1
            fi
        else
            log_warning "Backup script not found at $backup_script"
            
            # Fallback: simple file backup
            local backup_dir="$PROJECT_ROOT/storage/backups/pre-update-$TIMESTAMP"
            mkdir -p "$backup_dir"
            
            if cp -r "$PROJECT_ROOT/composer.json" "$PROJECT_ROOT/composer.lock" "$backup_dir/" 2>/dev/null; then
                log_info "Basic composer files backed up to $backup_dir"
            fi
            
            if [[ -f "$PROJECT_ROOT/package.json" ]]; then
                cp "$PROJECT_ROOT/package.json" "$PROJECT_ROOT/package-lock.json" "$backup_dir/" 2>/dev/null || true
                log_info "Basic npm files backed up to $backup_dir"
            fi
        fi
    fi
}

# Check for outdated composer dependencies
check_composer_outdated() {
    log_info "Checking for outdated Composer dependencies..."
    
    if [[ ! -f "$PROJECT_ROOT/composer.json" ]]; then
        log_info "No composer.json found, skipping Composer check"
        return 0
    fi
    
    cd "$PROJECT_ROOT"
    
    # Check for outdated packages
    local outdated_output
    if outdated_output=$(composer outdated --format=json 2>/dev/null); then
        local outdated_count=$(echo "$outdated_output" | jq '.installed | length' 2>/dev/null || echo "0")
        
        if [[ "$outdated_count" -gt 0 ]]; then
            log_warning "Found $outdated_count outdated Composer packages"
            
            echo "$outdated_output" | jq -r '.installed[] | "- \(.name): \(.version) -> \(.latest)"' >> "$UPDATE_LOG"
            
            return 1
        else
            log_success "All Composer dependencies are up to date"
            return 0
        fi
    else
        log_error "Failed to check Composer dependencies"
        return 1
    fi
}

# Check for composer security vulnerabilities
check_composer_security() {
    log_info "Checking Composer dependencies for security vulnerabilities..."
    
    if [[ ! -f "$PROJECT_ROOT/composer.json" ]]; then
        return 0
    fi
    
    cd "$PROJECT_ROOT"
    
    # Check for security vulnerabilities
    local audit_output
    if audit_output=$(composer audit --format=json 2>/dev/null); then
        local vuln_count=$(echo "$audit_output" | jq '.advisories | length' 2>/dev/null || echo "0")
        
        if [[ "$vuln_count" -gt 0 ]]; then
            log_error "Found $vuln_count security vulnerabilities in Composer dependencies"
            
            echo "$audit_output" | jq -r '.advisories[] | "- \(.packageName): \(.title)"' >> "$UPDATE_LOG"
            
            return 1
        else
            log_success "No security vulnerabilities found in Composer dependencies"
            return 0
        fi
    else
        log_warning "Could not check Composer security (composer audit not available)"
        return 0
    fi
}

# Update composer dependencies
update_composer_dependencies() {
    log_info "Updating Composer dependencies..."
    
    if [[ ! -f "$PROJECT_ROOT/composer.json" ]]; then
        return 0
    fi
    
    cd "$PROJECT_ROOT"
    
    if [[ "$DRY_RUN" = true ]]; then
        log_info "DRY RUN: Would run 'composer update'"
        return 0
    fi
    
    local update_cmd="composer update"
    
    if [[ "$SECURITY_ONLY" = true ]]; then
        # Update only packages with security vulnerabilities
        local vulnerable_packages
        if vulnerable_packages=$(composer audit --format=json 2>/dev/null | jq -r '.advisories[].packageName' 2>/dev/null); then
            if [[ -n "$vulnerable_packages" ]]; then
                update_cmd="composer update $(echo "$vulnerable_packages" | tr '\n' ' ')"
            else
                log_info "No vulnerable packages to update"
                return 0
            fi
        fi
    fi
    
    log_info "Running: $update_cmd"
    
    if $update_cmd >> "$UPDATE_LOG" 2>&1; then
        log_success "Composer dependencies updated successfully"
        return 0
    else
        log_error "Failed to update Composer dependencies"
        return 1
    fi
}

# Check for outdated npm dependencies
check_npm_outdated() {
    log_info "Checking for outdated NPM dependencies..."
    
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        log_info "No package.json found, skipping NPM check"
        return 0
    fi
    
    cd "$PROJECT_ROOT"
    
    # Check for outdated packages
    local outdated_output
    if outdated_output=$(npm outdated --json 2>/dev/null); then
        local outdated_count=$(echo "$outdated_output" | jq 'keys | length' 2>/dev/null || echo "0")
        
        if [[ "$outdated_count" -gt 0 ]]; then
            log_warning "Found $outdated_count outdated NPM packages"
            
            echo "$outdated_output" | jq -r 'to_entries[] | "- \(.key): \(.value.current) -> \(.value.latest)"' >> "$UPDATE_LOG"
            
            return 1
        else
            log_success "All NPM dependencies are up to date"
            return 0
        fi
    else
        # npm outdated returns non-zero when packages are outdated
        if npm outdated >> "$UPDATE_LOG" 2>&1; then
            log_success "All NPM dependencies are up to date"
            return 0
        else
            log_warning "Some NPM packages may be outdated"
            return 1
        fi
    fi
}

# Check for npm security vulnerabilities
check_npm_security() {
    log_info "Checking NPM dependencies for security vulnerabilities..."
    
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        return 0
    fi
    
    cd "$PROJECT_ROOT"
    
    # Check for security vulnerabilities
    local audit_output
    if audit_output=$(npm audit --json 2>/dev/null); then
        local vuln_count=$(echo "$audit_output" | jq '.metadata.vulnerabilities.total' 2>/dev/null || echo "0")
        
        if [[ "$vuln_count" -gt 0 ]]; then
            log_error "Found $vuln_count security vulnerabilities in NPM dependencies"
            
            echo "$audit_output" | jq -r '.advisories[] | "- \(.module_name): \(.title)"' 2>/dev/null >> "$UPDATE_LOG" || true
            
            return 1
        else
            log_success "No security vulnerabilities found in NPM dependencies"
            return 0
        fi
    else
        log_warning "Could not check NPM security"
        return 0
    fi
}

# Update npm dependencies
update_npm_dependencies() {
    log_info "Updating NPM dependencies..."
    
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        return 0
    fi
    
    cd "$PROJECT_ROOT"
    
    if [[ "$DRY_RUN" = true ]]; then
        log_info "DRY RUN: Would run 'npm update'"
        return 0
    fi
    
    local update_cmd="npm update"
    
    if [[ "$SECURITY_ONLY" = true ]]; then
        update_cmd="npm audit fix"
    fi
    
    log_info "Running: $update_cmd"
    
    if $update_cmd >> "$UPDATE_LOG" 2>&1; then
        log_success "NPM dependencies updated successfully"
        return 0
    else
        log_error "Failed to update NPM dependencies"
        return 1
    fi
}

# Run tests after updates
run_tests() {
    log_info "Running tests after dependency updates..."
    
    local test_failed=false
    
    # Run PHP tests if available
    if [[ -f "$PROJECT_ROOT/phpunit.xml" ]] && command -v phpunit &> /dev/null; then
        log_info "Running PHPUnit tests..."
        
        cd "$PROJECT_ROOT"
        
        if phpunit >> "$UPDATE_LOG" 2>&1; then
            log_success "PHPUnit tests passed"
        else
            log_error "PHPUnit tests failed"
            test_failed=true
        fi
    fi
    
    # Run npm tests if available
    if [[ -f "$PROJECT_ROOT/package.json" ]] && command -v npm &> /dev/null; then
        if npm run test --silent &> /dev/null; then
            log_info "Running NPM tests..."
            
            cd "$PROJECT_ROOT"
            
            if npm test >> "$UPDATE_LOG" 2>&1; then
                log_success "NPM tests passed"
            else
                log_error "NPM tests failed"
                test_failed=true
            fi
        fi
    fi
    
    if [[ "$test_failed" = true ]]; then
        return 1
    else
        return 0
    fi
}

# Rollback changes if tests fail
rollback_changes() {
    log_warning "Rolling back dependency changes due to test failures..."
    
    if [[ "$DRY_RUN" = true ]]; then
        log_info "DRY RUN: Would rollback changes"
        return 0
    fi
    
    # Restore from backup
    local backup_dir="$PROJECT_ROOT/storage/backups/pre-update-$TIMESTAMP"
    
    if [[ -d "$backup_dir" ]]; then
        cd "$PROJECT_ROOT"
        
        # Restore composer files
        if [[ -f "$backup_dir/composer.json" ]]; then
            cp "$backup_dir/composer.json" "$PROJECT_ROOT/"
            cp "$backup_dir/composer.lock" "$PROJECT_ROOT/" 2>/dev/null || true
            composer install >> "$UPDATE_LOG" 2>&1
            log_info "Composer dependencies rolled back"
        fi
        
        # Restore npm files
        if [[ -f "$backup_dir/package.json" ]]; then
            cp "$backup_dir/package.json" "$PROJECT_ROOT/"
            cp "$backup_dir/package-lock.json" "$PROJECT_ROOT/" 2>/dev/null || true
            npm install >> "$UPDATE_LOG" 2>&1
            log_info "NPM dependencies rolled back"
        fi
        
        log_success "Rollback completed"
    else
        log_error "No backup found for rollback"
        return 1
    fi
}

# Generate update summary
generate_summary() {
    local updates_applied="$1"
    local security_fixes="$2"
    local test_status="$3"
    
    cat >> "$UPDATE_LOG" << EOF

DEPENDENCY UPDATE SUMMARY
=========================
Updates Applied: $updates_applied
Security Fixes: $security_fixes
Test Status: $test_status
Timestamp: $(date)

EOF
    
    local summary_msg="Dependency update completed. Updates: $updates_applied, Security fixes: $security_fixes, Tests: $test_status"
    
    if [[ "$updates_applied" -gt 0 ]] || [[ "$security_fixes" -gt 0 ]]; then
        if [[ "$test_status" = "PASSED" ]]; then
            send_notification "Dependency Update Successful" "$summary_msg" "SUCCESS"
        else
            send_notification "Dependency Update Issues" "$summary_msg" "WARNING"
        fi
    fi
    
    log_info "Update summary: $summary_msg"
    log_info "Full log: $UPDATE_LOG"
}

# Main update process
run_dependency_update() {
    local updates_applied=0
    local security_fixes=0
    local test_status="SKIPPED"
    
    log_info "Starting dependency update process..."
    
    # Create backup
    if ! create_backup; then
        log_error "Failed to create backup, aborting update"
        return 1
    fi
    
    # Check and update Composer dependencies
    local composer_outdated=false
    local composer_vulnerable=false
    
    if ! check_composer_outdated; then
        composer_outdated=true
    fi
    
    if ! check_composer_security; then
        composer_vulnerable=true
        ((security_fixes++))
    fi
    
    if [[ "$composer_outdated" = true ]] || [[ "$composer_vulnerable" = true ]]; then
        if [[ "$SECURITY_ONLY" = false ]] || [[ "$composer_vulnerable" = true ]]; then
            if update_composer_dependencies; then
                ((updates_applied++))
            fi
        fi
    fi
    
    # Check and update NPM dependencies
    local npm_outdated=false
    local npm_vulnerable=false
    
    if ! check_npm_outdated; then
        npm_outdated=true
    fi
    
    if ! check_npm_security; then
        npm_vulnerable=true
        ((security_fixes++))
    fi
    
    if [[ "$npm_outdated" = true ]] || [[ "$npm_vulnerable" = true ]]; then
        if [[ "$SECURITY_ONLY" = false ]] || [[ "$npm_vulnerable" = true ]]; then
            if update_npm_dependencies; then
                ((updates_applied++))
            fi
        fi
    fi
    
    # Run tests if updates were applied
    if [[ "$updates_applied" -gt 0 ]] && [[ "$DRY_RUN" = false ]]; then
        if run_tests; then
            test_status="PASSED"
        else
            test_status="FAILED"
            
            if [[ "$AUTO_APPROVE" = false ]]; then
                log_warning "Tests failed. Rolling back changes..."
                rollback_changes
                updates_applied=0
            fi
        fi
    fi
    
    generate_summary "$updates_applied" "$security_fixes" "$test_status"
}

# Show help
show_help() {
    cat << EOF
Dependency Update Automation Tool

Usage: $0 [OPTIONS]

Options:
    --dry-run       Show what would be updated without making changes
    --security-only Update only packages with security vulnerabilities
    --auto-approve  Automatically approve updates without confirmation
    --no-backup     Skip creating backup before updates
    --no-tests      Skip running tests after updates
    --email EMAIL   Send notification email to specified address
    --help          Show this help

Environment Variables:
    DEPENDENCY_UPDATE_EMAIL         Email address for notifications
    DEPENDENCY_UPDATE_SLACK_WEBHOOK Slack webhook URL for notifications

Examples:
    $0                              # Check and update all dependencies
    $0 --dry-run                    # Check what needs updating
    $0 --security-only             # Update only vulnerable packages
    $0 --auto-approve --no-tests   # Update without confirmation or tests

The script will:
1. Create a backup of current dependency files
2. Check for outdated and vulnerable dependencies
3. Update dependencies (if not dry run)
4. Run tests to verify updates
5. Rollback if tests fail (unless auto-approved)
6. Send notifications about the update status
EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --security-only)
            SECURITY_ONLY=true
            shift
            ;;
        --auto-approve)
            AUTO_APPROVE=true
            shift
            ;;
        --no-backup)
            BACKUP_BEFORE_UPDATE=false
            shift
            ;;
        --no-tests)
            RUN_TESTS=false
            shift
            ;;
        --email)
            EMAIL_NOTIFY="$2"
            shift 2
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Main execution
setup_logging

if [[ "$DRY_RUN" = true ]]; then
    log_info "Running in DRY RUN mode - no changes will be made"
fi

run_dependency_update