<?php
/**
 * Google reCAPTCHA Utility Class
 * 
 * Handles server-side verification of reCAPTCHA responses
 */

namespace Portfolio\Utils;

class Captcha {
    private static $secretKey;
    private static $verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
    
    /**
     * Initialize with secret key
     */
    public static function init($secretKey) {
        self::$secretKey = $secretKey;
    }
    
    /**
     * Verify reCAPTCHA response
     * 
     * @param string $response The reCAPTCHA response token
     * @param string $remoteIp Optional remote IP address
     * @return array Verification result with success status and error codes
     */
    public static function verify($response, $remoteIp = null) {
        if (empty($response)) {
            return [
                'success' => false,
                'error-codes' => ['missing-input-response'],
                'message' => 'reCAPTCHA response is required'
            ];
        }
        
        if (empty(self::$secretKey)) {
            error_log('CAPTCHA: Secret key not configured');
            return [
                'success' => false,
                'error-codes' => ['missing-input-secret'],
                'message' => 'reCAPTCHA configuration error'
            ];
        }
        
        // Prepare POST data
        $postData = [
            'secret' => self::$secretKey,
            'response' => $response
        ];
        
        if ($remoteIp) {
            $postData['remoteip'] = $remoteIp;
        }
        
        // Make request to Google's verify endpoint
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, self::$verifyUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Portfolio-Contact-Form/1.0');
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            error_log('CAPTCHA: cURL error: ' . $error);
            return [
                'success' => false,
                'error-codes' => ['network-error'],
                'message' => 'Network error during CAPTCHA verification'
            ];
        }
        
        if ($httpCode !== 200) {
            error_log('CAPTCHA: HTTP error: ' . $httpCode);
            return [
                'success' => false,
                'error-codes' => ['http-error'],
                'message' => 'HTTP error during CAPTCHA verification'
            ];
        }
        
        $result = json_decode($response, true);
        
        if (!$result) {
            error_log('CAPTCHA: Invalid JSON response');
            return [
                'success' => false,
                'error-codes' => ['invalid-json'],
                'message' => 'Invalid response from CAPTCHA service'
            ];
        }
        
        // Add user-friendly error messages
        if (!$result['success']) {
            $message = self::getErrorMessage($result['error-codes'] ?? []);
            $result['message'] = $message;
        }
        
        return $result;
    }
    
    /**
     * Get user-friendly error message based on error codes
     */
    private static function getErrorMessage($errorCodes) {
        $messages = [
            'missing-input-secret' => 'CAPTCHA configuration error',
            'invalid-input-secret' => 'CAPTCHA configuration error',
            'missing-input-response' => 'Please complete the CAPTCHA verification',
            'invalid-input-response' => 'CAPTCHA verification failed. Please try again',
            'bad-request' => 'Invalid CAPTCHA request',
            'timeout-or-duplicate' => 'CAPTCHA verification expired. Please try again'
        ];
        
        foreach ($errorCodes as $code) {
            if (isset($messages[$code])) {
                return $messages[$code];
            }
        }
        
        return 'CAPTCHA verification failed. Please try again';
    }
    
    /**
     * Validate reCAPTCHA response and throw exception on failure
     */
    public static function validateOrFail($response, $remoteIp = null) {
        $result = self::verify($response, $remoteIp);
        
        if (!$result['success']) {
            $message = $result['message'] ?? 'CAPTCHA verification failed';
            throw new \Exception($message);
        }
        
        return true;
    }
}