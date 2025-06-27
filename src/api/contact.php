<?php
/**
 * Contact Form API Endpoint
 * 
 * Handles contact form submissions with improved validation,
 * rate limiting, and error handling.
 */

error_reporting(E_ALL);
ini_set('display_errors', 0); // Hide errors in production

require_once __DIR__ . '/../config/Config.php';
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../utils/Validator.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/RateLimit.php';
require_once __DIR__ . '/../../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

try {
    // Initialize configuration
    $config = Config::getInstance();
    
    // Check request method
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        Response::error('Invalid request method', null, 405);
    }
    
    // Rate limiting
    $rateLimit = new RateLimit($config);
    $clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    
    if (!$rateLimit->checkLimit($clientIp, 10, 3600)) { // 10 requests per hour
        Response::error('Too many requests. Please try again later.', null, 429);
    }
    
    // Get and validate input data
    $data = [
        'name' => $_POST['name'] ?? '',
        'email' => $_POST['email'] ?? '',
        'message' => $_POST['message'] ?? ''
    ];
    
    // Sanitize input
    foreach ($data as $key => $value) {
        $data[$key] = Validator::sanitizeString($value);
    }
    
    // Validate input
    $errors = Validator::validateContact($data);
    
    if (!empty($errors)) {
        Response::validationError($errors);
    }
    
    // Send email
    $mail = new PHPMailer(true);
    
    try {
        // Server settings
        $mail->isSMTP();
        $mail->Host = $config->get('email.smtp_host');
        $mail->SMTPAuth = true;
        $mail->Username = $config->get('email.smtp_username');
        $mail->Password = $config->get('email.smtp_password');
        $mail->SMTPSecure = $config->get('email.smtp_encryption');
        $mail->Port = $config->get('email.smtp_port');
        
        // Recipients
        $mail->setFrom($config->get('email.from_email'), $config->get('email.from_name'));
        $mail->addAddress($config->get('email.to_email'), $config->get('email.to_name'));
        $mail->addReplyTo($data['email'], $data['name']);
        
        // Content
        $mail->isHTML(true);
        $mail->Subject = 'New Contact Form Submission - ' . $config->get('app.name');
        $mail->Body = "
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> " . htmlspecialchars($data['name']) . "</p>
            <p><strong>Email:</strong> " . htmlspecialchars($data['email']) . "</p>
            <p><strong>Message:</strong></p>
            <div style='background: #f5f5f5; padding: 15px; border-radius: 5px;'>
                " . nl2br(htmlspecialchars($data['message'])) . "
            </div>
            <hr>
            <p><small>Sent from: " . $config->get('app.url') . "</small></p>
        ";
        
        $mail->send();
        
        // Log successful submission
        error_log("Contact form submitted successfully by: " . $data['email']);
        
        Response::success('Thank you for your message! I will get back to you soon.');
        
    } catch (Exception $e) {
        error_log("Email sending failed: " . $e->getMessage());
        Response::serverError('Failed to send message. Please try again later.');
    }
    
} catch (Exception $e) {
    error_log("Contact API error: " . $e->getMessage());
    
    if ($config->get('app.debug')) {
        Response::serverError('Error: ' . $e->getMessage());
    } else {
        Response::serverError('An unexpected error occurred. Please try again later.');
    }
}
