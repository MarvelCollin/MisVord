<?php
// Accept invite page
$pageTitle = "Join Server - MiscVord";

// Check if we have server information
$server = $GLOBALS['inviteServer'] ?? null;
$inviteCode = $GLOBALS['inviteCode'] ?? null;

// Additional JS needed for this page
$additional_js = ['pages/accept-invite'];

// Ensure we have a session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Helper function to get asset URLs
if (!function_exists('js')) {
    function js($path) {
        $path = rtrim($path, '.js');
        return "/js/{$path}.js";
    }
}

if (!function_exists('css')) {
    function css($path) {
        $path = rtrim($path, '.css');
        return "/css/{$path}.css";
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $pageTitle; ?></title>
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        discord: {
                            'blurple': '#5865F2',
                            'dark': '#202225',
                            'light': '#36393F',
                            'gray': '#2F3136',
                        }
                    }
                }
            }
        }
    </script>
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    
    <!-- Global styles -->
    <link rel="stylesheet" href="/css/global.css">
    
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #202225;
            color: white;
        }
    </style>
</head>
<body>
    <div class="min-h-screen bg-discord-dark flex flex-col">
        <!-- Top Navigation -->
        <nav class="bg-discord-light p-4">
            <div class="container mx-auto flex justify-between items-center">
                <a href="/" class="text-white font-bold text-xl">MiscVord</a>
                
                <div class="space-x-4">
                    <?php if (isset($_SESSION['user_id'])): ?>
                        <a href="/app" class="text-white hover:underline">Go to App</a>
                        <a href="/logout" class="text-white hover:underline">Logout</a>
                    <?php else: ?>
                        <a href="/login" class="text-white hover:underline">Login</a>
                        <a href="/register" class="text-white hover:underline">Register</a>
                    <?php endif; ?>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <div class="flex-1 flex items-center justify-center p-4">
            <div class="bg-discord-light rounded-lg shadow-lg w-full max-w-md p-6">
                <?php if ($server): ?>
                    <div class="text-center mb-6">
                        <?php if ($server->image_url): ?>
                            <img src="<?php echo htmlspecialchars($server->image_url); ?>" alt="<?php echo htmlspecialchars($server->name); ?>" class="w-24 h-24 rounded-full mx-auto mb-4">
                        <?php else: ?>
                            <div class="w-24 h-24 bg-discord-blurple rounded-full mx-auto mb-4 flex items-center justify-center">
                                <span class="text-2xl font-bold text-white"><?php echo substr($server->name, 0, 1); ?></span>
                            </div>
                        <?php endif; ?>
                        <h2 class="text-2xl font-bold text-white"><?php echo htmlspecialchars($server->name); ?></h2>
                        
                        <?php if ($server->description): ?>
                            <p class="text-gray-300 mt-2"><?php echo htmlspecialchars($server->description); ?></p>
                        <?php endif; ?>
                    </div>
                    
                    <div class="text-gray-300 mb-6">
                        <p class="mb-2">You've been invited to join this server!</p>
                        
                        <?php if (!isset($_SESSION['user_id'])): ?>
                            <div class="bg-discord-dark p-3 rounded mt-4 text-center">
                                <p class="text-yellow-400 mb-2">
                                    <i class="fas fa-info-circle"></i> 
                                    You need to log in before you can accept this invitation.
                                </p>
                                <div class="flex space-x-4 justify-center mt-4">
                                    <a href="/login?redirect=/join/<?php echo htmlspecialchars($inviteCode); ?>" class="bg-discord-blurple hover:bg-blue-600 text-white py-2 px-6 rounded-md transition duration-200">
                                        Log In
                                    </a>
                                    <a href="/register?redirect=/join/<?php echo htmlspecialchars($inviteCode); ?>" class="bg-gray-700 hover:bg-gray-600 text-white py-2 px-6 rounded-md transition duration-200">
                                        Register
                                    </a>
                                </div>
                            </div>
                        <?php else: ?>
                            <div id="join-options" class="mt-6 space-y-4">
                                <a href="/api/servers/join/<?php echo htmlspecialchars($inviteCode); ?>" id="join-server-btn" class="w-full block bg-discord-blurple hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-md text-center transition duration-200">
                                    Accept Invitation
                                </a>
                                <a href="/app" class="w-full block bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-md text-center transition duration-200">
                                    Cancel
                                </a>
                            </div>
                        <?php endif; ?>
                    </div>
                <?php else: ?>
                    <div class="text-center py-10">
                        <div class="text-4xl text-gray-500 mb-4">
                            <i class="fas fa-link-slash"></i>
                        </div>
                        <h2 class="text-2xl font-bold text-white mb-2">Invalid Invite</h2>
                        <p class="text-gray-300">This invite may be expired, or you might not have permission to join.</p>
                        
                        <div class="mt-8">
                            <a href="/app" class="bg-discord-blurple hover:bg-blue-600 text-white py-2 px-6 rounded-md transition duration-200">
                                Back to App
                            </a>
                        </div>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <!-- JS scripts -->
    <script src="/js/main.js"></script>
    <script src="/js/pages/accept-invite.js"></script>
</body>
</html>
