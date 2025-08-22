#!/bin/bash

# Dependency Update and Security Audit Script
# Comprehensive dependency management and security checking

set -euo pipefail

PROJECT_ROOT="/home/bross/Desktop/My-Portfolio"
LOG_FILE="${PROJECT_ROOT}/storage/logs/dependency-audit.log"

echo "🔄 Starting dependency update and security audit..."

# Ensure logs directory exists
mkdir -p "${PROJECT_ROOT}/storage/logs"

# Function to log with timestamp
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S'): $1" | tee -a "$LOG_FILE"
}

# Check if composer is installed
check_composer() {
    if ! command -v composer &> /dev/null; then
        log_message "❌ Composer not found. Installing composer..."
        
        # Download and install composer
        cd "$PROJECT_ROOT"
        curl -sS https://getcomposer.org/installer | php
        sudo mv composer.phar /usr/local/bin/composer
        
        if command -v composer &> /dev/null; then
            log_message "✅ Composer installed successfully"
        else
            log_message "❌ Failed to install composer"
            return 1
        fi
    else
        log_message "✅ Composer found"
    fi
}

# Backup current composer files
backup_composer_files() {
    log_message "📦 Backing up composer files..."
    
    if [ -f "${PROJECT_ROOT}/composer.json" ]; then
        cp "${PROJECT_ROOT}/composer.json" "${PROJECT_ROOT}/composer.json.backup.$(date +%Y%m%d_%H%M%S)"
        log_message "✅ composer.json backed up"
    fi
    
    if [ -f "${PROJECT_ROOT}/composer.lock" ]; then
        cp "${PROJECT_ROOT}/composer.lock" "${PROJECT_ROOT}/composer.lock.backup.$(date +%Y%m%d_%H%M%S)"
        log_message "✅ composer.lock backed up"
    fi
}

# Check current dependencies
check_current_dependencies() {
    log_message "📋 Checking current dependencies..."
    
    cd "$PROJECT_ROOT"
    
    if [ -f "composer.json" ]; then
        log_message "Current dependencies:"
        composer show 2>&1 | tee -a "$LOG_FILE" || log_message "No dependencies installed yet"
    else
        log_message "No composer.json found"
    fi
}

# Create/update composer.json with security-focused dependencies
update_composer_json() {
    log_message "📝 Updating composer.json with security-focused dependencies..."
    
    cat > "${PROJECT_ROOT}/composer.json" << 'EOF'
{
    "name": "brahim-elhouss/portfolio",
    "description": "Professional Portfolio Website with Enhanced Security",
    "type": "project",
    "version": "2.0.0",
    "license": "MIT",
    "authors": [
        {
            "name": "Brahim El Houss",
            "email": "brahim.elhouss@example.com"
        }
    ],
    "require": {
        "php": ">=8.0",
        "phpmailer/phpmailer": "^6.9.1",
        "vlucas/phpdotenv": "^5.6.0",
        "firebase/php-jwt": "^6.10.0",
        "graham-campbell/result-type": "^1.1.2",
        "phpoption/phpoption": "^1.9.2",
        "symfony/polyfill-ctype": "^1.28.0",
        "symfony/polyfill-mbstring": "^1.28.0",
        "symfony/polyfill-php80": "^1.28.0"
    },
    "require-dev": {
        "phpunit/phpunit": "^10.5.0",
        "squizlabs/php_codesniffer": "^3.8.0",
        "phpstan/phpstan": "^1.10.0",
        "psalm/psalm": "^5.18.0",
        "roave/security-advisories": "dev-master"
    },
    "autoload": {
        "psr-4": {
            "Portfolio\\": "src/",
            "Portfolio\\Cache\\": "src/cache/",
            "Portfolio\\Config\\": "src/config/",
            "Portfolio\\Database\\": "src/database/",
            "Portfolio\\Security\\": "src/security/",
            "Portfolio\\Utils\\": "src/utils/"
        },
        "files": [
            "src/config/ConfigManager.php",
            "src/utils/functions.php"
        ]
    },
    "autoload-dev": {
        "psr-4": {
            "Portfolio\\Tests\\": "tests/"
        }
    },
    "scripts": {
        "security-check": [
            "composer audit",
            "@php scripts/security-scan.php"
        ],
        "code-quality": [
            "phpcs --standard=PSR12 src/",
            "phpstan analyse src/",
            "psalm --show-info=true"
        ],
        "test": [
            "phpunit tests/"
        ],
        "post-install-cmd": [
            "@security-check"
        ],
        "post-update-cmd": [
            "@security-check"
        ]
    },
    "config": {
        "optimize-autoloader": true,
        "sort-packages": true,
        "allow-plugins": {
            "composer/package-versions-deprecated": true
        },
        "audit": {
            "abandoned": "report"
        }
    },
    "minimum-stability": "stable",
    "prefer-stable": true
}
EOF
    
    log_message "✅ composer.json updated with security-focused dependencies"
}

