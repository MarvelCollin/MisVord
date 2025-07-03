<?php
if (!isset($currentServer) || empty($currentServer)) {
    return;
}

$currentServerId = $currentServer->id ?? 0;
$members = $GLOBALS['serverMembers'] ?? [];

$totalMemberCount = count($members);

$roleGroups = [
    'owner' => [],
    'admin' => [],
    'bot' => [],
    'member' => [],
    'offline' => []
];

foreach ($members as $member) {
    $role = $member['role'] ?? 'member';
    $isBot = isset($member['status']) && $member['status'] === 'bot';
    $isOffline = $member['status'] === 'offline' || $member['status'] === 'invisible';
    
    if ($isBot) {
        $roleGroups['bot'][] = $member;
        continue;
    }
    
    if ($isOffline) {
        $roleGroups['offline'][] = $member;
        continue;
    }
    
    if ($role === 'owner') {
        $roleGroups['owner'][] = $member;
    } else if ($role === 'admin') {
        $roleGroups['admin'][] = $member;
    } else {
        $roleGroups['member'][] = $member;
    }
}
?>

<div class="w-60 bg-discord-dark border-l border-gray-800 flex flex-col h-full max-h-screen">
    <div class="h-12 border-b border-gray-800 flex items-center px-4 relative">
        <div class="relative w-full">
            <input type="text" 
                   placeholder="Search messages in server" 
                   class="w-full bg-black bg-opacity-30 text-white text-sm rounded px-2 py-1 pr-8 focus:outline-none focus:ring-1 focus:ring-[#5865f2] transition-all" 
                   id="server-search-input">
            <div class="absolute right-2 top-1/2 transform -translate-y-1/2">
                <i class="fas fa-search text-gray-500 text-xs" id="search-icon"></i>
                <i class="fas fa-spinner fa-spin text-gray-500 text-xs hidden" id="search-loading"></i>
            </div>
        </div>
        
        <div id="search-results-dropdown" class="absolute top-full left-0 right-0 bg-[#2b2d31] border border-gray-700 rounded-lg mt-1 max-h-80 overflow-y-auto shadow-lg z-50 hidden">
            <div id="search-results-content">
                <div class="p-3 text-center text-gray-400 text-sm">
                    <i class="fas fa-search mr-2"></i>
                    Type to search messages...
                </div>
            </div>
        </div>
    </div>
    

    
    <div class="participant-content flex-1 overflow-y-auto p-2" data-lazyload="participant-list">
        <div class="px-2">
            <?php 
            $roleDisplayOrder = ['owner', 'admin', 'bot', 'member', 'offline'];
            foreach ($roleDisplayOrder as $role):
                $roleMembers = $roleGroups[$role];
                if (empty($roleMembers)) continue;
                
                $roleDisplay = match($role) {
                    'offline' => 'Offline',
                    'bot' => 'Bots',
                    default => ucfirst($role)
                };
                
                $roleColor = match($role) {
                    'owner' => 'text-yellow-500',
                    'admin' => 'text-red-500',
                    'bot' => 'text-blue-500',
                    'offline' => 'text-gray-500',
                    default => 'text-gray-400'
                };
            ?>
                <div class="mb-4 role-group" data-role="<?php echo $role; ?>">
                    <h4 class="text-xs font-semibold <?php echo $roleColor; ?> uppercase py-1">
                        <?php echo $roleDisplay; ?> — <span class="role-count"><?php echo count($roleMembers); ?></span>
                    </h4>
                    <div class="space-y-0.5 members-list">
                        <?php foreach ($roleMembers as $member):
                            $statusColor = 'bg-gray-500';
                            
                            switch ($member['status']) {
                                case 'appear':
                                case 'online':
                                    $statusColor = 'bg-discord-green';
                                    break;
                                case 'invisible':
                                    $statusColor = 'bg-gray-500';
                                    break;
                                case 'do_not_disturb':
                                    $statusColor = 'bg-discord-red';
                                    break;
                                case 'offline':
                                    $statusColor = 'bg-[#747f8d]';
                                    break;
                                case 'bot':
                                    $statusColor = 'bg-blue-500';
                                    break;
                                case 'banned':
                                    $statusColor = 'bg-black';
                                    break;
                                default:
                                    $statusColor = 'bg-discord-green';
                            }
                            
                            $isOffline = $member['status'] === 'offline' || $member['status'] === 'invisible';
                            
                            $textColorClass = match($role) {
                                'owner' => $isOffline ? 'text-yellow-700' : 'text-yellow-400',
                                'admin' => $isOffline ? 'text-red-700' : 'text-red-400',
                                'bot' => 'text-blue-400',
                                'offline' => 'text-gray-500',
                                default => $isOffline ? 'text-gray-500' : 'text-gray-300'
                            };
                            
                            $imgOpacityClass = $isOffline ? 'opacity-70' : '';
                        ?>
                            <div class="flex items-center px-2 py-1 rounded hover:bg-discord-light group cursor-pointer user-profile-trigger" 
                                 data-user-id="<?php echo isset($member['id']) ? $member['id'] : '0'; ?>" 
                                 data-server-id="<?php echo $currentServerId; ?>"
                                 data-role="<?php echo $member['role'] ?? 'member'; ?>"
                                 data-status="<?php echo $member['status'] ?? 'offline'; ?>">
                                <div class="relative mr-2">
                                    <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                        <?php
                                        $avatarUrl = $member['avatar_url'] ?? '';
                                        $username = $member['display_name'] ?? $member['username'] ?? 'User';
                                        
                                        if (!empty($avatarUrl)) {
                                            echo '<img src="' . htmlspecialchars($avatarUrl) . '" alt="' . htmlspecialchars($username) . '" class="w-full h-full object-cover ' . $imgOpacityClass . '">';
                                        } else {
                                            echo '<div class="w-full h-full flex items-center justify-center bg-discord-dark text-white font-bold">' . strtoupper(substr($username, 0, 1)) . '</div>';
                                        }
                                        ?>
                                    </div>
                                    <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-dark <?php echo $statusColor; ?> status-indicator"></span>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <span class="<?php echo $textColorClass; ?> text-sm truncate font-bold member-username" data-user-id="<?php echo isset($member['id']) ? $member['id'] : '0'; ?>"><?php echo htmlspecialchars($member['display_name'] ?? $member['username'] ?? 'Unknown'); ?></span>
                                    <?php if ($member['status'] === 'bot'): ?>
                                        <span class="ml-1 px-1 py-0.5 text-[10px] bg-blue-500 text-white rounded">BOT</span>
                                    <?php endif; ?>
                                    <div class="text-xs text-gray-400 truncate user-presence-text" data-user-id="<?php echo isset($member['id']) ? $member['id'] : '0'; ?>">Online</div>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
