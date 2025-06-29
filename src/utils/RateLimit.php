<?php

/**
 * Rate Limiting Utility Class
 *
 * WARNING: This implementation is in-memory and only works per PHP process/request.
 * It is NOT persistent and will not work for distributed or production environments.
 * For production, use Redis, Memcached, or a database-backed rate limiter.
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

        $debug = method_exists($this->config, 'get') ? $this->config->get('app.debug') : false;
        if ($currentRequests >= $maxRequests) {
            if ($debug) error_log("[RateLimit] Limit reached for $identifier: $currentRequests/$maxRequests in $timeWindow seconds");
            return false;
        }

        // Record this request
        $this->recordRequest($identifier, $currentTime);
        if ($debug) error_log("[RateLimit] Request allowed for $identifier: $currentRequests/$maxRequests");

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

        $debug = method_exists($this->config, 'get') ? $this->config->get('app.debug') : false;
        if ($debug) error_log("[RateLimit] Remaining requests for $identifier: " . max(0, $maxRequests - $currentRequests));

        return max(0, $maxRequests - $currentRequests);
    }
}
