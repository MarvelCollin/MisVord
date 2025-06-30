window.debugMentionSystem = async function() {
    console.log('🧪 [MENTION-DEBUG] Starting mention system debug...');
    
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
        console.log('🔍 [MENTION-DEBUG] Testing API endpoint directly...');
        
        try {
            const response = await fetch(`/api/channels/${chatSection.targetId}/members`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('📡 [MENTION-DEBUG] API Response Status:', response.status, response.statusText);
            
            if (response.ok) {
                const result = await response.json();
                console.log('📋 [MENTION-DEBUG] API Response Data:', result);
                
                if (result.success && result.data && Array.isArray(result.data)) {
                    console.log(`✅ [MENTION-DEBUG] API returned ${result.data.length} members`);
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
        
        console.log('🔄 [MENTION-DEBUG] Force loading users...');
        await mentionHandler.loadAvailableUsers(true);
        
        console.log('📊 [MENTION-DEBUG] After forced reload:', {
            availableUsersCount: mentionHandler.availableUsers.size,
            usersLoaded: mentionHandler.usersLoaded
        });
        
        if (mentionHandler.availableUsers.size > 0) {
            console.log('👥 [MENTION-DEBUG] Available users:');
            for (const [username, user] of mentionHandler.availableUsers) {
                console.log(`  - ${username}: ${user.id} (${user.username})`);
            }
        }
        
        console.log('🔍 [MENTION-DEBUG] Testing autocomplete with empty search...');
        const matches = mentionHandler.findMatchingUsers('');
        console.log('📋 [MENTION-DEBUG] Matches for empty search:', matches);
        
    } else {
        console.error('❌ [MENTION-DEBUG] No target ID available');
    }
    
    console.log('✅ [MENTION-DEBUG] Debug complete');
};

window.testMentionAutocomplete = function() {
    console.log('🧪 [MENTION-TEST] Testing mention autocomplete...');
    
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
    
    console.log('🎯 [MENTION-TEST] Simulating @ input...');
    
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

console.log('🧪 [MENTION-DEBUG] Debug functions loaded:');
console.log('  - window.debugMentionSystem() - Full debug analysis');
console.log('  - window.testMentionAutocomplete() - Test @ input autocomplete'); 