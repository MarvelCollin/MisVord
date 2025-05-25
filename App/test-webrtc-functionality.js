// WebRTC Functionality Test Script
console.log('=== WebRTC Functionality Test ===');

const fs = require('fs');
const path = require('path');

// Test results storage
const testResults = {
    socketConnection: false,
    mediaAccess: false,
    peerConnection: false,
    screenSharing: false,
    globalRoom: false,
    errors: []
};

// Helper function to log test results
function logTest(testName, passed, details = '') {
    const status = passed ? '✓' : '✗';
    const color = passed ? '\x1b[32m' : '\x1b[31m';
    console.log(`${color}${status} ${testName}\x1b[0m${details ? ` - ${details}` : ''}`);
    return passed;
}

// Test 1: Socket Server Configuration
console.log('\n1. Testing Socket Server Configuration:');
try {
    const socketServerPath = 'socket-server.js';
    if (fs.existsSync(socketServerPath)) {
        const socketContent = fs.readFileSync(socketServerPath, 'utf8');
        
        // Check global room setup
        const hasGlobalRoom = socketContent.includes('VIDEO_CHAT_ROOM') && 
                             socketContent.includes('global-video-chat');
        logTest('Global video chat room setup', hasGlobalRoom);
        
        // Check signaling handlers
        const hasSignaling = socketContent.includes('signal') && 
                            socketContent.includes('joinVideoChat');
        logTest('WebRTC signaling handlers', hasSignaling);
        
        // Check user management
        const hasUserManagement = socketContent.includes('videoChatUsers') && 
                                 socketContent.includes('userJoined');
        logTest('User management system', hasUserManagement);
        
        testResults.socketConnection = hasGlobalRoom && hasSignaling && hasUserManagement;
    } else {
        logTest('Socket server file exists', false, 'socket-server.js not found');
    }
} catch (error) {
    logTest('Socket server analysis', false, error.message);
    testResults.errors.push(`Socket server test: ${error.message}`);
}

// Test 2: WebRTC Module Structure
console.log('\n2. Testing WebRTC Module Structure:');
try {
    const webrtcModulesDir = 'public/js/webrtc-modules';
    if (fs.existsSync(webrtcModulesDir)) {
        const requiredModules = [
            'webrtc-config.js',
            'signaling.js',
            'peer-connection.js',
            'media-control.js',
            'webrtc-controller.js',
            'video-handling.js'
        ];
        
        let moduleCount = 0;
        requiredModules.forEach(module => {
            const modulePath = path.join(webrtcModulesDir, module);
            const exists = fs.existsSync(modulePath);
            logTest(`Module: ${module}`, exists);
            if (exists) moduleCount++;
        });
        
        const allModulesPresent = moduleCount === requiredModules.length;
        logTest('All required modules present', allModulesPresent, `${moduleCount}/${requiredModules.length}`);
        
    } else {
        logTest('WebRTC modules directory exists', false, 'Directory not found');
    }
} catch (error) {
    logTest('Module structure test', false, error.message);
    testResults.errors.push(`Module structure test: ${error.message}`);
}

// Test 3: Media Control Functions
console.log('\n3. Testing Media Control Functions:');
try {
    const mediaControlPath = 'public/js/webrtc-modules/media-control.js';
    if (fs.existsSync(mediaControlPath)) {
        const mediaContent = fs.readFileSync(mediaControlPath, 'utf8');
        
        // Test for essential media functions
        const functions = [
            { name: 'getUserMedia access', check: mediaContent.includes('getUserMedia') },
            { name: 'Video toggle function', check: mediaContent.includes('toggleLocalVideo') },
            { name: 'Audio toggle function', check: mediaContent.includes('toggleLocalAudio') },
            { name: 'Screen sharing start', check: mediaContent.includes('startScreenSharing') },
            { name: 'Screen sharing stop', check: mediaContent.includes('stopScreenSharing') },
            { name: 'Stream management', check: mediaContent.includes('localStream') }
        ];
        
        let functionCount = 0;
        functions.forEach(func => {
            logTest(func.name, func.check);
            if (func.check) functionCount++;
        });
        
        testResults.mediaAccess = functionCount >= 4; // At least 4 out of 6 functions should work
        
    } else {
        logTest('Media control module exists', false, 'File not found');
    }
} catch (error) {
    logTest('Media control test', false, error.message);
    testResults.errors.push(`Media control test: ${error.message}`);
}

