<?php
/**
 * Simple Testimonials API Endpoint
 * 
 * Returns sample testimonials without database dependency.
 */

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

// Check request method
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

// Sample testimonials
$testimonials = [
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
    ],
    [
        'id' => 4,
        'name' => 'David Thompson',
        'rating' => 5,
        'testimonial' => 'Brahim\'s expertise in full-stack development helped us launch our startup\'s MVP ahead of schedule. His code is clean, well-documented, and maintainable.',
        'created_at' => 'August 18, 2024',
        'image_url' => 'data:image/svg+xml;base64,' . base64_encode('<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#9f7aea"/><text x="50" y="55" font-family="Arial" font-size="24" fill="white" text-anchor="middle">DT</text></svg>')
    ],
    [
        'id' => 5,
        'name' => 'Lisa Park',
        'rating' => 5,
        'testimonial' => 'Outstanding work on our company\'s web application. Brahim understood our requirements perfectly and delivered a solution that exceeded our expectations.',
        'created_at' => 'July 5, 2024',
        'image_url' => 'data:image/svg+xml;base64,' . base64_encode('<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#f56565"/><text x="50" y="55" font-family="Arial" font-size="24" fill="white" text-anchor="middle">LP</text></svg>')
    ]
];

$response = [
    'success' => true,
    'message' => 'Sample testimonials loaded successfully',
    'data' => [
        'testimonials' => $testimonials,
        'pagination' => [
            'current_page' => 1,
            'total_pages' => 1,
            'total_items' => count($testimonials),
            'per_page' => 10
        ]
    ]
];

echo json_encode($response);
?>
