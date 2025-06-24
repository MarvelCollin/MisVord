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

$GLOBALS['isLoading'] = isset($_GET['loading']) && $_GET['loading'] === 'true';

$page_title = 'misvord - ' . $serverName;
$body_class = 'bg-discord-dark text-white';
$page_css = 'app';
$page_js = 'pages/app';
$head_scripts = ['logger-init'];
$additional_js = [
    'components/servers/server-dropdown',
    'components/servers/channel-redirect',
    'components/channels/channel-manager',
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

$isAjaxPageRequest = isset($_SERVER['HTTP_X_PAGE_REQUEST']) && $_SERVER['HTTP_X_PAGE_REQUEST'] === 'true';

ob_start();
include dirname(dirname(__DIR__)) . '/views/components/app-sections/app-layout.php';
include dirname(dirname(__DIR__)) . '/views/components/app-sections/create-server-modal.php';
$content = ob_get_clean();

if ($isAjaxPageRequest) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'html' => $content,
        'title' => $page_title
    ]);
    exit;
} else {
    include dirname(dirname(__DIR__)) . '/views/layout/main-app.php';
}
?>