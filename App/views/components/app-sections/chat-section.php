<?php
require_once __DIR__ . '/../common/file-preview-card.php';
require_once __DIR__ . '/../messaging/bubble-chat.php';
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
    $content = htmlspecialchars($content);
    $content = preg_replace('/\*\*(.*?)\*\*/', '<strong>$1</strong>', $content);
    $content = preg_replace('/\*(.*?)\*/', '<em>$1</em>', $content);
    $content = preg_replace('/~~(.*?)~~/', '<del>$1</del>', $content);
    $content = preg_replace('/`(.*?)`/', '<code class="bg-[#2f3136] text-[#dcddde] px-1 py-0.5 rounded text-sm">$1</code>', $content);
    $content = preg_replace_callback('/```(.*?)```/s', function($matches) {
        return '<pre class="bg-[#2f3136] text-[#dcddde] p-2 rounded mt-1 overflow-x-auto"><code>' . $matches[1] . '</code></pre>';
    }, $content);
    $content = preg_replace('/\n/', '<br>', $content);
    return $content;
}

function formatTimestamp($timestamp) {
    if (empty($timestamp)) return '';
    
    $date = DateTime::createFromFormat('Y-m-d H:i:s', $timestamp);
    if (!$date) {
        $date = new DateTime($timestamp);
    }
    
    $now = new DateTime();
    $diff = $now->diff($date);
    
    if ($diff->days == 0) {
        return 'Today at ' . $date->format('g:i A');
    } elseif ($diff->days == 1) {
        return 'Yesterday at ' . $date->format('g:i A');
    } else {
        return $date->format('m/d/Y g:i A');
    }
}

if (!function_exists('formatBubbleTimestamp')) {
    function formatBubbleTimestamp($sentAt) {
        if (empty($sentAt)) return '';
        
        $date = new DateTime($sentAt);
        $now = new DateTime();
        $diffDays = $now->diff($date)->days;
        
        if ($diffDays === 0) {
            return 'Today at ' . $date->format('g:i A');
        } elseif ($diffDays === 1) {
            return 'Yesterday at ' . $date->format('g:i A');
        } else {
            return $date->format('M j, Y g:i A');
        }
    }
}

if (!function_exists('formatBubbleContent')) {
    function formatBubbleContent($content) {
        if (empty($content)) return '';
        
        $formatted = htmlspecialchars($content, ENT_QUOTES, 'UTF-8');
        
        $formatted = preg_replace('/\*\*(.*?)\*\*/', '<strong>$1</strong>', $formatted);
        $formatted = preg_replace('/\*(.*?)\*/', '<em>$1</em>', $formatted);
        $formatted = preg_replace('/~~(.*?)~~/', '<del>$1</del>', $formatted);
        $formatted = preg_replace('/`(.*?)`/', '<code class="bg-[#2f3136] text-[#dcddde] px-1 py-0.5 rounded text-sm">$1</code>', $formatted);
        $formatted = nl2br($formatted);
        
        return $formatted;
    }
}

if (!function_exists('getBubbleFileIcon')) {
    function getBubbleFileIcon($filename) {
        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        
        $icons = [
            'pdf' => '<i class="fas fa-file-pdf text-red-500"></i>',
            'doc' => '<i class="fas fa-file-word text-blue-500"></i>',
            'docx' => '<i class="fas fa-file-word text-blue-500"></i>',
            'xls' => '<i class="fas fa-file-excel text-green-500"></i>',
            'xlsx' => '<i class="fas fa-file-excel text-green-500"></i>',
            'ppt' => '<i class="fas fa-file-powerpoint text-orange-500"></i>',
            'pptx' => '<i class="fas fa-file-powerpoint text-orange-500"></i>',
            'zip' => '<i class="fas fa-file-archive text-yellow-500"></i>',
            'rar' => '<i class="fas fa-file-archive text-yellow-500"></i>',
            'txt' => '<i class="fas fa-file-alt text-gray-500"></i>',
            'js' => '<i class="fas fa-file-code text-purple-500"></i>',
            'php' => '<i class="fas fa-file-code text-purple-500"></i>',
            'html' => '<i class="fas fa-file-code text-purple-500"></i>',
            'css' => '<i class="fas fa-file-code text-purple-500"></i>',
            'mp3' => '<i class="fas fa-file-audio text-green-400"></i>',
            'wav' => '<i class="fas fa-file-audio text-green-400"></i>'
        ];
        
        return $icons[$extension] ?? '<i class="fas fa-file"></i>';
    }
}