</div>

<script>
const SOCKET_URL = window.SOCKET_URL || 'http://localhost:1002';
const ENABLE_USER_SECTION_MOVEMENT = false;
window.ENABLE_USER_SECTION_MOVEMENT = ENABLE_USER_SECTION_MOVEMENT;

let socketConnectionStatus = 'disconnected';
let lastSocketEvent = null;
let searchTimeout = null;
let currentSearchQuery = '';
let searchResults = [];

function loadSocketIO(callback) {
    if (window.io) {
        callback();
        return;
    }
    
    const socketScript = document.createElement('script');
    socketScript.src = SOCKET_URL + '/socket.io/socket.io.js';
    socketScript.async = true;
    socketScript.onload = callback;
    socketScript.onerror = function() {
        console.error('Failed to load Socket.io client');
    };
    document.head.appendChild(socketScript);
}

document.addEventListener('DOMContentLoaded', function() {
    const participantContainer = document.querySelector('[data-lazyload="participant-list"]');
    if (participantContainer) {
        if (window.LazyLoader && typeof window.LazyLoader.triggerDataLoaded === 'function') {
            const isEmpty = <?php echo empty($members) ? 'true' : 'false'; ?>;
            window.LazyLoader.triggerDataLoaded('participant-list', isEmpty);
        }
    }
    
    loadSocketIO(initializeSocketConnection);
    initializeParticipantHover();
    initializeServerSearch();
});



