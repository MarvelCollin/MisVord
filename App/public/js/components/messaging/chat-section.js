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
            });
        }
    }
    
    setupIoListeners() {
        // Store reference to this
        const self = this;
        
        // Define a function we can use to set up our socket handlers
        const setupSocketHandlers = function() {
            const io = window.globalSocketManager.io;
            
            // First, remove any existing listeners to prevent duplicates
            io.removeAllListeners('new-channel-message');
            io.removeAllListeners('user-message-dm');
            io.removeAllListeners('message-sent');
            io.removeAllListeners('user-typing');
            io.removeAllListeners('user-typing-dm');
            io.removeAllListeners('user-stop-typing');
            io.removeAllListeners('user-stop-typing-dm');
            
            // Set up new listeners
            io.on('new-channel-message', function(data) {
                console.log('Received channel message:', data);
                if (self.chatType === 'channel' && data.channelId == self.targetId) {
                    self.showReceiveNotification('channel', data);
                    // Only add messages from other users
                    if (data.userId != self.userId) {
                        self.addMessage(data);
                    }
                }
            });
            
            io.on('user-message-dm', function(data) {
                console.log('Received DM message:', data);
                if ((self.chatType === 'direct' || self.chatType === 'dm') && data.roomId == self.targetId) {
                    self.showReceiveNotification('dm', data);
                    // Only add messages from other users
                    if (data.userId != self.userId) {
                        self.addMessage(data);
                    }
                }
            });
            
            io.on('message-sent', function(data) {
                console.log('Message confirmation received:', data);
                // Update temporary message with confirmed ID
                const tempMessage = document.querySelector(`.message-content[data-message-id^="local-"]`);
                if (tempMessage) {
                    tempMessage.setAttribute('data-message-id', data.id);
                }
            });
            
            io.on('user-typing', function(data) {
                if (self.chatType === 'channel' && data.channelId == self.targetId && data.userId != self.userId) {
                    self.showTypingIndicator(data.userId, data.username);
                }
            });
            
            io.on('user-typing-dm', function(data) {
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
        
        // Set up event listener for socket ready
        window.addEventListener('globalSocketReady', function() {
            if (window.globalSocketManager && window.globalSocketManager.io) {
                setupSocketHandlers();
            }
        });
        
        // If socket is already ready, set up handlers now
        if (window.globalSocketManager && window.globalSocketManager.isReady()) {
            setupSocketHandlers();
        }
    }
    
    joinChannel() {
        if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
            setTimeout(() => this.joinChannel(), 1000);
            return;
        }
        
        if (this.chatType === 'channel' && this.targetId) {
            window.globalSocketManager.joinChannel(this.targetId);
        } else if ((this.chatType === 'direct' || this.chatType === 'dm') && this.targetId) {
            window.globalSocketManager.joinDMRoom(this.targetId);
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
            
            // Check if the response has data.messages (standard API response structure)
            if (response && response.data && response.data.messages) {
                console.log('Loaded messages from database:', response.data.messages);
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
            
            // Add for channel type message
            if (this.chatType === 'channel') {
                tempMessage.channelId = this.targetId;
            } else if (this.chatType === 'direct' || this.chatType === 'dm') {
                tempMessage.roomId = this.targetId;
            }
            
            this.addMessage(tempMessage);
            
            // Pass the local message ID when sending through API
            await window.ChatAPI.sendMessage(this.targetId, content, this.chatType, {
                localMessageId: messageId
            });
            
        } catch (error) {
            console.error('Failed to send message:', error);
            this.messageInput.value = content;
            
            const tempMessageElement = document.querySelector(`[data-message-id="${messageId}"]`);
            if (tempMessageElement) {
                const messageGroup = tempMessageElement.closest('.message-group');
                if (messageGroup && messageGroup.querySelectorAll('.message-content').length === 1) {
                    // If this is the only message in the group, remove the whole group
                    messageGroup.remove();
                } else {
                    // Otherwise just remove this message
                    tempMessageElement.remove();
                }
            }
            
            // Show error notification
            this.showTestNotification('Failed to send message', 'error');
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
                typingIndicator.remove();
            }
            return;
        }
        
        if (!typingIndicator) {
            typingIndicator = document.createElement('div');
            typingIndicator.id = 'typing-indicator';
            typingIndicator.className = 'text-sm text-gray-400 py-2 px-4 animate-pulse flex items-center';
            
            const dot1 = document.createElement('div');
            dot1.className = 'h-1.5 w-1.5 bg-gray-400 rounded-full mr-1 animate-bounce';
            dot1.style.animationDelay = '0ms';
            
            const dot2 = document.createElement('div');
            dot2.className = 'h-1.5 w-1.5 bg-gray-400 rounded-full mx-1 animate-bounce';
            dot2.style.animationDelay = '200ms';
            
            const dot3 = document.createElement('div');
            dot3.className = 'h-1.5 w-1.5 bg-gray-400 rounded-full ml-1 animate-bounce';
            dot3.style.animationDelay = '400ms';
            
            const textElement = document.createElement('span');
            textElement.className = 'ml-2';
            
            typingIndicator.appendChild(dot1);
            typingIndicator.appendChild(dot2);
            typingIndicator.appendChild(dot3);
            typingIndicator.appendChild(textElement);
            
            if (this.chatMessages) {
                this.chatMessages.appendChild(typingIndicator);
            }
        }
        
        const textElement = typingIndicator.querySelector('span');
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
            emptyState.className = 'flex flex-col items-center justify-center p-8 text-gray-400 h-full';
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
        
        // Log server debug info if present
        if (message._serverDebug) {
            console.log('🔄 Server debug info:', message._serverDebug);
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
        messageGroup.className = 'message-group flex mb-4';
        messageGroup.setAttribute('data-user-id', message.user_id);
        
        const avatarContainer = document.createElement('div');
        avatarContainer.className = 'flex-shrink-0 mr-3 mt-1';
        
        const avatar = document.createElement('img');
        avatar.src = message.avatar_url || '/assets/common/main-logo.png';
        avatar.className = 'w-10 h-10 rounded-full';
        avatar.alt = `${message.username}'s avatar`;
        
        avatarContainer.appendChild(avatar);
        
        const messageContent = document.createElement('div');
        messageContent.className = 'flex-grow';
        
        const headerRow = document.createElement('div');
        headerRow.className = 'flex items-center';
        
        const usernameSpan = document.createElement('span');
        usernameSpan.className = isOwnMessage ? 'font-semibold text-discord-primary' : 'font-semibold text-white';
        usernameSpan.textContent = message.username;
        
        // Add "You" badge for own messages
        if (isOwnMessage) {
            const youBadge = document.createElement('span');
            youBadge.className = 'text-xs bg-discord-primary text-white px-1 py-0.5 rounded ml-2';
            youBadge.textContent = 'You';
            headerRow.appendChild(youBadge);
        }
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'text-xs text-gray-400 ml-2';
        timeSpan.textContent = this.formatTimestamp(message.sent_at);
        
        headerRow.appendChild(usernameSpan);
        headerRow.appendChild(timeSpan);
        
        const messageContents = document.createElement('div');
        messageContents.className = 'message-contents text-gray-100 break-words';
        
        const firstMessage = this.createMessageContent(message, isOwnMessage);
        messageContents.appendChild(firstMessage);
        
        messageContent.appendChild(headerRow);
        messageContent.appendChild(messageContents);
        
        messageGroup.appendChild(avatarContainer);
        messageGroup.appendChild(messageContent);
        
        return messageGroup;
    }
    
    createMessageContent(message, isOwnMessage = false) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message-content py-1';
        messageElement.setAttribute('data-message-id', message.id);
        
        if (isOwnMessage) {
            messageElement.classList.add('own-message');
        }
        
        const contentElement = document.createElement('div');
        contentElement.className = isOwnMessage ? 'message-text own-message-text' : 'message-text';
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
            // Convert linebreaks
            .replace(/\n/g, '<br>')
            // Bold
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Italic
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Code
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            // Inline code
            .replace(/`(.*?)`/g, '<code>$1</code>');
            
        return formattedContent;
    }
    
    formatTimestamp(timestamp) {
        if (!timestamp) return '';
        
        try {
            const date = new Date(timestamp);
            
            if (isNaN(date.getTime())) {
                return '';
            }
            
            // Format: HH:MM or MM/DD/YYYY if not today
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
                    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-discord-primary"></div>
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
            errorElement.className = 'text-red-500 p-4 text-center';
            errorElement.textContent = message;
            
            this.chatMessages.appendChild(errorElement);
        }
        
        if (window.showToast) {
            window.showToast(message, 'error');
        }
    }
    
    showTestNotification(message, type = 'success') {
        // Show temporary notification
        const notification = document.createElement('div');
        notification.textContent = message;
        
        // Set color based on type
        let bgColor = 'bg-discord-primary';
        if (type === 'error') bgColor = 'bg-red-600';
        else if (type === 'warning') bgColor = 'bg-yellow-500';
        else if (type === 'info') bgColor = 'bg-blue-500';
        
        notification.className = `fixed bottom-28 right-4 ${bgColor} text-white px-3 py-2 rounded-lg shadow-lg text-sm z-50`;
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    showReceiveNotification(type, data) {
        // Only show for debugging purposes
        const isDebug = localStorage.getItem('debug_socket_messages') === 'true';
        if (!isDebug) return;
        
        const isOwnMessage = (data.userId || data.user_id) == this.userId;
        const source = data._serverDebug ? 'server' : 'direct';
        
        console.log(`📩 Received ${type} message from ${isOwnMessage ? 'myself' : 'other user'} (${source}):`, data);
        
        // Show a small notification for debugging
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 bg-gray-800 text-white text-xs p-2 rounded shadow-lg z-50 ${isOwnMessage ? 'border-l-4 border-discord-primary' : ''}`;
        notification.innerHTML = `
            <div class="font-bold">${isOwnMessage ? 'Your message received' : 'Message from ' + (data.username || 'unknown')}</div>
            <div class="text-gray-300">Source: ${source}</div>
            <div class="text-gray-300 truncate max-w-xs">${data.content || 'No content'}</div>
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 2 seconds
        setTimeout(() => {
            notification.remove();
        }, 2000);
    }
}
