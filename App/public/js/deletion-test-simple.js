// Simple Message Deletion Test
console.log('🧪 [DELETION-TEST] Simple message deletion test loaded');

window.testDeletion = {
    // Quick test for message deletion broadcasting
    test: function() {
        console.log('🧪 [DELETION-TEST] Starting quick deletion test...');
        
        // Check basic environment
        if (!window.globalSocketManager || !window.globalSocketManager.io) {
            console.error('❌ [DELETION-TEST] Socket not available');
            return;
        }
        
        if (!window.chatSection) {
            console.error('❌ [DELETION-TEST] Chat section not available');
            return;
        }
        
        console.log('✅ [DELETION-TEST] Environment OK');
        
        // Get the first message in current chat
        const firstMessage = document.querySelector('[data-message-id]');
        if (!firstMessage) {
            console.error('❌ [DELETION-TEST] No messages found to test with');
            return;
        }
        
        const messageId = firstMessage.getAttribute('data-message-id');
        console.log('🎯 [DELETION-TEST] Testing with message ID:', messageId);
        
        // Listen for the deletion event
        window.globalSocketManager.io.once('message-deleted', (data) => {
            console.log('📥 [DELETION-TEST] Received deletion event:', data);
            console.log('✅ [DELETION-TEST] Socket broadcasting works!');
        });
        
        // Emit deletion event
        const testData = {
            message_id: messageId,
            user_id: window.globalSocketManager.userId,
            username: window.globalSocketManager.username,
            target_type: window.chatSection.chatType,
            target_id: window.chatSection.targetId,
            source: 'test'
        };
        
        console.log('📤 [DELETION-TEST] Emitting deletion event:', testData);
        window.globalSocketManager.io.emit('message-deleted', testData);
        
        setTimeout(() => {
            console.log('🔍 [DELETION-TEST] Test completed - check console logs above');
        }, 1000);
    },
    
    // Test with artificial message
    testWithFakeMessage: function() {
        console.log('🧪 [DELETION-TEST] Creating fake message for test...');
        
        // Create a fake message element
        const fakeMessage = document.createElement('div');
        fakeMessage.setAttribute('data-message-id', 'test-message-999');
        fakeMessage.className = 'bubble-message-content';
        fakeMessage.innerHTML = '<div class="bubble-message-text">This is a test message</div>';
        fakeMessage.style.background = '#ff0000';
        fakeMessage.style.padding = '10px';
        fakeMessage.style.margin = '5px';
        fakeMessage.style.borderRadius = '8px';
        fakeMessage.style.color = 'white';
        
        // Add to chat
        const messagesContainer = document.querySelector('.messages-container, .chat-messages');
        if (messagesContainer) {
            messagesContainer.appendChild(fakeMessage);
            console.log('✅ [DELETION-TEST] Fake message added to chat');
            
            // Test deletion after 2 seconds
            setTimeout(() => {
                this.test();
            }, 2000);
        } else {
            console.error('❌ [DELETION-TEST] Could not find messages container');
        }
    }
};

// Auto-run basic test when loaded
setTimeout(() => {
    console.log('🚀 [DELETION-TEST] Auto-running basic test...');
    console.log('💡 [DELETION-TEST] Run window.testDeletion.test() to test deletion broadcasting');
    console.log('💡 [DELETION-TEST] Run window.testDeletion.testWithFakeMessage() to test with artificial message');
}, 1000);