function initializeParticipantHover() {
    const participantItems = document.querySelectorAll('.participant-content .user-profile-trigger');
    
    participantItems.forEach(item => {
        item.addEventListener('mouseover', function() {
            this.classList.add('bg-discord-light');
        });
        
        item.addEventListener('mouseout', function() {
            this.classList.remove('bg-discord-light');
        });
    });
}

function initializeSocketConnection() {
    if (!window.io) {
        console.warn('Socket.io not loaded');
        return;
    }
    
    const serverId = <?php echo $currentServerId; ?>;
    const currentUserId = <?php echo $_SESSION['user_id'] ?? 0; ?>;
    
    try {
        const socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });
        
        socket.on('connect', function() {
            console.log('Socket connected for participant list');
            socketConnectionStatus = 'connected';
            
            socket.emit('authenticate', {
                user_id: currentUserId,
                username: '<?php echo $_SESSION['username'] ?? 'Unknown'; ?>'
            });
            
            socket.emit('get-online-users');
        });
        
        socket.on('online-users-response', function(data) {
            console.log(`Received online users: ${Object.keys(data.users || {}).length} users`);
            lastSocketEvent = {type: 'online-users-response', timestamp: Date.now()};
            updateOnlineStatus(data.users);
        });
        
        socket.on('user-presence-update', function(data) {
            console.log(`User presence update: ${data.user_id} => ${data.status}`, data.activity_details);
            lastSocketEvent = {type: 'user-presence-update', userId: data.user_id, status: data.status, timestamp: Date.now()};
            updateUserStatus(data.user_id, data.status, data.activity_details);
        });
        
        socket.on('user-offline', function(data) {
            console.log(`User went offline: ${data.user_id}`);
            lastSocketEvent = {type: 'user-offline', userId: data.user_id, timestamp: Date.now()};
            updateUserStatus(data.user_id, 'offline', null);
        });
        
        socket.on('disconnect', function() {
            console.log('Socket disconnected from participant list');
            socketConnectionStatus = 'disconnected';
        });
        
        socket.on('error', function(error) {
            console.error('Socket error:', error);
            socketConnectionStatus = 'error';
        });
        
        socket.on('connect_error', function(error) {
            console.error('Socket connection error:', error);
            socketConnectionStatus = 'connection_error';
        });
        
        window.participantSocket = socket;
        window.getSocketStatus = function() {
            return {
                connectionStatus: socketConnectionStatus,
                lastEvent: lastSocketEvent,
                connectedAt: socket.connected ? new Date(socket.connectTime) : null
            };
        };
        
    } catch (error) {
        console.error('Error connecting to socket:', error);
    }
}

function updateOnlineStatus(onlineUsers) {
    if (!onlineUsers) return;
    
    Object.keys(onlineUsers).forEach(userId => {
        const userData = onlineUsers[userId];
        updateUserStatus(userId, userData.status || 'online', userData.activity_details);
    });
}

function getActivityText(activityDetails, status) {
    if (!activityDetails || !activityDetails.type) {
        return status === 'afk' ? 'Away' : 'Online';
    }
    
    switch (activityDetails.type) {
        case 'playing Tic Tac Toe': 
            return 'Playing Tic Tac Toe';
        case 'In Voice Call': 
            const currentServerId = <?php echo $currentServerId; ?>;
            const userServerId = activityDetails.server_id;
            const channelName = activityDetails.channel_name;
            
            if (currentServerId && userServerId == currentServerId && channelName) {
                return `In Voice - ${channelName}`;
            } else if (channelName) {
                return `In Voice Call`;
            } else {
                return 'In Voice Call';
            }
        case 'afk': 
            return 'Away';
        case 'idle':
        default: 
            return status === 'afk' ? 'Away' : 'Online';
    }
}

