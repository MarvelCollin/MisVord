<?php

$page_title = 'misvord - Accept Invite';
$page_css = 'app';
$page_js = 'pages/accept-invite';
$additional_js = [];

$server = $GLOBALS['inviteServer'] ?? null;
$inviteCode = $GLOBALS['inviteCode'] ?? null;
$invite = $GLOBALS['invite'] ?? null;

require_once dirname(dirname(__DIR__)) . '/config/session.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

ob_start();
?>
    <div class="min-h-screen bg-discord-dark flex flex-col">
        <nav class="bg-discord-light p-4">
            <div class="container mx-auto flex justify-between items-center">
                <a href="/" class="text-white font-bold text-xl">MisVord</a>

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
                        
                        <?php if ($invite && $invite->expires_at): ?>
                            <p class="text-sm text-gray-400 mt-2">
                                <i class="fas fa-clock mr-1"></i>
                                This invite expires on <?php echo date('F j, Y, g:i a', strtotime($invite->expires_at)); ?>
                            </p>
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
                            <a href="/app" class="bg-discord-primary hover:bg-blue-600 text-white py-2 px-6 rounded-md transition duration-200">
                                Back to App
                            </a>
                        </div>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
<?php
$content = ob_get_clean();

$body_class = 'bg-discord-dark text-white min-h-screen';

include dirname(__DIR__) . '/layout/main-app.php';
?>