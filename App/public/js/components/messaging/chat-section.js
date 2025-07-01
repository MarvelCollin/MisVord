import { showToast } from '../../core/ui/toast.js';
import MessageHandler from './message-handler.js';
import SocketHandler from './socket-handler.js';
import ChatUIHandler from './chat-ui-handler.js';
import FileUploadHandler from './file-upload-handler.js';
import SendReceiveHandler from './send-receive-handler.js';
import ChatBot from './chat-bot.js';
import MentionHandler from './mention-handler.js';



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
    if (window.chatSection) {
        return window.chatSection;
    }
    
    if (window.__CHAT_SECTION_INITIALIZING__) {
        return new Promise((resolve) => {
            const checkInit = () => {
                if (window.chatSection) {
                    resolve(window.chatSection);
                } else if (!window.__CHAT_SECTION_INITIALIZING__) {
                    resolve(null);
                } else {
                    setTimeout(checkInit, 50);
                }
            };
            checkInit();
        });
    }
    
    window.__CHAT_SECTION_INITIALIZING__ = true;
    
    if (typeof window.ChatAPI === 'undefined') {
        await new Promise(resolve => setTimeout(resolve, 100));
        window.__CHAT_SECTION_INITIALIZING__ = false;
        return await initializeChatSection();
    }
    

    
    try {
        const chatSection = new ChatSection();
        await chatSection.init();
        window.chatSection = chatSection;
        window.__CHAT_SECTION_INITIALIZING__ = false;
        
        if (typeof window.emojiReactions === 'undefined' || !window.emojiReactions.initialized) {
            if (typeof window.initializeEmojiReactions === 'function') {
                window.initializeEmojiReactions();
            }
        }
        
        return chatSection;
    } catch (error) {
        window.__CHAT_SECTION_INITIALIZING__ = false;
        if (!isExcludedPage()) {
        }
        throw error;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    if (isExcludedPage()) {
        return;
    }
    
    const initWhenReady = () => {
        if (!window.chatSection && !isExcludedPage()) {
            initializeChatSection();
        }
    };
    
    if (window.__MAIN_SOCKET_READY__) {
        initWhenReady();
    } else {
        
        const checkSocketReady = () => {
            if (window.__MAIN_SOCKET_READY__ || window.globalSocketManager?.isReady()) {
                initWhenReady();
                return true;
            }
            return false;
        };
        
        if (!checkSocketReady()) {
            window.addEventListener('globalSocketReady', () => {
                initWhenReady();
            });
            
            window.addEventListener('socketAuthenticated', () => {
                initWhenReady();
            });
            
            setTimeout(() => {
                if (!checkSocketReady()) {
                    initWhenReady();
                }
            }, 3000);
        }
    }
});

class ChatSection {
    constructor(options = {}) {
        this.chatType = options.chatType || this.detectChatType();
        this.targetId = options.targetId || this.detectTargetId();
        this.userId = options.userId || null;
        this.username = options.username || null;
        this.isInitialized = false;
        this.isLoading = false;
        this.hasMoreMessages = true;
        this.lastLoadedMessageId = null;
        this.replyingTo = null;
        this.currentEditingMessage = null;
        this.socketRoomJoined = false;
        this.socketListenersSetup = false;
        this.channelSwitchManager = null;
        this.lastJoinedRoom = null;
        
        this.chatContainer = null;
        this.chatMessages = null;
        this.messageForm = null;
        this.messageInput = null;
        this.sendButton = null;
        this.loadMoreButton = null;
        this.topReloadButton = null;
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
        
        window.chatSection = this;
    }
    
    detectChatType() {
        const currentPath = window.location.pathname;
        
        if (currentPath === '/home' || currentPath.startsWith('/home/')) {
            if (currentPath.includes('/channels/dm/')) {
                return 'direct';
            }
            return 'direct';
        }
        
        if (currentPath.match(/^\/server\/\d+$/)) {
            return 'channel';
        }
        
        return 'channel';
    }

