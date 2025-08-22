-- Database Optimization Script
-- Adds indexes, optimizes queries, and improves performance

-- Use the portfolio database
USE portfolio_db;

-- ================================
-- INDEX OPTIMIZATION
-- ================================

-- Testimonials table indexes
-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_testimonials_status ON testimonials;
DROP INDEX IF EXISTS idx_testimonials_created_at ON testimonials;
DROP INDEX IF EXISTS idx_testimonials_email ON testimonials;
DROP INDEX IF EXISTS idx_testimonials_status_created ON testimonials;

-- Create optimized indexes
CREATE INDEX idx_testimonials_status ON testimonials(status);
CREATE INDEX idx_testimonials_created_at ON testimonials(created_at DESC);
CREATE INDEX idx_testimonials_email ON testimonials(email);
CREATE INDEX idx_testimonials_status_created ON testimonials(status, created_at DESC);

-- Contact form submissions indexes (if table exists)
CREATE TABLE IF NOT EXISTS contact_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    status ENUM('new', 'read', 'replied', 'archived') DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

DROP INDEX IF EXISTS idx_contact_status ON contact_submissions;
DROP INDEX IF EXISTS idx_contact_created_at ON contact_submissions;
DROP INDEX IF EXISTS idx_contact_email ON contact_submissions;
DROP INDEX IF EXISTS idx_contact_ip ON contact_submissions;

CREATE INDEX idx_contact_status ON contact_submissions(status);
CREATE INDEX idx_contact_created_at ON contact_submissions(created_at DESC);
CREATE INDEX idx_contact_email ON contact_submissions(email);
CREATE INDEX idx_contact_ip ON contact_submissions(ip_address);

-- Admin users table (if exists)
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'moderator') DEFAULT 'moderator',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

DROP INDEX IF EXISTS idx_admin_username ON admin_users;
DROP INDEX IF EXISTS idx_admin_email ON admin_users;
DROP INDEX IF EXISTS idx_admin_active ON admin_users;

CREATE UNIQUE INDEX idx_admin_username ON admin_users(username);
CREATE UNIQUE INDEX idx_admin_email ON admin_users(email);
CREATE INDEX idx_admin_active ON admin_users(is_active);

-- Cache table for database caching
CREATE TABLE IF NOT EXISTS query_cache (
    cache_key VARCHAR(255) PRIMARY KEY,
    cache_value LONGTEXT NOT NULL,
    cache_type VARCHAR(50) DEFAULT 'query',
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_cache_expires (expires_at),
    INDEX idx_cache_type (cache_type),
    INDEX idx_cache_type_expires (cache_type, expires_at)
);

-- ================================
-- QUERY OPTIMIZATION VIEWS
-- ================================

-- Optimized view for approved testimonials
DROP VIEW IF EXISTS v_approved_testimonials;
CREATE VIEW v_approved_testimonials AS
SELECT 
    id,
    name,
    message,
    image_path,
    created_at
FROM testimonials 
WHERE status = 'approved'
ORDER BY created_at DESC;

-- Statistics view for dashboard
DROP VIEW IF EXISTS v_testimonial_stats;
CREATE VIEW v_testimonial_stats AS
SELECT 
    COUNT(*) as total_count,
    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
    SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as recent_count,
    MAX(created_at) as latest_submission
FROM testimonials;

-- Recent activity view
DROP VIEW IF EXISTS v_recent_activity;
CREATE VIEW v_recent_activity AS
SELECT 
    'testimonial' as activity_type,
    id as item_id,
    name as item_name,
    status,
    created_at
FROM testimonials 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
UNION ALL
SELECT 
    'contact' as activity_type,
    id as item_id,
    name as item_name,
    status,
    created_at
FROM contact_submissions 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY created_at DESC;

-- ================================
-- STORED PROCEDURES
-- ================================

-- Procedure to get paginated testimonials
DROP PROCEDURE IF EXISTS GetPaginatedTestimonials;
DELIMITER //
CREATE PROCEDURE GetPaginatedTestimonials(
    IN p_status VARCHAR(20),
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    DECLARE sql_query TEXT;
    
    SET sql_query = 'SELECT id, name, email, message, status, image_path, created_at FROM testimonials';
    
    IF p_status IS NOT NULL AND p_status != '' THEN
        SET sql_query = CONCAT(sql_query, ' WHERE status = ''', p_status, '''');
    END IF;
    
    SET sql_query = CONCAT(sql_query, ' ORDER BY created_at DESC LIMIT ', p_limit, ' OFFSET ', p_offset);
    
    SET @sql = sql_query;
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END //
DELIMITER ;

-- Procedure to get testimonial statistics
DROP PROCEDURE IF EXISTS GetTestimonialStatistics;
DELIMITER //
CREATE PROCEDURE GetTestimonialStatistics()
BEGIN
    SELECT * FROM v_testimonial_stats;
END //
DELIMITER ;

-- Procedure to clean expired cache
DROP PROCEDURE IF EXISTS CleanExpiredCache;
DELIMITER //
CREATE PROCEDURE CleanExpiredCache()
BEGIN
    DELETE FROM query_cache WHERE expires_at < NOW();
    SELECT ROW_COUNT() as deleted_entries;
END //
DELIMITER ;

-- ================================
-- PERFORMANCE TRIGGERS
-- ================================

-- Trigger to update statistics cache when testimonials change
DROP TRIGGER IF EXISTS testimonials_cache_invalidation;
DELIMITER //
CREATE TRIGGER testimonials_cache_invalidation
    AFTER INSERT ON testimonials
    FOR EACH ROW
BEGIN
    DELETE FROM query_cache WHERE cache_type = 'testimonials';
END //
DELIMITER ;

DROP TRIGGER IF EXISTS testimonials_update_cache_invalidation;
DELIMITER //
CREATE TRIGGER testimonials_update_cache_invalidation
    AFTER UPDATE ON testimonials
    FOR EACH ROW
BEGIN
    DELETE FROM query_cache WHERE cache_type = 'testimonials';
END //
DELIMITER ;

-- ================================
-- DATABASE OPTIMIZATION SETTINGS
-- ================================

-- Optimize MySQL settings for better performance
SET SESSION query_cache_type = ON;
SET SESSION query_cache_size = 16777216; -- 16MB

-- Show optimization results
SHOW INDEX FROM testimonials;
SHOW INDEX FROM contact_submissions;
SHOW INDEX FROM admin_users;
SHOW INDEX FROM query_cache;

-- Display table statistics
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    DATA_LENGTH,
    INDEX_LENGTH,
    (DATA_LENGTH + INDEX_LENGTH) as TOTAL_SIZE
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'portfolio_db';

COMMIT;