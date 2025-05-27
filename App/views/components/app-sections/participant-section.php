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
<div class="w-60 bg-[#2f3136] overflow-y-auto">
    <!-- Search Bar -->
    <div class="p-3">
        <div class="bg-[#202225] rounded flex items-center px-2">
            <input type="text" placeholder="Search" class="bg-transparent border-none w-full py-1 px-1 text-sm text-gray-200 focus:outline-none">
            <i class="fa-solid fa-magnifying-glass h-4 w-4 text-gray-400"></i>
        </div>
    </div>
    
    <div class="p-3 pt-0">
        <!-- Online Users -->
        <div class="mb-2">
            <div class="text-xs font-semibold text-gray-400 mb-1 mt-3 uppercase">
                Online — <?php echo count($onlineUsers); ?>
            </div>
            
            <?php if (empty($onlineUsers) && isset($_SESSION['user_id'])): ?>
                <div class="text-gray-300 flex items-center py-1 hover:bg-gray-700 rounded px-2 cursor-pointer">
                    <div class="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                    <div class="flex-grow"><?php echo htmlspecialchars($_SESSION['username']); ?> (You)</div>
                </div>
            <?php else: ?>
                <?php foreach ($onlineUsers as $user): ?>
                    <div class="text-gray-300 flex items-center py-1 hover:bg-gray-700 rounded px-2 cursor-pointer">
                        <div class="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        <div class="flex-grow">
                            <?php echo htmlspecialchars($user['username']); ?>
                            <?php if ($user['id'] == $_SESSION['user_id']): ?> (You)<?php endif; ?>
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
            
            <?php foreach ($offlineUsers as $user): ?>
                <div class="text-gray-400 flex items-center py-1 hover:bg-gray-700 rounded px-2 cursor-pointer">
                    <div class="w-2 h-2 rounded-full bg-gray-500 mr-2"></div>
                    <div class="flex-grow"><?php echo htmlspecialchars($user['username']); ?></div>
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
