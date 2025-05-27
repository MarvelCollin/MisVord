<?php
// Required parameters (should be passed when including this component):
// $contentType: 'home' or 'server'
// $socketServerUrl: WebSocket server URL

// Optional parameters (can be null):
// $currentServer: The current server object (for server pages only)

// Check if we have the required parameters
if (!isset($contentType)) {
    $contentType = 'home'; // Default to home page
}

if (!isset($socketServerUrl)) {
    $socketServerUrl = $_ENV['SOCKET_SERVER'] ?? 'http://localhost:1002';
}

// The currentServer variable should be set by the controller before including this file
$currentServer = $currentServer ?? $GLOBALS['currentServer'] ?? null;
?>

<div class="flex h-screen" 
     data-user-id="<?php echo htmlspecialchars($_SESSION['user_id']); ?>" 
     data-username="<?php echo htmlspecialchars($_SESSION['username']); ?>" 
     data-socket-url="<?php echo htmlspecialchars($socketServerUrl); ?>"
     id="app-container">
    
    <?php include dirname(__DIR__) . '/app-sections/server-sidebar.php'; ?>

    <div class="flex flex-1 overflow-hidden">
        <div class="flex flex-col flex-1">
            <?php if ($contentType === 'home'): ?>
                <!-- Home Content (Friends and DMs) -->
                <div class="flex-1 bg-[#36393F] flex flex-col">
                    <!-- Home Header -->
                    <div class="h-12 bg-[#36393F] border-b border-[#2D3136] flex items-center px-4">
                        <div class="flex items-center">
                            <i class="fa-solid fa-user-group text-[18px] text-gray-400 mr-2"></i>
                            <span class="font-semibold text-white">Friends</span>
                        </div>
                        <div class="border-l border-[#2D3136] h-6 mx-4"></div>
                        <div class="flex space-x-4 text-sm">
                            <button class="text-white bg-[#5865F2] hover:bg-[#5865F2]/90 px-2 py-0.5 rounded">Online</button>
                            <button class="text-gray-300 hover:text-white hover:bg-[#42464D] px-2 py-0.5 rounded">All</button>
                            <button class="text-gray-300 hover:text-white hover:bg-[#42464D] px-2 py-0.5 rounded">Pending</button>
                            <button class="text-gray-300 hover:text-white hover:bg-[#42464D] px-2 py-0.5 rounded">Blocked</button>
                            <button class="bg-[#43B581] hover:bg-[#43B581]/90 text-white px-3 py-1 rounded">Add Friend</button>
                        </div>
                    </div>

                    <!-- Include the main content area -->
                    <?php include dirname(__DIR__) . '/app-sections/home-content.php'; ?>
                </div>
            <?php elseif ($contentType === 'server'): ?>
                <!-- Server Content (Chat) -->
                <?php include dirname(__DIR__) . '/app-sections/chat-section.php'; ?>
            <?php endif; ?>
        </div>
        
        <?php if ($contentType === 'home'): ?>
            <!-- Right sidebar for active now friends -->
            <?php include dirname(__DIR__) . '/app-sections/active-now-section.php'; ?>
        <?php elseif ($contentType === 'server'): ?>
            <!-- Right sidebar for server members -->
            <?php include dirname(__DIR__) . '/app-sections/participant-section.php'; ?>
        <?php endif; ?>
    </div>
</div> 