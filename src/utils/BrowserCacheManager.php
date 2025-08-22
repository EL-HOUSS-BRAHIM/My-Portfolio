<?php

declare(strict_types=1);

namespace Portfolio\Cache;

/**
 * Advanced Browser Cache Manager
 * 
 * Provides comprehensive caching functionality including:
 * - Cache headers management
 * - ETags and Last-Modified support
 * - Cache invalidation
 * - Performance monitoring
 * - Browser cache optimization
 * 
 * @author Brahim El Houss
 * @version 1.0.0
 */
class BrowserCacheManager
{
    private array $config;
    private string $cacheDir;
    private array $stats = [];
    
    private const DEFAULT_CONFIG = [
        'enable_compression' => true,
        'enable_etags' => true,
        'default_max_age' => 3600, // 1 hour
        'static_max_age' => 31536000, // 1 year
        'dynamic_max_age' => 300, // 5 minutes
        'immutable_assets' => true,
        'vary_header' => 'Accept-Encoding, Accept',
    ];
    
    private const CACHE_PATTERNS = [
        'static_long' => [
            'extensions' => ['css', 'js', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'avif', 'woff', 'woff2', 'ttf', 'otf', 'eot'],
            'max_age' => 31536000, // 1 year
            'immutable' => true,
        ],
        'static_medium' => [
            'extensions' => ['ico', 'xml', 'json'],
            'max_age' => 86400, // 1 day
            'immutable' => false,
        ],
        'dynamic' => [
            'extensions' => ['php', 'html'],
            'max_age' => 3600, // 1 hour
            'immutable' => false,
            'must_revalidate' => true,
        ],
        'api' => [
            'extensions' => [],
            'patterns' => ['/api/', '/src/api/'],
            'max_age' => 300, // 5 minutes
            'immutable' => false,
            'must_revalidate' => true,
        ],
        'no_cache' => [
            'extensions' => ['htaccess', 'htpasswd', 'ini', 'log', 'sql'],
            'max_age' => 0,
            'no_cache' => true,
        ],
    ];
    
    /**
     * Initialize cache manager
     */
    public function __construct(array $config = [])
    {
        $this->config = array_merge(self::DEFAULT_CONFIG, $config);
        $this->cacheDir = __DIR__ . '/../../storage/cache';
        
        if (!is_dir($this->cacheDir)) {
            mkdir($this->cacheDir, 0755, true);
        }
    }
    
    /**
     * Set optimal cache headers for current request
     */
    public function setCacheHeaders(string $filePath = null, string $contentType = null): void
    {
        $filePath = $filePath ?? $_SERVER['REQUEST_URI'] ?? '';
        $pattern = $this->determineCachePattern($filePath);
        
        // Don't set cache headers if already sent
        if (headers_sent()) {
            return;
        }
        
        $this->setBasicHeaders($pattern, $filePath);
        $this->setCompressionHeaders();
        $this->setValidationHeaders($filePath);
        $this->setSecurityHeaders($pattern);
        
        $this->stats['headers_set'] = true;
        $this->stats['pattern'] = $pattern;
        $this->stats['file_path'] = $filePath;
    }
    
    /**
     * Determine cache pattern for file
     */
    private function determineCachePattern(string $filePath): string
    {
        $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        
        // Check for versioned assets (immutable)
        if (preg_match('/\.(v\d+|[a-f0-9]{8,})\.(css|js|png|jpg|jpeg|gif|svg|webp|avif|woff|woff2|ttf|otf|eot)$/i', $filePath)) {
            return 'static_long';
        }
        
        // Check patterns
        foreach (self::CACHE_PATTERNS as $patternName => $pattern) {
            if (isset($pattern['extensions']) && in_array($extension, $pattern['extensions'])) {
                return $patternName;
            }
            
            if (isset($pattern['patterns'])) {
                foreach ($pattern['patterns'] as $pathPattern) {
                    if (strpos($filePath, $pathPattern) !== false) {
                        return $patternName;
                    }
                }
            }
        }
        
        return 'dynamic';
    }
    
