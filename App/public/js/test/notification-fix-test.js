console.log('🧪 [NOTIFICATION-FIX-TEST] Testing mention notification sound fix');

function testAllMentionTypes() {
    if (!window.globalNotificationHandler) {
        console.error('❌ [TEST] globalNotificationHandler not found');
        return;
    }
    
    const currentUserId = window.globalSocketManager?.userId || '1';
    console.log('🧪 [TEST] Testing with current user ID:', currentUserId);
    
    const testCases = [
        {
            name: '@all mention',
            data: {
                type: 'all',
                message_id: 'test-all-' + Date.now(),
                content: 'This is a test @all mention',
                user_id: '999',
                username: 'TestUser',
                avatar_url: '/public/assets/common/default-profile-picture.png',
                context: {
                    server_name: 'Test Server',
                    channel_name: 'Test Channel'
                }
            }
        },
        {
            name: '@admin role mention',
            data: {
                type: 'role',
                role: 'admin',
                message_id: 'test-admin-' + Date.now(),
                content: 'This is a test @admin mention',
                user_id: '999',
                username: 'TestUser',
                avatar_url: '/public/assets/common/default-profile-picture.png',
                mentioned_user_id: currentUserId,
                context: {
                    server_name: 'Test Server',
                    channel_name: 'Test Channel'
                }
            }
        },
        {
            name: '@members role mention',
            data: {
                type: 'role',
                role: 'members',
                message_id: 'test-members-' + Date.now(),
                content: 'This is a test @members mention',
                user_id: '999',
                username: 'TestUser',
                avatar_url: '/public/assets/common/default-profile-picture.png',
                mentioned_user_id: currentUserId,
                context: {
                    server_name: 'Test Server',
                    channel_name: 'Test Channel'
                }
            }
        },
        {
            name: '@owner role mention',
            data: {
                type: 'role',
                role: 'owner',
                message_id: 'test-owner-' + Date.now(),
                content: 'This is a test @owner mention',
                user_id: '999',
                username: 'TestUser',
                avatar_url: '/public/assets/common/default-profile-picture.png',
                mentioned_user_id: currentUserId,
                context: {
                    server_name: 'Test Server',
                    channel_name: 'Test Channel'
                }
            }
        },
        {
            name: 'User mention',
            data: {
                type: 'user',
                message_id: 'test-user-' + Date.now(),
                content: 'This is a test user mention',
                user_id: '999',
                username: 'TestUser',
                avatar_url: '/public/assets/common/default-profile-picture.png',
                mentioned_user_id: currentUserId,
                context: {
                    server_name: 'Test Server',
                    channel_name: 'Test Channel'
                }
            }
        }
    ];
    
    testCases.forEach((testCase, index) => {
        setTimeout(() => {
            console.log(`🧪 [TEST] Testing: ${testCase.name}`);
            window.globalNotificationHandler.handleMentionNotification(testCase.data);
        }, index * 2500);
    });
}

window.testNotificationSoundFix = testAllMentionTypes;
