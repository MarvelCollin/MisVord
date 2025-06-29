class MessageHandler {
    constructor(chatSection) {
        this.chatSection = chatSection;
        this.processedMessageIds = new Set();
        this.lastMessageGroup = null;
        this.messageGroupTimeThreshold = 5 * 60 * 1000; // 5 minutes in milliseconds
        this.temporaryMessages = new Map(); // Track temporary messages
        
        // Add CSS to ensure message actions don't get clipped
        this.addMessageActionsCSS();
    }
    
    addMessageActionsCSS() {
        // Only add CSS once
        if (document.getElementById('message-actions-css')) return;
        
        const style = document.createElement('style');
        style.id = 'message-actions-css';
        style.textContent = `
            .message-actions-js {
                display: flex !important;
                position: absolute !important;
                z-index: 999 !important;
                pointer-events: auto !important;
                right: -4px !important;
                top: -4px !important;
            }
            
            #chat-messages {
                overflow-y: auto !important;
                overflow-x: visible !important;
            }
            
            .message-group, 
            .message-content, 
            .message-content-wrapper, 
            .message-contents {
                overflow: visible !important;
                position: relative !important;
            }
            
            .message-actions-js button {
                pointer-events: auto !important;
                cursor: pointer !important;
                z-index: 999 !important;
                border: none !important;
                background: inherit !important;
                color: inherit !important;
            }
            
            .message-actions-js button:hover {
                background-color: rgba(79, 84, 92, 0.6) !important;
            }
        `;
        document.head.appendChild(style);
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
        messageGroup.className = 'message-group flex p-2 hover:bg-[#32353b] rounded transition-colors duration-200 relative';
        messageGroup.dataset.userId = messageData.userId;
        messageGroup.dataset.timestamp = messageData.timestamp.getTime();
        messageGroup.style.cssText = 'position: relative !important; overflow: visible !important;';
        
        // Avatar
        const avatarContainer = document.createElement('div');
        avatarContainer.className = 'flex-shrink-0 mr-3';
        
        const avatar = document.createElement('div');
        avatar.className = 'w-10 h-10 rounded-full bg-cover bg-center';
        avatar.style.backgroundImage = `url('${messageData.avatarUrl}')`;
        
        avatarContainer.appendChild(avatar);
        
        // Message content container
        const messageContentContainer = document.createElement('div');
        messageContentContainer.className = 'flex-grow overflow-visible relative';
        messageContentContainer.style.cssText = 'position: relative !important; overflow: visible !important;';
        
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
        messageContent.className = 'message-content relative group overflow-visible';
        messageContent.dataset.messageId = messageData.id;
        messageContent.dataset.userId = messageData.userId;
        messageContent.style.cssText = 'position: relative !important; overflow: visible !important;';
        
        // Handle reply if present
        if (messageData.hasReply && messageData.replyData) {
            const replyContainer = this.createReplyElement(messageData.replyData);
            messageContent.appendChild(replyContainer);
        }
        
        // Main message text
        const messageText = document.createElement('div');
        messageText.className = 'message-main-text text-[#dcddde] break-words';
        
        if (messageData.content) {
            messageText.innerHTML = this.chatSection.formatMessageContent(messageData.content);
            
            // Add edited badge if message was edited
            if (messageData.editedAt) {
                const editedBadge = document.createElement('span');
                editedBadge.className = 'edited-badge text-xs text-[#a3a6aa] ml-1';
                editedBadge.textContent = '(edited)';
                messageText.appendChild(editedBadge);
            }
        }
        
        messageContent.appendChild(messageText);
        
        // Attachments
        if (messageData.attachments && messageData.attachments.length > 0) {
            const attachmentsContainer = this.createAttachmentsContainer(messageData.attachments);
            messageContent.appendChild(attachmentsContainer);
        }
        
        // Message actions (identical to PHP structure)
        const messageActions = document.createElement('div');
        messageActions.className = 'message-actions-js absolute -right-1 -top-1 opacity-0 flex items-center bg-[#36393f] shadow-lg rounded-md transition-opacity duration-200 z-50';
        messageActions.style.cssText = 'display: flex !important; position: absolute !important; z-index: 999 !important; box-shadow: 0 4px 16px rgba(0,0,0,0.4) !important;';
        
        // Reply button
        const replyButton = document.createElement('button');
        replyButton.className = 'p-2 text-[#b9bbbe] hover:text-[#dcddde] hover:bg-[#32353b] rounded-l-md transition-colors duration-200';
        replyButton.innerHTML = '<i class="fas fa-reply"></i>';
        replyButton.title = 'Reply';
        replyButton.dataset.action = 'reply';
        replyButton.dataset.messageId = messageData.id;
        
        // Reaction button
        const reactionButton = document.createElement('button');
        reactionButton.className = 'message-action-reaction p-2 text-[#b9bbbe] hover:text-[#dcddde] hover:bg-[#32353b] transition-colors duration-200';
        reactionButton.innerHTML = '<i class="fas fa-smile"></i>';
        reactionButton.title = 'Add Reaction';
        reactionButton.dataset.action = 'react';
        reactionButton.dataset.messageId = messageData.id;
        
        // Add buttons to actions container
        messageActions.appendChild(replyButton);
        messageActions.appendChild(reactionButton);
        
        // Edit button (only for own messages)
        if (messageData.userId == this.chatSection.userId) {
            const editButton = document.createElement('button');
            editButton.className = 'p-2 text-[#b9bbbe] hover:text-[#dcddde] hover:bg-[#32353b] transition-colors duration-200';
            editButton.innerHTML = '<i class="fas fa-edit"></i>';
            editButton.title = 'Edit';
            editButton.dataset.action = 'edit';
            editButton.dataset.messageId = messageData.id;
            messageActions.appendChild(editButton);
            
            // Delete button (only for own messages)
            const deleteButton = document.createElement('button');
            deleteButton.className = 'p-2 text-[#b9bbbe] hover:text-[#ed4245] hover:bg-[#32353b] transition-colors duration-200';
            deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
            deleteButton.title = 'Delete';
            deleteButton.dataset.action = 'delete';
            deleteButton.dataset.messageId = messageData.id;
            messageActions.appendChild(deleteButton);
        }
        
        // More actions button
        const moreButton = document.createElement('button');
        moreButton.className = 'p-2 text-[#b9bbbe] hover:text-[#dcddde] hover:bg-[#32353b] rounded-r-md transition-colors duration-200';
        moreButton.innerHTML = '<i class="fas fa-ellipsis-v"></i>';
        moreButton.title = 'More Actions';
        moreButton.dataset.action = 'more';
        moreButton.dataset.messageId = messageData.id;
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
        attachmentElement.dataset.attachmentUrl = attachment.url || attachment;
        
        const attachmentUrl = attachment.url || attachment;
        const attachmentName = attachment.name || this.getFilenameFromUrl(attachmentUrl);
        const attachmentType = attachment.type || 'file';
        
        // Handle different attachment types
        if (attachmentType.startsWith('image/') || this.isImageFile(attachmentUrl)) {
            // Image attachment
            attachmentElement.classList.add('image-attachment');
            
            const imageContainer = document.createElement('div');
            imageContainer.className = 'image-attachment cursor-pointer relative';
            
            const image = document.createElement('img');
            image.className = 'max-w-md max-h-96 rounded-lg cursor-pointer';
            image.src = attachmentUrl;
            image.alt = attachmentName;
            image.loading = 'lazy';
            
            // Add click handler to open full image
            image.addEventListener('click', () => {
                window.open(attachmentUrl, '_blank');
            });
            
            // Add error handler
            image.addEventListener('error', () => {
                image.onerror = null;
                image.src = '/public/assets/common/default-profile-picture.png';
                image.classList.add('w-16', 'h-16');
                imageContainer.classList.add('bg-[#2b2d31]', 'p-3', 'rounded-lg');
                
                const errorDiv = document.createElement('div');
                errorDiv.className = 'text-sm text-[#b5bac1] mt-2';
                errorDiv.textContent = 'Image failed to load';
                imageContainer.appendChild(errorDiv);
            });
            
            imageContainer.appendChild(image);
            attachmentElement.appendChild(imageContainer);
            
        } else if (attachmentType.startsWith('video/') || this.isVideoFile(attachmentUrl)) {
            // Video attachment
            attachmentElement.classList.add('video-attachment');
            
            const videoContainer = document.createElement('div');
            videoContainer.className = 'video-attachment';
            
            const video = document.createElement('video');
            video.className = 'max-w-md max-h-96 rounded-lg';
            video.src = attachmentUrl;
            video.controls = true;
            video.preload = 'metadata';
            
            // Add error handler
            video.addEventListener('error', () => {
                videoContainer.innerHTML = '<div class="bg-[#2b2d31] p-3 rounded-lg flex items-center"><i class="fas fa-file-video text-2xl mr-2"></i><span>Video failed to load</span></div>';
            });
            
            videoContainer.appendChild(video);
            attachmentElement.appendChild(videoContainer);
            
        } else {
            // Generic file attachment
            attachmentElement.classList.add('file-attachment');
            
            const fileContainer = document.createElement('div');
            fileContainer.className = 'file-attachment p-3 flex items-center';
            
            // File icon based on extension
            const fileIcon = document.createElement('div');
            fileIcon.className = 'mr-3 text-xl';
            fileIcon.innerHTML = this.getFileIcon(attachmentName);
            
            // File info
            const fileInfo = document.createElement('div');
            fileInfo.className = 'flex-grow';
            
            const fileName = document.createElement('div');
            fileName.className = 'text-sm text-[#dcddde] truncate';
            fileName.textContent = attachmentName;
            
            fileInfo.appendChild(fileName);
            
            if (attachment.size && attachment.size > 0) {
                const fileSize = document.createElement('div');
                fileSize.className = 'text-xs text-[#b9bbbe]';
                fileSize.textContent = this.formatFileSize(attachment.size);
                fileInfo.appendChild(fileSize);
            }
            
            // Download button
            const downloadButton = document.createElement('button');
            downloadButton.className = 'ml-3 p-2 text-[#b9bbbe] hover:text-[#dcddde] hover:bg-[#32353b] rounded transition-colors duration-200';
            downloadButton.innerHTML = '<i class="fas fa-download"></i>';
            downloadButton.title = 'Download';
            
            downloadButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const link = document.createElement('a');
                link.href = attachmentUrl;
                link.download = attachmentName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
            
            fileContainer.appendChild(fileIcon);
            fileContainer.appendChild(fileInfo);
            fileContainer.appendChild(downloadButton);
            attachmentElement.appendChild(fileContainer);
        }
        
        return attachmentElement;
    }
    
    getFilenameFromUrl(url) {
        try {
            return decodeURIComponent(url.split('/').pop().split('?')[0]) || 'File';
        } catch (e) {
            return 'File';
        }
    }
    
    isImageFile(url) {
        return /\.(jpeg|jpg|gif|png|webp)$/i.test(url);
    }
    
    isVideoFile(url) {
        return /\.(mp4|webm|mov|avi|wmv)$/i.test(url);
    }
    
    getFileIcon(filename) {
        const extension = filename.toLowerCase().split('.').pop();
        
        if (['doc', 'docx'].includes(extension)) return '<i class="fas fa-file-word text-blue-500"></i>';
        if (['xls', 'xlsx', 'csv'].includes(extension)) return '<i class="fas fa-file-excel text-green-500"></i>';
        if (['ppt', 'pptx'].includes(extension)) return '<i class="fas fa-file-powerpoint text-orange-500"></i>';
        if (extension === 'pdf') return '<i class="fas fa-file-pdf text-red-500"></i>';
        if (['zip', 'rar', 'tar', 'gz'].includes(extension)) return '<i class="fas fa-file-archive text-yellow-500"></i>';
        if (['txt', 'log', 'md'].includes(extension)) return '<i class="fas fa-file-alt text-gray-500"></i>';
        if (['js', 'php', 'html', 'css', 'py', 'java', 'cpp', 'cs', 'rb'].includes(extension)) return '<i class="fas fa-file-code text-purple-500"></i>';
        if (['mp3', 'wav', 'ogg'].includes(extension)) return '<i class="fas fa-file-audio text-green-400"></i>';
        
        return '<i class="fas fa-file"></i>';
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
        
        // Update reaction button state for this message
        if (window.emojiReactions && typeof window.emojiReactions.updateReactionButtonState === 'function') {
            window.emojiReactions.updateReactionButtonState(messageElement, messageId);
        }

        const messageActions = messageElement.querySelector('.message-actions-js');
        
        // Setup hover behavior for message actions if they exist
        if (messageActions) {
            let hideTimeout;
            
            // Function to show actions
            const showActions = () => {
                clearTimeout(hideTimeout);
                messageActions.style.opacity = '1';
            };
            
            // Function to hide actions with delay
            const hideActions = () => {
                clearTimeout(hideTimeout);
                hideTimeout = setTimeout(() => {
                    messageActions.style.opacity = '0';
                }, 300); // 300ms delay before hiding
            };
            
            // Show actions when hovering over message
            messageElement.addEventListener('mouseenter', showActions);
            
            // Hide actions when leaving message (with delay)
            messageElement.addEventListener('mouseleave', hideActions);
            
            // Keep actions visible when hovering over them
            messageActions.addEventListener('mouseenter', showActions);
            
            // Hide actions when leaving the actions area (with delay)
            messageActions.addEventListener('mouseleave', hideActions);
        }
        
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
                        // This is now handled by the emoji system's click listener
                        // on the 'message-action-reaction' class
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
 