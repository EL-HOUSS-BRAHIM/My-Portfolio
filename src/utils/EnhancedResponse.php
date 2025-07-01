<?php
/**
 * Enhanced Response Utility
 * 
 * Provides standardized API responses with enhanced features like
 * response caching, compression, and detailed error reporting.
 */

class EnhancedResponse {
    private static $headers = [];
    private static $config = null;
    private static $startTime = null;
    
    /**
     * Initialize response system
     */
    public static function init() {
        self::$config = ConfigManager::getInstance();
        self::$startTime = microtime(true);
        
        // Set default headers
        self::setDefaultHeaders();
        
        // Enable compression if configured
        if (self::$config->get('performance.enable_compression', true)) {
            self::enableCompression();
        }
    }
    
    /**
     * Set default security and performance headers
     */
    private static function setDefaultHeaders() {
        $headers = [
            'X-Content-Type-Options' => 'nosniff',
            'X-Frame-Options' => 'DENY',
            'X-XSS-Protection' => '1; mode=block',
            'Referrer-Policy' => 'strict-origin-when-cross-origin',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0'
        ];
        
        // Add CORS headers if enabled
        if (self::$config->get('api.enable_cors', false)) {
            $corsOrigins = self::$config->get('security.cors_origins', ['*']);
            $headers['Access-Control-Allow-Origin'] = is_array($corsOrigins) ? implode(', ', $corsOrigins) : $corsOrigins;
            $headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            $headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
            $headers['Access-Control-Max-Age'] = '86400';
        }
        
        foreach ($headers as $name => $value) {
            self::$headers[$name] = $value;
        }
    }
    
    /**
     * Enable gzip compression
     */
    private static function enableCompression() {
        if (!headers_sent() && extension_loaded('zlib') && !ob_get_level()) {
            $level = self::$config->get('performance.compress_level', 6);
            ob_start('ob_gzhandler');
            ini_set('zlib.output_compression_level', $level);
        }
    }
    
    /**
     * Send JSON response with enhanced features
     */
    public static function json($data, $statusCode = 200, $options = []) {
        if (headers_sent()) {
            error_log('[EnhancedResponse] Headers already sent');
            return;
        }
        
        // Set status code
        http_response_code($statusCode);
        
        // Add custom headers
        if (!empty($options['headers'])) {
            foreach ($options['headers'] as $name => $value) {
                self::$headers[$name] = $value;
            }
        }
        
        // Set content type
        self::$headers['Content-Type'] = 'application/json; charset=utf-8';
        
        // Add performance headers
        if (self::$startTime) {
            self::$headers['X-Response-Time'] = round((microtime(true) - self::$startTime) * 1000, 2) . 'ms';
        }
        
        // Add version header
        self::$headers['X-API-Version'] = self::$config->get('api.version', 'v1');
        
        // Add ETag for caching if enabled
        if (!empty($options['cache'])) {
            $etag = '"' . md5(json_encode($data)) . '"';
            self::$headers['ETag'] = $etag;
            
            if (isset($_SERVER['HTTP_IF_NONE_MATCH']) && $_SERVER['HTTP_IF_NONE_MATCH'] === $etag) {
                http_response_code(304);
                self::sendHeaders();
                exit;
            }
        }
        
        // Send all headers
        self::sendHeaders();
        
        // Prepare response data
        $response = self::prepareResponse($data, $statusCode, $options);
        
        // Encode with proper options
        $jsonOptions = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES;
        if (self::$config->get('app.debug', false)) {
            $jsonOptions |= JSON_PRETTY_PRINT;
        }
        
        echo json_encode($response, $jsonOptions);
        
        // Log response if in debug mode
        if (self::$config->get('app.debug', false)) {
            self::logResponse($response, $statusCode);
        }
        
        exit;
    }
    
    /**
     * Prepare response data with metadata
     */
    private static function prepareResponse($data, $statusCode, $options = []) {
        $response = [
            'success' => $statusCode >= 200 && $statusCode < 300,
            'status_code' => $statusCode,
            'timestamp' => date('c'),
        ];
        
        // Add data
        if (is_array($data) && isset($data['message'])) {
            $response['message'] = $data['message'];
            if (isset($data['data'])) {
                $response['data'] = $data['data'];
            }
            if (isset($data['errors'])) {
                $response['errors'] = $data['errors'];
            }
        } else {
            $response['data'] = $data;
        }
        
        // Add pagination if present
        if (!empty($options['pagination'])) {
            $response['pagination'] = $options['pagination'];
        }
        
        // Add metadata
        if (!empty($options['meta'])) {
            $response['meta'] = $options['meta'];
        }
        
        // Add debug information in development
        if (self::$config->get('app.debug', false)) {
            $response['debug'] = [
                'memory_usage' => memory_get_usage(true),
                'memory_peak' => memory_get_peak_usage(true),
                'execution_time' => self::$startTime ? round((microtime(true) - self::$startTime) * 1000, 2) : 0,
                'included_files' => count(get_included_files()),
                'server_time' => date('Y-m-d H:i:s')
            ];
            
            if (!empty($options['debug'])) {
                $response['debug'] = array_merge($response['debug'], $options['debug']);
            }
        }
        
        return $response;
    }
    
    /**
     * Send all headers
     */
    private static function sendHeaders() {
        foreach (self::$headers as $name => $value) {
            header("{$name}: {$value}");
        }
    }
    
