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
    let isSocketReady = false;
    
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
                return 'Idle';
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
    
    function updateUserStatus(userId, status, username) {
        console.log(`🔄 [ACTIVE-NOW] Updating user ${username} (${userId}) status to ${status}`);
        
        if (status === 'offline' || status === 'invisible') {
            if (onlineUsers[userId]) {
                delete onlineUsers[userId];
            }
        } else {
            onlineUsers[userId] = {
                user_id: userId,
                username: username,
                status: status,
                last_seen: Date.now()
            };
        }
        
        scheduleUpdate();
    }
    
    function scheduleUpdate() {
        if (updateTimer) {
            clearTimeout(updateTimer);
        }
        
        updateTimer = setTimeout(() => {
            renderActiveFriends();
        }, 50);
    }
    
    function renderActiveFriends() {
        const activeFriends = friends.filter(friend => {
            const userData = onlineUsers[friend.id];
            return userData && userData.status !== 'offline';
        });
        
        console.log(`📊 [ACTIVE-NOW] Rendering ${activeFriends.length} active friends`);
        
        if (activeFriends.length > 0) {
            activeFriendsList.innerHTML = '';
            
            activeFriends.sort((a, b) => {
                const statusA = onlineUsers[a.id]?.status || 'idle';
                const statusB = onlineUsers[b.id]?.status || 'idle';
                
                if (statusA === 'online' && statusB !== 'online') return -1;
                if (statusB === 'online' && statusA !== 'online') return 1;
                if (statusA === 'idle' && statusB === 'offline') return -1;
                if (statusB === 'idle' && statusA === 'offline') return 1;
                
                return a.username.localeCompare(b.username);
            });
            
            activeFriends.forEach(friend => {
                const userData = onlineUsers[friend.id];
                const status = userData?.status || 'idle';
                const statusClass = getStatusClass(status);
                const statusText = getStatusText(status);
                
                const friendEl = document.createElement('div');
                friendEl.className = 'flex items-center mb-4 p-3 bg-discord-background rounded-md hover:bg-discord-darker cursor-pointer transition-all duration-200 animate-fadeIn';
                friendEl.innerHTML = `
                    <div class="relative mr-3">
                        <img src="${friend.avatar_url || '/public/assets/common/default-profile-picture.png'}" 
                             alt="${friend.username}" 
                             class="w-10 h-10 rounded-full">
                        <div class="absolute bottom-0 right-0 w-3 h-3 rounded-full ${statusClass} border-2 border-discord-dark transition-colors duration-300"></div>
                    </div>
                    <div class="flex-1">
                        <div class="font-semibold text-white">${friend.username}</div>
                        <div class="text-xs text-gray-400 transition-all duration-200">${statusText}</div>
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
            });
            
            activeFriendsList.classList.remove('hidden');
            noActiveFriends.classList.add('hidden');
        } else {
            activeFriendsList.classList.add('hidden');
            noActiveFriends.classList.remove('hidden');
        }
    }
    
    function loadInitialOnlineUsers() {
        if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
            setTimeout(loadInitialOnlineUsers, 500);
            return;
        }
        
        console.log('🔄 [ACTIVE-NOW] Loading initial online users...');
        
        if (window.presenceManager && window.presenceManager.getOnlineUsers) {
            onlineUsers = window.presenceManager.getOnlineUsers();
            renderActiveFriends();
        } else if (window.ChatAPI && window.ChatAPI.getOnlineUsers) {
            window.ChatAPI.getOnlineUsers().then(users => {
                onlineUsers = users || {};
                renderActiveFriends();
            }).catch(error => {
                console.error('❌ [ACTIVE-NOW] Failed to load initial users:', error);
            });
        }
    }
    
    function handleUserOnline(data) {
        console.log('👥 [ACTIVE-NOW] User came online:', data);
        if (data.user_id && data.username) {
            updateUserStatus(data.user_id, data.status || 'online', data.username);
        }
    }
    
    function handleUserOffline(data) {
        console.log('👥 [ACTIVE-NOW] User went offline:', data);
        if (data.user_id && data.username) {
            updateUserStatus(data.user_id, 'offline', data.username);
        }
    }
    
    function handlePresenceUpdate(data) {
        console.log('👥 [ACTIVE-NOW] User presence updated:', data);
        if (data.user_id && data.username) {
            updateUserStatus(data.user_id, data.status, data.username);
        }
    }
    
    function setupSocketListeners() {
        if (!window.globalSocketManager || !window.globalSocketManager.io) {
            console.warn('⚠️ [ACTIVE-NOW] Socket manager not ready');
            return false;
        }
        
        console.log('🔌 [ACTIVE-NOW] Setting up real-time socket listeners');
        
        const socket = window.globalSocketManager.io;
        
        socket.off('user-online');
        socket.off('user-offline'); 
        socket.off('user-presence-update');
        
        socket.on('user-online', handleUserOnline);
        socket.on('user-offline', handleUserOffline);
        socket.on('user-presence-update', handlePresenceUpdate);
        
        socket.on('online-users-response', (data) => {
            console.log('📊 [ACTIVE-NOW] Received online users response:', data);
            onlineUsers = data.users || {};
            renderActiveFriends();
        });
        
        isSocketReady = true;
        console.log('✅ [ACTIVE-NOW] Real-time socket listeners configured');
        
        loadInitialOnlineUsers();
        return true;
    }
    
    function setupPresenceListeners() {
        console.log('🎯 [ACTIVE-NOW] Setting up presence manager listeners');
        
        window.addEventListener('presenceUserOnline', (event) => {
            handleUserOnline(event.detail);
        });
        
        window.addEventListener('presenceUserOffline', (event) => {
            handleUserOffline(event.detail);
        });
        
        window.addEventListener('presenceUpdate', (event) => {
            handlePresenceUpdate(event.detail);
        });
        
        window.addEventListener('userStatusChanged', (event) => {
            const currentUserId = <?php echo json_encode($currentUserId); ?>;
            if (currentUserId) {
                console.log('👤 [ACTIVE-NOW] Current user status changed:', event.detail);
            }
        });
        
        console.log('✅ [ACTIVE-NOW] Presence listeners configured');
    }
    
    function initializeActiveNow() {
        console.log('🚀 [ACTIVE-NOW] Initializing real-time active now section');
        
        setupPresenceListeners();
        
        if (window.globalSocketManager && window.globalSocketManager.isReady()) {
            setupSocketListeners();
        } else {
            console.log('⏳ [ACTIVE-NOW] Waiting for socket to be ready...');
        }
    }
    
    window.addEventListener('globalSocketReady', function(event) {
        console.log('🔌 [ACTIVE-NOW] Socket ready event received');
        setupSocketListeners();
    });
    
    window.addEventListener('socketAuthenticated', function(event) {
        console.log('🔐 [ACTIVE-NOW] Socket authenticated event received');
        if (!isSocketReady) {
            setupSocketListeners();
        }
    });
    
    window.addEventListener('globalSocketDisconnected', function() {
        console.log('❌ [ACTIVE-NOW] Socket disconnected');
        isSocketReady = false;
        onlineUsers = {};
        renderActiveFriends();
    });
    
    initializeActiveNow();
    
    setInterval(() => {
        if (isSocketReady && window.globalSocketManager && window.globalSocketManager.isReady()) {
            window.globalSocketManager.io.emit('get-online-users');
        }
    }, 30000);
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
</style>