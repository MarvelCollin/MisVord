<?php
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

$page_title = 'misvord - ' . $serverName;
$body_class = 'bg-discord-dark text-white';
$page_css = 'app';
$page_js = 'pages/app';
$additional_js = [
    'components/servers/server-dropdown',
    'components/channels/channel-manager',
    'components/messaging/messaging'
];
$contentType = 'server';
$currentServer = $GLOBALS['currentServer'] ?? null;
$data_page = 'server';

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

<!-- Preload important scripts -->
<script>
document.addEventListener('DOMContentLoaded', function() {

    const createServerBtn = document.querySelector('[data-action="create-server"]');
    const modal = document.getElementById('create-server-modal');
    const closeBtn = document.getElementById('close-server-modal');

    if (createServerBtn && modal) {
        createServerBtn.addEventListener('click', function(e) {
            e.preventDefault();
            modal.classList.remove('hidden');
        });
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', function() {
            modal.classList.add('hidden');
        });
    }

    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    }
});
</script>

<?php 
$content = ob_get_clean(); 
include dirname(dirname(__DIR__)) . '/views/layout/main-app.php';
?>