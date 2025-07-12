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
    

    $isInVoice = false; // 
    

    $isActuallyOffline = $member['status'] === 'offline' || $member['status'] === 'invisible';
    $hasGreyStatus = !in_array($member['status'], ['online', 'appear', 'afk', 'do_not_disturb']) && !$isBot;
    $shouldShowAsOffline = ($isActuallyOffline || $hasGreyStatus) && !$isInVoice;
    
    if ($isBot) {
        $roleGroups['bot'][] = $member;
        continue;
    }
    
    if ($shouldShowAsOffline) {
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

<div class="w-60 bg-discord-dark border-l border-gray-800 flex flex-col h-screen" style="overflow: auto;">
    <div class="h-12 border-b border-gray-800 flex items-center px-4 relative">
        <div class="relative flex-1">
            <input type="text" 
                   placeholder="Search messages in server" 
                   class="w-full bg-black bg-opacity-30 text-white text-sm rounded px-2 py-1 pr-8 focus:outline-none focus:ring-1 focus:ring-[#5865f2] transition-all" 
                   id="server-search-input">
            <div class="absolute right-2 top-1/2 transform -translate-y-1/2">
                <i class="fas fa-search text-gray-500 text-xs" id="search-icon"></i>
                <i class="fas fa-spinner fa-spin text-gray-500 text-xs hidden" id="search-loading"></i>
            </div>
        </div>
        
        <!-- Refresh Presence Button -->
        <button onclick="window.forceRefreshAllPresenceData()" 
                class="ml-2 p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-all" 
                title="Refresh presence data">
            <i class="fas fa-sync-alt text-xs"></i>
        </button>
        
        <div id="search-results-dropdown" class="absolute top-full left-0 right-0 bg-[#2b2d31] border border-gray-700 rounded-lg mt-1 max-h-80 overflow-y-auto shadow-lg z-50 hidden">
            <div id="search-results-content">
                <div class="p-3 text-center text-gray-400 text-sm">
                    <i class="fas fa-search mr-2"></i>
                    Type to search messages...
                </div>
            </div>
        </div>
    </div>
    
    <div class="participant-content flex-1 p-2" style="height: calc(100vh - 3rem); overflow-y: auto;" data-lazyload="participant-list">
        <div id="participant-skeleton-loader" class="px-2">
            <?php for ($j = 0; $j < 3; $j++): ?>
                <div class="mb-4 role-group-skeleton">
                    <div class="h-3 bg-gray-700 rounded" style="width: <?php echo rand(25, 40); ?>%;"></div>
                    <div class="space-y-0.5 members-list-skeleton mt-2">
                        <?php for ($i = 0; $i < rand(3, 6); $i++): ?>
                            <div class="flex items-center px-2 py-1">
                                <div class="relative mr-2">
                                    <div class="w-8 h-8 rounded-full bg-gray-700"></div>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="h-4 bg-gray-700 rounded" style="width: <?php echo rand(50, 80); ?>%;"></div>
                                </div>
                            </div>
                        <?php endfor; ?>
                    </div>
                </div>
            <?php endfor; ?>
        </div>
        
        <div class="px-2" id="participant-list-container">
            <!-- Participant list will be populated here by JavaScript -->
        </div>
    </div>
</div>

<script>
<?php
// Get socket URL from environment
$socketHost = EnvLoader::get('SOCKET_HOST', 'socket');
$socketPort = EnvLoader::get('SOCKET_PORT', '1002');
$currentHost = $_SERVER['HTTP_HOST'] ?? 'localhost';
$socketServerLocal = "http://{$currentHost}:{$socketPort}";
?>
const SOCKET_URL = '<?php echo htmlspecialchars($socketServerLocal); ?>';
let searchTimeout = null;
let currentSearchQuery = '';
let searchResults = [];
let onlineUsers = {};
let updateTimer = null;

const allMembers = <?php echo json_encode($members); ?>;

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
    
    initializeParticipantSystem();
    initializeServerSearch();
});

