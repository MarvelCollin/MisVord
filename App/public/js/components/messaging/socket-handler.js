class SocketHandler {
    constructor(chatSection) {
        this.chatSection = chatSection;
        this.socketListenersSetup = false;
        this.typingUsers = new Map();
    }

    setupIoListeners() {

        if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {

            window.addEventListener('globalSocketReady', this.handleSocketReady.bind(this));
            return;
        }
        
        this.setupSocketHandlers(window.globalSocketManager.io);
    }
    
    handleSocketReady() {

        if (window.globalSocketManager && window.globalSocketManager.io) {
            this.setupSocketHandlers(window.globalSocketManager.io);
        }
    }

    setupSocketHandlers(io) {
        if (!io) {
            console.error('❌ Cannot setup socket handlers: io object is null');
            return;
        }
        
        if (this.socketListenersSetup) {

            return;
        }
        

        
        io.off('new-channel-message');
        io.off('user-message-dm');
        io.off('reaction-added');
        io.off('reaction-removed');
        io.off('message-updated');
        io.off('message-deleted');
        io.off('message-pinned');
        io.off('message-unpinned');
        io.off('message-edit-temp');
        io.off('message-edit-confirmed');
        io.off('message-edit-failed');
        io.off('message_id_updated');
        io.off('message_save_failed');
        io.off('message_error');
        io.off('user-typing');
        io.off('user-stop-typing');
        io.off('user-typing-dm');
        io.off('user-stop-typing-dm');
        
        io.on('new-channel-message', this.handleChannelMessage.bind(this));
        io.on('user-message-dm', this.handleDMMessage.bind(this));
        io.on('reaction-added', this.handleReactionAdded.bind(this));
        io.on('reaction-removed', this.handleReactionRemoved.bind(this));
        io.on('message-updated', this.handleMessageUpdated.bind(this));
        io.on('message-deleted', this.handleMessageDeleted.bind(this));
        io.on('message-pinned', this.handleMessagePinned.bind(this));
        io.on('message-unpinned', this.handleMessageUnpinned.bind(this));
        io.on('message-edit-temp', this.handleMessageEditTemp.bind(this));
        io.on('message-edit-confirmed', this.handleMessageEditConfirmed.bind(this));
        io.on('message-edit-failed', this.handleMessageEditFailed.bind(this));
        io.on('message_id_updated', this.handleMessageIdUpdated.bind(this));
        io.on('message_save_failed', this.handleMessageSaveFailed.bind(this));
        io.on('message_error', this.handleMessageError.bind(this));
        io.on('user-typing', this.handleTyping.bind(this));
        io.on('user-stop-typing', this.handleStopTyping.bind(this));
        io.on('user-typing-dm', this.handleTypingDM.bind(this));
        io.on('user-stop-typing-dm', this.handleStopTypingDM.bind(this));
        
        this.socketListenersSetup = true;

    }
    
    handleChannelMessage(data) {
        try {
            if (!data || !data.id) {
                console.warn('⚠️ Invalid channel message data received');
                return;
            }
            
            const isSender = data.user_id === window.globalSocketManager?.userId;
            const isForThisChannel = 
                this.chatSection.chatType === 'channel' && 
                String(data.channel_id) === String(this.chatSection.targetId);
            
            if (!isForThisChannel) {
                console.log('🔄 Channel message not for this channel, ignoring:', {
                    messageChannelId: data.channel_id,
                    currentChannelId: this.chatSection.targetId,
                    currentChatType: this.chatSection.chatType
                });
                return;
            }
            
            const alreadyProcessed = this.chatSection.messageHandler.processedMessageIds.has(data.id);
            
            if (alreadyProcessed) {

                return;
            }
            
            if (isSender && (data.source === 'client-originated' || data.source === 'websocket-originated')) {
                console.log('🔄 Skipping own message from websocket source:', {
                    id: data.id,
                    source: data.source
                });
                return;
            }
            
            const isTemporaryMessage = data.is_temporary || (data.id && data.id.toString().startsWith('temp-')) || !!data.temp_message_id;
            
            console.log('📥 Received channel message:', {
                id: data.id,
                channelId: data.channel_id,
                fromSelf: isSender,
                source: data.source,
                isTemporary: isTemporaryMessage
            });
            

            this.chatSection.hideEmptyState();
            
            this.chatSection.messageHandler.addMessage({...data, source: 'socket-originated'});
            
            if (!isSender) {
                this.chatSection.playMessageSound();
                
                if (data.mentions && data.mentions.length > 0) {
                    this.chatSection.mentionHandler.handleMentionNotification(data);
                }
            }
            
            window.dispatchEvent(new CustomEvent('messageReceived', {
                detail: {
                    messageId: data.id,
                    channelId: data.channel_id,
                    userId: data.user_id,
                    isSender: isSender,
                    timestamp: Date.now()
                }
            }));
        } catch (error) {
            console.error('❌ Error handling channel message:', error);
        }
    }
    
    handleDMMessage(data) {
        try {
            if (!data || !data.id) {
                console.warn('⚠️ Invalid DM message data received');
                return;
            }
            
            const isSender = data.user_id === window.globalSocketManager?.userId;
            const isForThisDM = 
                (this.chatSection.chatType === 'direct' || this.chatSection.chatType === 'dm') && 
                String(data.room_id) === String(this.chatSection.targetId);
            
            if (!isForThisDM) {
                console.log('🔄 DM message not for this room, ignoring:', {
                    messageRoomId: data.room_id,
                    currentRoomId: this.chatSection.targetId,
                    currentChatType: this.chatSection.chatType
                });
                return;
            }
            
            const alreadyProcessed = this.chatSection.messageHandler.processedMessageIds.has(data.id);
            
            if (alreadyProcessed) {

                return;
            }
            
            if (isSender && (data.source === 'client-originated' || data.source === 'websocket-originated')) {
                console.log('🔄 Skipping own DM message from websocket source:', {
                    id: data.id,
                    source: data.source
                });
                return;
            }
            
            const isTemporaryMessage = data.is_temporary || (data.id && data.id.toString().startsWith('temp-')) || !!data.temp_message_id;
            
            console.log('📥 Received DM message:', {
                id: data.id,
                roomId: data.room_id,
                fromSelf: isSender,
                source: data.source,
                isTemporary: isTemporaryMessage
            });
            

            this.chatSection.hideEmptyState();
            
            this.chatSection.messageHandler.addMessage({...data, source: 'socket-originated'});
            
            if (!isSender) {
                this.chatSection.playMessageSound();
                
                if (data.mentions && data.mentions.length > 0) {
                    this.chatSection.mentionHandler.handleMentionNotification(data);
                }
            }
            
            window.dispatchEvent(new CustomEvent('messageReceived', {
                detail: {
                    messageId: data.id,
                    roomId: data.room_id,
                    userId: data.user_id,
                    isSender: isSender,
                    timestamp: Date.now()
                }
            }));
        } catch (error) {
            console.error('❌ Error handling DM message:', error);
        }
    }
    
    handleMessageUpdated(data) {
        try {
            if (!data || !data.message_id) return;
            
            const messageElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
            if (!messageElement) return;
            

            
            const messageTextElement = messageElement.querySelector('.bubble-message-text');
            if (messageTextElement && data.content) {
                messageTextElement.innerHTML = this.chatSection.formatMessageContent(data.content);
                
                let editedBadge = messageElement.querySelector('.bubble-edited-badge');
                if (!editedBadge) {
                    editedBadge = document.createElement('span');
                    editedBadge.className = 'bubble-edited-badge text-xs text-[#a3a6aa] ml-1';
                    editedBadge.textContent = '(edited)';
                    messageTextElement.appendChild(editedBadge);
                }
            }
        } catch (error) {
            console.error('❌ Error handling message update:', error);
        }
    }
    
    handleMessageDeleted(data) {
        try {
            if (!data || !data.message_id) {
                console.warn('⚠️ [SOCKET-HANDLER] Invalid message deletion data received:', data);
                return;
            }
            
            console.log('🗑️ [SOCKET-HANDLER] Message deletion received:', {
                messageId: data.message_id,
                userId: data.user_id,
                username: data.username,
                targetType: data.target_type,
                targetId: data.target_id,
                source: data.source
            });
            
            const isSender = data.user_id === window.globalSocketManager?.userId;
            const isForThisChat = this.isCurrentChat(data);
            
            if (!isForThisChat) {
                console.log('🔄 [SOCKET-HANDLER] Deletion not for this chat, ignoring:', {
                    messageTargetType: data.target_type,
                    messageTargetId: data.target_id,
                    currentChatType: this.chatSection.chatType,
                    currentTargetId: this.chatSection.targetId
                });
                return;
            }
            
            if (isSender) {

                return;
            }
            
            const messageElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
            if (!messageElement) {

                return;
            }
            

            
            messageElement.style.transition = 'opacity 0.3s ease';
            messageElement.style.opacity = '0';
            
            setTimeout(() => {
                const messageGroup = messageElement.closest('.bubble-message-group, .message-group');
                if (messageGroup && messageGroup.querySelectorAll('.bubble-message-content, .message-content').length === 1) {

                    messageGroup.remove();
                } else {

                    messageElement.remove();
                }
                
                if (this.chatSection.messageHandler && this.chatSection.messageHandler.processedMessageIds) {
                    this.chatSection.messageHandler.processedMessageIds.delete(data.message_id);
                }
                
                const remainingMessages = this.chatSection.getMessagesContainer().querySelectorAll('.bubble-message-group, .message-group');
                if (remainingMessages.length === 0) {
                    this.chatSection.showEmptyState();
                }
                

            }, 300);
            
        } catch (error) {
            console.error('❌ [SOCKET-HANDLER] Error handling message deletion:', error);
        }
    }
    
    handleMessagePinned(data) {
        try {
            if (!data || !data.message_id) return;

            

            const messageElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
            if (messageElement) {
                const pinIcon = document.createElement('span');
                pinIcon.className = 'pin-icon ml-2';
                pinIcon.innerHTML = '<i class="fas fa-thumbtack text-xs text-[#a3a6aa]"></i>';
                
                const messageHeader = messageElement.querySelector('.message-header');
                if (messageHeader && !messageHeader.querySelector('.pin-icon')) {
                    messageHeader.appendChild(pinIcon);
                }
            }
        } catch (error) {
            console.error('❌ Error handling message pin:', error);
        }
    }
    
    handleMessageUnpinned(data) {
        try {
            if (!data || !data.message_id) return;

            

            const messageElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
            if (messageElement) {
                const pinIcon = messageElement.querySelector('.pin-icon');
                if (pinIcon) {
                    pinIcon.remove();
                }
            }
        } catch (error) {
            console.error('❌ Error handling message unpin:', error);
        }
    }
    
    handleMessageIdUpdated(data) {
        try {
            if (!data || !data.temp_message_id || !data.real_message_id) {
                console.warn('⚠️ Invalid message ID update data received');
                return;
            }
            
            console.log('🔄 Message ID update received:', {
                tempId: data.temp_message_id,
                realId: data.real_message_id
            });
            

            const tempElement = document.querySelector(`[data-message-id="${data.temp_message_id}"]`);
            if (tempElement) {

                

                tempElement.dataset.messageId = data.real_message_id;
                

                tempElement.classList.remove('temporary-message');
                tempElement.classList.remove('bubble-message-temporary');
                

                tempElement.classList.remove('message-error');
                tempElement.style.borderLeft = '';
                
                const errorIndicator = tempElement.querySelector('.error-indicator');
                if (errorIndicator) {
                    errorIndicator.remove();
                }
                

                if (this.chatSection.messageHandler) {
                    this.chatSection.messageHandler.processedMessageIds.delete(data.temp_message_id);
                    this.chatSection.messageHandler.processedMessageIds.add(data.real_message_id);
                    

                    if (this.chatSection.messageHandler.temporaryMessages) {
                        this.chatSection.messageHandler.temporaryMessages.delete(data.temp_message_id);
                    }
                    

                    if (data.message_data && data.message_data.reply_data) {

                        

                        let replyContainer = tempElement.querySelector('.bubble-reply-container');
                        
                        if (!replyContainer && data.message_data.reply_data) {

                            const messageContent = tempElement.querySelector('.bubble-message-content');
                            if (messageContent) {
                                replyContainer = this.chatSection.messageHandler.createReplyContainer(data.message_data);
                                

                                const firstChild = messageContent.firstChild;
                                if (firstChild) {
                                    messageContent.insertBefore(replyContainer, firstChild);
                                } else {
                                    messageContent.appendChild(replyContainer);
                                }
                                

                            }
                        }
                    }
                }
                

                this.updateReactionButtonForPermanentId(tempElement, data.real_message_id);
                

                if (window.emojiReactions) {

                    window.emojiReactions.handleMessageIdUpdated(data.temp_message_id, data.real_message_id);
                }
                

                window.dispatchEvent(new CustomEvent('messageIdUpdated', {
                    detail: {
                        tempId: data.temp_message_id,
                        realId: data.real_message_id,
                        messageElement: tempElement,
                        messageData: data.message_data
                    }
                }));
                

            } else {

            }


            this.updateBotReplyReferences(data.temp_message_id, data.real_message_id);
            
        } catch (error) {
            console.error('❌ Error handling message ID update:', error);
        }
    }
    
    updateReactionButtonForPermanentId(messageElement, permanentId) {
        try {
            const reactionButton = messageElement.querySelector('.bubble-action-button[data-action="react"]');
            if (reactionButton) {
                reactionButton.style.pointerEvents = '';
                reactionButton.style.opacity = '';
                reactionButton.disabled = false;
                
                if (reactionButton.dataset.messageId) {
                    reactionButton.dataset.messageId = permanentId;
                }
                

            }
            
            if (window.emojiReactions && typeof window.emojiReactions.updateReactionButtonState === 'function') {

                window.emojiReactions.updateReactionButtonState(messageElement, permanentId);
            }
            
            const emojiButtons = messageElement.querySelectorAll('[data-message-id], .emoji-button, .reaction-add-button, .bubble-action-button');
            emojiButtons.forEach(button => {
                if (button.dataset.messageId) {
                    button.dataset.messageId = permanentId;
                }
                button.style.pointerEvents = '';
                button.style.opacity = '';
                button.disabled = false;
            });
            
        } catch (error) {
            console.error('❌ Error updating reaction button for permanent ID:', error);
        }
    }
    
    handleMessageSaveFailed(data) {
        try {
            if (!data || !data.temp_message_id) {
                console.warn('⚠️ Invalid message save failed data received');
                return;
            }
            
            console.error('❌ Message save failed:', data);
            
            const tempElement = document.querySelector(`[data-message-id="${data.temp_message_id}"]`);
            if (tempElement) {
                tempElement.classList.add('bubble-message-failed');
                tempElement.style.opacity = '0.5';
                tempElement.style.borderLeft = '3px solid #ed4245';
                tempElement.style.paddingLeft = '8px';
                
                const errorIndicator = document.createElement('span');
                errorIndicator.className = 'bubble-error-text';
                errorIndicator.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Failed to save';
                errorIndicator.title = data.error || 'Message failed to save';
                
                const messageText = tempElement.querySelector('.bubble-message-text');
                if (messageText && !messageText.querySelector('.bubble-error-text')) {
                    messageText.appendChild(errorIndicator);
                }
            }
            
            if (this.chatSection && this.chatSection.showNotification) {
                this.chatSection.showNotification('Message failed to save: ' + (data.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('❌ Error handling message save failure:', error);
        }
    }
    
    handleMessageError(data) {
        try {
            console.error('❌ Message error received:', data);
            

            if (this.chatSection && this.chatSection.showNotification) {
                this.chatSection.showNotification(data.error || 'Message error occurred', 'error');
            }
            

            if (data.temp_message_id) {
                this.handleMessageSaveFailed(data);
            }
        } catch (error) {
            console.error('❌ Error handling message error:', error);
        }
    }
    
    handleReactionAdded(data) {
        try {
            if (!data || !data.message_id || !data.emoji) return;
            
            console.log('👍 [SOCKET-HANDLER] Reaction added:', {
                messageId: data.message_id,
                emoji: data.emoji,
                userId: data.user_id,
                username: data.username
            });
            
            if (window.emojiReactions && typeof window.emojiReactions.handleReactionAdded === 'function') {
                window.emojiReactions.handleReactionAdded(data);
            } else {
                console.warn('⚠️ [SOCKET-HANDLER] emojiReactions.handleReactionAdded not available');
            }
        } catch (error) {
            console.error('❌ [SOCKET-HANDLER] Error handling reaction add:', error);
        }
    }
    
    handleReactionRemoved(data) {
        try {
            if (!data || !data.message_id || !data.emoji) return;
            
            console.log('👎 [SOCKET-HANDLER] Reaction removed:', {
                messageId: data.message_id,
                emoji: data.emoji,
                userId: data.user_id,
                username: data.username
            });
            
            if (window.emojiReactions && typeof window.emojiReactions.handleReactionRemoved === 'function') {
                window.emojiReactions.handleReactionRemoved(data);
            } else {
                console.warn('⚠️ [SOCKET-HANDLER] emojiReactions.handleReactionRemoved not available');
            }
        } catch (error) {
            console.error('❌ [SOCKET-HANDLER] Error handling reaction removal:', error);
        }
    }
    
    handleMessageEditTemp(data) {
        try {
            if (!data || !data.message_id) return;
            
            console.log('✏️ [SOCKET-HANDLER] Edit received:', {
                messageId: data.message_id,
                userId: data.user_id,
                username: data.username,
                content: data.content?.substring(0, 50) + (data.content?.length > 50 ? '...' : '')
            });
            
            const isSender = data.user_id === window.globalSocketManager?.userId;
            if (isSender) {

                return;
            }
            
            const messageElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
            if (messageElement) {
                const messageTextElement = messageElement.querySelector('.bubble-message-text, .message-main-text');
                if (messageTextElement && data.content) {
                    messageTextElement.innerHTML = this.chatSection.formatMessageContent(data.content);
                    
                    let editedBadge = messageElement.querySelector('.bubble-edited-badge, .edited-badge');
                    if (!editedBadge) {
                        editedBadge = document.createElement('span');
                        editedBadge.className = messageElement.querySelector('.bubble-message-text') 
                            ? 'bubble-edited-badge text-xs text-[#a3a6aa] ml-1'
                            : 'edited-badge text-xs text-[#a3a6aa] ml-1';
                        editedBadge.textContent = '(edited)';
                        messageTextElement.appendChild(editedBadge);
                    }
                    

                }
            }
        } catch (error) {
            console.error('❌ Error handling edit:', error);
        }
    }
    
    handleMessageEditConfirmed(data) {
        try {
            if (!data || !data.message_id) return;
            

            
            const messageElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
            if (messageElement) {
                this.chatSection.markEditAsConfirmed(messageElement);
            }
        } catch (error) {
            console.error('❌ [SOCKET-HANDLER] Error handling edit confirmation:', error);
        }
    }
    
    handleMessageEditFailed(data) {
        try {
            if (!data || !data.message_id) return;
            

            
            const messageElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
            if (messageElement) {
                this.chatSection.markEditAsFailed(messageElement, data.error);
            }
            
            if (this.chatSection && this.chatSection.showNotification) {
                this.chatSection.showNotification('Failed to edit message: ' + (data.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('❌ [SOCKET-HANDLER] Error handling edit failure:', error);
        }
    }
    
    handleTyping(data) {
        try {

            const userId = data.user_id;
            const username = data.username;
            
            if (!userId || !username || userId === this.chatSection.userId) return;
            
            const isForThisChannel = 
                this.chatSection.chatType === 'channel' && 
                String(data.channel_id) === String(this.chatSection.targetId);
            
            if (isForThisChannel) {
                this.showTypingIndicator(userId, username);
            }
        } catch (error) {
            console.error('❌ [SOCKET-HANDLER] Error handling typing event:', error);
        }
    }
    
    handleStopTyping(data) {
        try {

            const userId = data.user_id;
            if (!userId || userId === this.chatSection.userId) return;
            
            const isForThisChannel = 
                this.chatSection.chatType === 'channel' && 
                String(data.channel_id) === String(this.chatSection.targetId);
            
            if (isForThisChannel) {
                this.removeTypingIndicator(userId);
            }
        } catch (error) {
            console.error('❌ [SOCKET-HANDLER] Error handling stop typing event:', error);
        }
    }
    
    handleTypingDM(data) {
        try {

            const userId = data.user_id;
            const username = data.username;
            
            if (!userId || !username || userId === this.chatSection.userId) return;
            
            const isForThisDM = 
                (this.chatSection.chatType === 'direct' || this.chatSection.chatType === 'dm') && 
                String(data.room_id) === String(this.chatSection.targetId);
            
            if (isForThisDM) {
                this.showTypingIndicator(userId, username);
            }
        } catch (error) {
            console.error('❌ [SOCKET-HANDLER] Error handling DM typing event:', error);
        }
    }
    
    handleStopTypingDM(data) {
        try {

            const userId = data.user_id;
            if (!userId || userId === this.chatSection.userId) return;
            
            const isForThisDM = 
                (this.chatSection.chatType === 'direct' || this.chatSection.chatType === 'dm') && 
                String(data.room_id) === String(this.chatSection.targetId);
            
            if (isForThisDM) {
                this.removeTypingIndicator(userId);
            }
        } catch (error) {
            console.error('❌ [SOCKET-HANDLER] Error handling DM stop typing event:', error);
        }
    }
    
    showTypingIndicator(userId, username) {
        if (!userId || !username) return;
        
        this.typingUsers.set(userId, {
            username,
            timestamp: Date.now()
        });
        
        this.updateTypingIndicatorDisplay();
        

        setTimeout(() => {
            if (this.typingUsers.has(userId)) {
                const typingData = this.typingUsers.get(userId);
                if (Date.now() - typingData.timestamp > 5000) {
                    this.removeTypingIndicator(userId);
                }
            }
        }, 5000);
    }
    
    removeTypingIndicator(userId) {
        if (!userId) return;
        
        this.typingUsers.delete(userId);
        this.updateTypingIndicatorDisplay();
    }
    
    updateTypingIndicatorDisplay() {
        try {
            const typingIndicator = document.getElementById('typing-indicator');
            
            if (!typingIndicator) {
                console.warn('⚠️ [SOCKET-HANDLER] Typing indicator element not found in DOM');
                return;
            }
            
            if (this.typingUsers.size === 0) {
                typingIndicator.classList.add('hidden');
                return;
            }
            
            const typingUsernames = Array.from(this.typingUsers.values())
                .map(data => data.username)
                .slice(0, 3);
            
            let typingMessage = '';
            if (typingUsernames.length === 1) {
                typingMessage = `${typingUsernames[0]} is typing`;
            } else if (typingUsernames.length === 2) {
                typingMessage = `${typingUsernames[0]} and ${typingUsernames[1]} are typing`;
            } else if (typingUsernames.length === 3) {
                typingMessage = `${typingUsernames[0]}, ${typingUsernames[1]}, and ${typingUsernames[2]} are typing`;
            } else {
                typingMessage = `${typingUsernames.length} people are typing`;
            }
            
            typingIndicator.innerHTML = `
                <span>${typingMessage}</span>
                <span class="typing-animation ml-1">
                    <span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
                </span>
            `;
            typingIndicator.classList.remove('hidden');
            

        } catch (error) {
            console.error('❌ [SOCKET-HANDLER] Error updating typing indicator:', error);
        }
    }
    
    joinChannel() {
        try {
            if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
                console.warn('⚠️ Cannot join channel: socket not ready');
                return false;
            }
            
            if (!this.chatSection.targetId) {
                console.warn('⚠️ Cannot join channel: no target ID');
                return false;
            }
            

            
            if (this.chatSection.chatType === 'channel') {
                window.globalSocketManager.joinChannel(this.chatSection.targetId);
                return true;
            } else if (this.chatSection.chatType === 'direct' || this.chatSection.chatType === 'dm') {
                window.globalSocketManager.joinDM(this.chatSection.targetId);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('❌ Error joining channel:', error);
            return false;
        }
    }
    







































    
    isCurrentChat(data) {
        try {
            if (!this.chatSection || !this.chatSection.targetId) {
                return false;
            }
            
            const currentChatType = this.chatSection.chatType;
            const currentTargetId = String(this.chatSection.targetId);
            
            if (data.channel_id) {
                return currentChatType === 'channel' && currentTargetId === String(data.channel_id);
            } else if (data.room_id) {
                return (currentChatType === 'dm' || currentChatType === 'direct') && currentTargetId === String(data.room_id);
            } else if (data.target_type && data.target_id) {
                if (data.target_type === 'channel') {
                    return currentChatType === 'channel' && currentTargetId === String(data.target_id);
                } else if (data.target_type === 'dm') {
                    return (currentChatType === 'dm' || currentChatType === 'direct') && currentTargetId === String(data.target_id);
                }
            }
            
            return false;
        } catch (error) {
            console.error('❌ [SOCKET-HANDLER] Error checking current chat:', error);
            return false;
        }
    }

    refreshForChannelSwitch(newChannelId, newChatType) {
        console.log('🔄 [SOCKET-HANDLER] Refreshing socket handler for channel switch:', {
            newChannelId,
            newChatType,
            socketReady: window.globalSocketManager?.isReady(),
            listenersSetup: this.socketListenersSetup
        });
        
        if (this.chatSection) {
            this.chatSection.targetId = newChannelId;
            this.chatSection.chatType = newChatType;
        }
        
        if (!this.socketListenersSetup && window.globalSocketManager?.isReady()) {

            this.setupSocketHandlers(window.globalSocketManager.io);
        }
        
        if (this.socketListenersSetup && window.globalSocketManager?.isReady()) {

            const io = window.globalSocketManager.io;
            
            io.off('reaction-added');
            io.off('reaction-removed');
            io.off('reaction-confirmed');
            io.off('reaction-failed');
            
            io.on('reaction-added', this.handleReactionAdded.bind(this));
            io.on('reaction-removed', this.handleReactionRemoved.bind(this));
            io.on('reaction-confirmed', (data) => {
                if (window.emojiReactions && typeof window.emojiReactions.handleReactionConfirmed === 'function') {
                    window.emojiReactions.handleReactionConfirmed(data);
                }
            });
            io.on('reaction-failed', (data) => {
                if (window.emojiReactions && typeof window.emojiReactions.handleReactionFailed === 'function') {
                    window.emojiReactions.handleReactionFailed(data);
                }
            });
            

        }
        

    }

    updateBotReplyReferences(tempId, permanentId) {
        try {

            const botReplyElements = document.querySelectorAll(`[data-reply-message-id="${tempId}"]`);
            
            botReplyElements.forEach(replyContainer => {

                

                replyContainer.dataset.replyMessageId = permanentId;
                

                const onclickValue = replyContainer.getAttribute('onclick');
                if (onclickValue && onclickValue.includes(tempId)) {
                    const updatedOnclick = onclickValue.replace(tempId, permanentId);
                    replyContainer.setAttribute('onclick', updatedOnclick);
                }
                

            });
            

            const allReplyContainers = document.querySelectorAll('.bubble-reply-container');
            allReplyContainers.forEach(container => {
                if (container.dataset.replyMessageId === tempId) {
                    container.dataset.replyMessageId = permanentId;
                    
                    const onclickValue = container.getAttribute('onclick');
                    if (onclickValue && onclickValue.includes(tempId)) {
                        const updatedOnclick = onclickValue.replace(tempId, permanentId);
                        container.setAttribute('onclick', updatedOnclick);
                    }
                }
            });
            
        } catch (error) {
            console.error('❌ [SOCKET-HANDLER] Error updating bot reply references:', error);
        }
    }
}

export default SocketHandler;