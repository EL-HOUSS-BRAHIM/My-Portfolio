<?php
/**
 * Rate Limiting Utility Class
 * 
 * Implements simple rate limiting to prevent abuse.
 */

class RateLimit {
    private $config;
    private $storage = [];
    
    public function __construct($config) {
        $this->config = $config;
    }
    
    public function checkLimit($identifier, $maxRequests = null, $timeWindow = null) {
        $maxRequests = $maxRequests ?? $this->config->get('rate_limit.requests');
        $timeWindow = $timeWindow ?? $this->config->get('rate_limit.window');
        
        $currentTime = time();
        $windowStart = $currentTime - $timeWindow;
        
        // Clean old entries
        $this->cleanOldEntries($identifier, $windowStart);
        
        // Count current requests
        $currentRequests = $this->countRequests($identifier, $windowStart);
        
        if ($currentRequests >= $maxRequests) {
            return false;
        }
        
        // Record this request
        $this->recordRequest($identifier, $currentTime);
        
        return true;
    }
    
    private function cleanOldEntries($identifier, $windowStart) {
        if (!isset($this->storage[$identifier])) {
            $this->storage[$identifier] = [];
        }
        
        $this->storage[$identifier] = array_filter(
            $this->storage[$identifier],
            function($timestamp) use ($windowStart) {
                return $timestamp > $windowStart;
            }
        );
    }
    
    private function countRequests($identifier, $windowStart) {
        if (!isset($this->storage[$identifier])) {
            return 0;
        }
        
        return count($this->storage[$identifier]);
    }
    
    private function recordRequest($identifier, $timestamp) {
        if (!isset($this->storage[$identifier])) {
            $this->storage[$identifier] = [];
        }
        
        $this->storage[$identifier][] = $timestamp;
    }
    
    public function getRemainingRequests($identifier, $maxRequests = null, $timeWindow = null) {
        $maxRequests = $maxRequests ?? $this->config->get('rate_limit.requests');
        $timeWindow = $timeWindow ?? $this->config->get('rate_limit.window');
        
        $currentTime = time();
        $windowStart = $currentTime - $timeWindow;
        
        $this->cleanOldEntries($identifier, $windowStart);
        $currentRequests = $this->countRequests($identifier, $windowStart);
        
        return max(0, $maxRequests - $currentRequests);
    }
}
