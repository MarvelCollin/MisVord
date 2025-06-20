<?php
require_once dirname(dirname(dirname(__DIR__))) . '/controllers/FriendController.php';

$friendController = new FriendController();
$friendData = $friendController->getUserFriends();

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

        <div class="flex items-center p-2 rounded hover:bg-discord-light text-white cursor-pointer">
            <div class="w-8 h-8 rounded-full bg-discord-background flex items-center justify-center mr-3">
                <i class="fas fa-user-friends"></i>
            </div>
            <span class="font-medium">Friends</span>
        </div>

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
        <?php if (empty($friends)): ?>
            <div class="text-discord-lighter text-xs p-2">
                No friends to message yet. Add some friends!
            </div>
        <?php else: ?>
            <?php foreach ($friends as $index => $friend): ?>
                <?php 
                $statusColor = 'bg-gray-500'; 
                if ($friend['status'] === 'online') {
                    $statusColor = 'bg-discord-green';
                } elseif ($friend['status'] === 'away') {
                    $statusColor = 'bg-discord-yellow';
                } elseif ($friend['status'] === 'dnd') {
                    $statusColor = 'bg-discord-red';
                }

                $specialLabel = null;
                if ($index === 1) {
                    $specialLabel = '<span class="ml-auto flex items-center text-xs bg-discord-darker px-1.5 py-0.5 rounded text-blue-400 font-medium"><i class="fas fa-code mr-1"></i> CODE</span>';
                } elseif ($index === 2) {
                    $specialLabel = '<span class="ml-auto flex items-center text-xs bg-discord-darker px-1.5 py-0.5 rounded text-purple-400 font-medium">DF</span>';
                }
                ?>
                <div class="dm-friend-item flex items-center p-1.5 rounded hover:bg-discord-light text-discord-lighter hover:text-white cursor-pointer group"
                     data-friend-id="<?php echo htmlspecialchars($friend['id']); ?>"
                     data-chat-type="direct"
                     data-username="<?php echo htmlspecialchars($friend['username']); ?>">
                    <div class="relative mr-3">
                        <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                            <img src="<?php echo isset($friend['avatar_url']) ? htmlspecialchars($friend['avatar_url']) : 'https://ui-avatars.com/api/?name=' . urlencode($friend['username'] ?? 'U') . '&background=random'; ?>" 
                                alt="Avatar" class="w-full h-full object-cover">
                        </div>
                        <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-dark <?php echo $statusColor; ?>"></span>
                    </div>
                    <span class="font-medium truncate"><?php echo htmlspecialchars($friend['username']); ?></span>

                    <?php if ($specialLabel): ?>
                        <?php echo $specialLabel; ?>
                    <?php else: ?>

                    <div class="ml-auto hidden group-hover:flex items-center space-x-1">
                        <button class="text-discord-lighter hover:text-white p-1 rounded hover:bg-discord-background">
                            <i class="fas fa-phone-alt text-xs"></i>
                        </button>
                        <button class="text-discord-lighter hover:text-white p-1 rounded hover:bg-discord-background">
                            <i class="fas fa-video text-xs"></i>
                        </button>
                    </div>
                    <?php endif; ?>
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
                const friendUsername = this.dataset.username;
                
                // First try to use the unified chat manager if available
                if (window.unifiedChatManager) {
                    window.unifiedChatManager.openDirectMessage(friendId);
                    return;
                }
                
                // Otherwise make an API call to get or create a DM room
                fetch('/api/chat/dm/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify({
                        friend_id: friendId
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
                    if (data.success && data.chat_room) {
                        const chatRoom = data.chat_room;
                        
                        // Replace the current content with chat section
                        const appContent = document.querySelector('.flex-col.flex-1');
                        if (appContent) {
                            // Set global variables for the chat section
                            window.GLOBALS = window.GLOBALS || {};
                            window.GLOBALS.chatType = 'direct';
                            window.GLOBALS.targetId = chatRoom.id;
                            window.GLOBALS.chatData = {
                                friend_username: friendUsername,
                                friend_id: friendId
                            };
                            
                            // Load the chat section
                            fetch(`/api/chat/dm/${chatRoom.id}/messages`)
                                .then(response => response.json())
                                .then(data => {
                                    if (!data.success) {
                                        console.error('Failed to load messages:', data.message || 'Unknown error');
                                        return;
                                    }
                                    
                                    window.GLOBALS.messages = data.messages || [];
                                    
                                    // Set proper globals for PHP
                                    window.chatType = 'direct';
                                    window.targetId = chatRoom.id;
                                    window.chatData = {
                                        friend_username: friendUsername,
                                        friend_id: friendId
                                    };
                                    window.messages = data.messages || [];
                                    
                                    // Load chat section template
                                    fetch('/components/app-sections/chat-section.php')
                                        .then(response => response.text())
                                        .then(html => {
                                            appContent.innerHTML = html;
                                            
                                            // Initialize the messaging component
                                            if (window.MisVordMessaging) {
                                                window.MisVordMessaging.switchToChat(chatRoom.id, 'direct');
                                            }
                                        })
                                        .catch(error => {
                                            console.error('Error loading chat section:', error);
                                        });
                                })
                                .catch(error => {
                                    console.error('Error loading messages:', error);
                                });
                        }
                    }
                })
                .catch(error => {
                    console.error('Error opening direct message:', error);
                });
            });
        });
    });
</script>