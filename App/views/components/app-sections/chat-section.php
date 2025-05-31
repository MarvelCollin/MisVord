<?php
if (!isset($currentServer) || empty($currentServer)) {
    echo '<div class="flex-1 bg-discord-background flex items-center justify-center text-white text-lg">Select a server to view channels</div>';
    return;
}

$currentServerId = $currentServer->id ?? 0;
$currentUserId = $_SESSION['user_id'] ?? 0;
$activeChannelId = $GLOBALS['activeChannelId'] ?? null;
$messages = $GLOBALS['channelMessages'] ?? [];
$channels = $GLOBALS['serverChannels'] ?? [];

$activeChannel = null;
foreach ($channels as $channel) {
    if ($channel['id'] == $activeChannelId) {
        $activeChannel = $channel;
        break;
    }
}
?>

<div class="flex flex-col flex-1 h-screen">
    <?php if ($activeChannel): ?>
    <div class="h-12 border-b border-gray-800 flex items-center px-4 shadow-sm">
        <div class="flex items-center">
            <i class="fas fa-hashtag text-gray-400 mr-2"></i>
            <h2 class="font-semibold text-white"><?php echo htmlspecialchars($activeChannel['name']); ?></h2>
        </div>
        <?php if (!empty($activeChannel['topic'])): ?>
        <div class="border-l border-gray-600 h-6 mx-4"></div>
        <div class="text-sm text-gray-400 truncate"><?php echo htmlspecialchars($activeChannel['topic']); ?></div>
        <?php endif; ?>
        <div class="flex-1"></div>
        <div class="flex space-x-4">
            <button class="text-gray-400 hover:text-white">
                <i class="fas fa-bell-slash"></i>
            </button>
            <button class="text-gray-400 hover:text-white">
                <i class="fas fa-thumbtack"></i>
            </button>
            <button class="text-gray-400 hover:text-white">
                <i class="fas fa-user-plus"></i>
            </button>
            <button class="text-gray-400 hover:text-white">
                <i class="fas fa-magnifying-glass"></i>
            </button>
            <button class="text-gray-400 hover:text-white">
                <i class="fas fa-inbox"></i>
            </button>
            <button class="text-gray-400 hover:text-white">
                <i class="fas fa-circle-question"></i>
            </button>
        </div>
    </div>

    <!-- Chat messages container with lazy loading -->
    <div class="flex-1 overflow-y-auto p-4 bg-discord-background" id="chat-messages" data-lazyload="chat">
        <!-- Content will be replaced by skeleton loader during loading -->
        <?php if (empty($messages)): ?>
        <div class="flex flex-col items-center justify-center h-full text-center">
            <div class="w-16 h-16 mb-4 bg-discord-dark rounded-full flex items-center justify-center">
                <i class="fas fa-hashtag text-discord-primary text-4xl"></i>
            </div>
            <h3 class="font-bold text-xl text-white mb-2">Welcome to #<?php echo htmlspecialchars($activeChannel['name']); ?>!</h3>
            <p class="text-gray-400 max-w-md">This is the start of the #<?php echo htmlspecialchars($activeChannel['name']); ?> channel.</p>
        </div>
        <?php else: ?>
            <?php 
            $currentDate = '';
            $lastUserId = null;
            foreach ($messages as $index => $message): 
                $timestamp = strtotime($message['timestamp']);
                $messageDate = date('Y-m-d', $timestamp);
                $showHeader = $lastUserId !== $message['user_id'];
                $lastUserId = $message['user_id'];
                
                if ($messageDate !== $currentDate) {
                    $currentDate = $messageDate;
                    $displayDate = date('F j, Y', $timestamp);
                    echo '<div class="flex items-center my-3">
                        <hr class="flex-1 border-gray-700">
                        <span class="px-2 text-xs font-semibold text-gray-500">' . $displayDate . '</span>
                        <hr class="flex-1 border-gray-700">
                    </div>';
                }
            ?>
                <div class="mb-4 group hover:bg-discord-dark/30 p-1 rounded -mx-1 <?php echo $showHeader ? '' : 'pl-12'; ?>">
                    <?php if ($showHeader): ?>
                    <div class="flex items-start">
                        <div class="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center overflow-hidden mr-3">
                            <img src="<?php echo !empty($message['avatar']) ? htmlspecialchars($message['avatar']) : 'https://ui-avatars.com/api/?name=' . urlencode($message['username'] ?? 'U') . '&background=random'; ?>" 
                                 alt="Avatar" class="w-full h-full object-cover">
                        </div>
                        <div class="flex-1">
                            <div class="flex items-center">
                                <span class="font-medium text-white mr-2"><?php echo htmlspecialchars($message['username']); ?></span>
                                <span class="text-xs text-gray-400"><?php echo date('g:i A', $timestamp); ?></span>
                            </div>
                    <?php else: ?>
                        <div class="relative group-hover:visible invisible">
                            <span class="text-xs text-gray-400 absolute -left-12"><?php echo date('g:i A', $timestamp); ?></span>
                        </div>
                    <?php endif; ?>
                            <div class="text-gray-300 select-text break-words">
                                <?php echo nl2br(htmlspecialchars($message['content'])); ?>
                            </div>
                    <?php if ($showHeader): ?>
                        </div>
                    </div>
                    <?php endif; ?>
                    <div class="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity mt-1 ml-12">
                        <button class="p-1 text-gray-400 hover:text-white hover:bg-discord-light rounded-sm">
                            <i class="fas fa-face-smile text-xs"></i>
                        </button>
                        <button class="p-1 text-gray-400 hover:text-white hover:bg-discord-light rounded-sm">
                            <i class="fas fa-pen-to-square text-xs"></i>
                        </button>
                        <button class="p-1 text-gray-400 hover:text-white hover:bg-discord-light rounded-sm">
                            <i class="fas fa-reply text-xs"></i>
                        </button>
                        <button class="p-1 text-gray-400 hover:text-white hover:bg-discord-light rounded-sm">
                            <i class="fas fa-ellipsis text-xs"></i>
                        </button>
                    </div>
                </div>
            <?php endforeach; ?>
        <?php endif; ?>
    </div>

    <div class="p-4 bg-discord-background">
        <form id="message-form" class="bg-discord-dark rounded-lg p-2">
            <div class="flex items-center mb-2">
                <button type="button" class="text-discord-primary hover:text-white mr-2">
                    <i class="fas fa-circle-plus text-lg"></i>
                </button>
                <div class="flex-1"></div>
                <button type="button" class="text-discord-primary hover:text-white mr-1">
                    <i class="fas fa-gift text-lg"></i>
                </button>
                <button type="button" class="text-discord-primary hover:text-white">
                    <i class="fas fa-image text-lg"></i>
                </button>
            </div>
            <div class="relative">
                <textarea id="message-input" 
                          class="message-input w-full bg-discord-dark text-white placeholder-gray-500 outline-none resize-none" 
                          placeholder="Message #<?php echo htmlspecialchars($activeChannel['name'] ?? 'channel'); ?>"
                          rows="1"
                          data-channel-id="<?php echo htmlspecialchars($activeChannelId ?? ''); ?>"></textarea>
            </div>
        </form>
    </div>
    <?php else: ?>
        <div class="flex-1 bg-discord-background flex items-center justify-center text-white text-lg">
            Select a channel to start chatting
        </div>
    <?php endif; ?>
