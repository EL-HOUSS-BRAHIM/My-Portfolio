<?php
/**
 * Environment Configuration Manager
 * Handles different environments: development, staging, production
 */

class EnvironmentConfig
{
    private static $instance = null;
    private $environment;
    private $config = [];
    private $featureFlags = [];
    
    private function __construct()
    {
        $this->detectEnvironment();
        $this->loadConfiguration();
        $this->loadFeatureFlags();
    }
    
    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Detect current environment
     */
    private function detectEnvironment(): void
    {
        // Check environment variable first
        $this->environment = $_ENV['APP_ENV'] ?? $_SERVER['APP_ENV'] ?? null;
        
        // Fallback to server-based detection
        if (!$this->environment) {
            $host = $_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? 'localhost';
            
            if (strpos($host, 'localhost') !== false || strpos($host, '127.0.0.1') !== false) {
                $this->environment = 'development';
            } elseif (strpos($host, 'staging') !== false || strpos($host, 'dev.') !== false) {
                $this->environment = 'staging';
            } else {
                $this->environment = 'production';
            }
        }
        
        // Validate environment
        if (!in_array($this->environment, ['development', 'staging', 'production'])) {
            $this->environment = 'production'; // Safe default
        }
    }
    
    /**
     * Load environment-specific configuration
     */
    private function loadConfiguration(): void
    {
        $configFile = __DIR__ . "/environments/{$this->environment}.php";
        
        if (file_exists($configFile)) {
            $this->config = require $configFile;
        } else {
            // Fallback to basic configuration
            $this->config = $this->getDefaultConfiguration();
        }
        
        // Load .env file if exists
        $this->loadDotEnv();
    }
    
    /**
     * Load .env file
     */
    private function loadDotEnv(): void
    {
        $envFile = dirname(__DIR__, 2) . "/.env.{$this->environment}";
        
        // Try environment-specific first
        if (!file_exists($envFile)) {
            $envFile = dirname(__DIR__, 2) . '/.env';
        }
        
        if (file_exists($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            
            foreach ($lines as $line) {
                if (strpos($line, '#') === 0 || strpos($line, '=') === false) {
                    continue;
                }
                
                [$key, $value] = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value);
                
                // Remove quotes
                $value = trim($value, '"\'');
                
                $_ENV[$key] = $value;
                putenv("$key=$value");
            }
        }
    }
    
    /**
     * Load feature flags
     */
    private function loadFeatureFlags(): void
    {
        $flagsFile = __DIR__ . "/feature-flags.json";
        
        if (file_exists($flagsFile)) {
            $flags = json_decode(file_get_contents($flagsFile), true);
            $this->featureFlags = $flags[$this->environment] ?? [];
        }
    }
    
    /**
     * Get default configuration
     */
    private function getDefaultConfiguration(): array
    {
        return [
            'app' => [
                'name' => 'Portfolio',
                'version' => '1.0.0',
                'url' => 'http://localhost',
                'timezone' => 'UTC'
            ],
            'database' => [
                'host' => 'localhost',
                'name' => 'portfolio',
                'username' => 'root',
                'password' => '',
                'charset' => 'utf8mb4'
            ],
            'mail' => [
                'host' => 'smtp.gmail.com',
                'port' => 587,
                'username' => '',
                'password' => '',
                'encryption' => 'tls',
                'from_address' => 'noreply@localhost',
                'from_name' => 'Portfolio'
            ],
            'cache' => [
                'driver' => 'file',
                'path' => dirname(__DIR__, 2) . '/storage/cache',
                'default_ttl' => 3600
            ],
            'session' => [
                'lifetime' => 120,
                'path' => dirname(__DIR__, 2) . '/storage/sessions',
                'cookie_secure' => false,
                'cookie_httponly' => true,
                'cookie_samesite' => 'Lax'
            ],
            'logging' => [
                'level' => 'INFO',
                'path' => dirname(__DIR__, 2) . '/storage/logs',
                'max_files' => 30
            ],
            'security' => [
                'csrf_protection' => true,
                'rate_limiting' => true,
                'max_requests_per_hour' => 100,
                'password_min_length' => 8,
                'session_regenerate' => true
            ]
        ];
    }
    
    /**
     * Get current environment
     */
    public function getEnvironment(): string
    {
        return $this->environment;
    }
    
    /**
     * Check if environment is development
     */
    public function isDevelopment(): bool
    {
        return $this->environment === 'development';
    }
    
    /**
     * Check if environment is staging
     */
    public function isStaging(): bool
    {
        return $this->environment === 'staging';
    }
    
    /**
     * Check if environment is production
     */
    public function isProduction(): bool
    {
        return $this->environment === 'production';
    }
    
