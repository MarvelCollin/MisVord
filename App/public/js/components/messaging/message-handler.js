class MessageHandler {
    constructor(chatSection) {
        this.chatSection = chatSection;
        this.processedMessageIds = new Set();
        this.temporaryMessages = new Map();
        this.lastMessageGroup = null;
        this.messageGroupTimeThreshold = 300000;
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
        
        if (messageElement) {
            this.insertMessageIntoDOM(messageElement, messagesContainer, formattedMessage);
            
            if (isTemporary) {
                this.temporaryMessages.set(messageData.id, messageElement);
            }
            
            this.processedMessageIds.add(messageData.id);
            this.chatSection.scrollToBottomIfNeeded();
            
            console.log(`✅ [MESSAGE-HANDLER] Message ${messageData.id} successfully added to UI`);
        } else {
            console.error('❌ [MESSAGE-HANDLER] Failed to create message element for:', messageData);
        }
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
        styleElements.forEach(style => {
            if (!document.querySelector(`style[data-from-bubble="${style.dataset.fromBubble || 'bubble-chat'}"]`)) {
                const newStyle = document.createElement('style');
                newStyle.textContent = style.textContent;
                newStyle.dataset.fromBubble = style.dataset.fromBubble || 'bubble-chat';
                document.head.appendChild(newStyle);
            }
        });
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
        
        const reactionButton = messageElement.querySelector('.message-action-reaction');
        if (reactionButton) {
            reactionButton.style.pointerEvents = 'none';
            reactionButton.style.opacity = '0.4';
            reactionButton.disabled = true;
            console.log('🚫 [MESSAGE-HANDLER] Disabled reaction button for temporary message');
        }
        
        const emojiButtons = messageElement.querySelectorAll('.emoji-button, .reaction-add-button');
        emojiButtons.forEach(button => {
            button.style.pointerEvents = 'none';
            button.style.opacity = '0.4';
            button.disabled = true;
        });
        
        if (!messageElement.querySelector('.temp-indicator')) {
            const tempIndicator = document.createElement('span');
            tempIndicator.className = 'temp-indicator text-xs text-gray-400 ml-2';
            tempIndicator.innerHTML = '<i class="fas fa-clock"></i>';
            tempIndicator.title = 'Message is being sent...';
            
            const messageHeader = messageElement.querySelector('.message-header, .bubble-message-header');
            if (messageHeader) {
                messageHeader.appendChild(tempIndicator);
            }
        }
    }
    
    markAsConfirmed(messageElement) {
        messageElement.classList.remove('bubble-message-temporary');
        messageElement.style.opacity = '1';
        
        const reactionButton = messageElement.querySelector('.message-action-reaction');
        if (reactionButton) {
            reactionButton.style.pointerEvents = '';
            reactionButton.style.opacity = '';
            reactionButton.disabled = false;
            console.log('✅ [MESSAGE-HANDLER] Re-enabled reaction button for confirmed message');
        }
        
        const emojiButtons = messageElement.querySelectorAll('.emoji-button, .reaction-add-button');
        emojiButtons.forEach(button => {
            button.style.pointerEvents = '';
            button.style.opacity = '';
            button.disabled = false;
        });
        
        const tempIndicator = messageElement.querySelector('.temp-indicator');
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
    
    handleMessageConfirmed(data) {
        console.log('✅ [MESSAGE-HANDLER] Message confirmed:', data);
        
        const { temp_message_id, permanent_message_id } = data;
        
        if (!temp_message_id || !permanent_message_id) {
            console.error('❌ [MESSAGE-HANDLER] Missing message IDs in confirmation:', data);
            return;
        }
        
        const tempMessageContent = document.querySelector(`[data-message-id="${temp_message_id}"]`);
        if (!tempMessageContent) {
            console.warn(`⚠️ [MESSAGE-HANDLER] Temporary message ${temp_message_id} not found`);
            return;
        }
        
        tempMessageContent.dataset.messageId = permanent_message_id;
        
        this.markAsConfirmed(tempMessageContent);
        
        this.processedMessageIds.delete(temp_message_id);
        this.processedMessageIds.add(permanent_message_id);
        
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
        
        const tempMessageContent = document.querySelector(`[data-message-id="${temp_message_id}"]`);
        if (!tempMessageContent) {
            console.warn(`⚠️ [MESSAGE-HANDLER] Failed message ${temp_message_id} not found`);
            return;
        }
        
        this.markAsFailed(tempMessageContent, error);
        
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
        
        for (const message of messages) {
            try {
                await this.addMessage(message);
            } catch (error) {
                console.error(`❌ [MESSAGE-HANDLER] Error displaying message ${message.id}:`, error);
            }
        }
        
        console.log(`✅ [MESSAGE-HANDLER] Successfully displayed ${messages.length} messages`);
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
                    console.error('❌ [MESSAGE-HANDLER] No bubble-message-group found in rendered HTML');
                }
            } catch (error) {
                console.error(`❌ [MESSAGE-HANDLER] Error prepending message ${message.id}:`, error);
            }
        }
        
        const newScrollHeight = messagesContainer.scrollHeight;
        messagesContainer.scrollTop = currentScrollTop + (newScrollHeight - currentScrollHeight);
        
        console.log(`✅ [MESSAGE-HANDLER] Successfully prepended ${messages.length} messages`);
    }

    async createMessageElement(formattedMessage, isTemporary) {
        try {
            const bubbleHtml = await this.renderBubbleMessage(formattedMessage);
            
            if (!bubbleHtml || typeof bubbleHtml !== 'string') {
                console.error('❌ [MESSAGE-HANDLER] Invalid bubble HTML response:', bubbleHtml);
                throw new Error('Invalid bubble HTML response');
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
                throw new Error('No bubble-message-group found in rendered HTML');
            }
            
        } catch (error) {
            console.error('❌ [MESSAGE-HANDLER] Error creating message element:', error);
            throw error;
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
}

export default MessageHandler;