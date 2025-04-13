<?php
// Include helper functions if not already included
if (!function_exists('asset')) {
    require_once dirname(dirname(__DIR__)) . '/config/helpers.php';
}

// Set variables for the main layout
$page_title = '404 - Page Not Found';
$body_class = 'bg-[#202225] error-page';
$page_css = 'error-page.css';
?>

<!-- Define the content for the main layout -->
<?php ob_start(); ?>

<div class="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
    <div class="w-full max-w-lg p-8 rounded-xl shadow-2xl relative z-10 glass-hero transform bg-[#2f3136]/80 backdrop-filter backdrop-blur-md border border-white/10 text-center">
        <img src="<?php echo asset('/landing-page/wumpus_sad.webp'); ?>" alt="Sad Wumpus" class="h-48 mx-auto mb-6">
        
        <h1 class="text-4xl font-bold mb-4 text-white">404</h1>
        <h2 class="text-2xl font-semibold mb-6 text-discord-blue">Page Not Found</h2>
        
        <p class="text-gray-300 mb-8">
            The page you're looking for doesn't exist or has been moved.
        </p>
        
        <a href="/" class="px-6 py-3 bg-discord-blue hover:bg-discord-blue/90 text-white font-medium rounded-md transition-all inline-block">
            Return to Home
        </a>
    </div>
</div>

<?php 
// Get the content and clean the buffer
$content = ob_get_clean(); 

// Include the main layout with our content
include dirname(dirname(__DIR__)) . '/views/layout/main-app.php';
?>
