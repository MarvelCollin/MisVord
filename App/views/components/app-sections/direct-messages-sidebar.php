<?php
require_once dirname(dirname(dirname(__DIR__))) . '/controllers/FriendController.php';
require_once dirname(dirname(dirname(__DIR__))) . '/controllers/ChatController.php';

$friendController = new FriendController();
$chatController = new ChatController();

$friendData = $friendController->getUserFriends();

require_once dirname(dirname(dirname(__DIR__))) . '/database/repositories/ChatRoomRepository.php';
$chatRoomRepository = new ChatRoomRepository();
$userId = $_SESSION['user_id'] ?? 0;
$chatRooms = $chatRoomRepository->getUserDirectRooms($userId);

$currentUser = $friendData['currentUser'];
$friends = $friendData['friends'];
$onlineFriends = $friendData['onlineFriends'];

$currentPath = $_SERVER['REQUEST_URI'] ?? '';
$tooltipPath = dirname(dirname(__DIR__)) . '/components/common/tooltip.php';
if (file_exists($tooltipPath)) {
    require_once $tooltipPath;
}
?>

<div class="w-60 bg-discord-dark flex flex-col">

    <div class="p-3">
        <div class="w-full bg-discord-darker rounded px-2 py-1.5 flex items-center">
            <input type="text" placeholder="Find or start a conve..." class="w-full bg-transparent border-0 text-sm text-discord-lighter focus:outline-none">
        </div>
    </div>

    <div class="px-2 mb-2">

        <a href="/home/friends?tab=online" class="block w-full">
            <div class="flex items-center p-2 rounded hover:bg-discord-light text-white cursor-pointer">
                <div class="w-8 h-8 rounded-full bg-discord-background flex items-center justify-center mr-3">
                    <i class="fas fa-user-friends"></i>
                </div>
                <span class="font-medium">Friends</span>
            </div>
        </a>

        <a href="/nitro" class="block w-full">
            <div class="flex items-center p-2 rounded hover:bg-discord-light text-discord-lighter hover:text-white cursor-pointer mt-1 relative">
                <div class="w-8 h-8 rounded-full bg-discord-background flex items-center justify-center mr-3">
                    <i class="fas fa-gift"></i>
                </div>
                <span class="font-medium">Nitro</span>
            </div>
        </a>
    </div>

    <div class="px-4 mt-1 flex items-center justify-between">
        <h3 class="uppercase text-discord-lighter font-semibold text-xs tracking-wider">Direct Messages</h3>
        <button class="text-discord-lighter hover:text-white text-lg" id="new-direct-message-btn">
            <i class="fas fa-plus"></i>
        </button>
    </div>

    <div class="px-2 mt-1 flex-grow overflow-y-auto">
        <?php foreach ($chatRooms as $chatRoom): ?>
            <?php 
            $statusColor = 'bg-gray-500';
            $otherUserId = $chatRoom['other_user_id'] ?? 0;
            $otherUsername = $chatRoom['other_username'] ?? 'Unknown';
            $otherAvatar = $chatRoom['other_avatar'] ?? '';
            $roomId = $chatRoom['id'] ?? 0;
            
            $activeDmId = $_SESSION['active_dm'] ?? null;
            $isActive = ($activeDmId == $roomId);
            $activeClass = $isActive ? 'bg-discord-light' : 'hover:bg-discord-light';
            ?>
            <div class="dm-friend-item flex items-center p-1.5 rounded <?php echo $activeClass; ?> text-discord-lighter hover:text-white cursor-pointer"
                 data-friend-id="<?php echo htmlspecialchars($otherUserId); ?>"
                 data-chat-room-id="<?php echo htmlspecialchars($roomId); ?>"
                 data-chat-type="direct"
                 data-username="<?php echo htmlspecialchars($otherUsername); ?>">
                <div class="relative mr-3">
                    <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                        <img src="<?php echo getUserAvatar($otherAvatar, $otherUsername); ?>" 
                            alt="Avatar" class="w-full h-full object-cover">
                    </div>
                    <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-dark <?php echo $statusColor; ?> user-status-indicator" data-user-id="<?php echo htmlspecialchars($otherUserId); ?>"></span>
                </div>
                <span class="font-medium truncate dm-username" data-user-id="<?php echo htmlspecialchars($otherUserId); ?>"><?php echo htmlspecialchars($otherUsername); ?></span>
            </div>
        <?php endforeach; ?>
    </div>

    <?php include dirname(__DIR__) . '/common/user-profile.php'; ?>
