class SocketConnectionTest {
    constructor() {
        this.testResults = [];
        this.testContainer = null;
    }

    createTestUI() {
        const existingTest = document.getElementById('socket-connection-test');
        if (existingTest) {
            existingTest.remove();
        }

        this.testContainer = document.createElement('div');
        this.testContainer.id = 'socket-connection-test';
        this.testContainer.className = 'fixed top-4 right-4 bg-gray-900 border border-gray-600 rounded-lg p-4 text-white z-50 max-w-md';
        this.testContainer.innerHTML = `
            <div class="flex items-center justify-between mb-3">
                <h3 class="text-lg font-bold">Socket Connection Test</h3>
                <button onclick="this.parentElement.parentElement.remove()" class="text-gray-400 hover:text-white">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div id="test-results" class="space-y-2 text-sm">
                <div class="text-gray-400">Starting tests...</div>
            </div>
            <div class="mt-3 flex space-x-2">
                <button onclick="window.socketTest.runTests()" class="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm">
                    Run Tests
                </button>
                <button onclick="window.socketTest.debugConnection()" class="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm">
                    Debug
                </button>
            </div>
        `;

        document.body.appendChild(this.testContainer);
        return this.testContainer;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
        const color = type === 'success' ? 'text-green-400' : type === 'error' ? 'text-red-400' : type === 'warning' ? 'text-yellow-400' : 'text-blue-400';
        

        
        if (this.testContainer) {
            const resultsDiv = this.testContainer.querySelector('#test-results');
            const logDiv = document.createElement('div');
            logDiv.className = `${color} text-xs`;
            logDiv.innerHTML = `<span class="text-gray-500">${timestamp}</span> ${icon} ${message}`;
            resultsDiv.appendChild(logDiv);
            resultsDiv.scrollTop = resultsDiv.scrollHeight;
        }
    }

    async runTests() {
        this.testResults = [];
        const resultsDiv = this.testContainer.querySelector('#test-results');
        resultsDiv.innerHTML = '<div class="text-gray-400">Running tests...</div>';

        this.log('Starting socket connection tests...', 'info');

        try {
            await this.testSocketIOLibrary();
            await this.testGlobalSocketManager();
            await this.testConnectionDetails();
            await this.testSocketConnection();
            await this.testChatSectionIntegration();
            
            this.log('All tests completed!', 'success');
            this.showSummary();
            
        } catch (error) {
            this.log(`Test suite failed: ${error.message}`, 'error');
        }
    }

    async testSocketIOLibrary() {
        this.log('Test 1: Socket.IO Library Availability', 'info');
        
        if (typeof io === 'undefined') {
            this.log('FAIL: Socket.IO library not loaded', 'error');
            this.testResults.push({ test: 'Socket.IO Library', status: 'FAIL', message: 'Not loaded' });
            throw new Error('Socket.IO library required for other tests');
        } else {
            this.log('PASS: Socket.IO library is available', 'success');
            this.testResults.push({ test: 'Socket.IO Library', status: 'PASS' });
        }
    }

    async testGlobalSocketManager() {
        this.log('Test 2: Global Socket Manager', 'info');
        
        if (!window.globalSocketManager) {
            this.log('FAIL: globalSocketManager not found on window', 'error');
            this.testResults.push({ test: 'Global Socket Manager', status: 'FAIL', message: 'Not found' });
            return;
        }
        
        this.log('PASS: globalSocketManager exists', 'success');
        
        const status = window.globalSocketManager.getStatus();
        this.log(`Socket Manager Status: ${JSON.stringify(status)}`, 'info');
        
        this.testResults.push({ test: 'Global Socket Manager', status: 'PASS', details: status });
    }

    async testConnectionDetails() {
        this.log('Test 3: Connection Details Detection', 'info');
        
        if (!window.globalSocketManager) {
            this.log('SKIP: No socket manager available', 'warning');
            return;
        }

        const currentHost = window.location.hostname;
        const currentPort = window.location.port;
        const expectedSocketPort = currentPort === '1001' ? '1002' : String(parseInt(currentPort) + 1);
        
        this.log(`Current location: ${currentHost}:${currentPort}`, 'info');
        this.log(`Expected socket: ${currentHost}:${expectedSocketPort}`, 'info');
        
        if (window.globalSocketManager.socketHost && window.globalSocketManager.socketPort) {
            this.log(`Detected socket: ${window.globalSocketManager.socketHost}:${window.globalSocketManager.socketPort}`, 'success');
            this.testResults.push({ 
                test: 'Connection Details', 
                status: 'PASS',
                detected: `${window.globalSocketManager.socketHost}:${window.globalSocketManager.socketPort}`
            });
        } else {
            this.log('FAIL: Socket connection details not detected', 'error');
            this.testResults.push({ test: 'Connection Details', status: 'FAIL' });
        }
    }

