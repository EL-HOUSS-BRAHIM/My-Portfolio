<?php

/**
 * Comprehensive Input Validation and Security Manager
 * 
 * Provides input validation, sanitization, CSRF protection,
 * rate limiting, and secure form handling.
 */

declare(strict_types=1);

namespace Portfolio\Security;

class SecurityManager
{
    private array $rules = [];
    private array $errors = [];
    private string $csrfTokenName = '_token';
    private int $csrfTokenExpiry = 3600; // 1 hour
    
    // Rate limiting storage
    private static array $rateLimits = [];
    
    // Security constants
    private const MAX_INPUT_LENGTH = 10000;
    private const MAX_FILE_SIZE = 10485760; // 10MB
    private const ALLOWED_FILE_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'];
    private const DANGEROUS_EXTENSIONS = ['php', 'phtml', 'php3', 'php4', 'php5', 'pl', 'py', 'jsp', 'asp', 'sh', 'cgi'];
    
    public function __construct()
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }
    
    /**
     * Generate CSRF token
     */
    public function generateCsrfToken(): string
    {
        $token = bin2hex(random_bytes(32));
        $_SESSION['csrf_tokens'][$token] = time() + $this->csrfTokenExpiry;
        
        // Clean expired tokens
        $this->cleanExpiredTokens();
        
        return $token;
    }
    
    /**
     * Validate CSRF token
     */
    public function validateCsrfToken(string $token): bool
    {
        if (!isset($_SESSION['csrf_tokens'][$token])) {
            return false;
        }
        
        if ($_SESSION['csrf_tokens'][$token] < time()) {
            unset($_SESSION['csrf_tokens'][$token]);
            return false;
        }
        
        // Token is valid, remove it (one-time use)
        unset($_SESSION['csrf_tokens'][$token]);
        return true;
    }
    
    /**
     * Clean expired CSRF tokens
     */
    private function cleanExpiredTokens(): void
    {
        if (!isset($_SESSION['csrf_tokens'])) {
            $_SESSION['csrf_tokens'] = [];
            return;
        }
        
        $now = time();
        foreach ($_SESSION['csrf_tokens'] as $token => $expiry) {
            if ($expiry < $now) {
                unset($_SESSION['csrf_tokens'][$token]);
            }
        }
    }
    
    /**
     * Rate limiting check
     */
    public function checkRateLimit(string $identifier, int $maxRequests = 10, int $timeWindow = 3600): bool
    {
        $now = time();
        $windowStart = $now - $timeWindow;
        
        // Initialize if not exists
        if (!isset(self::$rateLimits[$identifier])) {
            self::$rateLimits[$identifier] = [];
        }
        
        // Remove old entries
        self::$rateLimits[$identifier] = array_filter(
            self::$rateLimits[$identifier],
            fn($timestamp) => $timestamp > $windowStart
        );
        
        // Check if limit exceeded
        if (count(self::$rateLimits[$identifier]) >= $maxRequests) {
            return false;
        }
        
        // Add current request
        self::$rateLimits[$identifier][] = $now;
        return true;
    }
    
    /**
     * Sanitize input data
     */
    public function sanitize(mixed $data, string $type = 'string'): mixed
    {
        if (is_array($data)) {
            return array_map(fn($item) => $this->sanitize($item, $type), $data);
        }
        
        if (!is_string($data)) {
            return $data;
        }
        
        // Check length limit
        if (strlen($data) > self::MAX_INPUT_LENGTH) {
            throw new \InvalidArgumentException('Input exceeds maximum length');
        }
        
        return match($type) {
            'email' => filter_var(trim($data), FILTER_SANITIZE_EMAIL),
            'url' => filter_var(trim($data), FILTER_SANITIZE_URL),
            'int' => (int) filter_var($data, FILTER_SANITIZE_NUMBER_INT),
            'float' => (float) filter_var($data, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION),
            'html' => htmlspecialchars(trim($data), ENT_QUOTES | ENT_HTML5, 'UTF-8'),
            'sql' => $this->escapeSql(trim($data)),
            'filename' => $this->sanitizeFilename(trim($data)),
            'alphanumeric' => preg_replace('/[^a-zA-Z0-9]/', '', $data),
            'phone' => preg_replace('/[^0-9+\-\(\)\s]/', '', $data),
            default => trim(strip_tags($data))
        };
    }
    
    /**
     * Validate input data
     */
    public function validate(array $data, array $rules): bool
    {
        $this->errors = [];
        
        foreach ($rules as $field => $fieldRules) {
            $value = $data[$field] ?? null;
            
            foreach ($fieldRules as $rule => $ruleValue) {
                if (!$this->validateField($field, $value, $rule, $ruleValue)) {
                    break; // Stop on first error for this field
                }
            }
        }
        
        return empty($this->errors);
    }
    
    /**
     * Validate individual field
     */
    private function validateField(string $field, mixed $value, string $rule, mixed $ruleValue): bool
    {
        switch ($rule) {
            case 'required':
                if ($ruleValue && (empty($value) && $value !== '0')) {
                    $this->errors[$field] = "Field {$field} is required";
                    return false;
                }
                break;
                
            case 'email':
                if ($value && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    $this->errors[$field] = "Field {$field} must be a valid email";
                    return false;
                }
                break;
                
            case 'min_length':
                if ($value && strlen((string)$value) < $ruleValue) {
                    $this->errors[$field] = "Field {$field} must be at least {$ruleValue} characters";
                    return false;
                }
                break;
                
            case 'max_length':
                if ($value && strlen((string)$value) > $ruleValue) {
                    $this->errors[$field] = "Field {$field} must not exceed {$ruleValue} characters";
                    return false;
                }
                break;
                
            case 'pattern':
                if ($value && !preg_match($ruleValue, (string)$value)) {
                    $this->errors[$field] = "Field {$field} format is invalid";
                    return false;
                }
                break;
                
            case 'in':
                if ($value && !in_array($value, $ruleValue)) {
                    $this->errors[$field] = "Field {$field} must be one of: " . implode(', ', $ruleValue);
                    return false;
                }
                break;
                
            case 'numeric':
                if ($value && !is_numeric($value)) {
                    $this->errors[$field] = "Field {$field} must be numeric";
                    return false;
                }
                break;
                
            case 'url':
                if ($value && !filter_var($value, FILTER_VALIDATE_URL)) {
                    $this->errors[$field] = "Field {$field} must be a valid URL";
                    return false;
                }
                break;
        }
        
        return true;
    }
    
    /**
     * Secure file upload handling
     */
    public function validateFileUpload(array $file): bool
    {
        // Check if file was uploaded
        if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
            $this->errors['file'] = 'Invalid file upload';
            return false;
        }
        
        // Check file size
        if ($file['size'] > self::MAX_FILE_SIZE) {
            $this->errors['file'] = 'File size exceeds maximum allowed size';
            return false;
        }
        
        // Check file extension
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        
        if (in_array($extension, self::DANGEROUS_EXTENSIONS)) {
            $this->errors['file'] = 'File type not allowed for security reasons';
            return false;
        }
        
        if (!in_array($extension, self::ALLOWED_FILE_TYPES)) {
            $this->errors['file'] = 'File type not allowed';
            return false;
        }
        
        // Check MIME type
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        
        $allowedMimes = [
            'image/jpeg', 'image/png', 'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        if (!in_array($mimeType, $allowedMimes)) {
            $this->errors['file'] = 'File MIME type not allowed';
            return false;
        }
        
        // Basic malware scan (check for suspicious content)
        $fileContent = file_get_contents($file['tmp_name']);
        if ($this->containsSuspiciousContent($fileContent)) {
            $this->errors['file'] = 'File contains suspicious content';
            return false;
        }
        
        return true;
    }
    
    /**
     * Check for suspicious content in uploaded files
     */
    private function containsSuspiciousContent(string $content): bool
    {
        $suspiciousPatterns = [
            '/<\?php/i',
            '/eval\s*\(/i',
            '/exec\s*\(/i',
            '/system\s*\(/i',
            '/shell_exec\s*\(/i',
            '/passthru\s*\(/i',
            '/base64_decode\s*\(/i',
            '/<script/i',
            '/javascript:/i',
            '/vbscript:/i'
        ];
        
        foreach ($suspiciousPatterns as $pattern) {
            if (preg_match($pattern, $content)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Secure file upload with virus scanning
     */
    public function secureFileUpload(array $file, string $uploadDir): ?string
    {
        if (!$this->validateFileUpload($file)) {
            return null;
        }
        
        // Generate secure filename
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $filename = bin2hex(random_bytes(16)) . '.' . $extension;
        $uploadPath = rtrim($uploadDir, '/') . '/' . $filename;
        
        // Ensure upload directory exists
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        // Move uploaded file
        if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
            // Set secure permissions
            chmod($uploadPath, 0644);
            return $filename;
        }
        
        $this->errors['file'] = 'Failed to upload file';
        return null;
    }
    
    /**
     * SQL injection prevention
     */
    private function escapeSql(string $value): string
    {
        // This is a basic escape - in production, always use prepared statements
        return addslashes($value);
    }
    
    /**
     * Sanitize filename
     */
    private function sanitizeFilename(string $filename): string
    {
        // Remove path traversal attempts
        $filename = basename($filename);
        
        // Remove dangerous characters
        $filename = preg_replace('/[^a-zA-Z0-9._-]/', '', $filename);
        
        // Prevent hidden files
        $filename = ltrim($filename, '.');
        
        // Ensure reasonable length
        return substr($filename, 0, 255);
    }
    
    /**
     * XSS prevention
     */
    public function preventXss(string $data): string
    {
        return htmlspecialchars($data, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }
    
    /**
     * Get validation errors
     */
    public function getErrors(): array
    {
        return $this->errors;
    }
    
    /**
     * Check if IP is whitelisted
     */
    public function isIpWhitelisted(string $ip, array $whitelist = []): bool
    {
        return in_array($ip, $whitelist);
    }
    
    /**
     * Get client IP address
     */
    public function getClientIp(): string
    {
        $headers = [
            'HTTP_CF_CONNECTING_IP',     // Cloudflare
            'HTTP_CLIENT_IP',            // Proxy
            'HTTP_X_FORWARDED_FOR',      // Load balancer/proxy
            'HTTP_X_FORWARDED',          // Proxy
            'HTTP_X_CLUSTER_CLIENT_IP',  // Cluster
            'HTTP_FORWARDED_FOR',        // Proxy
            'HTTP_FORWARDED',            // Proxy
            'REMOTE_ADDR'                // Standard
        ];
        
        foreach ($headers as $header) {
            if (!empty($_SERVER[$header])) {
                $ips = explode(',', $_SERVER[$header]);
                $ip = trim($ips[0]);
                
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }
    
    /**
     * Log security events
     */
    public function logSecurityEvent(string $event, array $context = []): void
    {
        $logEntry = [
            'timestamp' => date('Y-m-d H:i:s'),
            'event' => $event,
            'ip' => $this->getClientIp(),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown',
            'context' => $context
        ];
        
        $logFile = __DIR__ . '/../../storage/logs/security.log';
        $logDir = dirname($logFile);
        
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        
        file_put_contents($logFile, json_encode($logEntry) . PHP_EOL, FILE_APPEND | LOCK_EX);
    }
    
    /**
     * Security headers implementation
     */
    public function setSecurityHeaders(): void
    {
        // Content Security Policy
        header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; object-src 'none'; base-uri 'self';");
        
        // HTTP Strict Transport Security
        header('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');
        
        // X-Frame-Options
        header('X-Frame-Options: DENY');
        
        // X-Content-Type-Options
        header('X-Content-Type-Options: nosniff');
        
        // X-XSS-Protection
        header('X-XSS-Protection: 1; mode=block');
        
        // Referrer Policy
        header('Referrer-Policy: strict-origin-when-cross-origin');
        
        // Permissions Policy
        header('Permissions-Policy: geolocation=(), microphone=(), camera=()');
        
        // Cache control for sensitive pages
        if ($this->isSensitivePage()) {
            header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
            header('Pragma: no-cache');
            header('Expires: 0');
        }
    }
    
    /**
     * Check if current page is sensitive
     */
    private function isSensitivePage(): bool
    {
        $sensitivePages = ['/admin/', '/login', '/dashboard'];
        $currentPath = $_SERVER['REQUEST_URI'] ?? '';
        
        foreach ($sensitivePages as $page) {
            if (strpos($currentPath, $page) !== false) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Force HTTPS redirect
     */
    public function enforceHttps(): void
    {
        if (!isset($_SERVER['HTTPS']) || $_SERVER['HTTPS'] !== 'on') {
            $redirectUrl = 'https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
            header("Location: $redirectUrl", true, 301);
            exit();
        }
    }
}