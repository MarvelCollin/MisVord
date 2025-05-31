/**
 * Messaging functionality for MiscVord
 * Handles message operations like send, edit, delete, etc.
 */

import { MisVordAjax } from '../core/ajax-handler.js';
import { showToast } from '../core/toast.js';

document.addEventListener('DOMContentLoaded', function() {
    initMessagingSystem();
});

/**
 * Initialize messaging system functionality
 */
function initMessagingSystem() {
    // Message input form
    initMessageForm();
    
    // Message edit buttons
    initMessageEditButtons();
    
    // Message delete buttons
    initMessageDeleteButtons();
    
    // Scrolling behavior for message containers
    initMessageScrolling();
}

/**
 * Initialize message form
 */
function initMessageForm() {
    const messageForm = document.getElementById('message-form');
    
    if (messageForm) {
        messageForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const textarea = this.querySelector('textarea');
            const message = textarea.value.trim();
            const channelId = this.getAttribute('data-channel-id');
            
            if (!message) {
                return;
            }
            
            sendMessage(channelId, message);
            textarea.value = '';
        });
        
        // Handle Shift+Enter for new line
        const textarea = messageForm.querySelector('textarea');
        if (textarea) {
            textarea.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const event = new Event('submit', { cancelable: true });
                    messageForm.dispatchEvent(event);
                }
            });
        }
    }
}

/**
 * Initialize message edit buttons
 */
function initMessageEditButtons() {
    document.addEventListener('click', function(e) {
        if (e.target.closest('.edit-message-btn')) {
            const button = e.target.closest('.edit-message-btn');
            const messageId = button.getAttribute('data-message-id');
            const messageElement = document.getElementById(`message-${messageId}`);
            
            if (messageElement) {
                startEditingMessage(messageElement);
            }
        }
    });
}

/**
 * Initialize message delete buttons
 */
function initMessageDeleteButtons() {
    document.addEventListener('click', function(e) {
        if (e.target.closest('.delete-message-btn')) {
            const button = e.target.closest('.delete-message-btn');
            const messageId = button.getAttribute('data-message-id');
            
            if (confirm('Are you sure you want to delete this message?')) {
                deleteMessage(messageId);
            }
        }
    });
}

/**
 * Initialize message container scrolling behavior
 */
function initMessageScrolling() {
    const messageContainer = document.querySelector('.message-container');
    
    if (messageContainer) {
        // Scroll to bottom on load
        scrollToBottom(messageContainer);
        
        // Auto-scroll on new messages only if near bottom
        messageContainer.addEventListener('DOMNodeInserted', function(e) {
            // Check if the inserted node is a message
            if (e.target.classList && e.target.classList.contains('message')) {
                // Only auto-scroll if already near the bottom
                const isNearBottom = messageContainer.scrollHeight - messageContainer.scrollTop - messageContainer.clientHeight < 100;
                
                if (isNearBottom) {
                    scrollToBottom(messageContainer);
                }
            }
        });
    }
}

/**
 * Scroll element to bottom
 * @param {HTMLElement} element - Element to scroll
 */
function scrollToBottom(element) {
    element.scrollTop = element.scrollHeight;
}

/**
 * Send a message
 * @param {string} channelId - Channel ID
 * @param {string} content - Message content
 */
function sendMessage(channelId, content) {
    MisVordAjax.post(`/api/channels/${channelId}/messages`, {
        content: content
    }, {
        onSuccess: function(response) {
            if (response.success) {
                // Message will be added by WebSocket
                // But we could add it directly for quicker feedback
                if (response.data && response.data.message) {
                    addMessageToUI(response.data.message);
                }
            }
        },
        // Don't show toast for successful message sending
        showToast: false
    });
}

/**
 * Start editing a message
 * @param {HTMLElement} messageElement - Message element
 */
