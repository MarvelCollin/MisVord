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
        
        // Channel message handler
        io.on('new-channel-message', this.handleChannelMessage.bind(this));
        
        // DM message handler
        io.on('user-message-dm', this.handleDMMessage.bind(this));
        
        // Standard message events
        io.on('reaction-added', this.handleReactionAdded.bind(this));
        io.on('reaction-removed', this.handleReactionRemoved.bind(this));
        io.on('message-updated', this.handleMessageUpdated.bind(this));
        io.on('message-deleted', this.handleMessageDeleted.bind(this));
        io.on('message-pinned', this.handleMessagePinned.bind(this));
        io.on('message-unpinned', this.handleMessageUnpinned.bind(this));
        
        // Message ID update handler (for converting temporary IDs to permanent)
        io.on('message-id-updated', this.handleMessageIdUpdated.bind(this));
        
        // Typing indicators
        io.on('typing', this.handleTyping.bind(this));
        io.on('stop-typing', this.handleStopTyping.bind(this));
        
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
            
            // Skip if not for current channel
            if (!isForThisChannel) {
                return;
            }
            
            // Skip if this is the sender's own message from any client-originated or websocket-originated source
            if (isSender && (data.source === 'client-originated' || data.source === 'websocket-originated')) {
                console.log('🔄 Skipping own message from sender:', data.id, 'source:', data.source);
                return;
            }
            
            // Check for duplicates
            const alreadySent = window._sentMessageIds && window._sentMessageIds.has(data.id);
            const alreadyProcessed = this.chatSection.messageHandler.processedMessageIds.has(data.id);
            
            if (alreadySent || alreadyProcessed) {
                console.log('🔄 Skipping duplicate channel message:', data.id);
                return;
            }
            
            console.log('📥 Received channel message:', {
                id: data.id,
                channelId: data.channel_id,
                fromSelf: isSender,
                source: data.source
            });
            
            // Add the message to UI
            this.chatSection.messageHandler.addMessage({...data, source: 'server-originated'});
            
            // Play sound if message is from someone else
            if (!isSender) {
                this.chatSection.playMessageSound();
            }
            
            // Notify other components
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
            
            // Skip if not for current DM
            if (!isForThisDM) {
                return;
            }
            
            // Skip if this is the sender's own message from any client-originated or websocket-originated source
            if (isSender && (data.source === 'client-originated' || data.source === 'websocket-originated')) {
                console.log('🔄 Skipping own message from sender:', data.id, 'source:', data.source);
                return;
            }
            
            // Check for duplicates
            const alreadySent = window._sentMessageIds && window._sentMessageIds.has(data.id);
            const alreadyProcessed = this.chatSection.messageHandler.processedMessageIds.has(data.id);
            
            if (alreadySent || alreadyProcessed) {
                console.log('🔄 Skipping duplicate DM message:', data.id);
                return;
            }
            
            console.log('📥 Received DM message:', {
                id: data.id,
                roomId: data.room_id,
                fromSelf: isSender,
                source: data.source
            });
            
            // Add the message to UI
            this.chatSection.messageHandler.addMessage({...data, source: 'server-originated'});
            
            // Play sound if message is from someone else
            if (!isSender) {
                this.chatSection.playMessageSound();
            }
            
            // Notify other components
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
            
            const messageTextElement = messageElement.querySelector('.message-main-text');
            if (messageTextElement && data.content) {
                messageTextElement.innerHTML = this.chatSection.formatMessageContent(data.content);
                
                // Add edited indicator if not present
                let editedBadge = messageElement.querySelector('.edited-badge');
                if (!editedBadge) {
                    editedBadge = document.createElement('span');
                    editedBadge.className = 'edited-badge text-xs text-[#a3a6aa] ml-1';
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
                tempElement.style.opacity = '1';
                
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
                }
                
                console.log(`✅ Successfully updated message ID from ${data.temp_message_id} to ${data.real_message_id}`);
            } else {
                console.log(`⚠️ Temporary message element not found for ID: ${data.temp_message_id}`);
            }
        } catch (error) {
            console.error('❌ Error handling message ID update:', error);
        }
    }
    
    handleReactionAdded(data) {
        try {
            if (!data || !data.message_id || !data.emoji) return;
            
            console.log('👍 Reaction added:', {
                messageId: data.message_id,
                emoji: data.emoji
            });
            
            // Use the global emoji reaction handler if available
            if (window.emojiReactions && typeof window.emojiReactions.addReactionToMessage === 'function') {
                window.emojiReactions.addReactionToMessage(
                    data.message_id, 
                    data.emoji, 
                    data.user_id, 
                    data.username
                );
            }
        } catch (error) {
            console.error('❌ Error handling reaction add:', error);
        }
    }
    
    handleReactionRemoved(data) {
        try {
            if (!data || !data.message_id || !data.emoji) return;
            
            console.log('👎 Reaction removed:', {
                messageId: data.message_id,
                emoji: data.emoji
            });
            
            // Use the global emoji reaction handler if available
            if (window.emojiReactions && typeof window.emojiReactions.removeReactionFromMessage === 'function') {
                window.emojiReactions.removeReactionFromMessage(
                    data.message_id, 
                    data.emoji, 
                    data.user_id
                );
            }
        } catch (error) {
            console.error('❌ Error handling reaction removal:', error);
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
}

export default SocketHandler; 