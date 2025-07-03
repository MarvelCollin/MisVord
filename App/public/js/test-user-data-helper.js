/**
 * Test script to verify user data helper functionality
 * This can be run in the browser console to test the fixes
 */
console.log('🧪 Testing User Data Helper Functionality...');

// Test 1: Check if UserDataHelper is available
if (window.userDataHelper) {
    console.log('✅ UserDataHelper is available');
} else {
    console.error('❌ UserDataHelper is not available');
}

// Test 2: Check if UserAPI is available
if (window.userAPI) {
    console.log('✅ UserAPI is available');
} else {
    console.error('❌ UserAPI is not available');
}

// Test 3: Test user ID extraction
if (window.userDataHelper) {
    const testCases = [
        { input: 'testuser_123456', expected: '123456' },
        { input: '789012', expected: '789012' },
        { input: 'user_without_id', expected: null },
        { input: 'user_123_with_456', expected: '456' }
    ];
    
    console.log('🔍 Testing user ID extraction:');
    testCases.forEach(testCase => {
        const result = window.userDataHelper.extractUserId(testCase.input);
        const status = result === testCase.expected ? '✅' : '❌';
        console.log(`${status} "${testCase.input}" -> "${result}" (expected: "${testCase.expected}")`);
    });
}

// Test 4: Test display name cleaning
if (window.userDataHelper) {
    const testCases = [
        { input: 'testuser_123456', expected: 'testuser' },
        { input: 'normaluser', expected: 'normaluser' },
        { input: 'user_with_underscore_789', expected: 'user_with_underscore' }
    ];
    
    console.log('🔍 Testing display name cleaning:');
    testCases.forEach(testCase => {
        const result = window.userDataHelper.getCleanDisplayName(testCase.input);
        const status = result === testCase.expected ? '✅' : '❌';
        console.log(`${status} "${testCase.input}" -> "${result}" (expected: "${testCase.expected}")`);
    });
}

// Test 5: Test current user data
if (window.userDataHelper) {
    console.log('🔍 Testing current user data:');
    const currentUserData = window.userDataHelper.getCurrentUserData();
    console.log('Current user data:', currentUserData);
}

// Test 6: Test voice participants if available
if (window._channelVoiceParticipants) {
    console.log('✅ ChannelVoiceParticipants is available');
} else {
    console.log('ℹ️ ChannelVoiceParticipants not available (normal if not on voice page)');
}

// Test 7: Test voice call section if available
if (window.voiceCallSection) {
    console.log('✅ VoiceCallSection is available');
} else {
    console.log('ℹ️ VoiceCallSection not available (normal if not in voice call)');
}

console.log('🧪 User Data Helper test complete!');

// Export test function for manual testing
window.testUserDataHelper = function() {
    if (!window.userDataHelper) {
        console.error('❌ UserDataHelper not available for testing');
        return;
    }
    
    console.log('🧪 Manual test - fetching user data for current user...');
    const userId = window.currentUserId;
    
    if (userId) {
        window.userDataHelper.getUserData(userId)
            .then(userData => {
                console.log('✅ Successfully fetched user data:', userData);
            })
            .catch(error => {
                console.error('❌ Failed to fetch user data:', error);
            });
    } else {
        console.warn('⚠️ No current user ID available for testing');
    }
};
