window.testBubbleRender = async function() {
    console.log('🧪 [BUBBLE-RENDER-TEST] Testing bubble render API...');
    
    const testMessageData = {
        id: 'test-123',
        content: 'Test message with @all mention',
        user_id: '1',
        username: 'testuser',
        avatar_url: '/public/assets/common/default-profile-picture.png',
        sent_at: new Date().toISOString(),
        message_type: 'text',
        attachments: [],
        mentions: [
            {
                type: 'all',
                username: 'all',
                user_id: 'all'
            }
        ],
        reply_message_id: null,
        reply_data: null,
        timestamp: Date.now(),
        source: 'test'
    };
    
    console.log('📤 [BUBBLE-RENDER-TEST] Sending test data to API:', testMessageData);
    
    try {
        const response = await fetch('/api/messages/render-bubble', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message_data: testMessageData
            })
        });
        
        console.log('📡 [BUBBLE-RENDER-TEST] API Response Status:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [BUBBLE-RENDER-TEST] HTTP Error:', response.status, errorText);
            return;
        }
        
        const result = await response.json();
        console.log('📥 [BUBBLE-RENDER-TEST] API Response:', result);
        
        if (result.success && result.html) {
            console.log('✅ [BUBBLE-RENDER-TEST] API working correctly!');
            console.log('📄 [BUBBLE-RENDER-TEST] HTML Preview:', result.html.substring(0, 300) + '...');
            
            const previewDiv = document.createElement('div');
            previewDiv.innerHTML = result.html;
            previewDiv.style.cssText = 'position: fixed; top: 10px; right: 10px; background: #2f3136; padding: 10px; border-radius: 8px; z-index: 9999; max-width: 400px; color: white;';
            
            const closeBtn = document.createElement('button');
            closeBtn.textContent = '❌ Close Preview';
            closeBtn.style.cssText = 'background: #ed4245; color: white; border: none; padding: 5px; border-radius: 4px; cursor: pointer; margin-bottom: 10px; display: block;';
            closeBtn.onclick = () => previewDiv.remove();
            
            previewDiv.insertBefore(closeBtn, previewDiv.firstChild);
            document.body.appendChild(previewDiv);
            
        } else {
            console.error('❌ [BUBBLE-RENDER-TEST] API returned error:', result.error || result.message);
        }
        
    } catch (error) {
        console.error('❌ [BUBBLE-RENDER-TEST] Exception:', error);
    }
};

window.testMessageHandler = function() {
    console.log('🧪 [MESSAGE-HANDLER-TEST] Testing message handler...');
    
    if (!window.chatSection || !window.chatSection.messageHandler) {
        console.error('❌ [MESSAGE-HANDLER-TEST] Chat section or message handler not available');
        return;
    }
    
    const testMessage = {
        id: 'handler-test-' + Date.now(),
        content: 'Handler test message with @all',
        user_id: window.globalSocketManager?.userId || '1',
        username: window.globalSocketManager?.username || 'testuser',
        avatar_url: window.globalSocketManager?.avatarUrl || '/public/assets/common/default-profile-picture.png',
        sent_at: new Date().toISOString(),
        message_type: 'text',
        attachments: [],
        mentions: [
            {
                type: 'all',
                username: 'all',
                user_id: 'all'
            }
        ],
        reply_message_id: null,
        reply_data: null,
        timestamp: Date.now(),
        is_temporary: false,
        source: 'handler-test'
    };
    
    console.log('📤 [MESSAGE-HANDLER-TEST] Adding test message via handler:', testMessage);
    
    window.chatSection.messageHandler.addMessage(testMessage);
    
    console.log('✅ [MESSAGE-HANDLER-TEST] Test message sent to handler');
}; 