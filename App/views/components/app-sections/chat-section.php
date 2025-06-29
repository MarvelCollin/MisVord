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

function formatMessageContent($content) {
    if (!$content) return '';
    
    $escapedContent = htmlspecialchars($content, ENT_QUOTES, 'UTF-8');
    
    $formattedContent = $escapedContent;
    $formattedContent = str_replace("\n", '<br>', $formattedContent);
    $formattedContent = preg_replace('/\*\*(.*?)\*\*/', '<strong>$1</strong>', $formattedContent);
    $formattedContent = preg_replace('/\*(.*?)\*/', '<em>$1</em>', $formattedContent);
    $formattedContent = preg_replace('/```([\s\S]*?)```/', '<div class="bg-[#2b2d31] p-2 my-1 rounded text-sm font-mono"><code>$1</code></div>', $formattedContent);
    $formattedContent = preg_replace('/`(.*?)`/', '<code class="bg-[#2b2d31] px-1 py-0.5 rounded text-sm font-mono">$1</code>', $formattedContent);
    
    return $formattedContent;
}

function formatTimestamp($timestamp) {
    if (!$timestamp) return '';
    
    try {
        $date = new DateTime($timestamp);
        $now = new DateTime();
        
        if ($date->format('Y-m-d') === $now->format('Y-m-d')) {
            return $date->format('H:i');
        } else {
            return $date->format('M j');
        }
    } catch (Exception $e) {
        return '';
    }
}

function renderMessageGroup($messages, $startIndex) {
    $message = $messages[$startIndex];
    $messageId = is_array($message) ? $message['id'] : $message->id;
    $userId = is_array($message) ? $message['user_id'] : $message->user_id;
    $username = is_array($message) ? $message['username'] : $message->username;
    $avatarUrl = is_array($message) ? ($message['avatar_url'] ?? '/public/assets/common/default-profile-picture.png') : ($message->avatar_url ?? '/public/assets/common/default-profile-picture.png');
    $sentAt = is_array($message) ? ($message['sent_at'] ?? $message['created_at'] ?? '') : ($message->sent_at ?? $message->created_at ?? '');
    
    echo '<div class="message-group" data-user-id="' . htmlspecialchars($userId) . '">';
    echo '<div class="message-avatar">';
    echo '<img src="' . htmlspecialchars($avatarUrl) . '" alt="' . htmlspecialchars($username) . '\'s avatar" onerror="this.src=\'/public/assets/common/default-profile-picture.png\'">';
    echo '</div>';
    echo '<div class="message-content-wrapper">';
    echo '<div class="message-header">';
    echo '<span class="message-username">' . htmlspecialchars($username) . '</span>';
    echo '<span class="message-timestamp">' . formatTimestamp($sentAt) . '</span>';
    echo '</div>';
    echo '<div class="message-contents">';
    
    for ($i = $startIndex; $i < count($messages); $i++) {
        $currentMessage = $messages[$i];
        $currentUserId = is_array($currentMessage) ? $currentMessage['user_id'] : $currentMessage->user_id;
        
        if ($currentUserId != $userId) {
            break;
        }
        
        renderMessageContent($currentMessage);
    }
    
    echo '</div>';
    echo '</div>';
    echo '</div>';
    
    return $i - 1;
}