    /**
     * Log response for debugging
     */
    private static function logResponse($response, $statusCode) {
        $logData = [
            'status_code' => $statusCode,
            'response_size' => strlen(json_encode($response)),
            'memory_usage' => memory_get_usage(true),
            'execution_time' => self::$startTime ? round((microtime(true) - self::$startTime) * 1000, 2) : 0
        ];
        
        error_log('[EnhancedResponse] ' . json_encode($logData));
    }
    
    // Enhanced response methods
    public static function success($message = 'Success', $data = null, $options = []) {
        $response = ['message' => $message];
        if ($data !== null) {
            $response['data'] = $data;
        }
        self::json($response, 200, $options);
    }
    
    public static function created($message = 'Resource created', $data = null, $options = []) {
        $response = ['message' => $message];
        if ($data !== null) {
            $response['data'] = $data;
        }
        self::json($response, 201, $options);
    }
    
    public static function error($message = 'An error occurred', $errors = null, $statusCode = 400, $options = []) {
        $response = ['message' => $message];
        if ($errors !== null) {
            $response['errors'] = $errors;
        }
        self::json($response, $statusCode, $options);
    }
    
    public static function validationError($errors, $message = 'Validation failed', $options = []) {
        $response = [
            'message' => $message,
            'errors' => $errors
        ];
        self::json($response, 422, $options);
    }
    
    public static function notFound($message = 'Resource not found', $options = []) {
        self::error($message, null, 404, $options);
    }
    
    public static function unauthorized($message = 'Unauthorized', $options = []) {
        $options['headers']['WWW-Authenticate'] = 'Bearer';
        self::error($message, null, 401, $options);
    }
    
    public static function forbidden($message = 'Access forbidden', $options = []) {
        self::error($message, null, 403, $options);
    }
    
    public static function methodNotAllowed($allowedMethods = [], $message = 'Method not allowed', $options = []) {
        if (!empty($allowedMethods)) {
            $options['headers']['Allow'] = implode(', ', $allowedMethods);
        }
        self::error($message, null, 405, $options);
    }
    
    public static function conflict($message = 'Resource conflict', $errors = null, $options = []) {
        self::error($message, $errors, 409, $options);
    }
    
    public static function tooManyRequests($message = 'Too many requests', $retryAfter = null, $options = []) {
        if ($retryAfter) {
            $options['headers']['Retry-After'] = $retryAfter;
        }
        self::error($message, null, 429, $options);
    }
    
    public static function serverError($message = 'Internal server error', $debugInfo = null, $options = []) {
        $response = ['message' => $message];
        
        if (self::$config && self::$config->get('app.debug', false) && $debugInfo) {
            $response['debug'] = $debugInfo;
        }
        
        self::json($response, 500, $options);
    }
    
    public static function serviceUnavailable($message = 'Service temporarily unavailable', $retryAfter = null, $options = []) {
        if ($retryAfter) {
            $options['headers']['Retry-After'] = $retryAfter;
        }
        self::error($message, null, 503, $options);
    }
    
    /**
     * Send paginated response
     */
    public static function paginated($data, $pagination, $message = 'Data retrieved successfully', $options = []) {
        $options['pagination'] = $pagination;
        self::success($message, $data, $options);
    }
    
    /**
     * Send cached response
     */
    public static function cached($data, $cacheTime = 300, $message = 'Success', $options = []) {
        $options['cache'] = true;
        $options['headers']['Cache-Control'] = "public, max-age={$cacheTime}";
        $options['headers']['Expires'] = gmdate('D, d M Y H:i:s', time() + $cacheTime) . ' GMT';
        
        self::success($message, $data, $options);
    }
    
    /**
     * Handle preflight OPTIONS request
     */
    public static function options($allowedMethods = ['GET', 'POST', 'PUT', 'DELETE']) {
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            $options['headers']['Allow'] = implode(', ', $allowedMethods);
            self::json(null, 204, $options);
        }
    }
    
    /**
     * Send file download response
     */
    public static function download($filePath, $filename = null, $contentType = null) {
        if (!file_exists($filePath)) {
            self::notFound('File not found');
            return;
        }
        
        $filename = $filename ?: basename($filePath);
        $contentType = $contentType ?: mime_content_type($filePath) ?: 'application/octet-stream';
        
        // Clear any previous output
        if (ob_get_level()) {
            ob_end_clean();
        }
        
        // Set headers
        header('Content-Type: ' . $contentType);
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Content-Length: ' . filesize($filePath));
        header('Cache-Control: no-cache, must-revalidate');
        header('Expires: 0');
        
        // Send file
        readfile($filePath);
        exit;
    }
    
    /**
     * Redirect response
     */
    public static function redirect($url, $statusCode = 302, $message = null) {
        if (headers_sent()) {
            return;
        }
        
        header("Location: {$url}", true, $statusCode);
        
        if ($message) {
            echo $message;
        }
        
        exit;
    }
    
    /**
     * Set custom header
     */
    public static function setHeader($name, $value) {
        self::$headers[$name] = $value;
    }
    
    /**
     * Remove header
     */
    public static function removeHeader($name) {
        unset(self::$headers[$name]);
    }
    
    /**
     * Get response headers
     */
    public static function getHeaders() {
        return self::$headers;
    }
    
    /**
     * Clear all custom headers
     */
    public static function clearHeaders() {
        self::$headers = [];
        self::setDefaultHeaders();
    }
}

// Initialize response system
EnhancedResponse::init();