function startEditingMessage(messageElement) {
    // Get message content
    const contentContainer = messageElement.querySelector('.message-content');
    if (!contentContainer) return;
    
    const originalContent = contentContainer.textContent;
    const messageId = messageElement.getAttribute('data-message-id');
    
    // Create edit form
    const editForm = document.createElement('form');
    editForm.className = 'edit-message-form';
    editForm.innerHTML = `
        <textarea class="message-edit-textarea w-full bg-discord-dark border border-gray-600 rounded-md p-2 text-white">${originalContent}</textarea>
        <div class="flex justify-end mt-2">
            <button type="button" class="cancel-edit-btn text-gray-400 mr-2">Cancel</button>
            <button type="submit" class="bg-discord-blue text-white px-3 py-1 rounded-md">Save</button>
        </div>
    `;
    
    // Replace content with edit form
    contentContainer.innerHTML = '';
    contentContainer.appendChild(editForm);
    
    // Focus textarea
    const textarea = editForm.querySelector('textarea');
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    
    // Handle cancel
    editForm.querySelector('.cancel-edit-btn').addEventListener('click', function() {
        contentContainer.innerHTML = originalContent;
    });
    
    // Handle submit
    editForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const newContent = textarea.value.trim();
        
        if (newContent && newContent !== originalContent) {
            updateMessage(messageId, newContent);
        } else {
            contentContainer.innerHTML = originalContent;
        }
    });
}

/**
 * Update a message
 * @param {string} messageId - Message ID
 * @param {string} content - New content
 */
function updateMessage(messageId, content) {
    MisVordAjax.put(`/api/messages/${messageId}`, {
        content: content
    }, {
        onSuccess: function(response) {
            if (response.success && response.data.message) {
                // Update the message in UI
                updateMessageInUI(response.data.message);
            }
        }
    });
}

/**
 * Delete a message
 * @param {string} messageId - Message ID
 */
function deleteMessage(messageId) {
    MisVordAjax.delete(`/api/messages/${messageId}`, {
        onSuccess: function(response) {
            if (response.success) {
                // Remove message from UI (if not already removed by WebSocket)
                const messageElement = document.getElementById(`message-${messageId}`);
                if (messageElement) {
                    messageElement.remove();
                }
            }
        }
    });
}

/**
 * Add a message to the UI
 * @param {Object} message - Message object
 */
function addMessageToUI(message) {
    const messageContainer = document.querySelector('.message-container');
    if (!messageContainer) return;
    
    const messageElement = createMessageElement(message);
    messageContainer.appendChild(messageElement);
    
    // Scroll to bottom if already near bottom
    const isNearBottom = messageContainer.scrollHeight - messageContainer.scrollTop - messageContainer.clientHeight < 100;
    if (isNearBottom) {
        scrollToBottom(messageContainer);
    }
}

/**
 * Update a message in the UI
 * @param {Object} message - Message object
 */
function updateMessageInUI(message) {
    const messageElement = document.getElementById(`message-${message.id}`);
    if (!messageElement) return;
    
    const contentContainer = messageElement.querySelector('.message-content');
    if (contentContainer) {
        contentContainer.textContent = message.content;
    }
    
    // Add edited indicator if not already present
    if (message.edited_at) {
        const editedIndicator = messageElement.querySelector('.edited-indicator');
        if (!editedIndicator) {
            const timeElement = messageElement.querySelector('.message-time');
            if (timeElement) {
                const editedSpan = document.createElement('span');
                editedSpan.className = 'edited-indicator text-gray-500 text-xs ml-1';
                editedSpan.textContent = '(edited)';
                timeElement.appendChild(editedSpan);
            }
        }
    }
}

/**
 * Create a message element
 * @param {Object} message - Message object
 * @returns {HTMLElement} - Message element
 */
