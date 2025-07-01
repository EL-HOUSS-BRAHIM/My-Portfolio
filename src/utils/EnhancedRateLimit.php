<?php
/**
 * Enhanced Rate Limiting Utility
 * 
 * Provides persistent rate limiting with multiple storage backends
 * including file, Redis, and database storage.
 */

require_once __DIR__ . '/../config/ConfigManager.php';

class EnhancedRateLimit {
    private $config;
    private $storage;
    private $logger;
    
    public function __construct($config = null) {
        $this->config = $config ?: ConfigManager::getInstance();
        $this->logger = new RateLimitLogger();
        $this->initializeStorage();
    }
    
    /**
     * Initialize storage backend
     */
    private function initializeStorage() {
        $driver = $this->config->get('rate_limit.storage', 'file');
        
        switch ($driver) {
            case 'redis':
                $this->storage = new RedisRateLimitStorage($this->config);
                break;
            case 'database':
                $this->storage = new DatabaseRateLimitStorage($this->config);
                break;
            case 'file':
            default:
                $this->storage = new FileRateLimitStorage($this->config);
                break;
        }
    }
    
    /**
     * Check if request is within rate limit
     */
    public function checkLimit($identifier, $maxRequests = null, $timeWindow = null, $options = []) {
        if (!$this->config->get('rate_limit.enabled', true)) {
            return true;
        }
        
        $maxRequests = $maxRequests ?? $this->config->get('rate_limit.requests', 100);
        $timeWindow = $timeWindow ?? $this->config->get('rate_limit.window', 3600);
        
        $currentTime = time();
        $windowStart = $currentTime - $timeWindow;
        
        // Clean old entries
        $this->storage->cleanup($identifier, $windowStart);
        
        // Get current request count
        $currentRequests = $this->storage->getCount($identifier, $windowStart, $currentTime);
        
        // Check if limit exceeded
        if ($currentRequests >= $maxRequests) {
            $this->logger->warning("Rate limit exceeded", [
                'identifier' => $identifier,
                'current_requests' => $currentRequests,
                'max_requests' => $maxRequests,
                'time_window' => $timeWindow
            ]);
            
            $this->handleLimitExceeded($identifier, $options);
            return false;
        }
        
        // Record this request
        $this->storage->recordRequest($identifier, $currentTime);
        
        $this->logger->debug("Rate limit check passed", [
            'identifier' => $identifier,
            'current_requests' => $currentRequests + 1,
            'max_requests' => $maxRequests
        ]);
        
        return true;
    }
    
    /**
     * Get remaining requests for identifier
     */
    public function getRemainingRequests($identifier, $maxRequests = null, $timeWindow = null) {
        $maxRequests = $maxRequests ?? $this->config->get('rate_limit.requests', 100);
        $timeWindow = $timeWindow ?? $this->config->get('rate_limit.window', 3600);
        
        $currentTime = time();
        $windowStart = $currentTime - $timeWindow;
        
        $currentRequests = $this->storage->getCount($identifier, $windowStart, $currentTime);
        return max(0, $maxRequests - $currentRequests);
    }
    
    /**
     * Get time until rate limit resets
     */
    public function getTimeUntilReset($identifier, $timeWindow = null) {
        $timeWindow = $timeWindow ?? $this->config->get('rate_limit.window', 3600);
        $oldestRequest = $this->storage->getOldestRequest($identifier);
        
        if (!$oldestRequest) {
            return 0;
        }
        
        $resetTime = $oldestRequest + $timeWindow;
        return max(0, $resetTime - time());
    }
    
    /**
     * Handle rate limit exceeded
     */
    private function handleLimitExceeded($identifier, $options = []) {
        // Increment violation counter
        $this->storage->recordViolation($identifier);
        
        // Apply progressive penalties
        if (!empty($options['progressive_penalty'])) {
            $violations = $this->storage->getViolationCount($identifier);
            $this->applyProgressivePenalty($identifier, $violations);
        }
        
        // Send alert if enabled
        if (!empty($options['alert_on_limit'])) {
            $this->sendRateLimitAlert($identifier);
        }
    }
    
