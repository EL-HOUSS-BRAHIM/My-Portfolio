<?php
/** Lightweight legacy deployment guard; Composer audit runs separately. */
$root = dirname(__DIR__);
$issues = [];
foreach (['src/config/Config.php', 'src/config/Database.php', 'src/auth/AdminAuth.php'] as $path) {
    if (!is_file($root . '/' . $path)) {
        $issues[] = 'Required application file is missing: ' . $path;
    }
}
if (getenv('APP_ENV') === 'production' && filter_var(getenv('APP_DEBUG'), FILTER_VALIDATE_BOOLEAN)) {
    $issues[] = 'APP_DEBUG must be disabled in production.';
}
foreach ($issues as $issue) {
    fwrite(STDERR, $issue . PHP_EOL);
}
exit(count($issues) ? 1 : 0);