    async testSocketConnection() {
        this.log('Test 4: Socket Connection', 'info');
        
        if (!window.globalSocketManager) {
            this.log('SKIP: No socket manager available', 'warning');
            return;
        }

        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                this.log('TIMEOUT: Socket connection test timed out after 10 seconds', 'error');
                this.testResults.push({ test: 'Socket Connection', status: 'TIMEOUT' });
                resolve();
            }, 10000);

            const checkConnection = () => {
                const status = window.globalSocketManager.getStatus();
                
                if (status.connected && status.authenticated) {
                    clearTimeout(timeout);
                    this.log('PASS: Socket connected and authenticated', 'success');
                    this.testResults.push({ test: 'Socket Connection', status: 'PASS' });
                    resolve();
                } else if (status.lastError) {
                    clearTimeout(timeout);
                    this.log(`FAIL: Socket connection error: ${status.lastError}`, 'error');
                    this.testResults.push({ test: 'Socket Connection', status: 'FAIL', error: status.lastError });
                    resolve();
                } else {
                    this.log(`Waiting for connection... (${status.connected ? 'connected' : 'disconnected'}, ${status.authenticated ? 'authenticated' : 'not authenticated'})`, 'info');
                    setTimeout(checkConnection, 1000);
                }
            };

            if (!window.globalSocketManager.connected) {
                this.log('Attempting to initialize socket connection...', 'info');
                const userData = {
                    user_id: document.querySelector('meta[name="user-id"]')?.content,
                    username: document.querySelector('meta[name="username"]')?.content
                };
                
                if (userData.user_id && userData.username) {
                    window.globalSocketManager.init(userData);
                }
            }

            checkConnection();
        });
    }

    async testChatSectionIntegration() {
        this.log('Test 5: Chat Section Integration', 'info');
        
        if (!window.chatSection) {
            this.log('INFO: No active chat section found (this is normal on non-chat pages)', 'info');
            this.testResults.push({ test: 'Chat Section Integration', status: 'SKIP', message: 'No chat section active' });
            return;
        }

        const socketStatus = window.chatSection.getDetailedSocketStatus();
        this.log(`Chat Section Socket Status: ${JSON.stringify(socketStatus)}`, 'info');
        
        if (socketStatus.isReady) {
            this.log('PASS: Chat section sees socket as ready', 'success');
            this.testResults.push({ test: 'Chat Section Integration', status: 'PASS' });
        } else {
            this.log(`FAIL: Chat section socket not ready: ${socketStatus.readyReason}`, 'error');
            this.testResults.push({ test: 'Chat Section Integration', status: 'FAIL', reason: socketStatus.readyReason });
        }
    }

    showSummary() {
        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        const skipped = this.testResults.filter(r => r.status === 'SKIP').length;
        
        this.log(`Test Summary: ${passed} passed, ${failed} failed, ${skipped} skipped`, 
            failed > 0 ? 'error' : 'success');
    }

    debugConnection() {
        this.log('=== Socket Debug Information ===', 'info');
        
        this.log(`Current URL: ${window.location.href}`, 'info');
        this.log(`Socket.IO available: ${typeof io !== 'undefined'}`, 'info');
        this.log(`Global Socket Manager: ${!!window.globalSocketManager}`, 'info');
        
        if (window.globalSocketManager) {
            const status = window.globalSocketManager.getStatus();
            this.log(`Socket Status: ${JSON.stringify(status, null, 2)}`, 'info');
            
            if (window.globalSocketManager.io) {
                this.log(`Socket ID: ${window.globalSocketManager.io.id}`, 'info');
                this.log(`Socket Connected: ${window.globalSocketManager.io.connected}`, 'info');
            }
        }
        
        if (window.chatSection) {
            const chatStatus = window.chatSection.getDetailedSocketStatus();
            this.log(`Chat Section Status: ${JSON.stringify(chatStatus, null, 2)}`, 'info');
        }
        
        this.log(`Socket Initialized Flag: ${window.__SOCKET_INITIALISED__}`, 'info');
    }
}

window.socketTest = new SocketConnectionTest();

window.showSocketTest = function() {
    window.socketTest.createTestUI();
    window.socketTest.runTests();
};

