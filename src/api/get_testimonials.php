
<?php
/**
 * Get Testimonials API Endpoint
 * 
 * Retrieves testimonials with pagination and caching support.
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);

// Always return JSON on fatal error
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'A fatal server error occurred.', 'error' => $error]);
    }
});

require_once __DIR__ . '/../config/Config.php';
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../utils/Response.php';

$config = null;
try {
    // Initialize configuration
    $config = Config::getInstance();
    $db = Database::getInstance();
    
    // Check request method
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        Response::error('Invalid request method', null, 405);
    }
    
    // Get pagination parameters
    $page = max(1, intval($_GET['page'] ?? 1));
    $limit = min(50, max(1, intval($_GET['limit'] ?? 10))); // Max 50 items per page
    $offset = ($page - 1) * $limit;
    
    // Get testimonials with pagination
    $sql = "SELECT id, name, rating, testimonial, created_at FROM testimonials ORDER BY created_at DESC LIMIT ? OFFSET ?";
    $testimonials = $db->fetchAll($sql, [$limit, $offset]);
    
    // Add image URL for each testimonial
    foreach ($testimonials as &$testimonial) {
        $baseUrl = rtrim($config->get('app.url'), '/');
        $testimonial['image_url'] = $baseUrl . '/src/api/get_image.php?id=' . $testimonial['id'];
        $testimonial['rating'] = intval($testimonial['rating']);
        
        // Format date
        if ($testimonial['created_at']) {
            $testimonial['created_at'] = date('Y-m-d H:i:s', strtotime($testimonial['created_at']));
        }
    }
    
    // Get total count for pagination
    $totalSql = "SELECT COUNT(*) as total FROM testimonials";
    $totalResult = $db->fetchOne($totalSql);
    $total = $totalResult['total'] ?? 0;
    
    $response = [
        'testimonials' => $testimonials,
        'pagination' => [
            'current_page' => $page,
            'per_page' => $limit,
            'total' => intval($total),
            'total_pages' => ceil($total / $limit),
            'has_next' => $page < ceil($total / $limit),
            'has_prev' => $page > 1
        ]
    ];
    
    // Set cache headers for better performance
    header('Cache-Control: public, max-age=300'); // Cache for 5 minutes
    header('ETag: "' . md5(serialize($response)) . '"');
    
    Response::success('Testimonials retrieved successfully', $response);
    
} catch (Throwable $e) {
    error_log("Get testimonials API error: " . $e->getMessage());
    if ($config && $config->get('app.debug')) {
        Response::serverError('Error: ' . $e->getMessage() . "\nTrace: " . $e->getTraceAsString());
    } else {
        Response::serverError('Failed to retrieve testimonials. Please try again later.');
    }
}
