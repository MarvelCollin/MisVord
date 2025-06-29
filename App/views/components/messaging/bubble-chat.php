<?php
function renderMessageBubble($messageData) {
    $messageId = is_array($messageData) ? ($messageData['id'] ?? '') : ($messageData->id ?? '');
    $userId = is_array($messageData) ? ($messageData['user_id'] ?? 0) : ($messageData->user_id ?? 0);
    $username = is_array($messageData) ? ($messageData['username'] ?? '') : ($messageData->username ?? '');
    $avatarUrl = is_array($messageData) ? ($messageData['avatar_url'] ?? '/public/assets/common/default-profile-picture.png') : ($messageData->avatar_url ?? '/public/assets/common/default-profile-picture.png');
    $content = is_array($messageData) ? ($messageData['content'] ?? '') : ($messageData->content ?? '');
    $sentAt = is_array($messageData) ? ($messageData['sent_at'] ?? '') : ($messageData->sent_at ?? '');
    $editedAt = is_array($messageData) ? ($messageData['edited_at'] ?? null) : ($messageData->edited_at ?? null);
    $messageType = is_array($messageData) ? ($messageData['message_type'] ?? 'text') : ($messageData->message_type ?? 'text');
    $attachments = is_array($messageData) ? ($messageData['attachments'] ?? []) : ($messageData->attachments ?? []);
    $replyMessageId = is_array($messageData) ? ($messageData['reply_message_id'] ?? null) : ($messageData->reply_message_id ?? null);
    $replyData = is_array($messageData) ? ($messageData['reply_data'] ?? null) : ($messageData->reply_data ?? null);
    $reactions = is_array($messageData) ? ($messageData['reactions'] ?? []) : ($messageData->reactions ?? []);
    
    $currentUserId = $_SESSION['user_id'] ?? 0;
    $isOwnMessage = ($userId == $currentUserId);
    $timestamp = formatTimestamp($sentAt);
    
    ob_start();
    ?>
    
    <div class="message-content relative group overflow-visible" data-message-id="<?php echo htmlspecialchars($messageId); ?>" data-user-id="<?php echo htmlspecialchars($userId); ?>" style="position: relative !important; overflow: visible !important;">
        
        <?php if ($replyMessageId && $replyData): ?>
        <div class="reply-container flex items-center text-xs text-[#b9bbbe] mb-1 pl-2 border-l-2 border-[#4f545c] hover:border-[#5865f2] transition-colors duration-200" data-reply-message-id="<?php echo htmlspecialchars($replyMessageId); ?>">
            <div class="mr-1">
                <i class="fas fa-reply"></i>
            </div>
            <?php if (is_array($replyData)): ?>
                <span class="font-medium text-[#00a8fc] mr-2"><?php echo htmlspecialchars($replyData['username'] ?? 'Unknown'); ?></span>
                <span class="truncate"><?php 
                    $replyContent = $replyData['content'] ?? '';
                    echo htmlspecialchars(mb_strlen($replyContent) > 50 ? mb_substr($replyContent, 0, 50) . '...' : $replyContent);
                ?></span>
            <?php else: ?>
                <span class="font-medium text-[#72767d] mr-2">Replying to an unavailable message</span>
            <?php endif; ?>
        </div>
        <?php endif; ?>
        
        <div class="message-main-text text-[#dcddde] break-words">
            <?php if (!empty($content)): ?>
                <?php echo formatMessageContent($content); ?>
                <?php if ($editedAt): ?>
                    <span class="edited-badge text-xs text-[#a3a6aa] ml-1">(edited)</span>
                <?php endif; ?>
            <?php endif; ?>
        </div>
        
        <?php if (!empty($attachments)): ?>
        <div class="attachments-container flex flex-wrap gap-2 mt-2">
            <?php foreach ($attachments as $attachment): ?>
                <?php
                $attachmentUrl = is_array($attachment) ? ($attachment['url'] ?? $attachment) : $attachment;
                $attachmentName = is_array($attachment) ? ($attachment['name'] ?? basename($attachmentUrl)) : basename($attachmentUrl);
                $attachmentType = is_array($attachment) ? ($attachment['type'] ?? 'file') : 'file';
                $attachmentSize = is_array($attachment) ? ($attachment['size'] ?? 0) : 0;
                ?>
                
                <div class="attachment bg-[#2f3136] rounded-md overflow-hidden border border-[#202225]" data-attachment-url="<?php echo htmlspecialchars($attachmentUrl); ?>">
                    <?php if ($messageType === 'image' || preg_match('/\.(jpeg|jpg|gif|png|webp)$/i', $attachmentUrl)): ?>
                        <div class="image-attachment cursor-pointer relative">
                            <img class="max-w-md max-h-96 rounded-lg cursor-pointer" 
                                 src="<?php echo htmlspecialchars($attachmentUrl); ?>" 
                                 alt="<?php echo htmlspecialchars($attachmentName); ?>" 
                                 loading="lazy" 
                                 onclick="window.open('<?php echo htmlspecialchars($attachmentUrl); ?>', '_blank')"
                                 onerror="this.onerror=null; this.src='/public/assets/common/default-profile-picture.png'; this.classList.add('w-16', 'h-16'); this.parentNode.classList.add('bg-[#2b2d31]', 'p-3', 'rounded-lg'); const err=document.createElement('div'); err.className='text-sm text-[#b5bac1] mt-2'; err.textContent='Image failed to load'; this.parentNode.appendChild(err);">
                        </div>
                    <?php elseif ($messageType === 'video' || preg_match('/\.(mp4|webm|mov|avi|wmv)$/i', $attachmentUrl)): ?>
                        <div class="video-attachment">
                            <video class="max-w-md max-h-96 rounded-lg" 
                                   src="<?php echo htmlspecialchars($attachmentUrl); ?>" 
                                   controls 
                                   preload="metadata"
                                   onerror="this.parentNode.innerHTML = '<div class=&quot;bg-[#2b2d31] p-3 rounded-lg flex items-center&quot;><i class=&quot;fas fa-file-video text-2xl mr-2&quot;></i><span>Video failed to load</span></div>';">
                            </video>
                        </div>
                    <?php else: ?>
                        <?php
                        $extension = strtolower(pathinfo($attachmentName, PATHINFO_EXTENSION));
                        $fileIcon = 'fas fa-file';
                        if (in_array($extension, ['doc', 'docx'])) $fileIcon = 'fas fa-file-word text-blue-500';
                        elseif (in_array($extension, ['xls', 'xlsx', 'csv'])) $fileIcon = 'fas fa-file-excel text-green-500';
                        elseif (in_array($extension, ['ppt', 'pptx'])) $fileIcon = 'fas fa-file-powerpoint text-orange-500';
                        elseif ($extension === 'pdf') $fileIcon = 'fas fa-file-pdf text-red-500';
                        elseif (in_array($extension, ['zip', 'rar', 'tar', 'gz'])) $fileIcon = 'fas fa-file-archive text-yellow-500';
                        elseif (in_array($extension, ['txt', 'log', 'md'])) $fileIcon = 'fas fa-file-alt text-gray-500';
                        elseif (in_array($extension, ['js', 'php', 'html', 'css', 'py', 'java', 'cpp', 'cs', 'rb'])) $fileIcon = 'fas fa-file-code text-purple-500';
                        elseif (in_array($extension, ['mp3', 'wav', 'ogg'])) $fileIcon = 'fas fa-file-audio text-green-400';
                        ?>
                        <div class="file-attachment p-3 flex items-center">
                            <div class="mr-3 text-xl">
                                <i class="<?php echo $fileIcon; ?>"></i>
                            </div>
                            <div class="flex-grow">
                                <div class="text-sm text-[#dcddde] truncate"><?php echo htmlspecialchars($attachmentName); ?></div>
                                <?php if ($attachmentSize > 0): ?>
                                    <div class="text-xs text-[#b9bbbe]"><?php echo formatFileSize($attachmentSize); ?></div>
                                <?php endif; ?>
                            </div>
                            <button class="ml-3 p-2 text-[#b9bbbe] hover:text-[#dcddde] hover:bg-[#32353b] rounded transition-colors duration-200" 
                                    title="Download" 
                                    onclick="downloadAttachment('<?php echo htmlspecialchars($attachmentUrl); ?>', '<?php echo htmlspecialchars($attachmentName); ?>')">
                                <i class="fas fa-download"></i>
                            </button>
                        </div>
                    <?php endif; ?>
                </div>
            <?php endforeach; ?>
        </div>
        <?php endif; ?>
        
        <div class="message-actions-js absolute -right-1 -top-1 opacity-0 flex items-center bg-[#36393f] shadow-lg rounded-md transition-opacity duration-200 z-50" style="display: flex !important; position: absolute !important; z-index: 999 !important; box-shadow: 0 4px 16px rgba(0,0,0,0.4) !important;">
            
            <button class="p-2 text-[#b9bbbe] hover:text-[#dcddde] hover:bg-[#32353b] rounded-l-md transition-colors duration-200" 
                    title="Reply" 
                    data-action="reply" 
                    data-message-id="<?php echo htmlspecialchars($messageId); ?>">
                <i class="fas fa-reply"></i>
            </button>
            
            <button class="message-action-reaction p-2 text-[#b9bbbe] hover:text-[#dcddde] hover:bg-[#32353b] transition-colors duration-200" 
                    title="Add Reaction" 
                    data-action="react" 
                    data-message-id="<?php echo htmlspecialchars($messageId); ?>">
                <i class="fas fa-smile"></i>
            </button>
            
            <?php if ($isOwnMessage): ?>
            <button class="p-2 text-[#b9bbbe] hover:text-[#dcddde] hover:bg-[#32353b] transition-colors duration-200" 
                    title="Edit" 
                    data-action="edit" 
                    data-message-id="<?php echo htmlspecialchars($messageId); ?>">
                <i class="fas fa-edit"></i>
            </button>
            
            <button class="p-2 text-[#b9bbbe] hover:text-[#ed4245] hover:bg-[#32353b] transition-colors duration-200" 
                    title="Delete" 
                    data-action="delete" 
                    data-message-id="<?php echo htmlspecialchars($messageId); ?>">
                <i class="fas fa-trash"></i>
            </button>
            <?php endif; ?>
            
            <button class="p-2 text-[#b9bbbe] hover:text-[#dcddde] hover:bg-[#32353b] rounded-r-md transition-colors duration-200" 
                    title="More Actions" 
                    data-action="more" 
                    data-message-id="<?php echo htmlspecialchars($messageId); ?>">
                <i class="fas fa-ellipsis-v"></i>
            </button>
            
        </div>
        
        <?php if (!empty($reactions)): ?>
        <div class="reactions-container flex flex-wrap gap-1 mt-1">
            <?php
            $groupedReactions = [];
            foreach ($reactions as $reaction) {
                $emoji = is_array($reaction) ? ($reaction['emoji'] ?? '') : ($reaction->emoji ?? '');
                $reactionUserId = is_array($reaction) ? ($reaction['user_id'] ?? 0) : ($reaction->user_id ?? 0);
                $reactionUsername = is_array($reaction) ? ($reaction['username'] ?? '') : ($reaction->username ?? '');
                
                if (!isset($groupedReactions[$emoji])) {
                    $groupedReactions[$emoji] = [
                        'emoji' => $emoji,
                        'count' => 0,
                        'users' => [],
                        'hasCurrentUser' => false
                    ];
                }
                
                $groupedReactions[$emoji]['count']++;
                $groupedReactions[$emoji]['users'][] = $reactionUsername;
                
                if ($reactionUserId == $currentUserId) {
                    $groupedReactions[$emoji]['hasCurrentUser'] = true;
                }
            }
            ?>
            
            <?php foreach ($groupedReactions as $reactionGroup): ?>
            <div class="reaction flex items-center bg-[#2f3136] hover:bg-[#36393f] rounded-full px-2 py-1 cursor-pointer transition-colors duration-200<?php echo $reactionGroup['hasCurrentUser'] ? ' border border-[#5865f2]' : ''; ?>" 
                 title="<?php echo htmlspecialchars(implode(', ', $reactionGroup['users'])); ?>"
                 data-emoji="<?php echo htmlspecialchars($reactionGroup['emoji']); ?>"
                 data-message-id="<?php echo htmlspecialchars($messageId); ?>">
                <span class="mr-1"><?php echo $reactionGroup['emoji']; ?></span>
                <span class="text-xs text-[#b9bbbe]"><?php echo $reactionGroup['count']; ?></span>
            </div>
            <?php endforeach; ?>
        </div>
        <?php endif; ?>
        
    </div>
    
    <?php
    return ob_get_clean();
}
?>
