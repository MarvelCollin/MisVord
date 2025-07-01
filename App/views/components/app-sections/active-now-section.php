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
    
    let onlineUsers = {};
    let updateTimer = null;
    
    function getStatusClass(status) {
        switch (status) {
            case 'online':
                return 'bg-discord-green';
            case 'offline':
            default:
                return 'bg-gray-500';
        }
    }
    
    function getStatusText(status) {
        switch (status) {
            case 'online':
                return 'Online';
            case 'offline':
            default:
                return 'Offline';
        }
    }
    
    function getActivityText(activityDetails) {
        if (!activityDetails || !activityDetails.type) {
            return 'Idle';
        }
        
        switch (activityDetails.type) {
            case 'playing Tic Tac Toe':
                return 'Playing Tic Mac Voe';
            case 'In Voice Call':
                return 'In Voice Call';
            case 'idle':
            default:
                return 'Idle';
        }
    }
    
    function getActivityIcon(activityDetails) {
        if (!activityDetails || !activityDetails.type) {
            return 'fa-solid fa-moon';
        }
        
        switch (activityDetails.type) {
            case 'playing Tic Tac Toe':
                return 'fa-solid fa-gamepad';
            case 'In Voice Call':
                return 'fa-solid fa-microphone';
            case 'idle':
            default:
                return 'fa-solid fa-moon';
        }
    }
    

    
    function scheduleUpdate() {
        if (updateTimer) {
            clearTimeout(updateTimer);
        }
        
        updateTimer = setTimeout(() => {
            updateActiveFriends();
        }, 50);
    }
    
    function updateActiveFriends() {
        const activeFriends = friends.filter(friend => {
            const userData = onlineUsers[friend.id];
            return userData && userData.status === 'online';
        });

        if (activeFriends.length > 0) {
            activeFriendsList.innerHTML = '';
            
            activeFriends.sort((a, b) => a.username.localeCompare(b.username));
            
            activeFriends.forEach(friend => {
                const userData = onlineUsers[friend.id];
                const status = userData?.status === 'online' ? 'online' : 'offline';
                const statusClass = getStatusClass(status);
                const activityDetails = userData?.activity_details;
                const activityText = getActivityText(activityDetails);
                const activityIcon = getActivityIcon(activityDetails);
                
                const friendEl = document.createElement('div');
                friendEl.className = 'flex items-center mb-4 p-3 bg-discord-background rounded-md hover:bg-discord-darker cursor-pointer transition-all duration-200 animate-fadeIn';
                friendEl.innerHTML = `
                    <div class="relative mr-3">
                        <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                            <img src="${friend.avatar_url || ''}" 
                                 alt="${friend.username}" 
                                 class="w-full h-full object-cover user-avatar">
                        </div>
                        <div class="absolute bottom-0 right-0 w-3 h-3 rounded-full ${statusClass} border-2 border-discord-dark transition-colors duration-300"></div>
                    </div>
                    <div class="flex-1">
                        <div class="font-semibold text-white">${friend.username}</div>
                        <div class="text-xs text-gray-400 transition-all duration-200 flex items-center">
                            <i class="${activityIcon} mr-1"></i>
                            ${activityText}
                        </div>
                    </div>
                `;
                
                friendEl.setAttribute('data-user-id', friend.id);
                friendEl.setAttribute('data-status', status);
                friendEl.addEventListener('click', function() {
                    if (window.userDetailModal) {
                        window.userDetailModal.show({
                            userId: friend.id
                        });
                    }
                });
                
                activeFriendsList.appendChild(friendEl);
                
                // Apply fallback image handler to the new image
                if (window.fallbackImageHandler) {
                    const img = friendEl.querySelector('img.user-avatar');
                    if (img) {
                        window.fallbackImageHandler.processImage(img);
                    }
                }
            });
            
            activeFriendsList.classList.remove('hidden');
            noActiveFriends.classList.add('hidden');
        } else {
            activeFriendsList.classList.add('hidden');
            noActiveFriends.classList.remove('hidden');
        }
    }
    
    function setupFriendsManagerIntegration() {
        if (window.globalPresenceManager) {
            console.log('🌐 [ACTIVE-NOW] Using global presence manager');
            return;
        }
        
        if (window.FriendsManager) {
            const friendsManager = window.FriendsManager.getInstance();
            
            friendsManager.subscribe((type, data) => {
                console.log(`🔄 [ACTIVE-NOW] FriendsManager event: ${type}`, data);
                
                switch (type) {
                    case 'user-online':
                    case 'user-offline':
                    case 'user-presence-update':
                    case 'online-users-updated':
                        onlineUsers = friendsManager.cache.onlineUsers || {};
                        console.log('📊 [ACTIVE-NOW] Updated onlineUsers from FriendsManager:', Object.keys(onlineUsers).length, Object.keys(onlineUsers));
                        updateActiveFriends();
                        break;
                }
            });
            
            onlineUsers = friendsManager.cache.onlineUsers || {};
            console.log('📊 [ACTIVE-NOW] Initial onlineUsers from FriendsManager:', Object.keys(onlineUsers).length, Object.keys(onlineUsers));
        } else {
            console.warn('⚠️ [ACTIVE-NOW] FriendsManager not available, retrying in 500ms');
            setTimeout(setupFriendsManagerIntegration, 500);
        }
    }
    
    function initializeActiveNowSection() {
        console.log('🚀 [ACTIVE-NOW] Initializing Active Now section');
        
        // Initialize fallback image handler
        if (window.FallbackImageHandler) {
            window.fallbackImageHandler = window.FallbackImageHandler.getInstance();
        }
        
        setupFriendsManagerIntegration();
        updateActiveFriends();
    }
    
    initializeActiveNowSection();
});
</script>

<style>
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

.animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
}

#active-friends-list .transition-all {
    transition: all 0.2s ease-in-out;
}

#active-friends-list .hover\:bg-discord-darker:hover {
    transform: translateX(2px);
}

.user-avatar {
    transition: transform 0.2s ease;
}

.user-avatar:hover {
    transform: scale(1.05);
}
</style>