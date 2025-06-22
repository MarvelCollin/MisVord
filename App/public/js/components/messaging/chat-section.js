document.addEventListener('DOMContentLoaded', function() {
    const chatSection = new ChatSection();
    chatSection.init();
    window.chatSection = chatSection;
});

class ChatSection {
    constructor() {
        this.chatType = null;
        this.targetId = null;
        this.chatMessages = null;
        this.messageForm = null;
        this.messageInput = null;
        this.userId = null;
        this.username = null;
        this.messagesLoaded = false;
        this.typingTimeout = null;
        this.typingUsers = new Map();
        this.lastTypingUpdate = 0;
        this.typingDebounceTime = 2000;
        this.messageIdCounter = 0;
        this.processedMessageIds = new Set(); // To prevent duplicate messages
        this.joinedRooms = new Set(); // Track joined rooms/channels
        this.contextMenuVisible = false;
    }
    
    init() {
        this.loadElements();
        this.loadChatParams();
        this.setupEventListeners();
        this.loadMessages();
        this.setupIoListeners();
    }
    
    loadElements() {
        this.chatMessages = document.getElementById('chat-messages');
        this.messageForm = document.getElementById('message-form');
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.contextMenu = document.getElementById('message-context-menu');
        
        if (!this.chatMessages) {
            console.error('Chat messages element not found');
        }
        
        if (!this.messageForm) {
            console.error('Message form not found');
        }
        
        if (!this.messageInput) {
            console.error('Message input not found');
        }
    }
    
    loadChatParams() {
        this.chatType = document.querySelector('meta[name="chat-type"]')?.content || 'channel';
        this.targetId = document.querySelector('meta[name="chat-id"]')?.content;
        this.userId = document.querySelector('meta[name="user-id"]')?.content;
        this.username = document.querySelector('meta[name="username"]')?.content;
        
        console.log(`Chat initialized: ${this.chatType} ${this.targetId}`);
    }
    
