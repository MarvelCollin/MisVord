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

<style>
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

.bubble-reply-container {
    display: flex;
    align-items: center;
    margin-bottom: 4px;
    padding: 2px 8px;
    border-left: 2px solid #4f545c;
    background-color: rgba(79, 84, 92, 0.16);
    border-radius: 3px;
    font-size: 13px;
}

.bubble-reply-username {
    font-weight: 500;
    color: #f2f3f5;
    margin-right: 4px;
}

.bubble-reply-content {
    color: #a3a6aa;
}

.bubble-message-text {
    color: #dcddde;
    word-wrap: break-word;
    font-size: 16px;
    line-height: 1.375;
    margin: 0;
}

.bubble-edited-badge {
    font-size: 10px;
    color: #a3a6aa;
    margin-left: 4px;
    font-style: italic;
}

.bubble-attachments {
    margin-top: 8px;
}

.bubble-attachment {
    margin-bottom: 8px;
    max-width: 400px;
}

.bubble-attachment img,
.bubble-attachment video {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    cursor: pointer;
}

.bubble-file-attachment {
    display: flex;
    align-items: center;
    background: #2f3136;
    border: 1px solid #40444b;
    border-radius: 6px;
    padding: 12px;
    max-width: 400px;
}

.bubble-file-icon {
    margin-right: 12px;
    font-size: 24px;
}

.bubble-file-info {
    flex: 1;
    overflow: hidden;
}

.bubble-file-name {
    color: #dcddde;
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.bubble-file-size {
    color: #a3a6aa;
    font-size: 12px;
    margin-top: 2px;
}

.bubble-download-button {
    background: #4f545c;
    border: none;
    border-radius: 4px;
    padding: 8px;
    color: #dcddde;
    cursor: pointer;
    transition: background-color 0.2s;
}

.bubble-download-button:hover {
    background: #5865f2;
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

.bubble-reaction-emoji {
    margin-right: 4px;
}

.bubble-reaction-count {
    color: #dcddde;
    font-size: 12px;
    font-weight: 500;
}

@media (max-width: 768px) {
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
                                                        <button class="bubble-download-button" onclick="downloadAttachment('<?= htmlspecialchars($attachmentUrl) ?>', '<?= htmlspecialchars($attachmentName) ?>')">
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

<script>
function downloadAttachment(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
</script>
