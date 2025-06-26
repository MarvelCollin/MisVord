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
        echo '<div class="flex-1 bg-[#313338] flex items-center justify-center text-white text-lg">Select a server to view channels</div>';
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
        echo '<div class="flex-1 bg-[#313338] flex flex-col items-center justify-center text-white">
            <div class="text-center max-w-md">
                <i class="fas fa-hashtag text-6xl text-gray-600 mb-4"></i>
                <h2 class="text-2xl font-semibold mb-2">Welcome to ' . htmlspecialchars($currentServer->name ?? 'this server') . '!</h2>
                <p class="text-[#b5bac1] mb-4">Select a channel from the sidebar to start chatting with other members.</p>';
        if (!empty($serverChannels)) {
            echo '<button class="bg-[#5865f2] hover:bg-[#4752c4] text-white px-4 py-2 rounded transition-colors" 
                                onclick="document.querySelector(\'.channel-item\')?.click()">
                    Go to first channel
                </button>';
        }
        echo '</div></div>';
    } else {
        echo '<div class="flex-1 bg-[#313338] flex items-center justify-center text-white text-lg">Select a server to view channels</div>';
    }
    return;
}
?>

<link rel="stylesheet" href="<?php echo css('chat-section'); ?>?v=<?php echo time(); ?>">

<style>
.discord-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

.discord-scrollbar::-webkit-scrollbar-track {
    background-color: transparent;
}

.discord-scrollbar::-webkit-scrollbar-thumb {
    background-color: #1e1f22;
    border-radius: 4px;
}

.discord-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: #2b2d31;
}

.message-group-item {
    position: relative;
    padding: 2px 16px;
    transition: background-color 0.1s ease;
}

.message-group-item:hover {
    background-color: rgba(6, 6, 7, 0.02);
}

.message-group-wrapper {
    display: flex;
    align-items: flex-start;
    margin-top: 4px;
}

.message-avatar-wrapper {
    width: 40px;
    height: 40px;
    min-width: 40px;
    border-radius: 50%;
    overflow: hidden;
    margin-right: 16px;
    flex-shrink: 0;
    margin-top: 4px;
    transition: opacity 0.3s ease;
}

.message-avatar-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.message-content-area {
    flex-grow: 1;
    min-width: 0;
    padding-top: 2px;
}

.message-header-info {
    display: flex;
    align-items: baseline;
    margin-bottom: 4px;
}

.message-username-text {
    font-weight: 600;
    color: #f2f3f5;
    margin-right: 8px;
    font-size: 15px;
    cursor: pointer;
}

.message-username-text:hover {
    text-decoration: underline;
}

.message-timestamp-text {
    font-size: 12px;
    color: #a3a6aa;
    font-weight: 500;
    margin-left: 4px;
}

.message-body-text {
    color: #dcddde;
    white-space: pre-wrap;
    word-wrap: break-word;
    font-size: 16px;
    line-height: 1.375;
    margin: 0;
    padding: 0;
}

.message-consecutive {
    margin-top: 0;
}

.message-consecutive .message-body-text {
    padding-left: 0;
}

.edited-badge {
    font-size: 10px;
    color: #a3a6aa;
    margin-left: 4px;
    font-style: italic;
}

/* Reply styles are now handled in chat-section.css */

/* Message animations */
.message-fade-in {
    opacity: 0;
    transform: translateY(8px);
    transition: opacity 0.3s ease, transform 0.3s ease;
}

.message-appear {
    opacity: 1;
    transform: translateY(0);
}

/* Reaction animations */
.reaction-fade-in {
    opacity: 0;
    transform: scale(0.8);
    transition: opacity 0.3s ease, transform 0.3s ease;
}

.reaction-appear {
    opacity: 1;
    transform: scale(1);
}

/* Reaction popup animation */
@keyframes reaction-pop {
    0% { transform: scale(1); }
    50% { transform: scale(1.3); }
    100% { transform: scale(1); }
}