function initializeParticipantSystem() {

    window.testParticipantScroll(30);
    
    setupFriendsManagerIntegration();
    setupVoiceEventListeners();
    updateParticipantDisplay();
}

function setupVoiceEventListeners() {
    window.addEventListener('voiceConnect', (event) => {

        setTimeout(() => {
            scheduleUpdate();
        }, 500);
    });
    
    window.addEventListener('voiceDisconnect', (event) => {

        setTimeout(() => {
            scheduleUpdate();
        }, 500);
    });
    
    window.addEventListener('presenceForceReset', (event) => {

        setTimeout(() => {
            scheduleUpdate();
        }, 200);
    });
    
    window.addEventListener('ownPresenceUpdate', () => {

        scheduleUpdate();
    });
    

    window.addEventListener('socketRoomJoined', (event) => {
        console.log('🏠 [PARTICIPANT] Socket room joined, refreshing participant display', event.detail);
        

        setTimeout(async () => {
            await window.forceRefreshAllPresenceData();
        }, 500);
    });
    
    setInterval(() => {
        validateOwnPresence();
    }, 4000);
}

function validateOwnPresence() {
    if (!window.videoSDKManager || !window.globalSocketManager) return;
    
    const isVideoSDKConnected = window.videoSDKManager.isConnected && 
                               window.videoSDKManager.isMeetingJoined;
    const currentActivity = window.globalSocketManager.currentActivityDetails?.type || '';
    const isPresenceInVoice = currentActivity.startsWith('In Voice');
    
    if (!isVideoSDKConnected && isPresenceInVoice) {

        scheduleUpdate();
    }
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
                case 'online-users-updated':
                    onlineUsers = friendsManager.cache.onlineUsers || {};

                    scheduleUpdate();
                    break;
            }
        });
        
        onlineUsers = friendsManager.cache.onlineUsers || {};

        
        if (Object.keys(onlineUsers).length === 0) {

            friendsManager.getOnlineUsers(true);
            
            setTimeout(() => {
                onlineUsers = friendsManager.cache.onlineUsers || {};

                scheduleUpdate();
            }, 2000);
        }
    } else {
        console.warn('⚠️ [PARTICIPANT] FriendsManager not available, retrying in 500ms');
        setTimeout(setupFriendsManagerIntegration, 500);
    }
    
    if (window.globalSocketManager && window.globalSocketManager.io) {
        window.globalSocketManager.io.on('user-presence-update', (data) => {

            scheduleUpdate();
        });
    }
}

function scheduleUpdate() {
    if (updateTimer) {
        clearTimeout(updateTimer);
    }
    
    updateTimer = setTimeout(() => {
        updateParticipantDisplay();
    }, 50);
}


window.forceRefreshAllPresenceData = async function() {
    console.log('🔄 [PARTICIPANT] Force refreshing all presence data...');
    
    try {

        if (window.FriendsManager) {
            const friendsManager = window.FriendsManager.getInstance();
            await friendsManager.getOnlineUsers(true);
            console.log('✅ [PARTICIPANT] Friends presence refreshed');
        }
        

        if (window.globalPresenceManager) {
            window.globalPresenceManager.updateActiveNow();
            console.log('✅ [PARTICIPANT] Active Now presence refreshed');
        }
        

        if (window.globalSocketManager?.io) {
            window.globalSocketManager.io.emit('get-online-users');
            console.log('📡 [PARTICIPANT] Requested fresh online users from server');
        }
        

        updateParticipantDisplay();
        console.log('✅ [PARTICIPANT] Participant display refreshed');
        
        
    } catch (error) {
        console.error('❌ [PARTICIPANT] Error refreshing presence data:', error);
        if (window.showToast) {
            window.showToast('Failed to refresh presence data', 'error', 3000);
        }
    }
};

