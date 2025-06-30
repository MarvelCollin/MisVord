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
$serverId = $currentServer ? $currentServer->id : 0;

$GLOBALS['isLoading'] = isset($_GET['loading']) && $_GET['loading'] === 'true';

$page_title = 'misvord - ' . $serverName;
$body_class = 'bg-discord-dark text-white';
$page_css = 'app';
$additional_css = ['tic-tac-toe'];
$page_js = 'pages/app';
$head_scripts = ['logger-init'];
$additional_js = [
    'utils/page-utils',
    'core/ui/toast',
    'utils/css-loader',
    'utils/lazy-loader',
    'utils/debug-logging',
    'utils/jaro-winkler',
    'utils/voice-utils',
    'core/socket/global-socket-manager',
    'api/chat-api',
    'api/user-api',
    'api/server-api',
    'api/channel-api',
    'api/bot-api',
    'api/media-api',
    'api/friend-api',
    'components/common/image-cutter',
    'components/messaging/message-handler',
    'components/messaging/socket-handler',
    'components/messaging/chat-ui-handler',
    'components/messaging/file-upload-handler',
    'components/messaging/send-receive-handler',
    'components/messaging/mention-handler',
    'components/messaging/chat-bot',
    'components/messaging/chat-section',
    'components/videosdk/videosdk',
    'components/voice/voice-dependency-loader',
    'components/voice/voice-section',
    'components/voice/voice-manager',
    'components/voice/global-voice-indicator',
    'components/bot/bot',
    'components/servers/server-dropdown',
    'components/servers/server-sidebar',
    'components/servers/channel-redirect',
    'components/channels/channel-manager',
    'components/channels/channel-drag',
    'components/activity/activity',
    'components/activity/tic-tac-toe',
    'utils/channel-switch-manager',
    'utils/navigation-manager',
    'utils/load-home-page',
    'utils/load-server-page',
    'pages/server-page'
];
$contentType = 'server';
$data_page = 'server';
        
$extraHeadContent = '<meta name="server-id" content="' . htmlspecialchars($serverId) . '">';

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

<?php 
$content = ob_get_clean(); 
include dirname(dirname(__DIR__)) . '/views/layout/main-app.php';
?>