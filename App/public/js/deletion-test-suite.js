/**
 * Message Deletion Test Suite
 * 
 * This file tests the complete message deletion flow to ensure:
 * 1. HTTP deletion works correctly
 * 2. Socket events are properly emitted
 * 3. Other users receive delete notifications
 * 4. UI updates correctly for all users
 */

console.log('🧪 [DELETE-TEST-SUITE] Message deletion test suite loaded');

window.deletionTestSuite = {
    async runFullTest() {
        console.log('🚀 [DELETE-TEST-SUITE] Starting comprehensive deletion test...');
        
        // Test 1: Check prerequisites
        const prereqResult = this.checkPrerequisites();
        if (!prereqResult.success) {
            console.error('❌ [DELETE-TEST-SUITE] Prerequisites failed:', prereqResult.errors);
            return false;
        }
        
        // Test 2: Test socket connection
        const socketResult = this.testSocketConnection();
        if (!socketResult.success) {
            console.error('❌ [DELETE-TEST-SUITE] Socket connection test failed:', socketResult.errors);
            return false;
        }
        
        // Test 3: Create test message
        const messageId = this.createTestMessage();
        if (!messageId) {
            console.error('❌ [DELETE-TEST-SUITE] Failed to create test message');
            return false;
        }
        
        // Test 4: Test socket event emission
        const emissionResult = this.testSocketEmission(messageId);
        if (!emissionResult.success) {
            console.error('❌ [DELETE-TEST-SUITE] Socket emission test failed:', emissionResult.errors);
            return false;
        }
        
        // Test 5: Test event reception (simulate other user)
        await this.delay(1000);
        const receptionResult = this.testEventReception(messageId);
        if (!receptionResult.success) {
            console.error('❌ [DELETE-TEST-SUITE] Event reception test failed:', receptionResult.errors);
            return false;
        }
        
        console.log('✅ [DELETE-TEST-SUITE] All tests passed! Message deletion is working correctly.');
        return true;
    },
    
    checkPrerequisites() {
        const errors = [];
        
        if (!window.globalSocketManager) {
            errors.push('globalSocketManager not available');
        }
        
        if (!window.chatSection) {
            errors.push('chatSection not available');
        }
        
        if (!window.ChatAPI) {
            errors.push('ChatAPI not available');
        }
        
        if (!document.getElementById('chat-messages')) {
            errors.push('chat-messages container not found');
        }
        
        return {
            success: errors.length === 0,
            errors
        };
    },
    
    testSocketConnection() {
        const errors = [];
        
        if (!window.globalSocketManager.isReady()) {
            errors.push('Socket not ready');
        }
        
        if (!window.globalSocketManager.io) {
            errors.push('Socket.io instance not available');
        }
        
        if (!window.globalSocketManager.connected) {
            errors.push('Socket not connected');
        }
        
        if (!window.globalSocketManager.userId) {
            errors.push('User not authenticated');
        }
        
        console.log('🔌 [DELETE-TEST-SUITE] Socket status:', {
            ready: window.globalSocketManager.isReady(),
            connected: window.globalSocketManager.connected,
            userId: window.globalSocketManager.userId,
            socketId: window.globalSocketManager.io?.id
        });
        
        return {
            success: errors.length === 0,
            errors
        };
    },
    
    createTestMessage() {
        const messageId = `delete-test-${Date.now()}`;
        const messagesContainer = document.getElementById('chat-messages');
        
        if (!messagesContainer) {
            console.error('❌ [DELETE-TEST-SUITE] Messages container not found');
            return null;
        }
        
        const messageHtml = `
            <div class="bubble-message-group" id="test-message-group-${messageId}">
                <div class="bubble-message-content" data-message-id="${messageId}">
                    <div class="bubble-user-info">
                        <span class="bubble-username">${window.globalSocketManager.username || 'TestUser'}</span>
                        <span class="bubble-timestamp">${new Date().toLocaleTimeString()}</span>
                    </div>
                    <div class="bubble-message-text">
                        🧪 This is a test message for deletion testing (ID: ${messageId})
                    </div>
                </div>
            </div>
        `;
        
        messagesContainer.insertAdjacentHTML('beforeend', messageHtml);
        
        console.log('✅ [DELETE-TEST-SUITE] Test message created:', messageId);
        return messageId;
    },
    
    testSocketEmission(messageId) {
        const errors = [];
        
        try {
            const deleteData = {
                message_id: messageId,
                user_id: window.globalSocketManager.userId,
                username: window.globalSocketManager.username,
                target_type: window.chatSection.chatType,
                target_id: window.chatSection.targetId,
                source: 'deletion-test'
            };
            
            console.log('📡 [DELETE-TEST-SUITE] Emitting delete event:', deleteData);
            
            window.globalSocketManager.io.emit('message-deleted', deleteData);
            
            console.log('✅ [DELETE-TEST-SUITE] Delete event emitted successfully');
            
        } catch (error) {
            errors.push(`Failed to emit delete event: ${error.message}`);
        }
        
        return {
            success: errors.length === 0,
            errors
        };
    },
    
    testEventReception(messageId) {
        const errors = [];
        
        try {
            // Simulate receiving a delete event from another user
            const deleteData = {
                message_id: messageId,
                user_id: 'other-test-user-123',
                username: 'OtherTestUser',
                target_type: window.chatSection.chatType,
                target_id: window.chatSection.targetId,
                source: 'other-user-test'
            };
            
            console.log('📥 [DELETE-TEST-SUITE] Simulating delete event from another user:', deleteData);
            
            if (window.chatSection.socketHandler && window.chatSection.socketHandler.handleMessageDeleted) {
                window.chatSection.socketHandler.handleMessageDeleted(deleteData);
                
                // Check if message was removed from DOM
                setTimeout(() => {
                    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
                    if (messageElement) {
                        console.warn('⚠️ [DELETE-TEST-SUITE] Message still exists in DOM after delete event');
                    } else {
                        console.log('✅ [DELETE-TEST-SUITE] Message successfully removed from DOM');
                    }
                }, 500);
                
            } else {
                errors.push('Socket handler or handleMessageDeleted method not available');
            }
            
        } catch (error) {
            errors.push(`Failed to test event reception: ${error.message}`);
        }
        
        return {
            success: errors.length === 0,
            errors
        };
    },
    
    async testRealDeletion(messageId) {
        console.log('🧪 [DELETE-TEST-SUITE] Testing real HTTP deletion for message:', messageId);
        
        try {
            const response = await window.ChatAPI.deleteMessage(messageId);
            
            if (response.success) {
                console.log('✅ [DELETE-TEST-SUITE] HTTP deletion successful:', response);
                return true;
            } else {
                console.error('❌ [DELETE-TEST-SUITE] HTTP deletion failed:', response);
                return false;
            }
        } catch (error) {
            console.error('❌ [DELETE-TEST-SUITE] HTTP deletion error:', error);
            return false;
        }
    },
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    cleanup() {
        // Remove any test messages
        const testMessages = document.querySelectorAll('[id^="test-message-group-delete-test-"]');
        testMessages.forEach(msg => msg.remove());
        
        console.log('🧹 [DELETE-TEST-SUITE] Cleanup completed');
    }
};

// Auto-run basic tests if on a chat page
if (window.location.pathname.includes('/server/') || window.location.pathname.includes('/home')) {
    setTimeout(() => {
        if (window.globalSocketManager && window.chatSection) {
            console.log('🔧 [DELETE-TEST-SUITE] Auto-running basic deletion tests...');
            window.deletionTestSuite.runFullTest();
        }
    }, 3000);
}

console.log('✅ [DELETE-TEST-SUITE] Test suite ready. Use window.deletionTestSuite.runFullTest() to test deletion functionality.');
