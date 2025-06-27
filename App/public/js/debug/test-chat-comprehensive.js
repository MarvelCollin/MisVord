class ChatSystemTester {
    constructor() {
        this.results = [];
        this.testId = 0;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const entry = { id: ++this.testId, timestamp, message, type };
        this.results.push(entry);
        
        const color = {
            'info': '#3498db',
            'success': '#27ae60',
            'error': '#e74c3c',
            'warning': '#f39c12'
        }[type] || '#3498db';
        
        console.log(`%c[${timestamp}] ${message}`, `color: ${color}; font-weight: bold;`);
    }

    async testDatabaseConnections() {
        this.log('🔗 Testing Database Connections', 'info');
        
        try {
            const channelResponse = await fetch('/api/chat/channel/1/messages?limit=1');
            const channelData = await channelResponse.json();
            
            if (channelData.success !== false) {
                this.log('✅ Channel messages endpoint accessible', 'success');
            } else {
                this.log('❌ Channel messages endpoint failed', 'error');
            }
        } catch (error) {
            this.log(`❌ Channel messages test failed: ${error.message}`, 'error');
        }

        try {
            const dmResponse = await fetch('/api/chat/dm/1/messages?limit=1');
            const dmData = await dmResponse.json();
            
            if (dmData.success !== false) {
                this.log('✅ DM messages endpoint accessible', 'success');
            } else {
                this.log('❌ DM messages endpoint failed', 'error');
            }
        } catch (error) {
            this.log(`❌ DM messages test failed: ${error.message}`, 'error');
        }
    }

    async testMessageSending() {
        this.log('📤 Testing Message Sending', 'info');
        
        if (!window.ChatAPI) {
            this.log('❌ ChatAPI not available', 'error');
            return;
        }

        const targetId = document.querySelector('meta[name="chat-id"]')?.content;
        const chatType = document.querySelector('meta[name="chat-type"]')?.content;
        
        if (!targetId || !chatType) {
            this.log('❌ No active chat context found', 'error');
            return;
        }

        try {
            const testMessage = `Test message ${Date.now()}`;
            const response = await window.ChatAPI.sendMessage(targetId, testMessage, chatType);
            
            if (response && response.success) {
                this.log('✅ Message sending successful', 'success');
                
                setTimeout(() => {
                    const messageElement = document.querySelector(`[data-message-id="${response.data.message.id}"]`);
                    if (messageElement) {
                        this.log('✅ Message appeared in DOM', 'success');
                    } else {
                        this.log('❌ Message not found in DOM', 'error');
                    }
                }, 1000);
            } else {
                this.log('❌ Message sending failed', 'error');
            }
        } catch (error) {
            this.log(`❌ Message sending error: ${error.message}`, 'error');
        }
    }

    async testReactions() {
        this.log('👍 Testing Reactions', 'info');
        
        if (!window.ChatAPI) {
            this.log('❌ ChatAPI not available', 'error');
            return;
        }

        const messageElements = document.querySelectorAll('[data-message-id]');
        if (messageElements.length === 0) {
            this.log('❌ No messages found to test reactions', 'error');
            return;
        }

        const testMessage = messageElements[messageElements.length - 1];
        const messageId = testMessage.getAttribute('data-message-id');

        try {
            const addResponse = await window.ChatAPI.addReaction(messageId, '👍');
            if (addResponse && addResponse.success !== false) {
                this.log('✅ Reaction add successful', 'success');
                
                setTimeout(async () => {
                    try {
                        const removeResponse = await window.ChatAPI.removeReaction(messageId, '👍');
                        if (removeResponse && removeResponse.success !== false) {
                            this.log('✅ Reaction remove successful', 'success');
                        } else {
                            this.log('❌ Reaction remove failed', 'error');
                        }
                    } catch (error) {
                        this.log(`❌ Reaction remove error: ${error.message}`, 'error');
                    }
                }, 1000);
            } else {
                this.log('❌ Reaction add failed', 'error');
            }
        } catch (error) {
            this.log(`❌ Reaction test error: ${error.message}`, 'error');
        }
    }

    async testPinning() {
        this.log('📌 Testing Message Pinning', 'info');
        
        if (!window.ChatAPI) {
            this.log('❌ ChatAPI not available', 'error');
            return;
        }

        const messageElements = document.querySelectorAll('[data-message-id]');
        if (messageElements.length === 0) {
            this.log('❌ No messages found to test pinning', 'error');
            return;
        }

        const testMessage = messageElements[messageElements.length - 1];
        const messageId = testMessage.getAttribute('data-message-id');

        try {
            const pinResponse = await window.ChatAPI.pinMessage(messageId);
            if (pinResponse && pinResponse.success !== false) {
                this.log('✅ Message pinning successful', 'success');
                
                setTimeout(async () => {
                    try {
                        const unpinResponse = await window.ChatAPI.pinMessage(messageId);
                        if (unpinResponse && unpinResponse.success !== false) {
                            this.log('✅ Message unpinning successful', 'success');
                        } else {
                            this.log('❌ Message unpinning failed', 'error');
                        }
                    } catch (error) {
                        this.log(`❌ Message unpinning error: ${error.message}`, 'error');
                    }
                }, 1000);
            } else {
                this.log('❌ Message pinning failed', 'error');
            }
        } catch (error) {
            this.log(`❌ Pin test error: ${error.message}`, 'error');
        }
    }

    testSocketConnection() {
        this.log('🔌 Testing Socket Connection', 'info');
        
        if (!window.globalSocketManager) {
            this.log('❌ Global socket manager not found', 'error');
            return;
        }

        if (!window.globalSocketManager.isReady()) {
            this.log('❌ Socket not ready', 'error');
            return;
        }

        if (!window.globalSocketManager.io) {
            this.log('❌ Socket IO not available', 'error');
            return;
        }

        this.log('✅ Socket connection active', 'success');
        this.log(`📡 Socket ID: ${window.globalSocketManager.io.id}`, 'info');
        this.log(`👤 User ID: ${window.globalSocketManager.userId}`, 'info');
        this.log(`🏷️ Username: ${window.globalSocketManager.username}`, 'info');

        window.globalSocketManager.io.emit('debug-rooms');
        
        const roomHandler = (roomInfo) => {
            window.globalSocketManager.io.off('debug-rooms-info', roomHandler);
            this.log(`🏠 Joined rooms: ${roomInfo.yourRooms.length}`, 'info');
            roomInfo.yourRooms.forEach(room => {
                this.log(`  - ${room}`, 'info');
            });
        };
        
        window.globalSocketManager.io.on('debug-rooms-info', roomHandler);
    }

    testRealtimeEvents() {
        this.log('⚡ Testing Real-time Events', 'info');
        
        if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
            this.log('❌ Socket not ready for real-time tests', 'error');
            return;
        }

        const originalHandlers = {};
        const testEvents = ['new-channel-message', 'user-message-dm', 'message-updated', 'message-deleted', 'reaction-added', 'reaction-removed'];
        
        testEvents.forEach(eventName => {
            const handler = (data) => {
                this.log(`📨 Received ${eventName} event`, 'success');
                console.log(`Event data:`, data);
            };
            
            window.globalSocketManager.io.on(eventName, handler);
            originalHandlers[eventName] = handler;
        });

        setTimeout(() => {
            testEvents.forEach(eventName => {
                if (originalHandlers[eventName]) {
                    window.globalSocketManager.io.off(eventName, originalHandlers[eventName]);
                }
            });
            this.log('🧹 Real-time event listeners cleaned up', 'info');
        }, 30000);

        this.log('👂 Listening for real-time events for 30 seconds...', 'info');
    }

    async testFileUpload() {
        this.log('📁 Testing File Upload', 'info');
        
        if (!window.MediaAPI) {
            this.log('❌ MediaAPI not available', 'error');
            return;
        }

        const testBlob = new Blob(['test file content'], { type: 'text/plain' });
        const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });
        const formData = new FormData();
        formData.append('file', testFile);

        try {
            const uploadResult = await window.MediaAPI.uploadFile(formData);
            if (uploadResult && uploadResult.success !== false) {
                this.log('✅ File upload successful', 'success');
                this.log(`📎 Upload URL: ${uploadResult.url}`, 'info');
            } else {
                this.log('❌ File upload failed', 'error');
            }
        } catch (error) {
            this.log(`❌ File upload error: ${error.message}`, 'error');
        }
    }

    async runAllTests() {
        this.log('🚀 Starting Comprehensive Chat System Tests', 'info');
        this.results = [];
        
        await this.testDatabaseConnections();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        this.testSocketConnection();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await this.testMessageSending();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await this.testReactions();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await this.testPinning();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await this.testFileUpload();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        this.testRealtimeEvents();
        
        setTimeout(() => {
            this.generateReport();
        }, 5000);
    }

    generateReport() {
        this.log('📊 Generating Test Report', 'info');
        
        const successCount = this.results.filter(r => r.type === 'success').length;
        const errorCount = this.results.filter(r => r.type === 'error').length;
        const warningCount = this.results.filter(r => r.type === 'warning').length;
        const totalTests = successCount + errorCount + warningCount;
        
        this.log(`📈 Test Results Summary:`, 'info');
        this.log(`  ✅ Passed: ${successCount}`, 'success');
        this.log(`  ❌ Failed: ${errorCount}`, 'error');
        this.log(`  ⚠️ Warnings: ${warningCount}`, 'warning');
        this.log(`  📊 Total: ${totalTests}`, 'info');
        
        if (errorCount === 0) {
            this.log('🎉 All tests passed! Chat system is fully functional.', 'success');
        } else if (errorCount < successCount) {
            this.log('⚠️ Some tests failed, but core functionality works.', 'warning');
        } else {
            this.log('🚨 Multiple test failures detected. System needs attention.', 'error');
        }
        
        console.table(this.results);
    }
}

const chatTester = new ChatSystemTester();
window.chatTester = chatTester;

window.runChatTests = () => {
    chatTester.runAllTests();
};

console.log('💬 Chat System Tester loaded. Run window.runChatTests() to start comprehensive testing.'); 