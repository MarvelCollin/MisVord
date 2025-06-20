<?php
require_once dirname(dirname(__DIR__)) . '/config/session.php';

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

$currentServer = $GLOBALS['server'] ?? $GLOBALS['currentServer'] ?? null;
$serverName = $currentServer ? $currentServer->name : 'Unknown Server';

$page_title = 'misvord - ' . $serverName;
$body_class = 'bg-discord-dark text-white';
$page_css = 'app';
$page_js = 'pages/app';
$head_scripts = ['logger-init'];
$additional_js = [
    'components/servers/server-dropdown',
    'components/servers/channel-redirect',
    'components/channels/channel-manager',
    'components/messaging/messaging',
    'pages/server-page'
];
$contentType = 'server';
$data_page = 'server';
$body_attributes = 'data-initial-load="true"';

if (isset($GLOBALS['currentServer'])) {    log_debug("Current server data", [
        'id' => $GLOBALS['currentServer']->id,
        'name' => $GLOBALS['currentServer']->name
    ]);
} else {
    log_warning("No current server set in GLOBALS");
}
?>

<?php ob_start(); ?>

<?php include dirname(dirname(__DIR__)) . '/views/components/app-sections/app-layout.php'; ?>

<?php include dirname(dirname(__DIR__)) . '/views/components/app-sections/create-server-modal.php'; ?>

<?php 
$content = ob_get_clean(); 
include dirname(dirname(__DIR__)) . '/views/layout/main-app.php';
?>