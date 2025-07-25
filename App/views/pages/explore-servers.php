<?php
if (!headers_sent()) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Tauri');
    header('X-Frame-Options: ALLOWALL');
    header('Content-Security-Policy: frame-ancestors *');
}

require_once dirname(dirname(__DIR__)) . '/config/iframe.php';
validateIframeAccess();

require_once dirname(dirname(__DIR__)) . '/config/session.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!function_exists('asset')) {
    require_once dirname(dirname(__DIR__)) . '/config/helpers.php';
}

require_once dirname(dirname(__DIR__)) . '/controllers/ExploreController.php';
$exploreController = new ExploreController();
$exploreData = $exploreController->prepareExploreData();

$userServers = $exploreData['userServers'];
$servers = $exploreData['servers'];
$userServerId = $exploreData['userServerIds'];
$featuredServers = [];
$categories = $exploreData['categories'];
$initialData = $exploreData['initialData'];

$allServers = $exploreController->getPublicServers();

$GLOBALS['servers'] = $servers;
$GLOBALS['allServers'] = $allServers;
$GLOBALS['userServerIds'] = $userServerId;
$GLOBALS['featuredServers'] = [];
$GLOBALS['categories'] = $categories;
$GLOBALS['initialData'] = $initialData;
$GLOBALS['contentType'] = 'explore';

$page_title = 'MisVord - Explore Servers';
$body_class = 'bg-discord-dark text-white';
$page_css = ['explore-servers', 'server-detail', 'explore-api-cards'];
$page_js = 'pages/explore-servers';
$head_scripts = ['logger-init', 'components/servers/server-detail'];
$additional_js = ['components/servers/server-dropdown'];
$contentType = 'explore';

ob_start(); ?>

<script>
    window.misvordExplore = {
        initialData: <?= json_encode($initialData) ?>
    };
</script>

<?php include dirname(dirname(__DIR__)) . '/views/components/app-sections/app-layout.php'; ?>

<?php include dirname(dirname(__DIR__)) . '/views/components/explore/server-detail.php'; ?>

<?php 
$content = ob_get_clean(); 
include dirname(dirname(__DIR__)) . '/views/layout/main-app.php';
?>