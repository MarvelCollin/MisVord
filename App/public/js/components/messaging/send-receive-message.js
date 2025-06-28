class SendReceiveMessage {
    constructor(chatSection) {
        this.chatSection = chatSection;
        this.messageInput = null;
        this.sendButton = null;
        this.processedMessageIds = new Set();
        this.typingTimeout = null;
        this.lastTypingUpdate = 0;
        this.typingDebounceTime = 2000;
        this.typingUsers = new Map();
        this.socketListenersSetup = false;
        
        this.chatType = null;
        this.targetId = null;
        this.userId = null;
        this.username = null;
        this.avatar_url = null;
        
        this.loadChatParams();
        this.loadElements();
    }
    
    loadChatParams() {
        this.chatType = document.querySelector('meta[name="chat-type"]')?.content || 'channel';
        this.targetId = document.querySelector('meta[name="chat-id"]')?.content;
        this.userId = document.querySelector('meta[name="user-id"]')?.content;
        this.username = document.querySelector('meta[name="username"]')?.content;
        
        console.log(`SendReceiveMessage parameters loaded: type=${this.chatType}, target_id=${this.targetId}, user_id=${this.userId}`);
    }
    
    loadElements() {
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        
        if (!this.messageInput) {
            console.error('Message input not found');
        }
        
        if (!this.sendButton) {
            console.error('Send button not found');
        }
    }
    
    init() {
        this.setupEventListeners();
        this.setupSocketListeners();
    }
    
    setupEventListeners() {
        if (this.messageInput) {
            this.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                } else if (e.key === 'Escape' && this.chatSection.chatBot) {
                    this.chatSection.chatBot.hideTitiBotSuggestions();
                } else {
                    this.handleTyping();
                }
            });
            
            this.messageInput.addEventListener('input', () => {
                this.resizeTextarea();
                this.updateSendButton();
            });
        }
        
        if (this.sendButton) {
            this.sendButton.addEventListener('click', () => {
                this.sendMessage();
            });
        }
    }
    
    async sendMessage() {
        console.log('🚀 Starting sendMessage process...');
        
        if (!this.messageInput || !this.messageInput.value.trim()) {
            console.log('❌ Message input is empty or invalid');
            return;
        }
        
        const content = this.messageInput.value.trim();
        const messageId = `temp-${Date.now()}`;
        const timestamp = Date.now();

        console.log('📝 Message details:', {
            messageId,
            content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
            timestamp,
            chatType: this.chatType,
            targetId: this.targetId
        });

        try {
            console.log('🔄 Creating message data object...');
            const messageData = {
                id: messageId,
                content: content,
                user_id: this.userId,
                username: this.username,
                avatar_url: this.avatar_url,
                timestamp: timestamp,
                source: 'client-originated'
            };
            
            if (this.chatType === 'channel') {
                messageData.channel_id = this.targetId;
            } else {
                messageData.room_id = this.targetId;
            }

            if (this.chatSection.activeReplyingTo) {
                messageData.reply_message_id = this.chatSection.activeReplyingTo.messageId;
                messageData.reply_data = {
                    username: this.chatSection.activeReplyingTo.username,
                    content: this.chatSection.activeReplyingTo.content
                };
            }

            console.log('🔌 Checking socket manager state...');
            if (window.globalSocketManager && window.globalSocketManager.isReady()) {
                const eventName = this.chatType === 'channel' ? 'new-channel-message' : 'user-message-dm';
                console.log(`📤 Emitting socket event: ${eventName}`, {
                    chatType: this.chatType,
                    targetId: this.targetId,
                    messageId: messageData.id
                });
                const emitResult = window.globalSocketManager.emitToRoom(eventName, messageData, this.chatType, this.targetId);
                console.log(`📨 Socket emit result: ${emitResult ? 'success' : 'failed'}`);
            } else {
                console.warn('⚠️ Socket not ready:', {
                    socketExists: !!window.globalSocketManager,
                    isReady: window.globalSocketManager?.isReady()
                });
            }

            console.log('🔄 Preparing API call...');
            if (!window.ChatAPI) {
                console.error('❌ ChatAPI not initialized');
                throw new Error('ChatAPI not initialized');
            }

            const options = {
                message_type: 'text'
            };

            if (this.chatSection.activeReplyingTo) {
                options.reply_message_id = this.chatSection.activeReplyingTo.messageId;
            }

            console.log('📡 Sending message via API...', {
                targetId: this.targetId,
                chatType: this.chatType,
                options
            });

            try {
                const apiResponse = await window.ChatAPI.sendMessage(
                    this.targetId,
                    content,
                    this.chatType,
                    options
                );
                console.log('✅ API call successful:', apiResponse);

                let permanentMessageId = null;
                
                if (apiResponse.data?.message_id) {
                    permanentMessageId = apiResponse.data.message_id;
                } else if (apiResponse.data?.id) {
                    permanentMessageId = apiResponse.data.id;
                } else if (apiResponse.data?.message?.id) {
                    permanentMessageId = apiResponse.data.message.id;
                } else if (apiResponse.data?.data?.message?.id) {
                    permanentMessageId = apiResponse.data.data.message.id;
                }
                
                if (!permanentMessageId) {
                    console.error('❌ API response missing message ID:', {
                        responseKeys: Object.keys(apiResponse),
                        dataKeys: apiResponse.data ? Object.keys(apiResponse.data) : 'No data object',
                        possibleIds: {
                            'data.message_id': apiResponse.data?.message_id,
                            'data.id': apiResponse.data?.id,
                            'data.message.id': apiResponse.data?.message?.id,
                            'data.data.message.id': apiResponse.data?.data?.message?.id
                        }
                    });
                    
                    permanentMessageId = `api-${Date.now()}`;
                    console.warn(`⚠️ Using fallback message ID: ${permanentMessageId}`);
                }
                
                console.log('🔄 Updating message ID:', {
                    from: messageId,
                    to: permanentMessageId
                });

                const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
                if (messageElement) {
                    messageElement.setAttribute('data-message-id', permanentMessageId);
                    console.log('✅ Updated message element ID in DOM');
                }

                if (window.globalSocketManager && window.globalSocketManager.isReady()) {
                    const updatedMessageData = {
                        ...messageData,
                        id: permanentMessageId,
                        message_id: permanentMessageId
                    };
                    const eventName = this.chatType === 'channel' ? 'new-channel-message' : 'user-message-dm';
                    window.globalSocketManager.emitToRoom(eventName, updatedMessageData, this.chatType, this.targetId);
                    console.log('✅ Re-emitted socket event with permanent ID');
                }
            } catch (apiError) {
                console.error('❌ API call failed:', apiError);
                throw apiError;
            }

            this.messageInput.value = '';
            this.updateSendButton();
            this.resizeTextarea();
            
            if (this.chatSection.activeReplyingTo) {
                console.log('↩️ Clearing reply context');
                this.chatSection.cancelReply();
            }

            this.sendStopTyping();
            console.log('✨ Message send process completed successfully');

        } catch (error) {
            console.error('❌ Failed to send message:', error);
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack,
                chatType: this.chatType,
                targetId: this.targetId
            });
            this.showErrorMessage('Failed to send message. Please try again.');
        }
    }
    
    handleTyping() {
        const now = Date.now();
        
        if (now - this.lastTypingUpdate > this.typingDebounceTime) {
            this.lastTypingUpdate = now;
            
            if (window.globalSocketManager && window.globalSocketManager.isReady()) {
                if (this.chatType === 'channel') {
                    window.globalSocketManager.sendTyping(this.targetId);
                } else if (this.chatType === 'direct' || this.chatType === 'dm') {
                    window.globalSocketManager.sendTyping(null, this.targetId);
                }
            }
        }
        
        this.resetTypingTimeout();
    }
    
    resetTypingTimeout() {
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }
        
        this.typingTimeout = setTimeout(() => {
            this.sendStopTyping();
        }, 3000);
    }
    
    sendStopTyping() {
        if (window.globalSocketManager && window.globalSocketManager.isReady()) {
            if (this.chatType === 'channel') {
                window.globalSocketManager.sendStopTyping(this.targetId);
            } else if (this.chatType === 'direct' || this.chatType === 'dm') {
                window.globalSocketManager.sendStopTyping(null, this.targetId);
            }
        }
    }
    
    showTypingIndicator(userId, username) {
        if (userId === this.userId) return;
        
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
    
    updateSendButton() {
        if (!this.sendButton) return;
        
        const hasContent = (this.messageInput && this.messageInput.value.trim().length > 0) || 
                          this.chatSection.currentFileUpload || 
                          (this.chatSection.currentFileUploads && this.chatSection.currentFileUploads.length > 0);
        
        if (hasContent) {
            this.sendButton.disabled = false;
            this.sendButton.classList.add('text-white');
            this.sendButton.classList.add('bg-[#5865f2]');
            this.sendButton.classList.add('rounded-full');
        } else {
            this.sendButton.disabled = true;
            this.sendButton.classList.remove('text-white');
            this.sendButton.classList.remove('bg-[#5865f2]');
            this.sendButton.classList.remove('rounded-full');
        }
    }
    
    resizeTextarea() {
        if (!this.messageInput) return;
        
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 200) + 'px';
    }
    
    async addMessage(message) {
        if (!message || !message.id) {
            console.error('❌ [SEND-RECEIVE] Invalid message data:', message);
            return;
        }
        
        console.log('📨 [SEND-RECEIVE] Processing message:', {
            id: message.id,
            userId: message.user_id,
            username: message.username,
            content: message.content?.substring(0, 50) + (message.content?.length > 50 ? '...' : ''),
            source: message.source,
            isProcessed: this.processedMessageIds.has(message.id)
        });
        
        if (message.id && message.id.startsWith('temp-')) {
            const tempElement = document.querySelector(`[data-message-id="${message.id}"]`);
            if (tempElement) {
                console.log(`🔄 [SEND-RECEIVE] Replacing temporary message ${message.id}`);
                tempElement.remove();
                this.processedMessageIds.delete(message.id);
            }
        }
        
        if (message.source === 'server-originated' || !this.processedMessageIds.has(message.id)) {
            this.processedMessageIds.add(message.id);
            await this.chatSection.addMessage(message);
        } else {
            console.log(`⏭️ [SEND-RECEIVE] Skipping duplicate message:`, {
                id: message.id,
                source: message.source
            });
        }
    }
    
    setupSocketListeners() {
        const self = this;
        
        const setupSocketHandlers = function(io) {
            console.log('🔌 [SEND-RECEIVE] Setting up socket handlers');
            
            if (self.socketListenersSetup) {
                console.log('⚠️ [SEND-RECEIVE] Socket listeners already setup, skipping');
                return;
            }
            
            io.on('new-channel-message', function(data) {
                try {
                    console.log('📨 [SEND-RECEIVE] Received new-channel-message:', {
                        id: data.id,
                        userId: data.user_id,
                        username: data.username,
                        channelId: data.channel_id,
                        source: data.source
                    });
                    
                    const expectedRoom = `channel-${self.targetId}`;
                    const messageRoom = `channel-${data.channel_id}`;
                    
                    if (self.chatType === 'channel' && messageRoom === expectedRoom) {
                        if (!self.processedMessageIds.has(data.id)) {
                            console.log(`✅ [SEND-RECEIVE] Adding message ${data.id} to channel ${data.channel_id}`);
                            self.addMessage({...data, source: 'server-originated'});
                        } else {
                            console.log(`🔄 [SEND-RECEIVE] Message ${data.id} already processed, skipping`);
                        }
                    } else {
                        console.log(`❌ [SEND-RECEIVE] Message not for this channel. Expected: ${expectedRoom}, Got: ${messageRoom}`);
                    }
                } catch (error) {
                    console.error('❌ [SEND-RECEIVE] Error handling new-channel-message:', error);
                }
            });
            
            io.on('user-message-dm', function(data) {
                try {
                    console.log('📨 [SEND-RECEIVE] Received user-message-dm:', {
                        id: data.id,
                        userId: data.user_id,
                        username: data.username,
                        roomId: data.room_id,
                        source: data.source
                    });
                    
                    const expectedRoom = `dm-room-${self.targetId}`;
                    const messageRoom = `dm-room-${data.room_id}`;
                    
                    if ((self.chatType === 'direct' || self.chatType === 'dm') && messageRoom === expectedRoom) {
                        if (!self.processedMessageIds.has(data.id)) {
                            console.log(`✅ [SEND-RECEIVE] Adding message ${data.id} to DM room ${data.room_id}`);
                            self.addMessage({...data, source: 'server-originated'});
                        } else {
                            console.log(`🔄 [SEND-RECEIVE] Message ${data.id} already processed, skipping`);
                        }
                    } else {
                        console.log(`❌ [SEND-RECEIVE] Message not for this DM. Expected: ${expectedRoom}, Got: ${messageRoom}`);
                    }
                } catch (error) {
                    console.error('❌ [SEND-RECEIVE] Error handling user-message-dm:', error);
                }
            });
            
            io.on('user-typing', function(data) {
                try {
                    if (self.chatType === 'channel' && data.channel_id == self.targetId && data.user_id != self.userId) {
                        self.showTypingIndicator(data.user_id, data.username);
                    }
                } catch (error) {
                    console.error('❌ [SEND-RECEIVE] Error handling user-typing:', error);
                }
            });
            
            io.on('user-typing-dm', function(data) {        
                try {
                    if ((self.chatType === 'direct' || self.chatType === 'dm') && data.room_id == self.targetId && data.user_id != self.userId) {
                        self.showTypingIndicator(data.user_id, data.username);
                    }
                } catch (error) {
                    console.error('❌ [SEND-RECEIVE] Error handling user-typing-dm:', error);
                }
            });
            
            io.on('user-stop-typing', function(data) {
                try {
                    if (self.chatType === 'channel' && data.channel_id == self.targetId && data.user_id != self.userId) {
                        self.removeTypingIndicator(data.user_id);
                    }
                } catch (error) {
                    console.error('❌ [SEND-RECEIVE] Error handling user-stop-typing:', error);
                }
            });
            
            io.on('user-stop-typing-dm', function(data) {
                try {
                    if ((self.chatType === 'direct' || self.chatType === 'dm') && data.room_id == self.targetId && data.user_id != self.userId) {
                        self.removeTypingIndicator(data.user_id);
                    }
                } catch (error) {
                    console.error('❌ [SEND-RECEIVE] Error handling user-stop-typing-dm:', error);
                }
            });

            self.socketListenersSetup = true;
            console.log('✅ [SEND-RECEIVE] Socket listeners setup complete');
        };
        
        if (window.globalSocketManager && window.globalSocketManager.isReady() && window.globalSocketManager.io) {
            console.log('Socket is ready, setting up handlers immediately');
            setupSocketHandlers(window.globalSocketManager.io);
            
            this.joinChannel();
        } else {
            console.log('Socket not ready, waiting for socketAuthenticated event');
            
            const socketReadyHandler = (event) => {
                console.log('Socket authenticated event received in SendReceiveMessage');
                if (event.detail && event.detail.manager && event.detail.manager.io) {
                    setupSocketHandlers(event.detail.manager.io);
                    
                    this.joinChannel();
                    
                    window.removeEventListener('socketAuthenticated', socketReadyHandler);
                }
            };
            
            window.addEventListener('socketAuthenticated', socketReadyHandler);
            
            setTimeout(() => {
                if (!self.socketListenersSetup && window.globalSocketManager && window.globalSocketManager.isReady()) {
                    console.log('Retry: Setting up socket handlers after delay');
                    setupSocketHandlers(window.globalSocketManager.io);
                    
                    self.joinChannel();
                }
            }, 3000);
        }
    }
    
    joinChannel() {
        if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
            console.warn('Socket not ready for room joining');
            return;
        }

        const roomType = this.chatType === 'channel' ? 'channel' : 'dm';
        const roomId = this.targetId;
        
        const roomName = roomType === 'channel' ? `channel-${roomId}` : `dm-room-${roomId}`;
        
        if (!window.globalSocketManager.isInRoom(roomName)) {
            console.log(`🚪 Joining room: ${roomType} - ${roomId} (${roomName})`);
            
            const success = window.globalSocketManager.joinRoom(roomType, roomId);
            
            if (success) {
                console.log(`✅ Successfully requested to join ${roomType} room: ${roomName}`);
            } else {
                console.error(`❌ Failed to join ${roomType} room: ${roomName}`);
            }
        } else {
            console.log(`Already joined ${roomType} room: ${roomName}`);
        }
    }
    
    showErrorMessage(message) {
        if (window.showToast) {
            window.showToast(message, 'error');
        }
    }
}

window.SendReceiveMessage = SendReceiveMessage;
