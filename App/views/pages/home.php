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

$page_title = 'misvord - Home';
$body_class = 'bg-discord-dark text-white overflow-hidden';
$page_css = 'home-page';
$page_js = 'home-page';
$socketServerUrl = $_ENV['SOCKET_SERVER'] ?? 'http://localhost:1002';
$contentType = 'home';
?>

<?php ob_start(); ?>

<?php include dirname(dirname(__DIR__)) . '/views/components/app-sections/app-layout.php'; ?>

<?php 
$content = ob_get_clean(); 
include dirname(dirname(__DIR__)) . '/views/layout/main-app.php';
?>
