class SocketHandler {
    constructor(chatSection) {
        this.chatSection = chatSection;
        this.socketListenersSetup = false;
        this.typingUsers = new Map();
        this.joinedRooms = new Set();
    }

    setupIoListeners() {
        const self = this;
        
        const setupSocketHandlers = function(io) {
            console.log('🔌 [CHAT-SECTION] Setting up socket handlers');
            
            if (self.socketListenersSetup) {
                console.log('⚠️ [CHAT-SECTION] Socket listeners already setup, skipping');
                return;
            }
            
            // Channel message handling
            io.on('new-channel-message', function(data) {
                try {
                    const isSender = data.user_id === window.globalSocketManager?.userId;
                    const expectedRoom = `channel-${self.chatSection.targetId}`;
                    const messageRoom = `channel-${data.channel_id}`;
                    const isForThisChannel = self.chatSection.chatType === 'channel' && messageRoom === expectedRoom;
                    
                    console.log('📨 [CHAT-SECTION] Received new-channel-message:', {
                        id: data.id,
                        userId: data.user_id,
                        username: data.username,
                        channelId: data.channel_id,
                        content: data.content?.substring(0, 50),
                        source: data.source,
                        isSender: isSender,
                        isProcessed: self.chatSection.messageHandler.processedMessageIds.has(data.id),
                        isForThisChannel: isForThisChannel,
                        socketId: io.id,
                        joinedRooms: Array.from(window.globalSocketManager?.joinedRooms || [])
                    });
                    
                    // Log the complete received message data
                    console.log('📦 [CHAT-SECTION] Complete received message data:', JSON.stringify(data, null, 2));
                    
                    if (isForThisChannel) {
                        if (!self.chatSection.messageHandler.processedMessageIds.has(data.id)) {
                            console.log(`✅ [CHAT-SECTION] Adding message ${data.id} to channel ${data.channel_id}`, {
                                isSender: isSender,
                                messageType: data.message_type,
                                timestamp: new Date().toISOString()
                            });
                            self.chatSection.messageHandler.addMessage({...data, source: 'server-originated'});
                            self.chatSection.messageHandler.processedMessageIds.add(data.id);
                            
                            // Dispatch event for message received
                            window.dispatchEvent(new CustomEvent('messageReceived', {
                                detail: {
                                    messageId: data.id,
                                    channelId: data.channel_id,
                                    userId: data.user_id,
                                    isSender: isSender,
                                    timestamp: Date.now()
                                }
                            }));
                        } else {
                            console.log(`🔄 [CHAT-SECTION] Message ${data.id} already processed, skipping`);
                        }
                    } else {
                        console.log(`❌ [CHAT-SECTION] Message not for this channel:`, {
                            expected: expectedRoom,
                            got: messageRoom,
                            chatType: self.chatSection.chatType,
                            targetId: self.chatSection.targetId,
                            joinedRooms: Array.from(window.globalSocketManager?.joinedRooms || [])
                        });
                    }
                } catch (error) {
                    console.error('❌ [CHAT-SECTION] Error handling new-channel-message:', error);
                }
            });
            
            // DM message handling
            io.on('user-message-dm', function(data) {
                try {
                    console.log('📨 [CHAT-SECTION] Received user-message-dm:', {
                        id: data.id,
                        userId: data.user_id,
                        username: data.username,
                        roomId: data.room_id,
                        source: data.source,
                        isProcessed: self.chatSection.messageHandler.processedMessageIds.has(data.id)
                    });
                    
                    // Use strict comparison and check room format
                    const expectedRoom = `dm-room-${self.chatSection.targetId}`;
                    const messageRoom = `dm-room-${data.room_id}`;
                    
                    if ((self.chatSection.chatType === 'direct' || self.chatSection.chatType === 'dm') && messageRoom === expectedRoom) {
                        if (!self.chatSection.messageHandler.processedMessageIds.has(data.id)) {
                            console.log(`✅ [CHAT-SECTION] Adding message ${data.id} to DM room ${data.room_id}`);
                            self.chatSection.messageHandler.addMessage({...data, source: 'server-originated'});
                            self.chatSection.messageHandler.processedMessageIds.add(data.id);
                        } else {
                            console.log(`🔄 [CHAT-SECTION] Message ${data.id} already processed, skipping`);
                        }
                    } else {
                        console.log(`❌ [CHAT-SECTION] Message not for this DM. Expected: ${expectedRoom}, Got: ${messageRoom}`);
                    }
                } catch (error) {
                    console.error('❌ [CHAT-SECTION] Error handling user-message-dm:', error);
                }
            });
            
            // Reaction handling with improved error handling
            io.on('reaction-added', function(data) {
                try {
                    if (data.message_id) {
                        const messageElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
                        if (messageElement) {
                            self.handleReactionAdded(data);
                        } else {
                            console.warn(`⚠️ [CHAT-SECTION] Message element not found for reaction: ${data.message_id}`);
                        }
                    }
                } catch (error) {
                    console.error('❌ [CHAT-SECTION] Error handling reaction-added:', error);
                }
            });
            
            io.on('reaction-removed', function(data) {
                try {
                    if (data.message_id) {
                        const messageElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
                        if (messageElement) {
                            self.handleReactionRemoved(data);
                        } else {
                            console.warn(`⚠️ [CHAT-SECTION] Message element not found for reaction removal: ${data.message_id}`);
                        }
                    }
                } catch (error) {
                    console.error('❌ [CHAT-SECTION] Error handling reaction-removed:', error);
                }
            });
            
            io.on('message-updated', function(data) {
                try {
                    if (data.message_id) {
                        const messageElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
                        if (messageElement) {
                            self.handleMessageUpdated(data);
                        } else {
                            console.warn(`⚠️ [CHAT-SECTION] Message element not found for update: ${data.message_id}`);
                        }
                    }
                } catch (error) {
                    console.error('❌ [CHAT-SECTION] Error handling message-updated:', error);
                }
            });
            
            io.on('message-deleted', function(data) {
                try {
                    if (data.message_id) {
                        const messageElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
                        if (messageElement) {
                            self.handleMessageDeleted(data);
                        } else {
                            console.warn(`⚠️ [CHAT-SECTION] Message element not found for deletion: ${data.message_id}`);
                        }
                    }
                } catch (error) {
                    console.error('❌ [CHAT-SECTION] Error handling message-deleted:', error);
                }
            });
            
            // Typing indicators
            io.on('user-typing', function(data) {
                try {
                    if (self.chatSection.chatType === 'channel' && data.channel_id == self.chatSection.targetId && data.user_id != self.chatSection.userId) {
                        self.showTypingIndicator(data.user_id, data.username);
                    }
                } catch (error) {
                    console.error('❌ [CHAT-SECTION] Error handling user-typing:', error);
                }
            });
            
            io.on('user-typing-dm', function(data) {        
                try {
                    if ((self.chatSection.chatType === 'direct' || self.chatSection.chatType === 'dm') && data.room_id == self.chatSection.targetId && data.user_id != self.chatSection.userId) {
                        self.showTypingIndicator(data.user_id, data.username);
                    }
                } catch (error) {
                    console.error('❌ [CHAT-SECTION] Error handling user-typing-dm:', error);
                }
            });
            
            io.on('user-stop-typing', function(data) {
                try {
                    if (self.chatSection.chatType === 'channel' && data.channel_id == self.chatSection.targetId && data.user_id != self.chatSection.userId) {
                        self.removeTypingIndicator(data.user_id);
                    }
                } catch (error) {
                    console.error('❌ [CHAT-SECTION] Error handling user-stop-typing:', error);
                }
            });
            
            io.on('user-stop-typing-dm', function(data) {
                try {
                    if ((self.chatSection.chatType === 'direct' || self.chatSection.chatType === 'dm') && data.room_id == self.chatSection.targetId && data.user_id != self.chatSection.userId) {
                        self.removeTypingIndicator(data.user_id);
                    }
                } catch (error) {
                    console.error('❌ [CHAT-SECTION] Error handling user-stop-typing-dm:', error);
                }
            });

            self.socketListenersSetup = true;
            console.log('✅ [CHAT-SECTION] Socket listeners setup complete');
        };
        
        // Check if socket is ready
        if (window.globalSocketManager && window.globalSocketManager.isReady() && window.globalSocketManager.io) {
            console.log('Socket is ready, setting up handlers immediately');
            setupSocketHandlers(window.globalSocketManager.io);
            
            // Join appropriate room using unified method
            this.joinChannel();
        } else {
            console.log('Socket not ready, waiting for socketAuthenticated event');
            
            // Listen for socket ready event
            const socketReadyHandler = (event) => {
                console.log('Socket authenticated event received in ChatSection');
                if (event.detail && event.detail.manager && event.detail.manager.io) {
                    setupSocketHandlers(event.detail.manager.io);
                    
                    // Join appropriate room using unified method
                    this.joinChannel();
                    
                    // Remove the event listener since we only need it once
                    window.removeEventListener('socketAuthenticated', socketReadyHandler);
                }
            };
            
            window.addEventListener('socketAuthenticated', socketReadyHandler);
            
            // Also try again in a few seconds in case the event was missed
            setTimeout(() => {
                if (!self.socketListenersSetup && window.globalSocketManager && window.globalSocketManager.isReady()) {
                    console.log('Retry: Setting up socket handlers after delay');
                    setupSocketHandlers(window.globalSocketManager.io);
                    
                    // Join appropriate room using unified method
                    self.joinChannel();
                }
            }, 3000);
        }
    }
    
