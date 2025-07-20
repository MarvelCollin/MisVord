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
    
    if (currentPath === '/home' || currentPath.startsWith('/home/')) {
        if (currentPath.includes('/friends')) {
            return false;
        }
        
        if (currentPath.includes('/channels/dm/')) {
            return true;
        }
        
        return false;
    }
    
    const serverMatch = currentPath.match(/^\/server\/(\d+)$/);
    if (serverMatch) {
        const channelId = urlParams.get('channel');
        const channelType = urlParams.get('type');
        
        if (channelType === 'voice') {
            return false;
        }
        
        if (channelId) {
            const voiceSection = document.querySelector('.voice-section:not(.hidden)');
            const chatSection = document.querySelector('.chat-section:not(.hidden)');
            if (voiceSection && !chatSection) {
                return false;
            }
        }
        
        if (!channelId && !channelType) {
            const voiceSection = document.querySelector('.voice-section:not(.hidden)');
            if (voiceSection) {
                return false;
            }
        }
        
        return true;
    }
    
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
                } else {
                    setTimeout(checkInit, 50);
                }
            };
            checkInit();
        });
    }
    
    window.__CHAT_SECTION_INITIALIZING__ = true;
    
    try {
        const chatSection = new ChatSection();
        await chatSection.init();
        window.chatSection = chatSection;
        window.__CHAT_SECTION_INITIALIZING__ = false;
        return chatSection;
    } catch (error) {
        window.__CHAT_SECTION_INITIALIZING__ = false;
        if (!isExcludedPage()) {
            console.error('❌ [CHAT-SECTION] Initialization failed:', error);
        }
        throw error;
    }
}

window.initializeChatSection = initializeChatSection;

window.retryChatInitialization = function() {
    if (window.chatSection) {
        window.chatSection.findDOMElements();
        window.chatSection.setupEventListeners();
        return true;
    } else {
        return initializeChatSection().then(() => {
            return true;
        }).catch(error => {
            console.error('❌ [CHAT-SECTION] Manual retry failed:', error);
            return false;
        });
    }
};



document.addEventListener('DOMContentLoaded', function() {
    if (isExcludedPage()) {

        return;
    }
    
    const initWhenReady = () => {
        if (!window.chatSection && !isExcludedPage()) {
            setTimeout(() => {
                if (!isExcludedPage()) {
                    initializeChatSection().catch(error => {
                        console.error('❌ [CHAT-SECTION] Initialization failed:', error);
                    });
                }
            }, 100);
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
                    console.warn('⚠️ [CHAT-SECTION] Socket not ready after timeout, initializing anyway for DM pages');
                    if (window.location.pathname.includes('/channels/dm/')) {
                        initWhenReady();
                    }
                }
            }, 3000);
        }
    }
    
    setTimeout(() => {
        if (!window.chatSection && !isExcludedPage()) {

            initWhenReady();
        }
    }, 200);
});

