<?php
/**
 * Google reCAPTCHA Utility Class
 * 
 * Handles server-side verification of reCAPTCHA responses
 */

namespace Portfolio\Utils;

class Captcha {
    private string $secretKey;
    private string $verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
    
    /**
     * Initialize with secret key
     */
    public function __construct(string $secretKey) {
        $this->secretKey = $secretKey;
    }
    
    /**
     * Verify reCAPTCHA response
     * 
     * @param string $response The reCAPTCHA response token
     * @param string|null $remoteIp Optional remote IP address
     * @return bool True if verification succeeds, false otherwise
     */
    public function verify(string $response, ?string $remoteIp = null): bool {
        if (empty($response)) {
            error_log('CAPTCHA: Empty response provided');
            return false;
        }
        
        if (empty($this->secretKey)) {
            error_log('CAPTCHA: Secret key not configured');
            return false;
        }
        
        // Prepare POST data
        $postData = [
            'secret' => $this->secretKey,
            'response' => $response
        ];
        
        if ($remoteIp) {
            $postData['remoteip'] = $remoteIp;
        }
        
        // Make request to Google's verify endpoint
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->verifyUrl);
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
            return false;
        }
        
        if ($httpCode !== 200) {
            error_log('CAPTCHA: HTTP error: ' . $httpCode);
            return false;
        }
        
        $result = json_decode($response, true);
        
        if (!$result || !is_array($result)) {
            error_log('CAPTCHA: Invalid JSON response');
            return false;
        }
        
        $success = $result['success'] ?? false;
        
        if (!$success) {
            $errorCodes = $result['error-codes'] ?? [];
            error_log('CAPTCHA: Verification failed: ' . implode(', ', $errorCodes));
        }
        
        return $success;
    }
    
}