function renderMessageContent($message) {
    $messageId = is_array($message) ? $message['id'] : $message->id;
    $userId = is_array($message) ? $message['user_id'] : $message->user_id;
    $content = is_array($message) ? $message['content'] : $message->content;
    $editedAt = is_array($message) ? ($message['edited_at'] ?? null) : ($message->edited_at ?? null);
    $messageType = is_array($message) ? ($message['message_type'] ?? 'text') : ($message->message_type ?? 'text');
    $attachmentUrl = is_array($message) ? ($message['attachment_url'] ?? null) : ($message->attachment_url ?? null);
    $replyMessageId = is_array($message) ? ($message['reply_message_id'] ?? null) : ($message->reply_message_id ?? null);
    $replyData = is_array($message) ? ($message['reply_data'] ?? null) : ($message->reply_data ?? null);
    $currentUserId = $_SESSION['user_id'] ?? 0;
    $isOwnMessage = ($userId == $currentUserId);
    
    echo '<div class="message-content relative" data-message-id="' . htmlspecialchars($messageId) . '" data-user-id="' . htmlspecialchars($userId) . '">';
    
    if ($replyMessageId && $replyData) {
        echo '<div class="reply-container">';
        echo '<div class="reply-line"></div>';
        echo '<div class="reply-content">';
        
        if (is_array($replyData)) {
            $replyUsername = $replyData['username'] ?? 'Unknown';
            $replyContent = $replyData['content'] ?? '';
            $replyAvatarUrl = $replyData['avatar_url'] ?? '/public/assets/common/default-profile-picture.png';
            
            echo '<img src="' . htmlspecialchars($replyAvatarUrl) . '" class="reply-avatar" onerror="this.src=\'/public/assets/common/default-profile-picture.png\'">';
            echo '<span class="reply-username">' . htmlspecialchars($replyUsername) . '</span>';
            echo '<span class="reply-message-text">' . htmlspecialchars(mb_substr($replyContent, 0, 60)) . (mb_strlen($replyContent) > 60 ? '...' : '') . '</span>';
        } else {
            echo '<span style="color: #72767d; font-size: 12px; font-style: italic;">Replying to an unavailable message</span>';
        }
        
        echo '</div>';
        echo '</div>';
    }
    
    echo '<div class="message-main-text text-[#dcddde]">';
    if (!empty($content)) {
        echo formatMessageContent($content);
        if ($editedAt) {
            echo '<span class="edited-badge text-xs text-[#a3a6aa] ml-1">(edited)</span>';
        }
    }
    echo '</div>';
    
    // Handle attachments (both new array format and legacy single URL)
    $attachments = $message['attachments'] ?? [];
    if (empty($attachments) && !empty($message['attachment_url'])) {
        $attachments = [$message['attachment_url']];
    }
    
    if (!empty($attachments)) {
        echo '<div class="message-attachment mt-2 flex flex-wrap gap-2">';
        
        foreach ($attachments as $attachmentUrl) {
            if ($messageType === 'image' || preg_match('/\.(jpeg|jpg|gif|png|webp)$/i', $attachmentUrl)) {
            echo '<div class="image-attachment cursor-pointer relative">';
            echo '<img class="max-w-md max-h-96 rounded-lg" src="' . htmlspecialchars($attachmentUrl) . '" alt="Image attachment" loading="lazy" onclick="window.open(\'' . htmlspecialchars($attachmentUrl) . '\', \'_blank\')" onerror="this.onerror=null; this.src=\'/public/assets/common/default-profile-picture.png\'; this.classList.add(\'w-16\', \'h-16\'); this.parentNode.classList.add(\'bg-[#2b2d31]\', \'p-3\', \'rounded-lg\'); const err=document.createElement(\'div\'); err.className=\'text-sm text-[#b5bac1] mt-2\'; err.textContent=\'Image failed to load\'; this.parentNode.appendChild(err);">';
            echo '</div>';
        } elseif ($messageType === 'video' || preg_match('/\.(mp4|webm|mov|avi|wmv)$/i', $attachmentUrl)) {
            echo '<div class="video-attachment cursor-pointer relative">';
            echo '<video class="max-w-md max-h-96 rounded-lg" src="' . htmlspecialchars($attachmentUrl) . '" controls preload="metadata" onerror="this.parentNode.innerHTML = \'<div class=\\\"bg-[#2b2d31] p-3 rounded-lg flex items-center\\\"><i class=\\\"fas fa-file-video text-2xl mr-2\\\"></i><span>Video failed to load</span></div>\';">';
            echo '</video>';
            echo '</div>';
        } else {
            $fileName = basename(parse_url($attachmentUrl, PHP_URL_PATH)) ?: 'File';
            $extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
            
            $fileIcon = 'fas fa-file';
            if (in_array($extension, ['doc', 'docx'])) $fileIcon = 'fas fa-file-word';
            elseif (in_array($extension, ['xls', 'xlsx', 'csv'])) $fileIcon = 'fas fa-file-excel';
            elseif (in_array($extension, ['ppt', 'pptx'])) $fileIcon = 'fas fa-file-powerpoint';
            elseif ($extension === 'pdf') $fileIcon = 'fas fa-file-pdf';
            elseif (in_array($extension, ['zip', 'rar', 'tar', 'gz'])) $fileIcon = 'fas fa-file-archive';
            elseif (in_array($extension, ['txt', 'log', 'md'])) $fileIcon = 'fas fa-file-alt';
            elseif (in_array($extension, ['js', 'php', 'html', 'css', 'py', 'java', 'cpp', 'cs', 'rb'])) $fileIcon = 'fas fa-file-code';
            elseif (in_array($extension, ['mp3', 'wav', 'ogg'])) $fileIcon = 'fas fa-file-audio';
            elseif (in_array($extension, ['mp4', 'avi', 'mov', 'wmv'])) $fileIcon = 'fas fa-file-video';
            
            echo '<a href="' . htmlspecialchars($attachmentUrl) . '" target="_blank" class="block no-underline">';
            echo '<div class="bg-[#2b2d31] p-3 rounded-lg inline-flex items-center max-w-md hover:bg-[#36373d] transition-colors">';
            echo '<div class="text-3xl text-[#b5bac1] mr-3"><i class="' . $fileIcon . '"></i></div>';
            echo '<div class="overflow-hidden">';
            echo '<div class="text-[#dcddde] font-medium text-sm truncate">' . htmlspecialchars($fileName) . '</div>';
            echo '<div class="text-[#b5bac1] text-xs">Click to download</div>';
            echo '</div>';
            echo '</div>';
            echo '</a>';
        }
        }
        
        echo '</div>';
    }
    
    echo '<div class="message-actions absolute -top-4 right-4 bg-[#2b2d31] rounded-md shadow-lg flex items-center p-1 space-x-1 z-10 hidden" style="opacity: 0; visibility: hidden; position: absolute;">';
    
    echo '<button class="message-action-reaction w-8 h-8 flex items-center justify-center text-[#b9bbbe] hover:text-white rounded hover:bg-[#3c3f45] transition-colors" title="Add Reaction">';
    echo '<i class="fas fa-face-smile"></i>';
    echo '</button>';
    
    echo '<button class="message-action-reply w-8 h-8 flex items-center justify-center text-[#b9bbbe] hover:text-white rounded hover:bg-[#3c3f45] transition-colors" title="Reply">';
    echo '<i class="fas fa-reply"></i>';
    echo '</button>';
    
    if ($isOwnMessage) {
        echo '<button class="message-action-edit w-8 h-8 flex items-center justify-center text-[#b9bbbe] hover:text-white rounded hover:bg-[#3c3f45] transition-colors" title="Edit">';
        echo '<i class="fas fa-pen-to-square"></i>';
        echo '</button>';
    }
    
    echo '<button class="message-action-more w-8 h-8 flex items-center justify-center text-[#b9bbbe] hover:text-white rounded hover:bg-[#3c3f45] transition-colors" title="More">';
    echo '<i class="fas fa-ellipsis-h"></i>';
    echo '</button>';
    
    echo '</div>';
    
    echo '</div>';
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

.message-fade-in {
    opacity: 0;
    transform: translateY(8px);
    transition: opacity 0.3s ease, transform 0.3s ease;
}

.message-appear {
    opacity: 1;
    transform: translateY(0);
}

.reaction-fade-in {
    opacity: 0;
    transform: scale(0.8);
    transition: opacity 0.3s ease, transform 0.3s ease;
}

.reaction-appear {
    opacity: 1;
    transform: scale(1);
}

@keyframes reaction-pop {
    0% { transform: scale(1); }
    50% { transform: scale(1.3); }
    100% { transform: scale(1); }
}

.reaction-pop {
    animation: reaction-pop 0.5s ease-in-out;
}

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

#chat-messages .message-group:hover {
    background-color: rgba(79, 84, 92, 0.16) !important;
}

