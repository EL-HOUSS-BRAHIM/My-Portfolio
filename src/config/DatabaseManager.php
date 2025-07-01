<?php
/**
 * Enhanced Database Manager
 * 
 * Provides advanced database operations with connection pooling,
 * query caching, and transaction management.
 */

require_once __DIR__ . '/ConfigManager.php';

class DatabaseManager {
    private static $instance = null;
    private $connections = [];
    private $config;
    private $logger;
    private $queryCache = [];
    private $transactionLevel = 0;
    private $statistics = [
        'queries' => 0,
        'query_time' => 0,
        'cache_hits' => 0,
        'cache_misses' => 0
    ];
    
    private function __construct() {
        $this->config = ConfigManager::getInstance();
        $this->logger = new DatabaseLogger();
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Get database connection with connection pooling
     */
    public function getConnection($name = 'default') {
        if (!isset($this->connections[$name])) {
            $this->connections[$name] = $this->createConnection($name);
        }
        
        // Test connection health
        if (!$this->isConnectionHealthy($this->connections[$name])) {
            $this->connections[$name] = $this->createConnection($name);
        }
        
        return $this->connections[$name];
    }
    
    /**
     * Create new database connection
     */
    private function createConnection($name = 'default') {
        try {
            $config = $this->config->get('database');
            
            $dsn = sprintf(
                "mysql:host=%s;port=%d;dbname=%s;charset=%s",
                $config['host'],
                $config['port'] ?? 3306,
                $config['name'],
                $config['charset']
            );
            
            $options = array_merge([
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_PERSISTENT => $config['persistent'] ?? false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$config['charset']} COLLATE {$config['charset']}_unicode_ci"
            ], $config['options'] ?? []);
            
            $connection = new PDO($dsn, $config['user'], $config['pass'], $options);
            
            // Set connection timezone
            $timezone = $this->config->get('app.timezone', 'UTC');
            $connection->exec("SET time_zone = '{$timezone}'");
            
            $this->logger->info("Database connection established", ['name' => $name]);
            
            return $connection;
            
        } catch (PDOException $e) {
            $this->logger->error("Database connection failed", [
                'name' => $name,
                'error' => $e->getMessage()
            ]);
            
            throw new DatabaseException("Database connection failed: " . $e->getMessage());
        }
    }
    
    /**
     * Check if connection is healthy
     */
    private function isConnectionHealthy($connection) {
        try {
            $connection->query('SELECT 1');
            return true;
        } catch (PDOException $e) {
            return false;
        }
    }
    
    /**
     * Execute query with caching and statistics
     */
    public function query($sql, $params = [], $options = []) {
        $startTime = microtime(true);
        $this->statistics['queries']++;
        
        try {
            $connection = $this->getConnection();
            
            // Check cache if enabled
            if (!empty($options['cache'])) {
                $cacheKey = $this->getCacheKey($sql, $params);
                if (isset($this->queryCache[$cacheKey])) {
                    $this->statistics['cache_hits']++;
                    return $this->queryCache[$cacheKey];
                }
                $this->statistics['cache_misses']++;
            }
            
            $stmt = $connection->prepare($sql);
            
            // Bind parameters with proper types
            if (!empty($params)) {
                foreach ($params as $key => $value) {
                    $type = $this->getParameterType($value);
                    if (is_int($key)) {
                        $stmt->bindValue($key + 1, $value, $type);
                    } else {
                        $stmt->bindValue($key, $value, $type);
                    }
                }
            }
            
            $stmt->execute();
            
            // Cache result if requested
            if (!empty($options['cache']) && $stmt->columnCount() > 0) {
                $result = $stmt->fetchAll();
                $this->queryCache[$cacheKey] = $result;
                $stmt = $result;
            }
            
            $this->statistics['query_time'] += microtime(true) - $startTime;
            
            $this->logger->debug("Query executed", [
                'sql' => $sql,
                'params' => $params,
                'time' => microtime(true) - $startTime
            ]);
            
            return $stmt;
            
        } catch (PDOException $e) {
            $this->logger->error("Query execution failed", [
                'sql' => $sql,
                'params' => $params,
                'error' => $e->getMessage()
            ]);
            
            throw new DatabaseException("Query execution failed: " . $e->getMessage());
        }
    }
    
