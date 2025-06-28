import { showToast } from '../../core/ui/toast.js';
import MessageHandler from './message-handler.js';
import SocketHandler from './socket-handler.js';
import ChatUIHandler from './chat-ui-handler.js';
import FileUploadHandler from './file-upload-handler.js';
import SendReceiveHandler from './send-receive-handler.js';

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
    constructor(options = {}) {
        // Core properties
        this.chatType = options.chatType || 'channel';
        this.targetId = options.targetId || null;
        this.userId = options.userId || null;
        this.username = options.username || null;
        this.isInitialized = false;
        this.isLoading = false;
        this.hasMoreMessages = true;
        this.lastLoadedMessageId = null;
        this.replyingTo = null;
        this.currentEditingMessage = null;
        
        // Initialize handlers
        this.messageHandler = new MessageHandler(this);
        this.socketHandler = new SocketHandler(this);
        this.uiHandler = new ChatUIHandler(this);
        this.fileUploadHandler = new FileUploadHandler(this);
        this.sendReceiveHandler = new SendReceiveHandler(this);
        
        // DOM elements
        this.chatContainer = document.querySelector('.flex-1.flex.flex-col.bg-\\[\\#313338\\].h-screen.overflow-hidden') || document.getElementById('chat-container');
        this.chatMessages = document.getElementById('chat-messages');
        this.messageForm = document.getElementById('message-form');
        this.messageInput = document.getElementById('message-input');
        
        // Find send button or create one if it doesn't exist
        this.sendButton = document.getElementById('send-button');
        if (!this.sendButton && this.messageForm) {
            console.log('Creating send button as it does not exist');
            this.sendButton = document.createElement('button');
            this.sendButton.id = 'send-button';
            this.sendButton.type = 'submit';
            this.sendButton.className = 'hover:text-[#dcddde] text-[#b9bbbe] w-[32px] h-[32px] flex items-center justify-center rounded hover:bg-[#404249] transition-all mr-1';
            this.sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
            
            // Find the last div in the form to append the button
            const lastDiv = this.messageForm.querySelector('.flex.items-center.pr-\\[2px\\].gap-1:last-child');
            if (lastDiv) {
                lastDiv.appendChild(this.sendButton);
         } else {
                // If we can't find the expected div, append to the form
                this.messageForm.appendChild(this.sendButton);
            }
        }
        
        this.loadMoreButton = document.getElementById('load-more-messages');
        this.emptyStateContainer = document.getElementById('empty-state-container');
        this.loadingIndicator = document.getElementById('loading-indicator');
        this.contextMenu = document.getElementById('message-context-menu') || document.getElementById('context-menu');
        this.fileUploadInput = document.getElementById('file-upload');
        this.filePreviewModal = document.getElementById('file-preview-modal');
        this.emojiPickerContainer = document.getElementById('emoji-picker-container');
        
        // Initialize
        this.init();
    }
    
    init() {
        console.log('🚀 [CHAT-SECTION] Initializing with:', {
            chatType: this.chatType,
            targetId: this.targetId,
            userId: this.userId,
            username: this.username
        });
        
        // Load chat parameters from meta tags if not provided
        if (!this.chatType || this.chatType === '') {
            const chatTypeMeta = document.querySelector('meta[name="chat-type"]');
            if (chatTypeMeta) {
                this.chatType = chatTypeMeta.getAttribute('content');
            }
        }
        
        if (!this.targetId || this.targetId === '') {
            const chatIdMeta = document.querySelector('meta[name="chat-id"]');
            if (chatIdMeta) {
                this.targetId = chatIdMeta.getAttribute('content');
            }
        }
        
        if (!this.userId || this.userId === '') {
            const userIdMeta = document.querySelector('meta[name="user-id"]');
            if (userIdMeta) {
                this.userId = userIdMeta.getAttribute('content');
            }
        }
        
        if (!this.username || this.username === '') {
            const usernameMeta = document.querySelector('meta[name="username"]');
            if (usernameMeta) {
                this.username = usernameMeta.getAttribute('content');
            }
        }
        
        console.log('📝 [CHAT-SECTION] Parameters after meta tags:', {
            chatType: this.chatType,
            targetId: this.targetId,
            userId: this.userId,
            username: this.username
        });
        
        if (!this.chatMessages) {
            console.error('❌ [CHAT-SECTION] Required DOM element chat-messages not found');
                    return;
        }
        
        if (!this.targetId) {
            console.warn('⚠️ [CHAT-SECTION] No target ID found, chat functionality will be limited');
        }
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup socket listeners
        if (this.socketHandler) {
            this.socketHandler.setupIoListeners();
                } else {
            console.warn('⚠️ [CHAT-SECTION] Socket handler not initialized');
        }
        
        // Load initial messages if we have a target ID
        if (this.targetId) {
            this.loadMessages();
        }
        
        // Set initialized flag
        this.isInitialized = true;
        
        // Make this instance available globally
        window.chatSection = this;
        
        console.log('✅ [CHAT-SECTION] Initialization complete');
        
        // Join the appropriate socket room immediately
        if (window.globalSocketManager?.isReady()) {
            this.joinSocketRoom();
                } else {
            window.addEventListener('globalSocketReady', () => this.joinSocketRoom());
        }
    }
    
    joinSocketRoom() {
        if (!this.targetId) {
            console.warn('⚠️ [CHAT-SECTION] Cannot join room: No target ID specified');
            return;
        }

        if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
            console.warn('⚠️ [CHAT-SECTION] Cannot join room: Socket not ready');
            setTimeout(() => this.joinSocketRoom(), 1000);
            return;
        }

        console.log(`🔌 [CHAT-SECTION] Joining socket room for ${this.chatType} with ID ${this.targetId}`);
        
        // Make sure we have a consistent chat type
        const chatType = this.chatType === 'direct' ? 'dm' : this.chatType;
        
        // Join the room using the global socket manager
        window.globalSocketManager.joinRoom(chatType, this.targetId);
        
        // Also emit a direct join-room event for more reliable room registration
        if (window.globalSocketManager.io) {
            // Try multiple times to ensure the join request is received
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    console.log(`📡 [CHAT-SECTION] Emitting join-room event (attempt ${i+1}) for ${chatType}-${this.targetId}`);
                    window.globalSocketManager.io.emit('join-room', {
                        room_type: chatType,
                        room_id: this.targetId
                    });
                }, i * 1000); // Stagger attempts by 1 second
            }
        }
        
        // Setup socket listeners if not already done
        if (this.socketHandler) {
            this.socketHandler.setupIoListeners();
        }
        
        // Set up a periodic check to ensure we're still in the room
        if (!this._roomCheckInterval) {
            this._roomCheckInterval = setInterval(() => {
                if (window.globalSocketManager && window.globalSocketManager.isReady()) {
                    console.log(`🔍 [CHAT-SECTION] Periodic room check for ${chatType}-${this.targetId}`);
                    window.globalSocketManager.io.emit('join-room', {
                        room_type: chatType,
                        room_id: this.targetId
                    });
                }
            }, 30000); // Check every 30 seconds
        }
    }
    
    setupEventListeners() {
        // Message form submission
        if (this.messageForm) {
            this.messageForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (this.sendReceiveHandler) {
                    this.sendReceiveHandler.sendMessage();
                } else {
                    console.warn('⚠️ [CHAT-SECTION] Send/Receive handler not initialized');
                }
            });
            } else {
            console.warn('⚠️ [CHAT-SECTION] Message form not found');
        }
        
        // Message input events
        if (this.messageInput) {
            this.messageInput.addEventListener('input', () => {
                this.updateSendButton();
                this.handleTypingEvent();
            });
            
            this.messageInput.addEventListener('keydown', (e) => {
                // Handle keyboard shortcuts
            if (e.key === 'Escape') {
                    if (this.replyingTo) {
                        this.cancelReply();
                e.preventDefault();
                    } else if (this.currentEditingMessage) {
                        this.cancelEditing();
                e.preventDefault();
                    }
                }
                
                // Send on Enter (without Shift)
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (this.sendReceiveHandler) {
                        this.sendReceiveHandler.sendMessage();
                    }
                }
            });
                } else {
            console.warn('⚠️ [CHAT-SECTION] Message input not found');
        }
        
        // Load more button
        if (this.loadMoreButton) {
            this.loadMoreButton.addEventListener('click', () => {
                this.loadMoreMessages();
            });
        }
        
        // File upload
        if (this.fileUploadInput) {
            this.fileUploadInput.addEventListener('change', () => {
                if (this.fileUploadHandler) {
                    this.fileUploadHandler.handleFileSelection();
                }
            });
        }
        
        // Close context menu on outside click
        document.addEventListener('click', () => {
            if (this.uiHandler) {
                this.uiHandler.hideContextMenu();
            }
        });
        
        // Setup file preview event listeners
        if (this.fileUploadHandler) {
            this.fileUploadHandler.setupFilePreviewEventListeners();
        }
        
        console.log('✅ [CHAT-SECTION] Event listeners setup complete');
    }
    
    async loadMessages(options = {}) {
        if (this.isLoading) return;
        
        if (!this.targetId) {
            console.warn('⚠️ [CHAT-SECTION] Cannot load messages: No target ID');
            this.showEmptyState('No channel or chat selected');
            return;
        }
        
        const limit = options.limit || 50;
        const before = options.before || null;
        
        this.isLoading = true;
        this.showLoadingIndicator();
        
        try {
            if (!window.ChatAPI) {
                throw new Error('ChatAPI not initialized');
            }
            
            const response = await window.ChatAPI.getMessages(this.chatType, this.targetId, limit, options.offset || 0);
            
            if (response.success) {
                const messages = response.data?.data?.messages || [];
                
                if (messages.length === 0) {
                    this.hasMoreMessages = false;
                    if (!before) {
                        this.showEmptyState();
            }
        } else {
                    this.hideEmptyState();
                    
                    // Update last loaded message ID for pagination
                    this.lastLoadedMessageId = messages[0].id;
                    
                    // Render messages
                    messages.forEach(message => {
                        this.messageHandler.addMessage(message);
                    });
                    
                    if (!before) {
                        this.scrollToBottom();
                    }
                }
                
                this.updateLoadMoreButton();
        } else {
                console.error('❌ [CHAT-SECTION] Failed to load messages:', response.message);
                this.showEmptyState('Failed to load messages. Please try again.');
            }
        } catch (error) {
            console.error('❌ [CHAT-SECTION] Error loading messages:', error);
            this.showEmptyState('Failed to load messages. Please try again.');
        } finally {
            this.isLoading = false;
            this.hideLoadingIndicator();
        }
    }
    
    loadMoreMessages() {
        if (!this.hasMoreMessages || this.isLoading) return;
        
        this.loadMessages({
            before: this.lastLoadedMessageId,
            limit: 30
        });
    }
    
    updateLoadMoreButton() {
        if (!this.loadMoreButton) {
            this.loadMoreButton = document.createElement('div');
            this.loadMoreButton.id = 'load-more-messages';
            this.loadMoreButton.className = 'load-more-messages text-center p-2 text-[#949ba4] hover:text-[#dcddde] cursor-pointer hidden';
            this.loadMoreButton.innerHTML = 'Load more messages';
            
            if (this.chatMessages && this.chatMessages.firstChild) {
                this.chatMessages.insertBefore(this.loadMoreButton, this.chatMessages.firstChild);
            } else if (this.chatMessages) {
                this.chatMessages.appendChild(this.loadMoreButton);
            }
            
            this.loadMoreButton.addEventListener('click', () => {
                this.loadMoreMessages();
            });
        }
        
        if (this.hasMoreMessages) {
            this.loadMoreButton.classList.remove('hidden');
        } else {
            this.loadMoreButton.classList.add('hidden');
        }
    }
    
    showLoadingIndicator() {
        if (!this.loadingIndicator) {
            this.loadingIndicator = document.createElement('div');
            this.loadingIndicator.id = 'loading-indicator';
            this.loadingIndicator.className = 'flex justify-center items-center p-4 text-[#dcddde]';
            this.loadingIndicator.innerHTML = `
                <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#5865f2]"></div>
            `;
            this.chatMessages.appendChild(this.loadingIndicator);
        } else {
            this.loadingIndicator.classList.remove('hidden');
        }
    }
    
    hideLoadingIndicator() {
        if (this.loadingIndicator) {
            this.loadingIndicator.classList.add('hidden');
        }
    }
    
    showEmptyState(message = null) {
        // Create empty state if it doesn't exist
        if (!this.emptyStateContainer) {
            this.emptyStateContainer = document.createElement('div');
            this.emptyStateContainer.id = 'empty-state-container';
            this.emptyStateContainer.className = 'flex flex-col items-center justify-center h-full text-[#dcddde] p-4';
            this.chatMessages.appendChild(this.emptyStateContainer);
        }
        
        const defaultMessage = 'No messages yet. Be the first to send a message!';
        const displayMessage = message || defaultMessage;
        
        this.emptyStateContainer.innerHTML = `
            <i class="fas fa-comments text-6xl mb-4 text-[#4f545c]"></i>
            <p class="text-lg">${displayMessage}</p>
        `;
        
        this.emptyStateContainer.classList.remove('hidden');
    }
    
    hideEmptyState() {
        if (this.emptyStateContainer) {
            this.emptyStateContainer.classList.add('hidden');
        }
    }
    
    updateSendButton() {
        if (!this.messageInput || !this.sendButton) return;
        
        const hasContent = this.messageInput.value.trim().length > 0 || 
                          (this.fileUploadHandler && this.fileUploadHandler.hasFiles());
        
        this.sendButton.disabled = !hasContent;
        this.sendButton.classList.toggle('opacity-50', !hasContent);
        this.sendButton.classList.toggle('cursor-not-allowed', !hasContent);
    }
    
    handleTypingEvent() {
        if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
            return;
        }
        
        // Throttle typing events
        if (!this._lastTypingEvent || Date.now() - this._lastTypingEvent > 3000) {
            this._lastTypingEvent = Date.now();
            
            if (this.chatType === 'channel') {
                window.globalSocketManager.emitToRoom('typing', {
                    channel_id: this.targetId,
                    user_id: this.userId,
                    username: this.username
                }, 'channel', this.targetId);
                        } else {
                window.globalSocketManager.emitToRoom('typing', {
                    room_id: this.targetId,
                user_id: this.userId,
                    username: this.username
                }, 'dm', this.targetId);
            }
        }
    }
    
    startReply(messageId) {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (!messageElement) return;
        
        const messageGroup = messageElement.closest('.message-group');
        if (!messageGroup) return;
        
        const username = messageGroup.querySelector('.font-medium').textContent;
        const content = messageElement.querySelector('.message-main-text').textContent;
        
        this.replyingTo = {
            messageId,
            username,
            content
        };
        
        this.showReplyUI();
        
        // Focus the input
        if (this.messageInput) {
            this.messageInput.focus();
        }
    }
    
    showReplyUI() {
        if (!this.replyingTo) return;
        
        // Create or update reply preview
        let replyPreview = document.getElementById('reply-preview');
        if (!replyPreview) {
            replyPreview = document.createElement('div');
            replyPreview.id = 'reply-preview';
            replyPreview.className = 'reply-preview bg-[#2b2d31] p-2 mb-2 rounded flex items-start';
            
            const replyContent = document.createElement('div');
            replyContent.className = 'flex-grow';
            
            const replyHeader = document.createElement('div');
            replyHeader.className = 'flex items-center text-xs text-[#b9bbbe] mb-1';
            replyHeader.innerHTML = '<i class="fas fa-reply mr-1"></i><span>Replying to </span>';
            
            const replyUsername = document.createElement('span');
            replyUsername.className = 'font-medium text-[#00a8fc] ml-1';
            replyUsername.textContent = this.replyingTo.username;
            
            replyHeader.appendChild(replyUsername);
            
            const replyText = document.createElement('div');
            replyText.className = 'text-sm text-[#dcddde] truncate';
            replyText.textContent = this.replyingTo.content;
            
            const closeButton = document.createElement('button');
            closeButton.className = 'ml-2 text-[#b9bbbe] hover:text-[#dcddde] p-1';
            closeButton.innerHTML = '<i class="fas fa-times"></i>';
            closeButton.addEventListener('click', () => this.cancelReply());
            
            replyContent.appendChild(replyHeader);
            replyContent.appendChild(replyText);
            
            replyPreview.appendChild(replyContent);
            replyPreview.appendChild(closeButton);
            
            // Insert before the message form
            if (this.messageForm) {
                this.messageForm.parentNode.insertBefore(replyPreview, this.messageForm);
            }
                } else {
            // Update existing reply preview
            const replyUsername = replyPreview.querySelector('.text-[#00a8fc]');
            const replyText = replyPreview.querySelector('.text-[#dcddde]');
            
            if (replyUsername) replyUsername.textContent = this.replyingTo.username;
            if (replyText) replyText.textContent = this.replyingTo.content;
            
            replyPreview.classList.remove('hidden');
        }
    }
    
    cancelReply() {
        this.replyingTo = null;
        
        const replyPreview = document.getElementById('reply-preview');
        if (replyPreview) {
            replyPreview.classList.add('hidden');
        }
    }
    
    startEditing(messageId) {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (!messageElement) return;
        
        const messageTextElement = messageElement.querySelector('.message-main-text');
        if (!messageTextElement) return;
        
        // Store the original content
        const originalContent = messageTextElement.textContent;
        
        // Create edit input
        const editInput = document.createElement('textarea');
        editInput.className = 'w-full bg-[#40444b] text-[#dcddde] rounded p-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#5865f2]';
        editInput.value = originalContent;
        editInput.rows = Math.min(5, originalContent.split('\n').length);
        
        // Create edit controls
        const editControls = document.createElement('div');
        editControls.className = 'flex justify-end mt-2 space-x-2 text-xs';
        
        const escapeHint = document.createElement('span');
        escapeHint.className = 'text-[#b9bbbe] mr-auto';
        escapeHint.textContent = 'ESC to cancel';
        
        const cancelButton = document.createElement('button');
        cancelButton.className = 'px-2 py-1 bg-[#36393f] text-[#dcddde] hover:bg-[#32353b] rounded';
        cancelButton.textContent = 'Cancel';
        cancelButton.addEventListener('click', () => this.cancelEditing());
        
        const saveButton = document.createElement('button');
        saveButton.className = 'px-2 py-1 bg-[#5865f2] text-white hover:bg-[#4752c4] rounded';
        saveButton.textContent = 'Save';
        saveButton.addEventListener('click', () => this.saveEdit(messageId, editInput.value));
        
        editControls.appendChild(escapeHint);
        editControls.appendChild(cancelButton);
        editControls.appendChild(saveButton);
        
        // Replace message text with edit input
        messageTextElement.innerHTML = '';
        messageTextElement.appendChild(editInput);
        messageTextElement.appendChild(editControls);
        
        // Store editing state
        this.currentEditingMessage = {
            messageId,
            originalContent,
            element: messageTextElement
        };
        
        // Focus the input and place cursor at the end
        editInput.focus();
        editInput.setSelectionRange(editInput.value.length, editInput.value.length);
        
        // Add keyboard event listeners
        editInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.cancelEditing();
                e.preventDefault();
            } else if (e.key === 'Enter' && !e.shiftKey) {
                this.saveEdit(messageId, editInput.value);
                e.preventDefault();
            }
        });
    }
    
    cancelEditing() {
        if (!this.currentEditingMessage) return;
        
        const { messageId, originalContent, element } = this.currentEditingMessage;
        
        // Restore original content
        element.innerHTML = this.formatMessageContent(originalContent);
        
        // Clear editing state
        this.currentEditingMessage = null;
    }
    
    async saveEdit(messageId, newContent) {
        if (!messageId || !newContent.trim()) return;
        
        try {
            if (!window.ChatAPI) {
                throw new Error('ChatAPI not initialized');
            }
            
            const response = await window.ChatAPI.updateMessage(messageId, newContent);
            
            if (response.success) {
                console.log(`✅ [CHAT-SECTION] Message ${messageId} updated successfully`);
                
                // Update UI immediately
                this.cancelEditing();
                
                const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
                if (messageElement) {
                    const messageTextElement = messageElement.querySelector('.message-main-text');
                    if (messageTextElement) {
                        messageTextElement.innerHTML = this.formatMessageContent(newContent);
                        
                        // Add edited badge if not already present
                        let editedBadge = messageElement.querySelector('.edited-badge');
                        if (!editedBadge) {
                            editedBadge = document.createElement('span');
            editedBadge.className = 'edited-badge text-xs text-[#a3a6aa] ml-1';
            editedBadge.textContent = '(edited)';
                            messageTextElement.appendChild(editedBadge);
                        }
                    }
                }
            } else {
                console.error('❌ [CHAT-SECTION] Failed to update message:', response.message);
                this.showNotification('Failed to update message. Please try again.', 'error');
            }
        } catch (error) {
            console.error('❌ [CHAT-SECTION] Error updating message:', error);
            this.showNotification('Failed to update message. Please try again.', 'error');
        }
    }
    
    confirmDeleteMessage(messageId) {
        if (!messageId) return;
        
        if (confirm('Are you sure you want to delete this message? This cannot be undone.')) {
            this.deleteMessage(messageId);
        }
    }
    
    async deleteMessage(messageId) {
        if (!messageId) return;
        
        try {
            if (!window.ChatAPI) {
                throw new Error('ChatAPI not initialized');
            }
            
            const response = await window.ChatAPI.deleteMessage(messageId);
            
            if (response.success) {
                console.log(`✅ [CHAT-SECTION] Message ${messageId} deleted successfully`);
                
                // Update UI immediately
            const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
            if (messageElement) {
                const messageGroup = messageElement.closest('.message-group');
                
                if (messageGroup && messageGroup.querySelectorAll('.message-content').length === 1) {
                    messageGroup.remove();
                } else {
                    messageElement.remove();
                }
                
                    // Remove from processed messages
                    this.messageHandler.processedMessageIds.delete(messageId);
                
                    // Show empty state if no messages left
                const remainingMessages = this.getMessagesContainer().querySelectorAll('.message-group');
                if (remainingMessages.length === 0) {
                    this.showEmptyState();
                }
            }
            } else {
                console.error('❌ [CHAT-SECTION] Failed to delete message:', response.message);
                this.showNotification('Failed to delete message. Please try again.', 'error');
            }
        } catch (error) {
            console.error('❌ [CHAT-SECTION] Error deleting message:', error);
            this.showNotification('Failed to delete message. Please try again.', 'error');
        }
    }
    
    openEmojiPicker(targetElement, messageId, mode = 'message') {
        if (!this.emojiPickerContainer) return;
        
        // Position the emoji picker
        const rect = targetElement.getBoundingClientRect();
        this.emojiPickerContainer.style.top = `${rect.bottom + 5}px`;
        this.emojiPickerContainer.style.left = `${rect.left}px`;
        
        // Show the emoji picker
        this.emojiPickerContainer.classList.remove('hidden');
        
        // Set data attributes for the emoji picker
        this.emojiPickerContainer.dataset.mode = mode;
        this.emojiPickerContainer.dataset.messageId = messageId || '';
        
        // Add click outside listener
        const clickOutsideHandler = (e) => {
            if (!this.emojiPickerContainer.contains(e.target) && e.target !== targetElement) {
                this.closeEmojiPicker();
                document.removeEventListener('click', clickOutsideHandler);
            }
        };
        
        // Delay adding the event listener to prevent immediate closing
        setTimeout(() => {
            document.addEventListener('click', clickOutsideHandler);
        }, 100);
    }
    
    closeEmojiPicker() {
        if (this.emojiPickerContainer) {
            this.emojiPickerContainer.classList.add('hidden');
        }
    }
    
    async addReaction(messageId, emoji) {
        if (!messageId || !emoji) return;
        
        try {
            if (!window.ChatAPI) {
                throw new Error('ChatAPI not initialized');
            }
            
            const response = await window.ChatAPI.addReaction(messageId, emoji);
            
            if (!response.success) {
                console.error('❌ [CHAT-SECTION] Failed to add reaction:', response.message);
            }
        } catch (error) {
            console.error('❌ [CHAT-SECTION] Error adding reaction:', error);
        }
    }
    
    async removeReaction(messageId, emoji) {
        if (!messageId || !emoji) return;
        
        try {
            if (!window.ChatAPI) {
                throw new Error('ChatAPI not initialized');
            }
            
            const response = await window.ChatAPI.removeReaction(messageId, emoji);
            
            if (!response.success) {
                console.error('❌ [CHAT-SECTION] Failed to remove reaction:', response.message);
            }
        } catch (error) {
            console.error('❌ [CHAT-SECTION] Error removing reaction:', error);
        }
    }
    
    scrollToBottom() {
        if (this.chatMessages) {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }
    }
    
    scrollToBottomIfNeeded() {
        if (!this.chatMessages) return;
        
        const { scrollTop, scrollHeight, clientHeight } = this.chatMessages;
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - 200;
        
        if (isNearBottom) {
            this.scrollToBottom();
        }
    }
    
    scrollToMessage(messageId) {
        if (!messageId) return;
        
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            messageElement.classList.add('highlight-message');
            setTimeout(() => {
                messageElement.classList.remove('highlight-message');
            }, 2000);
        }
    }
    
    playMessageSound() {
        try {
            // Check if we should play sounds (respect user settings)
            const soundsEnabled = localStorage.getItem('message_sounds_enabled') !== 'false';
            
            if (!soundsEnabled) {
                console.log('🔇 [CHAT-SECTION] Message sounds are disabled');
                return;
            }
            
            // Create and play the sound
            const audio = new Audio('/assets/sound/message_sound.mp3');
            audio.volume = 0.5; // Set to 50% volume
            audio.play().catch(error => {
                // This often fails due to browser autoplay restrictions
                console.log('🔇 [CHAT-SECTION] Could not play message sound:', error.message);
            });
        } catch (error) {
            console.error('❌ [CHAT-SECTION] Error playing message sound:', error);
        }
    }
    
    getMessagesContainer() {
        return this.chatMessages;
    }
    
    formatMessageContent(content) {
        if (!content) return '';
        
        // Convert URLs to links
        content = content.replace(
            /(https?:\/\/[^\s]+)/g,
            '<a href="$1" target="_blank" class="text-[#00a8fc] hover:underline">$1</a>'
        );
        
        // Convert line breaks to <br>
        content = content.replace(/\n/g, '<br>');
        
        return content;
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification fixed bottom-4 right-4 p-3 rounded shadow-lg z-50 ${
            type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500'
        } text-white`;
        notification.textContent = message;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('opacity-0');
                setTimeout(() => {
                notification.remove();
            }, 300);
                }, 3000);
    }
    
    debugSocketStatus() {
        const status = {
            chatType: this.chatType,
            targetId: this.targetId,
            socketManager: {
                exists: !!window.globalSocketManager,
                isReady: window.globalSocketManager?.isReady(),
                connected: window.globalSocketManager?.connected,
                authenticated: window.globalSocketManager?.authenticated,
                socketId: window.globalSocketManager?.io?.id,
                userId: window.globalSocketManager?.userId,
                username: window.globalSocketManager?.username,
                joinedRooms: Array.from(window.globalSocketManager?.joinedRooms || []),
                joinedChannels: Array.from(window.globalSocketManager?.joinedChannels || [])
            }
        };
        
        console.log('🔍 [CHAT-SECTION] Socket Status:', status);
        return status;
    }
}

export default ChatSection;