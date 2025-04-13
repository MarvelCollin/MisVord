<?php
// Start the session at the beginning of the file
session_start();

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

<!-- User Profile Section - Bottom bar with user controls -->
<div class="user-profile-section fixed bottom-0 left-18 right-0 h-14 bg-gray-800 flex items-center px-2">
    <div class="flex items-center w-60 px-2">
        <div class="relative mr-3">
            <img src="<?php echo asset('/landing-page/green-egg.webp'); ?>" alt="<?php echo $_SESSION['username']; ?>'s Avatar" class="w-8 h-8 rounded-full">
            <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
        </div>
        <div class="flex-grow">
            <div class="text-white font-medium text-sm"><?php echo $_SESSION['username']; ?></div>
            <div class="text-gray-400 text-xs">#<?php echo substr(md5($_SESSION['user_id']), 0, 4); ?></div>
        </div>
        <div class="flex space-x-1">
            <button class="text-gray-400 hover:text-white p-1 rounded">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
            </button>
            <button class="text-gray-400 hover:text-white p-1 rounded">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 01.001-7.072m12.728 0a9 9 0 00-12.728 0" />
                </svg>
            </button>
            <button class="text-gray-400 hover:text-white p-1 rounded">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>
        </div>
    </div>
</div>

<?php 
// Get the content and clean the buffer
$content = ob_get_clean(); 

// Include the main layout with our content
include dirname(dirname(__DIR__)) . '/views/layout/main-app.php';
?>
