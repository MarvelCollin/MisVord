import { showToast } from '../../core/ui/toast.js';

document.addEventListener('DOMContentLoaded', function() {
    console.log('Chat section script loaded via DOM content loaded');
    if (!window.chatSection && !isExcludedPage()) {
        initializeChatSection();
    }
});

function isExcludedPage() {
    const pageType = document.body.getAttribute('data-page');
    return pageType === 'admin' || pageType === 'nitro';
}

function initializeChatSection() {
    if (typeof window.ChatAPI === 'undefined') {
        console.log('ChatAPI not ready, retrying...');
        setTimeout(initializeChatSection, 100);
        return;
    }
    
    console.log('Initializing ChatSection with ChatAPI ready');
    const chatSection = new ChatSection();
    chatSection.init();
    window.chatSection = chatSection;
}

console.log('Chat section script immediate execution');
if (document.readyState === 'complete' && !window.chatSection && !isExcludedPage()) {
    setTimeout(() => {
        console.log('Chat section delayed initialization');
        initializeChatSection();
    }, 100);
}

class ChatSection {
    constructor() {
        this.chatMessages = null;
        this.messageInput = null;
        this.sendButton = null;
        this.fileUploadInput = null;
        this.fileUploadPreview = null;
        this.currentFileUpload = null;
        this.currentReplyMessageId = null;
        this.replyingContainer = null;
        this.typingIndicator = null;
        this.typingUsers = new Map();
        this.typingTimeout = null;
        this.messagesLoaded = false;
        this.joinedRooms = new Set();
        this.skeletonLoader = null;
        
        this.chatType = null;
        this.targetId = null;
        this.userId = null;
        this.currentServerId = null;
        this.processedMessageIds = new Set();
        
        this.init();
    }
    
    init() {
        console.log('Initializing ChatSection');
        this.loadElements();
        
        if (!this.chatMessages) {
            console.warn('Chat messages element not found, aborting ChatSection initialization');
            return;
        }
        
        const paramsLoaded = this.loadChatParams();
        
        if (!paramsLoaded) {
            console.error('Failed to load chat parameters, cannot initialize chat');
            this.showErrorMessage('Failed to initialize chat. Missing required parameters.');
            return;
        }
        
        this.showLoadingSkeletons();
        
        this.setupEventListeners();
        
        setTimeout(() => {
            this.loadMessages();
        }, 100);
        
        this.setupIoListeners();
        console.log('ChatSection initialization complete');
    }
    
