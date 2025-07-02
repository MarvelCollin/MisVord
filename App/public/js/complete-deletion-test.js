// Complete Deletion Flow Test
console.log('🧪 [COMPLETE-DELETION-TEST] Complete deletion flow test loaded');

window.completeDeletionTest = {
    async runCompleteTest() {
        console.log('🧪 [COMPLETE-DELETION-TEST] Running complete deletion test...');
        
        // Step 1: Check environment
        if (!this.checkEnvironment()) return;
        
        // Step 2: Ensure we're in a room
        await this.ensureInRoom();
        
        // Step 3: Test the complete flow
        this.testDeletionFlow();
    },
    
    checkEnvironment() {
        console.log('🔍 [COMPLETE-DELETION-TEST] Checking environment...');
        
        if (!window.globalSocketManager?.io) {
            console.error('❌ Socket not available');
            return false;
        }
        
        if (!window.chatSection) {
            console.error('❌ Chat section not available');
            return false;
        }
        
        console.log('✅ Environment OK:', {
            socketId: window.globalSocketManager.io.id,
            userId: window.globalSocketManager.userId,
            chatType: window.chatSection.chatType,
            targetId: window.chatSection.targetId
        });
        
        return true;
    },
    
    async ensureInRoom() {
        console.log('🚪 [COMPLETE-DELETION-TEST] Ensuring we are in the correct room...');
        
        const roomData = {
            room_type: window.chatSection.chatType,
            room_id: window.chatSection.targetId
        };
        
        console.log('📡 Joining room:', roomData);
        
        return new Promise((resolve) => {
            window.globalSocketManager.io.once('room-joined', (data) => {
                console.log('✅ Room joined successfully:', data);
                resolve();
            });
            
            window.globalSocketManager.io.emit('join-room', roomData);
            
            // Fallback timeout
            setTimeout(() => {
                console.log('⏰ Room join timeout, continuing anyway...');
                resolve();
            }, 2000);
        });
    },
    
    testDeletionFlow() {
        console.log('🗑️ [COMPLETE-DELETION-TEST] Testing deletion flow...');
        
        // Create a fake message for testing
        const testMessageId = 'test-deletion-' + Date.now();
        this.createTestMessage(testMessageId);
        
        // Listen for the deletion event
        let deletionReceived = false;
        window.globalSocketManager.io.once('message-deleted', (data) => {
            deletionReceived = true;
            console.log('✅ [COMPLETE-DELETION-TEST] DELETION EVENT RECEIVED!', data);
            
            // Verify the message gets removed
            setTimeout(() => {
                const stillExists = document.querySelector(`[data-message-id="${testMessageId}"]`);
                if (!stillExists) {
                    console.log('✅ [COMPLETE-DELETION-TEST] Message successfully removed from DOM!');
                } else {
                    console.log('⚠️ [COMPLETE-DELETION-TEST] Message still in DOM');
                }
            }, 500);
        });
        
        // Emit deletion after a short delay
        setTimeout(() => {
            const deleteData = {
                message_id: testMessageId,
                user_id: window.globalSocketManager.userId,
                username: window.globalSocketManager.username,
                target_type: window.chatSection.chatType === 'channel' ? 'channel' : 'dm',
                target_id: window.chatSection.targetId,
                source: 'test-deletion'
            };
            
            console.log('📤 [COMPLETE-DELETION-TEST] Emitting deletion:', deleteData);
            window.globalSocketManager.io.emit('message-deleted', deleteData);
            
            // Check if deletion was received after timeout
            setTimeout(() => {
                if (!deletionReceived) {
                    console.error('❌ [COMPLETE-DELETION-TEST] Deletion event was NOT received!');
                }
            }, 2000);
        }, 1000);
    },
    
    createTestMessage(messageId) {
        console.log('📝 [COMPLETE-DELETION-TEST] Creating test message:', messageId);
        
        const testMessage = document.createElement('div');
        testMessage.setAttribute('data-message-id', messageId);
        testMessage.className = 'bubble-message-content test-message';
        testMessage.style.cssText = 'background: #ff4444; color: white; padding: 10px; margin: 5px; border-radius: 8px;';
        testMessage.innerHTML = `
            <div class="bubble-message-text">
                🧪 TEST MESSAGE - ${messageId} 
                <br><small>This message will be deleted in the test</small>
            </div>
        `;
        
        const container = document.querySelector('.messages-container, .chat-messages, [class*="message"]');
        if (container) {
            container.appendChild(testMessage);
            console.log('✅ Test message added to DOM');
        } else {
            console.error('❌ Could not find message container');
        }
    }
};

// Auto-run when loaded
setTimeout(() => {
    console.log('🚀 [COMPLETE-DELETION-TEST] Auto-starting comprehensive test...');
    console.log('💡 Run window.completeDeletionTest.runCompleteTest() to test full deletion flow');
    
    // Auto-run the test
    window.completeDeletionTest.runCompleteTest();
}, 2000);
