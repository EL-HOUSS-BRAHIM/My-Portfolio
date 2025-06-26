<?php
/**
 * Get Image API Endpoint
 * 
 * Serves testimonial images with proper caching and security.
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once __DIR__ . '/../config/Config.php';
require_once __DIR__ . '/../config/Database.php';

try {
    // Initialize configuration
    $config = Config::getInstance();
    $db = Database::getInstance();
    
    // Check request method
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        exit;
    }
    
    // Validate ID parameter
    if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
        http_response_code(400);
        exit;
    }
    
    $id = intval($_GET['id']);
    
    // Get image from database
    $sql = "SELECT image_data, image_type, created_at FROM testimonials WHERE id = ?";
    $image = $db->fetchOne($sql, [$id]);
    
    if (!$image) {
        http_response_code(404);
        exit;
    }
    
    // Set appropriate headers
    header('Content-Type: ' . $image['image_type']);
    header('Content-Length: ' . strlen($image['image_data']));
    header('Cache-Control: public, max-age=86400'); // Cache for 24 hours
    header('ETag: "' . md5($image['image_data']) . '"');
    
    // Check if client has cached version
    $etag = '"' . md5($image['image_data']) . '"';
    if (isset($_SERVER['HTTP_IF_NONE_MATCH']) && $_SERVER['HTTP_IF_NONE_MATCH'] === $etag) {
        http_response_code(304);
        exit;
    }
    
    // Output image
    echo $image['image_data'];
    
} catch (Exception $e) {
    error_log("Get image API error: " . $e->getMessage());
    http_response_code(500);
    exit;
}
