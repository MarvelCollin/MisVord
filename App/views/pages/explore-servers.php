<?php
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
$featuredServers = $exploreData['featuredServers'];
$categories = $exploreData['categories'];

$GLOBALS['servers'] = $servers;
$GLOBALS['userServerIds'] = $userServerId;
$GLOBALS['featuredServers'] = $featuredServers;
$GLOBALS['categories'] = $categories;
$GLOBALS['contentType'] = 'explore';

$page_title = 'misvord - Explore Servers';
$body_class = 'bg-discord-dark text-white';
$page_css = ['explore-servers', 'server-detail'];
$page_js = 'pages/explore-servers';
$head_scripts = ['logger-init', 'components/servers/server-detail'];
$additional_js = ['components/servers/server-dropdown'];
$contentType = 'explore';

ob_start(); ?>

<?php include dirname(dirname(__DIR__)) . '/views/components/app-sections/app-layout.php'; ?>

<?php include dirname(dirname(__DIR__)) . '/views/components/explore/server-detail.php'; ?>

<?php 
$content = ob_get_clean(); 
include dirname(dirname(__DIR__)) . '/views/layout/main-app.php';
?>