    /**
     * Set basic cache control headers
     */
    private function setBasicHeaders(string $pattern, string $filePath): void
    {
        $config = self::CACHE_PATTERNS[$pattern];
        
        if (isset($config['no_cache']) && $config['no_cache']) {
            header('Cache-Control: no-cache, no-store, must-revalidate');
            header('Pragma: no-cache');
            header('Expires: 0');
            return;
        }
        
        $cacheControl = ['public'];
        
        if (isset($config['max_age'])) {
            $cacheControl[] = 'max-age=' . $config['max_age'];
        }
        
        if (isset($config['immutable']) && $config['immutable']) {
            $cacheControl[] = 'immutable';
        }
        
        if (isset($config['must_revalidate']) && $config['must_revalidate']) {
            $cacheControl[] = 'must-revalidate';
        }
        
        header('Cache-Control: ' . implode(', ', $cacheControl));
        
        // Set Expires header
        if (isset($config['max_age']) && $config['max_age'] > 0) {
            $expires = gmdate('D, d M Y H:i:s', time() + $config['max_age']) . ' GMT';
            header('Expires: ' . $expires);
        }
        
        // Vary header
        if ($this->config['vary_header']) {
            header('Vary: ' . $this->config['vary_header']);
        }
    }
    
    /**
     * Set compression headers
     */
    private function setCompressionHeaders(): void
    {
        if (!$this->config['enable_compression']) {
            return;
        }
        
        $acceptEncoding = $_SERVER['HTTP_ACCEPT_ENCODING'] ?? '';
        
        // Check if client supports compression
        if (strpos($acceptEncoding, 'gzip') !== false && function_exists('gzencode')) {
            header('Content-Encoding: gzip');
        } elseif (strpos($acceptEncoding, 'deflate') !== false && function_exists('gzdeflate')) {
            header('Content-Encoding: deflate');
        }
    }
    
    /**
     * Set validation headers (ETag, Last-Modified)
     */
    private function setValidationHeaders(string $filePath): void
    {
        if (!$this->config['enable_etags']) {
            return;
        }
        
        $realPath = $this->getRealFilePath($filePath);
        
        if ($realPath && file_exists($realPath)) {
            $mtime = filemtime($realPath);
            $size = filesize($realPath);
            
            // Generate ETag
            $etag = '"' . md5($mtime . $size . $realPath) . '"';
            header('ETag: ' . $etag);
            
            // Set Last-Modified
            $lastModified = gmdate('D, d M Y H:i:s', $mtime) . ' GMT';
            header('Last-Modified: ' . $lastModified);
            
            // Check if client has cached version
            $this->checkClientCache($etag, $mtime);
        }
    }
    
    /**
     * Get real file path from request URI
     */
    private function getRealFilePath(string $filePath): ?string
    {
        // Remove query string
        $filePath = strtok($filePath, '?');
        
        // Remove leading slash
        $filePath = ltrim($filePath, '/');
        
        // Convert to absolute path
        $realPath = __DIR__ . '/../../' . $filePath;
        
        return file_exists($realPath) ? $realPath : null;
    }
    
    /**
     * Check client cache and send 304 if not modified
     */
    private function checkClientCache(string $etag, int $mtime): void
    {
        $clientEtag = $_SERVER['HTTP_IF_NONE_MATCH'] ?? '';
        $clientMtime = $_SERVER['HTTP_IF_MODIFIED_SINCE'] ?? '';
        
        // Check ETag
        if ($clientEtag && $clientEtag === $etag) {
            $this->send304();
            return;
        }
        
        // Check Last-Modified
        if ($clientMtime) {
            $clientTimestamp = strtotime($clientMtime);
            if ($clientTimestamp && $clientTimestamp >= $mtime) {
                $this->send304();
                return;
            }
        }
    }
    
    /**
     * Send 304 Not Modified response
     */
    private function send304(): void
    {
        http_response_code(304);
        $this->stats['cache_hit'] = true;
        exit;
    }
    