.reaction-pop {
    animation: reaction-pop 0.5s ease-in-out;
}

/* Reaction loading skeleton styles */
.reaction-skeleton {
    min-height: 28px;
    padding: 4px 0;
    opacity: 0.8;
}

.reaction-loading-pulse {
    height: 24px;
    width: 80px;
    background: linear-gradient(90deg, rgba(79, 84, 92, 0.2) 0%, rgba(79, 84, 92, 0.3) 50%, rgba(79, 84, 92, 0.2) 100%);
    border-radius: 12px;
    animation: pulse 1.5s ease-in-out infinite;
    background-size: 200% 100%;
}

@keyframes pulse {
    0% { background-position: 0% 0; }
    100% { background-position: 200% 0; }
}

#chat-messages .message-bubble {
    background: transparent !important;
    border: none !important;
    border-radius: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
    display: block !important;
    max-width: none !important;
    box-shadow: none !important;
}

#chat-messages .message-bubble::before {
    display: none !important;
}

#chat-messages .message-group:first-child {
    margin-top: 0;
}

#chat-messages .message-group:last-child {
    margin-bottom: 16px;
}

@media (max-width: 768px) {
    .message-avatar-wrapper {
        width: 32px;
        height: 32px;
        margin-right: 12px;
    }
    
    .message-username-text {
        font-size: 14px;
    }
    
    .message-body-text {
        font-size: 15px;
    }
}
</style>

<meta name="chat-type" content="<?php echo htmlspecialchars($chatType ?? 'channel'); ?>">
<meta name="chat-id" content="<?php echo htmlspecialchars($targetId ?? ''); ?>">
<meta name="channel-id" content="<?php echo htmlspecialchars($chatType === 'channel' ? $targetId : ''); ?>">
<meta name="user-id" content="<?php echo htmlspecialchars($currentUserId); ?>">
<meta name="username" content="<?php echo htmlspecialchars($_SESSION['username'] ?? ''); ?>">
<meta name="chat-title" content="<?php echo htmlspecialchars($chatTitle ?? ''); ?>">
<meta name="chat-placeholder" content="<?php echo htmlspecialchars($placeholder ?? ''); ?>">