function getStatusClass(status, activityDetails) {

    const isInVoice = activityDetails?.type && 
                      (activityDetails.type === 'In Voice Call' || 
                       activityDetails.type.startsWith('In Voice'));
    
    if (isInVoice) {
        return 'bg-discord-green';
    }
    
    switch (status) {
        case 'online':
        case 'appear':
            return 'bg-discord-green';
        case 'afk':
            return 'bg-yellow-500';
        case 'do_not_disturb':
            return 'bg-discord-red';
        case 'invisible':
        case 'offline':
        default:
            return 'bg-[#747f8d]';
    }
}

function getActivityText(activityDetails, status) {

    if (status === 'offline' || status === 'invisible') {
        return '';
    }
    
    if (!activityDetails || !activityDetails.type) {
        return status === 'afk' ? 'Away' : 'Online';
    }
    
    switch (activityDetails.type) {
        case 'playing Tic Tac Toe': 
            return 'Playing Tic Tac Toe';
        case 'In Voice Call':
            return 'In Voice';
        case 'afk': 
            return 'Away';
        case 'idle':
        default: 
            if (activityDetails.type && activityDetails.type.startsWith('In Voice - ')) {
                return 'In Voice';
            }
            return status === 'afk' ? 'Away' : 'Online';
    }
}

