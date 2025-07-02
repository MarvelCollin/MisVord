class SocketHandler {
    constructor(chatSection) {
        this.chatSection = chatSection;
        this.socketListenersSetup = false;
        this.typingUsers = new Map();
    }

    setupIoListeners() {
        // If socket is not ready, wait for it
        if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
            console.log('⏳ Socket not ready, setting up event listener');
            window.addEventListener('globalSocketReady', this.handleSocketReady.bind(this));
            return;
        }
        
        this.setupSocketHandlers(window.globalSocketManager.io);
    }
    
    handleSocketReady() {
        console.log('🔌 Socket ready event received, setting up handlers');
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
            console.log('⚠️ Socket listeners already setup, skipping');
            return;
        }
        
        console.log('🔌 Setting up socket handlers');
        
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
        io.off('typing');
        io.off('stop-typing');
        io.off('mention_notification');
        
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
        io.on('typing', this.handleTyping.bind(this));
        io.on('stop-typing', this.handleStopTyping.bind(this));
        io.on('mention_notification', this.handleMentionNotification.bind(this));
        
        this.socketListenersSetup = true;
        console.log('✅ Socket handlers setup complete');
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
                console.log('🔄 Skipping duplicate channel message (already processed):', data.id);
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
                console.log('🔄 Skipping duplicate DM message (already processed):', data.id);
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
            
            console.log('🔄 Updating message:', data.message_id);
            
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
            if (!data || !data.message_id) return;
            
            const messageElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
            if (!messageElement) return;
            
            console.log('🗑️ Deleting message:', data.message_id);
            
            // Remove the message from the UI
            const messageGroup = messageElement.closest('.message-group');
            if (messageGroup && messageGroup.querySelectorAll('.message-content').length === 1) {
                messageGroup.remove(); // Remove the whole group if it's the only message
            } else {
                messageElement.remove(); // Otherwise just remove this message
            }
            
            // Clean up tracking
            this.chatSection.messageHandler.processedMessageIds.delete(data.message_id);
        } catch (error) {
            console.error('❌ Error handling message deletion:', error);
        }
    }
    
    handleMessagePinned(data) {
        try {
            if (!data || !data.message_id) return;
            console.log('📌 Message pinned:', data.message_id);
            
            // Add pin icon to message
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
            console.log('📌 Message unpinned:', data.message_id);
            
            // Remove pin icon from message
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
            
            // Find the temporary message element
            const tempElement = document.querySelector(`[data-message-id="${data.temp_message_id}"]`);
            if (tempElement) {
                console.log(`✅ Updating message ID from ${data.temp_message_id} to ${data.real_message_id}`);
                
                // Update the message ID to the real server ID
                tempElement.dataset.messageId = data.real_message_id;
                
                // Remove temporary styling
                tempElement.classList.remove('temporary-message');
                tempElement.classList.remove('bubble-message-temporary');
                
                // Remove any error indicators
                tempElement.classList.remove('message-error');
                tempElement.style.borderLeft = '';
                
                const errorIndicator = tempElement.querySelector('.error-indicator');
                if (errorIndicator) {
                    errorIndicator.remove();
                }
                
                // Update processed IDs if handler exists
                if (this.chatSection.messageHandler) {
                    this.chatSection.messageHandler.processedMessageIds.delete(data.temp_message_id);
                    this.chatSection.messageHandler.processedMessageIds.add(data.real_message_id);
                    
                    // Clean up temporary messages map
                    if (this.chatSection.messageHandler.temporaryMessages) {
                        this.chatSection.messageHandler.temporaryMessages.delete(data.temp_message_id);
                    }
                    
                    // Update message with complete data from database (including reply_data)
                    if (data.message_data && data.message_data.reply_data) {
                        console.log('🔄 [SOCKET-HANDLER] Updating message with reply data from database:', data.message_data.reply_data);
                        
                        // Check if reply container already exists
                        let replyContainer = tempElement.querySelector('.bubble-reply-container');
                        
                        if (!replyContainer && data.message_data.reply_data) {
                            // Create reply container
                            const messageContent = tempElement.querySelector('.bubble-message-content');
                            if (messageContent) {
                                replyContainer = this.chatSection.messageHandler.createReplyContainer(data.message_data);
                                
                                // Insert reply container as the first child
                                const firstChild = messageContent.firstChild;
                                if (firstChild) {
                                    messageContent.insertBefore(replyContainer, firstChild);
                                } else {
                                    messageContent.appendChild(replyContainer);
                                }
                                
                                console.log('✅ [SOCKET-HANDLER] Added reply container to permanent message');
                            }
                        }
                    }
                }
                
                // Re-enable reaction button now that we have a real message ID
                this.updateReactionButtonForPermanentId(tempElement, data.real_message_id);
                
                // Notify emoji reactions system of the ID change
                if (window.emojiReactions) {
                    console.log('🔄 Notifying emoji reactions system of ID change');
                    window.emojiReactions.handleMessageIdUpdated(data.temp_message_id, data.real_message_id);
                }
                
                // Dispatch global event for other systems that might need to know
                window.dispatchEvent(new CustomEvent('messageIdUpdated', {
                    detail: {
                        tempId: data.temp_message_id,
                        realId: data.real_message_id,
                        messageElement: tempElement,
                        messageData: data.message_data
                    }
                }));
                
                console.log(`✅ Successfully updated message ID from ${data.temp_message_id} to ${data.real_message_id}`);
            } else {
                console.log(`⚠️ Temporary message element not found for ID: ${data.temp_message_id}`);
            }

            // Update any bot reply messages that reference this temp ID
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
                
                console.log('🔄 Re-enabled reaction button for permanent message ID:', permanentId);
            }
            
            if (window.emojiReactions && typeof window.emojiReactions.updateReactionButtonState === 'function') {
                console.log('🔄 Updating reaction button state for permanent message ID via emoji system');
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
            
            // Show notification
            if (this.chatSection && this.chatSection.showNotification) {
                this.chatSection.showNotification(data.error || 'Message error occurred', 'error');
            }
            
            // If there's a temp_message_id, mark that message as failed
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
                console.log('🔄 [SOCKET-HANDLER] Ignoring own edit');
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
                    
                    console.log('✅ [SOCKET-HANDLER] Message updated from edit');
                }
            }
        } catch (error) {
            console.error('❌ Error handling edit:', error);
        }
    }
    
    handleMessageEditConfirmed(data) {
        try {
            if (!data || !data.message_id) return;
            
            console.log('✅ [SOCKET-HANDLER] Edit confirmed:', data.message_id);
            
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
            
            console.log('❌ [SOCKET-HANDLER] Edit failed:', data.message_id, data.error);
            
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
            
            this.showTypingIndicator(userId, username);
        } catch (error) {
            console.error('❌ Error handling typing event:', error);
        }
    }
    
    handleStopTyping(data) {
        try {
            const userId = data.user_id;
            if (!userId || userId === this.chatSection.userId) return;
            
            this.removeTypingIndicator(userId);
        } catch (error) {
            console.error('❌ Error handling stop typing event:', error);
        }
    }
    
    showTypingIndicator(userId, username) {
        if (!userId || !username) return;
        
        this.typingUsers.set(userId, {
            username,
            timestamp: Date.now()
        });
        
        this.updateTypingIndicatorDisplay();
        
        // Auto-remove typing indicator after 5 seconds of inactivity
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
            // Get or create typing indicator element
            let typingIndicator = document.getElementById('typing-indicator');
            
            // No typing users, hide the indicator
            if (this.typingUsers.size === 0) {
                if (typingIndicator) {
                    typingIndicator.classList.add('hidden');
                }
                return;
            }
            
            // Create typing indicator if it doesn't exist
            if (!typingIndicator) {
                typingIndicator = document.createElement('div');
                typingIndicator.id = 'typing-indicator';
                typingIndicator.className = 'px-4 py-2 text-xs text-[#a3a6aa]';
                
                // Insert before the message form
                const messageForm = this.chatSection.messageForm;
                if (messageForm && messageForm.parentNode) {
                    messageForm.parentNode.insertBefore(typingIndicator, messageForm);
                }
            }
            
            // Get typing usernames (limit to 3)
            const typingUsernames = Array.from(this.typingUsers.values())
                .map(data => data.username)
                .slice(0, 3);
            
            // Create typing message
            let typingMessage = '';
            if (typingUsernames.length === 1) {
                typingMessage = `${typingUsernames[0]} is typing...`;
            } else if (typingUsernames.length === 2) {
                typingMessage = `${typingUsernames[0]} and ${typingUsernames[1]} are typing...`;
            } else if (typingUsernames.length === 3) {
                typingMessage = `${typingUsernames[0]}, ${typingUsernames[1]}, and ${typingUsernames[2]} are typing...`;
            } else {
                typingMessage = `${typingUsernames.length} people are typing...`;
            }
            
            // Show typing indicator with animation
            typingIndicator.innerHTML = `
                <span>${typingMessage}</span>
                <span class="typing-dots">
                    <span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
                </span>
            `;
            typingIndicator.classList.remove('hidden');
        } catch (error) {
            console.error('❌ Error updating typing indicator:', error);
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
            
            console.log('🔌 Joining channel:', this.chatSection.targetId);
            
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
    
    handleMentionNotification(data) {
        try {
            const currentUserId = window.globalSocketManager?.userId;
            if (!currentUserId) return;
            
            console.log('💬 [SOCKET-HANDLER] Local mention notification received:', data);
            
            const isCurrentChat = this.isCurrentChat(data);
            
            if (data.type === 'all') {
                console.log('📢 [SOCKET-HANDLER] @all mention detected locally');
                if (isCurrentChat && this.chatSection.mentionHandler) {
                    this.chatSection.mentionHandler.handleMentionNotification({
                        ...data,
                        mentions: [{ type: 'all', username: 'all', user_id: 'all' }]
                    });
                }
            } else if (data.type === 'user' && data.mentioned_user_id === currentUserId) {
                console.log('👤 [SOCKET-HANDLER] User mention detected locally for current user');
                if (isCurrentChat && this.chatSection.mentionHandler) {
                    this.chatSection.mentionHandler.handleMentionNotification({
                        ...data,
                        mentions: [{ type: 'user', username: data.mentioned_username, user_id: data.mentioned_user_id }]
                    });
                }
            }
        } catch (error) {
            console.error('❌ [SOCKET-HANDLER] Error handling local mention notification:', error);
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
            console.log('🔄 [SOCKET-HANDLER] Re-setting up socket listeners after channel switch');
            this.setupSocketHandlers(window.globalSocketManager.io);
        }
        
        if (this.socketListenersSetup && window.globalSocketManager?.isReady()) {
            console.log('🔄 [SOCKET-HANDLER] Socket listeners already set up, ensuring reactions handlers are active');
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
            
            console.log('✅ [SOCKET-HANDLER] Reaction handlers refreshed for new channel');
        }
        
        console.log('✅ [SOCKET-HANDLER] Socket handler refreshed for new channel');
    }

    updateBotReplyReferences(tempId, permanentId) {
        try {
            // Find all bot messages that have reply containers referencing the temp ID
            const botReplyElements = document.querySelectorAll(`[data-reply-message-id="${tempId}"]`);
            
            botReplyElements.forEach(replyContainer => {
                console.log(`🤖 [SOCKET-HANDLER] Updating bot reply reference from ${tempId} to ${permanentId}`);
                
                // Update the data attribute
                replyContainer.dataset.replyMessageId = permanentId;
                
                // Update the onclick handler if it exists
                const onclickValue = replyContainer.getAttribute('onclick');
                if (onclickValue && onclickValue.includes(tempId)) {
                    const updatedOnclick = onclickValue.replace(tempId, permanentId);
                    replyContainer.setAttribute('onclick', updatedOnclick);
                }
                
                console.log(`✅ [SOCKET-HANDLER] Updated bot reply reference to permanent ID: ${permanentId}`);
            });
            
            // Also update any reply containers that might have the temp ID in their data
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