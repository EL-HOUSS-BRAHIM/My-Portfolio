<?php
/**
 * Performance Monitor
 * Tracks application performance metrics and provides insights
 */

class PerformanceMonitor
{
    private static $instance = null;
    private $startTime;
    private $checkpoints = [];
    private $memoryUsage = [];
    private $queries = [];
    private $logger;
    
    private function __construct()
    {
        $this->startTime = microtime(true);
        $this->logger = Logger::getInstance();
        $this->recordCheckpoint('application_start');
        
        // Register shutdown function to log final metrics
        register_shutdown_function([$this, 'logFinalMetrics']);
    }
    
    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Record a performance checkpoint
     */
    public function recordCheckpoint(string $name, array $metadata = []): void
    {
        $this->checkpoints[] = [
            'name' => $name,
            'time' => microtime(true),
            'memory' => memory_get_usage(true),
            'peak_memory' => memory_get_peak_usage(true),
            'metadata' => $metadata
        ];
    }
    
    /**
     * Start timing an operation
     */
    public function startTimer(string $operation): void
    {
        $this->recordCheckpoint("start_{$operation}");
    }
    
    /**
     * End timing an operation
     */
    public function endTimer(string $operation, array $metadata = []): float
    {
        $this->recordCheckpoint("end_{$operation}", $metadata);
        
        // Find the start checkpoint
        $startTime = null;
        foreach ($this->checkpoints as $checkpoint) {
            if ($checkpoint['name'] === "start_{$operation}") {
                $startTime = $checkpoint['time'];
                break;
            }
        }
        
        if ($startTime) {
            $duration = microtime(true) - $startTime;
            $this->logger->performance($operation, $duration, $metadata);
            return $duration;
        }
        
        return 0;
    }
    
    /**
     * Record database query
     */
    public function recordQuery(string $query, float $duration, array $params = []): void
    {
        $this->queries[] = [
            'query' => $query,
            'duration' => $duration,
            'params' => $params,
            'time' => microtime(true),
            'memory' => memory_get_usage(true)
        ];
        
        $this->logger->database($query, $duration, $params);
    }
    
    /**
     * Record memory usage at a point
     */
    public function recordMemoryUsage(string $label): void
    {
        $this->memoryUsage[] = [
            'label' => $label,
            'usage' => memory_get_usage(true),
            'peak' => memory_get_peak_usage(true),
            'time' => microtime(true)
        ];
    }
    
    /**
     * Get total execution time
     */
    public function getTotalExecutionTime(): float
    {
        return microtime(true) - $this->startTime;
    }
    
    /**
     * Get memory usage statistics
     */
    public function getMemoryStats(): array
    {
        return [
            'current' => memory_get_usage(true),
            'peak' => memory_get_peak_usage(true),
            'limit' => ini_get('memory_limit'),
            'usage_percentage' => $this->getMemoryUsagePercentage()
        ];
    }
    
    /**
     * Get memory usage percentage
     */
    private function getMemoryUsagePercentage(): float
    {
        $limit = ini_get('memory_limit');
        
        if ($limit === '-1') {
            return 0; // No limit
        }
        
        // Convert limit to bytes
        $limitBytes = $this->convertToBytes($limit);
        $currentUsage = memory_get_usage(true);
        
        return ($currentUsage / $limitBytes) * 100;
    }
    
    /**
     * Convert memory limit string to bytes
     */
    private function convertToBytes(string $val): int
    {
        $val = trim($val);
        $last = strtolower($val[strlen($val) - 1]);
        $val = (int) $val;
        
        switch ($last) {
            case 'g':
                $val *= 1024;
            case 'm':
                $val *= 1024;
            case 'k':
                $val *= 1024;
        }
        
        return $val;
    }
    
    /**
     * Get database query statistics
     */
    public function getQueryStats(): array
    {
        if (empty($this->queries)) {
            return [
                'total_queries' => 0,
                'total_time' => 0,
                'average_time' => 0,
                'slowest_query' => null
            ];
        }
        
        $totalTime = array_sum(array_column($this->queries, 'duration'));
        $slowestQuery = array_reduce($this->queries, function($carry, $query) {
            return $carry === null || $query['duration'] > $carry['duration'] ? $query : $carry;
        });
        
        return [
            'total_queries' => count($this->queries),
            'total_time' => $totalTime,
            'average_time' => $totalTime / count($this->queries),
            'slowest_query' => $slowestQuery
        ];
    }
    
    /**
     * Get all performance metrics
     */
    public function getMetrics(): array
    {
        return [
            'execution_time' => $this->getTotalExecutionTime(),
            'memory' => $this->getMemoryStats(),
            'queries' => $this->getQueryStats(),
            'checkpoints' => $this->checkpoints,
            'memory_tracking' => $this->memoryUsage,
            'server_load' => $this->getServerLoad(),
            'php_info' => $this->getPhpInfo()
        ];
    }
    
    /**
     * Get server load information
     */
    private function getServerLoad(): array
    {
        $load = sys_getloadavg();
        
        return [
            '1_minute' => $load[0] ?? null,
            '5_minute' => $load[1] ?? null,
            '15_minute' => $load[2] ?? null,
            'cpu_count' => $this->getCpuCount()
        ];
    }
    
    /**
     * Get CPU count
     */
    private function getCpuCount(): ?int
    {
        if (is_file('/proc/cpuinfo')) {
            $cpuinfo = file_get_contents('/proc/cpuinfo');
            preg_match_all('/^processor/m', $cpuinfo, $matches);
            return count($matches[0]);
        }
        
        return null;
    }
    
