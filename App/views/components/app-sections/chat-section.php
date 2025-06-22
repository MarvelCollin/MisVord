<?php
$currentUserId = $_SESSION['user_id'] ?? 0;

$chatType = $GLOBALS['chatType'] ?? null;
$targetId = $GLOBALS['targetId'] ?? null;
$chatData = $GLOBALS['chatData'] ?? null;
$messages = $GLOBALS['messages'] ?? [];

if (!$chatType) {
    $currentServer = $GLOBALS['currentServer'] ?? null;
    $activeChannelId = $GLOBALS['activeChannelId'] ?? null;
    $channelMessages = $GLOBALS['channelMessages'] ?? [];
    $serverChannels = $GLOBALS['serverChannels'] ?? [];

    if (!isset($currentServer) || empty($currentServer)) {
        echo '<div class="flex-1 bg-discord-background flex items-center justify-center text-white text-lg">Select a server to view channels</div>';
        return;
    }

    $chatType = 'channel';
    $targetId = $activeChannelId;
    $messages = $channelMessages;
    
    $activeChannel = null;
    foreach ($serverChannels as $channel) {
        if ($channel['id'] == $activeChannelId) {
            $activeChannel = $channel;
            break;
        }
    }
    
    if ($activeChannel) {
        $chatData = $activeChannel;
        $chatTitle = $activeChannel['name'];
        $chatIcon = 'fas fa-hashtag';
        $placeholder = "Message #{$chatTitle}";
    } else {
        $chatType = null;
    }
}

if ($chatType === 'channel') {
    $activeChannel = $chatData;
    $chatTitle = $activeChannel['name'] ?? 'Unknown Channel';
    $chatIcon = 'fas fa-hashtag';
    $placeholder = "Message #{$chatTitle}";
} elseif ($chatType === 'direct' || $chatType === 'dm') {
    $chatTitle = $chatData['friend_username'] ?? 'Direct Message';
    $chatIcon = 'fas fa-user';
    $placeholder = "Message @{$chatTitle}";
} else {
    $currentServer = $GLOBALS['currentServer'] ?? null;
    $serverChannels = $GLOBALS['serverChannels'] ?? [];
    
    if ($currentServer) {
        echo '<div class="flex-1 bg-discord-background flex flex-col items-center justify-center text-white">
            <div class="text-center max-w-md">
                <i class="fas fa-hashtag text-6xl text-gray-600 mb-4"></i>
                <h2 class="text-2xl font-semibold mb-2">Welcome to ' . htmlspecialchars($currentServer->name ?? 'this server') . '!</h2>
                <p class="text-gray-400 mb-4">Select a channel from the sidebar to start chatting with other members.</p>';
        if (!empty($serverChannels)) {
            echo '<button class="bg-discord-primary hover:bg-discord-primary-dark text-white px-4 py-2 rounded transition-colors" 
                        onclick="document.querySelector(\'.channel-item\')?.click()">
                    Go to first channel
                </button>';
        }
        echo '</div></div>';
    } else {
        echo '<div class="flex-1 bg-discord-background flex items-center justify-center text-white text-lg">Select a server to view channels</div>';
    }
    return;
}

$additional_js[] = 'components/messaging/chat-section';
$additional_css[] = 'messaging';
?>

<meta name="chat-type" content="<?php echo htmlspecialchars($chatType ?? 'channel'); ?>">
<meta name="chat-id" content="<?php echo htmlspecialchars($targetId ?? ''); ?>">
<meta name="channel-id" content="<?php echo htmlspecialchars($chatType === 'channel' ? $targetId : ''); ?>">
<meta name="user-id" content="<?php echo htmlspecialchars($currentUserId); ?>">
<meta name="username" content="<?php echo htmlspecialchars($_SESSION['username'] ?? ''); ?>">
<meta name="chat-title" content="<?php echo htmlspecialchars($chatTitle ?? ''); ?>">
<meta name="chat-placeholder" content="<?php echo htmlspecialchars($placeholder ?? ''); ?>">

