#!/bin/bash

# Security Audit Script
# Performs comprehensive security checks on the portfolio application

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
AUDIT_REPORT_DIR="$PROJECT_ROOT/storage/security/audits"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$AUDIT_REPORT_DIR/security_audit_$TIMESTAMP.txt"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Security levels
CRITICAL=0
HIGH=0
MEDIUM=0
LOW=0

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
    echo "[INFO] $1" >> "$REPORT_FILE"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    echo "[PASS] $1" >> "$REPORT_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    echo "[WARN] $1" >> "$REPORT_FILE"
    ((MEDIUM++))
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    echo "[FAIL] $1" >> "$REPORT_FILE"
    ((HIGH++))
}

log_critical() {
    echo -e "${RED}[CRITICAL]${NC} $1"
    echo "[CRITICAL] $1" >> "$REPORT_FILE"
    ((CRITICAL++))
}

# Setup audit directory
setup_audit() {
    mkdir -p "$AUDIT_REPORT_DIR"
    
    cat > "$REPORT_FILE" << EOF
Portfolio Security Audit Report
================================
Date: $(date)
System: $(hostname)
Project: $PROJECT_ROOT

EOF
}

# Check file permissions
check_file_permissions() {
    log_info "Checking file permissions..."
    
    # Check sensitive files
    local sensitive_files=(
        ".env"
        ".env.production"
        "config/environments/production.php"
        "storage/logs"
        "storage/sessions"
        "storage/cache"
        "admin/login.php"
        "src/config"
    )
    
    for file in "${sensitive_files[@]}"; do
        local full_path="$PROJECT_ROOT/$file"
        
        if [[ -e "$full_path" ]]; then
            local perms=$(stat -c%a "$full_path" 2>/dev/null)
            
            case "$file" in
                ".env"*|"config/environments/production.php")
                    if [[ "$perms" -gt 600 ]]; then
                        log_critical "Sensitive file has too permissive permissions: $file ($perms)"
                    else
                        log_success "Sensitive file permissions OK: $file ($perms)"
                    fi
                    ;;
                "storage/"*|"admin/"*|"src/config")
                    if [[ "$perms" -gt 755 ]]; then
                        log_error "Directory has too permissive permissions: $file ($perms)"
                    else
                        log_success "Directory permissions OK: $file ($perms)"
                    fi
                    ;;
            esac
        fi
    done
    
    # Check for world-writable files
    local world_writable=$(find "$PROJECT_ROOT" -type f -perm -002 2>/dev/null | grep -v "/node_modules/" | grep -v "/.git/" || true)
    
    if [[ -n "$world_writable" ]]; then
        log_error "World-writable files found:"
        echo "$world_writable" | while read -r file; do
            log_error "  - $file"
        done
    else
        log_success "No world-writable files found"
    fi
}

# Check for sensitive information exposure
check_sensitive_exposure() {
    log_info "Checking for sensitive information exposure..."
    
    # Check for exposed sensitive files
    local sensitive_patterns=(
        "\.env"
        "\.env\."
        "config.*\.php"
        "\.sql"
        "\.log"
        "backup"
        "dump"
    )
    
    # Check if sensitive files are in web root
    local web_exposed=false
    
    for pattern in "${sensitive_patterns[@]}"; do
        local found_files=$(find "$PROJECT_ROOT" -maxdepth 1 -name "*$pattern*" -type f 2>/dev/null || true)
        
        if [[ -n "$found_files" ]]; then
            echo "$found_files" | while read -r file; do
                # Check if file is accessible via web
                local basename_file=$(basename "$file")
                if [[ "$basename_file" =~ \.(env|php|sql|log)$ ]]; then
                    log_warning "Potentially web-accessible sensitive file: $basename_file"
                    web_exposed=true
                fi
            done
        fi
    done
    
    # Check for .htaccess protection
    if [[ -f "$PROJECT_ROOT/.htaccess" ]]; then
        if grep -q "deny from all\|Require all denied" "$PROJECT_ROOT/.htaccess"; then
            log_success ".htaccess protection found"
        else
            log_warning ".htaccess exists but may not have proper protection"
        fi
    else
        log_warning "No .htaccess file found for web protection"
    fi
}

