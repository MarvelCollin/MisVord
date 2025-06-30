<?php
require_once __DIR__ . '/../common/file-preview-card.php';
$currentUserId = $_SESSION['user_id'] ?? 0;

$chatType = $GLOBALS['chatType'] ?? null;
$targetId = $GLOBALS['targetId'] ?? null;
$chatData = $GLOBALS['chatData'] ?? null;
$messages = $GLOBALS['messages'] ?? [];

if (!$chatType) {
    $currentServer = $GLOBALS['currentServer'] ?? $GLOBALS['server'] ?? null;
    $activeChannelId = $GLOBALS['activeChannelId'] ?? null;
    $activeChannel = $GLOBALS['activeChannel'] ?? null;
    $channelMessages = $GLOBALS['channelMessages'] ?? [];
    $serverChannels = $GLOBALS['serverChannels'] ?? [];

    if (!isset($currentServer) || empty($currentServer)) {
        echo '<div class="flex-1 bg-[#313338] flex items-center justify-center text-white text-lg">Select a server to view channels</div>';
        return;
    }

    $chatType = 'channel';
    $targetId = $activeChannelId;
    $messages = $channelMessages;
    
    if ($activeChannel) {
        $chatData = is_array($activeChannel) ? $activeChannel : [
            'id' => $activeChannel->id,
            'name' => $activeChannel->name,
            'type' => $activeChannel->type ?? 'text',
            'description' => $activeChannel->description ?? '',
            'server_id' => $activeChannel->server_id
        ];
        $chatTitle = $chatData['name'];
        $chatIcon = 'fas fa-hashtag';
        $placeholder = "Message #{$chatTitle}";
    } else {
        foreach ($serverChannels as $channel) {
            if ($channel['id'] == $activeChannelId) {
                $activeChannel = $channel;
                $chatData = $channel;
                $chatTitle = $channel['name'];
                $chatIcon = 'fas fa-hashtag';
                $placeholder = "Message #{$chatTitle}";
                break;
            }
        }
        
        if (!$activeChannel) {
        $chatType = null;
        }
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
    $currentServer = $GLOBALS['currentServer'] ?? $GLOBALS['server'] ?? null;
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



if (!function_exists('renderMessage')) {
    function renderMessage($messages, $startIndex) {
        if (!isset($messages[$startIndex])) return $startIndex;
        
        $currentMessage = $messages[$startIndex];
        $messageId = is_array($currentMessage) ? ($currentMessage['id'] ?? '') : ($currentMessage->id ?? '');
        $content = is_array($currentMessage) ? ($currentMessage['content'] ?? '') : ($currentMessage->content ?? '');
        $attachments = is_array($currentMessage) ? ($currentMessage['attachments'] ?? []) : ($currentMessage->attachments ?? []);
        
        if (empty($messageId) || $messageId === '0' || (empty($content) && empty($attachments))) {
            return $startIndex;
        }
        
        $messageData = is_array($currentMessage) ? $currentMessage : (array) $currentMessage;
        $GLOBALS['messageData'] = $messageData;
        $GLOBALS['currentUserId'] = $_SESSION['user_id'] ?? 0;
        
        include __DIR__ . '/../messaging/bubble-chat.php';
        
        return $startIndex;
    }
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

#chat-messages {
    background-color: #313338;
}

#chat-messages .messages-container {
    padding: 16px 0;
}

@media (max-width: 768px) {
    .bubble-message-group {
        padding: 2px 8px;
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

<div class="flex-1 flex flex-col bg-[#313338] h-screen overflow-hidden">
    <?php if ($chatType): ?>
    <div class="h-12 min-h-[48px] px-4 border-b border-[#2d2f32] flex items-center shadow-sm z-10 bg-[#313338]">
        <i id="channel-icon" class="<?php echo $chatIcon; ?> text-[#949ba4] mr-2"></i>
        <span id="channel-name" class="font-semibold text-white"><?php echo htmlspecialchars($chatTitle); ?></span>
    </div>
    <?php endif; ?>

    <div id="chat-messages" class="flex-1 overflow-y-auto overflow-x-hidden">
        <div class="messages-container flex flex-col min-h-full">
            <?php if (!empty($messages)): ?>
                <?php
                $i = 0;
                while ($i < count($messages)) {
                    $i = renderMessage($messages, $i);
                    $i++;
                }
                ?>
            <?php else: ?>
                <div class="flex flex-col items-center justify-center h-full text-[#dcddde]">
                    <i class="fas fa-comments text-6xl mb-4 text-[#4f545c]"></i>
                    <p class="text-lg">No messages yet</p>
                    <p class="text-sm text-[#a3a6aa]">Be the first to send a message!</p>
                </div>
            <?php endif; ?>
        </div>
    </div>

    <?php if ($chatType): ?>
    <div class="px-4 py-[10px] bg-[#313338] border-t border-[#3f4147]">
        <div id="reply-container" class="hidden"></div>

        <div id="file-upload-area" class="hidden mb-3 p-3 bg-[#2b2d31] rounded-lg">
            <div class="flex items-center justify-between mb-2">
                <span class="text-[#f2f3f5] text-sm font-medium">
                    <i class="fas fa-paperclip mr-2"></i>
                    Files (<span id="file-count">0</span>)
                </span>
                <button id="clear-all-files" class="text-[#ed4245] hover:text-[#dc2626] text-sm transition-colors">
                    <i class="fas fa-times mr-1"></i>Clear All
                </button>
            </div>
            <div id="file-upload-list" class="flex flex-wrap gap-3"></div>
        </div>

        <form id="message-form" class="flex items-center bg-[#383a40] rounded-lg h-11 relative">
            <input 
                type="file" 
                id="file-upload" 
                class="hidden" 
                multiple 
                accept="image/*,video/*,audio/*,text/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z"
            >
            
            <div class="flex items-center pr-[2px] gap-1">
                <button
                    id="file-upload-button"
                    type="button"
                    class="hover:text-[#dcddde] text-[#b9bbbe] w-[32px] h-[32px] flex items-center justify-center rounded hover:bg-[#404249] transition-all mx-1 text-lg font-bold active:scale-95"
                    title="Upload files"
                >
                +
            </button>
                
            </div>

            <div class="flex-1 flex items-center">
                <textarea
                    id="message-input"
                    class="block w-full bg-transparent text-[#dcddde] placeholder-[#6d6f78] border-none resize-none py-[11px] px-0 focus:outline-none min-h-[22px] max-h-[50vh] text-[16px] leading-[22px]"
                    rows="1"
                    placeholder="<?php echo htmlspecialchars($placeholder); ?>"
                    maxlength="2000"
                ></textarea>
            </div>

            <div class="flex items-center pr-[2px] gap-1">
                <button
                    type="button"
                    class="hover:text-[#dcddde] text-[#b9bbbe] w-[32px] h-[32px] flex items-center justify-center rounded hover:bg-[#404249] transition-all mx-1"
                    title="Send gift"
                >
                    <i class="fas fa-gift text-[20px]"></i>
                </button>
                <button
                    type="button"
                    class="hover:text-[#dcddde] text-[#b9bbbe] w-[32px] h-[32px] flex items-center justify-center rounded hover:bg-[#404249] transition-all mr-1"
                    title="Add emoji"
                >
                    <i class="fas fa-face-smile text-[20px]"></i>
                </button>
                <button
                    id="send-button"
                    type="submit"
                    class="hover:text-[#dcddde] text-[#b9bbbe] w-[32px] h-[32px] flex items-center justify-center rounded hover:bg-[#404249] transition-all mr-1 opacity-50 cursor-not-allowed"
                    disabled
                    title="Send message"
                >
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </form>
    </div>
    <?php endif; ?>
</div>

<div id="file-preview-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50 flex items-center justify-center opacity-0 invisible transition-all duration-200">
    <div id="modal-container" class="bg-[#36393f] rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col scale-95 transition-transform duration-200">
        <div class="flex justify-between items-center p-4 border-b border-[#2f3136]">
            <div class="flex items-center gap-3">
                <div id="modal-file-icon" class="w-8 h-8 flex items-center justify-center"></div>
                <div>
                    <h3 id="modal-title" class="text-[#dcddde] text-lg font-medium"></h3>
                    <p id="modal-file-info" class="text-[#b5bac1] text-sm"></p>
                </div>
            </div>
            <button id="modal-close" class="text-[#b5bac1] hover:text-[#dcddde] transition-colors">
                <i class="fas fa-times text-lg"></i>
            </button>
        </div>
        <div id="modal-content" class="flex-1 overflow-auto p-4">
        </div>
        <div id="modal-footer" class="p-4 border-t border-[#2f3136] flex justify-end gap-2">
            <button id="modal-download" class="px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded transition-colors duration-200">
                <i class="fas fa-download mr-2"></i>Download
            </button>
        </div>
    </div>
</div>

<div id="message-context-menu" class="fixed hidden bg-[#18191c] rounded shadow-lg z-50 min-w-[180px] py-2 text-[#b5bac1]">
    <button class="w-full px-3 py-2 text-left hover:bg-[#4752c4] hover:text-white transition-colors" data-action="add-reaction">
        <i class="far fa-smile mr-2"></i> Add Reaction
    </button>
    <button class="w-full px-3 py-2 text-left hover:bg-[#4752c4] hover:text-white transition-colors" data-action="reply">
        <i class="fas fa-reply mr-2"></i> Reply
    </button>
    <button class="w-full px-3 py-2 text-left hover:bg-[#4752c4] hover:text-white transition-colors" data-action="edit">
        <i class="fas fa-edit mr-2"></i> Edit Message
    </button>
    <button class="w-full px-3 py-2 text-left hover:bg-[#4752c4] hover:text-white transition-colors" data-action="copy-text">
        <i class="fas fa-copy mr-2"></i> Copy Text
    </button>
    <button class="w-full px-3 py-2 text-left hover:bg-[#4752c4] hover:text-white transition-colors" data-action="copy-link">
        <i class="fas fa-link mr-2"></i> Copy Message Link
    </button>
    <button class="w-full px-3 py-2 text-left hover:bg-[#4752c4] hover:text-white transition-colors" data-action="mark-unread">
        <i class="fas fa-circle mr-2"></i> Mark as Unread
    </button>
    <button class="w-full px-3 py-2 text-left hover:bg-[#4752c4] hover:text-white transition-colors" data-action="pin">
        <i class="fas fa-thumbtack mr-2"></i> Pin Message
    </button>
    <div class="border-t border-[#2f3136] my-1"></div>
    <button class="w-full px-3 py-2 text-left hover:bg-[#ed4245] hover:text-white transition-colors" data-action="delete">
        <i class="fas fa-trash-alt mr-2"></i> Delete Message
    </button>
</div>

<script src="<?php echo js('components/messaging/chat-skeleton-loading'); ?>?v=<?php echo time(); ?>"></script>
<script src="<?php echo js('components/messaging/rich-text'); ?>?v=<?php echo time(); ?>" type="module"></script>
<script src="<?php echo js('components/messaging/chat-section'); ?>?v=<?php echo time(); ?>" type="module"></script>
<script src="<?php echo js('components/messaging/emoji'); ?>?v=<?php echo time(); ?>" type="module"></script>
<script src="<?php echo js('test/mention-debug'); ?>?v=<?php echo time(); ?>"></script>
<script>
document.addEventListener('DOMContentLoaded', function() {
    console.log('[Chat Section] DOM loaded, setting up chat section');
    
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }
    
    const fileUploadButton = document.getElementById('file-upload-button');
    const fileUploadInput = document.getElementById('file-upload');
    
    if (fileUploadButton && fileUploadInput && !window.chatSection) {
        fileUploadButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('📎 File upload button clicked (fallback)');
            fileUploadInput.click();
        });
    }
    
    console.log('🔍 [DEBUG] Checking server-rendered message actions on page load');
    const serverMessages = document.querySelectorAll('.message-content[data-message-id]');
    const serverActions = document.querySelectorAll('.message-actions-js');
    console.log(`📊 [DEBUG] Found ${serverMessages.length} server messages and ${serverActions.length} action containers`);
    
    setTimeout(() => {
        if (typeof window.initializeChatSection === 'function') {
            console.log('[Chat Section] Calling chat section initializer');
            window.initializeChatSection();
        } else if (typeof window.ChatSection === 'function' && !window.chatSection) {
            console.log('[Chat Section] Creating new chat section instance');
            try {
                window.chatSection = new window.ChatSection();
            } catch (error) {
                console.error('[Chat Section] Error creating chat section:', error);
            }
        }
    }, 100);
      
    document.dispatchEvent(new CustomEvent('channelContentLoaded', {
        detail: {
            type: 'chat',
            channelId: document.querySelector('meta[name="channel-id"]')?.getAttribute('content')
        }
    }));
});

if (document.readyState === 'complete') {
    console.log('[Chat Section] Document already loaded, running initialization immediately');
    setTimeout(() => {
        if (typeof window.initializeChatSection === 'function') {
            console.log('[Chat Section] Calling immediate chat section initializer');
            window.initializeChatSection();
        }
    }, 50);
}

function downloadAttachment(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
</script>