<?php
if (!isset($currentServer) || empty($currentServer)) {
    return;
}

$currentServerId = $currentServer->id ?? 0;
$members = $GLOBALS['serverMembers'] ?? [];

$totalMemberCount = count($members);

function renderMemberSkeleton($count = 1) {
    for ($i = 0; $i < $count; $i++) {
        echo '<div class="flex items-center px-2 py-1 rounded">';
        echo '  <div class="relative mr-2">';
        echo '    <div class="w-8 h-8 rounded-full bg-gray-700 animate-pulse"></div>';
        echo '    <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-dark bg-gray-600 animate-pulse"></span>';
        echo '  </div>';
        echo '  <div class="h-4 bg-gray-700 rounded w-' . rand(16, 28) . ' animate-pulse"></div>';
        echo '</div>';
    }
}
?>

<div class="w-60 bg-discord-dark border-l border-gray-800 flex flex-col h-full max-h-screen">
    <div class="h-12 border-b border-gray-800 flex items-center px-4">
        <input type="text" placeholder="Search" class="w-full bg-black bg-opacity-30 text-white text-sm rounded px-2 py-1 focus:outline-none">
    </div>
    
    <div class="participant-skeleton flex-1 overflow-y-auto p-2 skeleton-loader">
        <div class="mb-4">
            <div class="h-3 bg-gray-700 rounded w-28 ml-2 mb-3 animate-pulse"></div>
            <?php renderMemberSkeleton(8); ?>
        </div>
    </div>
    
    <div class="participant-content flex-1 overflow-y-auto p-2 hidden" data-lazyload="participant-list">
        <div class="px-2">
            <h3 class="text-xs font-semibold text-gray-400 uppercase py-1">
                Members — <?php echo $totalMemberCount; ?>
            </h3>
            <div class="space-y-0.5 members-section">
                <?php foreach ($members as $member):
                    $statusColor = 'bg-gray-500';
                    
                    switch ($member['status']) {
                        case 'appear':
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
                        case 'banned':
                            $statusColor = 'bg-black';
                            break;
                        default:
                            $statusColor = 'bg-discord-green';
                    }
                    
                    $isOffline = $member['status'] === 'offline';
                    $textColorClass = $isOffline ? 'text-gray-500' : 'text-gray-300';
                    $imgOpacityClass = $isOffline ? 'opacity-70' : '';
                ?>
                    <div class="flex items-center px-2 py-1 rounded hover:bg-discord-light group cursor-pointer user-profile-trigger" data-user-id="<?php echo isset($member['id']) ? $member['id'] : '0'; ?>" data-server-id="<?php echo $currentServerId; ?>">
                        <div class="relative mr-2">
                            <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                <img src="<?php echo getUserAvatar($member['avatar'] ?? '', $member['username'] ?? 'User'); ?>" 
                                     alt="Avatar" class="w-full h-full object-cover <?php echo $imgOpacityClass; ?>">
                            </div>
                            <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-dark <?php echo $statusColor; ?> status-indicator"></span>
                        </div>
                        <span class="<?php echo $textColorClass; ?> text-sm truncate"><?php echo htmlspecialchars($member['username'] ?? 'Unknown'); ?></span>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
    </div>
</div>

<script>
const SOCKET_URL = window.SOCKET_URL || 'http://localhost:1002';
const ENABLE_USER_SECTION_MOVEMENT = false;
window.ENABLE_USER_SECTION_MOVEMENT = ENABLE_USER_SECTION_MOVEMENT;

let socketConnectionStatus = 'disconnected';
let lastSocketEvent = null;

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
    const participantSkeleton = document.querySelector('.participant-skeleton');
    const participantContent = document.querySelector('.participant-content');
    
    setTimeout(function() {
        if (participantSkeleton && participantContent) {
            participantSkeleton.classList.add('hidden');
            participantContent.classList.remove('hidden');
        }
        
        const participantContainer = document.querySelector('[data-lazyload="participant-list"]');
        if (participantContainer) {
            if (window.LazyLoader && typeof window.LazyLoader.triggerDataLoaded === 'function') {
                const isEmpty = <?php echo empty($members) ? 'true' : 'false'; ?>;
                window.LazyLoader.triggerDataLoaded('participant-list', isEmpty);
            }
        }
        
        loadSocketIO(initializeSocketConnection);
    }, 1000);
});

function toggleParticipantLoading(loading = true) {
    const participantSkeleton = document.querySelector('.participant-skeleton');
    const participantContent = document.querySelector('.participant-content');
    
    if (!participantSkeleton || !participantContent) return;
    
    if (loading) {
        participantSkeleton.classList.remove('hidden');
        participantContent.classList.add('hidden');
    } else {
        participantSkeleton.classList.add('hidden');
        participantContent.classList.remove('hidden');
    }
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
            console.log(`User presence update: ${data.userId} => ${data.status}`);
            lastSocketEvent = {type: 'user-presence-update', userId: data.userId, status: data.status, timestamp: Date.now()};
            updateUserStatus(data.userId, data.status);
        });
        
        socket.on('user-offline', function(data) {
            console.log(`User went offline: ${data.userId}`);
            lastSocketEvent = {type: 'user-offline', userId: data.userId, timestamp: Date.now()};
            updateUserStatus(data.userId, 'offline');
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
        updateUserStatus(userId, onlineUsers[userId].status || 'online');
    });
}

function updateUserStatus(userId, status) {
    const userElements = document.querySelectorAll(`.user-profile-trigger[data-user-id="${userId}"]`);
    
    userElements.forEach(userElement => {
        const statusIndicator = userElement.parentElement.querySelector('.status-indicator');
        if (!statusIndicator) return;
        
        const statusClass = getStatusClass(status);
        
        statusIndicator.classList.remove('bg-discord-green', 'bg-discord-yellow', 'bg-discord-red', 'bg-gray-500');
        statusIndicator.classList.add(statusClass);
        
        const userContainer = userElement.closest('.flex');
        const userNameElement = userContainer?.querySelector('.text-sm');
        if (userNameElement) {
            if (status === 'offline' || status === 'invisible') {
                userNameElement.classList.remove('text-gray-300');
                userNameElement.classList.add('text-gray-500');
                userElement.querySelector('img')?.classList.add('opacity-70');
            } else {
                userNameElement.classList.remove('text-gray-500');
                userNameElement.classList.add('text-gray-300');
                userElement.querySelector('img')?.classList.remove('opacity-70');
            }
        }
    });
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
            return 'bg-gray-500';
    }
}

window.toggleParticipantLoading = toggleParticipantLoading;

document.addEventListener('DOMContentLoaded', function() {
    const participantItems = document.querySelectorAll('.participant-content .user-profile-trigger');
    
    participantItems.forEach(item => {
        item.addEventListener('mouseover', function() {
            this.classList.add('bg-discord-light');
        });
        
        item.addEventListener('mouseout', function() {
            this.classList.remove('bg-discord-light');
        });
    });
});
</script>
