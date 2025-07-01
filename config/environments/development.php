<?php
/**
 * Development Environment Configuration
 * 
 * Override configurations for development environment
 */

return [
    'app' => [
        'debug' => true,
        'env' => 'development'
    ],
    
    'logging' => [
        'level' => 'debug',
        'file' => 'storage/logs/development.log'
    ],
    
    'performance' => [
        'enable_compression' => false,
        'enable_opcache' => false
    ],
    
    'security' => [
        'cors_origins' => ['*'],
        'upload_max_size' => 10485760, // 10MB
        'session_lifetime' => 28800 // 8 hours
    ],
    
    'cache' => [
        'driver' => 'file',
        'ttl' => 300, // 5 minutes
        'path' => 'storage/cache'
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
    ]
];
