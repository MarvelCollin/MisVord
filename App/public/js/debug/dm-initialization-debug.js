window.debugDMInitialization = function() {
    console.log('🔍 [DEBUG-DM] Starting DM initialization debug...');
    
    const currentPath = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    
    console.log('📍 [DEBUG-DM] Current page info:', {
        path: currentPath,
        search: window.location.search,
        href: window.location.href
    });
    
    console.log('🧪 [DEBUG-DM] Page detection:', {
        isChatPage: typeof isChatPage === 'function' ? isChatPage() : 'function not available',
        isExcludedPage: typeof isExcludedPage === 'function' ? isExcludedPage() : 'function not available'
    });
    
    const metaTags = {
        chatType: document.querySelector('meta[name="chat-type"]')?.content,
        chatId: document.querySelector('meta[name="chat-id"]')?.content,
        channelId: document.querySelector('meta[name="channel-id"]')?.content,
        userId: document.querySelector('meta[name="user-id"]')?.content,
        username: document.querySelector('meta[name="username"]')?.content
    };
    
    console.log('🏷️ [DEBUG-DM] Meta tags:', metaTags);
    
    console.log('🔧 [DEBUG-DM] ChatSection state:', {
        chatSectionExists: !!window.chatSection,
        initializingFlag: window.__CHAT_SECTION_INITIALIZING__,
        chatAPIExists: !!window.ChatAPI,
        initializeChatSectionExists: typeof window.initializeChatSection === 'function'
    });
    
    if (window.chatSection) {
        console.log('📊 [DEBUG-DM] ChatSection details:', {
            targetId: window.chatSection.targetId,
            chatType: window.chatSection.chatType,
            isLoading: window.chatSection.isLoading,
            hasMoreMessages: window.chatSection.hasMoreMessages,
            currentOffset: window.chatSection.currentOffset,
            domElementsFound: {
                chatMessages: !!window.chatSection.chatMessages,
                messageForm: !!window.chatSection.messageForm,
                messageInput: !!window.chatSection.messageInput
            }
        });
    }
    
    const skeletonElements = {
        skeletonLoading: document.getElementById('chat-skeleton-loading'),
        realContent: document.getElementById('chat-real-content'),
        loadingIndicator: document.getElementById('loading-indicator'),
        chatMessages: document.getElementById('chat-messages')
    };
    
    console.log('🎭 [DEBUG-DM] UI Elements:', {
        skeletonVisible: skeletonElements.skeletonLoading ? !skeletonElements.skeletonLoading.classList.contains('hidden') : 'not found',
        contentVisible: skeletonElements.realContent ? !skeletonElements.realContent.classList.contains('hidden') : 'not found',
        loadingVisible: skeletonElements.loadingIndicator ? !skeletonElements.loadingIndicator.classList.contains('hidden') : 'not found',
        chatMessagesExists: !!skeletonElements.chatMessages,
        messagesCount: skeletonElements.chatMessages ? skeletonElements.chatMessages.children.length : 0
    });
    
    const socketStatus = {
        globalSocketManagerExists: !!window.globalSocketManager,
        socketReady: window.globalSocketManager?.isReady(),
        mainSocketReady: window.__MAIN_SOCKET_READY__
    };
    
    console.log('🔌 [DEBUG-DM] Socket status:', socketStatus);
    
    return {
        path: currentPath,
        metaTags,
        chatSection: window.chatSection,
        skeletonElements,
        socketStatus
    };
};

window.forceInitializeDM = async function() {
    console.log('🚀 [DEBUG-DM] Force initializing ChatSection for DM...');
    
    try {
        if (window.chatSection) {
            console.log('♻️ [DEBUG-DM] ChatSection exists, resetting...');
            window.chatSection = null;
        }
        
        window.__CHAT_SECTION_INITIALIZING__ = false;
        
        console.log('🔄 [DEBUG-DM] Calling initializeChatSection...');
        const result = await window.initializeChatSection();
        
        console.log('✅ [DEBUG-DM] Initialization result:', {
            success: !!result,
            targetId: result?.targetId,
            chatType: result?.chatType
        });
        
        if (result) {
            console.log('📡 [DEBUG-DM] Loading messages...');
            await result.loadMessages({ forceFresh: true });
        }
        
        return result;
    } catch (error) {
        console.error('❌ [DEBUG-DM] Force initialization failed:', error);
        return null;
    }
};

console.log('🧪 [DEBUG-DM] Debug functions loaded. Use:');
console.log('- window.debugDMInitialization() to check current state');
console.log('- window.forceInitializeDM() to force reinitialize');