    detectTargetId() {
        const currentPath = window.location.pathname;
        const urlParams = new URLSearchParams(window.location.search);
        
        if (this.chatType === 'channel') {
            const channelIdFromUrl = urlParams.get('channel');
            if (channelIdFromUrl) {
                return channelIdFromUrl;
            }
            
            const chatIdMeta = document.querySelector('meta[name="chat-id"]');
            if (chatIdMeta && chatIdMeta.content && chatIdMeta.content !== '') {
                return chatIdMeta.content;
            }
            
            const channelMeta = document.querySelector('meta[name="channel-id"]');
            if (channelMeta && channelMeta.content && channelMeta.content !== '') {
                return channelMeta.content;
            }
            
            const activeChannelElement = document.querySelector('.channel-item.active-channel, .channel-item.active');
            if (activeChannelElement) {
                const channelId = activeChannelElement.getAttribute('data-channel-id');
                if (channelId) {
                    return channelId;
                }
            }
            
            const firstTextChannel = document.querySelector('.channel-item[data-channel-type="text"]');
            if (firstTextChannel) {
                const channelId = firstTextChannel.getAttribute('data-channel-id');
                if (channelId) {
                    return channelId;
                }
            }
            
            return null;
        }
        
        if (this.chatType === 'direct') {
            const chatIdMeta = document.querySelector('meta[name="chat-id"]');
            if (chatIdMeta && chatIdMeta.content && chatIdMeta.content !== '') {
                return chatIdMeta.content;
            }
            
            const dmMatch = currentPath.match(/\/channels\/dm\/(\d+)/);
            if (dmMatch) {
                return dmMatch[1];
            }
            
            const roomIdFromUrl = urlParams.get('room');
            if (roomIdFromUrl) {
                return roomIdFromUrl;
            }
            
            const roomMeta = document.querySelector('meta[name="room-id"]');
            if (roomMeta && roomMeta.content && roomMeta.content !== '') {
                return roomMeta.content;
            }
            
            return null;
        }
        
        return null;
    }
    
    findDOMElements() {
        this.chatContainer = document.querySelector('.flex-1.flex.flex-col.bg-\\[\\#313338\\].h-screen.overflow-hidden') || document.getElementById('chat-container');
        this.chatMessages = document.getElementById('chat-messages');
        this.messageForm = document.getElementById('message-form');
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.loadMoreButton = document.getElementById('load-more-messages');
        this.topReloadButton = document.getElementById('top-reload-button');
        this.emptyStateContainer = document.getElementById('empty-state-container');
        this.loadingIndicator = document.getElementById('loading-indicator');
        this.contextMenu = document.getElementById('message-context-menu') || document.getElementById('context-menu');
        this.fileUploadInput = document.getElementById('file-upload');
        this.filePreviewModal = document.getElementById('file-preview-modal');
    }
    
    waitForRequiredElements() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = isExcludedPage() ? 5 : 20;
            
            const checkElements = () => {
                this.findDOMElements();
                
                if (this.chatMessages && this.messageForm && this.messageInput) {
                    resolve();
                    return;
                }
                
                attempts++;
                if (attempts >= maxAttempts) {
                    if (!isExcludedPage()) {
                    }
                    reject(new Error('Required DOM elements not found'));
                    return;
                }
                
                if (!isExcludedPage() && attempts % 5 === 0) {
                }
                setTimeout(checkElements, 100);
            };
            
