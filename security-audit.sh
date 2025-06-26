#!/bin/bash

# Portfolio Security Audit Script
# This script checks for common security issues and provides recommendations

echo "🔒 Starting Portfolio Security Audit..."
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Initialize counters
issues_found=0
warnings_found=0
secure_items=0

# Function to report findings
report_issue() {
    echo -e "${RED}❌ ISSUE: $1${NC}"
    ((issues_found++))
}

report_warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
    ((warnings_found++))
}

report_secure() {
    echo -e "${GREEN}✅ SECURE: $1${NC}"
    ((secure_items++))
}

report_info() {
    echo -e "${BLUE}ℹ️  INFO: $1${NC}"
}

echo ""
echo "🔍 Checking File Permissions..."
echo "--------------------------------"

# Check critical file permissions
if [ -f ".env" ]; then
    perm=$(stat -c "%a" .env)
    if [ "$perm" != "600" ]; then
        report_warning ".env file permissions are $perm (should be 600)"
        echo "  Fix with: chmod 600 .env"
    else
        report_secure ".env file has correct permissions (600)"
    fi
else
    report_warning ".env file not found - using environment variables or .env.example?"
fi

# Check config directory permissions
if [ -d "config" ]; then
    perm=$(stat -c "%a" config)
    if [ "$perm" -gt "755" ]; then
        report_warning "Config directory permissions are too open ($perm)"
    else
        report_secure "Config directory permissions are appropriate"
    fi
fi

# Check storage directory permissions
if [ -d "storage" ]; then
    if [ ! -w "storage" ]; then
        report_issue "Storage directory is not writable"
    else
        report_secure "Storage directory is writable"
    fi
fi

echo ""
echo "🔍 Checking Sensitive Files..."
echo "------------------------------"

# Check for exposed sensitive files
sensitive_files=(".env" "composer.lock" "config/database.php" ".git")
for file in "${sensitive_files[@]}"; do
    if [ -e "$file" ]; then
        # Check if file is accessible via web
        if [ -f ".htaccess" ]; then
            if grep -q "$file" .htaccess; then
                report_secure "$file is protected in .htaccess"
            else
                report_warning "$file exists but may not be web-protected"
            fi
        else
            report_warning "No .htaccess found - sensitive files may be web-accessible"
        fi
    fi
done

# Check for backup files
backup_files=$(find . -name "*.bak" -o -name "*.backup" -o -name "*~" -o -name "*.old" 2>/dev/null)
if [ -n "$backup_files" ]; then
    report_warning "Backup files found that should be removed:"
    echo "$backup_files"
else
    report_secure "No backup files found in web directory"
fi

echo ""
echo "🔍 Checking PHP Configuration..."
echo "--------------------------------"

# Check PHP files for security issues
php_files=$(find . -name "*.php" -not -path "./vendor/*" 2>/dev/null)

if [ -n "$php_files" ]; then
    # Check for eval() usage
    eval_usage=$(grep -r "eval(" --include="*.php" . 2>/dev/null | grep -v vendor)
    if [ -n "$eval_usage" ]; then
        report_issue "eval() function usage found (security risk)"
        echo "$eval_usage"
    else
        report_secure "No eval() function usage found"
    fi
    
    # Check for error display
    error_display=$(grep -r "ini_set.*display_errors.*On" --include="*.php" . 2>/dev/null)
    if [ -n "$error_display" ]; then
        report_warning "Error display enabled in production code"
        echo "$error_display"
    else
        report_secure "No error display enabled in code"
    fi
    
    # Check for short PHP tags
    short_tags=$(grep -r "<?" --include="*.php" . 2>/dev/null | grep -v "<?php" | grep -v vendor)
    if [ -n "$short_tags" ]; then
        report_warning "Short PHP tags found (compatibility issue)"
        echo "$short_tags" | head -5
    else
        report_secure "No short PHP tags found"
    fi
fi

echo ""
echo "🔍 Checking Database Security..."
echo "--------------------------------"

# Check for SQL injection patterns
sql_files=$(find . -name "*.php" -not -path "./vendor/*" 2>/dev/null)
if [ -n "$sql_files" ]; then
    # Look for potential SQL injection vulnerabilities
    sql_concat=$(grep -r '\$.*\.\s*\$' --include="*.php" . 2>/dev/null | grep -i "select\|insert\|update\|delete" | grep -v vendor)
    if [ -n "$sql_concat" ]; then
        report_warning "Potential SQL concatenation found (check for SQL injection)"
        echo "$sql_concat" | head -3
    else
        report_secure "No obvious SQL concatenation patterns found"
    fi
    
    # Check for PDO usage (good practice)
    pdo_usage=$(grep -r "PDO\|prepare" --include="*.php" . 2>/dev/null | grep -v vendor)
    if [ -n "$pdo_usage" ]; then
        report_secure "PDO/prepared statements usage found"
    else
        report_warning "No PDO usage found - check database security"
    fi
