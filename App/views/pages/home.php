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

// Force load fresh server data for the current user (avoid caching issues)
require_once dirname(dirname(__DIR__)) . '/database/models/Server.php';
$currentUserId = $_SESSION['user_id'] ?? 0;
log_debug("HOME.PHP - Loading servers for user", ['user_id' => $currentUserId]);

// Clear any previously loaded server data
if (isset($GLOBALS['userServers'])) {
    unset($GLOBALS['userServers']);
    log_debug("HOME.PHP - Cleared existing server data from GLOBALS");
}

// Get fresh server data
$GLOBALS['userServers'] = Server::getFormattedServersForUser($currentUserId);
log_debug("HOME.PHP - Loaded servers for sidebar", ['count' => count($GLOBALS['userServers'])]);

// Direct database check (debug only)
$query = new Query();
$memberships = $query->table('user_server_memberships')->where('user_id', $currentUserId)->get();
log_debug("HOME.PHP - Direct query found memberships", ['count' => count($memberships)]);

$page_title = 'misvord - Home';
$body_class = 'bg-discord-dark text-white overflow-hidden';
$page_css = 'home-page';
$page_js = 'home-page';
$additional_js = ['server-dropdown.js'];
$contentType = 'home';
?>

<?php ob_start(); ?>

<!-- Debug panel to show server info -->
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

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Handle create server button click ONLY
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
        
        // Prevent closing when clicking inside modal content
        const modalContent = modal.querySelector('.bg-discord-background');
        if (modalContent) {
            modalContent.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
    }
});
</script>

<?php 
$content = ob_get_clean(); 
include dirname(dirname(__DIR__)) . '/views/layout/main-app.php';
?>
