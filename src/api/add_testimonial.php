<?php
/**
 * Add Testimonial API Endpoint
 * 
 * Handles testimonial submissions with improved validation,
 * security, and error handling.
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once __DIR__ . '/../config/Config.php';
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../utils/Validator.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/RateLimit.php';

try {
    // Initialize configuration
    $config = Config::getInstance();
    $db = Database::getInstance();
    
    // Check request method
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        Response::error('Invalid request method', null, 405);
    }
    
    // Rate limiting
    $rateLimit = new RateLimit($config);
    $clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    
    if (!$rateLimit->checkLimit($clientIp, 5, 3600)) { // 5 testimonials per hour
        Response::error('Too many testimonial submissions. Please try again later.', null, 429);
    }
    
    // Get and validate input data
    $data = [
        'name' => $_POST['name'] ?? '',
        'rating' => $_POST['rating'] ?? '',
        'testimonial' => $_POST['testimonial'] ?? ''
    ];
    
    // Sanitize input
    foreach ($data as $key => $value) {
        $data[$key] = Validator::sanitizeString($value);
    }
    
    // Validate input
    $errors = Validator::validateTestimonial($data);
    
    if (!empty($errors)) {
        Response::validationError($errors);
    }
    
    // Validate image
    if (!isset($_FILES['image'])) {
        Response::validationError(['image' => 'Profile image is required']);
    }
    
    $imageErrors = Validator::validateImage($_FILES['image'], $config);
    if (!empty($imageErrors)) {
        Response::validationError(['image' => implode(', ', $imageErrors)]);
    }
    
    // Read image data
    $imageData = file_get_contents($_FILES['image']['tmp_name']);
    if ($imageData === false) {
        Response::serverError('Failed to read image file');
    }
    
    // Save to database
    try {
        $sql = "INSERT INTO testimonials (name, image_data, image_type, rating, testimonial, created_at) VALUES (?, ?, ?, ?, ?, NOW())";
        $params = [
            $data['name'],
            $imageData,
            $_FILES['image']['type'],
            $data['rating'],
            $data['testimonial']
        ];
        
        $db->execute($sql, $params);
        
        // Log successful submission
        error_log("Testimonial submitted successfully by: " . $data['name']);
        
        Response::success('Thank you for your testimonial! It has been submitted successfully.');
        
    } catch (Exception $e) {
        error_log("Database error in testimonial submission: " . $e->getMessage());
        Response::serverError('Failed to save testimonial. Please try again later.');
    }
    
} catch (Exception $e) {
    error_log("Testimonial API error: " . $e->getMessage());
    
    if ($config->get('app.debug')) {
        Response::serverError('Error: ' . $e->getMessage());
    } else {
        Response::serverError('An unexpected error occurred. Please try again later.');
    }
}