fi

echo ""
echo "🔍 Checking Input Validation..."
echo "------------------------------"

# Check for input sanitization
if [ -n "$php_files" ]; then
    # Look for $_GET, $_POST usage without sanitization
    input_usage=$(grep -r '\$_\(GET\|POST\|REQUEST\)' --include="*.php" . 2>/dev/null | grep -v vendor | head -5)
    if [ -n "$input_usage" ]; then
        report_info "User input usage found - verify sanitization:"
        echo "$input_usage"
    fi
    
    # Check for sanitization functions
    sanitize_usage=$(grep -r "filter_\|htmlspecialchars\|strip_tags" --include="*.php" . 2>/dev/null | grep -v vendor)
    if [ -n "$sanitize_usage" ]; then
        report_secure "Input sanitization functions found"
    else
        report_warning "No input sanitization functions found"
    fi
fi

echo ""
echo "🔍 Checking File Upload Security..."
echo "----------------------------------"

# Check upload directories
upload_dirs=("assets/uploads" "uploads" "files")
for dir in "${upload_dirs[@]}"; do
    if [ -d "$dir" ]; then
        # Check for .htaccess in upload directory
        if [ -f "$dir/.htaccess" ]; then
            report_secure "Upload directory $dir has .htaccess protection"
        else
            report_issue "Upload directory $dir lacks .htaccess protection"
            echo "  Create $dir/.htaccess with: echo 'deny from all' > $dir/.htaccess"
        fi
        
        # Check for PHP files in upload directory
        php_in_uploads=$(find "$dir" -name "*.php" 2>/dev/null)
        if [ -n "$php_in_uploads" ]; then
            report_issue "PHP files found in upload directory (security risk)"
            echo "$php_in_uploads"
        else
            report_secure "No PHP files in upload directory"
        fi
    fi
done

echo ""
echo "🔍 Checking SSL/HTTPS Configuration..."
echo "------------------------------------"

# Check for HTTPS redirects in config
if [ -f ".htaccess" ]; then
    if grep -q "RewriteRule.*https" .htaccess; then
        report_secure "HTTPS redirect found in .htaccess"
    else
        report_warning "No HTTPS redirect found in .htaccess"
        echo "  Consider adding HTTPS redirect rules"
    fi
fi

# Check for secure cookie settings
cookie_secure=$(grep -r "session_set_cookie_params\|setcookie" --include="*.php" . 2>/dev/null | grep -i secure)
if [ -n "$cookie_secure" ]; then
    report_secure "Secure cookie configuration found"
else
    report_warning "No secure cookie configuration found"
fi

echo ""
echo "🔍 Checking Headers Security..."
echo "------------------------------"

# Check for security headers
if [ -f ".htaccess" ]; then
    headers=("X-Content-Type-Options" "X-Frame-Options" "X-XSS-Protection" "Content-Security-Policy")
    for header in "${headers[@]}"; do
        if grep -q "$header" .htaccess; then
            report_secure "$header header configured"
        else
            report_warning "$header header not configured"
        fi
    done
fi

echo ""
echo "🔍 Dependency Security Check..."
echo "------------------------------"

# Check for composer security
if [ -f "composer.lock" ]; then
    report_info "Composer dependencies found"
    if command -v composer &> /dev/null; then
        echo "  Run 'composer audit' to check for known vulnerabilities"
    fi
else
    report_info "No composer.lock found"
fi

# Check for outdated dependencies
if [ -f "package.json" ]; then
    report_info "NPM dependencies found"
    if command -v npm &> /dev/null; then
        echo "  Run 'npm audit' to check for vulnerabilities"
    fi
fi

echo ""
echo "📊 Security Audit Summary"
echo "========================="
echo -e "${RED}Issues Found: $issues_found${NC}"
echo -e "${YELLOW}Warnings: $warnings_found${NC}"
echo -e "${GREEN}Secure Items: $secure_items${NC}"

echo ""
echo "📋 Recommended Actions:"
echo "1. Fix all issues marked with ❌"
echo "2. Review warnings marked with ⚠️"
echo "3. Implement HTTPS if not already done"
echo "4. Regular security updates for dependencies"
echo "5. Consider implementing Content Security Policy"
echo "6. Set up regular security monitoring"

if [ $issues_found -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 No critical security issues found!${NC}"
else
    echo ""
    echo -e "${RED}⚠️  Please address the $issues_found critical issues found.${NC}"
fi

# Save report to file
report_file="storage/security_audit_$(date +%Y%m%d_%H%M%S).txt"
{
    echo "Portfolio Security Audit Report"
    echo "Generated: $(date)"
    echo "=============================="
    echo ""
    echo "Issues Found: $issues_found"
    echo "Warnings: $warnings_found"
    echo "Secure Items: $secure_items"
} > "$report_file"

echo ""
echo "📄 Full report saved to: $report_file"
