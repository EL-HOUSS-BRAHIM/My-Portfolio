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

echo "window.RECAPTCHA_CONFIG = " . json_encode([
    'siteKey' => $siteKey,
    'enabled' => $enabled
]) . ";";
?>