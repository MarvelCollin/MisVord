<?php
// Backward compatibility: Support both new unified system and legacy channel system
$currentUserId = $_SESSION['user_id'] ?? 0;

// Check for new unified chat variables first
$chatType = $GLOBALS['chatType'] ?? null;
$targetId = $GLOBALS['targetId'] ?? null;
$chatData = $GLOBALS['chatData'] ?? null;
$messages = $GLOBALS['messages'] ?? [];

// Fallback to legacy channel system if unified variables not set
if (!$chatType) {
    $currentServer = $GLOBALS['currentServer'] ?? null;
    $activeChannelId = $GLOBALS['activeChannelId'] ?? null;
    $channelMessages = $GLOBALS['channelMessages'] ?? [];
    $serverChannels = $GLOBALS['serverChannels'] ?? [];

    if (!isset($currentServer) || empty($currentServer)) {
        echo '<div class="flex-1 bg-discord-background flex items-center justify-center text-white text-lg">Select a server to view channels</div>';
        return;
    }

    // Use legacy channel data
    $chatType = 'channel';
    $targetId = $activeChannelId;
    $messages = $channelMessages;
    
    // Find active channel data
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
        // No active channel selected
        $chatType = null;
    }
}

// Set up chat display variables based on type
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
    // No chat selected
    $currentServer = $GLOBALS['currentServer'] ?? null;
    $serverChannels = $GLOBALS['serverChannels'] ?? [];
    
    if ($currentServer) {
        // Show server welcome screen
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
?>

<meta name="chat-type" content="<?php echo htmlspecialchars($chatType ?? 'channel'); ?>">
<meta name="chat-id" content="<?php echo htmlspecialchars($targetId ?? ''); ?>">
<meta name="channel-id" content="<?php echo htmlspecialchars($chatType === 'channel' ? $targetId : ''); ?>">
<meta name="user-id" content="<?php echo htmlspecialchars($currentUserId); ?>">
<meta name="username" content="<?php echo htmlspecialchars($_SESSION['username'] ?? ''); ?>">

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
        <?php if (empty($messages)): ?>
        <div class="flex flex-col items-center justify-center h-full text-center" id="welcome-message">
            <div class="w-16 h-16 mb-4 bg-discord-dark rounded-full flex items-center justify-center">
                <i class="<?php echo $chatIcon; ?> text-discord-primary text-4xl"></i>
            </div>
            <?php if ($chatType === 'channel'): ?>
            <h3 class="font-bold text-xl text-white mb-2">Welcome to #<?php echo htmlspecialchars($chatTitle); ?>!</h3>
            <p class="text-gray-400 max-w-md">This is the start of the #<?php echo htmlspecialchars($chatTitle); ?> channel.</p>
            <?php else: ?>
            <h3 class="font-bold text-xl text-white mb-2">This is the beginning of your direct message history with <?php echo htmlspecialchars($chatTitle); ?>.</h3>
            <p class="text-gray-400 max-w-md">Start a conversation!</p>
            <?php endif; ?>
        </div>
        <?php else: ?>
            <?php 
            $currentDate = '';
            $lastUserId = null;
            foreach ($messages as $index => $message): 
                $timestamp = strtotime($message['sent_at'] ?? $message['timestamp']);
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
                <div class="mb-4 group hover:bg-discord-dark/30 p-1 rounded -mx-1 <?php echo $showHeader ? '' : 'pl-12'; ?>" 
                     id="msg-<?php echo htmlspecialchars($message['id']); ?>"
                     data-user-id="<?php echo htmlspecialchars($message['user_id']); ?>">
                    <?php if ($showHeader): ?>
                    <div class="flex items-start">
                        <div class="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center overflow-hidden mr-3">
                            <img src="<?php echo !empty($message['avatar_url']) ? htmlspecialchars($message['avatar_url']) : 'https://ui-avatars.com/api/?name=' . urlencode($message['username'] ?? 'U') . '&background=random'; ?>" 
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

    <div id="typing-indicator" class="text-xs text-gray-400 pb-1 pl-5 flex items-center hidden">
        <div class="typing-animation mr-2">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
        </div>
        <span>Someone is typing...</span>
    </div>

    <div class="p-4 bg-discord-background">
        <form id="message-form" class="bg-discord-dark rounded-lg p-2" onsubmit="return false;">
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
                          name="content"
                          class="message-input w-full bg-discord-dark text-white placeholder-gray-500 outline-none resize-none border-none" 
                          placeholder="<?php echo htmlspecialchars($placeholder); ?>"
                          rows="1"
                          maxlength="2000"
                          data-chat-type="<?php echo htmlspecialchars($chatType); ?>"
                          data-chat-id="<?php echo htmlspecialchars($targetId ?? ''); ?>"
                          data-channel-id="<?php echo htmlspecialchars($chatType === 'channel' ? $targetId : ''); ?>"
                          autocomplete="off"
                          spellcheck="true"></textarea>
            </div>

            <input type="hidden" name="chat_type" value="<?php echo htmlspecialchars($chatType); ?>" />
            <input type="hidden" name="chat_id" value="<?php echo htmlspecialchars($targetId ?? ''); ?>" />
            <input type="hidden" name="channel_id" value="<?php echo htmlspecialchars($chatType === 'channel' ? $targetId : ''); ?>" />
            <input type="hidden" data-user-id="<?php echo htmlspecialchars($currentUserId); ?>" />
            <input type="hidden" data-username="<?php echo htmlspecialchars($_SESSION['username'] ?? ''); ?>" />

            <div class="flex justify-between items-center mt-2">
                <div class="flex items-center text-xs text-gray-400">
                    <span class="character-count hidden">0/2000</span>
                </div>
                <button type="button" id="send-button" class="bg-discord-primary text-white px-3 py-1 rounded hover:bg-discord-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    Send <i class="fas fa-paper-plane ml-1"></i>
                </button>
            </div>
        </form>
    </div>
</div>