    handleMessageUpdated(data) {
        const messageElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
        if (messageElement) {
            const messageTextElement = messageElement.querySelector('.message-main-text');
            if (messageTextElement && data.message && data.message.content) {
                messageTextElement.innerHTML = this.chatSection.formatMessageContent(data.message.content);
                
                let editedBadge = messageElement.querySelector('.edited-badge');
                if (!editedBadge) {
                    editedBadge = document.createElement('span');
                    editedBadge.className = 'edited-badge text-xs text-[#a3a6aa] ml-1';
                    editedBadge.textContent = '(edited)';
                    messageTextElement.appendChild(editedBadge);
                }
            }
        }
    }
    
    handleMessageDeleted(data) {
        const messageId = data.message_id;
        
        if (messageId) {
            const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
            
            if (messageElement) {
                const messageGroup = messageElement.closest('.message-group');
                
                if (messageGroup && messageGroup.querySelectorAll('.message-content').length === 1) {
                    messageGroup.remove();
                } else {
                    messageElement.remove();
                }
                
                this.chatSection.messageHandler.processedMessageIds.delete(messageId);
                
                const remainingMessages = this.chatSection.getMessagesContainer().querySelectorAll('.message-group');
                if (remainingMessages.length === 0) {
                    this.chatSection.showEmptyState();
                }
            }
        }
    }
    
