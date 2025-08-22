#!/bin/bash

# Zero-Downtime Deployment Script
# Handles production deployments with zero downtime and rollback capability

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_LOG_DIR="$PROJECT_ROOT/storage/logs/deployment"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEPLOYMENT_LOG="$DEPLOYMENT_LOG_DIR/deployment_$TIMESTAMP.log"

# Deployment settings
BACKUP_BEFORE_DEPLOY=true
RUN_TESTS_BEFORE_DEPLOY=true
HEALTH_CHECK_TIMEOUT=60
ROLLBACK_ON_FAILURE=true

# Environment settings
PRODUCTION_DIR="${PRODUCTION_DIR:-/var/www/brahim-elhouss.me}"
STAGING_DIR="${STAGING_DIR:-/var/www/staging.brahim-elhouss.me}"
BACKUP_DIR="$PROJECT_ROOT/storage/backups/deployments"

# Load balancer settings
ENABLE_LOAD_BALANCER="${ENABLE_LOAD_BALANCER:-false}"
LOAD_BALANCER_SCRIPT="${LOAD_BALANCER_SCRIPT:-}"

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
    echo "$msg" >> "$DEPLOYMENT_LOG"
}

log_success() {
    local msg="[SUCCESS] $(date '+%Y-%m-%d %H:%M:%S') - $1"
    echo -e "${GREEN}$msg${NC}"
    echo "$msg" >> "$DEPLOYMENT_LOG"
}

log_warning() {
    local msg="[WARNING] $(date '+%Y-%m-%d %H:%M:%S') - $1"
    echo -e "${YELLOW}$msg${NC}"
    echo "$msg" >> "$DEPLOYMENT_LOG"
}

log_error() {
    local msg="[ERROR] $(date '+%Y-%m-%d %H:%M:%S') - $1"
    echo -e "${RED}$msg${NC}"
    echo "$msg" >> "$DEPLOYMENT_LOG"
}

# Setup deployment logging
setup_logging() {
    mkdir -p "$DEPLOYMENT_LOG_DIR"
    mkdir -p "$BACKUP_DIR"
    
    cat > "$DEPLOYMENT_LOG" << EOF
Zero-Downtime Deployment Log
============================
Date: $(date)
Project: $PROJECT_ROOT
Target Environment: ${TARGET_ENV:-production}
Git Commit: $(git rev-parse HEAD 2>/dev/null || echo "Unknown")

EOF
}

# Pre-deployment checks
pre_deployment_checks() {
    log_info "Running pre-deployment checks..."
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "Not in a git repository"
        return 1
    fi
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
        log_warning "Uncommitted changes detected"
        
        if [[ "${ALLOW_DIRTY_DEPLOY:-false}" != "true" ]]; then
            log_error "Deployment aborted due to uncommitted changes"
            return 1
        fi
    fi
    
    # Check if target directory exists
    local target_dir
    case "${TARGET_ENV:-production}" in
        production)
            target_dir="$PRODUCTION_DIR"
            ;;
        staging)
            target_dir="$STAGING_DIR"
            ;;
        *)
            log_error "Unknown target environment: ${TARGET_ENV}"
            return 1
            ;;
    esac
    
    if [[ ! -d "$target_dir" ]]; then
        log_error "Target directory does not exist: $target_dir"
        return 1
    fi
    
    # Check disk space
    local available_space=$(df "$target_dir" | awk 'NR==2 {print $4}')
    local required_space=1048576 # 1GB in KB
    
    if [[ "$available_space" -lt "$required_space" ]]; then
        log_error "Insufficient disk space for deployment"
        return 1
    fi
    
    log_success "Pre-deployment checks passed"
}

