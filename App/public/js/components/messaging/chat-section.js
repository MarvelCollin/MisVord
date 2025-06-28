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
        this.filePreviewModal = null;
        this.currentFileUploads = [];
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
        this.socketListenersSetup = false;
        this.typingUsers = new Map();
        this.joinedRooms = new Set();
        
        this.chatType = null;
        this.targetId = null;
        this.userId = null;
        this.username = null;
        this.avatar_url = null;
        
        this.chatBot = null;
        
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
                             // Do NOT attach a direct listener to moreBtn here – the global delegation handles it to avoid duplicate events.
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
        this.setupFilePreviewEventListeners();
        this.setupIoListeners();
        
        if (window.ChatBot) {
            this.chatBot = new window.ChatBot(this);
            this.chatBot.init();
        } else {
            console.warn('⚠️ ChatBot component not available');
        }
        
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
        this.filePreviewModal = document.getElementById('file-preview-modal');
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
        
        if (!this.filePreviewModal) {
            console.error('File preview modal not found');
        } else {
            console.log('File preview modal found:', {
                display: this.filePreviewModal.style.display,
                hidden: this.filePreviewModal.classList.contains('hidden'),
                zIndex: this.filePreviewModal.style.zIndex
            });
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
                } else if (e.key === 'Escape' && this.chatBot) {
                    this.chatBot.hideTitiBotSuggestions();
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

        const attachmentButton = document.getElementById('attachment-button');
        const attachmentDropdown = document.getElementById('attachment-dropdown');
        
        if (attachmentButton && attachmentDropdown) {
            attachmentButton.addEventListener('click', () => {
                attachmentDropdown.classList.toggle('hidden');
            });

            document.addEventListener('click', (e) => {
                if (!attachmentButton.contains(e.target) && !attachmentDropdown.contains(e.target)) {
                    attachmentDropdown.classList.add('hidden');
                }
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
            this.fileUploadPreview.addEventListener('click', (e) => {
                // Don't remove if clicking on action buttons
                if (e.target.closest('[data-action]')) {
                    e.stopPropagation();
                    return;
                }
                this.removeFileUpload();
            });
        }

        document.addEventListener('click', (e) => {
            if (this.contextMenu && !this.contextMenu.contains(e.target) && this.contextMenuVisible) {
                this.hideContextMenu();
            }
            
            if (!e.target.closest('.message-actions') && this.activeMessageActions) {
                this.hideAllMessageActions();
            }
        });

        if (!this.chatMessages) return;

        this.chatMessages.addEventListener('contextmenu', (e) => {
            const messageContent = e.target.closest('.message-content');
            if (messageContent) {
                console.log('🖱️ Right-click detected on message:', {
                    messageId: messageContent.dataset.messageId,
                    userId: messageContent.dataset.userId,
                    clickX: e.clientX,
                    clickY: e.clientY,
                    target: e.target
                });
                e.preventDefault();
                this.showContextMenu(e.clientX, e.clientY, messageContent);
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
                console.log('😀 Reaction button clicked');
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
                console.log('💬 Reply button clicked');
                const messageContent = replyBtn.closest('.message-content');
                const messageId = messageContent.dataset.messageId;
                this.replyToMessage(messageId);
            } else if (editBtn) {
                console.log('✏️ Edit button clicked');
                const messageContent = editBtn.closest('.message-content');
                const messageId = messageContent.dataset.messageId;
                this.editMessage(messageId);
            } else if (moreBtn) {
                e.stopPropagation();
                const messageContent = moreBtn.closest('.message-content');
                this.showContextMenu(e.clientX, e.clientY, messageContent);
            }
        });
    }

    showContextMenu(x, y, messageContent) {
        console.log('🎯 showContextMenu called with:', {
            x, y,
            messageId: messageContent?.dataset.messageId,
            contextMenuExists: !!this.contextMenu,
            contextMenuVisible: this.contextMenuVisible
        });
        
        if (!this.contextMenu) {
            console.error('❌ Context menu element not found!');
            return;
        }
        
        const messageId = messageContent.dataset.messageId || '';
        const isOwnMessage = messageContent.dataset.userId === this.userId;

        if (this.contextMenuVisible && this.contextMenu.dataset.messageId === messageId) {
            console.log('🔄 Same message context menu already visible, hiding it');
            this.hideContextMenu();
            return;
        }
        
        this.hideContextMenu();

        // Initial positioning
        this.contextMenu.style.position = 'fixed';
        this.contextMenu.style.left = `${x}px`;
        this.contextMenu.style.top = `${y}px`;
        this.contextMenu.style.transform = 'none';
        this.contextMenu.style.zIndex = '10000';
        this.contextMenu.style.minWidth = '200px';
        this.contextMenu.style.display = 'block';
        this.contextMenu.style.visibility = 'visible';
        this.contextMenu.style.opacity = '1';
        this.contextMenu.classList.remove('hidden');
        
        // Get dimensions after making visible
        const menuRect = this.contextMenu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Calculate available space
        const spaceRight = viewportWidth - x;
        const spaceBottom = viewportHeight - y;
        
        // Adjust position if needed
        let adjustedX = x;
        let adjustedY = y;
        
        // Handle horizontal overflow - prefer showing menu to the left of click if not enough space on right
        if (spaceRight < menuRect.width + 10) {
            adjustedX = x - menuRect.width;
            if (adjustedX < 10) adjustedX = 10; // Minimum 10px from left edge
        }
        
        // Handle vertical overflow - prefer showing menu above click if not enough space below
        if (spaceBottom < menuRect.height + 10) {
            adjustedY = y - menuRect.height;
            if (adjustedY < 10) adjustedY = 10; // Minimum 10px from top edge
        }
        
        // Apply adjusted position
        this.contextMenu.style.left = `${adjustedX}px`;
        this.contextMenu.style.top = `${adjustedY}px`;
        
        console.log('📏 Menu positioning:', {
            original: { x, y },
            adjusted: { x: adjustedX, y: adjustedY },
            menuSize: { width: menuRect.width, height: menuRect.height },
            viewport: { width: viewportWidth, height: viewportHeight }
        });
        
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
        this.contextMenuVisible = false;
        
        // Reset all positioning styles to default
        this.contextMenu.style.position = '';
        this.contextMenu.style.top = '';
        this.contextMenu.style.left = '';
        this.contextMenu.style.transform = '';
        this.contextMenu.style.zIndex = '';
        this.contextMenu.style.minWidth = '';
        this.contextMenu.style.display = '';
        this.contextMenu.style.visibility = '';
        this.contextMenu.style.opacity = '';
        
        // Clear message ID
        this.contextMenu.dataset.messageId = '';
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
        const userId = messageElement.dataset.userId;
        const username = messageElement.dataset.username;
        
        console.log(`📝 [CHAT] Replying to message:`, {
            messageId,
            userId,
            username,
            messageText: messageText.substring(0, 50) + (messageText.length > 50 ? '...' : '')
        });
        
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
            replyContainer.className = 'bg-[#2b2d31] p-2 rounded-lg mb-2 flex items-center gap-2';
            
            if (this.messageInput && this.messageInput.parentNode) {
                this.messageInput.parentNode.insertBefore(replyContainer, this.messageInput);
            }
        } else {
            replyContainer.innerHTML = '';
        }
        
        const replyInfo = document.createElement('div');
        replyInfo.className = 'flex items-center gap-2 flex-1 min-w-0';
        
        const replyIcon = document.createElement('i');
        replyIcon.className = 'fas fa-reply text-[#b5bac1]';
        
        const replyingTo = document.createElement('div');
        replyingTo.className = 'text-[#b5bac1] text-sm flex items-center gap-1 min-w-0';
        
        const replyLabel = document.createElement('span');
        replyLabel.className = 'text-[#dcddde] whitespace-nowrap';
        replyLabel.textContent = 'Replying to';
        
        const replyUsername = document.createElement('span');
        replyUsername.className = 'text-[#5865f2] font-medium truncate';
        replyUsername.textContent = username;
        
        const replyPreview = document.createElement('div');
        replyPreview.className = 'text-[#b5bac1] text-sm truncate';
        replyPreview.textContent = messageText;
        
        const cancelButton = document.createElement('button');
        cancelButton.className = 'text-[#b5bac1] hover:text-white transition-colors p-1';
        cancelButton.innerHTML = '<i class="fas fa-times"></i>';
        cancelButton.title = 'Cancel Reply';
        cancelButton.addEventListener('click', () => this.cancelReply());
        
        replyingTo.appendChild(replyLabel);
        replyingTo.appendChild(replyUsername);
        
        replyInfo.appendChild(replyIcon);
        replyInfo.appendChild(replyingTo);
        
        replyContainer.appendChild(replyInfo);
        replyContainer.appendChild(replyPreview);
        replyContainer.appendChild(cancelButton);
        
        replyContainer.style.animation = 'replyInputSlideIn 0.2s ease-out forwards';
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
        console.log('🔥 Handling file selection');
        
        if (!this.fileUploadInput) {
            console.error('File upload input not found');
            return;
        }

        const files = this.fileUploadInput.files;
        if (!files || files.length === 0) {
            console.log('No files selected');
            return;
        }

        const fileUploadArea = document.getElementById('file-upload-area');
        const fileUploadList = document.getElementById('file-upload-list');
        const fileCount = document.getElementById('file-count');
        
        if (!fileUploadArea || !fileUploadList) {
            console.error('File upload area elements not found');
            return;
        }

        // Clear previous files
        fileUploadList.innerHTML = '';
        this.currentFileUploads = [];

        Array.from(files).forEach((file, index) => {
            if (file.size > (50 * 1024 * 1024)) {
                this.showNotification(`File ${file.name} is too large. Maximum size is 50MB`, 'error');
                return;
            }

            const fileData = {
                name: file.name,
                size: file.size,
                type: file.type,
                file: file,
                url: null,
                index: index
            };

            this.currentFileUploads.push(fileData);
            this.createFileCard(fileData, index);

            // Load preview for supported file types
            if (file.type.startsWith('image/')) {
                this.loadImagePreview(file, index);
            } else if (file.type.startsWith('text/') || this.isTextFile(file.name)) {
                this.loadTextPreview(file, index);
            }
        });

        // Update UI
        if (this.currentFileUploads.length > 0) {
            fileUploadArea.classList.remove('hidden');
            fileCount.textContent = `${this.currentFileUploads.length} file${this.currentFileUploads.length !== 1 ? 's' : ''}`;
        }

        this.updateSendButton();
        console.log('✅ File selection handled:', this.currentFileUploads.length, 'files');
    }

    createFileCard(fileData, index) {
        const fileUploadList = document.getElementById('file-upload-list');
        if (!fileUploadList) return;

        const card = document.createElement('div');
        card.className = 'file-upload-card bg-[#36393f] rounded-lg p-2 flex flex-col items-center gap-2 transition-all duration-200 hover:bg-[#42464d] relative group';
        card.style.width = '120px';
        card.style.minHeight = '120px';
        card.dataset.fileIndex = index;
        card.id = `file-card-${index}`;

        // File icon
        const iconContainer = document.createElement('div');
        iconContainer.className = 'w-12 h-12 rounded-lg overflow-hidden bg-[#2b2d31] flex items-center justify-center flex-shrink-0';
        
        const icon = this.getFileIcon(fileData.type, fileData.name);
        iconContainer.innerHTML = icon;
        
        // For images, we'll replace the icon with actual preview
        if (fileData.type.startsWith('image/')) {
            iconContainer.id = `file-icon-${index}`;
        }

        // File name
        const fileName = document.createElement('div');
        fileName.className = 'text-[#f2f3f5] font-medium text-xs text-center leading-tight';
        fileName.style.wordBreak = 'break-word';
        fileName.style.lineHeight = '1.2';
        fileName.style.maxHeight = '2.4em';
        fileName.style.overflow = 'hidden';
        fileName.style.display = '-webkit-box';
        fileName.style.webkitLineClamp = '2';
        fileName.style.webkitBoxOrient = 'vertical';
        fileName.textContent = fileData.name;
        fileName.title = fileData.name;

        // File size
        const fileSize = document.createElement('div');
        fileSize.className = 'text-[#b5bac1] text-xs text-center';
        fileSize.textContent = this.formatFileSize(fileData.size);

        // Action buttons (overlay)
        const actionButtons = document.createElement('div');
        actionButtons.className = 'absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200';

        const previewBtn = document.createElement('button');
        previewBtn.className = 'file-preview-btn w-6 h-6 bg-[#5865f2] hover:bg-[#4752c4] rounded-full flex items-center justify-center text-white transition-all duration-200 shadow-lg';
        previewBtn.dataset.action = 'preview';
        previewBtn.dataset.fileIndex = index;
        previewBtn.title = 'Preview';
        previewBtn.innerHTML = '<i class="fas fa-eye text-xs"></i>';

        const removeBtn = document.createElement('button');
        removeBtn.className = 'file-remove-btn w-6 h-6 bg-[#ed4245] hover:bg-[#dc2626] rounded-full flex items-center justify-center text-white transition-all duration-200 shadow-lg';
        removeBtn.dataset.action = 'remove';
        removeBtn.dataset.fileIndex = index;
        removeBtn.title = 'Remove';
        removeBtn.innerHTML = '<i class="fas fa-times text-xs"></i>';

        actionButtons.appendChild(previewBtn);
        actionButtons.appendChild(removeBtn);

        card.appendChild(iconContainer);
        card.appendChild(fileName);
        card.appendChild(fileSize);
        card.appendChild(actionButtons);
        fileUploadList.appendChild(card);

        // Add event listeners
        this.addFileCardEventListeners(card, index);
    }

    getFileIcon(mimeType, fileName) {
        const isImage = mimeType.startsWith('image/');
        const isVideo = mimeType.startsWith('video/');
        const isAudio = mimeType.startsWith('audio/');
        const isPdf = mimeType === 'application/pdf';
        const isText = mimeType.startsWith('text/') || this.isTextFile(fileName);
        const isDoc = this.isDocFile(mimeType);
        const isExcel = this.isExcelFile(mimeType);

        if (isImage) {
            return '<i class="fas fa-image text-[#5865f2] text-xl"></i>';
        } else if (isVideo) {
            return '<i class="fas fa-play text-[#5865f2] text-xl"></i>';
        } else if (isAudio) {
            return '<div class="w-full h-full bg-gradient-to-br from-[#5865f2] to-[#7289da] flex items-center justify-center"><i class="fas fa-music text-white text-xl"></i></div>';
        } else if (isPdf) {
            return '<div class="w-full h-full bg-gradient-to-br from-[#dc2626] to-[#ef4444] flex items-center justify-center"><i class="fas fa-file-pdf text-white text-xl"></i></div>';
        } else if (isText) {
            return '<div class="w-full h-full bg-gradient-to-br from-[#16a34a] to-[#22c55e] flex items-center justify-center"><i class="fas fa-file-text text-white text-xl"></i></div>';
        } else if (isDoc) {
            return '<div class="w-full h-full bg-gradient-to-br from-[#2563eb] to-[#3b82f6] flex items-center justify-center"><i class="fas fa-file-word text-white text-xl"></i></div>';
        } else if (isExcel) {
            return '<div class="w-full h-full bg-gradient-to-br from-[#16a34a] to-[#22c55e] flex items-center justify-center"><i class="fas fa-file-excel text-white text-xl"></i></div>';
        } else {
            return '<i class="fas fa-file text-[#b5bac1] text-xl"></i>';
        }
    }

    isTextFile(fileName) {
        const textExtensions = ['txt', 'md', 'log', 'json', 'xml', 'csv', 'js', 'html', 'css', 'py', 'java', 'cpp', 'c', 'h'];
        const ext = fileName.split('.').pop().toLowerCase();
        return textExtensions.includes(ext);
    }

    isDocFile(mimeType) {
        return ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(mimeType);
    }

    isExcelFile(mimeType) {
        return ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(mimeType);
    }

    loadImagePreview(file, index) {
        const iconContainer = document.getElementById(`file-icon-${index}`);
        if (!iconContainer) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            iconContainer.style.backgroundImage = `url(${e.target.result})`;
            iconContainer.style.backgroundSize = 'cover';
            iconContainer.style.backgroundPosition = 'center';
            iconContainer.innerHTML = '';
        };
        reader.readAsDataURL(file);
    }

    addFileCardEventListeners(card, index) {
        const actionButtons = card.querySelectorAll('[data-action]');
        actionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                const action = btn.dataset.action;
                const fileIndex = parseInt(btn.dataset.fileIndex);
                
                console.log('File action:', action, 'Index:', fileIndex);
                this.handleFileAction(action, fileIndex);
            });
        });
    }

    loadTextPreview(file, index) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const previewElement = document.getElementById(`file-preview-${index}`);
            if (previewElement) {
                const lines = content.split('\n').slice(0, 8);
                const preview = lines.map(line => line.length > 50 ? line.substring(0, 50) + '...' : line).join('\n');
                previewElement.textContent = preview;
            }
        };
        reader.readAsText(file);
    }

    setupFilePreviewEventListeners() {
        console.log('🔧 Setting up file preview event listeners');
        
        // Clear all files button
        const clearAllBtn = document.getElementById('clear-all-files');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                console.log('Clear all files clicked');
                this.removeAllFiles();
            });
        }

        // Modal event listeners
        if (this.filePreviewModal) {
            console.log('Setting up modal event listeners');
            
            const closeBtn = this.filePreviewModal.querySelector('#modal-close');
            const downloadBtn = this.filePreviewModal.querySelector('#modal-download');
            
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    console.log('Close button clicked');
                    this.closeFileModal();
                });
            }
            
            if (downloadBtn) {
                downloadBtn.addEventListener('click', () => {
                    console.log('Download button clicked');
                    this.downloadCurrentFile();
                });
            }

            // Close on background click
            this.filePreviewModal.addEventListener('click', (e) => {
                if (e.target === this.filePreviewModal) {
                    console.log('Modal background clicked');
                    this.closeFileModal();
                }
            });

            // Close on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && !this.filePreviewModal.classList.contains('opacity-0')) {
                    console.log('Escape key pressed');
                    this.closeFileModal();
                }
            });
        } else {
            console.error('File preview modal not found');
        }
        
        console.log('✅ File preview event listeners set up');
    }

    removeAllFiles() {
        console.log('🗑️ Removing all files');
        
        const fileUploadArea = document.getElementById('file-upload-area');
        const fileUploadList = document.getElementById('file-upload-list');
        
        if (fileUploadList) {
            fileUploadList.innerHTML = '';
        }
        
        this.currentFileUploads = [];
        
        if (fileUploadArea) {
            fileUploadArea.classList.add('hidden');
        }
        
        if (this.fileUploadInput) {
            this.fileUploadInput.value = '';
        }
        
        this.updateSendButton();
        console.log('✅ All files removed');
    }

    handleFileAction(action, fileIndex) {
        const fileData = this.currentFileUploads[fileIndex];
        if (!fileData) {
            console.error('File data not found for index:', fileIndex);
            return;
        }

        console.log('🎯 Handling file action:', action, 'for file:', fileData.name);

        switch (action) {
            case 'preview':
                this.openFilePreviewModal(fileData, fileIndex);
                break;
            case 'edit':
                this.editFile(fileData, fileIndex);
                break;
            case 'remove':
                this.removeFileFromUpload(fileIndex);
                break;
        }
    }

    openFilePreviewModal(fileData, fileIndex) {
        console.log('🎭 Opening file preview modal for:', fileData.name);
        
        if (!this.filePreviewModal) {
            console.error('File preview modal not found');
            return;
        }

        const modal = this.filePreviewModal;
        const modalContainer = modal.querySelector('#modal-container');
        const modalTitle = modal.querySelector('#modal-title');
        const modalContent = modal.querySelector('#modal-content');
        const modalFileIcon = modal.querySelector('#modal-file-icon');
        const modalFileInfo = modal.querySelector('#modal-file-info');
        const modalFooter = modal.querySelector('#modal-footer');
        
        if (!modalTitle || !modalContent) {
            console.error('Modal elements not found');
            return;
        }

        // Set file info
        modalTitle.textContent = fileData.name;
        modalFileIcon.innerHTML = this.getFileIcon(fileData.type, fileData.name).replace('text-xl', 'text-lg');
        
        if (modalFileInfo) {
            modalFileInfo.textContent = `${this.formatFileSize(fileData.size)} • ${fileData.type || 'Unknown type'}`;
        }

        // Clear content
        modalContent.innerHTML = '<div class="flex items-center justify-center h-64 text-[#b5bac1]"><div class="text-center"><i class="fas fa-spinner fa-spin text-3xl mb-2"></i><div>Loading...</div></div></div>';

        // Show modal
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.remove('opacity-0', 'invisible');
            modal.classList.add('opacity-100', 'visible');
            modalContainer.classList.remove('scale-95');
            modalContainer.classList.add('scale-100');
        }, 10);

        // Load content based on file type
        this.loadModalContent(fileData, modalContent, modalFooter);
        
        this.currentModalFile = fileData;
        console.log('✅ Modal opened successfully');
    }

    loadModalContent(fileData, modalContent, modalFooter) {
        const isImage = fileData.type.startsWith('image/');
        const isVideo = fileData.type.startsWith('video/');
        const isAudio = fileData.type.startsWith('audio/');
        const isPdf = fileData.type === 'application/pdf';
        const isText = fileData.type.startsWith('text/') || this.isTextFile(fileData.name);

        if (isImage) {
            const reader = new FileReader();
            reader.onload = (e) => {
                modalContent.innerHTML = `
                    <div class="flex items-center justify-center min-h-64">
                        <img src="${e.target.result}" class="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg" alt="${fileData.name}">
                    </div>
                `;
            };
            reader.readAsDataURL(fileData.file);
        } else if (isVideo) {
            const reader = new FileReader();
            reader.onload = (e) => {
                modalContent.innerHTML = `
                    <div class="flex items-center justify-center min-h-64">
                        <video controls class="max-w-full max-h-[70vh] rounded-lg shadow-lg" src="${e.target.result}">
                            Your browser does not support the video tag.
                        </video>
                    </div>
                `;
            };
            reader.readAsDataURL(fileData.file);
        } else if (isAudio) {
            const reader = new FileReader();
            reader.onload = (e) => {
                modalContent.innerHTML = `
                    <div class="flex flex-col items-center justify-center min-h-64 p-8">
                        <div class="w-32 h-32 bg-gradient-to-br from-[#5865f2] to-[#7289da] rounded-full flex items-center justify-center mb-6 shadow-lg">
                            <i class="fas fa-music text-white text-4xl"></i>
                        </div>
                        <div class="text-center mb-6">
                            <h3 class="text-[#f2f3f5] font-semibold text-lg mb-2">${fileData.name}</h3>
                            <p class="text-[#b5bac1] text-sm">${this.formatFileSize(fileData.size)}</p>
                        </div>
                        <audio controls class="w-full max-w-md" src="${e.target.result}">
                            Your browser does not support the audio tag.
                        </audio>
                    </div>
                `;
            };
            reader.readAsDataURL(fileData.file);
        } else if (isText) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                const lineCount = content.split('\n').length;
                modalContent.innerHTML = `
                    <div class="space-y-4">
                        <div class="flex items-center justify-between text-sm text-[#b5bac1] border-b border-[#3f4147] pb-2">
                            <span>${lineCount} lines</span>
                            <span>${fileData.type || 'Plain text'}</span>
                        </div>
                        <pre class="bg-[#1e1f22] p-4 rounded-lg text-[#dcddde] text-sm font-mono whitespace-pre-wrap max-h-96 overflow-auto border border-[#3f4147]">${content}</pre>
                    </div>
                `;
            };
            reader.readAsText(fileData.file);
        } else {
            const icon = this.getFileIcon(fileData.type, fileData.name);
            modalContent.innerHTML = `
                <div class="flex flex-col items-center justify-center min-h-64 p-8 text-center">
                    <div class="w-24 h-24 mb-6 flex items-center justify-center">
                        ${icon.replace('text-xl', 'text-5xl')}
                    </div>
                    <h3 class="text-[#f2f3f5] font-semibold text-lg mb-2">${fileData.name}</h3>
                    <p class="text-[#b5bac1] mb-4">${this.formatFileSize(fileData.size)}</p>
                    <p class="text-[#b5bac1] text-sm mb-6">Preview not available for this file type</p>
                    <button class="px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded transition-colors duration-200" onclick="window.chatSection.downloadCurrentFile()">
                        <i class="fas fa-download mr-2"></i>Download File
                    </button>
                </div>
            `;
            
            if (modalFooter) {
                modalFooter.classList.remove('hidden');
            }
        }
    }

    editFile(fileData, fileIndex) {
        console.log('Edit file:', fileData.name);
    }

    removeFileFromUpload(fileIndex) {
        console.log('🗑️ Removing file at index:', fileIndex);
        
        const fileUploadList = document.getElementById('file-upload-list');
        const fileUploadArea = document.getElementById('file-upload-area');
        const fileCount = document.getElementById('file-count');
        
        if (fileUploadList) {
            const card = fileUploadList.querySelector(`[data-file-index="${fileIndex}"]`);
            if (card) {
                card.remove();
                console.log('File card removed from DOM');
            }
        }

        // Remove from array
        this.currentFileUploads.splice(fileIndex, 1);
        
        // Update indices for remaining cards
        const remainingCards = fileUploadList.querySelectorAll('.file-upload-card');
        remainingCards.forEach((card, newIndex) => {
            card.dataset.fileIndex = newIndex;
            card.id = `file-card-${newIndex}`;
            
            // Update all buttons in this card
            card.querySelectorAll('[data-file-index]').forEach(btn => {
                btn.dataset.fileIndex = newIndex;
            });
            
            // Update icon ID for images
            const iconContainer = card.querySelector('[id^="file-icon-"]');
            if (iconContainer) {
                iconContainer.id = `file-icon-${newIndex}`;
            }
        });

        // Update UI
        if (this.currentFileUploads.length === 0) {
            fileUploadArea.classList.add('hidden');
            if (this.fileUploadInput) {
                this.fileUploadInput.value = '';
            }
        } else {
            fileCount.textContent = `${this.currentFileUploads.length} file${this.currentFileUploads.length !== 1 ? 's' : ''}`;
        }

        this.updateSendButton();
        console.log('✅ File removed. Remaining files:', this.currentFileUploads.length);
    }

    closeFileModal() {
        console.log('🎭 Closing file modal');
        if (this.filePreviewModal) {
            const modal = this.filePreviewModal;
            const modalContainer = modal.querySelector('#modal-container');
            
            modal.classList.remove('opacity-100', 'visible');
            modal.classList.add('opacity-0', 'invisible');
            modalContainer.classList.remove('scale-100');
            modalContainer.classList.add('scale-95');
            
            setTimeout(() => {
                modal.style.display = 'none';
            }, 200);
            
            this.currentModalFile = null;
            console.log('✅ Modal closed');
        } else {
            console.error('File preview modal not found');
        }
    }

    downloadCurrentFile() {
        if (this.currentModalFile) {
            const url = URL.createObjectURL(this.currentModalFile.file);
            const a = document.createElement('a');
            a.href = url;
            a.download = this.currentModalFile.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }
    
    removeFileUpload() {
        this.currentFileUpload = null;
        this.currentFileUploads = [];
        
        const filePreview = document.getElementById('file-preview');
        const fileUpload = document.getElementById('file-upload');
        const previewsContainer = document.getElementById('file-previews-container');
        
        if (filePreview) filePreview.classList.add('hidden');
        if (fileUpload) fileUpload.value = '';
        if (previewsContainer) previewsContainer.innerHTML = '';
        
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
        
        const hasContent = (this.messageInput && this.messageInput.value.trim().length > 0) || 
                          this.currentFileUpload || 
                          (this.currentFileUploads && this.currentFileUploads.length > 0);
        
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
            // Create message data
            const messageData = {
                id: messageId,
                content: content,
                user_id: this.userId,
                username: this.username,
                avatar_url: this.avatar_url,
                timestamp: timestamp,
                source: 'client-originated'
            };
            
            // Add target info based on chat type
            if (this.chatType === 'channel') {
                messageData.channel_id = this.targetId;
            } else {
                messageData.room_id = this.targetId;
            }

            // Add reply info if replying
            if (this.replyingTo) {
                messageData.reply_message_id = this.replyingTo.messageId;
                messageData.reply_data = {
                    username: this.replyingTo.username,
                    content: this.replyingTo.content
                };
            }

            // First emit via socket
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

            if (this.replyingTo) {
                options.reply_message_id = this.replyingTo.messageId;
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

                const permanentMessageId = apiResponse.data?.message?.id || apiResponse.data?.id;
                if (permanentMessageId) {
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
                } else {
                    console.warn('⚠️ No permanent message ID in API response');
                }
            } catch (apiError) {
                console.error('❌ API call failed:', apiError);
                throw apiError;
            }

            this.messageInput.value = '';
            this.updateSendButton();
            this.resizeTextarea();
            
            if (this.replyingTo) {
                console.log('↩️ Clearing reply context');
                this.cancelReply();
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
    
    prepareChatContainer() {
        if (!this.chatMessages) {
            console.error('❌ prepareChatContainer: chatMessages element not found');
            return;
        }
        
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
    
    async addMessage(message) {
        if (!message || !message.id) {
            console.error('❌ [CHAT-SECTION] Invalid message data:', message);
            return;
        }
        
        console.log('📨 [CHAT-SECTION] Processing message:', {
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
                console.log(`🔄 [CHAT-SECTION] Replacing temporary message ${message.id}`);
                tempElement.remove();
                this.processedMessageIds.delete(message.id);
            }
        }
        
        if (message.source === 'server-originated' || !this.processedMessageIds.has(message.id)) {
            try {
                const isOwnMessage = message.user_id === this.userId;
                const container = this.validateAndGetContainer();
                
                if (!container) {
                    console.error('❌ [CHAT-SECTION] No valid container found for message:', message);
            return;
        }
        
                let messageGroup = this.findOrCreateMessageGroup(message, isOwnMessage);
                const messageContent = this.createMessageContent(message, isOwnMessage);
                
                if (!messageContent) {
                    console.error('❌ [CHAT-SECTION] Failed to create message content:', message);
            return;
        }
        
                messageContent.addEventListener('mouseover', () => this.showMessageActions(messageContent));
                messageContent.addEventListener('mouseout', (e) => {
                    const relatedTarget = e.relatedTarget;
                    if (!messageContent.contains(relatedTarget) && !relatedTarget?.closest('.message-actions')) {
                        this.hideMessageActions(messageContent);
                    }
                });
                
                const actionsContainer = messageContent.querySelector('.message-actions');
                if (actionsContainer) {
                    const reactionBtn = actionsContainer.querySelector('.message-action-reaction');
                    const replyBtn = actionsContainer.querySelector('.message-action-reply');
                    const editBtn = actionsContainer.querySelector('.message-action-edit');
                    
                    if (reactionBtn) reactionBtn.addEventListener('click', () => this.showEmojiPicker(message.id, reactionBtn));
                    if (replyBtn) replyBtn.addEventListener('click', () => this.replyToMessage(message.id));
                    if (editBtn) editBtn.addEventListener('click', () => this.editMessage(message.id));
                }
                
                messageGroup.querySelector('.message-group-content').appendChild(messageContent);
                
                this.processedMessageIds.add(message.id);
                
                const shouldScroll = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
                if (shouldScroll) {
                    this.scrollToBottom();
                }
                
                console.log(`✅ [CHAT-SECTION] Message added successfully:`, {
                    id: message.id,
                    isOwnMessage,
                    shouldScroll
                });
            } catch (error) {
                console.error('❌ [CHAT-SECTION] Error adding message:', error, {
                    messageId: message.id,
                    userId: message.user_id,
                    username: message.username
                });
            }
                } else {
            console.log(`⏭️ [CHAT-SECTION] Skipping duplicate message:`, {
                id: message.id,
                source: message.source
            });
        }
    }
    
    findOrCreateMessageGroup(message, isOwnMessage) {
        const container = this.validateAndGetContainer();
        const groups = container.querySelectorAll('.message-group');
        let lastGroup = groups[groups.length - 1];
        
        if (lastGroup && 
            lastGroup.dataset.userId === message.user_id.toString() &&
            Date.now() - parseInt(lastGroup.dataset.timestamp) < 300000) { // 5 minutes
            return lastGroup;
        }
        
        const newGroup = this.createMessageGroup(message, isOwnMessage);
        this.safeAppendToContainer(container, newGroup);
        return newGroup;
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
        messageElement.className = 'message-content relative';
        messageElement.dataset.messageId = message.id;
        messageElement.dataset.userId = message.user_id;
        messageElement.dataset.username = message.username;

        if (message.reply_message_id && message.reply_data) {
            const replyContainer = document.createElement('div');
            replyContainer.className = 'reply-container flex items-center text-sm text-[#b5bac1] mb-1';
            
            const replyLine = document.createElement('div');
            replyLine.className = 'reply-line w-[2px] h-[1.5em] bg-[#4f545c] rounded-sm mr-2';
            
            const replyContent = document.createElement('div');
            replyContent.className = 'reply-content flex items-center cursor-pointer hover:text-[#dcddde]';
            
            const replyUsername = document.createElement('span');
            replyUsername.className = 'reply-username font-medium mr-2';
            replyUsername.textContent = message.reply_data.username;
            
            const replyMessage = document.createElement('span');
            replyMessage.className = 'reply-message truncate';
            
            if (message.reply_data.content) {
                replyMessage.textContent = message.reply_data.content;
            } else {
                const unavailableSpan = document.createElement('span');
                unavailableSpan.className = 'italic';
                
                if (message.reply_data.id) {
                    window.ChatAPI.getMessage(message.reply_data.id)
                        .then(originalMessage => {
                            if (originalMessage && originalMessage.content) {
                                replyMessage.textContent = originalMessage.content;
                            } else {
                                unavailableSpan.textContent = 'Original message not found';
                            }
                        })
                        .catch(() => {
                            unavailableSpan.textContent = 'Original message not found';
                        });
                }
            }
            
            replyContent.appendChild(replyUsername);
            replyContent.appendChild(replyMessage);
            
            replyContainer.appendChild(replyLine);
            replyContainer.appendChild(replyContent);
            messageElement.appendChild(replyContainer);
        }

        const contentElement = document.createElement('div');
        contentElement.className = 'message-main-text text-[#dcddde]';
        
        if (message.content && message.content.trim() !== '') {
            contentElement.innerHTML = this.formatMessageContent(message.content);
        }
        
        messageElement.appendChild(contentElement);

        const attachments = message.attachments || (message.attachment_url ? [message.attachment_url] : []);
        
        if (attachments.length > 0) {
            const attachmentContainer = document.createElement('div');
            attachmentContainer.className = 'message-attachment mt-2 flex flex-wrap gap-2';
            
            attachments.forEach((attachmentUrl, index) => {
                if (message.message_type === 'image' || 
                    (/\.(jpeg|jpg|gif|png|webp)$/i.test(attachmentUrl) || 
                     attachmentUrl.includes('image/'))) {
                
                    const imageWrapper = document.createElement('div');
                    imageWrapper.className = 'image-attachment cursor-pointer relative';
                    
                    const image = document.createElement('img');
                    image.className = 'max-w-md max-h-96 rounded-lg';
                    image.src = attachmentUrl;
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
                        window.open(attachmentUrl, '_blank');
                    });
                    
                    imageWrapper.appendChild(image);
                    attachmentContainer.appendChild(imageWrapper);
                    
                } else if (message.message_type === 'video' || 
                           (/\.(mp4|webm|mov|avi|wmv)$/i.test(attachmentUrl) || 
                            attachmentUrl.includes('video/'))) {
                
                    const videoWrapper = document.createElement('div');
                    videoWrapper.className = 'video-attachment cursor-pointer relative';
                    
                    const video = document.createElement('video');
                    video.className = 'max-w-md max-h-96 rounded-lg';
                    video.src = attachmentUrl;
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
                    fileLink.href = attachmentUrl;
                    fileLink.target = '_blank';
                    fileLink.className = 'block no-underline';
                    
                    const fileContainer = document.createElement('div');
                    fileContainer.className = 'bg-[#2b2d31] p-3 rounded-lg inline-flex items-center max-w-md hover:bg-[#36373d] transition-colors';
                    
                    const fileIconWrapper = document.createElement('div');
                    fileIconWrapper.className = 'text-3xl text-[#b5bac1] mr-3';
                    
                    let fileIcon = 'fas fa-file';
                    
                    if (attachmentUrl) {
                        const extension = attachmentUrl.split('.').pop().toLowerCase();
                        
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
                    fileName.textContent = attachmentUrl.split('/').pop() || 'File';
                    
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
            });
            
            messageElement.appendChild(attachmentContainer);
        }
        
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
        
        const setupSocketHandlers = function(io) {
            console.log('🔌 [CHAT-SECTION] Setting up socket handlers');
            
            if (self.socketListenersSetup) {
                console.log('⚠️ [CHAT-SECTION] Socket listeners already setup, skipping');
                return;
            }
            
            // Channel message handling
            io.on('new-channel-message', function(data) {
                try {
                    console.log('📨 [CHAT-SECTION] Received new-channel-message:', {
                        id: data.id,
                        userId: data.user_id,
                        username: data.username,
                        channelId: data.channel_id,
                        source: data.source,
                        isProcessed: self.processedMessageIds.has(data.id)
                    });
                    
                    // Use strict comparison and check room format
                    const expectedRoom = `channel-${self.targetId}`;
                    const messageRoom = `channel-${data.channel_id}`;
                    
                    if (self.chatType === 'channel' && messageRoom === expectedRoom) {
                    if (!self.processedMessageIds.has(data.id)) {
                            console.log(`✅ [CHAT-SECTION] Adding message ${data.id} to channel ${data.channel_id}`);
                            self.addMessage({...data, source: 'server-originated'});
                        self.processedMessageIds.add(data.id);
                        } else {
                            console.log(`🔄 [CHAT-SECTION] Message ${data.id} already processed, skipping`);
                    }
                    } else {
                        console.log(`❌ [CHAT-SECTION] Message not for this channel. Expected: ${expectedRoom}, Got: ${messageRoom}`);
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
                        isProcessed: self.processedMessageIds.has(data.id)
                    });
                    
                    // Use strict comparison and check room format
                    const expectedRoom = `dm-room-${self.targetId}`;
                    const messageRoom = `dm-room-${data.room_id}`;
                    
                    if ((self.chatType === 'direct' || self.chatType === 'dm') && messageRoom === expectedRoom) {
                    if (!self.processedMessageIds.has(data.id)) {
                            console.log(`✅ [CHAT-SECTION] Adding message ${data.id} to DM room ${data.room_id}`);
                            self.addMessage({...data, source: 'server-originated'});
                        self.processedMessageIds.add(data.id);
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
                if (self.chatType === 'channel' && data.channel_id == self.targetId && data.user_id != self.userId) {
                    self.showTypingIndicator(data.user_id, data.username);
                    }
                } catch (error) {
                    console.error('❌ [CHAT-SECTION] Error handling user-typing:', error);
                }
            });
            
            io.on('user-typing-dm', function(data) {        
                try {
                if ((self.chatType === 'direct' || self.chatType === 'dm') && data.room_id == self.targetId && data.user_id != self.userId) {
                    self.showTypingIndicator(data.user_id, data.username);
                    }
                } catch (error) {
                    console.error('❌ [CHAT-SECTION] Error handling user-typing-dm:', error);
                }
            });
            
            io.on('user-stop-typing', function(data) {
                try {
                if (self.chatType === 'channel' && data.channel_id == self.targetId && data.user_id != self.userId) {
                    self.removeTypingIndicator(data.user_id);
                    }
                } catch (error) {
                    console.error('❌ [CHAT-SECTION] Error handling user-stop-typing:', error);
                }
            });
            
            io.on('user-stop-typing-dm', function(data) {
                try {
                if ((self.chatType === 'direct' || self.chatType === 'dm') && data.room_id == self.targetId && data.user_id != self.userId) {
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
        const roomId = this.targetId;
        
        // Use the correct room format for tracking
        const roomName = roomType === 'channel' ? `channel-${roomId}` : `dm-room-${roomId}`;
        
        if (!window.globalSocketManager.isInRoom(roomName)) {
            console.log(`🚪 Joining room: ${roomType} - ${roomId} (${roomName})`);
            
            // Use the new unified joinRoom method
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
}