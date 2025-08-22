<?php

declare(strict_types=1);

/**
 * Error Handler Utility Class
 * 
 * Provides standardized error handling patterns across the application
 * with consistent logging and response formatting.
 */

namespace Portfolio\Utils;

use Exception;
use Throwable;

class ErrorHandler
{
    private static bool $debugMode = false;
    
    /**
     * Initialize error handler with debug mode setting
     */
    public static function init(bool $debugMode = false): void
    {
        self::$debugMode = $debugMode;
        
        // Set custom error handler
        set_error_handler([self::class, 'handleError']);
        set_exception_handler([self::class, 'handleException']);
    }
    
    /**
     * Handle PHP errors
     */
    public static function handleError(int $severity, string $message, string $file, int $line): bool
    {
        // Don't handle errors that are suppressed with @
        if (!(error_reporting() & $severity)) {
            return false;
        }
        
        $errorData = [
            'type' => 'PHP Error',
            'severity' => self::getSeverityName($severity),
            'message' => $message,
            'file' => $file,
            'line' => $line,
            'timestamp' => date('Y-m-d H:i:s'),
            'request_uri' => $_SERVER['REQUEST_URI'] ?? 'CLI'
        ];
        
        self::logError($errorData);
        
        // Don't execute PHP internal error handler
        return true;
    }
    
    /**
     * Handle uncaught exceptions
     */
    public static function handleException(Throwable $exception): void
    {
        $errorData = [
            'type' => 'Uncaught Exception',
            'class' => get_class($exception),
            'message' => $exception->getMessage(),
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
            'trace' => $exception->getTraceAsString(),
            'timestamp' => date('Y-m-d H:i:s'),
            'request_uri' => $_SERVER['REQUEST_URI'] ?? 'CLI'
        ];
        
        self::logError($errorData);
        
        // Return appropriate response
        if (self::$debugMode) {
            self::displayDebugError($errorData);
        } else {
            self::displayProductionError();
        }
    }
    
    /**
     * Log application errors with context
     */
    public static function logError(array $errorData, array $context = []): void
    {
        $logEntry = sprintf(
            "[%s] %s: %s in %s:%d",
            $errorData['timestamp'],
            $errorData['type'],
            $errorData['message'],
            $errorData['file'],
            $errorData['line']
        );
        
        if (!empty($context)) {
            $logEntry .= " | Context: " . json_encode($context);
        }
        
        if (isset($errorData['trace'])) {
            $logEntry .= "\nStack trace:\n" . $errorData['trace'];
        }
        
        error_log($logEntry);
    }
    
    /**
     * Create standardized error response
     */
    public static function createErrorResponse(
        string $message, 
        int $code = 500, 
        array $details = [],
        Throwable $exception = null
    ): array {
        $response = [
            'success' => false,
            'error' => [
                'message' => $message,
                'code' => $code,
                'timestamp' => date('c')
            ]
        ];
        
        if (!empty($details)) {
            $response['error']['details'] = $details;
        }
        
        if (self::$debugMode && $exception) {
            $response['debug'] = [
                'exception' => get_class($exception),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
                'trace' => $exception->getTrace()
            ];
        }
        
        // Log the error
        if ($exception) {
            self::logError([
                'type' => 'Application Error',
                'message' => $message,
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
                'timestamp' => date('Y-m-d H:i:s'),
                'request_uri' => $_SERVER['REQUEST_URI'] ?? 'CLI'
            ], $details);
        }
        
        return $response;
    }
    
    /**
     * Handle database errors consistently
     */
    public static function handleDatabaseError(Throwable $exception, string $operation = 'Database operation'): array
    {
        $message = self::$debugMode 
            ? $exception->getMessage() 
            : 'A database error occurred. Please try again later.';
            
        return self::createErrorResponse(
            $message,
            500,
            ['operation' => $operation],
            $exception
        );
    }
    
    /**
     * Handle validation errors
     */
    public static function handleValidationError(array $errors, string $context = 'Validation failed'): array
    {
        return self::createErrorResponse(
            $context,
            400,
            ['validation_errors' => $errors]
        );
    }
    
    /**
     * Handle file upload errors
     */
    public static function handleFileUploadError(array $errors, string $context = 'File upload failed'): array
    {
        return self::createErrorResponse(
            $context,
            400,
            ['upload_errors' => $errors]
        );
    }
    
    /**
     * Handle authentication errors
     */
    public static function handleAuthError(string $message = 'Authentication required'): array
    {
        return self::createErrorResponse(
            $message,
            401
        );
    }
    
    /**
     * Handle authorization errors
     */
    public static function handleAuthorizationError(string $message = 'Access denied'): array
    {
        return self::createErrorResponse(
            $message,
            403
        );
    }
    
    /**
     * Handle rate limiting errors
     */
    public static function handleRateLimitError(string $message = 'Rate limit exceeded'): array
    {
        return self::createErrorResponse(
            $message,
            429
        );
    }
    
    /**
     * Get human-readable severity name
     */
    private static function getSeverityName(int $severity): string
    {
        switch ($severity) {
            case E_ERROR:
                return 'Fatal Error';
            case E_WARNING:
                return 'Warning';
            case E_PARSE:
                return 'Parse Error';
            case E_NOTICE:
                return 'Notice';
            case E_CORE_ERROR:
                return 'Core Error';
            case E_CORE_WARNING:
                return 'Core Warning';
            case E_COMPILE_ERROR:
                return 'Compile Error';
            case E_COMPILE_WARNING:
                return 'Compile Warning';
            case E_USER_ERROR:
                return 'User Error';
            case E_USER_WARNING:
                return 'User Warning';
            case E_USER_NOTICE:
                return 'User Notice';
            case E_STRICT:
                return 'Strict Standards';
            case E_RECOVERABLE_ERROR:
                return 'Recoverable Error';
            case E_DEPRECATED:
                return 'Deprecated';
            case E_USER_DEPRECATED:
                return 'User Deprecated';
            default:
                return 'Unknown Error';
        }
    }
    
    /**
     * Display debug error information
     */
    private static function displayDebugError(array $errorData): void
    {
        if (php_sapi_name() === 'cli') {
            echo "Error: " . $errorData['message'] . "\n";
            echo "File: " . $errorData['file'] . " Line: " . $errorData['line'] . "\n";
            if (isset($errorData['trace'])) {
                echo "Trace:\n" . $errorData['trace'] . "\n";
            }
        } else {
            header('Content-Type: application/json', true, 500);
            echo json_encode([
                'success' => false,
                'error' => $errorData
            ], JSON_PRETTY_PRINT);
        }
        exit;
    }
    
    /**
     * Display production error page
     */
    private static function displayProductionError(): void
    {
        if (php_sapi_name() === 'cli') {
            echo "An error occurred. Please check the logs for details.\n";
        } else {
            header('Content-Type: application/json', true, 500);
            echo json_encode([
                'success' => false,
                'error' => [
                    'message' => 'An internal server error occurred. Please try again later.',
                    'code' => 500,
                    'timestamp' => date('c')
                ]
            ]);
        }
        exit;
    }
}