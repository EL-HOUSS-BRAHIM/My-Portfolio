<?php
/**
 * Response Utility Class
 * 
 * Provides standardized JSON responses for API endpoints.
 */

namespace Portfolio\Utils;

use Portfolio\Config\Config;
use Exception;

class Response {
    /**
     * Returns true if app.debug is enabled in config or env
     */
    private static function isDebug() {
        // Try config singleton if available
        if (class_exists('Portfolio\\Config\\Config')) {
            try {
                $config = Config::getInstance();
                return $config->get('app.debug');
            } catch (Exception $e) {}
        }
        // Fallback to env
        return (isset($_ENV['APP_DEBUG']) && filter_var($_ENV['APP_DEBUG'], FILTER_VALIDATE_BOOLEAN));
    }

    public static function json($data, $statusCode = 200) {
        if (!headers_sent()) {
            http_response_code($statusCode);
            header('Content-Type: application/json');
        }
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function success($message = 'Success', $data = null) {
        $response = [
            'success' => true,
            'message' => $message
        ];
        if ($data !== null) {
            $response['data'] = $data;
        }
        self::json($response);
    }

    public static function error($message = 'An error occurred', $errors = null, $statusCode = 400, $debugInfo = null) {
        $response = [
            'success' => false,
            'message' => $message
        ];
        if ($errors !== null) {
            $response['errors'] = $errors;
        }
        if (self::isDebug() && $debugInfo) {
            $response['debug'] = $debugInfo;
        }
        self::json($response, $statusCode);
    }

    public static function validationError($errors, $message = 'Validation failed') {
        self::error($message, $errors, 422);
    }

    public static function notFound($message = 'Resource not found') {
        self::error($message, null, 404);
    }

    public static function serverError($message = 'Internal server error', $debugInfo = null) {
        self::error($message, null, 500, $debugInfo);
    }

    public static function unauthorized($message = 'Unauthorized') {
        self::error($message, null, 401);
    }

    public static function forbidden($message = 'Forbidden') {
        self::error($message, null, 403);
    }
}