</div>

<script>
// Trigger content loaded event once data is available
document.addEventListener('DOMContentLoaded', function() {
    // Set up message form submission
    const messageForm = document.getElementById('message-form');
    if (messageForm) {
        messageForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const messageInput = this.querySelector('.message-input');
            if (!messageInput || !messageInput.value.trim()) return;
            
            const channelId = messageInput.dataset.channelId || getActiveChannelId();
            const content = messageInput.value.trim();
            
            // Clear input immediately for better UX
            messageInput.value = '';
            
            // Send message via fetch API
            fetch(`/api/channels/${channelId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ content })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log('Message sent successfully');
                    // Messages will be refreshed by auto-refresh
                } else {
                    console.error('Error sending message:', data.message);
                }
            })
            .catch(error => {
                console.error('Error sending message:', error);
            });
        });
        
        // Support Ctrl+Enter to submit
        const messageInput = messageForm.querySelector('.message-input');
        if (messageInput) {
            messageInput.addEventListener('keydown', function(e) {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    messageForm.dispatchEvent(new Event('submit'));
                }
            });
            
            // Auto-resize textarea
            messageInput.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = (this.scrollHeight) + 'px';
            });
        }
    }
    
    // Handle lazy loading of chat messages
    const chatMessagesContainer = document.getElementById('chat-messages');
    if (chatMessagesContainer) {
        // Simulate network request with a random delay between 800-1200ms
        const loadDelay = Math.floor(Math.random() * 400) + 800;
        
        setTimeout(function() {
            if (window.LazyLoader) {
                const hasMessages = <?php echo !empty($messages) ? 'true' : 'false'; ?>;
                window.LazyLoader.triggerDataLoaded('chat', !hasMessages);
                console.log('Chat messages loaded after ' + loadDelay + 'ms');
            }
        }, loadDelay);
    }
});

// Helper function to get active channel ID
function getActiveChannelId() {
    const activeChannel = document.querySelector('.channel-item.active');
    return activeChannel ? activeChannel.dataset.channelId : null;
}
</script>
