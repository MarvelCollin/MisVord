<?php
$currentUser = $GLOBALS['currentUser'] ?? null;
$friends = $GLOBALS['friends'] ?? [];
$onlineFriends = $GLOBALS['onlineFriends'] ?? [];
?>

<div class="flex-1 p-4 overflow-y-auto bg-discord-background">
    <div class="flex items-center justify-between mb-4">
        <h2 class="text-gray-400 font-bold text-xs uppercase">Online — <span id="online-count"><?php echo count($onlineFriends); ?></span></h2>
        <div class="relative w-60">
            <input type="text" placeholder="Search" class="w-full bg-discord-dark text-white text-sm rounded px-3 py-1 pl-8 focus:outline-none focus:ring-1 focus:ring-discord-primary">
            <i class="fas fa-search absolute left-2.5 top-1.5 text-gray-500 text-sm"></i>
        </div>
    </div>

    <div class="space-y-1 online-friends-container" data-lazyload="friend-list">
        <!-- Skeleton loader - displayed until content loads -->
        <div class="skeleton-content">
            <?php for ($i = 0; $i < 5; $i++): ?>
                <div class="skeleton-item flex justify-between items-center p-2">
                    <div class="flex items-center">
                        <div class="skeleton skeleton-avatar mr-3"></div>
                        <div>
                            <div class="skeleton skeleton-text mb-1"></div>
                            <div class="skeleton skeleton-text-sm"></div>
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <div class="skeleton w-8 h-8 rounded-full"></div>
                        <div class="skeleton w-8 h-8 rounded-full"></div>
                    </div>
                </div>
            <?php endfor; ?>
        </div>
        
        <!-- Actual content loaded via LazyLoader -->
        <div class="friend-content hidden">
            <?php if (empty($friends)): ?>
            <div class="p-4 bg-discord-dark rounded text-center">
                <div class="mb-2 text-gray-400">
                    <i class="fa-solid fa-user-group text-3xl"></i>
                </div>
                <p class="text-gray-300 mb-1">No friends found</p>
                <p class="text-gray-500 text-sm">Add some friends to get started!</p>
            </div>
            <?php else: ?>
                <?php foreach ($friends as $friend): ?>
                    <?php 
                    $statusText = 'Offline';
                    $statusColor = 'bg-gray-500';
                    ?>
                    <div class="flex justify-between items-center p-2 rounded hover:bg-discord-light group friend-item" 
                         data-user-id="<?php echo htmlspecialchars($friend['id']); ?>"
                         data-username="<?php echo htmlspecialchars($friend['username']); ?>">
                        <div class="flex items-center">
                            <div class="relative mr-3">
                                <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                    <img src="<?php echo getUserAvatar($friend['avatar'] ?? '', $friend['username'] ?? 'User'); ?>" 
                                         alt="Avatar" class="w-full h-full object-cover">
                                </div>
                                <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-background <?php echo $statusColor; ?> friend-status-indicator" data-user-id="<?php echo htmlspecialchars($friend['id']); ?>"></span>
                            </div>
                            <div>
                                <div class="font-medium text-white"><?php echo htmlspecialchars($friend['username']); ?><?php if (isset($friend['discriminator'])): ?><span class="text-gray-400 text-xs ml-1">#<?php echo htmlspecialchars($friend['discriminator']); ?></span><?php endif; ?></div>
                                <div class="text-xs text-gray-400 friend-status-text" data-user-id="<?php echo htmlspecialchars($friend['id']); ?>"><?php echo htmlspecialchars($statusText); ?></div>
                            </div>
                        </div>
                        <div class="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button class="p-2 text-gray-400 hover:text-white hover:bg-discord-background rounded-full" title="Message" onclick="createDirectMessage('<?php echo htmlspecialchars($friend['id']); ?>')">
                                <i class="fa-solid fa-message"></i>
                            </button>
                            <button class="p-2 text-gray-400 hover:text-white hover:bg-discord-background rounded-full" title="More">
                                <i class="fa-solid fa-ellipsis-vertical"></i>
                            </button>
                        </div>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        if (window.LazyLoader && typeof window.LazyLoader.triggerDataLoaded === 'function') {
            window.LazyLoader.triggerDataLoaded('friend-list', <?php echo empty($friends) ? 'true' : 'false'; ?>);
            
            document.querySelector('.skeleton-content').classList.add('hidden');
            document.querySelector('.friend-content').classList.remove('hidden');
        } else {
            console.warn('LazyLoader.triggerDataLoaded not available yet');
        }
        
        // Update friend status with WebSocket data
        updateFriendStatus();
    }, 750);
    
    // Function to update friend status based on WebSocket data
    function updateFriendStatus() {
        if (!window.ChatAPI || typeof window.ChatAPI.getOnlineUsers !== 'function') {
            console.warn('ChatAPI not available for status updates');
            setTimeout(updateFriendStatus, 2000); // Try again in 2 seconds
            return;
        }

        window.ChatAPI.getOnlineUsers().then(onlineUsers => {
            const statusIndicators = document.querySelectorAll('.friend-status-indicator');
            const statusTexts = document.querySelectorAll('.friend-status-text');
            let onlineCount = 0;
            
            const allFriendItems = document.querySelectorAll('.friend-item');
            
            // First, make all friends visible
            allFriendItems.forEach(item => {
                item.style.display = 'flex';
            });
            
            // Update status for each friend
            statusIndicators.forEach(indicator => {
                const userId = indicator.getAttribute('data-user-id');
                let isOnline = false;
                
                if (onlineUsers[userId]) {
                    // User is online in WebSocket
                    isOnline = true;
                    onlineCount++;
                    const status = onlineUsers[userId].status || 'online';
                    
                    // Set appropriate status color
                    indicator.classList.remove('bg-gray-500', 'bg-discord-green', 'bg-discord-yellow', 'bg-discord-red');
                    
                    if (status === 'online' || status === 'appear') {
                        indicator.classList.add('bg-discord-green');
                    } else if (status === 'away' || status === 'idle') {
                        indicator.classList.add('bg-discord-yellow');
                    } else if (status === 'dnd' || status === 'do_not_disturb') {
                        indicator.classList.add('bg-discord-red');
                    } else {
                        indicator.classList.add('bg-gray-500');
                    }
                    
                    // Update status text
                    const statusText = document.querySelector(`.friend-status-text[data-user-id="${userId}"]`);
                    if (statusText) {
                        if (status === 'online' || status === 'appear') {
                            statusText.textContent = 'Online';
                        } else if (status === 'away' || status === 'idle') {
                            statusText.textContent = 'Away';
                        } else if (status === 'dnd' || status === 'do_not_disturb') {
                            statusText.textContent = 'Do Not Disturb';
                        } else {
                            statusText.textContent = 'Online';
                        }
                    }
                } else {
                    // User is offline
                    indicator.classList.remove('bg-discord-green', 'bg-discord-yellow', 'bg-discord-red');
                    indicator.classList.add('bg-gray-500');
                    
                    // Update status text
                    const statusText = document.querySelector(`.friend-status-text[data-user-id="${userId}"]`);
                    if (statusText) {
                        statusText.textContent = 'Offline';
                    }
                    
                    // Hide offline friends in the online tab
                    const friendItem = document.querySelector(`.friend-item[data-user-id="${userId}"]`);
                    if (friendItem && window.location.pathname === '/app/friends' && !window.location.search.includes('tab=all')) {
                        friendItem.style.display = 'none';
                    }
                }
            });
            
            // Update online count
            const onlineCountEl = document.getElementById('online-count');
            if (onlineCountEl) {
                onlineCountEl.textContent = onlineCount;
            }
        }).catch(error => {
            console.error('Error updating friend status:', error);
        });
    }

    // Update status indicators periodically
    setInterval(updateFriendStatus, 30000);

    // Update status when socket connection is established
    if (window.globalSocketManager) {
        window.globalSocketManager.onReady = function() {
            updateFriendStatus();
        };
    }

    // Listen for presence updates
    if (window.globalSocketManager && window.globalSocketManager.io) {
        window.globalSocketManager.io.on('user-presence-update', function() {
            updateFriendStatus();
        });
    }
});
</script>