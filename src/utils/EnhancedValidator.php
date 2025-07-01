<?php
/**
 * Enhanced Validation Utility
 * 
 * Provides comprehensive validation with custom rules,
 * sanitization, and advanced security features.
 */

class EnhancedValidator {
    private static $customRules = [];
    private static $messages = [
        'required' => 'The :field field is required.',
        'email' => 'The :field must be a valid email address.',
        'min_length' => 'The :field must be at least :min characters.',
        'max_length' => 'The :field must not exceed :max characters.',
        'numeric' => 'The :field must be a number.',
        'integer' => 'The :field must be an integer.',
        'between' => 'The :field must be between :min and :max.',
        'url' => 'The :field must be a valid URL.',
        'regex' => 'The :field format is invalid.',
        'unique' => 'The :field has already been taken.',
        'confirmed' => 'The :field confirmation does not match.',
        'image' => 'The :field must be a valid image.',
        'file_size' => 'The :field file size must not exceed :max.',
        'file_type' => 'The :field must be a file of type: :types.',
        'honeypot' => 'Bot detected.',
        'recaptcha' => 'Please complete the CAPTCHA verification.',
        'rate_limit' => 'Too many attempts. Please try again later.',
        'profanity' => 'The :field contains inappropriate content.',
        'xss' => 'The :field contains potentially dangerous content.'
    ];
    
    /**
     * Validate data against rules
     */
    public static function validate(array $data, array $rules, array $customMessages = []) {
        $errors = [];
        $messages = array_merge(self::$messages, $customMessages);
        
        foreach ($rules as $field => $fieldRules) {
            $fieldRules = is_string($fieldRules) ? explode('|', $fieldRules) : $fieldRules;
            $value = $data[$field] ?? null;
            
            foreach ($fieldRules as $rule) {
                $error = self::validateField($field, $value, $rule, $data, $messages);
                if ($error) {
                    $errors[$field] = $error;
                    break; // Stop on first error per field
                }
            }
        }
        
        return $errors;
    }
    
    /**
     * Validate single field
     */
    private static function validateField($field, $value, $rule, $allData, $messages) {
        $ruleParts = explode(':', $rule, 2);
        $ruleName = $ruleParts[0];
        $ruleParams = isset($ruleParts[1]) ? explode(',', $ruleParts[1]) : [];
        
        $isValid = true;
        $message = $messages[$ruleName] ?? "The {$field} field is invalid.";
        
        switch ($ruleName) {
            case 'required':
                $isValid = self::required($value);
                break;
                
            case 'email':
                $isValid = !self::required($value) || self::email($value);
                break;
                
            case 'min_length':
                $min = $ruleParams[0] ?? 0;
                $isValid = !self::required($value) || self::minLength($value, $min);
                $message = str_replace(':min', $min, $message);
                break;
                
            case 'max_length':
                $max = $ruleParams[0] ?? 255;
                $isValid = !self::required($value) || self::maxLength($value, $max);
                $message = str_replace(':max', $max, $message);
                break;
                
            case 'numeric':
                $isValid = !self::required($value) || self::numeric($value);
                break;
                
            case 'integer':
                $isValid = !self::required($value) || self::integer($value);
                break;
                
            case 'between':
                $min = $ruleParams[0] ?? 0;
                $max = $ruleParams[1] ?? 100;
                $isValid = !self::required($value) || self::between($value, $min, $max);
                $message = str_replace([':min', ':max'], [$min, $max], $message);
                break;
                
            case 'url':
                $isValid = !self::required($value) || self::url($value);
                break;
                
            case 'regex':
                $pattern = $ruleParams[0] ?? '';
                $isValid = !self::required($value) || self::regex($value, $pattern);
                break;
                
            case 'confirmed':
                $confirmField = $ruleParams[0] ?? $field . '_confirmation';
                $isValid = $value === ($allData[$confirmField] ?? null);
                break;
                
            case 'unique':
                $table = $ruleParams[0] ?? '';
                $column = $ruleParams[1] ?? $field;
                $isValid = self::unique($value, $table, $column);
                break;
                
            case 'image':
                $isValid = self::isValidImage($value);
                break;
                
            case 'file_size':
                $maxSize = $ruleParams[0] ?? 5242880; // 5MB default
                $isValid = self::validateFileSize($value, $maxSize);
                $message = str_replace(':max', self::formatBytes($maxSize), $message);
                break;
                
            case 'file_type':
                $allowedTypes = $ruleParams;
                $isValid = self::validateFileType($value, $allowedTypes);
                $message = str_replace(':types', implode(', ', $allowedTypes), $message);
                break;
                
            case 'honeypot':
                $isValid = empty($value); // Honeypot should be empty
                break;
                
            case 'recaptcha':
                $isValid = self::validateRecaptcha($value);
                break;
                
            case 'no_profanity':
                $isValid = !self::required($value) || !self::containsProfanity($value);
                break;
                
            case 'no_xss':
                $isValid = !self::required($value) || !self::containsXSS($value);
                break;
                
            case 'phone':
                $isValid = !self::required($value) || self::phone($value);
                break;
                
            case 'date':
                $format = $ruleParams[0] ?? 'Y-m-d';
                $isValid = !self::required($value) || self::date($value, $format);
                break;
                
            case 'json':
                $isValid = !self::required($value) || self::json($value);
                break;
                
            case 'alpha':
                $isValid = !self::required($value) || self::alpha($value);
                break;
                
            case 'alpha_numeric':
                $isValid = !self::required($value) || self::alphaNumeric($value);
                break;
                
            case 'alpha_dash':
                $isValid = !self::required($value) || self::alphaDash($value);
                break;
                
            default:
                // Check for custom rules
                if (isset(self::$customRules[$ruleName])) {
                    $isValid = call_user_func(self::$customRules[$ruleName], $value, $ruleParams, $allData);
                }
                break;
        }
        
        if (!$isValid) {
            return str_replace(':field', ucfirst(str_replace('_', ' ', $field)), $message);
        }
        
        return null;
    }
    