// Test 4: Peer Connection Setup
console.log('\n4. Testing Peer Connection Setup:');
try {
    const peerConnectionPath = 'public/js/webrtc-modules/peer-connection.js';
    if (fs.existsSync(peerConnectionPath)) {
        const peerContent = fs.readFileSync(peerConnectionPath, 'utf8');
        
        // Test for RTCPeerConnection usage
        const peerTests = [
            { name: 'RTCPeerConnection creation', check: peerContent.includes('RTCPeerConnection') },
            { name: 'ICE candidate handling', check: peerContent.includes('icecandidate') },
            { name: 'Offer/Answer handling', check: peerContent.includes('createOffer') || peerContent.includes('createAnswer') },
            { name: 'Stream attachment', check: peerContent.includes('addTrack') || peerContent.includes('addStream') },
            { name: 'Connection state monitoring', check: peerContent.includes('connectionstatechange') }
        ];
        
        let peerCount = 0;
        peerTests.forEach(test => {
            logTest(test.name, test.check);
            if (test.check) peerCount++;
        });
        
        testResults.peerConnection = peerCount >= 3; // At least 3 out of 5 should work
        
    } else {
        logTest('Peer connection module exists', false, 'File not found');
    }
} catch (error) {
    logTest('Peer connection test', false, error.message);
    testResults.errors.push(`Peer connection test: ${error.message}`);
}

// Test 5: Screen Sharing Implementation
console.log('\n5. Testing Screen Sharing Implementation:');
try {
    const controllerPath = 'public/js/webrtc-modules/webrtc-controller.js';
    const mediaControlPath = 'public/js/webrtc-modules/media-control.js';
    
    if (fs.existsSync(controllerPath) && fs.existsSync(mediaControlPath)) {
        const controllerContent = fs.readFileSync(controllerPath, 'utf8');
        const mediaControlContent = fs.readFileSync(mediaControlPath, 'utf8');
        
        // Test for screen sharing functions across both modules
        const screenTests = [
            { name: 'Screen sharing toggle', check: controllerContent.includes('toggleScreenSharing') },
            { name: 'Display media API', check: mediaControlContent.includes('getDisplayMedia') },
            { name: 'Track replacement', check: controllerContent.includes('replaceTrack') },
            { name: 'Screen sharing state', check: controllerContent.includes('isScreenSharing') || controllerContent.includes('screenSharing') || mediaControlContent.includes('isScreenSharing') }
        ];
        
        let screenCount = 0;
        screenTests.forEach(test => {
            logTest(test.name, test.check);
            if (test.check) screenCount++;
        });
          testResults.screenSharing = screenCount >= 3; // At least 3 out of 4 should work
        
    } else {
        logTest('WebRTC controller/media modules exist', false, 'Files not found');
    }
} catch (error) {
    logTest('Screen sharing test', false, error.message);
    testResults.errors.push(`Screen sharing test: ${error.message}`);
}

