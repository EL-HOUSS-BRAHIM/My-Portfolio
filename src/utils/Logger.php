<?php
/**
 * Application Logger
 * Handles logging across different environments with proper formatting
 */

class Logger
{
    private static $instance = null;
    private $logPath;
    private $logLevel;
    private $environment;
    private $maxFiles;
    private $includeTrace;
    
    // Log levels
    const EMERGENCY = 'EMERGENCY';
    const ALERT = 'ALERT';
    const CRITICAL = 'CRITICAL';
    const ERROR = 'ERROR';
    const WARNING = 'WARNING';
    const NOTICE = 'NOTICE';
    const INFO = 'INFO';
    const DEBUG = 'DEBUG';
    
    private $levelPriority = [
        'DEBUG' => 0,
        'INFO' => 1,
        'NOTICE' => 2,
        'WARNING' => 3,
        'ERROR' => 4,
        'CRITICAL' => 5,
        'ALERT' => 6,
        'EMERGENCY' => 7
    ];
    
    private function __construct()
    {
        $config = EnvironmentConfig::getInstance();
        $this->logPath = $config->get('logging.path', dirname(__DIR__, 2) . '/storage/logs');
        $this->logLevel = $config->get('logging.level', 'INFO');
        $this->environment = $config->getEnvironment();
        $this->maxFiles = $config->get('logging.max_files', 30);
        $this->includeTrace = $config->get('logging.include_trace', false);
        
        // Ensure log directory exists
        if (!is_dir($this->logPath)) {
            mkdir($this->logPath, 0755, true);
        }
    }
    
    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Check if log level should be logged
     */
    private function shouldLog(string $level): bool
    {
        $currentPriority = $this->levelPriority[$this->logLevel] ?? 0;
        $logPriority = $this->levelPriority[$level] ?? 0;
        
        return $logPriority >= $currentPriority;
    }
    
    /**
     * Format log message
     */
    private function formatMessage(string $level, string $message, array $context = []): string
    {
        $timestamp = date('Y-m-d H:i:s');
        $contextStr = empty($context) ? '' : ' ' . json_encode($context);
        
        $formatted = "[{$timestamp}] {$level}: {$message}{$contextStr}";
        
        // Add stack trace in development
        if ($this->includeTrace && in_array($level, ['ERROR', 'CRITICAL', 'EMERGENCY'])) {
            $trace = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 5);
            $traceStr = "\nStack trace:\n";
            
            foreach ($trace as $i => $frame) {
                if ($i === 0) continue; // Skip this method
                
                $file = $frame['file'] ?? 'unknown';
                $line = $frame['line'] ?? 'unknown';
                $function = $frame['function'] ?? 'unknown';
                $class = isset($frame['class']) ? $frame['class'] . '::' : '';
                
                $traceStr .= "  #{$i} {$file}({$line}): {$class}{$function}()\n";
            }
            
            $formatted .= $traceStr;
        }
        
