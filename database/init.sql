-- Portfolio Database Initialization Script
-- Creates all necessary tables for the portfolio website

-- Use the database (uncomment and replace with your database name)
-- USE portfolio_db;

-- Create testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    image_data LONGBLOB NOT NULL,
    image_type VARCHAR(50) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    testimonial TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Create contact messages table
CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) DEFAULT NULL,
    message TEXT NOT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    status ENUM('unread', 'read', 'replied', 'archived') DEFAULT 'unread',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_email (email)
);

-- Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) DEFAULT NULL,
    last_name VARCHAR(50) DEFAULT NULL,
    role ENUM('admin', 'moderator') DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_active (is_active)
);

-- Create rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    endpoint VARCHAR(100) NOT NULL,
    attempts INT DEFAULT 1,
    window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_ip_endpoint (ip_address, endpoint),
    INDEX idx_ip_endpoint (ip_address, endpoint),
    INDEX idx_window_start (window_start)
);

-- Create admin sessions table for secure session management
CREATE TABLE IF NOT EXISTS admin_sessions (
    id VARCHAR(128) PRIMARY KEY,
    admin_id INT NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE,
    INDEX idx_admin_id (admin_id),
    INDEX idx_expires (expires_at),
    INDEX idx_active (is_active)
);

-- Create a default admin user (password: admin123 - CHANGE THIS!)
-- Password hash for 'admin123' - MUST BE CHANGED in production
INSERT INTO admin_users (username, password_hash, email, first_name, last_name, role) 
VALUES (
    'admin', 
    '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsOOO6VBq', -- admin123
    'admin@brahim-elhouss.me',
    'Admin',
    'User',
    'admin'
) ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Add some sample approved testimonials (optional - remove if not needed)
INSERT INTO testimonials (name, image_data, image_type, rating, testimonial, status) VALUES
(
    'John Doe',
    UNHEX('89504E470D0A1A0A0000000D49484452000000640000006408060000007017A5CB0000001974455874536F6674776172650041646F626520496D616765526561647971C9653C00000CDF49444154785EEDDD075014579C07F0'),
    'image/png',
    5,
    'Excellent work! The portfolio website is beautifully designed and very professional. Great attention to detail.',
    'approved'
),
(
    'Jane Smith',
    UNHEX('89504E470D0A1A0A0000000D49484452000000640000006408060000007017A5CB0000001974455874536F6674776172650041646F626520496D616765526561647971C9653C00000CDF49444154785EEDDD075014579C07F0'),
    'image/png',
    4,
    'Very impressed with the technical skills and clean code. The website loads fast and looks great on all devices.',
    'approved'
)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Clean up expired rate limits (to be run periodically)
CREATE EVENT IF NOT EXISTS cleanup_rate_limits
ON SCHEDULE EVERY 1 HOUR
DO
    DELETE FROM rate_limits WHERE window_start < DATE_SUB(NOW(), INTERVAL 2 HOUR);

-- Clean up expired admin sessions
CREATE EVENT IF NOT EXISTS cleanup_admin_sessions
ON SCHEDULE EVERY 1 HOUR
DO
    DELETE FROM admin_sessions WHERE expires_at < NOW();

-- Create skills table
CREATE TABLE IF NOT EXISTS skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    level INT NOT NULL CHECK (level >= 0 AND level <= 100),
    icon VARCHAR(100),
    order_position INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_active (is_active),
    INDEX idx_order (order_position)
);

-- Create education table
CREATE TABLE IF NOT EXISTS education (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institution VARCHAR(255) NOT NULL,
    degree VARCHAR(255) NOT NULL,
    field_of_study VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    description TEXT,
    location VARCHAR(255),
    achievements TEXT,
    skills TEXT,
    order_position INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (is_active),
    INDEX idx_order (order_position),
    INDEX idx_dates (start_date, end_date)
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500),
    image_url VARCHAR(500),
    demo_url VARCHAR(500),
    github_url VARCHAR(500),
    technologies TEXT,
    category VARCHAR(100),
    featured BOOLEAN DEFAULT FALSE,
    order_position INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (is_active),
    INDEX idx_featured (featured),
    INDEX idx_category (category),
    INDEX idx_order (order_position)
);
