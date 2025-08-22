<?php

/**
 * Security Middleware
 * 
 * Applies security measures to all incoming requests
 */

require_once __DIR__ . '/SecurityManager.php';

use Portfolio\Security\SecurityManager;

class SecurityMiddleware
{
    private SecurityManager $security;
    private array $config;
    
    public function __construct(array $config = [])
    {
        $this->security = new SecurityManager();
        $this->config = array_merge([
            'enable_rate_limiting' => true,
            'enable_csrf_protection' => true,
            'enable_https_redirect' => false,
            'max_requests_per_hour' => 100,
            'blocked_ips' => [],
            'allowed_origins' => [],
        ], $config);
    }
    
    /**
     * Apply security middleware
     */
    public function apply(): void
    {
        // Set security headers
        $this->security->setSecurityHeaders();
        
        // Enforce HTTPS if configured
        if ($this->config['enable_https_redirect']) {
            $this->security->enforceHttps();
        }
        
        // Check IP blocking
        $this->checkIpBlocking();
        
        // Apply rate limiting
        if ($this->config['enable_rate_limiting']) {
            $this->applyRateLimiting();
        }
        
        // CSRF protection for POST requests
        if ($this->config['enable_csrf_protection'] && $_SERVER['REQUEST_METHOD'] === 'POST') {
            $this->validateCsrfToken();
        }
        
        // CORS handling
        $this->handleCors();
        
        // Input sanitization
        $this->sanitizeInputs();
    }
    
    /**
     * Check if IP is blocked
     */
    private function checkIpBlocking(): void
    {
        $clientIp = $this->security->getClientIp();
        
        if (in_array($clientIp, $this->config['blocked_ips'])) {
            $this->security->logSecurityEvent('blocked_ip_access', ['ip' => $clientIp]);
            http_response_code(403);
            die('Access Forbidden');
        }
    }
    
    /**
     * Apply rate limiting
     */
    private function applyRateLimiting(): void
    {
        $clientIp = $this->security->getClientIp();
        
        if (!$this->security->checkRateLimit($clientIp, $this->config['max_requests_per_hour'], 3600)) {
            $this->security->logSecurityEvent('rate_limit_exceeded', ['ip' => $clientIp]);
            http_response_code(429);
            header('Retry-After: 3600');
            die('Too Many Requests');
        }
    }
    
    /**
     * Validate CSRF token
     */
    private function validateCsrfToken(): void
    {
        $token = $_POST['_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
        
        if (!$token || !$this->security->validateCsrfToken($token)) {
            $this->security->logSecurityEvent('csrf_token_invalid', [
                'ip' => $this->security->getClientIp(),
                'referer' => $_SERVER['HTTP_REFERER'] ?? 'unknown'
            ]);
            http_response_code(403);
            die('Invalid CSRF Token');
        }
    }
    
    /**
     * Handle CORS
     */
    private function handleCors(): void
    {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        
        if (!empty($this->config['allowed_origins'])) {
            if (in_array($origin, $this->config['allowed_origins'])) {
                header("Access-Control-Allow-Origin: $origin");
            }
        } else {
            header('Access-Control-Allow-Origin: *');
        }
        
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token');
        header('Access-Control-Max-Age: 3600');
        
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit();
        }
    }
    
    /**
     * Sanitize all inputs
     */
    private function sanitizeInputs(): void
    {
        $_GET = $this->sanitizeArray($_GET);
        $_POST = $this->sanitizeArray($_POST);
        $_COOKIE = $this->sanitizeArray($_COOKIE);
    }
    
    /**
     * Sanitize array recursively
     */
    private function sanitizeArray(array $data): array
    {
        $sanitized = [];
        
        foreach ($data as $key => $value) {
            $cleanKey = $this->security->sanitize($key, 'alphanumeric');
            
            if (is_array($value)) {
                $sanitized[$cleanKey] = $this->sanitizeArray($value);
            } else {
                $sanitized[$cleanKey] = $this->security->sanitize($value);
            }
        }
        
        return $sanitized;
    }
}

// Auto-apply security middleware if this file is included
if (!defined('SECURITY_MIDDLEWARE_DISABLED')) {
    $middleware = new SecurityMiddleware();
    $middleware->apply();
}