    /**
     * Get parameter type for PDO binding
     */
    private function getParameterType($value) {
        switch (gettype($value)) {
            case 'boolean':
                return PDO::PARAM_BOOL;
            case 'integer':
                return PDO::PARAM_INT;
            case 'NULL':
                return PDO::PARAM_NULL;
            default:
                return PDO::PARAM_STR;
        }
    }
    
    /**
     * Generate cache key for query
     */
    private function getCacheKey($sql, $params) {
        return md5($sql . serialize($params));
    }
    
    /**
     * Fetch all results
     */
    public function fetchAll($sql, $params = [], $options = []) {
        $stmt = $this->query($sql, $params, $options);
        
        if (is_array($stmt)) {
            return $stmt; // From cache
        }
        
        return $stmt->fetchAll();
    }
    
    /**
     * Fetch single result
     */
    public function fetchOne($sql, $params = [], $options = []) {
        $stmt = $this->query($sql, $params, $options);
        
        if (is_array($stmt)) {
            return $stmt[0] ?? null; // From cache
        }
        
        return $stmt->fetch();
    }
    
    /**
     * Execute insert/update/delete query
     */
    public function execute($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->rowCount();
    }
    
    /**
     * Get last insert ID
     */
    public function lastInsertId() {
        return $this->getConnection()->lastInsertId();
    }
    
    /**
     * Start transaction
     */
    public function beginTransaction() {
        if ($this->transactionLevel === 0) {
            $this->getConnection()->beginTransaction();
            $this->logger->debug("Transaction started");
        }
        $this->transactionLevel++;
        
        return $this;
    }
    
    /**
     * Commit transaction
     */
    public function commit() {
        if ($this->transactionLevel > 0) {
            $this->transactionLevel--;
            
            if ($this->transactionLevel === 0) {
                $this->getConnection()->commit();
                $this->logger->debug("Transaction committed");
            }
        }
        
        return $this;
    }
    
    /**
     * Rollback transaction
     */
    public function rollback() {
        if ($this->transactionLevel > 0) {
            $this->transactionLevel = 0;
            $this->getConnection()->rollback();
            $this->logger->debug("Transaction rolled back");
        }
        
        return $this;
    }
    
    /**
     * Execute in transaction
     */
    public function transaction(callable $callback) {
        $this->beginTransaction();
        
        try {
            $result = $callback($this);
            $this->commit();
            return $result;
        } catch (Exception $e) {
            $this->rollback();
            throw $e;
        }
    }
    
    /**
     * Get database statistics
     */
    public function getStatistics() {
        return $this->statistics;
    }
    
    /**
     * Clear query cache
     */
    public function clearCache() {
        $this->queryCache = [];
        $this->statistics['cache_hits'] = 0;
        $this->statistics['cache_misses'] = 0;
    }
    
    /**
     * Close all connections
     */
    public function closeConnections() {
        foreach ($this->connections as $name => $connection) {
            $this->connections[$name] = null;
            $this->logger->info("Connection closed", ['name' => $name]);
        }
        $this->connections = [];
    }
    
    /**
     * Health check
     */
    public function healthCheck() {
        try {
            $result = $this->fetchOne('SELECT 1 as health_check');
            return $result['health_check'] === 1;
        } catch (Exception $e) {
            return false;
        }
    }
}

/**
 * Database Exception Class
 */
class DatabaseException extends Exception {
    public function __construct($message, $code = 0, Exception $previous = null) {
        parent::__construct($message, $code, $previous);
    }
}

/**
 * Database Logger Class
 */
class DatabaseLogger {
    private $config;
    
    public function __construct() {
        $this->config = ConfigManager::getInstance();
    }
    
    public function debug($message, $context = []) {
        if ($this->config->get('app.debug')) {
            $this->log('DEBUG', $message, $context);
        }
    }
    
    public function info($message, $context = []) {
        $this->log('INFO', $message, $context);
    }
    
    public function error($message, $context = []) {
        $this->log('ERROR', $message, $context);
    }
    
    private function log($level, $message, $context = []) {
        $timestamp = date('Y-m-d H:i:s');
        $contextStr = empty($context) ? '' : ' ' . json_encode($context);
        $logMessage = "[{$timestamp}] [{$level}] [DATABASE] {$message}{$contextStr}\n";
        
        $logFile = $this->config->get('logging.file', 'storage/logs/database.log');
        $logDir = dirname($logFile);
        
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        
        file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
    }
}
