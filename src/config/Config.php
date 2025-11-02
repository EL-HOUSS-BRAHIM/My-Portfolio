<?php
/**
 * Application Configuration
 * 
 * This file contains all the application configuration settings
 * loaded from environment variables.
 */

namespace Portfolio\Config;

class Config {
    private static $instance = null;
    private $config = [];
    private $secretsManager = null;
    
    private function __construct() {
        $this->loadEnvironment();
        $this->initSecretsManager();
        $this->setDefaults();
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Initialize AWS Secrets Manager if enabled
     */
    private function initSecretsManager() {
        // Check if AWS Secrets Manager is enabled
        $enabled = filter_var($_ENV['AWS_SECRETS_ENABLED'] ?? false, FILTER_VALIDATE_BOOLEAN);
        
        if ($enabled) {
            try {
                require_once __DIR__ . '/../utils/SecretsManager.php';
                $region = $_ENV['AWS_SECRETS_REGION'] ?? 'eu-west-3';
                $this->secretsManager = new \Portfolio\Utils\SecretsManager($region);
            } catch (\Exception $e) {
                error_log("Config: Failed to initialize Secrets Manager: " . $e->getMessage());
                $this->secretsManager = null;
            }
        }
    }
    
    /**
     * Load SMTP credentials from AWS Secrets Manager
     */
    private function loadSmtpFromSecrets() {
        if (!$this->secretsManager) {
            return null;
        }
        
        $secretName = $_ENV['AWS_SMTP_SECRET_NAME'] ?? 'portfolio/smtp-credentials';
        
        try {
            $smtpSecret = $this->secretsManager->getSecret($secretName);
            if ($smtpSecret) {
                return [
                    'smtp_host' => $smtpSecret['smtp_host'] ?? null,
                    'smtp_port' => $smtpSecret['smtp_port'] ?? 587,
                    'smtp_username' => $smtpSecret['smtp_username'] ?? null,
                    'smtp_password' => $smtpSecret['smtp_password'] ?? null,
                    'smtp_encryption' => $smtpSecret['smtp_encryption'] ?? 'tls',
                    'from_email' => $smtpSecret['from_email'] ?? null,
                    'from_name' => $smtpSecret['from_name'] ?? null,
                    'to_email' => $smtpSecret['to_email'] ?? null,
                    'to_name' => $smtpSecret['to_name'] ?? null,
                ];
            }
        } catch (\Exception $e) {
            error_log("Config: Error loading SMTP secrets: " . $e->getMessage());
        }
        
        return null;
    }
    
    private function loadEnvironment() {
        $envPath = dirname(__DIR__, 2) . '/.env';
        
        // Simple .env file parser (without external dependencies)
        if (file_exists($envPath)) {
            $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                // Skip comments and empty lines
                if (strpos(trim($line), '#') === 0 || empty(trim($line))) {
                    continue;
                }
                
                // Parse key=value pairs
                if (strpos($line, '=') !== false) {
                    list($key, $value) = explode('=', $line, 2);
                    $key = trim($key);
                    $value = trim($value);
                    
                    // Remove quotes if present
                    if (preg_match('/^["\'](.*)["\']\s*$/', $value, $matches)) {
                        $value = $matches[1];
                    }
                    
                    // Set environment variable if not already set
                    if (!isset($_ENV[$key])) {
                        $_ENV[$key] = $value;
                        putenv("$key=$value");
                    }
                }
            }
        }
    }
    
    private function setDefaults() {
        // Try to load SMTP credentials from AWS Secrets Manager first
        $smtpSecrets = $this->loadSmtpFromSecrets();
        
        $this->config = [
            // Database
            'db' => [
                'host' => $_ENV['DB_HOST'] ?? 'localhost',
                'name' => $_ENV['DB_NAME'] ?? '',
                'user' => $_ENV['DB_USER'] ?? '',
                'pass' => $_ENV['DB_PASS'] ?? '',
                'charset' => 'utf8mb4'
            ],

            // Email - prioritize AWS Secrets Manager, fallback to .env
            'email' => [
                'smtp_host' => $smtpSecrets['smtp_host'] ?? $_ENV['SMTP_HOST'] ?? '',
                'smtp_port' => $smtpSecrets['smtp_port'] ?? $_ENV['SMTP_PORT'] ?? 587,
                'smtp_username' => $smtpSecrets['smtp_username'] ?? $_ENV['SMTP_USERNAME'] ?? '',
                'smtp_password' => $smtpSecrets['smtp_password'] ?? $_ENV['SMTP_PASSWORD'] ?? '',
                'smtp_encryption' => $smtpSecrets['smtp_encryption'] ?? $_ENV['SMTP_ENCRYPTION'] ?? 'tls',
                'from_email' => $smtpSecrets['from_email'] ?? $_ENV['FROM_EMAIL'] ?? '',
                'from_name' => $smtpSecrets['from_name'] ?? $_ENV['FROM_NAME'] ?? '',
                'to_email' => $smtpSecrets['to_email'] ?? $_ENV['TO_EMAIL'] ?? '',
                'to_name' => $smtpSecrets['to_name'] ?? $_ENV['TO_NAME'] ?? ''
            ],

            // Security
            'security' => [
                'secret_key' => $_ENV['SECRET_KEY'] ?? '',
                'upload_max_size' => $_ENV['UPLOAD_MAX_SIZE'] ?? 5242880, // 5MB
                'allowed_image_types' => explode(',', $_ENV['ALLOWED_IMAGE_TYPES'] ?? 'image/jpeg,image/png,image/gif,image/webp')
            ],

            // reCAPTCHA
            'recaptcha' => [
                'site_key' => $_ENV['RECAPTCHA_SITE_KEY'] ?? '',
                'secret_key' => $_ENV['RECAPTCHA_SECRET_KEY'] ?? '',
                'enabled' => filter_var($_ENV['RECAPTCHA_ENABLED'] ?? true, FILTER_VALIDATE_BOOLEAN)
            ],

            // Application
            'app' => [
                'name' => $_ENV['APP_NAME'] ?? 'Portfolio',
                'url' => (isset($_ENV['DOMAIN']) ? 'https://' . $_ENV['DOMAIN'] : ($_ENV['APP_URL'] ?? 'http://localhost')),
                'env' => $_ENV['APP_ENV'] ?? 'production',
                'debug' => filter_var($_ENV['APP_DEBUG'] ?? false, FILTER_VALIDATE_BOOLEAN)
            ],

            // Rate Limiting
            'rate_limit' => [
                'requests' => $_ENV['RATE_LIMIT_REQUESTS'] ?? 100,
                'window' => $_ENV['RATE_LIMIT_WINDOW'] ?? 3600
            ]
        ];

        // Warn if required config values are missing in debug mode
        if ($this->config['app']['debug']) {
            $required = [
                'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASS',
                'SMTP_HOST', 'SMTP_USERNAME', 'SMTP_PASSWORD', 'FROM_EMAIL', 'TO_EMAIL',
                'RECAPTCHA_SITE_KEY', 'RECAPTCHA_SECRET_KEY'
            ];
            foreach ($required as $key) {
                if (empty($_ENV[$key])) {
                    error_log("[Config] Missing required environment variable: $key");
                }
            }
        }
    }
    
    public function get($key, $default = null) {
        if (!$key) return $default;
        $keys = explode('.', $key);
        $value = $this->config;
        foreach ($keys as $k) {
            if (!is_array($value) || !array_key_exists($k, $value)) {
                return $default;
            }
            $value = $value[$k];
        }
        return $value;
    }
    
    public function all() {
        return $this->config;
    }
}