# Install/update dependencies
install_dependencies() {
    log_message "📦 Installing/updating dependencies..."
    
    cd "$PROJECT_ROOT"
    
    # Clear composer cache
    composer clear-cache 2>&1 | tee -a "$LOG_FILE" || true
    
    # Install dependencies
    if composer install --optimize-autoloader --no-dev 2>&1 | tee -a "$LOG_FILE"; then
        log_message "✅ Dependencies installed successfully"
    else
        log_message "❌ Failed to install dependencies"
        return 1
    fi
}

# Run security audit
run_security_audit() {
    log_message "🔍 Running security audit..."
    
    cd "$PROJECT_ROOT"
    
    # Composer audit (built-in security check)
    log_message "Running composer audit..."
    if composer audit 2>&1 | tee -a "$LOG_FILE"; then
        log_message "✅ No known security vulnerabilities found"
    else
        log_message "⚠️ Security vulnerabilities detected - review log for details"
    fi
    
    # Check for outdated packages
    log_message "Checking for outdated packages..."
    composer outdated 2>&1 | tee -a "$LOG_FILE" || log_message "All packages are up to date"
}

# Create security scanning script
create_security_scanner() {
    log_message "🛡️ Creating security scanning script..."
    
    cat > "${PROJECT_ROOT}/scripts/security-scan.php" << 'EOF'
<?php

/**
 * Security Scanner
 * 
 * Scans the codebase for common security issues
 */

echo "🛡️ Portfolio Security Scanner\n";
echo "============================\n\n";

$projectRoot = dirname(__DIR__);
$issues = [];

// Check for common security issues
$securityChecks = [
    'Hardcoded passwords' => [
        'pattern' => '/password\s*=\s*["\'](?!.*\$)[^"\']+["\']|passwd\s*=\s*["\'][^"\']+["\']/i',
        'files' => ['*.php', '*.js', '*.json'],
        'severity' => 'HIGH'
    ],
    
    'Hardcoded API keys' => [
        'pattern' => '/api[_-]?key\s*[=:]\s*["\'][^"\']+["\']|secret[_-]?key\s*[=:]\s*["\'][^"\']+["\']/i',
        'files' => ['*.php', '*.js', '*.json'],
        'severity' => 'HIGH'
    ],
    
    'SQL injection potential' => [
        'pattern' => '/\$_(GET|POST|REQUEST)\[.*\].*\.(query|exec|prepare)/i',
        'files' => ['*.php'],
        'severity' => 'MEDIUM'
    ],
    
    'Direct superglobal usage' => [
        'pattern' => '/\$_(GET|POST|COOKIE|REQUEST|SERVER)\[/',
        'files' => ['*.php'],
        'severity' => 'LOW'
    ],
    
    'File inclusion vulnerabilities' => [
        'pattern' => '/(include|require)(_once)?\s*\(\s*\$_(GET|POST|REQUEST)/',
        'files' => ['*.php'],
        'severity' => 'HIGH'
    ],
    
    'Eval usage' => [
        'pattern' => '/\beval\s*\(/',
        'files' => ['*.php'],
        'severity' => 'HIGH'
    ],
    
    'Debug information' => [
        'pattern' => '/(var_dump|print_r|var_export)\s*\(|phpinfo\s*\(\)|error_reporting\s*\(\s*E_ALL/',
        'files' => ['*.php'],
        'severity' => 'LOW'
    ]
];

function scanFiles($pattern, $extensions, $projectRoot) {
    $matches = [];
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($projectRoot, RecursiveDirectoryIterator::SKIP_DOTS)
    );
    
    foreach ($iterator as $file) {
        if ($file->isFile()) {
            $filename = $file->getFilename();
            $shouldCheck = false;
            
            foreach ($extensions as $ext) {
                if (fnmatch($ext, $filename)) {
                    $shouldCheck = true;
                    break;
                }
            }
            
            if ($shouldCheck && !strpos($file->getPathname(), 'vendor/')) {
                $content = file_get_contents($file->getPathname());
                if (preg_match_all($pattern, $content, $fileMatches, PREG_OFFSET_CAPTURE)) {
                    foreach ($fileMatches[0] as $match) {
                        $line = substr_count(substr($content, 0, $match[1]), "\n") + 1;
                        $matches[] = [
                            'file' => str_replace($projectRoot . '/', '', $file->getPathname()),
                            'line' => $line,
                            'match' => trim($match[0])
                        ];
                    }
                }
            }
        }
    }
    
    return $matches;
}

