<?php
/**
 * Database Connection Manager
 * 
 * Handles database connections with improved error handling
 * and connection pooling.
 */

require_once __DIR__ . '/Config.php';

class Database {
    private static $instance = null;
    private $connection = null;
    private $config;
    
    private function __construct() {
        $this->config = Config::getInstance();
        $this->connect();
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function connect() {
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
            error_log("Database connection failed: " . $e->getMessage());
            
            if ($this->config->get('app.debug')) {
                throw new Exception("Database connection failed: " . $e->getMessage());
            } else {
                throw new Exception("Database connection failed. Please try again later.");
            }
        }
    }
    
    public function getConnection() {
        // Check if connection is still alive
        if ($this->connection === null) {
            $this->connect();
        }
        
        return $this->connection;
    }
    
    public function query($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            error_log("Database query error: " . $e->getMessage());
            throw new Exception("Database query failed");
        }
    }
    
    public function fetchAll($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetchAll();
    }
    
    public function fetchOne($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetch();
    }
    
    public function execute($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->rowCount();
    }
    
    public function lastInsertId() {
        return $this->connection->lastInsertId();
    }
}
