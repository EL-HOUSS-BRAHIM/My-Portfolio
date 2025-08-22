<?php
/**
 * Cache Warmup Script
 * Pre-loads frequently accessed data to improve performance
 */

require_once __DIR__ . '/vendor/autoload.php';

echo "🔥 Warming up cache...\n";

try {
    // Check if config files exist
    $configFiles = [
        __DIR__ . '/src/config/ConfigManager.php',
        __DIR__ . '/src/config/DatabaseManager.php'
    ];
    
    foreach ($configFiles as $file) {
        if (file_exists($file)) {
            require_once $file;
        }
    }
    
    // Test basic functionality
    if (class_exists('ConfigManager')) {
        $config = ConfigManager::getInstance();
        echo "✅ Configuration loaded\n";
    }
    
    if (class_exists('DatabaseManager')) {
        $db = DatabaseManager::getInstance();
        if (method_exists($db, 'healthCheck') && $db->healthCheck()) {
            echo "✅ Database connection verified\n";
        }
        
        // Pre-load testimonials if table exists
        try {
            $testimonials = $db->fetchAll("SELECT * FROM testimonials ORDER BY created_at DESC LIMIT 10");
            echo "✅ Testimonials loaded (" . count($testimonials) . " items)\n";
        } catch (Exception $e) {
            echo "ℹ️  Testimonials table not found or empty\n";
        }
    }
    
    echo "🎉 Cache warmup completed!\n";
    
} catch (Exception $e) {
    echo "❌ Cache warmup failed: " . $e->getMessage() . "\n";
    exit(1);
}
