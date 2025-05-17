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

$page_title = 'MiscVord - Server';
$body_class = 'bg-gray-900 text-white overflow-hidden';
$page_css = 'server-page';
$page_js = 'server-page';

// Get socket server URL from ENV or use default
$socketServerUrl = $_ENV['SOCKET_SERVER'] ?? 'http://localhost:1002';
?>

<?php ob_start(); ?>

<div class="flex h-screen" 
     data-user-id="<?php echo htmlspecialchars($_SESSION['user_id']); ?>" 
     data-username="<?php echo htmlspecialchars($_SESSION['username']); ?>" 
     data-socket-url="<?php echo htmlspecialchars($socketServerUrl); ?>"
     id="app-container">
    <?php include dirname(dirname(__DIR__)) . '/views/components/app-sections/server-sidebar.php'; ?>
    
    <div class="flex flex-1 overflow-hidden">
        <div class="flex flex-col flex-1">
            <?php include dirname(dirname(__DIR__)) . '/views/components/app-sections/chat-section.php'; ?>
        </div>
        
        <?php include dirname(dirname(__DIR__)) . '/views/components/app-sections/participant-section.php'; ?>
    </div>
</div>

<?php 
$content = ob_get_clean(); 

include dirname(dirname(__DIR__)) . '/views/layout/main-app.php';
?>
