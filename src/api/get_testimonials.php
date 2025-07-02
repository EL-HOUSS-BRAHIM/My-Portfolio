
<?php
/**
 * Get Testimonials API Endpoint
 * 
 * Retrieves testimonials with pagination and fallback support.
 */

// Set error reporting
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

// Set JSON header
header('Content-Type: application/json');

$config = null;
try {
    // Try to load config and database
    require_once __DIR__ . '/../config/Config.php';
    require_once __DIR__ . '/../config/Database.php';
    require_once __DIR__ . '/../utils/Response.php';

    // Initialize configuration
    $config = Config::getInstance();
    $db = Database::getInstance();
    
    // Check request method
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Invalid request method']);
        exit;
    }
    
    // Get pagination parameters
    $page = max(1, intval($_GET['page'] ?? 1));
    $limit = min(50, max(1, intval($_GET['limit'] ?? 10))); // Max 50 items per page
    $offset = ($page - 1) * $limit;
    
    // Get testimonials with pagination
    $sql = "SELECT id, name, rating, testimonial, created_at FROM testimonials WHERE status = 'approved' ORDER BY created_at DESC LIMIT ? OFFSET ?";
    $testimonials = $db->fetchAll($sql, [$limit, $offset]);
    
    // Add image URL for each testimonial
    foreach ($testimonials as &$testimonial) {
        $baseUrl = rtrim($config->get('app.url', 'https://brahim-elhouss.me'), '/');
        $testimonial['image_url'] = $baseUrl . '/src/api/get_image.php?id=' . $testimonial['id'];
        $testimonial['rating'] = intval($testimonial['rating']);
        
        // Format date
        if ($testimonial['created_at']) {
            $testimonial['created_at'] = date('F j, Y', strtotime($testimonial['created_at']));
        }
    }
    
    // Get total count for pagination
    $totalSql = "SELECT COUNT(*) as total FROM testimonials WHERE status = 'approved'";
    $totalResult = $db->fetchOne($totalSql);
    $total = $totalResult['total'] ?? 0;
    
    $response = [
        'success' => true,
        'message' => 'Testimonials retrieved successfully',
        'data' => [
            'testimonials' => $testimonials,
            'pagination' => [
                'current_page' => $page,
                'total_pages' => ceil($total / $limit),
                'total_items' => $total,
                'per_page' => $limit
            ]
        ]
    ];
    
    // Set cache headers for better performance
    header('Cache-Control: public, max-age=300'); // Cache for 5 minutes
    header('ETag: "' . md5(serialize($response)) . '"');
    
    echo json_encode($response);
    
} catch (Throwable $e) {
    error_log("Get testimonials API error: " . $e->getMessage());
    
    // Fallback to sample testimonials when database fails
    $fallbackTestimonials = [
        [
            'id' => 1,
            'name' => 'Sarah Johnson',
            'rating' => 5,
            'testimonial' => 'Working with Brahim was an exceptional experience. His attention to detail and technical expertise delivered exactly what we needed for our project.',
            'created_at' => 'November 15, 2024',
            'image_url' => 'data:image/svg+xml;base64,' . base64_encode('<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#667eea"/><text x="50" y="55" font-family="Arial" font-size="24" fill="white" text-anchor="middle">SJ</text></svg>')
        ],
        [
            'id' => 2,
            'name' => 'Michael Chen',
            'rating' => 5,
            'testimonial' => 'Brahim transformed our outdated website into a modern, responsive platform. The results exceeded our expectations and significantly improved our online presence.',
            'created_at' => 'October 22, 2024',
            'image_url' => 'data:image/svg+xml;base64,' . base64_encode('<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#48bb78"/><text x="50" y="55" font-family="Arial" font-size="24" fill="white" text-anchor="middle">MC</text></svg>')
        ],
        [
            'id' => 3,
            'name' => 'Emily Rodriguez',
            'rating' => 5,
            'testimonial' => 'Professional, reliable, and skilled. Brahim delivered our e-commerce platform on time and within budget. Highly recommended for any web development project.',
            'created_at' => 'September 8, 2024',
            'image_url' => 'data:image/svg+xml;base64,' . base64_encode('<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#ed8936"/><text x="50" y="55" font-family="Arial" font-size="24" fill="white" text-anchor="middle">ER</text></svg>')
        ]
    ];
    
    $response = [
        'success' => true,
        'message' => 'Sample testimonials loaded (database temporarily unavailable)',
        'data' => [
            'testimonials' => $fallbackTestimonials,
            'pagination' => [
                'current_page' => 1,
                'total_pages' => 1,
                'total_items' => count($fallbackTestimonials),
                'per_page' => 10
            ]
        ]
    ];
    
    echo json_encode($response);
}