if (!function_exists('formatBubbleFileSize')) {
    function formatBubbleFileSize($bytes) {
        if (!$bytes || $bytes === 0) return '0 B';
        
        $sizes = ['B', 'KB', 'MB', 'GB'];
        $i = floor(log($bytes) / log(1024));
        
        return round($bytes / pow(1024, $i), 2) . ' ' . $sizes[$i];
    }
}

if (!function_exists('isBubbleImageFile')) {
    function isBubbleImageFile($url) {
        return preg_match('/\.(jpeg|jpg|gif|png|webp)$/i', $url);
    }
}

if (!function_exists('isBubbleVideoFile')) {
    function isBubbleVideoFile($url) {
        return preg_match('/\.(mp4|webm|mov|avi|wmv)$/i', $url);
    }
}

if (!function_exists('renderBubbleMessageContent')) {
    function renderBubbleMessageContent($message) {
    $messageId = is_array($message) ? ($message['id'] ?? '') : ($message->id ?? '');
    $userId = is_array($message) ? ($message['user_id'] ?? 0) : ($message->user_id ?? 0);
    $content = is_array($message) ? ($message['content'] ?? '') : ($message->content ?? '');
    $editedAt = is_array($message) ? ($message['edited_at'] ?? null) : ($message->edited_at ?? null);
    $attachments = is_array($message) ? ($message['attachments'] ?? []) : ($message->attachments ?? []);
    $reactions = is_array($message) ? ($message['reactions'] ?? []) : ($message->reactions ?? []);
    $replyMessageId = is_array($message) ? ($message['reply_message_id'] ?? null) : ($message->reply_message_id ?? null);
    $replyData = is_array($message) ? ($message['reply_data'] ?? null) : ($message->reply_data ?? null);
    
    // Prevent rendering empty/invalid message content
    if (empty($messageId) || $messageId === '0' || (empty($content) && empty($attachments))) {
        error_log("❌ [RENDER-BUBBLE] Skipping invalid message content - ID: '$messageId', Content: '$content', Attachments: " . count($attachments));
        return; // Don't render empty message content
    }
    
    $currentUserId = $_SESSION['user_id'] ?? 0;
    $isOwnMessage = ($userId == $currentUserId);
    
    echo '<div class="bubble-message-content" data-message-id="' . htmlspecialchars($messageId) . '" data-user-id="' . htmlspecialchars($userId) . '">';
    
    // Reply if present
    if ($replyData) {
        echo '<div class="bubble-reply-container" data-reply-message-id="' . htmlspecialchars($replyMessageId) . '">';
        echo '<div style="margin-right: 4px;"><i class="fas fa-reply"></i></div>';
        echo '<span class="bubble-reply-username">' . htmlspecialchars($replyData['username'] ?? 'Unknown') . '</span>';
        $replyContent = $replyData['content'] ?? '';
        echo '<span class="bubble-reply-content">' . htmlspecialchars(strlen($replyContent) > 50 ? substr($replyContent, 0, 50) . '...' : $replyContent) . '</span>';
        echo '</div>';
    }
    
    // Message text
    if ($content) {
        echo '<div class="bubble-message-text">';
        echo formatBubbleContent($content);
        if ($editedAt) {
            echo '<span class="bubble-edited-badge">(edited)</span>';
        }
        echo '</div>';
    }
    
    // Attachments
    if (!empty($attachments)) {
        echo '<div class="bubble-attachments">';
        foreach ($attachments as $attachment) {
            $attachmentUrl = is_array($attachment) ? ($attachment['url'] ?? $attachment) : $attachment;
            $attachmentName = is_array($attachment) ? ($attachment['name'] ?? basename($attachmentUrl)) : basename($attachmentUrl);
            $attachmentSize = is_array($attachment) ? ($attachment['size'] ?? null) : null;
            
            echo '<div class="bubble-attachment">';
            
            if (isBubbleImageFile($attachmentUrl)) {
                echo '<img src="' . htmlspecialchars($attachmentUrl) . '" alt="' . htmlspecialchars($attachmentName) . '"';
                echo ' loading="lazy" onclick="window.open(\'' . htmlspecialchars($attachmentUrl) . '\', \'_blank\')"';
                echo ' onerror="this.style.display=\'none\'; this.parentNode.innerHTML=\'<div class=\\\'bubble-file-attachment\\\'><i class=\\\'fas fa-image\\\'></i> Image failed to load</div>\';">';
            } elseif (isBubbleVideoFile($attachmentUrl)) {
                echo '<video src="' . htmlspecialchars($attachmentUrl) . '" controls preload="metadata"';
                echo ' onerror="this.style.display=\'none\'; this.parentNode.innerHTML=\'<div class=\\\'bubble-file-attachment\\\'><i class=\\\'fas fa-video\\\'></i> Video failed to load</div>\';"></video>';
            } else {
                echo '<div class="bubble-file-attachment">';
                echo '<div class="bubble-file-icon">' . getBubbleFileIcon($attachmentName) . '</div>';
                echo '<div class="bubble-file-info">';
                echo '<div class="bubble-file-name">' . htmlspecialchars($attachmentName) . '</div>';
                if ($attachmentSize) {
                    echo '<div class="bubble-file-size">' . formatBubbleFileSize($attachmentSize) . '</div>';
                }
                echo '</div>';
                echo '<button class="bubble-download-button" onclick="BubbleChatComponent.downloadFile(\'' . htmlspecialchars($attachmentUrl) . '\', \'' . htmlspecialchars($attachmentName) . '\')">';
                echo '<i class="fas fa-download"></i>';
                echo '</button>';
                echo '</div>';
            }
            
            echo '</div>';
        }
        echo '</div>';
    }
    
    // Message actions
    echo '<div class="bubble-message-actions">';
    echo '<button class="bubble-action-button" data-action="reply" data-message-id="' . htmlspecialchars($messageId) . '" title="Reply">';
    echo '<i class="fas fa-reply"></i>';
    echo '</button>';
    echo '<button class="bubble-action-button" data-action="react" data-message-id="' . htmlspecialchars($messageId) . '" title="Add Reaction">';
    echo '<i class="fas fa-smile"></i>';
    echo '</button>';
    
    if ($isOwnMessage) {
        echo '<button class="bubble-action-button" data-action="edit" data-message-id="' . htmlspecialchars($messageId) . '" title="Edit">';
        echo '<i class="fas fa-edit"></i>';
        echo '</button>';
        echo '<button class="bubble-action-button delete-button" data-action="delete" data-message-id="' . htmlspecialchars($messageId) . '" title="Delete">';
        echo '<i class="fas fa-trash"></i>';
        echo '</button>';
    }
    
    echo '<button class="bubble-action-button" data-action="more" data-message-id="' . htmlspecialchars($messageId) . '" title="More Actions">';
    echo '<i class="fas fa-ellipsis-v"></i>';
    echo '</button>';
    echo '</div>';
    
    // Reactions
    if (!empty($reactions)) {
        echo '<div class="bubble-reactions">';
        
        $groupedReactions = [];
        foreach ($reactions as $reaction) {
            $emoji = is_array($reaction) ? ($reaction['emoji'] ?? '') : ($reaction->emoji ?? '');
            if (!isset($groupedReactions[$emoji])) {
                $groupedReactions[$emoji] = [
                    'emoji' => $emoji,
                    'count' => 0,
                    'users' => [],
                    'hasCurrentUser' => false
                ];
            }
            $groupedReactions[$emoji]['count']++;
            $groupedReactions[$emoji]['users'][] = is_array($reaction) ? ($reaction['username'] ?? '') : ($reaction->username ?? '');
            if ((is_array($reaction) ? ($reaction['user_id'] ?? 0) : ($reaction->user_id ?? 0)) == $currentUserId) {
                $groupedReactions[$emoji]['hasCurrentUser'] = true;
            }
        }
        
        foreach ($groupedReactions as $group) {
            $userReactedClass = $group['hasCurrentUser'] ? 'user-reacted' : '';
            echo '<div class="bubble-reaction ' . $userReactedClass . '" title="' . htmlspecialchars(implode(', ', $group['users'])) . '"';
            echo ' data-emoji="' . htmlspecialchars($group['emoji']) . '" data-message-id="' . htmlspecialchars($messageId) . '">';
            echo '<span class="bubble-reaction-emoji">' . htmlspecialchars($group['emoji']) . '</span>';
            echo '<span class="bubble-reaction-count">' . $group['count'] . '</span>';
            echo '</div>';
        }
        
        echo '</div>';
    }
    
    echo '</div>'; // End message content
    }
}

