<?php
require_once dirname(dirname(dirname(__DIR__))) . '/controllers/FriendController.php';

$currentUserId = $_SESSION['user_id'] ?? null;

$friendController = new FriendController();
$friendData = $friendController->getUserFriends();
$friends = $friendData['friends'] ?? [];
?>

<div class="w-60 bg-discord-dark border-l border-gray-800 flex flex-col h-full max-h-screen">
    <div class="h-12 border-b border-gray-800 flex items-center px-4">
        <h2 class="font-semibold text-white">Active Now</h2>
    </div>

    <div class="flex-1 overflow-y-auto p-4" id="active-now-container">
        <div class="rounded-lg bg-discord-background p-6 text-center" id="no-active-friends">
            <h3 class="font-semibold text-white mb-2 text-lg">It's quiet for now...</h3>
            <p class="text-gray-400 text-sm">When friends start an activity, like playing a game or hanging out on voice, we'll show it here!</p>
        </div>
        
        <div id="active-friends-list" class="hidden">
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const activeFriendsList = document.getElementById('active-friends-list');
    const noActiveFriends = document.getElementById('no-active-friends');
    const friends = <?php echo json_encode($friends); ?>;
    
    function getStatusClass(status) {
        switch (status) {
            case 'online':
            case 'appear':
                return 'bg-discord-green';
            case 'idle':
            case 'away':
                return 'bg-discord-yellow';
            case 'dnd':
            case 'do_not_disturb':
                return 'bg-discord-red';
            case 'invisible':
            case 'offline':
            default:
                return 'bg-gray-500';
        }
    }
    
    function getStatusText(status) {
        switch (status) {
            case 'online':
            case 'appear':
                return 'Online';
            case 'idle':
            case 'away':
                return 'Away';
            case 'dnd':
            case 'do_not_disturb':
                return 'Do Not Disturb';
            case 'invisible':
                return 'Invisible';
            case 'offline':
            default:
                return 'Offline';
        }
    }
    
    function updateActiveFriends() {
        if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
            setTimeout(updateActiveFriends, 1000);
            return;
        }
        
        window.ChatAPI.getOnlineUsers().then(onlineUsers => {
            const activeFriends = friends.filter(friend => {
                return onlineUsers[friend.id] !== undefined;
            });
            
            if (activeFriends.length > 0) {
                activeFriendsList.innerHTML = '';
                
                activeFriends.forEach(friend => {
                    const status = onlineUsers[friend.id]?.status || 'online';
                    const statusClass = getStatusClass(status);
                    const statusText = getStatusText(status);
                    
                    const friendEl = document.createElement('div');
                    friendEl.className = 'flex items-center mb-4 p-3 bg-discord-background rounded-md hover:bg-discord-darker cursor-pointer';
                    friendEl.innerHTML = `
                        <div class="relative mr-3">
                            <img src="${friend.avatar_url || '/public/assets/common/default-profile-picture.png'}" 
                                 alt="${friend.username}" 
                                 class="w-10 h-10 rounded-full">
                            <div class="absolute bottom-0 right-0 w-3 h-3 rounded-full ${statusClass} border-2 border-discord-dark"></div>
                        </div>
                        <div class="flex-1">
                            <div class="font-semibold text-white">${friend.username}</div>
                            <div class="text-xs text-gray-400">${statusText}</div>
                        </div>
                    `;
                    
                    friendEl.setAttribute('data-user-id', friend.id);
                    friendEl.addEventListener('click', function() {
                        if (window.userDetailModal) {
                            window.userDetailModal.show({
                                userId: friend.id
                            });
                        }
                    });
                    
                    activeFriendsList.appendChild(friendEl);
                });
                
                activeFriendsList.classList.remove('hidden');
                noActiveFriends.classList.add('hidden');
            } else {
                activeFriendsList.classList.add('hidden');
                noActiveFriends.classList.remove('hidden');
            }
        });
    }
    
    updateActiveFriends();
    
    function setupSocketListeners() {
        console.log('🔌 [ACTIVE-NOW] Setting up socket listeners');
        if (window.globalSocketManager && window.globalSocketManager.io) {
            console.log('✅ [ACTIVE-NOW] Socket manager available, setting up listeners');
            
            window.globalSocketManager.io.on('user-online', (data) => {
                console.log('👥 [ACTIVE-NOW] User came online:', data);
                setTimeout(updateActiveFriends, 100);
            });
            
            window.globalSocketManager.io.on('user-offline', (data) => {
                console.log('👥 [ACTIVE-NOW] User went offline:', data);
                setTimeout(updateActiveFriends, 100);
            });
            
            window.globalSocketManager.io.on('user-presence-update', (data) => {
                console.log('👥 [ACTIVE-NOW] User presence updated:', data);
                setTimeout(updateActiveFriends, 100);
            });
            
            window.globalSocketManager.io.on('status-changed', (data) => {
                console.log('👥 [ACTIVE-NOW] User status changed:', data);
                setTimeout(updateActiveFriends, 100);
            });
            
            console.log('✅ [ACTIVE-NOW] All socket listeners set up');
            return true;
        }
        console.warn('⚠️ [ACTIVE-NOW] Socket manager not ready yet');
        return false;
    }
    
    window.addEventListener('globalSocketReady', function() {
        console.log('🔌 [ACTIVE-NOW] Global socket ready event received');
        setupSocketListeners();
        updateActiveFriends();
    });
    
    window.addEventListener('socketAuthenticated', function() {
        console.log('🔐 [ACTIVE-NOW] Socket authenticated event received');
        setupSocketListeners();
        updateActiveFriends();
    });
    
    if (!setupSocketListeners()) {
        let retryCount = 0;
        const maxRetries = 10;
        const retryInterval = setInterval(() => {
            retryCount++;
            console.log(`🔄 [ACTIVE-NOW] Retry ${retryCount}/${maxRetries} to setup socket listeners`);
            
            if (setupSocketListeners() || retryCount >= maxRetries) {
                clearInterval(retryInterval);
                if (retryCount >= maxRetries) {
                    console.error('❌ [ACTIVE-NOW] Failed to setup socket listeners after max retries');
                }
            }
        }, 1000);
    }
    
    setInterval(updateActiveFriends, 60000);
});
</script>