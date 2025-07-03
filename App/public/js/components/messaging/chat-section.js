import { showToast } from '../../core/ui/toast.js';
import MessageHandler from './message-handler.js';
import SocketHandler from './socket-handler.js';
import FileUploadHandler from './file-upload-handler.js';
import SendReceiveHandler from './send-receive-handler.js';
import ChatBot from './chat-bot.js';
import MentionHandler from './mention-handler.js';
import TextToSpeech from './text-to-speech.js';



function isExcludedPage() {
    return !isChatPage();
}

function isChatPage() {
    const currentPath = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    
    console.log('🔍 [CHAT-SECTION] Checking if chat page:', { currentPath, params: urlParams.toString() });
    
    // Check if it's a home page with direct messages
    if (currentPath === '/home' || currentPath.startsWith('/home/')) {
        console.log('✅ [CHAT-SECTION] Home page detected, allowing chat');
        return true;
    }
    
    // Check if it's a server page
    const serverMatch = currentPath.match(/^\/server\/(\d+)$/);
    if (serverMatch) {
        const channelId = urlParams.get('channel');
        console.log('🔍 [CHAT-SECTION] Server page detected, channel ID:', channelId);
        
        // If no channel ID, still allow chat (it might be set later)
        if (!channelId) {
            console.log('⚠️ [CHAT-SECTION] No channel ID found, but allowing chat initialization');
            return true;
        }
        
        // Check if it's NOT a voice channel
        const channelType = urlParams.get('type');
        if (channelType === 'voice') {
            console.log('❌ [CHAT-SECTION] Voice channel detected, disabling chat');
            return false;
        }
        
        // Check DOM for channel type if available
        const activeChannelElement = document.querySelector(`[data-channel-id="${channelId}"]`);
        if (activeChannelElement) {
            const channelDataType = activeChannelElement.getAttribute('data-channel-type');
            if (channelDataType === 'voice') {
                console.log('❌ [CHAT-SECTION] Voice channel detected in DOM, disabling chat');
                return false;
            }
        }
        
        console.log('✅ [CHAT-SECTION] Text channel or unknown type, allowing chat');
        return true;
    }
    
    console.log('❌ [CHAT-SECTION] Not a chat page:', currentPath);
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
        console.log('⏳ [CHAT-SECTION] ChatAPI not available, waiting...');
        let waitAttempts = 0;
        while (typeof window.ChatAPI === 'undefined' && waitAttempts < 20) {
            await new Promise(resolve => setTimeout(resolve, 150));
            waitAttempts++;
        }
        
        if (typeof window.ChatAPI === 'undefined') {
            console.warn('⚠️ [CHAT-SECTION] ChatAPI still not available, proceeding anyway');
        }
    }
    

    
    try {
        const chatSection = new ChatSection();
        await chatSection.init();
        window.chatSection = chatSection;
        window.__CHAT_SECTION_INITIALIZING__ = false;
        
        if (typeof window.emojiReactions === 'undefined' || !window.emojiReactions.initialized) {
            if (typeof window.initializeEmojiReactions === 'function') {
                window.initializeEmojiReactions();
                
                if (window.emojiReactions && chatSection.targetId) {
                    console.log('🔄 [CHAT-SECTION] Updating emoji reactions context after initialization');
                    window.emojiReactions.updateChannelContext(chatSection.targetId, chatSection.chatType);
                }
            }
        } else if (window.emojiReactions && chatSection.targetId) {
            console.log('🔄 [CHAT-SECTION] Emoji reactions already initialized, updating context');
            window.emojiReactions.updateChannelContext(chatSection.targetId, chatSection.chatType);
        }
        
        return chatSection;
    } catch (error) {
        window.__CHAT_SECTION_INITIALIZING__ = false;
        if (!isExcludedPage()) {
        }
        throw error;
    }
}

// Make initializeChatSection globally available
window.initializeChatSection = initializeChatSection;

// Add a function to manually retry chat initialization
window.retryChatInitialization = function() {
    console.log('🔄 [CHAT-SECTION] Manual retry requested');
    if (window.chatSection) {
        console.log('🔄 [CHAT-SECTION] Existing chat section found, re-finding DOM elements');
        window.chatSection.findDOMElements();
        window.chatSection.setupEventListeners();
        return true;
    } else {
        console.log('🔄 [CHAT-SECTION] No existing chat section, initializing fresh');
        return initializeChatSection().then(() => {
            console.log('✅ [CHAT-SECTION] Manual retry completed successfully');
            return true;
        }).catch(error => {
            console.error('❌ [CHAT-SECTION] Manual retry failed:', error);
            return false;
        });
    }
};

// Add a diagnostic function
window.diagnoseChatSection = function() {
    console.log('🔧 [CHAT-SECTION] Running diagnostics...');
    
    const diagnostics = {
        chatSection: !!window.chatSection,
        currentPath: window.location.pathname,
        urlParams: window.location.search,
        isChatPage: isChatPage(),
        isExcludedPage: isExcludedPage(),
        domElements: {
            chatMessages: !!document.getElementById('chat-messages'),
            messageForm: !!document.getElementById('message-form'),
            messageInput: !!document.getElementById('message-input'),
            sendButton: !!document.getElementById('send-button')
        },
        socketManager: !!window.globalSocketManager,
        socketReady: window.globalSocketManager?.isReady() || false
    };
    
    console.table(diagnostics);
    
    if (diagnostics.domElements.messageInput) {
        const messageInput = document.getElementById('message-input');
        console.log('📝 [CHAT-SECTION] Message input details:', {
            id: messageInput.id,
            type: messageInput.type || messageInput.tagName,
            placeholder: messageInput.placeholder,
            disabled: messageInput.disabled,
            style: messageInput.style.display || 'default',
            parentVisible: messageInput.parentElement?.style.display !== 'none',
            hasListeners: !!messageInput.dataset.listenersAttached
        });
    }
    
    return diagnostics;
};