<div class="flex flex-col flex-1 h-screen">
    <div class="h-12 border-b border-gray-800 flex items-center px-4 shadow-sm">
        <div class="flex items-center">
            <i class="<?php echo $chatIcon; ?> text-gray-400 mr-2"></i>
            <h2 class="font-semibold text-white"><?php echo htmlspecialchars($chatTitle); ?></h2>
        </div>
        <?php if ($chatType === 'channel' && !empty($activeChannel['topic'])): ?>
        <div class="border-l border-gray-600 h-6 mx-4"></div>
        <div class="text-sm text-gray-400 truncate"><?php echo htmlspecialchars($activeChannel['topic']); ?></div>
        <?php endif; ?>
        <div class="flex-1"></div>
        <div class="flex space-x-4">
            <?php if ($chatType === 'channel'): ?>
            <button class="text-gray-400 hover:text-white">
                <i class="fas fa-bell-slash"></i>
            </button>
            <button class="text-gray-400 hover:text-white">
                <i class="fas fa-thumbtack"></i>
            </button>
            <button class="text-gray-400 hover:text-white">
                <i class="fas fa-user-plus"></i>
            </button>
            <?php endif; ?>
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

    <div class="flex-1 overflow-y-auto p-4 bg-discord-background" id="chat-messages" data-lazyload="chat">
        <!-- Messages will be loaded here -->
    </div>

    <div id="message-context-menu" class="context-menu hidden">
        <div class="context-menu-section">
            <div class="emoji-row">
                <button class="emoji-btn" data-emoji="👍" title="👍">👍</button>
                <button class="emoji-btn" data-emoji="❤️" title="❤️">❤️</button>
                <button class="emoji-btn" data-emoji="😂" title="😂">😂</button>
                <button class="emoji-btn" data-emoji="😮" title="😮">😮</button>
                <button class="emoji-btn add-reaction-btn" title="Add Reaction">
                    <i class="fas fa-face-smile"></i>
                </button>
            </div>
        </div>
        
        <div class="context-menu-divider"></div>
        
        <div class="context-menu-section">
            <button class="context-menu-item edit-message-btn">
                <i class="fas fa-pen-to-square"></i>
                <span>Edit Message</span>
            </button>
            <button class="context-menu-item reply-message-btn">
                <i class="fas fa-reply"></i>
                <span>Reply</span>
            </button>
            <button class="context-menu-item forward-message-btn">
                <i class="fas fa-share"></i>
                <span>Forward</span>
            </button>
            <button class="context-menu-item copy-text-btn">
                <i class="fas fa-copy"></i>
                <span>Copy Text</span>
            </button>
            <button class="context-menu-item pin-message-btn">
                <i class="fas fa-thumbtack"></i>
                <span>Pin Message</span>
            </button>
        </div>
        
        <div class="context-menu-divider"></div>
        
        <div class="context-menu-section">
            <button class="context-menu-item apps-btn">
                <i class="fas fa-puzzle-piece"></i>
                <span>Apps</span>
                <i class="fas fa-chevron-right ml-auto"></i>
            </button>
            <button class="context-menu-item mark-unread-btn">
                <i class="fas fa-eye-slash"></i>
                <span>Mark Unread</span>
            </button>
            <button class="context-menu-item copy-link-btn">
                <i class="fas fa-link"></i>
                <span>Copy Message Link</span>
            </button>
            <button class="context-menu-item speak-message-btn">
                <i class="fas fa-volume-high"></i>
                <span>Speak Message</span>
            </button>
        </div>
        
        <div class="context-menu-divider"></div>
        
        <div class="context-menu-section">
            <button class="context-menu-item delete-message-btn danger">
                <i class="fas fa-trash"></i>
                <span>Delete Message</span>
            </button>
            <button class="context-menu-item copy-id-btn">
                <i class="fas fa-hashtag"></i>
                <span>Copy Message ID</span>
            </button>
        </div>
    </div>

    <div id="typing-indicator" class="text-xs text-gray-400 pb-1 pl-5 flex items-center hidden">
        <div class="typing-animation mr-2">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
        </div>
        <span>Someone is typing...</span>
    </div>

    <div class="px-4 pb-6 bg-discord-background">
        <div class="relative">
            <form id="message-form" class="relative" onsubmit="return false;">
                <div class="bg-discord-message-input border border-discord-input-border rounded-lg overflow-hidden focus-within:border-discord-primary transition-colors">
                    <div class="flex items-center px-4 py-3">
                        <button type="button" class="text-discord-muted hover:text-white transition-colors mr-4 flex-shrink-0" title="Upload File">
                            <i class="fas fa-plus-circle fa-lg"></i>
                        </button>
                          <div class="flex-1 relative">
                            <textarea 
                                id="message-input" 
                                name="content"
                                class="w-full bg-transparent text-white placeholder-discord-muted resize-none border-none outline-none text-base leading-6 max-h-40 overflow-y-auto scrollbar-thin scrollbar-track-discord-dark scrollbar-thumb-discord-scrollbar"
                                placeholder="<?php echo htmlspecialchars($placeholder); ?>"
                                rows="1"
                                maxlength="2000"
                                autocomplete="off"
                                spellcheck="true"
                                style="min-height: 24px;"></textarea>
                        </div>

                        <div class="flex items-center space-x-2 ml-4 flex-shrink-0">
                            <button type="button" class="text-discord-muted hover:text-white transition-colors" title="Send Gift">
                                <i class="fas fa-gift fa-lg"></i>
                            </button>
                            
                            <button type="button" class="text-discord-muted hover:text-white transition-colors" title="Upload Image">
                                <i class="fas fa-image fa-lg"></i>
                            </button>
                            
                            <button type="button" class="text-discord-muted hover:text-white transition-colors" title="Emoji">
                                <i class="fas fa-face-smile fa-lg"></i>
                            </button>
                            
                            <button 
                                type="button" 
                                id="send-button" 
                                class="bg-discord-primary hover:bg-discord-primary-dark text-white rounded-full p-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-discord-primary"
                                title="Send Message"
                                disabled>
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="character-count-container px-4 pb-2 hidden">
                        <div class="text-xs text-discord-muted text-right">
                            <span class="character-count">0</span>/2000
                        </div>
                    </div>                </div>

                <!-- Hidden form data for fallback - using consistent naming -->
                <input type="hidden" name="chat_type" value="<?php echo htmlspecialchars($chatType); ?>" />
                <input type="hidden" name="chat_id" value="<?php echo htmlspecialchars($targetId ?? ''); ?>" />
                <input type="hidden" name="channel_id" value="<?php echo htmlspecialchars($chatType === 'channel' ? $targetId : ''); ?>" />
            </form>
        </div>
    </div>

    <div class="chat-connection-controls">
        <button id="refresh-chat-connection" title="Refresh chat connection" class="btn-icon refresh-connection">
            <i class="fas fa-sync-alt"></i>
        </button>
        <span class="connection-status" id="chat-connection-status">
            <span class="status-indicator connected"><i class="fas fa-circle"></i></span>
            <span class="status-text">Connected</span>
        </span>
    </div>
</div>

</script>