<div class="flex flex-col flex-1 h-screen bg-[#313338]">
    <div class="h-12 border-b border-[#1e1f22] flex items-center px-4 shadow-sm bg-[#313338]">
        <div class="flex items-center">
            <i class="<?php echo $chatIcon; ?> text-[#b5bac1] mr-2"></i>
            <h2 class="font-semibold text-white"><?php echo htmlspecialchars($chatTitle); ?></h2>
        </div>
        <?php if ($chatType === 'channel' && !empty($activeChannel['topic'])): ?>
        <div class="border-l border-[#3f4147] h-6 mx-4"></div>
        <div class="text-sm text-[#b5bac1] truncate"><?php echo htmlspecialchars($activeChannel['topic']); ?></div>
        <?php endif; ?>
        <div class="flex-1"></div>
        <div class="flex space-x-4">
            <?php if ($chatType === 'channel'): ?>
            <button class="text-[#b5bac1] hover:text-white">
                <i class="fas fa-bell-slash"></i>
            </button>
            <button class="text-[#b5bac1] hover:text-white">
                <i class="fas fa-thumbtack"></i>
            </button>
            <button class="text-[#b5bac1] hover:text-white">
                <i class="fas fa-user-plus"></i>
            </button>
            <?php endif; ?>
            <button class="text-[#b5bac1] hover:text-white">
                <i class="fas fa-magnifying-glass"></i>
            </button>
            <button class="text-[#b5bac1] hover:text-white">
                <i class="fas fa-inbox"></i>
            </button>
            <button class="text-[#b5bac1] hover:text-white">
                <i class="fas fa-circle-question"></i>
            </button>
        </div>
    </div>

    <div class="flex-1 overflow-y-auto discord-scrollbar bg-[#313338]" id="chat-messages">
        <!-- Messages will be loaded via JavaScript with skeleton loading -->
    </div>

    <div id="typing-indicator" class="text-xs text-[#b5bac1] pb-1 pl-5 flex items-center hidden">
        <div class="flex items-center mr-2">
            <span class="h-1 w-1 bg-[#b5bac1] rounded-full animate-bounce mr-0.5" style="animation-delay: 0ms"></span>
            <span class="h-1 w-1 bg-[#b5bac1] rounded-full animate-bounce mx-0.5" style="animation-delay: 200ms"></span>
            <span class="h-1 w-1 bg-[#b5bac1] rounded-full animate-bounce ml-0.5" style="animation-delay: 400ms"></span>
        </div>
        <span>Someone is typing...</span>
    </div>

    <div class="px-4 pb-6 bg-[#313338]">
        <div class="relative">
            <form id="message-form" class="relative" onsubmit="return false;">
                <div class="bg-[#383a40] rounded-lg focus-within:ring-1 focus-within:ring-[#5865f2] transition-colors flex items-center px-4 py-2">
                    <div class="relative group">
                        <button type="button" id="attachment-button" class="text-[#b5bac1] hover:text-[#dcddde] text-xl mr-3" title="Add File">
                            <i class="fas fa-plus-circle"></i>
                        </button>
                        <div id="attachment-dropdown" class="hidden absolute bottom-full left-0 mb-2 bg-[#18191c] rounded-md shadow-lg z-10 w-48 py-2">
                            <div class="px-1">
                                <label for="file-upload" class="flex items-center cursor-pointer px-2 py-1.5 text-[#b5bac1] hover:bg-[#5865f2] hover:text-white rounded">
                                    <span class="mr-2"><i class="fas fa-upload"></i></span>
                                    <span>Upload a File</span>
                                </label>
                                <input type="file" id="file-upload" class="hidden" />
                            </div>
                        </div>
                    </div>
                    <div class="flex-1 relative flex items-center">
                        <textarea 
                            id="message-input" 
                            name="content"
                            class="w-full bg-transparent text-[#dcddde] placeholder-[#95999e] resize-none border-none outline-none text-base leading-6 max-h-40 overflow-y-auto discord-scrollbar"
                            placeholder="<?php echo htmlspecialchars($placeholder); ?>"
                            rows="1"
                            maxlength="2000"
                            autocomplete="off"
                            spellcheck="true"
                            style="min-height: 24px; padding: 0; margin: 0; vertical-align: middle;"></textarea>
                    </div>

                    <div id="file-preview" class="hidden absolute bottom-full left-4 mb-2 p-3 bg-[#2b2d31] rounded-md shadow-lg z-10 max-w-md">
                        <div class="flex items-start">
                            <div class="flex-grow mr-2 max-w-64 overflow-hidden">
                                <div id="file-preview-image" class="hidden w-full rounded mb-2 max-h-64 object-cover"></div>
                                <div id="file-preview-info" class="flex items-center">
                                    <div id="file-preview-icon" class="text-2xl mr-2 text-[#b5bac1]"><i class="fas fa-file"></i></div>
                                    <div class="overflow-hidden">
                                        <div id="file-preview-name" class="text-[#dcddde] font-medium truncate"></div>
                                        <div id="file-preview-size" class="text-xs text-[#a3a6aa]"></div>
                                    </div>
                                </div>
                            </div>
                            <button type="button" id="file-preview-remove" class="text-[#b5bac1] hover:text-white">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>

                    <div class="flex items-center space-x-3 ml-3">
                        <button type="button" class="text-[#b5bac1] hover:text-[#dcddde]" title="Gift">
                            <i class="fas fa-gift"></i>
                        </button>
                        
                        <button type="button" class="text-[#b5bac1] hover:text-[#dcddde] font-bold text-sm" title="GIF">
                            GIF
                        </button>
                        
                        <button type="button" class="text-[#b5bac1] hover:text-[#dcddde]" title="Sticker">
                            <i class="far fa-note-sticky"></i>
                        </button>
                        
                        <button type="button" class="text-[#b5bac1] hover:text-[#dcddde]" title="Emoji">
                            <i class="far fa-face-smile"></i>
                        </button>
                        
                        <button 
                            type="submit" 
                            id="send-button" 
                            class="text-[#b5bac1] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Send Message"
                            disabled>
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </form>
        </div>
    </div>
    
    <div id="message-context-menu" class="hidden fixed bg-[#18191c] rounded-md shadow-lg z-50 py-2 min-w-[180px] text-sm font-medium">
        <div class="px-1">
            <button data-action="reaction" class="flex items-center justify-between w-full px-2 py-1.5 text-[#b5bac1] hover:bg-[#5865f2] hover:text-white rounded">
                <span>Add Reaction</span>
                <i class="far fa-face-smile w-4"></i>
            </button>
            <button data-action="edit" class="flex items-center justify-between w-full px-2 py-1.5 text-[#b5bac1] hover:bg-[#5865f2] hover:text-white rounded">
                <span>Edit Message</span>
                <i class="fas fa-pen-to-square w-4"></i>
            </button>
            <button data-action="reply" class="flex items-center justify-between w-full px-2 py-1.5 text-[#b5bac1] hover:bg-[#5865f2] hover:text-white rounded">
                <span>Reply</span>
                <i class="fas fa-reply w-4"></i>
            </button>
            <button data-action="copy" class="flex items-center justify-between w-full px-2 py-1.5 text-[#b5bac1] hover:bg-[#5865f2] hover:text-white rounded">
                <span>Copy Text</span>
                <i class="fas fa-copy w-4"></i>
            </button>
            <button data-action="pin" class="flex items-center justify-between w-full px-2 py-1.5 text-[#b5bac1] hover:bg-[#5865f2] hover:text-white rounded">
                <span>Pin Message</span>
                <i class="fas fa-thumbtack w-4"></i>
            </button>
            <div class="border-t border-[#3f4147] my-1"></div>
            <button data-action="delete" class="flex items-center justify-between w-full px-2 py-1.5 text-[#ed4245] hover:bg-[#ed4245] hover:text-white rounded">
                <span>Delete Message</span>
                <i class="fas fa-trash w-4"></i>
            </button>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    console.log('Chat section template loaded');
    initializeChatUI();
});

