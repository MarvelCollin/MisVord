<?php
$activeTab = $GLOBALS['activeTab'] ?? 'online';
$friends = $GLOBALS['friends'] ?? [];
$onlineFriends = $GLOBALS['onlineFriends'] ?? [];
$pendingRequests = $GLOBALS['pendingRequests'] ?? [];
$sentRequests = $GLOBALS['sentRequests'] ?? [];
$pendingCount = $GLOBALS['pendingCount'] ?? 0;
?>

<div class="flex-1 bg-discord-background flex flex-col">
    <div class="h-auto min-h-[48px] bg-discord-background border-b border-gray-800 flex items-center justify-between px-4 py-2">
        <div class="flex items-center">
            <i class="fa-solid fa-user-group text-[18px] text-gray-400 mr-2"></i>
            <span class="font-semibold text-white">Friends</span>
        </div>
        
        <div class="hidden md:flex items-center space-x-4 text-sm friends-desktop-tabs">
            <?php
            $tabs = [
                'online' => 'Online',
                'all' => 'All',
                'pending' => 'Pending'
            ];
            
            foreach ($tabs as $tab => $label) {
                $activeClass = ($activeTab === $tab) 
                    ? 'text-white bg-discord-primary hover:bg-discord-primary/90' 
                    : 'text-gray-300 hover:text-white hover:bg-discord-light';
                    
                $displayLabel = $label;
                if ($tab === 'pending' && $pendingCount > 0) {
                    $displayLabel .= ' <span class="bg-discord-red text-white text-xs rounded-full px-1.5 py-0.5 ml-1">' . $pendingCount . '</span>';
                }
                
                echo "<button class='{$activeClass} px-3 py-1 rounded' data-tab='{$tab}'>{$displayLabel}</button>";
            }
            
            $addFriendClass = ($activeTab === 'add-friend') 
                ? 'bg-discord-green hover:bg-discord-green/90' 
                : 'bg-discord-green hover:bg-discord-green/90';
            ?>
            <button class="<?php echo $addFriendClass; ?> text-white px-3 py-1 rounded" data-tab="add-friend">Add Friend</button>
        </div>
        
        <div class="md:hidden">
            <button id="friends-menu-toggle" class="text-gray-400 hover:text-white p-2 rounded-md hover:bg-discord-light">
                <i class="fa-solid fa-bars text-lg"></i>
            </button>
        </div>
    </div>
    
    <div id="friends-mobile-menu" class="hidden md:hidden bg-discord-dark border-b border-gray-800 p-3">
        <div class="flex flex-col space-y-2">
            <?php
            foreach ($tabs as $tab => $label) {
                $activeClass = ($activeTab === $tab) 
                    ? 'text-white bg-discord-primary' 
                    : 'text-gray-300 hover:text-white hover:bg-discord-light';
                    
                $displayLabel = $label;
                if ($tab === 'pending' && $pendingCount > 0) {
                    $displayLabel .= ' <span class="bg-discord-red text-white text-xs rounded-full px-1.5 py-0.5 ml-1">' . $pendingCount . '</span>';
                }
                
                echo "<button class='{$activeClass} px-3 py-2 rounded text-sm block text-center w-full' data-tab='{$tab}'>{$displayLabel}</button>";
            }
            
            $addFriendClass = ($activeTab === 'add-friend') 
                ? 'bg-discord-green' 
                : 'bg-discord-green hover:bg-discord-green/90';
            ?>
            <button class="<?php echo $addFriendClass; ?> text-white px-3 py-2 rounded text-sm block text-center w-full" data-tab="add-friend">Add Friend</button>
        </div>
    </div>

    <div class="tab-content <?php echo $activeTab === 'online' ? '' : 'hidden'; ?>" id="online-tab">
        <div class="flex-1 p-4 overflow-y-auto bg-discord-background">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-gray-400 font-bold text-xs uppercase">Online — <span id="online-count">0</span></h2>
                <div class="relative w-60">
                    <input type="text" placeholder="Search" class="w-full bg-discord-dark text-white text-sm rounded px-3 py-1 pl-8 focus:outline-none focus:ring-1 focus:ring-discord-primary" id="online-search">
                    <i class="fas fa-search absolute left-2.5 top-1.5 text-gray-500 text-sm"></i>
                </div>
            </div>

            <div class="space-y-1" id="online-friends-container">
                <div class="p-4 bg-discord-dark rounded text-center">
                    <div class="mb-2 text-gray-400">
                        <i class="fa-solid fa-user-group text-3xl"></i>
                    </div>
                    <p class="text-gray-300 mb-1">No friends online</p>
                    <p class="text-gray-500 text-sm">Friends will appear here when they come online</p>
                </div>
            </div>
        </div>
    </div>
    
    <div class="tab-content <?php echo $activeTab === 'all' ? '' : 'hidden'; ?>" id="all-tab">
        <div class="flex-1 p-4 overflow-y-auto bg-discord-background">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-gray-400 font-bold text-xs uppercase">All Friends — <?php echo count($friends); ?></h2>
                <div class="relative w-60">
                    <input type="text" placeholder="Search" class="w-full bg-discord-dark text-white text-sm rounded px-3 py-1 pl-8 focus:outline-none focus:ring-1 focus:ring-discord-primary" id="all-search">
                    <i class="fas fa-search absolute left-2.5 top-1.5 text-gray-500 text-sm"></i>
                </div>
            </div>
            
            <div class="space-y-1" id="all-friends-container">
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
                        <div class="flex justify-between items-center p-3 rounded hover:bg-discord-light group friend-item transition-all duration-200" 
                             data-user-id="<?php echo htmlspecialchars($friend['id']); ?>"
                             data-username="<?php echo htmlspecialchars($friend['username']); ?>">
                            <div class="flex items-center">
                                <div class="relative mr-3">
                                    <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                        <img src="<?php echo htmlspecialchars($friend['avatar_url'] ?? ''); ?>" 
                                             alt="<?php echo htmlspecialchars($friend['username'] ?? 'User'); ?>" 
                                             class="w-full h-full object-cover user-avatar">
                                    </div>
                                    <div class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-background bg-gray-500 friend-status-indicator transition-colors duration-300" data-user-id="<?php echo htmlspecialchars($friend['id']); ?>"></div>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="font-medium text-white friend-name truncate"><?php echo htmlspecialchars($friend['username']); ?></div>
                                    <div class="text-xs text-gray-400 friend-status-text" data-user-id="<?php echo htmlspecialchars($friend['id']); ?>">Offline</div>
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
    
    <div class="tab-content <?php echo $activeTab === 'pending' ? '' : 'hidden'; ?>" id="pending-tab">
        <div class="flex-1 p-4 overflow-y-auto bg-discord-background">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-gray-400 font-bold text-xs uppercase">Pending</h2>
                <div class="relative w-60">
                    <input type="text" placeholder="Search" class="w-full bg-discord-dark text-white text-sm rounded px-3 py-1 pl-8 focus:outline-none focus:ring-1 focus:ring-discord-primary" id="pending-search">
                    <i class="fas fa-search absolute left-2.5 top-1.5 text-gray-500 text-sm"></i>
                </div>
            </div>
            
            <div class="space-y-4" id="pending-friends-container">
                <?php if (!empty($pendingRequests)): ?>
                    <h3 class="text-xs uppercase font-semibold text-gray-400 mb-2">Incoming Friend Requests — <?php echo count($pendingRequests); ?></h3>
                    <div class="space-y-2">
                        <?php foreach ($pendingRequests as $request): ?>
                            <div class="flex items-center justify-between p-3 bg-discord-dark rounded transition-all duration-200">
                                <div class="flex items-center">
                                    <div class="relative mr-3">
                                        <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                            <img src="<?php echo htmlspecialchars($request['avatar_url'] ?? ''); ?>" 
                                                 alt="<?php echo htmlspecialchars($request['username'] ?? 'User'); ?>" 
                                                 class="w-full h-full object-cover user-avatar">
                                        </div>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <div class="font-medium text-white truncate"><?php echo htmlspecialchars($request['username']); ?></div>
                                        <div class="text-xs text-gray-400">Incoming Friend Request</div>
                                    </div>
                                </div>
                                <div class="flex space-x-2">
                                    <button class="bg-discord-green hover:bg-discord-green/90 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-md px-3 py-1 text-sm transition-colors"
                                            onclick="acceptFriendRequest('<?php echo htmlspecialchars($request['friendship_id']); ?>')">Accept</button>
                                    <button class="bg-discord-dark hover:bg-discord-light disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md px-3 py-1 text-sm border border-gray-600 transition-colors"
                                            onclick="ignoreFriendRequest('<?php echo htmlspecialchars($request['friendship_id']); ?>')">Ignore</button>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
                
                <?php if (!empty($sentRequests)): ?>
                    <h3 class="text-xs uppercase font-semibold text-gray-400 mt-4 mb-2">Outgoing Friend Requests — <?php echo count($sentRequests); ?></h3>
                    <div class="space-y-2">
                        <?php foreach ($sentRequests as $request): ?>
                            <div class="flex items-center justify-between p-3 bg-discord-dark rounded transition-all duration-200">
                                <div class="flex items-center">
                                    <div class="relative mr-3">
                                        <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                            <img src="<?php echo htmlspecialchars($request['avatar_url'] ?? ''); ?>" 
                                                 alt="<?php echo htmlspecialchars($request['username'] ?? 'User'); ?>" 
                                                 class="w-full h-full object-cover user-avatar">
                                        </div>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <div class="font-medium text-white truncate"><?php echo htmlspecialchars($request['username']); ?></div>
                                        <div class="text-xs text-gray-400">Outgoing Friend Request</div>
                                    </div>
                                </div>
                                <div>
                                    <button class="bg-discord-red hover:bg-discord-red/90 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-md px-3 py-1 text-sm transition-colors"
                                            onclick="cancelFriendRequest('<?php echo htmlspecialchars($request['id']); ?>')">Cancel</button>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
                
                <?php if (empty($pendingRequests) && empty($sentRequests)): ?>
                    <div class="p-4 bg-discord-dark rounded text-center">
                        <div class="mb-2 text-gray-400">
                            <i class="fa-solid fa-clock text-3xl"></i>
                        </div>
                        <p class="text-gray-300 mb-1">No pending friend requests</p>
                        <p class="text-gray-500 text-sm">Friend requests will appear here</p>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
    
    <div class="tab-content <?php echo $activeTab === 'add-friend' ? '' : 'hidden'; ?>" id="add-friend-tab">
        <div class="flex-1 p-4 overflow-y-auto bg-discord-background">
            <h2 class="text-white font-bold text-lg mb-2">Add Friend</h2>
            <p class="text-gray-400 text-sm mb-4">You can add friends with their MisVord username or full username#discriminator.</p>
            
            <div class="bg-discord-dark p-4 rounded">
                <div class="border-b border-gray-700 pb-4">
                    <label class="text-gray-400 text-sm uppercase font-medium">Add Friend</label>
                    <div class="flex mt-2 gap-2">
                        <input type="text" class="flex-1 bg-discord-dark text-white px-3 py-2 rounded-l border border-gray-700 focus:outline-none focus:ring-1 focus:ring-discord-primary" 
                               placeholder="Username#XXXX" id="friend-username-input">
                        <button class="bg-discord-primary hover:bg-discord-primary/90 disabled:bg-gray-500 disabled:cursor-not-allowed text-white px-4 py-2 rounded-r font-medium text-sm transition-colors" disabled id="send-friend-request">
                            Send Friend Request
                        </button>
                    </div>
                    <div class="text-discord-red text-sm mt-1 hidden" id="friend-request-error"></div>
                    <div class="text-discord-green text-sm mt-1 hidden" id="friend-request-success"></div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
