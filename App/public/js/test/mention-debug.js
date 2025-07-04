window.debugMentionSystem = async function() {

    
    const chatSection = window.chatSection;
    
    if (!chatSection) {
        console.error('❌ [MENTION-DEBUG] No chat section found');
        return;
    }
    
    console.log('📊 [MENTION-DEBUG] Chat Section Info:', {
        targetId: chatSection.targetId,
        chatType: chatSection.chatType,
        userId: chatSection.userId,
        username: chatSection.username,
        hasMentionHandler: !!chatSection.mentionHandler
    });
    
    if (!chatSection.mentionHandler) {
        console.error('❌ [MENTION-DEBUG] No mention handler found');
        return;
    }
    
    const mentionHandler = chatSection.mentionHandler;
    
    console.log('🔍 [MENTION-DEBUG] Mention Handler State:', {
        isLoading: mentionHandler.isLoading,
        usersLoaded: mentionHandler.usersLoaded,
        availableUsersCount: mentionHandler.availableUsers.size,
        lastTargetId: mentionHandler.lastTargetId
    });
    
    if (chatSection.targetId) {

        
        try {
            const response = await fetch(`/api/channels/${chatSection.targetId}/members`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            

            
            if (response.ok) {
                const result = await response.json();

                
                if (result.success && result.data && Array.isArray(result.data)) {

                    result.data.forEach((member, index) => {
                        console.log(`👤 [MENTION-DEBUG] Member ${index + 1}:`, {
                            user_id: member.user_id,
                            username: member.username,
                            avatar_url: member.avatar_url,
                            display_name: member.display_name,
                            role: member.role
                        });
                    });
                } else {
                    console.error('❌ [MENTION-DEBUG] API returned invalid format');
                }
            } else {
                const errorText = await response.text();
                console.error('❌ [MENTION-DEBUG] API Error:', errorText);
            }
        } catch (error) {
            console.error('❌ [MENTION-DEBUG] Exception testing API:', error);
        }
        

        await mentionHandler.loadAvailableUsers(true);
        
        console.log('📊 [MENTION-DEBUG] After forced reload:', {
            availableUsersCount: mentionHandler.availableUsers.size,
            usersLoaded: mentionHandler.usersLoaded
        });
        
        if (mentionHandler.availableUsers.size > 0) {

            for (const [username, user] of mentionHandler.availableUsers) {

            }
        }
        

        const matches = mentionHandler.findMatchingUsers('');

        
    } else {
        console.error('❌ [MENTION-DEBUG] No target ID available');
    }
    

};

window.testMentionAutocomplete = function() {

    
    const chatSection = window.chatSection;
    if (!chatSection || !chatSection.mentionHandler) {
        console.error('❌ [MENTION-TEST] Chat section or mention handler not available');
        return;
    }
    
    const messageInput = document.getElementById('message-input');
    if (!messageInput) {
        console.error('❌ [MENTION-TEST] Message input not found');
        return;
    }
    

    
    messageInput.value = '@';
    messageInput.focus();
    
    const inputEvent = new Event('input', { bubbles: true });
    messageInput.dispatchEvent(inputEvent);
    
    setTimeout(() => {
        console.log('📊 [MENTION-TEST] Autocomplete state after @ input:', {
            isVisible: chatSection.mentionHandler.isAutocompleteVisible,
            availableUsers: chatSection.mentionHandler.availableUsers.size
        });
    }, 1000);
};