    /**
     * Apply progressive penalty for repeat violations
     */
    private function applyProgressivePenalty($identifier, $violations) {
        $penaltyTime = min(3600, 60 * pow(2, $violations - 1)); // Exponential backoff, max 1 hour
        $this->storage->applyPenalty($identifier, time() + $penaltyTime);
        
        $this->logger->warning("Progressive penalty applied", [
            'identifier' => $identifier,
            'violations' => $violations,
            'penalty_time' => $penaltyTime
        ]);
    }
    
    /**
     * Send rate limit alert
     */
    private function sendRateLimitAlert($identifier) {
        // This could be extended to send email alerts, webhook notifications, etc.
        $this->logger->critical("Rate limit alert", [
            'identifier' => $identifier,
            'timestamp' => time()
        ]);
    }
    
    /**
     * Check if identifier is currently penalized
     */
    public function isPenalized($identifier) {
        return $this->storage->isPenalized($identifier);
    }
    
    /**
     * Reset rate limit for identifier
     */
    public function reset($identifier) {
        $this->storage->reset($identifier);
        $this->logger->info("Rate limit reset", ['identifier' => $identifier]);
    }
    
    /**
     * Get rate limit statistics
     */
    public function getStatistics($identifier = null) {
        return $this->storage->getStatistics($identifier);
    }
    
    /**
     * Whitelist an identifier (bypass rate limiting)
     */
    public function whitelist($identifier, $duration = null) {
        $this->storage->whitelist($identifier, $duration);
        $this->logger->info("Identifier whitelisted", [
            'identifier' => $identifier,
            'duration' => $duration
        ]);
    }
    
    /**
     * Check if identifier is whitelisted
     */
    public function isWhitelisted($identifier) {
        return $this->storage->isWhitelisted($identifier);
    }
    
    /**
     * Blacklist an identifier (always deny)
     */
    public function blacklist($identifier, $duration = null) {
        $this->storage->blacklist($identifier, $duration);
        $this->logger->warning("Identifier blacklisted", [
            'identifier' => $identifier,
            'duration' => $duration
        ]);
    }
    
    /**
     * Check if identifier is blacklisted
     */
    public function isBlacklisted($identifier) {
        return $this->storage->isBlacklisted($identifier);
    }
}

/**
 * File-based rate limit storage
 */
class FileRateLimitStorage {
    private $config;
    private $storageDir;
    
    public function __construct($config) {
        $this->config = $config;
        $this->storageDir = $config->get('cache.path', 'storage/cache') . '/rate_limits';
        
        if (!is_dir($this->storageDir)) {
            mkdir($this->storageDir, 0755, true);
        }
    }
    
    public function cleanup($identifier, $windowStart) {
        $file = $this->getIdentifierFile($identifier);
        if (!file_exists($file)) return;
        
        $data = json_decode(file_get_contents($file), true) ?: [];
        $data['requests'] = array_filter($data['requests'] ?? [], function($timestamp) use ($windowStart) {
            return $timestamp > $windowStart;
        });
        
        file_put_contents($file, json_encode($data), LOCK_EX);
    }
    
    public function getCount($identifier, $windowStart, $currentTime) {
        $file = $this->getIdentifierFile($identifier);
        if (!file_exists($file)) return 0;
        
        $data = json_decode(file_get_contents($file), true) ?: [];
        $requests = $data['requests'] ?? [];
        
        return count(array_filter($requests, function($timestamp) use ($windowStart) {
            return $timestamp > $windowStart;
        }));
    }
    
    public function recordRequest($identifier, $timestamp) {
        $file = $this->getIdentifierFile($identifier);
        $data = file_exists($file) ? (json_decode(file_get_contents($file), true) ?: []) : [];
        
        $data['requests'][] = $timestamp;
        
        file_put_contents($file, json_encode($data), LOCK_EX);
    }
    
    public function getOldestRequest($identifier) {
        $file = $this->getIdentifierFile($identifier);
        if (!file_exists($file)) return null;
        
        $data = json_decode(file_get_contents($file), true) ?: [];
        $requests = $data['requests'] ?? [];
        
        return empty($requests) ? null : min($requests);
    }
    
    public function recordViolation($identifier) {
        $file = $this->getIdentifierFile($identifier);
        $data = file_exists($file) ? (json_decode(file_get_contents($file), true) ?: []) : [];
        
        $data['violations'] = ($data['violations'] ?? 0) + 1;
        
        file_put_contents($file, json_encode($data), LOCK_EX);
    }
    