function createMessageElement(message) {
    const div = document.createElement('div');
    div.className = 'message flex p-2 hover:bg-discord-light/10 transition-colors group';
    div.id = `message-${message.id}`;
    div.setAttribute('data-message-id', message.id);
    div.setAttribute('data-user-id', message.user.id);
    
    const currentUserId = document.body.getAttribute('data-user-id');
    const isOwnMessage = currentUserId && currentUserId === message.user.id;
    
    div.innerHTML = `
        <div class="flex-shrink-0 mr-3">
            <img src="${message.user.avatar_url || '/public/assets/default-avatar.png'}" alt="${message.user.username}" class="w-10 h-10 rounded-full">
        </div>
        <div class="flex-grow">
            <div class="flex items-center">
                <span class="font-medium text-white">${message.user.username}</span>
                <span class="message-time text-gray-400 text-xs ml-2">${message.formatted_time}</span>
            </div>
            <div class="message-content text-gray-200 break-words whitespace-pre-wrap">${message.content}</div>
        </div>
        ${isOwnMessage ? `
        <div class="message-actions opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
            <button class="edit-message-btn text-gray-400 hover:text-white mr-2" data-message-id="${message.id}">
                <i class="fas fa-edit"></i>
            </button>
            <button class="delete-message-btn text-gray-400 hover:text-red-500" data-message-id="${message.id}">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        ` : ''}
    `;
    
    return div;
}

// Socket.io chat functionality for MisVord
class MisVordChat {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.activeChannel = null;
        this.typingTimeout = null;
        this.typingUsers = new Map();
        
