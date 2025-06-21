// Comprehensive Socket Connection Test
console.log('🔧 Starting comprehensive socket connection test...');

window.socketDiagnostics = {
    results: {},
    
    async runFullDiagnostics() {
        console.log('🧪 Running full socket diagnostics...');
        
        // Test 1: Check if Socket.IO is loaded
        this.results.socketIOLoaded = this.testSocketIOLoaded();
        
        // Test 2: Check meta tags
        this.results.metaTags = this.testMetaTags();
        
        // Test 3: Check Docker containers
        this.results.dockerHealth = await this.testDockerHealth();
        
        // Test 4: Test socket connection
        this.results.socketConnection = await this.testSocketConnection();
        
        // Test 5: Check global socket manager
        this.results.globalSocketManager = this.testGlobalSocketManager();
        
        // Test 6: Check messaging system
        this.results.messagingSystem = this.testMessagingSystem();
        
        // Test 7: Check user authentication
        this.results.userAuth = this.testUserAuthentication();
        
        this.printResults();
        return this.results;
    },
    
    testSocketIOLoaded() {
        const result = {
            available: typeof io !== 'undefined',
            version: typeof io !== 'undefined' ? io.version : 'N/A'
        };
        
        console.log(`${result.available ? '✅' : '❌'} Socket.IO Library: ${result.available ? 'Loaded' : 'Not loaded'}`);
        if (result.available) {
            console.log(`   Version: ${result.version}`);
        }
        
        return result;
    },
    
    testMetaTags() {
        const socketHost = document.querySelector('meta[name="socket-host"]')?.getAttribute('content');
        const socketPort = document.querySelector('meta[name="socket-port"]')?.getAttribute('content');
        
        const result = {
            host: socketHost,
            port: socketPort,
            valid: !!socketHost && !!socketPort
        };
        
        console.log(`${result.valid ? '✅' : '❌'} Meta Tags: ${result.valid ? 'Present' : 'Missing'}`);
        console.log(`   Host: ${result.host}`);
        console.log(`   Port: ${result.port}`);
        
        return result;
    },
    
    async testDockerHealth() {
        const healthEndpoints = [
            { name: 'Socket Server', url: 'http://localhost:1002/health' },
            { name: 'PHP App', url: 'http://localhost:1001/health' }
        ];
        
        const results = {};
        
        for (const endpoint of healthEndpoints) {
            try {
                const response = await fetch(endpoint.url, { 
                    method: 'GET',
                    timeout: 5000 
                });
                
                results[endpoint.name] = {
                    status: response.status,
                    ok: response.ok,
                    data: response.ok ? await response.json() : null
                };
                
                console.log(`${response.ok ? '✅' : '❌'} ${endpoint.name}: ${response.ok ? 'Healthy' : 'Unhealthy'} (${response.status})`);
                
            } catch (error) {
                results[endpoint.name] = {
                    status: 'error',
                    ok: false,
                    error: error.message
                };
                
                console.log(`❌ ${endpoint.name}: Error - ${error.message}`);
            }
        }
        
        return results;
    },
    
    async testSocketConnection() {
        if (typeof io === 'undefined') {
            console.log('❌ Socket Connection: Cannot test - Socket.IO not loaded');
            return { connected: false, error: 'Socket.IO not loaded' };
        }
        
        const socketHost = document.querySelector('meta[name="socket-host"]')?.getAttribute('content') || 'localhost';
        const socketPort = document.querySelector('meta[name="socket-port"]')?.getAttribute('content') || '1002';
        const socketUrl = `http://${socketHost}:${socketPort}`;
        
        console.log(`🔌 Testing socket connection to ${socketUrl}...`);
        
        return new Promise((resolve) => {
            const testSocket = io(socketUrl, {
                transports: ['polling', 'websocket'],
                timeout: 8000,
                forceNew: true,
                reconnection: false
            });
            
            let resolved = false;
            
            const resolveOnce = (result) => {
                if (!resolved) {
                    resolved = true;
                    testSocket.disconnect();
                    resolve(result);
                }
            };
            
            testSocket.on('connect', () => {
                console.log('✅ Socket Connection: Successful');
                console.log(`   Socket ID: ${testSocket.id}`);
                console.log(`   Transport: ${testSocket.io.engine.transport.name}`);
                
                resolveOnce({
                    connected: true,
                    socketId: testSocket.id,
                    transport: testSocket.io.engine.transport.name
                });
            });
            
            testSocket.on('connect_error', (error) => {
                console.log('❌ Socket Connection: Failed');
                console.log(`   Error: ${error.message}`);
                
                resolveOnce({
                    connected: false,
                    error: error.message,
                    type: error.type
                });
            });
            
            setTimeout(() => {
                resolveOnce({
                    connected: false,
                    error: 'Connection timeout'
                });
            }, 10000);
        });
    },
    
    testGlobalSocketManager() {
        const hasManager = !!window.globalSocketManager;
        const result = {
            exists: hasManager,
            initialized: hasManager ? window.globalSocketManager.initialized : false,
            connected: hasManager ? window.globalSocketManager.connected : false,
            authenticated: hasManager ? window.globalSocketManager.authenticated : false,
            isReady: hasManager && window.globalSocketManager.isReady ? window.globalSocketManager.isReady() : false
        };
        
        console.log(`${hasManager ? '✅' : '❌'} Global Socket Manager: ${hasManager ? 'Available' : 'Not available'}`);
        if (hasManager) {
            console.log(`   Initialized: ${result.initialized}`);
            console.log(`   Connected: ${result.connected}`);
            console.log(`   Authenticated: ${result.authenticated}`);
            console.log(`   Ready: ${result.isReady}`);
        }
        
        return result;
    },
    
    testMessagingSystem() {
        const hasMessaging = !!window.MisVordMessaging;
        const result = {
            exists: hasMessaging,
            connected: hasMessaging ? window.MisVordMessaging.connected : false,
            authenticated: hasMessaging ? window.MisVordMessaging.authenticated : false,
            waitingForGlobalSocket: hasMessaging ? window.MisVordMessaging.waitingForGlobalSocket : false
        };
        
        console.log(`${hasMessaging ? '✅' : '❌'} Messaging System: ${hasMessaging ? 'Available' : 'Not available'}`);
        if (hasMessaging) {
            console.log(`   Connected: ${result.connected}`);
            console.log(`   Authenticated: ${result.authenticated}`);
            console.log(`   Waiting for Global Socket: ${result.waitingForGlobalSocket}`);
        }
        
        return result;
    },
    
    testUserAuthentication() {
        const userIdMeta = document.querySelector('meta[name="user-id"]')?.getAttribute('content');
        const usernameMeta = document.querySelector('meta[name="username"]')?.getAttribute('content');
        const authMeta = document.querySelector('meta[name="user-authenticated"]')?.getAttribute('content');
        
        const bodyUserId = document.body.getAttribute('data-user-id');
        const bodyUsername = document.body.getAttribute('data-username');
        
        const result = {
            metaTags: {
                userId: userIdMeta,
                username: usernameMeta,
                authenticated: authMeta === 'true'
            },
            bodyData: {
                userId: bodyUserId,
                username: bodyUsername
            },
            hasUserData: !!(userIdMeta || bodyUserId)
        };
        
        console.log(`${result.hasUserData ? '✅' : '❌'} User Authentication: ${result.hasUserData ? 'User data available' : 'No user data'}`);
        if (result.hasUserData) {
            console.log(`   User ID: ${userIdMeta || bodyUserId}`);
            console.log(`   Username: ${usernameMeta || bodyUsername}`);
            console.log(`   Authenticated: ${result.metaTags.authenticated}`);
        }
        
        return result;
    },
    
    printResults() {
        console.log('\n📊 SOCKET DIAGNOSTICS SUMMARY');
        console.log('================================');
        
        const allTests = [
            { name: 'Socket.IO Library', result: this.results.socketIOLoaded, key: 'available' },
            { name: 'Meta Tags', result: this.results.metaTags, key: 'valid' },
            { name: 'Socket Connection', result: this.results.socketConnection, key: 'connected' },
            { name: 'Global Socket Manager', result: this.results.globalSocketManager, key: 'isReady' },
            { name: 'Messaging System', result: this.results.messagingSystem, key: 'exists' },
            { name: 'User Authentication', result: this.results.userAuth, key: 'hasUserData' }
        ];
        
        let allPassed = true;
        
        allTests.forEach(test => {
            const passed = test.result && test.result[test.key];
            if (!passed) allPassed = false;
            console.log(`${passed ? '✅' : '❌'} ${test.name}: ${passed ? 'PASS' : 'FAIL'}`);
        });
        
        console.log('\n🎯 OVERALL STATUS:');
        if (allPassed) {
            console.log('✅ ALL SYSTEMS OPERATIONAL');
        } else {
            console.log('❌ ISSUES DETECTED - Check individual test results above');
        }
        
        return allPassed;
    }
};

// Auto-run diagnostics after page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => window.socketDiagnostics.runFullDiagnostics(), 2000);
    });
} else {
    setTimeout(() => window.socketDiagnostics.runFullDiagnostics(), 2000);
}

console.log('💡 Use window.socketDiagnostics.runFullDiagnostics() to run diagnostics manually');
