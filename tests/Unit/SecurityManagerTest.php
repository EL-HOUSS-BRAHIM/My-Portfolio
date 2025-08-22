<?php

namespace Tests\Unit\Security;

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../../src/security/SecurityManager.php';

class SecurityManagerTest extends TestCase
{
    private $securityManager;
    
    protected function setUp(): void
    {
        $this->securityManager = new \SecurityManager();
        
        // Start session for CSRF testing
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }
    
    protected function tearDown(): void
    {
        // Clean up session
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_destroy();
        }
    }
    
    public function testGenerateCSRFToken(): void
    {
        $token = $this->securityManager->generateCSRFToken();
        
        $this->assertNotEmpty($token);
        $this->assertEquals(64, strlen($token)); // Default token length
        $this->assertTrue(ctype_alnum($token));
        $this->assertEquals($token, $_SESSION['csrf_token']);
    }
    
    public function testValidateCSRFTokenValid(): void
    {
        $token = $this->securityManager->generateCSRFToken();
        
        $this->assertTrue($this->securityManager->validateCSRFToken($token));
    }
    
    public function testValidateCSRFTokenInvalid(): void
    {
        $this->securityManager->generateCSRFToken();
        
        $this->assertFalse($this->securityManager->validateCSRFToken('invalid_token'));
        $this->assertFalse($this->securityManager->validateCSRFToken(''));
        $this->assertFalse($this->securityManager->validateCSRFToken(null));
    }
    
    public function testSanitizeInputBasic(): void
    {
        $input = '<script>alert("xss")</script>Hello World';
        $expected = '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;Hello World';
        
        $result = $this->securityManager->sanitizeInput($input);
        
        $this->assertEquals($expected, $result);
    }
    
    public function testSanitizeInputWithWhitespace(): void
    {
        $input = "  \t\n  Hello World  \t\n  ";
        $expected = 'Hello World';
        
        $result = $this->securityManager->sanitizeInput($input);
        
        $this->assertEquals($expected, $result);
    }
    
    public function testValidateEmailValid(): void
    {
        $validEmails = [
            'test@example.com',
            'user.name@domain.co.uk',
            'user+tag@example.org',
            'user123@sub.domain.com'
        ];
        
        foreach ($validEmails as $email) {
            $this->assertTrue(
                $this->securityManager->validateEmail($email),
                "Email '$email' should be valid"
            );
        }
    }
    
    public function testValidateEmailInvalid(): void
    {
        $invalidEmails = [
            'invalid-email',
            '@domain.com',
            'user@',
            'user..name@domain.com',
            'user@domain',
            ''
        ];
        
        foreach ($invalidEmails as $email) {
            $this->assertFalse(
                $this->securityManager->validateEmail($email),
                "Email '$email' should be invalid"
            );
        }
    }
    
    public function testCheckRateLimitWithinLimit(): void
    {
        $identifier = 'test_user_1';
        
        // First request should be allowed
        $this->assertTrue($this->securityManager->checkRateLimit($identifier, 5, 60));
        
        // Second request should also be allowed
        $this->assertTrue($this->securityManager->checkRateLimit($identifier, 5, 60));
    }
    
    public function testCheckRateLimitExceedsLimit(): void
    {
        $identifier = 'test_user_2';
        $limit = 2;
        $window = 60;
        
        // First two requests should be allowed
        $this->assertTrue($this->securityManager->checkRateLimit($identifier, $limit, $window));
        $this->assertTrue($this->securityManager->checkRateLimit($identifier, $limit, $window));
        
        // Third request should be blocked
        $this->assertFalse($this->securityManager->checkRateLimit($identifier, $limit, $window));
    }
    
    public function testValidateFileUploadValidFile(): void
    {
        $file = [
            'name' => 'test.jpg',
            'type' => 'image/jpeg',
            'size' => 1024000, // 1MB
            'tmp_name' => '/tmp/test_upload',
            'error' => UPLOAD_ERR_OK
        ];
        
        // Mock file_exists and getimagesize
        $result = $this->securityManager->validateFileUpload($file, ['jpg', 'jpeg', 'png'], 2097152); // 2MB limit
        
        $this->assertTrue($result['valid']);
        $this->assertEmpty($result['errors']);
    }
    
    public function testValidateFileUploadInvalidExtension(): void
    {
        $file = [
            'name' => 'test.exe',
            'type' => 'application/octet-stream',
            'size' => 1024,
            'tmp_name' => '/tmp/test_upload',
            'error' => UPLOAD_ERR_OK
        ];
        
        $result = $this->securityManager->validateFileUpload($file, ['jpg', 'jpeg', 'png'], 2097152);
        
        $this->assertFalse($result['valid']);
        $this->assertContains('File type not allowed', $result['errors']);
    }
    
    public function testValidateFileUploadTooLarge(): void
    {
        $file = [
            'name' => 'test.jpg',
            'type' => 'image/jpeg',
            'size' => 3145728, // 3MB
            'tmp_name' => '/tmp/test_upload',
            'error' => UPLOAD_ERR_OK
        ];
        
        $result = $this->securityManager->validateFileUpload($file, ['jpg', 'jpeg', 'png'], 2097152); // 2MB limit
        
        $this->assertFalse($result['valid']);
        $this->assertContains('File size exceeds limit', $result['errors']);
    }
    
    public function testHashPassword(): void
    {
        $password = 'testpassword123';
        $hash = $this->securityManager->hashPassword($password);
        
        $this->assertNotEmpty($hash);
        $this->assertNotEquals($password, $hash);
        $this->assertTrue(password_verify($password, $hash));
    }
    
    public function testVerifyPasswordCorrect(): void
    {
        $password = 'testpassword123';
        $hash = $this->securityManager->hashPassword($password);
        
        $this->assertTrue($this->securityManager->verifyPassword($password, $hash));
    }
    
    public function testVerifyPasswordIncorrect(): void
    {
        $password = 'testpassword123';
        $wrongPassword = 'wrongpassword';
        $hash = $this->securityManager->hashPassword($password);
        
        $this->assertFalse($this->securityManager->verifyPassword($wrongPassword, $hash));
    }
    
    public function testLogSecurityEvent(): void
    {
        $event = 'test_event';
        $details = ['user' => 'testuser', 'action' => 'login'];
        
        // This test verifies that the method doesn't throw an exception
        $this->expectNotToPerformAssertions();
        $this->securityManager->logSecurityEvent($event, $details);
    }
}