function updateUserStatus(userId, status, activityDetails = null) {
    const userElement = document.querySelector(`.user-profile-trigger[data-user-id="${userId}"]`);
    if (!userElement) return;
    
    const isOffline = status === 'offline' || status === 'invisible';
    const currentRole = userElement.getAttribute('data-role');
    const currentStatus = userElement.getAttribute('data-status');
    
    if ((isOffline && currentStatus !== 'offline') || (!isOffline && currentStatus === 'offline')) {
        moveUserToSection(userElement, isOffline ? 'offline' : currentRole);
    }
    
    const statusIndicator = userElement.querySelector('.status-indicator');
    if (statusIndicator) {
        const statusClass = getStatusClass(status);
        statusIndicator.classList.remove('bg-discord-green', 'bg-discord-yellow', 'bg-discord-red', 'bg-gray-500', 'bg-[#747f8d]');
        statusIndicator.classList.add(statusClass);
    }
    
    const userNameElement = userElement.querySelector('.text-sm');
    const userImage = userElement.querySelector('img');
    
    if (userNameElement) {
        if (isOffline) {
            userNameElement.classList.remove('text-gray-300');
            userNameElement.classList.add('text-gray-500');
            userImage?.classList.add('opacity-70');
        } else {
            userNameElement.classList.remove('text-gray-500');
            userNameElement.classList.add('text-gray-300');
            userImage?.classList.remove('opacity-70');
        }
    }
    
    const presenceTextElement = userElement.querySelector('.user-presence-text');
    if (presenceTextElement) {
        const activityText = getActivityText(activityDetails, status);
        presenceTextElement.textContent = activityText;
        
        if (isOffline) {
            presenceTextElement.classList.remove('text-gray-400');
            presenceTextElement.classList.add('text-gray-500');
        } else {
            presenceTextElement.classList.remove('text-gray-500');
            presenceTextElement.classList.add('text-gray-400');
        }
    }
    
    userElement.setAttribute('data-status', status);
}

function moveUserToSection(userElement, targetRole) {
    const targetSection = document.querySelector(`.role-group[data-role="${targetRole}"]`);
    const sourceSection = userElement.closest('.role-group');
    
    if (targetSection && sourceSection) {
        const membersList = targetSection.querySelector('.members-list');
        if (membersList) {
            membersList.appendChild(userElement);
            
            updateRoleCount(sourceSection);
            updateRoleCount(targetSection);
            
            if (sourceSection.querySelector('.members-list').children.length === 0) {
                sourceSection.style.display = 'none';
            }
            targetSection.style.display = 'block';
        }
    }
}

function updateRoleCount(section) {
    const countElement = section.querySelector('.role-count');
    const membersList = section.querySelector('.members-list');
    if (countElement && membersList) {
        countElement.textContent = membersList.children.length;
    }
}

function getStatusClass(status) {
    switch (status) {
        case 'online':
        case 'appear':
            return 'bg-discord-green';
        case 'idle':
            return 'bg-discord-yellow';
        case 'do_not_disturb':
            return 'bg-discord-red';
        case 'invisible':
        case 'offline':
        default:
            return 'bg-[#747f8d]';
    }
}

window.initializeParticipantSection = function() {
    console.log('Initializing participant section');
    
    loadSocketIO(initializeSocketConnection);
    initializeParticipantHover();
};

window.toggleParticipantLoading = function(loading = true) {
    console.log('Participant loading toggle called but using simple DOM - no skeleton');
};

function initializeServerSearch() {
    const searchInput = document.getElementById('server-search-input');
    const searchIcon = document.getElementById('search-icon');
    const searchLoading = document.getElementById('search-loading');
    const searchDropdown = document.getElementById('search-results-dropdown');
    const searchContent = document.getElementById('search-results-content');
    
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function(e) {
        const query = e.target.value.trim();
        
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        if (query.length < 2) {
            hideSearchResults();
            return;
        }
        
        searchTimeout = setTimeout(() => {
            performServerSearch(query);
        }, 300);
    });
    
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideSearchResults();
            searchInput.blur();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectNextResult();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectPreviousResult();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            activateSelectedResult();
        }
    });
    
    document.addEventListener('click', function(e) {
        if (!searchDropdown.contains(e.target) && !searchInput.contains(e.target)) {
            hideSearchResults();
        }
    });
    
    const urlParams = new URLSearchParams(window.location.search);
    const highlightMessageId = urlParams.get('highlight');
    if (highlightMessageId) {
        setTimeout(() => {
            highlightMessage(highlightMessageId);
            
            const newUrl = new URL(window.location);
            newUrl.searchParams.delete('highlight');
            window.history.replaceState({}, '', newUrl);
        }, 1500);
    }
}

