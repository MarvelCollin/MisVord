class MessageHandler {
    constructor(chatSection) {
        this.chatSection = chatSection;
        this.processedMessageIds = new Set();
        this.lastMessageGroup = null;
        this.messageGroupTimeThreshold = 5 * 60 * 1000; // 5 minutes in milliseconds
        this.temporaryMessages = new Map(); // Track temporary messages
    }

    addMessage(messageData) {
        if (!messageData || !messageData.id) {
            console.error('❌ [MESSAGE-HANDLER] Invalid message data:', messageData);
            return;
        }
        
        const isTemporary = messageData.is_temporary || messageData.id.toString().startsWith('temp-');
        
        if (this.processedMessageIds.has(messageData.id) && !isTemporary) {
            console.log(`🔄 [MESSAGE-HANDLER] Message ${messageData.id} already processed, skipping`);
            return;
        }
        
        console.log(`📥 [MESSAGE-HANDLER] Adding message ${messageData.id} to UI (temporary: ${isTemporary})`);
        
        const messagesContainer = this.chatSection.getMessagesContainer();
        if (!messagesContainer) {
            console.error('❌ [MESSAGE-HANDLER] Messages container not found');
            return;
        }
        
        // Hide empty state if it's showing
        this.chatSection.hideEmptyState();
        
        // Format the message data
        const formattedMessage = this.formatMessage(messageData);
        
        // Check if we should append to existing message group or create a new one
        const shouldGroupWithPrevious = this.shouldGroupWithPreviousMessage(messageData);
        
        let messageContent;
        let messageGroup;
        
        if (shouldGroupWithPrevious && this.lastMessageGroup) {
            // Append to existing message group
            messageContent = this.createMessageContent(formattedMessage);
            this.lastMessageGroup.querySelector('.message-contents').appendChild(messageContent);
            messageGroup = this.lastMessageGroup;
        } else {
            // Create new message group
            messageGroup = this.createMessageGroup(formattedMessage);
            messagesContainer.appendChild(messageGroup);
            this.lastMessageGroup = messageGroup;
            messageContent = messageGroup.querySelector('.message-content');
        }
        
        // Add temporary message styling if needed
        if (isTemporary) {
            messageContent.classList.add('temporary-message');
            messageContent.style.opacity = '0.7';
            this.temporaryMessages.set(messageData.id, messageContent);
        }
        
        // Add to processed messages
        this.processedMessageIds.add(messageData.id);
        
        // Scroll to bottom if needed
        this.chatSection.scrollToBottomIfNeeded();
        
        // Add event listeners to the new message
        this.addMessageEventListeners(messageData.id);
        
        console.log(`✅ [MESSAGE-HANDLER] Message ${messageData.id} added to UI`);
    }
    
    formatMessage(messageData) {
        // Calculate timestamp
        const timestamp = messageData.timestamp ? new Date(parseInt(messageData.timestamp)) : new Date();
        const formattedTime = this.formatTime(timestamp);
        
        // Handle attachments
        const attachments = Array.isArray(messageData.attachments) ? messageData.attachments : [];
        
        // Handle reply data
        const hasReply = messageData.reply_message_id && messageData.reply_data;
        
        return {
            id: messageData.id,
            content: messageData.content || '',
            userId: messageData.user_id,
            username: messageData.username || 'Unknown User',
            avatarUrl: messageData.avatar_url || '/public/assets/common/default-profile-picture.png',
            timestamp: timestamp,
            formattedTime: formattedTime,
            formattedDate: this.formatDate(timestamp),
            attachments: attachments,
            messageType: messageData.message_type || 'text',
            hasReply: hasReply,
            replyData: messageData.reply_data,
            replyMessageId: messageData.reply_message_id,
            reactions: messageData.reactions || []
        };
    }
    
    shouldGroupWithPreviousMessage(messageData) {
        if (!this.lastMessageGroup) {
            return false;
        }
        
        const lastMessageUserId = this.lastMessageGroup.dataset.userId;
        const lastMessageTimestamp = parseInt(this.lastMessageGroup.dataset.timestamp);
        const currentMessageTimestamp = messageData.timestamp ? parseInt(messageData.timestamp) : Date.now();
        
        // Group messages if:
        // 1. Same user
        // 2. Within time threshold
        // 3. Not a reply message (replies always start a new group)
        return (
            lastMessageUserId === messageData.user_id.toString() &&
            (currentMessageTimestamp - lastMessageTimestamp) < this.messageGroupTimeThreshold &&
            !messageData.reply_message_id
        );
    }
    
    createMessageGroup(messageData) {
        const messageGroup = document.createElement('div');
        messageGroup.className = 'message-group flex p-2 hover:bg-[#32353b] rounded transition-colors duration-200';
        messageGroup.dataset.userId = messageData.userId;
        messageGroup.dataset.timestamp = messageData.timestamp.getTime();
        
        // Avatar
        const avatarContainer = document.createElement('div');
        avatarContainer.className = 'flex-shrink-0 mr-3';
        
        const avatar = document.createElement('div');
        avatar.className = 'w-10 h-10 rounded-full bg-cover bg-center';
        avatar.style.backgroundImage = `url('${messageData.avatarUrl}')`;
        
        avatarContainer.appendChild(avatar);
        
        // Message content container
        const messageContentContainer = document.createElement('div');
        messageContentContainer.className = 'flex-grow overflow-hidden';
        
        // Message header
        const messageHeader = document.createElement('div');
        messageHeader.className = 'flex items-baseline';
        
        const username = document.createElement('span');
        username.className = 'font-medium text-[#f2f3f5] mr-2';
        username.textContent = messageData.username;
        
        const timestamp = document.createElement('span');
        timestamp.className = 'text-xs text-[#a3a6aa]';
        timestamp.textContent = messageData.formattedTime;
        timestamp.title = messageData.formattedDate;
        
        messageHeader.appendChild(username);
        messageHeader.appendChild(timestamp);
        
        // Message contents container
        const messageContents = document.createElement('div');
        messageContents.className = 'message-contents space-y-1';
        
        // Create and add the first message
        const messageContent = this.createMessageContent(messageData);
        messageContents.appendChild(messageContent);
        
        // Assemble the message group
        messageContentContainer.appendChild(messageHeader);
        messageContentContainer.appendChild(messageContents);
        
        messageGroup.appendChild(avatarContainer);
        messageGroup.appendChild(messageContentContainer);
        
        return messageGroup;
    }
    
    createMessageContent(messageData) {
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content relative group';
        messageContent.dataset.messageId = messageData.id;
        
        // Handle reply if present
        if (messageData.hasReply) {
            const replyContainer = this.createReplyElement(messageData.replyData);
            messageContent.appendChild(replyContainer);
        }
        
        // Main message text
        const messageText = document.createElement('div');
        messageText.className = 'message-main-text text-[#dcddde] break-words';
        messageText.innerHTML = this.chatSection.formatMessageContent(messageData.content);
        
        messageContent.appendChild(messageText);
        
        // Attachments
        if (messageData.attachments && messageData.attachments.length > 0) {
            const attachmentsContainer = this.createAttachmentsContainer(messageData.attachments);
            messageContent.appendChild(attachmentsContainer);
        }
        
        // Message actions (visible on hover)
        const messageActions = document.createElement('div');
        messageActions.className = 'message-actions absolute right-0 top-0 opacity-0 group-hover:opacity-100 flex items-center bg-[#36393f] shadow-lg rounded-md transition-opacity duration-200';
        
        // Reply button
        const replyButton = document.createElement('button');
        replyButton.className = 'p-2 text-[#b9bbbe] hover:text-[#dcddde] hover:bg-[#32353b] rounded-l-md transition-colors duration-200';
        replyButton.innerHTML = '<i class="fas fa-reply"></i>';
        replyButton.title = 'Reply';
        replyButton.dataset.action = 'reply';
        replyButton.dataset.messageId = messageData.id;
        
        // Edit button (only for own messages)
        const editButton = document.createElement('button');
        editButton.className = 'p-2 text-[#b9bbbe] hover:text-[#dcddde] hover:bg-[#32353b] transition-colors duration-200';
        editButton.innerHTML = '<i class="fas fa-edit"></i>';
        editButton.title = 'Edit';
        editButton.dataset.action = 'edit';
        editButton.dataset.messageId = messageData.id;
        
        if (messageData.userId != this.chatSection.userId) {
            editButton.classList.add('hidden');
        }
        
        // Delete button (only for own messages)
        const deleteButton = document.createElement('button');
        deleteButton.className = 'p-2 text-[#b9bbbe] hover:text-[#ed4245] hover:bg-[#32353b] rounded-r-md transition-colors duration-200';
        deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
        deleteButton.title = 'Delete';
        deleteButton.dataset.action = 'delete';
        deleteButton.dataset.messageId = messageData.id;
        
        if (messageData.userId != this.chatSection.userId) {
            deleteButton.classList.add('hidden');
        }
        
        // Reaction button
        const reactionButton = document.createElement('button');
        reactionButton.className = 'p-2 text-[#b9bbbe] hover:text-[#dcddde] hover:bg-[#32353b] transition-colors duration-200';
        reactionButton.innerHTML = '<i class="fas fa-smile"></i>';
        reactionButton.title = 'Add Reaction';
        reactionButton.dataset.action = 'react';
        reactionButton.dataset.messageId = messageData.id;
        
        // More actions button
        const moreButton = document.createElement('button');
        moreButton.className = 'p-2 text-[#b9bbbe] hover:text-[#dcddde] hover:bg-[#32353b] transition-colors duration-200';
        moreButton.innerHTML = '<i class="fas fa-ellipsis-v"></i>';
        moreButton.title = 'More Actions';
        moreButton.dataset.action = 'more';
        moreButton.dataset.messageId = messageData.id;
        
        // Add buttons to actions container
        messageActions.appendChild(replyButton);
        messageActions.appendChild(reactionButton);
        messageActions.appendChild(editButton);
        messageActions.appendChild(deleteButton);
        messageActions.appendChild(moreButton);
        
        messageContent.appendChild(messageActions);
        
        // Reactions container (if any)
        if (messageData.reactions && messageData.reactions.length > 0) {
            const reactionsContainer = this.createReactionsContainer(messageData.reactions);
            messageContent.appendChild(reactionsContainer);
        }
        
        return messageContent;
    }
    
    createReplyElement(replyData) {
        const replyContainer = document.createElement('div');
        replyContainer.className = 'reply-container flex items-center text-xs text-[#b9bbbe] mb-1 pl-2 border-l-2 border-[#4f545c] hover:border-[#5865f2] transition-colors duration-200';
        replyContainer.dataset.replyMessageId = replyData.id;
        
        const replyIcon = document.createElement('div');
        replyIcon.className = 'mr-1';
        replyIcon.innerHTML = '<i class="fas fa-reply"></i>';
        
        const replyUsername = document.createElement('span');
        replyUsername.className = 'font-medium text-[#00a8fc] mr-2';
        replyUsername.textContent = replyData.username;
        
        const replyContent = document.createElement('span');
        replyContent.className = 'truncate';
        replyContent.textContent = replyData.content.length > 50 ? replyData.content.substring(0, 50) + '...' : replyData.content;
        
        replyContainer.appendChild(replyIcon);
        replyContainer.appendChild(replyUsername);
        replyContainer.appendChild(replyContent);
        
        // Add click handler to jump to replied message
        replyContainer.addEventListener('click', () => {
            this.chatSection.scrollToMessage(replyData.id);
        });
        
        return replyContainer;
    }
    
    createAttachmentsContainer(attachments) {
        const attachmentsContainer = document.createElement('div');
        attachmentsContainer.className = 'attachments-container flex flex-wrap gap-2 mt-2';
        
        attachments.forEach(attachment => {
            const attachmentElement = this.createAttachmentElement(attachment);
            attachmentsContainer.appendChild(attachmentElement);
        });
        
        return attachmentsContainer;
    }
    
    createAttachmentElement(attachment) {
        const attachmentElement = document.createElement('div');
        attachmentElement.className = 'attachment bg-[#2f3136] rounded-md overflow-hidden border border-[#202225]';
        attachmentElement.dataset.attachmentId = attachment.id;
        
        // Handle different attachment types
        if (attachment.type.startsWith('image/')) {
            // Image attachment
            attachmentElement.className += ' image-attachment';
            
            const imageContainer = document.createElement('div');
            imageContainer.className = 'relative';
            
            const image = document.createElement('img');
            image.className = 'max-w-full max-h-[300px] rounded-md cursor-pointer';
            image.src = attachment.url;
            image.alt = attachment.name;
            image.loading = 'lazy';
            
            // Add click handler to open full image
            image.addEventListener('click', () => {
                this.chatSection.openImageViewer(attachment);
            });
            
            imageContainer.appendChild(image);
            attachmentElement.appendChild(imageContainer);
            
            // Add file info
            const fileInfo = document.createElement('div');
            fileInfo.className = 'p-2 text-xs text-[#b9bbbe]';
            fileInfo.textContent = attachment.name;
            
            attachmentElement.appendChild(fileInfo);
        } else if (attachment.type.startsWith('video/')) {
            // Video attachment
            attachmentElement.className += ' video-attachment';
            
            const video = document.createElement('video');
            video.className = 'max-w-full max-h-[300px] rounded-md';
            video.src = attachment.url;
            video.controls = true;
            
            attachmentElement.appendChild(video);
            
            // Add file info
            const fileInfo = document.createElement('div');
            fileInfo.className = 'p-2 text-xs text-[#b9bbbe]';
            fileInfo.textContent = attachment.name;
            
            attachmentElement.appendChild(fileInfo);
        } else {
            // Generic file attachment
            attachmentElement.className += ' file-attachment p-3 flex items-center';
            
            // File icon based on type
            const fileIcon = document.createElement('div');
            fileIcon.className = 'mr-3 text-xl';
            
            if (attachment.type.includes('pdf')) {
                fileIcon.innerHTML = '<i class="fas fa-file-pdf text-red-500"></i>';
            } else if (attachment.type.includes('word') || attachment.type.includes('document')) {
                fileIcon.innerHTML = '<i class="fas fa-file-word text-blue-500"></i>';
            } else if (attachment.type.includes('excel') || attachment.type.includes('spreadsheet')) {
                fileIcon.innerHTML = '<i class="fas fa-file-excel text-green-500"></i>';
            } else if (attachment.type.includes('zip') || attachment.type.includes('compressed')) {
                fileIcon.innerHTML = '<i class="fas fa-file-archive text-yellow-500"></i>';
            } else {
                fileIcon.innerHTML = '<i class="fas fa-file text-gray-500"></i>';
            }
            
            // File info
            const fileInfo = document.createElement('div');
            fileInfo.className = 'flex-grow';
            
            const fileName = document.createElement('div');
            fileName.className = 'text-sm text-[#dcddde] truncate';
            fileName.textContent = attachment.name;
            
            const fileSize = document.createElement('div');
            fileSize.className = 'text-xs text-[#b9bbbe]';
            fileSize.textContent = this.formatFileSize(attachment.size);
            
            fileInfo.appendChild(fileName);
            fileInfo.appendChild(fileSize);
            
            // Download button
            const downloadButton = document.createElement('button');
            downloadButton.className = 'ml-3 p-2 text-[#b9bbbe] hover:text-[#dcddde] hover:bg-[#32353b] rounded transition-colors duration-200';
            downloadButton.innerHTML = '<i class="fas fa-download"></i>';
            downloadButton.title = 'Download';
            
            downloadButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const link = document.createElement('a');
                link.href = attachment.url;
                link.download = attachment.name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
            
            attachmentElement.appendChild(fileIcon);
            attachmentElement.appendChild(fileInfo);
            attachmentElement.appendChild(downloadButton);
        }
        
        return attachmentElement;
    }
    
    createReactionsContainer(reactions) {
        const reactionsContainer = document.createElement('div');
        reactionsContainer.className = 'reactions-container flex flex-wrap gap-1 mt-1';
        
        // Group reactions by emoji
        const groupedReactions = {};
        
        reactions.forEach(reaction => {
            if (!groupedReactions[reaction.emoji]) {
                groupedReactions[reaction.emoji] = {
                    emoji: reaction.emoji,
                    count: 0,
                    users: [],
                    hasCurrentUser: false
                };
            }
            
            groupedReactions[reaction.emoji].count++;
            groupedReactions[reaction.emoji].users.push(reaction.username);
            
            if (reaction.user_id == this.chatSection.userId) {
                groupedReactions[reaction.emoji].hasCurrentUser = true;
            }
        });
        
        // Create reaction elements
        Object.values(groupedReactions).forEach(reactionGroup => {
            const reactionElement = document.createElement('div');
            reactionElement.className = 'reaction flex items-center bg-[#2f3136] hover:bg-[#36393f] rounded-full px-2 py-1 cursor-pointer transition-colors duration-200';
            
            if (reactionGroup.hasCurrentUser) {
                reactionElement.classList.add('border', 'border-[#5865f2]');
            }
            
            const emoji = document.createElement('span');
            emoji.className = 'mr-1';
            emoji.textContent = reactionGroup.emoji;
            
            const count = document.createElement('span');
            count.className = 'text-xs text-[#b9bbbe]';
            count.textContent = reactionGroup.count;
            
            reactionElement.appendChild(emoji);
            reactionElement.appendChild(count);
            
            // Add tooltip with users who reacted
            reactionElement.title = reactionGroup.users.join(', ');
            
            // Add click handler to toggle reaction
            reactionElement.addEventListener('click', () => {
                if (reactionGroup.hasCurrentUser) {
                    this.chatSection.removeReaction(reactionElement.closest('[data-message-id]').dataset.messageId, reactionGroup.emoji);
                } else {
                    this.chatSection.addReaction(reactionElement.closest('[data-message-id]').dataset.messageId, reactionGroup.emoji);
                }
            });
            
            reactionsContainer.appendChild(reactionElement);
        });
        
        return reactionsContainer;
    }
    
    addMessageEventListeners(messageId) {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (!messageElement) return;
        
        // Add event listeners to action buttons
        const actionButtons = messageElement.querySelectorAll('[data-action]');
        
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const action = button.dataset.action;
                const messageId = button.dataset.messageId;
                
                switch (action) {
                    case 'reply':
                        this.chatSection.startReply(messageId);
                        break;
                    case 'edit':
                        this.chatSection.startEditing(messageId);
                        break;
                    case 'delete':
                        this.chatSection.confirmDeleteMessage(messageId);
                        break;
                    case 'react':
                        this.chatSection.openEmojiPicker(button, messageId, 'reaction');
                        break;
                    case 'more':
                        this.chatSection.uiHandler.showContextMenu(
                            e.clientX,
                            e.clientY,
                            messageElement
                        );
                        break;
                }
            });
        });
        
        // Add context menu on right click
        messageElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.chatSection.uiHandler.showContextMenu(
                e.clientX,
                e.clientY,
                messageElement
            );
        });
    }
    
    formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    formatDate(date) {
        return date.toLocaleDateString([], { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    formatFileSize(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        
        return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
    }

    handleMessageConfirmed(data) {
        console.log('✅ [MESSAGE-HANDLER] Message confirmed:', data);
        
        const { temp_message_id, permanent_message_id } = data;
        
        if (!temp_message_id || !permanent_message_id) {
            console.error('❌ [MESSAGE-HANDLER] Missing message IDs in confirmation:', data);
            return;
        }
        
        // Find the temporary message element
        const tempMessageContent = document.querySelector(`[data-message-id="${temp_message_id}"]`);
        if (!tempMessageContent) {
            console.warn(`⚠️ [MESSAGE-HANDLER] Temporary message ${temp_message_id} not found`);
            return;
        }
        
        // Update the message ID
        tempMessageContent.dataset.messageId = permanent_message_id;
        
        // Remove temporary styling
        tempMessageContent.classList.remove('temporary-message');
        tempMessageContent.style.opacity = '1';
        
        // Update processed IDs
        this.processedMessageIds.delete(temp_message_id);
        this.processedMessageIds.add(permanent_message_id);
        
        // Remove from temporary messages map
        this.temporaryMessages.delete(temp_message_id);
        
        console.log(`✅ [MESSAGE-HANDLER] Message ${temp_message_id} confirmed as ${permanent_message_id}`);
    }

    handleMessageFailed(data) {
        console.error('❌ [MESSAGE-HANDLER] Message failed:', data);
        
        const { temp_message_id, error } = data;
        
        if (!temp_message_id) {
            console.error('❌ [MESSAGE-HANDLER] Missing temp_message_id in failure:', data);
            return;
        }
        
        // Find the temporary message element
        const tempMessageContent = document.querySelector(`[data-message-id="${temp_message_id}"]`);
        if (!tempMessageContent) {
            console.warn(`⚠️ [MESSAGE-HANDLER] Failed message ${temp_message_id} not found`);
            return;
        }
        
        // Add error styling
        tempMessageContent.classList.add('message-failed');
        tempMessageContent.style.opacity = '0.5';
        
        // Add error message
        const errorText = document.createElement('div');
        errorText.className = 'text-red-500 text-xs mt-1';
        errorText.textContent = error || 'Failed to send message';
        tempMessageContent.appendChild(errorText);
        
        // Remove from temporary messages map
        this.temporaryMessages.delete(temp_message_id);
        
        console.log(`❌ [MESSAGE-HANDLER] Message ${temp_message_id} marked as failed`);
    }
}

export default MessageHandler;
 