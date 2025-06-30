window.testMentionClick = function() {
    console.log('🧪 [MENTION-TEST] Testing mention click functionality...');
    
    const testMentions = [
        {
            type: 'user',
            username: 'testuser',
            user_id: '123',
            html: '<span class="mention mention-user bubble-mention bubble-mention-user user-profile-trigger" data-mention-type="user" data-user-id="123" data-username="testuser" title="@testuser">@testuser</span>'
        },
        {
            type: 'user_no_id',
            username: 'testuser2',
            user_id: null,
            html: '<span class="mention mention-user bubble-mention bubble-mention-user user-profile-trigger" data-mention-type="user" data-username="testuser2" title="@testuser2">@testuser2</span>'
        }
    ];
    
    const testContainer = document.createElement('div');
    testContainer.id = 'mention-test-container';
    testContainer.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #2f3136; padding: 20px; border-radius: 8px; z-index: 9999;';
    
    testContainer.innerHTML = `
        <h3 style="color: white; margin: 0 0 10px 0;">Mention Click Test</h3>
        <div style="color: #dcddde; margin-bottom: 10px;">
            Click the mentions below to test:
        </div>
        <div style="margin: 10px 0;">
            With User ID: ${testMentions[0].html}
        </div>
        <div style="margin: 10px 0;">
            Without User ID: ${testMentions[1].html}
        </div>
        <button id="close-mention-test" style="background: #ed4245; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-top: 10px;">Close Test</button>
    `;
    
    document.body.appendChild(testContainer);
    
    document.getElementById('close-mention-test').addEventListener('click', () => {
        testContainer.remove();
    });
    
    console.log('✅ [MENTION-TEST] Test UI created. Click the mentions to verify functionality.');
    
    setTimeout(() => {
        testContainer.remove();
    }, 30000);
};

console.log('🧪 [MENTION-TEST] Test function loaded. Run window.testMentionClick() to test mentions.'); 