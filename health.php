<?php
/**
 * Health Check Endpoint
 * Provides comprehensive system health status for load balancers and monitoring
 */

header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');

// Basic response structure
$health = [
    'status' => 'healthy',
    'timestamp' => date('c'),
    'version' => '1.0.0',
    'environment' => $_ENV['APP_ENV'] ?? 'production',
    'checks' => []
];

$overallStatus = true;

// Check PHP version and extensions
$requiredExtensions = ['json', 'mbstring', 'curl'];
$extensionsHealthy = true;
$extensionsMessages = [];

foreach ($requiredExtensions as $extension) {
    if (extension_loaded($extension)) {
        $extensionsMessages[] = "$extension: loaded";
    } else {
        $extensionsMessages[] = "$extension: missing";
        $extensionsHealthy = false;
    }
}

$health['checks']['php'] = [
    'status' => $extensionsHealthy ? 'healthy' : 'unhealthy',
    'version' => PHP_VERSION,
    'extensions' => $extensionsMessages,
    'message' => $extensionsHealthy ? 'PHP is running normally' : 'Missing required PHP extensions'
];

if (!$extensionsHealthy) {
    $overallStatus = false;
}

// Check database connection
if (file_exists(__DIR__ . '/.env')) {
    try {
        $env = parse_ini_file(__DIR__ . '/.env');
        
        if (isset($env['DB_HOST'], $env['DB_NAME'], $env['DB_USERNAME'])) {
            $dsn = "mysql:host={$env['DB_HOST']};dbname={$env['DB_NAME']}";
            $pdo = new PDO($dsn, $env['DB_USERNAME'], $env['DB_PASSWORD'] ?? '', [
                PDO::ATTR_TIMEOUT => 5,
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
            ]);
            
            $stmt = $pdo->query('SELECT 1');
            
            $health['checks']['database'] = [
                'status' => 'healthy',
                'message' => 'Database connection successful',
                'host' => $env['DB_HOST']
            ];
        } else {
            $health['checks']['database'] = [
                'status' => 'skipped',
                'message' => 'Database configuration incomplete'
            ];
        }
    } catch (Exception $e) {
        $health['checks']['database'] = [
            'status' => 'unhealthy',
            'message' => 'Database connection failed: ' . $e->getMessage()
        ];
        $overallStatus = false;
    }
} else {
    $health['checks']['database'] = [
        'status' => 'not_applicable',
        'message' => 'No database configuration found'
    ];
}

// Check file system permissions
$writableDirs = [
    'storage/logs',
    'storage/cache', 
    'storage/sessions',
    'assets/uploads'
];

$fileSystemHealthy = true;
$fileSystemDetails = [];

foreach ($writableDirs as $dir) {
    $fullPath = __DIR__ . '/' . $dir;
    
    if (is_dir($fullPath)) {
        if (is_writable($fullPath)) {
            $fileSystemDetails[$dir] = 'writable';
        } else {
            $fileSystemDetails[$dir] = 'not writable';
            $fileSystemHealthy = false;
        }
    } else {
        $fileSystemDetails[$dir] = 'does not exist';
        // Create directory if possible
        if (@mkdir($fullPath, 0755, true)) {
            $fileSystemDetails[$dir] = 'created and writable';
        } else {
            $fileSystemHealthy = false;
        }
    }
}

$health['checks']['filesystem'] = [
    'status' => $fileSystemHealthy ? 'healthy' : 'unhealthy',
    'directories' => $fileSystemDetails,
    'message' => $fileSystemHealthy ? 'All directories are writable' : 'Some directories are not writable'
];

if (!$fileSystemHealthy) {
    $overallStatus = false;
}

// Check disk space
$diskSpace = disk_free_space(__DIR__);
$totalSpace = disk_total_space(__DIR__);
$usedPercentage = round((($totalSpace - $diskSpace) / $totalSpace) * 100, 2);

$diskStatus = 'healthy';
if ($usedPercentage > 95) {
    $diskStatus = 'critical';
    $overallStatus = false;
} elseif ($usedPercentage > 90) {
    $diskStatus = 'warning';
}

$health['checks']['disk_space'] = [
    'status' => $diskStatus,
    'used_percentage' => $usedPercentage,
    'free_space_gb' => round($diskSpace / (1024 * 1024 * 1024), 2),
    'total_space_gb' => round($totalSpace / (1024 * 1024 * 1024), 2),
    'message' => "Disk usage: {$usedPercentage}%"
];

// Check memory usage  
$memoryUsage = memory_get_usage(true);
$memoryPeak = memory_get_peak_usage(true);
$memoryLimit = ini_get('memory_limit');