    /**
     * Set security headers for caching
     */
    private function setSecurityHeaders(string $pattern): void
    {
        // Add security headers that don't interfere with caching
        if ($pattern === 'no_cache') {
            header('X-Content-Type-Options: nosniff');
            header('X-Frame-Options: DENY');
        }
        
        // CORS headers for fonts
        if (in_array($pattern, ['static_long']) && $this->isFontFile($_SERVER['REQUEST_URI'] ?? '')) {
            header('Access-Control-Allow-Origin: *');
            header('Access-Control-Allow-Methods: GET');
            header('Access-Control-Allow-Headers: Content-Type');
        }
    }
    
    /**
     * Check if file is a font file
     */
    private function isFontFile(string $filePath): bool
    {
        $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        return in_array($extension, ['woff', 'woff2', 'ttf', 'otf', 'eot']);
    }
    
    /**
     * Invalidate cache for specific pattern or file
     */
    public function invalidateCache(string $pattern = null, string $filePath = null): bool
    {
        $invalidated = 0;
        
        if ($filePath) {
            // Invalidate specific file
            $cacheKey = md5($filePath);
            $cacheFile = $this->cacheDir . '/' . $cacheKey . '.cache';
            
            if (file_exists($cacheFile)) {
                unlink($cacheFile);
                $invalidated++;
            }
        } elseif ($pattern) {
            // Invalidate by pattern
            $files = glob($this->cacheDir . '/*.cache');
            foreach ($files as $file) {
                $metadata = json_decode(file_get_contents($file), true);
                if (isset($metadata['pattern']) && $metadata['pattern'] === $pattern) {
                    unlink($file);
                    $invalidated++;
                }
            }
        } else {
            // Clear all cache
            $files = glob($this->cacheDir . '/*.cache');
            foreach ($files as $file) {
                unlink($file);
                $invalidated++;
            }
        }
        
        $this->stats['invalidated'] = $invalidated;
        return $invalidated > 0;
    }
    
    /**
     * Get cache statistics
     */
    public function getStats(): array
    {
        return $this->stats;
    }
    
    /**
     * Generate cache report
     */
    public function generateReport(): array
    {
        $report = [
            'cache_enabled' => true,
            'compression_enabled' => $this->config['enable_compression'],
            'etags_enabled' => $this->config['enable_etags'],
            'patterns' => array_keys(self::CACHE_PATTERNS),
            'stats' => $this->stats,
        ];
        
        // Add cache directory info
        if (is_dir($this->cacheDir)) {
            $files = glob($this->cacheDir . '/*');
            $report['cache_files'] = count($files);
            $report['cache_size'] = array_sum(array_map('filesize', $files));
        }
        
        return $report;
    }
    
    /**
     * Optimize cache headers for specific file types
     */
    public static function optimizeForFileType(string $filePath): void
    {
        $manager = new self();
        $manager->setCacheHeaders($filePath);
    }
    
    /**
     * Middleware function for frameworks
     */
    public function middleware(callable $next)
    {
        return function ($request, $response) use ($next) {
            $this->setCacheHeaders($request->getUri()->getPath());
            return $next($request, $response);
        };
    }
}

/**
 * Cache helper functions
 */
class CacheHelper
{
    /**
     * Generate versioned asset URL
     */
    public static function asset(string $path): string
    {
        $realPath = __DIR__ . '/../../' . ltrim($path, '/');
        
        if (file_exists($realPath)) {
            $mtime = filemtime($realPath);
            $hash = substr(md5($mtime), 0, 8);
            
            $pathInfo = pathinfo($path);
            return $pathInfo['dirname'] . '/' . $pathInfo['filename'] . '.' . $hash . '.' . $pathInfo['extension'];
        }
        
        return $path;
    }
    
    /**
     * Generate preload link header
     */
    public static function preload(string $path, string $as = 'style', array $attributes = []): string
    {
        $link = '<' . $path . '>; rel=preload; as=' . $as;
        
        foreach ($attributes as $key => $value) {
            $link .= '; ' . $key . '=' . $value;
        }
        
        return $link;
    }
    
    /**
     * Check if browser supports modern formats
     */
    public static function supportsWebP(): bool
    {
        $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
        return strpos($accept, 'image/webp') !== false;
    }
    
    public static function supportsAvif(): bool
    {
        $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
        return strpos($accept, 'image/avif') !== false;
    }
}