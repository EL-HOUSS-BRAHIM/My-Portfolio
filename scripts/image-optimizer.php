<?php

declare(strict_types=1);

namespace Portfolio\Scripts;

/**
 * Advanced Image Optimization System
 * 
 * Provides comprehensive image optimization including:
 * - WebP conversion with fallbacks
 * - Responsive image generation
 * - Image compression
 * - Lazy loading implementation
 * - Progressive JPEG optimization
 * 
 * @author Brahim El Houss
 * @version 1.0.0
 */
class ImageOptimizer
{
    private string $sourceDir;
    private string $outputDir;
    private array $optimizedImages = [];
    private array $errors = [];
    
    private const SUPPORTED_FORMATS = ['jpg', 'jpeg', 'png', 'gif'];
    private const WEBP_QUALITY = 85;
    private const JPEG_QUALITY = 85;
    private const PNG_COMPRESSION = 6;
    
    private const RESPONSIVE_SIZES = [
        'xs' => 320,   // Mobile portrait
        'sm' => 768,   // Tablet portrait
        'md' => 1024,  // Tablet landscape
        'lg' => 1440,  // Desktop
        'xl' => 1920   // Large desktop
    ];
    
    /**
     * Initialize the image optimizer
     */
    public function __construct(string $sourceDir = null, string $outputDir = null)
    {
        $this->sourceDir = $sourceDir ?? __DIR__ . '/../assets/images';
        $this->outputDir = $outputDir ?? __DIR__ . '/../storage/optimized/images';
        
        // Create output directory if it doesn't exist
        if (!is_dir($this->outputDir)) {
            mkdir($this->outputDir, 0755, true);
        }
    }
    
    /**
     * Run the complete optimization process
     */
    public function optimize(): void
    {
        echo "🖼️  Image Optimization System\n";
        echo "============================\n\n";
        
        $this->checkDependencies();
        $images = $this->findImages();
        
        if (empty($images)) {
            echo "❌ No images found to optimize.\n";
            return;
        }
        
        echo "📁 Found " . count($images) . " images to optimize\n\n";
        
        foreach ($images as $image) {
            $this->processImage($image);
        }
        
        $this->generateLazyLoadingScript();
        $this->generateResponsiveImageCSS();
        $this->generateImageManifest();
        $this->displayResults();
    }
    
    /**
     * Check if required image processing tools are available
     */
    private function checkDependencies(): void
    {
        $required = [
            'gd' => extension_loaded('gd'),
            'webp' => function_exists('imagewebp'),
            'imagick' => extension_loaded('imagick')
        ];
        
        foreach ($required as $dep => $available) {
            if (!$available) {
                echo "⚠️  Warning: {$dep} not available, some optimizations may be skipped\n";
            }
        }
        echo "\n";
    }
    
    /**
     * Find all images in the source directory
     */
    private function findImages(): array
    {
        $images = [];
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($this->sourceDir)
        );
        
        foreach ($iterator as $file) {
            if ($file->isFile()) {
                $extension = strtolower($file->getExtension());
                if (in_array($extension, self::SUPPORTED_FORMATS)) {
                    $images[] = $file->getPathname();
                }
            }
        }
        
