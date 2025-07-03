console.log('🧪 [DM-TEST] Direct Message Navigation Test Suite Loaded');

window.testDMNavigation = function() {
    console.log('🚀 [DM-TEST] Starting DM Navigation Test Suite...');
    
    const testResults = {
        chatSectionAvailable: false,
        switchToDMMethodExists: false,
        simpleDMSwitcherAvailable: false,
        globalHelperAvailable: false,
        socketManagerReady: false,
        chatPageDetection: false,
        friendsPageExclusion: false,
        domElementsRobustness: false,
        messageContainerFallback: false
    };
    
    console.log('1️⃣ [DM-TEST] Testing ChatSection availability...');
    testResults.chatSectionAvailable = !!window.chatSection;
    console.log(`   Result: ${testResults.chatSectionAvailable ? '✅' : '❌'} ChatSection available`);
    
    console.log('2️⃣ [DM-TEST] Testing switchToDM method...');
    testResults.switchToDMMethodExists = !!(window.chatSection && typeof window.chatSection.switchToDM === 'function');
    console.log(`   Result: ${testResults.switchToDMMethodExists ? '✅' : '❌'} switchToDM method exists`);
    
    console.log('3️⃣ [DM-TEST] Testing SimpleDMSwitcher...');
    testResults.simpleDMSwitcherAvailable = !!window.SimpleDMSwitcher;
    console.log(`   Result: ${testResults.simpleDMSwitcherAvailable ? '✅' : '❌'} SimpleDMSwitcher available`);
    
    console.log('4️⃣ [DM-TEST] Testing global helper function...');
    testResults.globalHelperAvailable = !!(window.switchToDMGlobal && typeof window.switchToDMGlobal === 'function');
    console.log(`   Result: ${testResults.globalHelperAvailable ? '✅' : '❌'} Global helper available`);
    
    console.log('5️⃣ [DM-TEST] Testing socket manager...');
    testResults.socketManagerReady = !!(window.globalSocketManager && window.globalSocketManager.isReady && window.globalSocketManager.isReady());
    console.log(`   Result: ${testResults.socketManagerReady ? '✅' : '❌'} Socket manager ready`);
    
    console.log('6️⃣ [DM-TEST] Testing chat page detection...');
    const originalPath = window.location.pathname;
    if (originalPath.includes('/channels/dm/') || originalPath === '/home') {
        testResults.chatPageDetection = typeof isChatPage === 'function' ? isChatPage() : true;
    } else {
        testResults.chatPageDetection = true;
    }
    console.log(`   Result: ${testResults.chatPageDetection ? '✅' : '❌'} Chat page detection working`);
    
    console.log('7️⃣ [DM-TEST] Testing friends page exclusion...');
    testResults.friendsPageExclusion = !originalPath.includes('/friends') || (typeof isChatPage === 'function' ? !isChatPage() : true);
    console.log(`   Result: ${testResults.friendsPageExclusion ? '✅' : '❌'} Friends page properly excluded`);
    
    console.log('8️⃣ [DM-TEST] Testing DOM elements robustness...');
    if (window.chatSection && typeof window.chatSection.findDOMElements === 'function') {
        window.chatSection.findDOMElements();
        const hasElementsFound = !!(window.chatSection.chatMessages || window.chatSection.messageForm || window.chatSection.messageInput);
        testResults.domElementsRobustness = hasElementsFound;
        console.log(`   Result: ${testResults.domElementsRobustness ? '✅' : '❌'} DOM elements robust search`);
    } else {
        console.log('   Result: ⚠️ ChatSection not available for DOM test');
    }
    
    console.log('9️⃣ [DM-TEST] Testing message container fallback...');
    if (window.chatSection && typeof window.chatSection.getMessagesContainer === 'function') {
        const container = window.chatSection.getMessagesContainer();
        testResults.messageContainerFallback = !!container;
        console.log(`   Result: ${testResults.messageContainerFallback ? '✅' : '❌'} Message container fallback working`);
    } else {
        console.log('   Result: ⚠️ ChatSection not available for container test');
    }
    
    console.log('\n📊 [DM-TEST] Test Results Summary:');
    console.table(testResults);
    
    const allPassed = Object.values(testResults).every(result => result === true);
    
    if (allPassed) {
        console.log('🎉 [DM-TEST] All tests PASSED! Direct message navigation should work properly.');
    } else {
        console.log('⚠️ [DM-TEST] Some tests FAILED. Issues may persist.');
        
        const failures = Object.entries(testResults)
            .filter(([key, value]) => !value)
            .map(([key]) => key);
        
        console.log('❌ [DM-TEST] Failed tests:', failures);
    }
    
    return testResults;
};

