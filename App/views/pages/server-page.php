<?php
// Start the session only if it hasn't been started already
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Include helper functions if not already included
if (!function_exists('asset')) {
    require_once dirname(dirname(__DIR__)) . '/config/helpers.php';
}

// Check if user is logged in, redirect if not
if (!isset($_SESSION['user_id'])) {
    header('Location: /login');
    exit;
}

// Set variables for the main layout
$page_title = 'MiscVord - Server';
$body_class = 'bg-gray-900 text-white overflow-hidden';
$page_css = 'server-page'; // Reference to external CSS file
$page_js = 'server-page';  // Reference to external JS file
?>

<!-- Define the content for the main layout -->
<?php ob_start(); ?>

<div class="flex h-screen">
    <!-- Include Server Sidebar (contains both server icons and channels) -->
    <?php include dirname(dirname(__DIR__)) . '/views/components/app-sections/server-sidebar.php'; ?>
    
    <!-- Main Discord Interface - Flexbox layout for the main sections -->
    <div class="flex flex-1 overflow-hidden">
        <!-- Main Content Area -->
        <div class="flex flex-col flex-1">
            <!-- Chat Section - Main conversation area -->
            <?php include dirname(dirname(__DIR__)) . '/views/components/app-sections/chat-section.php'; ?>
        </div>
        
        <!-- Participants Section - Right sidebar with member list -->
        <?php include dirname(dirname(__DIR__)) . '/views/components/app-sections/participant-section.php'; ?>
    </div>
</div>

<!-- User profile section has been moved to channel-section.php -->

<?php 
// Get the content and clean the buffer
$content = ob_get_clean(); 

// Include the main layout with our content
include dirname(dirname(__DIR__)) . '/views/layout/main-app.php';
?>
