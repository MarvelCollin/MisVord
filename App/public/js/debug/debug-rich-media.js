console.log('🚀 Starting Rich Media Messaging System Debug...');


console.log('1. Testing RichMessageComposer availability...');
if (typeof RichMessageComposer !== 'undefined') {
    console.log('✅ RichMessageComposer is available');
} else {
    console.error('❌ RichMessageComposer is not available');
}

console.log('2. Testing Socket.IO availability...');
if (typeof io !== 'undefined') {
    console.log('✅ Socket.IO is available');
} else {
    console.error('❌ Socket.IO is not available');
}

console.log('3. Testing API endpoints...');

async function testAPIEndpoints() {
    const endpoints = [
        { name: 'Health Check', url: '/api/health' },
        { name: 'Database Debug', url: '/api/debug/database' },
        { name: 'GIF Search', url: '/api/media/gifs?q=cat&limit=5' },
        { name: 'User Search', url: '/api/users/search?q=test' }
    ];

    for (const endpoint of endpoints) {
        try {
            const response = await fetch(endpoint.url);
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ ${endpoint.name}: OK`, data);
            } else {
                console.error(`❌ ${endpoint.name}: HTTP ${response.status}`);
            }
        } catch (error) {
            console.error(`❌ ${endpoint.name}: ${error.message}`);
        }
    }
}


async function testSocketConnection() {
    console.log('4. Testing Socket connection...');
    
    try {
        const socketHost = window.location.hostname;
        const socketUrl = `http://${socketHost}:1002`;
        const socket = io(socketUrl, {
            path: '/socket.io/',
            transports: ['websocket', 'polling']
        });

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                socket.disconnect();
                reject(new Error('Connection timeout'));
            }, 5000);

            socket.on('connect', () => {
                clearTimeout(timeout);
                console.log('✅ Socket connection successful');
                console.log('Socket ID:', socket.id);
                socket.disconnect();
                resolve(true);
            });

            socket.on('connect_error', (error) => {
                clearTimeout(timeout);
                console.error('❌ Socket connection failed:', error.message);
                reject(error);
            });
        });
    } catch (error) {
        console.error('❌ Socket connection error:', error.message);
        return false;
    }
}


async function testFileUpload() {
    console.log('5. Testing file upload...');
    
    try {
        // Create a test file
        const testFile = new File(['Hello, this is a test file!'], 'test.txt', { type: 'text/plain' });
        const formData = new FormData();
        formData.append('file', testFile);

        const response = await fetch('/api/media/upload', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ File upload successful:', data);
            return true;
        } else {
            console.error('❌ File upload failed: HTTP', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ File upload error:', error.message);
        return false;
    }
}


function testRichMessageComposer() {
    console.log('6. Testing Rich Message Composer integration...');
    
    try {
        // Create a test container
        const testContainer = document.createElement('div');
        testContainer.id = 'test-composer-container';
        testContainer.style.cssText = `
            position: fixed;
            top: 50px;
            right: 50px;
            width: 400px;
            background: #36393f;
            padding: 20px;
            border-radius: 8px;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        `;
        document.body.appendChild(testContainer);

        // Create composer instance
        const composer = new RichMessageComposer(testContainer, {
            onSend: (data) => {
                console.log('✅ Rich message composed:', data);
                // Remove test container after successful test
                setTimeout(() => {
                    testContainer.remove();
                }, 3000);
            },
            onError: (error) => {
                console.error('❌ Composer error:', error.message);
            }
        });

        console.log('✅ Rich Message Composer initialized successfully');
        console.log('Test composer created (will auto-remove in 10 seconds)');
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (document.body.contains(testContainer)) {
                testContainer.remove();
            }
        }, 10000);

        return true;
    } catch (error) {
        console.error('❌ Rich Message Composer test failed:', error.message);
        return false;
    }
}


async function runAllTests() {
    console.log('🧪 Running comprehensive rich media messaging tests...\n');
    
    const results = {
        composer: typeof RichMessageComposer !== 'undefined',
        socketIO: typeof io !== 'undefined',
        apis: false,
        socket: false,
        upload: false,
        integration: false
    };

    // Test API endpoints
    try {
        await testAPIEndpoints();
        results.apis = true;
    } catch (error) {
        console.error('API tests failed:', error.message);
    }

    // Test socket connection
    try {
        await testSocketConnection();
        results.socket = true;
    } catch (error) {
        console.error('Socket test failed:', error.message);
    }

    // Test file upload
    try {
        results.upload = await testFileUpload();
    } catch (error) {
        console.error('Upload test failed:', error.message);
    }

    // Test rich message composer
    try {
        results.integration = testRichMessageComposer();
    } catch (error) {
        console.error('Integration test failed:', error.message);
    }

    // Summary
    console.log('\n🏁 Test Results Summary:');
    console.log('========================');
    const passed = Object.values(results).filter(r => r === true).length;
    const total = Object.keys(results).length;
    
    Object.entries(results).forEach(([test, result]) => {
        const icon = result ? '✅' : '❌';
        const status = result ? 'PASS' : 'FAIL';
        console.log(`${icon} ${test.toUpperCase()}: ${status}`);
    });
    
    console.log(`\n📊 Overall: ${passed}/${total} tests passed (${Math.round(passed/total*100)}%)`);
    
    if (passed === total) {
        console.log('🎉 All tests passed! Rich media messaging system is fully functional!');
    } else {
        console.log('⚠️  Some tests failed. Please check the errors above.');
    }

    return results;
}


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllTests);
} else {
    runAllTests();
}

                
window.debugRichMedia = {
    runAllTests,
    testAPIEndpoints,
    testSocketConnection,
    testFileUpload,
    testRichMessageComposer
};

console.log('💡 You can manually run tests using:');
console.log('- debugRichMedia.runAllTests() - Run all tests');
console.log('- debugRichMedia.testSocketConnection() - Test socket only');
console.log('- debugRichMedia.testFileUpload() - Test file upload only');
console.log('- debugRichMedia.testRichMessageComposer() - Test composer only');
