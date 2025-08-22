<?php

/**
 * Cached Testimonials Manager
 * 
 * Handles testimonials data with application-level caching
 * to improve performance and reduce database queries.
 */

require_once __DIR__ . '/../cache/ApplicationCache.php';
require_once __DIR__ . '/../config/DatabaseManager.php';

use Portfolio\Cache\ApplicationCache;

class CachedTestimonialsManager
{
    private ApplicationCache $cache;
    private DatabaseManager $db;
    
    public function __construct()
    {
        $this->cache = new ApplicationCache();
        $this->db = DatabaseManager::getInstance();
    }
    
    /**
     * Get all testimonials with caching
     */
    public function getAllTestimonials(): array
    {
        return $this->cache->remember(
            'all_testimonials',
            function() {
                return $this->fetchTestimonialsFromDatabase();
            },
            null,
            'testimonials'
        );
    }
    
    /**
     * Get approved testimonials with caching
     */
    public function getApprovedTestimonials(): array
    {
        return $this->cache->remember(
            'approved_testimonials',
            function() {
                return $this->fetchApprovedTestimonialsFromDatabase();
            },
            null,
            'testimonials'
        );
    }
    
    /**
     * Get testimonials by status with caching
     */
    public function getTestimonialsByStatus(string $status): array
    {
        return $this->cache->remember(
            "testimonials_status_{$status}",
            function() use ($status) {
                return $this->fetchTestimonialsByStatusFromDatabase($status);
            },
            null,
            'testimonials'
        );
    }
    
    /**
     * Get testimonial stats with caching
     */
    public function getTestimonialStats(): array
    {
        return $this->cache->remember(
            'testimonial_stats',
            function() {
                return $this->calculateTestimonialStats();
            },
            600, // 10 minutes
            'testimonials'
        );
    }
    
    /**
     * Add new testimonial and clear cache
     */
    public function addTestimonial(array $data): bool
    {
        $result = $this->insertTestimonialToDatabase($data);
        
        if ($result) {
            $this->clearTestimonialsCache();
        }
        
        return $result;
    }
    
    /**
     * Update testimonial and clear cache
     */
    public function updateTestimonial(int $id, array $data): bool
    {
        $result = $this->updateTestimonialInDatabase($id, $data);
        
        if ($result) {
            $this->clearTestimonialsCache();
        }
        
        return $result;
    }
    
    /**
     * Delete testimonial and clear cache
     */
    public function deleteTestimonial(int $id): bool
    {
        $result = $this->deleteTestimonialFromDatabase($id);
        
        if ($result) {
            $this->clearTestimonialsCache();
        }
        
        return $result;
    }
    
    /**
     * Clear all testimonials cache
     */
    public function clearTestimonialsCache(): int
    {
        return $this->cache->clearByType('testimonials');
    }
    
    /**
     * Fetch testimonials from database
     */
    private function fetchTestimonialsFromDatabase(): array
    {
        try {
            $pdo = $this->db->getConnection();
            $stmt = $pdo->prepare("
                SELECT id, name, email, message, status, 
                       image_path, created_at, updated_at
                FROM testimonials 
                ORDER BY created_at DESC
            ");
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            error_log("Error fetching testimonials: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Fetch approved testimonials from database
     */
    private function fetchApprovedTestimonialsFromDatabase(): array
    {
        try {
            $pdo = $this->db->getConnection();
            $stmt = $pdo->prepare("
                SELECT id, name, email, message, image_path, created_at
                FROM testimonials 
                WHERE status = 'approved'
                ORDER BY created_at DESC
            ");
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            error_log("Error fetching approved testimonials: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Fetch testimonials by status from database
     */
    private function fetchTestimonialsByStatusFromDatabase(string $status): array
    {
        try {
            $pdo = $this->db->getConnection();
            $stmt = $pdo->prepare("
                SELECT id, name, email, message, status, 
                       image_path, created_at, updated_at
                FROM testimonials 
                WHERE status = :status
                ORDER BY created_at DESC
            ");
            $stmt->bindParam(':status', $status);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            error_log("Error fetching testimonials by status: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Calculate testimonial statistics
     */
    private function calculateTestimonialStats(): array
    {
        try {
            $pdo = $this->db->getConnection();
            
            // Get counts by status
            $stmt = $pdo->prepare("
                SELECT status, COUNT(*) as count
                FROM testimonials 
                GROUP BY status
            ");
            $stmt->execute();
            $statusCounts = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
            
            // Get total count
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM testimonials");
            $stmt->execute();
            $totalCount = $stmt->fetchColumn();
            
            // Get recent activity (last 30 days)
            $stmt = $pdo->prepare("
                SELECT COUNT(*) 
                FROM testimonials 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            ");
            $stmt->execute();
            $recentCount = $stmt->fetchColumn();
            
            return [
                'total' => $totalCount,
                'approved' => $statusCounts['approved'] ?? 0,
                'pending' => $statusCounts['pending'] ?? 0,
                'rejected' => $statusCounts['rejected'] ?? 0,
                'recent_30_days' => $recentCount,
                'last_updated' => date('Y-m-d H:i:s')
            ];
        } catch (Exception $e) {
            error_log("Error calculating testimonial stats: " . $e->getMessage());
            return [
                'total' => 0,
                'approved' => 0,
                'pending' => 0,
                'rejected' => 0,
                'recent_30_days' => 0,
                'last_updated' => date('Y-m-d H:i:s')
            ];
        }
    }
    
    /**
     * Insert testimonial to database
     */
    private function insertTestimonialToDatabase(array $data): bool
    {
        try {
            $pdo = $this->db->getConnection();
            $stmt = $pdo->prepare("
                INSERT INTO testimonials (name, email, message, image_path, status, created_at)
                VALUES (:name, :email, :message, :image_path, :status, NOW())
            ");
            
            return $stmt->execute([
                'name' => $data['name'],
                'email' => $data['email'],
                'message' => $data['message'],
                'image_path' => $data['image_path'] ?? null,
                'status' => $data['status'] ?? 'pending'
            ]);
        } catch (Exception $e) {
            error_log("Error inserting testimonial: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Update testimonial in database
     */
    private function updateTestimonialInDatabase(int $id, array $data): bool
    {
        try {
            $pdo = $this->db->getConnection();
            
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
            $stmt = $pdo->prepare($sql);
            
            return $stmt->execute($params);
        } catch (Exception $e) {
            error_log("Error updating testimonial: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Delete testimonial from database
     */
    private function deleteTestimonialFromDatabase(int $id): bool
    {
        try {
            $pdo = $this->db->getConnection();
            $stmt = $pdo->prepare("DELETE FROM testimonials WHERE id = :id");
            return $stmt->execute(['id' => $id]);
        } catch (Exception $e) {
            error_log("Error deleting testimonial: " . $e->getMessage());
            return false;
        }
    }
}

// Global instance for backward compatibility
$cachedTestimonialsManager = new CachedTestimonialsManager();