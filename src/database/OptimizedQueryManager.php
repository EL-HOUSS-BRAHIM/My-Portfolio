<?php

/**
 * Optimized Database Query Manager
 * 
 * Provides optimized database operations with caching,
 * prepared statements, and performance monitoring.
 */

require_once __DIR__ . '/../cache/ApplicationCache.php';
require_once __DIR__ . '/../config/DatabaseManager.php';

use Portfolio\Cache\ApplicationCache;

class OptimizedQueryManager
{
    private DatabaseManager $db;
    private ApplicationCache $cache;
    private array $queryStats = [];
    private bool $enableQueryCache;
    
    public function __construct(bool $enableQueryCache = true)
    {
        $this->db = DatabaseManager::getInstance();
        $this->cache = new ApplicationCache();
        $this->enableQueryCache = $enableQueryCache;
    }
    
    /**
     * Execute optimized query with caching
     */
    public function query(string $sql, array $params = [], int $cacheTtl = 3600, string $cacheType = 'database'): array
    {
        $startTime = microtime(true);
        
        // Generate cache key
        $cacheKey = $this->generateCacheKey($sql, $params);
        
        // Try cache first if enabled
        if ($this->enableQueryCache) {
            $cached = $this->cache->get($cacheKey, $cacheType);
            if ($cached !== null) {
                $this->recordQueryStats('cache_hit', $sql, microtime(true) - $startTime);
                return $cached;
            }
        }
        
        // Execute query
        try {
            $pdo = $this->db->getConnection();
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $executionTime = microtime(true) - $startTime;
            $this->recordQueryStats('executed', $sql, $executionTime);
            
            // Cache result if enabled
            if ($this->enableQueryCache && $cacheTtl > 0) {
                $this->cache->set($cacheKey, $result, $cacheTtl, $cacheType);
            }
            
            return $result;
            
        } catch (PDOException $e) {
            $this->recordQueryStats('error', $sql, microtime(true) - $startTime, $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Execute non-SELECT query (INSERT, UPDATE, DELETE)
     */
    public function execute(string $sql, array $params = []): int
    {
        $startTime = microtime(true);
        
        try {
            $pdo = $this->db->getConnection();
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $rowCount = $stmt->rowCount();
            
            $executionTime = microtime(true) - $startTime;
            $this->recordQueryStats('executed', $sql, $executionTime);
            
            // Invalidate related cache
            $this->invalidateRelatedCache($sql);
            
            return $rowCount;
            
        } catch (PDOException $e) {
            $this->recordQueryStats('error', $sql, microtime(true) - $startTime, $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Get optimized testimonials with pagination
     */
    public function getTestimonials(string $status = null, int $limit = 10, int $offset = 0): array
    {
        $cacheKey = "testimonials_" . ($status ?? 'all') . "_{$limit}_{$offset}";
        
        return $this->cache->remember($cacheKey, function() use ($status, $limit, $offset) {
            if ($status) {
                $sql = "
                    SELECT id, name, email, message, status, image_path, created_at, updated_at
                    FROM testimonials 
                    WHERE status = :status
                    ORDER BY created_at DESC 
                    LIMIT :limit OFFSET :offset
                ";
                $params = ['status' => $status, 'limit' => $limit, 'offset' => $offset];
            } else {
                $sql = "
                    SELECT id, name, email, message, status, image_path, created_at, updated_at
                    FROM testimonials 
                    ORDER BY created_at DESC 
                    LIMIT :limit OFFSET :offset
                ";
                $params = ['limit' => $limit, 'offset' => $offset];
            }
            
            $pdo = $this->db->getConnection();
            $stmt = $pdo->prepare($sql);
            
            // Bind parameters with correct types
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            if ($status) {
                $stmt->bindValue(':status', $status, PDO::PARAM_STR);
            }
            
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        }, 1800, 'testimonials'); // 30 minutes cache
    }
    
    /**
     * Get approved testimonials (optimized view)
     */
    public function getApprovedTestimonials(int $limit = 10): array
    {
        return $this->cache->remember("approved_testimonials_{$limit}", function() use ($limit) {
            $sql = "
                SELECT id, name, message, image_path, created_at
                FROM v_approved_testimonials 
                LIMIT :limit
            ";
            
            $pdo = $this->db->getConnection();
            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        }, 3600, 'testimonials'); // 1 hour cache
    }
    
    /**
     * Get testimonial statistics (optimized view)
     */
    public function getTestimonialStats(): array
    {
        return $this->cache->remember('testimonial_statistics', function() {
            $sql = "SELECT * FROM v_testimonial_stats";
            $pdo = $this->db->getConnection();
            $stmt = $pdo->query($sql);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return $result ?: [
                'total_count' => 0,
                'approved_count' => 0,
                'pending_count' => 0,
                'rejected_count' => 0,
                'recent_count' => 0,
                'latest_submission' => null
            ];
        }, 600, 'testimonials'); // 10 minutes cache
    }
    
    /**
     * Get recent activity
     */
    public function getRecentActivity(int $limit = 20): array
    {
        return $this->cache->remember("recent_activity_{$limit}", function() use ($limit) {
            $sql = "
                SELECT activity_type, item_id, item_name, status, created_at
                FROM v_recent_activity 
                LIMIT :limit
            ";
            
            $pdo = $this->db->getConnection();
            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        }, 300, 'database'); // 5 minutes cache
    }
    
    /**
     * Insert testimonial with optimized prepared statement
     */
    public function insertTestimonial(array $data): int
    {
        $sql = "
            INSERT INTO testimonials (name, email, message, image_path, status, created_at)
            VALUES (:name, :email, :message, :image_path, :status, NOW())
        ";
        
        $params = [
            'name' => $data['name'],
            'email' => $data['email'],
            'message' => $data['message'],
            'image_path' => $data['image_path'] ?? null,
            'status' => $data['status'] ?? 'pending'
        ];
        
        $this->execute($sql, $params);
        
        // Get last insert ID
        $pdo = $this->db->getConnection();
        return (int) $pdo->lastInsertId();
    }
    
    /**
     * Update testimonial with optimized query
     */
    public function updateTestimonial(int $id, array $data): bool
    {
        $fields = [];
        $params = ['id' => $id];
        
        foreach (['name', 'email', 'message', 'image_path', 'status'] as $field) {
            if (isset($data[$field])) {
                $fields[] = "{$field} = :{$field}";
                $params[$field] = $data[$field];
            }
        }
        
        if (empty($fields)) {
            return false;
        }
        
        $sql = "UPDATE testimonials SET " . implode(', ', $fields) . ", updated_at = NOW() WHERE id = :id";
        
        return $this->execute($sql, $params) > 0;
    }
    
    /**
     * Delete testimonial
     */
    public function deleteTestimonial(int $id): bool
    {
        $sql = "DELETE FROM testimonials WHERE id = :id";
        return $this->execute($sql, ['id' => $id]) > 0;
    }
    
    /**
     * Bulk operations for better performance
     */
    public function bulkUpdateTestimonialStatus(array $ids, string $status): int
    {
        if (empty($ids)) {
            return 0;
        }
        
        $placeholders = str_repeat('?,', count($ids) - 1) . '?';
        $sql = "UPDATE testimonials SET status = ?, updated_at = NOW() WHERE id IN ({$placeholders})";
        
        $params = array_merge([$status], $ids);
        return $this->execute($sql, $params);
    }
    
    /**
     * Clean expired cache entries
     */
    public function cleanExpiredCache(): int
    {
        $sql = "CALL CleanExpiredCache()";
        $result = $this->query($sql, [], 0); // Don't cache this
        return $result[0]['deleted_entries'] ?? 0;
    }
    
    /**
     * Generate cache key for query
     */
    private function generateCacheKey(string $sql, array $params): string
    {
        return 'query_' . md5($sql . serialize($params));
    }
    
    /**
     * Record query statistics
     */
    private function recordQueryStats(string $type, string $sql, float $executionTime, string $error = null): void
    {
        $this->queryStats[] = [
            'type' => $type,
            'sql' => substr($sql, 0, 100) . (strlen($sql) > 100 ? '...' : ''),
            'execution_time' => $executionTime,
            'timestamp' => time(),
            'error' => $error
        ];
        
        // Log slow queries (> 1 second)
        if ($executionTime > 1.0) {
            error_log("[SLOW QUERY] {$executionTime}s: " . substr($sql, 0, 200));
        }
    }
    
    /**
     * Invalidate related cache when data changes
     */
    private function invalidateRelatedCache(string $sql): void
    {
        $sql = strtoupper($sql);
        
        if (strpos($sql, 'TESTIMONIALS') !== false) {
            $this->cache->clearByType('testimonials');
        }
        
        if (strpos($sql, 'CONTACT_SUBMISSIONS') !== false) {
            $this->cache->clearByType('database');
        }
    }
    
    /**
     * Get query statistics
     */
    public function getQueryStats(): array
    {
        return [
            'queries' => $this->queryStats,
            'total_queries' => count($this->queryStats),
            'cache_hits' => count(array_filter($this->queryStats, fn($s) => $s['type'] === 'cache_hit')),
            'executed_queries' => count(array_filter($this->queryStats, fn($s) => $s['type'] === 'executed')),
            'errors' => count(array_filter($this->queryStats, fn($s) => $s['type'] === 'error')),
            'average_time' => count($this->queryStats) > 0 ? 
                array_sum(array_column($this->queryStats, 'execution_time')) / count($this->queryStats) : 0
        ];
    }
    
    /**
     * Optimize database tables
     */
    public function optimizeTables(): array
    {
        $tables = ['testimonials', 'contact_submissions', 'admin_users', 'query_cache'];
        $results = [];
        
        foreach ($tables as $table) {
            try {
                $sql = "OPTIMIZE TABLE {$table}";
                $result = $this->query($sql, [], 0); // Don't cache
                $results[$table] = $result[0] ?? ['status' => 'unknown'];
            } catch (Exception $e) {
                $results[$table] = ['status' => 'error', 'message' => $e->getMessage()];
            }
        }
        
        return $results;
    }
    
    /**
     * Analyze query performance
     */
    public function analyzeQuery(string $sql, array $params = []): array
    {
        try {
            $pdo = $this->db->getConnection();
            
            // Explain query
            $explainSql = "EXPLAIN " . $sql;
            $stmt = $pdo->prepare($explainSql);
            $stmt->execute($params);
            $explain = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get query execution time
            $startTime = microtime(true);
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $executionTime = microtime(true) - $startTime;
            
            return [
                'explain' => $explain,
                'execution_time' => $executionTime,
                'recommendations' => $this->generateQueryRecommendations($explain)
            ];
            
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
    
    /**
     * Generate query optimization recommendations
     */
    private function generateQueryRecommendations(array $explain): array
    {
        $recommendations = [];
        
        foreach ($explain as $row) {
            if ($row['type'] === 'ALL') {
                $recommendations[] = "Full table scan detected on table '{$row['table']}' - consider adding an index";
            }
            
            if (isset($row['rows']) && $row['rows'] > 1000) {
                $recommendations[] = "High row count ({$row['rows']}) examined - consider optimizing WHERE clause";
            }
            
            if ($row['key'] === null) {
                $recommendations[] = "No index used for table '{$row['table']}' - consider adding appropriate indexes";
            }
        }
        
        return $recommendations;
    }
}

// Create global instance
$optimizedQueryManager = new OptimizedQueryManager();