# Check PHP configuration
check_php_config() {
    log_info "Checking PHP configuration..."
    
    # Check for dangerous PHP settings
    local dangerous_settings=(
        "register_globals"
        "allow_url_include"
        "allow_url_fopen"
        "expose_php"
    )
    
    for setting in "${dangerous_settings[@]}"; do
        local value=$(php -r "echo ini_get('$setting') ? 'On' : 'Off';")
        
        case "$setting" in
            "register_globals"|"allow_url_include"|"expose_php")
                if [[ "$value" == "On" ]]; then
                    log_error "Dangerous PHP setting enabled: $setting = $value"
                else
                    log_success "PHP setting OK: $setting = $value"
                fi
                ;;
            "allow_url_fopen")
                if [[ "$value" == "On" ]]; then
                    log_warning "PHP setting may be risky: $setting = $value"
                else
                    log_success "PHP setting OK: $setting = $value"
                fi
                ;;
        esac
    done
    
    # Check PHP version
    local php_version=$(php -r "echo PHP_VERSION;")
    local php_major=$(echo "$php_version" | cut -d. -f1)
    local php_minor=$(echo "$php_version" | cut -d. -f2)
    
    if [[ "$php_major" -lt 8 ]] || [[ "$php_major" -eq 8 && "$php_minor" -lt 1 ]]; then
        log_error "PHP version is outdated: $php_version (recommended: 8.1+)"
    else
        log_success "PHP version OK: $php_version"
    fi
    
    # Check for error display in production
    local display_errors=$(php -r "echo ini_get('display_errors') ? 'On' : 'Off';")
    local log_errors=$(php -r "echo ini_get('log_errors') ? 'On' : 'Off';")
    
    if [[ "$display_errors" == "On" ]]; then
        log_warning "display_errors is enabled (should be disabled in production)"
    else
        log_success "display_errors is disabled"
    fi
    
    if [[ "$log_errors" == "Off" ]]; then
        log_warning "log_errors is disabled (should be enabled)"
    else
        log_success "log_errors is enabled"
    fi
}

# Check for SQL injection vulnerabilities
check_sql_injection() {
    log_info "Checking for potential SQL injection vulnerabilities..."
    
    local php_files=$(find "$PROJECT_ROOT/src" -name "*.php" 2>/dev/null || true)
    local vulnerable_patterns=(
        '\$.*mysql_query.*\$'
        '\$.*mysqli_query.*\$'
        'query.*\$_'
        'SELECT.*\$_'
        'INSERT.*\$_'
        'UPDATE.*\$_'
        'DELETE.*\$_'
    )
    
    local vulnerabilities_found=false
    
    for pattern in "${vulnerable_patterns[@]}"; do
        if [[ -n "$php_files" ]]; then
            local matches=$(echo "$php_files" | xargs grep -l "$pattern" 2>/dev/null || true)
            
            if [[ -n "$matches" ]]; then
                log_warning "Potential SQL injection vulnerability pattern found: $pattern"
                echo "$matches" | while read -r file; do
                    log_warning "  - File: $file"
                done
                vulnerabilities_found=true
            fi
        fi
    done
    
    if [[ "$vulnerabilities_found" == "false" ]]; then
        log_success "No obvious SQL injection patterns found"
    fi
    
    # Check for prepared statements usage
    if [[ -n "$php_files" ]]; then
        local prepared_statements=$(echo "$php_files" | xargs grep -l "prepare\|bind_param\|execute" 2>/dev/null || true)
        
        if [[ -n "$prepared_statements" ]]; then
            log_success "Prepared statements usage found (good practice)"
        else
            log_warning "No prepared statements found - consider using them for database queries"
        fi
    fi
}

