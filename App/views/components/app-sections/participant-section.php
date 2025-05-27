<?php
// Include helper functions if not already included
if (!function_exists('asset')) {
    require_once dirname(dirname(dirname(__DIR__))) . '/config/helpers.php';
}

// Fetch server members if we have a current server
$onlineUsers = [];
$offlineUsers = [];
$currentServer = $GLOBALS['currentServer'] ?? null;

if ($currentServer) {
    require_once dirname(dirname(dirname(__DIR__))) . '/database/models/User.php';
    
    $serverMembers = $currentServer->members();
    
    // Split members by status
    foreach ($serverMembers as $member) {
        if ($member['status'] === 'online' || $member['status'] === 'away') {
            $onlineUsers[] = $member;
        } else {
            $offlineUsers[] = $member;
        }
    }
}
?>
<!-- Participants List -->
<div class="w-60 bg-[#2f3136] overflow-y-auto border-l border-[#202225]">
    <!-- Search Bar -->
    <div class="p-3">
        <?php 
        // Use the shared search bar component
        $placeholder = "Search";
        $iconPosition = "right";
        $bgColor = "bg-[#202225]";
        include dirname(__DIR__) . '/app-sections/search-bar.php';
        ?>
    </div>
    
    <div class="p-3 pt-0">
        <!-- Online Users -->
        <div class="mb-2">
            <div class="text-xs font-semibold text-gray-400 mb-1 mt-3 uppercase">
                Online — <?php echo count($onlineUsers); ?>
            </div>
            
            <?php if (empty($onlineUsers) && isset($_SESSION['user_id'])): ?>
                <div class="text-gray-300 flex items-center py-1 hover:bg-[#32353B] rounded px-2 cursor-pointer">
                    <?php
                    // Use shared user avatar for current user
                    $user = [
                        'id' => $_SESSION['user_id'],
                        'username' => $_SESSION['username'],
                        'avatar_url' => $_SESSION['avatar_url'] ?? '',
                        'status' => 'online'
                    ];
                    $size = 2; // Smaller dot
                    $showStatus = false;
                    $customClasses = "mr-2";
                    include dirname(__DIR__) . '/app-sections/user-avatar.php';
                    ?>
                    <div class="flex-grow"><?php echo htmlspecialchars($_SESSION['username']); ?> (You)</div>
                </div>
            <?php else: ?>
                <?php foreach ($onlineUsers as $member): ?>
                    <div class="text-gray-300 flex items-center py-1 hover:bg-[#32353B] rounded px-2 cursor-pointer">
                        <?php
                        // Use shared user avatar
                        $user = $member;
                        $size = 2; // Smaller dot
                        $showStatus = false;
                        $customClasses = "mr-2";
                        include dirname(__DIR__) . '/app-sections/user-avatar.php';
                        ?>
                        <div class="flex-grow">
                            <?php echo htmlspecialchars($member['username']); ?>
                            <?php if ($member['id'] == $_SESSION['user_id']): ?> (You)<?php endif; ?>
                        </div>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
        
        <!-- Offline Users -->
        <div>
            <div class="text-xs font-semibold text-gray-400 mb-1 mt-3 uppercase">
                Offline — <?php echo count($offlineUsers); ?>
            </div>
            
            <?php foreach ($offlineUsers as $member): ?>
                <div class="text-gray-400 flex items-center py-1 hover:bg-[#32353B] rounded px-2 cursor-pointer">
                    <?php
                    // Use shared user avatar
                    $user = $member;
                    $size = 2; // Smaller dot
                    $showStatus = false; 
                    $customClasses = "mr-2";
                    include dirname(__DIR__) . '/app-sections/user-avatar.php';
                    ?>
                    <div class="flex-grow"><?php echo htmlspecialchars($member['username']); ?></div>
                </div>
            <?php endforeach; ?>
            
            <?php if (empty($offlineUsers) && empty($onlineUsers)): ?>
                <div class="text-gray-400 text-sm py-2">
                    No members found in this server.
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>
