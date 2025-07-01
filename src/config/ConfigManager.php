<?php
/**
 * Enhanced Configuration Manager
 * 
 * Provides improved configuration management with environment separation,
 * validation, and caching.
 */

require_once __DIR__ . '/Environment.php';

class ConfigManager {
    private static $instance = null;
    private $config = [];
    private $environment;
    private $isLoaded = false;
    private $configPath;
    
    private function __construct() {
        $this->environment = Environment::getInstance();
        $this->configPath = dirname(__DIR__, 2) . '/config';
        $this->loadConfiguration();
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Load configuration from multiple sources
     */
    private function loadConfiguration() {
        if ($this->isLoaded) return;
        
        // Define required environment variables
        $this->environment->setRequired([
            'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASS',
            'SMTP_HOST', 'SMTP_USERNAME', 'SMTP_PASSWORD',
            'FROM_EMAIL', 'TO_EMAIL', 'SECRET_KEY'
        ]);
        
        // Validate required variables in development
        if ($this->environment->isDevelopment()) {
            try {
                $this->environment->validate();
            } catch (RuntimeException $e) {
                error_log('[ConfigManager] Validation warning: ' . $e->getMessage());
            }
        }
        
        // Load base configuration
        $this->loadBaseConfig();
        
        // Load environment-specific configuration
        $this->loadEnvironmentConfig();
        
        // Load feature flags
        $this->loadFeatureFlags();
        
        $this->isLoaded = true;
    }
    
    /**
     * Load base configuration
     */
    private function loadBaseConfig() {
        $this->config = [
            'app' => [
                'name' => $this->environment->get('APP_NAME', 'Portfolio'),
                'env' => $this->environment->get('APP_ENV', 'production'),
                'debug' => $this->environment->isDebug(),
                'url' => $this->environment->get('APP_URL', 'http://localhost'),
                'domain' => $this->environment->get('DOMAIN'),
                'timezone' => $this->environment->get('APP_TIMEZONE', 'UTC'),
                'version' => $this->getAppVersion()
            ],
            
            'database' => $this->environment->getDatabaseConfig(),
            'email' => $this->environment->getEmailConfig(),
            'security' => $this->environment->getSecurityConfig(),
            'rate_limit' => $this->environment->getRateLimitConfig(),
            
            'logging' => [
                'level' => $this->environment->get('LOG_LEVEL', 'error'),
                'file' => $this->environment->get('LOG_FILE', 'storage/logs/app.log'),
                'max_files' => $this->environment->get('LOG_MAX_FILES', 30, 'int'),
                'rotate_daily' => $this->environment->get('LOG_ROTATE_DAILY', true, 'bool')
            ],
            
            'cache' => [
                'driver' => $this->environment->get('CACHE_DRIVER', 'file'),
                'ttl' => $this->environment->get('CACHE_TTL', 3600, 'int'),
                'path' => $this->environment->get('CACHE_PATH', 'storage/cache'),
                'prefix' => $this->environment->get('CACHE_PREFIX', 'portfolio_')
            ],
            
            'performance' => [
                'enable_compression' => $this->environment->get('ENABLE_COMPRESSION', true, 'bool'),
                'compress_level' => $this->environment->get('COMPRESS_LEVEL', 6, 'int'),
                'enable_opcache' => $this->environment->get('ENABLE_OPCACHE', true, 'bool'),
                'max_execution_time' => $this->environment->get('MAX_EXECUTION_TIME', 30, 'int'),
                'memory_limit' => $this->environment->get('MEMORY_LIMIT', '128M')
            ],
            
            'api' => [
                'version' => $this->environment->get('API_VERSION', 'v1'),
                'enable_cors' => $this->environment->get('API_ENABLE_CORS', true, 'bool'),
                'rate_limit_enabled' => $this->environment->get('API_RATE_LIMIT', true, 'bool'),
                'max_request_size' => $this->environment->get('API_MAX_REQUEST_SIZE', '10M'),
                'timeout' => $this->environment->get('API_TIMEOUT', 30, 'int')
            ]
        ];
    }
    
    /**
     * Load environment-specific configuration
     */
    private function loadEnvironmentConfig() {
        $env = $this->config['app']['env'];
        $envConfigFile = $this->configPath . "/environments/{$env}.php";
        
        if (file_exists($envConfigFile)) {
            $envConfig = include $envConfigFile;
            if (is_array($envConfig)) {
                $this->config = array_merge_recursive($this->config, $envConfig);
            }
        }
    }
    
    /**
     * Load feature flags
     */
    private function loadFeatureFlags() {
        $this->config['features'] = [
            'testimonials' => $this->environment->get('FEATURE_TESTIMONIALS', true, 'bool'),
            'contact_form' => $this->environment->get('FEATURE_CONTACT_FORM', true, 'bool'),
            'admin_panel' => $this->environment->get('FEATURE_ADMIN_PANEL', true, 'bool'),
            'analytics' => $this->environment->get('FEATURE_ANALYTICS', false, 'bool'),
            'newsletter' => $this->environment->get('FEATURE_NEWSLETTER', false, 'bool'),
            'blog' => $this->environment->get('FEATURE_BLOG', false, 'bool'),
            'maintenance_mode' => $this->environment->get('MAINTENANCE_MODE', false, 'bool')
        ];
    }
    
    /**
     * Get application version from composer.json or git
     */
    private function getAppVersion() {
        $composerFile = dirname(__DIR__, 2) . '/composer.json';
        
        if (file_exists($composerFile)) {
            $composer = json_decode(file_get_contents($composerFile), true);
            if (isset($composer['version'])) {
                return $composer['version'];
            }
        }
        
        // Try to get version from git
        if (is_dir(dirname(__DIR__, 2) . '/.git')) {
            $version = exec('git describe --tags --abbrev=0 2>/dev/null');
            if ($version) {
                return $version;
            }
        }
        
        return '1.0.0';
    }
    
    /**
     * Get configuration value using dot notation
     */
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
    
    /**
     * Set configuration value using dot notation
     */
    public function set($key, $value) {
        $keys = explode('.', $key);
        $config = &$this->config;
        
        foreach ($keys as $k) {
            if (!isset($config[$k]) || !is_array($config[$k])) {
                $config[$k] = [];
            }
            $config = &$config[$k];
        }
        
        $config = $value;
    }
    
    /**
     * Check if configuration key exists
     */
    public function has($key) {
        $keys = explode('.', $key);
        $value = $this->config;
        
        foreach ($keys as $k) {
            if (!is_array($value) || !array_key_exists($k, $value)) {
                return false;
            }
            $value = $value[$k];
        }
        
        return true;
    }
    
    /**
     * Get all configuration
     */
    public function all() {
        return $this->config;
    }
    
    /**
     * Get configuration for specific environment
     */
    public function getEnvironmentConfig($env = null) {
        $env = $env ?: $this->config['app']['env'];
        $envConfigFile = $this->configPath . "/environments/{$env}.php";
        
        if (file_exists($envConfigFile)) {
            return include $envConfigFile;
        }
        
        return [];
    }
    
    /**
     * Check if feature is enabled
     */
    public function isFeatureEnabled($feature) {
        return $this->get("features.{$feature}", false);
    }
    
    /**
     * Get database connection string
     */
    public function getDsn() {
        $config = $this->get('database');
        return sprintf(
            "mysql:host=%s;port=%d;dbname=%s;charset=%s",
            $config['host'],
            $config['port'],
            $config['name'],
            $config['charset']
        );
    }
    
    /**
     * Validate configuration
     */
    public function validate() {
        $errors = [];
        
        // Check required database configuration
        $dbRequired = ['host', 'name', 'user', 'pass'];
        foreach ($dbRequired as $key) {
            if (!$this->get("database.{$key}")) {
                $errors[] = "Missing database configuration: {$key}";
            }
        }
        
        // Check required email configuration
        $emailRequired = ['smtp.host', 'smtp.username', 'smtp.password', 'from.email', 'to.email'];
        foreach ($emailRequired as $key) {
            if (!$this->get("email.{$key}")) {
                $errors[] = "Missing email configuration: {$key}";
            }
        }
        
        // Check security configuration
        if (!$this->get('security.secret_key')) {
            $errors[] = "Missing security secret key";
        }
        
        return $errors;
    }
    
    /**
     * Cache configuration for better performance
     */
    public function cache() {
        $cacheFile = $this->get('cache.path') . '/config.cache';
        $cacheDir = dirname($cacheFile);
        
        if (!is_dir($cacheDir)) {
            mkdir($cacheDir, 0755, true);
        }
        
        return file_put_contents($cacheFile, serialize($this->config));
    }
    
    /**
     * Load cached configuration
     */
    public function loadFromCache() {
        $cacheFile = $this->get('cache.path') . '/config.cache';
        
        if (file_exists($cacheFile) && is_readable($cacheFile)) {
            $cached = unserialize(file_get_contents($cacheFile));
            if ($cached && is_array($cached)) {
                $this->config = $cached;
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Clear configuration cache
     */
    public function clearCache() {
        $cacheFile = $this->get('cache.path') . '/config.cache';
        
        if (file_exists($cacheFile)) {
            return unlink($cacheFile);
        }
        
        return true;
    }
}
