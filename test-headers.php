<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Header Test - SEO & Crawler Readiness</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
        }
        .header p {
            opacity: 0.9;
            font-size: 14px;
        }
        .content {
            padding: 30px;
        }
        .section {
            margin-bottom: 30px;
            border-left: 4px solid #667eea;
            padding-left: 20px;
        }
        .section h2 {
            color: #333;
            font-size: 20px;
            margin-bottom: 15px;
        }
        .header-item {
            background: #f8f9fa;
            padding: 12px 15px;
            margin-bottom: 10px;
            border-radius: 5px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .header-name {
            font-weight: 600;
            color: #495057;
        }
        .header-value {
            color: #6c757d;
            font-family: monospace;
            font-size: 13px;
            word-break: break-all;
            text-align: right;
            max-width: 60%;
        }
        .status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-left: 10px;
        }
        .status.success {
            background: #d4edda;
            color: #155724;
        }
        .status.warning {
            background: #fff3cd;
            color: #856404;
        }
        .status.error {
            background: #f8d7da;
            color: #721c24;
        }
        .icon {
            margin-right: 5px;
        }
        .summary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
        }
        .summary h3 {
            margin-bottom: 15px;
        }
        .summary-item {
            padding: 8px 0;
            border-bottom: 1px solid rgba(255,255,255,0.2);
        }
        .summary-item:last-child {
            border-bottom: none;
        }
        .btn {
            background: #667eea;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            text-decoration: none;
            display: inline-block;
            margin-top: 10px;
        }
        .btn:hover {
            background: #5568d3;
        }
        code {
            background: #f8f9fa;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: monospace;
            font-size: 13px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Header Validation Test</h1>
            <p>SEO & Crawler Readiness Check</p>
        </div>
        
        <div class="content">
            <?php
            // Set crawler-friendly headers (already done in index.php)
            
            // Get all response headers
            $headers = [];
            
            // SEO Headers
            $seoHeaders = [
                'X-Robots-Tag' => headers_list(),
                'Cache-Control' => headers_list(),
                'Last-Modified' => headers_list(),
                'ETag' => headers_list(),
                'Vary' => headers_list(),
                'Content-Type' => headers_list()
            ];
            
            // Security Headers
            $securityHeaders = [
                'Strict-Transport-Security' => headers_list(),
                'X-Content-Type-Options' => headers_list(),
                'X-Frame-Options' => headers_list(),
                'Referrer-Policy' => headers_list(),
                'Content-Security-Policy' => headers_list()
            ];
            
            // Extract actual headers
            $allHeaders = [];
            foreach (headers_list() as $header) {
                $parts = explode(':', $header, 2);
                if (count($parts) === 2) {
                    $allHeaders[trim($parts[0])] = trim($parts[1]);
                }
            }
            
            function checkHeader($name, $allHeaders) {
                if (isset($allHeaders[$name])) {
                    return ['status' => 'success', 'value' => $allHeaders[$name]];
                }
                return ['status' => 'error', 'value' => 'Not set'];
            }
            
            function getStatusBadge($status) {
                $icons = [
                    'success' => '✓',
                    'warning' => '⚠',
                    'error' => '✗'
                ];
                return '<span class="status ' . $status . '"><span class="icon">' . $icons[$status] . '</span>' . ucfirst($status) . '</span>';
            }
            ?>
            
            <div class="section">
                <h2>🎯 Critical SEO Headers</h2>
                <?php
                $criticalHeaders = [
                    'X-Robots-Tag' => 'Tells crawlers how to index',
                    'Cache-Control' => 'Cache behavior for crawlers',
                    'Vary' => 'Helps with cache variations',
                    'Last-Modified' => 'Helps crawlers detect changes',
                    'ETag' => 'Efficient cache validation',
                    'Content-Type' => 'Content type declaration'
                ];
                
                foreach ($criticalHeaders as $header => $description) {
                    $result = checkHeader($header, $allHeaders);
                    echo '<div class="header-item">';
                    echo '<div>';
                    echo '<span class="header-name">' . htmlspecialchars($header) . '</span>';
                    echo getStatusBadge($result['status']);
                    echo '<br><small style="color: #6c757d;">' . $description . '</small>';
                    echo '</div>';
                    echo '<div class="header-value">' . htmlspecialchars($result['value']) . '</div>';
                    echo '</div>';
                }
                ?>
            </div>
            
            <div class="section">
                <h2>🔒 Security Headers</h2>
                <?php
                $secHeaders = [
                    'Strict-Transport-Security' => 'HTTPS enforcement',
                    'X-Content-Type-Options' => 'MIME type protection',
                    'X-Frame-Options' => 'Clickjacking protection',
                    'Referrer-Policy' => 'Referrer control',
                    'Content-Security-Policy' => 'XSS protection'
                ];
                
                foreach ($secHeaders as $header => $description) {
                    $result = checkHeader($header, $allHeaders);
                    echo '<div class="header-item">';
                    echo '<div>';
                    echo '<span class="header-name">' . htmlspecialchars($header) . '</span>';
                    echo getStatusBadge($result['status']);
                    echo '<br><small style="color: #6c757d;">' . $description . '</small>';
                    echo '</div>';
                    echo '<div class="header-value">' . htmlspecialchars(substr($result['value'], 0, 50)) . '...</div>';
                    echo '</div>';
                }
                ?>
            </div>
            
            <div class="section">
                <h2>📄 All Response Headers</h2>
                <?php
                foreach ($allHeaders as $name => $value) {
                    echo '<div class="header-item">';
                    echo '<span class="header-name">' . htmlspecialchars($name) . '</span>';
                    echo '<span class="header-value">' . htmlspecialchars($value) . '</span>';
                    echo '</div>';
                }
                ?>
            </div>
            
            <div class="summary">
                <h3>📊 Summary & Next Steps</h3>
                <div class="summary-item">
                    <strong>Status:</strong> 
                    <?php
                    $hasXRobots = isset($allHeaders['X-Robots-Tag']);
                    $hasCacheControl = isset($allHeaders['Cache-Control']);
                    $hasVary = isset($allHeaders['Vary']);
                    
                    if ($hasXRobots && $hasCacheControl && $hasVary) {
                        echo '<span style="color: #d4edda;">✓ Ready for crawlers!</span>';
                    } else {
                        echo '<span style="color: #fff3cd;">⚠ Some headers missing</span>';
                    }
                    ?>
                </div>
                <div class="summary-item">
                    <strong>Test Commands:</strong><br>
                    • <code>curl -I https://your-domain.com</code><br>
                    • <code>./scripts/validate-headers.sh https://your-domain.com</code>
                </div>
                <div class="summary-item">
                    <strong>Google Search Console:</strong><br>
                    Ready to submit your site for indexing!
                </div>
            </div>
            
            <a href="/" class="btn">← Back to Home</a>
            <a href="<?php echo $_SERVER['PHP_SELF']; ?>" class="btn">🔄 Refresh Test</a>
        </div>
    </div>
</body>
</html>
