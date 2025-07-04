window.testMentionOverlay = function() {
    const messageInput = document.getElementById('message-input');
    const mentionHandler = window.chatSection?.mentionHandler;
    
    if (!messageInput) {
        console.error('Message input not found');
        return false;
    }
    
    if (!mentionHandler) {
        console.error('Mention handler not found');
        return false;
    }
    

    
    const testMentions = [
        '@testuser hello world',
        'Hello @all how are you?',
        '@user1 and @user2 check this out',
        'Multiple lines\n@someone\ntest'
    ];
    
    let testIndex = 0;
    
    function runNextTest() {
        if (testIndex >= testMentions.length) {

            messageInput.value = '';
            mentionHandler.updateOverlayContent();
            return;
        }
        
        const testText = testMentions[testIndex];

        
        messageInput.value = testText;
        messageInput.focus();
        messageInput.setSelectionRange(testText.length, testText.length);
        
        mentionHandler.updateOverlayContent();
        
        const overlay = document.querySelector('.mention-overlay');
        if (overlay) {


        }
        
        testIndex++;
        setTimeout(runNextTest, 2000);
    }
    

    setTimeout(runNextTest, 1000);
    
    return true;
};

window.inspectMentionOverlay = function() {
    const messageInput = document.getElementById('message-input');
    const overlay = document.querySelector('.mention-overlay');
    const container = document.querySelector('.input-container-wrapper');
    




    
    if (overlay) {
        console.log('Overlay styles:', {
            position: overlay.style.position,
            zIndex: overlay.style.zIndex,
            visibility: getComputedStyle(overlay).visibility,
            pointerEvents: overlay.style.pointerEvents
        });

    }
    
    if (messageInput && container) {
        console.log('Input styles:', {
            color: getComputedStyle(messageInput).color,
            caretColor: getComputedStyle(messageInput).caretColor,
            background: getComputedStyle(messageInput).background
        });
    }
    
    return { messageInput, overlay, container };
};

