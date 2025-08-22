<?php

declare(strict_types=1);

/**
 * PHP Code Quality Checker
 * 
 * Basic PHP linting and code quality checks for the portfolio project.
 * This script checks for common PHP issues and coding standard violations.
 * 
 * @author Brahim El Houss
 * @version 1.0.0
 */

class PHPLintChecker
{
    private array $errors = [];
    private array $warnings = [];
    private int $filesChecked = 0;
    
    private const EXCLUDED_DIRS = [
        'vendor',
        'storage/cache',
        'storage/logs',
        'PHPMailer'
    ];
    
    private const EXCLUDED_FILES = [
        'composer.lock',
        'autoload.php'
    ];
    
    /**
     * Main execution method
     */
    public function run(): void
    {
        echo "🔍 PHP Code Quality Checker\n";
        echo "==========================\n\n";
        
        $files = $this->findPHPFiles();
        
        if (empty($files)) {
            echo "❌ No PHP files found to check.\n";
            return;
        }
        
        echo "📁 Found " . count($files) . " PHP files to check\n\n";
        
        foreach ($files as $file) {
            $this->checkFile($file);
        }
        
        $this->displayResults();
    }
    
    /**
     * Find all PHP files in the project
     */
    private function findPHPFiles(): array
    {
        $files = [];
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator(__DIR__ . '/..')
        );
        
        foreach ($iterator as $file) {
            if ($file->isFile() && $file->getExtension() === 'php') {
                $relativePath = str_replace(__DIR__ . '/../', '', $file->getPathname());
                
                if ($this->shouldCheckFile($relativePath)) {
                    $files[] = $file->getPathname();
                }
            }
        }
        
