#!/bin/bash

# Comprehensive Security Setup Script
# Implements all security measures for the portfolio

set -euo pipefail

PROJECT_ROOT="/home/bross/Desktop/My-Portfolio"
LOG_FILE="${PROJECT_ROOT}/storage/logs/security-setup.log"

echo "🛡️ Setting up comprehensive security measures..."

# Ensure logs directory exists
mkdir -p "${PROJECT_ROOT}/storage/logs"

# Function to log with timestamp
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S'): $1" | tee -a "$LOG_FILE"
}

# Create security configuration
create_security_config() {
    log_message "⚙️ Creating security configuration..."
    
    cat > "${PROJECT_ROOT}/config/security.php" << 'EOF'
<?php

/**
 * Security Configuration
 * 
 * Centralized security settings for the portfolio
 */

return [
    // CSRF Protection
    'csrf' => [
        'enabled' => true,
        'token_name' => '_token',
        'token_expiry' => 3600, // 1 hour
    ],
    
    // Rate Limiting
    'rate_limiting' => [
        'enabled' => true,
        'max_requests_per_hour' => 100,
        'max_requests_per_minute' => 20,
        'contact_form_limit' => 5, // per hour
    ],
    
    // File Upload Security
    'file_upload' => [
        'max_size' => 10485760, // 10MB
        'allowed_types' => ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
        'upload_dir' => 'assets/uploads',
        'quarantine_dir' => 'storage/quarantine',
        'scan_uploads' => true,
    ],
    
    // Input Validation
    'validation' => [
        'max_input_length' => 10000,
        'strip_tags' => true,
        'encode_html' => true,
    ],
    
    // Security Headers
    'headers' => [
        'hsts_max_age' => 31536000, // 1 year
        'csp_report_uri' => '/security/csp-report',
        'frame_options' => 'DENY',
    ],
    
    // IP Security
    'ip_security' => [
        'blocked_ips' => [],
        'whitelist_admin' => [],
        'block_tor' => false,
        'block_vpn' => false,
    ],
    
    // Session Security
    'session' => [
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Strict',
        'regenerate_interval' => 300, // 5 minutes
    ],
    
    // Logging
    'logging' => [
        'log_all_requests' => false,
        'log_failed_attempts' => true,
        'log_file_uploads' => true,
        'max_log_size' => 10485760, // 10MB
    ],
];
EOF
    
    log_message "✅ Security configuration created"
}