    public function getViolationCount($identifier) {
        $file = $this->getIdentifierFile($identifier);
        if (!file_exists($file)) return 0;
        
        $data = json_decode(file_get_contents($file), true) ?: [];
        return $data['violations'] ?? 0;
    }
    
    public function applyPenalty($identifier, $until) {
        $file = $this->getIdentifierFile($identifier);
        $data = file_exists($file) ? (json_decode(file_get_contents($file), true) ?: []) : [];
        
        $data['penalty_until'] = $until;
        
        file_put_contents($file, json_encode($data), LOCK_EX);
    }
    
    public function isPenalized($identifier) {
        $file = $this->getIdentifierFile($identifier);
        if (!file_exists($file)) return false;
        
        $data = json_decode(file_get_contents($file), true) ?: [];
        $penaltyUntil = $data['penalty_until'] ?? 0;
        
        return $penaltyUntil > time();
    }
    
    public function reset($identifier) {
        $file = $this->getIdentifierFile($identifier);
        if (file_exists($file)) {
            unlink($file);
        }
    }
    
    public function getStatistics($identifier = null) {
        if ($identifier) {
            $file = $this->getIdentifierFile($identifier);
            if (!file_exists($file)) return [];
            
            return json_decode(file_get_contents($file), true) ?: [];
        }
        
        // Return global statistics
        $files = glob($this->storageDir . '/*.json');
        $stats = ['total_identifiers' => count($files)];
        
        return $stats;
    }
    
    public function whitelist($identifier, $duration = null) {
        $file = $this->getWhitelistFile();
        $data = file_exists($file) ? (json_decode(file_get_contents($file), true) ?: []) : [];
        
        $data[$identifier] = $duration ? time() + $duration : null;
        
        file_put_contents($file, json_encode($data), LOCK_EX);
    }
    
    public function isWhitelisted($identifier) {
        $file = $this->getWhitelistFile();
        if (!file_exists($file)) return false;
        
        $data = json_decode(file_get_contents($file), true) ?: [];
        
        if (!isset($data[$identifier])) return false;
        
        $expiry = $data[$identifier];
        return $expiry === null || $expiry > time();
    }
    
    public function blacklist($identifier, $duration = null) {
        $file = $this->getBlacklistFile();
        $data = file_exists($file) ? (json_decode(file_get_contents($file), true) ?: []) : [];
        
        $data[$identifier] = $duration ? time() + $duration : null;
        
        file_put_contents($file, json_encode($data), LOCK_EX);
    }
    
    public function isBlacklisted($identifier) {
        $file = $this->getBlacklistFile();
        if (!file_exists($file)) return false;
        
        $data = json_decode(file_get_contents($file), true) ?: [];
        
        if (!isset($data[$identifier])) return false;
        
        $expiry = $data[$identifier];
        return $expiry === null || $expiry > time();
    }
    
    private function getIdentifierFile($identifier) {
        $hash = md5($identifier);
        return $this->storageDir . '/' . $hash . '.json';
    }
    
    private function getWhitelistFile() {
        return $this->storageDir . '/whitelist.json';
    }
    
    private function getBlacklistFile() {
        return $this->storageDir . '/blacklist.json';
    }
}

/**
 * Rate limit logger
 */
class RateLimitLogger {
    private $config;
    
    public function __construct() {
        $this->config = ConfigManager::getInstance();
    }
    
    public function debug($message, $context = []) {
        if ($this->config->get('app.debug')) {
            $this->log('DEBUG', $message, $context);
        }
    }
    
    public function info($message, $context = []) {
        $this->log('INFO', $message, $context);
    }
    
    public function warning($message, $context = []) {
        $this->log('WARNING', $message, $context);
    }
    
    public function critical($message, $context = []) {
        $this->log('CRITICAL', $message, $context);
    }
    
    private function log($level, $message, $context = []) {
        $timestamp = date('Y-m-d H:i:s');
        $contextStr = empty($context) ? '' : ' ' . json_encode($context);
        $logMessage = "[{$timestamp}] [{$level}] [RATE_LIMIT] {$message}{$contextStr}\n";
        
        $logFile = $this->config->get('logging.file', 'storage/logs/rate_limit.log');
        $logDir = dirname($logFile);
        
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        
        file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
    }
}
