<?php

/**
 * Cache Warming Script
 * 
 * Pre-loads frequently accessed data into cache to improve performance
 */

require_once __DIR__ . '/../src/cache/ApplicationCache.php';
require_once __DIR__ . '/../src/config/ConfigManager.php';
require_once __DIR__ . '/../src/testimonials/CachedTestimonialsManager.php';

echo "🔥 Starting cache warming..." . PHP_EOL;

try {
    // Warm configuration cache
    echo "⚙️ Warming configuration cache..." . PHP_EOL;
    $configManager = ConfigManager::getInstance();
    $configManager->loadFromCache() || $configManager->cache();
    
    // Warm testimonials cache
    echo "💬 Warming testimonials cache..." . PHP_EOL;
    $testimonialsManager = new CachedTestimonialsManager();
    $testimonialsManager->getAllTestimonials();
    $testimonialsManager->getApprovedTestimonials();
    $testimonialsManager->getTestimonialStats();
    
    echo "✅ Cache warming completed successfully!" . PHP_EOL;
    
} catch (Exception $e) {
    echo "❌ Cache warming failed: " . $e->getMessage() . PHP_EOL;
    exit(1);
}