async function performServerSearch(query) {
    const serverId = <?php echo $currentServerId; ?>;
    const searchIcon = document.getElementById('search-icon');
    const searchLoading = document.getElementById('search-loading');
    const searchContent = document.getElementById('search-results-content');
    
    if (!window.ChatAPI) {
        console.error('ChatAPI not available');
        return;
    }
    
    currentSearchQuery = query;
    
    searchIcon.classList.add('hidden');
    searchLoading.classList.remove('hidden');
    
    try {
        searchResults = await window.ChatAPI.searchServerMessages(serverId, query);
        
        if (currentSearchQuery === query) {
            displaySearchResults(searchResults, query);
        }
    } catch (error) {
        console.error('Search error:', error);
        searchContent.innerHTML = `
            <div class="p-3 text-center text-red-400 text-sm">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                Search failed. Please try again.
            </div>
        `;
        showSearchResults();
    } finally {
        searchIcon.classList.remove('hidden');
        searchLoading.classList.add('hidden');
    }
}

function displaySearchResults(results, query) {
    const searchContent = document.getElementById('search-results-content');
    
    if (!results || results.length === 0) {
        searchContent.innerHTML = `
            <div class="p-3 text-center text-gray-400 text-sm">
                <i class="fas fa-search mr-2"></i>
                No messages found for "${query}"
            </div>
        `;
        showSearchResults();
        return;
    }
    
    const html = `
        <div class="p-2 border-b border-gray-600 text-xs text-gray-400 font-semibold uppercase">
            ${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"
        </div>
        ${results.map((message, index) => `
            <div class="search-result-item p-3 hover:bg-[#404249] cursor-pointer border-b border-gray-700 last:border-b-0" 
                 data-index="${index}"
                 data-message-id="${message.id}"
                 data-channel-id="${message.channel_id}"
                 onclick="navigateToMessage('${message.id}', '${message.channel_id}')">
                <div class="flex items-start space-x-3">
                    <img src="${message.avatar_url}" 
                         alt="${message.username}" 
                         class="w-8 h-8 rounded-full flex-shrink-0"
                         onerror="this.src='/public/assets/common/default-profile-picture.png'">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center space-x-2 mb-1">
                            <span class="font-medium text-white text-sm">${message.username}</span>
                            <span class="text-xs text-gray-400">in #${message.channel_name}</span>
                            <span class="text-xs text-gray-500">${formatSearchTimestamp(message.sent_at)}</span>
                        </div>
                        <div class="text-sm text-gray-300 line-clamp-2">
                            ${highlightSearchQuery(message.content, query)}
                        </div>
                    </div>
                    <i class="fas fa-arrow-right text-gray-500 text-xs mt-1"></i>
                </div>
            </div>
        `).join('')}
    `;
    
    searchContent.innerHTML = html;
    showSearchResults();
}

function highlightSearchQuery(content, query) {
    if (!query) return content;
    
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    
    return content.replace(regex, '<span class="bg-yellow-500 bg-opacity-30 text-yellow-300 font-medium">$1</span>');
}

function formatSearchTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'Today ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
        return 'Yesterday ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
}

function showSearchResults() {
    const searchDropdown = document.getElementById('search-results-dropdown');
    searchDropdown.classList.remove('hidden');
}

function hideSearchResults() {
    const searchDropdown = document.getElementById('search-results-dropdown');
    searchDropdown.classList.add('hidden');
    currentSearchQuery = '';
}

