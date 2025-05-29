<?php

if (!function_exists('asset')) {
    require_once dirname(dirname(__DIR__)) . '/config/helpers.php';
}

// 404 Page
$page_title = 'MiscVord - Page Not Found';
$body_class = 'bg-discord-dark text-white flex flex-col h-screen';

// Include header
?>
<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $page_title ?></title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
</head>
<body class="<?= $body_class ?>">
    <div class="flex-1 flex items-center justify-center flex-col px-4">
        <div class="bg-discord-light p-8 rounded-lg shadow-lg max-w-lg w-full text-center">
            <h1 class="text-5xl font-bold mb-4">404</h1>
            <h2 class="text-2xl font-bold mb-6">Page Not Found</h2>
            <p class="mb-6 text-discord-gray-300">The page you were looking for doesn't exist or you may not have permission to view it.</p>
            <div class="mb-6">
                <i class="fas fa-ghost text-6xl text-discord-blurple opacity-75"></i>
            </div>
            <a href="/" class="inline-block bg-discord-blurple hover:bg-discord-blurple-dark text-white py-2 px-6 rounded-md transition duration-200">
                Return to Home
            </a>
        </div>
    </div>
</body>
</html>

