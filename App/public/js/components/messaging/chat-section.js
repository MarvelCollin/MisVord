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
        this.processedMessageIds = new Set();
        this.joinedRooms = new Set();
        this.contextMenuVisible = false;
        this.activeMessageActions = null;
        this.currentEditingMessage = null;
        this.scrollListenerActive = false;
        this.loadingOlderMessages = false;
        this.messagesPerPage = 20;
        this.totalMessagesLoaded = 0;
        this.activeReplyingTo = null;
    }
    
    init() {
        console.log('Initializing ChatSection');
        this.loadElements();
        const paramsLoaded = this.loadChatParams();
        
        if (!paramsLoaded) {
            console.error('Failed to load chat parameters, cannot initialize chat');
            this.showErrorMessage('Failed to initialize chat. Missing required parameters.');
            return;
        }
        
        this.setupEventListeners();
        this.loadMessages();
        this.setupIoListeners();
        console.log('ChatSection initialization complete');
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
        
        console.log(`Chat parameters loaded: type=${this.chatType}, targetId=${this.targetId}, userId=${this.userId}`);
        
        if (!this.targetId) {
            console.error('Missing targetId in chat parameters');
            return false;
        }
        
        if (!this.userId) {
            console.error('Missing userId in chat parameters');
            return false;
        }
        
        return true;
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

        document.addEventListener('click', (e) => {
            if (this.contextMenuVisible && !this.contextMenu.contains(e.target)) {
                this.hideContextMenu();
            }
            
            if (!e.target.closest('.message-actions') && this.activeMessageActions) {
                this.hideAllMessageActions();
            }
        });

        this.chatMessages.addEventListener('contextmenu', (e) => {
            const messageGroup = e.target.closest('.message-group');
            if (messageGroup) {
                e.preventDefault();
                this.showContextMenu(e.clientX, e.clientY, messageGroup);
            }
        });
        
        this.chatMessages.addEventListener('mouseover', (e) => {
            const messageContent = e.target.closest('.message-content');
            if (messageContent) {
                this.showMessageActions(messageContent);
            }
        });

        this.chatMessages.addEventListener('mouseout', (e) => {
            const messageContent = e.target.closest('.message-content');
            const relatedTarget = e.relatedTarget;
            
            if (messageContent && !messageContent.contains(relatedTarget) && 
                !relatedTarget?.closest('.message-actions')) {
                this.hideMessageActions(messageContent);
            }
        });
        
        this.chatMessages.addEventListener('click', (e) => {
            const reactionBtn = e.target.closest('.message-action-reaction');
            const replyBtn = e.target.closest('.message-action-reply');
            const editBtn = e.target.closest('.message-action-edit');
            const moreBtn = e.target.closest('.message-action-more');
            
            if (reactionBtn) {
                const messageContent = reactionBtn.closest('.message-content');
                const messageId = messageContent.dataset.messageId;
                this.showEmojiPicker(messageId, reactionBtn);
            } else if (replyBtn) {
                const messageContent = replyBtn.closest('.message-content');
                const messageId = messageContent.dataset.messageId;
                this.replyToMessage(messageId);
            } else if (editBtn) {
                const messageContent = editBtn.closest('.message-content');
                const messageId = messageContent.dataset.messageId;
                this.editMessage(messageId);
            } else if (moreBtn) {
                e.stopPropagation();
                const messageContent = moreBtn.closest('.message-content');
                this.showContextMenu(
                    e.clientX, 
                    e.clientY, 
                    messageContent
                );
            }
        });
    }

    showContextMenu(x, y, messageContent) {
        if (!this.contextMenu) return;
        
        const messageId = messageContent.dataset.messageId || '';
        const isOwnMessage = messageContent.dataset.userId === this.userId;

        if (this.contextMenuVisible && this.contextMenu.dataset.messageId === messageId) {
            this.hideContextMenu();
            return;
        }
        
        this.hideContextMenu();

        this.contextMenu.style.visibility = 'hidden';
        this.contextMenu.classList.remove('hidden');

        const menuWidth = this.contextMenu.offsetWidth;
        const menuHeight = this.contextMenu.offsetHeight;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        let newX = x;
        if (x + menuWidth > windowWidth) {
            newX = x - menuWidth;
        }

        let newY = y;
        if (y + menuHeight > windowHeight) {
            newY = y - menuHeight;
        }
        
        if (newX < 0) newX = 5;
        if (newY < 0) newY = 5;

        this.contextMenu.style.left = `${newX}px`;
        this.contextMenu.style.top = `${newY}px`;
        this.contextMenu.style.visibility = 'visible';
        
        this.contextMenu.dataset.messageId = messageId;
        this.contextMenuVisible = true;
        
        const editBtn = this.contextMenu.querySelector('[data-action="edit"]');
        if (editBtn) {
            editBtn.style.display = isOwnMessage ? 'flex' : 'none';
        }
        
        this.setupContextMenuListeners();
    }
    
    setupContextMenuListeners() {
        if (!this.contextMenu) return;
        
        const buttons = this.contextMenu.querySelectorAll('button[data-action]');
        buttons.forEach(button => {
            button.replaceWith(button.cloneNode(true));
        });
        
        const newButtons = this.contextMenu.querySelectorAll('button[data-action]');
        newButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const action = button.getAttribute('data-action');
                const messageId = this.contextMenu.dataset.messageId;
                
                this.hideContextMenu();
                
                switch (action) {
                    case 'edit':
                        this.editMessage(messageId);
                        break;
                    case 'delete':
                        this.deleteMessage(messageId);
                        break;
                    case 'reply':
                        this.replyToMessage(messageId);
                        break;
                    case 'reaction':
                        this.showEmojiPicker(messageId, button);
                        break;
                    case 'copy':
                        this.copyMessageText(messageId);
                        break;
                    case 'pin':
                        this.pinMessage(messageId);
                        break;
                    case 'thread':
                        this.startThread(messageId);
                        break;
                    case 'copy-id':
                        this.copyToClipboard(messageId);
                        break;
                    case 'copy-link':
                        this.copyMessageLink(messageId);
                        break;
                    case 'mark-unread':
                        this.markAsUnread(messageId);
                        break;
                }
            });
        });
    }
    
    editMessage(messageId) {
        const messageElement = document.querySelector(`.message-content[data-message-id="${messageId}"]`);
        if (!messageElement) return;
        
        const messageTextElement = messageElement.querySelector('.message-main-text');
        if (!messageTextElement) return;
        
        const messageText = messageTextElement.innerText.replace(/ \(edited\)$/, '');
        const messageGroup = messageElement.closest('.message-group');
        
        const editForm = document.createElement('form');
        editForm.className = 'edit-message-form w-full';
        
        const editTextarea = document.createElement('textarea');
        editTextarea.className = 'w-full bg-[#383a40] text-[#dcddde] p-2 rounded focus:outline-none focus:ring-1 focus:ring-[#5865f2] resize-none';
        editTextarea.value = messageText;
        
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'flex items-center justify-between mt-2 text-xs';
        
        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'text-[#b5bac1] hover:underline';
        cancelButton.textContent = 'Cancel';
        
        const saveButton = document.createElement('button');
        saveButton.type = 'submit';
        saveButton.className = 'bg-[#5865f2] hover:bg-[#4752c4] text-white px-3 py-1 rounded';
        saveButton.textContent = 'Save';
        
        const escapeHint = document.createElement('div');
        escapeHint.className = 'text-[#b5bac1]';
        escapeHint.textContent = 'press ESC to cancel • enter to save';
        
        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(escapeHint);
        buttonContainer.appendChild(saveButton);
        
        editForm.appendChild(editTextarea);
        editForm.appendChild(buttonContainer);
        
        const originalContent = messageElement.innerHTML;
        messageElement.innerHTML = '';
        messageElement.appendChild(editForm);
        
        editTextarea.focus();
        editTextarea.style.height = 'auto';
        editTextarea.style.height = `${editTextarea.scrollHeight}px`;
        
        this.currentEditingMessage = {
            id: messageId,
            element: messageElement,
            originalContent: originalContent
        };
        
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newContent = editTextarea.value.trim();
            if (newContent && newContent !== messageText) {
                this.saveEditedMessage(messageId, newContent);
            } else {
                this.cancelEditMessage();
            }
        });
        
        cancelButton.addEventListener('click', () => {
            this.cancelEditMessage();
        });
        
        editTextarea.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                this.cancelEditMessage();
            } else if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                editForm.dispatchEvent(new Event('submit'));
            }
        });
        
        editTextarea.addEventListener('input', () => {
            editTextarea.style.height = 'auto';
            editTextarea.style.height = `${editTextarea.scrollHeight}px`;
        });
    }
    
    cancelEditMessage() {
        if (!this.currentEditingMessage) return;
        
        const { element, originalContent } = this.currentEditingMessage;
        element.innerHTML = originalContent;
        this.currentEditingMessage = null;
    }
    
    async saveEditedMessage(messageId, newContent) {
        try {
            if (!window.ChatAPI) {
                throw new Error('ChatAPI not available');
            }
            
            await window.ChatAPI.updateMessage(messageId, newContent);
            
            const messageElement = document.querySelector(`.message-content[data-message-id="${messageId}"]`);
            if (messageElement) {
                const contentDiv = messageElement.querySelector('.message-main-text');
                if (contentDiv) {
                    contentDiv.innerHTML = this.formatMessageContent(newContent);

                    let editedBadge = contentDiv.querySelector('.edited-badge');
                    if (!editedBadge) {
                        editedBadge = document.createElement('span');
                        editedBadge.className = 'edited-badge text-xs text-[#a3a6aa] ml-1';
                        contentDiv.appendChild(editedBadge);
                    }
                    editedBadge.textContent = '(edited)';
                }
            }
            
            this.currentEditingMessage = null;
            
        } catch (error) {
            console.error('Failed to update message:', error);
            this.showNotification('Failed to update message', 'error');
            this.cancelEditMessage();
        }
    }
    
    async deleteMessage(messageId) {
        if (!confirm('Are you sure you want to delete this message?')) {
            return;
        }
        
        try {
            if (!window.ChatAPI) {
                throw new Error('ChatAPI not available');
            }
            
            await window.ChatAPI.deleteMessage(messageId);
            
            const messageElement = document.querySelector(`.message-content[data-message-id="${messageId}"]`);
            if (messageElement) {
                const messageGroup = messageElement.closest('.message-group');
                
                if (messageGroup.querySelectorAll('.message-content').length === 1) {
                    messageGroup.remove();
                } else {
                    messageElement.remove();
                }
            }
            
        } catch (error) {
            console.error('Failed to delete message:', error);
            this.showNotification('Failed to delete message', 'error');
        }
    }
    
    copyMessageText(messageId) {
        const messageElement = document.querySelector(`.message-content[data-message-id="${messageId}"]`);
        if (!messageElement) return;
        
        const textElement = messageElement.querySelector('.message-main-text');
        if (!textElement) return;
        
        const text = textElement.innerText;
        this.copyToClipboard(text);
        this.showNotification('Message copied to clipboard');
    }
    
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showNotification('Copied to clipboard');
        }).catch(err => {
            console.error('Failed to copy text:', err);
            this.showNotification('Failed to copy to clipboard', 'error');
        });
    }
    
    copyMessageLink(messageId) {
        const url = `${window.location.href}?messageId=${messageId}`;
        this.copyToClipboard(url);
    }
    
    markAsUnread(messageId) {
        this.showNotification('Message marked as unread');
    }
    
    pinMessage(messageId) {
        this.showNotification('Feature coming soon: Pin message');
    }
    
    startThread(messageId) {
        this.showNotification('Feature coming soon: Thread messages');
    }

    hideContextMenu() {
        if (!this.contextMenu) return;
        
        this.contextMenu.classList.add('hidden');
        this.contextMenu.style.visibility = 'hidden';
        this.contextMenuVisible = false;
    }

    showMessageActions(messageContent) {
        let actions = messageContent.querySelector('.message-actions');
        
        if (!actions) {
            actions = this.createMessageActions(messageContent);
            messageContent.appendChild(actions);
        }
        
        if (actions) {
            actions.classList.remove('hidden');
            actions.classList.add('visible');
            this.activeMessageActions = actions;
        }
    }

    hideMessageActions(messageContent) {
        const actions = messageContent.querySelector('.message-actions');
        if (actions) {
            actions.classList.add('hidden');
            actions.classList.remove('visible');
        }
    }
    
    hideAllMessageActions() {
        if (this.activeMessageActions) {
            this.activeMessageActions.classList.add('hidden');
            this.activeMessageActions.classList.remove('visible');
            this.activeMessageActions = null;
        }
        
        document.querySelectorAll('.message-actions.visible').forEach(element => {
            element.classList.add('hidden');
            element.classList.remove('visible');
        });
    }
    
    createMessageActions(messageContent) {
        const isOwnMessage = messageContent.dataset.userId === this.userId;
        
        const actions = document.createElement('div');
        actions.className = 'message-actions absolute -top-4 right-4 bg-[#2b2d31] rounded-md shadow-lg flex items-center p-1 space-x-1 z-10';
        
        const createButton = (icon, title, actionClass) => {
            const button = document.createElement('button');
            button.className = `${actionClass} w-8 h-8 flex items-center justify-center text-[#b9bbbe] hover:text-white rounded hover:bg-[#3c3f45] transition-colors`;
            button.innerHTML = `<i class="fas ${icon}"></i>`;
            button.title = title;
            return button;
        };
        
        const reactionBtn = createButton('fa-face-smile', 'Add Reaction', 'message-action-reaction');
        const replyBtn = createButton('fa-reply', 'Reply', 'message-action-reply');
        const moreBtn = createButton('fa-ellipsis-h', 'More', 'message-action-more');
        
        actions.appendChild(reactionBtn);
        actions.appendChild(replyBtn);
        
        if (isOwnMessage) {
            const editBtn = createButton('fa-pen-to-square', 'Edit', 'message-action-edit');
            actions.appendChild(editBtn);
        }
        
        actions.appendChild(moreBtn);
        
        return actions;
    }
    
    showEmojiPicker(messageId, targetElement) {
        console.log('Show emoji picker for message:', messageId);
    }
    
    replyToMessage(messageId) {
        const messageElement = document.querySelector(`.message-content[data-message-id="${messageId}"]`);
        if (!messageElement) return;
        
        const messageTextElement = messageElement.querySelector('.message-main-text');
        const messageText = messageTextElement ? messageTextElement.innerText : 'a message';
        const messageGroup = messageElement.closest('.message-group');
        const userId = messageElement.dataset.userId;
        
        const usernameElement = messageGroup.querySelector('.font-medium');
        const username = usernameElement ? usernameElement.textContent.trim() : 'Unknown User';
        
        this.activeReplyingTo = {
            messageId,
            content: messageText,
            userId,
            username
        };
        
        this.showReplyingUI(username, messageText);
        
        if (this.messageInput) {
            this.messageInput.focus();
        }
    }
    
    showReplyingUI(username, messageText) {
        let replyContainer = document.getElementById('reply-container');
        if (!replyContainer) {
            replyContainer = document.createElement('div');
            replyContainer.id = 'reply-container';
            replyContainer.className = 'bg-[#2b2d31] border-t border-[#1e1f22] p-2 flex items-center';
            
            if (this.messageForm && this.messageForm.parentNode) {
                this.messageForm.parentNode.insertBefore(replyContainer, this.messageForm);
            }
        } else {
            replyContainer.innerHTML = '';
        }
        
        const replyPreview = document.createElement('div');
        replyPreview.className = 'flex-grow flex items-center text-sm';
        
        const replyIcon = document.createElement('span');
        replyIcon.className = 'text-[#b9bbbe] mr-2';
        replyIcon.innerHTML = '<i class="fas fa-reply"></i>';
        
        const replyInfo = document.createElement('div');
        replyInfo.className = 'flex-grow';
        
        const replyingTo = document.createElement('div');
        replyingTo.className = 'text-[#dcddde] font-medium';
        replyingTo.textContent = `Replying to ${username}`;
        
        const replyContent = document.createElement('div');
        replyContent.className = 'text-[#b9bbbe] truncate max-w-md';
        replyContent.textContent = messageText;
        
        replyInfo.appendChild(replyingTo);
        replyInfo.appendChild(replyContent);
        
        const cancelButton = document.createElement('button');
        cancelButton.className = 'ml-2 text-[#b9bbbe] hover:text-white';
        cancelButton.innerHTML = '<i class="fas fa-times"></i>';
        cancelButton.title = 'Cancel Reply';
        cancelButton.addEventListener('click', () => this.cancelReply());
        
        replyPreview.appendChild(replyIcon);
        replyPreview.appendChild(replyInfo);
        replyContainer.appendChild(replyPreview);
        replyContainer.appendChild(cancelButton);
    }
    
    cancelReply() {
        this.activeReplyingTo = null;
        const replyContainer = document.getElementById('reply-container');
        if (replyContainer) {
            replyContainer.remove();
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
                avatar_url: document.querySelector('meta[name="user-avatar"]')?.content || '/assets/main-logo.png',
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
            
            const options = {};
            
            if (this.activeReplyingTo) {
                tempMessage.reply_message_id = this.activeReplyingTo.messageId;
                tempMessage.reply_data = this.activeReplyingTo;
                
                options.replyToMessageId = this.activeReplyingTo.messageId;
                options.replyData = this.activeReplyingTo;
                
                this.cancelReply();
            }
            
            this.processedMessageIds.add(messageId);
            this.addMessage(tempMessage);
            
            await window.ChatAPI.sendMessage(this.targetId, content, this.chatType, options);
            
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
            
            this.processedMessageIds.delete(messageId);
            
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
            avatar_url: message.avatar_url || message.message?.avatar_url || '/assets/main-logo.png',
            sent_at: message.timestamp || message.sent_at || Date.now(),
            isLocalOnly: message.isLocalOnly || false
        };
        
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
        messageGroup.className = 'message-group flex p-1 px-4 py-1 relative hover:bg-[rgba(4,4,5,0.07)]';
        messageGroup.setAttribute('data-user-id', message.user_id);
        
        const avatarContainer = document.createElement('div');
        avatarContainer.className = 'flex-shrink-0 mr-3 mt-0.5';
        
        const avatar = document.createElement('img');
        avatar.src = message.avatar_url || '/assets/main-logo.png';
        avatar.className = 'w-10 h-10 rounded-full';
        avatar.alt = `${message.username}'s avatar`;
        avatar.onerror = function() {
            this.onerror = null;
            this.src = '/assets/main-logo.png';
        };
        
        avatarContainer.appendChild(avatar);
        
        const messageContent = document.createElement('div');
        messageContent.className = 'flex-grow relative';
        
        const headerRow = document.createElement('div');
        headerRow.className = 'flex items-center mb-0.5';
        
        const usernameSpan = document.createElement('span');
        usernameSpan.className = 'font-medium text-[#f2f3f5] hover:underline cursor-pointer';
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
        
        return messageGroup;
    }
    
    createMessageContent(message, isOwnMessage = false) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message-content py-0.5 hover:bg-[rgba(4,4,5,0.07)] rounded px-1 -ml-1 relative';
        messageElement.setAttribute('data-message-id', message.id);
        messageElement.setAttribute('data-user-id', message.user_id || message.userId);
        
        if (isOwnMessage) {
            messageElement.classList.add('own-message');
        }
        
        if (message.reply_message_id || message.reply_data) {
            const replyContainer = document.createElement('div');
            replyContainer.className = 'reply-container';

            const replyLine = document.createElement('div');
            replyLine.className = 'reply-line';
            replyContainer.appendChild(replyLine);

            const replyContent = document.createElement('div');
            replyContent.className = 'reply-content cursor-pointer';
            
            if (message.reply_data) {
                const replyAvatar = document.createElement('img');
                replyAvatar.src = message.reply_data.avatar_url || '/public/assets/default-avatar.svg';
                replyAvatar.className = 'reply-avatar';
                replyAvatar.onerror = function() { this.src = '/public/assets/default-avatar.svg'; };

                const replyUsername = document.createElement('span');
                replyUsername.className = 'reply-username';
                replyUsername.textContent = message.reply_data.username;

                const replyMessage = document.createElement('span');
                replyMessage.className = 'reply-message-text';
                replyMessage.textContent = this.truncateText(message.reply_data.content, 50);
                
                replyContent.appendChild(replyAvatar);
                replyContent.appendChild(replyUsername);
                replyContent.appendChild(replyMessage);

                replyContent.addEventListener('click', () => {
                    const repliedMessage = document.querySelector(`.message-content[data-message-id="${message.reply_data.messageId}"]`);
                    if (repliedMessage) {
                        repliedMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        repliedMessage.classList.add('highlight-message');
                        setTimeout(() => {
                            repliedMessage.classList.remove('highlight-message');
                        }, 2000);
                    } else {
                        this.showNotification('Original message not loaded', 'info');
                    }
                });
            } else {
                replyContent.textContent = 'Replying to an unavailable message';
                replyContent.classList.add('text-xs', 'text-gray-400');
            }
            replyContainer.appendChild(replyContent);
            messageElement.insertBefore(replyContainer, messageElement.firstChild);
        }
        
        const contentElement = document.createElement('div');
        contentElement.className = 'message-main-text text-[#dbdee1] whitespace-pre-wrap break-words';
        contentElement.innerHTML = this.formatMessageContent(message.content);
        
        messageElement.appendChild(contentElement);
        
        if (message.edited_at) {
            const editedBadge = document.createElement('span');
            editedBadge.className = 'text-xs text-[#a3a6aa] ml-1';
            editedBadge.textContent = '(edited)';
            contentElement.appendChild(editedBadge);
        }

        return messageElement;
    }
    
    formatMessageContent(content) {
        if (!content) return '';
        
        const escapedContent = content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

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
        const notification = document.createElement('div');
        notification.textContent = message;
        
        let bgColor = 'bg-[#5865f2]';
        if (type === 'error') bgColor = 'bg-[#ed4245]';
        else if (type === 'warning') bgColor = 'bg-yellow-500';
        else if (type === 'info') bgColor = 'bg-blue-500';
        
        notification.className = `fixed bottom-28 right-4 ${bgColor} text-white px-3 py-2 rounded-lg shadow-lg text-sm z-50`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
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
                    const messageId = data.id || `${data.userId}-${data.timestamp}`;
                    data.id = messageId;
                    
                    if (!self.processedMessageIds.has(messageId)) {
                        self.processedMessageIds.add(messageId);
                        
                        if (data.userId != self.userId) {
                            self.addMessage(data);
                        }
                    }
                }
            });
            
            io.on('user-message-dm', function(data) {
                console.log('Received DM message:', data);
                if ((self.chatType === 'direct' || self.chatType === 'dm') && data.roomId == self.targetId) {
                    const messageId = data.id || `${data.userId}-${data.timestamp}`;
                    data.id = messageId;
                    
                    if (!self.processedMessageIds.has(messageId)) {
                        self.processedMessageIds.add(messageId);
                        
                        if (data.userId != self.userId) {
                            self.addMessage(data);
                        }
                    }
                }
            });
            
            io.on('message-sent', function(data) {
                console.log('Message confirmation received:', data);
                const tempMessage = document.querySelector(`.message-content[data-message-id^="local-"]`);
                if (tempMessage) {
                    tempMessage.setAttribute('data-message-id', data.id);
                    self.processedMessageIds.add(data.id);
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
        
        if (roomId && !this.joinedRooms.has(`channel-${roomId}`)) {
            window.globalSocketManager.joinChannel(roomId);
            this.joinedRooms.add(`channel-${roomId}`);
        } else if (dmRoomId && !this.joinedRooms.has(`dm-${dmRoomId}`)) {
            window.globalSocketManager.joinDMRoom(dmRoomId);
            this.joinedRooms.add(`dm-${dmRoomId}`);
        }
    }
    
    async loadMessages(offset = 0, limit = 20) {
        if (!this.targetId || !this.chatType) {
            console.error('Cannot load messages: missing chat target ID or type');
            return;
        }
        
        try {
            if (!window.ChatAPI) {
                console.error('ChatAPI not available');
                return;
            }
            
            if (offset === 0) {
                this.showLoadingSkeletons();
            } else {
                this.showLoadMoreIndicator();
            }
            
            console.log(`⏳ Loading messages for ${this.chatType} ${this.targetId}, offset: ${offset}, limit: ${limit}`);
            
            const response = await window.ChatAPI.getMessages(
                this.chatType === 'direct' ? 'dm' : this.chatType, 
                this.targetId,
                limit,
                offset
            );
            
            console.log('📥 Response received:', response);
            
            if (offset === 0) {
                this.hideLoadingIndicator();
            } else {
                this.hideLoadMoreIndicator();
            }
            
            let messages = [];
            let hasMore = false;
            
            if (response && Array.isArray(response.messages)) {
                messages = response.messages;
                hasMore = response.has_more;
                console.log(`✅ Found ${messages.length} messages in response.messages`);
            } else if (response && response.data && Array.isArray(response.data.messages)) {
                messages = response.data.messages;
                hasMore = response.data.has_more;
                console.log(`✅ Found ${messages.length} messages in response.data.messages`);
            } else {
                console.error('Could not find messages array in response:', response);
                if (offset === 0) {
                    this.showEmptyState();
                }
                return;
            }
            
            if (messages && messages.length > 0) {
                messages.forEach(msg => {
                    this.processedMessageIds.add(msg.id);
                });
                
                if (offset === 0) {
                    this.renderMessages(messages);
                    
                    if (messages.length >= limit) {
                        this.addLoadMoreButton();
                    }
                } else {
                    this.prependMessages(messages);
                    
                    if (messages.length < limit) {
                        this.removeLoadMoreButton();
                    }
                }
                
                if (offset === 0) {
                    this.scrollToBottom();
                }
            } else {
                if (offset === 0) {
                    this.showEmptyState();
                }
            }
            
            this.messagesLoaded = true;
            
        } catch (error) {
            this.hideLoadingIndicator();
            this.hideLoadMoreIndicator();
            console.error('Failed to load messages:', error);
            this.showErrorMessage(`Failed to load messages: ${error.message}`);
        }
    }
    
    showLoadingSkeletons() {
        if (!this.chatMessages) return;
        
        this.chatMessages.innerHTML = '';
        
        for (let i = 0; i < 5; i++) {
            const skeleton = this.createMessageSkeleton(i % 2 === 0);
            this.chatMessages.appendChild(skeleton);
        }
    }
    
    createMessageSkeleton(isAlternate = false) {
        const skeletonGroup = document.createElement('div');
        skeletonGroup.className = 'message-group flex p-1 px-4 py-1 relative animate-pulse';
        
        const avatarContainer = document.createElement('div');
        avatarContainer.className = 'flex-shrink-0 mr-3 mt-0.5';
        
        const avatar = document.createElement('div');
        avatar.className = 'w-10 h-10 rounded-full bg-[#3c3f45]';
        
        avatarContainer.appendChild(avatar);
        
        const messageContent = document.createElement('div');
        messageContent.className = 'flex-grow';
        
        const headerRow = document.createElement('div');
        headerRow.className = 'flex items-center mb-1';
        
        const usernameBar = document.createElement('div');
        usernameBar.className = 'h-4 bg-[#3c3f45] rounded w-24';
        
        const timeBar = document.createElement('div');
        timeBar.className = 'h-3 bg-[#3c3f45] rounded w-12 ml-2';
        
        headerRow.appendChild(usernameBar);
        headerRow.appendChild(timeBar);
        
        const contentBar1 = document.createElement('div');
        contentBar1.className = 'h-4 bg-[#3c3f45] rounded w-full max-w-lg mb-1';
        
        const contentBar2 = document.createElement('div');
        contentBar2.className = 'h-4 bg-[#3c3f45] rounded w-3/4 max-w-md';
        
        if (isAlternate) {
            contentBar2.classList.add('w-1/2');
            contentBar2.classList.remove('w-3/4');
        }
        
        messageContent.appendChild(headerRow);
        messageContent.appendChild(contentBar1);
        messageContent.appendChild(contentBar2);
        
        skeletonGroup.appendChild(avatarContainer);
        skeletonGroup.appendChild(messageContent);
        
        return skeletonGroup;
    }
    
    addLoadMoreButton() {
        if (!this.chatMessages) return;
        
        const loadMoreDiv = document.createElement('div');
        loadMoreDiv.id = 'load-more-messages';
        loadMoreDiv.className = 'flex justify-center items-center p-3 mb-2';
        
        const loadMoreBtn = document.createElement('button');
        loadMoreBtn.className = 'text-[#b5bac1] hover:text-white bg-[#3c3f45] hover:bg-[#4d5158] px-4 py-1 rounded text-sm transition-colors';
        loadMoreBtn.textContent = 'Load older messages';
        loadMoreBtn.addEventListener('click', () => this.loadOlderMessages());
        
        loadMoreDiv.appendChild(loadMoreBtn);
        
        this.chatMessages.insertBefore(loadMoreDiv, this.chatMessages.firstChild);
        
        this.setupScrollListener();
    }
    
    setupScrollListener() {
        if (!this.chatMessages) return;
        
        this.scrollListenerActive = true;
        
        this.chatMessages.addEventListener('scroll', () => {
            if (!this.scrollListenerActive) return;
            
            const { scrollTop } = this.chatMessages;
            if (scrollTop < 100) {
                this.scrollListenerActive = false;
                this.loadOlderMessages();
            }
        });
    }
    
    loadOlderMessages() {
        if (this.loadingOlderMessages) return;
        
        this.loadingOlderMessages = true;
        
        const messageCount = this.chatMessages.querySelectorAll('.message-group:not(#load-more-messages):not(.loading-indicator)').length;
        this.loadMessages(messageCount, 20);
        
        setTimeout(() => {
            this.loadingOlderMessages = false;
            this.scrollListenerActive = true;
        }, 1000);
    }
    
    removeLoadMoreButton() {
        const loadMoreElem = document.getElementById('load-more-messages');
        if (loadMoreElem) {
            loadMoreElem.remove();
        }
    }
    
    showLoadMoreIndicator() {
        const loadMoreElem = document.getElementById('load-more-messages');
        if (loadMoreElem) {
            loadMoreElem.innerHTML = `
                <div class="flex items-center">
                    <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-[#5865f2] mr-2"></div>
                    <span class="text-[#b5bac1]">Loading older messages...</span>
                </div>
            `;
        }
    }
    
    hideLoadMoreIndicator() {
        const loadMoreElem = document.getElementById('load-more-messages');
        if (loadMoreElem) {
            const loadMoreBtn = document.createElement('button');
            loadMoreBtn.className = 'text-[#b5bac1] hover:text-white bg-[#3c3f45] hover:bg-[#4d5158] px-4 py-1 rounded text-sm transition-colors';
            loadMoreBtn.textContent = 'Load older messages';
            loadMoreBtn.addEventListener('click', () => this.loadOlderMessages());
            
            loadMoreElem.innerHTML = '';
            loadMoreElem.appendChild(loadMoreBtn);
        }
    }
    
    prependMessages(messages) {
        if (!this.chatMessages) return;
        
        let insertionPoint = this.chatMessages.firstChild;
        if (insertionPoint && insertionPoint.id === 'load-more-messages') {
            insertionPoint = insertionPoint.nextSibling;
        }
        
        let lastSenderId = null;
        let messageGroup = null;
        
        [...messages].reverse().forEach(message => {
            if (message.user_id !== lastSenderId) {
                messageGroup = this.createMessageGroup(message);
                if (insertionPoint) {
                    this.chatMessages.insertBefore(messageGroup, insertionPoint);
                } else {
                    this.chatMessages.appendChild(messageGroup);
                }
                lastSenderId = message.user_id;
            } else {
                const messageContent = this.createMessageContent(message);
                const contents = messageGroup.querySelector('.message-contents');
                if (contents) {
                    contents.prepend(messageContent);
                }
            }
        });
    }
    
    showEmptyState() {
        if (!this.chatMessages) return;
        
        this.chatMessages.innerHTML = `
            <div class="flex flex-col items-center justify-center p-8 text-[#b5bac1] h-full">
                <svg class="w-16 h-16 mb-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http:
                    <path fill-rule="evenodd" d="M18 10c0 4.418-3.582 8-8 8s-8-3.582-8-8 3.582-8 8-8 8 3.582 8 8zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                </svg>
                <p class="text-lg font-medium">No messages yet</p>
                <p class="text-sm mt-2">Start the conversation by sending a message!</p>
            </div>
        `;
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
}
