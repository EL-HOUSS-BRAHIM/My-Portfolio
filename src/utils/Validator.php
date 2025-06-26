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
    
    public static function required($value) {
        return !empty(trim($value));
    }
    
    public static function minLength($value, $min) {
        return strlen(trim($value)) >= $min;
    }
    
    public static function maxLength($value, $max) {
        return strlen(trim($value)) <= $max;
    }
    
    public static function numeric($value) {
        return is_numeric($value);
    }
    
    public static function between($value, $min, $max) {
        return $value >= $min && $value <= $max;
    }
    
    public static function sanitizeString($value) {
        return htmlspecialchars(trim($value), ENT_QUOTES, 'UTF-8');
    }
    
    public static function validateImage($file, $config) {
        $errors = [];
        
        // Check if file was uploaded
        if (!isset($file['tmp_name']) || empty($file['tmp_name'])) {
            $errors[] = 'No file uploaded';
            return $errors;
        }
        
        // Check if it's actually an image
        $imageInfo = getimagesize($file['tmp_name']);
        if ($imageInfo === false) {
            $errors[] = 'File is not a valid image';
        }
        
        // Check file size
        $maxSize = $config->get('security.upload_max_size');
        if ($file['size'] > $maxSize) {
            $errors[] = 'File size exceeds maximum allowed size (' . self::formatBytes($maxSize) . ')';
        }
        
        // Check file type
        $allowedTypes = $config->get('security.allowed_image_types');
        if (!in_array($file['type'], $allowedTypes)) {
            $errors[] = 'Invalid file type. Allowed types: ' . implode(', ', $allowedTypes);
        }
        
        // Check for upload errors
        if ($file['error'] !== UPLOAD_ERR_OK) {
            $errors[] = 'File upload error: ' . self::getUploadError($file['error']);
        }
        
        return $errors;
    }
    
    public static function validateTestimonial($data) {
        $errors = [];
        
        if (!self::required($data['name'])) {
            $errors['name'] = 'Name is required';
        } elseif (!self::maxLength($data['name'], 100)) {
            $errors['name'] = 'Name must be less than 100 characters';
        }
        
        if (!self::required($data['testimonial'])) {
            $errors['testimonial'] = 'Testimonial text is required';
        } elseif (!self::maxLength($data['testimonial'], 1000)) {
            $errors['testimonial'] = 'Testimonial must be less than 1000 characters';
        }
        
        if (!self::required($data['rating'])) {
            $errors['rating'] = 'Rating is required';
        } elseif (!self::numeric($data['rating']) || !self::between($data['rating'], 1, 5)) {
            $errors['rating'] = 'Rating must be between 1 and 5';
        }
        
        return $errors;
    }
    
    public static function validateContact($data) {
        $errors = [];
        
        if (!self::required($data['name'])) {
            $errors['name'] = 'Name is required';
        } elseif (!self::maxLength($data['name'], 100)) {
            $errors['name'] = 'Name must be less than 100 characters';
        }
        
        if (!self::required($data['email'])) {
            $errors['email'] = 'Email is required';
        } elseif (!self::email($data['email'])) {
            $errors['email'] = 'Please enter a valid email address';
        }
        
        if (!self::required($data['message'])) {
            $errors['message'] = 'Message is required';
        } elseif (!self::minLength($data['message'], 10)) {
            $errors['message'] = 'Message must be at least 10 characters long';
        } elseif (!self::maxLength($data['message'], 2000)) {
            $errors['message'] = 'Message must be less than 2000 characters';
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
