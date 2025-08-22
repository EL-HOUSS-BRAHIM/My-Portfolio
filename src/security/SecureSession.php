<?php

namespace Portfolio\Security;

class SecureSession
{
    private int $regenerateInterval = 300; // 5 minutes
    
    public function __construct()
    {
        $this->configureSession();
    }
    
    /**
     * Configure secure session settings
     */
    private function configureSession(): void
    {
        // Set secure session parameters
        ini_set('session.cookie_httponly', '1');
        ini_set('session.cookie_secure', '1');
        ini_set('session.cookie_samesite', 'Strict');
        ini_set('session.use_strict_mode', '1');
        ini_set('session.gc_maxlifetime', '3600'); // 1 hour
        
        // Custom session name
        session_name('PORTFOLIO_SESSION');
        
        // Start session if not already started
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        // Regenerate session ID periodically
        $this->regenerateSession();
        
        // Validate session
        $this->validateSession();
    }
    
    /**
     * Regenerate session ID periodically
     */
    private function regenerateSession(): void
    {
        if (!isset($_SESSION['last_regeneration'])) {
            $_SESSION['last_regeneration'] = time();
        }
        
        if (time() - $_SESSION['last_regeneration'] > $this->regenerateInterval) {
            session_regenerate_id(true);
            $_SESSION['last_regeneration'] = time();
        }
    }
    
    /**
     * Validate session integrity
     */
    private function validateSession(): void
    {
        // Check IP consistency (optional, can cause issues with load balancers)
        if (isset($_SESSION['ip_address'])) {
            $currentIp = $_SERVER['REMOTE_ADDR'] ?? '';
            if ($_SESSION['ip_address'] !== $currentIp) {
                $this->destroySession();
                return;
            }
        } else {
            $_SESSION['ip_address'] = $_SERVER['REMOTE_ADDR'] ?? '';
        }
        
        // Check user agent consistency
        if (isset($_SESSION['user_agent'])) {
            $currentUserAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
            if ($_SESSION['user_agent'] !== $currentUserAgent) {
                $this->destroySession();
                return;
            }
        } else {
            $_SESSION['user_agent'] = $_SERVER['HTTP_USER_AGENT'] ?? '';
        }
        
        // Session timeout
        if (isset($_SESSION['last_activity'])) {
            if (time() - $_SESSION['last_activity'] > 3600) { // 1 hour
                $this->destroySession();
                return;
            }
        }
        
        $_SESSION['last_activity'] = time();
    }
    
    /**
     * Destroy session securely
     */
    public function destroySession(): void
    {
        $_SESSION = [];
        
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params['path'], $params['domain'],
                $params['secure'], $params['httponly']
            );
        }
        
        session_destroy();
    }
    
    /**
     * Set secure session value
     */
    public function set(string $key, mixed $value): void
    {
        $_SESSION[$key] = $value;
    }
    
    /**
     * Get session value
     */
    public function get(string $key, mixed $default = null): mixed
    {
        return $_SESSION[$key] ?? $default;
    }
    
    /**
     * Check if session key exists
     */
    public function has(string $key): bool
    {
        return isset($_SESSION[$key]);
    }
    
    /**
     * Remove session key
     */
    public function remove(string $key): void
    {
        unset($_SESSION[$key]);
    }
}