# Run tests before deployment
run_pre_deploy_tests() {
    if [[ "$RUN_TESTS_BEFORE_DEPLOY" != "true" ]]; then
        log_info "Skipping pre-deployment tests"
        return 0
    fi
    
    log_info "Running pre-deployment tests..."
    
    # Run PHPUnit tests
    if [[ -f "$PROJECT_ROOT/phpunit.xml" ]] && command -v phpunit &> /dev/null; then
        cd "$PROJECT_ROOT"
        
        if phpunit --testsuite=Unit >> "$DEPLOYMENT_LOG" 2>&1; then
            log_success "PHPUnit tests passed"
        else
            log_error "PHPUnit tests failed"
            return 1
        fi
    fi
    
    # Run JavaScript tests
    if [[ -f "$PROJECT_ROOT/package.json" ]] && command -v npm &> /dev/null; then
        cd "$PROJECT_ROOT"
        
        if npm test >> "$DEPLOYMENT_LOG" 2>&1; then
            log_success "JavaScript tests passed"
        else
            log_error "JavaScript tests failed"
            return 1
        fi
    fi
    
    # Run CSS linting
    if command -v stylelint &> /dev/null; then
        if stylelint "assets/css/**/*.css" >> "$DEPLOYMENT_LOG" 2>&1; then
            log_success "CSS linting passed"
        else
            log_warning "CSS linting warnings found"
        fi
    fi
    
    log_success "Pre-deployment tests completed"
}

# Create deployment backup
create_deployment_backup() {
    if [[ "$BACKUP_BEFORE_DEPLOY" != "true" ]]; then
        log_info "Skipping deployment backup"
        return 0
    fi
    
    log_info "Creating deployment backup..."
    
    local target_dir
    case "${TARGET_ENV:-production}" in
        production)
            target_dir="$PRODUCTION_DIR"
            ;;
        staging)
            target_dir="$STAGING_DIR"
            ;;
    esac
    
    local backup_name="pre-deploy-${TARGET_ENV:-production}-$TIMESTAMP"
    local backup_path="$BACKUP_DIR/$backup_name.tar.gz"
    
    if tar -czf "$backup_path" -C "$(dirname "$target_dir")" "$(basename "$target_dir")" 2>/dev/null; then
        log_success "Deployment backup created: $backup_path"
        echo "$backup_path" > "$BACKUP_DIR/latest-backup.txt"
    else
        log_error "Failed to create deployment backup"
        return 1
    fi
}

# Remove from load balancer
remove_from_load_balancer() {
    if [[ "$ENABLE_LOAD_BALANCER" != "true" ]] || [[ -z "$LOAD_BALANCER_SCRIPT" ]]; then
        log_info "Load balancer not configured, skipping removal"
        return 0
    fi
    
    log_info "Removing server from load balancer..."
    
    if [[ -x "$LOAD_BALANCER_SCRIPT" ]]; then
        if "$LOAD_BALANCER_SCRIPT" remove >> "$DEPLOYMENT_LOG" 2>&1; then
            log_success "Server removed from load balancer"
            sleep 5 # Allow time for connections to drain
        else
            log_error "Failed to remove server from load balancer"
            return 1
        fi
    else
        log_warning "Load balancer script not found or not executable: $LOAD_BALANCER_SCRIPT"
    fi
}

# Add to load balancer
add_to_load_balancer() {
    if [[ "$ENABLE_LOAD_BALANCER" != "true" ]] || [[ -z "$LOAD_BALANCER_SCRIPT" ]]; then
        log_info "Load balancer not configured, skipping addition"
        return 0
    fi
    
    log_info "Adding server back to load balancer..."
    
    if [[ -x "$LOAD_BALANCER_SCRIPT" ]]; then
        if "$LOAD_BALANCER_SCRIPT" add >> "$DEPLOYMENT_LOG" 2>&1; then
            log_success "Server added back to load balancer"
        else
            log_error "Failed to add server to load balancer"
            return 1
        fi
    else
        log_warning "Load balancer script not found or not executable: $LOAD_BALANCER_SCRIPT"
    fi
}

