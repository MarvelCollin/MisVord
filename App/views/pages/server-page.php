<?php
error_log("SERVER PAGE LOADED");

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!function_exists('asset')) {
    require_once dirname(dirname(__DIR__)) . '/config/helpers.php';
}

if (!isset($_SESSION['user_id'])) {
    header('Location: /login');
    exit;
}

$page_title = 'misvord - Server';
$body_class = 'bg-discord-dark text-white overflow-hidden';
$page_css = 'server-page';
$page_js = 'server-page';
$additional_js = [
    'server-dropdown.js',
    'server-sidebar.js',
    'message-handler.js',
    'components/channel-manager.js',
    'lazy-loader.js'
];
$contentType = 'server';
$currentServer = $GLOBALS['currentServer'] ?? null;
$data_page = 'server';

if (isset($GLOBALS['currentServer'])) {
    error_log("Current server data: " . json_encode([
        'id' => $GLOBALS['currentServer']->id,
        'name' => $GLOBALS['currentServer']->name
    ]));
} else {
    error_log("ERROR: No current server set in GLOBALS");
    
    // Check if coming from a route parameter
    if (isset($params['id'])) {
        error_log("Server ID from route params: " . $params['id']);
    }
}
?>

<?php ob_start(); ?>

<?php include dirname(dirname(__DIR__)) . '/views/components/app-sections/app-layout.php'; ?>

<?php 
$content = ob_get_clean(); 
include dirname(dirname(__DIR__)) . '/views/layout/main-app.php';
?>
