// User Authentication Debug Test
console.log('🔍 Checking user authentication status...');

function debugUserAuthentication() {
    console.log('👤 USER AUTHENTICATION DEBUG');
    console.log('============================');
    
    // Check meta tags
    const userIdMeta = document.querySelector('meta[name="user-id"]')?.getAttribute('content');
    const usernameMeta = document.querySelector('meta[name="username"]')?.getAttribute('content');
    const authMeta = document.querySelector('meta[name="user-authenticated"]')?.getAttribute('content');
    
    console.log('📋 Meta Tags:');
    console.log(`   User ID: ${userIdMeta || 'Not found'}`);
    console.log(`   Username: ${usernameMeta || 'Not found'}`);
    console.log(`   Authenticated: ${authMeta || 'Not found'}`);
    
    // Check body data attributes
    const bodyUserId = document.body.getAttribute('data-user-id');
    const bodyUsername = document.body.getAttribute('data-username');
    
    console.log('📋 Body Attributes:');
    console.log(`   User ID: ${bodyUserId || 'Not found'}`);
    console.log(`   Username: ${bodyUsername || 'Not found'}`);
    
    // Check if user data function works
    let userData = null;
    try {
        userData = getUserDataFromPage();
        console.log('📋 getUserDataFromPage() result:', userData);
    } catch (error) {
        console.log('❌ getUserDataFromPage() error:', error.message);
    }
    
    // Check global socket manager state
    if (window.globalSocketManager) {
        console.log('📋 Global Socket Manager:');
        console.log(`   User ID: ${window.globalSocketManager.userId || 'Not set'}`);
        console.log(`   Username: ${window.globalSocketManager.username || 'Not set'}`);
        console.log(`   Is Guest: ${window.globalSocketManager.isGuest}`);
        console.log(`   Initialized: ${window.globalSocketManager.initialized}`);
        console.log(`   Connected: ${window.globalSocketManager.connected}`);
        console.log(`   Authenticated: ${window.globalSocketManager.authenticated}`);
    } else {
        console.log('❌ Global Socket Manager: Not available');
    }
    
    // Summary
    const hasUserData = !!(userIdMeta || bodyUserId);
    console.log('\n🎯 SUMMARY:');
    console.log(`User Data Available: ${hasUserData ? 'YES' : 'NO'}`);
    
    if (!hasUserData) {
        console.log('❌ No user data found - user may not be logged in');
        console.log('💡 Make sure you are logged in to use socket features');
    } else {
        console.log('✅ User data found - socket authentication should work');
    }
    
    return {
        meta: { userIdMeta, usernameMeta, authMeta },
        body: { bodyUserId, bodyUsername },
        userData,
        hasUserData,
        globalManager: window.globalSocketManager ? {
            userId: window.globalSocketManager.userId,
            username: window.globalSocketManager.username,
            isGuest: window.globalSocketManager.isGuest,
            connected: window.globalSocketManager.connected,
            authenticated: window.globalSocketManager.authenticated
        } : null
    };
}

// Function to get user data (copied from main.js logic)
function getUserDataFromPage() {
    let userData = null;
    
    const bodyUserId = document.body.getAttribute('data-user-id');
    const bodyUsername = document.body.getAttribute('data-username');
    
    if (bodyUserId && bodyUsername) {
        userData = {
            user_id: bodyUserId,
            username: bodyUsername
        };
    } else {
        const userIdMeta = document.querySelector('meta[name="user-id"]')?.getAttribute('content');
        const usernameMeta = document.querySelector('meta[name="username"]')?.getAttribute('content');
        
        if (userIdMeta && usernameMeta) {
            userData = {
                user_id: userIdMeta,
                username: usernameMeta
            };
        }
    }
    
    return userData;
}

// Run debug immediately and make available globally
window.debugUserAuthentication = debugUserAuthentication;
setTimeout(debugUserAuthentication, 1000);
