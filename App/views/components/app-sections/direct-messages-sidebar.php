<?php
require_once dirname(dirname(dirname(__DIR__))) . '/controllers/FriendController.php';
require_once dirname(dirname(dirname(__DIR__))) . '/controllers/ChatController.php';

$friendController = new FriendController();
$chatController = new ChatController();

$friendData = $friendController->getUserFriends();

require_once dirname(dirname(dirname(__DIR__))) . '/database/repositories/ChatRoomRepository.php';
$chatRoomRepository = new ChatRoomRepository();
$userId = $_SESSION['user_id'] ?? 0;
$chatRooms = $chatRoomRepository->getUserChatRooms($userId);

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
                <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                    <i class="fas fa-user-friends"></i>
                </div>
                <span class="font-medium">Friends</span>
            </div>
        </a>

        <a href="/nitro" class="block w-full">
            <div class="flex items-center p-2 rounded hover:bg-discord-light text-discord-lighter hover:text-white cursor-pointer mt-1 relative">
                <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-3">
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

    <div class="px-2 mt-1 flex-grow overflow-y-auto" id="dm-list-container">
        <div id="dm-skeleton-loading" class="dm-skeleton-container">
            <div class="dm-skeleton-item flex items-center p-1.5 rounded">
                <div class="relative mr-3">
                    <div class="skeleton-avatar"></div>
                    <div class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-dark bg-gray-500 skeleton z-30"></div>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="skeleton-text mb-1"></div>
                </div>
            </div>
            <div class="dm-skeleton-item flex items-center p-1.5 rounded">
                <div class="relative mr-3">
                    <div class="skeleton-avatar"></div>
                    <div class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-dark bg-gray-500 skeleton z-30"></div>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="skeleton-text mb-1"></div>
                </div>
            </div>
            <div class="dm-skeleton-item flex items-center p-1.5 rounded">
                <div class="relative mr-3">
                    <div class="skeleton-avatar"></div>
                    <div class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-dark bg-gray-500 skeleton z-30"></div>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="skeleton-text mb-1"></div>
                </div>
            </div>
            <div class="dm-skeleton-item flex items-center p-1.5 rounded">
                <div class="relative mr-3">
                    <div class="skeleton-avatar"></div>
                    <div class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-dark bg-gray-500 skeleton z-30"></div>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="skeleton-text mb-1"></div>
                </div>
            </div>
        </div>
        
        <div id="dm-real-content" style="display: none;">
        <?php foreach ($chatRooms as $chatRoom): ?>
            <?php 
            $statusColor = 'bg-gray-500';
            $roomId = $chatRoom['id'] ?? 0;
            $roomType = $chatRoom['type'] ?? 'direct';
            $roomName = '';
            $roomAvatar = '';
            $otherUserId = null;
            
            if ($roomType === 'direct') {
                $otherUserId = $chatRoom['other_user_id'] ?? 0;
                $roomName = $chatRoom['other_display_name'] ?? $chatRoom['other_username'] ?? 'Unknown';
                $roomAvatar = $chatRoom['other_avatar'] ?? '';
            } else {
                $roomName = $chatRoom['name'] ?? 'Group Chat';
                $roomAvatar = $chatRoom['image_url'] ?? '';
                $participantCount = $chatRoom['participant_count'] ?? 0;
            }
            
            $activeDmId = $_SESSION['active_dm'] ?? null;
            $isActive = ($activeDmId == $roomId);
            $activeClass = $isActive ? 'bg-discord-light' : 'hover:bg-discord-light';
            ?>
            <div class="dm-friend-item flex items-center p-1.5 rounded <?php echo $activeClass; ?> text-discord-lighter hover:text-white cursor-pointer"
                 data-friend-id="<?php echo htmlspecialchars($otherUserId ?? ''); ?>"
                 data-chat-room-id="<?php echo htmlspecialchars($roomId); ?>"
                 data-chat-type="<?php echo htmlspecialchars($roomType); ?>"
                 data-username="<?php echo htmlspecialchars($roomName); ?>"
                 data-display-name="<?php echo htmlspecialchars($roomName); ?>"
                 data-room-type="<?php echo htmlspecialchars($roomType); ?>">
                <div class="relative mr-3">
                    <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                        <?php if ($roomType === 'direct'): ?>
                            <img src="<?php echo getUserAvatar($roomAvatar, $roomName); ?>" 
                                alt="Avatar" class="w-full h-full object-cover">
                        <?php else: ?>
                            <?php if ($roomAvatar): ?>
                                <img src="<?php echo htmlspecialchars($roomAvatar); ?>" 
                                    alt="Group Avatar" class="w-full h-full object-cover">
                            <?php else: ?>
                                <i class="fas fa-users text-gray-400 text-sm"></i>
                            <?php endif; ?>
                        <?php endif; ?>
                    </div>
                    <?php if ($roomType === 'direct' && $otherUserId): ?>
                        <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-dark <?php echo $statusColor; ?> user-status-indicator z-30" data-user-id="<?php echo htmlspecialchars($otherUserId); ?>"></span>
                    <?php elseif ($roomType === 'group'): ?>
                        <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-dark bg-green-500 z-30"></span>
                    <?php endif; ?>
                </div>
                <div class="flex-1 min-w-0">
                    <span class="font-medium truncate dm-username block" data-user-id="<?php echo htmlspecialchars($otherUserId ?? ''); ?>">
                        <?php echo htmlspecialchars($roomName); ?>
                    </span>
                    <?php if ($roomType === 'group'): ?>
                        <span class="text-xs text-gray-400 font-medium">Group</span>
                        <?php if (isset($participantCount)): ?>
                            <span class="text-xs text-gray-400"><?php echo $participantCount; ?> members</span>
                        <?php endif; ?>
                    <?php endif; ?>
                </div>
            </div>
        <?php endforeach; ?>
        </div>
    </div>

    <?php include dirname(__DIR__) . '/common/user-profile.php'; ?>