function selectNextResult() {
    const items = document.querySelectorAll('.search-result-item');
    const current = document.querySelector('.search-result-item.selected');
    
    if (!current) {
        if (items.length > 0) {
            items[0].classList.add('selected', 'bg-[#5865f2]');
            items[0].scrollIntoView({ block: 'nearest' });
        }
    } else {
        current.classList.remove('selected', 'bg-[#5865f2]');
        const index = parseInt(current.dataset.index);
        const next = items[index + 1] || items[0];
        if (next) {
            next.classList.add('selected', 'bg-[#5865f2]');
            next.scrollIntoView({ block: 'nearest' });
        }
    }
}

function selectPreviousResult() {
    const items = document.querySelectorAll('.search-result-item');
    const current = document.querySelector('.search-result-item.selected');
    
    if (!current) {
        if (items.length > 0) {
            items[items.length - 1].classList.add('selected', 'bg-[#5865f2]');
            items[items.length - 1].scrollIntoView({ block: 'nearest' });
        }
    } else {
        current.classList.remove('selected', 'bg-[#5865f2]');
        const index = parseInt(current.dataset.index);
        const prev = items[index - 1] || items[items.length - 1];
        if (prev) {
            prev.classList.add('selected', 'bg-[#5865f2]');
            prev.scrollIntoView({ block: 'nearest' });
        }
    }
}

function activateSelectedResult() {
    const selected = document.querySelector('.search-result-item.selected');
    if (selected) {
        const messageId = selected.dataset.messageId;
        const channelId = selected.dataset.channelId;
        if (messageId && channelId) {
            navigateToMessage(messageId, channelId);
        } else {
            selected.click();
        }
    }
}

async function navigateToMessage(messageId, channelId) {
    hideSearchResults();
    
    try {
        const currentUrl = new URL(window.location.href);
        const currentChannelId = currentUrl.searchParams.get('channel');
        
        if (currentChannelId !== channelId) {
            if (window.simpleChannelSwitcher) {
                await window.simpleChannelSwitcher.switchToChannel(channelId, 'text', true, messageId);
            } else {
                currentUrl.searchParams.set('channel', channelId);
                currentUrl.searchParams.set('highlight', messageId);
                window.location.href = currentUrl.toString();
            }
        } else {
            highlightMessage(messageId);
        }
    } catch (error) {
        console.error('Navigation error:', error);
    }
}

function highlightMessage(messageId) {
    const waitForMessage = (retries = 0) => {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        
        if (messageElement) {
            messageElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            setTimeout(() => {
                messageElement.classList.add('highlight-message');
                
                setTimeout(() => {
                    messageElement.classList.remove('highlight-message');
                }, 3000);
            }, 300);
            
        } else if (retries < 10) {
            setTimeout(() => waitForMessage(retries + 1), 500);
        } else {
            if (window.showToast) {
                window.showToast('Message not found or not loaded', 'warning');
            }
        }
    };
    
    waitForMessage();
}

window.highlightMessage = highlightMessage;


</script>

<style>
.highlight-message {
    background: linear-gradient(90deg, 
        rgba(255, 216, 0, 0.2) 0%, 
        rgba(255, 216, 0, 0.1) 50%, 
        rgba(255, 216, 0, 0.2) 100%) !important;
    border-left: 3px solid #ffd800 !important;
    animation: pulseHighlight 0.6s ease-in-out;
    transition: all 0.3s ease-out;
}

@keyframes pulseHighlight {
    0% {
        background: rgba(255, 216, 0, 0.4);
        transform: scale(1.01);
    }
    50% {
        background: rgba(255, 216, 0, 0.2);
        transform: scale(1);
    }
    100% {
        background: rgba(255, 216, 0, 0.15);
        transform: scale(1);
    }
}

.search-result-item {
    transition: all 0.2s ease;
}

.search-result-item:hover {
    transform: translateX(4px);
}

.user-presence-text {
    line-height: 1.2;
    margin-top: 1px;
}

.user-profile-trigger {
    align-items: flex-start;
}

.user-profile-trigger .flex-1 {
    min-width: 0;
    flex: 1;
}
</style>
