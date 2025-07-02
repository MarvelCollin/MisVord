// Room-Based Deletion Test
console.log('🧪 [ROOM-DELETION-TEST] Room-based deletion test loaded');

window.roomDeletionTest = {
    test: function() {
        console.log('🧪 [ROOM-DELETION-TEST] Testing room-based deletion flow...');
        
        if (!window.globalSocketManager || !window.globalSocketManager.io) {
            console.error('❌ [ROOM-DELETION-TEST] Socket not available');
            return;
        }
        
        if (!window.chatSection) {
            console.error('❌ [ROOM-DELETION-TEST] Chat section not available');
            return;
        }
        
        console.log('✅ [ROOM-DELETION-TEST] Environment OK - Testing with current chat context');
        
        // Check current context
        console.log('📍 [ROOM-DELETION-TEST] Current context:', {
            chatType: window.chatSection.chatType,
            targetId: window.chatSection.targetId,
            userId: window.globalSocketManager.userId,
            username: window.globalSocketManager.username
        });
        
        // Listen for deletion events
        window.globalSocketManager.io.once('message-deleted', (data) => {
            console.log('📥 [ROOM-DELETION-TEST] Received deletion event (SUCCESS!):', data);
        });
        
        // Emit deletion like the client would
        const testData = {
            message_id: 'test-msg-' + Date.now(),
            user_id: window.globalSocketManager.userId,
            username: window.globalSocketManager.username,
            target_type: window.chatSection.chatType === 'channel' ? 'channel' : 'dm',
            target_id: window.chatSection.targetId,
            source: 'room-test'
        };
        
        console.log('📤 [ROOM-DELETION-TEST] Emitting deletion event:', testData);
        window.globalSocketManager.io.emit('message-deleted', testData);
        
        setTimeout(() => {
            console.log('🔍 [ROOM-DELETION-TEST] Test completed - check for received event above');
        }, 1000);
    },
    
    compareWithReaction: function() {
        console.log('🧪 [ROOM-DELETION-TEST] Comparing deletion with reaction flow...');
        
        // Test reaction first
        const reactionData = {
            message_id: 'test-msg-' + Date.now(),
            emoji: '👍',
            user_id: window.globalSocketManager.userId,
            username: window.globalSocketManager.username,
            target_type: window.chatSection.chatType === 'channel' ? 'channel' : 'dm',
            target_id: window.chatSection.targetId,
            action: 'added'
        };
        
        window.globalSocketManager.io.once('reaction-added', (data) => {
            console.log('📥 [ROOM-DELETION-TEST] Received reaction event:', data);
        });
        
        console.log('📤 [ROOM-DELETION-TEST] Testing reaction first:', reactionData);
        window.globalSocketManager.io.emit('reaction-added', reactionData);
        
        // Then test deletion
        setTimeout(() => {
            this.test();
        }, 1500);
    }
};

// Auto-run test
setTimeout(() => {
    console.log('🚀 [ROOM-DELETION-TEST] Auto-running room-based deletion test...');
    console.log('💡 [ROOM-DELETION-TEST] Run window.roomDeletionTest.test() to test deletion');
    console.log('💡 [ROOM-DELETION-TEST] Run window.roomDeletionTest.compareWithReaction() to compare with reactions');
}, 1000);
