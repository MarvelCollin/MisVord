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
        console.log('ChatAPI not ready, retrying...', {
            ChatAPI: typeof window.ChatAPI,
            chatAPI: typeof window.chatAPI,
            loadedScripts: Array.from(document.scripts).map(s => s.src).filter(s => s.includes('chat-api'))
        });
        setTimeout(initializeChatSection, 100);
        return;
    }
    
    console.log('✅ Initializing ChatSection with ChatAPI ready');
    const chatSection = new ChatSection();
    chatSection.init();
    window.chatSection = chatSection;
    
    // Make sure emoji reactions system is initialized
    if (typeof window.emojiReactions === 'undefined' || !window.emojiReactions.initialized) {
        console.log('Ensuring emoji reactions system is initialized from ChatSection');
        if (typeof window.initializeEmojiReactions === 'function') {
            window.initializeEmojiReactions();
        }
    }
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
        this.contextMenu = null;
        this.currentFileUpload = null;
        this.currentEditingMessage = null;
        this.activeReplyingTo = null;
        this.activeMessageActions = null;
        this.typingTimeout = null;
        this.lastTypingUpdate = 0;
        this.typingDebounceTime = 2000;
        this.messagesLoaded = false;
        this.processedMessageIds = new Set();
        this.socketListenersSetup = false; // Track if socket listeners are setup
        this.typingUsers = new Map(); // Track typing users
        this.joinedRooms = new Set(); // Track joined rooms
        
        this.chatType = null;
        this.targetId = null;
        this.userId = null;
        this.username = null;
        this.avatar_url = null;
        
        this.loadChatParams();
    }
    
    init() {
        console.log('Initializing ChatSection');
        this.loadElements();
        
        if (!this.chatMessages) {
            console.warn('Chat messages element not found, aborting ChatSection initialization');
            return;
        }
        
        this.ensureChatContainerStructure();
        
        const paramsLoaded = this.loadChatParams();
        
        if (!paramsLoaded) {
            console.error('Failed to load chat parameters, cannot initialize chat');
            this.showErrorMessage('Failed to initialize chat. Missing required parameters.');
            return;
        }
        
        if (this.chatType === 'direct' && this.targetId) {
            console.log(`Checking if target ID ${this.targetId} is valid room ID for direct messages`);
        }
        
                 const existingMessages = this.chatMessages.querySelectorAll('.message-group');
         if (existingMessages.length > 0) {
             console.log('Messages already rendered by PHP, marking processed and setting up listeners');
             existingMessages.forEach(group => {
                 const messageElements = group.querySelectorAll('.message-content');
                 messageElements.forEach(msgEl => {
                     const messageId = msgEl.dataset.messageId;
                     if (messageId) {
                         this.processedMessageIds.add(messageId);
                         
                         // Ensure hover actions work on PHP-rendered messages
                         msgEl.addEventListener('mouseover', () => this.showMessageActions(msgEl));
                         msgEl.addEventListener('mouseout', (e) => {
                             const relatedTarget = e.relatedTarget;
                             if (!msgEl.contains(relatedTarget) && !relatedTarget?.closest('.message-actions')) {
                                 this.hideMessageActions(msgEl);
                             }
                         });
                         
                         // Setup action buttons
                         const actionsContainer = msgEl.querySelector('.message-actions');
                         if (actionsContainer) {
                             const reactionBtn = actionsContainer.querySelector('.message-action-reaction');
                             const replyBtn = actionsContainer.querySelector('.message-action-reply');
                             const editBtn = actionsContainer.querySelector('.message-action-edit');
                             const moreBtn = actionsContainer.querySelector('.message-action-more');
                             
                             if (reactionBtn) reactionBtn.addEventListener('click', () => this.showEmojiPicker(messageId, reactionBtn));
                             if (replyBtn) replyBtn.addEventListener('click', () => this.replyToMessage(messageId));
                             if (editBtn) editBtn.addEventListener('click', () => this.editMessage(messageId));
                             if (moreBtn) moreBtn.addEventListener('click', (e) => this.showContextMenu(e.clientX, e.clientY, msgEl));
                         }
                     }
                 });
             });
             this.messagesLoaded = true;
             this.scrollToBottom();
         } else {
             this.showLoadingSkeletons();
             setTimeout(() => {
                 this.loadMessages();
             }, 100);
         }
        
        this.setupEventListeners();
        this.setupIoListeners();
        console.log('ChatSection initialization complete');
    }
    
    ensureChatContainerStructure() {
        if (!this.chatMessages) return;
        
        let messagesContainer = this.chatMessages.querySelector('.messages-container');
        
        if (!messagesContainer) {
            this.chatMessages.style.position = 'relative';
            this.chatMessages.style.display = 'flex';
            this.chatMessages.style.flexDirection = 'column';
            
            messagesContainer = document.createElement('div');
            messagesContainer.className = 'messages-container flex-1';
            messagesContainer.style.position = 'relative';
            messagesContainer.style.zIndex = '10';
            
            this.chatMessages.appendChild(messagesContainer);
        }
        
        this.messagesContainer = messagesContainer;
        this.initializeSkeletonLoader();
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
    }
    
    initializeSkeletonLoader() {
        if (window.ChatSkeletonLoader) {
            const container = this.getMessagesContainer();
            this.skeletonLoader = new window.ChatSkeletonLoader(container);
        }
    }
    
    loadChatParams() {
        this.chatType = document.querySelector('meta[name="chat-type"]')?.content || 'channel';
        this.targetId = document.querySelector('meta[name="chat-id"]')?.content;
        this.userId = document.querySelector('meta[name="user-id"]')?.content;
        this.username = document.querySelector('meta[name="username"]')?.content;
        
        console.log(`Chat parameters loaded: type=${this.chatType}, target_id=${this.targetId}, user_id=${this.userId}`);
        
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
                
                if (messageGroup && messageGroup.querySelectorAll('.message-content').length === 1) {
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
    
    async pinMessage(messageId) {
        try {
            if (!window.ChatAPI) {
                throw new Error('ChatAPI not available');
            }
            
            const response = await window.ChatAPI.pinMessage(messageId);
            
            if (response && response.data) {
                const action = response.data.action || response.action;
                const message = action === 'pinned' ? 'Message pinned successfully' : 'Message unpinned successfully';
                this.showNotification(message, 'success');
            }
            
        } catch (error) {
            console.error('Failed to pin/unpin message:', error);
            this.showNotification('Failed to pin/unpin message: ' + (error.message || 'Unknown error'), 'error');
        }
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
        if (!window.emojiReactions) {
            this.showNotification('Emoji picker not loaded', 'error');
            return;
        }
        
        if (!targetElement) {
            return;
        }
        
        window.emojiReactions.showEmojiPicker(messageId, targetElement);
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
        
        this.prepareChatContainer();
        
        const containerCheck = this.validateAndGetContainer();
        if (!containerCheck) {
            console.error('❌ Container validation failed before sending message - aborting');
            this.messageInput.value = content;
            return;
        }
        
        console.log('✅ Container validated before message send - proceeding...');
        
        console.log('📤 Attempting to send message:', { 
            content, 
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
                        if (fileType && fileType.startsWith('image/')) {
                            messageType = 'image';
                        } else if (fileType && fileType.startsWith('video/')) {
                            messageType = 'video';
                        } else {
                            messageType = 'file';
                        }
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
                avatar_url: document.querySelector('meta[name="user-avatar"]')?.content || '/public/assets/common/default-profile-picture.png',
                sent_at: timestamp,
                timestamp: timestamp,
                isLocalOnly: true,
                message_type: messageType,
                attachment_url: attachmentUrl,
                _localMessage: true
            };
            
            if (this.chatType === 'channel') {
                tempMessage.channelId = this.targetId;
            } else if (this.chatType === 'direct' || this.chatType === 'dm') {
                tempMessage.roomId = this.targetId;
            }
            
            const options = {
                message_type: messageType,
                attachment_url: attachmentUrl
            };
            
            if (this.activeReplyingTo) {
                tempMessage.reply_message_id = this.activeReplyingTo.messageId;
                tempMessage.reply_data = this.activeReplyingTo;
                
                options.reply_message_id = this.activeReplyingTo.messageId;
                options.reply_data = this.activeReplyingTo;
                
                this.cancelReply();
            }
            
            this.addMessage(tempMessage);
            this.processedMessageIds.add(messageId);
            this.removeFileUpload();
            this.updateSendButton();
            
            console.log('Calling ChatAPI.sendMessage...');
            const response = await window.ChatAPI.sendMessage(this.targetId, content, this.chatType, options);
            
            console.log('Message send response:', response);
            
            if (response && response.success && response.data) {
                if (response.data.message && response.data.message.id) {
                    const serverMessage = response.data.message;
                    const tempMessageElement = document.querySelector(`[data-message-id="${messageId}"]`);
                    if (tempMessageElement) {
                        tempMessageElement.setAttribute('data-message-id', serverMessage.id);
                        const reactionButton = tempMessageElement.querySelector('.message-action-reaction');
                        if (reactionButton) {
                            reactionButton.style.pointerEvents = '';
                            reactionButton.style.opacity = '';
                        }
                    }
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
    
    prepareChatContainer() {
        if (!this.chatMessages) {
            console.error('❌ prepareChatContainer: chatMessages element not found');
            return;
        }
        
        console.log('🔧 Preparing chat container for message...');
        
        this.hideEmptyState();
        
        if (this.skeletonLoader) {
            this.skeletonLoader.clear();
        }
        
        const containerResult = this.ensureMessagesContainer();
        if (!containerResult) {
            console.error('❌ Failed to ensure messages container in prepareChatContainer');
            return;
        }
        
        const nonMessageElements = this.chatMessages.querySelectorAll(':not(.messages-container)');
        nonMessageElements.forEach(element => {
            if (element.id !== 'chat-empty-state' && 
                !element.classList.contains('message-group') && 
                !element.classList.contains('message-group-item') &&
                !element.classList.contains('messages-container')) {
                if (element.textContent.includes('No messages yet') || 
                    element.textContent.includes('Start the conversation') ||
                    element.querySelector('i.fa-comments')) {
                    console.log('🗑️ Removing interfering element:', element);
                    element.remove();
                }
            }
        });
        
        this.chatMessages.style.position = 'relative';
        
        const finalState = {
            chatMessagesExists: !!this.chatMessages,
            messagesContainerExists: !!this.messagesContainer,
            containerInDOM: this.messagesContainer ? document.contains(this.messagesContainer) : false,
            containerChildren: this.messagesContainer?.children.length || 0,
            chatMessagesChildren: this.chatMessages.children.length
        };
        
        console.log('📊 Chat container preparation complete:', finalState);
        console.log('✅ Messages-container ready for first message');
        
        if (!finalState.messagesContainerExists || !finalState.containerInDOM) {
            console.error('❌ Chat container preparation failed - container not ready');
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
        
        const targetContainer = this.getMessagesContainer();
        const existingMessages = targetContainer.querySelectorAll('.message-group');
        
        if ((!messages || messages.length === 0) && existingMessages.length > 0) {
            console.log('📭 renderMessages received 0 messages but DOM already has messages; skipping clear to preserve local messages');
            return;
        }

        const hasPhpRenderedMessages = existingMessages.length > 0 && existingMessages[0].querySelector('.message-content[data-message-id]');
        if (hasPhpRenderedMessages && messages && messages.length > 0) {
            console.log('📭 PHP-rendered messages detected, skipping JS render to avoid duplication');
            return;
        }

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
                targetContainer.appendChild(currentMessageGroup);
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
        console.log('🚨 ADDMESSAGE CALLED - IMMEDIATE CHECK:', {
            timestamp: Date.now(),
            messageExists: !!message,
            chatMessagesExists: !!this.chatMessages,
            messageContent: message?.content || 'NO CONTENT'
        });
        
        if (!this.chatMessages || !message) {
            console.error('❌ addMessage failed: missing chatMessages or message');
            return;
        }
        
        console.log('🚀 Starting addMessage process...');
        
        this.hideEmptyState();
        
        if (this.skeletonLoader) {
            this.skeletonLoader.clear();
        }
        
        const existingEmptyStates = this.chatMessages.querySelectorAll('#chat-empty-state');
        existingEmptyStates.forEach(state => state.remove());
        
        this.ensureChatContainerStructure();
        
        const targetContainer = this.validateAndGetContainer();
        if (!targetContainer) {
            console.error('❌ Failed to get valid messages container');
            return;
        }
        
        console.log('🎯 Target container confirmed:', {
            className: targetContainer.className,
            children: targetContainer.children.length,
            parent: targetContainer.parentNode?.id
        });
        
        const msg = {
            id: message.id || message.messageId || Date.now().toString(),
            content: message.content || message.message?.content || '',
            user_id: message.user_id || message.userId || '',
            username: message.username || message.message?.username || 'Unknown User',
            avatar_url: message.avatar_url || message.message?.avatar_url || '/public/assets/common/default-profile-picture.png',
            sent_at: message.timestamp || message.sent_at || Date.now(),
            isLocalOnly: message.isLocalOnly || false,
            reply_message_id: message.reply_message_id || null,
            reply_data: message.reply_data || null,
            edited_at: message.edited_at || null,
            message_type: message.message_type || 'text',
            attachment_url: message.attachment_url || null,
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
        
        const messageGroups = targetContainer.querySelectorAll('.message-group');
        const lastMessageGroup = messageGroups.length > 0 ? messageGroups[messageGroups.length - 1] : null;
        const lastSenderId = lastMessageGroup?.getAttribute('data-user-id');
        
        const isNewGroup = !lastMessageGroup || lastSenderId !== msg.user_id;
        
        console.log('📋 Message details:', {
            id: msg.id,
            content: msg.content.substring(0, 50),
            isNewGroup,
            existingGroups: messageGroups.length,
            targetContainer: targetContainer.className
        });
        
        if (isNewGroup) {
            const messageGroup = this.createMessageGroup(msg, isOwnMessage);
            messageGroup.classList.add('message-fade-in');
            
            console.log('📦 Created message group:', messageGroup);
            console.log('📍 Target container before append:', targetContainer);
            console.log('🔍 Container children before append:', targetContainer.children.length);
            
            const appendResult = this.safeAppendToContainer(targetContainer, messageGroup);
            if (!appendResult) {
                console.error('❌ Failed to append message group');
                return;
            }
            
            console.log('✅ Message group appended successfully');
            console.log('🔍 Container children after append:', targetContainer.children.length);
            console.log('🎯 Last child in container:', targetContainer.lastElementChild);
            
            setTimeout(() => {
                const finalCheck = this.verifyMessageInDOM(msg.id, targetContainer);
                if (finalCheck) {
                    console.log('🎉 Message bubble confirmed visible in DOM');
                } else {
                    console.error('❌ Message bubble NOT found in DOM after append');
                }
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
    
    validateAndGetContainer() {
        console.log('🔍 Validating messages container...');
        
        if (!this.chatMessages) {
            console.error('❌ Main chat messages element not found');
            return null;
        }
        
        this.ensureMessagesContainer();
        
        const container = this.messagesContainer;
        if (!container) {
            console.error('❌ Messages container not found after ensuring');
            return null;
        }
        
        if (!container.parentNode) {
            console.error('❌ Messages container not attached to DOM');
            return null;
        }
        
        if (!container.classList.contains('messages-container')) {
            console.error('❌ Container missing required class');
            return null;
        }
        
        console.log('✅ Container validation passed:', {
            className: container.className,
            parentNode: container.parentNode.id,
            childrenCount: container.children.length,
            isInDOM: document.contains(container)
        });
        
        return container;
    }
    
    safeAppendToContainer(container, element) {
        try {
            console.log('🔧 Attempting to append element to container...');
            
            if (!container || !element) {
                console.error('❌ Missing container or element for append');
                return false;
            }
            
            const beforeCount = container.children.length;
            container.appendChild(element);
            const afterCount = container.children.length;
            
            const success = afterCount > beforeCount && container.contains(element);
            
            console.log('📊 Append result:', {
                beforeCount,
                afterCount,
                elementInContainer: container.contains(element),
                success
            });
            
            if (success) {
                console.log('✅ Element successfully appended to messages-container');
            } else {
                console.error('❌ Append failed - element not in container');
            }
            
            return success;
        } catch (error) {
            console.error('❌ Exception during append:', error);
            return false;
        }
    }
    
    ensureMessagesContainer() {
        console.log('🔧 Ensuring messages container exists...');
        
        if (!this.chatMessages) {
            console.error('❌ Cannot ensure container: chatMessages element not found');
            return null;
        }
        
        console.log('📍 Chat messages element found:', this.chatMessages.id);
        
        if (!this.messagesContainer) {
            console.log('🔍 No messagesContainer reference, searching for existing...');
            let container = this.chatMessages.querySelector('.messages-container');
            
            if (!container) {
                console.log('🔨 Creating new messages-container element...');
                container = document.createElement('div');
                container.className = 'messages-container flex-1';
                container.style.position = 'relative';
                container.style.zIndex = '10';
                
                console.log('📦 Created container element:', container);
                console.log('🔍 Chat messages children before append:', this.chatMessages.children.length);
                
                this.chatMessages.appendChild(container);
                
                console.log('🔍 Chat messages children after append:', this.chatMessages.children.length);
                console.log('✅ Container appended to chat messages');
            } else {
                console.log('✅ Found existing messages-container in DOM');
            }
            
            this.messagesContainer = container;
        }
        
        const finalValidation = {
            exists: !!this.messagesContainer,
            className: this.messagesContainer?.className,
            hasParent: !!this.messagesContainer?.parentNode,
            parentId: this.messagesContainer?.parentNode?.id,
            inDOM: this.messagesContainer ? document.contains(this.messagesContainer) : false,
            childrenCount: this.messagesContainer?.children.length || 0
        };
        
        console.log('📊 Final container validation:', finalValidation);
        
        if (!finalValidation.exists || !finalValidation.inDOM) {
            console.error('❌ Container validation failed');
            return null;
        }
        
        console.log('✅ Messages container ready:', this.messagesContainer);
        return this.messagesContainer;
    }
    
    getMessagesContainer() {
        this.ensureMessagesContainer();
        return this.messagesContainer;
    }
    
    createMessageGroup(message, isOwnMessage = false) {
        const messageGroup = document.createElement('div');
        messageGroup.className = 'message-group';
        messageGroup.setAttribute('data-user-id', message.user_id || message.userId);
        
        const avatarContainer = document.createElement('div');
        avatarContainer.className = 'message-avatar';
        
        const avatar = document.createElement('img');
        avatar.src = message.avatar_url || '/public/assets/common/default-profile-picture.png';
        avatar.alt = `${message.username}'s avatar`;
        avatar.onerror = function() {
            this.onerror = null;
            this.src = '/public/assets/common/default-profile-picture.png';
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
                replyAvatar.src = message.reply_data.avatar_url || '/public/assets/common/default-profile-picture.png';
                replyAvatar.className = 'reply-avatar';
                replyAvatar.onerror = function() { this.src = '/public/assets/common/default-profile-picture.png'; };

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
                        const targetMessageId = message.reply_data.message_id || message.reply_message_id;
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
            
            if (message.message_type === 'image' || 
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
                    this.src = '/public/assets/common/default-profile-picture.png';
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
                
            } else if (message.message_type === 'video' || 
                       (message.attachment_url && 
                        (/\.(mp4|webm|mov|avi|wmv)$/i.test(message.attachment_url) || 
                         message.attachment_url.includes('video/')))) {
                
                const videoWrapper = document.createElement('div');
                videoWrapper.className = 'video-attachment cursor-pointer relative';
                
                const video = document.createElement('video');
                video.className = 'max-w-md max-h-96 rounded-lg';
                video.src = message.attachment_url;
                video.controls = true;
                video.preload = 'metadata';
                video.onerror = function() {
                    this.onerror = null;
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'bg-[#2b2d31] p-3 rounded-lg flex items-center';
                    errorDiv.innerHTML = '<i class="fas fa-file-video text-2xl mr-2"></i><span>Video failed to load</span>';
                    videoWrapper.replaceWith(errorDiv);
                };
                
                videoWrapper.appendChild(video);
                attachmentContainer.appendChild(videoWrapper);
                
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
        
        // Ensure socket is ready before setting up listeners
        const setupSocketHandlers = function(io) {
            console.log('Setting up socket handlers for ChatSection');
            
            // Check if we're already listening to avoid duplicates
            if (self.socketListenersSetup) {
                console.log('Socket listeners already setup, skipping');
                return;
            }
            
            // Channel message handling
            io.on('new-channel-message', function(data) {
                console.log('Received new-channel-message:', data);
                
                if (self.chatType === 'channel' && data.channel_id == self.targetId) {
                    if (!self.processedMessageIds.has(data.id)) {
                        self.addMessage(data);
                        self.processedMessageIds.add(data.id);
                    }
                }
            });
            
            // DM message handling
            io.on('user-message-dm', function(data) {
                console.log('Received user-message-dm:', data);
                
                if ((self.chatType === 'direct' || self.chatType === 'dm') && data.room_id == self.targetId) {
                    if (!self.processedMessageIds.has(data.id)) {
                        self.addMessage(data);
                        self.processedMessageIds.add(data.id);
                    }
                }
            });
            
            // Reaction handling
            io.on('reaction-added', function(data) {
                if (data.message_id) {
                    const messageElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
                    if (messageElement) {
                        self.handleReactionAdded(data);
                    }
                }
            });
            
            io.on('reaction-removed', function(data) {
                if (data.message_id) {
                    const messageElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
                    if (messageElement) {
                        self.handleReactionRemoved(data);
                    }
                }
            });
            
            io.on('message-updated', function(data) {
                if (data.message_id) {
                    const messageElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
                    if (messageElement) {
                        self.handleMessageUpdated(data);
                    }
                }
            });
            
            io.on('message-deleted', function(data) {
                if (data.message_id) {
                    const messageElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
                    if (messageElement) {
                        self.handleMessageDeleted(data);
                    }
                }
            });
            
            // Typing indicators
            io.on('user-typing', function(data) {
                if (self.chatType === 'channel' && data.channel_id == self.targetId && data.user_id != self.userId) {
                    self.showTypingIndicator(data.user_id, data.username);
                }
            });
            
            io.on('user-typing-dm', function(data) {        
                if ((self.chatType === 'direct' || self.chatType === 'dm') && data.room_id == self.targetId && data.user_id != self.userId) {
                    self.showTypingIndicator(data.user_id, data.username);
                }
            });
            
            io.on('user-stop-typing', function(data) {
                if (self.chatType === 'channel' && data.channel_id == self.targetId && data.user_id != self.userId) {
                    self.removeTypingIndicator(data.user_id);
                }
            });
            
            io.on('user-stop-typing-dm', function(data) {
                if ((self.chatType === 'direct' || self.chatType === 'dm') && data.room_id == self.targetId && data.user_id != self.userId) {
                    self.removeTypingIndicator(data.user_id);
                }
            });
            
            self.socketListenersSetup = true;
            console.log('Socket listeners setup complete');
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
                messageTextElement.innerHTML = this.formatMessageContent(data.message.content);
                
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
                
                this.processedMessageIds.delete(messageId);
                
                const remainingMessages = this.getMessagesContainer().querySelectorAll('.message-group');
                if (remainingMessages.length === 0) {
                    this.showEmptyState();
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
        this.showNotification(`Message pinned by ${username}`, 'info');
        
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
        this.showNotification(`Message unpinned by ${username}`, 'info');
        
        console.log(`📌 Message ${messageId} unpinned by ${username}`);
    }
    
    joinChannel() {
        if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
            console.warn('Socket not ready for room joining');
            return;
        }

        const roomType = this.chatType === 'channel' ? 'channel' : 'dm';
        const roomKey = `${roomType}-${this.targetId}`;
        
        if (!this.joinedRooms.has(roomKey)) {
            console.log(`🚪 Joining room: ${roomType} - ${this.targetId}`);
            
            // Use the new unified joinRoom method with source field
            const success = window.globalSocketManager.joinRoom(roomType, this.targetId);
            
            if (success) {
                this.joinedRooms.add(roomKey);
                console.log(`✅ Successfully joined ${roomType} room: ${this.targetId}`);
            } else {
                console.error(`❌ Failed to join ${roomType} room: ${this.targetId}`);
            }
        } else {
            console.log(`Already joined ${roomType} room: ${this.targetId}`);
        }
    }
    
    async loadMessages(offset = 0, limit = 20) {
        try {
            this.showLoadingSkeletons();
            
            console.log(`Loading messages for ${this.chatType} ${this.targetId}, offset: ${offset}, limit: ${limit}`);
            
            const params = new URLSearchParams({ offset, limit });
            const apiChatType = this.chatType === 'direct' ? 'dm' : this.chatType;
            
            let endpoint;
            if (this.chatType === 'direct' || this.chatType === 'dm') {
                endpoint = `/api/chat/dm/${this.targetId}/messages?${params.toString()}`;
            } else {
                endpoint = `/api/chat/${this.chatType}/${this.targetId}/messages?${params.toString()}`;
            }
            
            const messagesPromise = fetch(endpoint)
                .then(response => {
                    if (!response.ok) {
                        if (response.status === 403) {
                            console.error(`🚨 403 ERROR: Access denied for ${this.chatType} ${this.targetId}`);
                            throw new Error('Access denied - you may not have permission to view this chat');
                        }
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    return response.json();
                });
            
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const data = await messagesPromise;
            
            let messages = [];
            
            if (data.data && data.data.messages) {
                messages = data.data.messages;
                console.log(`Found ${messages.length} messages in response.data.messages`);
            } else if (data.messages) {
                messages = data.messages;
                console.log(`Found ${messages.length} messages in response.messages`);
            }
            
            if (messages && messages.length > 0) {
                const reactionPromises = [];
                const messagesToProcess = [];
                const messagesWithReactions = [];
                
                messages.forEach(msg => {
                    this.processedMessageIds.add(msg.id);
                    
                    const hasReactions = msg.has_reactions === true || 
                                        (Array.isArray(msg.reactions) && msg.reactions.length > 0) ||
                                        msg.reaction_count > 0;
                                        
                    if (hasReactions) {
                        messagesWithReactions.push(msg.id);
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
                
                const minimumSkeletonTime = 800;
                const skeletonStartTime = Date.now();
                
                await Promise.race([
                    Promise.all(reactionPromises),
                    new Promise(resolve => setTimeout(resolve, 600))
                ]);
                
                messagesToProcess.forEach(item => {
                    const message = messages.find(m => m.id === item.messageId);
                    if (message) {
                        message.reactions = item.reactions || [];
                    }
                });
                
                const elapsedTime = Date.now() - skeletonStartTime;
                if (elapsedTime < minimumSkeletonTime) {
                    await new Promise(resolve => setTimeout(resolve, minimumSkeletonTime - elapsedTime));
                }
                
                this.hideEmptyState();
                this.renderMessages(messages);
                
                Promise.all(reactionPromises).then(() => {
                    messagesToProcess.forEach(item => {
                        if (window.emojiReactions && item.reactions?.length > 0) {
                            window.emojiReactions.updateReactionsDisplay(item.messageId, item.reactions);
                        }
                    });
                });
                
                this.scrollToBottom();
            } else {
                await new Promise(resolve => setTimeout(resolve, 500));
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
        
        if (this.skeletonLoader) {
            this.skeletonLoader.clear();
        }
        
        const emptyStates = this.chatMessages.querySelectorAll('#chat-empty-state');
        let removed = false;
        
        emptyStates.forEach(emptyState => {
            emptyState.remove();
            removed = true;
        });
        
        const allEmptyStateElements = this.chatMessages.querySelectorAll('[id*="empty"], .empty-state, .no-messages');
        allEmptyStateElements.forEach(element => {
            if (element.textContent.includes('No messages yet') || element.textContent.includes('Start the conversation')) {
                element.remove();
                removed = true;
            }
        });
        
        return removed;
    }
    
    showEmptyState() {
        if (!this.chatMessages) return;
        
        if (this.skeletonLoader) {
            this.skeletonLoader.clear();
        }
        
        this.ensureMessagesContainer();
        
        let emptyState = this.chatMessages.querySelector('#chat-empty-state');
        if (emptyState) {
            emptyState.style.display = 'flex';
            return;
        }
        
        emptyState = document.createElement('div');
        emptyState.id = 'chat-empty-state';
        emptyState.className = 'flex flex-col items-center justify-center p-8 text-[#b5bac1] h-full absolute inset-0 z-0';
        emptyState.innerHTML = `
            <i class="fas fa-comments text-6xl mb-4 opacity-50"></i>
            <p class="text-lg font-medium">No messages yet</p>
            <p class="text-sm mt-2">Start the conversation by sending a message!</p>
        `;
        
        this.chatMessages.style.position = 'relative';
        this.chatMessages.appendChild(emptyState);
        
        console.log('Empty state shown - messages-container preserved for first message');
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    debugContainerState() {
        console.log('🔍 === DEBUG: Current Container State ===');
        
        const state = {
            chatMessages: {
                exists: !!this.chatMessages,
                id: this.chatMessages?.id,
                children: this.chatMessages?.children.length || 0,
                innerHTML: this.chatMessages?.innerHTML.substring(0, 200) + '...'
            },
            messagesContainer: {
                exists: !!this.messagesContainer,
                className: this.messagesContainer?.className,
                children: this.messagesContainer?.children.length || 0,
                inDOM: this.messagesContainer ? document.contains(this.messagesContainer) : false,
                hasParent: !!this.messagesContainer?.parentNode,
                parentId: this.messagesContainer?.parentNode?.id
            },
            domQuery: {
                messagesContainerInDOM: !!document.querySelector('#chat-messages .messages-container'),
                chatMessagesInDOM: !!document.getElementById('chat-messages'),
                messageGroups: document.querySelectorAll('.message-group').length
            }
        };
        
        console.table(state.chatMessages);
        console.table(state.messagesContainer);
        console.table(state.domQuery);
        
        if (this.messagesContainer) {
            console.log('📦 Messages Container Element:', this.messagesContainer);
        } else {
            console.warn('⚠️ No messages container reference');
        }
        
        return state;
    }

    verifyMessageInDOM(messageId, expectedContainer) {
        console.log('🔍 Verifying message in DOM:', messageId);
        
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (!messageElement) {
            console.error('❌ Message element not found in DOM');
            return false;
        }
        
        const messageGroup = messageElement.closest('.message-group');
        if (!messageGroup) {
            console.error('❌ Message group not found');
            return false;
        }
        
        const actualContainer = messageGroup.parentNode;
        if (actualContainer !== expectedContainer) {
            console.error('❌ Message in wrong container:', {
                expected: expectedContainer.className,
                actual: actualContainer ? actualContainer.className : 'null'
            });
            return false;
        }
        
        const isVisible = messageGroup.offsetParent !== null;
        const hasContent = messageElement.textContent.trim().length > 0;
        
        const verification = {
            elementExists: !!messageElement,
            groupExists: !!messageGroup,
            correctContainer: actualContainer === expectedContainer,
            isVisible,
            hasContent,
            containerClass: actualContainer.className,
            messageText: messageElement.textContent.substring(0, 50)
        };
        
        console.log('📊 Message verification result:', verification);
        
        const success = verification.elementExists && 
                       verification.groupExists && 
                       verification.correctContainer && 
                       verification.isVisible;
        
        if (success) {
            console.log('✅ Message successfully verified in messages-container');
        } else {
            console.error('❌ Message verification failed');
        }
        
        return success;
    }
    
    forceTestContainerAppend() {
        console.log('🧪 FORCE TESTING CONTAINER APPEND...');
        
        const container = this.validateAndGetContainer();
        if (!container) {
            console.error('❌ Cannot test - no valid container');
            return false;
        }
        
        const testElement = document.createElement('div');
        testElement.style.background = 'red';
        testElement.style.height = '50px';
        testElement.style.width = '100%';
        testElement.textContent = 'TEST ELEMENT - FORCE APPEND';
        testElement.id = 'force-test-element';
        
        console.log('🧪 Attempting to append test element...');
        
        try {
            container.appendChild(testElement);
            
            const testSuccess = container.contains(testElement);
            console.log('🧪 Force test result:', {
                elementAppended: testSuccess,
                containerChildren: container.children.length,
                testElementInDOM: document.getElementById('force-test-element') !== null
            });
            
            if (testSuccess) {
                console.log('✅ FORCE TEST PASSED - Container can accept elements!');
                setTimeout(() => testElement.remove(), 2000);
                return true;
            } else {
                console.error('❌ FORCE TEST FAILED - Container cannot accept elements!');
                return false;
            }
        } catch (error) {
            console.error('❌ FORCE TEST ERROR:', error);
            return false;
        }
    }
    
    quickMessageTest() {
        console.log('🧪 QUICK MESSAGE TEST...');
        
        const testMessage = {
            id: 'test_' + Date.now(),
            content: 'TEST MESSAGE - If you see this, the system works!',
            user_id: this.userId,
            username: 'TEST USER',
            avatar_url: '/public/assets/common/default-profile-picture.png',
            sent_at: Date.now()
        };
        
        console.log('🧪 Adding test message...');
        this.addMessage(testMessage);
        
        setTimeout(() => {
            const testElement = document.querySelector(`[data-message-id="${testMessage.id}"]`);
            if (testElement) {
                console.log('✅ QUICK TEST PASSED - Test message visible!');
                setTimeout(() => {
                    const messageGroup = testElement.closest('.message-group');
                    if (messageGroup) messageGroup.remove();
                }, 3000);
                return true;
            } else {
                console.error('❌ QUICK TEST FAILED - Test message not found!');
                return false;
            }
        }, 100);
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