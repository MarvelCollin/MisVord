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
$onlineCount = 0;
$offlineParticipants = [];
$onlineParticipants = [];

foreach ($formattedParticipants as $participant) {
    if ($participant['status'] === 'online' || $participant['status'] === 'active') {
        $onlineParticipants[] = $participant;
        $onlineCount++;
    } else {
        $offlineParticipants[] = $participant;
    }
}
?>

<div class="w-60 bg-discord-dark flex flex-col h-full overflow-hidden">
    <div class="px-4 py-3 border-b border-discord-light">
        <h3 class="text-white font-semibold text-sm">
            Group Members — <?php echo $participantCount; ?>
        </h3>
    </div>

    <div class="flex-1 overflow-y-auto px-2 py-2">
        <?php if ($onlineCount > 0): ?>
            <div class="mb-4">
                <h4 class="text-discord-lighter font-semibold text-xs uppercase tracking-wider px-2 mb-2">
                    Online — <?php echo $onlineCount; ?>
                </h4>
                <?php foreach ($onlineParticipants as $participant): ?>
                    <div class="flex items-center px-2 py-1.5 rounded hover:bg-discord-light cursor-pointer group transition-colors">
                        <div class="relative mr-3">
                            <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                <img src="<?php echo htmlspecialchars($participant['avatar_url']); ?>" 
                                     alt="Avatar" class="w-full h-full object-cover">
                            </div>
                            <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-dark bg-discord-green"></span>
                        </div>
                        <div class="flex-1 min-w-0">
                            <span class="text-white font-medium text-sm user-profile-trigger" data-user-id="<?php echo $participant['user_id']; ?>">
                                <?php echo htmlspecialchars($participant['display_name']); ?>
                                <?php if ($participant['is_current_user']): ?>
                                    <span class="text-discord-lighter text-xs">(You)</span>
                                <?php endif; ?>
                            </span>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>

        <?php if (!empty($offlineParticipants)): ?>
            <div>
                <h4 class="text-discord-lighter font-semibold text-xs uppercase tracking-wider px-2 mb-2">
                    Offline — <?php echo count($offlineParticipants); ?>
                </h4>
                <?php foreach ($offlineParticipants as $participant): ?>
                    <div class="flex items-center px-2 py-1.5 rounded hover:bg-discord-light cursor-pointer group transition-colors">
                        <div class="relative mr-3">
                            <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                <img src="<?php echo htmlspecialchars($participant['avatar_url']); ?>" 
                                     alt="Avatar" class="w-full h-full object-cover">
                            </div>
                            <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-dark bg-gray-500"></span>
                        </div>
                        <div class="flex-1 min-w-0">
                            <span class="text-discord-lighter font-medium text-sm user-profile-trigger" data-user-id="<?php echo $participant['user_id']; ?>">
                                <?php echo htmlspecialchars($participant['display_name']); ?>
                                <?php if ($participant['is_current_user']): ?>
                                    <span class="text-discord-lighter text-xs">(You)</span>
                                <?php endif; ?>
                            </span>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    function updateParticipantStatus(userId, isOnline) {
        const statusIndicator = document.querySelector(`[data-user-id="${userId}"] .w-3.h-3`);
        if (statusIndicator) {
            statusIndicator.className = `absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-dark ${isOnline ? 'bg-discord-green' : 'bg-gray-500'}`;
        }
    }

    function setupSocketListeners() {
        if (window.globalSocketManager && window.globalSocketManager.io && window.globalSocketManager.isReady()) {
            window.globalSocketManager.io.on('user-online', (data) => {
                if (data.user_id) {
                    updateParticipantStatus(data.user_id, true);
                }
            });
            
            window.globalSocketManager.io.on('user-offline', (data) => {
                if (data.user_id) {
                    updateParticipantStatus(data.user_id, false);
                }
            });
            
            window.globalSocketManager.io.on('user-presence-update', (data) => {
                if (data.user_id) {
                    const isOnline = data.status === 'online' || data.status === 'active';
                    updateParticipantStatus(data.user_id, isOnline);
                }
            });
        }
    }

    window.addEventListener('globalSocketReady', setupSocketListeners);
    window.addEventListener('socketAuthenticated', setupSocketListeners);
    
    setTimeout(setupSocketListeners, 500);
});
</script> 