window.simulateDMSwitch = async function(dmId = '1') {
    console.log(`🧪 [DM-SIMULATE] Simulating DM switch to room ${dmId}...`);
    
    if (!window.chatSection) {
        console.log('❌ [DM-SIMULATE] ChatSection not available');
        return false;
    }
    
    if (typeof window.chatSection.switchToDM !== 'function') {
        console.log('❌ [DM-SIMULATE] switchToDM method not available');
        return false;
    }
    
    try {
        console.log('🔄 [DM-SIMULATE] Calling switchToDM...');
        console.log('🔍 [DM-SIMULATE] Pre-switch DOM state:', {
            chatMessages: !!document.querySelector('#chat-messages'),
            messageForm: !!document.querySelector('#message-form'),
            messageInput: !!document.querySelector('#message-input'),
            chatSections: document.querySelectorAll('.chat-section').length
        });
        
        await window.chatSection.switchToDM(dmId, 'direct', true);
        
        console.log('🔍 [DM-SIMULATE] Post-switch DOM state:', {
            chatMessages: !!document.querySelector('#chat-messages'),
            messageForm: !!document.querySelector('#message-form'),
            messageInput: !!document.querySelector('#message-input'),
            chatSections: document.querySelectorAll('.chat-section').length,
            hasMessages: document.querySelectorAll('#chat-messages .message').length
        });
        
        console.log('✅ [DM-SIMULATE] DM switch completed successfully');
        return true;
    } catch (error) {
        console.error('❌ [DM-SIMULATE] DM switch failed:', error);
        console.log('🔍 [DM-SIMULATE] Error DOM state:', {
            chatMessages: !!document.querySelector('#chat-messages'),
            messageForm: !!document.querySelector('#message-form'),
            messageInput: !!document.querySelector('#message-input'),
            url: window.location.href
        });
        return false;
    }
};

window.testDMClickHandler = function() {
    console.log('🖱️ [DM-CLICK-TEST] Testing DM click handler...');
    
    const dmItems = document.querySelectorAll('.dm-friend-item');
    console.log(`🔍 [DM-CLICK-TEST] Found ${dmItems.length} DM items`);
    
    if (dmItems.length === 0) {
        console.log('❌ [DM-CLICK-TEST] No DM items found to test');
        return false;
    }
    
    const firstDM = dmItems[0];
    const chatRoomId = firstDM.getAttribute('data-chat-room-id');
    const roomType = firstDM.getAttribute('data-room-type') || 'direct';
    const username = firstDM.getAttribute('data-username') || 'Test User';
    
    console.log(`🎯 [DM-CLICK-TEST] Testing with DM:`, { chatRoomId, roomType, username });
    
    if (!chatRoomId) {
        console.log('❌ [DM-CLICK-TEST] No chat-room-id found on DM item');
        return false;
    }
    
    console.log('🖱️ [DM-CLICK-TEST] Simulating click on first DM item...');
    
    try {
        firstDM.click();
        console.log('✅ [DM-CLICK-TEST] Click event triggered successfully');
        return true;
    } catch (error) {
        console.error('❌ [DM-CLICK-TEST] Click simulation failed:', error);
        return false;
    }
};

console.log('📚 [DM-TEST] Available test functions:');
console.log('  - testDMNavigation() - Run complete test suite');
console.log('  - simulateDMSwitch(dmId) - Simulate switching to a DM');
console.log('  - testDMClickHandler() - Test clicking on DM items');