# Check for XSS vulnerabilities
check_xss_vulnerabilities() {
    log_info "Checking for potential XSS vulnerabilities..."
    
    local php_files=$(find "$PROJECT_ROOT" -name "*.php" -not -path "*/vendor/*" 2>/dev/null || true)
    local js_files=$(find "$PROJECT_ROOT/assets/js" -name "*.js" 2>/dev/null || true)
    
    local xss_patterns=(
        'echo.*\$_'
        'print.*\$_'
        '=.*\$_'
        'innerHTML.*\+'
        'document\.write'
        'eval\('
    )
    
    local vulnerabilities_found=false
    
    for pattern in "${xss_patterns[@]}"; do
        # Check PHP files
        if [[ -n "$php_files" ]]; then
            local php_matches=$(echo "$php_files" | xargs grep -l "$pattern" 2>/dev/null || true)
            
            if [[ -n "$php_matches" ]]; then
                log_warning "Potential XSS vulnerability pattern in PHP: $pattern"
                vulnerabilities_found=true
            fi
        fi
        
        # Check JavaScript files
        if [[ -n "$js_files" ]]; then
            local js_matches=$(echo "$js_files" | xargs grep -l "$pattern" 2>/dev/null || true)
            
            if [[ -n "$js_matches" ]]; then
                log_warning "Potential XSS vulnerability pattern in JS: $pattern"
                vulnerabilities_found=true
            fi
        fi
    done
    
    if [[ "$vulnerabilities_found" == "false" ]]; then
        log_success "No obvious XSS patterns found"
    fi
    
    # Check for XSS protection functions
    if [[ -n "$php_files" ]]; then
        local xss_protection=$(echo "$php_files" | xargs grep -l "htmlspecialchars\|htmlentities\|filter_var" 2>/dev/null || true)
        
        if [[ -n "$xss_protection" ]]; then
            log_success "XSS protection functions found (good practice)"
        else
            log_warning "No XSS protection functions found - consider using htmlspecialchars()"
        fi
    fi
}

# Check authentication security
check_authentication() {
    log_info "Checking authentication security..."
    
    # Check for session security settings
    local session_files=$(find "$PROJECT_ROOT/src" -name "*.php" | xargs grep -l "session_start\|session_" 2>/dev/null || true)
    
    if [[ -n "$session_files" ]]; then
        # Check for session regeneration
        local session_regen=$(echo "$session_files" | xargs grep -l "session_regenerate_id" 2>/dev/null || true)
        
        if [[ -n "$session_regen" ]]; then
            log_success "Session regeneration found"
        else
            log_warning "No session regeneration found - consider implementing it"
        fi
        
        # Check for secure session settings
        local secure_session=$(echo "$session_files" | xargs grep -l "session\.cookie_secure\|session\.cookie_httponly" 2>/dev/null || true)
        
        if [[ -n "$secure_session" ]]; then
            log_success "Secure session settings found"
        else
            log_warning "No secure session settings found"
        fi
    fi
    
    # Check password hashing
    local auth_files=$(find "$PROJECT_ROOT/src" -name "*.php" | xargs grep -l "password\|login\|auth" 2>/dev/null || true)
    
    if [[ -n "$auth_files" ]]; then
        local password_hash=$(echo "$auth_files" | xargs grep -l "password_hash\|password_verify" 2>/dev/null || true)
        
        if [[ -n "$password_hash" ]]; then
            log_success "Modern password hashing found"
        else
            local old_hash=$(echo "$auth_files" | xargs grep -l "md5\|sha1" 2>/dev/null || true)
            
            if [[ -n "$old_hash" ]]; then
                log_error "Weak password hashing methods found (md5/sha1)"
            else
                log_warning "No password hashing methods found"
            fi
        fi
    fi
}

# Check CSRF protection
check_csrf_protection() {
    log_info "Checking CSRF protection..."
    
    local form_files=$(find "$PROJECT_ROOT" -name "*.php" -o -name "*.html" | xargs grep -l "<form" 2>/dev/null || true)
    
    if [[ -n "$form_files" ]]; then
        local csrf_tokens=$(echo "$form_files" | xargs grep -l "csrf\|token" 2>/dev/null || true)
        
        if [[ -n "$csrf_tokens" ]]; then
            log_success "CSRF protection tokens found"
        else
            log_error "No CSRF protection found in forms"
        fi
    else
        log_info "No forms found to check for CSRF protection"
    fi
}