document.addEventListener('DOMContentLoaded', function() {
    if (isExcludedPage()) {
        return;
    }
    
    const initWhenReady = () => {
        if (!window.chatSection && !isExcludedPage()) {
            initializeChatSection().catch(error => {
                console.error('❌ [CHAT-SECTION] Initialization failed:', error);
            });
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
    
    // Also try immediate initialization if DOM is ready
    setTimeout(() => {
        if (!window.chatSection && !isExcludedPage()) {
            console.log('🔄 [CHAT-SECTION] Attempting immediate initialization');
            initWhenReady();
        }
    }, 100);
});

class ChatSection {
    constructor(options = {}) {
        console.log('🔧 [CHAT-SECTION] ChatSection constructor called with options:', options);
        
        try {
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
            
            this.currentServerName = options.serverName || null;
            this.currentServerIcon = options.serverIcon || null;
            this.currentChannelName = options.channelName || null;
            
            this.chatContainer = null;
            this.chatMessages = null;
            this.messageForm = null;
            this.messageInput = null;
            this.sendButton = null;
            this.loadMoreButton = null;
            this.loadMoreContainer = null;
            this.topReloadButton = null;
            this.emptyStateContainer = null;
            this.contextMenu = null;
            this.fileUploadInput = null;
            this.filePreviewModal = null;
            this.currentOffset = 0;
            
            console.log('🔧 [CHAT-SECTION] Creating handlers...');
            this.messageHandler = new MessageHandler(this);
            this.socketHandler = new SocketHandler(this);
            this.fileUploadHandler = new FileUploadHandler(this);
            this.sendReceiveHandler = new SendReceiveHandler(this);
            this.chatBot = new ChatBot(this);
            this.mentionHandler = null;
            this.tts = new TextToSpeech();
            
            console.log('🔧 [CHAT-SECTION] Setting window.chatSection and starting init...');
            window.chatSection = this;
            
            this.init().catch(error => {
                console.error('❌ [CHAT-SECTION] Init failed:', error);
            });
            
            console.log('✅ [CHAT-SECTION] Constructor completed successfully');
        } catch (error) {
            console.error('❌ [CHAT-SECTION] Constructor error:', error);
            throw error;
        }
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
        console.log('🔍 [CHAT-SECTION] Finding DOM elements...');
        this.chatContainer = document.querySelector('.flex-1.flex.flex-col.bg-\\[\\#313338\\].h-screen.overflow-hidden') || document.getElementById('chat-container');
        this.chatMessages = document.getElementById('chat-messages');
        this.messageForm = document.getElementById('message-form');
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.loadMoreButton = document.getElementById('load-more-messages');
        this.loadMoreContainer = document.getElementById('load-more-container');
        this.topReloadButton = document.getElementById('top-reload-button');
        this.emptyStateContainer = document.getElementById('empty-state-container');
        this.contextMenu = document.getElementById('message-context-menu') || document.getElementById('context-menu');
        this.fileUploadInput = document.getElementById('file-upload');
        this.filePreviewModal = document.getElementById('file-preview-modal');
        
        console.log('🔍 [CHAT-SECTION] DOM Elements found:', {
            chatContainer: !!this.chatContainer,
            chatMessages: !!this.chatMessages,
            messageForm: !!this.messageForm,
            messageInput: !!this.messageInput,
            sendButton: !!this.sendButton
        });
    }
    
    waitForRequiredElements() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = isExcludedPage() ? 5 : 30;
            
            const checkElements = () => {
                this.findDOMElements();
                
                const hasRequiredElements = this.chatMessages && this.messageForm && this.messageInput;
                
                if (hasRequiredElements) {
                    console.log('✅ [CHAT-SECTION] All required DOM elements found');
                    resolve();
                    return;
                }
                
                attempts++;
                console.log(`🔍 [CHAT-SECTION] Waiting for elements, attempt ${attempts}/${maxAttempts}`, {
                    chatMessages: !!this.chatMessages,
                    messageForm: !!this.messageForm,
                    messageInput: !!this.messageInput
                });
                
                if (attempts >= maxAttempts) {
                    if (!isExcludedPage()) {
                        console.error('❌ [CHAT-SECTION] Timeout waiting for required DOM elements:', {
                            chatMessages: !!this.chatMessages,
                            messageForm: !!this.messageForm,
                            messageInput: !!this.messageInput,
                            isExcludedPage: isExcludedPage(),
                            currentPath: window.location.pathname
                        });
                    }
                    reject(new Error('Required DOM elements not found'));
                    return;
                }
                
                if (!isExcludedPage() && attempts % 5 === 0) {
                    console.log(`⏳ [CHAT-SECTION] Still waiting for DOM elements after ${attempts} attempts`);
                }
                setTimeout(checkElements, 200);
            };
            
            checkElements();
        });
    }
    
    async init() {
        if (this.isInitialized) {
            return;
        }

        document.addEventListener('channelContentLoaded', this.handleChannelContentLoaded);

        if (!this.chatType || !this.targetId) {
            this.chatType = this.detectChatType();
            
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
                    this.mentionHandler.init();
                }, 500);
            } else {
            }
            
            this.chatBot.init();
            
        }

        this.userId = document.querySelector('meta[name="user-id"]')?.getAttribute('content');
        this.username = document.querySelector('meta[name="username"]')?.getAttribute('content');

        const eventDetail = this.initialEventDetail;
        if(eventDetail) {
            this.currentServerName = eventDetail.serverName;
            this.currentServerIcon = eventDetail.serverIcon;
            this.currentChannelName = eventDetail.channelName;
        }

        if (!this.userId) {
            await this.waitForUserId();
        }
    }
    
    handleChannelContentLoaded = (e) => {
        const { detail } = e;
        if (detail.type === 'chat') {
            this.currentServerName = detail.serverName;
            this.currentServerIcon = detail.serverIcon;
            this.currentChannelName = detail.channelName;
            this.initialEventDetail = detail;
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
            console.log('✅ [CHAT-SECTION] Message input event listeners attached');
        } else {
            console.warn('⚠️ [CHAT-SECTION] Message input not found, will retry in 2 seconds');
            // Retry finding and setting up message input after delay
            setTimeout(() => {
                this.findDOMElements();
                if (this.messageInput && !this.messageInput.dataset.listenersAttached) {
                    console.log('🔄 [CHAT-SECTION] Retrying message input setup');
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
                    this.messageInput.dataset.listenersAttached = 'true';
                    console.log('✅ [CHAT-SECTION] Message input event listeners attached on retry');
                }
            }, 2000);
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
        
        document.addEventListener('click', () => {
            const contextMenu = document.getElementById('message-context-menu') || document.getElementById('context-menu');
            if (contextMenu) {
                contextMenu.style.display = 'none';
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
            }, { passive: true });
            console.log('✅ [CHAT-SECTION] Chat scroll listener added with passive mode');
        } else {
            console.warn('⚠️ [CHAT-SECTION] Chat messages container not found for scroll listener');
        }
        
        console.log('✅ [CHAT-SECTION] Event listeners setup complete');
        
        if (this.contextMenu) {
            this.contextMenu.addEventListener('click', (e) => {
                if (e.target.closest('button[data-action]')) {
                    const button = e.target.closest('button[data-action]');
                    const action = button.dataset.action;
                    const messageId = this.contextMenu.dataset.messageId;
                    
                    if (action && messageId) {
                        console.log('🎯 [CHAT-SECTION] Context menu action:', { action, messageId });
                        this.handleMessageActions({
                            target: button,
                            stopPropagation: () => {},
                            preventDefault: () => {}
                        });
                    }
                }
            });
        }
    }
    
    handleMessageActions(e) {
        console.log('🔍 [CHAT-SECTION] Message action clicked:', {
            target: e.target,
            targetClasses: Array.from(e.target.classList),
            targetTagName: e.target.tagName,
            targetDataAction: e.target.dataset?.action,
            targetDataMessageId: e.target.dataset?.messageId,
            isI: e.target.tagName === 'I',
            parentButton: e.target.closest('.bubble-action-button')
        });
        
        let actionButton = null;
        let messageId = null;
        let action = null;
        
        if (e.target.classList.contains('bubble-action-button') || e.target.closest('.bubble-action-button')) {
            actionButton = e.target.classList.contains('bubble-action-button') ? e.target : e.target.closest('.bubble-action-button');
            action = actionButton.dataset.action;
            messageId = actionButton.dataset.messageId;
            
            console.log('✅ [CHAT-SECTION] Detected bubble action button:', {
                button: actionButton,
                action: action,
                messageId: messageId,
                buttonClasses: Array.from(actionButton.classList),
                buttonTitle: actionButton.title
            });
        }
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
        else if (e.target.dataset?.action || e.target.closest('[data-action]')) {
            actionButton = e.target.dataset?.action ? e.target : e.target.closest('[data-action]');
            action = actionButton.dataset.action;
            
            const contextMenu = actionButton.closest('#message-context-menu');
            if (contextMenu && contextMenu.dataset.messageId) {
                messageId = contextMenu.dataset.messageId;
                console.log('✅ [CHAT-SECTION] Detected context menu action:', {
                    button: actionButton,
                    action: action,
                    messageId: messageId,
                    fromContextMenu: true
                });
            } else {
                messageId = actionButton.dataset.messageId;
                console.log('✅ [CHAT-SECTION] Detected data-action element:', {
                    button: actionButton,
                    action: action,
                    messageId: messageId,
                    fromContextMenu: false
                });
            }
        }
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
                case 'more':
                    console.log('🎯 [CHAT-SECTION] MORE ACTION TRIGGERED!', { messageId, button: actionButton });
                    this.showMessageContextMenu(messageId, actionButton);
                    break;
                case 'copy-text':
                    console.log('📋 [CHAT-SECTION] COPY-TEXT ACTION TRIGGERED!', { messageId });
                    this.copyMessageText(messageId);
                    break;
                case 'pin':
                    console.log('📌 [CHAT-SECTION] PIN ACTION TRIGGERED!', { messageId });
                    this.pinMessage(messageId);
                    break;
                case 'text-to-speech':
                    console.log('[CHAT-SECTION] TEXT-TO-SPEECH ACTION TRIGGERED', { messageId, button: actionButton });
                    this.tts.speakMessageText(messageId);
                    break;
                default:
                    console.log('🔄 [CHAT-SECTION] Unhandled action:', action);
                    break;
            }
        } else {
            console.log('⚠️ [CHAT-SECTION] No valid action detected:', {
                action: action,
                messageId: messageId,
                targetElement: e.target,
                hasDataAction: !!e.target.dataset?.action,
                closestDataAction: e.target.closest('[data-action]'),
                closestBubbleButton: e.target.closest('.bubble-action-button')
            });
        }
    }
    
    async loadMessages(options = {}) {
        const { 
            limit = 50, 
            isLoadMore = false, 
            forceFresh = false 
        } = options;
        
        if (this.isLoading && !forceFresh) {
            console.log('⏳ [CHAT-SECTION] Already loading messages, skipping...');
            return;
        }

        this.isLoading = true;
        
        let offset = this.currentOffset || 0;
        
        if (forceFresh || options.isChannelSwitch) {
            this.hasMoreMessages = true;
            this.currentOffset = 0;
            offset = 0;
        }
        

        
        console.log('🔍 [CHAT-SECTION] Starting loadMessages with:', {
            targetId: this.targetId, 
            chatType: this.chatType,
            offset: offset,
            limit: limit,
            isLoadMore: isLoadMore,
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
                offset
            };
            
            if (forceFresh || options.isChannelSwitch) {
                requestOptions.timestamp = Date.now();
                requestOptions.bypass_cache = true;
            }
            
            console.log('📡 [CHAT-SECTION] Making API call to getMessages with options:', requestOptions);
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
                isLoadMore: isLoadMore,
                currentOffset: this.currentOffset
            });



            if (messages.length > 0) {
                this.hideChatSkeleton();
                
                if (isLoadMore) {
                    console.log('📜 [CHAT-SECTION] Prepending older messages (load more)');
                    
                    if (typeof this.messageHandler.prependMessagesProgressively === 'function') {
                        await this.messageHandler.prependMessagesProgressively(messages);
                    } else {
                        console.warn('⚠️ [CHAT-SECTION] Progressive prepend not available, using fallback');
                        await this.messageHandler.prependMessages(messages);
                    }
                    
                    this.currentOffset += messages.length;
                    this.hideLoadMoreProgress(true, `Loaded ${messages.length} older messages`);
                } else {
                    console.log('📝 [CHAT-SECTION] Displaying fresh messages');
                    await this.messageHandler.displayMessages(messages);
                    this.currentOffset = messages.length;
                    this.scrollToBottomIfAppropriate(options.isChannelSwitch);
                }
                
                this.hideEmptyState();
                this.isInitialized = true;
                console.log('✅ [CHAT-SECTION] Messages processed successfully');
            } else {
                this.hideChatSkeleton();
                
                if (!isLoadMore) {
                    console.log('📭 [CHAT-SECTION] No messages found, showing empty state...');
                    this.showEmptyState();
                } else {
                    console.log('📭 [CHAT-SECTION] No more messages to load');
                }
                console.log('📭 [CHAT-SECTION] No messages to display');
            }

            this.updateLoadMoreButton();

        } catch (error) {
            console.error('❌ [CHAT-SECTION] Error loading messages:', error);
            this.hideChatSkeleton();
            
            if (isLoadMore) {
                this.hideLoadMoreProgress(true, 'Failed to load older messages');
            }
            
            this.showNotification('Failed to load messages. Please try again.', 'error');
            
            if (!isLoadMore) {
                this.showEmptyState('Failed to load messages. Please try again.');
            }
        } finally {
            this.isLoading = false;
            console.log('🏁 [CHAT-SECTION] loadMessages completed');
        }
    }
    
    loadMoreMessages() {
        if (!this.hasMoreMessages || this.isLoading) {
            console.log('⚠️ [CHAT-SECTION] Cannot load more messages:', {
                hasMore: this.hasMoreMessages,
                isLoading: this.isLoading
            });
            return;
        }
        
        console.log('📜 [CHAT-SECTION] Loading more messages, offset:', this.currentOffset);
        
        this.showLoadMoreProgress();
        
        this.loadMessages({
            isLoadMore: true,
            limit: 20
        });
    }
    
    showLoadMoreProgress() {
        const loadMoreButton = this.loadMoreButton;
        const loadMoreSkeleton = document.getElementById('load-more-skeleton');
        
        if (loadMoreButton) {
            loadMoreButton.disabled = true;
            
            const content = loadMoreButton.querySelector('.load-more-content');
            const progress = loadMoreButton.querySelector('.load-more-progress');
            const progressText = loadMoreButton.querySelector('.progress-text');
            const progressCount = loadMoreButton.querySelector('.progress-count');
            
            if (content && progress) {
                content.style.display = 'none';
                progress.style.display = 'flex';
                
                if (progressText) progressText.textContent = 'Loading older messages...';
                if (progressCount) progressCount.textContent = '';
            }
        }
        
        if (loadMoreSkeleton) {
            loadMoreSkeleton.classList.remove('hidden');
        }
    }
    
    hideLoadMoreProgress(showStatus = false, statusMessage = '') {
        const loadMoreButton = this.loadMoreButton;
        const loadMoreSkeleton = document.getElementById('load-more-skeleton');
        const loadMoreStatus = document.getElementById('load-more-status');
        
        if (loadMoreSkeleton) {
            loadMoreSkeleton.classList.add('hidden');
        }
        
        if (loadMoreButton) {
            loadMoreButton.disabled = false;
            
            const content = loadMoreButton.querySelector('.load-more-content');
            const progress = loadMoreButton.querySelector('.load-more-progress');
            
            if (content && progress) {
                progress.style.display = 'none';
                content.style.display = 'flex';
            }
        }
        
        if (showStatus && loadMoreStatus && statusMessage) {
            const statusText = loadMoreStatus.querySelector('.status-text');
            if (statusText) statusText.textContent = statusMessage;
            
            loadMoreStatus.classList.remove('hidden');
            loadMoreStatus.classList.add('show');
            
            setTimeout(() => {
                loadMoreStatus.classList.remove('show');
                loadMoreStatus.classList.add('hide');
                setTimeout(() => {
                    loadMoreStatus.classList.add('hidden');
                    loadMoreStatus.classList.remove('hide');
                }, 300);
            }, 2000);
        }
    }
    
    updateLoadMoreButton() {
        if (!this.loadMoreContainer || !this.loadMoreButton) {
            console.log('⚠️ [CHAT-SECTION] Load more elements not found, searching...');
            this.findDOMElements();
        }
        
        if (!this.loadMoreContainer || !this.loadMoreButton) {
            console.warn('⚠️ [CHAT-SECTION] Load more button container not found');
            return;
        }
        

        
        if (this.isLoading) {
            this.loadMoreContainer.classList.add('hidden');
            console.log('🎨 [CHAT-SECTION] Load more button hidden - currently loading');
            return;
        }
        
        this.loadMoreButton.disabled = false;
        const content = this.loadMoreButton.querySelector('.load-more-content');
        const progress = this.loadMoreButton.querySelector('.load-more-progress');
        
        if (content && progress) {
            progress.style.display = 'none';
            content.style.display = 'flex';
        }
        
        if (this.hasMoreMessages) {
            this.loadMoreContainer.classList.remove('hidden');
            console.log('✅ [CHAT-SECTION] Load more button shown');
        } else {
            this.loadMoreContainer.classList.add('hidden');
            console.log('📭 [CHAT-SECTION] Load more button hidden - no more messages');
        }
    }
    
    showLoadingIndicator() {
        console.log('📊 [CHAT-SECTION] Loading indicator requested');
    }
    
    hideLoadingIndicator() {
        console.log('📊 [CHAT-SECTION] Loading indicator hidden');
    }
    
    showEmptyState(message = null) {
        console.log('🎯 [CHAT-SECTION] showEmptyState called with message:', message);
        
        const messagesContainer = this.getMessagesContainer();
        if (!messagesContainer) {
            console.error('❌ [CHAT-SECTION] Cannot show empty state: messages container not found');
            console.log('🔍 [CHAT-SECTION] Available elements:', {
                chatMessages: !!this.chatMessages,
                chatMessagesId: document.getElementById('chat-messages'),
                messagesContainerQuery: document.querySelector('.messages-container')
            });
            return;
        }
        
        console.log('✅ [CHAT-SECTION] Found messages container for empty state:', messagesContainer);
        
        if (!this.emptyStateContainer) {
            this.emptyStateContainer = document.createElement('div');
            this.emptyStateContainer.id = 'empty-state-container';
            this.emptyStateContainer.className = 'flex flex-col items-center justify-center min-h-[400px] text-[#dcddde] p-8';
            this.emptyStateContainer.style.cssText = 'display: flex !important; visibility: visible !important;';
            
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
            <p class="text-lg text-center">${displayMessage}</p>
        `;
        
        this.emptyStateContainer.classList.remove('hidden');
        this.emptyStateContainer.style.display = 'flex';
        
        console.log('✅ [CHAT-SECTION] Empty state displayed with message:', displayMessage);
        console.log('🎨 [CHAT-SECTION] Empty state element:', {
            container: this.emptyStateContainer,
            isVisible: this.emptyStateContainer.offsetWidth > 0 && this.emptyStateContainer.offsetHeight > 0,
            computedDisplay: window.getComputedStyle(this.emptyStateContainer).display,
            computedVisibility: window.getComputedStyle(this.emptyStateContainer).visibility
        });
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
        
        const hasContent = this.messageInput && (this.messageInput.value ? this.messageInput.value.trim().length > 0 : this.messageInput.textContent.trim().length > 0);
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
        
        let messageTextElement = messageElement.querySelector('.bubble-message-text');
        let isBubbleMessage = true;
        
        if (!messageTextElement) {
            messageTextElement = messageElement.querySelector('.message-main-text');
            isBubbleMessage = false;
        }
        
        if (!messageTextElement) {
            console.error('❌ [CHAT-SECTION] Message text element not found');
            return;
        }
        
        let originalContent = messageTextElement.textContent || messageTextElement.innerText || '';
        originalContent = originalContent
            .replace(/\s*\(edited\)\s*$/, '')
            .replace(/\s*ESC to cancel.*$/, '')
            .replace(/\s*press ESC to cancel.*$/, '')
            .replace(/\s*enter to save.*$/, '')
            .trim();
        
        if (!originalContent) {
            console.warn('⚠️ [CHAT-SECTION] No content to edit');
            return;
        }
        
        const editContainer = document.createElement('div');
        editContainer.className = 'edit-message-container w-full';
        
        const editInput = document.createElement('textarea');
        editInput.className = isBubbleMessage 
            ? 'w-full bg-[#2b2d31] text-[#dcddde] rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#5865f2] border border-[#40444b]'
            : 'w-full bg-[#40444b] text-[#dcddde] rounded p-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#5865f2]';
        editInput.value = originalContent;
        editInput.placeholder = 'Edit your message...';
        
        const adjustHeight = () => {
            editInput.style.height = 'auto';
            editInput.style.height = Math.min(editInput.scrollHeight, 200) + 'px';
        };
        editInput.addEventListener('input', adjustHeight);
        
        const editControls = document.createElement('div');
        editControls.className = 'flex items-center justify-between mt-2 text-xs';
        
        const leftControls = document.createElement('div');
        leftControls.className = 'flex items-center gap-2 text-[#b9bbbe]';
        
        const escapeHint = document.createElement('span');
        escapeHint.className = 'edit-hint-text';
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
        
        editContainer.appendChild(editInput);
        editContainer.appendChild(editControls);
        
        const originalHTML = messageTextElement.innerHTML;
        
        messageTextElement.innerHTML = '';
        messageTextElement.appendChild(editContainer);
        
        this.currentEditingMessage = {
            messageId,
            originalContent: originalContent,
            originalHTML: originalHTML,
            element: messageTextElement,
            isBubbleMessage: isBubbleMessage
        };
        
        setTimeout(() => {
            editInput.focus();
            editInput.setSelectionRange(editInput.value.length, editInput.value.length);
            adjustHeight();
        }, 0);
        
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
            console.log('📝 [CHAT-SECTION] Starting edit save for message:', messageId);
            
            this.cancelEditing();
            
            const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
            if (messageElement) {
                const messageTextElement = messageElement.querySelector('.message-main-text, .bubble-message-text');
                if (messageTextElement) {
                    messageTextElement.innerHTML = this.formatMessageContent(newContent);
                    
                    let editedBadge = messageElement.querySelector('.edited-badge, .bubble-edited-badge');
                    if (!editedBadge) {
                        editedBadge = document.createElement('span');
                        editedBadge.className = 'edited-badge text-xs text-[#a3a6aa] ml-1';
                        editedBadge.textContent = '(edited)';
                        messageTextElement.appendChild(editedBadge);
                    }
                    
                    messageElement.classList.add('message-editing-pending');
                }
            }
            
            const targetType = this.chatType === 'channel' ? 'channel' : 'dm';
            const targetId = this.targetId;
            
            const editData = {
                message_id: messageId,
                content: newContent,
                user_id: window.globalSocketManager?.userId || null,
                username: window.globalSocketManager?.username || 'Unknown',
                target_type: targetType,
                target_id: targetId,
                source: 'edit-update'
            };
            
            console.log('📡 [CHAT-SECTION] Broadcasting edit to socket:', editData);
            if (window.globalSocketManager && window.globalSocketManager.isReady()) {
                window.globalSocketManager.io.emit('message-edit-temp', editData);
            }
            
            console.log('💾 [CHAT-SECTION] Saving edit to database via HTTP...');
            const response = await fetch(`/api/messages/${messageId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: newContent })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                if (messageElement) {
                    messageElement.classList.remove('message-editing-pending');
                    messageElement.classList.add('message-edit-success');
                    setTimeout(() => {
                        messageElement.classList.remove('message-edit-success');
                    }, 2000);
                }
                console.log('✅ [CHAT-SECTION] Edit saved successfully');
            } else {
                throw new Error(result.message || 'Database edit failed');
            }
            
        } catch (error) {
            console.error('❌ [CHAT-SECTION] Error saving edit:', error);
            
            if (this.currentEditingMessage) {
                const { element, originalContent } = this.currentEditingMessage;
                element.innerHTML = this.formatMessageContent(originalContent);
                this.currentEditingMessage = null;
            }
            
            const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
            if (messageElement) {
                messageElement.classList.remove('message-editing-pending');
                messageElement.classList.add('message-edit-failed');
                setTimeout(() => {
                    messageElement.classList.remove('message-edit-failed');
                }, 5000);
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
        messageElement.classList.remove('message-temp-edit', 'message-editing-pending');
        messageElement.style.opacity = '1';
        delete messageElement.dataset.tempEditId;
        
        const tempIndicator = messageElement.querySelector('.temp-edit-indicator');
        if (tempIndicator) {
            tempIndicator.remove();
        }
        
        console.log('✅ [CHAT-SECTION] Edit confirmed and temp styling removed');
    }
    
    markEditAsFailed(messageElement, error) {
        messageElement.classList.remove('message-temp-edit', 'message-editing-pending');
        messageElement.classList.add('message-edit-failed');
        messageElement.style.opacity = '0.6';
        messageElement.style.borderLeft = '3px solid #ed4245';
        
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
        
        this.cleanupDeleteModals();
        this.showDeleteConfirmModal(messageId);
    }

    cleanupDeleteModals() {
        const existingModals = document.querySelectorAll('#delete-message-modal');
        existingModals.forEach(modal => {
            if (modal && modal.parentNode) {
                modal.classList.add('closing');
                setTimeout(() => {
                    if (modal && modal.parentNode) {
                        modal.remove();
                    }
                }, 300);
            }
        });
        
        const keydownHandlers = document._deleteModalHandlers || [];
        keydownHandlers.forEach(handler => {
            document.removeEventListener('keydown', handler);
        });
        document._deleteModalHandlers = [];
        
        console.log('🧹 [CHAT-SECTION] Cleaned up any existing delete modals');
    }
    
    showDeleteConfirmModal(messageId) {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (!messageElement) {
            console.error('❌ [CHAT-SECTION] Message element not found for deletion');
            return;
        }

        const existingModal = document.getElementById('delete-message-modal');
        if (existingModal) {
            existingModal.remove();
        }

        let messageText = 'this message';
        const messageTextElement = messageElement.querySelector('.bubble-message-text, .message-main-text');
        if (messageTextElement) {
            const content = messageTextElement.textContent || '';
            messageText = content.length > 50 ? content.substring(0, 50) + '...' : content;
        }
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
        modal.id = 'delete-message-modal';
        
        modal.innerHTML = `
            <div class="bg-[#313338] rounded-lg p-6 max-w-md mx-4 text-center">
                <div class="mb-4">
                    <i class="fas fa-trash text-4xl text-red-500 mb-3"></i>
                    <h3 class="text-xl font-bold text-white mb-2">Delete Message</h3>
                    <p class="text-[#b9bbbe] text-sm mb-4">
                        Are you sure you want to delete <span class="text-white font-medium">"${messageText}"</span>?
                    </p>
                    <p class="text-red-400 text-xs">This action cannot be undone.</p>
                </div>
                <div class="flex gap-3 justify-center">
                    <button id="cancel-delete" class="px-4 py-2 bg-[#4f545c] text-white rounded hover:bg-[#5c6169] transition-colors">
                        Cancel
                    </button>
                    <button id="confirm-delete" class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
                        <i class="fas fa-trash mr-2"></i>Delete
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const cancelBtn = modal.querySelector('#cancel-delete');
        const confirmBtn = modal.querySelector('#confirm-delete');
        
        const closeModal = () => {
            if (modal && modal.parentNode) {
                modal.classList.add('closing');
                setTimeout(() => {
                    if (modal && modal.parentNode) {
                        modal.remove();
                    }
                }, 300);
            }
            document.removeEventListener('keydown', escapeHandler);
            
            const handlerIndex = document._deleteModalHandlers?.indexOf(escapeHandler);
            if (handlerIndex !== -1) {
                document._deleteModalHandlers.splice(handlerIndex, 1);
            }
        };

        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        };
        
        if (!document._deleteModalHandlers) {
            document._deleteModalHandlers = [];
        }
        document._deleteModalHandlers.push(escapeHandler);
        
        cancelBtn.addEventListener('click', closeModal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        confirmBtn.addEventListener('click', async () => {
            closeModal();
            await this.deleteMessage(messageId);
        });
        
        document.addEventListener('keydown', escapeHandler);
        
        modal.addEventListener('animationend', (e) => {
            if (e.animationName === 'modalFadeOut') {
                closeModal();
            }
        });
    }
    
    async deleteMessage(messageId) {
        if (!messageId) return;
        
        try {
            console.log('🗑️ [CHAT-SECTION] Starting delete for message:', messageId);
            
            const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
            if (!messageElement) {
                console.warn('⚠️ [CHAT-SECTION] Message element not found in DOM for ID:', messageId);
                this.showNotification('Message not found in current view', 'error');
                return;
            }
            
            messageElement.classList.add('message-deleting-pending');
            messageElement.style.opacity = '0.5';
            
            const deleteIndicator = document.createElement('span');
            deleteIndicator.className = 'delete-indicator text-xs text-orange-400 ml-2';
            deleteIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
            
            const messageTextElement = messageElement.querySelector('.bubble-message-text, .message-main-text');
            if (messageTextElement && !messageTextElement.querySelector('.delete-indicator')) {
                messageTextElement.appendChild(deleteIndicator);
            }
            
            const targetType = this.chatType === 'channel' ? 'channel' : 'dm';
            const targetId = this.targetId;
            
            const deleteData = {
                message_id: messageId,
                user_id: window.globalSocketManager?.userId || null,
                username: window.globalSocketManager?.username || 'Unknown',
                target_type: targetType,
                target_id: targetId,
                source: 'delete-action'
            };
            
            console.log('📡 [CHAT-SECTION] Broadcasting delete to socket first:', deleteData);
            if (window.globalSocketManager && window.globalSocketManager.isReady()) {
                window.globalSocketManager.io.emit('message-deleted', deleteData);
                console.log('✅ [CHAT-SECTION] Delete event emitted successfully');
            } else {
                console.warn('⚠️ [CHAT-SECTION] Socket not ready for deletion broadcast');
            }
            
            if (!window.ChatAPI) {
                throw new Error('ChatAPI not initialized');
            }
            
            console.log('💾 [CHAT-SECTION] Deleting message via HTTP...');
            const response = await window.ChatAPI.deleteMessage(messageId);
            
            if (response.success) {
                console.log('✅ [CHAT-SECTION] Message deleted successfully from database');
                
                if (messageElement) {
                    messageElement.classList.remove('message-deleting-pending');
                    messageElement.classList.add('message-delete-success');
                    
                    setTimeout(() => {
                        const messageGroup = messageElement.closest('.bubble-message-group, .message-group');
                        
                        if (messageGroup && messageGroup.querySelectorAll('.bubble-message-content, .message-content').length === 1) {
                            messageGroup.remove();
                        } else {
                            messageElement.remove();
                        }
                        
                        this.messageHandler.processedMessageIds.delete(messageId);
                        
                        const remainingMessages = this.getMessagesContainer().querySelectorAll('.bubble-message-group, .message-group');
                        if (remainingMessages.length === 0) {
                            this.showEmptyState();
                        }
                    }, 500);
                }
            } else {
                throw new Error(response.message || 'Delete failed');
            }
            
        } catch (error) {
            console.error('❌ [CHAT-SECTION] Error deleting message:', error);
            
            const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
            
            if (error.message && error.message.includes('404')) {
                console.warn('🔄 [CHAT-SECTION] Message already deleted by someone else');
                
                if (messageElement) {
                    messageElement.classList.remove('message-deleting-pending');
                    messageElement.style.opacity = '0.3';
                    
                    const deleteIndicator = messageElement.querySelector('.delete-indicator');
                    if (deleteIndicator) {
                        deleteIndicator.className = 'delete-success-indicator text-xs text-green-400 ml-2';
                        deleteIndicator.innerHTML = '<i class="fas fa-check"></i> Already deleted';
                    }
                    
                    setTimeout(() => {
                        const messageGroup = messageElement.closest('.bubble-message-group, .message-group');
                        if (messageGroup && messageGroup.querySelectorAll('.bubble-message-content, .message-content').length === 1) {
                            messageGroup.remove();
                        } else {
                            messageElement.remove();
                        }
                        this.messageHandler.processedMessageIds.delete(messageId);
                    }, 1000);
                }
                
                this.showNotification('Message was already deleted', 'info');
            } else {
                if (messageElement) {
                    messageElement.classList.remove('message-deleting-pending');
                    messageElement.classList.add('message-delete-failed');
                    messageElement.style.opacity = '0.6';
                    
                    const deleteIndicator = messageElement.querySelector('.delete-indicator');
                    if (deleteIndicator) {
                        deleteIndicator.className = 'delete-error-indicator text-xs text-red-400 ml-2';
                        deleteIndicator.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Delete failed';
                        deleteIndicator.title = `Delete failed: ${error.message}`;
                    }
                    
                    setTimeout(() => {
                        messageElement.classList.remove('message-delete-failed');
                        messageElement.style.opacity = '1';
                        if (deleteIndicator) {
                            deleteIndicator.remove();
                        }
                    }, 5000);
                }
                
                this.showNotification('Failed to delete message. Please try again.', 'error');
            }
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
            this.isAutoScrolling = true;
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
            this.userHasScrolled = false;
            setTimeout(() => {
                this.isAutoScrolling = false;
            }, 100);
        } catch (error) {
            console.error('❌ [CHAT-SECTION] Failed to scroll to bottom:', error);
            this.isAutoScrolling = false;
        }
    }
    
    scrollToBottomIfAppropriate(isChannelSwitch = false) {
        if (!this.chatMessages) return;
        
        if (isChannelSwitch) {
            this.scrollToBottom();
            return;
        }
        
        if (!this.userHasScrolled) {
            this.scrollToBottom();
            return;
        }
        
        const { scrollTop, scrollHeight, clientHeight } = this.chatMessages;
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50;
        
        if (isNearBottom) {
            this.scrollToBottom();
        }
    }
    
    scrollToBottomIfNeeded() {
        if (!this.chatMessages || this.isAutoScrolling) {
            return;
        }
        
        try {
            const { scrollTop, scrollHeight, clientHeight } = this.chatMessages;
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
            
            if (isAtBottom && !this.userHasScrolled) {
                this.scrollToBottom();
            }
        } catch (error) {
            console.error('❌ [CHAT-SECTION] Failed to check scroll position:', error);
        }
    }
    
    scrollToMessage(messageId, fromNotification = false) {
        if (!messageId) return;
        
        if (window.messageHighlighter) {
            console.log('🎯 [CHAT-SECTION] Using message highlighter for message:', messageId);
            return window.messageHighlighter.highlightMessage(messageId, fromNotification);
        }
        
        console.log('⚠️ [CHAT-SECTION] Message highlighter not available, using fallback');
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            messageElement.classList.add('highlight-message');
            setTimeout(() => {
                messageElement.classList.remove('highlight-message');
            }, 2000);
            return true;
        }
        return false;
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
        
        const messageContainers = [
            this.chatMessages,
            document.querySelector('#chat-messages'),
            document.querySelector('.chat-messages'),
            document.querySelector('.message-container'),
            document.querySelector('[data-message-container]'),
            document.querySelector('.messages-container')
        ];
        
        messageContainers.forEach(container => {
            if (container) {
                const messagesContainer = container.querySelector('.messages-container');
                if (messagesContainer) {
                    messagesContainer.innerHTML = '';
                } else {
                    container.innerHTML = '';
                }
            }
        });
        
        this.userHasScrolled = false;
        this.lastScrollPosition = 0;
        
        if (this.emptyStateContainer) {
            this.emptyStateContainer.remove();
            this.emptyStateContainer = null;
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
        
        console.log('✅ [CHAT-SECTION] All message containers cleared and reset');
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

    async ensureInitialized() {
        if (!this.messageHandler) {
            console.log('📋 [CHAT-SECTION] Initializing fresh message handler');
            this.messageHandler = new MessageHandler(this);
        } else {
            console.log('📋 [CHAT-SECTION] Message handler exists, ensuring clean state');
            this.messageHandler.clearProcessedMessages();
        }
        
        if (!this.sendReceiveHandler) {
            console.log('📋 [CHAT-SECTION] Initializing send receive handler');
            this.sendReceiveHandler = new SendReceiveHandler(this);
        }
        
        if (!this.socketHandler) {
            console.log('📋 [CHAT-SECTION] Initializing socket handler');
            this.socketHandler = new SocketHandler(this);
        }
        
        this.findDOMElements();
        this.setupEventListeners();
        this.setupHandlers();
        
        this.isInitialized = true;
        console.log('✅ [CHAT-SECTION] Full initialization completed with clean message handler state');
    }

    async switchToChannel(channelId, channelType = 'text', forceFresh = false) {
        console.log('🔄 [CHAT-SECTION] Switching to channel:', channelId, channelType, 'forceFresh:', forceFresh);
        
        if (this.loadMoreContainer) {
            this.loadMoreContainer.classList.add('hidden');
            console.log('🧹 [CHAT-SECTION] Load more container hidden at start of channel switch');
        }
        
        this.forceStopAllOperations();
        
        this.targetId = channelId;
        this.chatType = 'channel';
        
        const messagesContainer = this.getMessagesContainer();
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
            console.log('🧹 [CHAT-SECTION] Messages container cleared for channel switch');
        }
        
        await this.ensureInitialized();
        
        this.fullStateReset();
        
        if (this.socketHandler && typeof this.socketHandler.refreshForChannelSwitch === 'function') {
            console.log('🔄 [CHAT-SECTION] Refreshing socket handler for channel switch');
            this.socketHandler.refreshForChannelSwitch(channelId, 'channel');
        }
        
        this.joinSocketRoom();
        
        await this.loadMessages({ 
            forceFresh: true, 
            isChannelSwitch: true,
            limit: 50 
        });
        
        this.updateChannelHeader();
        
        if (window.emojiReactions && typeof window.emojiReactions.updateChannelContext === 'function') {
            console.log('🔄 [CHAT-SECTION] Updating emoji reactions context for new channel');
            window.emojiReactions.updateChannelContext(channelId, 'channel');
        }
        
        console.log('✅ [CHAT-SECTION] Channel switch completed');
    }

    resetForNewChannel() {
        console.log('🔄 [CHAT-SECTION] Resetting for new channel...');
        
        this.cleanupDeleteModals();
        
        this.forceStopAllOperations();
        this.clearChatMessages();
        this.hideEmptyState();
        this.hideLoadingIndicator();
        
        this.lastLoadedMessageId = null;
        this.hasMoreMessages = true;
        this.userHasScrolled = false;
        this.lastScrollPosition = 0;
        
        if (this.messageHandler) {
            this.messageHandler.processedMessageIds.clear();
            this.messageHandler.temporaryMessages.clear();
        }
        
        console.log('✅ [CHAT-SECTION] Channel reset completed');
    }
    
    forceStopAllOperations() {
        this.isLoading = false;
        
        if (this.scrollEventDebounceTimer) {
            clearTimeout(this.scrollEventDebounceTimer);
            this.scrollEventDebounceTimer = null;
        }
        
        this.leaveCurrentSocketRoom();
        
        if (this.loadMoreContainer) {
            this.loadMoreContainer.classList.add('hidden');
            console.log('🧹 [CHAT-SECTION] Load more container hidden during force stop');
        }
        
        if (this.loadMoreButton) {
            this.loadMoreButton.remove();
            this.loadMoreButton = null;
        }
        
        if (this.topReloadButton) {
            this.topReloadButton.remove();
            this.topReloadButton = null;
        }
        
        if (this.emptyStateContainer) {
            this.emptyStateContainer.remove();
            this.emptyStateContainer = null;
        }
    }
    
    fullStateReset() {
        this.cleanupDeleteModals();
        this.clearChatMessages();
        this.hideEmptyState();
        
        if (this.messageHandler) {
            this.messageHandler.clearProcessedMessages();
        }
        
        this.hasMoreMessages = true;
        this.lastLoadedMessageId = null;
        this.currentOffset = 0;
        this.replyingTo = null;
        this.currentEditingMessage = null;
        this.isInitialized = false;
        this.userHasScrolled = false;
        this.lastScrollPosition = 0;
        this.isAutoScrolling = false;
        this.scrollEventDebounceTimer = null;
        
        if (this.loadMoreContainer) {
            this.loadMoreContainer.classList.add('hidden');
            console.log('🧹 [CHAT-SECTION] Load more button hidden during state reset');
        }
        
        console.log('✅ [CHAT-SECTION] Full state reset completed');
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
        if (!this.chatMessages || this.isAutoScrolling) return;
        
        clearTimeout(this.scrollEventDebounceTimer);
        this.scrollEventDebounceTimer = setTimeout(() => {
            const { scrollTop, scrollHeight, clientHeight } = this.chatMessages;
            const isAtTop = scrollTop <= 10;
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
            
            if (Math.abs(scrollTop - this.lastScrollPosition) > 5) {
                this.userHasScrolled = true;
            }
            
            if (isAtBottom) {
                this.userHasScrolled = false;
            }
            
            this.lastScrollPosition = scrollTop;
            
            if (isAtTop && this.hasMoreMessages && !this.isLoading) {
                this.showTopReloadButton();
            } else {
                this.hideTopReloadButton();
            }
        }, 50);
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
        console.log('📜 [CHAT-SECTION] Load older messages redirected to load more messages');
        this.loadMoreMessages();
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

    handleNewMessageScroll(isOwnMessage = false) {
        if (!this.chatMessages) return;
        
        if (isOwnMessage) {
            this.scrollToBottom();
            return;
        }
        
        if (!this.userHasScrolled) {
            this.scrollToBottom();
            return;
        }
        
        const { scrollTop, scrollHeight, clientHeight } = this.chatMessages;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 20;
        
        if (isAtBottom) {
            this.scrollToBottom();
        }
    }

    initializeChatSkeleton() {
        setTimeout(() => {
            this.hideChatSkeleton();
        }, 1500);
    }
    
    hideChatSkeleton() {
        const skeletonContainer = document.getElementById('chat-skeleton-loading');
        const realContent = document.getElementById('chat-real-content');
        
        if (skeletonContainer) {
            skeletonContainer.style.display = 'none';
        }
        
        if (realContent) {
            realContent.style.display = 'block';
        }
    }
    
    showChatSkeleton() {
        const skeletonContainer = document.getElementById('chat-skeleton-loading');
        const realContent = document.getElementById('chat-real-content');
        
        if (skeletonContainer) {
            skeletonContainer.style.display = 'block';
        }
        
        if (realContent) {
            realContent.style.display = 'none';
        }
    }


    
    showMessageContextMenu(messageId, triggerElement) {
        console.log('📋 [CHAT-SECTION] Showing context menu for message:', messageId, 'trigger:', triggerElement);
        
        const contextMenu = document.getElementById('message-context-menu');
        if (!contextMenu) {
            console.error('❌ [CHAT-SECTION] Context menu not found in DOM');
            return;
        }
        
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (!messageElement) {
            console.error('❌ [CHAT-SECTION] Message element not found for ID:', messageId);
            return;
        }
        
        contextMenu.dataset.messageId = messageId;
        
        console.log('🎯 [CHAT-SECTION] Context menu before showing:', {
            isHidden: contextMenu.classList.contains('hidden'),
            display: contextMenu.style.display,
            visibility: contextMenu.style.visibility,
            position: contextMenu.style.position
        });
        
        contextMenu.classList.remove('hidden');
        contextMenu.style.display = 'block';
        contextMenu.style.visibility = 'visible';
        contextMenu.style.position = 'fixed';
        contextMenu.style.zIndex = '9999';
        
        const rect = triggerElement.getBoundingClientRect();
        console.log('🎯 [CHAT-SECTION] Trigger element rect:', rect);
        
        const menuWidth = 200;
        const menuHeight = 350;
        
        let left = rect.right + 10;
        let top = rect.top;
        
        if (left + menuWidth > window.innerWidth) {
            left = rect.left - menuWidth - 10;
        }
        
        if (top + menuHeight > window.innerHeight) {
            top = window.innerHeight - menuHeight - 20;
        }
        
        if (left < 10) left = 10;
        if (top < 10) top = 10;
        
        contextMenu.style.left = `${left}px`;
        contextMenu.style.top = `${top}px`;
        
        console.log('✅ [CHAT-SECTION] Context menu positioned at:', {
            left: left + 'px',
            top: top + 'px',
            isVisible: !contextMenu.classList.contains('hidden'),
            computedStyle: window.getComputedStyle(contextMenu).display
        });
        
        if (this.activeContextMenuCloseHandler) {
            document.removeEventListener('click', this.activeContextMenuCloseHandler);
        }
        
        this.activeContextMenuCloseHandler = (e) => {
            if (!contextMenu.contains(e.target) && !triggerElement.contains(e.target)) {
                console.log('🔒 [CHAT-SECTION] Closing context menu - clicked outside');
                contextMenu.classList.add('hidden');
                contextMenu.style.display = 'none';
                document.removeEventListener('click', this.activeContextMenuCloseHandler);
                this.activeContextMenuCloseHandler = null;
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', this.activeContextMenuCloseHandler);
        }, 50);
        
        console.log('✅ [CHAT-SECTION] Context menu setup complete');
    }
    
    copyMessageText(messageId) {
        console.log('📋 [CHAT-SECTION] Copying message text:', messageId);
        
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (!messageElement) {
            console.error('❌ [CHAT-SECTION] Message element not found');
            return;
        }
        
        const textElement = messageElement.querySelector('.bubble-message-text, .message-main-text');
        if (!textElement) {
            console.error('❌ [CHAT-SECTION] Message text element not found');
            return;
        }
        
        let messageText = textElement.textContent || textElement.innerText || '';
        messageText = messageText.replace(/\s*\(edited\)\s*$/, '').trim();
        
        if (!messageText) {
            console.warn('⚠️ [CHAT-SECTION] No text content to copy');
            this.showNotification('No text to copy', 'warning');
            return;
        }
        
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(messageText).then(() => {
                console.log('✅ [CHAT-SECTION] Text copied to clipboard using Clipboard API');
                this.showNotification('Message text copied to clipboard', 'success');
            }).catch(error => {
                console.error('❌ [CHAT-SECTION] Failed to copy using Clipboard API:', error);
                this.fallbackCopyText(messageText);
            });
        } else {
            this.fallbackCopyText(messageText);
        }
        
        const contextMenu = document.getElementById('message-context-menu');
        if (contextMenu) {
            contextMenu.classList.add('hidden');
        }
    }
    
    fallbackCopyText(text) {
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (successful) {
                console.log('✅ [CHAT-SECTION] Text copied using fallback method');
                this.showNotification('Message text copied to clipboard', 'success');
            } else {
                throw new Error('Copy command failed');
            }
        } catch (error) {
            console.error('❌ [CHAT-SECTION] Fallback copy failed:', error);
            this.showNotification('Failed to copy text to clipboard', 'error');
        }
    }
    
    pinMessage(messageId) {
        console.log('📌 [CHAT-SECTION] Pinning message:', messageId);
        
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (!messageElement) {
            console.error('❌ [CHAT-SECTION] Message element not found');
            return;
        }
        
        const existingPin = messageElement.querySelector('.pin-icon, .pinned-indicator');
        if (existingPin) {
            console.log('📌 [CHAT-SECTION] Message already pinned, unpinning...');
            this.unpinMessage(messageId);
            return;
        }
        
        const targetType = this.chatType === 'channel' ? 'channel' : 'dm';
        const targetId = this.targetId;
        
        console.log('📡 [CHAT-SECTION] Sending pin request to server...');
        if (window.globalSocketManager && window.globalSocketManager.isReady()) {
            const pinData = {
                message_id: messageId,
                user_id: window.globalSocketManager.userId,
                username: window.globalSocketManager.username,
                target_type: targetType,
                target_id: targetId,
                action: 'pin'
            };
            
            window.globalSocketManager.io.emit('message-pinned', pinData);
            console.log('✅ [CHAT-SECTION] Pin event emitted');
        }
        
        const pinIcon = document.createElement('span');
        pinIcon.className = 'pin-icon ml-2';
        pinIcon.innerHTML = '<i class="fas fa-thumbtack text-xs text-[#faa61a]"></i>';
        pinIcon.title = 'Pinned message';
        
        const messageHeader = messageElement.querySelector('.bubble-header, .message-header');
        if (messageHeader && !messageHeader.querySelector('.pin-icon')) {
            messageHeader.appendChild(pinIcon);
        }
        
        const contextMenu = document.getElementById('message-context-menu');
        if (contextMenu) {
            contextMenu.classList.add('hidden');
        }
        
        this.showNotification('Message pinned', 'success');
        console.log('✅ [CHAT-SECTION] Message pinned locally');
    }
    
    unpinMessage(messageId) {
        console.log('📌 [CHAT-SECTION] Unpinning message:', messageId);
        
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (!messageElement) {
            console.error('❌ [CHAT-SECTION] Message element not found');
            return;
        }
        
        const targetType = this.chatType === 'channel' ? 'channel' : 'dm';
        const targetId = this.targetId;
        
        console.log('📡 [CHAT-SECTION] Sending unpin request to server...');
        if (window.globalSocketManager && window.globalSocketManager.isReady()) {
            const unpinData = {
                message_id: messageId,
                user_id: window.globalSocketManager.userId,
                username: window.globalSocketManager.username,
                target_type: targetType,
                target_id: targetId,
                action: 'unpin'
            };
            
            window.globalSocketManager.io.emit('message-unpinned', unpinData);
            console.log('✅ [CHAT-SECTION] Unpin event emitted');
        }
        
        const pinIcon = messageElement.querySelector('.pin-icon, .pinned-indicator');
        if (pinIcon) {
            pinIcon.remove();
        }
        
        this.showNotification('Message unpinned', 'success');
        console.log('✅ [CHAT-SECTION] Message unpinned locally');
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

window.debugDeleteModal = function() {
    console.log('🧪 [DEBUG-MODAL] Testing delete modal functionality...');
    
    const existingModals = document.querySelectorAll('#delete-message-modal');
    console.log('🧪 [DEBUG-MODAL] Found existing modals:', existingModals.length);
    
    const deleteHandlers = document._deleteModalHandlers || [];
    console.log('🧪 [DEBUG-MODAL] Active delete handlers:', deleteHandlers.length);
    
    if (window.chatSection && typeof window.chatSection.cleanupDeleteModals === 'function') {
        console.log('🧪 [DEBUG-MODAL] Running cleanup...');
        window.chatSection.cleanupDeleteModals();
        console.log('🧪 [DEBUG-MODAL] Cleanup completed');
    } else {
        console.log('❌ [DEBUG-MODAL] Chat section or cleanup method not available');
    }
    
    const messageElements = document.querySelectorAll('[data-message-id]');
    console.log('🧪 [DEBUG-MODAL] Found message elements:', messageElements.length);
    
    if (messageElements.length > 0) {
        const testMessageId = messageElements[0].dataset.messageId;
        console.log('🧪 [DEBUG-MODAL] Test message ID:', testMessageId);
        
        if (window.chatSection && typeof window.chatSection.showDeleteConfirmModal === 'function') {
            console.log('🧪 [DEBUG-MODAL] Testing modal creation for message:', testMessageId);
            window.chatSection.showDeleteConfirmModal(testMessageId);
        }
    }
};

window.debugDeleteFlow = function() {
    console.log('🗑️ [DEBUG-DELETE] Testing complete delete flow...');
    
    if (!window.chatSection) {
        console.error('❌ [DEBUG-DELETE] No chat section available');
        return;
    }
    
    const messages = document.querySelectorAll('[data-message-id]');
    if (messages.length === 0) {
        console.error('❌ [DEBUG-DELETE] No messages found to test delete');
        return;
    }
    
    const testMessage = messages[0];
    const messageId = testMessage.dataset.messageId;
    
    console.log('🧪 [DEBUG-DELETE] Testing delete flow for message:', messageId);
    console.log('🧪 [DEBUG-DELETE] Current chat:', {
        type: window.chatSection.chatType,
        targetId: window.chatSection.targetId,
        socketReady: window.globalSocketManager?.isReady(),
        socketRoomJoined: window.chatSection.socketRoomJoined
    });
    
    const deleteData = {
        message_id: messageId,
        user_id: 'other-test-user',
        username: 'OtherTestUser',
        target_type: window.chatSection.chatType === 'channel' ? 'channel' : 'dm',
        target_id: window.chatSection.targetId,
        source: 'debug-test'
    };
    
    console.log('📡 [DEBUG-DELETE] Simulating delete event from another user:', deleteData);
    
    if (window.chatSection.socketHandler) {
        window.chatSection.socketHandler.handleMessageDeleted(deleteData);
        console.log('✅ [DEBUG-DELETE] Delete event processed via socket handler');
    } else {
        console.error('❌ [DEBUG-DELETE] Socket handler not available');
    }
};

window.testDeleteSystemIntegration = function() {
    console.log('🧪 [TEST-DELETE] Running complete delete system integration test...');
    
    const testResults = {
        socketConnection: false,
        chatSectionReady: false,
        messageHandlerReady: false,
        socketHandlerReady: false,
        roomJoined: false,
        deleteEventSending: false,
        deleteEventReceiving: false
    };
    
    testResults.socketConnection = window.globalSocketManager?.isReady() || false;
    testResults.chatSectionReady = !!window.chatSection;
    testResults.messageHandlerReady = !!window.chatSection?.messageHandler;
    testResults.socketHandlerReady = !!window.chatSection?.socketHandler;
    testResults.roomJoined = window.chatSection?.socketRoomJoined || false;
    
    if (window.globalSocketManager?.io) {
        try {
            const testData = {
                message_id: 'test-123',
                user_id: 'test-user',
                username: 'TestUser',
                target_type: 'channel',
                target_id: '1',
                source: 'integration-test'
            };
            
            window.globalSocketManager.io.emit('message-deleted', testData);
            testResults.deleteEventSending = true;
            console.log('✅ [TEST-DELETE] Delete event sending works');
        } catch (error) {
            console.error('❌ [TEST-DELETE] Delete event sending failed:', error);
        }
        
        if (window.chatSection?.socketHandler?.handleMessageDeleted) {
            try {
                const testReceiveData = {
                    message_id: 'test-receive-456',
                    user_id: 'other-user',
                    username: 'OtherUser',
                    target_type: window.chatSection.chatType,
                    target_id: window.chatSection.targetId,
                    source: 'integration-test'
                };
                
                window.chatSection.socketHandler.handleMessageDeleted(testReceiveData);
                testResults.deleteEventReceiving = true;
                console.log('✅ [TEST-DELETE] Delete event receiving works');
            } catch (error) {
                console.error('❌ [TEST-DELETE] Delete event receiving failed:', error);
            }
        }
    }
    
    console.log('📊 [TEST-DELETE] Integration test results:', testResults);
    
    const allPassed = Object.values(testResults).every(result => result === true);
    if (allPassed) {
        console.log('🎉 [TEST-DELETE] All integration tests passed! Delete system should work.');
    } else {
        console.log('⚠️ [TEST-DELETE] Some tests failed. Check the failing components above.');
    }
    
    return testResults;
};
  
  export default ChatSection;

export { initializeChatSection };

window.debugThreeDotsMenu = function() {
    console.log('🧪 [DEBUG-MENU] Testing three dots menu functionality...');
    
    const threeDotsButtons = document.querySelectorAll('[data-action="more"]');
    console.log('🔍 [DEBUG-MENU] Found three dots buttons:', threeDotsButtons.length);
    
    threeDotsButtons.forEach((button, index) => {
        console.log(`🔍 [DEBUG-MENU] Button ${index + 1}:`, {
            messageId: button.dataset.messageId,
            hasEventListener: button.onclick !== null,
            isVisible: button.offsetWidth > 0 && button.offsetHeight > 0,
            buttonElement: button,
            parentActions: button.closest('.bubble-message-actions')
        });
    });
    
    const contextMenu = document.getElementById('message-context-menu');
    console.log('🔍 [DEBUG-MENU] Context menu element:', {
        exists: !!contextMenu,
        isVisible: contextMenu ? !contextMenu.classList.contains('hidden') : false,
        position: contextMenu ? {
            left: contextMenu.style.left,
            top: contextMenu.style.top
        } : null
    });
    
    if (window.chatSection) {
        console.log('✅ [DEBUG-MENU] Chat section available for testing');
        
        const firstButton = threeDotsButtons[0];
        if (firstButton) {
            console.log('🧪 [DEBUG-MENU] Testing first three dots button click...');
            try {
                firstButton.click();
                console.log('✅ [DEBUG-MENU] Three dots button clicked successfully');
                
                setTimeout(() => {
                    const contextMenuAfterClick = document.getElementById('message-context-menu');
                    console.log('🧪 [DEBUG-MENU] Context menu after click:', {
                        isVisible: contextMenuAfterClick ? !contextMenuAfterClick.classList.contains('hidden') : false,
                        display: contextMenuAfterClick ? contextMenuAfterClick.style.display : 'N/A',
                        position: contextMenuAfterClick ? {
                            left: contextMenuAfterClick.style.left,
                            top: contextMenuAfterClick.style.top
                        } : null
                    });
                }, 100);
            } catch (error) {
                console.error('❌ [DEBUG-MENU] Three dots button test failed:', error);
            }
        }
        
        if (firstButton && window.chatSection.showMessageContextMenu) {
            console.log('🧪 [DEBUG-MENU] Testing direct showMessageContextMenu call...');
            try {
                const messageId = firstButton.dataset.messageId;
                window.chatSection.showMessageContextMenu(messageId, firstButton);
                console.log('✅ [DEBUG-MENU] Direct context menu call completed');
            } catch (error) {
                console.error('❌ [DEBUG-MENU] Direct context menu call failed:', error);
            }
        }
    } else {
        console.warn('⚠️ [DEBUG-MENU] Chat section not available');
    }
};

window.debugContextMenuActions = function() {
    console.log('🧪 [DEBUG-MENU] Testing context menu actions...');
    
    const testMessageId = 'test-message-123';
    
    if (window.chatSection) {
        console.log('🧪 [DEBUG-MENU] Testing copy text...');
        try {
            if (typeof window.chatSection.copyMessageText === 'function') {
                console.log('✅ [DEBUG-MENU] Copy text method available');
            } else {
                console.error('❌ [DEBUG-MENU] Copy text method not found');
            }
        } catch (error) {
            console.error('❌ [DEBUG-MENU] Copy text test failed:', error);
        }
        
        console.log('🧪 [DEBUG-MENU] Testing pin message...');
        try {
            if (typeof window.chatSection.pinMessage === 'function') {
                console.log('✅ [DEBUG-MENU] Pin message method available');
            } else {
                console.error('❌ [DEBUG-MENU] Pin message method not found');
            }
        } catch (error) {
            console.error('❌ [DEBUG-MENU] Pin message test failed:', error);
        }
        
        console.log('🧪 [DEBUG-MENU] Testing text-to-speech...');
        try {
            if (window.chatSection.tts && typeof window.chatSection.tts.speakMessageText === 'function') {
                console.log('[DEBUG-MENU] Text-to-speech method available');
                console.log('[DEBUG-MENU] Speech synthesis support:', 'speechSynthesis' in window);
            } else {
                console.error('[DEBUG-MENU] Text-to-speech method not found');
            }
        } catch (error) {
            console.error('[DEBUG-MENU] Text-to-speech test failed:', error);
        }
    } else {
        console.warn('⚠️ [DEBUG-MENU] Chat section not available for testing');
    }
};

window.testThreeDotsMenuNow = function() {
    console.log('🧪 [TEST-MENU] Running comprehensive three dots menu test...');
    
    const threeDotsButtons = document.querySelectorAll('[data-action="more"]');
    if (threeDotsButtons.length === 0) {
        console.error('❌ [TEST-MENU] No three dots buttons found. Make sure you are on a chat page with messages.');
        return false;
    }
    
    const contextMenu = document.getElementById('message-context-menu');
    if (!contextMenu) {
        console.error('❌ [TEST-MENU] Context menu element not found in DOM.');
        return false;
    }
    
    const firstButton = threeDotsButtons[0];
    const messageId = firstButton.dataset.messageId;
    
    console.log('✅ [TEST-MENU] Found elements:', {
        threeDotsButtons: threeDotsButtons.length,
        contextMenu: !!contextMenu,
        firstButtonMessageId: messageId
    });
    
    if (!window.chatSection) {
        console.error('❌ [TEST-MENU] Chat section not available. Wait for page to fully load.');
        return false;
    }
    
    console.log('🧪 [TEST-MENU] Testing direct context menu call...');
    try {
        window.chatSection.showMessageContextMenu(messageId, firstButton);
        
        setTimeout(() => {
            const isMenuVisible = !contextMenu.classList.contains('hidden');
            const menuDisplay = window.getComputedStyle(contextMenu).display;
            
            console.log('📊 [TEST-MENU] Context menu status after call:', {
                hasHiddenClass: contextMenu.classList.contains('hidden'),
                isVisible: isMenuVisible,
                computedDisplay: menuDisplay,
                position: {
                    left: contextMenu.style.left,
                    top: contextMenu.style.top
                },
                zIndex: contextMenu.style.zIndex
            });
            
            if (isMenuVisible && menuDisplay !== 'none') {
                console.log('🎉 [TEST-MENU] SUCCESS! Context menu is now visible.');
                console.log('💡 [TEST-MENU] Try clicking on a menu item to test functionality.');
                
                console.log('🧪 [TEST-MENU] Testing context menu actions...');
                const copyButton = contextMenu.querySelector('[data-action="copy-text"]');
                const pinButton = contextMenu.querySelector('[data-action="pin"]');
                const ttsButton = contextMenu.querySelector('[data-action="text-to-speech"]');
                
                console.log('✅ [TEST-MENU] Available actions (simplified menu):', {
                    copyText: !!copyButton,
                    pinMessage: !!pinButton,
                    textToSpeech: !!ttsButton,
                    totalButtons: contextMenu.querySelectorAll('button').length
                });
                
                setTimeout(() => {
                    contextMenu.classList.add('hidden');
                    console.log('🔒 [TEST-MENU] Context menu auto-hidden after test.');
                }, 3000);
                
                return true;
            } else {
                console.error('❌ [TEST-MENU] Context menu is still not visible after call.');
                return false;
            }
        }, 100);
        
    } catch (error) {
        console.error('❌ [TEST-MENU] Error calling showMessageContextMenu:', error);
        return false;
    }
};

console.log('✅ [TEST-MENU] Test function loaded. Run testThreeDotsMenuNow() in console to test the three dots menu.');

window.testTextToSpeech = function() {
    console.log('🔊 [TEST-TTS] Testing enhanced Text-to-Speech functionality...');
    
    if (!('speechSynthesis' in window)) {
        console.error('❌ [TEST-TTS] SpeechSynthesis not supported in this browser');
        return false;
    }
    
    console.log('✅ [TEST-TTS] SpeechSynthesis API available');
    
    const voices = window.speechSynthesis.getVoices();
    console.log('🎤 [TEST-TTS] Available voices:', voices.length);
    
    if (voices.length > 0) {
        console.log('🎤 [TEST-TTS] Voice samples:');
        voices.slice(0, 5).forEach((voice, index) => {
            console.log(`  ${index + 1}. ${voice.name} (${voice.lang}) - ${voice.localService ? 'Local' : 'Network'}`);
        });
    } else {
        console.log('⏳ [TEST-TTS] Voices not loaded yet, waiting...');
        window.speechSynthesis.addEventListener('voiceschanged', () => {
            window.testTextToSpeech();
        }, { once: true });
        return;
    }
    
    const messageElements = document.querySelectorAll('[data-message-id]');
    if (messageElements.length === 0) {
        console.error('❌ [TEST-TTS] No messages found to test TTS');
        return false;
    }
    
    const firstMessage = messageElements[0];
    const messageId = firstMessage.dataset.messageId;
    const textElement = firstMessage.querySelector('.bubble-message-text, .message-main-text');
    
    if (!textElement) {
        console.error('❌ [TEST-TTS] No text content found in first message');
        return false;
    }
    
    const messageText = textElement.textContent.trim();
    console.log('📝 [TEST-TTS] Found message text:', messageText.substring(0, 50) + '...');
    
    if (!window.chatSection) {
        console.error('❌ [TEST-TTS] Chat section not available');
        return false;
    }
    
    console.log('[TEST-TTS] Testing TTS with first message...');
    try {
        window.chatSection.tts.speakMessageText(messageId);
        console.log('[TEST-TTS] TTS initiated successfully');
        console.log('[TEST-TTS] You should hear the message being read aloud');
        console.log('[TEST-TTS] Click TTS again to stop, or try another message');
        
        setTimeout(() => {
            const isCurrentlySpeaking = window.speechSynthesis.speaking;
            console.log('[TEST-TTS] Speech status after 1 second:', {
                speaking: isCurrentlySpeaking,
                pending: window.speechSynthesis.pending,
                paused: window.speechSynthesis.paused,
                chatSectionSpeaking: window.chatSection.tts.isSpeaking,
                currentMessageId: window.chatSection.tts.currentSpeakingMessageId
            });
        }, 1000);
        
        return true;
    } catch (error) {
        console.error('❌ [TEST-TTS] TTS test failed:', error);
        return false;
    }
};

window.stopAllSpeech = function() {
    if (window.chatSection && window.chatSection.tts && typeof window.chatSection.tts.stopAllSpeech === 'function') {
        window.chatSection.tts.stopAllSpeech();
        console.log('[TTS-CONTROL] All speech stopped via TTS instance');
    } else if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        console.log('[TTS-CONTROL] All speech stopped via direct API');
    }
};

window.getSpeechInfo = function() {
    console.log('📊 [TTS-INFO] Current speech synthesis status:');
    console.log('  API Available:', 'speechSynthesis' in window);
    console.log('  Currently Speaking:', window.speechSynthesis?.speaking || false);
    console.log('  Speech Pending:', window.speechSynthesis?.pending || false);
    console.log('  Speech Paused:', window.speechSynthesis?.paused || false);
    
    const voices = window.speechSynthesis?.getVoices() || [];
    console.log('  Available Voices:', voices.length);
    
    if (voices.length > 0) {
        const englishVoices = voices.filter(v => v.lang.startsWith('en'));
        console.log('  English Voices:', englishVoices.length);
        
        const preferredVoice = englishVoices.find(v => v.name.includes('Google')) || 
                               englishVoices.find(v => v.name.includes('Microsoft')) || 
                               englishVoices[0];
        
        if (preferredVoice) {
            console.log('  Preferred Voice:', preferredVoice.name, '(' + preferredVoice.lang + ')');
        }
    }
};

console.log('🔊 [TTS] Enhanced Text-to-Speech functions loaded:');
console.log('  - testTextToSpeech() - Test TTS with first message');
console.log('  - stopAllSpeech() - Stop any current speech');  
console.log('  - getSpeechInfo() - Get speech synthesis info');

window.debugTTSMenuFlow = function() {
    console.log('🔍 [DEBUG-TTS-MENU] Testing complete TTS menu flow...');
    
    const contextMenu = document.getElementById('message-context-menu');
    if (!contextMenu) {
        console.error('❌ [DEBUG-TTS-MENU] Context menu not found');
        return false;
    }
    
    const ttsButton = contextMenu.querySelector('[data-action="text-to-speech"]');
    if (!ttsButton) {
        console.error('❌ [DEBUG-TTS-MENU] TTS button not found in context menu');
        console.log('🔍 [DEBUG-TTS-MENU] Available buttons in menu:');
        contextMenu.querySelectorAll('button').forEach((btn, index) => {
            console.log(`  ${index + 1}. ${btn.dataset.action} - "${btn.textContent.trim()}"`);
        });
        return false;
    }
    
    console.log('✅ [DEBUG-TTS-MENU] TTS button found:', ttsButton);
    
    const messageElements = document.querySelectorAll('[data-message-id]');
    if (messageElements.length === 0) {
        console.error('❌ [DEBUG-TTS-MENU] No messages found to test');
        return false;
    }
    
    const firstMessage = messageElements[0];
    const messageId = firstMessage.dataset.messageId;
    
    if (!window.chatSection) {
        console.error('❌ [DEBUG-TTS-MENU] Chat section not available');
        return false;
    }
    
    console.log('🧪 [DEBUG-TTS-MENU] Testing complete flow...');
    
    console.log('1️⃣ [DEBUG-TTS-MENU] Step 1: Show context menu');
    const threeDotsButton = firstMessage.querySelector('[data-action="more"]');
    if (!threeDotsButton) {
        console.error('❌ [DEBUG-TTS-MENU] Three dots button not found on first message');
        return false;
    }
    
    try {
        window.chatSection.showMessageContextMenu(messageId, threeDotsButton);
        console.log('✅ [DEBUG-TTS-MENU] Context menu shown');
        
        setTimeout(() => {
            console.log('2️⃣ [DEBUG-TTS-MENU] Step 2: Set message ID on context menu');
            contextMenu.dataset.messageId = messageId;
            
            console.log('3️⃣ [DEBUG-TTS-MENU] Step 3: Click TTS button');
            
            const mockEvent = {
                target: ttsButton,
                stopPropagation: () => {},
                preventDefault: () => {}
            };
            
            console.log('🔍 [DEBUG-TTS-MENU] About to trigger handleMessageActions with:', {
                target: ttsButton,
                action: ttsButton.dataset.action,
                messageId: contextMenu.dataset.messageId
            });
            
            window.chatSection.handleMessageActions(mockEvent);
            
            setTimeout(() => {
                console.log('4️⃣ [DEBUG-TTS-MENU] Checking if TTS started...');
                const isSpeaking = window.speechSynthesis.speaking;
                const speechIndicator = document.querySelector('.speech-indicator');
                
                console.log('📊 [DEBUG-TTS-MENU] Results:', {
                    speechSynthesisSpeaking: isSpeaking,
                    speechIndicatorVisible: !!speechIndicator,
                    contextMenuHidden: contextMenu.classList.contains('hidden')
                });
                
                if (isSpeaking || speechIndicator) {
                    console.log('🎉 [DEBUG-TTS-MENU] SUCCESS! TTS is working through menu flow');
                } else {
                    console.error('❌ [DEBUG-TTS-MENU] TTS did not start through menu flow');
                }
                
                contextMenu.classList.add('hidden');
            }, 500);
            
        }, 100);
        
    } catch (error) {
        console.error('❌ [DEBUG-TTS-MENU] Error in flow test:', error);
        return false;
    }
};

console.log('  - debugTTSMenuFlow() - Debug complete three dots to TTS flow');