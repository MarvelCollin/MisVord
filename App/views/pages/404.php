<?php
// 404 Page
$page_title = 'MisVord - Page Not Found';
$body_class = 'bg-discord-dark text-white flex flex-col h-screen';

// Set up content for layout
ob_start();
?>
<div class="flex-1 flex items-center justify-center flex-col px-4">
    <div class="bg-discord-light p-8 rounded-lg shadow-lg max-w-lg w-full text-center">
        <h1 class="text-5xl font-bold mb-4">404</h1>
        <h2 class="text-2xl font-bold mb-6">Page Not Found</h2>
        <p class="mb-6 text-discord-lighter">The page you were looking for doesn't exist or you may not have permission to view it.</p>
        <div class="mb-6">
            <i class="fas fa-ghost text-6xl text-discord-primary opacity-75"></i>
        </div>
        <a href="/" class="inline-block bg-discord-primary hover:bg-blue-600 text-white py-2 px-6 rounded-md transition duration-200">
            Return to Home
        </a>
    </div>
</div>
<?php
$content = ob_get_clean();

// Include the main layout
include dirname(__DIR__) . '/layout/main-app.php';
?>

