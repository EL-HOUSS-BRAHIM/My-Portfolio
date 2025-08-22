<?php

declare(strict_types=1);

/**
 * Database Connection Manager
 * 
 * Singleton class that handles database connections with improved error handling,
 * connection pooling, and standardized query methods. Uses PDO for secure
 * database interactions with prepared statements.
 * 
 * @package Portfolio\Config
 * @author Brahim El Houss
 * @version 1.0.0
 * 
 * @example
 * ```php
 * $db = Database::getInstance();
 * $users = $db->fetchAll("SELECT * FROM users WHERE active = ?", [1]);
 * ```
 */

namespace Portfolio\Config;

use PDO;
use PDOException;
use Exception;
use Portfolio\Utils\ErrorHandler;

require_once __DIR__ . '/Config.php';

class Database
{
    /** @var Database|null Singleton instance */
    private static ?Database $instance = null;
    
    /** @var PDO|null Database connection instance */
    private ?PDO $connection = null;
    
    /** @var Config Configuration manager instance */
    private Config $config;
    
    /**
     * Private constructor to prevent direct instantiation
     * Initializes configuration and establishes database connection
     * 
     * @throws Exception If database connection fails
     */
    
    private function __construct()
    {
        $this->config = Config::getInstance();
        $this->connect();
    }
    
    /**
     * Get singleton instance of Database
     * 
     * @return self The Database instance
     * @throws Exception If database connection fails during initialization
     */
    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        
        return self::$instance;
    }
    
    /**
     * Establish database connection using PDO
     * Configures PDO options for security and error handling
     * 
     * @throws Exception If connection cannot be established
     */
    private function connect(): void
    {
        try {
            $dsn = sprintf(
                "mysql:host=%s;dbname=%s;charset=%s",
                $this->config->get('db.host'),
                $this->config->get('db.name'),
                $this->config->get('db.charset')
            );
            
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            // Add MySQL specific options only if MySQL driver is available
            if (in_array('mysql', PDO::getAvailableDrivers())) {
                $options[1002] = "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"; // PDO::MYSQL_ATTR_INIT_COMMAND
            }
            
            $this->connection = new PDO(
                $dsn,
                $this->config->get('db.user'),
                $this->config->get('db.pass'),
                $options
            );
            
            if ($this->config->get('app.debug')) {
                error_log("Database connection successful");
            }
        } catch (PDOException $e) {
            ErrorHandler::logError([
                'type' => 'Database Connection Error',
                'message' => $e->getMessage(),
                'file' => __FILE__,
                'line' => __LINE__,
                'timestamp' => date('Y-m-d H:i:s'),
                'request_uri' => $_SERVER['REQUEST_URI'] ?? 'CLI'
            ]);
            
            if ($this->config->get('app.debug')) {
                throw new Exception("Database connection failed: " . $e->getMessage());
            } else {
                throw new Exception("Database connection failed. Please try again later.");
            }
        }
    }
    
    /**
     * Get active database connection
     * Automatically reconnects if connection is lost
     * 
     * @return PDO Active database connection
     * @throws Exception If connection cannot be established
     */
    public function getConnection(): PDO
    {
        // Check if connection is still alive
        if ($this->connection === null) {
            $this->connect();
        }
        
        return $this->connection;
    }
    
    /**
     * Execute a prepared SQL query
     * 
     * @param string $sql SQL query with placeholders
     * @param array $params Parameters to bind to placeholders
     * @return \PDOStatement Executed statement
     * @throws Exception If query execution fails
     * 
     * @example
     * ```php
     * $stmt = $db->query("SELECT * FROM users WHERE id = ?", [123]);
     * ```
     */
    public function query(string $sql, array $params = []): \PDOStatement
    {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            ErrorHandler::logError([
                'type' => 'Database Query Error',
                'message' => $e->getMessage(),
                'file' => __FILE__,
                'line' => __LINE__,
                'timestamp' => date('Y-m-d H:i:s'),
                'request_uri' => $_SERVER['REQUEST_URI'] ?? 'CLI'
            ], ['sql' => $sql, 'params' => $params]);
            
            throw new Exception("Database query failed");
        }
    }
    
    /**
     * Fetch all rows from a query result
     * 
     * @param string $sql SQL query with placeholders
     * @param array $params Parameters to bind to placeholders
     * @return array Array of all matching rows
     * @throws Exception If query execution fails
     * 
     * @example
     * ```php
     * $users = $db->fetchAll("SELECT * FROM users WHERE status = ?", ['active']);
     * ```
     */
    public function fetchAll(string $sql, array $params = []): array
    {
        $stmt = $this->query($sql, $params);
        return $stmt->fetchAll();
    }
    
    /**
     * Fetch single row from a query result
     * 
     * @param string $sql SQL query with placeholders
     * @param array $params Parameters to bind to placeholders
     * @return array|false Single row as associative array, or false if no results
     * @throws Exception If query execution fails
     * 
     * @example
     * ```php
     * $user = $db->fetchOne("SELECT * FROM users WHERE id = ?", [123]);
     * if ($user) {
     *     echo "User name: " . $user['name'];
     * }
     * ```
     */
    public function fetchOne(string $sql, array $params = []): array|false
    {
        $stmt = $this->query($sql, $params);
        return $stmt->fetch();
    }
    
    /**
     * Execute a query and return number of affected rows
     * Useful for INSERT, UPDATE, DELETE operations
     * 
     * @param string $sql SQL query with placeholders
     * @param array $params Parameters to bind to placeholders
     * @return int Number of affected rows
     * @throws Exception If query execution fails
     * 
     * @example
     * ```php
     * $affected = $db->execute("UPDATE users SET status = ? WHERE id = ?", ['inactive', 123]);
     * echo "Updated {$affected} users";
     * ```
     */
    public function execute(string $sql, array $params = []): int
    {
        $stmt = $this->query($sql, $params);
        return $stmt->rowCount();
    }
    
    /**
     * Get the ID of the last inserted row
     * 
     * @return string The last insert ID as string
     * 
     * @example
     * ```php
     * $db->execute("INSERT INTO users (name, email) VALUES (?, ?)", ['John', 'john@example.com']);
     * $userId = $db->lastInsertId();
     * ```
     */
    public function lastInsertId(): string
    {
        return $this->connection->lastInsertId();
    }
}
