<?php
/**
 * Simple WebP Image Converter
 * Converts JPG and PNG images to WebP format for better performance
 */

// Configuration
$sourceDir = __DIR__ . '/../assets/images';
$quality = 85; // WebP quality (0-100)

// Check if WebP is supported
if (!function_exists('imagewebp')) {
    die("Error: WebP support is not available in this PHP installation.\n");
}

echo "🖼️  WebP Image Converter\n";
echo "========================\n\n";

// Find all images
$images = glob($sourceDir . '/*.{jpg,jpeg,png,JPG,JPEG,PNG}', GLOB_BRACE);

if (empty($images)) {
    echo "No images found to convert.\n";
    exit(0);
}

echo "Found " . count($images) . " images to convert\n\n";

$converted = 0;
$skipped = 0;
$errors = 0;

foreach ($images as $imagePath) {
    $pathInfo = pathinfo($imagePath);
    $webpPath = $pathInfo['dirname'] . '/' . $pathInfo['filename'] . '.webp';
    
    // Skip if WebP already exists and is newer
    if (file_exists($webpPath) && filemtime($webpPath) >= filemtime($imagePath)) {
        echo "⏭️  Skipped: {$pathInfo['basename']} (WebP already exists)\n";
        $skipped++;
        continue;
    }
    
    // Load source image
    $sourceImage = null;
    $extension = strtolower($pathInfo['extension']);
    
    try {
        if ($extension === 'jpg' || $extension === 'jpeg') {
            $sourceImage = @imagecreatefromjpeg($imagePath);
        } elseif ($extension === 'png') {
            $sourceImage = @imagecreatefrompng($imagePath);
            // Preserve transparency for PNG
            if ($sourceImage) {
                imagealphablending($sourceImage, true);
                imagesavealpha($sourceImage, true);
            }
        }
        
        if (!$sourceImage) {
            echo "❌ Error loading: {$pathInfo['basename']}\n";
            $errors++;
            continue;
        }
        
        // Convert to WebP
        if (imagewebp($sourceImage, $webpPath, $quality)) {
            $originalSize = filesize($imagePath);
            $webpSize = filesize($webpPath);
            $savings = round(($originalSize - $webpSize) / $originalSize * 100, 1);
            
            echo "✅ Converted: {$pathInfo['basename']} → {$pathInfo['filename']}.webp ({$savings}% smaller)\n";
            $converted++;
        } else {
            echo "❌ Failed to convert: {$pathInfo['basename']}\n";
            $errors++;
        }
        
        imagedestroy($sourceImage);
        
    } catch (Exception $e) {
        echo "❌ Error processing {$pathInfo['basename']}: {$e->getMessage()}\n";
        $errors++;
    }
}

echo "\n" . str_repeat("=", 50) . "\n";
echo "Summary:\n";
echo "  ✅ Converted: $converted\n";
echo "  ⏭️  Skipped: $skipped\n";
echo "  ❌ Errors: $errors\n";
echo "\nNote: Original images are preserved. Update HTML to use .webp files with fallback.\n";