        return $images;
    }
    
    /**
     * Process a single image with all optimizations
     */
    private function processImage(string $imagePath): void
    {
        $filename = pathinfo($imagePath, PATHINFO_FILENAME);
        $extension = strtolower(pathinfo($imagePath, PATHINFO_EXTENSION));
        $relativePath = str_replace($this->sourceDir . '/', '', $imagePath);
        
        echo "🔄 Processing: {$relativePath}";
        
        try {
            // Create output subdirectory if needed
            $outputSubdir = dirname($this->outputDir . '/' . $relativePath);
            if (!is_dir($outputSubdir)) {
                mkdir($outputSubdir, 0755, true);
            }
            
            // Load original image
            $originalImage = $this->loadImage($imagePath, $extension);
            if (!$originalImage) {
                throw new \Exception("Failed to load image");
            }
            
            $originalSize = filesize($imagePath);
            $optimizationResults = [
                'original_size' => $originalSize,
                'original_path' => $imagePath,
                'variants' => []
            ];
            
            // Generate responsive sizes
            foreach (self::RESPONSIVE_SIZES as $sizeName => $maxWidth) {
                $resizedImage = $this->resizeImage($originalImage, $maxWidth);
                
                // Save optimized original format
                $originalPath = $this->saveOptimizedImage(
                    $resizedImage,
                    $this->outputDir . '/' . $filename . "-{$sizeName}.{$extension}",
                    $extension
                );
                
                // Save WebP version
                $webpPath = $this->saveWebP(
                    $resizedImage,
                    $this->outputDir . '/' . $filename . "-{$sizeName}.webp"
                );
                
                $optimizationResults['variants'][$sizeName] = [
                    'original' => $originalPath,
                    'webp' => $webpPath,
                    'width' => $maxWidth
                ];
                
                imagedestroy($resizedImage);
            }
            
            // Generate full-size optimized versions
            $fullSizeOptimized = $this->saveOptimizedImage(
                $originalImage,
                $this->outputDir . '/' . $filename . ".{$extension}",
                $extension
            );
            
            $fullSizeWebP = $this->saveWebP(
                $originalImage,
                $this->outputDir . '/' . $filename . ".webp"
            );
            
            $optimizationResults['full_size'] = [
                'original' => $fullSizeOptimized,
                'webp' => $fullSizeWebP
            ];
            
            imagedestroy($originalImage);
            
            $this->optimizedImages[$relativePath] = $optimizationResults;
            echo " ✅\n";
            
        } catch (\Exception $e) {
            $this->errors[] = [
                'file' => $relativePath,
                'error' => $e->getMessage()
            ];
            echo " ❌ Error: {$e->getMessage()}\n";
        }
    }
    
    /**
     * Load image based on format
     */
    private function loadImage(string $path, string $extension)
    {
        switch ($extension) {
            case 'jpg':
            case 'jpeg':
                return imagecreatefromjpeg($path);
            case 'png':
                return imagecreatefrompng($path);
            case 'gif':
                return imagecreatefromgif($path);
            default:
                return false;
        }
    }
    
    /**
     * Resize image while maintaining aspect ratio
     */
    private function resizeImage($image, int $maxWidth)
    {
        $originalWidth = imagesx($image);
        $originalHeight = imagesy($image);
        
        if ($originalWidth <= $maxWidth) {
            // Return copy of original if already smaller
            $newImage = imagecreatetruecolor($originalWidth, $originalHeight);
            imagecopy($newImage, $image, 0, 0, 0, 0, $originalWidth, $originalHeight);
            return $newImage;
        }
        
        $ratio = $maxWidth / $originalWidth;
        $newWidth = $maxWidth;
        $newHeight = (int)($originalHeight * $ratio);
        
        $newImage = imagecreatetruecolor($newWidth, $newHeight);
        
        // Preserve transparency for PNG and GIF
        imagealphablending($newImage, false);
        imagesavealpha($newImage, true);
        
        imagecopyresampled(
            $newImage, $image,
            0, 0, 0, 0,
            $newWidth, $newHeight,
            $originalWidth, $originalHeight
        );
        
        return $newImage;
    }
    
    /**
     * Save optimized image in original format
     */
    private function saveOptimizedImage($image, string $path, string $extension): string
    {
        switch ($extension) {
            case 'jpg':
            case 'jpeg':
                imagejpeg($image, $path, self::JPEG_QUALITY);
                break;
            case 'png':
                imagepng($image, $path, self::PNG_COMPRESSION);
                break;
            case 'gif':
                imagegif($image, $path);
                break;
        }
        
        return $path;
    }
    
    /**
     * Save WebP version of image
     */
    private function saveWebP($image, string $path): string
    {
        if (function_exists('imagewebp')) {
            imagewebp($image, $path, self::WEBP_QUALITY);
            return $path;
        }
        
        return '';
    }
    
    /**
     * Generate lazy loading JavaScript
     */
    private function generateLazyLoadingScript(): void
    {
        $script = <<<'JS'
/**
 * Advanced Lazy Loading System
 * Provides intersection observer-based lazy loading with WebP support
 */
class LazyLoader {
    constructor(options = {}) {
        this.options = {
            rootMargin: '50px 0px',
            threshold: 0.01,
            ...options
        };
        
        this.observer = null;
        this.init();
    }
    
    init() {
        if (!('IntersectionObserver' in window)) {
            // Fallback for older browsers
            this.loadAllImages();
            return;
        }
        
        this.observer = new IntersectionObserver(
            this.handleIntersection.bind(this),
            this.options
        );
        
        this.observeImages();
    }
    
    observeImages() {
        const images = document.querySelectorAll('[data-lazy]');
        images.forEach(img => this.observer.observe(img));
    }
    
    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.loadImage(entry.target);
                this.observer.unobserve(entry.target);
            }
        });
    }
    
    loadImage(img) {
        const webpSrc = img.dataset.webp;
        const fallbackSrc = img.dataset.src;
        
        if (this.supportsWebP() && webpSrc) {
            img.src = webpSrc;
        } else if (fallbackSrc) {
            img.src = fallbackSrc;
        }
        
        img.classList.add('loaded');
        img.removeAttribute('data-lazy');
    }
    
    supportsWebP() {
        if (this._webpSupport !== undefined) {
            return this._webpSupport;
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        
        this._webpSupport = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        return this._webpSupport;
    }
    
    loadAllImages() {
        const images = document.querySelectorAll('[data-lazy]');
        images.forEach(img => this.loadImage(img));
    }
}