    setupEventListeners() {
        if (this.messageForm) {
            this.messageForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.sendMessage();
            });
        }
        
        if (this.messageInput) {
            this.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
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

        // Handle context menu positioning and visibility
        document.addEventListener('click', (e) => {
            if (this.contextMenuVisible && !this.contextMenu.contains(e.target)) {
                this.hideContextMenu();
            }
        });

        // Attach click listeners to message groups for context menu
        this.chatMessages.addEventListener('contextmenu', (e) => {
            const messageGroup = e.target.closest('.message-group');
            if (messageGroup) {
                e.preventDefault();
                this.showContextMenu(e.clientX, e.clientY, messageGroup);
            }
        });

        // Individual message hover handling
        this.chatMessages.addEventListener('mouseover', (e) => {
            const messageContent = e.target.closest('.message-content');
            if (messageContent) {
                const messageGroup = messageContent.closest('.message-group');
                if (messageGroup) {
                    this.showMessageActions(messageGroup);
                }
            }
        });

        this.chatMessages.addEventListener('mouseout', (e) => {
            const messageContent = e.target.closest('.message-content');
            if (messageContent) {
                const relatedTarget = e.relatedTarget;
                // Only hide if we're not still hovering over the message or its actions
                if (!messageContent.contains(relatedTarget) && 
                    !relatedTarget?.closest('.message-actions') && 
                    !relatedTarget?.closest('.message-content')) {
                    const messageGroup = messageContent.closest('.message-group');
                    if (messageGroup) {
                        this.hideMessageActions(messageGroup);
                    }
                }
            }
            
            // Also hide when leaving the message actions
            if (e.target.closest('.message-actions')) {
                const relatedTarget = e.relatedTarget;
                const messageGroup = e.target.closest('.message-group');
                if (messageGroup && !messageGroup.contains(relatedTarget)) {
                    this.hideMessageActions(messageGroup);
                }
            }
        });
    }

    showContextMenu(x, y, messageGroup) {
        if (!this.contextMenu) return;
        
        this.contextMenu.style.left = `${x}px`;
        this.contextMenu.style.top = `${y}px`;
        this.contextMenu.classList.remove('hidden');
        this.contextMenu.dataset.messageId = messageGroup.querySelector('.message-content')?.dataset.messageId || '';
        this.contextMenuVisible = true;
    }

    hideContextMenu() {
        if (!this.contextMenu) return;
        
        this.contextMenu.classList.add('hidden');
        this.contextMenuVisible = false;
    }

    showMessageActions(messageGroup) {
        const actions = messageGroup.querySelector('.message-actions');
        if (actions) {
            actions.classList.remove('hidden');
            actions.classList.add('visible');
        }
    }

    hideMessageActions(messageGroup) {
        const actions = messageGroup.querySelector('.message-actions');
        if (actions) {
            actions.classList.add('hidden');
            actions.classList.remove('visible');
        }
    }
    
    setupIoListeners() {
        const self = this;
        
        const setupSocketHandlers = function() {
            const io = window.globalSocketManager.io;
            
            io.removeAllListeners('new-channel-message');
            io.removeAllListeners('user-message-dm');
            io.removeAllListeners('message-sent');
            io.removeAllListeners('user-typing');
            io.removeAllListeners('user-typing-dm');
            io.removeAllListeners('user-stop-typing');
            io.removeAllListeners('user-stop-typing-dm');
            
            io.on('new-channel-message', function(data) {
                console.log('Received channel message:', data);
                if (self.chatType === 'channel' && data.channelId == self.targetId) {
                    // Generate a reliable message ID if one doesn't exist
                    const messageId = data.id || `${data.userId}-${data.timestamp}`;
                    data.id = messageId;
                    
                    // Only add messages we haven't processed yet
                    if (!self.processedMessageIds.has(messageId)) {
                        self.processedMessageIds.add(messageId);
                        
                        // Only add messages from other users (our own are added when sent)
                        if (data.userId != self.userId) {
                            self.addMessage(data);
                        }
                    }
                }
            });
            
            io.on('user-message-dm', function(data) {
                console.log('Received DM message:', data);
                if ((self.chatType === 'direct' || self.chatType === 'dm') && data.roomId == self.targetId) {
                    // Generate a reliable message ID if one doesn't exist
                    const messageId = data.id || `${data.userId}-${data.timestamp}`;
                    data.id = messageId;
                    
                    // Only add messages we haven't processed yet
                    if (!self.processedMessageIds.has(messageId)) {
                        self.processedMessageIds.add(messageId);
                        
                        // Only add messages from other users (our own are added when sent)
                        if (data.userId != self.userId) {
                            self.addMessage(data);
                        }
                    }
                }
            });
            
            io.on('message-sent', function(data) {
                console.log('Message confirmation received:', data);
                // Update temporary message with confirmed ID
                const tempMessage = document.querySelector(`.message-content[data-message-id^="local-"]`);
                if (tempMessage) {
                    tempMessage.setAttribute('data-message-id', data.id);
                    self.processedMessageIds.add(data.id);
                }
            });
            
            io.on('user-typing', function(data) {
                // Only show typing indicators from users in the current channel
                if (self.chatType === 'channel' && data.channelId == self.targetId && data.userId != self.userId) {
                    self.showTypingIndicator(data.userId, data.username);
                }
            });
            
            io.on('user-typing-dm', function(data) {
                // Only show typing indicators from users in the current DM
                if ((self.chatType === 'direct' || self.chatType === 'dm') && data.roomId == self.targetId && data.userId != self.userId) {
                    self.showTypingIndicator(data.userId, data.username);
                }
            });
            
            io.on('user-stop-typing', function(data) {
                if (self.chatType === 'channel' && data.channelId == self.targetId && data.userId != self.userId) {
                    self.removeTypingIndicator(data.userId);
                }
            });
            
            io.on('user-stop-typing-dm', function(data) {
                if ((self.chatType === 'direct' || self.chatType === 'dm') && data.roomId == self.targetId && data.userId != self.userId) {
                    self.removeTypingIndicator(data.userId);
                }
            });
            
            // Join the appropriate channel
            self.joinChannel();
        };
        
        window.addEventListener('globalSocketReady', function() {
            if (window.globalSocketManager && window.globalSocketManager.io) {
                setupSocketHandlers();
            }
        });
        
        if (window.globalSocketManager && window.globalSocketManager.isReady()) {
            setupSocketHandlers();
        }
    }
    
    joinChannel() {
        if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
            setTimeout(() => this.joinChannel(), 1000);
            return;
        }

        const roomId = this.chatType === 'channel' ? this.targetId : null;
        const dmRoomId = (this.chatType === 'direct' || this.chatType === 'dm') ? this.targetId : null;
        
        // Only join if we haven't already joined this room
        if (roomId && !this.joinedRooms.has(`channel-${roomId}`)) {
            window.globalSocketManager.joinChannel(roomId);
            this.joinedRooms.add(`channel-${roomId}`);
        } else if (dmRoomId && !this.joinedRooms.has(`dm-${dmRoomId}`)) {
            window.globalSocketManager.joinDMRoom(dmRoomId);
            this.joinedRooms.add(`dm-${dmRoomId}`);
        }
    }
    
    async loadMessages() {
        if (!this.targetId || !this.chatType) {
            console.error('Cannot load messages: missing chat target ID or type');
            return;
        }
        
        try {
            if (!window.ChatAPI) {
                console.error('ChatAPI not available');
                return;
            }
            
            this.showLoadingIndicator();
            
            const response = await window.ChatAPI.getMessages(
                this.chatType === 'direct' ? 'dm' : this.chatType, 
                this.targetId
            );
            
            this.hideLoadingIndicator();
            
            if (response && response.data && response.data.messages) {
                console.log('Loaded messages from database:', response.data.messages);
                
                // Store message IDs to prevent duplicate messages
                response.data.messages.forEach(msg => {
                    this.processedMessageIds.add(msg.id);
                });
                
                this.renderMessages(response.data.messages);
                this.scrollToBottom();
            } else {
                console.error('No messages found in response:', response);
                this.showErrorMessage('No messages found');
            }
            
            this.messagesLoaded = true;
            
        } catch (error) {
            this.hideLoadingIndicator();
            console.error('Failed to load messages:', error);
            this.showErrorMessage('Failed to load messages');
        }
    }
    
    async sendMessage() {
        if (!this.messageInput || !this.messageInput.value.trim()) {
            return;
        }
        
        const content = this.messageInput.value.trim();
        const timestamp = Date.now();
        const messageId = `local-${timestamp}`;
        
        try {
            this.messageInput.value = '';
            this.resizeTextarea();
            this.updateSendButton();
            this.sendStopTyping();
            
            if (!window.ChatAPI) {
                console.error('ChatAPI not available');
                return;
            }
            
            const tempMessage = {
                id: messageId,
                content: content,
                user_id: this.userId,
                userId: this.userId,
                username: this.username,
                avatar_url: document.querySelector('meta[name="user-avatar"]')?.content || '/assets/common/main-logo.png',
                sent_at: timestamp,
                timestamp: timestamp,
                isLocalOnly: true,
                messageType: 'text',
                _localMessage: true
            };
            
            if (this.chatType === 'channel') {
                tempMessage.channelId = this.targetId;
            } else if (this.chatType === 'direct' || this.chatType === 'dm') {
                tempMessage.roomId = this.targetId;
            }
            
            // Add the message to our processed set to avoid duplicates
            this.processedMessageIds.add(messageId);
            this.addMessage(tempMessage);
            
            await window.ChatAPI.sendMessage(this.targetId, content, this.chatType, {
                localMessageId: messageId
            });
            
        } catch (error) {
            console.error('Failed to send message:', error);
            this.messageInput.value = content;
            this.updateSendButton();
            
            const tempMessageElement = document.querySelector(`[data-message-id="${messageId}"]`);
            if (tempMessageElement) {
                const messageGroup = tempMessageElement.closest('.message-group');
                if (messageGroup && messageGroup.querySelectorAll('.message-content').length === 1) {
                    messageGroup.remove();
                } else {
                    tempMessageElement.remove();
                }
            }
            
            // Remove from processed set if it failed
            this.processedMessageIds.delete(messageId);
            
            // Show error notification
            this.showNotification('Failed to send message', 'error');
        }
    }
    
    updateSendButton() {
        if (!this.sendButton) return;
        
        const hasContent = this.messageInput && this.messageInput.value.trim().length > 0;
        
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
            
            if (this.chatMessages) {
                // Insert before the message input area
                const messageForm = document.getElementById('message-form');
                if (messageForm) {
                    messageForm.parentNode.insertBefore(typingIndicator, messageForm);
                } else {
                    this.chatMessages.appendChild(typingIndicator);
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
        
        this.scrollToBottom();
    }
    
    renderMessages(messages) {
        if (!this.chatMessages) {
            return;
        }
        
        // Clear existing messages
        this.chatMessages.innerHTML = '';
        
        if (!messages || messages.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'flex flex-col items-center justify-center p-8 text-[#b5bac1] h-full';
            emptyState.innerHTML = `
                <svg class="w-16 h-16 mb-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" d="M18 10c0 4.418-3.582 8-8 8s-8-3.582-8-8 3.582-8 8-8 8 3.582 8 8zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                </svg>
                <p class="text-lg font-medium">No messages yet</p>
                <p class="text-sm mt-2">Start the conversation by sending a message!</p>
            `;
            this.chatMessages.appendChild(emptyState);
            return;
        }
        
        let lastSenderId = null;
        let messageGroup = null;
        
        messages.forEach(message => {
            if (message.user_id !== lastSenderId) {
                messageGroup = this.createMessageGroup(message);
                this.chatMessages.appendChild(messageGroup);
                lastSenderId = message.user_id;
            } else {
                const messageContent = this.createMessageContent(message);
                const contents = messageGroup.querySelector('.message-contents');
                if (contents) {
                    contents.appendChild(messageContent);
                }
            }
        });
    }
    
    addMessage(message) {
        if (!this.chatMessages || !message) {
            return;
        }
        
        const msg = {
            id: message.id || message.messageId || Date.now().toString(),
            content: message.content || message.message?.content || '',
            user_id: message.userId || message.user_id || '',
            username: message.username || message.message?.username || 'Unknown User',
            avatar_url: message.avatar_url || message.message?.avatar_url || '/assets/common/main-logo.png',
            sent_at: message.timestamp || message.sent_at || Date.now(),
            isLocalOnly: message.isLocalOnly || false
        };
        
        // Check if message already exists in DOM to avoid duplication
        const existingMessageElement = document.querySelector(`[data-message-id="${msg.id}"]`);
        if (existingMessageElement) {
            return;
        }
        
        const isOwnMessage = msg.user_id == this.userId;
        
        const lastMessageGroup = this.chatMessages.lastElementChild;
        const lastSenderId = lastMessageGroup?.getAttribute('data-user-id');
        
        if (lastSenderId === msg.user_id && lastMessageGroup?.classList.contains('message-group')) {
            const messageContent = this.createMessageContent(msg, isOwnMessage);
            const contents = lastMessageGroup.querySelector('.message-contents');
            if (contents) {
                contents.appendChild(messageContent);
            }
        } else {
            const messageGroup = this.createMessageGroup(msg, isOwnMessage);
            this.chatMessages.appendChild(messageGroup);
        }
        
        this.scrollToBottom();
    }
    
    createMessageGroup(message, isOwnMessage = false) {
        const messageGroup = document.createElement('div');
        messageGroup.className = 'message-group flex p-1 px-4 py-1 relative';
        messageGroup.setAttribute('data-user-id', message.user_id);
        
        const avatarContainer = document.createElement('div');
        avatarContainer.className = 'flex-shrink-0 mr-3 mt-0.5';
        
        const avatar = document.createElement('img');
        avatar.src = message.avatar_url || '/assets/common/main-logo.png';
        avatar.className = 'w-10 h-10 rounded-full';
        avatar.alt = `${message.username}'s avatar`;
        avatar.onerror = function() {
            this.onerror = null;
            this.src = '/assets/common/main-logo.png';
        };
        
        avatarContainer.appendChild(avatar);
        
        const messageContent = document.createElement('div');
        messageContent.className = 'flex-grow relative';
        
        const headerRow = document.createElement('div');
        headerRow.className = 'flex items-center mb-0.5';
        
        const usernameSpan = document.createElement('span');
        usernameSpan.className = isOwnMessage ? 'font-medium text-[#f2f3f5]' : 'font-medium text-[#f2f3f5]';
        usernameSpan.textContent = message.username;
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'text-xs text-[#a3a6aa] ml-2';
        timeSpan.textContent = this.formatTimestamp(message.sent_at);
        
        headerRow.appendChild(usernameSpan);
        headerRow.appendChild(timeSpan);
        
        const messageContents = document.createElement('div');
        messageContents.className = 'message-contents text-[#dcddde] break-words';
        
        const firstMessage = this.createMessageContent(message, isOwnMessage);
        messageContents.appendChild(firstMessage);
        
        messageContent.appendChild(headerRow);
        messageContent.appendChild(messageContents);
        
        messageGroup.appendChild(avatarContainer);
        messageGroup.appendChild(messageContent);
        
        // Create message actions element (hidden by default)
        const messageActions = document.createElement('div');
        messageActions.className = 'message-actions hidden absolute -top-2 right-4 bg-[#2b2d31] shadow-lg rounded items-center p-1 z-10';
        
        // Add emoji reaction button
        const addReactionBtn = document.createElement('button');
        addReactionBtn.title = 'Add Reaction';
        addReactionBtn.className = 'w-8 h-8 flex items-center justify-center text-[#b5bac1] hover:text-white hover:bg-[rgba(255,255,255,0.1)] rounded';
        addReactionBtn.innerHTML = '<i class="far fa-face-smile"></i>';
        messageActions.appendChild(addReactionBtn);

        // Add reply button
        const replyBtn = document.createElement('button');
        replyBtn.title = 'Reply';
        replyBtn.className = 'w-8 h-8 flex items-center justify-center text-[#b5bac1] hover:text-white hover:bg-[rgba(255,255,255,0.1)] rounded';
        replyBtn.innerHTML = '<i class="fas fa-reply"></i>';
        messageActions.appendChild(replyBtn);
        
        // Add thread button
        const threadBtn = document.createElement('button');
        threadBtn.title = 'Create Thread';
        threadBtn.className = 'w-8 h-8 flex items-center justify-center text-[#b5bac1] hover:text-white hover:bg-[rgba(255,255,255,0.1)] rounded';
        threadBtn.innerHTML = '<i class="fas fa-comment-dots"></i>';
        messageActions.appendChild(threadBtn);
        
        // Add more options button
        const moreBtn = document.createElement('button');
        moreBtn.title = 'More Actions';
        moreBtn.className = 'w-8 h-8 flex items-center justify-center text-[#b5bac1] hover:text-white hover:bg-[rgba(255,255,255,0.1)] rounded';
        moreBtn.innerHTML = '<i class="fas fa-ellipsis-vertical"></i>';
        messageActions.appendChild(moreBtn);
        
        messageContent.appendChild(messageActions);
        
        return messageGroup;
    }
    
    createMessageContent(message, isOwnMessage = false) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message-content py-0.5 hover:bg-[rgba(4,4,5,0.07)] rounded px-1 -ml-1';
        messageElement.setAttribute('data-message-id', message.id);
        
        if (isOwnMessage) {
            messageElement.classList.add('own-message');
        }
        
        const contentElement = document.createElement('div');
        contentElement.className = 'text-[#dbdee1] whitespace-pre-wrap break-words';
        contentElement.innerHTML = this.formatMessageContent(message.content);
        
        messageElement.appendChild(contentElement);
        
        return messageElement;
    }
    
    formatMessageContent(content) {
        if (!content) return '';
        
        // Escape HTML to prevent XSS
        const escapedContent = content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
            
        // Simple markdown-like formatting
        let formattedContent = escapedContent
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/```([\s\S]*?)```/g, '<div class="bg-[#2b2d31] p-2 my-1 rounded text-sm font-mono"><code>$1</code></div>')
            .replace(/`(.*?)`/g, '<code class="bg-[#2b2d31] px-1 py-0.5 rounded text-sm font-mono">$1</code>');
            
        return formattedContent;
    }
    
    formatTimestamp(timestamp) {
        if (!timestamp) return '';
        
        try {
            const date = new Date(timestamp);
            
            if (isNaN(date.getTime())) {
                return '';
            }
            
            const now = new Date();
            const isToday = date.getDate() === now.getDate() && 
                            date.getMonth() === now.getMonth() && 
                            date.getFullYear() === now.getFullYear();
            
            if (isToday) {
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else {
                return date.toLocaleDateString();
            }
        } catch (e) {
            console.error('Error formatting timestamp:', e);
            return '';
        }
    }
    
    scrollToBottom() {
        if (this.chatMessages) {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }
    }
    
    resizeTextarea() {
        if (!this.messageInput) return;
        
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 200) + 'px';
    }
    
    showLoadingIndicator() {
        if (this.chatMessages) {
            this.chatMessages.innerHTML = `
                <div class="flex justify-center items-center h-full">
                    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5865f2]"></div>
                </div>
            `;
        }
    }
    
    hideLoadingIndicator() {
        if (this.chatMessages) {
            this.chatMessages.innerHTML = '';
        }
    }
    
    showErrorMessage(message) {
        if (this.chatMessages) {
            const errorElement = document.createElement('div');
            errorElement.className = 'text-[#ed4245] p-4 text-center';
            errorElement.textContent = message;
            
            this.chatMessages.appendChild(errorElement);
        }
        
        if (window.showToast) {
            window.showToast(message, 'error');
        }
    }
    
    showNotification(message, type = 'success') {
        // Show temporary notification
        const notification = document.createElement('div');
        notification.textContent = message;
        
        // Set color based on type
        let bgColor = 'bg-[#5865f2]';
        if (type === 'error') bgColor = 'bg-[#ed4245]';
        else if (type === 'warning') bgColor = 'bg-yellow-500';
        else if (type === 'info') bgColor = 'bg-blue-500';
        
        notification.className = `fixed bottom-28 right-4 ${bgColor} text-white px-3 py-2 rounded-lg shadow-lg text-sm z-50`;
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}