# Deploy application
deploy_application() {
    log_info "Deploying application..."
    
    local target_dir
    case "${TARGET_ENV:-production}" in
        production)
            target_dir="$PRODUCTION_DIR"
            ;;
        staging)
            target_dir="$STAGING_DIR"
            ;;
    esac
    
    # Create temporary deployment directory
    local temp_deploy_dir="${target_dir}_deploy_$TIMESTAMP"
    
    # Copy files to temporary directory
    log_info "Copying files to temporary deployment directory..."
    
    if cp -r "$PROJECT_ROOT" "$temp_deploy_dir"; then
        log_success "Files copied to $temp_deploy_dir"
    else
        log_error "Failed to copy files"
        return 1
    fi
    
    # Install dependencies in temp directory
    cd "$temp_deploy_dir"
    
    if [[ -f "composer.json" ]] && command -v composer &> /dev/null; then
        log_info "Installing Composer dependencies..."
        if composer install --no-dev --optimize-autoloader >> "$DEPLOYMENT_LOG" 2>&1; then
            log_success "Composer dependencies installed"
        else
            log_error "Failed to install Composer dependencies"
            rm -rf "$temp_deploy_dir"
            return 1
        fi
    fi
    
    if [[ -f "package.json" ]] && command -v npm &> /dev/null; then
        log_info "Installing NPM dependencies..."
        if npm ci --production >> "$DEPLOYMENT_LOG" 2>&1; then
            log_success "NPM dependencies installed"
        else
            log_error "Failed to install NPM dependencies"
            rm -rf "$temp_deploy_dir"
            return 1
        fi
    fi
    
    # Build assets if needed
    if [[ -f "package.json" ]] && npm run build --silent &> /dev/null; then
        log_info "Building production assets..."
        if npm run build >> "$DEPLOYMENT_LOG" 2>&1; then
            log_success "Production assets built"
        else
            log_warning "Asset build failed, continuing with existing assets"
        fi
    fi
    
    # Set proper permissions
    log_info "Setting file permissions..."
    find "$temp_deploy_dir" -type f -exec chmod 644 {} \;
    find "$temp_deploy_dir" -type d -exec chmod 755 {} \;
    chmod +x "$temp_deploy_dir/scripts/"*.sh 2>/dev/null || true
    
    # Atomic deployment - swap directories
    log_info "Performing atomic deployment..."
    
    local backup_old_dir="${target_dir}_backup_$TIMESTAMP"
    
    # Move current deployment to backup
    if mv "$target_dir" "$backup_old_dir"; then
        # Move new deployment to target
        if mv "$temp_deploy_dir" "$target_dir"; then
            log_success "Atomic deployment completed"
            
            # Clean up old backup after successful deployment
            rm -rf "$backup_old_dir"
        else
            log_error "Failed to move new deployment to target"
            # Restore original
            mv "$backup_old_dir" "$target_dir"
            rm -rf "$temp_deploy_dir"
            return 1
        fi
    else
        log_error "Failed to backup current deployment"
        rm -rf "$temp_deploy_dir"
        return 1
    fi
    
    # Update symlinks or additional configuration as needed
    if [[ -f "$target_dir/.env.production" ]]; then
        ln -sf "$target_dir/.env.production" "$target_dir/.env"
        log_info "Production environment configuration linked"
    fi
}

# Health check after deployment
post_deploy_health_check() {
    log_info "Running post-deployment health check..."
    
    local target_url="${HEALTH_CHECK_URL:-http://localhost}"
    local max_attempts=12
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log_info "Health check attempt $attempt/$max_attempts..."
        
        if curl -s -f -L "$target_url" > /dev/null 2>&1; then
            log_success "Health check passed"
            return 0
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            log_error "Health check failed after $max_attempts attempts"
            return 1
        fi
        
        sleep 5
        ((attempt++))
    done
}

# Rollback deployment
rollback_deployment() {
    log_warning "Rolling back deployment..."
    
    local latest_backup
    if [[ -f "$BACKUP_DIR/latest-backup.txt" ]]; then
        latest_backup=$(cat "$BACKUP_DIR/latest-backup.txt")
    else
        log_error "No backup found for rollback"
        return 1
    fi
    
    if [[ ! -f "$latest_backup" ]]; then
        log_error "Backup file not found: $latest_backup"
        return 1
    fi
    
    local target_dir
    case "${TARGET_ENV:-production}" in
        production)
            target_dir="$PRODUCTION_DIR"
            ;;
        staging)
            target_dir="$STAGING_DIR"
            ;;
    esac
    
    # Remove current deployment and restore backup
    rm -rf "$target_dir"
    
    if tar -xzf "$latest_backup" -C "$(dirname "$target_dir")"; then
        log_success "Deployment rolled back successfully"
        
        # Run health check after rollback
        if post_deploy_health_check; then
            log_success "Rollback health check passed"
        else
            log_error "Rollback health check failed"
        fi
    else
        log_error "Failed to rollback deployment"
        return 1
    fi
}