    loadElements() {
        this.chatMessages = document.getElementById('chat-messages');
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.fileUploadInput = document.getElementById('file-upload');
        this.fileUploadPreview = document.getElementById('file-preview');
        this.contextMenu = document.getElementById('message-context-menu');
        
        if (!this.chatMessages) {
            console.error('Chat messages element not found');
        }
        
        if (!this.messageInput) {
            console.error('Message input not found');
        }
        
        if (!this.sendButton) {
            console.error('Send button not found');
        }
        
        if (!this.fileUploadInput) {
            console.error('File upload input not found');
        }
        
        if (!this.fileUploadPreview) {
            console.error('File preview not found');
        }
        
        if (this.chatMessages && window.ChatSkeletonLoader) {
            this.skeletonLoader = new window.ChatSkeletonLoader(this.chatMessages);
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
        
        if (this.fileUploadInput) {
            this.fileUploadInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.handleFileSelection(file);
                }
            });
        }
        
        if (this.fileUploadPreview) {
            this.fileUploadPreview.addEventListener('click', () => {
                this.removeFileUpload();
            });
        }

        document.addEventListener('click', (e) => {
            if (this.contextMenu && this.contextMenu.contains(e.target)) {
                this.hideContextMenu();
            }
            
            if (!e.target.closest('.message-actions') && this.activeMessageActions) {
                this.hideAllMessageActions();
            }
        });

        if (!this.chatMessages) return;

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
                    
                    if (window.emojiSocketHandler && typeof window.emojiSocketHandler.showMenu === 'function') {
                        const rect = reactionBtn.getBoundingClientRect();
                        const x = rect.left + window.scrollX;
                        const y = rect.bottom + window.scrollY + 5;
                        window.emojiSocketHandler.showMenu(messageId, x, y);
                    } else {
                        this.showEmojiPicker(messageId, reactionBtn);
                    }
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
        
        const deleteBtn = this.contextMenu.querySelector('[data-action="delete"]');
        if (deleteBtn) {
            deleteBtn.style.display = isOwnMessage ? 'flex' : 'none';
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
        const messageElement = document.querySelector(`.message-content[data-message-id="${messageId}"]`);
        if (!messageElement) return;
        
        const messageGroup = messageElement.closest('.message-group');
        const usernameElement = messageGroup.querySelector('.message-username');
        const username = usernameElement ? usernameElement.textContent.trim() : 'Unknown User';
        const messageTextElement = messageElement.querySelector('.message-main-text');
        const messageText = messageTextElement ? messageTextElement.innerText : '';
        
        this.showDeleteConfirmModal(messageId, username, messageText);
    }
    
    showDeleteConfirmModal(messageId, username, messageText) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.id = 'delete-message-modal';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'bg-[#36393f] rounded-lg p-6 max-w-md w-full mx-4';
        
        modalContent.innerHTML = `
            <h2 class="text-xl font-semibold text-white mb-4">Delete Message</h2>
            <p class="text-[#b9bbbe] mb-4">Are you sure you want to delete this message?</p>
            
            <div class="bg-[#2f3136] rounded p-3 mb-4">
                <div class="flex items-center mb-2">
                    <div class="w-8 h-8 bg-[#5865f2] rounded-full flex items-center justify-center mr-3">
                        <span class="text-white text-sm font-semibold">${username.charAt(0).toUpperCase()}</span>
                    </div>
                    <span class="text-white font-medium">${username}</span>
                    <span class="text-[#72767d] text-xs ml-2">Today</span>
                </div>
                <div class="text-[#dcddde] text-sm">${messageText.substring(0, 100)}${messageText.length > 100 ? '...' : ''}</div>
            </div>
            
            <div class="flex justify-end space-x-3">
                <button id="cancel-delete" class="px-4 py-2 text-[#b9bbbe] hover:text-white transition-colors">
                    Cancel
                </button>
                <button id="confirm-delete" class="px-4 py-2 bg-[#da373c] hover:bg-[#c92a2a] text-white rounded transition-colors">
                    Delete
                </button>
            </div>
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        const cancelBtn = modal.querySelector('#cancel-delete');
        const confirmBtn = modal.querySelector('#confirm-delete');
        
        const closeModal = () => {
            modal.remove();
        };
        
        cancelBtn.addEventListener('click', closeModal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        confirmBtn.addEventListener('click', async () => {
            closeModal();
            await this.executeDeleteMessage(messageId);
        });
        
        document.addEventListener('keydown', function escapeHandler(e) {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escapeHandler);
        }
        });
    }
    
    async executeDeleteMessage(messageId) {
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
            
            try {
                if (typeof showToast === 'function') {
                    showToast('Message deleted successfully', 'success', 3000);
                } else if (window.showToast && typeof window.showToast === 'function') {
                    window.showToast('Message deleted successfully', 'success', 3000);
                } else {
                    this.showNotification('Message deleted successfully', 'success');
                }
            } catch (toastError) {
                console.warn('Toast notification failed, using fallback:', toastError);
                this.showNotification('Message deleted successfully', 'success');
            }
            
        } catch (error) {
            console.error('Failed to delete message:', error);
            try {
                if (typeof showToast === 'function') {
                    showToast('Failed to delete message', 'error', 5000);
                } else if (window.showToast && typeof window.showToast === 'function') {
                    window.showToast('Failed to delete message', 'error', 5000);
                } else {
            this.showNotification('Failed to delete message', 'error');
                }
            } catch (toastError) {
                console.warn('Toast notification failed, using fallback:', toastError);
                this.showNotification('Failed to delete message', 'error');
            }
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
            messageContent.style.position = 'relative';
            messageContent.appendChild(actions);
        }
        
        if (actions) {
            actions.classList.remove('hidden');
            actions.classList.add('visible');
            actions.style.opacity = '1';
            actions.style.visibility = 'visible';
            this.activeMessageActions = actions;
        }
    }

    hideMessageActions(messageContent) {
        const actions = messageContent.querySelector('.message-actions');
        if (actions) {
            actions.classList.add('hidden');
            actions.classList.remove('visible');
            actions.style.opacity = '0';
            actions.style.visibility = 'hidden';
        }
    }
    
    hideAllMessageActions() {
        if (this.activeMessageActions) {
            this.activeMessageActions.classList.add('hidden');
            this.activeMessageActions.classList.remove('visible');
            this.activeMessageActions.style.opacity = '0';
            this.activeMessageActions.style.visibility = 'hidden';
            this.activeMessageActions = null;
        }
        
        document.querySelectorAll('.message-actions.visible').forEach(element => {
            element.classList.add('hidden');
            element.classList.remove('visible');
            element.style.opacity = '0';
            element.style.visibility = 'hidden';
        });
    }
    
    createMessageActions(messageContent) {
        const isOwnMessage = messageContent.dataset.userId === this.userId;
        
        const actions = document.createElement('div');
        actions.className = 'message-actions absolute -top-4 right-4 bg-[#2b2d31] rounded-md shadow-lg flex items-center p-1 space-x-1 z-10 hidden';
        actions.style.opacity = '0';
        actions.style.visibility = 'hidden';
        
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
        if (!window.emojiSocketHandler) {
            this.showNotification('Emoji picker not loaded', 'error');
            return;
        }
        
        if (!targetElement) {
            return;
        }
        
        const rect = targetElement.getBoundingClientRect();
        const x = rect.left + window.scrollX;
        const y = rect.bottom + window.scrollY + 5;
        
        const menuWidth = 250;
        const menuHeight = 200;
        
        const viewportWidth = window.innerWidth;
        let adjustedX = x;
        if (x + menuWidth > viewportWidth) {
            adjustedX = viewportWidth - menuWidth - 10;
        }
        
        const viewportHeight = window.innerHeight;
        let adjustedY = y;
        if (y + menuHeight > viewportHeight) {
            adjustedY = rect.top + window.scrollY - menuHeight - 5;
        }
        
        window.emojiSocketHandler.showMenu(messageId, adjustedX, adjustedY);
        
        const event = new CustomEvent('emoji-menu-requested', {
            detail: { messageId, x: adjustedX, y: adjustedY }
        });
        document.dispatchEvent(event);
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
            
            if (this.messageInput && this.messageInput.parentNode) {
                this.messageInput.parentNode.insertBefore(replyContainer, this.messageInput);
            }
        } else {
            replyContainer.innerHTML = '';
        }
        
        const replyInfo = document.createElement('div');
        replyInfo.className = 'reply-info';
        
        const replyIcon = document.createElement('i');
        replyIcon.className = 'fas fa-reply';
        
        const replyingTo = document.createElement('div');
        replyingTo.className = 'replying-to';
        replyingTo.textContent = `Replying to ${username}`;
        
        const replyPreview = document.createElement('div');
        replyPreview.className = 'reply-preview';
        replyPreview.textContent = messageText;
        
        const cancelButton = document.createElement('button');
        cancelButton.innerHTML = '<i class="fas fa-times"></i>';
        cancelButton.title = 'Cancel Reply';
        cancelButton.addEventListener('click', () => this.cancelReply());
        
        replyInfo.appendChild(replyIcon);
        replyInfo.appendChild(replyingTo);
        
        replyContainer.appendChild(replyInfo);
        replyContainer.appendChild(replyPreview);
        replyContainer.appendChild(cancelButton);
    }
    
    cancelReply() {
        this.activeReplyingTo = null;
        const replyContainer = document.getElementById('reply-container');
        if (replyContainer) {
            replyContainer.style.animation = 'replyInputSlideOut 0.2s ease-in forwards';
            setTimeout(() => {
                if (replyContainer.parentNode) {
                    replyContainer.remove();
                }
            }, 200);
        }
    }
    
    handleFileSelection(file) {
        if (file.size > this.maxFileSize) {
            this.showNotification(`File is too large. Maximum size is ${this.formatFileSize(this.maxFileSize)}`, 'error');
            return;
        }

        this.currentFileUpload = file;
        
        const filePreview = document.getElementById('file-preview');
        const filePreviewName = document.getElementById('file-preview-name');
        const filePreviewSize = document.getElementById('file-preview-size');
        const filePreviewImage = document.getElementById('file-preview-image');
        const filePreviewIcon = document.getElementById('file-preview-icon');
        
        if (filePreviewName) filePreviewName.textContent = file.name;
        if (filePreviewSize) filePreviewSize.textContent = this.formatFileSize(file.size);
        
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (filePreviewImage) {
                    filePreviewImage.style.display = 'block';
                    filePreviewImage.style.backgroundImage = `url(${e.target.result})`;
                    filePreviewImage.style.backgroundSize = 'contain';
                    filePreviewImage.style.backgroundPosition = 'center';
                    filePreviewImage.style.backgroundRepeat = 'no-repeat';
                    filePreviewImage.style.height = '150px';
                }
                if (filePreviewIcon) filePreviewIcon.style.display = 'none';
            };
            reader.readAsDataURL(file);
        } else {
            if (filePreviewImage) filePreviewImage.style.display = 'none';
            if (filePreviewIcon) {
                filePreviewIcon.style.display = 'block';
                
                const fileTypeIcon = this.getFileTypeIcon(file.type);
                filePreviewIcon.innerHTML = `<i class="${fileTypeIcon}"></i>`;
            }
        }
        
        if (filePreview) filePreview.classList.remove('hidden');
        this.updateSendButton();
    }
    
    removeFileUpload() {
        this.currentFileUpload = null;
        
        const filePreview = document.getElementById('file-preview');
        const fileUpload = document.getElementById('file-upload');
        
        if (filePreview) filePreview.classList.add('hidden');
        if (fileUpload) fileUpload.value = '';
        
        this.updateSendButton();
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    getFileTypeIcon(mimeType) {
        if (mimeType.startsWith('image/')) return 'fas fa-file-image';
        if (mimeType.startsWith('video/')) return 'fas fa-file-video';
        if (mimeType.startsWith('audio/')) return 'fas fa-file-audio';
        if (mimeType.includes('pdf')) return 'fas fa-file-pdf';
        if (mimeType.includes('word') || mimeType.includes('document')) return 'fas fa-file-word';
        if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'fas fa-file-excel';
        if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'fas fa-file-powerpoint';
        if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'fas fa-file-archive';
        if (mimeType.includes('text/')) return 'fas fa-file-alt';
        if (mimeType.includes('code') || mimeType.includes('javascript') || mimeType.includes('html') || mimeType.includes('css')) return 'fas fa-file-code';
        
        return 'fas fa-file';
    }
    
    updateSendButton() {
        if (!this.sendButton) return;
        
        const hasContent = (this.messageInput && this.messageInput.value.trim().length > 0) || this.currentFileUpload;
        
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
    
    async sendMessage() {
        if (!this.messageInput) {
            console.error('❌ Message input not found');
            return;
        }
        
        const content = this.messageInput.value.trim();
        if (!content && !this.currentFileUpload) {
            console.warn('⚠️ No message content or file to send');
            return;
        }
        
        console.log('📤 Attempting to send message:', { 
            content: content.substring(0, 50) + '...', 
            chatType: this.chatType, 
            targetId: this.targetId,
            hasFile: !!this.currentFileUpload
        });
        
        const timestamp = Date.now();
        const messageId = `temp_${timestamp}_${Math.random().toString(36).substring(2, 15)}`;
        
        try {
            this.messageInput.value = '';
            this.resizeTextarea();
            this.sendStopTyping();
            
            if (!window.ChatAPI) {
                console.error('❌ ChatAPI not available');
                this.showNotification('ChatAPI not available', 'error');
                return;
            }
            
            console.log('ChatAPI available, proceeding with message send...');
            
            let attachmentUrl = null;
            let messageType = 'text';
            
            if (this.currentFileUpload) {
                try {
                    const fileType = this.currentFileUpload.type;
                    const formData = new FormData();
                    formData.append('file', this.currentFileUpload);
                    
                    this.showNotification('Uploading file...', 'info');
                    
                    const uploadResponse = await window.ChatAPI.uploadFile(formData);
                    
                    if (uploadResponse && uploadResponse.url) {
                        attachmentUrl = uploadResponse.url;
                        messageType = fileType && fileType.startsWith('image/') ? 'image' : 'file';
                    } else {
                        throw new Error('Failed to upload file');
                    }
                } catch (error) {
                    console.error('❌ File upload failed:', error);
                    this.showNotification('Failed to upload file. ' + error.message, 'error');
                    return;
                }
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
                messageType: messageType,
                attachment_url: attachmentUrl,
                _localMessage: true
            };
            
            if (this.chatType === 'channel') {
                tempMessage.channelId = this.targetId;
            } else if (this.chatType === 'direct' || this.chatType === 'dm') {
                tempMessage.roomId = this.targetId;
            }
            
            const options = {
                messageType: messageType,
                attachmentUrl: attachmentUrl
            };
            
            if (this.activeReplyingTo) {
                tempMessage.reply_message_id = this.activeReplyingTo.messageId;
                tempMessage.reply_data = this.activeReplyingTo;
                
                options.replyToMessageId = this.activeReplyingTo.messageId;
                options.replyData = this.activeReplyingTo;
                
                this.cancelReply();
            }
            
            this.processedMessageIds.add(messageId);
            this.addMessage(tempMessage);
            this.removeFileUpload();
            this.updateSendButton();
            
            console.log('Calling ChatAPI.sendMessage...');
            const response = await window.ChatAPI.sendMessage(this.targetId, content, this.chatType, options);
            
            console.log('Message send response:', response);
            
            if (response && response.data && response.data.message) {
                const serverMessage = response.data.message;
                console.log('Server confirmed message:', serverMessage);
                const tempMessageElement = document.querySelector(`[data-message-id="${messageId}"]`);
                if (tempMessageElement) {
                    tempMessageElement.setAttribute('data-message-id', serverMessage.id);
                    console.log('Updated temp message with server ID:', serverMessage.id);
                }
            } else {
                console.warn('⚠️ Unexpected response format:', response);
            }
            
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
            
            this.showNotification('Failed to send message: ' + (error.message || 'Unknown error'), 'error');
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
        
        const existingMessages = this.chatMessages.querySelectorAll('.message-group');
        existingMessages.forEach(group => group.remove());
        
        if (this.skeletonLoader) {
            this.skeletonLoader.clear();
        }
        
        if (!messages || messages.length === 0) {
            this.showEmptyState();
            return;
        }
        
        this.hideEmptyState();
        
        let lastSenderId = null;
        let currentMessageGroup = null;
        
        messages.forEach(message => {
            const isNewGroup = message.user_id !== lastSenderId;
            
            if (isNewGroup) {
                currentMessageGroup = this.createMessageGroup(message);
                this.chatMessages.appendChild(currentMessageGroup);
                lastSenderId = message.user_id;
            } else {
                const messageContent = this.createMessageContent(message);
                const contents = currentMessageGroup.querySelector('.message-contents');
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
        
        // Hide empty state if it exists
        this.hideEmptyState();
        
        const msg = {
            id: message.id || message.messageId || Date.now().toString(),
            content: message.content || message.message?.content || '',
            user_id: message.userId || message.user_id || '',
            username: message.username || message.message?.username || 'Unknown User',
            avatar_url: message.avatar_url || message.message?.avatar_url || '/assets/main-logo.png',
            sent_at: message.timestamp || message.sent_at || Date.now(),
            isLocalOnly: message.isLocalOnly || false,
            reply_message_id: message.reply_message_id || null,
            reply_data: message.reply_data || null,
            edited_at: message.edited_at || null,
            messageType: message.messageType || message.message_type || 'text',
            attachment_url: message.attachment_url || message.attachmentUrl || null,
            reactions: message.reactions || []
        };
        
        const existingMessageElements = document.querySelectorAll(`[data-message-id="${msg.id}"]`);
        if (existingMessageElements.length > 0) {
            console.log('Message already exists, cleaning up duplicates:', msg.id, 'Found:', existingMessageElements.length);
            existingMessageElements.forEach((el, index) => {
                if (index > 0) {
                    console.log('Removing duplicate message element:', index);
                    el.remove();
                }
            });
            return;
        }
        
        if (this.processedMessageIds.has(msg.id)) {
            console.log('Message already processed, skipping:', msg.id);
            return;
        }
        
        const isOwnMessage = msg.user_id == this.userId;
        
        const lastMessageGroup = this.chatMessages.lastElementChild;
        const lastSenderId = lastMessageGroup?.getAttribute('data-user-id');
        
        const isNewGroup = lastSenderId !== msg.user_id || !lastMessageGroup?.classList.contains('message-group');
        
        if (isNewGroup) {
            const messageGroup = this.createMessageGroup(msg, isOwnMessage);
            messageGroup.classList.add('message-fade-in');
            this.chatMessages.appendChild(messageGroup);
            
            console.log('Added new message group to chat:', msg.id, 'Content:', msg.content);
            
            setTimeout(() => {
                messageGroup.classList.add('message-appear');
            }, 10);
        } else {
            const messageContent = this.createMessageContent(msg, isOwnMessage);
            messageContent.classList.add('message-fade-in');
            const contents = lastMessageGroup.querySelector('.message-contents');
            if (contents) {
                contents.appendChild(messageContent);
                
                setTimeout(() => {
                    messageContent.classList.add('message-appear');
                }, 10);
            }
        }
        
        if (msg.reactions && msg.reactions.length > 0) {
            setTimeout(() => {
                if (window.emojiReactions) {
                    window.emojiReactions.updateReactionsDisplay(msg.id, msg.reactions);
                }
            }, 10);
        }
        
        this.scrollToBottom();
    }
    
    createMessageGroup(message, isOwnMessage = false) {
        const messageGroup = document.createElement('div');
        messageGroup.className = 'message-group';
        messageGroup.setAttribute('data-user-id', message.user_id || message.userId);
        
        const avatarContainer = document.createElement('div');
        avatarContainer.className = 'message-avatar';
        
        const avatar = document.createElement('img');
        avatar.src = message.avatar_url || '/assets/main-logo.png';
        avatar.alt = `${message.username}'s avatar`;
        avatar.onerror = function() {
            this.onerror = null;
            this.src = '/assets/main-logo.png';
        };
        
        avatarContainer.appendChild(avatar);
        
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'message-content-wrapper';
        
        const headerRow = document.createElement('div');
        headerRow.className = 'message-header';
        
        const usernameSpan = document.createElement('span');
        usernameSpan.className = 'message-username';
        usernameSpan.textContent = message.username;
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-timestamp';
        timeSpan.textContent = this.formatTimestamp(message.sent_at);
        
        headerRow.appendChild(usernameSpan);
        headerRow.appendChild(timeSpan);
        
        const messageContents = document.createElement('div');
        messageContents.className = 'message-contents';
        
        const firstMessage = this.createMessageContent(message, isOwnMessage);
        messageContents.appendChild(firstMessage);
        
        contentWrapper.appendChild(headerRow);
        contentWrapper.appendChild(messageContents);
        
        messageGroup.appendChild(avatarContainer);
        messageGroup.appendChild(contentWrapper);
        
        return messageGroup;
    }
    
    createMessageContent(message, isOwnMessage = false) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message-content';
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

            const replyContent = document.createElement('div');
            replyContent.className = 'reply-content';
            
            if (message.reply_data) {
                replyContent.setAttribute('tabindex', '0');
                replyContent.setAttribute('role', 'button');
                replyContent.setAttribute('aria-label', `Jump to reply from ${message.reply_data.username}`);
                
                const replyAvatar = document.createElement('img');
                replyAvatar.src = message.reply_data.avatar_url || '/assets/main-logo.png';
                replyAvatar.className = 'reply-avatar';
                replyAvatar.onerror = function() { this.src = '/assets/main-logo.png'; };

                const replyUsername = document.createElement('span');
                replyUsername.className = 'reply-username';
                replyUsername.textContent = message.reply_data.username;

                const replyMessage = document.createElement('span');
                replyMessage.className = 'reply-message-text';
                replyMessage.textContent = this.truncateText(message.reply_data.content || '', 60);
                
                replyContent.appendChild(replyAvatar);
                replyContent.appendChild(replyUsername);
                replyContent.appendChild(replyMessage);

                const jumpToMessage = () => {
                    const targetMessageId = message.reply_data.messageId || message.reply_message_id;
                    const repliedMessage = document.querySelector(`[data-message-id="${targetMessageId}"]`);
                    
                    if (repliedMessage) {
                        const messageElement = repliedMessage.closest('.message-group') || repliedMessage;
                        
                        messageElement.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'center',
                            inline: 'nearest'
                        });
                        
                        repliedMessage.classList.remove('highlight-message');
                        setTimeout(() => {
                            repliedMessage.classList.add('highlight-message');
                            setTimeout(() => {
                                repliedMessage.classList.remove('highlight-message');
                            }, 3000);
                        }, 100);
                    } else {
                        this.showNotification('Original message not found in current view', 'info');
                    }
                };

                replyContent.addEventListener('click', jumpToMessage);
                replyContent.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        jumpToMessage();
                    }
                });
            } else {
                const unavailableSpan = document.createElement('span');
                unavailableSpan.textContent = 'Replying to an unavailable message';
                unavailableSpan.style.color = '#72767d';
                unavailableSpan.style.fontSize = '12px';
                unavailableSpan.style.fontStyle = 'italic';
                replyContent.appendChild(unavailableSpan);
            }
            
            replyContainer.appendChild(replyLine);
            replyContainer.appendChild(replyContent);
            messageElement.insertBefore(replyContainer, messageElement.firstChild);
        }
        
        const contentElement = document.createElement('div');
        contentElement.className = 'message-main-text text-[#dcddde]';
        
        if (message.content && message.content.trim() !== '') {
            contentElement.innerHTML = this.formatMessageContent(message.content);
        }
        
        if (message.attachment_url) {
            const attachmentContainer = document.createElement('div');
            attachmentContainer.className = 'message-attachment mt-2';
            
            if (message.messageType === 'image' || 
                (message.attachment_url && 
                 (/\.(jpeg|jpg|gif|png|webp)$/i.test(message.attachment_url) || 
                  message.attachment_url.includes('image/')))) {
                
                const imageWrapper = document.createElement('div');
                imageWrapper.className = 'image-attachment cursor-pointer relative';
                
                const image = document.createElement('img');
                image.className = 'max-w-md max-h-96 rounded-lg';
                image.src = message.attachment_url;
                image.alt = 'Image attachment';
                image.loading = 'lazy';
                image.onerror = function() {
                    this.onerror = null;
                    this.src = '/public/assets/common/main-logo.png';
                    this.classList.add('w-16', 'h-16');
                    imageWrapper.classList.add('bg-[#2b2d31]', 'p-3', 'rounded-lg');
                    
                    const errorText = document.createElement('div');
                    errorText.className = 'text-sm text-[#b5bac1] mt-2';
                    errorText.textContent = 'Image failed to load';
                    imageWrapper.appendChild(errorText);
                };
                
                image.addEventListener('click', () => {
                    window.open(message.attachment_url, '_blank');
                });
                
                imageWrapper.appendChild(image);
                attachmentContainer.appendChild(imageWrapper);
                
            } else {
                const fileLink = document.createElement('a');
                fileLink.href = message.attachment_url;
                fileLink.target = '_blank';
                fileLink.className = 'block no-underline';
                
                const fileContainer = document.createElement('div');
                fileContainer.className = 'bg-[#2b2d31] p-3 rounded-lg inline-flex items-center max-w-md hover:bg-[#36373d] transition-colors';
                
                const fileIconWrapper = document.createElement('div');
                fileIconWrapper.className = 'text-3xl text-[#b5bac1] mr-3';
                
                let fileIcon = 'fas fa-file';
                
                if (message.attachment_url) {
                    const extension = message.attachment_url.split('.').pop().toLowerCase();
                    
                    if (['doc', 'docx'].includes(extension)) fileIcon = 'fas fa-file-word';
                    else if (['xls', 'xlsx', 'csv'].includes(extension)) fileIcon = 'fas fa-file-excel';
                    else if (['ppt', 'pptx'].includes(extension)) fileIcon = 'fas fa-file-powerpoint';
                    else if (['pdf'].includes(extension)) fileIcon = 'fas fa-file-pdf';
                    else if (['zip', 'rar', 'tar', 'gz'].includes(extension)) fileIcon = 'fas fa-file-archive';
                    else if (['txt', 'log', 'md'].includes(extension)) fileIcon = 'fas fa-file-alt';
                    else if (['js', 'php', 'html', 'css', 'py', 'java', 'cpp', 'cs', 'rb'].includes(extension)) fileIcon = 'fas fa-file-code';
                    else if (['mp3', 'wav', 'ogg'].includes(extension)) fileIcon = 'fas fa-file-audio';
                    else if (['mp4', 'avi', 'mov', 'wmv'].includes(extension)) fileIcon = 'fas fa-file-video';
                }
                
                fileIconWrapper.innerHTML = `<i class="${fileIcon}"></i>`;
                
                const fileInfoWrapper = document.createElement('div');
                fileInfoWrapper.className = 'overflow-hidden';
                
                const fileName = document.createElement('div');
                fileName.className = 'text-[#dcddde] font-medium text-sm truncate';
                fileName.textContent = message.attachment_url.split('/').pop() || 'File';
                
                const fileAction = document.createElement('div');
                fileAction.className = 'text-[#b5bac1] text-xs';
                fileAction.textContent = 'Click to download';
                
                fileInfoWrapper.appendChild(fileName);
                fileInfoWrapper.appendChild(fileAction);
                
                fileContainer.appendChild(fileIconWrapper);
                fileContainer.appendChild(fileInfoWrapper);
                
                fileLink.appendChild(fileContainer);
                attachmentContainer.appendChild(fileLink);
            }
            
            contentElement.appendChild(attachmentContainer);
        }
        
        messageElement.appendChild(contentElement);
        
        if (message.edited_at) {
            const editedBadge = document.createElement('span');
            editedBadge.className = 'edited-badge text-xs text-[#a3a6aa] ml-1';
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
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            } else {
                return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
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
            io.removeAllListeners('message-updated');
            io.removeAllListeners('message-deleted');
            io.removeAllListeners('user-typing');
            io.removeAllListeners('user-typing-dm');
            io.removeAllListeners('user-stop-typing');
            io.removeAllListeners('user-stop-typing-dm');
            
            io.on('new-channel-message', function(data) {
                if (self.chatType === 'channel' && data.channelId == self.targetId) {
                    const messageId = data.id || `${data.userId || data.user_id}-${data.timestamp}`;
                    data.id = messageId;
                    
                    // Check if message already exists in DOM (loaded from database)
                    const existingMessage = document.querySelector(`[data-message-id="${messageId}"]`);
                    if (existingMessage) {
                        console.log('Channel message already exists in DOM, skipping socket update (reactions only from DB):', messageId);
                        return;
                    }
                    
                    if (!self.processedMessageIds.has(messageId)) {
                        self.processedMessageIds.add(messageId);
                        
                        if ((data.userId || data.user_id) != self.userId) {
                            // Ensure no reactions are processed from socket messages
                            data.reactions = [];
                            self.addMessage(data);
                        } else {
                            const tempMessage = document.querySelector(`[data-message-id^="temp_"]`);
                            if (tempMessage) {
                                tempMessage.setAttribute('data-message-id', messageId);
                            }
                        }
                    }
                }
            });
            
            io.on('user-message-dm', function(data) {
                if ((self.chatType === 'direct' || self.chatType === 'dm') && data.roomId == self.targetId) {
                    const messageId = data.id || `${data.userId || data.user_id}-${data.timestamp}`;
                    data.id = messageId;
                    
                    // Check if message already exists in DOM (loaded from database)
                    const existingMessage = document.querySelector(`[data-message-id="${messageId}"]`);
                    if (existingMessage) {
                        console.log('DM message already exists in DOM, skipping socket update (reactions only from DB):', messageId);
                        return;
                    }
                    
                    if (!self.processedMessageIds.has(messageId)) {
                        self.processedMessageIds.add(messageId);
                        
                        if ((data.userId || data.user_id) != self.userId) {
                            // Ensure no reactions are processed from socket messages
                            data.reactions = [];
                            self.addMessage(data);
                        } else {
                            const tempMessage = document.querySelector(`[data-message-id^="temp_"]`);
                            if (tempMessage) {
                                tempMessage.setAttribute('data-message-id', messageId);
                            }
                        }
                    }
                }
            });
            
            io.on('message-updated', function(data) {
                const messageId = data.message_id;
                const targetType = data.target_type;
                const targetId = String(data.target_id);
                const selfTargetId = String(self.targetId);
                
                const isChannelMatch = self.chatType === 'channel' && targetType === 'channel' && targetId === selfTargetId;
                const isDMMatch = (self.chatType === 'direct' || self.chatType === 'dm') && 
                                  (targetType === 'dm' || targetType === 'direct') && 
                                  targetId === selfTargetId;
                
                const isRelevantTarget = isChannelMatch || isDMMatch;
                
                if (isRelevantTarget && messageId) {
                    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
                    if (messageElement) {
                        const messageTextElement = messageElement.querySelector('.message-main-text');
                        if (messageTextElement && data.message) {
                            messageTextElement.innerHTML = self.formatMessageContent(data.message.content);
                            
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
            });
            
            io.on('message-deleted', function(data) {
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
                        
                        self.processedMessageIds.delete(messageId);
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
        try {
            this.showLoadingSkeletons();
            
            console.log(`Loading messages for ${this.chatType} ${this.targetId}, offset: ${offset}, limit: ${limit}`);
            
            const params = new URLSearchParams({ offset, limit });
            const apiChatType = this.chatType === 'direct' ? 'dm' : this.chatType;
            
            // Start fetching messages immediately
            const messagesPromise = fetch(`/api/chat/${apiChatType}/${this.targetId}/messages?${params.toString()}`)
                .then(response => response.json());
            
            // Wait a bit to ensure skeletons are visible, then start processing
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Get the message data
            const data = await messagesPromise;
            
            let messages = [];
            
            if (data.messages) {
                messages = data.messages;
                console.log(`Found ${messages.length} messages in response.messages`);
            } else if (data.data && data.data.messages) {
                messages = data.data.messages;
                console.log(`Found ${messages.length} messages in response.data.messages`);
            }
            
            if (messages && messages.length > 0) {
                // Immediately start fetching reactions while skeletons are still showing
                const reactionPromises = [];
                const messagesToProcess = [];
                const messagesWithReactions = [];
                
                // Process messages and immediately start fetching reactions
                messages.forEach(msg => {
                    this.processedMessageIds.add(msg.id);
                    
                    const hasReactions = msg.has_reactions === true || 
                                        (Array.isArray(msg.reactions) && msg.reactions.length > 0) ||
                                        msg.reaction_count > 0;
                                        
                    if (hasReactions) {
                        messagesWithReactions.push(msg.id);
                        // Start fetching reactions immediately
                        if (window.ChatAPI) {
                            const promise = window.ChatAPI.getMessageReactions(msg.id)
                                .then(reactions => {
                                    if (reactions && reactions.length > 0) {
                                        messagesToProcess.push({
                                            messageId: msg.id,
                                            reactions
                                        });
                                    }
                                })
                                .catch(err => console.error(`Error fetching reactions for message ${msg.id}:`, err));
                            reactionPromises.push(promise);
                        }
                    } else {
                        msg.reactions = [];
                    }
                });
                
                console.log(`📊 Starting to fetch reactions for ${messagesWithReactions.length} messages while skeletons are showing`);
                
                // Keep skeletons showing for a minimum time to ensure reactions are fetched
                const minimumSkeletonTime = 800; // Show skeletons for at least 800ms
                const skeletonStartTime = Date.now();
                
                // Wait for reactions to load (or timeout)
                await Promise.race([
                    Promise.all(reactionPromises),
                    new Promise(resolve => setTimeout(resolve, 600)) // Give reactions 600ms to load
                ]);
                
                // Process fetched reactions into messages
                messagesToProcess.forEach(item => {
                    const message = messages.find(m => m.id === item.messageId);
                    if (message) {
                        message.reactions = item.reactions || [];
                    }
                });
                
                // Ensure minimum skeleton time has passed
                const elapsedTime = Date.now() - skeletonStartTime;
                if (elapsedTime < minimumSkeletonTime) {
                    await new Promise(resolve => setTimeout(resolve, minimumSkeletonTime - elapsedTime));
                }
                
                // Ensure empty state is hidden before rendering
                this.hideEmptyState();
                
                // Now render messages with reactions already loaded
                this.renderMessages(messages);
                
                // Handle any late-arriving reactions
                Promise.all(reactionPromises).then(() => {
                    messagesToProcess.forEach(item => {
                        if (window.emojiReactions && item.reactions?.length > 0) {
                            window.emojiReactions.updateReactionsDisplay(item.messageId, item.reactions);
                        }
                    });
                });
                
                this.scrollToBottom();
            } else {
                this.showEmptyState();
            }
            
            this.messagesLoaded = true;
            
        } catch (error) {
            this.hideLoadingIndicator();
            console.error('Failed to load messages:', error);
            this.showErrorMessage(`Failed to load messages: ${error.message}`);
        }
    }
    
    showLoadingSkeletons() {
        if (this.skeletonLoader) {
            this.skeletonLoader.show();
        }
    }
    
    hideEmptyState() {
        if (!this.chatMessages) return false;
        
        const emptyState = this.chatMessages.querySelector('#chat-empty-state');
        if (emptyState) {
            emptyState.style.display = 'none';
            return true;
        }
        
        return false;
    }
    
    showEmptyState() {
        if (!this.chatMessages) return;
        
        // Check if empty state already exists
        let emptyState = this.chatMessages.querySelector('#chat-empty-state');
        if (emptyState) {
            emptyState.style.display = 'flex';
            return;
        }
        
        // Create new empty state as background
        emptyState = document.createElement('div');
        emptyState.id = 'chat-empty-state';
        emptyState.className = 'flex flex-col items-center justify-center p-8 text-[#b5bac1] h-full absolute inset-0 z-0';
        emptyState.innerHTML = `
            <i class="fas fa-comments text-6xl mb-4 opacity-50"></i>
            <p class="text-lg font-medium">No messages yet</p>
            <p class="text-sm mt-2">Start the conversation by sending a message!</p>
        `;
        
        // Add as background layer
        this.chatMessages.style.position = 'relative';
        this.chatMessages.appendChild(emptyState);
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }


}