#chat-messages .message-group:first-child {
    margin-top: 0;
}

#chat-messages .message-group:last-child {
    margin-bottom: 16px;
}

#chat-messages .message-avatar {
    width: 40px !important;
    height: 40px !important;
    margin-right: 16px !important;
    flex-shrink: 0 !important;
}

#chat-messages .message-avatar img {
    width: 100% !important;
    height: 100% !important;
    border-radius: 50% !important;
    object-fit: cover !important;
}

#chat-messages .message-content-wrapper {
    flex: 1 !important;
    min-width: 0 !important;
}

#chat-messages .message-header {
    display: flex !important;
    align-items: center !important;
    margin-bottom: 2px !important;
}

#chat-messages .message-username {
    font-weight: 600 !important;
    color: #f2f3f5 !important;
    margin-right: 8px !important;
    font-size: 16px !important;
}

#chat-messages .message-timestamp {
    font-size: 12px !important;
    color: #a3a6aa !important;
}

#chat-messages .message-contents {
    margin-top: 0 !important;
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

<div class="flex-1 flex flex-col bg-[#313338] h-screen overflow-hidden">
    <?php if ($chatType): ?>
    <div class="h-12 min-h-[48px] px-4 border-b border-[#2d2f32] flex items-center shadow-sm z-10 bg-[#313338]">
        <i class="<?php echo $chatIcon; ?> text-[#949ba4] mr-2"></i>
        <span class="font-semibold text-white"><?php echo htmlspecialchars($chatTitle); ?></span>
    </div>
    <?php endif; ?>

    <div id="chat-messages" class="flex-1 overflow-y-auto overflow-x-hidden">
        <div class="messages-container flex flex-col min-h-full">
            <?php if (!empty($messages)): ?>
                <?php
                $i = 0;
                while ($i < count($messages)) {
                    $i = renderMessageGroup($messages, $i);
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

        <form id="message-form" class="flex items-center bg-[#383a40] rounded-lg h-11 relative">
            <div class="flex items-center pr-[2px] gap-1">
                <button
                    type="button"
                    class="hover:text-[#dcddde] text-[#b9bbbe] w-[32px] h-[32px] flex items-center justify-center rounded hover:bg-[#404249] transition-all mx-1"
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
                >
                    <i class="fas fa-gift text-[20px]"></i>
                </button>
                <button
                    type="button"
                    class="hover:text-[#dcddde] text-[#b9bbbe] w-[32px] h-[32px] flex items-center justify-center rounded hover:bg-[#404249] transition-all mr-1"
                >
                    <i class="fas fa-face-smile text-[20px]"></i>
                </button>
                <button
                    id="send-button"
                    type="submit"
                    class="hover:text-[#dcddde] text-[#b9bbbe] w-[32px] h-[32px] flex items-center justify-center rounded hover:bg-[#404249] transition-all mr-1 opacity-50 cursor-not-allowed"
                    disabled
                >
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </form>
    </div>
    <?php endif; ?>
</div>

<div id="file-preview-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50 flex items-center justify-center">
    <div class="bg-[#36393f] rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div class="flex justify-between items-center p-4 border-b border-[#2f3136]">
            <h3 class="text-[#dcddde] text-lg font-medium">File Preview</h3>
            <button onclick="window.chatSection?.closeFileModal()" class="text-[#b5bac1] hover:text-[#dcddde]">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="flex-1 overflow-auto p-4">
        </div>
        <div class="p-4 border-t border-[#2f3136] flex justify-end gap-2">
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
<script src="<?php echo js('components/messaging/chat-section'); ?>?v=<?php echo time(); ?>" type="module"></script>
<script src="<?php echo js('components/messaging/emoji'); ?>?v=<?php echo time(); ?>" type="module"></script>
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Auto-resize message input
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }
    
    // Dispatch event to notify that channel content is loaded
    document.dispatchEvent(new CustomEvent('channelContentLoaded', {
        detail: {
            type: 'chat',
            channelId: document.querySelector('meta[name="channel-id"]')?.getAttribute('content')
        }
    }));
});
</script>