// Test 6: Global Room Configuration
console.log('\n6. Testing Global Room Configuration:');
try {
    const signalingPath = 'public/js/webrtc-modules/signaling.js';
    if (fs.existsSync(signalingPath)) {
        const signalingContent = fs.readFileSync(signalingPath, 'utf8');
        
        // Test for room joining mechanism
        const roomTests = [
            { name: 'Room joining function', check: signalingContent.includes('joinVideoChat') || signalingContent.includes('join') },
            { name: 'Socket connection setup', check: signalingContent.includes('io(') || signalingContent.includes('socket') },
            { name: 'WebRTC config usage', check: signalingContent.includes('WebRTCConfig') },
            { name: 'Environment detection', check: signalingContent.includes('localhost') || signalingContent.includes('production') }
        ];
        
        let roomCount = 0;
        roomTests.forEach(test => {
            logTest(test.name, test.check);
            if (test.check) roomCount++;
        });
        
        testResults.globalRoom = roomCount >= 3; // At least 3 out of 4 should work
        
    } else {
        logTest('Signaling module exists', false, 'File not found');
    }
} catch (error) {
    logTest('Global room test', false, error.message);
    testResults.errors.push(`Global room test: ${error.message}`);
}

// Test 7: Main WebRTC Page Integration
console.log('\n7. Testing Main WebRTC Page Integration:');
try {
    const webrtcPagePath = 'views/pages/webrtc.php';
    if (fs.existsSync(webrtcPagePath)) {
        const pageContent = fs.readFileSync(webrtcPagePath, 'utf8');
        
        // Test for proper module loading and integration
        const integrationTests = [
            { name: 'Module loading order', check: pageContent.includes('webrtc-config') && pageContent.includes('webrtc-controller') },
            { name: 'Socket.IO inclusion', check: pageContent.includes('socket.io') },
            { name: 'Debug panel present', check: pageContent.includes('webrtcDebugPanel') },
            { name: 'Media controls UI', check: pageContent.includes('video') && pageContent.includes('audio') },
            { name: 'Global variables setup', check: pageContent.includes('window.') }
        ];
        
        let integrationCount = 0;
        integrationTests.forEach(test => {
            logTest(test.name, test.check);
            if (test.check) integrationCount++;
        });
        
        const integrationPassed = integrationCount >= 4;
        logTest('Overall integration', integrationPassed, `${integrationCount}/5 checks passed`);
        
    } else {
        logTest('WebRTC page exists', false, 'File not found');
    }
} catch (error) {
    logTest('Integration test', false, error.message);
    testResults.errors.push(`Integration test: ${error.message}`);
}

// Summary
console.log('\n=== Test Summary ===');
const overallScore = Object.values(testResults).filter(v => typeof v === 'boolean').filter(Boolean).length;
const totalTests = Object.keys(testResults).filter(key => key !== 'errors').length;

console.log(`Overall Score: ${overallScore}/${totalTests} tests passed`);

if (testResults.socketConnection) console.log('✓ Socket connection system ready');
if (testResults.mediaAccess) console.log('✓ Media access functions present');
if (testResults.peerConnection) console.log('✓ Peer connection setup available');
if (testResults.screenSharing) console.log('✓ Screen sharing implementation found');
if (testResults.globalRoom) console.log('✓ Global room configuration ready');

if (testResults.errors.length > 0) {
    console.log('\n=== Errors Found ===');
    testResults.errors.forEach(error => console.log(`❌ ${error}`));
}

// Recommendations
console.log('\n=== Recommendations ===');
if (!testResults.socketConnection) {
    console.log('🔧 Fix socket server configuration and signaling handlers');
}
if (!testResults.mediaAccess) {
    console.log('🔧 Implement or fix media access and control functions');
}
if (!testResults.peerConnection) {
    console.log('🔧 Set up proper RTCPeerConnection handling');
}
if (!testResults.screenSharing) {
    console.log('🔧 Complete screen sharing implementation');
}
if (!testResults.globalRoom) {
    console.log('🔧 Configure global room joining mechanism');
}

if (overallScore === totalTests) {
    console.log('🎉 All tests passed! WebRTC system appears to be properly configured.');
} else {
    console.log(`⚠️  ${totalTests - overallScore} issues found. Review the recommendations above.`);
}

console.log('\n=== End of Test ===');
