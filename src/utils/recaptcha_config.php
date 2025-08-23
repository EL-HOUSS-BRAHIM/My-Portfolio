<?php
/**
 * reCAPTCHA Configuration Helper
 * 
 * Provides reCAPTCHA configuration for frontend use
 */

require_once dirname(__DIR__) . '/config/Config.php';

header('Content-Type: application/javascript');

$config = Config::getInstance();
$siteKey = $config->get('recaptcha.site_key');
$enabled = $config->get('recaptcha.enabled');

// Add debug information
echo "console.log('[reCAPTCHA Debug] Configuration loaded:');\n";
echo "console.log('[reCAPTCHA Debug] Site Key:', " . json_encode($siteKey) . ");\n";
echo "console.log('[reCAPTCHA Debug] Enabled:', " . json_encode($enabled) . ");\n";
echo "console.log('[reCAPTCHA Debug] Key length:', " . json_encode(strlen($siteKey)) . ");\n";

echo "window.RECAPTCHA_CONFIG = " . json_encode([
    'siteKey' => $siteKey,
    'enabled' => $enabled
]) . ";";

echo "\nconsole.log('[reCAPTCHA Debug] Config object created:', window.RECAPTCHA_CONFIG);\n";
?>