// Initialize lazy loader when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new LazyLoader();
});
JS;
        
        file_put_contents($this->outputDir . '/lazy-loader.js', $script);
        echo "📄 Generated lazy loading script\n";
    }
    
    /**
     * Generate responsive image CSS
     */
    private function generateResponsiveImageCSS(): void
    {
        $css = <<<'CSS'
/* Responsive Image System */
.responsive-image {
    max-width: 100%;
    height: auto;
    display: block;
}

.responsive-image[data-lazy] {
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
}

.responsive-image.loaded {
    opacity: 1;
}

/* Loading placeholder */
.responsive-image[data-lazy]:before {
    content: '';
    display: block;
    width: 100%;
    height: 200px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
}

@keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

/* Responsive breakpoints */
@media (max-width: 320px) {
    .responsive-image { max-width: 320px; }
}

@media (min-width: 321px) and (max-width: 768px) {
    .responsive-image { max-width: 768px; }
}

@media (min-width: 769px) and (max-width: 1024px) {
    .responsive-image { max-width: 1024px; }
}

@media (min-width: 1025px) and (max-width: 1440px) {
    .responsive-image { max-width: 1440px; }
}

@media (min-width: 1441px) {
    .responsive-image { max-width: 1920px; }
}
CSS;
        
        file_put_contents($this->outputDir . '/responsive-images.css', $css);
        echo "📄 Generated responsive image CSS\n";
    }
    
    /**
     * Generate image manifest for easy integration
     */
    private function generateImageManifest(): void
    {
        $manifest = [
            'generated_at' => date('Y-m-d H:i:s'),
            'total_images' => count($this->optimizedImages),
            'responsive_sizes' => self::RESPONSIVE_SIZES,
            'images' => $this->optimizedImages
        ];
        
        file_put_contents(
            $this->outputDir . '/image-manifest.json',
            json_encode($manifest, JSON_PRETTY_PRINT)
        );
        echo "📄 Generated image manifest\n";
    }
    
    /**
     * Display optimization results
     */
    private function displayResults(): void
    {
        echo "\n📊 Image Optimization Results\n";
        echo "=============================\n\n";
        
        $totalOriginalSize = 0;
        $totalOptimizedSize = 0;
        $imagesProcessed = count($this->optimizedImages);
        
        foreach ($this->optimizedImages as $image) {
            $totalOriginalSize += $image['original_size'];
            
            // Calculate optimized size (approximate)
            if (isset($image['full_size']['original']) && file_exists($image['full_size']['original'])) {
                $totalOptimizedSize += filesize($image['full_size']['original']);
            }
        }
        
        $sizeSaved = $totalOriginalSize - $totalOptimizedSize;
        $percentSaved = $totalOriginalSize > 0 ? ($sizeSaved / $totalOriginalSize) * 100 : 0;
        
        echo "📁 Images processed: {$imagesProcessed}\n";
        echo "📉 Original size: " . $this->formatBytes($totalOriginalSize) . "\n";
        echo "📈 Optimized size: " . $this->formatBytes($totalOptimizedSize) . "\n";
        echo "💾 Space saved: " . $this->formatBytes($sizeSaved) . " (" . number_format($percentSaved, 1) . "%)\n";
        echo "❌ Errors: " . count($this->errors) . "\n\n";
        
        if (!empty($this->errors)) {
            echo "❌ ERRORS:\n";
            echo "----------\n";
            foreach ($this->errors as $error) {
                echo "📄 {$error['file']}: {$error['error']}\n";
            }
            echo "\n";
        }
        
        echo "🎉 Image optimization complete!\n";
        echo "📁 Optimized images saved to: {$this->outputDir}\n";
        echo "📄 Integration files generated:\n";
        echo "   - lazy-loader.js (JavaScript)\n";
        echo "   - responsive-images.css (CSS)\n";
        echo "   - image-manifest.json (Data)\n\n";
    }
    
    /**
     * Format bytes for human readable output
     */
    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $index = 0;
        
        while ($bytes >= 1024 && $index < count($units) - 1) {
            $bytes /= 1024;
            $index++;
        }
        
        return round($bytes, 2) . ' ' . $units[$index];
    }
}

// Run the optimizer if called directly
if (basename(__FILE__) === basename($_SERVER['SCRIPT_NAME'])) {
    $optimizer = new ImageOptimizer();
    $optimizer->optimize();
}