if (!function_exists('renderMessageGroup')) {
    function renderMessageGroup($messages, $startIndex) {
    if (!isset($messages[$startIndex])) return $startIndex;
    
    $firstMessage = $messages[$startIndex];
    $userId = is_array($firstMessage) ? ($firstMessage['user_id'] ?? 0) : ($firstMessage->user_id ?? 0);
    $username = is_array($firstMessage) ? ($firstMessage['username'] ?? '') : ($firstMessage->username ?? '');
    $avatarUrl = is_array($firstMessage) ? ($firstMessage['avatar_url'] ?? '/public/assets/common/default-profile-picture.png') : ($firstMessage->avatar_url ?? '/public/assets/common/default-profile-picture.png');
    $sentAt = is_array($firstMessage) ? ($firstMessage['sent_at'] ?? '') : ($firstMessage->sent_at ?? '');
    $messageId = is_array($firstMessage) ? ($firstMessage['id'] ?? '') : ($firstMessage->id ?? '');
    $content = is_array($firstMessage) ? ($firstMessage['content'] ?? '') : ($firstMessage->content ?? '');
    $attachments = is_array($firstMessage) ? ($firstMessage['attachments'] ?? []) : ($firstMessage->attachments ?? []);
    
    // Prevent rendering empty/invalid message groups
    if (empty($messageId) || $messageId === '0' || (empty($content) && empty($attachments))) {
        error_log("❌ [CHAT-SECTION] Skipping invalid message group - ID: '$messageId', Content: '$content', Attachments: " . count($attachments));
        return $startIndex; // Skip this message group
    }
    
    echo '<div class="bubble-message-group" data-user-id="' . htmlspecialchars($userId) . '" data-timestamp="' . (strtotime($sentAt) * 1000) . '">';
    
    // Avatar
    echo '<div class="bubble-avatar">';
    echo '<img src="' . htmlspecialchars($avatarUrl) . '" alt="' . htmlspecialchars($username) . '" onerror="this.src=\'/public/assets/common/default-profile-picture.png\';">';
    echo '</div>';
    
    // Content wrapper
    echo '<div class="bubble-content-wrapper">';
    
    // Header
    echo '<div class="bubble-header">';
    echo '<span class="bubble-username">' . htmlspecialchars($username) . '</span>';
    echo '<span class="bubble-timestamp">' . formatBubbleTimestamp($sentAt) . '</span>';
    echo '</div>';
    
    // Contents container
    echo '<div class="bubble-contents">';
    
    $i = $startIndex;
    while ($i < count($messages)) {
        $currentMessage = $messages[$i];
        $currentMessageId = is_array($currentMessage) ? ($currentMessage['id'] ?? '') : ($currentMessage->id ?? '');
        $currentContent = is_array($currentMessage) ? ($currentMessage['content'] ?? '') : ($currentMessage->content ?? '');
        $currentAttachments = is_array($currentMessage) ? ($currentMessage['attachments'] ?? []) : ($currentMessage->attachments ?? []);
        
        // Skip invalid messages within the group
        if (empty($currentMessageId) || $currentMessageId === '0' || (empty($currentContent) && empty($currentAttachments))) {
            error_log("❌ [CHAT-SECTION] Skipping invalid message in group - ID: '$currentMessageId'");
            $i++;
            continue;
        }
        
        if (!shouldGroupWithPreviousMessage($currentMessage, $firstMessage)) {
            break;
        }
        
        renderBubbleMessageContent($currentMessage);
        $i++;
    }
    
    echo '</div>'; // End contents
    echo '</div>'; // End content wrapper
    echo '</div>'; // End message group
    
    return $i - 1;
    }
}

