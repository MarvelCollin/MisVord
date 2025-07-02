// Comprehensive Message Deletion Debug Tool
console.log('🧪 [DELETION-DEBUG] Comprehensive deletion debugging tool loaded');

window.deletionDebug = {
    // Test full deletion flow with detailed logging
    testFullDeletionFlow: async function(messageId) {
        console.log('🧪 [DELETION-DEBUG] Testing full deletion flow for message:', messageId);
        
        // Step 1: Check initial state
        this.checkEnvironment();
        
        // Step 2: Track socket events
        this.setupEventTracking();
        
        // Step 3: Perform deletion
        if (window.chatSection && messageId) {
            console.log('🗑️ [DELETION-DEBUG] Initiating deletion for message:', messageId);
            await window.chatSection.deleteMessage(messageId);
        }
        
        // Step 4: Wait and check results
        setTimeout(() => {
            this.checkDeletionResults(messageId);
        }, 2000);
    },
    
    checkEnvironment: function() {
        console.log('🔍 [DELETION-DEBUG] Environment check:');
        console.log('  - Socket Manager:', !!window.globalSocketManager);
        console.log('  - Socket Connected:', window.globalSocketManager?.isConnected);
        console.log('  - Socket Ready:', window.globalSocketManager?.isReady());
        console.log('  - Socket ID:', window.globalSocketManager?.io?.id);
        console.log('  - User ID:', window.globalSocketManager?.userId);
        console.log('  - Username:', window.globalSocketManager?.username);
        console.log('  - Chat Section:', !!window.chatSection);
        console.log('  - Chat Type:', window.chatSection?.chatType);
        console.log('  - Target ID:', window.chatSection?.targetId);
        console.log('  - Socket Handler:', !!window.chatSection?.socketHandler);
        console.log('  - Listeners Setup:', window.chatSection?.socketHandler?.socketListenersSetup);
    },
    
    setupEventTracking: function() {
        console.log('🎯 [DELETION-DEBUG] Setting up event tracking...');
        
        if (window.globalSocketManager?.io) {
            // Remove existing listeners to avoid duplicates
            window.globalSocketManager.io.off('deletion-debug-sent');
            window.globalSocketManager.io.off('deletion-debug-received');
            
            // Track outgoing deletion events
            const originalEmit = window.globalSocketManager.io.emit;
            window.globalSocketManager.io.emit = function(event, data) {
                if (event === 'message-deleted') {
                    console.log('📤 [DELETION-DEBUG] Outgoing deletion event:', {
                        event,
                        data,
                        timestamp: new Date().toISOString()
                    });
                }
                return originalEmit.call(this, event, data);
            };
            
            // Track incoming deletion events
            window.globalSocketManager.io.on('message-deleted', (data) => {
                console.log('📥 [DELETION-DEBUG] Incoming deletion event:', {
                    data,
                    timestamp: new Date().toISOString(),
                    currentChat: {
                        type: window.chatSection?.chatType,
                        targetId: window.chatSection?.targetId
                    },
                    isForCurrentChat: window.chatSection?.socketHandler?.isCurrentChat(data)
                });
            });
        }
    },
    
    checkDeletionResults: function(messageId) {
        console.log('✅ [DELETION-DEBUG] Checking deletion results for:', messageId);
        
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        console.log('  - Message still in DOM:', !!messageElement);
        
        if (messageElement) {
            console.log('  - Message classes:', messageElement.className);
            console.log('  - Message style:', messageElement.style.cssText);
        }
    },
    
    // Simulate incoming deletion from another user
    simulateIncomingDeletion: function(messageId) {
        console.log('🎭 [DELETION-DEBUG] Simulating incoming deletion for:', messageId);
        
        const testData = {
            message_id: messageId,
            user_id: '99999', // Different user ID
            username: 'OtherTestUser',
            target_type: window.chatSection?.chatType === 'channel' ? 'channel' : 'dm',
            target_id: window.chatSection?.targetId,
            source: 'simulation'
        };
        
        console.log('📥 [DELETION-DEBUG] Simulating data:', testData);
        
        if (window.chatSection?.socketHandler) {
            window.chatSection.socketHandler.handleMessageDeleted(testData);
        }
    },
    
    // Check socket rooms and broadcasting
    checkSocketRooms: function() {
        console.log('🏠 [DELETION-DEBUG] Checking socket rooms...');
        
        if (window.globalSocketManager?.io) {
            console.log('  - Socket Rooms:', window.globalSocketManager.io.rooms);
            console.log('  - Socket ID:', window.globalSocketManager.io.id);
            
            // Emit a test event to check connectivity
            window.globalSocketManager.io.emit('debug-test', {
                message: 'Testing socket connectivity',
                timestamp: Date.now(),
                userId: window.globalSocketManager.userId
            });
        }
    },
    
    // Test authentication state
    testAuthentication: function() {
        console.log('🔐 [DELETION-DEBUG] Testing authentication...');
        
        if (window.globalSocketManager?.io) {
            window.globalSocketManager.io.emit('auth-test', {
                userId: window.globalSocketManager.userId,
                username: window.globalSocketManager.username,
                timestamp: Date.now()
            });
        }
    }
};

// Auto-setup when loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => window.deletionDebug.checkEnvironment(), 1000);
    });
} else {
    setTimeout(() => window.deletionDebug.checkEnvironment(), 1000);
}