const friends = <?php echo json_encode($friends); ?>;
window.initialFriendsData = friends;
console.log('🔍 [HOME-FRIENDS] PHP friends data loaded:', friends.length, friends);

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

function createAvatarHTML(user, size = 'standard') {
    const sizeClasses = {
        small: 'w-8 h-8',
        standard: 'w-10 h-10',
        large: 'w-12 h-12'
    };
    
    const avatarUrl = user.avatar_url;
    const username = user.username || 'User';
    const userId = user.id || '';
    
    return `
        <div class="relative mr-3">
            <div class="${sizeClasses[size]} rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                <img src="${avatarUrl || ''}" 
                     alt="${username}" 
                     class="w-full h-full object-cover user-avatar">
            </div>
            <div class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-background bg-gray-500 friend-status-indicator transition-colors duration-300" data-user-id="${userId}"></div>
        </div>
    `;
}

function initFriendRequestInput() {
    const friendInput = document.getElementById('friend-username-input');
    const sendButton = document.getElementById('send-friend-request');
    const errorDiv = document.getElementById('friend-request-error');
    const successDiv = document.getElementById('friend-request-success');
    
    if (!friendInput || !sendButton) return;
    
    function updateButtonState() {
        const username = friendInput.value.trim();
        if (username.length > 0) {
            sendButton.disabled = false;
            sendButton.classList.remove('disabled:bg-gray-500', 'disabled:cursor-not-allowed');
            sendButton.classList.add('hover:bg-discord-primary/90');
        } else {
            sendButton.disabled = true;
            sendButton.classList.add('disabled:bg-gray-500', 'disabled:cursor-not-allowed');
            sendButton.classList.remove('hover:bg-discord-primary/90');
        }
    }
    
    friendInput.addEventListener('input', updateButtonState);
    friendInput.addEventListener('keyup', updateButtonState);
    friendInput.addEventListener('paste', function() {
        setTimeout(updateButtonState, 10);
    });
    
    sendButton.addEventListener('click', async function(e) {
        e.preventDefault();
        
        const username = friendInput.value.trim();
        
        if (!username) {
            showError('Please enter a username');
            return;
        }
        
        sendButton.disabled = true;
        sendButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Sending...';
        
        try {
            const response = await fetch('/api/friends', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ username: username })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showSuccess(data.message || 'Friend request sent successfully!');
                friendInput.value = '';
                updateButtonState();
            } else {
                showError(data.message || data.error?.message || 'Failed to send friend request');
            }
        } catch (error) {
            console.error('💥 [FRIEND-REQUEST] Network error:', error);
            showError('An error occurred while sending the friend request');
        } finally {
            sendButton.disabled = false;
            sendButton.innerHTML = 'Send Friend Request';
            updateButtonState();
        }
    });
    
    function showError(message) {
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.remove('hidden');
        }
        if (successDiv) {
            successDiv.classList.add('hidden');
        }
    }
    
    function showSuccess(message) {
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.classList.remove('hidden');
            setTimeout(() => {
                successDiv.classList.add('hidden');
            }, 3000);
        }
        if (errorDiv) {
            errorDiv.classList.add('hidden');
        }
    }
    
    updateButtonState();
}

