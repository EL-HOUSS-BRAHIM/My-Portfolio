<?php
/**
 * Test Email Sending Script
 *
 * This script tests the SMTP configuration by sending a test email using PHPMailer.
 */


// Manually require PHPMailer classes
require_once __DIR__ . '/../../PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/../../PHPMailer/src/SMTP.php';
require_once __DIR__ . '/../../PHPMailer/src/Exception.php';
require_once __DIR__ . '/../config/Config.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$config = Config::getInstance();

$mail = new PHPMailer(true);

try {
    // Server settings
    $mail->isSMTP();
    $mail->Host = $config->get('SMTP_HOST');
    $mail->SMTPAuth = true;
    $mail->Username = $config->get('SMTP_USERNAME');
    $mail->Password = $config->get('SMTP_PASSWORD');
    $mail->SMTPSecure = $config->get('SMTP_ENCRYPTION', 'tls');
    $mail->Port = $config->get('SMTP_PORT', 587);

    // Recipients
    $fromEmail = $config->get('email.from_email');
    $fromName = $config->get('email.from_name');
    $toEmail = $config->get('email.to_email');
    $toName = $config->get('email.to_name');
    echo "FROM_EMAIL: [$fromEmail]\n";
    echo "FROM_NAME: [$fromName]\n";
    echo "TO_EMAIL: [$toEmail]\n";
    echo "TO_NAME: [$toName]\n";
    $mail->setFrom($fromEmail, $fromName);
    $mail->addAddress($toEmail, $toName);

    // Content
    $mail->isHTML(true);
    $mail->Subject = 'SMTP Test Email';
    $mail->Body    = '<b>This is a test email sent from the PHPMailer test script.</b>';
    $mail->AltBody = 'This is a test email sent from the PHPMailer test script.';

    $mail->send();
    echo "Test email sent successfully!\n";
} catch (Exception $e) {
    echo "Test email could not be sent. Mailer Error: {$mail->ErrorInfo}\n";
}