function updateParticipantDisplay() {

    
    const roleGroups = {
        'owner': [],
        'admin': [],
        'bot': [],
        'member': [],
        'offline': []
    };
    
    const currentUserId = window.globalSocketManager?.userId;
    const currentUserStatus = window.globalSocketManager?.currentPresenceStatus || 'online';
    const currentActivityDetails = window.globalSocketManager?.currentActivityDetails || { type: 'idle' };

    allMembers.forEach(member => {
        const role = member.role || 'member';
        const isBot = member.status === 'bot';
        let userData = onlineUsers[member.id];

        if (String(member.id) === String(currentUserId)) {
            const isVideoSDKConnected = window.videoSDKManager?.isConnected && 
                                       window.videoSDKManager?.isMeetingJoined;
            
            let correctedActivityDetails = currentActivityDetails;
            
            if (!isVideoSDKConnected && currentActivityDetails?.type?.startsWith('In Voice')) {
                correctedActivityDetails = { type: 'active' };
                
                if (window.globalSocketManager) {
                    setTimeout(() => {
                        window.globalSocketManager.updatePresence('online', { type: 'active' }, 'participant-section-correction');
                    }, 100);
                }
            }
            
            userData = {
                user_id: currentUserId,
                username: window.globalSocketManager?.username || member.username,
                status: currentUserStatus,
                activity_details: correctedActivityDetails
            };
        }

        member._correctedUserData = userData;
        
        const isOnline = userData && (userData.status === 'online' || userData.status === 'afk');
        const isInVoice = userData?.activity_details?.type && 
                          (userData.activity_details.type === 'In Voice Call' || 
                           userData.activity_details.type.startsWith('In Voice'));
        const isActuallyOffline = userData?.status === 'offline' || userData?.status === 'invisible';

        const wouldHaveGreyBubble = !isOnline && !isInVoice;
        const shouldShowAsOffline = (isActuallyOffline || wouldHaveGreyBubble) && !isInVoice;
        
        if (isBot) {
            roleGroups['bot'].push(member);
        } else if (shouldShowAsOffline) {
            roleGroups['offline'].push(member);
        } else {
            if (role === 'owner') {
                roleGroups['owner'].push(member);
            } else if (role === 'admin') {
                roleGroups['admin'].push(member);
            } else {
                roleGroups['member'].push(member);
            }
        }
    });
    
    const roleDisplayOrder = ['owner', 'admin', 'bot', 'member', 'offline'];
    const container = document.getElementById('participant-list-container');
    
    if (!container) {
        console.error('Participant list container not found!');
        return;
    }
    

    container.style.display = 'block';
    

    container.innerHTML = '';
    

    roleDisplayOrder.forEach(role => {
        const roleMembers = roleGroups[role];
        if (roleMembers.length === 0) return;
        
        const roleDisplay = role === 'offline' ? 'Offline' : 
                           role === 'bot' ? 'Bots' : 
                           role.charAt(0).toUpperCase() + role.slice(1);
        
        const roleColor = role === 'owner' ? 'text-yellow-500' :
                         role === 'admin' ? 'text-red-500' :
                         role === 'bot' ? 'text-blue-500' :
                         role === 'offline' ? 'text-gray-500' :
                         'text-gray-400';
        
        const roleSection = document.createElement('div');
        roleSection.className = 'mb-4 role-group';
        roleSection.setAttribute('data-role', role);
        
        roleSection.innerHTML = `
            <h4 class="text-xs font-semibold ${roleColor} uppercase py-1">
                ${roleDisplay} — <span class="role-count">${roleMembers.length}</span>
            </h4>
            <div class="space-y-0.5 members-list"></div>
        `;
        
        const membersList = roleSection.querySelector('.members-list');
        
        roleMembers.forEach(member => {
            const userData = member._correctedUserData || onlineUsers[member.id];
            const status = userData?.status || 'offline';
            const isOnline = userData && (userData.status === 'online' || userData.status === 'afk');
            const isOffline = role === 'offline' || !isOnline;
            
            const activityDetails = userData?.activity_details;
            const statusColor = getStatusClass(status, activityDetails);
            const activityText = getActivityText(activityDetails, status);
            
            const textColorClass = role === 'owner' ? (isOffline ? 'text-yellow-700' : 'text-yellow-400') :
                                  role === 'admin' ? (isOffline ? 'text-red-700' : 'text-red-400') :
                                  role === 'bot' ? 'text-blue-400' :
                                  role === 'offline' ? 'text-gray-500' :
                                  isOffline ? 'text-gray-500' : 'text-gray-300';
            
            const hoverTextColorClass = role === 'owner' ? (isOffline ? 'group-hover:text-yellow-700' : 'group-hover:text-yellow-400') :
                                  role === 'admin' ? (isOffline ? 'group-hover:text-red-700' : 'group-hover:text-red-400') :
                                  role === 'bot' ? 'group-hover:text-blue-400' :
                                  role === 'offline' ? 'group-hover:text-gray-500' :
                                  isOffline ? 'group-hover:text-gray-500' : 'group-hover:text-gray-300';
            
            const imgOpacityClass = isOffline ? 'opacity-70' : '';
            
            const memberEl = document.createElement('div');
            memberEl.className = 'flex items-center px-2 py-1 rounded hover:bg-discord-light group cursor-pointer user-profile-trigger';
            memberEl.setAttribute('data-user-id', member.id || '0');
            memberEl.setAttribute('data-server-id', '<?php echo $currentServerId; ?>');
            memberEl.setAttribute('data-role', member.role || 'member');
            memberEl.setAttribute('data-status', status);
            
            const username = member.display_name || member.username || 'Unknown';
            const avatarUrl = member.avatar_url || '';
            
            memberEl.innerHTML = `
                <div class="relative mr-2">
                    <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                        ${avatarUrl ? 
                            `<img src="${avatarUrl}" alt="${username}" class="w-full h-full object-cover ${imgOpacityClass}">` : 
                            `<img src="/public/assets/common/default-profile-picture.png" alt="${username}" class="w-full h-full object-cover ${imgOpacityClass}">`
                        }
                    </div>
                    <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-dark ${statusColor} status-indicator"></span>
                </div>
                <div class="flex-1 min-w-0">
                    <span class="${textColorClass} ${hoverTextColorClass} text-sm truncate font-bold member-username" data-user-id="${member.id || '0'}">${username}</span>
                    ${member.status === 'bot' ? '<span class="ml-1 px-1 py-0.5 text-[10px] bg-blue-500 text-white rounded">BOT</span>' : ''}
                    <div class="text-xs text-gray-400 truncate user-presence-text" data-user-id="${member.id || '0'}">${activityText}</div>
                </div>
            `;
            
            membersList.appendChild(memberEl);
        });
        
        container.appendChild(roleSection);
    });


    const skeleton = document.getElementById('participant-skeleton-loader');
    if (skeleton) {
        skeleton.style.display = 'none';
    }
    

    const membersDisplayed = container.querySelectorAll('.user-profile-trigger').length;
    
}

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
    if (!timestamp) return '';
    

    const date = new Date(timestamp);
    const now = new Date();
    

    const jakartaOffsetHours = 7;
    const localOffsetMinutes = date.getTimezoneOffset();
    const jakartaOffsetMinutes = jakartaOffsetHours * 60 * -1;
    const offsetDiffMinutes = jakartaOffsetMinutes - localOffsetMinutes;
    

    const jakartaDate = new Date(date.getTime() + offsetDiffMinutes * 60 * 1000);
    const jakartaNow = new Date(now.getTime() + offsetDiffMinutes * 60 * 1000);
    

    const jakartaDateString = jakartaDate.toISOString().split('T')[0];
    const jakartaNowString = jakartaNow.toISOString().split('T')[0];
    

    const jakartaYesterday = new Date(jakartaNow);
    jakartaYesterday.setDate(jakartaYesterday.getDate() - 1);
    const jakartaYesterdayString = jakartaYesterday.toISOString().split('T')[0];
    

    const hours = jakartaDate.getHours().toString().padStart(2, '0');
    const minutes = jakartaDate.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;
    

    if (jakartaDateString === jakartaNowString) {

        return `Today at ${timeStr}`;
    } else if (jakartaDateString === jakartaYesterdayString) {

        return `Yesterday at ${timeStr}`;
    } else {
        const diffDays = Math.floor((jakartaNow - jakartaDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays < 7) {

            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayName = days[jakartaDate.getDay()];
            return `${dayName} at ${timeStr}`;
        } else {

            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthName = months[jakartaDate.getMonth()];
            const day = jakartaDate.getDate();
            const year = jakartaDate.getFullYear();
            return `${monthName} ${day}, ${year} ${timeStr}`;
        }
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
window.initializeParticipantSection = function() {

    initializeParticipantSystem();
};

window.toggleParticipantLoading = function(loading = true) {
    const skeleton = document.getElementById('participant-skeleton-loader');
    const container = document.getElementById('participant-list-container');

    if (skeleton && container) {
        skeleton.style.display = loading ? 'block' : 'none';
        container.style.display = loading ? 'none' : 'block';
    }
};

window.testParticipantScroll = async function(numberOfTestMembers = 20) {

    const mockMembers = [];
    const roles = ['member', 'admin', 'bot', 'owner'];
    const statuses = ['online', 'offline', 'afk', 'do_not_disturb', 'bot', 'invisible'];
    
    for (let i = 1; i <= numberOfTestMembers; i++) {
        const role = roles[Math.floor(Math.random() * roles.length)];
        let status = statuses[Math.floor(Math.random() * statuses.length)];
        if (role === 'bot') status = 'bot';
        
        mockMembers.push({
            id: 10000 + i,
            username: `TestUser${i}`,
            display_name: `Test User ${i}`,
            role: role,
            status: status,
            avatar_url: '',
            discriminator: '0000'
        });
    }
    

    mockMembers.push({
        id: 4,
        username: 'titibot',
        display_name: 'TitiBot',
        role: 'bot',
        status: 'bot',
        avatar_url: '',
        discriminator: '0000'
    });
    

    window.allMembers = mockMembers;
    

    updateParticipantDisplay();
    

    const container = document.getElementById('participant-list-container');
    if (container) {
        container.style.display = 'block';
        container.style.visibility = 'visible';
        container.style.opacity = '1';
    }
    

    
    return mockMembers;
};

window.testParticipantGroups = function() {

    const testMembers = [
        {id: 101, username: 'serverOwner', display_name: 'Server Owner', role: 'owner', status: 'online'},
        {id: 102, username: 'adminUser1', display_name: 'Admin User 1', role: 'admin', status: 'online'},
        {id: 103, username: 'adminUser2', display_name: 'Admin User 2', role: 'admin', status: 'afk'},
        {id: 104, username: 'titibot', display_name: 'TitiBot', role: 'bot', status: 'bot'},
        {id: 105, username: 'assistantBot', display_name: 'Assistant Bot', role: 'bot', status: 'bot'},
        {id: 106, username: 'regularUser1', display_name: 'Regular User 1', role: 'member', status: 'online'},
        {id: 107, username: 'regularUser2', display_name: 'Regular User 2', role: 'member', status: 'do_not_disturb'},
        {id: 108, username: 'regularUser3', display_name: 'Regular User 3', role: 'member', status: 'afk'},
        {id: 109, username: 'offlineUser1', display_name: 'Offline User 1', role: 'member', status: 'offline'},
        {id: 110, username: 'offlineUser2', display_name: 'Offline User 2', role: 'member', status: 'invisible'}
    ];
    
    window.allMembers = testMembers;
    updateParticipantDisplay();
    
    
    if (window.showToast) {
        window.showToast('Added test members for all participant groups', 'success');
    }
    
    return testMembers;
};


window.testPresenceRefresh = async function() {
    console.log('🧪 [DEBUG] Testing presence refresh...');
    
    if (window.showToast) {
        window.showToast('Testing presence refresh...', 'info', 2000);
    }
    

    await window.forceRefreshAllPresenceData();
    

    setTimeout(() => {
        const participantCount = document.querySelectorAll('.user-profile-trigger').length;
        const onlineCount = document.querySelectorAll('.bg-discord-green, .bg-yellow-500').length;
        
        console.log('🧪 [DEBUG] Presence refresh test results:', {
            totalParticipants: participantCount,
            onlineParticipants: onlineCount,
            friendsManagerCache: window.FriendsManager?.getInstance()?.cache?.onlineUsers || {},
            socketConnected: window.globalSocketManager?.isConnected || false,
            socketAuthenticated: window.globalSocketManager?.isAuthenticated || false
        });
        
        if (window.showToast) {
            window.showToast(`Presence test: ${onlineCount}/${participantCount} online`, 'success', 4000);
        }
    }, 2000);
    
    return true;
};

window.debugPresenceState = function() {
    console.log('🔍 [DEBUG] Current presence state:', {
        friendsManagerExists: !!window.FriendsManager,
        friendsManagerOnlineUsers: window.FriendsManager?.getInstance()?.cache?.onlineUsers || {},
        globalPresenceManagerExists: !!window.globalPresenceManager,
        socketConnected: window.globalSocketManager?.isConnected || false,
        socketAuthenticated: window.globalSocketManager?.isAuthenticated || false,
        socketRooms: window.globalSocketManager?.joinedRooms || new Set(),
        totalMembers: allMembers?.length || 0,
        participantElements: document.querySelectorAll('.user-profile-trigger').length,
        onlineElements: document.querySelectorAll('.bg-discord-green, .bg-yellow-500').length
    });
};

</script>

<style>

.participant-content {
    height: calc(100vh - 3rem); 
    overflow-y: auto !important;
    scrollbar-width: thin;
    scrollbar-color: rgba(120, 120, 120, 0.4) transparent;
}

.participant-content::-webkit-scrollbar {
    width: 6px;
}

.participant-content::-webkit-scrollbar-track {
    background: transparent;
}

.participant-content::-webkit-scrollbar-thumb {
    background-color: rgba(120, 120, 120, 0.4);
    border-radius: 20px;
}

.participant-content::-webkit-scrollbar-thumb:hover {
    background-color: rgba(120, 120, 120, 0.6);
}

#participant-list-container {
    display: block !important;
    visibility: visible !important;
}


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

.user-presence-text:empty {
    display: none;
}

.user-profile-trigger {
    align-items: flex-start;
}

.user-profile-trigger .flex-1 {
    min-width: 0;
    flex: 1;
}
</style>
