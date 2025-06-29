<?php
// Ensure fatal errors return JSON
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'A fatal server error occurred.']);
    }
});
/**
 * Contact Form API Endpoint
 * 
 * Handles contact form submissions with improved validation,
 * rate limiting, and error handling.
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
require_once __DIR__ . '/../utils/Validator.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/RateLimit.php';
require_once __DIR__ . '/../../PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/../../PHPMailer/src/SMTP.php';
require_once __DIR__ . '/../../PHPMailer/src/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

try {
    // Initialize configuration
    $config = Config::getInstance();
    $debug = $config->get('app.debug');
    
    // Check request method
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        Response::error('Invalid request method', null, 405);
        exit;
    }
    
    // Rate limiting
    $rateLimit = new RateLimit($config);
    $clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    if ($debug) error_log("Contact API: Client IP: $clientIp");
    if (!$rateLimit->checkLimit($clientIp, 10, 3600)) { // 10 requests per hour
        if ($debug) error_log("Contact API: Rate limit exceeded for $clientIp");
        Response::error('Too many requests. Please try again later.', null, 429);
        exit;
    }
    
    // Get and validate input data
    $data = [
        'name' => trim($_POST['name'] ?? ''),
        'email' => trim($_POST['email'] ?? ''),
        'message' => trim($_POST['message'] ?? '')
    ];

    // Validate input
    $errors = [];
    if (!Validator::required($data['name'])) {
        $errors['name'] = 'Name is required.';
    } elseif (!Validator::minLength($data['name'], 2)) {
        $errors['name'] = 'Name must be at least 2 characters.';
    } elseif (!Validator::maxLength($data['name'], 100)) {
        $errors['name'] = 'Name must be less than 100 characters.';
    }

    if (!Validator::required($data['email'])) {
        $errors['email'] = 'Email is required.';
    } elseif (!Validator::email($data['email'])) {
        $errors['email'] = 'Invalid email address.';
    }

    if (!Validator::required($data['message'])) {
        $errors['message'] = 'Message is required.';
    } elseif (!Validator::minLength($data['message'], 5)) {
        $errors['message'] = 'Message must be at least 5 characters.';
    } elseif (!Validator::maxLength($data['message'], 2000)) {
        $errors['message'] = 'Message must be less than 2000 characters.';
    }

    if (!empty($errors)) {
        Response::validationError($errors);
        exit;
    }

    // Sanitize input for output
    $safeName = Validator::sanitizeString($data['name']);
    $safeEmail = Validator::sanitizeString($data['email']);
    $safeMessage = nl2br(Validator::sanitizeString($data['message']));


    // Send email using PHPMailer with AWS SES config
    // The 'From' address MUST be a domain verified in SES and have DKIM enabled in AWS SES console.
    // If you see 'signed by: amazonses.com' in Gmail, check your SES domain verification and DKIM setup.

    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = $config->get('email.smtp_host');
    $mail->SMTPAuth = true;
    $mail->Username = $config->get('email.smtp_username');
    $mail->Password = $config->get('email.smtp_password');
    $mail->SMTPSecure = $config->get('email.smtp_encryption', 'tls');
    $mail->Port = $config->get('email.smtp_port', 587);

    // Debug: Log mail config if in debug mode
    if ($debug) {
        error_log("Contact API: Mail config: Host=" . $mail->Host . ", Username=" . $mail->Username . ", Port=" . $mail->Port . ", SMTPSecure=" . $mail->SMTPSecure);
    }

    // Recipients (must use verified domain for 'From')
    $fromEmail = $config->get('email.from_email');
    $fromName = $config->get('email.from_name');
    $toEmail = $config->get('email.to_email');
    $toName = $config->get('email.to_name');
    if (!$fromEmail || !$toEmail) {
        error_log("Missing email.from_email or email.to_email in config");
        if ($debug) {
            error_log("Config values: from_email=$fromEmail, to_email=$toEmail");
        }
        Response::serverError('Email configuration error. Please try again later.' . ($debug ? ' (Missing from_email or to_email)' : ''));
        exit;
    }
    // The 'From' address must be a domain verified in SES and have DKIM enabled in AWS.
    $mail->setFrom($fromEmail, $fromName);
    $mail->addAddress($toEmail, $toName);
    // Set Reply-To to the user's email (safe)
    $mail->addReplyTo($safeEmail, $safeName);

    // Content
    $mail->isHTML(true);
    $mail->Subject = 'New Contact Form Submission';
    $mail->Body =
        "<h2>New Contact Form Submission</h2>"
        . "<p><strong>Name:</strong> " . $safeName . "</p>"
        . "<p><strong>Email:</strong> " . $safeEmail . "</p>"
        . "<p><strong>Message:</strong></p>"
        . "<div style='background: #f5f5f5; padding: 15px; border-radius: 5px;'>"
        . $safeMessage . "</div>"
        . "<hr><p><small>Sent from: " . ($config->get('app.url') ?: $_SERVER['HTTP_HOST']) . "</small></p>";
    $mail->AltBody =
        "Name: " . $safeName . "\n"
        . "Email: " . $safeEmail . "\n"
        . "Message: " . strip_tags($data['message']) . "\n"
        . "Sent from: " . ($config->get('app.url') ?: $_SERVER['HTTP_HOST']);

    try {
        $mail->send();
        error_log("Contact form submitted successfully by: " . $safeEmail);
        Response::success('Thank you for your message! I will get back to you soon.' . ($debug ? ' (Debug: mail sent)' : ''));
        exit;
    } catch (Exception $e) {
        error_log("Email sending failed: " . $e->getMessage());
        if ($debug) {
            Response::serverError('Failed to send message. Mailer Error: ' . $mail->ErrorInfo . ' Exception: ' . $e->getMessage());
        } else {
            Response::serverError('Failed to send message. Please try again later.');
        }
        exit;
    }
} catch (Exception $e) {
    error_log("Contact API error: " . $e->getMessage());
    $debug = isset($config) ? $config->get('app.debug') : false;
    if ($debug) {
        Response::serverError('Error: ' . $e->getMessage());
    } else {
        Response::serverError('An unexpected error occurred. Please try again later.');
    }
    exit;
}