if (!function_exists('shouldGroupWithPreviousMessage')) {
    function shouldGroupWithPreviousMessage($currentMessage, $firstMessage) {
    $currentUserId = is_array($currentMessage) ? ($currentMessage['user_id'] ?? 0) : ($currentMessage->user_id ?? 0);
    $firstUserId = is_array($firstMessage) ? ($firstMessage['user_id'] ?? 0) : ($firstMessage->user_id ?? 0);
    
    if ($currentUserId !== $firstUserId) {
        return false;
    }
    
    $currentTime = is_array($currentMessage) ? ($currentMessage['sent_at'] ?? '') : ($currentMessage->sent_at ?? '');
    $firstTime = is_array($firstMessage) ? ($firstMessage['sent_at'] ?? '') : ($firstMessage->sent_at ?? '');
    
    $currentDate = DateTime::createFromFormat('Y-m-d H:i:s', $currentTime);
    $firstDate = DateTime::createFromFormat('Y-m-d H:i:s', $firstTime);
    
    if (!$currentDate || !$firstDate) return false;
    
    $diff = $currentDate->getTimestamp() - $firstDate->getTimestamp();
    return $diff <= 300;
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
    margin-top: 2px !important;
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
    align-items: baseline !important;
    margin-bottom: 4px !important;
}

#chat-messages .message-username {
    font-weight: 600 !important;
    color: #f2f3f5 !important;
    margin-right: 8px !important;
    font-size: 15px !important;
    cursor: pointer !important;
}