</div>

<?php include dirname(__DIR__) . '/home/new-direct-modal.php'; ?>

<style>
.dm-skeleton-container {
    animation-delay: 0.1s;
}

.dm-skeleton-item {
    opacity: 0;
    animation: dm-item-appear 0.5s ease forwards;
}

.dm-skeleton-item:nth-child(1) { animation-delay: 0.05s; }
.dm-skeleton-item:nth-child(2) { animation-delay: 0.1s; }
.dm-skeleton-item:nth-child(3) { animation-delay: 0.15s; }
.dm-skeleton-item:nth-child(4) { animation-delay: 0.2s; }

@keyframes dm-item-appear {
    from {
        opacity: 0;
        transform: translateY(5px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.skeleton-avatar {
    width: 32px;
    height: 32px;
}

.dm-skeleton-item .skeleton-text {
    width: 65%;
    height: 12px;
}
</style>

<script>
document.addEventListener('DOMContentLoaded', function() {

    
    function initializeDMSkeleton() {
        setTimeout(() => {
            hideDMSkeleton();
        }, 800);
    }
    
    function hideDMSkeleton() {

        
        const skeletonContainer = document.getElementById('dm-skeleton-loading');
        const realContent = document.getElementById('dm-real-content');
        
        if (skeletonContainer) {
            skeletonContainer.style.display = 'none';
        }
        
        if (realContent) {
            realContent.style.display = 'block';
        }
        
        updateAllUserStatuses();
    }
    
    function showDMSkeleton() {

        
        const skeletonContainer = document.getElementById('dm-skeleton-loading');
        const realContent = document.getElementById('dm-real-content');
        
        if (skeletonContainer) {
            skeletonContainer.style.display = 'block';
        }
        
        if (realContent) {
            realContent.style.display = 'none';
        }
    }
    
    initializeDMSkeleton();
    
    window.dmSidebarSkeleton = {
        show: showDMSkeleton,
        hide: hideDMSkeleton,
        initialized: true
    };
    
    function getStatusColor(isOnline) {
        return isOnline ? 'bg-discord-green' : 'bg-gray-500';
    }
    
    function updateUserStatus(userId, isOnline) {
        const statusIndicator = document.querySelector(`.user-status-indicator[data-user-id="${userId}"]`);
        if (statusIndicator) {
            statusIndicator.className = `absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-dark user-status-indicator ${getStatusColor(isOnline)} z-30`;

        }
    }
    
    function updateAllUserStatuses() {

        
        if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {

            return;
        }
        
        if (!window.FriendsManager) {
            console.warn('⚠️ [DM-SIDEBAR] FriendsManager not available, retrying in 1 second');
            setTimeout(updateAllUserStatuses, 1000);
            return;
        }
        
        if (window.FriendsManager) {
            const friendsManager = window.FriendsManager.getInstance();
            const onlineUsers = friendsManager.cache.onlineUsers || {};

            
            const allStatusIndicators = document.querySelectorAll('.user-status-indicator[data-user-id]');
            allStatusIndicators.forEach(indicator => {
                const userId = indicator.getAttribute('data-user-id');
                const isOnline = onlineUsers[userId] !== undefined;
                updateUserStatus(userId, isOnline);
            });
            

        }
        
    }
    
    function setupSocketListeners() {

        if (window.globalSocketManager && window.globalSocketManager.io && window.globalSocketManager.isReady()) {

            
            window.globalSocketManager.io.on('user-online', (data) => {

                if (data.user_id) {
                    updateUserStatus(data.user_id, true);
                }
            });
            
            window.globalSocketManager.io.on('user-offline', (data) => {

                if (data.user_id) {
                    updateUserStatus(data.user_id, false);
                }
            });
            
            window.globalSocketManager.io.on('user-presence-update', (data) => {

                if (data.user_id) {
                    const isOnline = data.status === 'online' || data.status === 'appear';
                    updateUserStatus(data.user_id, isOnline);
                }
            });
            

            updateAllUserStatuses();
            return true;
        }

        return false;
    }
    
    window.addEventListener('globalSocketReady', function() {

        setupSocketListeners();
    });
    
    window.addEventListener('socketAuthenticated', function() {

        setupSocketListeners();
    });
    
    setTimeout(() => {
        if (!setupSocketListeners()) {

        }
    }, 1000);
    
    setTimeout(() => {
        if (window.nitroCrownManager) {
            document.querySelectorAll('.dm-username[data-user-id]').forEach(el => {
                const userId = el.getAttribute('data-user-id');
                if (userId && userId !== 'null') {
                    window.nitroCrownManager.updateUserElement(el, userId);
                }
            });
        }
    }, 2000);
    
    document.addEventListener('click', function(e) {
        const dmItem = e.target.closest('.dm-friend-item');
        if (dmItem) {
            e.preventDefault();
            e.stopPropagation();
            
            const chatRoomId = dmItem.getAttribute('data-chat-room-id');
            const roomType = dmItem.getAttribute('data-room-type') || 'direct';
            const username = dmItem.getAttribute('data-username') || 'Chat';
            
            if (chatRoomId && window.directMessageNavigation) {
                window.directMessageNavigation.switchToChat(chatRoomId, username, roomType);
            }
        }
    });
    
    setInterval(() => {
        if (window.globalSocketManager && window.globalSocketManager.isReady()) {
            updateAllUserStatuses();
        }
    }, 60000);
});
</script>

