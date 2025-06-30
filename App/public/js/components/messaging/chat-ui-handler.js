class ChatUIHandler {
    constructor(chatSection) {
        this.chatSection = chatSection;
        this.contextMenuVisible = false;
        this.activeMessageActions = null;
        this.currentEditingMessage = null;
        this.activeReplyingTo = null;
    }

    showContextMenu(x, y, messageContent) {
        console.log('🎯 showContextMenu called with:', {
            x, y,
            messageId: messageContent?.dataset.messageId,
            contextMenuExists: !!this.chatSection.contextMenu,
            contextMenuVisible: this.contextMenuVisible
        });
        
        if (!this.chatSection.contextMenu) {
            console.error('❌ Context menu element not found!');
            return;
        }
        
        const messageId = messageContent.dataset.messageId || '';
        const isOwnMessage = messageContent.dataset.userId === this.chatSection.userId;

        if (this.contextMenuVisible && this.chatSection.contextMenu.dataset.messageId === messageId) {
            console.log('🔄 Same message context menu already visible, hiding it');
            this.hideContextMenu();
            return;
        }
        
        this.hideContextMenu();

        // Initial positioning
        this.chatSection.contextMenu.style.position = 'fixed';
        this.chatSection.contextMenu.style.left = `${x}px`;
        this.chatSection.contextMenu.style.top = `${y}px`;
        this.chatSection.contextMenu.style.transform = 'none';
        this.chatSection.contextMenu.style.zIndex = '10000';
        this.chatSection.contextMenu.style.minWidth = '200px';
        this.chatSection.contextMenu.style.display = 'block';
        this.chatSection.contextMenu.style.visibility = 'visible';
        this.chatSection.contextMenu.style.opacity = '1';
        this.chatSection.contextMenu.classList.remove('hidden');
        
        // Get dimensions after making visible
        const menuRect = this.chatSection.contextMenu.getBoundingClientRect();
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
        this.chatSection.contextMenu.style.left = `${adjustedX}px`;
        this.chatSection.contextMenu.style.top = `${adjustedY}px`;
        
        console.log('📏 Menu positioning:', {
            original: { x, y },
            adjusted: { x: adjustedX, y: adjustedY },
            menuSize: { width: menuRect.width, height: menuRect.height },
            viewport: { width: viewportWidth, height: viewportHeight }
        });
        
        this.chatSection.contextMenu.dataset.messageId = messageId;
        this.contextMenuVisible = true;
        
        const editBtn = this.chatSection.contextMenu.querySelector('[data-action="edit"]');
        if (editBtn) {
            editBtn.style.display = isOwnMessage ? 'flex' : 'none';
        }
        
        const deleteBtn = this.chatSection.contextMenu.querySelector('[data-action="delete"]');
        if (deleteBtn) {
            deleteBtn.style.display = isOwnMessage ? 'flex' : 'none';
        }
        
        this.setupContextMenuListeners();
    }
    
    setupContextMenuListeners() {
        if (!this.chatSection.contextMenu) return;
        
        const buttons = this.chatSection.contextMenu.querySelectorAll('button[data-action]');
        buttons.forEach(button => {
            button.replaceWith(button.cloneNode(true));
        });
        
        const newButtons = this.chatSection.contextMenu.querySelectorAll('button[data-action]');
        newButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const action = button.getAttribute('data-action');
                const messageId = this.chatSection.contextMenu.dataset.messageId;
                
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
                        this.chatSection.showEmojiPicker(messageId, button);
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
                    contentDiv.innerHTML = this.chatSection.formatMessageContent(newContent);

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
            this.chatSection.showNotification('Failed to update message', 'error');
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
                    this.chatSection.showNotification('Message deleted successfully', 'success');
                }
            } catch (toastError) {
                console.warn('Toast notification failed, using fallback:', toastError);
                this.chatSection.showNotification('Message deleted successfully', 'success');
            }
            
        } catch (error) {
            console.error('Failed to delete message:', error);
            try {
                if (typeof showToast === 'function') {
                    showToast('Failed to delete message', 'error', 5000);
                } else if (window.showToast && typeof window.showToast === 'function') {
                    window.showToast('Failed to delete message', 'error', 5000);
                } else {
                    this.chatSection.showNotification('Failed to delete message', 'error');
                }
            } catch (toastError) {
                console.warn('Toast notification failed, using fallback:', toastError);
                this.chatSection.showNotification('Failed to delete message', 'error');
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
        this.chatSection.showNotification('Message copied to clipboard');
    }
    
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.chatSection.showNotification('Copied to clipboard');
        }).catch(err => {
            console.error('Failed to copy text:', err);
            this.chatSection.showNotification('Failed to copy to clipboard', 'error');
        });
    }
    
    copyMessageLink(messageId) {
        const url = `${window.location.href}?messageId=${messageId}`;
        this.copyToClipboard(url);
    }
    
    markAsUnread(messageId) {
        this.chatSection.showNotification('Message marked as unread');
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
                this.chatSection.showNotification(message, 'success');
            }
            
        } catch (error) {
            console.error('Failed to pin/unpin message:', error);
            this.chatSection.showNotification('Failed to pin/unpin message: ' + (error.message || 'Unknown error'), 'error');
        }
    }
    
    startThread(messageId) {
        this.chatSection.showNotification('Feature coming soon: Thread messages');
    }

    hideContextMenu() {
        if (!this.chatSection.contextMenu) return;
        
        this.chatSection.contextMenu.classList.add('hidden');
        this.contextMenuVisible = false;
        
        // Reset all positioning styles to default
        this.chatSection.contextMenu.style.position = '';
        this.chatSection.contextMenu.style.top = '';
        this.chatSection.contextMenu.style.left = '';
        this.chatSection.contextMenu.style.transform = '';
        this.chatSection.contextMenu.style.zIndex = '';
        this.chatSection.contextMenu.style.minWidth = '';
        this.chatSection.contextMenu.style.display = '';
        this.chatSection.contextMenu.style.visibility = '';
        this.chatSection.contextMenu.style.opacity = '';
        
        // Clear message ID
        this.chatSection.contextMenu.dataset.messageId = '';
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
        const isOwnMessage = messageContent.dataset.userId === this.chatSection.userId;
        
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
    
    replyToMessage(messageId) {
        console.log('📝 [CHAT-UI-HANDLER] Reply requested, delegating to ChatSection:', messageId);
        
        // Delegate to the ChatSection's startReply method for consistency
        if (this.chatSection && typeof this.chatSection.startReply === 'function') {
            this.chatSection.startReply(messageId);
        } else {
            console.error('❌ [CHAT-UI-HANDLER] ChatSection startReply method not available');
        }
    }
    

    
    cancelReply() {
        console.log('❌ [CHAT-UI-HANDLER] Cancel reply requested, delegating to ChatSection');
        
        // Delegate to the ChatSection's cancelReply method for consistency
        if (this.chatSection && typeof this.chatSection.cancelReply === 'function') {
            this.chatSection.cancelReply();
        } else {
            // Fallback implementation
            this.chatSection.replyingTo = null;
            const replyContainer = document.getElementById('reply-container');
            const replyPreview = document.getElementById('reply-preview');
            
            if (replyContainer) {
                replyContainer.remove();
            }
            if (replyPreview) {
                replyPreview.remove();
            }
        }
    }
}

export default ChatUIHandler;
