<?php
/**
 * Admin Authentication Class
 * 
 * Handles admin user authentication, session management,
 * and security features like rate limiting and account lockout.
 */

class AdminAuth
{
    private $config;
    private $db;
    private $sessionLifetime;
    private $maxLoginAttempts;
    private $lockoutDuration;
    
    public function __construct()
    {
        $this->config = Config::getInstance();
        $this->db = Database::getInstance();
        $this->sessionLifetime = $this->config->get('admin.session_lifetime', 28800); // 8 hours
        $this->maxLoginAttempts = $this->config->get('admin.max_login_attempts', 5);
        $this->lockoutDuration = $this->config->get('admin.lockout_duration', 1800); // 30 minutes
        
        $this->startSession();
    }
    
    /**
     * Start secure session
     */
    private function startSession()
    {
        if (session_status() === PHP_SESSION_NONE) {
            // Configure session security
            ini_set('session.cookie_httponly', 1);
            ini_set('session.cookie_secure', isset($_SERVER['HTTPS']));
            ini_set('session.use_strict_mode', 1);
            ini_set('session.cookie_samesite', 'Strict');
            
            session_start();
        }
    }
    
    /**
     * Attempt to login with username and password
     */
    public function login($username, $password)
    {
        try {
            // Validate input
            if (empty($username) || empty($password)) {
                return [
                    'success' => false,
                    'message' => 'Username and password are required'
                ];
            }
            
            // Check rate limiting
            if (!$this->checkLoginRateLimit($_SERVER['REMOTE_ADDR'])) {
                return [
                    'success' => false,
                    'message' => 'Too many login attempts. Please try again later.'
                ];
            }
            
            // Get user from database
            $user = $this->getUserByUsername($username);
            
            if (!$user) {
                $this->recordFailedLogin($_SERVER['REMOTE_ADDR'], $username);
                return [
                    'success' => false,
                    'message' => 'Invalid username or password'
                ];
            }
            
            // Check if account is locked
            if ($this->isAccountLocked($user['id'])) {
                return [
                    'success' => false,
                    'message' => 'Account is temporarily locked due to too many failed attempts'
                ];
            }
            
            // Verify password
            if (!password_verify($password, $user['password_hash'])) {
                $this->recordFailedLogin($_SERVER['REMOTE_ADDR'], $username, $user['id']);
                return [
                    'success' => false,
                    'message' => 'Invalid username or password'
                ];
            }
            
            // Check if user is active
            if (!$user['is_active']) {
                return [
                    'success' => false,
                    'message' => 'Account is deactivated'
                ];
            }
            
            // Successful login
            $this->createUserSession($user);
            $this->resetLoginAttempts($user['id']);
            $this->updateLastLogin($user['id']);
            
            return [
                'success' => true,
                'message' => 'Login successful',
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'email' => $user['email'],
                    'role' => $user['role'],
                    'first_name' => $user['first_name'],
                    'last_name' => $user['last_name']
                ]
            ];
            
        } catch (Exception $e) {
            error_log("Login error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred during login'
            ];
        }
    }
    
    /**
     * Check if user is currently authenticated
     */
    public function isAuthenticated()
    {
        if (!isset($_SESSION['admin_id']) || !isset($_SESSION['session_id'])) {
            return false;
        }
        
        // Verify session in database
        $sql = "SELECT s.*, u.is_active 
                FROM admin_sessions s 
                JOIN admin_users u ON s.admin_id = u.id 
                WHERE s.id = ? AND s.admin_id = ? AND s.is_active = 1 AND s.expires_at > NOW()";
        
        $session = $this->db->fetchOne($sql, [$_SESSION['session_id'], $_SESSION['admin_id']]);
        
        if (!$session || !$session['is_active']) {
            $this->logout();
            return false;
        }
        
        // Extend session if more than half the lifetime has passed
        $created = strtotime($session['created_at']);
        $halfLife = $this->sessionLifetime / 2;
        
        if (time() - $created > $halfLife) {
            $this->extendSession($_SESSION['session_id']);
        }
        
        return true;
    }
    
    /**
     * Get current authenticated user
     */
    public function getCurrentUser()
    {
        if (!$this->isAuthenticated()) {
            return null;
        }
        
        $sql = "SELECT id, username, email, first_name, last_name, role 
                FROM admin_users 
                WHERE id = ? AND is_active = 1";
        
        return $this->db->fetchOne($sql, [$_SESSION['admin_id']]);
    }
    
    /**
     * Logout current user
     */
    public function logout()
    {
        if (isset($_SESSION['session_id'])) {
            // Deactivate session in database
            $sql = "UPDATE admin_sessions SET is_active = 0 WHERE id = ?";
            $this->db->execute($sql, [$_SESSION['session_id']]);
        }
        
        // Clear session data
        session_unset();
        session_destroy();
        
        return true;
    }
    
    /**
     * Get user by username
     */
    private function getUserByUsername($username)
    {
        $sql = "SELECT * FROM admin_users WHERE username = ?";
        return $this->db->fetchOne($sql, [$username]);
    }
    
    /**
     * Create user session
     */
    private function createUserSession($user)
    {
        $sessionId = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', time() + $this->sessionLifetime);
        
        $sql = "INSERT INTO admin_sessions (id, admin_id, ip_address, user_agent, expires_at) 
                VALUES (?, ?, ?, ?, ?)";
        
        $this->db->execute($sql, [
            $sessionId,
            $user['id'],
            $_SERVER['REMOTE_ADDR'],
            $_SERVER['HTTP_USER_AGENT'] ?? '',
            $expiresAt
        ]);
        
        $_SESSION['admin_id'] = $user['id'];
        $_SESSION['session_id'] = $sessionId;
        $_SESSION['username'] = $user['username'];
        $_SESSION['role'] = $user['role'];
    }
    
    /**
     * Extend session expiration
     */
    private function extendSession($sessionId)
    {
        $expiresAt = date('Y-m-d H:i:s', time() + $this->sessionLifetime);
        $sql = "UPDATE admin_sessions SET expires_at = ? WHERE id = ?";
        $this->db->execute($sql, [$expiresAt, $sessionId]);
    }
    
    /**
     * Check login rate limiting
     */
    private function checkLoginRateLimit($ipAddress)
    {
        $rateLimit = new RateLimit($this->config);
        return $rateLimit->checkLimit($ipAddress, 5, 900); // 5 attempts per 15 minutes
    }
    
    /**
     * Record failed login attempt
     */
    private function recordFailedLogin($ipAddress, $username, $userId = null)
    {
        // Log the failed attempt
        error_log("Failed login attempt for username: $username from IP: $ipAddress");
        
        if ($userId) {
            // Increment login attempts for the user
            $sql = "UPDATE admin_users SET login_attempts = login_attempts + 1 WHERE id = ?";
            $this->db->execute($sql, [$userId]);
            
            // Check if we need to lock the account
            $user = $this->db->fetchOne("SELECT login_attempts FROM admin_users WHERE id = ?", [$userId]);
            
            if ($user['login_attempts'] >= $this->maxLoginAttempts) {
                $lockUntil = date('Y-m-d H:i:s', time() + $this->lockoutDuration);
                $sql = "UPDATE admin_users SET locked_until = ? WHERE id = ?";
                $this->db->execute($sql, [$lockUntil, $userId]);
            }
        }
    }
    
    /**
     * Check if account is locked
     */
    private function isAccountLocked($userId)
    {
        $sql = "SELECT locked_until FROM admin_users WHERE id = ?";
        $user = $this->db->fetchOne($sql, [$userId]);
        
        if ($user['locked_until'] && strtotime($user['locked_until']) > time()) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Reset login attempts after successful login
     */
    private function resetLoginAttempts($userId)
    {
        $sql = "UPDATE admin_users SET login_attempts = 0, locked_until = NULL WHERE id = ?";
        $this->db->execute($sql, [$userId]);
    }
    
    /**
     * Update last login timestamp
     */
    private function updateLastLogin($userId)
    {
        $sql = "UPDATE admin_users SET last_login = NOW() WHERE id = ?";
        $this->db->execute($sql, [$userId]);
    }
    
    /**
     * Check if user has required role
     */
    public function hasRole($requiredRole)
    {
        $user = $this->getCurrentUser();
        if (!$user) {
            return false;
        }
        
        $roleHierarchy = ['admin' => 2, 'moderator' => 1];
        $userRoleLevel = $roleHierarchy[$user['role']] ?? 0;
        $requiredRoleLevel = $roleHierarchy[$requiredRole] ?? 0;
        
        return $userRoleLevel >= $requiredRoleLevel;
    }
    
    /**
     * Generate CSRF token
     */
    public function generateCSRFToken()
    {
        if (!isset($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }
    
    /**
     * Verify CSRF token
     */
    public function verifyCSRFToken($token)
    {
        return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
    }
}