# Send deployment notification
send_deployment_notification() {
    local status="$1"
    local message="$2"
    
    local email="${DEPLOYMENT_EMAIL:-admin@brahim-elhouss.me}"
    local slack_webhook="${DEPLOYMENT_SLACK_WEBHOOK:-}"
    
    # Email notification
    if [[ -n "$email" ]] && command -v mail &> /dev/null; then
        {
            echo "Subject: [${TARGET_ENV:-production}] Deployment $status"
            echo ""
            echo "$message"
            echo ""
            echo "Deployment Log: $DEPLOYMENT_LOG"
            echo "Timestamp: $(date)"
        } | mail "$email"
    fi
    
    # Slack notification
    if [[ -n "$slack_webhook" ]] && command -v curl &> /dev/null; then
        local color=""
        case "$status" in
            "SUCCESS") color="good" ;;
            "FAILED") color="danger" ;;
            *) color="warning" ;;
        esac
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"attachments\":[{\"color\":\"$color\",\"title\":\"Deployment $status\",\"text\":\"$message\"}]}" \
            "$slack_webhook" &> /dev/null || true
    fi
}

# Main deployment process
run_zero_downtime_deployment() {
    local deployment_success=true
    
    log_info "Starting zero-downtime deployment to ${TARGET_ENV:-production}..."
    
    # Pre-deployment phase
    if ! pre_deployment_checks; then
        deployment_success=false
    fi
    
    if [[ "$deployment_success" = true ]] && ! run_pre_deploy_tests; then
        deployment_success=false
    fi
    
    if [[ "$deployment_success" = true ]] && ! create_deployment_backup; then
        deployment_success=false
    fi
    
    # Deployment phase
    if [[ "$deployment_success" = true ]]; then
        # Remove from load balancer if configured
        remove_from_load_balancer
        
        if ! deploy_application; then
            deployment_success=false
        fi
        
        if [[ "$deployment_success" = true ]] && ! post_deploy_health_check; then
            deployment_success=false
        fi
        
        # Add back to load balancer
        if [[ "$deployment_success" = true ]]; then
            add_to_load_balancer
        fi
    fi
    
    # Handle deployment result
    if [[ "$deployment_success" = true ]]; then
        log_success "Zero-downtime deployment completed successfully"
        send_deployment_notification "SUCCESS" "Deployment to ${TARGET_ENV:-production} completed successfully"
    else
        log_error "Deployment failed"
        
        if [[ "$ROLLBACK_ON_FAILURE" = "true" ]]; then
            rollback_deployment
            add_to_load_balancer
            send_deployment_notification "FAILED" "Deployment to ${TARGET_ENV:-production} failed and was rolled back"
        else
            send_deployment_notification "FAILED" "Deployment to ${TARGET_ENV:-production} failed"
        fi
        
        return 1
    fi
}

# Show help
show_help() {
    cat << EOF
Zero-Downtime Deployment Tool

Usage: $0 [OPTIONS]

Options:
    --env ENV           Target environment (production, staging)
    --no-backup         Skip creating backup before deployment
    --no-tests          Skip running tests before deployment  
    --no-rollback       Don't rollback on failure
    --allow-dirty       Allow deployment with uncommitted changes
    --health-url URL    URL for health checks
    --help              Show this help

Environment Variables:
    PRODUCTION_DIR              Production deployment directory
    STAGING_DIR                 Staging deployment directory
    DEPLOYMENT_EMAIL            Email for deployment notifications
    DEPLOYMENT_SLACK_WEBHOOK    Slack webhook for notifications
    ENABLE_LOAD_BALANCER        Enable load balancer integration
    LOAD_BALANCER_SCRIPT        Script to manage load balancer

Examples:
    $0                          # Deploy to production
    $0 --env staging           # Deploy to staging
    $0 --no-tests --no-backup  # Quick deployment without tests/backup

The deployment process:
1. Pre-deployment checks (git status, disk space, etc.)
2. Run tests to ensure code quality
3. Create backup of current deployment
4. Remove server from load balancer (if configured)
5. Deploy new version atomically
6. Run health checks
7. Add server back to load balancer
8. Send notifications
9. Rollback if any step fails (optional)
EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --env)
            TARGET_ENV="$2"
            shift 2
            ;;
        --no-backup)
            BACKUP_BEFORE_DEPLOY=false
            shift
            ;;
        --no-tests)
            RUN_TESTS_BEFORE_DEPLOY=false
            shift
            ;;
        --no-rollback)
            ROLLBACK_ON_FAILURE=false
            shift
            ;;
        --allow-dirty)
            ALLOW_DIRTY_DEPLOY=true
            shift
            ;;
        --health-url)
            HEALTH_CHECK_URL="$2"
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
run_zero_downtime_deployment