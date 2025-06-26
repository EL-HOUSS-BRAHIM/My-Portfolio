<?php
/**
 * Admin Index - Redirects to appropriate page
 */

require_once __DIR__ . '/../src/config/Config.php';
require_once __DIR__ . '/../src/config/Database.php';
require_once __DIR__ . '/../src/auth/AdminAuth.php';

$auth = new AdminAuth();

// Redirect based on authentication status
if ($auth->isAuthenticated()) {
    header('Location: dashboard.php');
} else {
    header('Location: login.php');
}
exit;
?>