# Check dependency security
check_dependencies() {
    log_info "Checking dependency security..."
    
    # Check Composer dependencies
    if [[ -f "$PROJECT_ROOT/composer.lock" ]]; then
        if command -v composer &> /dev/null; then
            cd "$PROJECT_ROOT"
            local audit_result=$(composer audit --format=json 2>/dev/null || echo '{"advisories":{}}')
            local vulnerabilities=$(echo "$audit_result" | grep -o '"advisories":{[^}]*}' | grep -c '"' || echo "0")
            
            if [[ "$vulnerabilities" -gt 0 ]]; then
                log_error "Composer dependencies have security vulnerabilities"
                composer audit 2>/dev/null || log_error "Failed to get detailed vulnerability information"
            else
                log_success "No known vulnerabilities in Composer dependencies"
            fi
        else
            log_warning "Composer not found - cannot check dependency security"
        fi
    else
        log_info "No composer.lock found"
    fi
    
    # Check npm dependencies
    if [[ -f "$PROJECT_ROOT/package-lock.json" ]]; then
        if command -v npm &> /dev/null; then
            cd "$PROJECT_ROOT"
            local npm_audit=$(npm audit --json 2>/dev/null || echo '{"metadata":{"vulnerabilities":{"total":0}}}')
            local npm_vulns=$(echo "$npm_audit" | grep -o '"total":[0-9]*' | cut -d: -f2 || echo "0")
            
            if [[ "$npm_vulns" -gt 0 ]]; then
                log_error "NPM dependencies have $npm_vulns security vulnerabilities"
            else
                log_success "No known vulnerabilities in NPM dependencies"
            fi
        else
            log_warning "NPM not found - cannot check dependency security"
        fi
    else
        log_info "No package-lock.json found"
    fi
}

# Check web server configuration
check_webserver_config() {
    log_info "Checking web server configuration..."
    
    # Check for directory listing
    local index_files=$(find "$PROJECT_ROOT" -name "index.*" -o -name "default.*" 2>/dev/null || true)
    
    if [[ -n "$index_files" ]]; then
        log_success "Index files found (prevents directory listing)"
    else
        log_warning "No index files found - directories may be listable"
    fi
    
    # Check for .htaccess file
    if [[ -f "$PROJECT_ROOT/.htaccess" ]]; then
        log_success ".htaccess file found"
        
        # Check for security headers
        local security_headers=$(grep -E "Header.*X-|Header.*Content-Security-Policy" "$PROJECT_ROOT/.htaccess" 2>/dev/null || true)
        
        if [[ -n "$security_headers" ]]; then
            log_success "Security headers found in .htaccess"
        else
            log_warning "No security headers found in .htaccess"
        fi
    else
        log_warning "No .htaccess file found"
    fi
    
    # Check for robots.txt
    if [[ -f "$PROJECT_ROOT/robots.txt" ]]; then
        log_success "robots.txt file found"
        
        # Check if sensitive paths are disallowed
        local sensitive_disallow=$(grep -E "Disallow.*admin|Disallow.*config|Disallow.*\.env" "$PROJECT_ROOT/robots.txt" 2>/dev/null || true)
        
        if [[ -n "$sensitive_disallow" ]]; then
            log_success "Sensitive paths disallowed in robots.txt"
        else
            log_warning "Consider disallowing sensitive paths in robots.txt"
        fi
    else
        log_warning "No robots.txt file found"
    fi
}

