<?php
/**
 * Validation Utility Class
 * 
 * Provides common validation methods for form inputs
 * and file uploads.
 */

class Validator {
    
    public static function email($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    // Accepts 0, '0', and non-string values as required
    public static function required($value) {
        if (is_string($value)) {
            return strlen(trim($value)) > 0;
        }
        return !empty($value) || $value === 0 || $value === '0';
    }

    public static function minLength($value, $min) {
        return mb_strlen(trim($value)) >= $min;
    }

    public static function maxLength($value, $max) {
        return mb_strlen(trim($value)) <= $max;
    }

    public static function numeric($value) {
        return is_numeric($value) && preg_match('/^\d+(\.\d+)?$/', (string)$value);
    }

    public static function between($value, $min, $max) {
        if (!self::numeric($value)) return false;
        $num = $value + 0;
        return $num >= $min && $num <= $max;
    }

    // Optionally strip tags as well
    public static function sanitizeString($value, $strict = false) {
        $clean = htmlspecialchars(trim($value), ENT_QUOTES, 'UTF-8');
        return $strict ? strip_tags($clean) : $clean;
    }
    
    public static function validateImage($file, $config) {
        $errors = [];
        $debug = (class_exists('Config') && Config::getInstance()->get('app.debug')) || (isset($_ENV['APP_DEBUG']) && filter_var($_ENV['APP_DEBUG'], FILTER_VALIDATE_BOOLEAN));

        // Check if file was uploaded
        if (!isset($file['tmp_name']) || empty($file['tmp_name'])) {
            $errors[] = 'No file uploaded';
            if ($debug) error_log('[Validator] No file uploaded');
            return $errors;
        }

        // Check if it's actually an image
        $imageInfo = getimagesize($file['tmp_name']);
        if ($imageInfo === false) {
            $errors[] = 'File is not a valid image';
            if ($debug) error_log('[Validator] Not a valid image');
        }

        // Check file size
        $maxSize = $config->get('security.upload_max_size');
        if ($file['size'] > $maxSize) {
            $errors[] = 'File size exceeds maximum allowed size (' . self::formatBytes($maxSize) . ')';
            if ($debug) error_log('[Validator] File too large: ' . $file['size']);
        }

        // Check file type (prefer mime from getimagesize if available)
        $allowedTypes = $config->get('security.allowed_image_types');
        $mimeType = $imageInfo['mime'] ?? $file['type'];
        if (!in_array($mimeType, $allowedTypes)) {
            $errors[] = 'Invalid file type. Allowed types: ' . implode(', ', $allowedTypes);
            if ($debug) error_log('[Validator] Invalid file type: ' . $mimeType);
        }

        // Check for upload errors
        if ($file['error'] !== UPLOAD_ERR_OK) {
            $errors[] = 'File upload error: ' . self::getUploadError($file['error']);
            if ($debug) error_log('[Validator] Upload error: ' . $file['error']);
        }

        return $errors;
    }
    
    public static function validateTestimonial($data) {
        $errors = [];
        $debug = (class_exists('Config') && Config::getInstance()->get('app.debug')) || (isset($_ENV['APP_DEBUG']) && filter_var($_ENV['APP_DEBUG'], FILTER_VALIDATE_BOOLEAN));

        if (!self::required($data['name'])) {
            $errors['name'] = 'Name is required';
            if ($debug) error_log('[Validator] Testimonial: Name required');
        } elseif (!self::maxLength($data['name'], 100)) {
            $errors['name'] = 'Name must be less than 100 characters';
            if ($debug) error_log('[Validator] Testimonial: Name too long');
        }

        if (!self::required($data['testimonial'])) {
            $errors['testimonial'] = 'Testimonial text is required';
            if ($debug) error_log('[Validator] Testimonial: Text required');
        } elseif (!self::maxLength($data['testimonial'], 1000)) {
            $errors['testimonial'] = 'Testimonial must be less than 1000 characters';
            if ($debug) error_log('[Validator] Testimonial: Text too long');
        }

        if (!self::required($data['rating'])) {
            $errors['rating'] = 'Rating is required';
            if ($debug) error_log('[Validator] Testimonial: Rating required');
        } elseif (!self::numeric($data['rating']) || !self::between($data['rating'], 1, 5)) {
            $errors['rating'] = 'Rating must be between 1 and 5';
            if ($debug) error_log('[Validator] Testimonial: Rating invalid');
        }

        return $errors;
    }
    
    public static function validateContact($data) {
        $errors = [];
        $debug = (class_exists('Config') && Config::getInstance()->get('app.debug')) || (isset($_ENV['APP_DEBUG']) && filter_var($_ENV['APP_DEBUG'], FILTER_VALIDATE_BOOLEAN));

        if (!self::required($data['name'])) {
            $errors['name'] = 'Name is required';
            if ($debug) error_log('[Validator] Contact: Name required');
        } elseif (!self::maxLength($data['name'], 100)) {
            $errors['name'] = 'Name must be less than 100 characters';
            if ($debug) error_log('[Validator] Contact: Name too long');
        }

        if (!self::required($data['email'])) {
            $errors['email'] = 'Email is required';
            if ($debug) error_log('[Validator] Contact: Email required');
        } elseif (!self::email($data['email'])) {
            $errors['email'] = 'Please enter a valid email address';
            if ($debug) error_log('[Validator] Contact: Email invalid');
        }

        if (!self::required($data['message'])) {
            $errors['message'] = 'Message is required';
            if ($debug) error_log('[Validator] Contact: Message required');
        } elseif (!self::minLength($data['message'], 10)) {
            $errors['message'] = 'Message must be at least 10 characters long';
            if ($debug) error_log('[Validator] Contact: Message too short');
        } elseif (!self::maxLength($data['message'], 2000)) {
            $errors['message'] = 'Message must be less than 2000 characters';
            if ($debug) error_log('[Validator] Contact: Message too long');
        }

        return $errors;
    }
    
    private static function formatBytes($size, $precision = 2) {
        $units = ['B', 'KB', 'MB', 'GB'];
        
        for ($i = 0; $size > 1024 && $i < count($units) - 1; $i++) {
            $size /= 1024;
        }
        
        return round($size, $precision) . ' ' . $units[$i];
    }
    
    private static function getUploadError($error) {
        switch ($error) {
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                return 'File is too large';
            case UPLOAD_ERR_PARTIAL:
                return 'File was only partially uploaded';
            case UPLOAD_ERR_NO_FILE:
                return 'No file was uploaded';
            case UPLOAD_ERR_NO_TMP_DIR:
                return 'Missing temporary folder';
            case UPLOAD_ERR_CANT_WRITE:
                return 'Failed to write file to disk';
            case UPLOAD_ERR_EXTENSION:
                return 'File upload stopped by extension';
            default:
                return 'Unknown upload error';
        }
    }
}
