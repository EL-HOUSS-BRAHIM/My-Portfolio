<?php
/**
 * Get Image API Endpoint
 * 
 * Serves testimonial images with proper caching and security.
 */


// Enable error reporting for debugging if app.debug is set
if (isset($_ENV['APP_DEBUG']) && filter_var($_ENV['APP_DEBUG'], FILTER_VALIDATE_BOOLEAN)) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(E_ALL);
    ini_set('display_errors', 0);
}

require_once __DIR__ . '/../config/Config.php';
require_once __DIR__ . '/../config/Database.php';

try {
    $config = Config::getInstance();
    $db = Database::getInstance();
    $debug = $config->get('app.debug');

    // Check request method
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        if ($debug) {
            header('Content-Type: application/json');
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Invalid request method']);
        } else {
            http_response_code(405);
        }
        exit;
    }

    // Validate ID parameter
    if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
        if ($debug) {
            header('Content-Type: application/json');
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing or invalid id parameter']);
        } else {
            http_response_code(400);
        }
        exit;
    }

    $id = intval($_GET['id']);

    // Get image from database
    $sql = "SELECT image_data, image_type, created_at FROM testimonials WHERE id = ?";
    $image = $db->fetchOne($sql, [$id]);

    if (!$image || empty($image['image_data']) || empty($image['image_type'])) {
        if ($debug) {
            header('Content-Type: application/json');
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Image not found or missing data']);
        } else {
            http_response_code(404);
        }
        exit;
    }

    // Only allow safe image types
    $allowedTypes = $config->get('security.allowed_image_types', ['image/jpeg','image/png','image/gif','image/webp']);
    if (!in_array($image['image_type'], $allowedTypes)) {
        error_log("Blocked image type: " . $image['image_type']);
        if ($debug) {
            header('Content-Type: application/json');
            http_response_code(415);
            echo json_encode(['success' => false, 'message' => 'Unsupported image type']);
        } else {
            http_response_code(415);
        }
        exit;
    }

    // Set appropriate headers
    header('Content-Type: ' . $image['image_type']);
    header('Content-Length: ' . strlen($image['image_data']));
    header('Cache-Control: public, max-age=86400'); // Cache for 24 hours
    $etag = '"' . md5($image['image_data']) . '"';
    header('ETag: ' . $etag);

    // Check if client has cached version
    if (isset($_SERVER['HTTP_IF_NONE_MATCH']) && $_SERVER['HTTP_IF_NONE_MATCH'] === $etag) {
        http_response_code(304);
        exit;
    }

    // Output image as binary
    echo $image['image_data'];

} catch (Exception $e) {
    error_log("Get image API error: " . $e->getMessage());
    if (isset($debug) && $debug) {
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
    } else {
        http_response_code(500);
    }
    exit;
}
