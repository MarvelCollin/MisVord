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
                    <input type="text" placeholder="Search friends" class="w-full bg-discord-dark text-white text-sm rounded px-3 py-1 pl-8 focus:outline-none focus:ring-1 focus:ring-discord-primary transition-all" id="online-search">
                    <i class="fas fa-search absolute left-2.5 top-1.5 text-gray-500 text-sm"></i>
                </div>
            </div>

            <div class="space-y-1" id="online-friends-container">
            </div>
        </div>
    </div>
    
    <div class="tab-content <?php echo $activeTab === 'all' ? '' : 'hidden'; ?>" id="all-tab">
        <div class="flex-1 p-4 overflow-y-auto bg-discord-background">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-gray-400 font-bold text-xs uppercase">All Friends — <?php echo count($friends); ?></h2>
                <div class="relative w-60">
                    <input type="text" placeholder="Search friends" class="w-full bg-discord-dark text-white text-sm rounded px-3 py-1 pl-8 focus:outline-none focus:ring-1 focus:ring-discord-primary transition-all" id="all-search">
                    <i class="fas fa-search absolute left-2.5 top-1.5 text-gray-500 text-sm"></i>
                </div>
            </div>
            
            <div class="space-y-1" id="all-friends-container">
                <?php if (empty($friends)): ?>
                <div class="p-4 bg-discord-dark rounded text-center" style="display: none;">
                    <div class="mb-2 text-gray-400">
                        <i class="fa-solid fa-user-group text-3xl"></i>
                    </div>
                    <p class="text-gray-300 mb-1">No friends found</p>
                    <p class="text-gray-500 text-sm">Add some friends to get started!</p>
                </div>
                <?php else: ?>
                    <?php foreach ($friends as $friend): ?>
                        <div class="flex justify-between items-center p-3 rounded hover:bg-discord-light group friend-item transition-all duration-200 cursor-pointer" 
                             data-user-id="<?php echo htmlspecialchars($friend['id']); ?>"
                             data-username="<?php echo htmlspecialchars($friend['username']); ?>"
                             data-display-name="<?php echo htmlspecialchars($friend['display_name'] ?? $friend['username']); ?>"
                             onclick="openUserDetail('<?php echo htmlspecialchars($friend['id']); ?>')">
                            <div class="flex items-center">
                                <div class="relative mr-3">
                                    <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                        <img src="<?php echo htmlspecialchars($friend['avatar_url'] ?? ''); ?>" 
                                             alt="<?php echo htmlspecialchars($friend['display_name'] ?? $friend['username'] ?? 'User'); ?>" 
                                             class="w-full h-full object-cover user-avatar">
                                    </div>
                                    <div class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-background bg-gray-500 friend-status-indicator transition-colors duration-300" data-user-id="<?php echo htmlspecialchars($friend['id']); ?>"></div>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="font-medium text-white friend-name truncate" data-user-id="<?php echo htmlspecialchars($friend['id']); ?>"><?php echo htmlspecialchars($friend['display_name'] ?? $friend['username']); ?></div>
                                    <div class="text-xs text-gray-400 friend-username"><?php echo htmlspecialchars($friend['username']); ?><?php if (isset($friend['discriminator'])): ?>#<?php echo htmlspecialchars($friend['discriminator']); ?><?php endif; ?></div>
                                    <div class="text-xs text-gray-400 friend-status-text" data-user-id="<?php echo htmlspecialchars($friend['id']); ?>">Offline</div>
                                </div>
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
                    <input type="text" placeholder="Search requests" class="w-full bg-discord-dark text-white text-sm rounded px-3 py-1 pl-8 focus:outline-none focus:ring-1 focus:ring-discord-primary transition-all" id="pending-search">
                    <i class="fas fa-search absolute left-2.5 top-1.5 text-gray-500 text-sm"></i>
                </div>
            </div>
            
            <div class="space-y-4" id="pending-friends-container">
                <?php if (!empty($pendingRequests)): ?>
                    <h3 class="text-xs uppercase font-semibold text-gray-400 mb-2">Incoming Friend Requests — <?php echo count($pendingRequests); ?></h3>
                    <div class="space-y-2">
                        <?php foreach ($pendingRequests as $request): ?>
                            <div class="flex items-center justify-between p-3 bg-discord-dark rounded transition-all duration-200 friend-item" 
                                 data-username="<?php echo htmlspecialchars($request['username']); ?>"
                                 data-display-name="<?php echo htmlspecialchars($request['display_name'] ?? $request['username']); ?>">
                                <div class="flex items-center">
                                    <div class="relative mr-3">
                                        <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                            <img src="<?php echo htmlspecialchars($request['avatar_url'] ?? ''); ?>" 
                                                 alt="<?php echo htmlspecialchars($request['display_name'] ?? $request['username'] ?? 'User'); ?>" 
                                                 class="w-full h-full object-cover user-avatar">
                                        </div>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <div class="font-medium text-white truncate friend-name"><?php echo htmlspecialchars($request['display_name'] ?? $request['username']); ?></div>
                                        <div class="text-xs text-gray-400"><?php echo htmlspecialchars($request['username']); ?><?php if (isset($request['discriminator'])): ?>#<?php echo htmlspecialchars($request['discriminator']); ?><?php endif; ?></div>
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
                            <div class="flex items-center justify-between p-3 bg-discord-dark rounded transition-all duration-200 friend-item" 
                                 data-username="<?php echo htmlspecialchars($request['username']); ?>"
                                 data-display-name="<?php echo htmlspecialchars($request['display_name'] ?? $request['username']); ?>">
                                <div class="flex items-center">
                                    <div class="relative mr-3">
                                        <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                            <img src="<?php echo htmlspecialchars($request['avatar_url'] ?? ''); ?>" 
                                                 alt="<?php echo htmlspecialchars($request['display_name'] ?? $request['username'] ?? 'User'); ?>" 
                                                 class="w-full h-full object-cover user-avatar">
                                        </div>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <div class="font-medium text-white truncate friend-name"><?php echo htmlspecialchars($request['display_name'] ?? $request['username']); ?></div>
                                        <div class="text-xs text-gray-400"><?php echo htmlspecialchars($request['username']); ?><?php if (isset($request['discriminator'])): ?>#<?php echo htmlspecialchars($request['discriminator']); ?><?php endif; ?></div>
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
                    <form id="friend-request-form" class="flex mt-2 gap-2">
                        <input type="text" class="flex-1 bg-discord-dark text-white px-3 py-2 rounded-l border border-gray-700 focus:outline-none focus:ring-1 focus:ring-discord-primary" 
                               placeholder="Username#XXXX" id="friend-username-input">
                        <button type="submit" class="bg-discord-primary hover:bg-discord-primary/90 disabled:bg-gray-500 disabled:cursor-not-allowed text-white px-4 py-2 rounded-r font-medium text-sm transition-colors" id="send-friend-request">
                            Send Friend Request
                        </button>
                    </form>
                    <div class="text-discord-red text-sm mt-1 hidden" id="add-friend-error"></div>
                    <div class="text-discord-green text-sm mt-1 hidden" id="add-friend-success"></div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