    handleMessagePinned(data) {
        const messageId = data.message_id;
        const username = data.username || 'Someone';
        
        // Add visual indicator to the message
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            let pinIndicator = messageElement.querySelector('.pin-indicator');
            if (!pinIndicator) {
                pinIndicator = document.createElement('div');
                pinIndicator.className = 'pin-indicator text-xs text-[#faa61a] flex items-center mt-1';
                pinIndicator.innerHTML = '<i class="fas fa-thumbtack mr-1"></i>Pinned by ' + username;
                messageElement.appendChild(pinIndicator);
            }
        }
        
        // Show notification
        this.chatSection.showNotification(`Message pinned by ${username}`, 'info');
        
        console.log(`📌 Message ${messageId} pinned by ${username}`);
    }
    
    handleMessageUnpinned(data) {
        const messageId = data.message_id;
        const username = data.username || 'Someone';
        
        // Remove visual indicator from the message
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            const pinIndicator = messageElement.querySelector('.pin-indicator');
            if (pinIndicator) {
                pinIndicator.remove();
            }
        }
        
        // Show notification
        this.chatSection.showNotification(`Message unpinned by ${username}`, 'info');
        
        console.log(`📌 Message ${messageId} unpinned by ${username}`);
    }
    
    joinChannel() {
        if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
            console.warn('Socket not ready for room joining');
            return;
        }

        const roomType = this.chatSection.chatType === 'channel' ? 'channel' : 'dm';
        let roomId = this.chatSection.targetId;
        
        // Strip any prefix from room ID to ensure consistency
        if (roomType === 'dm' && roomId.startsWith('dm-room-')) {
            roomId = roomId.replace('dm-room-', '');
            console.log(`🔄 [CHAT-SECTION] Normalized DM room ID: ${roomId}`);
        }
        
        // Use the correct room format for tracking
        const roomName = roomType === 'channel' ? `channel-${roomId}` : `dm-room-${roomId}`;
        
        if (!window.globalSocketManager.joinedRooms.has(roomName)) {
            console.log(`🚪 [CHAT-SECTION] Joining room: ${roomType} - ${roomId} (${roomName})`);
            
            // Join the room and wait for confirmation
            window.globalSocketManager.joinRoom(roomType, roomId);
            
            // Listen for room join confirmation
            window.globalSocketManager.io.once('room-joined', (data) => {
                console.log(`✅ [CHAT-SECTION] Successfully joined ${roomType} room: ${roomName}`, data);
                window.globalSocketManager.joinedRooms.add(roomName);
                
                // Force join again if this is a DM room to ensure both users are in the same room
                if (roomType === 'dm') {
                    console.log(`🔄 [CHAT-SECTION] Force joining DM room again to ensure connection: ${roomId}`);
                    window.globalSocketManager.io.emit('join-room', { room_type: 'dm', room_id: roomId });
                }
            });
        } else {
            console.log(`🔄 [CHAT-SECTION] Already joined ${roomType} room: ${roomName}`);
            
            // Force join again if this is a DM room to ensure both users are in the same room
            if (roomType === 'dm') {
                console.log(`🔄 [CHAT-SECTION] Force joining DM room again to ensure connection: ${roomId}`);
                window.globalSocketManager.io.emit('join-room', { room_type: 'dm', room_id: roomId });
            }
        }
    }
    
    showTypingIndicator(userId, username) {
        if (userId === this.chatSection.userId) return;
        
        this.typingUsers.set(userId, {
            username,
            timestamp: Date.now()
        });
        
        this.updateTypingIndicatorDisplay();
    }
    
    removeTypingIndicator(userId) {
        this.typingUsers.delete(userId);
        this.updateTypingIndicatorDisplay();
    }
    
    updateTypingIndicatorDisplay() {
        let typingIndicator = document.getElementById('typing-indicator');
        
        if (this.typingUsers.size === 0) {
            if (typingIndicator) {
                typingIndicator.classList.add('hidden');
            }
            return;
        }
        
        if (!typingIndicator) {
            typingIndicator = document.createElement('div');
            typingIndicator.id = 'typing-indicator';
            typingIndicator.className = 'text-xs text-[#b5bac1] pb-1 pl-5 flex items-center';
            
            const dotsContainer = document.createElement('div');
            dotsContainer.className = 'flex items-center mr-2';
            
            const dot1 = document.createElement('span');
            dot1.className = 'h-1 w-1 bg-[#b5bac1] rounded-full animate-bounce mr-0.5';
            dot1.style.animationDelay = '0ms';
            
            const dot2 = document.createElement('span');
            dot2.className = 'h-1 w-1 bg-[#b5bac1] rounded-full animate-bounce mx-0.5';
            dot2.style.animationDelay = '200ms';
            
            const dot3 = document.createElement('span');
            dot3.className = 'h-1 w-1 bg-[#b5bac1] rounded-full animate-bounce ml-0.5';
            dot3.style.animationDelay = '400ms';
            
            const textElement = document.createElement('span');
            
            dotsContainer.appendChild(dot1);
            dotsContainer.appendChild(dot2);
            dotsContainer.appendChild(dot3);
            
            typingIndicator.appendChild(dotsContainer);
            typingIndicator.appendChild(textElement);
            
            if (this.chatSection.chatMessages) {
                const messageForm = document.getElementById('message-form');
                if (messageForm) {
                    messageForm.parentNode.insertBefore(typingIndicator, messageForm);
                } else {
                    this.chatSection.chatMessages.appendChild(typingIndicator);
                }
            }
        }
        
        typingIndicator.classList.remove('hidden');
        
        const textElement = typingIndicator.querySelector('span:not(.h-1)');
        if (textElement) {
            if (this.typingUsers.size === 1) {
                const [user] = this.typingUsers.values();
                textElement.textContent = `${user.username} is typing...`;
            } else if (this.typingUsers.size === 2) {
                const usernames = [...this.typingUsers.values()].map(user => user.username);
                textElement.textContent = `${usernames.join(' and ')} are typing...`;
            } else {
                textElement.textContent = `Several people are typing...`;
            }
        }
        
        this.chatSection.scrollToBottom();
    }
    
    handleReactionAdded(data) {
        if (!data.message_id || !data.emoji) return;
        
        if (window.emojiReactions && typeof window.emojiReactions.handleReactionAdded === 'function') {
            window.emojiReactions.handleReactionAdded(data);
        } else {
            console.warn('emojiReactions not available for reaction update');
        }
    }
    
    handleReactionRemoved(data) {
        if (!data.message_id || !data.emoji) return;
        
        if (window.emojiReactions && typeof window.emojiReactions.handleReactionRemoved === 'function') {
            window.emojiReactions.handleReactionRemoved(data);
        } else {
            console.warn('emojiReactions not available for reaction update');
        }
    }
}

export default SocketHandler; 