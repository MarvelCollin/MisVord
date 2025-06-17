<?php
// Load logger if available
if (file_exists(dirname(dirname(__DIR__)) . '/utils/AppLogger.php')) {
    require_once dirname(dirname(__DIR__)) . '/utils/AppLogger.php';
    if (function_exists('logger')) {
        logger()->debug("Server page loaded");
    }
}

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

$page_title = 'MisVord - Server';
$body_class = 'bg-discord-dark text-white overflow-hidden';
$page_css = 'server-page';
$page_js = 'server-page';
$additional_js = [
    'socket.io.min.js',
    'server-dropdown.js',
    'components/server-sidebar.js',
    'components/messaging.js',
    'components/channel-manager.js',
    'components/channel-drag.js',
    'lazy-loader.js'
];
$contentType = 'server';
$currentServer = $GLOBALS['currentServer'] ?? null;
$data_page = 'server';

if (isset($GLOBALS['currentServer'])) {
    if (function_exists('logger')) {
        logger()->debug("Current server data", [
            'id' => $GLOBALS['currentServer']->id,
            'name' => $GLOBALS['currentServer']->name
        ]);
    }
} else {
    if (function_exists('logger')) {
        logger()->warning("No current server set in GLOBALS");        
        // Check if coming from a route parameter
        if (isset($params['id'])) {
            logger()->debug("Server ID from route params", ['server_id' => $params['id']]);
        }
    }
}
?>

<?php ob_start(); ?>

<?php include dirname(dirname(__DIR__)) . '/views/components/app-sections/app-layout.php'; ?>

<?php include dirname(dirname(__DIR__)) . '/views/components/app-sections/create-server-modal.php'; ?>

<!-- Preload important scripts -->
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Handle create server button click
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
    
    // Close modal when clicking outside
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