        return $formatted;
    }
    
    /**
     * Get log file path for current date
     */
    private function getLogFile(string $type = 'app'): string
    {
        $date = date('Y-m-d');
        return "{$this->logPath}/{$type}-{$date}.log";
    }
    
    /**
     * Write log entry
     */
    private function writeLog(string $level, string $message, array $context = [], string $type = 'app'): void
    {
        if (!$this->shouldLog($level)) {
            return;
        }
        
        $formattedMessage = $this->formatMessage($level, $message, $context);
        $logFile = $this->getLogFile($type);
        
        // Write to file
        file_put_contents($logFile, $formattedMessage . PHP_EOL, FILE_APPEND | LOCK_EX);
        
        // Rotate logs if needed
        $this->rotateLogs($type);
        
        // Send to monitoring service in production
        if ($this->environment === 'production' && in_array($level, ['ERROR', 'CRITICAL', 'EMERGENCY'])) {
            $this->sendToMonitoring($level, $message, $context);
        }
    }
    
    /**
     * Rotate old log files
     */
    private function rotateLogs(string $type): void
    {
        $pattern = "{$this->logPath}/{$type}-*.log";
        $files = glob($pattern);
        
        if (count($files) > $this->maxFiles) {
            // Sort by modification time (oldest first)
            usort($files, function($a, $b) {
                return filemtime($a) - filemtime($b);
            });
            
            // Remove oldest files
            $filesToRemove = array_slice($files, 0, count($files) - $this->maxFiles);
            foreach ($filesToRemove as $file) {
                unlink($file);
            }
        }
    }
    
    /**
     * Send critical errors to monitoring service
     */
    private function sendToMonitoring(string $level, string $message, array $context): void
    {
        // Implement integration with monitoring services like Sentry, Bugsnag, etc.
        // This is a placeholder for actual implementation
        
        $data = [
            'level' => $level,
            'message' => $message,
            'context' => $context,
            'environment' => $this->environment,
            'timestamp' => date('c'),
            'server' => $_SERVER['SERVER_NAME'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        ];
        
        // Example: Send to webhook or monitoring API
        // $this->sendWebhook($data);
    }
    
    /**
     * Log emergency message
     */
    public function emergency(string $message, array $context = []): void
    {
        $this->writeLog(self::EMERGENCY, $message, $context);
    }
    
    /**
     * Log alert message
     */
    public function alert(string $message, array $context = []): void
    {
        $this->writeLog(self::ALERT, $message, $context);
    }
    
    /**
     * Log critical message
     */
    public function critical(string $message, array $context = []): void
    {
        $this->writeLog(self::CRITICAL, $message, $context);
    }
    
    /**
     * Log error message
     */
    public function error(string $message, array $context = []): void
    {
        $this->writeLog(self::ERROR, $message, $context);
    }
    
    /**
     * Log warning message
     */
    public function warning(string $message, array $context = []): void
    {
        $this->writeLog(self::WARNING, $message, $context);
    }
    
    /**
     * Log notice message
     */
    public function notice(string $message, array $context = []): void
    {
        $this->writeLog(self::NOTICE, $message, $context);
    }
    
    /**
     * Log info message
     */
    public function info(string $message, array $context = []): void
    {
        $this->writeLog(self::INFO, $message, $context);
    }
    
    /**
     * Log debug message
     */
    public function debug(string $message, array $context = []): void
    {
        $this->writeLog(self::DEBUG, $message, $context);
    }
    
    /**
     * Log performance metrics
     */
    public function performance(string $operation, float $duration, array $metrics = []): void
    {
        $context = array_merge($metrics, [
            'duration' => round($duration, 4),
            'memory_usage' => memory_get_usage(true),
            'peak_memory' => memory_get_peak_usage(true)
        ]);
        
        $this->writeLog(self::INFO, "Performance: {$operation}", $context, 'performance');
    }
    
    /**
     * Log security events
     */
    public function security(string $event, array $context = []): void
    {
        $securityContext = array_merge($context, [
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            'timestamp' => time(),
            'session_id' => session_id()
        ]);
        
        $this->writeLog(self::WARNING, "Security: {$event}", $securityContext, 'security');
    }
    
    /**
     * Log API requests
     */
    public function api(string $method, string $endpoint, int $responseCode, float $duration, array $context = []): void
    {
        $apiContext = array_merge($context, [
            'method' => $method,
            'endpoint' => $endpoint,
            'response_code' => $responseCode,
            'duration' => round($duration, 4),
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        ]);
        
        $this->writeLog(self::INFO, "API: {$method} {$endpoint} - {$responseCode}", $apiContext, 'api');
    }
    
    /**
     * Log database queries
     */
    public function database(string $query, float $duration, array $params = []): void
    {
        if ($this->environment === 'development') {
            $context = [
                'query' => $query,
                'duration' => round($duration, 4),
                'params' => $params
            ];
            
            $this->writeLog(self::DEBUG, "Database query", $context, 'database');
        }
    }
    
    /**
     * Get recent log entries
     */
    public function getRecentLogs(string $type = 'app', int $lines = 100): array
    {
        $logFile = $this->getLogFile($type);
        
        if (!file_exists($logFile)) {
            return [];
        }
        
        $file = new SplFileObject($logFile);
        $file->seek(PHP_INT_MAX);
        $totalLines = $file->key();
        
        $startLine = max(0, $totalLines - $lines);
        $logs = [];
        
        $file->rewind();
        $file->seek($startLine);
        
        while (!$file->eof()) {
            $line = trim($file->current());
            if (!empty($line)) {
                $logs[] = $line;
            }
            $file->next();
        }
        
        return $logs;
    }
    
    /**
     * Get log statistics
     */
    public function getLogStats(): array
    {
        $stats = [];
        $types = ['app', 'performance', 'security', 'api', 'database'];
        
        foreach ($types as $type) {
            $logFile = $this->getLogFile($type);
            
            if (file_exists($logFile)) {
                $stats[$type] = [
                    'size' => filesize($logFile),
                    'lines' => count(file($logFile)),
                    'modified' => filemtime($logFile)
                ];
            } else {
                $stats[$type] = [
                    'size' => 0,
                    'lines' => 0,
                    'modified' => null
                ];
            }
        }
        
        return $stats;
    }
    
    /**
     * Clear logs
     */
    public function clearLogs(string $type = null): void
    {
        if ($type) {
            $pattern = "{$this->logPath}/{$type}-*.log";
        } else {
            $pattern = "{$this->logPath}/*.log";
        }
        
        $files = glob($pattern);
        foreach ($files as $file) {
            unlink($file);
        }
    }
}