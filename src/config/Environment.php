<?php
/**
 * Environment Configuration Manager
 * 
 * Provides centralized environment variable management with validation,
 * type casting, and fallback values.
 */

class Environment {
    private static $instance = null;
    private $envVars = [];
    private $requiredVars = [];
    private $isLoaded = false;
    
    private function __construct() {
        $this->loadEnvironment();
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Load environment variables from .env file
     */
    private function loadEnvironment() {
        if ($this->isLoaded) return;
        
        $envPath = dirname(__DIR__, 2) . '/.env';
        
        // Load from .env file if it exists
        if (file_exists($envPath)) {
            $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            
            foreach ($lines as $line) {
                if (strpos(trim($line), '#') === 0 || empty(trim($line))) {
                    continue; // Skip comments and empty lines
                }
                
                if (strpos($line, '=') !== false) {
                    list($key, $value) = explode('=', $line, 2);
                    $key = trim($key);
                    $value = trim($value);
                    
                    // Remove quotes if present
                    if ((substr($value, 0, 1) === '"' && substr($value, -1) === '"') ||
                        (substr($value, 0, 1) === "'" && substr($value, -1) === "'")) {
                        $value = substr($value, 1, -1);
                    }
                    
                    $this->envVars[$key] = $value;
                    putenv("$key=$value");
                    $_ENV[$key] = $value;
                }
            }
        }
        
        $this->isLoaded = true;
    }
    
    /**
     * Get environment variable with type casting and validation
     */
    public function get($key, $default = null, $type = 'string') {
        $value = $this->envVars[$key] ?? $_ENV[$key] ?? getenv($key) ?? $default;
        
        if ($value === null) {
            return $default;
        }
        
        return $this->castValue($value, $type);
    }
    
    /**
     * Cast value to specified type
     */
    private function castValue($value, $type) {
        switch (strtolower($type)) {
            case 'bool':
            case 'boolean':
                return filter_var($value, FILTER_VALIDATE_BOOLEAN);
                
            case 'int':
            case 'integer':
                return (int) $value;
                
            case 'float':
            case 'double':
                return (float) $value;
                
            case 'array':
                if (is_string($value)) {
                    return array_map('trim', explode(',', $value));
                }
                return (array) $value;
                
            case 'json':
                return json_decode($value, true);
                
            case 'string':
            default:
                return (string) $value;
        }
    }
    
    /**
     * Set required environment variables
     */
    public function setRequired(array $vars) {
        $this->requiredVars = array_merge($this->requiredVars, $vars);
        return $this;
    }
    
    /**
     * Validate that all required environment variables are set
     */
    public function validate() {
        $missing = [];
        
        foreach ($this->requiredVars as $var) {
            if (!$this->has($var)) {
                $missing[] = $var;
            }
        }
        
        if (!empty($missing)) {
            throw new RuntimeException('Missing required environment variables: ' . implode(', ', $missing));
        }
        
        return true;
    }
    
    /**
     * Check if environment variable exists
     */
    public function has($key) {
        return isset($this->envVars[$key]) || isset($_ENV[$key]) || getenv($key) !== false;
    }
    
    /**
     * Get all environment variables
     */
    public function all() {
        return array_merge($this->envVars, $_ENV);
    }
    
    /**
     * Check if running in production
     */
    public function isProduction() {
        return $this->get('APP_ENV', 'production') === 'production';
    }
    
    /**
     * Check if running in development
     */
    public function isDevelopment() {
        return $this->get('APP_ENV', 'production') === 'development';
    }
    
    /**
     * Check if debug mode is enabled
     */
    public function isDebug() {
        return $this->get('APP_DEBUG', false, 'bool');
    }
    
    /**
     * Get database configuration
     */
    public function getDatabaseConfig() {
        return [
            'host' => $this->get('DB_HOST', 'localhost'),
            'name' => $this->get('DB_NAME'),
            'user' => $this->get('DB_USER'),
            'pass' => $this->get('DB_PASS'),
            'charset' => $this->get('DB_CHARSET', 'utf8mb4'),
            'port' => $this->get('DB_PORT', 3306, 'int'),
            'options' => [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_PERSISTENT => $this->get('DB_PERSISTENT', false, 'bool')
            ]
        ];
    }
    
    /**
     * Get email configuration
     */
    public function getEmailConfig() {
        return [
            'smtp' => [
                'host' => $this->get('SMTP_HOST'),
                'port' => $this->get('SMTP_PORT', 587, 'int'),
                'username' => $this->get('SMTP_USERNAME'),
                'password' => $this->get('SMTP_PASSWORD'),
                'encryption' => $this->get('SMTP_ENCRYPTION', 'tls'),
                'timeout' => $this->get('SMTP_TIMEOUT', 30, 'int')
            ],
            'from' => [
                'email' => $this->get('FROM_EMAIL'),
                'name' => $this->get('FROM_NAME', 'Portfolio Contact')
            ],
            'to' => [
                'email' => $this->get('TO_EMAIL'),
                'name' => $this->get('TO_NAME', 'Administrator')
            ]
        ];
    }
    
    /**
     * Get security configuration
     */
    public function getSecurityConfig() {
        return [
            'secret_key' => $this->get('SECRET_KEY'),
            'jwt_secret' => $this->get('JWT_SECRET'),
            'upload_max_size' => $this->get('UPLOAD_MAX_SIZE', 5242880, 'int'), // 5MB
            'allowed_image_types' => $this->get('ALLOWED_IMAGE_TYPES', 'image/jpeg,image/png,image/gif,image/webp', 'array'),
            'cors_origins' => $this->get('CORS_ORIGINS', '*', 'array'),
            'session_lifetime' => $this->get('SESSION_LIFETIME', 28800, 'int'), // 8 hours
            'password_min_length' => $this->get('PASSWORD_MIN_LENGTH', 8, 'int'),
            'max_login_attempts' => $this->get('MAX_LOGIN_ATTEMPTS', 5, 'int'),
            'lockout_duration' => $this->get('LOCKOUT_DURATION', 1800, 'int') // 30 minutes
        ];
    }
    
    /**
     * Get rate limiting configuration
     */
    public function getRateLimitConfig() {
        return [
            'enabled' => $this->get('RATE_LIMIT_ENABLED', true, 'bool'),
            'requests' => $this->get('RATE_LIMIT_REQUESTS', 100, 'int'),
            'window' => $this->get('RATE_LIMIT_WINDOW', 3600, 'int'), // 1 hour
            'storage' => $this->get('RATE_LIMIT_STORAGE', 'file'), // file, redis, database
            'redis_host' => $this->get('REDIS_HOST', '127.0.0.1'),
            'redis_port' => $this->get('REDIS_PORT', 6379, 'int'),
            'redis_password' => $this->get('REDIS_PASSWORD')
        ];
    }
    
    /**
     * Create sample .env file
     */
    public function createSampleEnv($path = null) {
        $path = $path ?: dirname(__DIR__, 2) . '/.env.example';
        
        $content = <<<ENV
# Application Configuration
APP_NAME="Portfolio"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com
DOMAIN=yourdomain.com

# Database Configuration
DB_HOST=localhost
DB_NAME=portfolio_db
DB_USER=portfolio_user
DB_PASS=your_secure_password
DB_CHARSET=utf8mb4
DB_PORT=3306
DB_PERSISTENT=false

# Email Configuration (AWS SES)
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USERNAME=your_smtp_username
SMTP_PASSWORD=your_smtp_password
SMTP_ENCRYPTION=tls
SMTP_TIMEOUT=30

FROM_EMAIL=noreply@yourdomain.com
FROM_NAME="Portfolio Contact"
TO_EMAIL=your@email.com
TO_NAME="Your Name"

# Security Configuration
SECRET_KEY=your_256_bit_secret_key_here
JWT_SECRET=your_jwt_secret_here
UPLOAD_MAX_SIZE=5242880
ALLOWED_IMAGE_TYPES="image/jpeg,image/png,image/gif,image/webp"
CORS_ORIGINS="*"

# Admin Configuration
SESSION_LIFETIME=28800
PASSWORD_MIN_LENGTH=8
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=1800

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=3600
RATE_LIMIT_STORAGE=file

# Redis Configuration (if using Redis for rate limiting)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

# Logging
LOG_LEVEL=error
LOG_FILE=storage/logs/app.log
LOG_MAX_FILES=30

# Cache Configuration
CACHE_DRIVER=file
CACHE_TTL=3600
ENV;

        return file_put_contents($path, $content);
    }
}
