import { showToast } from '../../core/ui/toast.js';
import MessageHandler from './message-handler.js';
import SocketHandler from './socket-handler.js';
import ChatUIHandler from './chat-ui-handler.js';
import FileUploadHandler from './file-upload-handler.js';
import SendReceiveHandler from './send-receive-handler.js';
import ChatBot from './chat-bot.js';
import MentionHandler from './mention-handler.js';

document.addEventListener('DOMContentLoaded', function() {
    if (isExcludedPage()) {
        console.log('📄 [CHAT-SECTION] Page excluded from chat initialization:', {
            path: window.location.pathname,
            search: window.location.search,
            isChatPage: isChatPage()
        });
        return;
    }
    
    console.log('✅ [CHAT-SECTION] Page allowed for chat initialization:', window.location.pathname);
    if (!window.chatSection && !isExcludedPage()) {
        initializeChatSection();
    }
});

function isExcludedPage() {
    return !isChatPage();
}

function isChatPage() {
    const currentPath = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    
    // Check if it's a home page with direct messages
    if (currentPath === '/home' || currentPath.startsWith('/home/')) {
        // Only allow on DM pages or main home page
        if (currentPath.includes('/channels/dm/') || currentPath === '/home') {
            return true;
        }
        return false;
    }
    
    // Check if it's a server page with a text channel
    const serverMatch = currentPath.match(/^\/server\/(\d+)$/);
    if (serverMatch) {
        // Must have a channel parameter
        const channelId = urlParams.get('channel');
        if (!channelId) {
            return false;
        }
        
        // Check if it's NOT a voice channel
        const channelType = urlParams.get('type');
        if (channelType === 'voice') {
            return false;
        }
        
        // Check DOM for channel type if available
        const activeChannelElement = document.querySelector(`[data-channel-id="${channelId}"]`);
        if (activeChannelElement) {
            const channelDataType = activeChannelElement.getAttribute('data-channel-type');
            if (channelDataType === 'voice') {
                return false;
            }
        }
        
        // If no voice indicators found, assume it's a text channel
        return true;
    }
    
    // All other pages don't need chat
    return false;
}

async function initializeChatSection() {
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
    try {
        const chatSection = new ChatSection();
        await chatSection.init();
        window.chatSection = chatSection;
        
        if (typeof window.emojiReactions === 'undefined' || !window.emojiReactions.initialized) {
            console.log('Ensuring emoji reactions system is initialized from ChatSection');
            if (typeof window.initializeEmojiReactions === 'function') {
                window.initializeEmojiReactions();
            }
        }
    } catch (error) {
        if (!isExcludedPage()) {
            console.error('❌ Failed to initialize ChatSection:', error);
        }
        if (window.showToast) {
            if (!isExcludedPage()) {
                window.showToast('Failed to initialize chat. Please refresh the page.', 'error');
            }
        }
    }
}

if (document.readyState === 'complete' && !window.chatSection && !isExcludedPage()) {
    console.log('💬 [CHAT-SECTION] Immediate execution - page ready for chat');
    setTimeout(() => {
        if (!isExcludedPage()) {
            console.log('💬 [CHAT-SECTION] Delayed initialization starting');
            initializeChatSection();
        }
    }, 100);
} else if (isExcludedPage()) {
    console.log('📄 [CHAT-SECTION] Immediate execution - page excluded from chat');
}

class ChatSection {
    constructor(options = {}) {
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
        
        this.chatContainer = null;
        this.chatMessages = null;
        this.messageForm = null;
        this.messageInput = null;
        this.sendButton = null;
        this.loadMoreButton = null;
        this.emptyStateContainer = null;
        this.loadingIndicator = null;
        this.contextMenu = null;
        this.fileUploadInput = null;
        this.filePreviewModal = null;
        
        this.messageHandler = new MessageHandler(this);
        this.socketHandler = new SocketHandler(this);
        this.uiHandler = new ChatUIHandler(this);
        this.fileUploadHandler = new FileUploadHandler(this);
        this.sendReceiveHandler = new SendReceiveHandler(this);
        this.chatBot = new ChatBot(this);
        this.mentionHandler = null;
        
        this.init();
    }
    
    findDOMElements() {
        this.chatContainer = document.querySelector('.flex-1.flex.flex-col.bg-\\[\\#313338\\].h-screen.overflow-hidden') || document.getElementById('chat-container');
        this.chatMessages = document.getElementById('chat-messages');
        this.messageForm = document.getElementById('message-form');
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.loadMoreButton = document.getElementById('load-more-messages');
        this.emptyStateContainer = document.getElementById('empty-state-container');
        this.loadingIndicator = document.getElementById('loading-indicator');
        this.contextMenu = document.getElementById('message-context-menu') || document.getElementById('context-menu');
        this.fileUploadInput = document.getElementById('file-upload');
        this.filePreviewModal = document.getElementById('file-preview-modal');
        
        console.log('🔍 [CHAT-SECTION] DOM elements found:', {
            chatMessages: !!this.chatMessages,
            messageForm: !!this.messageForm,
            messageInput: !!this.messageInput,
            sendButton: !!this.sendButton
        });
    }
    
    waitForRequiredElements() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = isExcludedPage() ? 5 : 20;
            
