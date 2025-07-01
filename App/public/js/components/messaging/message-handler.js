class MessageHandler {
    constructor(chatSection) {
        this.chatSection = chatSection;
        this.processedMessageIds = new Set();
        this.lastMessageGroup = null;
        this.messageGroupTimeThreshold = 5 * 60 * 1000; // 5 minutes in milliseconds
        this.temporaryMessages = new Map(); // Track temporary messages
    }
    
    async addMessage(messageData) {
        if (!messageData || 
            !messageData.id || 
            messageData.id === '' || 
            messageData.id === '0' ||
            (!messageData.content && !messageData.attachments?.length)) {
            console.error('❌ [MESSAGE-HANDLER] Invalid message data - missing ID or content:', messageData);
            return;
        }
        
        const isTemporary = messageData.is_temporary || messageData.id.toString().startsWith('temp-');
        
        if (this.processedMessageIds.has(messageData.id)) {
            console.log(`🔄 [MESSAGE-HANDLER] Message ${messageData.id} already processed, skipping`);
            return;
        }
        
        const existingElement = document.querySelector(`[data-message-id="${messageData.id}"]`);
        if (existingElement) {
            console.log(`🔄 [MESSAGE-HANDLER] Message ${messageData.id} already exists in DOM, skipping`);
            this.processedMessageIds.add(messageData.id);
            return;
        }
        
        if (isTemporary) {
            console.log(`📥 [MESSAGE-HANDLER] Adding temporary message ${messageData.id} to UI`);
        } else {
            console.log(`📥 [MESSAGE-HANDLER] Adding permanent message ${messageData.id} to UI`);
        }
        
        const messagesContainer = this.chatSection.getMessagesContainer();
        if (!messagesContainer) {
            console.error('❌ [MESSAGE-HANDLER] Messages container not found');
            return;
        }
        
        this.chatSection.hideEmptyState();
        
        const formattedMessage = this.formatMessageForBubble(messageData);
        
        if (!this.isValidFormattedMessage(formattedMessage)) {
            console.error('❌ [MESSAGE-HANDLER] Formatted message failed validation:', formattedMessage);
            return;
        }
        
        const messageElement = await this.createMessageElement(formattedMessage, isTemporary);
        
        if (!messageElement) {
            console.error('❌ [MESSAGE-HANDLER] Failed to create message element');
            return;
        }
        
        this.insertMessageIntoDOM(messageElement, messagesContainer, formattedMessage);
        
        this.processedMessageIds.add(messageData.id);
        
        if (isTemporary) {
            this.temporaryMessages.set(messageData.id, messageData);
        }
        
        // Process reactions for non-temporary messages (database-loaded messages)
        if (!isTemporary && messageData.reactions && messageData.reactions.length > 0) {
            console.log('🎯 [MESSAGE-HANDLER] Processing reactions for database-loaded message:', messageData.id);
            setTimeout(() => {
                if (window.emojiReactions && typeof window.emojiReactions.processMessageReactions === 'function') {
                    window.emojiReactions.processMessageReactions(messageData);
                } else {
                    console.warn('⚠️ [MESSAGE-HANDLER] Emoji reactions system not available for processing reactions');
                }
            }, 100);
        }
        
        this.chatSection.scrollToBottomIfNeeded();
        
        console.log(`✅ [MESSAGE-HANDLER] Successfully added ${isTemporary ? 'temporary' : 'permanent'} message ${messageData.id}`);
    }
    
    async renderBubbleMessage(messageData) {
        try {
            console.log('🔄 [MESSAGE-HANDLER] Requesting bubble render for message:', messageData.id);
            
            const response = await fetch('/api/messages/render-bubble', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message_data: messageData
                })
            });
            
            console.log('📡 [MESSAGE-HANDLER] Bubble render HTTP status:', response.status, response.statusText);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ [MESSAGE-HANDLER] HTTP error in bubble render:', response.status, response.statusText, errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}: ${errorText}`);
            }
            
            const result = await response.json();
            
            const html = result.html || result.data?.html;
            
            console.log('📥 [MESSAGE-HANDLER] Bubble render response:', {
                success: result.success,
                hasHtml: !!html,
                htmlLength: html ? html.length : 0,
                error: result.error,
                message: result.message,
                dataKeys: result.data ? Object.keys(result.data) : [],
                resultKeys: Object.keys(result)
            });
            
            if (!result.success) {
                console.error('❌ [MESSAGE-HANDLER] Bubble render failed:', result.error || result.message);
                throw new Error(result.error || result.message || 'Failed to render bubble message');
            }
            
            if (!html || typeof html !== 'string') {
                console.error('❌ [MESSAGE-HANDLER] Invalid HTML in response:', result);
                throw new Error('No valid HTML returned from bubble render API');
            }
            
            console.log('✅ [MESSAGE-HANDLER] Successfully received bubble HTML:', html.substring(0, 100) + '...');
            return html;
            
        } catch (error) {
            console.error('❌ [MESSAGE-HANDLER] Exception in renderBubbleMessage:', error);
            throw error;
        }
    }
    
    ensureBubbleStyles(tempDiv) {
        const styleElements = tempDiv.querySelectorAll('style');
        
        if (styleElements.length > 0) {
            let existingBubbleStyles = document.querySelector('style[data-bubble-styles="websocket"]');
            
            if (!existingBubbleStyles) {
                console.log('💄 [MESSAGE-HANDLER] Injecting bubble chat styles from WebSocket message');
                
                styleElements.forEach(style => {
                    const bubbleStyleElement = document.createElement('style');
                    bubbleStyleElement.setAttribute('data-bubble-styles', 'websocket');
                    bubbleStyleElement.textContent = style.textContent;
                    document.head.appendChild(bubbleStyleElement);
                });
                
                console.log('✅ [MESSAGE-HANDLER] Bubble chat styles injected successfully');
            } else {
                console.log('🎨 [MESSAGE-HANDLER] Bubble chat styles already loaded');
            }
        } else {
            console.warn('⚠️ [MESSAGE-HANDLER] No style elements found in bubble HTML');
        }
    }

    fallbackAddMessage(formattedMessage, messagesContainer, isTemporary) {
        console.log('🔧 [MESSAGE-HANDLER] Using fallback message rendering');
        
        this.ensureFallbackStyles();
        
        const messageGroup = this.createMessageGroup(formattedMessage);
            if (!messageGroup) {
                console.error('❌ [MESSAGE-HANDLER] Failed to create message group for:', formattedMessage);
                return;
            }
        
            messagesContainer.appendChild(messageGroup);
            this.lastMessageGroup = messageGroup;
        const messageElement = messageGroup.querySelector('[data-message-id]');
        
            if (isTemporary) {
                this.markAsTemporary(messageElement);
            this.temporaryMessages.set(formattedMessage.id, messageElement);
        }
        
        this.processedMessageIds.add(formattedMessage.id);
        this.chatSection.scrollToBottomIfNeeded();
        
        console.log(`✅ [MESSAGE-HANDLER] Message ${formattedMessage.id} successfully added to UI using fallback`);
    }
    
    ensureFallbackStyles() {
        if (!document.querySelector('style[data-bubble-styles="fallback"]')) {
            console.log('💄 [MESSAGE-HANDLER] Injecting fallback bubble chat styles');
            
            const fallbackStyles = `
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

.mention, .bubble-mention {
    color: #4f9cff;
    background-color: rgba(79, 156, 255, 0.2);
    padding: 2px 4px;
    border-radius: 3px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
}

.mention:hover, .bubble-mention:hover {
    background-color: rgba(79, 156, 255, 0.3);
}

.mention-all, .bubble-mention-all {
    color: #faa61a;
    background-color: rgba(250, 166, 26, 0.2);
}

.mention-all:hover, .bubble-mention-all:hover {
    background-color: rgba(250, 166, 26, 0.3);
}

.bubble-mention-user {
    color: #5865f2;
    background-color: rgba(88, 101, 242, 0.1);
}

.bubble-mention-user:hover {
    background-color: rgba(88, 101, 242, 0.2);
    text-decoration: underline;
}
`;
            
            const styleElement = document.createElement('style');
            styleElement.setAttribute('data-bubble-styles', 'fallback');
            styleElement.textContent = fallbackStyles;
            document.head.appendChild(styleElement);
            
            console.log('✅ [MESSAGE-HANDLER] Fallback bubble chat styles injected');
        }
    }
    
    createMessageGroup(messageData) {
        if (!messageData || !messageData.id || (!messageData.content && !messageData.attachments?.length)) {
            console.error('❌ [MESSAGE-HANDLER] Invalid message data for group creation:', messageData);
            return null;
        }
        
        const messageGroup = document.createElement('div');
        messageGroup.className = 'bubble-message-group';
        messageGroup.dataset.userId = messageData.user_id || messageData.userId;
        messageGroup.dataset.timestamp = messageData.timestamp || Date.now();
        
        const avatar = this.createAvatar(messageData);
        messageGroup.appendChild(avatar);
        
        const contentWrapper = this.createContentWrapper(messageData);
        messageGroup.appendChild(contentWrapper);
        
        return messageGroup;
    }
    
    createAvatar(messageData) {
        const avatarContainer = document.createElement('div');
        avatarContainer.className = 'bubble-avatar';
        
        const avatarImg = document.createElement('img');
        avatarImg.src = messageData.avatar_url || messageData.avatarUrl || '/public/assets/common/default-profile-picture.png';
        avatarImg.alt = messageData.username || 'User';
        avatarImg.onerror = function() {
            this.src = '/public/assets/common/default-profile-picture.png';
        };
        
        avatarContainer.appendChild(avatarImg);
        return avatarContainer;
    }
    
    createContentWrapper(messageData) {
        const wrapper = document.createElement('div');
        wrapper.className = 'bubble-content-wrapper';
        
        const header = this.createHeader(messageData);
        wrapper.appendChild(header);
        
        const contents = document.createElement('div');
        contents.className = 'bubble-contents';
        
        const messageContent = this.createMessageContent(messageData);
        contents.appendChild(messageContent);
        
        wrapper.appendChild(contents);
        return wrapper;
    }
    
    createHeader(messageData) {
        const header = document.createElement('div');
        header.className = 'bubble-header';
        
        const username = document.createElement('span');
        username.className = 'bubble-username';
        username.textContent = messageData.username || 'Unknown User';
        
        const timestamp = document.createElement('span');
        timestamp.className = 'bubble-timestamp';
        timestamp.textContent = this.formatTimestamp(messageData.sent_at || messageData.timestamp);
        
        header.appendChild(username);
        header.appendChild(timestamp);
        
        return header;
    }
    
    createMessageContent(messageData) {
        const content = document.createElement('div');
        content.className = 'bubble-message-content';
        content.dataset.messageId = messageData.id;
        content.dataset.userId = messageData.user_id || messageData.userId;
        
        if (messageData.reply_data || messageData.replyData) {
            const replyContainer = this.createReplyContainer(messageData);
            content.appendChild(replyContainer);
        }
        
        if (messageData.content) {
            const messageText = this.createMessageText(messageData);
            content.appendChild(messageText);
        }
        
        const actions = this.createMessageActions(messageData);
        content.appendChild(actions);
        
        return content;
    }
    
    createReplyContainer(messageData) {
        const replyData = messageData.reply_data || messageData.replyData;
        const replyMessageId = messageData.reply_message_id || messageData.replyMessageId;
        
        const replyContainer = document.createElement('div');
        replyContainer.className = 'bubble-reply-container';
        replyContainer.dataset.replyMessageId = replyMessageId;
        replyContainer.title = 'Jump to original message';
        replyContainer.style.cursor = 'pointer';
        
        const replyIcon = document.createElement('div');
        replyIcon.style.marginRight = '4px';
        replyIcon.innerHTML = '<i class="fas fa-reply"></i>';
        
        const replyUsername = document.createElement('span');
        replyUsername.className = 'bubble-reply-username';
        replyUsername.textContent = replyData.username || 'Unknown';
        
        const replyContent = document.createElement('span');
        replyContent.className = 'bubble-reply-content';
        const content = replyData.content || '';
        replyContent.textContent = content.length > 50 ? content.substring(0, 50) + '...' : content;
        
        replyContainer.appendChild(replyIcon);
        replyContainer.appendChild(replyUsername);
        replyContainer.appendChild(replyContent);
        
        replyContainer.addEventListener('click', () => {
            this.jumpToMessage(replyMessageId);
        });
        
        return replyContainer;
    }
    
    createMessageText(messageData) {
        const textContainer = document.createElement('div');
        textContainer.className = 'bubble-message-text';
        
        let content = messageData.content || '';
        
        if (this.chatSection.mentionHandler) {
            content = this.chatSection.mentionHandler.formatMessageWithMentions(content);
            textContainer.innerHTML = content;
        } else {
            textContainer.textContent = content;
        }
        
        return textContainer;
    }
    
    createMessageActions(messageData) {
        const actions = document.createElement('div');
        actions.className = 'bubble-message-actions';
        
        const replyBtn = document.createElement('button');
        replyBtn.className = 'bubble-action-button';
        replyBtn.innerHTML = '<i class="fas fa-reply"></i>';
        replyBtn.title = 'Reply';
        replyBtn.dataset.action = 'reply';
        replyBtn.dataset.messageId = messageData.id;
        actions.appendChild(replyBtn);
        
        const reactBtn = document.createElement('button');
        reactBtn.className = 'bubble-action-button';
        reactBtn.innerHTML = '<i class="fas fa-smile"></i>';
        reactBtn.title = 'Add Reaction';
        reactBtn.dataset.action = 'react';
        reactBtn.dataset.messageId = messageData.id;
        actions.appendChild(reactBtn);
        
        const currentUserId = this.chatSection.userId;
        const isOwnMessage = (messageData.user_id || messageData.userId) == currentUserId;
        
        if (isOwnMessage) {
            const editBtn = document.createElement('button');
            editBtn.className = 'bubble-action-button';
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.title = 'Edit';
            editBtn.dataset.action = 'edit';
            editBtn.dataset.messageId = messageData.id;
            actions.appendChild(editBtn);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'bubble-action-button delete-button';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.title = 'Delete';
            deleteBtn.dataset.action = 'delete';
            deleteBtn.dataset.messageId = messageData.id;
            actions.appendChild(deleteBtn);
        }
        
        const moreBtn = document.createElement('button');
        moreBtn.className = 'bubble-action-button';
        moreBtn.innerHTML = '<i class="fas fa-ellipsis-v"></i>';
        moreBtn.title = 'More Actions';
        moreBtn.dataset.action = 'more';
        moreBtn.dataset.messageId = messageData.id;
        actions.appendChild(moreBtn);
        
        return actions;
    }
    
    formatTimestamp(timestamp) {
        if (!timestamp) return '';
        
        const date = new Date(timestamp);
        date.setTime(date.getTime() + (7 * 60 * 60 * 1000));
        
        const now = new Date();
        now.setTime(now.getTime() + (7 * 60 * 60 * 1000));
        
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Today at ' + date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
        } else if (diffDays === 1) {
            return 'Yesterday at ' + date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
        } else {
            return date.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' at ' + date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
        }
    }
    
    markAsTemporary(messageElement) {
        messageElement.classList.add('bubble-message-temporary');
        messageElement.style.opacity = '0.7';
        
        const reactionButton = messageElement.querySelector('.message-action-reaction, .bubble-action-button[data-action="react"]');
        if (reactionButton) {
            reactionButton.style.pointerEvents = 'none';
            reactionButton.style.opacity = '0.4';
            reactionButton.disabled = true;
        }
        
        const emojiButtons = messageElement.querySelectorAll('.emoji-button, .reaction-add-button, .bubble-action-button');
        emojiButtons.forEach(button => {
            button.style.pointerEvents = 'none';
            button.style.opacity = '0.4';
            button.disabled = true;
        });
        
        if (!messageElement.querySelector('.temp-indicator')) {
            const tempIndicator = document.createElement('span');
            tempIndicator.className = 'temp-indicator text-xs text-gray-400 ml-2';
            tempIndicator.title = 'Message is being sent...';
            
            const messageHeader = messageElement.querySelector('.bubble-header') || 
                                 messageElement.closest('.bubble-message-group')?.querySelector('.bubble-header');
            if (messageHeader) {
                messageHeader.appendChild(tempIndicator);
            }
        }
    }
    
    markAsConfirmed(messageElement) {
        messageElement.classList.remove('bubble-message-temporary');
        messageElement.style.opacity = '1';
        
        const reactionButton = messageElement.querySelector('.message-action-reaction, .bubble-action-button[data-action="react"]');
        if (reactionButton) {
            reactionButton.style.pointerEvents = '';
            reactionButton.style.opacity = '';
            reactionButton.disabled = false;
        }
        
        const emojiButtons = messageElement.querySelectorAll('.emoji-button, .reaction-add-button, .bubble-action-button');
        emojiButtons.forEach(button => {
            button.style.pointerEvents = '';
            button.style.opacity = '';
            button.disabled = false;
        });
        
        const tempIndicator = messageElement.querySelector('.temp-indicator') ||
                            messageElement.closest('.bubble-message-group')?.querySelector('.temp-indicator');
        if (tempIndicator) {
            tempIndicator.remove();
        }
    }
    
    markAsFailed(messageElement, error) {
        messageElement.classList.add('bubble-message-failed');
        messageElement.style.opacity = '0.5';
        messageElement.style.borderLeft = '3px solid #ed4245';
        messageElement.style.paddingLeft = '8px';
        
        const errorText = document.createElement('div');
        errorText.className = 'bubble-error-text';
        errorText.style.color = '#ed4245';
        errorText.style.fontSize = '12px';
        errorText.style.marginTop = '4px';
        errorText.textContent = error || 'Failed to send message';
        messageElement.appendChild(errorText);
    }
    
    formatMessageForBubble(messageData) {
        return {
            id: messageData.id,
            user_id: messageData.user_id || messageData.userId,
            username: messageData.username || 'Unknown User',
            avatar_url: messageData.avatar_url || messageData.avatarUrl || '/public/assets/common/default-profile-picture.png',
            content: messageData.content || '',
            sent_at: messageData.sent_at || messageData.timestamp,
            edited_at: messageData.edited_at || messageData.editedAt,
            message_type: messageData.message_type || messageData.messageType || 'text',
            attachments: messageData.attachments || [],
            reply_message_id: messageData.reply_message_id || messageData.replyMessageId,
            reply_data: messageData.reply_data || messageData.replyData,
            reactions: messageData.reactions || [],
            timestamp: messageData.timestamp || Date.now()
        };
    }
    
    isValidFormattedMessage(messageData) {
        return messageData && 
               messageData.id && 
               messageData.id !== '' && 
               messageData.id !== '0' &&
               (messageData.content || (messageData.attachments && messageData.attachments.length > 0));
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
            lastMessageUserId === (messageData.user_id || messageData.userId).toString() &&
            (currentMessageTimestamp - lastMessageTimestamp) < this.messageGroupTimeThreshold &&
            !(messageData.reply_message_id || messageData.replyMessageId)
        );
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
        
        // Remove temporary styling using bubble component
        this.markAsConfirmed(tempMessageContent);
        
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
        
        // Mark as failed using bubble component
        this.markAsFailed(tempMessageContent, error);
        
        // Remove from temporary messages map
        this.temporaryMessages.delete(temp_message_id);
        
        console.log(`❌ [MESSAGE-HANDLER] Message ${temp_message_id} marked as failed`);
    }

    clearProcessedMessages() {
        this.processedMessageIds.clear();
        this.temporaryMessages.clear();
        this.lastMessageGroup = null;
        console.log('🧹 [MESSAGE-HANDLER] Processed messages cleared');
    }
    
    removeMessage(messageId) {
        console.log(`🗑️ [MESSAGE-HANDLER] Removing message ${messageId} from tracking`);
        this.processedMessageIds.delete(messageId);
        this.temporaryMessages.delete(messageId);
    }
    
    jumpToMessage(messageId) {
        console.log('🎯 [REPLY-JUMP] Jumping to message:', messageId);
        
        const targetMessage = document.querySelector(`[data-message-id="${messageId}"]`);
        if (!targetMessage) {
            console.warn('⚠️ [REPLY-JUMP] Original message not found:', messageId);
            
            if (window.globalSocketManager && window.globalSocketManager.isReady()) {
                window.globalSocketManager.io.emit('jump-to-message', {
                    message_id: messageId,
                    user_id: this.chatSection?.userId || null
                });
            }
            return;
        }
        
        targetMessage.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
        
        targetMessage.classList.add('highlight-message');
        
        setTimeout(() => {
            targetMessage.classList.remove('highlight-message');
        }, 3000);
        
        console.log('✅ [REPLY-JUMP] Successfully jumped to message:', messageId);
    }
    
    async displayMessages(messages) {
        console.log(`📨 [MESSAGE-HANDLER] Displaying ${messages.length} messages`);
        
        if (!Array.isArray(messages)) {
            console.error('❌ [MESSAGE-HANDLER] displayMessages called with non-array:', messages);
            return;
        }
        
        if (messages.length === 0) {
            console.log('📭 [MESSAGE-HANDLER] No messages to display');
            return;
        }
        
        const messagesContainer = this.chatSection.getMessagesContainer();
        if (!messagesContainer) {
            console.error('❌ [MESSAGE-HANDLER] Messages container not found');
            return;
        }
        
        this.chatSection.hideEmptyState();
        this.ensureFallbackStyles();
        
        console.log('🎨 [MESSAGE-HANDLER] Building all messages in background while skeleton is visible');
        
        const tempContainer = document.createElement('div');
        tempContainer.style.visibility = 'hidden';
        tempContainer.style.position = 'absolute';
        tempContainer.style.top = '-9999px';
        tempContainer.className = 'messages-container';
        document.body.appendChild(tempContainer);
        
        const messageElements = [];
        
        for (const message of messages) {
            try {
                const formattedMessage = this.formatMessageForBubble(message);
                
                if (!this.isValidFormattedMessage(formattedMessage)) {
                    console.error('❌ [MESSAGE-HANDLER] Formatted message failed validation:', formattedMessage);
                    continue;
                }
                
                const messageElement = await this.createMessageElement(formattedMessage, false);
                if (messageElement) {
                    tempContainer.appendChild(messageElement);
                    messageElements.push(messageElement);
                    this.processedMessageIds.add(message.id);
                }
            } catch (error) {
                console.error(`❌ [MESSAGE-HANDLER] Error creating message ${message.id}:`, error);
            }
        }
        
        console.log(`🎯 [MESSAGE-HANDLER] All ${messageElements.length} messages built, replacing skeleton`);
        
        if (window.ChatSkeletonLoader) {
            const skeletonLoader = new window.ChatSkeletonLoader(messagesContainer);
            skeletonLoader.clearAfterLoad();
        }
        
        messagesContainer.innerHTML = '';
        
        messageElements.forEach(element => {
            messagesContainer.appendChild(element);
        });
        
        document.body.removeChild(tempContainer);
        
        console.log(`✅ [MESSAGE-HANDLER] Successfully displayed ${messages.length} messages in batch`);
    }
    
    async prependMessages(messages) {
        console.log(`📨 [MESSAGE-HANDLER] Prepending ${messages.length} messages`);
        
        if (!Array.isArray(messages)) {
            console.error('❌ [MESSAGE-HANDLER] prependMessages called with non-array:', messages);
            return;
        }
        
        if (messages.length === 0) {
            console.log('📭 [MESSAGE-HANDLER] No messages to prepend');
            return;
        }
        
        const messagesContainer = this.chatSection.getMessagesContainer();
        if (!messagesContainer) {
            console.error('❌ [MESSAGE-HANDLER] Messages container not found');
            return;
        }
        
        this.chatSection.hideEmptyState();
        
        const firstChild = messagesContainer.firstChild;
        const currentScrollHeight = messagesContainer.scrollHeight;
        const currentScrollTop = messagesContainer.scrollTop;
        
        for (const message of messages.reverse()) {
            try {
                const formattedMessage = this.formatMessageForBubble(message);
                
                if (!this.isValidFormattedMessage(formattedMessage)) {
                    console.error('❌ [MESSAGE-HANDLER] Formatted message failed validation:', formattedMessage);
                    continue;
                }
                
                const bubbleHtml = await this.renderBubbleMessage(formattedMessage);
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = bubbleHtml;
                const messageGroup = tempDiv.querySelector('.bubble-message-group');
                
                if (messageGroup) {
                    this.ensureBubbleStyles(tempDiv);
                    messagesContainer.insertBefore(messageGroup, firstChild);
                    this.processedMessageIds.add(message.id);
                } else {
                    this.fallbackPrependMessage(formattedMessage, messagesContainer, firstChild);
                }
            } catch (error) {
                console.error(`❌ [MESSAGE-HANDLER] Error prepending message ${message.id}:`, error);
                const formattedMessage = this.formatMessageForBubble(message);
                this.fallbackPrependMessage(formattedMessage, messagesContainer, firstChild);
            }
        }
        
        const newScrollHeight = messagesContainer.scrollHeight;
        messagesContainer.scrollTop = currentScrollTop + (newScrollHeight - currentScrollHeight);
        
        console.log(`✅ [MESSAGE-HANDLER] Successfully prepended ${messages.length} messages`);
    }
    
    fallbackPrependMessage(formattedMessage, messagesContainer, firstChild) {
        console.log('🔧 [MESSAGE-HANDLER] Using fallback prepend for message:', formattedMessage.id);
        
        this.ensureFallbackStyles();
        
        const messageGroup = this.createMessageGroup(formattedMessage);
        if (messageGroup) {
            messagesContainer.insertBefore(messageGroup, firstChild);
            this.processedMessageIds.add(formattedMessage.id);
        }
    }

    async createMessageElement(formattedMessage, isTemporary) {
        try {
            const bubbleHtml = await this.renderBubbleMessage(formattedMessage);
            
            if (!bubbleHtml || typeof bubbleHtml !== 'string') {
                console.error('❌ [MESSAGE-HANDLER] Invalid bubble HTML response:', bubbleHtml);
                return this.fallbackCreateMessage(formattedMessage, isTemporary);
            }
            
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = bubbleHtml;
            
            const messageGroup = tempDiv.querySelector('.bubble-message-group');
        
            if (messageGroup) {
                this.ensureBubbleStyles(tempDiv);
                
                const messageElement = messageGroup.querySelector('[data-message-id]');
                
                if (isTemporary && messageElement) {
                    this.markAsTemporary(messageElement);
                }
                
                console.log(`✅ [MESSAGE-HANDLER] Message element created successfully using bubble component`);
                return messageGroup;
            } else {
                const htmlPreview = bubbleHtml ? bubbleHtml.substring(0, 200) : 'undefined';
                console.error('❌ [MESSAGE-HANDLER] Failed to find bubble-message-group in HTML:', htmlPreview);
                console.log('🔧 [MESSAGE-HANDLER] Falling back to manual creation');
                return this.fallbackCreateMessage(formattedMessage, isTemporary);
            }
            
        } catch (error) {
            console.error('❌ [MESSAGE-HANDLER] Error creating message element:', error);
            return this.fallbackCreateMessage(formattedMessage, isTemporary);
        }
    }

    insertMessageIntoDOM(messageElement, messagesContainer, formattedMessage) {
        if (!messageElement || !messagesContainer) {
            console.error('❌ [MESSAGE-HANDLER] Cannot insert message: missing element or container');
            return;
        }
        
        messagesContainer.appendChild(messageElement);
        this.lastMessageGroup = messageElement;
        
        console.log(`✅ [MESSAGE-HANDLER] Message ${formattedMessage.id} inserted into DOM`);
    }

    fallbackCreateMessage(formattedMessage, isTemporary) {
        console.log('🔧 [MESSAGE-HANDLER] Using fallback message creation');
        
        const messageGroup = document.createElement('div');
        messageGroup.className = 'bubble-message-group';
        messageGroup.dataset.userId = formattedMessage.user_id;
        messageGroup.dataset.timestamp = formattedMessage.timestamp;
        
        const avatar = document.createElement('div');
        avatar.className = 'bubble-avatar';
        const avatarImg = document.createElement('img');
        avatarImg.src = formattedMessage.avatar_url || '/public/assets/common/default-profile-picture.png';
        avatarImg.alt = formattedMessage.username || 'User';
        avatarImg.className = 'user-avatar';
        if (window.fallbackImageHandler) {
            window.fallbackImageHandler.setImageSrc(avatarImg, formattedMessage.avatar_url, formattedMessage.username);
        } else {
            avatarImg.onerror = function() { this.src = '/public/assets/common/default-profile-picture.png'; };
        }
        avatar.appendChild(avatarImg);
        
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'bubble-content-wrapper';
        
        const header = document.createElement('div');
        header.className = 'bubble-header';
        const username = document.createElement('span');
        username.className = 'bubble-username';
        username.textContent = formattedMessage.username || 'Unknown User';
        const timestamp = document.createElement('span');
        timestamp.className = 'bubble-timestamp';
        timestamp.textContent = this.formatTimestamp(formattedMessage.sent_at || formattedMessage.timestamp);
        header.appendChild(username);
        header.appendChild(timestamp);
        
        const contents = document.createElement('div');
        contents.className = 'bubble-contents';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'bubble-message-content';
        messageContent.dataset.messageId = formattedMessage.id;
        messageContent.dataset.userId = formattedMessage.user_id;
        
        const messageText = document.createElement('div');
        messageText.className = 'bubble-message-text';
        messageText.innerHTML = formattedMessage.content || '';
        
        const actions = document.createElement('div');
        actions.className = 'bubble-message-actions';
        
        messageContent.appendChild(messageText);
        messageContent.appendChild(actions);
        contents.appendChild(messageContent);
        contentWrapper.appendChild(header);
        contentWrapper.appendChild(contents);
        
        messageGroup.appendChild(avatar);
        messageGroup.appendChild(contentWrapper);
        
        if (isTemporary) {
            this.markAsTemporary(messageContent);
        }
        
        return messageGroup;
    }
}

export default MessageHandler;