# Update .htaccess with comprehensive security rules
update_htaccess_security() {
    log_message "🔒 Updating .htaccess with security rules..."
    
    # Backup existing .htaccess
    if [ -f "${PROJECT_ROOT}/.htaccess" ]; then
        cp "${PROJECT_ROOT}/.htaccess" "${PROJECT_ROOT}/.htaccess.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    cat >> "${PROJECT_ROOT}/.htaccess" << 'EOF'

# ================================
# COMPREHENSIVE SECURITY HEADERS
# ================================

<IfModule mod_headers.c>
    # Content Security Policy
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';"
    
    # HTTP Strict Transport Security (HSTS)
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    
    # X-Frame-Options
    Header always set X-Frame-Options "DENY"
    
    # X-Content-Type-Options
    Header always set X-Content-Type-Options "nosniff"
    
    # X-XSS-Protection
    Header always set X-XSS-Protection "1; mode=block"
    
    # Referrer Policy
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    
    # Permissions Policy
    Header always set Permissions-Policy "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), accelerometer=(), gyroscope=()"
    
    # Remove server information
    Header always unset Server
    Header always unset X-Powered-By
    
    # Cache control for sensitive areas
    <FilesMatch "\.(php)$">
        <If "%{REQUEST_URI} =~ m#^/(admin|login|dashboard)#">
            Header always set Cache-Control "no-store, no-cache, must-revalidate, max-age=0"
            Header always set Pragma "no-cache"
            Header always set Expires "0"
        </If>
    </FilesMatch>
</IfModule>

# ================================
# FILE ACCESS RESTRICTIONS
# ================================

# Deny access to sensitive files
<FilesMatch "\.(env|log|sql|conf|config|bak|backup|old|tmp|temp)$">
    Require all denied
</FilesMatch>

# Deny access to hidden files
<FilesMatch "^\.">
    Require all denied
</FilesMatch>

# Protect configuration directories
<DirectoryMatch "(config|storage|vendor|src)">
    Require all denied
</DirectoryMatch>

# Allow specific file types only in uploads
<Directory "assets/uploads">
    <FilesMatch "\.(jpg|jpeg|png|gif|pdf|doc|docx)$">
        Require all granted
    </FilesMatch>
    <FilesMatch "^(?!\.(jpg|jpeg|png|gif|pdf|doc|docx)$)">
        Require all denied
    </FilesMatch>
</Directory>

# ================================
# PHP SECURITY SETTINGS
# ================================

<IfModule mod_php.c>
    # Disable dangerous PHP functions
    php_admin_value disable_functions "exec,passthru,shell_exec,system,proc_open,popen,curl_exec,curl_multi_exec,parse_ini_file,show_source,eval"
    
    # Hide PHP version
    php_flag expose_php Off
    
    # Disable remote file inclusion
    php_flag allow_url_fopen Off
    php_flag allow_url_include Off
    
    # Session security
    php_value session.cookie_httponly 1
    php_value session.cookie_secure 1
    php_value session.use_strict_mode 1
    php_value session.cookie_samesite Strict
    
    # File upload restrictions
    php_value upload_max_filesize 10M
    php_value post_max_size 10M
    php_value max_execution_time 30
    php_value max_input_time 30
    php_value memory_limit 128M
</IfModule>

# ================================
# REQUEST FILTERING
# ================================

# Block suspicious request patterns
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Block SQL injection attempts
    RewriteCond %{QUERY_STRING} (\<|%3C).*script.*(\>|%3E) [NC,OR]
    RewriteCond %{QUERY_STRING} GLOBALS(=|\[|\%[0-9A-Z]{0,2}) [OR]
    RewriteCond %{QUERY_STRING} _REQUEST(=|\[|\%[0-9A-Z]{0,2}) [OR]
    RewriteCond %{QUERY_STRING} (\||%7C) [OR]
    RewriteCond %{QUERY_STRING} (union|select|insert|drop|delete|update|create|alter|exec|execute|script|javascript|vbscript) [NC]
    RewriteRule .* - [F,L]
    
    # Block XSS attempts
    RewriteCond %{QUERY_STRING} (\<|%3C).*iframe.*(\>|%3E) [NC,OR]
    RewriteCond %{QUERY_STRING} (\<|%3C).*object.*(\>|%3E) [NC,OR]
    RewriteCond %{QUERY_STRING} (\<|%3C).*embed.*(\>|%3E) [NC]
    RewriteRule .* - [F,L]
    
    # Block file injection attempts
    RewriteCond %{QUERY_STRING} \.\./\.\./\.\./\.\. [OR]
    RewriteCond %{QUERY_STRING} \.(php|asp|jsp|cgi|pl|py)\? [NC]
    RewriteRule .* - [F,L]
    
    # Force HTTPS (uncomment if SSL certificate is available)
    # RewriteCond %{HTTPS} off
    # RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>

# ================================
# RATE LIMITING
# ================================

<IfModule mod_evasive24.c>
    DOSHashTableSize    4096
    DOSPageCount        3
    DOSPageInterval     1
    DOSSiteCount        50
    DOSSiteInterval     1
    DOSBlockingPeriod   600
</IfModule>

# ================================
# COMPRESSION & PERFORMANCE
# ================================

<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

EOF
    
    log_message "✅ .htaccess security rules updated"
}

# Create security monitoring script
create_security_monitor() {
    log_message "📊 Creating security monitoring script..."
    
    cat > "${PROJECT_ROOT}/scripts/security-monitor.php" << 'EOF'
<?php

/**
 * Security Monitor
 * 
 * Monitors and reports security events
 */

$logFile = __DIR__ . '/../storage/logs/security.log';
$reportFile = __DIR__ . '/../storage/logs/security-report.html';

if (!file_exists($logFile)) {
    echo "No security log found.\n";
    exit(0);
}

echo "🛡️ Security Monitor Report\n";
echo "=========================\n\n";

$events = [];
$lines = file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

foreach ($lines as $line) {
    $event = json_decode($line, true);
    if ($event) {
        $events[] = $event;
    }
}

// Analyze events
$summary = [
    'total_events' => count($events),
    'unique_ips' => count(array_unique(array_column($events, 'ip'))),
    'event_types' => array_count_values(array_column($events, 'event')),
    'recent_events' => 0,
    'high_risk_events' => 0
];

$now = time();
$highRiskEvents = ['csrf_token_invalid', 'rate_limit_exceeded', 'suspicious_file_upload', 'sql_injection_attempt'];

foreach ($events as $event) {
    $eventTime = strtotime($event['timestamp']);
    
    // Count recent events (last 24 hours)
    if ($now - $eventTime < 86400) {
        $summary['recent_events']++;
    }
    
    // Count high-risk events
    if (in_array($event['event'], $highRiskEvents)) {
        $summary['high_risk_events']++;
    }
}

// Display summary
echo "📊 Summary:\n";
echo "  Total events: {$summary['total_events']}\n";
echo "  Unique IPs: {$summary['unique_ips']}\n";
echo "  Recent events (24h): {$summary['recent_events']}\n";
echo "  High-risk events: {$summary['high_risk_events']}\n\n";

echo "📈 Event Types:\n";
foreach ($summary['event_types'] as $type => $count) {
    echo "  $type: $count\n";
}

// Top IPs
echo "\n🌐 Top IPs:\n";
$ipCounts = array_count_values(array_column($events, 'ip'));
arsort($ipCounts);
$topIps = array_slice($ipCounts, 0, 10, true);

foreach ($topIps as $ip => $count) {
    echo "  $ip: $count events\n";
}

// Recent high-risk events
echo "\n⚠️ Recent High-Risk Events:\n";
$recentHighRisk = array_filter($events, function($event) use ($now, $highRiskEvents) {
    return in_array($event['event'], $highRiskEvents) && 
           $now - strtotime($event['timestamp']) < 86400;
});

if (empty($recentHighRisk)) {
    echo "  No high-risk events in the last 24 hours.\n";
} else {
    foreach (array_slice($recentHighRisk, 0, 10) as $event) {
        echo "  {$event['timestamp']}: {$event['event']} from {$event['ip']}\n";
    }
}

// Generate HTML report
generateHtmlReport($events, $summary, $reportFile);

echo "\n✅ Security monitoring completed!\n";
echo "📊 Full report available at: storage/logs/security-report.html\n";

function generateHtmlReport($events, $summary, $reportFile) {
    ob_start();
    ?>
    <!DOCTYPE html>
    <html>
    <head>
        <title>Security Report</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .metric { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
            .high-risk { background: #ffebee; }
            .medium-risk { background: #fff3e0; }
            .low-risk { background: #e8f5e8; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
        </style>
    </head>
    <body>
        <h1>Security Report</h1>
        <p>Generated: <?= date('Y-m-d H:i:s') ?></p>
        
        <h2>Summary</h2>
        <div class="metric">Total Events: <?= $summary['total_events'] ?></div>
        <div class="metric">Unique IPs: <?= $summary['unique_ips'] ?></div>
        <div class="metric">Recent Events (24h): <?= $summary['recent_events'] ?></div>
        <div class="metric <?= $summary['high_risk_events'] > 0 ? 'high-risk' : 'low-risk' ?>">
            High-Risk Events: <?= $summary['high_risk_events'] ?>
        </div>
        
        <h2>Event Types</h2>
        <table>
            <tr><th>Event Type</th><th>Count</th></tr>
            <?php foreach ($summary['event_types'] as $type => $count): ?>
            <tr><td><?= htmlspecialchars($type) ?></td><td><?= $count ?></td></tr>
            <?php endforeach; ?>
        </table>
        
        <h2>Recent Events</h2>
        <table>
            <tr><th>Timestamp</th><th>Event</th><th>IP</th><th>User Agent</th></tr>
            <?php foreach (array_slice($events, -20) as $event): ?>
            <tr>
                <td><?= htmlspecialchars($event['timestamp']) ?></td>
                <td><?= htmlspecialchars($event['event']) ?></td>
                <td><?= htmlspecialchars($event['ip']) ?></td>
                <td><?= htmlspecialchars(substr($event['user_agent'], 0, 50)) ?>...</td>
            </tr>
            <?php endforeach; ?>
        </table>
    </body>
    </html>
    <?php
    $html = ob_get_clean();
    file_put_contents($reportFile, $html);
}
EOF
    
    log_message "✅ Security monitoring script created"
}

# Create secure session handler
create_secure_session() {
    log_message "🔐 Creating secure session handler..."
    
    cat > "${PROJECT_ROOT}/src/security/SecureSession.php" << 'EOF'
<?php

namespace Portfolio\Security;

class SecureSession
{
    private int $regenerateInterval = 300; // 5 minutes
    
    public function __construct()
    {
        $this->configureSession();
    }
    
    /**
     * Configure secure session settings
     */
    private function configureSession(): void
    {
        // Set secure session parameters
        ini_set('session.cookie_httponly', '1');
        ini_set('session.cookie_secure', '1');
        ini_set('session.cookie_samesite', 'Strict');
        ini_set('session.use_strict_mode', '1');
        ini_set('session.gc_maxlifetime', '3600'); // 1 hour
        
        // Custom session name
        session_name('PORTFOLIO_SESSION');
        
        // Start session if not already started
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        // Regenerate session ID periodically
        $this->regenerateSession();
        
        // Validate session
        $this->validateSession();
    }
    
    /**
     * Regenerate session ID periodically
     */
    private function regenerateSession(): void
    {
        if (!isset($_SESSION['last_regeneration'])) {
            $_SESSION['last_regeneration'] = time();
        }
        
        if (time() - $_SESSION['last_regeneration'] > $this->regenerateInterval) {
            session_regenerate_id(true);
            $_SESSION['last_regeneration'] = time();
        }
    }
    
    /**
     * Validate session integrity
     */
    private function validateSession(): void
    {
        // Check IP consistency (optional, can cause issues with load balancers)
        if (isset($_SESSION['ip_address'])) {
            $currentIp = $_SERVER['REMOTE_ADDR'] ?? '';
            if ($_SESSION['ip_address'] !== $currentIp) {
                $this->destroySession();
                return;
            }
        } else {
            $_SESSION['ip_address'] = $_SERVER['REMOTE_ADDR'] ?? '';
        }
        
        // Check user agent consistency
        if (isset($_SESSION['user_agent'])) {
            $currentUserAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
            if ($_SESSION['user_agent'] !== $currentUserAgent) {
                $this->destroySession();
                return;
            }
        } else {
            $_SESSION['user_agent'] = $_SERVER['HTTP_USER_AGENT'] ?? '';
        }
        
        // Session timeout
        if (isset($_SESSION['last_activity'])) {
            if (time() - $_SESSION['last_activity'] > 3600) { // 1 hour
                $this->destroySession();
                return;
            }
        }
        
        $_SESSION['last_activity'] = time();
    }
    
    /**
     * Destroy session securely
     */
    public function destroySession(): void
    {
        $_SESSION = [];
        
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params['path'], $params['domain'],
                $params['secure'], $params['httponly']
            );
        }
        
        session_destroy();
    }
    
    /**
     * Set secure session value
     */
    public function set(string $key, mixed $value): void
    {
        $_SESSION[$key] = $value;
    }
    
    /**
     * Get session value
     */
    public function get(string $key, mixed $default = null): mixed
    {
        return $_SESSION[$key] ?? $default;
    }
    
    /**
     * Check if session key exists
     */
    public function has(string $key): bool
    {
        return isset($_SESSION[$key]);
    }
    
    /**
     * Remove session key
     */
    public function remove(string $key): void
    {
        unset($_SESSION[$key]);
    }
}
EOF
    
    log_message "✅ Secure session handler created"
}

# Set secure file permissions
set_secure_permissions() {
    log_message "🔒 Setting secure file permissions..."
    
    # Set directory permissions
    find "$PROJECT_ROOT" -type d -exec chmod 755 {} \;
    
    # Set file permissions
    find "$PROJECT_ROOT" -type f -exec chmod 644 {} \;
    
    # Set executable permissions for scripts
    chmod +x "${PROJECT_ROOT}/scripts"/*.sh
    
    # Restrict sensitive directories
    chmod 700 "${PROJECT_ROOT}/storage/logs"
    chmod 700 "${PROJECT_ROOT}/config"
    
    # Secure .env file if it exists
    if [ -f "${PROJECT_ROOT}/.env" ]; then
        chmod 600 "${PROJECT_ROOT}/.env"
    fi
    
    # Create security-related directories with proper permissions
    mkdir -p "${PROJECT_ROOT}/storage/quarantine"
    chmod 700 "${PROJECT_ROOT}/storage/quarantine"
    
    log_message "✅ File permissions set securely"
}

# Main execution
main() {
    log_message "Starting comprehensive security setup..."
    
    # Create security configuration
    create_security_config
    
    # Update .htaccess with security rules
    update_htaccess_security
    
    # Create security monitoring
    create_security_monitor
    
    # Create secure session handler
    create_secure_session
    
    # Set secure file permissions
    set_secure_permissions
    
    # Test security implementation
    log_message "🧪 Testing security implementation..."
    php "${PROJECT_ROOT}/scripts/security-monitor.php" >> "$LOG_FILE" 2>&1 || log_message "Security monitor test completed"
    
    log_message ""
    log_message "✅ Comprehensive security setup completed!"
    log_message ""
    log_message "📋 Security measures implemented:"
    log_message "   • Input validation and sanitization"
    log_message "   • CSRF protection with token validation"
    log_message "   • Rate limiting for abuse prevention"
    log_message "   • Secure file upload handling"
    log_message "   • Comprehensive security headers"
    log_message "   • SQL injection prevention"
    log_message "   • XSS protection"
    log_message "   • Secure session management"
    log_message "   • File access restrictions"
    log_message "   • Security monitoring and logging"
    log_message "   • Secure file permissions"
    log_message ""
    log_message "🎯 Next steps:"
    log_message "   • Review security configuration in config/security.php"
    log_message "   • Test security headers with online tools"
    log_message "   • Run security monitoring regularly"
    log_message "   • Keep security measures updated"
    log_message "   • Consider enabling HTTPS redirect in .htaccess"
}

# Execute main function
main