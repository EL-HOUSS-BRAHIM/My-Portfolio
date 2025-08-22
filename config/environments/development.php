<?php
/**
 * Development Environment Configuration
 */

return [
    'app' => [
        'name' => 'Portfolio Dev',
        'version' => '1.0.0-dev',
        'url' => 'http://localhost:8000',
        'timezone' => 'UTC',
        'debug' => true,
        'log_level' => 'DEBUG',
        'env' => 'development'
    ],
    
    'database' => [
        'host' => $_ENV['DB_HOST'] ?? 'localhost',
        'name' => $_ENV['DB_NAME'] ?? 'portfolio_dev',
        'username' => $_ENV['DB_USERNAME'] ?? 'root',
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
        'host' => $_ENV['MAIL_HOST'] ?? 'localhost',
        'port' => $_ENV['MAIL_PORT'] ?? 1025,
        'username' => $_ENV['MAIL_USERNAME'] ?? '',
        'password' => $_ENV['MAIL_PASSWORD'] ?? '',
        'encryption' => $_ENV['MAIL_ENCRYPTION'] ?? null,
        'from_address' => $_ENV['MAIL_FROM_ADDRESS'] ?? 'dev@localhost',
        'from_name' => $_ENV['MAIL_FROM_NAME'] ?? 'Portfolio Dev',
        'debug' => true,
        'log_emails' => true
    ],
    
    'cache' => [
        'driver' => 'file',
        'path' => dirname(__DIR__, 2) . '/storage/cache',
        'default_ttl' => 300, // 5 minutes for development
        'debug' => true,
        'ttl' => 300,
    ],
    
    'session' => [
        'lifetime' => 1440, // 24 hours for development
        'path' => dirname(__DIR__, 2) . '/storage/sessions',
        'cookie_secure' => false,
        'cookie_httponly' => true,
        'cookie_samesite' => 'Lax',
        'regenerate_interval' => 300 // 5 minutes
    ],
    
    'logging' => [
        'level' => 'DEBUG',
        'path' => dirname(__DIR__, 2) . '/storage/logs',
        'max_files' => 7,
        'format' => '[%datetime%] %level_name%: %message% %context% %extra%',
        'include_trace' => true,
        'file' => 'storage/logs/development.log'
    ],
    
    'performance' => [
        'enable_compression' => false,
        'enable_opcache' => false
    ],
    
    'security' => [
        'csrf_protection' => true,
        'rate_limiting' => false, // Disabled for development
        'max_requests_per_hour' => 1000,
        'password_min_length' => 6, // Relaxed for development
        'session_regenerate' => false, // Disabled for easier debugging
        'https_only' => false,
        'content_security_policy' => false,
        'cors_origins' => ['*'],
        'upload_max_size' => 10485760, // 10MB
        'session_lifetime' => 28800 // 8 hours
    ],
    
    'api' => [
        'rate_limit' => 1000,
        'throttle' => false,
        'cors_enabled' => true,
        'cors_origins' => ['*'],
        'debug_mode' => true
    ],
    
    'assets' => [
        'minify' => false,
        'combine' => false,
        'version' => false,
        'cache_busting' => false
    ],
    
    'monitoring' => [
        'enabled' => false,
        'error_reporting' => E_ALL,
        'display_errors' => true,
        'log_errors' => true,
        'performance_monitoring' => true
    ],
    
    'rate_limit' => [
        'enabled' => false,
        'requests' => 1000,
        'window' => 3600
    ],
    
    'features' => [
        'analytics' => false,
        'newsletter' => true,
        'blog' => true
    ],
    
    'testing' => [
        'database' => [
            'driver' => 'sqlite',
            'path' => ':memory:'
        ],
        'mail' => [
            'driver' => 'log'
        ]
    ]
];
