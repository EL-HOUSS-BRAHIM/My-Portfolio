<?php

// Bootstrap file for PHPUnit tests
// This file sets up the testing environment

// Set error reporting to maximum
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Define constants for testing
define('TESTING', true);
define('ROOT_PATH', dirname(__DIR__));
define('SRC_PATH', ROOT_PATH . '/src');
define('CONFIG_PATH', ROOT_PATH . '/config');
define('STORAGE_PATH', ROOT_PATH . '/storage');
define('TESTS_PATH', ROOT_PATH . '/tests');

// Include Composer autoloader
require_once ROOT_PATH . '/vendor/autoload.php';

// Load environment variables for testing
if (file_exists(ROOT_PATH . '/.env.testing')) {
    $dotenv = Dotenv\Dotenv::createImmutable(ROOT_PATH, '.env.testing');
    $dotenv->load();
} else {
    // Set default testing environment variables
    $_ENV['APP_ENV'] = 'testing';
    $_ENV['DB_CONNECTION'] = 'sqlite';
    $_ENV['DB_DATABASE'] = ':memory:';
    $_ENV['CACHE_DRIVER'] = 'array';
    $_ENV['MAIL_MAILER'] = 'array';
}

// Set up testing database if needed
if (!defined('DB_SETUP_DONE')) {
    // Create in-memory SQLite database for testing
    $pdo = new PDO('sqlite::memory:');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Create test tables
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS testimonials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS contact_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            subject VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            status ENUM('unread', 'read', 'replied') DEFAULT 'unread',
            ip_address VARCHAR(45),
            user_agent TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS admin_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            last_login DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    define('DB_SETUP_DONE', true);
}

// Helper function to get test database connection
function getTestDatabaseConnection(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO('sqlite::memory:');
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }
    return $pdo;
}

// Helper function to reset test database
function resetTestDatabase(): void {
    $pdo = getTestDatabaseConnection();
    $pdo->exec("DELETE FROM testimonials");
    $pdo->exec("DELETE FROM contact_messages");
    $pdo->exec("DELETE FROM admin_users");
}

// Helper function to create test data
function createTestData(): void {
    $pdo = getTestDatabaseConnection();
    
    // Insert test testimonial
    $pdo->exec("
        INSERT INTO testimonials (name, email, message, status) 
        VALUES ('John Doe', 'john@example.com', 'Great work!', 'approved')
    ");
    
    // Insert test contact message
    $pdo->exec("
        INSERT INTO contact_messages (name, email, subject, message) 
        VALUES ('Jane Smith', 'jane@example.com', 'Test Subject', 'Test message')
    ");
    
    // Insert test admin user
    $passwordHash = password_hash('testpassword', PASSWORD_DEFAULT);
    $pdo->prepare("
        INSERT INTO admin_users (username, email, password_hash) 
        VALUES (?, ?, ?)
    ")->execute(['testadmin', 'admin@test.com', $passwordHash]);
}

// Clean up any previous test artifacts
if (file_exists(STORAGE_PATH . '/cache/test_cache.php')) {
    unlink(STORAGE_PATH . '/cache/test_cache.php');
}

// Set up test directories
$testDirs = [
    STORAGE_PATH . '/cache',
    STORAGE_PATH . '/logs',
    STORAGE_PATH . '/sessions',
    TESTS_PATH . '/fixtures',
    TESTS_PATH . '/mocks'
];

foreach ($testDirs as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
}

// Set up error handler for tests
set_error_handler(function ($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) {
        return;
    }
    throw new ErrorException($message, 0, $severity, $file, $line);
});

echo "Test environment initialized successfully.\n";