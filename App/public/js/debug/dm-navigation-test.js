

window.testDMNavigation = function() {

    
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
    

    testResults.chatSectionAvailable = !!window.chatSection;

    

    testResults.switchToDMMethodExists = !!(window.chatSection && typeof window.chatSection.switchToDM === 'function');

    

    testResults.simpleDMSwitcherAvailable = !!window.SimpleDMSwitcher;

    

    testResults.globalHelperAvailable = !!(window.switchToDMGlobal && typeof window.switchToDMGlobal === 'function');

    

    testResults.socketManagerReady = !!(window.globalSocketManager && window.globalSocketManager.isReady && window.globalSocketManager.isReady());

    

    const originalPath = window.location.pathname;
    if (originalPath.includes('/channels/dm/') || originalPath === '/home') {
        testResults.chatPageDetection = typeof isChatPage === 'function' ? isChatPage() : true;
    } else {
        testResults.chatPageDetection = true;
    }

    

    testResults.friendsPageExclusion = !originalPath.includes('/friends') || (typeof isChatPage === 'function' ? !isChatPage() : true);

    

    if (window.chatSection && typeof window.chatSection.findDOMElements === 'function') {
        window.chatSection.findDOMElements();
        const hasElementsFound = !!(window.chatSection.chatMessages || window.chatSection.messageForm || window.chatSection.messageInput);
        testResults.domElementsRobustness = hasElementsFound;

    } else {

    }
    

    if (window.chatSection && typeof window.chatSection.getMessagesContainer === 'function') {
        const container = window.chatSection.getMessagesContainer();
        testResults.messageContainerFallback = !!container;

    } else {

    }
    

    console.table(testResults);
    
    const allPassed = Object.values(testResults).every(result => result === true);
    
    if (allPassed) {

    } else {

        
        const failures = Object.entries(testResults)
            .filter(([key, value]) => !value)
            .map(([key]) => key);
        

    }
    
    return testResults;
};

window.simulateDMSwitch = async function(dmId = '1') {

    
    if (!window.chatSection) {

        return false;
    }
    
    if (typeof window.chatSection.switchToDM !== 'function') {

        return false;
    }
    
    try {

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

    
    const dmItems = document.querySelectorAll('.dm-friend-item');

    
    if (dmItems.length === 0) {

        return false;
    }
    
    const firstDM = dmItems[0];
    const chatRoomId = firstDM.getAttribute('data-chat-room-id');
    const roomType = firstDM.getAttribute('data-room-type') || 'direct';
    const username = firstDM.getAttribute('data-username') || 'Test User';
    

    
    if (!chatRoomId) {

        return false;
    }
    

    
    try {
        firstDM.click();

        return true;
    } catch (error) {
        console.error('❌ [DM-CLICK-TEST] Click simulation failed:', error);
        return false;
    }
};