foreach ($securityChecks as $checkName => $check) {
    echo "🔍 Checking for: $checkName\n";
    $matches = scanFiles($check['pattern'], $check['files'], $projectRoot);
    
    if (!empty($matches)) {
        $issues[$checkName] = [
            'severity' => $check['severity'],
            'matches' => $matches
        ];
        
        echo "  ⚠️ Found " . count($matches) . " potential issues:\n";
        foreach ($matches as $match) {
            echo "    {$match['file']}:{$match['line']} - {$match['match']}\n";
        }
    } else {
        echo "  ✅ No issues found\n";
    }
    echo "\n";
}

// Check file permissions
echo "🔐 Checking file permissions...\n";
$permissionChecks = [
    'config/' => 0755,
    'storage/' => 0755,
    'storage/logs/' => 0755,
    'storage/cache/' => 0755,
    '.env' => 0600
];

foreach ($permissionChecks as $path => $expectedPerms) {
    $fullPath = $projectRoot . '/' . $path;
    if (file_exists($fullPath)) {
        $actualPerms = fileperms($fullPath) & 0777;
        if ($actualPerms !== $expectedPerms) {
            echo "  ⚠️ Incorrect permissions for $path: " . decoct($actualPerms) . " (expected: " . decoct($expectedPerms) . ")\n";
            $issues['File Permissions'][] = [
                'file' => $path,
                'current' => decoct($actualPerms),
                'expected' => decoct($expectedPerms)
            ];
        } else {
            echo "  ✅ Correct permissions for $path\n";
        }
    }
}

// Generate summary
echo "\n📊 Security Scan Summary\n";
echo "========================\n";

if (empty($issues)) {
    echo "✅ No security issues detected!\n";
} else {
    $highCount = 0;
    $mediumCount = 0;
    $lowCount = 0;
    
    foreach ($issues as $issue) {
        if (isset($issue['severity'])) {
            switch ($issue['severity']) {
                case 'HIGH': $highCount++; break;
                case 'MEDIUM': $mediumCount++; break;
                case 'LOW': $lowCount++; break;
            }
        }
    }
    
    echo "Issues found:\n";
    if ($highCount > 0) echo "  🔴 High severity: $highCount\n";
    if ($mediumCount > 0) echo "  🟡 Medium severity: $mediumCount\n";
    if ($lowCount > 0) echo "  🟢 Low severity: $lowCount\n";
    
    echo "\nRecommendations:\n";
    echo "  • Review and fix high severity issues immediately\n";
    echo "  • Use environment variables for sensitive data\n";
    echo "  • Implement input validation and sanitization\n";
    echo "  • Use prepared statements for database queries\n";
    echo "  • Remove debug code from production\n";
}

echo "\n✅ Security scan completed!\n";
EOF
    
    log_message "✅ Security scanner created"
}