if ($memoryLimit !== '-1') {
    $memoryLimitBytes = php_config_value_to_bytes($memoryLimit);
    $memoryPercentage = round(($memoryUsage / $memoryLimitBytes) * 100, 2);
    
    $memoryStatus = 'healthy';
    if ($memoryPercentage > 90) {
        $memoryStatus = 'critical';
    } elseif ($memoryPercentage > 80) {
        $memoryStatus = 'warning';
    }
} else {
    $memoryPercentage = 0;
    $memoryStatus = 'healthy';
}

$health['checks']['memory'] = [
    'status' => $memoryStatus,
    'usage_percentage' => $memoryPercentage,
    'usage_mb' => round($memoryUsage / (1024 * 1024), 2),
    'peak_mb' => round($memoryPeak / (1024 * 1024), 2),
    'limit' => $memoryLimit,
    'message' => "Memory usage: {$memoryPercentage}%"
];

// Check essential files
$essentialFiles = [
    'index.html' => 'Main page',
    'assets/css/base.css' => 'Base styles',
    'assets/js/app.js' => 'Main JavaScript'
];

$filesHealthy = true;
$filesDetails = [];

foreach ($essentialFiles as $file => $description) {
    $fullPath = __DIR__ . '/' . $file;
    
    if (file_exists($fullPath)) {
        $filesDetails[$file] = [
            'status' => 'exists',
            'size_kb' => round(filesize($fullPath) / 1024, 2),
            'modified' => date('c', filemtime($fullPath))
        ];
    } else {
        $filesDetails[$file] = ['status' => 'missing'];
        $filesHealthy = false;
    }
}

$health['checks']['essential_files'] = [
    'status' => $filesHealthy ? 'healthy' : 'unhealthy',
    'files' => $filesDetails,
    'message' => $filesHealthy ? 'All essential files present' : 'Some essential files are missing'
];

if (!$filesHealthy) {
    $overallStatus = false;
}

// Check response time
$startTime = microtime(true);
usleep(1000); // Simulate minimal processing
$responseTime = round((microtime(true) - $startTime) * 1000, 2);

$responseStatus = 'healthy';
if ($responseTime > 100) {
    $responseStatus = 'warning';
} elseif ($responseTime > 200) {
    $responseStatus = 'unhealthy';
}

$health['checks']['response_time'] = [
    'status' => $responseStatus,
    'response_time_ms' => $responseTime,
    'message' => "Health check response time: {$responseTime}ms"
];

// Check web server and environment
$health['checks']['web_server'] = [
    'status' => 'healthy',
    'software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'name' => $_SERVER['SERVER_NAME'] ?? 'Unknown',
    'port' => $_SERVER['SERVER_PORT'] ?? 'Unknown',
    'protocol' => ($_SERVER['HTTPS'] ?? 'off') === 'on' ? 'HTTPS' : 'HTTP'
];

// Set overall status
$health['status'] = $overallStatus ? 'healthy' : 'unhealthy';

// Add comprehensive system metrics
$health['metrics'] = [
    'memory_usage_bytes' => $memoryUsage,
    'memory_peak_bytes' => $memoryPeak,
    'memory_limit' => $memoryLimit,
    'disk_usage_percent' => $usedPercentage,
    'disk_free_gb' => round($diskSpace / (1024 * 1024 * 1024), 2),
    'load_average' => function_exists('sys_getloadavg') ? sys_getloadavg()[0] : null,
    'uptime_seconds' => file_exists('/proc/uptime') ? (float) explode(' ', file_get_contents('/proc/uptime'))[0] : null,
    'php_version' => PHP_VERSION,
    'server_time' => date('c'),
    'timezone' => date_default_timezone_get()
];

// Add deployment information if available
if (file_exists(__DIR__ . '/.git/HEAD')) {
    $gitHead = trim(file_get_contents(__DIR__ . '/.git/HEAD'));
    if (strpos($gitHead, 'ref:') === 0) {
        $refFile = __DIR__ . '/.git/' . substr($gitHead, 5);
        if (file_exists($refFile)) {
            $health['deployment'] = [
                'git_commit' => trim(file_get_contents($refFile)),
                'git_branch' => basename(substr($gitHead, 5))
            ];
        }
    } else {
        $health['deployment'] = [
            'git_commit' => $gitHead,
            'git_branch' => 'detached'
        ];
    }
}

// Return appropriate HTTP status code
http_response_code($overallStatus ? 200 : 503);

// Output JSON response
echo json_encode($health, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

/**
 * Convert PHP config value to bytes
 */
function php_config_value_to_bytes($value) {
    $value = trim($value);
    $last = strtolower($value[strlen($value) - 1]);
    $value = (int) $value;
    
    switch ($last) {
        case 'g':
            $value *= 1024;
        case 'm':
            $value *= 1024;
        case 'k':
            $value *= 1024;
    }
    
    return $value;
}
?>
