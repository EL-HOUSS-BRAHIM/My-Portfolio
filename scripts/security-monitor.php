<?php

/**
 * Security Monitor
 * 
 * Monitors and reports security events
 */

$logFile = __DIR__ . '/../storage/logs/security.log';
$reportFile = __DIR__ . '/../storage/logs/security-report.html';

if (!file_exists($logFile)) {
    echo "No security log found.\n";
    exit(0);
}

echo "🛡️ Security Monitor Report\n";
echo "=========================\n\n";

$events = [];
$lines = file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

foreach ($lines as $line) {
    $event = json_decode($line, true);
    if ($event) {
        $events[] = $event;
    }
}

// Analyze events
$summary = [
    'total_events' => count($events),
    'unique_ips' => count(array_unique(array_column($events, 'ip'))),
    'event_types' => array_count_values(array_column($events, 'event')),
    'recent_events' => 0,
    'high_risk_events' => 0
];

$now = time();
$highRiskEvents = ['csrf_token_invalid', 'rate_limit_exceeded', 'suspicious_file_upload', 'sql_injection_attempt'];

foreach ($events as $event) {
    $eventTime = strtotime($event['timestamp']);
    
    // Count recent events (last 24 hours)
    if ($now - $eventTime < 86400) {
        $summary['recent_events']++;
    }
    
    // Count high-risk events
    if (in_array($event['event'], $highRiskEvents)) {
        $summary['high_risk_events']++;
    }
}

// Display summary
echo "📊 Summary:\n";
echo "  Total events: {$summary['total_events']}\n";
echo "  Unique IPs: {$summary['unique_ips']}\n";
echo "  Recent events (24h): {$summary['recent_events']}\n";
echo "  High-risk events: {$summary['high_risk_events']}\n\n";

echo "📈 Event Types:\n";
foreach ($summary['event_types'] as $type => $count) {
    echo "  $type: $count\n";
}

// Top IPs
echo "\n🌐 Top IPs:\n";
$ipCounts = array_count_values(array_column($events, 'ip'));
arsort($ipCounts);
$topIps = array_slice($ipCounts, 0, 10, true);

foreach ($topIps as $ip => $count) {
    echo "  $ip: $count events\n";
}

// Recent high-risk events
echo "\n⚠️ Recent High-Risk Events:\n";
$recentHighRisk = array_filter($events, function($event) use ($now, $highRiskEvents) {
    return in_array($event['event'], $highRiskEvents) && 
           $now - strtotime($event['timestamp']) < 86400;
});

if (empty($recentHighRisk)) {
    echo "  No high-risk events in the last 24 hours.\n";
} else {
    foreach (array_slice($recentHighRisk, 0, 10) as $event) {
        echo "  {$event['timestamp']}: {$event['event']} from {$event['ip']}\n";
    }
}

// Generate HTML report
generateHtmlReport($events, $summary, $reportFile);

echo "\n✅ Security monitoring completed!\n";
echo "📊 Full report available at: storage/logs/security-report.html\n";

function generateHtmlReport($events, $summary, $reportFile) {
    ob_start();
    ?>
    <!DOCTYPE html>
    <html>
    <head>
        <title>Security Report</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .metric { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
            .high-risk { background: #ffebee; }
            .medium-risk { background: #fff3e0; }
            .low-risk { background: #e8f5e8; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
        </style>
    </head>
    <body>
        <h1>Security Report</h1>
        <p>Generated: <?= date('Y-m-d H:i:s') ?></p>
        
        <h2>Summary</h2>
        <div class="metric">Total Events: <?= $summary['total_events'] ?></div>
        <div class="metric">Unique IPs: <?= $summary['unique_ips'] ?></div>
        <div class="metric">Recent Events (24h): <?= $summary['recent_events'] ?></div>
        <div class="metric <?= $summary['high_risk_events'] > 0 ? 'high-risk' : 'low-risk' ?>">
            High-Risk Events: <?= $summary['high_risk_events'] ?>
        </div>
        
        <h2>Event Types</h2>
        <table>
            <tr><th>Event Type</th><th>Count</th></tr>
            <?php foreach ($summary['event_types'] as $type => $count): ?>
            <tr><td><?= htmlspecialchars($type) ?></td><td><?= $count ?></td></tr>
            <?php endforeach; ?>
        </table>
        
        <h2>Recent Events</h2>
        <table>
            <tr><th>Timestamp</th><th>Event</th><th>IP</th><th>User Agent</th></tr>
            <?php foreach (array_slice($events, -20) as $event): ?>
            <tr>
                <td><?= htmlspecialchars($event['timestamp']) ?></td>
                <td><?= htmlspecialchars($event['event']) ?></td>
                <td><?= htmlspecialchars($event['ip']) ?></td>
                <td><?= htmlspecialchars(substr($event['user_agent'], 0, 50)) ?>...</td>
            </tr>
            <?php endforeach; ?>
        </table>
    </body>
    </html>
    <?php
    $html = ob_get_clean();
    file_put_contents($reportFile, $html);
}