class ChatSection {
    constructor(options = {}) {
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
            this.sentMessageCount = 0;
            
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
            
            this.messageHandler = new MessageHandler(this);
            this.socketHandler = new SocketHandler(this);
            this.fileUploadHandler = new FileUploadHandler(this);
            this.sendReceiveHandler = new SendReceiveHandler(this);
            this.chatBot = new ChatBot(this);
            this.mentionHandler = null;
            this.tts = new TextToSpeech();
            
            this.messageTimestamps = [];
            this.maxMessagesPerInterval = 5;
            this.messageIntervalMs = 3000;
            this.isSending = false;
            this.isRateLimited = false;
            this.rateLimitTimer = null;
            this.isSending = false;
            
            window.chatSection = this;
            
            this.init().catch(error => {
                console.error('❌ [CHAT-SECTION] Init failed:', error);
            });
        } catch (error) {
            console.error('❌ [CHAT-SECTION] Constructor error:', error);
        }
    }
    
    detectChatType() {
        const currentPath = window.location.pathname;
        
        if (currentPath === '/home' || currentPath.startsWith('/home/')) {
            if (currentPath.includes('/channels/dm/')) {
                return 'direct';
            }
        }
        
        if (currentPath.match(/^\/server\/\d+$/)) {
            return 'channel';
        }
        
        return 'channel';
    }

    detectTargetId() {
        const currentPath = window.location.pathname;
        const urlParams = new URLSearchParams(window.location.search);
        
        console.log('🔍 [CHAT-SECTION] detectTargetId called:', {
            chatType: this.chatType,
            currentPath: currentPath,
            urlParams: urlParams.toString()
        });
        
        if (this.chatType === 'channel') {
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
            
            console.warn('⚠️ [CHAT-SECTION] No channel ID found');
            return null;
        }
        
        if (this.chatType === 'direct') {
            const chatIdMeta = document.querySelector('meta[name="chat-id"]');
            if (chatIdMeta && chatIdMeta.content && chatIdMeta.content !== '') {
                
                return chatIdMeta.content;
            }
            
            const dmMatch = currentPath.match(/\/home\/channels\/dm\/(\d+)/);
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
            
            console.warn('⚠️ [CHAT-SECTION] No DM ID found. Available meta tags:', {
                chatId: document.querySelector('meta[name="chat-id"]')?.content || 'not found',
                roomId: document.querySelector('meta[name="room-id"]')?.content || 'not found',
                allMetas: Array.from(document.querySelectorAll('meta[name]')).map(m => `${m.name}=${m.content}`)
            });
            return null;
        }
        
        console.warn('⚠️ [CHAT-SECTION] Unknown chat type:', this.chatType);
        return null;
    }
    
    findDOMElements() {

        

        this.chatContainer = document.querySelector('.flex-1.flex.flex-col.bg-\\[\\#313338\\].h-screen.overflow-hidden') || 
                            document.getElementById('chat-container') ||
                            document.querySelector('.chat-section') ||
                            document.querySelector('[data-channel-type="text"]') ||
                            document.querySelector('.main-content-area');
        

        this.chatMessages = document.getElementById('chat-messages') ||
                           document.querySelector('#chat-messages') ||
                           document.querySelector('.chat-messages') ||
                           document.querySelector('[data-messages-container]');
        

        this.messageForm = document.getElementById('message-form') ||
                          document.querySelector('#message-form') ||
                          document.querySelector('.message-form') ||
                          document.querySelector('form[data-message-form]') ||
                          document.querySelector('form:has(#message-input)');
        

        this.messageInput = document.getElementById('message-input') ||
                           document.querySelector('#message-input') ||
                           document.querySelector('.message-input') ||
                           document.querySelector('input[placeholder*="message"]') ||
                           document.querySelector('textarea[placeholder*="message"]');
        

        this.sendButton = document.getElementById('send-button') ||
                         document.querySelector('#send-button') ||
                         document.querySelector('.send-button') ||
                         document.querySelector('[data-send-button]') ||
                         document.querySelector('button[type="submit"]');
        

        this.loadMoreButton = document.getElementById('load-more-messages') ||
                             document.querySelector('#load-more-messages') ||
                             document.querySelector('.load-more-button');
        
        this.loadMoreContainer = document.getElementById('load-more-container') ||
                                document.querySelector('#load-more-container') ||
                                document.querySelector('.load-more-container');
        
        this.topReloadButton = document.getElementById('top-reload-button') ||
                              document.querySelector('#top-reload-button') ||
                              document.querySelector('.top-reload-button');
        
        this.emptyStateContainer = document.getElementById('empty-state-container') ||
                                  document.querySelector('#empty-state-container') ||
                                  document.querySelector('.empty-state-container');
        
        this.contextMenu = document.getElementById('message-context-menu') || 
                          document.getElementById('context-menu') ||
                          document.querySelector('.context-menu');
        
        this.fileUploadInput = document.getElementById('file-upload') ||
                              document.querySelector('#file-upload') ||
                              document.querySelector('input[type="file"]');
        
        this.filePreviewModal = document.getElementById('file-preview-modal') ||
                               document.querySelector('#file-preview-modal') ||
                               document.querySelector('.file-preview-modal');
        
        console.log('🔍 [CHAT-SECTION] DOM Elements found:', {
            chatContainer: !!this.chatContainer,
            chatMessages: !!this.chatMessages,
            messageForm: !!this.messageForm,
            messageInput: !!this.messageInput,
            sendButton: !!this.sendButton,
            loadMoreButton: !!this.loadMoreButton,
            loadMoreContainer: !!this.loadMoreContainer,
            contextMenu: !!this.contextMenu,
            fileUploadInput: !!this.fileUploadInput
        });
        

        if (!this.chatMessages || !this.messageForm || !this.messageInput) {
            console.warn('⚠️ [CHAT-SECTION] Missing critical elements, debugging DOM state:', {
                url: window.location.href,
                pathname: window.location.pathname,
                chatSections: document.querySelectorAll('.chat-section').length,
                formsCount: document.querySelectorAll('form').length,
                inputsCount: document.querySelectorAll('input').length,
                chatMessagesExists: !!document.querySelector('#chat-messages'),
                messageFormExists: !!document.querySelector('#message-form'),
                messageInputExists: !!document.querySelector('#message-input')
            });
        }
    }
    
    waitForRequiredElements() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const isDMPage = window.location.pathname.includes('/dm/');
            const isChannelPage = window.location.pathname.includes('/channels/');
            const isExcluded = isExcludedPage();
            

            const maxAttempts = isExcluded ? 5 : (isDMPage ? 40 : 30); 
            const interval = isDMPage ? 150 : 200; 
            

            
            const checkElements = () => {
                this.findDOMElements();
                
                const hasRequiredElements = this.chatMessages && this.messageForm && this.messageInput;
                
                if (hasRequiredElements) {

                    resolve();
                    return;
                }
                
                attempts++;
                console.log(`🔍 [CHAT-SECTION] Waiting for elements, attempt ${attempts}/${maxAttempts}`, {
                    chatMessages: !!this.chatMessages,
                    messageForm: !!this.messageForm,
                    messageInput: !!this.messageInput,
                    currentURL: window.location.href,
                    isDMPage,
                    isChannelPage
                });
                
                if (attempts >= maxAttempts) {
                    if (!isExcluded) {
                        console.error('❌ [CHAT-SECTION] Timeout waiting for required DOM elements:', {
                            chatMessages: !!this.chatMessages,
                            messageForm: !!this.messageForm,
                            messageInput: !!this.messageInput,
                            isExcludedPage: isExcluded,
                            currentPath: window.location.pathname,
                            attempts,
                            maxAttempts,
                            isDMPage,
                            isChannelPage,
                            totalChatSections: document.querySelectorAll('.chat-section').length,
                            totalForms: document.querySelectorAll('form').length,
                            totalInputs: document.querySelectorAll('input').length
                        });
                    }
                    reject(new Error('Required DOM elements not found'));
                    return;
                }
                
                if (!isExcluded && attempts % 5 === 0) {

                }
                setTimeout(checkElements, interval);
            };
            
            checkElements();
        });
    }
    
    async init() {
        if (this.isInitialized) {
            return;
        }

        console.log('🚀 [CHAT-SECTION] Starting initialization', {
            url: window.location.href,
            chatType: this.chatType,
            targetId: this.targetId
        });

        document.addEventListener('channelContentLoaded', this.handleChannelContentLoaded);

        if (!this.chatType || !this.targetId) {
            this.chatType = this.detectChatType();
            
            await this.waitForRequiredElements();
        
            if (!this.targetId) {
                this.targetId = this.detectTargetId();
                
                if (!this.targetId && this.chatType === 'direct') {
                    
                    await new Promise(resolve => setTimeout(resolve, 500));
                    this.targetId = this.detectTargetId();
                    
                    if (!this.targetId) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        this.targetId = this.detectTargetId();
                        
                        if (!this.targetId) {
                            console.error('❌ [CHAT-SECTION] Could not detect DM target ID after retries');
                            this.hideChatSkeleton();
                            this.showEmptyState('Unable to load direct message. Please refresh the page.');
                            return;
                        }
                    }
                }
            }
            
            console.log('✅ [CHAT-SECTION] Detected chat info:', {
                chatType: this.chatType,
                targetId: this.targetId,
                url: window.location.href
            });
            
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
                

                const messagesContainer = this.getMessagesContainer();
                if (messagesContainer) {
                    messagesContainer.innerHTML = '';
                }
                
                try {
                    await this.loadMessages();
                } catch (error) {
                    console.error('❌ [CHAT-SECTION] Error loading messages:', error);
                }
                
                this.initializeExistingMessages();
                
                this.updateChannelHeader();
            } else {
                console.warn('⚠️ [CHAT-SECTION] Missing targetId or chatType, hiding skeleton anyway', {
                    targetId: this.targetId,
                    chatType: this.chatType,
                    url: window.location.href
                });
                this.hideChatSkeleton();
            }
            
            this.addTopReloadButtonStyles();
            
            if (this.mentionHandler && this.targetId) {
                setTimeout(() => {
                    this.mentionHandler.init();
                }, 500);
            }
            
            this.chatBot.init();
            
            this.updateSendButton();
            console.log('✅ [CHAT-SECTION] Initialization complete', {
                chatType: this.chatType,
                targetId: this.targetId,
                sendReceiveHandler: !!this.sendReceiveHandler,
                messageInput: !!this.messageInput,
                messageForm: !!this.messageForm
            });
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
                    if (window.globalSocketManager && !window.globalSocketManager.connected && !window.globalSocketManager.isConnecting && !window.globalSocketManager.io) {
                        const userData = {
                            user_id: this.userId || document.querySelector('meta[name="user-id"]')?.content,
                            username: this.username || document.querySelector('meta[name="username"]')?.content
                        };
                        
                        if (userData.user_id && userData.username) {

                            window.globalSocketManager.init(userData);
                        }
                    } else {

                    }
                }
            }, 3000);
        };
        
        checkWithTimeout();
    }
    
    setupEventListeners() {

        if (this.messageForm) {
            this.messageForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (!this.isSending && !this.isRateLimited && this.sendReceiveHandler) {
                    this.sendReceiveHandler.sendMessage();
                } else {
                    console.warn('⚠️ [CHAT-SECTION] Cannot send message - either sending, rate limited, or handler not initialized');
                }
            });
        } else {
            console.warn('⚠️ [CHAT-SECTION] Message form not found');
        }
        
        if (this.sendButton) {
            this.sendButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (this.sendButton.disabled || this.isRateLimited || this.isSending) {
                    if (this.isRateLimited) {
                        this.showNotification('You are sending messages too quickly. Please wait.', 'warning');
                    } else if (this.isSending) {
                        this.showNotification('Please wait, your message is being sent.', 'info');
                    }
                    return;
                }
                
                if (this.sendReceiveHandler) {
                    this.sendReceiveHandler.sendMessage();
                } else {
                    console.warn('⚠️ [CHAT-SECTION] Send/Receive handler not initialized');
                }
            });
        } else {
            console.warn('⚠️ [CHAT-SECTION] Send button not found for click handler');
        }
        

        if (this.messageInput) {
            this.messageInput.addEventListener('input', () => {
                this.updateSendButton();
                if (this.messageInput.value.trim().length > 0) {
                    this.handleTypingEvent();
                }
            });
            
            this.messageInput.addEventListener('keyup', () => {
                this.updateSendButton();
            });
            
            this.messageInput.addEventListener('blur', () => {
                this.handleStopTypingEvent();
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
                    this.handleStopTypingEvent();
                }
                
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleStopTypingEvent();
                    if (!this.isSending && !this.isRateLimited && this.sendReceiveHandler) {
                        this.sendReceiveHandler.sendMessage();
                    }
                }
            });

        } else {
            console.warn('⚠️ [CHAT-SECTION] Message input not found, will retry in 2 seconds');

            setTimeout(() => {
                this.findDOMElements();
                if (this.messageInput && !this.messageInput.dataset.listenersAttached) {

                    this.messageInput.addEventListener('input', () => {
                        this.updateSendButton();
                        this.handleTypingEvent();
                    });
                    
                    this.messageInput.addEventListener('keyup', () => {
                        this.updateSendButton();
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
                            if (!this.isSending && !this.isRateLimited && this.sendReceiveHandler) {
                                this.sendReceiveHandler.sendMessage();
                            }
                        }
                    });
                    this.messageInput.dataset.listenersAttached = 'true';

                }
            }, 2000);
        }
        


        if (this.loadMoreButton) {
            this.loadMoreButton.addEventListener('click', () => {
                this.loadMoreMessages();
            });
        }
        

        if (this.fileUploadInput) {
            this.fileUploadInput.addEventListener('change', () => {
                if (this.fileUploadHandler) {
                    this.fileUploadHandler.handleFileSelection();
                }
            });
        }
        

        const fileUploadButton = document.getElementById('file-upload-button');
        if (fileUploadButton && this.fileUploadInput) {
            fileUploadButton.addEventListener('click', (e) => {
                e.preventDefault();

                this.fileUploadInput.click();
            });
        } else {
            console.warn('⚠️ [CHAT-SECTION] File upload button or input not found');
        }
        

        document.addEventListener('click', (e) => {
            this.handleMessageActions(e);
        });
        

        if (this.fileUploadHandler) {
            this.fileUploadHandler.setupFilePreviewEventListeners();
        }
        

        if (this.chatMessages) {
            this.chatMessages.addEventListener('scroll', () => {
                this.handleChatScroll();
            }, { passive: true });

        } else {
            console.warn('⚠️ [CHAT-SECTION] Chat messages container not found for scroll listener');
        }
        

        
        if (this.contextMenu) {
            this.contextMenu.addEventListener('click', (e) => {
                if (e.target.closest('button[data-action]')) {
                    const button = e.target.closest('button[data-action]');
                    const action = button.dataset.action;
                    const messageId = this.contextMenu.dataset.messageId;
                    
                    if (action && messageId) {

                        this.handleMessageActions({
                            target: button,
                            stopPropagation: () => {},
                            preventDefault: () => {}
                        });
                    }
                }
            });
        }
        
        this.updateSendButton();
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
                case 'react':
                    if (window.emojiReactions && typeof window.emojiReactions.showEmojiPicker === 'function') {
                        window.emojiReactions.showEmojiPicker(messageId, actionButton);
                    }
                    break;
                case 'more':

                    this.showMessageContextMenu(messageId, actionButton);
                    break;
                case 'copy-text':

                    this.copyMessageText(messageId);
                    break;

                case 'text-to-speech':

                    this.tts.speakMessageText(messageId);
                    break;
                default:

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
            return;
        }

        this.isLoading = true;
        
        if (!isLoadMore) {
            this.showChatSkeleton();
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
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
                await new Promise(resolve => {
                    const checkAPI = () => {
                        if (window.ChatAPI) {
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

                    let botCount = 0;
                    let userCount = 0;
                    messages.forEach(msg => {
                        if (msg.user_status === 'bot') {
                            botCount++;
                        } else {
                            userCount++;
                        }
                    });
                    
                } else if (response.data.messages === null || response.data.messages === undefined) {
                    messages = [];
                    hasMore = false;
                } else if (Array.isArray(response.data)) {
                    messages = response.data;
                    hasMore = messages.length >= limit;
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
                if (isLoadMore) {
                    this.messageHandler.prependMessages(messages);
                    this.currentOffset += messages.length;
                    this.hideLoadMoreProgress(true, `Loaded ${messages.length} older messages`);
                    
                    const messagesContainer = this.getMessagesContainer();
                    if (messagesContainer) {
                        this.updateContainerHeight(messagesContainer);
                    }
                } else {
                    this.messageHandler.displayMessages(messages);
                    this.currentOffset = messages.length;
                    
                    const messagesContainer = this.getMessagesContainer();
                    if (messagesContainer) {
                        this.updateContainerHeight(messagesContainer);
                    }
                    
                    if (options.isChannelSwitch) {
                        this.scrollToBottomIfAppropriate(true);
                    }
                }
                
                this.hideEmptyState();
                this.isInitialized = true;
            } else {
                if (!isLoadMore) {
                    this.hideChatSkeleton();
                    this.showEmptyState();
                }
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

            this.findDOMElements();
        }
        
        if (!this.loadMoreContainer || !this.loadMoreButton) {
            console.warn('⚠️ [CHAT-SECTION] Load more button container not found');
            return;
        }
        

        
        if (this.isLoading) {
            this.loadMoreContainer.classList.add('hidden');

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

        } else {
            this.loadMoreContainer.classList.add('hidden');

        }
    }
    
    showLoadingIndicator() {

    }
    
    hideLoadingIndicator() {

    }
    
    showEmptyState(message = null) {

        
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
        
        messagesContainer.classList.add('items-center', 'justify-center');
        messagesContainer.classList.remove('has-many-messages');

        
        if (!this.emptyStateContainer) {
            this.emptyStateContainer = document.createElement('div');
            this.emptyStateContainer.id = 'empty-state-container';
            this.emptyStateContainer.className = 'flex flex-col items-center justify-center text-[#dcddde] p-8';
            this.emptyStateContainer.style.cssText = 'display: flex !important; visibility: visible !important;';
            
            try {
                messagesContainer.appendChild(this.emptyStateContainer);

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
            this.emptyStateContainer.style.display = 'none';
            this.emptyStateContainer.style.visibility = 'hidden';
        }
        
        const messagesContainer = this.getMessagesContainer();
        if (messagesContainer) {
            messagesContainer.classList.remove('items-center', 'justify-center');
        }

        const emptyStateInDOM = document.getElementById('empty-state-container');
        if (emptyStateInDOM && emptyStateInDOM !== this.emptyStateContainer) {
            emptyStateInDOM.classList.add('hidden');
            emptyStateInDOM.style.display = 'none';
            emptyStateInDOM.style.visibility = 'hidden';
        }
    }
    
    updateSendButton() {
        if (!this.sendButton) {
            console.warn('⚠️ [CHAT-SECTION] Send button not found');
            return;
        }
        
        const hasContent = this.messageInput && (this.messageInput.value ? this.messageInput.value.trim().length > 0 : this.messageInput.textContent.trim().length > 0);
        const hasFiles = this.fileUploadHandler && this.fileUploadHandler.hasFiles();
        const canSend = (hasContent || hasFiles) && !this.isSending && !this.isRateLimited;
        
        this.sendButton.disabled = !canSend;
        this.sendButton.classList.toggle('opacity-50', !canSend);
        this.sendButton.classList.toggle('cursor-not-allowed', !canSend);
        
        if (this.isSending) {
            this.sendButton.classList.add('sending');
            this.sendButton.title = 'Sending message...';
            this.sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        } else if (this.isRateLimited) {
            this.sendButton.classList.add('rate-limited');
            this.sendButton.title = 'Rate limited - please wait';
            this.sendButton.innerHTML = '<i class="fas fa-clock"></i>';
        } else {
            this.sendButton.classList.remove('rate-limited', 'sending');
            this.sendButton.title = 'Send message';
            this.sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
        }
        
        if (canSend) {
            this.sendButton.classList.add('hover:bg-[#5865f2]', 'text-[#dcddde]', 'hover:text-white');
            this.sendButton.classList.remove('text-[#b9bbbe]');
        } else {
            this.sendButton.classList.remove('hover:bg-[#5865f2]', 'text-[#dcddde]', 'hover:text-white');
            this.sendButton.classList.add('text-[#b9bbbe]');
        }
    }
    
    checkRateLimit() {
        const now = Date.now();
        this.messageTimestamps = this.messageTimestamps.filter(timestamp => 
            now - timestamp < this.messageIntervalMs
        );
        
        if (this.messageTimestamps.length >= this.maxMessagesPerInterval) {
            const oldestTimestamp = Math.min(...this.messageTimestamps);
            const timeUntilReset = this.messageIntervalMs - (now - oldestTimestamp);
            const secondsUntilReset = Math.ceil(timeUntilReset / 1000);
            
            this.isRateLimited = true;
            this.updateSendButton();
            
            this.showNotification(`Slow down! You can send ${this.maxMessagesPerInterval} messages every ${this.messageIntervalMs / 1000} seconds. Try again in ${secondsUntilReset} seconds.`, 'warning');
            
            const rateLimitTimer = setTimeout(() => {
                this.isRateLimited = false;
                this.updateSendButton();
                // this.showNotification('Rate limit cleared - you can send messages again!', 'success');
            }, timeUntilReset);
            
            this.rateLimitTimer = rateLimitTimer;
            
            return false;
        }
        
        this.messageTimestamps.push(now);
        return true;
    }
    
    resetRateLimit() {
        this.messageTimestamps = [];
        this.isSending = false;
        this.isRateLimited = false;
        if (this.rateLimitTimer) {
            clearTimeout(this.rateLimitTimer);
            this.rateLimitTimer = null;
        }
        this.updateSendButton();
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
        
        clearTimeout(this._stopTypingTimeout);
        this._stopTypingTimeout = setTimeout(() => {
            this.handleStopTypingEvent();
        }, 5000);
    }
    
    handleStopTypingEvent() {
        if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
            return;
        }
        
        if (!this.targetId) {
            return;
        }
        
        if (this.chatType === 'channel') {
            window.globalSocketManager.emitToRoom('stop-typing', {
                channel_id: this.targetId,
                user_id: this.userId,
                username: this.username
            }, 'channel', this.targetId);
        } else {
            window.globalSocketManager.emitToRoom('stop-typing', {
                room_id: this.targetId,
                user_id: this.userId,
                username: this.username
            }, 'dm', this.targetId);
        }
        
        clearTimeout(this._stopTypingTimeout);
    }
    
    startReply(messageId) {

        
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (!messageElement) {
            console.warn('⚠️ [CHAT-SECTION] Message element not found:', messageId);
            return;
        }
        

        const isBubbleMessage = messageElement.closest('.bubble-message-group');
        let username = 'Unknown User';
        let content = 'a message';
        
        if (isBubbleMessage) {

            const messageGroup = messageElement.closest('.bubble-message-group');
            const usernameElement = messageGroup?.querySelector('.bubble-username');
            const contentElement = messageElement.querySelector('.bubble-message-text');
            
            username = usernameElement?.textContent?.trim() || 'Unknown User';
            content = contentElement?.textContent?.trim() || 'a message';
        } else {

            const messageGroup = messageElement.closest('.message-group');
            const usernameElement = messageGroup?.querySelector('.font-medium, .message-username');
            const contentElement = messageElement.querySelector('.message-main-text');
            
            username = usernameElement?.textContent?.trim() || 'Unknown User';
            content = contentElement?.textContent?.trim() || 'a message';
        }
        

        
        this.replyingTo = {
            messageId,
            username,
            content
        };
        
        this.showReplyUI();
        

        if (this.messageInput) {
            this.messageInput.focus();
        }
    }
    
    showReplyUI() {
        if (!this.replyingTo) {
            console.warn('⚠️ [CHAT-SECTION] Cannot show reply UI: no replyingTo data');
            return;
        }
        

        

        if (!this.replyingTo.messageId || !this.replyingTo.username) {
            console.error('❌ [CHAT-SECTION] Invalid reply data:', this.replyingTo);
            return;
        }
        

        const replyData = {
            messageId: this.replyingTo.messageId,
            username: this.replyingTo.username,
            content: this.replyingTo.content || 'a message'
        };
        

        this.clearExistingReplyUI();
        

        const replyPreview = document.createElement('div');
        replyPreview.id = 'reply-preview';
        replyPreview.className = 'bg-[#2b2d31] p-3 mb-2 rounded-lg border-l-4 border-[#5865f2] flex items-start gap-3';
        

        const replyContent = document.createElement('div');
        replyContent.className = 'flex-grow min-w-0';
        

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
        

        const replyText = document.createElement('div');
        replyText.className = 'text-sm text-[#dcddde] truncate';
        

        let displayContent = replyData.content || 'a message';
        if (displayContent.length > 100) {
            displayContent = displayContent.substring(0, 100) + '...';
        }
        replyText.textContent = displayContent;
        

        const closeButton = document.createElement('button');
        closeButton.className = 'text-[#b9bbbe] hover:text-white transition-colors p-1 rounded hover:bg-[#4f545c]';
        closeButton.innerHTML = '<i class="fas fa-times"></i>';
        closeButton.title = 'Cancel Reply';
        closeButton.addEventListener('click', () => this.cancelReply());
        
        replyContent.appendChild(replyHeader);
        replyContent.appendChild(replyText);
        replyPreview.appendChild(replyContent);
        replyPreview.appendChild(closeButton);
        

        let insertionPoint = this.messageForm || 
                           document.querySelector('#message-form') ||
                           document.querySelector('.message-form') ||
                           this.messageInput?.parentNode ||
                           document.querySelector('#message-input')?.parentNode;
        
        if (insertionPoint) {
            insertionPoint.parentNode.insertBefore(replyPreview, insertionPoint);

        } else {

            const chatInputContainer = document.querySelector('#chat-input-container') || 
                                     document.querySelector('.chat-input-container') ||
                                     document.querySelector('[class*="chat-input"]') ||
                                     document.querySelector('[class*="message-input"]')?.parentNode;
            
            if (chatInputContainer) {
                chatInputContainer.insertBefore(replyPreview, chatInputContainer.firstChild);

            } else {
                console.error('❌ [CHAT-SECTION] Could not find insertion point for reply UI');
                return;
            }
        }
        

        replyPreview.style.animation = 'replyInputSlideIn 0.2s ease-out forwards';
    }
    
    clearExistingReplyUI() {

        

        const replyPreview = document.getElementById('reply-preview');
        if (replyPreview) {
            replyPreview.remove();
        }
        

        const legacyReplyContainer = document.getElementById('reply-container');
        if (legacyReplyContainer) {
            legacyReplyContainer.remove();
        }
    }
    
    cancelReply() {

        
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
        

        const legacyReplyContainer = document.getElementById('reply-container');
        if (legacyReplyContainer) {
            legacyReplyContainer.remove();
        }
    }
    
    startEditing(messageId) {

        
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
        

    }
    
    cancelEditing() {
        if (!this.currentEditingMessage) {

            return;
        }
        

        
        const { messageId, originalContent, originalHTML, element, isBubbleMessage } = this.currentEditingMessage;
        

        if (originalHTML) {

            element.innerHTML = originalHTML;
        } else {

            element.innerHTML = this.formatMessageContent(originalContent);
            

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
        

        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.classList.remove('message-editing');
        }
        

        this.currentEditingMessage = null;
        

    }
    
    async saveEdit(messageId, newContent) {
        if (!messageId || !newContent.trim()) return;
        
        const originalContent = this.currentEditingMessage?.originalContent;
        if (newContent.trim() === originalContent?.trim()) {

            this.cancelEditing();
            return;
        }
        
        try {

            
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
            

            if (window.globalSocketManager && window.globalSocketManager.isReady()) {
                window.globalSocketManager.io.emit('message-edit-temp', editData);
            }
            

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

        

        this.cancelEditing();
        

        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            const messageTextElement = messageElement.querySelector('.message-main-text, .bubble-message-text');
            if (messageTextElement) {

                messageTextElement.innerHTML = this.formatMessageContent(newContent);
                

                this.markMessageAsTempEdit(messageElement, tempEditId);
                

                let editedBadge = messageElement.querySelector('.edited-badge, .bubble-edited-badge');
                if (!editedBadge) {
                    editedBadge = document.createElement('span');
                    editedBadge.className = 'edited-badge text-xs text-[#a3a6aa] ml-1';
                    editedBadge.textContent = '(edited)';
                    messageTextElement.appendChild(editedBadge);
                }
                

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
                        <i class="fas fa-trash mr-2"></i
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
            

            if (window.globalSocketManager && window.globalSocketManager.isReady()) {
                window.globalSocketManager.io.emit('message-deleted', deleteData);

            } else {
                console.warn('⚠️ [CHAT-SECTION] Socket not ready for deletion broadcast');
            }
            
            if (!window.ChatAPI) {
                throw new Error('ChatAPI not initialized');
            }
            

            const response = await window.ChatAPI.deleteMessage(messageId);
            
            if (response.success) {

                
                if (messageElement) {
                    messageElement.classList.remove('message-deleting-pending');
                    messageElement.classList.add('message-delete-success');
                    
                    setTimeout(() => {
                        const messageGroup = messageElement.closest('.bubble-message-group');
                        
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
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
            this.userHasScrolled = false;
        } catch (error) {
            console.error('❌ [CHAT-SECTION] Failed to scroll to bottom:', error);
        }
    }
    
    shouldAutoScroll() {
        if (!this.chatMessages) return false;
        
        try {
            const { scrollHeight, clientHeight } = this.chatMessages;
            return scrollHeight > clientHeight;
        } catch (error) {
            return false;
        }
    }
    
    scrollToBottomIfAppropriate(isChannelSwitch = false) {
        if (!this.chatMessages) return;
        
        if (isChannelSwitch) {
            this.scrollToBottom();
            return;
        }
        
        if (!this.isInitialized) {
            if (this.shouldAutoScroll()) {
                this.scrollToBottom();
            }
            return;
        }
        
        if (!this.userHasScrolled && this.shouldAutoScroll()) {
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

            return window.messageHighlighter.highlightMessage(messageId, fromNotification);
        }
        

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

            const soundsEnabled = localStorage.getItem('message_sounds_enabled') !== 'false';
            
            if (!soundsEnabled) {

                return;
            }
            

            const audio = new Audio('/public/assets/sound/message_sound.mp3');
            audio.volume = 0.5; 
            audio.play().catch(error => {


            });
        } catch (error) {
            console.error('❌ [CHAT-SECTION] Error playing message sound:', error);
        }
    }
    
    getMessagesContainer() {
        const realMessagesContainer = document.getElementById('chat-real-content');
        if (realMessagesContainer) {
            this.updateContainerHeight(realMessagesContainer);
            return realMessagesContainer;
        }
        
        if (!this.chatMessages) {
            this.findDOMElements();
            if (!this.chatMessages) {
                return document.querySelector('.messages-container');
            }
        }
        
        const messagesContainer = this.chatMessages.querySelector('#chat-real-content') ||
                                this.chatMessages.querySelector('.messages-container');
        
        if (messagesContainer) {
            this.updateContainerHeight(messagesContainer);
            return messagesContainer;
        }
        
        return this.chatMessages;
    }
    
    updateContainerHeight(container) {
        if (!container) return;
        
        const messageGroups = container.querySelectorAll('.bubble-message-group, .message-group');
        const messageCount = messageGroups.length;
        
        container.classList.remove('has-many-messages');
        
        if (messageCount >= 3) {
            container.classList.add('has-many-messages');
        }
    }
    
    formatMessageContent(content) {
        if (!content) return '';
        

        content = content.replace(
            /(https?:\/\/[^\s]+)/g,
            '<a href="$1" target="_blank" class="text-[#00a8fc] hover:underline">$1</a>'
        );
        

        content = content.replace(/\n/g, '<br>');
        
        return content;
    }
    
    showNotification(message, type = 'info') {

        const notification = document.createElement('div');
        notification.className = `notification fixed bottom-4 right-4 p-3 rounded shadow-lg z-50 ${
            type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500'
        } text-white`;
        notification.textContent = message;
        

        document.body.appendChild(notification);
        

        setTimeout(() => {
            notification.classList.add('opacity-0');
                setTimeout(() => {
                notification.remove();
            }, 300);
                }, 3000);
    }
    
    initializeExistingMessages() {

        
        const existingMessages = document.querySelectorAll('.message-content[data-message-id]');
        

        
        existingMessages.forEach(messageElement => {
            const messageId = messageElement.dataset.messageId;
            if (messageId && this.messageHandler) {

                this.messageHandler.addMessageEventListeners(messageId);
            }
        });
        
        const messagesContainer = this.getMessagesContainer();
        if (messagesContainer) {
            this.updateContainerHeight(messagesContainer);
        }

    }
    
    clearChatMessages() {

        
        const realContentContainer = document.getElementById('chat-real-content');
        if (realContentContainer) {
            realContentContainer.innerHTML = '';
            realContentContainer.classList.remove('has-many-messages', 'items-center', 'justify-center');
        }
        
        const messagesContainer = this.getMessagesContainer();
        if (messagesContainer && messagesContainer !== realContentContainer) {
            messagesContainer.innerHTML = '';
            messagesContainer.classList.remove('has-many-messages', 'items-center', 'justify-center');
        }
        
        this.userHasScrolled = false;
        this.lastScrollPosition = 0;
        this.sentMessageCount = 0;
        
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

        
        if (!this.mentionHandler) {
            this.mentionHandler = new MentionHandler(this);

        }
        
        if (this.socketHandler && !this.socketHandler.socketListenersSetup) {
            if (window.globalSocketManager && window.globalSocketManager.io) {
                this.socketHandler.setupSocketHandlers(window.globalSocketManager.io);

            } else {

                
                const setupSocketHandlersWhenReady = () => {
                    if (window.globalSocketManager && window.globalSocketManager.io && !this.socketHandler.socketListenersSetup) {
                        this.socketHandler.setupSocketHandlers(window.globalSocketManager.io);

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
        

    }

    updateChannelHeader() {

        
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
                

                return;
            }
            
            const chatTitleMeta = document.querySelector('meta[name="chat-title"]');
            if (chatTitleMeta && chatTitleMeta.content) {
                let nameText = this.cleanChannelName(chatTitleMeta.content);
                channelName.textContent = nameText;
                channelIcon.className = 'fas fa-hashtag text-[#949ba4] mr-2';

                return;
            }
            
            if (window.currentChannelData && window.currentChannelData.name) {
                let nameText = this.cleanChannelName(window.currentChannelData.name);
                channelName.textContent = nameText;
                const iconClass = window.currentChannelData.type === 'voice' ? 'fas fa-volume-high' : 'fas fa-hashtag';
                channelIcon.className = `${iconClass} text-[#949ba4] mr-2`;

                return;
            }
            
            channelName.textContent = `Channel ${this.targetId}`;
            channelIcon.className = 'fas fa-hashtag text-[#949ba4] mr-2';

            
        } else if (this.chatType === 'direct') {
            const chatTitleMeta = document.querySelector('meta[name="chat-title"]');
            let titleText = chatTitleMeta?.content || 'Direct Message';
            titleText = this.cleanChannelName(titleText);
            
            channelName.textContent = titleText;
            channelIcon.className = 'fas fa-user text-[#949ba4] mr-2';

            
        } else {
            channelName.textContent = 'Chat';
            channelIcon.className = 'fas fa-comments text-[#949ba4] mr-2';

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

            this.messageHandler = new MessageHandler(this);
        } else {

            this.messageHandler.clearProcessedMessages();
        }
        
        if (!this.sendReceiveHandler) {

            this.sendReceiveHandler = new SendReceiveHandler(this);
        }
        
        if (!this.socketHandler) {

            this.socketHandler = new SocketHandler(this);
        }
        
        this.findDOMElements();
        this.setupEventListeners();
        this.setupHandlers();
        
        this.isInitialized = true;

    }

    async switchToChannel(channelId, channelType = 'text', forceFresh = false) {

        if (this.loadMoreContainer) {
            this.loadMoreContainer.classList.add('hidden');
        }
        
        this.forceStopAllOperations();
        
        this.targetId = channelId;
        this.chatType = 'channel';
        
        const messagesContainer = this.getMessagesContainer();
        if (messagesContainer) {
            messagesContainer.innerHTML = '';

        }
        
        await this.ensureInitialized();
        
        this.fullStateReset();
        
        if (this.socketHandler && typeof this.socketHandler.refreshForChannelSwitch === 'function') {

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

            window.emojiReactions.updateChannelContext(channelId, 'channel');
        }
        

    }

    async switchToDM(dmId, roomType = 'direct', forceFresh = false) {

        if (this.loadMoreContainer) {
            this.loadMoreContainer.classList.add('hidden');
        }
        
        this.forceStopAllOperations();
        
        this.targetId = dmId;
        this.chatType = 'direct';
        
        const messagesContainer = this.getMessagesContainer();
        if (messagesContainer) {
            messagesContainer.innerHTML = '';

        }
        

        let dmElementsReady = false;
        let attempts = 0;
        const maxAttempts = 20;
        
        while (!dmElementsReady && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            this.findDOMElements();
            
            const hasRequired = this.chatMessages && this.messageForm && this.messageInput;
            if (hasRequired) {
                dmElementsReady = true;

            } else {
                attempts++;
                if (attempts % 5 === 0) {
                    console.warn('⚠️ [CHAT-SECTION] Still waiting for DM elements:', {
                        chatMessages: !!this.chatMessages,
                        messageForm: !!this.messageForm,
                        messageInput: !!this.messageInput,
                        url: window.location.href
                    });
                }
            }
        }
        
        if (!dmElementsReady) {
            console.error('❌ [CHAT-SECTION] DM elements not ready after maximum attempts');
            throw new Error('DM DOM elements not ready');
        }
        
        await this.ensureInitialized();
        
        this.fullStateReset();
        
        if (this.socketHandler && typeof this.socketHandler.refreshForChannelSwitch === 'function') {

            this.socketHandler.refreshForChannelSwitch(dmId, 'direct');
        }
        
        this.joinSocketRoom();
        
        await this.loadMessages({ 
            forceFresh: true, 
            isChannelSwitch: true,
            limit: 50 
        });
        
        this.updateChannelHeader();
        
        if (window.emojiReactions && typeof window.emojiReactions.updateChannelContext === 'function') {

            window.emojiReactions.updateChannelContext(dmId, 'direct');
        }
        

    }

    resetForNewChannel() {

        
        this.cleanupDeleteModals();
        
        this.forceStopAllOperations();
        this.clearChatMessages();
        this.showChatSkeleton();
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

        }
        

    }

    leaveCurrentSocketRoom() {
        if (this.socketRoomJoined && this.lastJoinedRoom && window.globalSocketManager) {

            
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

                        window.globalSocketManager.leaveRoom('dm', this.lastJoinedRoom);
                    } else {
                        console.warn('⚠️ [CHAT-SECTION] No available method to leave DM room');
                    }
                }
                
                this.socketRoomJoined = false;
                this.lastJoinedRoom = null;

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

    }
    
    retrySocketConnection() {
        if (!window.globalSocketManager) {
            console.error('❌ [CHAT-SECTION] Cannot retry - no global socket manager');
            return false;
        }


        const status = this.getDetailedSocketStatus();
        if (status.isReady) {

            return true;
        }


        
        const userData = {
            user_id: this.userId || document.querySelector('meta[name="user-id"]')?.content,
            username: this.username || document.querySelector('meta[name="username"]')?.content
        };
        
        if (!userData.user_id || !userData.username) {
            console.error('❌ [CHAT-SECTION] Cannot retry - missing user data');
            return false;
        }


        if (window.globalSocketManager.isConnecting || window.globalSocketManager.isConnected) {

            

            setTimeout(() => {
                const newStatus = this.getDetailedSocketStatus();
                if (newStatus.isReady && this.targetId) {
                    this.joinSocketRoom();
                }
            }, 3000);
            
            return true;
        }


        if (!window.globalSocketManager.io) {
            window.__SOCKET_INITIALISED__ = false;
            const result = window.globalSocketManager.init(userData);
            
            if (result) {

                
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


        return true;
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

            } else {
                document.body.appendChild(this.topReloadButton);

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

    }

    getTotalMessageCount() {
        const messagesContainer = this.getMessagesContainer();
        if (!messagesContainer) return 0;
        
        const messageGroups = messagesContainer.querySelectorAll('.bubble-message-group:not(.progressive-load-group), .message-group:not(.progressive-load-group)');
        return messageGroups.length;
    }

    handleNewMessageScroll(isOwnMessage = false) {
        if (!this.chatMessages) return;
        
        if (isOwnMessage) {
            if (!this.userHasScrolled) {
                if (this.shouldAutoScroll()) {
                    this.scrollToBottom();
                }
                return;
            }
            
            const { scrollTop, scrollHeight, clientHeight } = this.chatMessages;
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50; 
            
            if (isAtBottom) {
                this.scrollToBottom();
            } else {
                this.showNewMessageIndicator();
            }
            return;
        }
        
        if (!this.userHasScrolled) {
            if (this.shouldAutoScroll()) {
                this.scrollToBottom();
            }
            return;
        }
        
        const { scrollTop, scrollHeight, clientHeight } = this.chatMessages;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50; 
        
        if (isAtBottom) {
            this.scrollToBottom();
        } else {
            this.showNewMessageIndicator();
        }
    }
    
    showNewMessageIndicator() {

        if (!document.getElementById('new-message-indicator')) {
            const indicator = document.createElement('div');
            indicator.id = 'new-message-indicator';
            indicator.className = 'fixed bottom-24 right-8 bg-[#5865f2] text-white px-3 py-2 rounded-full shadow-lg cursor-pointer z-50 flex items-center gap-2 animate-bounce';
            indicator.innerHTML = '<i class="fas fa-arrow-down"></i><span>New messages</span>';
            
            indicator.addEventListener('click', () => {
                this.scrollToBottom();
                indicator.remove();
            });
            
            document.body.appendChild(indicator);
            

            setTimeout(() => {
                if (document.getElementById('new-message-indicator')) {
                    document.getElementById('new-message-indicator').remove();
                }
            }, 5000);
        }
    }

    initializeChatSkeleton() {
        if (this.skeletonInitialized) {
            return;
        }
        
        this.skeletonStartTime = Date.now();
        this.minSkeletonTime = 300;
        this.skeletonHidden = false;
        this.messagesLoaded = false;
        this.skeletonInitialized = true;
    }
    
    hideChatSkeleton() {
        if (this.skeletonHidden) {
            return;
        }
        
        const skeletonContainer = document.getElementById('chat-skeleton-loading');
        const realContent = document.getElementById('chat-real-content');
        
        const hideSkeletonNow = () => {
            if (skeletonContainer) {
                skeletonContainer.style.display = 'none';
                skeletonContainer.style.visibility = 'hidden';
                skeletonContainer.style.opacity = '0';
                skeletonContainer.setAttribute('hidden', 'true');
            }
            
            if (realContent) {
                realContent.style.display = 'flex';
                realContent.style.visibility = 'visible';
                realContent.style.opacity = '1';
                realContent.removeAttribute('hidden');
                
                const chatMessages = document.getElementById('chat-messages');
                if (chatMessages && realContent.children.length > 0) {
                    const originalScrollBehavior = chatMessages.style.scrollBehavior;
                    chatMessages.style.scrollBehavior = 'auto';
                    
                    requestAnimationFrame(() => {
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                        
                        requestAnimationFrame(() => {
                            chatMessages.style.scrollBehavior = originalScrollBehavior;
                        });
                    });
                }
            }
            
            this.skeletonHidden = true;
            this.messagesLoaded = true;
            this.skeletonInitialized = false;
        };

        if (this.skeletonStartTime) {
            const elapsedTime = Date.now() - this.skeletonStartTime;
            const remainingTime = Math.max(0, this.minSkeletonTime - elapsedTime);
            
            if (remainingTime > 0) {
                setTimeout(hideSkeletonNow, remainingTime);
            } else {
                hideSkeletonNow();
            }
        } else {
            hideSkeletonNow();
        }
    }
    
    showChatSkeleton() {
        this.initializeChatSkeleton();
        
        const skeletonContainer = document.getElementById('chat-skeleton-loading');
        const realContent = document.getElementById('chat-real-content');
        
        if (realContent) {
            realContent.style.display = 'none';
        }
        
        if (skeletonContainer) {
            skeletonContainer.style.display = 'flex';
            skeletonContainer.style.visibility = 'visible';
            skeletonContainer.style.opacity = '1';
            skeletonContainer.removeAttribute('hidden');
        }
    }


    
    showMessageContextMenu(messageId, triggerElement) {

        
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

                contextMenu.classList.add('hidden');
                contextMenu.style.display = 'none';
                document.removeEventListener('click', this.activeContextMenuCloseHandler);
                this.activeContextMenuCloseHandler = null;
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', this.activeContextMenuCloseHandler);
        }, 50);
        

    }
    
    copyMessageText(messageId) {

        
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

                this.showNotification('Message text copied to clipboard', 'success');
            } else {
                throw new Error('Copy command failed');
            }
        } catch (error) {
            console.error('❌ [CHAT-SECTION] Fallback copy failed:', error);
            this.showNotification('Failed to copy text to clipboard', 'error');
        }
    }

    showTypingIndicator(userId, username) {

        if (this.socketHandler && typeof this.socketHandler.showTypingIndicator === 'function') {
            this.socketHandler.showTypingIndicator(userId, username);
        } else {
            console.warn('⚠️ [CHAT-SECTION] Socket handler not available for typing indicator');
        }
    }
};

