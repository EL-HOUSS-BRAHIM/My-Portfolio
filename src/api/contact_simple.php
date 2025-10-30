<?php
/**
 * Simple Contact Form API Endpoint
 * 
 * Handles contact form submissions with fallback support.
 */

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Simple error handler
function sendErrorResponse(string $message, int $code = 400): void {
    http_response_code($code);
    echo json_encode(['success' => false, 'message' => $message]);
    exit;
}

// Check request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendErrorResponse('Invalid request method', 405);
}

// Get form data
$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$message = trim($_POST['message'] ?? '');

// Basic validation
if (empty($name) || strlen($name) < 2) {
    sendErrorResponse('Name is required and must be at least 2 characters');
}

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendErrorResponse('Valid email address is required');
}

if (empty($message) || strlen($message) < 5) {
    sendErrorResponse('Message is required and must be at least 5 characters');
}

// Sanitize data
$name = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
$email = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');
$message = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');

// Try to send email
$to = 'brahim.crafts.tech@gmail.com';
$subject = 'New Contact Form Submission from ' . $name;
$body = "Name: $name\nEmail: $email\n\nMessage:\n$message\n\nSubmitted: " . date('Y-m-d H:i:s');
$headers = "From: noreply@brahim-elhouss.me\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// Try PHP mail function (basic fallback)
if (mail($to, $subject, $body, $headers)) {
    echo json_encode([
        'success' => true,
        'message' => 'Thank you for your message! I\'ll get back to you soon.'
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Sorry, there was an issue sending your message. Please try emailing me directly at brahim.crafts.tech@gmail.com'
    ]);
}
?>
