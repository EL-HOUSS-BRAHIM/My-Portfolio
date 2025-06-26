<?php
/**
 * Admin Logout Handler
 */

require_once __DIR__ . '/../src/config/Config.php';
require_once __DIR__ . '/../src/config/Database.php';
require_once __DIR__ . '/../src/auth/AdminAuth.php';

$auth = new AdminAuth();

// Logout the user
$auth->logout();

// Redirect to login page with success message
header('Location: login.php?message=logged_out');
exit;
?>