            const checkElements = () => {
                this.findDOMElements();
                
                if (this.chatMessages && this.messageForm && this.messageInput) {
                    console.log('✅ [CHAT-SECTION] Required DOM elements found');
                    resolve();
                    return;
                }
                
                attempts++;
                if (attempts >= maxAttempts) {
                    if (!isExcludedPage()) {
                        console.error('❌ [CHAT-SECTION] Required DOM elements not found after', maxAttempts, 'attempts');
                        console.error('❌ [CHAT-SECTION] Missing elements:', {
                            chatMessages: !this.chatMessages,
                            messageForm: !this.messageForm,
                            messageInput: !this.messageInput
                        });
                    }
                    reject(new Error('Required DOM elements not found'));
                    return;
                }
                
                if (!isExcludedPage() && attempts % 5 === 0) {
                    console.log(`⏳ [CHAT-SECTION] Waiting for DOM elements (attempt ${attempts}/${maxAttempts})`);
                }
                setTimeout(checkElements, 100);
            };
            
            checkElements();
        });
    }
    
    async init() {
        console.log('🚀 [CHAT-SECTION] Initializing ChatSection...');
        
        if (this.messageHandler) {
            this.messageHandler.clearProcessedMessages();
        }
        
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
        
        const currentUrl = window.location.pathname;
        const isDMUrl = currentUrl.includes('/home/channels/dm/');
        const isChannelUrl = currentUrl.includes('/server/') && currentUrl.includes('channel=');
        
        if (isDMUrl && this.chatType !== 'direct' && this.chatType !== 'dm') {
            this.chatType = 'direct';
        } else if (isChannelUrl && this.chatType !== 'channel') {
            this.chatType = 'channel';
        }
        
        console.log('📝 [CHAT-SECTION] Configuration loaded:', {
            chatType: this.chatType,
            targetId: this.targetId,
            userId: this.userId,
            username: this.username
        });
        
        try {
            await this.waitForRequiredElements();
            
            this.mentionHandler = new MentionHandler(this);
            
            this.setupEventListeners();
            
            if (this.socketHandler) {
                this.socketHandler.setupIoListeners();
            }
            
            if (this.targetId) {
                setTimeout(() => {
                    this.loadMessages();
                }, 100);
            }
            
            this.initializeExistingMessages();
            
            this.isInitialized = true;
            
            window.chatSection = this;
            
            if (window.globalSocketManager?.isReady()) {
                this.joinSocketRoom();
            } else {
                window.addEventListener('globalSocketReady', () => this.joinSocketRoom());
            }
            
            if (this.targetId && this.mentionHandler) {
                setTimeout(() => {
                    this.mentionHandler.loadAvailableUsers();
                }, 500);
            }
            
            this.cleanupEmptyMessages();
            this.chatBot.init();
            
            console.log('✅ [CHAT-SECTION] Initialization completed successfully');
            
        } catch (error) {
            if (!isExcludedPage()) {
                console.error('❌ [CHAT-SECTION] Initialization failed:', error);
                console.error('❌ [CHAT-SECTION] ChatSection will not be functional');
            }
            
            if (window.showToast) {
                window.showToast('Chat initialization failed. Please refresh the page.', 'error');
            }
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
                if (e.key === 'Escape') {
                    if (this.replyingTo) {
                        this.cancelReply();
                        e.preventDefault();
                    } else if (this.currentEditingMessage) {
                        this.cancelEditing();
                        e.preventDefault();
                    }
                }
                
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
        
        // File upload button
        const fileUploadButton = document.getElementById('file-upload-button');
        if (fileUploadButton && this.fileUploadInput) {
            fileUploadButton.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('📎 File upload button clicked');
                this.fileUploadInput.click();
            });
        } else {
            console.warn('⚠️ [CHAT-SECTION] File upload button or input not found');
        }
        
        // Global event delegation for message actions (reply, edit, delete, etc.)
        document.addEventListener('click', (e) => {
            this.handleMessageActions(e);
        });
        
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
    
    handleMessageActions(e) {
        console.log('🔍 [CHAT-SECTION] Message action clicked:', {
            target: e.target,
            targetClasses: Array.from(e.target.classList),
            targetTagName: e.target.tagName,
            targetDataAction: e.target.dataset?.action,
            targetDataMessageId: e.target.dataset?.messageId
        });
        
        let actionButton = null;
        let messageId = null;
        let action = null;
        
        // Check for bubble action buttons
        if (e.target.classList.contains('bubble-action-button') || e.target.closest('.bubble-action-button')) {
            actionButton = e.target.classList.contains('bubble-action-button') ? e.target : e.target.closest('.bubble-action-button');
            action = actionButton.dataset.action;
            messageId = actionButton.dataset.messageId;
            
            console.log('✅ [CHAT-SECTION] Detected bubble action button:', {
                button: actionButton,
                action: action,
                messageId: messageId
            });
        }
        // Check for regular message action buttons
        else if (e.target.classList.contains('message-action-reply') || e.target.closest('.message-action-reply')) {
            actionButton = e.target.classList.contains('message-action-reply') ? e.target : e.target.closest('.message-action-reply');
            action = 'reply';
            const messageElement = actionButton.closest('.message-content') || actionButton.closest('[data-message-id]');
            messageId = messageElement?.dataset.messageId;
            
            console.log('✅ [CHAT-SECTION] Detected regular message action button:', {
                button: actionButton,
                action: action,
                messageId: messageId
            });
        }
        // Check for any element with data-action attribute
        else if (e.target.dataset?.action || e.target.closest('[data-action]')) {
            actionButton = e.target.dataset?.action ? e.target : e.target.closest('[data-action]');
            action = actionButton.dataset.action;
            messageId = actionButton.dataset.messageId;
            
            console.log('✅ [CHAT-SECTION] Detected data-action element:', {
                button: actionButton,
                action: action,
                messageId: messageId
            });
        }
        // Check for context menu actions
        else if (e.target.closest('[data-action="reply"]')) {
            actionButton = e.target.closest('[data-action="reply"]');
            action = 'reply';
            const contextMenu = actionButton.closest('#message-context-menu');
            messageId = contextMenu?.dataset.messageId;
            
            console.log('✅ [CHAT-SECTION] Detected context menu action:', {
                button: actionButton,
                action: action,
                messageId: messageId
            });
        }
        
        if (action && messageId) {
            e.stopPropagation();
            e.preventDefault();
            
            console.log('🎯 [CHAT-SECTION] Handling message action:', { action, messageId });
            
            switch (action) {
                case 'reply':
                    this.startReply(messageId);
                    break;
                case 'edit':
                    this.startEditing(messageId);
                    break;
                case 'delete':
                    this.confirmDeleteMessage(messageId);
                    break;
                default:
                    console.log('🔄 [CHAT-SECTION] Unhandled action:', action);
                    break;
            }
        } else {
            console.log('⚠️ [CHAT-SECTION] No valid action detected:', {
                action: action,
                messageId: messageId,
                targetElement: e.target
            });
        }
    }
    
    async loadMessages(options = {}) {
        if (this.isLoading) {
            console.log('⚠️ [CHAT-SECTION] Already loading messages, skipping request');
            return;
        }
        
        if (!this.targetId) {
            console.warn('⚠️ Cannot load messages: No target ID');
            this.showEmptyState('No channel or chat selected');
            return;
        }
        
        const limit = options.limit || 50;
        const before = options.before || null;
        
        this.isLoading = true;
        this.showLoadingIndicator();
        
        console.log('🔍 [CHAT-SECTION] Starting loadMessages with:', {
            targetId: this.targetId, 
            chatType: this.chatType,
            before: before,
            limit: limit,
            ChatAPIExists: !!window.ChatAPI
        });
        
        try {
            if (!window.ChatAPI) {
                console.log('⏳ [CHAT-SECTION] Waiting for ChatAPI to be available...');
                await new Promise(resolve => {
                    const checkAPI = () => {
                        if (window.ChatAPI) {
                            console.log('✅ [CHAT-SECTION] ChatAPI is now available');
                            resolve();
                        } else {
                            setTimeout(checkAPI, 100);
                        }
                    };
                    checkAPI();
                });
            }
            
            console.log('📡 [CHAT-SECTION] Making API call to getMessages...');
            const response = await window.ChatAPI.getMessages(
                this.targetId,
                this.chatType,
                { limit, before, offset: options.offset || 0 }
            );
            
            console.log('📨 [CHAT-SECTION] API Response received:', {
                responseType: typeof response,
                hasSuccess: 'success' in response,
                successValue: response?.success,
                hasData: 'data' in response,
                dataType: typeof response?.data,
                messageCount: response?.data?.messages?.length || 'unknown'
            });
            
            if (!response) {
                throw new Error('No response received from server');
            }
            
            let messages = [];
            let hasMore = false;
            
            if (response.success === true && response.data) {
                if (response.data.messages && Array.isArray(response.data.messages)) {
                    messages = response.data.messages;
                    hasMore = response.data.has_more || false;
                    console.log('✅ [CHAT-SECTION] Using response.data.messages format:', messages.length, 'messages');
                } else if (response.data.messages === null || response.data.messages === undefined) {
                    messages = [];
                    hasMore = false;
                    console.log('📭 [CHAT-SECTION] No messages found (null/undefined)');
                } else if (Array.isArray(response.data)) {
                    messages = response.data;
                    hasMore = messages.length >= limit;
                    console.log('✅ [CHAT-SECTION] Using response.data as array format:', messages.length, 'messages');
                } else {
                    console.error('❌ [CHAT-SECTION] Unexpected messages format:', {
                        messagesValue: response.data.messages,
                        messagesType: typeof response.data.messages,
                        dataKeys: Object.keys(response.data)
                    });
                    messages = [];
                    hasMore = false;
                }
            } else if (response.success === false) {
                console.error('❌ [CHAT-SECTION] API returned error:', response.message || 'Unknown error');
                throw new Error(response.message || 'API request failed');
            } else {
                console.error('❌ [CHAT-SECTION] Unexpected response format:', response);
                throw new Error('Invalid response format from server');
            }

            this.hasMoreMessages = hasMore;
            
            console.log('🎯 [CHAT-SECTION] Processing messages:', {
                messageCount: messages.length,
                hasMore: hasMore,
                append: !!before
            });

            if (messages.length > 0) {
                if (before) {
                    console.log('📜 [CHAT-SECTION] Prepending older messages');
                    await this.messageHandler.prependMessages(messages);
                } else {
                    console.log('📝 [CHAT-SECTION] Displaying fresh messages');
                    await this.messageHandler.displayMessages(messages);
                }
                
                if (!before) {
                    this.scrollToBottom();
                }
                
                this.lastLoadedMessageId = messages[messages.length - 1]?.id || null;
                this.hideEmptyState();
                console.log('✅ [CHAT-SECTION] Messages processed successfully');
            } else {
                if (!before) {
                    this.showEmptyState();
                }
                console.log('📭 [CHAT-SECTION] No messages to display');
            }

            this.updateLoadMoreButton();

        } catch (error) {
            console.error('❌ [CHAT-SECTION] Error loading messages:', error);
            this.showNotification('Failed to load messages. Please try again.', 'error');
            
            if (!before) {
                this.showEmptyState('Failed to load messages. Please try again.');
            }
        } finally {
            this.isLoading = false;
            this.hideLoadingIndicator();
            console.log('🏁 [CHAT-SECTION] loadMessages completed');
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
        if (!this.sendButton) {
            console.warn('⚠️ [CHAT-SECTION] Send button not found');
            return;
        }
        
        const hasContent = this.messageInput && this.messageInput.value.trim().length > 0;
        const hasFiles = this.fileUploadHandler && this.fileUploadHandler.hasFiles();
        const canSend = hasContent || hasFiles;
        
        this.sendButton.disabled = !canSend;
        this.sendButton.classList.toggle('opacity-50', !canSend);
        this.sendButton.classList.toggle('cursor-not-allowed', !canSend);
        
        if (canSend) {
            this.sendButton.classList.add('hover:bg-[#5865f2]', 'text-[#dcddde]');
            this.sendButton.classList.remove('text-[#b9bbbe]');
        } else {
            this.sendButton.classList.remove('hover:bg-[#5865f2]', 'text-[#dcddde]');
            this.sendButton.classList.add('text-[#b9bbbe]');
        }
    }
    
    resizeTextarea() {
        if (!this.messageInput) return;
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = this.messageInput.scrollHeight + 'px';
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
        console.log('📝 [CHAT-SECTION] Starting reply to message:', messageId);
        
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (!messageElement) {
            console.warn('⚠️ [CHAT-SECTION] Message element not found:', messageId);
            return;
        }
        
        // Handle both bubble messages and regular messages
        const isBubbleMessage = messageElement.closest('.bubble-message-group');
        let username = 'Unknown User';
        let content = 'a message';
        
        if (isBubbleMessage) {
            // Bubble message handling
            const messageGroup = messageElement.closest('.bubble-message-group');
            const usernameElement = messageGroup?.querySelector('.bubble-username');
            const contentElement = messageElement.querySelector('.bubble-message-text');
            
            username = usernameElement?.textContent?.trim() || 'Unknown User';
            content = contentElement?.textContent?.trim() || 'a message';
        } else {
            // Regular message handling
            const messageGroup = messageElement.closest('.message-group');
            const usernameElement = messageGroup?.querySelector('.font-medium, .message-username');
            const contentElement = messageElement.querySelector('.message-main-text');
            
            username = usernameElement?.textContent?.trim() || 'Unknown User';
            content = contentElement?.textContent?.trim() || 'a message';
        }
        
        console.log('📝 [CHAT-SECTION] Reply data:', { messageId, username, content: content.substring(0, 50) });
        
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
        if (!this.replyingTo) {
            console.warn('⚠️ [CHAT-SECTION] Cannot show reply UI: no replyingTo data');
            return;
        }
        
        console.log('🎨 [CHAT-SECTION] Showing reply UI for:', this.replyingTo);
        
        // Validate required data
        if (!this.replyingTo.messageId || !this.replyingTo.username) {
            console.error('❌ [CHAT-SECTION] Invalid reply data:', this.replyingTo);
            return;
        }
        
        // Store reply data locally before clearing
        const replyData = {
            messageId: this.replyingTo.messageId,
            username: this.replyingTo.username,
            content: this.replyingTo.content || 'a message'
        };
        
        // Remove any existing reply UI first (but keep replyingTo data)
        this.clearExistingReplyUI();
        
        // Create reply preview
        const replyPreview = document.createElement('div');
        replyPreview.id = 'reply-preview';
        replyPreview.className = 'bg-[#2b2d31] p-3 mb-2 rounded-lg border-l-4 border-[#5865f2] flex items-start gap-3';
        
        // Reply icon and content wrapper
        const replyContent = document.createElement('div');
        replyContent.className = 'flex-grow min-w-0';
        
        // Reply header with icon and "Replying to username"
        const replyHeader = document.createElement('div');
        replyHeader.className = 'flex items-center gap-2 text-xs text-[#b9bbbe] mb-1';
        
        const replyIcon = document.createElement('i');
        replyIcon.className = 'fas fa-reply text-[#5865f2]';
        
        const replyLabel = document.createElement('span');
        replyLabel.textContent = 'Replying to';
        
        const replyUsername = document.createElement('span');
        replyUsername.className = 'font-medium text-[#5865f2]';
        replyUsername.textContent = replyData.username;
        
        replyHeader.appendChild(replyIcon);
        replyHeader.appendChild(replyLabel);
        replyHeader.appendChild(replyUsername);
        
        // Reply message preview
        const replyText = document.createElement('div');
        replyText.className = 'text-sm text-[#dcddde] truncate';
        
        // Limit content length and clean it up
        let displayContent = replyData.content || 'a message';
        if (displayContent.length > 100) {
            displayContent = displayContent.substring(0, 100) + '...';
        }
        replyText.textContent = displayContent;
        
        // Close button
        const closeButton = document.createElement('button');
        closeButton.className = 'text-[#b9bbbe] hover:text-white transition-colors p-1 rounded hover:bg-[#4f545c]';
        closeButton.innerHTML = '<i class="fas fa-times"></i>';
        closeButton.title = 'Cancel Reply';
        closeButton.addEventListener('click', () => this.cancelReply());
        
        replyContent.appendChild(replyHeader);
        replyContent.appendChild(replyText);
        replyPreview.appendChild(replyContent);
        replyPreview.appendChild(closeButton);
        
        // Find the best insertion point - try multiple selectors
        let insertionPoint = this.messageForm || 
                           document.querySelector('#message-form') ||
                           document.querySelector('.message-form') ||
                           this.messageInput?.parentNode ||
                           document.querySelector('#message-input')?.parentNode;
        
        if (insertionPoint) {
            insertionPoint.parentNode.insertBefore(replyPreview, insertionPoint);
            console.log('✅ [CHAT-SECTION] Reply UI inserted before message form');
        } else {
            // Fallback: try to find the chat input container
            const chatInputContainer = document.querySelector('#chat-input-container') || 
                                     document.querySelector('.chat-input-container') ||
                                     document.querySelector('[class*="chat-input"]') ||
                                     document.querySelector('[class*="message-input"]')?.parentNode;
            
            if (chatInputContainer) {
                chatInputContainer.insertBefore(replyPreview, chatInputContainer.firstChild);
                console.log('✅ [CHAT-SECTION] Reply UI inserted in chat container (fallback)');
            } else {
                console.error('❌ [CHAT-SECTION] Could not find insertion point for reply UI');
                return;
            }
        }
        
        // Add slide-in animation
        replyPreview.style.animation = 'replyInputSlideIn 0.2s ease-out forwards';
    }
    
    clearExistingReplyUI() {
        console.log('🧹 [CHAT-SECTION] Clearing existing reply UI elements');
        
        // Remove reply preview
        const replyPreview = document.getElementById('reply-preview');
        if (replyPreview) {
            replyPreview.remove();
        }
        
        // Remove legacy reply containers
        const legacyReplyContainer = document.getElementById('reply-container');
        if (legacyReplyContainer) {
            legacyReplyContainer.remove();
        }
    }
    
    cancelReply() {
        console.log('❌ [CHAT-SECTION] Canceling reply');
        
        this.replyingTo = null;
        
        const replyPreview = document.getElementById('reply-preview');
        if (replyPreview) {
            replyPreview.style.animation = 'replyInputSlideOut 0.2s ease-in forwards';
            setTimeout(() => {
                if (replyPreview.parentNode) {
                    replyPreview.remove();
                }
            }, 200);
        }
        
        // Also remove any legacy reply containers
        const legacyReplyContainer = document.getElementById('reply-container');
        if (legacyReplyContainer) {
            legacyReplyContainer.remove();
        }
    }
    
    startEditing(messageId) {
        console.log('✏️ [CHAT-SECTION] Starting edit for message:', messageId);
        
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (!messageElement) {
            console.error('❌ [CHAT-SECTION] Message element not found:', messageId);
            return;
        }
        
        console.log('✅ [CHAT-SECTION] Found message element:', messageElement);
        
        // Support both bubble messages and regular messages
        let messageTextElement = messageElement.querySelector('.bubble-message-text');
        let isBubbleMessage = true;
        
        if (!messageTextElement) {
            messageTextElement = messageElement.querySelector('.message-main-text');
            isBubbleMessage = false;
        }
        
        if (!messageTextElement) {
            console.error('❌ [CHAT-SECTION] Message text element not found in:', messageElement);
            console.log('Available elements:', {
                bubbleText: messageElement.querySelector('.bubble-message-text'),
                mainText: messageElement.querySelector('.message-main-text'),
                allTextElements: messageElement.querySelectorAll('[class*="text"]'),
                innerHTML: messageElement.innerHTML.substring(0, 200)
            });
            return;
        }
        
        console.log('✅ [CHAT-SECTION] Found text element:', { 
            element: messageTextElement, 
            isBubble: isBubbleMessage,
            content: messageTextElement.textContent?.substring(0, 50)
        });
        
        // Store the original content (clean up any existing edit badges)
        const originalContent = messageTextElement.textContent.replace(/\s*\(edited\)\s*$/, '').trim();
        
        if (!originalContent) {
            console.warn('⚠️ [CHAT-SECTION] No content to edit');
            return;
        }
        
        console.log('📝 [CHAT-SECTION] Original content:', originalContent);
        
        // Create edit form container
        const editContainer = document.createElement('div');
        editContainer.className = 'edit-message-container w-full';
        
        // Create edit input
        const editInput = document.createElement('textarea');
        editInput.className = isBubbleMessage 
            ? 'w-full bg-[#2b2d31] text-[#dcddde] rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#5865f2] border border-[#40444b]'
            : 'w-full bg-[#40444b] text-[#dcddde] rounded p-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#5865f2]';
        editInput.value = originalContent;
        editInput.placeholder = 'Edit your message...';
        
        // Auto-resize textarea
        const adjustHeight = () => {
            editInput.style.height = 'auto';
            editInput.style.height = Math.min(editInput.scrollHeight, 200) + 'px';
        };
        editInput.addEventListener('input', adjustHeight);
        
        // Create edit controls
        const editControls = document.createElement('div');
        editControls.className = 'flex items-center justify-between mt-2 text-xs';
        
        const leftControls = document.createElement('div');
        leftControls.className = 'flex items-center gap-2 text-[#b9bbbe]';
        
        const escapeHint = document.createElement('span');
        escapeHint.innerHTML = '<i class="fas fa-info-circle mr-1"></i>ESC to cancel • Enter to save';
        leftControls.appendChild(escapeHint);
        
        const rightControls = document.createElement('div');
        rightControls.className = 'flex items-center gap-2';
        
        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'px-3 py-1 bg-transparent text-[#b9bbbe] hover:text-white hover:bg-[#4f545c] rounded transition-colors';
        cancelButton.innerHTML = '<i class="fas fa-times mr-1"></i>Cancel';
        cancelButton.addEventListener('click', () => this.cancelEditing());
        
        const saveButton = document.createElement('button');
        saveButton.type = 'button';
        saveButton.className = 'px-3 py-1 bg-[#5865f2] text-white hover:bg-[#4752c4] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
        saveButton.innerHTML = '<i class="fas fa-save mr-1"></i>Save';
        saveButton.addEventListener('click', () => {
            const newContent = editInput.value.trim();
            if (newContent) {
                this.saveEdit(messageId, newContent);
            }
        });
        
        // Enable/disable save button based on content
        const updateSaveButton = () => {
            const hasContent = editInput.value.trim().length > 0;
            const hasChanges = editInput.value.trim() !== originalContent;
            saveButton.disabled = !hasContent || !hasChanges;
        };
        editInput.addEventListener('input', updateSaveButton);
        updateSaveButton();
        
        rightControls.appendChild(cancelButton);
        rightControls.appendChild(saveButton);
        
        editControls.appendChild(leftControls);
        editControls.appendChild(rightControls);
        
        // Build edit form
        editContainer.appendChild(editInput);
        editContainer.appendChild(editControls);
        
        // Store original content before replacing
        const originalHTML = messageTextElement.innerHTML;
        
        // Replace message text with edit form
        messageTextElement.innerHTML = '';
        messageTextElement.appendChild(editContainer);
        
        // Store editing state
        this.currentEditingMessage = {
            messageId,
            originalContent: originalContent,
            originalHTML: originalHTML,
            element: messageTextElement,
            isBubbleMessage: isBubbleMessage
        };
        
        // Focus and setup input
        setTimeout(() => {
            editInput.focus();
            editInput.setSelectionRange(editInput.value.length, editInput.value.length);
            adjustHeight();
        }, 0);
        
        // Add keyboard event listeners
        editInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                this.cancelEditing();
            } else if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const newContent = editInput.value.trim();
                if (newContent && newContent !== originalContent) {
                    this.saveEdit(messageId, newContent);
                }
            }
        });
        
        // Add visual feedback that we're in edit mode
        messageElement.classList.add('message-editing');
        
        console.log('✅ [CHAT-SECTION] Edit UI created and displayed');
    }
    
    cancelEditing() {
        if (!this.currentEditingMessage) {
            console.log('⚠️ [CHAT-SECTION] No current editing message to cancel');
            return;
        }
        
        console.log('❌ [CHAT-SECTION] Canceling edit for message:', this.currentEditingMessage.messageId);
        
        const { messageId, originalContent, originalHTML, element, isBubbleMessage } = this.currentEditingMessage;
        
        // Restore original content
        if (originalHTML) {
            // Restore the exact original HTML
            element.innerHTML = originalHTML;
        } else {
            // Fallback: recreate the content with formatting
            element.innerHTML = this.formatMessageContent(originalContent);
            
            // Add edited badge if it was there before
            if (originalContent && originalHTML && originalHTML.includes('(edited)')) {
                let editedBadge = element.querySelector('.edited-badge, .bubble-edited-badge');
                if (!editedBadge) {
                    editedBadge = document.createElement('span');
                    editedBadge.className = isBubbleMessage ? 'bubble-edited-badge text-xs text-[#a3a6aa] ml-1' : 'edited-badge text-xs text-[#a3a6aa] ml-1';
                    editedBadge.textContent = '(edited)';
                    element.appendChild(editedBadge);
                }
            }
        }
        
        // Remove editing visual feedback
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.classList.remove('message-editing');
        }
        
        // Clear editing state
        this.currentEditingMessage = null;
        
        console.log('✅ [CHAT-SECTION] Edit canceled and original content restored');
    }
    
    async saveEdit(messageId, newContent) {
        if (!messageId || !newContent.trim()) return;
        
        const originalContent = this.currentEditingMessage?.originalContent;
        if (newContent.trim() === originalContent?.trim()) {
            console.log('📝 [CHAT-SECTION] No changes made, canceling edit');
            this.cancelEditing();
            return;
        }
        
        try {
            console.log('📝 [CHAT-SECTION] Starting temp edit system for message:', messageId);
            
            // Step 1: Show temp edit immediately (like reactions/replies)
            const tempEditId = `temp-edit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            
            console.log('📝 [CHAT-SECTION] Step 1: Applying temporary edit to UI');
            this.applyTempEdit(messageId, newContent, tempEditId);
            
            // Step 2: Determine target info for socket broadcast
            const targetType = this.chatType === 'channel' ? 'channel' : 'dm';
            const targetId = this.targetId;
            
            // Step 3: Emit to socket for temp broadcast and database save
            const tempEditData = {
                message_id: messageId,
                content: newContent,
                user_id: window.globalSocketManager?.userId || null,
                username: window.globalSocketManager?.username || 'Unknown',
                target_type: targetType,
                target_id: targetId,
                temp_edit_id: tempEditId,
                is_temporary: true,
                source: 'websocket-temp-edit'
            };
            
            console.log('📡 [CHAT-SECTION] Step 2: Broadcasting temp edit to socket:', tempEditData);
            if (window.globalSocketManager && window.globalSocketManager.isReady()) {
                window.globalSocketManager.io.emit('message-edit-temp', tempEditData);
            } else {
                throw new Error('Socket not ready for temp edit broadcast');
            }
            
        } catch (error) {
            console.error('❌ [CHAT-SECTION] Error in temp edit system:', error);
            
            // Restore original content on error
            if (this.currentEditingMessage) {
                const { element, originalContent } = this.currentEditingMessage;
                element.innerHTML = this.formatMessageContent(originalContent);
                this.currentEditingMessage = null;
            }
            
            this.showNotification('Failed to update message. Please try again.', 'error');
        }
    }
    
    applyTempEdit(messageId, newContent, tempEditId) {
        console.log('⏳ [CHAT-SECTION] Applying temporary edit to message:', messageId);
        
        // Cancel editing UI first
        this.cancelEditing();
        
        // Find message element and update content
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            const messageTextElement = messageElement.querySelector('.message-main-text, .bubble-message-text');
            if (messageTextElement) {
                // Update content
                messageTextElement.innerHTML = this.formatMessageContent(newContent);
                
                // Add temp edit indicator
                this.markMessageAsTempEdit(messageElement, tempEditId);
                
                // Add/update edited badge
                let editedBadge = messageElement.querySelector('.edited-badge, .bubble-edited-badge');
                if (!editedBadge) {
                    editedBadge = document.createElement('span');
                    editedBadge.className = 'edited-badge text-xs text-[#a3a6aa] ml-1';
                    editedBadge.textContent = '(edited)';
                    messageTextElement.appendChild(editedBadge);
                }
                
                console.log('✅ [CHAT-SECTION] Temporary edit applied to UI');
            }
        }
    }
    
    markMessageAsTempEdit(messageElement, tempEditId) {
        messageElement.classList.add('message-temp-edit');
        messageElement.style.opacity = '0.8';
        messageElement.dataset.tempEditId = tempEditId;
        
        // Add temp edit indicator
        if (!messageElement.querySelector('.temp-edit-indicator')) {
            const tempIndicator = document.createElement('span');
            tempIndicator.className = 'temp-edit-indicator text-xs text-orange-400 ml-2';
            tempIndicator.innerHTML = '<i class="fas fa-clock"></i>';
            tempIndicator.title = 'Edit is being saved...';
            
            const messageHeader = messageElement.querySelector('.message-header, .bubble-header');
            if (messageHeader) {
                messageHeader.appendChild(tempIndicator);
            }
        }
        
        console.log('⏳ [CHAT-SECTION] Message marked as temp edit:', tempEditId);
    }
    
    markEditAsConfirmed(messageElement) {
        messageElement.classList.remove('message-temp-edit');
        messageElement.style.opacity = '1';
        delete messageElement.dataset.tempEditId;
        
        // Remove temp indicator
        const tempIndicator = messageElement.querySelector('.temp-edit-indicator');
        if (tempIndicator) {
            tempIndicator.remove();
        }
        
        console.log('✅ [CHAT-SECTION] Edit confirmed and temp styling removed');
    }
    
    markEditAsFailed(messageElement, error) {
        messageElement.classList.remove('message-temp-edit');
        messageElement.classList.add('message-edit-failed');
        messageElement.style.opacity = '0.6';
        messageElement.style.borderLeft = '3px solid #ed4245';
        
        // Replace temp indicator with error indicator
        const tempIndicator = messageElement.querySelector('.temp-edit-indicator');
        if (tempIndicator) {
            tempIndicator.className = 'edit-error-indicator text-xs text-red-400 ml-2';
            tempIndicator.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
            tempIndicator.title = `Edit failed: ${error}`;
        }
        
        console.log('❌ [CHAT-SECTION] Edit marked as failed');
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
    
    scrollToBottom() {
        if (!this.chatMessages) {
            this.findDOMElements();
        }
        if (this.chatMessages) {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }
    }
    
    scrollToBottomIfNeeded() {
        if (!this.chatMessages) {
            this.findDOMElements();
        }
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
            const audio = new Audio('/public/assets/sound/message_sound.mp3');
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
        if (!this.chatMessages) {
            console.log('⚠️ [CHAT-SECTION] Chat messages element not found, attempting to find it...');
            this.findDOMElements();
        }
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
    
    initializeExistingMessages() {
        console.log('🔧 [CHAT-SECTION] Initializing event listeners for existing server-rendered messages');
        
        // Find all existing message elements
        const existingMessages = document.querySelectorAll('.message-content[data-message-id]');
        
        console.log(`📝 [CHAT-SECTION] Found ${existingMessages.length} existing messages to initialize`);
        
        existingMessages.forEach(messageElement => {
            const messageId = messageElement.dataset.messageId;
            if (messageId && this.messageHandler) {
                console.log(`🔧 [CHAT-SECTION] Setting up event listeners for message ${messageId}`);
                this.messageHandler.addMessageEventListeners(messageId);
            }
        });
        
        console.log('✅ [CHAT-SECTION] Existing message initialization complete');
    }
    
    switchTarget(newChatType, newTargetId) {
        console.log(`🔄 [CHAT-SECTION] Switching target from ${this.chatType}:${this.targetId} to ${newChatType}:${newTargetId}`);
        
        if (this.chatType === newChatType && this.targetId === newTargetId) {
            console.log('⚠️ [CHAT-SECTION] Already on the same target, skipping switch');
            return;
        }
        
        console.log('🧹 [CHAT-SECTION] Starting target switch cleanup...');
        
        if (this._roomCheckInterval) {
            clearInterval(this._roomCheckInterval);
            this._roomCheckInterval = null;
        }
        
        if (this.messageHandler) {
            this.messageHandler.clearProcessedMessages();
        }
        
        if (this.socketHandler) {
            this.socketHandler.socketListenersSetup = false;
        }
        
        this.showLoadingIndicator();
        this.clearChatMessages();
        
        console.log('📝 [CHAT-SECTION] Updating target properties...');
        this.chatType = newChatType;
        this.targetId = newTargetId;
        this.hasMoreMessages = true;
        this.lastLoadedMessageId = null;
        this.replyingTo = null;
        this.currentEditingMessage = null;
        
        if (this.mentionHandler) {
            this.mentionHandler.onTargetChanged();
        }
        
        console.log('🔌 [CHAT-SECTION] Setting up socket room...');
        if (window.globalSocketManager?.isReady()) {
            this.joinSocketRoom();
        }
        
        console.log('📨 [CHAT-SECTION] Loading messages for new target...');
        
        if (!this.chatMessages) {
            console.log('⚠️ [CHAT-SECTION] Chat messages element not found during switch, finding DOM elements...');
            this.findDOMElements();
        }
        
        this.loadMessages()
            .then(() => {
                console.log(`✅ [CHAT-SECTION] Successfully switched to ${newChatType}:${newTargetId} and loaded messages`);
                this.hideLoadingIndicator();
            })
            .catch((error) => {
                console.error(`❌ [CHAT-SECTION] Failed to load messages for ${newChatType}:${newTargetId}`, error);
                this.showEmptyState('Failed to load messages. Please try again.');
                this.hideLoadingIndicator();
            });
    }
    
    clearChatMessages() {
        console.log('🧹 [CHAT-SECTION] Clearing chat messages');
        
        if (!this.chatMessages) {
            this.findDOMElements();
        }
        
        if (this.chatMessages) {
            this.chatMessages.innerHTML = '';
        }
        
        if (this.messageHandler) {
            this.messageHandler.clearProcessedMessages();
        }
        
        this.hasMoreMessages = true;
        this.lastLoadedMessageId = null;
    }
    
    debugMessageSystem() {
        console.log('🔍 [CHAT-SECTION] Message System Debug Info:', {
            chatType: this.chatType,
            targetId: this.targetId,
            processedMessageCount: this.messageHandler?.processedMessageIds?.size || 0,
            temporaryMessageCount: this.messageHandler?.temporaryMessages?.size || 0,
            socketReady: window.globalSocketManager?.isReady() || false,
            socketAuthenticated: window.globalSocketManager?.authenticated || false,
            messagesInDOM: document.querySelectorAll('[data-message-id]').length,
            sentMessageIds: window._sentMessageIds?.size || 0
        });
        
        // List all processed message IDs
        if (this.messageHandler?.processedMessageIds?.size > 0) {
            console.log('📝 Processed Message IDs:', Array.from(this.messageHandler.processedMessageIds));
        }
        
        // List all DOM message elements
        const domMessages = Array.from(document.querySelectorAll('[data-message-id]')).map(el => el.dataset.messageId);
        if (domMessages.length > 0) {
            console.log('🏠 Messages in DOM:', domMessages);
        }
        
        return {
            processedCount: this.messageHandler?.processedMessageIds?.size || 0,
            domCount: domMessages.length,
            tempCount: this.messageHandler?.temporaryMessages?.size || 0
        };
    }
    
    cleanupEmptyMessages() {
        if (!this.chatMessages) {
            this.findDOMElements();
        }
        if (!this.chatMessages) return;
        
        const emptyGroups = this.chatMessages.querySelectorAll('.bubble-message-group[data-user-id="0"][data-timestamp="0"]');
        emptyGroups.forEach(group => {
            const messageId = group.querySelector('[data-message-id]')?.dataset.messageId;
            if (!messageId || messageId === '' || messageId === '0') {
                console.log('🧹 [CHAT-SECTION] Removing empty message group:', group);
                group.remove();
            }
        });
        
        const emptyMessages = this.chatMessages.querySelectorAll('[data-message-id=""], [data-message-id="0"]');
        emptyMessages.forEach(msg => {
            const messageGroup = msg.closest('.bubble-message-group');
            if (messageGroup) {
                console.log('🧹 [CHAT-SECTION] Removing empty message:', messageGroup);
                messageGroup.remove();
            }
        });
        
        const remainingMessages = this.chatMessages.querySelectorAll('.bubble-message-group');
        if (remainingMessages.length === 0) {
            this.showEmptyState();
        }
    }

    clearMessage() {
        if (!this.messageInput) {
            this.findDOMElements();
        }
        if (this.messageInput) {
            this.messageInput.value = '';
            this.updateSendButton();
        }
    }

    clearReply() {
        if (this.replyingTo) {
            this.cancelReply();
        }
    }
}

// Make functions and classes globally available for dynamic initialization
window.initializeChatSection = initializeChatSection;
window.ChatSection = ChatSection;

// Debug log to confirm availability
console.log('✅ [CHAT-SECTION] Global functions exposed:', {
    initializeChatSection: typeof window.initializeChatSection,
    ChatSection: typeof window.ChatSection,
    timestamp: new Date().toISOString()
  });

// Add global debug function for testing
window.debugChatSection = function() {
    console.log('🧪 [DEBUG] Current URL:', window.location.href);
    console.log('🧪 [DEBUG] URL pathname:', window.location.pathname);
    console.log('🧪 [DEBUG] URL search params:', window.location.search);
    
    const urlParams = new URLSearchParams(window.location.search);
    console.log('🧪 [DEBUG] Channel param from URL:', urlParams.get('channel'));
    console.log('🧪 [DEBUG] Server param from URL:', urlParams.get('server'));
    
    console.log('🧪 [DEBUG] All meta tags:');
    document.querySelectorAll('meta').forEach(meta => {
        if (meta.getAttribute('name')) {
            console.log(`🧪 [DEBUG] Meta: ${meta.getAttribute('name')} = "${meta.getAttribute('content')}"`);
        }
    });
    
    console.log('🧪 [DEBUG] Chat section instance:', window.chatSection);
    if (window.chatSection) {
        console.log('🧪 [DEBUG] Chat section targetId:', window.chatSection.targetId);
        console.log('🧪 [DEBUG] Chat section chatType:', window.chatSection.chatType);
    }
};
  
  export default ChatSection;