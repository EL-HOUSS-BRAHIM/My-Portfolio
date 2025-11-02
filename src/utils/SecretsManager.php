<?php
/**
 * AWS Secrets Manager Integration
 * 
 * Securely retrieves secrets from AWS Secrets Manager
 */

namespace Portfolio\Utils;

use Aws\SecretsManager\SecretsManagerClient;
use Aws\Exception\AwsException;

class SecretsManager {
    private $client;
    private $cache = [];
    private $cacheDir;
    private $cacheTTL = 300; // 5 minutes cache
    
    /**
     * Initialize Secrets Manager client
     */
    public function __construct(string $region = 'eu-west-3') {
        $this->cacheDir = dirname(__DIR__, 2) . '/storage/cache/secrets';
        
        // Create cache directory if it doesn't exist
        if (!is_dir($this->cacheDir)) {
            mkdir($this->cacheDir, 0700, true);
        }
        
        try {
            $this->client = new SecretsManagerClient([
                'version' => 'latest',
                'region' => $region,
                // AWS SDK will automatically use credentials from:
                // 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
                // 2. ~/.aws/credentials file
                // 3. IAM role (if running on EC2/ECS)
            ]);
        } catch (\Exception $e) {
            error_log("SecretsManager: Failed to initialize AWS client: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Get secret from AWS Secrets Manager with caching
     * 
     * READ ONLY - This class only retrieves secrets, never creates/updates/deletes
     * For secret management, use AWS CLI or Console with proper admin credentials
     * 
     * @param string $secretName The name/ARN of the secret
     * @param bool $forceRefresh Force refresh from AWS (bypass cache)
     * @return array|null Decoded secret data or null on failure
     */
    public function getSecret(string $secretName, bool $forceRefresh = false): ?array {
        // Check memory cache first
        if (!$forceRefresh && isset($this->cache[$secretName])) {
            return $this->cache[$secretName];
        }
        
        // Check file cache
        if (!$forceRefresh) {
            $cached = $this->getCachedSecret($secretName);
            if ($cached !== null) {
                $this->cache[$secretName] = $cached;
                return $cached;
            }
        }
        
        try {
            $result = $this->client->getSecretValue([
                'SecretId' => $secretName,
            ]);
            
            // Parse secret string
            if (isset($result['SecretString'])) {
                $secret = json_decode($result['SecretString'], true);
                
                if (json_last_error() === JSON_ERROR_NONE) {
                    // Cache the secret
                    $this->cacheSecret($secretName, $secret);
                    $this->cache[$secretName] = $secret;
                    return $secret;
                } else {
                    error_log("SecretsManager: Failed to decode secret JSON for $secretName");
                    return null;
                }
            }
            
            // Handle binary secrets (less common)
            if (isset($result['SecretBinary'])) {
                error_log("SecretsManager: Binary secrets not yet implemented");
                return null;
            }
            
            error_log("SecretsManager: No secret data found for $secretName");
            return null;
            
        } catch (AwsException $e) {
            error_log("SecretsManager: AWS error retrieving secret $secretName: " . $e->getAwsErrorMessage());
            return null;
        } catch (\Exception $e) {
            error_log("SecretsManager: Error retrieving secret $secretName: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Get cached secret from file
     */
    private function getCachedSecret(string $secretName): ?array {
        $cacheFile = $this->getCacheFilePath($secretName);
        
        if (!file_exists($cacheFile)) {
            return null;
        }
        
        // Check if cache is expired
        if (time() - filemtime($cacheFile) > $this->cacheTTL) {
            unlink($cacheFile);
            return null;
        }
        
        $content = file_get_contents($cacheFile);
        if ($content === false) {
            return null;
        }
        
        $data = json_decode($content, true);
        return json_last_error() === JSON_ERROR_NONE ? $data : null;
    }
    
    /**
     * Cache secret to file
     */
    private function cacheSecret(string $secretName, array $secret): void {
        $cacheFile = $this->getCacheFilePath($secretName);
        $content = json_encode($secret);
        
        // Write with restricted permissions
        file_put_contents($cacheFile, $content);
        chmod($cacheFile, 0600);
    }
    
    /**
     * Get cache file path for secret
     */
    private function getCacheFilePath(string $secretName): string {
        // Create a safe filename from secret name
        $safeFilename = preg_replace('/[^a-zA-Z0-9_-]/', '_', $secretName);
        return $this->cacheDir . '/' . $safeFilename . '.cache';
    }
    
    /**
     * Clear all cached secrets
     */
    public function clearCache(): void {
        $this->cache = [];
        
        if (is_dir($this->cacheDir)) {
            $files = glob($this->cacheDir . '/*.cache');
            foreach ($files as $file) {
                if (is_file($file)) {
                    unlink($file);
                }
            }
        }
    }
    
    /**
     * Set cache TTL
     */
    public function setCacheTTL(int $seconds): void {
        $this->cacheTTL = max(0, $seconds);
    }
}
