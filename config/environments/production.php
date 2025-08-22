<?php
/**
 * Production Environment Configuration
 */

return [
    'app' => [
        'name' => 'Portfolio',
        'version' => '1.0.0',
        'url' => $_ENV['APP_URL'] ?? 'https://brahim-elhouss.me',
        'timezone' => 'UTC',
        'debug' => false,
        'log_level' => 'ERROR',
        'env' => 'production'
    ],
    
    'database' => [
        'host' => $_ENV['DB_HOST'] ?? 'localhost',
        'name' => $_ENV['DB_NAME'] ?? 'portfolio',
        'username' => $_ENV['DB_USERNAME'] ?? '',
        'password' => $_ENV['DB_PASSWORD'] ?? '',
        'charset' => 'utf8mb4',
        'port' => $_ENV['DB_PORT'] ?? 3306,
        'options' => [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4",
            PDO::ATTR_PERSISTENT => true,
            PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true
        ],
        'pool_size' => 10,
        'timeout' => 30
    ],
    
    'mail' => [
        'host' => $_ENV['MAIL_HOST'] ?? 'smtp.gmail.com',
        'port' => $_ENV['MAIL_PORT'] ?? 587,
        'username' => $_ENV['MAIL_USERNAME'] ?? '',
        'password' => $_ENV['MAIL_PASSWORD'] ?? '',
        'encryption' => $_ENV['MAIL_ENCRYPTION'] ?? 'tls',
        'from_address' => $_ENV['MAIL_FROM_ADDRESS'] ?? 'noreply@brahim-elhouss.me',
        'from_name' => $_ENV['MAIL_FROM_NAME'] ?? 'Portfolio',
        'debug' => false,
        'log_emails' => false,
        'timeout' => 30
    ],
    
    'cache' => [
        'driver' => $_ENV['CACHE_DRIVER'] ?? 'redis',
        'path' => dirname(__DIR__, 2) . '/storage/cache',
        'default_ttl' => 86400, // 24 hours
        'debug' => false,
        'ttl' => 86400,
        'redis' => [
            'host' => $_ENV['REDIS_HOST'] ?? '127.0.0.1',
            'port' => $_ENV['REDIS_PORT'] ?? 6379,
            'password' => $_ENV['REDIS_PASSWORD'] ?? null,
            'database' => $_ENV['REDIS_DB'] ?? 0
        ]
    ],
    
    'session' => [
        'lifetime' => 120, // 2 hours
        'path' => dirname(__DIR__, 2) . '/storage/sessions',
        'cookie_secure' => true,
        'cookie_httponly' => true,
        'cookie_samesite' => 'Strict',
        'regenerate_interval' => 900, // 15 minutes
        'driver' => $_ENV['SESSION_DRIVER'] ?? 'redis'
    ],
    
    'logging' => [
        'level' => 'ERROR',
        'path' => dirname(__DIR__, 2) . '/storage/logs',
        'max_files' => 30,
        'format' => '[%datetime%] %level_name%: %message%',
        'include_trace' => false,
        'file' => 'storage/logs/production.log',
        'rotation' => 'daily',
        'max_size' => '100MB'
    ],
    
    'performance' => [
        'enable_compression' => true,
        'enable_opcache' => true,
        'compression_level' => 6,
        'gzip_compression' => true,
        'browser_cache' => true,
        'cache_headers' => true
    ],
    
    'security' => [
        'csrf_protection' => true,
        'rate_limiting' => true,
        'max_requests_per_hour' => 100,
        'password_min_length' => 12,
        'session_regenerate' => true,
        'https_only' => true,
        'content_security_policy' => true,
        'cors_origins' => ['https://brahim-elhouss.me'],
        'upload_max_size' => 5242880, // 5MB
        'session_lifetime' => 7200, // 2 hours
        'hsts_enabled' => true,
        'xss_protection' => true,
        'content_type_nosniff' => true,
        'frame_options' => 'DENY'
    ],
    
    'api' => [
        'rate_limit' => 60,
        'throttle' => true,
        'cors_enabled' => true,
        'cors_origins' => ['https://brahim-elhouss.me'],
        'debug_mode' => false,
        'timeout' => 30
    ],
    
    'assets' => [
        'minify' => true,
        'combine' => true,
        'version' => true,
        'cache_busting' => true,
        'cdn_url' => $_ENV['CDN_URL'] ?? null,
        'compression' => true
    ],
    
    'monitoring' => [
        'enabled' => true,
        'error_reporting' => E_ERROR | E_WARNING | E_PARSE,
        'display_errors' => false,
        'log_errors' => true,
        'performance_monitoring' => true,
        'uptime_monitoring' => true,
        'memory_limit_monitoring' => true
    ],
    
    'rate_limit' => [
        'enabled' => true,
        'requests' => 100,
        'window' => 3600,
        'burst' => 10
    ],
    
    'features' => [
        'analytics' => true,
        'newsletter' => true,
        'blog' => true,
        'contact_form' => true,
        'admin_panel' => true
    ],
    
    'backup' => [
        'enabled' => true,
        'frequency' => 'daily',
        'retention' => 30,
        'storage' => $_ENV['BACKUP_STORAGE'] ?? 'local',
        's3' => [
            'bucket' => $_ENV['AWS_BUCKET'] ?? '',
            'region' => $_ENV['AWS_REGION'] ?? 'us-east-1',
            'access_key' => $_ENV['AWS_ACCESS_KEY_ID'] ?? '',
            'secret_key' => $_ENV['AWS_SECRET_ACCESS_KEY'] ?? ''
        ]
    ],
    
    'ssl' => [
        'enabled' => true,
        'force_https' => true,
        'hsts_max_age' => 31536000, // 1 year
        'include_subdomains' => true
    ]
];
