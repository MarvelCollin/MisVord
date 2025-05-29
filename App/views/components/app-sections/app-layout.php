<?php
if (!isset($contentType)) {
    $contentType = 'home';
}

$currentServer = $currentServer ?? $GLOBALS['currentServer'] ?? null;
?>

<div class="flex h-screen" 
     data-user-id="<?php echo htmlspecialchars($_SESSION['user_id']); ?>" 
     data-username="<?php echo htmlspecialchars($_SESSION['username']); ?>"
     id="app-container">
    
    <?php include dirname(__DIR__) . '/app-sections/server-sidebar.php'; ?>

    <div class="flex flex-1 overflow-hidden">
        <div class="flex flex-col flex-1">
            <?php if ($contentType === 'home'): ?>
                <div class="flex-1 bg-discord-background flex flex-col">
                    <div class="h-12 bg-discord-background border-b border-gray-800 flex items-center px-4">
                        <div class="flex items-center">
                            <i class="fa-solid fa-user-group text-[18px] text-gray-400 mr-2"></i>
                            <span class="font-semibold text-white">Friends</span>
                        </div>
                        <div class="border-l border-gray-800 h-6 mx-4"></div>
                        <div class="flex space-x-4 text-sm">
                            <button class="text-white bg-discord-primary hover:bg-discord-primary/90 px-2 py-0.5 rounded">Online</button>
                            <button class="text-gray-300 hover:text-white hover:bg-discord-light px-2 py-0.5 rounded">All</button>
                            <button class="text-gray-300 hover:text-white hover:bg-discord-light px-2 py-0.5 rounded">Pending</button>
                            <button class="text-gray-300 hover:text-white hover:bg-discord-light px-2 py-0.5 rounded">Blocked</button>
                            <button class="bg-discord-green hover:bg-discord-green/90 text-white px-3 py-1 rounded">Add Friend</button>
                        </div>
                    </div>

                    <?php include dirname(__DIR__) . '/app-sections/home-content.php'; ?>
                </div>
            <?php elseif ($contentType === 'server'): ?>
                <?php include dirname(__DIR__) . '/app-sections/chat-section.php'; ?>
            <?php endif; ?>
        </div>
        
        <?php if ($contentType === 'home'): ?>
            <?php include dirname(__DIR__) . '/app-sections/active-now-section.php'; ?>
        <?php elseif ($contentType === 'server'): ?>
            <?php include dirname(__DIR__) . '/app-sections/participant-section.php'; ?>
        <?php endif; ?>
    </div>
</div>