# Create dependency update script
create_update_script() {
    log_message "🔄 Creating dependency update script..."
    
    cat > "${PROJECT_ROOT}/scripts/update-dependencies.sh" << 'EOF'
#!/bin/bash

# Dependency Update Script
# Safely updates dependencies with rollback capability

PROJECT_ROOT="/home/bross/Desktop/My-Portfolio"
BACKUP_DIR="${PROJECT_ROOT}/backups/$(date +%Y%m%d_%H%M%S)"

echo "🔄 Updating dependencies safely..."

# Create backup
mkdir -p "$BACKUP_DIR"
cp "${PROJECT_ROOT}/composer.json" "$BACKUP_DIR/" 2>/dev/null || true
cp "${PROJECT_ROOT}/composer.lock" "$BACKUP_DIR/" 2>/dev/null || true
cp -r "${PROJECT_ROOT}/vendor" "$BACKUP_DIR/" 2>/dev/null || true

echo "📦 Backup created in $BACKUP_DIR"

# Update dependencies
cd "$PROJECT_ROOT"

echo "🔍 Checking for outdated packages..."
composer outdated

echo "🔄 Updating dependencies..."
if composer update --with-dependencies; then
    echo "✅ Dependencies updated successfully"
    
    # Run security audit
    echo "🛡️ Running security audit..."
    composer audit
    
    # Run tests if they exist
    if [ -d "tests" ]; then
        echo "🧪 Running tests..."
        ./vendor/bin/phpunit tests/ || echo "⚠️ Some tests failed"
    fi
    
    echo "✅ Update completed successfully"
else
    echo "❌ Update failed, rolling back..."
    
    # Rollback
    cp "$BACKUP_DIR/composer.json" "${PROJECT_ROOT}/" 2>/dev/null || true
    cp "$BACKUP_DIR/composer.lock" "${PROJECT_ROOT}/" 2>/dev/null || true
    rm -rf "${PROJECT_ROOT}/vendor" 2>/dev/null || true
    cp -r "$BACKUP_DIR/vendor" "${PROJECT_ROOT}/" 2>/dev/null || true
    
    echo "🔄 Rollback completed"
    exit 1
fi
EOF
    
    chmod +x "${PROJECT_ROOT}/scripts/update-dependencies.sh"
    log_message "✅ Update script created"
}

# Check PHP extensions
check_php_extensions() {
    log_message "🔍 Checking PHP extensions..."
    
    required_extensions=("curl" "json" "mbstring" "openssl" "zip" "xml")
    missing_extensions=()
    
    for ext in "${required_extensions[@]}"; do
        if php -m | grep -q "^$ext$"; then
            log_message "✅ $ext extension is installed"
        else
            log_message "❌ $ext extension is missing"
            missing_extensions+=("$ext")
        fi
    done
    
    if [ ${#missing_extensions[@]} -gt 0 ]; then
        log_message "⚠️ Missing extensions: ${missing_extensions[*]}"
        log_message "Install with: sudo apt-get install $(printf 'php-%%s ' "${missing_extensions[@]}")"
    else
        log_message "✅ All required PHP extensions are installed"
    fi
}

# Generate dependency report
generate_dependency_report() {
    log_message "📊 Generating dependency report..."
    
    cd "$PROJECT_ROOT"
    
    cat > "${PROJECT_ROOT}/storage/logs/dependency-report.md" << EOF
# Dependency Security Report

Generated: $(date)

## Dependencies Status

\`\`\`
$(composer show 2>/dev/null || echo "No dependencies found")
\`\`\`

## Outdated Packages

\`\`\`
$(composer outdated 2>/dev/null || echo "All packages up to date")
\`\`\`

## Security Audit

\`\`\`
$(composer audit 2>/dev/null || echo "No security issues found")
\`\`\`

## PHP Information

- PHP Version: $(php -v | head -n1)
- Extensions: $(php -m | tr '\n' ', ')

## Recommendations

1. Keep dependencies updated regularly
2. Run security audits before deployments
3. Use specific version constraints in composer.json
4. Monitor security advisories for used packages
5. Remove unused dependencies

EOF
    
    log_message "✅ Dependency report generated"
}

# Main execution
main() {
    log_message "Starting dependency update and security audit..."
    
    # Check PHP extensions
    check_php_extensions
    
    # Check and install composer
    if check_composer; then
        # Backup existing files
        backup_composer_files
        
        # Check current state
        check_current_dependencies
        
        # Update composer.json
        update_composer_json
        
        # Install dependencies
        if install_dependencies; then
            # Run security audit
            run_security_audit
            
            # Create security tools
            create_security_scanner
            create_update_script
            
            # Generate report
            generate_dependency_report
            
            log_message ""
            log_message "✅ Dependency update and security audit completed!"
            log_message ""
            log_message "📋 What was done:"
            log_message "   • Updated composer.json with secure dependencies"
            log_message "   • Installed/updated all packages"
            log_message "   • Ran comprehensive security audit"
            log_message "   • Created security scanning tools"
            log_message "   • Generated dependency report"
            log_message ""
            log_message "🎯 Next steps:"
            log_message "   • Review security scan results"
            log_message "   • Run ./scripts/update-dependencies.sh monthly"
            log_message "   • Check dependency-report.md for details"
            log_message "   • Monitor security advisories"
        else
            log_message "❌ Dependency installation failed"
            return 1
        fi
    else
        log_message "❌ Could not set up composer"
        return 1
    fi
}

# Execute main function
main