            checkElements();
        });
    }
    
    async init() {
        try {
            await this.waitForRequiredElements();
        
            if (!this.targetId) {
                this.targetId = this.detectTargetId();
                
                if (!this.targetId) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                    this.targetId = this.detectTargetId();
                    
                    if (!this.targetId) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        this.targetId = this.detectTargetId();
                    }
                }
            }
            
            if (this.targetId) {
                this.updateChannelHeader();
            }
            
            this.setupEventListeners();
            
            if (this.targetId && this.chatType) {
                this.setupHandlers();
            
                if (this.messageHandler) {
                    this.messageHandler.ensureFallbackStyles();
            }
            
                this.joinSocketRoom();
                
                await this.loadMessages();
            
            this.initializeExistingMessages();
            
                this.updateChannelHeader();
            } else {
            }
            
            this.addTopReloadButtonStyles();
            
            if (this.mentionHandler && this.targetId) {
                setTimeout(() => {
                    this.mentionHandler.loadAvailableUsers();
                }, 500);
            } else {
            }
            
            this.chatBot.init();
            
        } catch (error) {
            if (!isExcludedPage()) {
            }
        }
    }
    
    joinSocketRoom() {
        if (!this.targetId) {
            return;
        }
        
        const socketStatus = this.getDetailedSocketStatus();
        
        if (!socketStatus.isReady) {
            this.setupSocketReadyListeners();
            return;
        }
        
        if (this.socketRoomJoined && this.lastJoinedRoom === this.targetId) {
            return;
        }
        
        if (this.socketRoomJoined && this.lastJoinedRoom && this.lastJoinedRoom !== this.targetId) {
            this.leaveCurrentSocketRoom();
        }
        
        try {
            const success = window.globalSocketManager.joinRoom(this.chatType === 'direct' ? 'dm' : 'channel', this.targetId);
            
            if (success) {
                this.socketRoomJoined = true;
                this.lastJoinedRoom = this.targetId;
            } else {
            }
        } catch (error) {
        }
    }
    
    setupSocketReadyListeners() {
        const handleSocketReady = () => {
            const socketStatus = this.getDetailedSocketStatus();
            
            if (socketStatus.isReady && this.targetId) {
                this.joinSocketRoom();
            } else {
            }
        };
        
        window.addEventListener('globalSocketReady', handleSocketReady);
        window.addEventListener('socketAuthenticated', handleSocketReady);
        
        const checkWithTimeout = () => {
            setTimeout(() => {
                const socketStatus = this.getDetailedSocketStatus();
                
                if (socketStatus.isReady && this.targetId && !this.socketRoomJoined) {
                    this.joinSocketRoom();
                } else if (!socketStatus.socketInitialized) {
                    if (window.globalSocketManager && !window.globalSocketManager.connected) {
                        const userData = {
                            user_id: this.userId || document.querySelector('meta[name="user-id"]')?.content,
                            username: this.username || document.querySelector('meta[name="username"]')?.content
                        };
                        
                        if (userData.user_id && userData.username) {
                            window.globalSocketManager.init(userData);
                        }
                    }
                }
            }, 3000);
        };
        
        checkWithTimeout();
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
        
        // Chat messages scroll event listener
        if (this.chatMessages) {
            this.chatMessages.addEventListener('scroll', () => {
                this.handleChatScroll();
            });
            console.log('✅ [CHAT-SECTION] Chat scroll listener added');
        } else {
            console.warn('⚠️ [CHAT-SECTION] Chat messages container not found for scroll listener');
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
        const forceFresh = options.forceFresh || false;
        
        if (this.isLoading && !forceFresh) {
            console.log('⚠️ [CHAT-SECTION] Already loading messages, skipping request');
            return;
        }
        
        if (!this.targetId) {
            console.warn('⚠️ Cannot load messages: No target ID');
            this.showEmptyState('No channel or chat selected');
            return;
        }
        
        const limit = options.limit || 20;
        const before = forceFresh ? null : (options.before || null);
        
        if (forceFresh) {
            console.log('🔄 [CHAT-SECTION] Force fresh loading - clearing cache');
            this.clearChatMessages();
            this.lastLoadedMessageId = null;
            this.hasMoreMessages = true;
        }
        
        this.isLoading = true;
        this.showLoadingIndicator();
        
        console.log('🔍 [CHAT-SECTION] Starting loadMessages with:', {
            targetId: this.targetId, 
            chatType: this.chatType,
            before: before,
            limit: limit,
            ChatAPIExists: !!window.ChatAPI,
            isChannelSwitch: options.isChannelSwitch || false
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
            
            const requestOptions = {
                limit,
                before,
                offset: options.offset || 0
            };
            
            if (forceFresh) {
                requestOptions.timestamp = Date.now();
            }
            
            console.log('📡 [CHAT-SECTION] Making API call to getMessages...');
            const response = await window.ChatAPI.getMessages(
                this.targetId,
                this.chatType,
                requestOptions
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
                    this.lastLoadedMessageId = messages[0]?.id || this.lastLoadedMessageId;
                } else {
                    console.log('📝 [CHAT-SECTION] Displaying fresh messages');
                    await this.messageHandler.displayMessages(messages);
                    this.lastLoadedMessageId = messages[0]?.id || null;
                }
                
                if (!before) {
                    this.scrollToBottom();
                }
                
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
            limit: 20
        });
    }
    
    updateLoadMoreButton() {
        const messagesContainer = this.getMessagesContainer();
        if (!messagesContainer) {
            console.error('❌ [CHAT-SECTION] Cannot update load more button: messages container not found');
            return;
        }
        
        if (!this.loadMoreButton) {
            this.loadMoreButton = document.createElement('div');
            this.loadMoreButton.id = 'load-more-messages';
            this.loadMoreButton.className = 'load-more-messages text-center p-2 text-[#949ba4] hover:text-[#dcddde] cursor-pointer hidden';
            this.loadMoreButton.innerHTML = 'Load more messages';
            
            try {
                if (messagesContainer.firstChild) {
                    messagesContainer.insertBefore(this.loadMoreButton, messagesContainer.firstChild);
                } else {
                    messagesContainer.appendChild(this.loadMoreButton);
                }
                console.log('✅ [CHAT-SECTION] Load more button created and added to messages container');
            } catch (error) {
                console.error('❌ [CHAT-SECTION] Failed to add load more button:', error);
                return;
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
        const messagesContainer = this.getMessagesContainer();
        if (!messagesContainer) {
            console.error('❌ [CHAT-SECTION] Cannot show loading indicator: messages container not found');
            return;
        }
        
        if (!this.loadingIndicator) {
            this.loadingIndicator = document.createElement('div');
            this.loadingIndicator.id = 'loading-indicator';
            this.loadingIndicator.className = 'flex justify-center items-center p-4 text-[#dcddde]';
            this.loadingIndicator.innerHTML = `
                <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#5865f2]"></div>
            `;
            
            try {
                messagesContainer.appendChild(this.loadingIndicator);
                console.log('✅ [CHAT-SECTION] Loading indicator created and appended to messages container');
            } catch (error) {
                console.error('❌ [CHAT-SECTION] Failed to append loading indicator:', error);
                return;
            }
        } else {
            this.loadingIndicator.classList.remove('hidden');
            console.log('✅ [CHAT-SECTION] Loading indicator shown');
        }
    }
    
    hideLoadingIndicator() {
        if (this.loadingIndicator) {
            this.loadingIndicator.classList.add('hidden');
        }
    }
    
    showEmptyState(message = null) {
        const messagesContainer = this.getMessagesContainer();
        if (!messagesContainer) {
            console.error('❌ [CHAT-SECTION] Cannot show empty state: messages container not found');
            return;
        }
        
        if (!this.emptyStateContainer) {
            this.emptyStateContainer = document.createElement('div');
            this.emptyStateContainer.id = 'empty-state-container';
            this.emptyStateContainer.className = 'flex flex-col items-center justify-center h-full text-[#dcddde] p-4';
            
            try {
                messagesContainer.appendChild(this.emptyStateContainer);
                console.log('✅ [CHAT-SECTION] Empty state container created and appended to messages container');
            } catch (error) {
                console.error('❌ [CHAT-SECTION] Failed to append empty state container:', error);
                return;
            }
        }
        
        const defaultMessage = 'No messages yet. Be the first to send a message!';
        const displayMessage = message || defaultMessage;
        
        this.emptyStateContainer.innerHTML = `
            <i class="fas fa-comments text-6xl mb-4 text-[#4f545c]"></i>
            <p class="text-lg">${displayMessage}</p>
        `;
        
        this.emptyStateContainer.classList.remove('hidden');
        console.log('✅ [CHAT-SECTION] Empty state displayed with message:', displayMessage);
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
        
        if (!this.targetId) {
            console.warn('⚠️ [CHAT-SECTION] Cannot send typing event: No target ID');
            return;
        }
        
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
        messageElement.dataset.tempEditId = tempEditId;
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
            console.warn('⚠️ [CHAT-SECTION] Chat messages container not found for scrolling, attempting to find DOM elements');
            this.findDOMElements();
            
            if (!this.chatMessages) {
                console.error('❌ [CHAT-SECTION] Cannot scroll: chat messages container still not found');
                return;
            }
        }
        
        try {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        } catch (error) {
            console.error('❌ [CHAT-SECTION] Failed to scroll to bottom:', error);
        }
    }
    
    scrollToBottomIfNeeded() {
        if (!this.chatMessages) {
            console.warn('⚠️ [CHAT-SECTION] Chat messages container not found for conditional scrolling, attempting to find DOM elements');
            this.findDOMElements();
            
            if (!this.chatMessages) {
                console.error('❌ [CHAT-SECTION] Cannot check scroll position: chat messages container still not found');
                return;
            }
        }
        
        try {
            const { scrollTop, scrollHeight, clientHeight } = this.chatMessages;
            const isNearBottom = scrollTop + clientHeight >= scrollHeight - 200;
            
            if (isNearBottom) {
                this.scrollToBottom();
            }
        } catch (error) {
            console.error('❌ [CHAT-SECTION] Failed to check scroll position:', error);
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
            console.warn('⚠️ [CHAT-SECTION] Chat messages element not found, attempting to find it...');
            this.findDOMElements();
            
            if (!this.chatMessages) {
                console.error('❌ [CHAT-SECTION] Cannot get messages container: chat messages element still not found after search');
                return null;
            }
        }
        
        try {
            const messagesContainer = this.chatMessages.querySelector('.messages-container');
            if (messagesContainer) {
                return messagesContainer;
            } else {
                console.warn('⚠️ [CHAT-SECTION] .messages-container not found inside #chat-messages, returning #chat-messages as fallback');
                return this.chatMessages;
            }
        } catch (error) {
            console.error('❌ [CHAT-SECTION] Error accessing chat messages container:', error);
            return null;
        }
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
    
    clearChatMessages() {
        console.log('🧹 [CHAT-SECTION] Clearing chat messages');
        
        if (this.chatMessages) {
            const messagesContainer = this.chatMessages.querySelector('.messages-container');
            if (messagesContainer) {
                messagesContainer.innerHTML = '';
            } else {
                this.chatMessages.innerHTML = '';
            }
            console.log('✅ [CHAT-SECTION] Chat messages cleared');
        }
        
        if (this.emptyStateContainer) {
            this.emptyStateContainer.remove();
            this.emptyStateContainer = null;
        }
        
        if (this.loadingIndicator) {
            this.loadingIndicator.remove();
            this.loadingIndicator = null;
        }
        
        if (this.loadMoreButton) {
            this.loadMoreButton.remove();
            this.loadMoreButton = null;
        }
        
        if (this.topReloadButton) {
            this.topReloadButton.remove();
            this.topReloadButton = null;
        }
        
        this.lastLoadedMessageId = null;
        this.hasMoreMessages = true;
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

    setupHandlers() {
        console.log('🔧 [CHAT-SECTION] Setting up handlers...');
        
        if (!this.mentionHandler) {
            this.mentionHandler = new MentionHandler(this);
            console.log('✅ [CHAT-SECTION] MentionHandler initialized');
        }
        
        if (this.socketHandler && !this.socketHandler.socketListenersSetup) {
            if (window.globalSocketManager && window.globalSocketManager.io) {
                this.socketHandler.setupSocketHandlers(window.globalSocketManager.io);
                console.log('✅ [CHAT-SECTION] SocketHandler setup completed');
            } else {
                console.log('⏳ [CHAT-SECTION] Socket not ready, will setup handlers when socket connects');
                
                const setupSocketHandlersWhenReady = () => {
                    if (window.globalSocketManager && window.globalSocketManager.io && !this.socketHandler.socketListenersSetup) {
                        this.socketHandler.setupSocketHandlers(window.globalSocketManager.io);
                        console.log('✅ [CHAT-SECTION] SocketHandler setup completed after socket ready');
                    }
                };
                
                window.addEventListener('globalSocketReady', setupSocketHandlersWhenReady);
                window.addEventListener('socketAuthenticated', setupSocketHandlersWhenReady);
                
                setTimeout(() => {
                    if (window.globalSocketManager?.io && !this.socketHandler.socketListenersSetup) {
                        setupSocketHandlersWhenReady();
                    }
                }, 2000);
            }
        }
        
        console.log('✅ [CHAT-SECTION] All handlers setup completed');
    }

    updateChannelHeader() {
        console.log('🏷️ [CHAT-SECTION] Updating channel header...');
        
        const channelIcon = document.getElementById('channel-icon');
        const channelName = document.getElementById('channel-name');
        
        if (!channelIcon || !channelName) {
            console.warn('⚠️ [CHAT-SECTION] Channel header elements not found');
            return;
        }
        
        if (this.chatType === 'channel' && this.targetId) {
            const channelElement = document.querySelector(`[data-channel-id="${this.targetId}"]`);
            if (channelElement) {
                let nameText = channelElement.querySelector('.channel-name')?.textContent?.trim() ||
                              channelElement.getAttribute('data-channel-name') ||
                              'Channel';
                
                nameText = this.cleanChannelName(nameText);
                
                const iconElement = channelElement.querySelector('i.fas');
                
                channelName.textContent = nameText;
                if (iconElement) {
                    channelIcon.className = iconElement.className;
                } else {
                    channelIcon.className = 'fas fa-hashtag text-[#949ba4] mr-2';
                }
                
                console.log('✅ [CHAT-SECTION] Channel header updated from DOM:', nameText);
                return;
            }
            
            const chatTitleMeta = document.querySelector('meta[name="chat-title"]');
            if (chatTitleMeta && chatTitleMeta.content) {
                let nameText = this.cleanChannelName(chatTitleMeta.content);
                channelName.textContent = nameText;
                channelIcon.className = 'fas fa-hashtag text-[#949ba4] mr-2';
                console.log('✅ [CHAT-SECTION] Channel header updated from meta tag:', nameText);
                return;
            }
            
            if (window.currentChannelData && window.currentChannelData.name) {
                let nameText = this.cleanChannelName(window.currentChannelData.name);
                channelName.textContent = nameText;
                const iconClass = window.currentChannelData.type === 'voice' ? 'fas fa-volume-high' : 'fas fa-hashtag';
                channelIcon.className = `${iconClass} text-[#949ba4] mr-2`;
                console.log('✅ [CHAT-SECTION] Channel header updated from window data:', nameText);
                return;
            }
            
            channelName.textContent = `Channel ${this.targetId}`;
            channelIcon.className = 'fas fa-hashtag text-[#949ba4] mr-2';
            console.log('✅ [CHAT-SECTION] Channel header updated with fallback');
            
        } else if (this.chatType === 'direct') {
            const chatTitleMeta = document.querySelector('meta[name="chat-title"]');
            let titleText = chatTitleMeta?.content || 'Direct Message';
            titleText = this.cleanChannelName(titleText);
            
            channelName.textContent = titleText;
            channelIcon.className = 'fas fa-user text-[#949ba4] mr-2';
            console.log('✅ [CHAT-SECTION] DM header updated:', titleText);
            
        } else {
            channelName.textContent = 'Chat';
            channelIcon.className = 'fas fa-comments text-[#949ba4] mr-2';
            console.log('✅ [CHAT-SECTION] Generic header fallback applied');
        }
    }
    
    cleanChannelName(name) {
        if (!name) return 'Channel';
        
        let cleanName = name.toString()
            .replace(/=+/g, '')
            .replace(/Edit\s*Delete?/gi, '')
            .replace(/Delete\s*Edit?/gi, '')
            .replace(/Edit/gi, '')
            .replace(/Delete/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
        
        if (!cleanName || cleanName.length === 0) {
            return 'Channel';
        }
        
        return cleanName;
    }

    async switchToChannel(channelId, channelType = 'text', forceFresh = false) {
        console.log('🔄 [CHAT-SECTION] Switching to channel:', channelId, channelType, 'forceFresh:', forceFresh);
        
        this.forceStopAllOperations();
        
        this.targetId = channelId;
        this.chatType = 'channel';
        
        this.fullStateReset();
        
        this.joinSocketRoom();
        
        await this.loadMessages({ forceFresh: true, isChannelSwitch: true });
        
        this.updateChannelHeader();
        
        console.log('✅ [CHAT-SECTION] Channel switch completed');
    }

    resetForNewChannel() {
        console.log('🔄 [CHAT-SECTION] Resetting for new channel');
        
        this.forceStopAllOperations();
        this.fullStateReset();
        
        console.log('✅ [CHAT-SECTION] Reset completed');
    }
    
    forceStopAllOperations() {
        this.isLoading = false;
        
        this.leaveCurrentSocketRoom();
        
        if (this.loadMoreButton) {
            this.loadMoreButton.remove();
            this.loadMoreButton = null;
        }
        
        if (this.topReloadButton) {
            this.topReloadButton.remove();
            this.topReloadButton = null;
        }
        
        if (this.loadingIndicator) {
            this.loadingIndicator.remove();
            this.loadingIndicator = null;
        }
        
        if (this.emptyStateContainer) {
            this.emptyStateContainer.remove();
            this.emptyStateContainer = null;
        }
    }
    
    fullStateReset() {
        this.clearChatMessages();
        this.hideEmptyState();
        
        this.hasMoreMessages = true;
        this.lastLoadedMessageId = null;
        this.replyingTo = null;
        this.currentEditingMessage = null;
        this.isInitialized = false;
        
        const messagesContainer = this.getMessagesContainer();
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
            messagesContainer.scrollTop = 0;
        }
    }

    leaveCurrentSocketRoom() {
        if (this.socketRoomJoined && this.lastJoinedRoom && window.globalSocketManager) {
            console.log('🔌 [CHAT-SECTION] Leaving current socket room:', this.lastJoinedRoom);
            
            try {
                if (this.chatType === 'channel') {
                    if (typeof window.globalSocketManager.leaveChannel === 'function') {
                        window.globalSocketManager.leaveChannel(this.lastJoinedRoom);
                    } else {
                        console.warn('⚠️ [CHAT-SECTION] leaveChannel method not available, using generic leaveRoom');
                        window.globalSocketManager.leaveRoom('channel', this.lastJoinedRoom);
                    }
                } else if (this.chatType === 'direct') {
                    if (typeof window.globalSocketManager.leaveDMRoom === 'function') {
                        window.globalSocketManager.leaveDMRoom(this.lastJoinedRoom);
                    } else if (typeof window.globalSocketManager.leaveRoom === 'function') {
                        console.log('🔄 [CHAT-SECTION] Using generic leaveRoom for DM room');
                        window.globalSocketManager.leaveRoom('dm', this.lastJoinedRoom);
                    } else {
                        console.warn('⚠️ [CHAT-SECTION] No available method to leave DM room');
                    }
                }
                
                this.socketRoomJoined = false;
                this.lastJoinedRoom = null;
                console.log('✅ [CHAT-SECTION] Successfully left socket room');
            } catch (error) {
                console.error('❌ [CHAT-SECTION] Error leaving socket room:', error);
                this.socketRoomJoined = false;
                this.lastJoinedRoom = null;
            }
        } else {
            console.log('🔍 [CHAT-SECTION] No socket room to leave:', {
                socketRoomJoined: this.socketRoomJoined,
                lastJoinedRoom: this.lastJoinedRoom,
                hasSocketManager: !!window.globalSocketManager
            });
        }
    }

    setChannelSwitchManager(manager) {
        this.channelSwitchManager = manager;
        console.log('🔗 [CHAT-SECTION] Channel switch manager linked');
    }
    
    retrySocketConnection() {
        console.log('🔄 [CHAT-SECTION] Manually retrying socket connection...');
        
        if (!window.globalSocketManager) {
            console.error('❌ [CHAT-SECTION] No global socket manager available');
            return false;
        }
        
        const userData = {
            user_id: this.userId || document.querySelector('meta[name="user-id"]')?.content,
            username: this.username || document.querySelector('meta[name="username"]')?.content
        };
        
        if (!userData.user_id || !userData.username) {
            console.error('❌ [CHAT-SECTION] Cannot retry - missing user data');
            return false;
        }
        
        window.__SOCKET_INITIALISED__ = false;
        const result = window.globalSocketManager.init(userData);
        
        if (result) {
            console.log('✅ [CHAT-SECTION] Socket reconnection initiated');
            
            setTimeout(() => {
                const status = this.getDetailedSocketStatus();
                if (status.isReady && this.targetId) {
                    this.joinSocketRoom();
                }
            }, 3000);
            
            return true;
        } else {
            console.error('❌ [CHAT-SECTION] Failed to initiate socket reconnection');
            return false;
        }
    }

    getDetailedSocketStatus() {
        const manager = window.globalSocketManager;
        
        if (!manager) {
            return {
                isReady: false,
                connected: false,
                authenticated: false,
                hasIO: false,
                readyReason: 'No socket manager found',
                socketInitialized: false
            };
        }
        
        const status = {
            isReady: manager.isReady(),
            connected: manager.connected,
            authenticated: manager.authenticated,
            hasIO: !!manager.io,
            readyReason: '',
            socketInitialized: !!window.__SOCKET_INITIALISED__
        };
        
        if (!status.socketInitialized) {
            status.readyReason = 'Socket not initialized';
        } else if (!status.hasIO) {
            status.readyReason = 'Socket IO not initialized';
        } else if (!status.connected) {
            status.readyReason = 'Socket not connected';
        } else if (!status.authenticated) {
            status.readyReason = 'Socket not authenticated';
        } else {
            status.readyReason = 'Ready';
        }
        
        if (manager.io) {
            status.socketId = manager.io.id;
            status.connectionState = manager.io.connected ? 'connected' : 'disconnected';
        }
        
        return status;
    }
    
    handleChatScroll() {
        if (!this.chatMessages) return;
        
        const { scrollTop, scrollHeight, clientHeight } = this.chatMessages;
        const isAtTop = scrollTop <= 10;
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - 200;
        
        if (isAtTop && this.hasMoreMessages && !this.isLoading) {
            this.showTopReloadButton();
        } else {
            this.hideTopReloadButton();
        }
        
        if (isNearBottom) {
            this.scrollToBottomIfNeeded();
        }
    }
    
    showTopReloadButton() {
        const messagesContainer = this.getMessagesContainer();
        if (!messagesContainer) return;
        
        if (!this.topReloadButton) {
            this.topReloadButton = document.createElement('div');
            this.topReloadButton.id = 'top-reload-button';
            this.topReloadButton.className = 'absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-[#5865f2] hover:bg-[#4752c4] text-white px-4 py-2 rounded-full shadow-lg cursor-pointer transition-all duration-200 flex items-center gap-2';
            this.topReloadButton.innerHTML = '<i class="fas fa-arrow-up"></i>Load older messages';
            
            this.topReloadButton.addEventListener('click', () => {
                this.loadOlderMessages();
            });
            
            const chatContainer = this.chatContainer || messagesContainer.parentElement;
            if (chatContainer) {
                chatContainer.style.position = 'relative';
                chatContainer.appendChild(this.topReloadButton);
                console.log('✅ [CHAT-SECTION] Top reload button created and positioned relative to chat container');
            } else {
                document.body.appendChild(this.topReloadButton);
                console.log('✅ [CHAT-SECTION] Top reload button created and positioned fixed to body');
            }
        }
        
        this.topReloadButton.style.display = 'flex';
        this.topReloadButton.style.animation = 'slideInFromTop 0.3s ease-out';
    }
    
    hideTopReloadButton() {
        if (this.topReloadButton) {
            this.topReloadButton.style.animation = 'slideOutToTop 0.3s ease-in';
            setTimeout(() => {
                if (this.topReloadButton) {
                    this.topReloadButton.style.display = 'none';
                }
            }, 300);
        }
    }
    
    loadOlderMessages() {
        if (!this.hasMoreMessages || this.isLoading) return;
        
        console.log('📜 [CHAT-SECTION] Loading older messages from top reload button');
        
        this.hideTopReloadButton();
        
        const currentScrollHeight = this.chatMessages.scrollHeight;
        
        this.loadMessages({
            before: this.lastLoadedMessageId,
            limit: 20
        }).then(() => {
            const newScrollHeight = this.chatMessages.scrollHeight;
            const scrollDiff = newScrollHeight - currentScrollHeight;
            this.chatMessages.scrollTop = scrollDiff;
            console.log('✅ [CHAT-SECTION] Scroll position maintained after loading older messages');
        });
    }
    
    addTopReloadButtonStyles() {
        if (document.getElementById('top-reload-button-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'top-reload-button-styles';
        style.textContent = `
            @keyframes slideInFromTop {
                0% { transform: translate(-50%, -100%); opacity: 0; }
                100% { transform: translate(-50%, 0); opacity: 1; }
            }
            
            @keyframes slideOutToTop {
                0% { transform: translate(-50%, 0); opacity: 1; }
                100% { transform: translate(-50%, -100%); opacity: 0; }
            }
            
            #top-reload-button {
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                backdrop-filter: blur(10px);
            }
            
            #top-reload-button:hover {
                transform: translate(-50%, 0) scale(1.05);
            }
        `;
        
        document.head.appendChild(style);
        console.log('✅ [CHAT-SECTION] Top reload button styles added');
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
        console.log('🧪 [DEBUG] Socket room joined:', window.chatSection.socketRoomJoined);
        console.log('🧪 [DEBUG] Last joined room:', window.chatSection.lastJoinedRoom);
        
        const socketStatus = window.chatSection.getDetailedSocketStatus();
        console.log('🧪 [DEBUG] Detailed socket status:', socketStatus);
    }
    
    console.log('🧪 [DEBUG] Global socket manager:', window.globalSocketManager);
    if (window.globalSocketManager) {
        console.log('🧪 [DEBUG] Socket connected:', window.globalSocketManager.connected);
        console.log('🧪 [DEBUG] Socket authenticated:', window.globalSocketManager.authenticated);
        console.log('🧪 [DEBUG] Socket IO exists:', !!window.globalSocketManager.io);
        console.log('🧪 [DEBUG] Socket isReady():', window.globalSocketManager.isReady());
    }
};
  
  export default ChatSection;

export { initializeChatSection };