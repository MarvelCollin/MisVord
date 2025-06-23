<?php
require_once dirname(dirname(dirname(__DIR__))) . '/controllers/FriendController.php';
require_once dirname(dirname(dirname(__DIR__))) . '/controllers/ChatController.php';

$friendController = new FriendController();
$chatController = new ChatController();

$friendData = $friendController->getUserFriends();

require_once dirname(dirname(dirname(__DIR__))) . '/database/repositories/ChatRoomRepository.php';
$chatRoomRepository = new ChatRoomRepository();
$userId = $_SESSION['user_id'] ?? 0;
$chatRooms = $chatRoomRepository->getUserDirectRooms($userId);

$currentUser = $friendData['currentUser'];
$friends = $friendData['friends'];
$onlineFriends = $friendData['onlineFriends'];

$currentPath = $_SERVER['REQUEST_URI'] ?? '';
$tooltipPath = dirname(dirname(__DIR__)) . '/components/common/tooltip.php';
if (file_exists($tooltipPath)) {
    require_once $tooltipPath;
}
?>

<div class="w-60 bg-discord-dark flex flex-col">

    <div class="p-3">
        <div class="w-full bg-discord-darker rounded px-2 py-1.5 flex items-center">
            <input type="text" placeholder="Find or start a conve..." class="w-full bg-transparent border-0 text-sm text-discord-lighter focus:outline-none">
        </div>
    </div>

    <div class="px-2 mb-2">

        <a href="/app/friends" class="block w-full">
            <div class="flex items-center p-2 rounded hover:bg-discord-light text-white cursor-pointer">
                <div class="w-8 h-8 rounded-full bg-discord-background flex items-center justify-center mr-3">
                    <i class="fas fa-user-friends"></i>
                </div>
                <span class="font-medium">Friends</span>
            </div>
        </a>

        <a href="/nitro" class="block w-full">
            <div class="flex items-center p-2 rounded hover:bg-discord-light text-discord-lighter hover:text-white cursor-pointer mt-1 relative">
                <div class="w-8 h-8 rounded-full bg-discord-background flex items-center justify-center mr-3">
                    <i class="fas fa-gift"></i>
                </div>
                <span class="font-medium">Nitro</span>
            </div>
        </a>
    </div>

    <div class="px-4 mt-1 flex items-center justify-between">
        <h3 class="uppercase text-discord-lighter font-semibold text-xs tracking-wider">Direct Messages</h3>
        <button class="text-discord-lighter hover:text-white text-lg" id="new-direct-message-btn">
            <i class="fas fa-plus"></i>
        </button>
    </div>

    <div class="px-2 mt-1 flex-grow overflow-y-auto">
        <?php if (empty($chatRooms)): ?>
            <div class="text-discord-lighter text-xs p-2">
                No direct messages yet. Start a conversation!
            </div>
        <?php else: ?>
            <?php foreach ($chatRooms as $chatRoom): ?>
                <?php 
                $statusColor = 'bg-gray-500';
                $otherUserId = $chatRoom['other_user_id'] ?? 0;
                $otherUsername = $chatRoom['other_username'] ?? 'Unknown';
                $otherAvatar = $chatRoom['other_avatar'] ?? '';
                $roomId = $chatRoom['id'] ?? 0;
                
                foreach ($friends as $friend) {
                    if ($friend['id'] == $otherUserId) {
                        if ($friend['status'] === 'online') {
                            $statusColor = 'bg-discord-green';
                        } elseif ($friend['status'] === 'away') {
                            $statusColor = 'bg-discord-yellow';
                        } elseif ($friend['status'] === 'dnd') {
                            $statusColor = 'bg-discord-red';
                        }
                        break;
                    }
                }

                $activeDmId = $_SESSION['active_dm'] ?? null;
                $isActive = ($activeDmId == $roomId);
                $activeClass = $isActive ? 'bg-discord-light' : 'hover:bg-discord-light';
                ?>
                <div class="dm-friend-item flex items-center p-1.5 rounded <?php echo $activeClass; ?> text-discord-lighter hover:text-white cursor-pointer group"
                     data-friend-id="<?php echo htmlspecialchars($otherUserId); ?>"
                     data-chat-room-id="<?php echo htmlspecialchars($roomId); ?>"
                     data-chat-type="direct"
                     data-username="<?php echo htmlspecialchars($otherUsername); ?>">
                    <div class="relative mr-3">
                        <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                            <img src="<?php echo getUserAvatar($otherAvatar, $otherUsername); ?>" 
                                alt="Avatar" class="w-full h-full object-cover">
                        </div>
                        <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-dark <?php echo $statusColor; ?>"></span>
                    </div>
                    <span class="font-medium truncate"><?php echo htmlspecialchars($otherUsername); ?></span>

                    <div class="ml-auto hidden group-hover:flex items-center space-x-1">
                        <button class="text-discord-lighter hover:text-white p-1 rounded hover:bg-discord-background">
                            <i class="fas fa-phone-alt text-xs"></i>
                        </button>
                        <button class="text-discord-lighter hover:text-white p-1 rounded hover:bg-discord-background">
                            <i class="fas fa-video text-xs"></i>
                        </button>
                    </div>
                </div>
            <?php endforeach; ?>
        <?php endif; ?>
    </div>

    <?php include dirname(__DIR__) . '/common/user-profile.php'; ?>
</div>

<?php include dirname(__DIR__) . '/home/new-direct-modal.php'; ?>

<script>
    document.addEventListener('DOMContentLoaded', function() {
        const dmFriendItems = document.querySelectorAll('.dm-friend-item');
        
        dmFriendItems.forEach(item => {
            item.addEventListener('click', function() {
                const friendId = this.dataset.friendId;
                const chatRoomId = this.dataset.chatRoomId;
                
                if (chatRoomId) {
                    window.location.href = `/app/channels/dm/${chatRoomId}`;
                } else {
                    fetch('/api/chat/create', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest'
                        },
                        body: JSON.stringify({
                            user_id: friendId
                        }),
                        credentials: 'same-origin'
                    })
                    .then(response => {
                        const contentType = response.headers.get('content-type');
                        if (!contentType || !contentType.includes('application/json')) {
                            console.error('Server returned HTML instead of JSON');
                            if (window.showToast) {
                                window.showToast('Error: Server returned HTML error page', 'error');
                            }
                            throw new Error('Server returned HTML error page');
                        }
                        return response.json();
                    })
                    .then(data => {
                        if (data.success && data.data && data.data.channel_id) {
                            window.location.href = `/app/channels/dm/${data.data.channel_id}`;
                        } else {
                            console.error('Failed to create chat room:', data.message || 'Unknown error');
                            if (window.showToast) {
                                window.showToast('Failed to create conversation: ' + (data.message || 'Unknown error'), 'error');
                            }
                        }
                    })
                    .catch(error => {
                        console.error('Error opening direct message:', error);
                        if (window.showToast) {
                            window.showToast('Error opening conversation. Please try again.', 'error');
                        }
                    });
                }
            });
        });
    });
</script>