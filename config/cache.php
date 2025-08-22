<?php

/**
 * Cache Configuration
 * 
 * Application-level caching settings
 */

return [
    // Default cache driver
    'default' => $_ENV['CACHE_DRIVER'] ?? 'file',
    
    // Cache stores configuration
    'stores' => [
        'file' => [
            'driver' => 'file',
            'path' => __DIR__ . '/../storage/cache',
            'ttl' => 3600, // 1 hour default
        ],
        
        'database' => [
            'driver' => 'database',
            'table' => 'cache',
            'ttl' => 3600,
        ],
        
        'memory' => [
            'driver' => 'array',
            'ttl' => 600, // 10 minutes
        ],
    ],
    
    // Cache type-specific settings
    'types' => [
        'config' => [
            'ttl' => 86400, // 24 hours
            'store' => 'file',
        ],
        
        'database' => [
            'ttl' => 3600, // 1 hour
            'store' => 'file',
        ],
        
        'testimonials' => [
            'ttl' => 1800, // 30 minutes
            'store' => 'file',
        ],
        
        'api' => [
            'ttl' => 300, // 5 minutes
            'store' => 'file',
        ],
        
        'templates' => [
            'ttl' => 7200, // 2 hours
            'store' => 'file',
        ],
    ],
    
    // Cache prefix
    'prefix' => $_ENV['CACHE_PREFIX'] ?? 'portfolio_',
    
    // Enable cache
    'enabled' => $_ENV['CACHE_ENABLED'] ?? true,
    
    // Cache statistics
    'stats' => [
        'enabled' => true,
        'file' => __DIR__ . '/../storage/logs/cache-stats.log',
    ],
    
    // Cache cleanup
    'cleanup' => [
        'auto' => true,
        'probability' => 2, // 2% chance on each request
        'expired_only' => true,
    ],
];
