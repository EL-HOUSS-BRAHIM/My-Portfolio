<?php
/**
 * Production Environment Configuration
 * 
 * Override configurations for production environment
 */

return [
    'app' => [
        'debug' => false,
        'env' => 'production'
    ],
    
    'logging' => [
        'level' => 'error',
        'file' => '/var/log/portfolio/app.log'
    ],
    
    'performance' => [
        'enable_compression' => true,
        'enable_opcache' => true,
        'max_execution_time' => 30
    ],
    
    'security' => [
        'cors_origins' => ['https://brahim-elhouss.me'],
        'upload_max_size' => 2097152, // 2MB
        'session_lifetime' => 3600 // 1 hour
    ],
    
    'cache' => [
        'driver' => 'file',
        'ttl' => 7200, // 2 hours
        'path' => '/var/cache/portfolio'
    ],
    
    'rate_limit' => [
        'enabled' => true,
        'requests' => 50,
        'window' => 3600
    ]
];
