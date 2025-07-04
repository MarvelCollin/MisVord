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
    let lastRenderedState = null;
    
    function getStatusClass(status) {
        switch (status) {
            case 'online':
                return 'bg-discord-green';
            case 'afk':
                return 'bg-yellow-500';
            case 'offline':
            default:
                return 'bg-gray-500';
        }
    }
    
    function getStatusText(status) {
        switch (status) {
            case 'online':
                return 'Online';
            case 'afk':
                return 'Away';
            case 'offline':
            default:
                return 'Offline';
        }
    }
    
    function getActivityText(activityDetails) {
        if (!activityDetails || !activityDetails.type) {
            return 'Online';
        }
        
        switch (activityDetails.type) {
            case 'playing Tic Tac Toe':
                return 'Playing Tic Mac Voe';
            case 'afk':
                return 'Away';
            case 'idle':
            default:
                if (activityDetails.type.startsWith('In Voice - ')) {
                    return activityDetails.type;
                }
                return 'Online';
        }
    }
    
    function getActivityIcon(activityDetails) {
        if (!activityDetails || !activityDetails.type) {
            return 'fa-solid fa-circle';
        }
        
        switch (activityDetails.type) {
            case 'playing Tic Tac Toe':
                return 'fa-solid fa-gamepad';
            case 'afk':
                return 'fa-solid fa-clock';
            case 'idle':
            default:
                if (activityDetails.type.startsWith('In Voice - ')) {
                    return 'fa-solid fa-microphone';
                }
                return 'fa-solid fa-circle';
        }
    }
    
    function createFriendStateSignature(activeFriends) {
        return activeFriends.map(friend => {
            const userData = onlineUsers[friend.id];
            return {
                id: friend.id,
                username: friend.username,
                avatar_url: friend.avatar_url,
                status: userData?.status || 'offline',
                activity_type: userData?.activity_details?.type || 'idle'
            };
        }).sort((a, b) => a.username.localeCompare(b.username));
    }
    
    function statesAreEqual(state1, state2) {
        if (!state1 || !state2) return false;
        if (state1.length !== state2.length) return false;
        
        return state1.every((friend1, index) => {
            const friend2 = state2[index];
            return friend1.id === friend2.id &&
                   friend1.username === friend2.username &&
                   friend1.status === friend2.status &&
                   friend1.activity_type === friend2.activity_type;
        });
    }
    
    function updateExistingFriend(friendEl, friend, userData) {
        const status = userData?.status || 'offline';
        const statusClass = getStatusClass(status);
        const activityDetails = userData?.activity_details;
        const activityText = getActivityText(activityDetails);
        const activityIcon = getActivityIcon(activityDetails);
        
        const currentStatus = friendEl.getAttribute('data-status');
        if (currentStatus !== status) {
            const statusIndicator = friendEl.querySelector('.w-3.h-3.rounded-full');
            if (statusIndicator) {
                statusIndicator.className = `absolute bottom-0 right-0 w-3 h-3 rounded-full ${statusClass} border-2 border-discord-dark transition-colors duration-300`;
            }
            friendEl.setAttribute('data-status', status);
        }
        
        const activityEl = friendEl.querySelector('.text-xs.text-gray-400');
        if (activityEl) {
            const currentActivity = activityEl.textContent.trim();
            const newActivity = activityText;
            if (currentActivity !== newActivity) {
                activityEl.innerHTML = `<i class="${activityIcon} mr-1"></i>${activityText}`;
            }
        }
        
        if (window.nitroCrownManager) {
            const usernameEl = friendEl.querySelector('.active-now-username');
            if (usernameEl) {
                window.nitroCrownManager.updateUserElement(usernameEl, friend.id);
            }
        }
    }
    
    function createFriendElement(friend) {
        const userData = onlineUsers[friend.id];
        const status = userData?.status || 'offline';
        const statusClass = getStatusClass(status);
        const activityDetails = userData?.activity_details;
        const activityText = getActivityText(activityDetails);
        const activityIcon = getActivityIcon(activityDetails);
        const displayName = friend.display_name || friend.username;
        
        const friendEl = document.createElement('div');
        friendEl.className = 'flex items-center mb-4 p-3 bg-discord-background rounded-md hover:bg-discord-darker cursor-pointer transition-all duration-200 animate-fadeIn';
        friendEl.innerHTML = `
            <div class="relative mr-3">
                <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                    <img src="${friend.avatar_url || ''}" 
                         alt="${displayName}" 
                         class="w-full h-full object-cover user-avatar">
                </div>
                <div class="absolute bottom-0 right-0 w-3 h-3 rounded-full ${statusClass} border-2 border-discord-dark transition-colors duration-300"></div>
            </div>
            <div class="flex-1">
                <div class="font-semibold text-white active-now-username" data-user-id="${friend.id}">${displayName}</div>
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
        
        if (window.fallbackImageHandler) {
            const img = friendEl.querySelector('img.user-avatar');
            if (img) {
                window.fallbackImageHandler.processImage(img);
            }
        }
        
        if (window.nitroCrownManager) {
            const usernameEl = friendEl.querySelector('.active-now-username');
            if (usernameEl) {
                window.nitroCrownManager.updateUserElement(usernameEl, friend.id);
            }
        }
        
        return friendEl;
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
            return userData && (userData.status === 'online' || userData.status === 'afk');
        });

        const currentUserId = window.globalSocketManager?.userId;
        if (currentUserId && window.globalSocketManager?.currentActivityDetails?.type?.startsWith('In Voice - ')) {
            const currentUserData = onlineUsers[currentUserId];
            if (currentUserData && !activeFriends.find(f => f.id === currentUserId)) {
                const currentUser = {
                    id: currentUserId,
                    username: window.globalSocketManager.username || currentUserData.username,
                    avatar_url: window.globalSocketManager.avatarUrl || '/public/assets/common/default-profile-picture.png'
                };

                activeFriends.push(currentUser);
            }
        }

        const newState = createFriendStateSignature(activeFriends);
        
        if (statesAreEqual(lastRenderedState, newState)) {
            return;
        }

        if (activeFriends.length > 0) {
            const existingFriends = new Map();
            Array.from(activeFriendsList.children).forEach(child => {
                const userId = child.getAttribute('data-user-id');
                if (userId) {
                    existingFriends.set(userId, child);
                }
            });
            
            const newFriendsMap = new Map();
            activeFriends.forEach(friend => {
                newFriendsMap.set(friend.id, friend);
            });
            
            existingFriends.forEach((element, userId) => {
                if (!newFriendsMap.has(userId)) {
                    element.remove();
                }
            });
            
            const sortedActiveFriends = activeFriends.sort((a, b) => {
                const nameA = a.display_name || a.username;
                const nameB = b.display_name || b.username;
                return nameA.localeCompare(nameB);
            });
            
            sortedActiveFriends.forEach((friend, index) => {
                const existingEl = existingFriends.get(friend.id);
                
                if (existingEl) {
                    updateExistingFriend(existingEl, friend, onlineUsers[friend.id]);
                    
                    const currentIndex = Array.from(activeFriendsList.children).indexOf(existingEl);
                    if (currentIndex !== index) {
                        if (index === 0) {
                            activeFriendsList.prepend(existingEl);
                        } else {
                            const referenceEl = activeFriendsList.children[index];
                            activeFriendsList.insertBefore(existingEl, referenceEl);
                        }
                    }
                } else {
                    const newEl = createFriendElement(friend);
                    
                    if (index === 0) {
                        activeFriendsList.prepend(newEl);
                    } else if (index >= activeFriendsList.children.length) {
                        activeFriendsList.appendChild(newEl);
                    } else {
                        const referenceEl = activeFriendsList.children[index];
                        activeFriendsList.insertBefore(newEl, referenceEl);
                    }
                }
            });
            
            activeFriendsList.classList.remove('hidden');
            noActiveFriends.classList.add('hidden');
        } else {
            activeFriendsList.classList.add('hidden');
            noActiveFriends.classList.remove('hidden');
        }
        
        lastRenderedState = newState;
    }
    
    function setupFriendsManagerIntegration() {
        if (window.globalPresenceManager) {

            return;
        }
        
        if (window.FriendsManager) {
            const friendsManager = window.FriendsManager.getInstance();
            
            friendsManager.subscribe((type, data) => {

                
                switch (type) {
                    case 'user-online':
                    case 'user-offline':
                    case 'user-presence-update':
                        if (data && data.activity_details && data.activity_details.type && data.activity_details.type.startsWith('In Voice - ')) {

                        }
                        break;
                    case 'online-users-updated':
                        break;
                }
                
                onlineUsers = friendsManager.cache.onlineUsers || {};

                scheduleUpdate();
            });
            
            onlineUsers = friendsManager.cache.onlineUsers || {};

        } else {
            console.warn('⚠️ [ACTIVE-NOW] FriendsManager not available, retrying in 500ms');
            setTimeout(setupFriendsManagerIntegration, 500);
        }
        
        if (window.globalSocketManager && window.globalSocketManager.io) {
            window.globalSocketManager.io.on('user-presence-update', (data) => {

                if (data && data.activity_details && data.activity_details.type && data.activity_details.type.startsWith('In Voice - ')) {

                }
                scheduleUpdate();
            });
        }
        
        window.addEventListener('ownPresenceUpdate', (event) => {

            scheduleUpdate();
        });
    }
    
    function initializeActiveNowSection() {

        

        if (window.FallbackImageHandler) {
            window.fallbackImageHandler = window.FallbackImageHandler.getInstance();
        }
        
        setupFriendsManagerIntegration();
        updateActiveFriends();
    }
    
    initializeActiveNowSection();
    
    window.testVoicePresence = function() {

        
        if (!window.globalSocketManager?.isReady()) {
            console.error('❌ Socket not ready');
            return;
        }
        

        window.globalSocketManager.updatePresence('online', { 
            type: 'In Voice - Test Channel',
            channel_name: 'Test Channel'
        });
        
        setTimeout(() => {

            if (window.voicePresenceDebug) {
                window.voicePresenceDebug.checkActiveNowDisplay();
            }
        }, 1000);
        
        setTimeout(() => {

            window.globalSocketManager.updatePresence('online', { type: 'idle' });
        }, 5000);
        
        setTimeout(() => {

            if (window.voicePresenceDebug) {
                window.voicePresenceDebug.checkActiveNowDisplay();
            }
        }, 6000);
    };
    



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