        return $files;
    }
    
    /**
     * Check if file should be included in linting
     */
    private function shouldCheckFile(string $relativePath): bool
    {
        // Check excluded directories
        foreach (self::EXCLUDED_DIRS as $excludedDir) {
            if (strpos($relativePath, $excludedDir) === 0) {
                return false;
            }
        }
        
        // Check excluded files
        $filename = basename($relativePath);
        if (in_array($filename, self::EXCLUDED_FILES)) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Check individual PHP file
     */
    private function checkFile(string $filePath): void
    {
        $this->filesChecked++;
        $relativePath = str_replace(__DIR__ . '/../', '', $filePath);
        
        echo "🔍 Checking: {$relativePath}";
        
        // Basic syntax check
        $syntaxCheck = shell_exec("php -l " . escapeshellarg($filePath) . " 2>&1");
        
        if (strpos($syntaxCheck, 'No syntax errors') === false) {
            $this->errors[] = [
                'file' => $relativePath,
                'type' => 'SYNTAX_ERROR',
                'message' => trim($syntaxCheck)
            ];
            echo " ❌\n";
            return;
        }
        
        // Read file content for additional checks
        $content = file_get_contents($filePath);
        $lines = explode("\n", $content);
        
        $this->checkPSR12Compliance($relativePath, $content, $lines);
        $this->checkSecurityIssues($relativePath, $content, $lines);
        $this->checkCodeQuality($relativePath, $content, $lines);
        
        echo " ✅\n";
    }
    
    /**
     * Check PSR-12 compliance
     */
    private function checkPSR12Compliance(string $file, string $content, array $lines): void
    {
        // Check for declare(strict_types=1)
        if (!preg_match('/declare\s*\(\s*strict_types\s*=\s*1\s*\)/', $content)) {
            $this->warnings[] = [
                'file' => $file,
                'type' => 'PSR12_MISSING_STRICT_TYPES',
                'message' => 'Missing declare(strict_types=1)'
            ];
        }
        
        // Check for proper opening tags
        if (!str_starts_with(trim($content), '<?php')) {
            $this->errors[] = [
                'file' => $file,
                'type' => 'PSR12_OPENING_TAG',
                'message' => 'File must start with <?php tag'
            ];
        }
        
        // Check for namespace (if not a simple script)
        $fileSize = strlen($content);
        if ($fileSize > 1000 && !preg_match('/namespace\s+[A-Za-z\\\\]+;/', $content)) {
            $this->warnings[] = [
                'file' => $file,
                'type' => 'PSR12_MISSING_NAMESPACE',
                'message' => 'Consider adding namespace for better organization'
            ];
        }
        
        // Check for closing PHP tags in pure PHP files
        if (preg_match('/\?\>\s*$/', $content)) {
            $this->warnings[] = [
                'file' => $file,
                'type' => 'PSR12_CLOSING_TAG',
                'message' => 'Closing PHP tag not recommended in pure PHP files'
            ];
        }
    }
    
    /**
     * Check for common security issues
     */
    private function checkSecurityIssues(string $file, string $content, array $lines): void
    {
        // Check for potential SQL injection
        if (preg_match('/\$\w+\s*\.\s*["\'][^"\']*\$/', $content)) {
            $this->warnings[] = [
                'file' => $file,
                'type' => 'SECURITY_SQL_INJECTION',
                'message' => 'Potential SQL injection risk - use prepared statements'
            ];
        }
        
        // Check for eval() usage
        if (preg_match('/\beval\s*\(/', $content)) {
            $this->errors[] = [
                'file' => $file,
                'type' => 'SECURITY_EVAL',
                'message' => 'eval() is dangerous and should be avoided'
            ];
        }
        
        // Check for unescaped output
        if (preg_match('/echo\s+\$\w+(?!\s*;)/', $content)) {
            $this->warnings[] = [
                'file' => $file,
                'type' => 'SECURITY_XSS',
                'message' => 'Consider escaping output to prevent XSS'
            ];
        }
    }
    
    /**
     * Check general code quality
     */
    private function checkCodeQuality(string $file, string $content, array $lines): void
    {
        // Check for TODO/FIXME comments
        foreach ($lines as $lineNum => $line) {
            if (preg_match('/(TODO|FIXME|HACK|XXX)/i', $line)) {
                $this->warnings[] = [
                    'file' => $file,
                    'type' => 'CODE_QUALITY_TODO',
                    'message' => 'TODO/FIXME found on line ' . ($lineNum + 1)
                ];
            }
        }
        
        // Check for debug statements
        if (preg_match('/(var_dump|print_r|die|exit)\s*\(/', $content)) {
            $this->warnings[] = [
                'file' => $file,
                'type' => 'CODE_QUALITY_DEBUG',
                'message' => 'Debug statements found - consider removing for production'
            ];
        }
        
        // Check for missing PHPDoc
        $classMatches = preg_match_all('/class\s+\w+/', $content);
        $methodMatches = preg_match_all('/public\s+function\s+\w+/', $content);
        $docMatches = preg_match_all('/\/\*\*.*?\*\//s', $content);
        
        if (($classMatches + $methodMatches) > $docMatches) {
            $this->warnings[] = [
                'file' => $file,
                'type' => 'CODE_QUALITY_DOCUMENTATION',
                'message' => 'Consider adding PHPDoc comments for better documentation'
            ];
        }
    }
    
    /**
     * Display results summary
     */
    private function displayResults(): void
    {
        echo "\n📊 Code Quality Results\n";
        echo "======================\n\n";
        
        echo "📁 Files checked: {$this->filesChecked}\n";
        echo "❌ Errors: " . count($this->errors) . "\n";
        echo "⚠️  Warnings: " . count($this->warnings) . "\n\n";
        
        if (!empty($this->errors)) {
            echo "❌ ERRORS:\n";
            echo "----------\n";
            foreach ($this->errors as $error) {
                echo "📄 {$error['file']}\n";
                echo "   Type: {$error['type']}\n";
                echo "   Message: {$error['message']}\n\n";
            }
        }
        
        if (!empty($this->warnings)) {
            echo "⚠️  WARNINGS:\n";
            echo "------------\n";
            foreach ($this->warnings as $warning) {
                echo "📄 {$warning['file']}\n";
                echo "   Type: {$warning['type']}\n";
                echo "   Message: {$warning['message']}\n\n";
            }
        }
        
        if (empty($this->errors) && empty($this->warnings)) {
            echo "🎉 Great! No issues found.\n\n";
        }
        
        // Exit with error code if there are errors
        if (!empty($this->errors)) {
            exit(1);
        }
    }
}

// Run the checker
$checker = new PHPLintChecker();
$checker->run();