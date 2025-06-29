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
        if (existingElement && !isTemporary) {
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
        
        try {
            const bubbleHtml = await this.renderBubbleMessage(formattedMessage);
            
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = bubbleHtml;
            const messageGroup = tempDiv.firstElementChild;
            
            if (messageGroup) {
                messagesContainer.appendChild(messageGroup);
                this.lastMessageGroup = messageGroup;
                const messageElement = messageGroup.querySelector('[data-message-id]');
                
                if (isTemporary) {
                    this.markAsTemporary(messageElement);
                    this.temporaryMessages.set(messageData.id, messageElement);
                }
                
                this.processedMessageIds.add(messageData.id);
                this.chatSection.scrollToBottomIfNeeded();
                
                console.log(`✅ [MESSAGE-HANDLER] Message ${messageData.id} successfully added to UI using bubble component`);
            } else {
                console.error('❌ [MESSAGE-HANDLER] Failed to create message element from bubble HTML');
            }
            
        } catch (error) {
            console.error('❌ [MESSAGE-HANDLER] Error rendering bubble message:', error);
            this.fallbackAddMessage(formattedMessage, messagesContainer, isTemporary);
        }
    }
    
    async renderBubbleMessage(messageData) {
        const response = await fetch('/api/messages/render-bubble', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message_data: messageData
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to render bubble message');
        }
        
        return result.html;
    }
    
    fallbackAddMessage(formattedMessage, messagesContainer, isTemporary) {
        console.log('🔧 [MESSAGE-HANDLER] Using fallback message rendering');
        
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
        
        if (messageData.content) {
            const messageText = this.createMessageText(messageData);
            content.appendChild(messageText);
        }
        
        const actions = this.createMessageActions(messageData);
        content.appendChild(actions);
        
        return content;
    }
    
    createMessageText(messageData) {
        const textContainer = document.createElement('div');
        textContainer.className = 'bubble-message-text';
        textContainer.textContent = messageData.content || '';
        
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
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Today at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Yesterday at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    }
    
    markAsTemporary(messageElement) {
        messageElement.classList.add('bubble-message-temporary');
        messageElement.style.opacity = '0.7';
    }
    
    markAsConfirmed(messageElement) {
        messageElement.classList.remove('bubble-message-temporary');
        messageElement.style.opacity = '';
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
        console.log(`🧹 [MESSAGE-HANDLER] Clearing ${this.processedMessageIds.size} processed message IDs and ${this.temporaryMessages.size} temporary messages`);
        this.processedMessageIds.clear();
        this.temporaryMessages.clear();
        this.lastMessageGroup = null;
    }
    
    removeMessage(messageId) {
        console.log(`🗑️ [MESSAGE-HANDLER] Removing message ${messageId} from tracking`);
        this.processedMessageIds.delete(messageId);
        this.temporaryMessages.delete(messageId);
    }
}

export default MessageHandler;
 