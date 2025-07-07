<?php
$currentUserId = $_SESSION['user_id'] ?? 0;
$chatType = $GLOBALS['chatType'] ?? 'direct';
$targetId = $GLOBALS['targetId'] ?? 0;
$chatData = $GLOBALS['chatData'] ?? [];

if ($chatType !== 'direct' || !$targetId) {
    return;
}

require_once dirname(dirname(dirname(__DIR__))) . '/database/repositories/ChatRoomRepository.php';
$chatRoomRepository = new ChatRoomRepository();

$chatRoom = $chatRoomRepository->find($targetId);
if (!$chatRoom || $chatRoom->type !== 'group') {
    return;
}

$participants = $chatRoomRepository->getParticipants($targetId);
if (!$participants) {
    $participants = [];
}

require_once dirname(dirname(dirname(__DIR__))) . '/database/repositories/UserRepository.php';
$userRepository = new UserRepository();

$formattedParticipants = [];
foreach ($participants as $participant) {
    $user = $userRepository->find($participant['user_id']);
    $status = $user ? ($user->status ?? 'offline') : 'offline';
    
    $formattedParticipants[] = [
        'user_id' => $participant['user_id'],
        'username' => $participant['username'],
        'display_name' => $participant['display_name'] ?? $participant['username'],
        'avatar_url' => $participant['avatar_url'] ?? '/public/assets/common/default-profile-picture.png',
        'status' => $status,
        'is_current_user' => $participant['user_id'] == $currentUserId
    ];
}

$participantCount = count($formattedParticipants);
?>

<div class="w-60 bg-discord-dark flex flex-col h-full overflow-hidden">
    <div class="px-4 py-3 border-b border-discord-light">
        <h3 class="text-white font-semibold text-sm">
            Group Members — <span id="group-member-count"><?php echo $participantCount; ?></span>
        </h3>
    </div>

    <div class="flex-1 overflow-y-auto px-2 py-2" id="group-members-container">
        <div id="group-skeleton-loading" class="px-2">
            <div class="mb-4 role-group-skeleton">
                <div class="h-3 bg-gray-700 rounded" style="width: 40%;"></div>
                <div class="space-y-0.5 members-list-skeleton mt-2">
                    <?php for ($i = 0; $i < 3; $i++): ?>
                        <div class="flex items-center px-2 py-1">
                            <div class="relative mr-2">
                                <div class="w-8 h-8 rounded-full bg-gray-700"></div>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="h-4 bg-gray-700 rounded" style="width: 70%;"></div>
                            </div>
                        </div>
                    <?php endfor; ?>
                </div>
            </div>
            <div class="mb-4 role-group-skeleton">
                <div class="h-3 bg-gray-700 rounded" style="width: 35%;"></div>
                <div class="space-y-0.5 members-list-skeleton mt-2">
                    <?php for ($i = 0; $i < 2; $i++): ?>
                        <div class="flex items-center px-2 py-1">
                            <div class="relative mr-2">
                                <div class="w-8 h-8 rounded-full bg-gray-700"></div>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="h-4 bg-gray-700 rounded" style="width: 60%;"></div>
                            </div>
                        </div>
                    <?php endfor; ?>
                </div>
            </div>
        </div>
        
        <div id="group-members-list" style="display: none;">
            <div id="online-members-section" class="mb-4">
                <h4 class="text-discord-lighter font-semibold text-xs uppercase tracking-wider px-2 mb-2">
                    Online — <span id="online-count">0</span>
                </h4>
                <div id="online-members-list"></div>
            </div>

            <div id="offline-members-section">
                <h4 class="text-discord-lighter font-semibold text-xs uppercase tracking-wider px-2 mb-2">
                    Offline — <span id="offline-count">0</span>
                </h4>
                <div id="offline-members-list"></div>
            </div>
        </div>
    </div>
</div>

<script>

const groupParticipants = <?php echo json_encode($formattedParticipants); ?>;
let onlineUsers = {};
let updateTimer = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeGroupParticipants();
    

    setupFriendsManagerIntegration();
    

    setupSocketListeners();
});

function initializeGroupParticipants() {

    updateParticipantDisplay();
    

    setTimeout(() => {
        document.getElementById('group-skeleton-loading').style.display = 'none';
        document.getElementById('group-members-list').style.display = 'block';
    }, 800);
}

function setupFriendsManagerIntegration() {
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
            }, 1000);
        } else {
            scheduleUpdate();
        }
    } else {
        console.warn('⚠️ [GROUP-PARTICIPANTS] FriendsManager not available, retrying in 500ms');
        setTimeout(setupFriendsManagerIntegration, 500);
    }
}

