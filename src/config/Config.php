<?php
/**
 * Application Configuration
 * 
 * This file contains all the application configuration settings
 * loaded from environment variables.
 */

require_once __DIR__ . '/../../vendor/autoload.php';

use Dotenv\Dotenv;

class Config {
    private static $instance = null;
    private $config = [];
    
    private function __construct() {
        $this->loadEnvironment();
        $this->setDefaults();
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function loadEnvironment() {
        $dotenv = Dotenv::createImmutable(dirname(__DIR__, 2));
        $dotenv->load();
    }
    
    private function setDefaults() {
        $this->config = [
            // Database
            'db' => [
                'host' => $_ENV['DB_HOST'] ?? 'localhost',
                'name' => $_ENV['DB_NAME'] ?? '',
                'user' => $_ENV['DB_USER'] ?? '',
                'pass' => $_ENV['DB_PASS'] ?? '',
                'charset' => 'utf8mb4'
            ],
            
            // Email
            'email' => [
                'smtp_host' => $_ENV['SMTP_HOST'] ?? 'smtp.gmail.com',
                'smtp_port' => $_ENV['SMTP_PORT'] ?? 587,
                'smtp_username' => $_ENV['SMTP_USERNAME'] ?? '',
                'smtp_password' => $_ENV['SMTP_PASSWORD'] ?? '',
                'smtp_encryption' => $_ENV['SMTP_ENCRYPTION'] ?? 'tls',
                'from_email' => $_ENV['FROM_EMAIL'] ?? '',
                'from_name' => $_ENV['FROM_NAME'] ?? '',
                'to_email' => $_ENV['TO_EMAIL'] ?? '',
                'to_name' => $_ENV['TO_NAME'] ?? ''
            ],
            
            // Security
            'security' => [
                'secret_key' => $_ENV['SECRET_KEY'] ?? '',
                'upload_max_size' => $_ENV['UPLOAD_MAX_SIZE'] ?? 5242880, // 5MB
                'allowed_image_types' => explode(',', $_ENV['ALLOWED_IMAGE_TYPES'] ?? 'image/jpeg,image/png,image/gif,image/webp')
            ],
            
            // Application
            'app' => [
                'name' => $_ENV['APP_NAME'] ?? 'Portfolio',
                'url' => $_ENV['APP_URL'] ?? 'http://localhost',
                'env' => $_ENV['APP_ENV'] ?? 'production',
                'debug' => filter_var($_ENV['DEBUG'] ?? false, FILTER_VALIDATE_BOOLEAN)
            ],
            
            // Rate Limiting
            'rate_limit' => [
                'requests' => $_ENV['RATE_LIMIT_REQUESTS'] ?? 100,
                'window' => $_ENV['RATE_LIMIT_WINDOW'] ?? 3600
            ]
        ];
    }
    
    public function get($key, $default = null) {
        $keys = explode('.', $key);
        $value = $this->config;
        
        foreach ($keys as $k) {
            if (!isset($value[$k])) {
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
