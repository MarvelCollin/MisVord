// Socket Connection Test for Docker Environment
console.log('🧪 Starting Socket Connection Test...');

// Test 1: Check environment
console.log('1. Environment Check:');
console.log('   - Host:', window.location.hostname);
console.log('   - Port:', window.location.port);
console.log('   - Protocol:', window.location.protocol);

// Test 2: Check meta tags
const socketHost = document.querySelector('meta[name="socket-host"]')?.getAttribute('content');
const socketPort = document.querySelector('meta[name="socket-port"]')?.getAttribute('content');
console.log('2. Socket Meta Configuration:');
console.log('   - Socket Host:', socketHost);
console.log('   - Socket Port:', socketPort);

// Test 3: Check Socket.IO availability
console.log('3. Socket.IO Check:');
console.log('   - Socket.IO available:', typeof io !== 'undefined');

// Test 4: Test connection to socket server
if (typeof io !== 'undefined') {
    console.log('4. Testing Socket Connection...');
    
    const testSocketHost = socketHost || window.location.hostname;
    const testSocketPort = socketPort || '1002';
    const testSocketUrl = `http://${testSocketHost}:${testSocketPort}`;
      console.log('   - Attempting connection to:', testSocketUrl);
    console.log('   - Using path: /socket.io');    console.log('   - Transports: ["polling", "websocket"] (Testing both)');
    
    const testSocket = io(testSocketUrl, {
        path: '/socket.io',
        transports: ['polling', 'websocket'],  // Allow both for testing
        timeout: 10000,
        forceNew: true,
        reconnection: false,
        upgrade: true,  // Allow transport upgrades
        autoConnect: true
    });
    
    testSocket.on('connect', () => {
        console.log('✅ Socket connection successful!');
        console.log('   - Socket ID:', testSocket.id);
        console.log('   - Transport:', testSocket.io.engine.transport.name);
        console.log('   - Ready state:', testSocket.io.engine.readyState);
        testSocket.disconnect();
    });
    
    testSocket.on('connect_error', (error) => {
        console.error('❌ Socket connection failed:', error);
        console.error('   - Error type:', error.type);
        console.error('   - Error message:', error.message);
        console.error('   - Error description:', error.description);
        console.error('   - Tried URL:', testSocketUrl);
        console.error('   - Error context:', error.context);
    });
    
    testSocket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
    });
    
    // Additional transport debugging
    testSocket.on('upgrade', () => {
        console.log('⬆️ Transport upgraded to:', testSocket.io.engine.transport.name);
    });
    
    testSocket.on('upgradeError', (error) => {
        console.warn('⚠️ Transport upgrade failed:', error);
    });
    
    // Timeout test
    setTimeout(() => {
        if (!testSocket.connected) {
            console.error('⏰ Socket connection test timeout');
            console.error('   - Connection state:', testSocket.connected);
            console.error('   - Ready state:', testSocket.io.engine ? testSocket.io.engine.readyState : 'No engine');
            testSocket.disconnect();
        }
    }, 10000);
} else {
    console.error('❌ Socket.IO not available - cannot test connection');
}

// Test 5: Check Global Socket Manager
setTimeout(() => {
    console.log('5. Global Socket Manager Check:');
    console.log('   - Available:', !!window.globalSocketManager);
    
    if (window.globalSocketManager) {
        console.log('   - Connected:', window.globalSocketManager.connected);
        console.log('   - Authenticated:', window.globalSocketManager.authenticated);
        console.log('   - Ready:', window.globalSocketManager.isReady ? window.globalSocketManager.isReady() : 'Unknown');
    }
}, 2000);

// Test 6: Check Messaging System
setTimeout(() => {
    console.log('6. Messaging System Check:');
    console.log('   - Available:', !!window.MisVordMessaging);
    
    if (window.MisVordMessaging) {
        console.log('   - Initialized:', window.MisVordMessaging.initialized);
        console.log('   - Connected:', window.MisVordMessaging.connected);
        console.log('   - Socket:', !!window.MisVordMessaging.socket);
    }
}, 3000);

window.socketConnectionTest = {    testConnection: function() {
        console.log('🔄 Running manual socket test (DOCKER WebSocket only)...');
        const socketHost = document.querySelector('meta[name="socket-host"]')?.getAttribute('content') || window.location.hostname;
        const socketPort = document.querySelector('meta[name="socket-port"]')?.getAttribute('content') || '1002';
        
        if (typeof io !== 'undefined') {
            const testSocketUrl = `http://${socketHost}:${socketPort}`;
            
            console.log('Testing connection to:', testSocketUrl);
            console.log('With path: /socket.io');
            console.log('Transport: WebSocket only (Docker mode)');
            
            // Test websocket only - no fallbacks
            const wsTestSocket = io(testSocketUrl, {
                path: '/socket.io',
                transports: ['websocket'],  // ONLY websocket
                timeout: 10000,
                forceNew: true,
                reconnection: false,
                upgrade: false
            });            
            wsTestSocket.on('connect', () => {
                console.log('✅ Docker WebSocket test: Connection successful!');
                console.log('   - Socket ID:', wsTestSocket.id);
                console.log('   - Transport:', wsTestSocket.io.engine.transport.name);
                
                // Disconnect after successful test
                setTimeout(() => {
                    wsTestSocket.disconnect();
                    console.log('🔌 Docker WebSocket test completed successfully');
                }, 1000);
            });
            
            wsTestSocket.on('connect_error', (error) => {
                console.error('❌ Docker WebSocket test failed:', error);
                console.error('   - Error type:', error.type);
                console.error('   - Error message:', error.message);
                console.error('   - Check if Docker containers are running');
            });
            
            setTimeout(() => {
                if (!wsTestSocket.connected) {
                    console.error('⏰ Docker WebSocket test timeout');
                    wsTestSocket.disconnect();
                }
            }, 10000);
        } else {
            console.error('❌ Socket.IO not available');
        }
    },
    
    testHealthEndpoint: async function() {
        console.log('🏥 Testing health endpoint...');
        const socketHost = document.querySelector('meta[name="socket-host"]')?.getAttribute('content') || window.location.hostname;
        const socketPort = document.querySelector('meta[name="socket-port"]')?.getAttribute('content') || '1002';
        const healthUrl = `http://${socketHost}:${socketPort}/health`;
        
        try {
            const response = await fetch(healthUrl);
            const data = await response.json();
            console.log('✅ Health endpoint accessible:', data);
        } catch (error) {
            console.error('❌ Health endpoint failed:', error.message);
        }
    },
    
    getStatus: function() {
        return {
            socketIO: typeof io !== 'undefined',
            globalSocketManager: !!window.globalSocketManager,
            messaging: !!window.MisVordMessaging,
            socketHost: document.querySelector('meta[name="socket-host"]')?.getAttribute('content'),
            socketPort: document.querySelector('meta[name="socket-port"]')?.getAttribute('content'),
            currentURL: window.location.href
        };
    }
};

console.log('💡 Use socketConnectionTest.testConnection() to manually test connection');
console.log('💡 Use socketConnectionTest.testHealthEndpoint() to test health endpoint');
console.log('💡 Use socketConnectionTest.getStatus() to check current status');

// Auto-run health endpoint test
setTimeout(() => {
    if (window.socketConnectionTest) {
        window.socketConnectionTest.testHealthEndpoint();
    }
}, 1000);
