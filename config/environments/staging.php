<?php
/**
 * Staging Environment Configuration
 */

return [
    'app' => [
        'name' => 'Portfolio Staging',
        'version' => '1.0.0-staging',
        'url' => $_ENV['APP_URL'] ?? 'https://staging.brahim-elhouss.me',
        'timezone' => 'UTC',
        'debug' => true,
        'log_level' => 'INFO',
        'env' => 'staging'
    ],
    
    'database' => [
        'host' => $_ENV['DB_HOST'] ?? 'localhost',
        'name' => $_ENV['DB_NAME'] ?? 'portfolio_staging',
        'username' => $_ENV['DB_USERNAME'] ?? '',
        'password' => $_ENV['DB_PASSWORD'] ?? '',
        'charset' => 'utf8mb4',
        'port' => $_ENV['DB_PORT'] ?? 3306,
        'options' => [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
        ]
    ],
    
    'mail' => [
        'host' => $_ENV['MAIL_HOST'] ?? 'smtp.gmail.com',
        'port' => $_ENV['MAIL_PORT'] ?? 587,
        'username' => $_ENV['MAIL_USERNAME'] ?? '',
        'password' => $_ENV['MAIL_PASSWORD'] ?? '',
        'encryption' => $_ENV['MAIL_ENCRYPTION'] ?? 'tls',
        'from_address' => $_ENV['MAIL_FROM_ADDRESS'] ?? 'staging@brahim-elhouss.me',
        'from_name' => $_ENV['MAIL_FROM_NAME'] ?? 'Portfolio Staging',
        'debug' => true,
        'log_emails' => true
    ],
    
    'cache' => [
        'driver' => 'file',
        'path' => dirname(__DIR__, 2) . '/storage/cache',
        'default_ttl' => 3600, // 1 hour
        'debug' => true,
        'ttl' => 3600
    ],
    
    'session' => [
        'lifetime' => 480, // 8 hours
        'path' => dirname(__DIR__, 2) . '/storage/sessions',
        'cookie_secure' => true,
        'cookie_httponly' => true,
        'cookie_samesite' => 'Lax',
        'regenerate_interval' => 600 // 10 minutes
    ],
    
    'logging' => [
        'level' => 'INFO',
        'path' => dirname(__DIR__, 2) . '/storage/logs',
        'max_files' => 14,
        'format' => '[%datetime%] %level_name%: %message% %context%',
        'include_trace' => true,
        'file' => 'storage/logs/staging.log'
    ],
    
    'performance' => [
        'enable_compression' => true,
        'enable_opcache' => true
    ],
    
    'security' => [
        'csrf_protection' => true,
        'rate_limiting' => true,
        'max_requests_per_hour' => 500,
        'password_min_length' => 8,
        'session_regenerate' => true,
        'https_only' => true,
        'content_security_policy' => true,
        'cors_origins' => ['https://staging.brahim-elhouss.me'],
        'upload_max_size' => 8388608, // 8MB
        'session_lifetime' => 28800 // 8 hours
    ],
    
    'api' => [
        'rate_limit' => 200,
        'throttle' => true,
        'cors_enabled' => true,
        'cors_origins' => ['https://staging.brahim-elhouss.me'],
        'debug_mode' => true
    ],
    
    'assets' => [
        'minify' => true,
        'combine' => false,
        'version' => true,
        'cache_busting' => true
    ],
    
    'monitoring' => [
        'enabled' => true,
        'error_reporting' => E_ALL & ~E_NOTICE,
        'display_errors' => true,
        'log_errors' => true,
        'performance_monitoring' => true
    ],
    
    'rate_limit' => [
        'enabled' => true,
        'requests' => 500,
        'window' => 3600
    ],
    
    'features' => [
        'analytics' => false,
        'newsletter' => true,
        'blog' => true,
        'test_features' => true
    ],
    
    'testing' => [
        'enabled' => true,
        'api_testing' => true,
        'performance_testing' => true
    ]
];