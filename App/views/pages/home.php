<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!function_exists('asset')) {
    require_once dirname(dirname(__DIR__)) . '/config/helpers.php';
}

require_once dirname(dirname(__DIR__)) . '/controllers/HomeController.php';
$homeController = new HomeController();
$homeData = $homeController->index();

$currentUserId = $homeData['currentUserId'];
$userServers = $homeData['userServers'];
$memberships = $homeData['memberships'];

$page_title = 'misvord - Home';
$body_class = 'bg-discord-dark text-white';
$page_css = 'app';
$page_js = 'pages/app';
$additional_js = ['components/servers/server-dropdown'];
$contentType = 'home';
?>

<?php ob_start(); ?>

<?php if (isset($_GET['debug'])): ?>
<div style="position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 5px; z-index: 1000; color: white; max-width: 500px; overflow: auto; max-height: 80%;">
    <h3>Debug Info</h3>
    <p>User ID: <?php echo $currentUserId; ?></p>
    <p>Memberships: <?php echo count($memberships); ?></p>
    <ul>
    <?php foreach($memberships as $m): ?>
        <li>Server ID: <?php echo $m['server_id']; ?>, Role: <?php echo $m['role']; ?></li>
    <?php endforeach; ?>
    </ul>
    <p>Servers: <?php echo count($GLOBALS['userServers']); ?></p>
    <pre><?php print_r($GLOBALS['userServers']); ?></pre>
</div>
<?php endif; ?>

<?php include dirname(dirname(__DIR__)) . '/views/components/app-sections/app-layout.php'; ?>

<?php include dirname(dirname(__DIR__)) . '/views/components/app-sections/create-server-modal.php'; ?>

<?php 
$content = ob_get_clean(); 
include dirname(dirname(__DIR__)) . '/views/layout/main-app.php';
?>