#chat-messages .message-username:hover {
    text-decoration: underline !important;
}

#chat-messages .message-timestamp {
    font-size: 12px !important;
    color: #a3a6aa !important;
}

#chat-messages .message-contents {
    margin-top: 0 !important;
}

#chat-messages .message-content {
    position: relative !important;
    overflow: visible !important;
}

#chat-messages .message-main-text {
    color: #dcddde !important;
    word-wrap: break-word !important;
}

#chat-messages .message-actions-js {
    position: absolute !important;
    right: -4px !important;
    top: -4px !important;
    z-index: 999 !important;
    opacity: 0 !important;
    transition: opacity 0.2s ease !important;
}

#chat-messages .message-group:hover .message-actions-js {
    opacity: 1 !important;
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
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }
    
    console.log('🔍 [DEBUG] Checking server-rendered message actions on page load');
    const serverMessages = document.querySelectorAll('.message-content[data-message-id]');
    const serverActions = document.querySelectorAll('.message-actions-js');
    console.log(`📊 [DEBUG] Found ${serverMessages.length} server messages and ${serverActions.length} action containers`);
      
    document.dispatchEvent(new CustomEvent('channelContentLoaded', {
        detail: {
            type: 'chat',
            channelId: document.querySelector('meta[name="channel-id"]')?.getAttribute('content')
        }
    }));
});

function downloadAttachment(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
</script>