# Check backup security
check_backup_security() {
    log_info "Checking backup security..."
    
    local backup_dirs=(
        "$PROJECT_ROOT/storage/backups"
        "$PROJECT_ROOT/backups"
        "$PROJECT_ROOT/backup"
    )
    
    for backup_dir in "${backup_dirs[@]}"; do
        if [[ -d "$backup_dir" ]]; then
            # Check permissions
            local perms=$(stat -c%a "$backup_dir" 2>/dev/null)
            
            if [[ "$perms" -gt 700 ]]; then
                log_warning "Backup directory has too permissive permissions: $backup_dir ($perms)"
            else
                log_success "Backup directory permissions OK: $backup_dir ($perms)"
            fi
            
            # Check for web accessibility
            if [[ "$backup_dir" == "$PROJECT_ROOT/"* ]]; then
                local relative_path=${backup_dir#$PROJECT_ROOT/}
                
                if [[ ! "$relative_path" =~ ^(storage|private|secured)/ ]]; then
                    log_warning "Backup directory may be web-accessible: $relative_path"
                fi
            fi
        fi
    done
}

# Generate security score
generate_security_score() {
    local total_issues=$((CRITICAL + HIGH + MEDIUM + LOW))
    local score=100
    
    # Deduct points based on severity
    score=$((score - (CRITICAL * 25)))
    score=$((score - (HIGH * 10)))
    score=$((score - (MEDIUM * 5)))
    score=$((score - (LOW * 1)))
    
    # Ensure score doesn't go below 0
    if [[ $score -lt 0 ]]; then
        score=0
    fi
    
    echo "$score"
}

# Generate final report
generate_final_report() {
    local security_score=$(generate_security_score)
    local total_issues=$((CRITICAL + HIGH + MEDIUM + LOW))
    
    cat >> "$REPORT_FILE" << EOF

SECURITY AUDIT SUMMARY
======================
Security Score: $security_score/100

Issues Found:
- Critical: $CRITICAL
- High: $HIGH
- Medium: $MEDIUM
- Low: $LOW
Total Issues: $total_issues

Recommendations:
===============
EOF
    
    if [[ $CRITICAL -gt 0 ]]; then
        echo "- IMMEDIATE ACTION REQUIRED: Address all critical security issues" >> "$REPORT_FILE"
    fi
    
    if [[ $HIGH -gt 0 ]]; then
        echo "- HIGH PRIORITY: Fix high severity security issues" >> "$REPORT_FILE"
    fi
    
    if [[ $MEDIUM -gt 0 ]]; then
        echo "- MEDIUM PRIORITY: Address medium severity issues when possible" >> "$REPORT_FILE"
    fi
    
    if [[ $total_issues -eq 0 ]]; then
        echo "- Excellent! No security issues found in this audit" >> "$REPORT_FILE"
    fi
    
    cat >> "$REPORT_FILE" << EOF

Next Steps:
===========
1. Review and fix all identified issues
2. Implement additional security measures
3. Schedule regular security audits
4. Keep dependencies updated
5. Monitor security advisories

Audit completed at: $(date)
EOF
    
    echo
    log_info "Security audit completed"
    log_info "Security Score: $security_score/100"
    log_info "Total Issues: $total_issues (Critical: $CRITICAL, High: $HIGH, Medium: $MEDIUM, Low: $LOW)"
    log_info "Full report: $REPORT_FILE"
    
    # Return appropriate exit code based on severity
    if [[ $CRITICAL -gt 0 ]]; then
        exit 3
    elif [[ $HIGH -gt 0 ]]; then
        exit 2
    elif [[ $MEDIUM -gt 0 ]]; then
        exit 1
    else
        exit 0
    fi
}

# Main audit function
run_security_audit() {
    log_info "Starting security audit..."
    
    setup_audit
    
    check_file_permissions
    check_sensitive_exposure
    check_php_config
    check_sql_injection
    check_xss_vulnerabilities
    check_authentication
    check_csrf_protection
    check_dependencies
    check_webserver_config
    check_backup_security
    
    generate_final_report
}

# Show help
show_help() {
    cat << EOF
Portfolio Security Audit Tool

Usage: $0 [OPTIONS]

Options:
    --quick     Run quick security scan
    --full      Run comprehensive security audit (default)
    --report    Show latest audit report
    --help      Show this help

The security audit checks for:
- File permission issues
- Sensitive information exposure
- PHP configuration problems
- SQL injection vulnerabilities
- XSS vulnerabilities
- Authentication security
- CSRF protection
- Dependency vulnerabilities
- Web server configuration
- Backup security

Exit codes:
    0 - No issues found
    1 - Medium severity issues found
    2 - High severity issues found
    3 - Critical security issues found
EOF
}

# Show latest report
show_latest_report() {
    local latest_report=$(find "$AUDIT_REPORT_DIR" -name "security_audit_*.txt" -type f 2>/dev/null | sort | tail -1)
    
    if [[ -n "$latest_report" ]]; then
        cat "$latest_report"
    else
        echo "No security audit reports found"
        exit 1
    fi
}

# Main script logic
case "${1:-full}" in
    --quick)
        log_info "Running quick security scan..."
        setup_audit
        check_file_permissions
        check_sensitive_exposure
        check_php_config
        generate_final_report
        ;;
    --full|full)
        run_security_audit
        ;;
    --report)
        show_latest_report
        ;;
    --help|help)
        show_help
        ;;
    *)
        echo "Unknown option: $1"
        show_help
        exit 1
        ;;
esac
