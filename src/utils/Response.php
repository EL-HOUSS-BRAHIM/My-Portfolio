<?php
/**
 * Response Utility Class
 * 
 * Provides standardized JSON responses for API endpoints.
 */

class Response {
    
    public static function json($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
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
    
    public static function error($message = 'An error occurred', $errors = null, $statusCode = 400) {
        $response = [
            'success' => false,
            'message' => $message
        ];
        
        if ($errors !== null) {
            $response['errors'] = $errors;
        }
        
        self::json($response, $statusCode);
    }
    
    public static function validationError($errors, $message = 'Validation failed') {
        self::error($message, $errors, 422);
    }
    
    public static function notFound($message = 'Resource not found') {
        self::error($message, null, 404);
    }
    
    public static function serverError($message = 'Internal server error') {
        self::error($message, null, 500);
    }
    
    public static function unauthorized($message = 'Unauthorized') {
        self::error($message, null, 401);
    }
    
    public static function forbidden($message = 'Forbidden') {
        self::error($message, null, 403);
    }
}