    /**
     * Basic validation methods
     */
    public static function required($value) {
        if (is_string($value)) {
            return strlen(trim($value)) > 0;
        }
        if (is_array($value)) {
            return count($value) > 0;
        }
        return !empty($value) || $value === 0 || $value === '0';
    }
    
    public static function email($email) {
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return false;
        }
        
        // Additional checks for suspicious patterns
        if (preg_match('/[<>"\']/', $email)) {
            return false;
        }
        
        // Check for temporary email domains (basic list)
        $tempDomains = ['10minutemail.com', 'tempmail.org', 'guerrillamail.com'];
        $domain = substr(strrchr($email, '@'), 1);
        
        return !in_array(strtolower($domain), $tempDomains);
    }
    
    public static function minLength($value, $min) {
        return mb_strlen(trim($value)) >= $min;
    }
    
    public static function maxLength($value, $max) {
        return mb_strlen(trim($value)) <= $max;
    }
    
    public static function numeric($value) {
        return is_numeric($value);
    }
    
    public static function integer($value) {
        return filter_var($value, FILTER_VALIDATE_INT) !== false;
    }
    
    public static function between($value, $min, $max) {
        if (!self::numeric($value)) return false;
        $num = floatval($value);
        return $num >= $min && $num <= $max;
    }
    
    public static function url($url) {
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            return false;
        }
        
        // Additional security checks
        $parsed = parse_url($url);
        
        // Block suspicious schemes
        $allowedSchemes = ['http', 'https', 'ftp', 'ftps'];
        if (!in_array(strtolower($parsed['scheme'] ?? ''), $allowedSchemes)) {
            return false;
        }
        
        // Block private/local IP addresses
        if (isset($parsed['host'])) {
            $ip = gethostbyname($parsed['host']);
            if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
                return false;
            }
        }
        
        return true;
    }
    
    public static function regex($value, $pattern) {
        return preg_match($pattern, $value) === 1;
    }
    
    public static function phone($phone) {
        // Basic international phone validation
        $cleaned = preg_replace('/[^0-9+]/', '', $phone);
        return preg_match('/^\+?[1-9]\d{1,14}$/', $cleaned);
    }
    
    public static function date($date, $format = 'Y-m-d') {
        $d = DateTime::createFromFormat($format, $date);
        return $d && $d->format($format) === $date;
    }
    
    public static function json($value) {
        json_decode($value);
        return json_last_error() === JSON_ERROR_NONE;
    }
    
    public static function alpha($value) {
        return preg_match('/^[a-zA-Z\s]+$/', $value);
    }
    
    public static function alphaNumeric($value) {
        return preg_match('/^[a-zA-Z0-9\s]+$/', $value);
    }
    
    public static function alphaDash($value) {
        return preg_match('/^[a-zA-Z0-9\s\-_]+$/', $value);
    }
    
    /**
     * File validation methods
     */
    public static function isValidImage($file) {
        if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
            return false;
        }
        
        $imageInfo = getimagesize($file['tmp_name']);
        if ($imageInfo === false) {
            return false;
        }
        
        // Check for malicious content in image
        $content = file_get_contents($file['tmp_name'], false, null, 0, 1024);
        if (preg_match('/<\?php|<script|javascript:/i', $content)) {
            return false;
        }
        
        return true;
    }
    
    public static function validateFileSize($file, $maxSize) {
        if (!isset($file['size'])) {
            return false;
        }
        
        return $file['size'] <= $maxSize;
    }
    
    public static function validateFileType($file, $allowedTypes) {
        if (!isset($file['type'])) {
            return false;
        }
        
        return in_array($file['type'], $allowedTypes);
    }
    
    /**
     * Security validation methods
     */
    public static function containsXSS($value) {
        $patterns = [
            '/<script[^>]*>.*?<\/script>/is',
            '/on\w+\s*=/i',
            '/javascript:/i',
            '/vbscript:/i',
            '/<iframe/i',
            '/<object/i',
            '/<embed/i',
            '/<link/i',
            '/<meta/i'
        ];
        
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $value)) {
                return true;
            }
        }
        
        return false;
    }
    
    public static function containsProfanity($value) {
        // Basic profanity filter - should be expanded based on requirements
        $profanityWords = [
            'damn', 'hell', 'shit', 'fuck', 'bitch', 'ass', 'bastard'
            // Add more words as needed
        ];
        
        $cleanValue = preg_replace('/[^a-zA-Z0-9\s]/', '', strtolower($value));
        
        foreach ($profanityWords as $word) {
            if (strpos($cleanValue, $word) !== false) {
                return true;
            }
        }
        
        return false;
    }
    
    public static function validateRecaptcha($response) {
        if (empty($response)) {
            return false;
        }
        
        $secretKey = $_ENV['RECAPTCHA_SECRET_KEY'] ?? '';
        if (empty($secretKey)) {
            return true; // Skip validation if not configured
        }
        
        $verifyURL = 'https://www.google.com/recaptcha/api/siteverify';
        $data = [
            'secret' => $secretKey,
            'response' => $response,
            'remoteip' => $_SERVER['REMOTE_ADDR'] ?? ''
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $verifyURL);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            return false;
        }
        
        $result = json_decode($response, true);
        return isset($result['success']) && $result['success'] === true;
    }
    
    public static function unique($value, $table, $column) {
        if (empty($value) || empty($table) || empty($column)) {
            return true;
        }
        
        try {
            $db = Database::getInstance();
            $sql = "SELECT COUNT(*) as count FROM {$table} WHERE {$column} = ?";
            $result = $db->fetchOne($sql, [$value]);
            
            return ($result['count'] ?? 0) === 0;
        } catch (Exception $e) {
            error_log("Unique validation error: " . $e->getMessage());
            return true; // Allow if validation fails
        }
    }
    
    /**
     * Sanitization methods
     */
    public static function sanitizeString($value, $strict = false) {
        $clean = htmlspecialchars(trim($value), ENT_QUOTES, 'UTF-8');
        
        if ($strict) {
            // Remove all HTML tags and encode special characters
            $clean = strip_tags($clean);
            $clean = preg_replace('/[^\p{L}\p{N}\s\-_.@]/u', '', $clean);
        }
        
        return $clean;
    }
    
    public static function sanitizeEmail($email) {
        return filter_var(trim($email), FILTER_SANITIZE_EMAIL);
    }
    
    public static function sanitizeUrl($url) {
        return filter_var(trim($url), FILTER_SANITIZE_URL);
    }
    
    public static function sanitizeFilename($filename) {
        // Remove path traversal and dangerous characters
        $filename = basename($filename);
        $filename = preg_replace('/[^a-zA-Z0-9\-_\.]/', '', $filename);
        
        // Prevent executable extensions
        $dangerousExtensions = ['php', 'js', 'html', 'htm', 'exe', 'bat', 'sh'];
        $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        
        if (in_array($ext, $dangerousExtensions)) {
            $filename .= '.txt';
        }
        
        return $filename;
    }
    
    /**
     * Utility methods
     */
    public static function addCustomRule($name, callable $callback) {
        self::$customRules[$name] = $callback;
    }
    
    public static function setMessage($rule, $message) {
        self::$messages[$rule] = $message;
    }
    
    public static function formatBytes($size, $precision = 2) {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        for ($i = 0; $size > 1024 && $i < count($units) - 1; $i++) {
            $size /= 1024;
        }
        
        return round($size, $precision) . ' ' . $units[$i];
    }
    
    /**
     * Validate contact form data
     */
    public static function validateContact($data) {
        $rules = [
            'name' => 'required|min_length:2|max_length:100|alpha|no_xss',
            'email' => 'required|email|max_length:255',
            'message' => 'required|min_length:10|max_length:2000|no_xss|no_profanity',
            'phone' => 'phone', // Optional
            'honeypot' => 'honeypot' // Bot detection
        ];
        
        if (isset($data['g-recaptcha-response'])) {
            $rules['g-recaptcha-response'] = 'recaptcha';
        }
        
        return self::validate($data, $rules);
    }
    
    /**
     * Validate testimonial data
     */
    public static function validateTestimonial($data) {
        $rules = [
            'name' => 'required|min_length:2|max_length:100|alpha|no_xss',
            'email' => 'email|max_length:255', // Optional
            'rating' => 'required|integer|between:1,5',
            'testimonial' => 'required|min_length:10|max_length:1000|no_xss|no_profanity',
            'company' => 'max_length:100|alpha_dash', // Optional
            'image' => 'image|file_size:2097152|file_type:image/jpeg,image/png,image/gif,image/webp', // Optional, 2MB max
            'honeypot' => 'honeypot'
        ];
        
        return self::validate($data, $rules);
    }
    
    /**
     * Validate admin login data
     */
    public static function validateAdminLogin($data) {
        $rules = [
            'username' => 'required|min_length:3|max_length:50|alpha_numeric',
            'password' => 'required|min_length:8|max_length:255',
            'csrf_token' => 'required'
        ];
        
        return self::validate($data, $rules);
    }
}