    /**
     * Get PHP configuration information
     */
    private function getPhpInfo(): array
    {
        return [
            'version' => PHP_VERSION,
            'memory_limit' => ini_get('memory_limit'),
            'max_execution_time' => ini_get('max_execution_time'),
            'opcache_enabled' => function_exists('opcache_get_status') ? opcache_get_status() !== false : false,
            'xdebug_enabled' => extension_loaded('xdebug')
        ];
    }
    
    /**
     * Check for performance issues
     */
    public function checkPerformanceIssues(): array
    {
        $issues = [];
        $metrics = $this->getMetrics();
        
        // Check execution time
        if ($metrics['execution_time'] > 5) {
            $issues[] = [
                'type' => 'slow_execution',
                'message' => 'Page execution time is over 5 seconds',
                'value' => $metrics['execution_time'],
                'severity' => 'high'
            ];
        } elseif ($metrics['execution_time'] > 2) {
            $issues[] = [
                'type' => 'slow_execution',
                'message' => 'Page execution time is over 2 seconds',
                'value' => $metrics['execution_time'],
                'severity' => 'medium'
            ];
        }
        
        // Check memory usage
        if ($metrics['memory']['usage_percentage'] > 80) {
            $issues[] = [
                'type' => 'high_memory',
                'message' => 'Memory usage is over 80% of limit',
                'value' => $metrics['memory']['usage_percentage'],
                'severity' => 'high'
            ];
        } elseif ($metrics['memory']['usage_percentage'] > 60) {
            $issues[] = [
                'type' => 'high_memory',
                'message' => 'Memory usage is over 60% of limit',
                'value' => $metrics['memory']['usage_percentage'],
                'severity' => 'medium'
            ];
        }
        
        // Check database queries
        if ($metrics['queries']['total_queries'] > 50) {
            $issues[] = [
                'type' => 'many_queries',
                'message' => 'Too many database queries',
                'value' => $metrics['queries']['total_queries'],
                'severity' => 'medium'
            ];
        }
        
        if ($metrics['queries']['total_time'] > 1) {
            $issues[] = [
                'type' => 'slow_queries',
                'message' => 'Database queries taking too long',
                'value' => $metrics['queries']['total_time'],
                'severity' => 'high'
            ];
        }
        
        // Check server load
        if ($metrics['server_load']['1_minute'] !== null && $metrics['server_load']['1_minute'] > 2) {
            $issues[] = [
                'type' => 'high_load',
                'message' => 'Server load is high',
                'value' => $metrics['server_load']['1_minute'],
                'severity' => 'high'
            ];
        }
        
        return $issues;
    }
    
    /**
     * Log final metrics on shutdown
     */
    public function logFinalMetrics(): void
    {
        $metrics = $this->getMetrics();
        $issues = $this->checkPerformanceIssues();
        
        // Log basic metrics
        $this->logger->performance('request_complete', $metrics['execution_time'], [
            'memory_peak' => $metrics['memory']['peak'],
            'query_count' => $metrics['queries']['total_queries'],
            'query_time' => $metrics['queries']['total_time']
        ]);
        
        // Log performance issues
        foreach ($issues as $issue) {
            $level = $issue['severity'] === 'high' ? 'WARNING' : 'NOTICE';
            $this->logger->warning("Performance issue: {$issue['message']}", $issue);
        }
        
        // Store metrics for analysis (in production)
        $config = EnvironmentConfig::getInstance();
        if ($config->isProduction()) {
            $this->storeMetrics($metrics);
        }
    }
    
    /**
     * Store metrics for analysis
     */
    private function storeMetrics(array $metrics): void
    {
        // This could store metrics in a database, send to monitoring service, etc.
        // For now, we'll just write to a metrics file
        
        $metricsFile = dirname(__DIR__, 2) . '/storage/logs/metrics-' . date('Y-m-d') . '.json';
        $entry = [
            'timestamp' => time(),
            'url' => $_SERVER['REQUEST_URI'] ?? 'unknown',
            'method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
            'metrics' => $metrics
        ];
        
        file_put_contents($metricsFile, json_encode($entry) . "\n", FILE_APPEND | LOCK_EX);
    }
    
    /**
     * Generate performance report
     */
    public function generateReport(): string
    {
        $metrics = $this->getMetrics();
        $issues = $this->checkPerformanceIssues();
        
        $report = "Performance Report\n";
        $report .= "==================\n\n";
        
        $report .= "Execution Time: " . round($metrics['execution_time'], 4) . "s\n";
        $report .= "Memory Usage: " . $this->formatBytes($metrics['memory']['current']) . "\n";
        $report .= "Peak Memory: " . $this->formatBytes($metrics['memory']['peak']) . "\n";
        $report .= "Memory Usage: " . round($metrics['memory']['usage_percentage'], 2) . "%\n\n";
        
        $report .= "Database Queries: " . $metrics['queries']['total_queries'] . "\n";
        $report .= "Query Time: " . round($metrics['queries']['total_time'], 4) . "s\n";
        $report .= "Average Query Time: " . round($metrics['queries']['average_time'], 4) . "s\n\n";
        
        if (!empty($issues)) {
            $report .= "Performance Issues:\n";
            foreach ($issues as $issue) {
                $report .= "- [{$issue['severity']}] {$issue['message']}\n";
            }
            $report .= "\n";
        }
        
        $report .= "Checkpoints:\n";
        foreach ($metrics['checkpoints'] as $checkpoint) {
            $time = round($checkpoint['time'] - $this->startTime, 4);
            $memory = $this->formatBytes($checkpoint['memory']);
            $report .= "- {$checkpoint['name']}: {$time}s ({$memory})\n";
        }
        
        return $report;
    }
    
    /**
     * Format bytes to human readable format
     */
    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }
}