document.addEventListener('DOMContentLoaded', function() {
    initFriendRequestInput();
    
    // Initialize fallback image handler
    if (window.FallbackImageHandler) {
        window.fallbackImageHandler = window.FallbackImageHandler.getInstance();
    }
    
    const onlineFriendsContainer = document.getElementById('online-friends-container');
    const onlineCount = document.getElementById('online-count');
    const allFriendsContainer = document.getElementById('all-friends-container');
    
    let onlineUsers = {};
    
    function updateAllTabStatus(userId, status) {
        console.log(`🎯 [HOME-FRIENDS] Updating status for user ${userId} to ${status}`);
        const statusIndicator = document.querySelector(`.friend-status-indicator[data-user-id="${userId}"]`);
        const statusText = document.querySelector(`.friend-status-text[data-user-id="${userId}"]`);
        
        if (statusIndicator) {
            statusIndicator.className = `absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-background ${getStatusClass(status)} friend-status-indicator transition-colors duration-300`;
            statusIndicator.setAttribute('data-user-id', userId);
        }
        
        if (statusText) {
            statusText.textContent = getStatusText(status);
        }
    }
    
    function renderOnlineTab() {
        console.log('🎨 [HOME-FRIENDS] Rendering online tab');
        
        const onlineFriends = friends.filter(friend => {
            const userData = onlineUsers[friend.id];
            return userData && userData.status === 'online';
        });
        
        if (onlineCount) {
            onlineCount.textContent = onlineFriends.length;
        }
        
        if (onlineFriends.length > 0) {
            onlineFriends.sort((a, b) => a.username.localeCompare(b.username));
            
            let friendsHtml = '';
            onlineFriends.forEach(friend => {
                const userData = onlineUsers[friend.id];
                const status = userData?.status || 'offline';
                const statusClass = getStatusClass(status);
                const statusText = getStatusText(status);
                
                friendsHtml += `
                    <div class="flex justify-between items-center p-3 rounded hover:bg-discord-light group friend-item transition-all duration-200 animate-fadeIn" 
                         data-user-id="${friend.id}"
                         data-username="${friend.username}">
                        <div class="flex items-center">
                            <div class="relative mr-3">
                                <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                    <img src="${friend.avatar_url || ''}" 
                                         alt="${friend.username}" 
                                         class="w-full h-full object-cover user-avatar">
                                </div>
                                <div class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-background ${statusClass} transition-colors duration-300"></div>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="font-medium text-white truncate">${friend.username}</div>
                                <div class="text-xs text-gray-400 transition-all duration-200">${statusText}</div>
                            </div>
                        </div>
                        <div class="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button class="p-2 text-gray-400 hover:text-white hover:bg-discord-background rounded-full" title="Message" onclick="createDirectMessage('${friend.id}')">
                                <i class="fa-solid fa-message"></i>
                            </button>
                            <button class="p-2 text-gray-400 hover:text-white hover:bg-discord-background rounded-full" title="More">
                                <i class="fa-solid fa-ellipsis-vertical"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
            
            onlineFriendsContainer.innerHTML = friendsHtml;
            
            // Apply fallback image handler to new images
            if (window.fallbackImageHandler) {
                setTimeout(() => {
                    onlineFriendsContainer.querySelectorAll('img.user-avatar').forEach(img => {
                        window.fallbackImageHandler.processImage(img);
                    });
                }, 100);
            }
        } else {
            onlineFriendsContainer.innerHTML = `
                <div class="p-4 bg-discord-dark rounded text-center">
                    <div class="mb-2 text-gray-400">
                        <i class="fa-solid fa-user-group text-3xl"></i>
                    </div>
                    <p class="text-gray-300 mb-1">No friends online</p>
                    <p class="text-gray-500 text-sm">Friends will appear here when they come online</p>
                </div>
            `;
        }
    }
    
    function updateAllFriendsStatus() {
        console.log('🔄 [HOME-FRIENDS] Updating all friends status');
        friends.forEach(friend => {
            const userData = onlineUsers[friend.id];
            const status = userData?.status === 'online' ? 'online' : 'offline';
            updateAllTabStatus(friend.id, status);
        });
    }
    
    function setupFriendsManagerIntegration() {
        if (window.globalPresenceManager) {
            console.log('🌐 [HOME-FRIENDS] Using global presence manager');
            if (window.FriendsManager) {
                const friendsManager = window.FriendsManager.getInstance();
                onlineUsers = friendsManager.cache.onlineUsers || {};
                updateAllFriendsStatus();
                renderOnlineTab();
            }
            return;
        }
        
        if (window.FriendsManager) {
            const friendsManager = window.FriendsManager.getInstance();
            friendsManager.subscribe((type, data) => {
                console.log(`🔄 [HOME-FRIENDS] FriendsManager event: ${type}`, data);
                switch(type) {
                    case 'user-online':
                    case 'user-offline':
                    case 'user-presence-update':
                    case 'online-users-updated':
                        onlineUsers = friendsManager.cache.onlineUsers || {};
                        updateAllFriendsStatus();
                        renderOnlineTab();
                        break;
                }
            });
            
            onlineUsers = friendsManager.cache.onlineUsers || {};
        } else {
            console.warn('⚠️ [HOME-FRIENDS] FriendsManager not available, retrying in 500ms');
            setTimeout(setupFriendsManagerIntegration, 500);
        }
    }
    
    function initializeHomeFriends() {
        console.log('🚀 [HOME-FRIENDS] Initializing home friends with FriendsManager');
        setupFriendsManagerIntegration();
        updateAllFriendsStatus();
        renderOnlineTab();
    }
    
    initializeHomeFriends();
    
    // Initialize fallback image handler for all existing images
    setTimeout(() => {
        if (window.fallbackImageHandler) {
            document.querySelectorAll('img.user-avatar').forEach(img => {
                window.fallbackImageHandler.processImage(img);
            });
        }
    }, 200);
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

.transition-all {
    transition: all 0.2s ease-in-out;
}

.transition-colors {
    transition: color 0.3s ease, background-color 0.3s ease;
}

.user-avatar {
    transition: transform 0.2s ease;
}

.user-avatar:hover {
    transform: scale(1.05);
}
</style>

 