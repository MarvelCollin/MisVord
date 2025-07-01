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
        $chatTitle = preg_replace('/=+/', '', $chatTitle);
        $chatTitle = preg_replace('/\b(Edit|Delete)\b/i', '', $chatTitle);
        $chatTitle = preg_replace('/\s+/', ' ', trim($chatTitle));
        if (empty($chatTitle)) $chatTitle = 'Channel';
        $chatIcon = 'fas fa-hashtag';
        $placeholder = "Message #{$chatTitle}";
    } else {
        foreach ($serverChannels as $channel) {
            if ($channel['id'] == $activeChannelId) {
                $activeChannel = $channel;
                $chatData = $channel;
                $chatTitle = $channel['name'];
                $chatTitle = preg_replace('/=+/', '', $chatTitle);
                $chatTitle = preg_replace('/\b(Edit|Delete)\b/i', '', $chatTitle);
                $chatTitle = preg_replace('/\s+/', ' ', trim($chatTitle));
                if (empty($chatTitle)) $chatTitle = 'Channel';
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
    $chatTitle = preg_replace('/=+/', '', $chatTitle);
    $chatTitle = preg_replace('/\b(Edit|Delete)\b/i', '', $chatTitle);
    $chatTitle = preg_replace('/\s+/', ' ', trim($chatTitle));
    if (empty($chatTitle)) $chatTitle = 'Channel';
    $chatIcon = 'fas fa-hashtag';
    $placeholder = "Message #{$chatTitle}";
} elseif ($chatType === 'direct' || $chatType === 'dm') {
    $chatTitle = $chatData['friend_username'] ?? 'Direct Message';
    $chatTitle = preg_replace('/=+/', '', $chatTitle);
    $chatTitle = preg_replace('/\b(Edit|Delete)\b/i', '', $chatTitle);
    $chatTitle = preg_replace('/\s+/', ' ', trim($chatTitle));
    if (empty($chatTitle)) $chatTitle = 'Direct Message';
    $chatIcon = 'fas fa-user';
    $placeholder = "Message @{$chatTitle}";
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

.chat-skeleton-container {
    padding: 16px;
    animation-delay: 0.1s;
}

.chat-skeleton-message {
    display: flex;
    margin-bottom: 17px;
    padding: 2px 16px;
}

.chat-skeleton-message:nth-child(1) {
    animation-delay: 0ms;
}

.chat-skeleton-message:nth-child(2) {
    animation-delay: 200ms;
}

.chat-skeleton-message:nth-child(3) {
    animation-delay: 400ms;
}

.chat-skeleton-message:nth-child(4) {
    animation-delay: 600ms;
}

.chat-skeleton-message:nth-child(5) {
    animation-delay: 800ms;
}

.chat-skeleton-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: #4f545c;
    margin-right: 16px;
    flex-shrink: 0;
}

.chat-skeleton-content {
    flex: 1;
    min-width: 0;
}

.chat-skeleton-header {
    display: flex;
    align-items: center;
    margin-bottom: 4px;
}

.chat-skeleton-username {
    height: 16px;
    background-color: #4f545c;
    border-radius: 4px;
    width: 120px;
    margin-right: 8px;
}

.chat-skeleton-timestamp {
    height: 12px;
    background-color: #4f545c;
    border-radius: 4px;
    width: 60px;
}

.chat-skeleton-text {
    height: 16px;
    background-color: #4f545c;
    border-radius: 4px;
    margin-bottom: 4px;
}

.chat-skeleton-text.short {
    width: 60%;
}

.chat-skeleton-text.medium {
    width: 80%;
}

.chat-skeleton-text.long {
    width: 95%;
}

.chat-skeleton-text.very-short {
    width: 40%;
}

/* Bubble Chat Styles - Always Available */
.bubble-message-group {
    position: relative;
    display: flex;
    padding: 2px 16px;
    margin-top: 17px;
    transition: background-color 0.1s ease;
}

.bubble-message-group:hover {
    background-color: rgba(6, 6, 7, 0.02);
}

.bubble-avatar {
    width: 40px;
    height: 40px;
    margin-right: 16px;
    flex-shrink: 0;
    border-radius: 50%;
    overflow: hidden;
}

.bubble-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.bubble-content-wrapper {
    flex: 1;
    min-width: 0;
}

.bubble-header {
    display: flex;
    align-items: baseline;
    margin-bottom: 4px;
}

.bubble-username {
    font-weight: 600;
    color: #f2f3f5;
    margin-right: 8px;
    font-size: 15px;
    cursor: pointer;
}

.bubble-username:hover {
    text-decoration: underline;
}

.bubble-timestamp {
    font-size: 12px;
    color: #a3a6aa;
    font-weight: 500;
    margin-left: 4px;
}

.bubble-contents {
    position: relative;
}

.bubble-message-content {
    position: relative;
    padding: 4px 0;
    border-radius: 4px;
}

.bubble-message-text {
    color: #dcddde;
    word-wrap: break-word;
    font-size: 16px;
    line-height: 1.375;
    margin: 0;
}

.bubble-message-actions {
    position: absolute;
    top: -12px;
    right: 16px;
    display: flex;
    gap: 4px;
    background: #313338;
    border: 1px solid #4f545c;
    border-radius: 8px;
    padding: 4px;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.15s ease, visibility 0.15s ease;
    z-index: 10;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.bubble-message-content:hover .bubble-message-actions {
    opacity: 1;
    visibility: visible;
}

.bubble-action-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: #b9bbbe;
    cursor: pointer;
    transition: all 0.15s ease;
}

.bubble-action-button:hover {
    background: #404249;
    color: #dcddde;
}

.bubble-action-button.delete-button:hover {
    background: #ed4245;
    color: #ffffff;
}

.bubble-reply-container {
    display: flex;
    align-items: center;
    margin-bottom: 4px;
    padding: 2px 8px;
    border-left: 2px solid #4f545c;
    background-color: rgba(79, 84, 92, 0.16);
    border-radius: 3px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s ease;
}

.bubble-reply-container:hover {
    background-color: rgba(79, 84, 92, 0.3);
    border-left-color: #dcddde;
}

.bubble-reply-username {
    font-weight: 500;
    color: #f2f3f5;
    margin-right: 4px;
}

.bubble-reply-content {
    color: #a3a6aa;
}

.bubble-edited-badge {
    font-size: 10px;
    color: #a3a6aa;
    margin-left: 4px;
    font-style: italic;
}

.bubble-message-temporary {
    opacity: 0.7;
}

.bubble-message-failed {
    opacity: 0.5;
    border-left: 3px solid #ed4245;
    padding-left: 8px;
}

.bubble-error-text {
    color: #ed4245;
    font-size: 12px;
    margin-top: 4px;
}

.bubble-reactions {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 8px;
}

.bubble-reaction {
    display: flex;
    align-items: center;
    background: rgba(79, 84, 92, 0.16);
    border: 1px solid transparent;
    border-radius: 12px;
    padding: 2px 6px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s ease;
}

.bubble-reaction:hover {
    border-color: #4f545c;
    background: rgba(79, 84, 92, 0.3);
}

.bubble-reaction.user-reacted {
    background: rgba(88, 101, 242, 0.16);
    border-color: rgba(88, 101, 242, 0.3);
}

.bubble-reaction.user-reacted:hover {
    background: rgba(88, 101, 242, 0.3);
}

.bubble-mention {
    padding: 2px 4px;
    border-radius: 3px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
}

.bubble-mention-all {
    color: #faa61a;
    background-color: rgba(250, 166, 26, 0.1);
}

.bubble-mention-all:hover {
    background-color: rgba(250, 166, 26, 0.2);
}

.bubble-mention-user {
    color: #5865f2;
    background-color: rgba(88, 101, 242, 0.1);
}

.bubble-mention-user:hover {
    background-color: rgba(88, 101, 242, 0.2);
    text-decoration: underline;
}

@media (max-width: 768px) {
    .bubble-message-group {
        padding: 2px 8px;
    }
    
    .bubble-message-actions {
        right: 8px;
        gap: 2px;
        padding: 2px;
    }
    
    .bubble-action-button {
        width: 28px;
        height: 28px;
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
        <div id="load-more-container" class="hidden p-4 text-center">
            <div id="load-more-skeleton" class="hidden space-y-4 animate-pulse">
                <div class="text-xs text-[#b9bbbe] text-center mb-4">
                    <i class="fas fa-spinner fa-spin mr-2"></i>Loading older messages...
                </div>
                <div class="flex items-start space-x-3 px-4">
                    <div class="w-8 h-8 bg-[#4f545c] rounded-full skeleton"></div>
                    <div class="flex-1 space-y-2">
                        <div class="flex items-center space-x-2">
                            <div class="h-3 bg-[#4f545c] rounded w-20 skeleton"></div>
                            <div class="h-2 bg-[#4f545c] rounded w-16 skeleton"></div>
                        </div>
                        <div class="h-3 bg-[#4f545c] rounded w-3/4 skeleton"></div>
                        <div class="h-3 bg-[#4f545c] rounded w-1/2 skeleton"></div>
                    </div>
                </div>
                <div class="flex items-start space-x-3 px-4">
                    <div class="w-8 h-8 bg-[#4f545c] rounded-full skeleton"></div>
                    <div class="flex-1 space-y-2">
                        <div class="flex items-center space-x-2">
                            <div class="h-3 bg-[#4f545c] rounded w-24 skeleton"></div>
                            <div class="h-2 bg-[#4f545c] rounded w-16 skeleton"></div>
                        </div>
                        <div class="h-3 bg-[#4f545c] rounded w-2/3 skeleton"></div>
                    </div>
                </div>
                <div class="flex items-start space-x-3 px-4">
                    <div class="w-8 h-8 bg-[#4f545c] rounded-full skeleton"></div>
                    <div class="flex-1 space-y-2">
                        <div class="flex items-center space-x-2">
                            <div class="h-3 bg-[#4f545c] rounded w-16 skeleton"></div>
                            <div class="h-2 bg-[#4f545c] rounded w-16 skeleton"></div>
                        </div>
                        <div class="h-3 bg-[#4f545c] rounded w-5/6 skeleton"></div>
                        <div class="h-3 bg-[#4f545c] rounded w-1/3 skeleton"></div>
                    </div>
                </div>
            </div>
            
            <button id="load-more-messages" class="group bg-[#5865f2] hover:bg-[#4752c4] text-white px-6 py-3 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl">
                <span class="load-more-content flex items-center justify-center">
                    <i class="fas fa-chevron-up mr-3 text-sm transition-transform duration-300 group-hover:-translate-y-1"></i>
                    <span class="load-more-text font-medium">Load Older Messages</span>
                </span>
                <div class="load-more-progress hidden">
                    <div class="flex items-center space-x-3">
                        <div class="spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span class="progress-text">Loading...</span>
                        <span class="progress-count text-xs opacity-75"></span>
                    </div>
                </div>
            </button>
            
            <div id="load-more-status" class="hidden mt-3 text-sm text-[#a3a6aa]">
                <i class="fas fa-check-circle text-green-400 mr-2"></i>
                <span class="status-text">Loaded messages successfully</span>
            </div>
        </div>
        
        <div id="chat-skeleton-loading" class="chat-skeleton-container">
            <div class="chat-skeleton-message animate-pulse">
                <div class="chat-skeleton-avatar"></div>
                <div class="chat-skeleton-content">
                    <div class="chat-skeleton-header">
                        <div class="chat-skeleton-username"></div>
                        <div class="chat-skeleton-timestamp"></div>
                    </div>
                    <div class="chat-skeleton-text long"></div>
                    <div class="chat-skeleton-text medium"></div>
                </div>
            </div>
            <div class="chat-skeleton-message animate-pulse">
                <div class="chat-skeleton-avatar"></div>
                <div class="chat-skeleton-content">
                    <div class="chat-skeleton-header">
                        <div class="chat-skeleton-username"></div>
                        <div class="chat-skeleton-timestamp"></div>
                    </div>
                    <div class="chat-skeleton-text short"></div>
                </div>
            </div>
            <div class="chat-skeleton-message animate-pulse">
                <div class="chat-skeleton-avatar"></div>
                <div class="chat-skeleton-content">
                    <div class="chat-skeleton-header">
                        <div class="chat-skeleton-username"></div>
                        <div class="chat-skeleton-timestamp"></div>
                    </div>
                    <div class="chat-skeleton-text medium"></div>
                    <div class="chat-skeleton-text very-short"></div>
                </div>
            </div>
            <div class="chat-skeleton-message animate-pulse">
                <div class="chat-skeleton-avatar"></div>
                <div class="chat-skeleton-content">
                    <div class="chat-skeleton-header">
                        <div class="chat-skeleton-username"></div>
                        <div class="chat-skeleton-timestamp"></div>
                    </div>
                    <div class="chat-skeleton-text long"></div>
                </div>
            </div>
            <div class="chat-skeleton-message animate-pulse">
                <div class="chat-skeleton-avatar"></div>
                <div class="chat-skeleton-content">
                    <div class="chat-skeleton-header">
                        <div class="chat-skeleton-username"></div>
                        <div class="chat-skeleton-timestamp"></div>
                    </div>
                    <div class="chat-skeleton-text medium"></div>
                    <div class="chat-skeleton-text short"></div>
                </div>
            </div>
        </div>
        
        <div class="messages-container flex flex-col <?php echo empty($messages) ? 'min-h-full items-center justify-center' : ''; ?>" id="chat-real-content" style="display: none;">
            <?php if (!empty($messages)): ?>
                <?php
                $i = 0;
                while ($i < count($messages)) {
                    $i = renderMessage($messages, $i);
                    $i++;
                }
                ?>
            <?php else: ?>
                <div class="flex flex-col items-center justify-center text-[#dcddde]">
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


<script src="<?php echo js('components/messaging/rich-text'); ?>?v=<?php echo time(); ?>" type="module"></script>
<script src="<?php echo js('components/messaging/chat-section'); ?>?v=<?php echo time(); ?>" type="module"></script>
<script src="<?php echo js('components/messaging/emoji'); ?>?v=<?php echo time(); ?>" type="module"></script>
<script src="<?php echo js('test/mention-debug'); ?>?v=<?php echo time(); ?>"></script>
<script>
document.addEventListener('DOMContentLoaded', function() {
    console.log('[Chat Section] DOM loaded, chat section should be handled by main component');
    
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