    /**
     * Get configuration value
     */
    public function get(string $key, $default = null)
    {
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
    
    /**
     * Set configuration value
     */
    public function set(string $key, $value): void
    {
        $keys = explode('.', $key);
        $config = &$this->config;
        
        while (count($keys) > 1) {
            $key = array_shift($keys);
            if (!isset($config[$key]) || !is_array($config[$key])) {
                $config[$key] = [];
            }
            $config = &$config[$key];
        }
        
        $config[array_shift($keys)] = $value;
    }
    
    /**
     * Check if feature flag is enabled
     */
    public function isFeatureEnabled(string $feature): bool
    {
        return $this->featureFlags[$feature] ?? false;
    }
    
    /**
     * Get all feature flags
     */
    public function getFeatureFlags(): array
    {
        return $this->featureFlags;
    }
    
    /**
     * Get database configuration
     */
    public function getDatabaseConfig(): array
    {
        return [
            'host' => $this->get('database.host'),
            'dbname' => $this->get('database.name'),
            'username' => $this->get('database.username'),
            'password' => $this->get('database.password'),
            'charset' => $this->get('database.charset', 'utf8mb4'),
            'options' => [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . $this->get('database.charset', 'utf8mb4')
            ]
        ];
    }
    
    /**
     * Get mail configuration
     */
    public function getMailConfig(): array
    {
        return [
            'host' => $this->get('mail.host'),
            'port' => $this->get('mail.port'),
            'username' => $this->get('mail.username'),
            'password' => $this->get('mail.password'),
            'encryption' => $this->get('mail.encryption'),
            'from_address' => $this->get('mail.from_address'),
            'from_name' => $this->get('mail.from_name')
        ];
    }
    
    /**
     * Get cache configuration
     */
    public function getCacheConfig(): array
    {
        return [
            'driver' => $this->get('cache.driver'),
            'path' => $this->get('cache.path'),
            'default_ttl' => $this->get('cache.default_ttl')
        ];
    }
    
    /**
     * Get session configuration
     */
    public function getSessionConfig(): array
    {
        return [
            'lifetime' => $this->get('session.lifetime'),
            'path' => $this->get('session.path'),
            'cookie_secure' => $this->get('session.cookie_secure'),
            'cookie_httponly' => $this->get('session.cookie_httponly'),
            'cookie_samesite' => $this->get('session.cookie_samesite')
        ];
    }
    
    /**
     * Get security configuration
     */
    public function getSecurityConfig(): array
    {
        return [
            'csrf_protection' => $this->get('security.csrf_protection'),
            'rate_limiting' => $this->get('security.rate_limiting'),
            'max_requests_per_hour' => $this->get('security.max_requests_per_hour'),
            'password_min_length' => $this->get('security.password_min_length'),
            'session_regenerate' => $this->get('security.session_regenerate')
        ];
    }
    
    /**
     * Get all configuration
     */
    public function getAllConfig(): array
    {
        return $this->config;
    }
    
    /**
     * Validate configuration
     */
    public function validateConfig(): array
    {
        $errors = [];
        
        // Check database configuration
        if (!$this->get('database.host')) {
            $errors[] = 'Database host is not configured';
        }
        
        if (!$this->get('database.name')) {
            $errors[] = 'Database name is not configured';
        }
        
        // Check mail configuration
        if (!$this->get('mail.host')) {
            $errors[] = 'Mail host is not configured';
        }
        
        // Check required directories
        $directories = [
            $this->get('cache.path'),
            $this->get('session.path'),
            $this->get('logging.path')
        ];
        
        foreach ($directories as $dir) {
            if ($dir && !is_dir($dir)) {
                if (!mkdir($dir, 0755, true)) {
                    $errors[] = "Cannot create directory: $dir";
                }
            }
        }
        
        // Check file permissions
        if ($this->isProduction()) {
            $sensitiveFiles = [
                dirname(__DIR__, 2) . '/.env',
                dirname(__DIR__, 2) . '/.env.production',
                __DIR__ . '/environments/production.php'
            ];
            
            foreach ($sensitiveFiles as $file) {
                if (file_exists($file)) {
                    $perms = fileperms($file) & 0777;
                    if ($perms > 0600) {
                        $errors[] = "File $file has insecure permissions: " . decoct($perms);
                    }
                }
            }
        }
        
        return $errors;
    }
    
    /**
     * Export configuration for debugging (removes sensitive data)
     */
    public function exportConfig(): array
    {
        $config = $this->config;
        
        // Remove sensitive data
        if (isset($config['database']['password'])) {
            $config['database']['password'] = '***HIDDEN***';
        }
        
        if (isset($config['mail']['password'])) {
            $config['mail']['password'] = '***HIDDEN***';
        }
        
        $config['_environment'] = $this->environment;
        $config['_feature_flags'] = $this->featureFlags;
        
        return $config;
    }
}