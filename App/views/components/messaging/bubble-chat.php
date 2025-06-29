<?php
// Validate message data before rendering
$messageId = $messageData['id'] ?? '';
$userId = $messageData['user_id'] ?? 0;
$username = $messageData['username'] ?? 'Unknown User';
$avatarUrl = $messageData['avatar_url'] ?? '/public/assets/common/default-profile-picture.png';
$content = $messageData['content'] ?? '';
$sentAt = $messageData['sent_at'] ?? '';
$editedAt = $messageData['edited_at'] ?? null;
$messageType = $messageData['message_type'] ?? 'text';
$attachments = $messageData['attachments'] ?? [];
$reactions = $messageData['reactions'] ?? [];
$replyMessageId = $messageData['reply_message_id'] ?? null;
$replyData = $messageData['reply_data'] ?? null;

// Prevent rendering empty/invalid messages
if (empty($messageId) || $messageId === '0' || (empty($content) && empty($attachments))) {
    error_log("❌ [BUBBLE-CHAT] Invalid message data - ID: '$messageId', Content: '$content', Attachments: " . count($attachments));
    return; // Don't render empty messages
}

$currentUserId = $currentUserId ?? 0;
$isOwnMessage = ($userId == $currentUserId);

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
?>

<div class="bubble-message-group" data-user-id="<?= htmlspecialchars($userId) ?>" data-timestamp="<?= strtotime($sentAt) * 1000 ?>">
    <!-- Avatar -->
    <div class="bubble-avatar">
        <img src="<?= htmlspecialchars($avatarUrl) ?>" 
             alt="<?= htmlspecialchars($username) ?>" 
             onerror="this.src='/public/assets/common/default-profile-picture.png';">
    </div>
    
    <!-- Content Wrapper -->
    <div class="bubble-content-wrapper">
        <!-- Header -->
        <div class="bubble-header">
            <span class="bubble-username"><?= htmlspecialchars($username) ?></span>
            <span class="bubble-timestamp"><?= formatBubbleTimestamp($sentAt) ?></span>
        </div>
        
        <!-- Contents -->
        <div class="bubble-contents">
            <div class="bubble-message-content" data-message-id="<?= htmlspecialchars($messageId) ?>" data-user-id="<?= htmlspecialchars($userId) ?>">
                
                <?php if ($replyData): ?>
                <!-- Reply -->
                <div class="bubble-reply-container" data-reply-message-id="<?= htmlspecialchars($replyMessageId) ?>">
                    <div style="margin-right: 4px;"><i class="fas fa-reply"></i></div>
                    <span class="bubble-reply-username"><?= htmlspecialchars($replyData['username'] ?? 'Unknown') ?></span>
                    <span class="bubble-reply-content">
                        <?php 
                        $replyContent = $replyData['content'] ?? '';
                        echo htmlspecialchars(strlen($replyContent) > 50 ? substr($replyContent, 0, 50) . '...' : $replyContent);
                        ?>
                    </span>
                </div>
                <?php endif; ?>
                
                <?php if ($content): ?>
                <!-- Message Text -->
                <div class="bubble-message-text">
                    <?= formatBubbleContent($content) ?>
                    <?php if ($editedAt): ?>
                        <span class="bubble-edited-badge">(edited)</span>
                    <?php endif; ?>
                </div>
                <?php endif; ?>
                
                <?php if (!empty($attachments)): ?>
                <!-- Attachments -->
                <div class="bubble-attachments">
                    <?php foreach ($attachments as $attachment): 
                        $attachmentUrl = $attachment['url'] ?? $attachment;
                        $attachmentName = $attachment['name'] ?? basename($attachmentUrl);
                        $attachmentSize = $attachment['size'] ?? null;
                    ?>
                        <div class="bubble-attachment">
                            <?php if (isBubbleImageFile($attachmentUrl)): ?>
                                <img src="<?= htmlspecialchars($attachmentUrl) ?>" 
                                     alt="<?= htmlspecialchars($attachmentName) ?>" 
                                     loading="lazy"
                                     onclick="window.open('<?= htmlspecialchars($attachmentUrl) ?>', '_blank')"
                                     onerror="this.style.display='none'; this.parentNode.innerHTML='<div class=\'bubble-file-attachment\'><i class=\'fas fa-image\'></i> Image failed to load</div>';">
                            <?php elseif (isBubbleVideoFile($attachmentUrl)): ?>
                                <video src="<?= htmlspecialchars($attachmentUrl) ?>" controls preload="metadata"
                                       onerror="this.style.display='none'; this.parentNode.innerHTML='<div class=\'bubble-file-attachment\'><i class=\'fas fa-video\'></i> Video failed to load</div>';"></video>
                            <?php else: ?>
                                <div class="bubble-file-attachment">
                                    <div class="bubble-file-icon"><?= getBubbleFileIcon($attachmentName) ?></div>
                                    <div class="bubble-file-info">
                                        <div class="bubble-file-name"><?= htmlspecialchars($attachmentName) ?></div>
                                        <?php if ($attachmentSize): ?>
                                            <div class="bubble-file-size"><?= formatBubbleFileSize($attachmentSize) ?></div>
                                        <?php endif; ?>
                                    </div>
                                    <button class="bubble-download-button" onclick="BubbleChatComponent.downloadFile('<?= htmlspecialchars($attachmentUrl) ?>', '<?= htmlspecialchars($attachmentName) ?>')">
                                        <i class="fas fa-download"></i>
                                    </button>
                                </div>
                            <?php endif; ?>
                        </div>
                    <?php endforeach; ?>
                </div>
                <?php endif; ?>
                
                <!-- Message Actions -->
                <div class="bubble-message-actions">
                    <button class="bubble-action-button" data-action="reply" data-message-id="<?= htmlspecialchars($messageId) ?>" title="Reply">
                        <i class="fas fa-reply"></i>
                    </button>
                    <button class="bubble-action-button" data-action="react" data-message-id="<?= htmlspecialchars($messageId) ?>" title="Add Reaction">
                        <i class="fas fa-smile"></i>
                    </button>
                    <?php if ($isOwnMessage): ?>
                        <button class="bubble-action-button" data-action="edit" data-message-id="<?= htmlspecialchars($messageId) ?>" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="bubble-action-button delete-button" data-action="delete" data-message-id="<?= htmlspecialchars($messageId) ?>" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    <?php endif; ?>
                    <button class="bubble-action-button" data-action="more" data-message-id="<?= htmlspecialchars($messageId) ?>" title="More Actions">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                </div>
                
                <?php if (!empty($reactions)): ?>
                <!-- Reactions -->
                <div class="bubble-reactions">
                    <?php
                    $groupedReactions = [];
                    foreach ($reactions as $reaction) {
                        $emoji = $reaction['emoji'];
                        if (!isset($groupedReactions[$emoji])) {
                            $groupedReactions[$emoji] = [
                                'emoji' => $emoji,
                                'count' => 0,
                                'users' => [],
                                'hasCurrentUser' => false
                            ];
                        }
                        $groupedReactions[$emoji]['count']++;
                        $groupedReactions[$emoji]['users'][] = $reaction['username'];
                        if ($reaction['user_id'] == $currentUserId) {
                            $groupedReactions[$emoji]['hasCurrentUser'] = true;
                        }
                    }
                    
                    foreach ($groupedReactions as $group): ?>
                        <div class="bubble-reaction <?= $group['hasCurrentUser'] ? 'user-reacted' : '' ?>" 
                             title="<?= htmlspecialchars(implode(', ', $group['users'])) ?>"
                             data-emoji="<?= htmlspecialchars($group['emoji']) ?>"
                             data-message-id="<?= htmlspecialchars($messageId) ?>">
                            <span class="bubble-reaction-emoji"><?= htmlspecialchars($group['emoji']) ?></span>
                            <span class="bubble-reaction-count"><?= $group['count'] ?></span>
                        </div>
                    <?php endforeach; ?>
                </div>
                <?php endif; ?>
                
            </div>
        </div>
    </div>
</div>
