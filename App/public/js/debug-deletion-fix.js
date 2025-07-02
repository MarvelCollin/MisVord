console.log('🧪 [DEBUG-DELETION-FIX] Message deletion fix test loaded');

window.debugDeletionFix = {
    testDeleteEvent: function(messageId = 'test-123') {
        console.log('🧪 [DEBUG-DELETION-FIX] Testing delete event broadcast');
        
        const testData = {
            message_id: messageId,
            user_id: window.globalSocketManager?.userId || 'test-user',
            username: window.globalSocketManager?.username || 'TestUser',
            target_type: window.chatSection?.chatType || 'channel',
            target_id: window.chatSection?.targetId || '1',
            source: 'debug-test'
        };
        
        console.log('📡 [DEBUG-DELETION-FIX] Emitting delete event:', testData);
        
        if (window.globalSocketManager && window.globalSocketManager.io) {
            window.globalSocketManager.io.emit('message-deleted', testData);
            console.log('✅ [DEBUG-DELETION-FIX] Delete event emitted successfully');
        } else {
            console.error('❌ [DEBUG-DELETION-FIX] Socket not available');
        }
    },
    
    simulateOtherUserDelete: function(messageId = 'test-123') {
        console.log('🧪 [DEBUG-DELETION-FIX] Simulating delete from another user');
        
        const testData = {
            message_id: messageId,
            user_id: 'other-user-123',
            username: 'OtherUser',
            target_type: window.chatSection?.chatType || 'channel',
            target_id: window.chatSection?.targetId || '1',
            source: 'debug-other-user'
        };
        
        console.log('📥 [DEBUG-DELETION-FIX] Simulating received delete event:', testData);
        
        if (window.chatSection?.socketHandler) {
            window.chatSection.socketHandler.handleMessageDeleted(testData);
            console.log('✅ [DEBUG-DELETION-FIX] Delete handler called');
        } else {
            console.error('❌ [DEBUG-DELETION-FIX] Socket handler not available');
        }
    },
    
    checkSocketConnections: function() {
        console.log('🧪 [DEBUG-DELETION-FIX] Checking socket connections');
        
        if (window.globalSocketManager && window.globalSocketManager.io) {
            const socket = window.globalSocketManager.io;
            
            console.log('🔌 Socket Status:', {
                connected: socket.connected,
                id: socket.id,
                userId: window.globalSocketManager.userId,
                username: window.globalSocketManager.username
            });
            
            console.log('🏠 Socket Rooms:', Array.from(socket.rooms));
            
            console.log('📋 Socket Listeners:', socket.eventNames());
            
            return true;
        } else {
            console.error('❌ [DEBUG-DELETION-FIX] Socket not available');
            return false;
        }
    },
    
    createTestMessage: function(messageId = 'debug-msg-' + Date.now()) {
        console.log('🧪 [DEBUG-DELETION-FIX] Creating test message');
        
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) {
            console.error('❌ [DEBUG-DELETION-FIX] Messages container not found');
            return null;
        }
        
        const testMessageHtml = `
            <div class="bubble-message-group">
                <div class="bubble-message-content" data-message-id="${messageId}">
                    <div class="bubble-message-text">
                        This is a test message for deletion testing (ID: ${messageId})
                    </div>
                </div>
            </div>
        `;
        
        messagesContainer.insertAdjacentHTML('beforeend', testMessageHtml);
        console.log('✅ [DEBUG-DELETION-FIX] Test message created:', messageId);
        
        return messageId;
    },
    
    fullDeleteTest: function() {
        console.log('🧪 [DEBUG-DELETION-FIX] Running full delete test');
        
        const messageId = this.createTestMessage();
        if (!messageId) return;
        
        console.log('⏳ [DEBUG-DELETION-FIX] Waiting 2 seconds before testing delete...');
        
        setTimeout(() => {
            this.simulateOtherUserDelete(messageId);
        }, 2000);
        
        return messageId;
    }
};

console.log('✅ [DEBUG-DELETION-FIX] Debug functions available:');
console.log('  - window.debugDeletionFix.testDeleteEvent()');
console.log('  - window.debugDeletionFix.simulateOtherUserDelete()');
console.log('  - window.debugDeletionFix.checkSocketConnections()');
console.log('  - window.debugDeletionFix.createTestMessage()');
console.log('  - window.debugDeletionFix.fullDeleteTest()');