</div>

<?php include dirname(__DIR__) . '/home/new-direct-modal.php'; ?>

<script>
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔌 [DM-SIDEBAR] Direct messages sidebar loaded');
    
    function getStatusColor(isOnline) {
        return isOnline ? 'bg-discord-green' : 'bg-gray-500';
    }
    
    function updateUserStatus(userId, isOnline) {
        const statusIndicator = document.querySelector(`.user-status-indicator[data-user-id="${userId}"]`);
        if (statusIndicator) {
            statusIndicator.className = `absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-dark user-status-indicator ${getStatusColor(isOnline)}`;
            console.log(`📊 [DM-SIDEBAR] Updated user ${userId} status to ${isOnline ? 'online' : 'offline'}`);
        }
    }
    
    function updateAllUserStatuses() {
        console.log('🔄 [DM-SIDEBAR] Updating all user statuses');
        
        if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
            console.log('⏳ [DM-SIDEBAR] Socket not ready, will wait for socket events');
            return;
        }
        
        if (!window.ChatAPI) {
            console.warn('⚠️ [DM-SIDEBAR] ChatAPI not available, retrying in 1 second');
            setTimeout(updateAllUserStatuses, 1000);
            return;
        }
        
        window.ChatAPI.getOnlineUsers().then(onlineUsers => {
            console.log('📊 [DM-SIDEBAR] Retrieved online users:', onlineUsers);
            
            const allStatusIndicators = document.querySelectorAll('.user-status-indicator[data-user-id]');
            allStatusIndicators.forEach(indicator => {
                const userId = indicator.getAttribute('data-user-id');
                const isOnline = onlineUsers[userId] !== undefined;
                updateUserStatus(userId, isOnline);
            });
            
            console.log(`✅ [DM-SIDEBAR] Updated status for ${allStatusIndicators.length} users`);
        }).catch(error => {
            console.error('❌ [DM-SIDEBAR] Failed to get online users:', error);
        });
    }
    
    function setupSocketListeners() {
        console.log('🔌 [DM-SIDEBAR] Setting up socket listeners');
        if (window.globalSocketManager && window.globalSocketManager.io && window.globalSocketManager.isReady()) {
            console.log('✅ [DM-SIDEBAR] Socket manager available and ready, setting up listeners');
            
            window.globalSocketManager.io.on('user-online', (data) => {
                console.log('👥 [DM-SIDEBAR] User came online:', data);
                if (data.user_id) {
                    updateUserStatus(data.user_id, true);
                }
            });
            
            window.globalSocketManager.io.on('user-offline', (data) => {
                console.log('👥 [DM-SIDEBAR] User went offline:', data);
                if (data.user_id) {
                    updateUserStatus(data.user_id, false);
                }
            });
            
            window.globalSocketManager.io.on('user-presence-update', (data) => {
                console.log('👥 [DM-SIDEBAR] User presence updated:', data);
                if (data.user_id) {
                    const isOnline = data.status === 'online' || data.status === 'appear';
                    updateUserStatus(data.user_id, isOnline);
                }
            });
            
            console.log('✅ [DM-SIDEBAR] All socket listeners set up');
            updateAllUserStatuses();
            return true;
        }
        console.log('⏳ [DM-SIDEBAR] Socket manager not ready, waiting for events');
        return false;
    }
    
    window.addEventListener('globalSocketReady', function() {
        console.log('🔌 [DM-SIDEBAR] Global socket ready event received');
        setupSocketListeners();
    });
    
    window.addEventListener('socketAuthenticated', function() {
        console.log('🔐 [DM-SIDEBAR] Socket authenticated event received');
        setupSocketListeners();
    });
    
    setTimeout(() => {
        if (!setupSocketListeners()) {
            console.log('🔄 [DM-SIDEBAR] Initial setup failed, waiting for socket events...');
        }
    }, 1000);
    
    setInterval(() => {
        if (window.globalSocketManager && window.globalSocketManager.isReady()) {
            updateAllUserStatuses();
        }
    }, 60000);
});
</script>