function initializeChatUI() {
    console.log('Initializing chat UI');
    
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages && !chatMessages.hasChildNodes()) {
        console.log('Chat messages empty, skeleton loading should be visible');
    }
    
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const messageForm = document.getElementById('message-form');
    
    if (!messageInput || !sendButton) {
        console.log('Chat UI elements not found, retrying...');
        setTimeout(initializeChatUI, 200);
        return;
    }
    
    function updateSendButton() {
        const hasContent = messageInput.value.trim().length > 0;
        sendButton.disabled = !hasContent;
        sendButton.classList.toggle('opacity-50', !hasContent);
        sendButton.classList.toggle('cursor-not-allowed', !hasContent);
    }
    
    function sendMessage() {
        if (messageInput.value.trim().length === 0) {
            return;
        }
        if (window.chatSection && window.chatSection.sendMessage) {
            window.chatSection.sendMessage();
        } else {
            console.error('ChatSection not initialized');
        }
    }
    
    messageInput.addEventListener('input', updateSendButton);
    
    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    messageForm.addEventListener('submit', function(e) {
        e.preventDefault(); 
        sendMessage();
    });

    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
    
    updateSendButton();
    
    document.dispatchEvent(new CustomEvent('channelContentLoaded', {
        detail: {
            type: 'chat',
            channelId: document.querySelector('meta[name="channel-id"]')?.getAttribute('content')
        }
    }));
}
</script>