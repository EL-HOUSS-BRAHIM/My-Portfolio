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
