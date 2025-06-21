// Quick Docker Container Test
console.log('🐳 Testing Docker container connectivity...');

async function testDockerConnectivity() {
    const tests = [
        {
            name: 'PHP App Health',
            url: 'http://localhost:1001/health',
            expected: 200
        },
        {
            name: 'Socket Server Health', 
            url: 'http://localhost:1002/health',
            expected: 200
        },
        {
            name: 'Socket Server Root',
            url: 'http://localhost:1002/',
            expected: 404 // Expected - no root route
        }
    ];
    
    console.log('📊 Running connectivity tests...');
    
    for (const test of tests) {
        try {
            console.log(`🔍 Testing ${test.name}...`);
            const response = await fetch(test.url, { 
                method: 'GET',
                timeout: 5000 
            });
            
            if (response.status === test.expected) {
                console.log(`✅ ${test.name}: PASS (HTTP ${response.status})`);
                if (response.status === 200) {
                    const data = await response.json();
                    console.log(`   Data:`, data);
                }
            } else {
                console.log(`⚠️ ${test.name}: Unexpected status (HTTP ${response.status}, expected ${test.expected})`);
            }
        } catch (error) {
            console.error(`❌ ${test.name}: FAILED - ${error.message}`);
        }
    }
    
    // Test Socket.IO connection directly
    console.log('\n🔌 Testing Socket.IO connection...');
    
    if (typeof io === 'undefined') {
        console.error('❌ Socket.IO library not loaded');
        return;
    }
    
    const socketUrl = 'http://localhost:1002';
    console.log(`📡 Connecting to ${socketUrl}...`);
    
    const testSocket = io(socketUrl, {
        transports: ['websocket'],
        timeout: 5000,
        forceNew: true,
        reconnection: false
    });
    
    let connected = false;
    
    testSocket.on('connect', () => {
        connected = true;
        console.log('✅ Socket.IO connection successful!');
        console.log(`   Socket ID: ${testSocket.id}`);
        console.log(`   Transport: ${testSocket.io.engine.transport.name}`);
        
        // Test authentication
        testSocket.emit('test-auth', { 
            userId: 'test-user',
            username: 'test'
        });
        
        setTimeout(() => {
            testSocket.disconnect();
            console.log('🔌 Test socket disconnected');
        }, 2000);
    });
    
    testSocket.on('connect_error', (error) => {
        console.error('❌ Socket.IO connection failed:', error.message);
        console.error('   Error type:', error.type);
        console.error('   Description:', error.description);
    });
    
    testSocket.on('test-response', (data) => {
        console.log('📨 Received test response:', data);
    });
    
    // Timeout check
    setTimeout(() => {
        if (!connected) {
            console.error('⏰ Socket.IO connection timeout - containers may not be running');
            testSocket.disconnect();
        }
    }, 10000);
}

// Run the test
testDockerConnectivity();

// Make it available globally
window.testDockerConnectivity = testDockerConnectivity;
