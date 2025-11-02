#!/usr/bin/env php
<?php
/**
 * Test AWS Secrets Manager Integration
 */

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../src/config/Config.php';

use Portfolio\Config\Config;

echo "\n=== Testing AWS Secrets Manager Integration ===\n\n";

try {
    // Test 1: Load configuration
    echo "Test 1: Loading configuration...\n";
    $config = Config::getInstance();
    echo "✓ Config loaded successfully\n\n";
    
    // Test 2: Check SMTP configuration
    echo "Test 2: Checking SMTP configuration...\n";
    $smtpHost = $config->get('email.smtp_host');
    $smtpUsername = $config->get('email.smtp_username');
    $fromEmail = $config->get('email.from_email');
    
    if (empty($smtpHost)) {
        echo "✗ SMTP host not configured\n";
        exit(1);
    }
    
    echo "✓ SMTP Host: $smtpHost\n";
    echo "✓ SMTP Username: " . (empty($smtpUsername) ? 'Not set' : substr($smtpUsername, 0, 10) . '...') . "\n";
    echo "✓ From Email: $fromEmail\n\n";
    
    // Test 3: Check if using Secrets Manager
    echo "Test 3: Checking Secrets Manager status...\n";
    $secretsEnabled = filter_var(getenv('AWS_SECRETS_ENABLED'), FILTER_VALIDATE_BOOLEAN);
    
    if ($secretsEnabled) {
        echo "✓ AWS Secrets Manager is ENABLED\n";
        $region = getenv('AWS_SECRETS_REGION') ?: 'eu-west-3';
        $secretName = getenv('AWS_SMTP_SECRET_NAME') ?: 'portfolio/smtp-credentials';
        echo "✓ Region: $region\n";
        echo "✓ Secret Name: $secretName\n";
    } else {
        echo "⚠ AWS Secrets Manager is DISABLED (using .env values)\n";
    }
    
    echo "\n=== All Tests Passed ===\n\n";
    
} catch (Exception $e) {
    echo "\n✗ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n\n";
    exit(1);
}
