<?php

namespace Tests\Unit\Cache;

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../../src/cache/ApplicationCache.php';

class ApplicationCacheTest extends TestCase
{
    private $cache;
    private $testCacheDir;
    
    protected function setUp(): void
    {
        $this->testCacheDir = __DIR__ . '/../../fixtures/cache';
        if (!is_dir($this->testCacheDir)) {
            mkdir($this->testCacheDir, 0755, true);
        }
        
        $this->cache = new \ApplicationCache($this->testCacheDir);
    }
    
    protected function tearDown(): void
    {
        // Clean up test cache files
        if (is_dir($this->testCacheDir)) {
            $files = glob($this->testCacheDir . '/*');
            foreach ($files as $file) {
                if (is_file($file)) {
                    unlink($file);
                }
            }
            rmdir($this->testCacheDir);
        }
    }
    
    public function testSetAndGetCache(): void
    {
        $key = 'test_key';
        $value = ['data' => 'test_value', 'number' => 123];
        $ttl = 3600;
        
        $this->assertTrue($this->cache->set($key, $value, $ttl));
        
        $retrievedValue = $this->cache->get($key);
        $this->assertEquals($value, $retrievedValue);
    }
    
    public function testGetNonExistentKey(): void
    {
        $result = $this->cache->get('non_existent_key');
        $this->assertNull($result);
    }
    
    public function testGetWithDefaultValue(): void
    {
        $defaultValue = 'default_result';
        $result = $this->cache->get('non_existent_key', $defaultValue);
        $this->assertEquals($defaultValue, $result);
    }
    
    public function testCacheExpiration(): void
    {
        $key = 'expiring_key';
        $value = 'expiring_value';
        $ttl = 1; // 1 second
        
        $this->cache->set($key, $value, $ttl);
        
        // Should exist immediately
        $this->assertEquals($value, $this->cache->get($key));
        
        // Wait for expiration
        sleep(2);
        
        // Should be null after expiration
        $this->assertNull($this->cache->get($key));
    }
    
    public function testHasMethod(): void
    {
        $key = 'test_has_key';
        $value = 'test_value';
        
        $this->assertFalse($this->cache->has($key));
        
        $this->cache->set($key, $value);
        
        $this->assertTrue($this->cache->has($key));
    }
    
    public function testDeleteMethod(): void
    {
        $key = 'test_delete_key';
        $value = 'test_value';
        
        $this->cache->set($key, $value);
        $this->assertTrue($this->cache->has($key));
        
        $this->assertTrue($this->cache->delete($key));
        $this->assertFalse($this->cache->has($key));
    }
    
    public function testClearMethod(): void
    {
        $keys = ['key1', 'key2', 'key3'];
        $value = 'test_value';
        
        foreach ($keys as $key) {
            $this->cache->set($key, $value);
        }
        
        foreach ($keys as $key) {
            $this->assertTrue($this->cache->has($key));
        }
        
        $this->assertTrue($this->cache->clear());
        
        foreach ($keys as $key) {
            $this->assertFalse($this->cache->has($key));
        }
    }
    
    public function testRememberMethod(): void
    {
        $key = 'remember_key';
        $expectedValue = 'computed_value';
        $ttl = 3600;
        
        $callCount = 0;
        $callback = function() use ($expectedValue, &$callCount) {
            $callCount++;
            return $expectedValue;
        };
        
        // First call should execute callback
        $result1 = $this->cache->remember($key, $ttl, $callback);
        $this->assertEquals($expectedValue, $result1);
        $this->assertEquals(1, $callCount);
        
        // Second call should return cached value without executing callback
        $result2 = $this->cache->remember($key, $ttl, $callback);
        $this->assertEquals($expectedValue, $result2);
        $this->assertEquals(1, $callCount); // Callback not called again
    }
    
    public function testGetConfigurationCache(): void
    {
        $configData = ['setting1' => 'value1', 'setting2' => 'value2'];
        
        // Mock configuration callback
        $callback = function() use ($configData) {
            return $configData;
        };
        
        $result = $this->cache->getConfiguration($callback);
        $this->assertEquals($configData, $result);
        
        // Second call should return cached result
        $result2 = $this->cache->getConfiguration($callback);
        $this->assertEquals($configData, $result2);
    }
    
    public function testGetDatabaseCache(): void
    {
        $query = 'SELECT * FROM users WHERE active = 1';
        $params = ['active' => 1];
        $resultData = [
            ['id' => 1, 'name' => 'User 1'],
            ['id' => 2, 'name' => 'User 2']
        ];
        
        $callback = function() use ($resultData) {
            return $resultData;
        };
        
        $result = $this->cache->getDatabase($query, $params, 3600, $callback);
        $this->assertEquals($resultData, $result);
    }
    
    public function testGetTestimonialsCache(): void
    {
        $testimonialsData = [
            ['id' => 1, 'name' => 'John', 'message' => 'Great work!'],
            ['id' => 2, 'name' => 'Jane', 'message' => 'Excellent service!']
        ];
        
        $callback = function() use ($testimonialsData) {
            return $testimonialsData;
        };
        
        $result = $this->cache->getTestimonials($callback);
        $this->assertEquals($testimonialsData, $result);
    }
    
    public function testGetAPICache(): void
    {
        $endpoint = 'users/list';
        $params = ['page' => 1, 'limit' => 10];
        $apiData = ['users' => [], 'total' => 0];
        
        $callback = function() use ($apiData) {
            return $apiData;
        };
        
        $result = $this->cache->getAPI($endpoint, $params, 1800, $callback);
        $this->assertEquals($apiData, $result);
    }
    
    public function testGetStatistics(): void
    {
        // Set some cache entries
        $this->cache->set('key1', 'value1');
        $this->cache->set('key2', 'value2');
        $this->cache->set('key3', 'value3');
        
        $stats = $this->cache->getStatistics();
        
        $this->assertIsArray($stats);
        $this->assertArrayHasKey('total_entries', $stats);
        $this->assertArrayHasKey('cache_size', $stats);
        $this->assertArrayHasKey('hit_rate', $stats);
        $this->assertEquals(3, $stats['total_entries']);
    }
    
    public function testCleanupExpiredEntries(): void
    {
        // Set entries with short TTL
        $this->cache->set('short_lived_1', 'value1', 1);
        $this->cache->set('short_lived_2', 'value2', 1);
        $this->cache->set('long_lived', 'value3', 3600);
        
        // Wait for expiration
        sleep(2);
        
        $cleaned = $this->cache->cleanup();
        $this->assertGreaterThanOrEqual(2, $cleaned);
        
        // Long-lived entry should still exist
        $this->assertTrue($this->cache->has('long_lived'));
        $this->assertFalse($this->cache->has('short_lived_1'));
        $this->assertFalse($this->cache->has('short_lived_2'));
    }
}