        this.init();
    }
    
    init() {
        this.setupSocketConnection();
        this.setupDOMListeners();
    }
    
    setupSocketConnection() {
        const socketPort = 1002; // Should match the SOCKET_PORT in your .env
        const socketPath = '/socket.io';
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname;
        
        // Create socket connection
        const tryConnection = () => {
            try {
                // Check if Socket.IO is loaded
                if (typeof io === 'undefined') {
                    console.warn('Socket.IO client not loaded yet. Will retry in 500ms.');
                    setTimeout(tryConnection, 500);
                    return;
                }
                
                console.log('Socket.IO found, establishing connection...');
                this.socket = io(`${protocol}//${host}:${socketPort}`, {
                    transports: ['websocket', 'polling'],
                    path: socketPath,
                    reconnection: true,
                    reconnectionDelay: 1000,
                    reconnectionDelayMax: 5000,
                    reconnectionAttempts: Infinity
                });
                
                // Store socket globally for other components to access
                window.misvordSocket = this.socket;
                
                // Socket connection events
                this.socket.on('connect', () => this.handleSocketConnect());
                this.socket.on('disconnect', () => this.handleSocketDisconnect());
                this.socket.on('reconnect', () => this.handleSocketReconnect());
                this.socket.on('connect_error', (error) => this.handleSocketError(error));
                
                // Chat-specific events
                this.socket.on('new-channel-message', (data) => this.handleNewMessage(data));
                this.socket.on('user-typing', (data) => this.handleUserTyping(data));
                this.socket.on('user-stop-typing', (data) => this.handleUserStopTyping(data));
                
            } catch (error) {
                console.error('Error initializing Socket.IO:', error);
            }
        };
        
        // Try to connect immediately, but will retry if Socket.IO isn't loaded
        tryConnection();
    }
    
    handleSocketConnect() {
        console.log('Socket.IO connected!');
        this.connected = true;
        
        // Authenticate with the socket server
        const userId = this.getCurrentUserId();
        const username = this.getCurrentUsername();
        
        if (userId) {
            this.socket.emit('authenticate', {
                userId: userId,
                username: username
            });
            
            // Join current channel if any
            this.joinCurrentChannel();
        }
    }
    
    handleSocketDisconnect() {
        console.log('Socket.IO disconnected');
        this.connected = false;
        
        // Show disconnected state in UI
        this.showSocketStatus('disconnected');
    }
    
    handleSocketReconnect() {
        console.log('Socket.IO reconnected');
        this.connected = true;
        
        // Show connected state in UI
        this.showSocketStatus('connected');
        
        // Re-authenticate after reconnection
        const userId = this.getCurrentUserId();
        const username = this.getCurrentUsername();
        
        if (userId) {
            this.socket.emit('authenticate', {
                userId: userId,
                username: username
            });
            
            // Re-join current channel
            this.joinCurrentChannel();
        }
    }
    
    handleSocketError(error) {
        console.error('Socket connection error:', error);
        this.showSocketStatus('error');
    }
    
    setupDOMListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            // Message form
            const messageForm = document.getElementById('message-form');
            if (messageForm) {
                messageForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
            }
            
            // Message input
            const messageInput = document.querySelector('.message-input');
            if (messageInput) {
                messageInput.addEventListener('input', () => this.handleInput());
                messageInput.addEventListener('blur', () => this.handleStopTyping());
            }
            
            // Listen for channel selection
            const channelItems = document.querySelectorAll('.channel-item');
            channelItems.forEach(channel => {
                channel.addEventListener('click', (e) => this.handleChannelSelect(e));
            });
            
            // Join current channel if already on a channel page
            this.joinCurrentChannel();
        });
    }
    
    handleFormSubmit(e) {
        e.preventDefault();
        
        const messageInput = document.querySelector('.message-input');
        if (!messageInput || !messageInput.value.trim()) return;
        
        const channelId = messageInput.dataset.channelId || this.getActiveChannelId();
        const content = messageInput.value.trim();
        
        // Clear input immediately for better UX
        messageInput.value = '';
        messageInput.style.height = 'auto';
        
        if (!this.connected) {
            // Fall back to standard HTTP request if socket isn't connected
            this.sendMessageViaHTTP(channelId, content);
            return;
        }
        
        // Send via socket
        this.socket.emit('channel-message', {
            channelId: channelId,
            content: content,
            timestamp: new Date().toISOString()
        });
        
        // Stop typing indicator
        this.handleStopTyping();
    }
    
    sendMessageViaHTTP(channelId, content) {
        // Legacy HTTP fallback
        fetch(`/api/channels/${channelId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ content })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Message sent successfully via HTTP');
            }
        })
        .catch(error => {
            console.error('Error sending message via HTTP:', error);
        });
    }
    
    handleNewMessage(messageData) {
        const { channelId, user_id, username, avatar, content, timestamp } = messageData;
        
        // Only process messages for the current channel
        if (channelId != this.getActiveChannelId()) return;
        
        // Create message element
        this.appendMessageToChat(messageData);
        
        // Remove user from typing list if they just sent a message
        this.removeUserFromTyping(user_id);
    }
    
    appendMessageToChat(messageData) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;
        
        const { user_id, username, avatar, content, timestamp } = messageData;
        
        // Format timestamp
        const messageDate = new Date(timestamp);
        const formattedTime = messageDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        
        // Check if this is from the same user as the last message
        const lastMessage = messagesContainer.querySelector('.mb-4:last-child');
        const showHeader = !lastMessage || lastMessage.dataset.userId != user_id;
        const userId = this.getCurrentUserId();
        const isOwnMessage = user_id == userId;
        
        // Create message HTML
        const messageElement = document.createElement('div');
        messageElement.className = `mb-4 group hover:bg-discord-dark/30 p-1 rounded -mx-1 ${showHeader ? '' : 'pl-12'}`;
        messageElement.dataset.userId = user_id;
        
        if (showHeader) {
            messageElement.innerHTML = `
                <div class="flex items-start">
                    <div class="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center overflow-hidden mr-3">
                        <img src="${avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(username || 'U') + '&background=random'}" 
                             alt="Avatar" class="w-full h-full object-cover">
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center">
                            <span class="font-medium text-white mr-2">${this.escapeHTML(username)}</span>
                            <span class="text-xs text-gray-400">${formattedTime}</span>
                        </div>
                        <div class="text-gray-300 select-text break-words">
                            ${this.formatMessageContent(content)}
                        </div>
                    </div>
                </div>
            `;
        } else {
            messageElement.innerHTML = `
                <div class="relative group-hover:visible invisible">
                    <span class="text-xs text-gray-400 absolute -left-12">${formattedTime}</span>
                </div>
                <div class="text-gray-300 select-text break-words">
                    ${this.formatMessageContent(content)}
                </div>
            `;
        }
        
        // Add message actions
        messageElement.innerHTML += `
            <div class="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity mt-1 ml-12">
                <button class="p-1 text-gray-400 hover:text-white hover:bg-discord-light rounded-sm">
                    <i class="fas fa-face-smile text-xs"></i>
                </button>
                ${isOwnMessage ? `
                <button class="p-1 text-gray-400 hover:text-white hover:bg-discord-light rounded-sm">
                    <i class="fas fa-pen-to-square text-xs"></i>
                </button>
                ` : ''}
                <button class="p-1 text-gray-400 hover:text-white hover:bg-discord-light rounded-sm">
                    <i class="fas fa-reply text-xs"></i>
                </button>
                <button class="p-1 text-gray-400 hover:text-white hover:bg-discord-light rounded-sm">
                    <i class="fas fa-ellipsis text-xs"></i>
                </button>
            </div>
        `;
        
        // Append the message to container
        messagesContainer.appendChild(messageElement);
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    formatMessageContent(content) {
        if (!content) return '';
        
        // Escape HTML
        let formattedContent = this.escapeHTML(content);
        
        // Convert line breaks to <br>
        formattedContent = formattedContent.replace(/\n/g, '<br>');
        
        return formattedContent;
    }
    
    handleInput() {
        // Clear existing timeout if any
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }
        
        // Send typing indication
        const channelId = this.getActiveChannelId();
        if (channelId && this.connected) {
            this.socket.emit('typing', { channelId });
            
            // Set a timeout to emit 'stop-typing' after 3 seconds of inactivity
            this.typingTimeout = setTimeout(() => {
                this.handleStopTyping();
            }, 3000);
        }
    }
    
    handleStopTyping() {
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
            this.typingTimeout = null;
        }
        
        const channelId = this.getActiveChannelId();
        if (channelId && this.connected) {
            this.socket.emit('stop-typing', { channelId });
        }
    }
    
    handleUserTyping(data) {
        const { userId, username, channelId } = data;
        
        // Only show typing indicators for the current channel
        if (channelId != this.getActiveChannelId()) return;
        
        // Don't show typing indicator for our own messages
        if (userId == this.getCurrentUserId()) return;
        
        // Add to typing users
        this.typingUsers.set(userId, username);
        
        // Update typing indicator
        this.updateTypingIndicator();
    }
    
    handleUserStopTyping(data) {
        const { userId, channelId } = data;
        
        // Only process for the current channel
        if (channelId != this.getActiveChannelId()) return;
        
        this.removeUserFromTyping(userId);
    }
    
    removeUserFromTyping(userId) {
        if (this.typingUsers.has(userId)) {
            this.typingUsers.delete(userId);
            this.updateTypingIndicator();
        }
    }
    
    updateTypingIndicator() {
        const container = document.getElementById('typing-indicator');
        
        // Create container if it doesn't exist
        if (!container && this.typingUsers.size > 0) {
            const messageForm = document.getElementById('message-form');
            
            if (messageForm) {
                const indicatorContainer = document.createElement('div');
                indicatorContainer.id = 'typing-indicator';
                indicatorContainer.className = 'text-xs text-gray-400 pb-1 pl-1 flex items-center';
                messageForm.parentNode.insertBefore(indicatorContainer, messageForm);
            }
        }
        
        const typingContainer = document.getElementById('typing-indicator');
        
        if (typingContainer) {
            if (this.typingUsers.size === 0) {
                typingContainer.innerHTML = '';
                typingContainer.style.display = 'none';
                return;
            }
            
            let text = '';
            const users = Array.from(this.typingUsers.values());
            
            if (users.length === 1) {
                text = `${users[0]} is typing...`;
            } else if (users.length === 2) {
                text = `${users[0]} and ${users[1]} are typing...`;
            } else if (users.length === 3) {
                text = `${users[0]}, ${users[1]}, and ${users[2]} are typing...`;
            } else {
                text = 'Several people are typing...';
            }
            
            typingContainer.innerHTML = `
                <div class="typing-animation mr-2">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                </div>
                <span>${text}</span>
            `;
            typingContainer.style.display = 'flex';
        }
    }
    
    handleChannelSelect(e) {
        const channelItem = e.currentTarget;
        const channelId = channelItem.dataset.channelId;
        
        if (channelId) {
            // Leave current channel
            if (this.activeChannel && this.connected) {
                this.socket.emit('leave-channel', this.activeChannel);
            }
            
            // Join new channel
            this.activeChannel = channelId;
            
            if (this.connected) {
                this.socket.emit('join-channel', channelId);
            }
            
            // Clear typing users for the previous channel
            this.typingUsers.clear();
            this.updateTypingIndicator();
        }
    }
    
    joinCurrentChannel() {
        const channelId = this.getActiveChannelId();
        
        if (channelId && this.connected) {
            this.activeChannel = channelId;
            this.socket.emit('join-channel', channelId);
        }
    }
    
    getActiveChannelId() {
        // Try to get from active channel element
        const activeChannel = document.querySelector('.channel-item.active');
        if (activeChannel && activeChannel.dataset.channelId) {
            return activeChannel.dataset.channelId;
        }
        
        // Try to get from message input if available
        const messageInput = document.querySelector('.message-input');
        if (messageInput && messageInput.dataset.channelId) {
            return messageInput.dataset.channelId;
        }
        
        // Return stored active channel as fallback
        return this.activeChannel;
    }
    
    getCurrentUserId() {
        // Look for user ID in data attributes or session storage
        const userElement = document.querySelector('[data-user-id]');
        if (userElement && userElement.dataset.userId) {
            return userElement.dataset.userId;
        }
        
        // Try to get from sessionStorage
        return sessionStorage.getItem('user_id');
    }
    
    getCurrentUsername() {
        // Look for username in data attributes or session storage
        const userElement = document.querySelector('[data-username]');
        if (userElement && userElement.dataset.username) {
            return userElement.dataset.username;
        }
        
        // Try to get from sessionStorage
        return sessionStorage.getItem('username');
    }
    
    showSocketStatus(status) {
        // Add socket status indicator to UI if needed
        const container = document.querySelector('.socket-status');
        if (!container) return;
        
        switch (status) {
            case 'connected':
                container.innerHTML = '<span class="text-green-500">●</span> Connected';
                container.classList.remove('hidden');
                setTimeout(() => container.classList.add('hidden'), 3000);
                break;
            case 'disconnected':
                container.innerHTML = '<span class="text-red-500">●</span> Disconnected';
                container.classList.remove('hidden');
                break;
            case 'error':
                container.innerHTML = '<span class="text-amber-500">●</span> Connection error';
                container.classList.remove('hidden');
                break;
        }
    }
    
    escapeHTML(str) {
        return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

// Initialize the chat system
document.addEventListener('DOMContentLoaded', () => {
    window.misVordChat = new MisVordChat();
    
    // Add CSS for typing animation
    const style = document.createElement('style');
    style.textContent = `
        .typing-animation {
            display: flex;
            align-items: center;
        }
        
        .typing-animation .dot {
            width: 4px;
            height: 4px;
            background-color: #999;
            border-radius: 50%;
            margin: 0 2px;
            animation: pulse 1.5s infinite ease-in-out;
        }
        
        .typing-animation .dot:nth-child(2) {
            animation-delay: 0.2s;
        }
        
        .typing-animation .dot:nth-child(3) {
            animation-delay: 0.4s;
        }
        
        @keyframes pulse {
            0%, 50%, 100% {
                transform: translateY(0);
            }
            25% {
                transform: translateY(-3px);
            }
        }
    `;
    document.head.appendChild(style);
}); 