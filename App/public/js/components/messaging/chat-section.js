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
        this.setupSocketListeners();
        this.addTestButton();
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
    
    setupSocketListeners() {
        window.addEventListener('globalSocketReady', () => {
            this.joinChannel();
            
            if (window.globalSocketManager && window.globalSocketManager.socket) {
                const socket = window.globalSocketManager.socket;
                
                socket.on('new-channel-message', (data) => {
                    if (this.chatType === 'channel' && data.channelId == this.targetId) {
                        this.addMessage(data);
                    }
                });
                
                socket.on('user-message-dm', (data) => {
                    if ((this.chatType === 'direct' || this.chatType === 'dm') && data.roomId == this.targetId) {
                        this.addMessage(data);
                    }
                });
                
                socket.on('user-typing', (data) => {
                    if (this.chatType === 'channel' && data.channelId == this.targetId && data.userId != this.userId) {
                        this.showTypingIndicator(data.userId, data.username);
                    }
                });
                
                socket.on('user-typing-dm', (data) => {
                    if ((this.chatType === 'direct' || this.chatType === 'dm') && data.roomId == this.targetId) {
                        this.showTypingIndicator(data.userId, data.username);
                    }
                });
                
                socket.on('user-stop-typing', (data) => {
                    if (this.chatType === 'channel' && data.channelId == this.targetId) {
                        this.removeTypingIndicator(data.userId);
                    }
                });
                
                socket.on('user-stop-typing-dm', (data) => {
                    if ((this.chatType === 'direct' || this.chatType === 'dm') && data.roomId == this.targetId) {
                        this.removeTypingIndicator(data.userId);
                    }
                });
            }
        });
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
            
            if (response && response.messages) {
                this.renderMessages(response.messages);
                this.scrollToBottom();
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
        
        try {
            this.messageInput.value = '';
            this.resizeTextarea();
            this.sendStopTyping();
            
            if (!window.ChatAPI) {
                console.error('ChatAPI not available');
                return;
            }
            
            await window.ChatAPI.sendMessage(this.targetId, content, this.chatType);
            
        } catch (error) {
            console.error('Failed to send message:', error);
            this.messageInput.value = content;
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
        if (!this.chatMessages || !messages || messages.length === 0) {
            return;
        }
        
        let lastSenderId = null;
        let messageGroup = null;
        
        this.chatMessages.innerHTML = '';
        
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
            avatar_url: message.avatar_url || message.message?.avatar_url || '/assets/default-avatar.svg',
            sent_at: message.timestamp || message.sent_at || Date.now()
        };
        
        const lastMessageGroup = this.chatMessages.lastElementChild;
        const lastSenderId = lastMessageGroup?.getAttribute('data-user-id');
        
        if (lastSenderId === msg.user_id && lastMessageGroup?.classList.contains('message-group')) {
            const messageContent = this.createMessageContent(msg);
            const contents = lastMessageGroup.querySelector('.message-contents');
            if (contents) {
                contents.appendChild(messageContent);
            }
        } else {
            const messageGroup = this.createMessageGroup(msg);
            this.chatMessages.appendChild(messageGroup);
        }
        
        this.scrollToBottom();
    }
    
    createMessageGroup(message) {
        const isOwnMessage = message.user_id == this.userId;
        
        const messageGroup = document.createElement('div');
        messageGroup.className = 'message-group flex mb-4';
        messageGroup.setAttribute('data-user-id', message.user_id);
        
        const avatarContainer = document.createElement('div');
        avatarContainer.className = 'flex-shrink-0 mr-3 mt-1';
        
        const avatar = document.createElement('img');
        avatar.src = message.avatar_url || '/assets/default-avatar.svg';
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
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'text-xs text-gray-400 ml-2';
        timeSpan.textContent = this.formatTimestamp(message.sent_at);
        
        headerRow.appendChild(usernameSpan);
        headerRow.appendChild(timeSpan);
        
        const messageContents = document.createElement('div');
        messageContents.className = 'message-contents text-gray-100 break-words';
        
        const firstMessage = this.createMessageContent(message);
        messageContents.appendChild(firstMessage);
        
        messageContent.appendChild(headerRow);
        messageContent.appendChild(messageContents);
        
        messageGroup.appendChild(avatarContainer);
        messageGroup.appendChild(messageContent);
        
        return messageGroup;
    }
    
    createMessageContent(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message-content py-1';
        messageElement.setAttribute('data-message-id', message.id);
        
        const contentElement = document.createElement('div');
        contentElement.className = 'message-text';
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
    
    addTestButton() {
        // Create a container for the test UI
        const testContainer = document.createElement('div');
        testContainer.className = 'fixed bottom-20 right-4 z-50 flex flex-col gap-2 items-end';
        
        // Create the test button
        const testButton = document.createElement('button');
        testButton.innerHTML = '🔍 Test Socket';
        testButton.className = 'bg-gray-700 hover:bg-gray-600 text-white text-xs px-2 py-1 rounded opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1';
        testButton.title = 'Send test message to socket server';
        
        // Create socket status indicator
        const statusIndicator = document.createElement('span');
        statusIndicator.className = 'w-2 h-2 rounded-full mr-1';
        
        // Update status indicator color based on socket status
        const updateSocketStatus = () => {
            if (!window.globalSocketManager) {
                statusIndicator.className = 'w-2 h-2 rounded-full mr-1 bg-red-500';
                statusIndicator.title = 'Socket manager not found';
                return;
            }
            
            const status = window.globalSocketManager.getStatus();
            if (status.connected && status.authenticated) {
                statusIndicator.className = 'w-2 h-2 rounded-full mr-1 bg-green-500';
                statusIndicator.title = `Connected (${status.socketId})`;
            } else if (status.connected) {
                statusIndicator.className = 'w-2 h-2 rounded-full mr-1 bg-yellow-500';
                statusIndicator.title = 'Connected but not authenticated';
            } else {
                statusIndicator.className = 'w-2 h-2 rounded-full mr-1 bg-red-500';
                statusIndicator.title = 'Disconnected';
            }
        };
        
        // Add status indicator to button
        testButton.prepend(statusIndicator);
        updateSocketStatus();
        
        // Update socket status every 2 seconds
        setInterval(updateSocketStatus, 2000);
        
        // Add event listener for test button
        testButton.addEventListener('click', () => {
            this.sendTestMessage();
        });
        
        // Add the detailed status button
        const statusButton = document.createElement('button');
        statusButton.innerHTML = 'Show Socket Details';
        statusButton.className = 'bg-gray-700 hover:bg-gray-600 text-white text-xs px-2 py-1 rounded opacity-60 hover:opacity-100 transition-opacity';
        statusButton.title = 'Show detailed socket connection info';
        
        statusButton.addEventListener('click', () => {
            this.showSocketDetails();
        });
        
        // Add debug button
        const debugButton = document.createElement('button');
        debugButton.innerHTML = '🛠️ Debug Socket Connection';
        debugButton.className = 'bg-purple-700 hover:bg-purple-600 text-white text-xs px-2 py-1 rounded opacity-60 hover:opacity-100 transition-opacity';
        debugButton.title = 'Run socket connection diagnostics';
        
        debugButton.addEventListener('click', () => {
            this.runSocketDiagnostics();
        });
        
        // Add buttons to container
        testContainer.appendChild(testButton);
        testContainer.appendChild(statusButton);
        testContainer.appendChild(debugButton);
        
        // Add the container to the document
        document.body.appendChild(testContainer);
    }
    
    showSocketDetails() {
        if (!window.globalSocketManager) {
            alert('Socket manager not found!');
            return;
        }
        
        const status = window.globalSocketManager.getStatus();
        
        const detailsContainer = document.createElement('div');
        detailsContainer.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 text-white p-4 rounded-lg shadow-lg z-50 max-w-md w-full';
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '×';
        closeButton.className = 'absolute top-2 right-2 text-gray-400 hover:text-white text-xl';
        closeButton.addEventListener('click', () => {
            detailsContainer.remove();
        });
        detailsContainer.appendChild(closeButton);
        
        // Add title
        const title = document.createElement('h3');
        title.textContent = 'Socket Connection Details';
        title.className = 'text-lg font-medium mb-4';
        detailsContainer.appendChild(title);
        
        // Add details
        const details = document.createElement('div');
        details.className = 'space-y-2 text-sm';
        details.innerHTML = `
            <div><strong>Connected:</strong> ${status.connected ? '✅' : '❌'}</div>
            <div><strong>Authenticated:</strong> ${status.authenticated ? '✅' : '❌'}</div>
            <div><strong>Socket ID:</strong> ${status.socketId || 'None'}</div>
            <div><strong>User ID:</strong> ${status.userId || 'None'}</div>
            <div><strong>Username:</strong> ${status.username || 'None'}</div>
            <div><strong>Current Room:</strong> ${this.chatType === 'channel' ? `channel-${this.targetId}` : `dm-room-${this.targetId}`}</div>
            <div><strong>Last Error:</strong> ${status.lastError ? JSON.stringify(status.lastError) : 'None'}</div>
        `;
        detailsContainer.appendChild(details);
        
        // Add action buttons
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'flex gap-2 mt-4';
        
        const reconnectButton = document.createElement('button');
        reconnectButton.textContent = 'Reconnect Socket';
        reconnectButton.className = 'bg-discord-primary hover:bg-blue-700 text-white text-xs px-2 py-1 rounded flex-1';
        reconnectButton.addEventListener('click', () => {
            if (window.globalSocketManager) {
                window.globalSocketManager.disconnect();
                setTimeout(() => {
                    window.globalSocketManager.connect();
                    setTimeout(() => {
                        detailsContainer.remove();
                        this.showSocketDetails(); // Refresh the modal
                    }, 1000);
                }, 500);
            }
        });
        actionsContainer.appendChild(reconnectButton);
        
        const rejoinButton = document.createElement('button');
        rejoinButton.textContent = 'Rejoin Room';
        rejoinButton.className = 'bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 rounded flex-1';
        rejoinButton.addEventListener('click', () => {
            this.joinChannel();
            setTimeout(() => {
                detailsContainer.remove();
                this.showSocketDetails(); // Refresh the modal
            }, 1000);
        });
        actionsContainer.appendChild(rejoinButton);
        
        detailsContainer.appendChild(actionsContainer);
        
        // Add to document
        document.body.appendChild(detailsContainer);
    }
    
    runSocketDiagnostics() {
        if (!window.ChatAPI) {
            alert('ChatAPI not available!');
            return;
        }
        
        // Run socket diagnostics
        const results = window.ChatAPI.debugSocketConnection(this.targetId, this.chatType);
        
        // Create a diagnostic modal
        const modalContainer = document.createElement('div');
        modalContainer.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 text-white p-4 rounded-lg shadow-lg z-50 max-w-md w-full';
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '×';
        closeButton.className = 'absolute top-2 right-2 text-gray-400 hover:text-white text-xl';
        closeButton.addEventListener('click', () => {
            modalContainer.remove();
        });
        modalContainer.appendChild(closeButton);
        
        // Add title
        const title = document.createElement('h3');
        title.textContent = 'Socket Connection Diagnostics';
        title.className = 'text-lg font-medium mb-4';
        modalContainer.appendChild(title);
        
        // Add results
        const resultsList = document.createElement('div');
        resultsList.className = 'space-y-2 text-sm mb-4';
        
        // Format results as list
        const items = [
            { label: 'Socket Manager Exists', value: results.socketManagerExists ? '✅' : '❌' },
            { label: 'Socket Ready', value: results.socketReady ? '✅' : '❌' },
            { label: 'Socket Connected', value: results.socketConnected ? '✅' : '❌' },
            { label: 'Socket ID', value: results.socketId },
            { label: 'User ID', value: results.userId },
            { label: 'Username', value: results.username },
            { label: 'Target ID', value: results.targetId },
            { label: 'Chat Type', value: results.chatType },
            { label: 'Test Message Sent', value: results.testSent ? '✅' : '❌' }
        ];
        
        items.forEach(item => {
            const row = document.createElement('div');
            row.className = 'flex justify-between';
            row.innerHTML = `<strong>${item.label}:</strong> <span>${item.value}</span>`;
            resultsList.appendChild(row);
        });
        
        modalContainer.appendChild(resultsList);
        
        // Add action buttons
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'flex gap-2 mt-4';
        
        const reconnectButton = document.createElement('button');
        reconnectButton.textContent = 'Reconnect Socket';
        reconnectButton.className = 'bg-discord-primary hover:bg-blue-700 text-white text-xs px-2 py-1 rounded flex-1';
        reconnectButton.addEventListener('click', () => {
            if (window.globalSocketManager) {
                window.globalSocketManager.disconnect();
                setTimeout(() => {
                    window.globalSocketManager.connect();
                    setTimeout(() => {
                        modalContainer.remove();
                        this.runSocketDiagnostics(); // Refresh the modal
                    }, 1000);
                }, 500);
            }
        });
        actionsContainer.appendChild(reconnectButton);
        
        const testDirectButton = document.createElement('button');
        testDirectButton.textContent = 'Test Direct Socket';
        testDirectButton.className = 'bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 rounded flex-1';
        testDirectButton.addEventListener('click', () => {
            if (window.ChatAPI) {
                window.ChatAPI.sendDirectSocketMessage(this.targetId, `Direct socket test at ${new Date().toISOString()}`, this.chatType);
                this.showTestNotification('Direct socket message sent!', 'info');
            }
        });
        actionsContainer.appendChild(testDirectButton);
        
        modalContainer.appendChild(actionsContainer);
        
        // Add to document
        document.body.appendChild(modalContainer);
    }
    
    sendTestMessage() {
        if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
            console.error('Socket not ready for test message');
            alert('Socket not connected. Check console for details.');
            return;
        }
        
        const testContent = `Test message from ${this.username} at ${new Date().toISOString()}`;
        
        // Create a small popup menu for test options
        const testMenu = document.createElement('div');
        testMenu.className = 'absolute bg-gray-800 text-white p-2 rounded-lg shadow-lg z-50 flex flex-col gap-1 text-sm';
        testMenu.style.bottom = '60px';
        testMenu.style.right = '10px';
        
        // Socket-only test button
        const socketOnlyBtn = document.createElement('button');
        socketOnlyBtn.textContent = '🔌 Socket Only Test';
        socketOnlyBtn.className = 'bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-left';
        socketOnlyBtn.addEventListener('click', () => {
            this.performSocketOnlyTest(testContent);
            testMenu.remove();
        });
        
        // DB + Socket test button
        const dbSocketBtn = document.createElement('button');
        dbSocketBtn.textContent = '💾 DB + Socket Test';
        dbSocketBtn.className = 'bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-left';
        dbSocketBtn.addEventListener('click', () => {
            this.performDatabaseSocketTest(testContent);
            testMenu.remove();
        });
        
        // Cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '❌ Cancel';
        cancelBtn.className = 'bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-left';
        cancelBtn.addEventListener('click', () => {
            testMenu.remove();
        });
        
        testMenu.appendChild(socketOnlyBtn);
        testMenu.appendChild(dbSocketBtn);
        testMenu.appendChild(cancelBtn);
        document.body.appendChild(testMenu);
        
        // Auto-remove menu after 5 seconds
        setTimeout(() => {
            if (document.body.contains(testMenu)) {
                testMenu.remove();
            }
        }, 5000);
    }
    
    performSocketOnlyTest(testContent) {
        console.log(`🧪 Sending direct test message to socket: ${testContent}`);
        
        // Send test message to the socket server
        if (this.chatType === 'channel' && this.targetId) {
            // Test channel message
            window.globalSocketManager.socket.emit('new-channel-message', {
                channelId: this.targetId,
                content: testContent,
                messageType: 'text',
                userId: this.userId,
                username: this.username,
                timestamp: Date.now(),
                source: 'test-button'
            });
            
            // Also test typing indicators
            window.globalSocketManager.sendTyping(this.targetId);
            setTimeout(() => {
                window.globalSocketManager.sendStopTyping(this.targetId);
            }, 2000);
        } 
        else if ((this.chatType === 'direct' || this.chatType === 'dm') && this.targetId) {
            // Test DM message
            window.globalSocketManager.socket.emit('user-message-dm', {
                roomId: this.targetId,
                content: testContent,
                messageType: 'text',
                userId: this.userId,
                username: this.username,
                timestamp: Date.now(),
                source: 'test-button'
            });
            
            // Also test typing indicators
            window.globalSocketManager.sendTyping(null, this.targetId);
            setTimeout(() => {
                window.globalSocketManager.sendStopTyping(null, this.targetId);
            }, 2000);
        }
        
        this.showTestNotification('Socket-only message sent! Check server logs.');
    }
    
    performDatabaseSocketTest(testContent) {
        console.log(`🧪 Sending test message via dual-path (database + socket): ${testContent}`);
        
        // Use the ChatAPI to send the message through the regular flow
        if (!window.ChatAPI) {
            console.error('ChatAPI not available');
            this.showTestNotification('Error: ChatAPI not available', 'error');
            return;
        }
        
        // Show a notification that we're testing both paths
        this.showTestNotification('Sending message via both paths (DB + Socket)...', 'info');
        
        // Send the message using the dual-path method
        window.ChatAPI.sendMessage(this.targetId, testContent, this.chatType)
            .then(response => {
                console.log('✅ DB path response:', response);
                this.showTestNotification('Message sent through both paths! Check server logs.', 'success');
            })
            .catch(error => {
                console.error('❌ DB path failed:', error);
                this.showTestNotification('Error in DB path, but socket path may have succeeded', 'warning');
            });
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
}