function setupSocketListeners() {
    function setupListeners() {
        if (window.globalSocketManager && window.globalSocketManager.io && window.globalSocketManager.isReady()) {
            window.globalSocketManager.io.on('user-online', (data) => {
                if (data.user_id) {
                    const participant = groupParticipants.find(p => p.user_id == data.user_id);
                    if (participant) {
                        participant.status = 'online';
                        scheduleUpdate();
                    }
                }
            });
            
            window.globalSocketManager.io.on('user-offline', (data) => {
                if (data.user_id) {
                    const participant = groupParticipants.find(p => p.user_id == data.user_id);
                    if (participant) {
                        participant.status = 'offline';
                        scheduleUpdate();
                    }
                }
            });
            
            window.globalSocketManager.io.on('user-presence-update', (data) => {
                if (data.user_id) {
                    const participant = groupParticipants.find(p => p.user_id == data.user_id);
                    if (participant) {
                        participant.status = data.status;
                        scheduleUpdate();
                    }
                }
            });
            
            return true;
        }
        return false;
    }

    if (!setupListeners()) {
        window.addEventListener('globalSocketReady', setupListeners);
        window.addEventListener('socketAuthenticated', setupListeners);
        
        setTimeout(setupListeners, 1000);
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
        case 'active':
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
        return status === 'afk' ? 'Away' : '';
    }
    
    switch (activityDetails.type) {
        case 'playing Tic Tac Toe': 
            return 'Playing Tic Tac Toe';
        case 'In Voice Call':
            return 'In Voice';
        case 'afk': 
            return 'Away';
        default: 
            if (activityDetails.type && activityDetails.type.startsWith('In Voice - ')) {
                return 'In Voice';
            }
            return status === 'afk' ? 'Away' : '';
    }
}

function updateParticipantDisplay() {
    const onlineMembersList = document.getElementById('online-members-list');
    const offlineMembersList = document.getElementById('offline-members-list');
    const onlineCountEl = document.getElementById('online-count');
    const offlineCountEl = document.getElementById('offline-count');
    
    if (!onlineMembersList || !offlineMembersList) return;
    

    onlineMembersList.innerHTML = '';
    offlineMembersList.innerHTML = '';
    
    const currentUserId = window.globalSocketManager?.userId;
    let onlineCount = 0;
    let offlineCount = 0;
    

    groupParticipants.forEach(participant => {

        let userData = onlineUsers[participant.user_id];
        

        if (String(participant.user_id) === String(currentUserId)) {
            const currentUserStatus = window.globalSocketManager?.currentPresenceStatus || 'online';
            const currentActivityDetails = window.globalSocketManager?.currentActivityDetails || { type: 'idle' };
            
            userData = {
                user_id: currentUserId,
                username: window.globalSocketManager?.username || participant.username,
                status: currentUserStatus,
                activity_details: currentActivityDetails
            };
        }
        

        const status = (userData?.status || participant.status || 'offline').toLowerCase();
        const activityDetails = userData?.activity_details || null;
        const isInVoice = activityDetails?.type && (
            activityDetails.type === 'In Voice Call' || activityDetails.type.startsWith('In Voice')
        );

        const allowedOnline = ['online', 'appear', 'afk', 'do_not_disturb'];
        const isActuallyOffline = status === 'offline' || status === 'invisible';
        const hasGreyStatus = !allowedOnline.includes(status);
        const shouldShowAsOffline = (isActuallyOffline || hasGreyStatus) && !isInVoice;
        const isOnline = !shouldShowAsOffline;
        

        let statusColor = getStatusClass(status, activityDetails);
        if (shouldShowAsOffline) {
            statusColor = 'bg-[#747f8d]';
        }
        const activityText = getActivityText(activityDetails, status);
        

        const memberEl = document.createElement('div');
        memberEl.className = 'flex items-center px-2 py-1.5 rounded hover:bg-discord-light cursor-pointer group transition-colors';
        memberEl.setAttribute('data-user-id', participant.user_id);

        memberEl.setAttribute('data-server-id', '');
        memberEl.setAttribute('data-username', participant.username || '');
        memberEl.setAttribute('data-role', 'member');
        memberEl.setAttribute('data-status', status);
        
        memberEl.innerHTML = `
            <div class="relative mr-3">
                <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                    <img src="${participant.avatar_url}" 
                         alt="${participant.display_name}" 
                         class="w-full h-full object-cover ${isOnline || isInVoice ? '' : 'opacity-70'}"
                         onerror="this.src='/public/assets/common/default-profile-picture.png'">
                </div>
                <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-dark ${statusColor} status-indicator"
                      data-user-id="${participant.user_id}"></span>
            </div>
            <div class="flex-1 min-w-0">
                <span class="text-${shouldShowAsOffline ? 'discord-lighter' : 'white'} font-medium text-sm truncate user-profile-trigger">
                    ${participant.display_name}
                    ${participant.is_current_user ? '<span class="text-discord-lighter text-xs">(You)</span>' : ''}
                </span>
                ${activityText ? `<div class="text-xs text-gray-400 truncate user-presence-text">${activityText}</div>` : ''}
            </div>
        `;
        

        if (shouldShowAsOffline) {
            offlineMembersList.appendChild(memberEl);
            offlineCount++;
        } else {
            onlineMembersList.appendChild(memberEl);
            onlineCount++;
        }
    });
    

    onlineCountEl.textContent = onlineCount;
    offlineCountEl.textContent = offlineCount;
    document.getElementById('group-member-count').textContent = groupParticipants.length;
    

    document.getElementById('online-members-section').style.display = onlineCount > 0 ? 'block' : 'none';
    document.getElementById('offline-members-section').style.display = offlineCount > 0 ? 'block' : 'none';
}


window.updateGroupParticipants = updateParticipantDisplay;
</script>

<style>
/* Skeleton loading animation */
#group-skeleton-loading .role-group-skeleton {
    animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
    from { opacity: 0.3; }
    to { opacity: 1; }
}

#group-skeleton-loading .bg-gray-700 {
    position: relative;
    overflow: hidden;
}

#group-skeleton-loading .bg-gray-700::after {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    transform: translateX(-100%);
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
    100% { transform: translateX(100%); }
}

.user-presence-text {
    line-height: 1.2;
    margin-top: 1px;
}

.user-presence-text:empty {
    display: none;
}
</style> 