const friends = <?php echo json_encode($friends); ?>;
window.initialFriendsData = friends;


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
        if (window.showToast) {
            window.showToast(message, 'error');
        } else {
            if (errorDiv) {
                errorDiv.textContent = message;
                errorDiv.classList.remove('hidden');
            }
            if (successDiv) {
                successDiv.classList.add('hidden');
            }
        }
    }
    
    function showSuccess(message) {
        if (window.showToast) {
            window.showToast(message, 'success');
        } else {
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
    }
    
    updateButtonState();
}

document.addEventListener('DOMContentLoaded', function() {
    initFriendRequestInput();
    
    // Ensure toast.js is loaded
    if (!window.showToast) {
        // Try to load toast module dynamically
        try {
            const scriptPath = '/public/js/core/ui/toast.js';

            
            // Create a script element and append it to the document
            const script = document.createElement('script');
            script.src = scriptPath;
            script.type = 'module';
            document.head.appendChild(script);
            
            script.onload = () => {

            };
            
            script.onerror = (err) => {
                console.error('❌ [HOME-FRIENDS] Failed to load toast module:', err);
            };
        } catch (err) {
            console.error('❌ [HOME-FRIENDS] Error loading toast module:', err);
        }
    }
    
    if (window.FallbackImageHandler) {
        window.fallbackImageHandler = window.FallbackImageHandler.getInstance();
    }
    
    const onlineFriendsContainer = document.getElementById('online-friends-container');
    const onlineCount = document.getElementById('online-count');
    const allFriendsContainer = document.getElementById('all-friends-container');
    
    let onlineUsers = {};
    let lastRenderedOnlineFriends = [];

    function initFriendsSearch() {
        const searchInputs = [
            { input: document.getElementById('online-search'), type: 'online' },
            { input: document.getElementById('all-search'), type: 'all' },
            { input: document.getElementById('pending-search'), type: 'pending' }
        ];

        searchInputs.forEach(({ input, type }) => {
            if (!input) return;

            input.addEventListener('input', function() {
                const query = this.value.trim();
                searchFriends(type, query);
            });

            input.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    input.value = '';
                    searchFriends(type, '');
                    input.blur();
                }
            });
        });
    }

    function initGlobalSearchShortcut() {
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                focusCurrentTabSearch();
            }
        });
    }

    function focusCurrentTabSearch() {
        const activeTabContent = document.querySelector('.tab-content:not(.hidden)');
        if (!activeTabContent) return;

        const searchInput = activeTabContent.querySelector('input[type="text"][placeholder*="Search"]');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }

    function searchFriends(tabType, query) {
        const normalizedQuery = query.toLowerCase().trim();
        
        if (tabType === 'online') {
            searchOnlineFriends(normalizedQuery);
        } else if (tabType === 'all') {
            searchAllFriends(normalizedQuery);
        } else if (tabType === 'pending') {
            searchPendingFriends(normalizedQuery);
        }
    }

    function searchOnlineFriends(query) {
        const container = document.getElementById('online-friends-container');
        if (!container) return;

        const friendItems = container.querySelectorAll('.friend-item');
        const totalItems = friendItems.length;
        let visibleCount = 0;

        friendItems.forEach(item => {
            const username = item.getAttribute('data-username') || '';
            const displayName = item.getAttribute('data-display-name') || '';
            const friendNameEl = item.querySelector('.friend-name');
            const friendName = friendNameEl ? friendNameEl.textContent : '';
            
            const matches = username.toLowerCase().includes(query) || 
                          displayName.toLowerCase().includes(query) ||
                          friendName.toLowerCase().includes(query);
            
            if (matches || query === '') {
                item.style.display = '';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });

        if (onlineCount) {
            onlineCount.textContent = visibleCount;
        }

        if (totalItems > 0 && visibleCount === 0 && query !== '') {
            showNoResultsMessage(container, 'online');
        } else {
            hideNoResultsMessage(container);
        }
    }

    function searchAllFriends(query) {
        const container = document.getElementById('all-friends-container');
        if (!container) return;

        const friendItems = container.querySelectorAll('.friend-item');
        const totalItems = friendItems.length;
        let visibleCount = 0;

        friendItems.forEach(item => {
            const username = item.getAttribute('data-username') || '';
            const displayName = item.getAttribute('data-display-name') || '';
            const friendNameEl = item.querySelector('.friend-name');
            const friendName = friendNameEl ? friendNameEl.textContent : '';
            
            const matches = username.toLowerCase().includes(query) || 
                          displayName.toLowerCase().includes(query) ||
                          friendName.toLowerCase().includes(query);
            
            if (matches || query === '') {
                item.style.display = '';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });

        if (totalItems > 0 && visibleCount === 0 && query !== '') {
            showNoResultsMessage(container, 'all');
        } else {
            hideNoResultsMessage(container);
        }
    }

    function searchPendingFriends(query) {
        const container = document.getElementById('pending-friends-container');
        if (!container) return;

        const friendItems = container.querySelectorAll('.friend-item');
        const totalItems = friendItems.length;
        let visibleCount = 0;

        friendItems.forEach(item => {
            const username = item.getAttribute('data-username') || '';
            const displayName = item.getAttribute('data-display-name') || '';
            const friendNameEl = item.querySelector('.friend-name');
            const friendName = friendNameEl ? friendNameEl.textContent : '';
            
            const matches = username.toLowerCase().includes(query) || 
                          displayName.toLowerCase().includes(query) ||
                          friendName.toLowerCase().includes(query);
            
            if (matches || query === '') {
                item.style.display = '';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });

        if (totalItems > 0 && visibleCount === 0 && query !== '') {
            showNoResultsMessage(container, 'pending');
        } else {
            hideNoResultsMessage(container);
        }
    }

    function showNoResultsMessage(container, tabType) {
        hideNoResultsMessage(container);
        
        const messages = {
            online: { title: 'No online friends found', subtitle: 'No online friends match your search' },
            all: { title: 'No friends found', subtitle: 'Try a different search term' },
            pending: { title: 'No requests found', subtitle: 'No pending requests match your search' }
        };
        
        const message = messages[tabType] || messages.all;
        
        const noResultsEl = document.createElement('div');
        noResultsEl.className = 'no-search-results p-6 bg-discord-dark rounded text-center mt-4 animate-fadeIn';
        noResultsEl.innerHTML = `
            <div class="mb-3 text-gray-400">
                <i class="fa-solid fa-magnifying-glass text-3xl opacity-50"></i>
            </div>
            <p class="text-gray-300 mb-1 font-medium">${message.title}</p>
            <p class="text-gray-500 text-sm">${message.subtitle}</p>
        `;
        
        container.appendChild(noResultsEl);
    }

    function hideNoResultsMessage(container) {
        const existingMessage = container.querySelector('.no-search-results');
        if (existingMessage) {
            existingMessage.remove();
        }
    }

    initFriendsSearch();
    initGlobalSearchShortcut();
    
    function updateAllTabStatus(userId, status) {

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
    
    function detectOnlineFriendsFromDOM() {

        const onlineFromDOM = [];
        
        friends.forEach(friend => {
            const statusIndicator = document.querySelector(`.friend-status-indicator[data-user-id="${friend.id}"]`);
            if (statusIndicator && statusIndicator.classList.contains('bg-discord-green')) {

                onlineFromDOM.push(friend);
                
                if (!onlineUsers[friend.id]) {
                    onlineUsers[friend.id] = {
                        user_id: friend.id,
                        username: friend.username,
                        status: 'online',
                        activity_details: null
                    };
                }
            }
        });
        

        return onlineFromDOM;
    }
    
    function renderOnlineTab() {

        
        const onlineFriendsFromCache = friends.filter(friend => {
            const userData = onlineUsers[friend.id];
            return userData && (userData.status === 'online' || userData.status === 'afk');
        });
        
        const onlineFriendsFromDOM = friends.filter(friend => {
            const statusIndicator = document.querySelector(`.friend-status-indicator[data-user-id="${friend.id}"]`);
            return statusIndicator && statusIndicator.classList.contains('bg-discord-green');
        });
        
        let onlineFriends = onlineFriendsFromCache.length > 0 ? onlineFriendsFromCache : onlineFriendsFromDOM;
        
        onlineFriends.sort((a, b) => {
            const nameA = a.display_name || a.username;
            const nameB = b.display_name || b.username;
            return nameA.localeCompare(nameB);
        });
        
        const currentFriendIds = onlineFriends.map(f => f.id).sort().join(',');
        const lastFriendIds = lastRenderedOnlineFriends.map(f => f.id).sort().join(',');
        
        if (currentFriendIds === lastFriendIds) {

            return;
        }
        

        
        if (onlineCount) {
            onlineCount.textContent = onlineFriends.length;
        }
        
        if (onlineFriends.length > 0) {

            
            onlineFriendsContainer.innerHTML = '';
            
            onlineFriends.forEach(friend => {
                const friendEl = document.createElement('div');
                friendEl.className = 'flex justify-between items-center p-3 rounded hover:bg-discord-light group friend-item transition-all duration-200 cursor-pointer';
                friendEl.setAttribute('data-user-id', friend.id);
                friendEl.setAttribute('data-username', friend.username);
                friendEl.setAttribute('data-display-name', friend.display_name || friend.username);
                friendEl.onclick = () => openUserDetail(friend.id);
                
                const displayName = friend.display_name || friend.username;
                const userTag = friend.discriminator ? `${friend.username}#${friend.discriminator}` : friend.username;
                
                friendEl.innerHTML = `
                    <div class="flex items-center">
                        <div class="relative mr-3">
                            <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                <img src="${friend.avatar_url || ''}" 
                                     alt="${displayName}" 
                                     class="w-full h-full object-cover user-avatar">
                            </div>
                            <div class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-background bg-discord-green"></div>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="font-medium text-white truncate friend-name" data-user-id="${friend.id}">${displayName}</div>
                            <div class="text-xs text-gray-400">${userTag}</div>
                            <div class="text-xs text-gray-400">Online</div>
                        </div>
                    </div>
                `;
                
                onlineFriendsContainer.appendChild(friendEl);
                
                if (window.nitroCrownManager) {
                    const usernameEl = friendEl.querySelector('.friend-name');
                    if (usernameEl) {
                        window.nitroCrownManager.updateUserElement(usernameEl, friend.id);
                    }
                }
                
                if (window.fallbackImageHandler) {
                    const img = friendEl.querySelector('img.user-avatar');
                    if (img) {
                        window.fallbackImageHandler.processImage(img);
                    }
                }
            });
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
        
        lastRenderedOnlineFriends = [...onlineFriends];
    }
    
    function checkAndUpdateOnlineTab() {

        renderOnlineTab();
    }
    
    function initializeHomeFriends() {

        
        setupFriendsManagerIntegration();
        
        setTimeout(() => {
            clearInitialSkeletons();
            updateAllFriendsStatus();
            renderOnlineTab();
        }, 1500);
        
        setTimeout(checkAndUpdateOnlineTab, 3000);
        setTimeout(checkAndUpdateOnlineTab, 5000);
        
        setInterval(checkAndUpdateOnlineTab, 5000);
    }
    
    function clearInitialSkeletons() {

        const containers = ['online-friends-container', 'all-friends-container', 'pending-friends-container'];
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                const skeletonContainer = container.querySelector('.skeleton-loading-container');
                if (skeletonContainer) {
                    skeletonContainer.remove();
                }
            }
        });
    }
    
    function updateAllFriendsStatus() {

        friends.forEach(friend => {
            const userData = onlineUsers[friend.id];
            const status = userData?.status || 'offline';
            updateAllTabStatus(friend.id, status);
        });
    }
    
    function setupFriendsManagerIntegration() {

        
        if (window.globalPresenceManager) {

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

            
            if (Object.keys(onlineUsers).length === 0) {

                friendsManager.getOnlineUsers(true);
                
                setTimeout(() => {
                    onlineUsers = friendsManager.cache.onlineUsers || {};

                    updateAllFriendsStatus();
                    renderOnlineTab();
                }, 2000);
            }
        } else {
            console.warn('⚠️ [HOME-FRIENDS] FriendsManager not available, retrying in 500ms');
            setTimeout(setupFriendsManagerIntegration, 500);
        }
    }
    
    window.debugFriends = {
        friends: friends,
        onlineUsers: () => onlineUsers,
        renderOnlineTab: renderOnlineTab,
        detectFromDOM: detectOnlineFriendsFromDOM,
        lastRendered: () => lastRenderedOnlineFriends,
        checkUpdate: checkAndUpdateOnlineTab
    };
    
    window.checkAndUpdateOnlineTab = checkAndUpdateOnlineTab;
    window.loadOnlineFriends = function(forceRefresh = false) {
        if (window.FriendsManager) {

            const friendsManager = window.FriendsManager.getInstance();
            onlineUsers = friendsManager.cache.onlineUsers || {};
            updateAllFriendsStatus();
            renderOnlineTab();
        }
    };
    window.loadAllFriends = function(forceRefresh = false) {

        updateAllFriendsStatus();
    };
    window.loadPendingRequests = function(forceRefresh = false) {

        const pendingContainer = document.getElementById('pending-friends-container');
        
        if (!pendingContainer) {
            console.error('❌ [HOME-FRIENDS] Pending container not found');
            return;
        }
        
        // Show loading state
        pendingContainer.innerHTML = `
            <div class="p-4 bg-discord-dark rounded text-center">
                <div class="mb-2 text-gray-400">
                    <i class="fas fa-spinner fa-spin text-3xl"></i>
                </div>
                <p class="text-gray-300 mb-1">Loading pending requests...</p>
            </div>
        `;
        
        // Fetch pending requests from API
        if (window.FriendAPI) {
            window.FriendAPI.getPendingRequests()
                .then(data => {

                    renderPendingRequests(data);
                })
                .catch(err => {
                    console.error('❌ [HOME-FRIENDS] Failed to load pending requests:', err);
                    pendingContainer.innerHTML = `
                        <div class="p-4 bg-discord-dark rounded text-center">
                            <div class="mb-2 text-gray-400">
                                <i class="fas fa-exclamation-circle text-3xl"></i>
                            </div>
                            <p class="text-gray-300 mb-1">Failed to load pending requests</p>
                            <p class="text-gray-500 text-sm">Please try again later</p>
                        </div>
                    `;
                });
        } else {
            console.error('❌ [HOME-FRIENDS] FriendAPI not available');
            pendingContainer.innerHTML = `
                <div class="p-4 bg-discord-dark rounded text-center">
                    <div class="mb-2 text-gray-400">
                        <i class="fas fa-clock text-3xl"></i>
                    </div>
                    <p class="text-gray-300 mb-1">No pending friend requests</p>
                    <p class="text-gray-500 text-sm">Friend requests will appear here</p>
                </div>
            `;
        }
    };
    
    function renderPendingRequests(data) {
        const pendingContainer = document.getElementById('pending-friends-container');
        if (!pendingContainer) return;
        
        const incomingRequests = data.incoming || [];
        const outgoingRequests = data.outgoing || [];
        
        if (incomingRequests.length === 0 && outgoingRequests.length === 0) {
            pendingContainer.innerHTML = `
                <div class="p-4 bg-discord-dark rounded text-center">
                    <div class="mb-2 text-gray-400">
                        <i class="fa-solid fa-clock text-3xl"></i>
                    </div>
                    <p class="text-gray-300 mb-1">No pending friend requests</p>
                    <p class="text-gray-500 text-sm">Friend requests will appear here</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        
        if (incomingRequests.length > 0) {
            html += `<h3 class="text-xs uppercase font-semibold text-gray-400 mb-2">Incoming Friend Requests — ${incomingRequests.length}</h3>`;
            html += '<div class="space-y-2">';
            
            incomingRequests.forEach(request => {
                const displayName = request.display_name || request.username;
                const userTag = request.discriminator ? `${request.username}#${request.discriminator}` : request.username;
                
                html += `
                    <div class="flex items-center justify-between p-3 bg-discord-dark rounded transition-all duration-200 friend-item" 
                         data-username="${request.username}"
                         data-display-name="${displayName}">
                        <div class="flex items-center">
                            <div class="relative mr-3">
                                <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                    <img src="${request.avatar_url || ''}" 
                                         alt="${displayName}" 
                                         class="w-full h-full object-cover user-avatar">
                                </div>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="font-medium text-white truncate friend-name">${displayName}</div>
                                <div class="text-xs text-gray-400">${userTag}</div>
                                <div class="text-xs text-gray-400">Incoming Friend Request</div>
                            </div>
                        </div>
                        <div class="flex space-x-2">
                            <button class="bg-discord-green hover:bg-discord-green/90 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-md px-3 py-1 text-sm transition-colors"
                                    onclick="acceptFriendRequest('${request.friendship_id}')">Accept</button>
                            <button class="bg-discord-dark hover:bg-discord-light disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md px-3 py-1 text-sm border border-gray-600 transition-colors"
                                    onclick="ignoreFriendRequest('${request.friendship_id}')">Ignore</button>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
        }
        
        if (outgoingRequests.length > 0) {
            html += `<h3 class="text-xs uppercase font-semibold text-gray-400 mt-4 mb-2">Outgoing Friend Requests — ${outgoingRequests.length}</h3>`;
            html += '<div class="space-y-2">';
            
            outgoingRequests.forEach(request => {
                const displayName = request.display_name || request.username;
                const userTag = request.discriminator ? `${request.username}#${request.discriminator}` : request.username;
                
                html += `
                    <div class="flex items-center justify-between p-3 bg-discord-dark rounded transition-all duration-200 friend-item" 
                         data-username="${request.username}"
                         data-display-name="${displayName}">
                        <div class="flex items-center">
                            <div class="relative mr-3">
                                <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                    <img src="${request.avatar_url || ''}" 
                                         alt="${displayName}" 
                                         class="w-full h-full object-cover user-avatar">
                                </div>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="font-medium text-white truncate friend-name">${displayName}</div>
                                <div class="text-xs text-gray-400">${userTag}</div>
                                <div class="text-xs text-gray-400">Outgoing Friend Request</div>
                            </div>
                        </div>
                        <div>
                            <button class="bg-discord-red hover:bg-discord-red/90 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-md px-3 py-1 text-sm transition-colors"
                                    onclick="cancelFriendRequest('${request.friendship_id}')">Cancel</button>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
        }
        
        pendingContainer.innerHTML = html;
        
        // Process images after rendering
        if (window.fallbackImageHandler) {
            pendingContainer.querySelectorAll('img.user-avatar').forEach(img => {
                window.fallbackImageHandler.processImage(img);
            });
        }
    }
    
    window.acceptFriendRequest = function(friendshipId) {
        if (!friendshipId) {
            console.error('❌ [HOME-FRIENDS] Invalid friendship ID for accept');
            return;
        }
        
        const button = event.target;
        const originalText = button.textContent;
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Accepting...';
        
        if (window.FriendAPI) {
            window.FriendAPI.acceptFriendRequest(friendshipId)
                .then(data => {

                    if (window.showToast) {
                        window.showToast('Friend request accepted!', 'success');
                    }
                    // Refresh the pending requests list
                    window.loadPendingRequests(true);
                })
                .catch(err => {
                    console.error('❌ [HOME-FRIENDS] Failed to accept friend request:', err);
                    if (window.showToast) {
                        window.showToast('Failed to accept friend request', 'error');
                    }
                    button.disabled = false;
                    button.textContent = originalText;
                });
        } else {
            console.error('❌ [HOME-FRIENDS] FriendAPI not available');
            button.disabled = false;
            button.textContent = originalText;
        }
    };
    
    window.ignoreFriendRequest = function(friendshipId) {
        if (!friendshipId) {
            console.error('❌ [HOME-FRIENDS] Invalid friendship ID for ignore');
            return;
        }
        
        const button = event.target;
        const originalText = button.textContent;
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Ignoring...';
        
        if (window.FriendAPI) {
            window.FriendAPI.declineFriendRequest(friendshipId)
                .then(data => {

                    if (window.showToast) {
                        window.showToast('Friend request declined', 'info');
                    }
                    // Refresh the pending requests list
                    window.loadPendingRequests(true);
                })
                .catch(err => {
                    console.error('❌ [HOME-FRIENDS] Failed to decline friend request:', err);
                    if (window.showToast) {
                        window.showToast('Failed to decline friend request', 'error');
                    }
                    button.disabled = false;
                    button.textContent = originalText;
                });
        } else {
            console.error('❌ [HOME-FRIENDS] FriendAPI not available');
            button.disabled = false;
            button.textContent = originalText;
        }
    };
    
    window.cancelFriendRequest = function(friendshipId) {
        if (!friendshipId) {
            console.error('❌ [HOME-FRIENDS] Invalid friendship ID for cancel');
            return;
        }
        
        const button = event.target;
        const originalText = button.textContent;
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Canceling...';
        
        if (window.FriendAPI) {
            window.FriendAPI.declineFriendRequest(friendshipId)
                .then(data => {

                    if (window.showToast) {
                        window.showToast('Friend request canceled', 'info');
                    }
                    // Refresh the pending requests list
                    window.loadPendingRequests(true);
                })
                .catch(err => {
                    console.error('❌ [HOME-FRIENDS] Failed to cancel friend request:', err);
                    if (window.showToast) {
                        window.showToast('Failed to cancel friend request', 'error');
                    }
                    button.disabled = false;
                    button.textContent = originalText;
                });
        } else {
            console.error('❌ [HOME-FRIENDS] FriendAPI not available');
            button.disabled = false;
            button.textContent = originalText;
        }
    };
    
    initializeHomeFriends();
    
    window.hideNoResultsMessage = hideNoResultsMessage;
    window.searchFriends = searchFriends;
    
    // Function to open user detail modal
    window.openUserDetail = function(userId) {

        
        // Try to use the user detail modal if available
        if (window.userDetailModal && typeof window.userDetailModal.show === 'function') {
            window.userDetailModal.show({ userId: userId });
        } else {

            
            // Wait a moment for the modal to be initialized and try again
            setTimeout(() => {
                if (window.userDetailModal && typeof window.userDetailModal.show === 'function') {
                    window.userDetailModal.show({ userId: userId });
                } else {
                    console.error('❌ [HOME-FRIENDS] UserDetailModal not available after waiting');
                }
            }, 500);
        }
    };
    
    setTimeout(() => {
        if (window.fallbackImageHandler) {
            document.querySelectorAll('img.user-avatar').forEach(img => {
                window.fallbackImageHandler.processImage(img);
            });
        }
        
        if (window.nitroCrownManager) {
            document.querySelectorAll('.friend-name[data-user-id]').forEach(el => {
                const userId = el.getAttribute('data-user-id');
                if (userId && userId !== 'null') {
                    window.nitroCrownManager.updateUserElement(el, userId);
                }
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

 