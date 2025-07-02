console.log('🧪 [DEBUG-DELETION-TEST] Message deletion test loaded');

window.debugDeletion = {
    testSocketFlow: function() {
        console.log('🧪 [DEBUG-DELETION-TEST] Testing socket flow for message deletion');
        
        const testData = {
            message_id: '123',
            user_id: '456',
            username: 'TestUser',
            target_type: 'channel',
            target_id: '789',
            source: 'test'
        };
        
        if (window.globalSocketManager && window.globalSocketManager.io) {
            console.log('📡 [DEBUG-DELETION-TEST] Emitting test message-deleted event:', testData);
            window.globalSocketManager.io.emit('message-deleted', testData);
        } else {
            console.error('❌ [DEBUG-DELETION-TEST] Socket not available');
        }
    },
    
    testReceivedEvent: function() {
        console.log('🧪 [DEBUG-DELETION-TEST] Testing received message-deleted event handling');
        
        const testData = {
            message_id: '999',
            user_id: '888',
            username: 'OtherUser',
            target_type: 'channel',
            target_id: window.chatSection?.targetId || '1',
            source: 'test'
        };
        
        if (window.chatSection?.socketHandler) {
            console.log('📥 [DEBUG-DELETION-TEST] Manually triggering handleMessageDeleted:', testData);
            window.chatSection.socketHandler.handleMessageDeleted(testData);
        } else {
            console.error('❌ [DEBUG-DELETION-TEST] Socket handler not available');
        }
    },
    
    checkSocketStatus: function() {
        console.log('🧪 [DEBUG-DELETION-TEST] Checking socket status:');
        console.log('  - globalSocketManager exists:', !!window.globalSocketManager);
        console.log('  - socket connected:', window.globalSocketManager?.connected);
        console.log('  - socket ready:', window.globalSocketManager?.isReady());
        console.log('  - socket id:', window.globalSocketManager?.io?.id);
        console.log('  - user id:', window.globalSocketManager?.userId);
        console.log('  - username:', window.globalSocketManager?.username);
        console.log('  - chatSection exists:', !!window.chatSection);
        console.log('  - current chat type:', window.chatSection?.chatType);
        console.log('  - current target id:', window.chatSection?.targetId);
        console.log('  - socket handler exists:', !!window.chatSection?.socketHandler);
        console.log('  - listeners setup:', window.chatSection?.socketHandler?.socketListenersSetup);
    },
    
    createTestMessage: function() {
        console.log('🧪 [DEBUG-DELETION-TEST] Creating test message for deletion');
        
        const testId = 'test-msg-' + Date.now();
        const testHtml = `
            <div class="bubble-message-group">
                <div class="bubble-message-content" data-message-id="${testId}">
                    <div class="bubble-message-text">This is a test message for deletion testing</div>
                </div>
            </div>
        `;
        
        const messagesContainer = document.querySelector('#chat-messages .messages-container');
        if (messagesContainer) {
            messagesContainer.insertAdjacentHTML('beforeend', testHtml);
            console.log('✅ [DEBUG-DELETION-TEST] Created test message with ID:', testId);
            return testId;
        } else {
            console.error('❌ [DEBUG-DELETION-TEST] Messages container not found');
            return null;
        }
    },
    
    deleteTestMessage: function(messageId) {
        if (!messageId) {
            messageId = this.createTestMessage();
            if (!messageId) return;
        }
        
        console.log('🧪 [DEBUG-DELETION-TEST] Testing deletion of message:', messageId);
        
        const testData = {
            message_id: messageId,
            user_id: '999',
            username: 'OtherUser',
            target_type: window.chatSection?.chatType || 'channel',
            target_id: window.chatSection?.targetId || '1',
            source: 'test'
        };
        
        if (window.chatSection?.socketHandler) {
            window.chatSection.socketHandler.handleMessageDeleted(testData);
        }
    }
};

console.log('✅ [DEBUG-DELETION-TEST] Debug functions available:');
console.log('  - window.debugDeletion.testSocketFlow()');
console.log('  - window.debugDeletion.testReceivedEvent()');
console.log('  - window.debugDeletion.checkSocketStatus()');
console.log('  - window.debugDeletion.createTestMessage()');
console.log('  - window.debugDeletion.deleteTestMessage()'); 