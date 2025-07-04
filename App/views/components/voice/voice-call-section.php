<?php
$activeChannelId = $GLOBALS['activeChannelId'] ?? null;
$activeChannel = $GLOBALS['activeChannel'] ?? null;
$userName = $_SESSION['username'] ?? 'Anonymous';
$currentServer = $GLOBALS['currentServer'] ?? $GLOBALS['server'] ?? null;
$meetingId = 'voice_channel_' . $activeChannelId;

if (!$activeChannel) {
    echo '<div class="flex-1 bg-[#313338] flex items-center justify-center text-white text-lg">Select a voice channel</div>';
    return;
}

$channelName = $activeChannel->name ?? 'Voice Channel';
?>

<!-- Load Voice Call Section CSS -->
<link rel="stylesheet" href="/public/css/voice-call-section.css?v=<?php echo time(); ?>">
<link rel="stylesheet" href="/public/css/tic-tac-toe.css?v=<?php echo time(); ?>">

<meta name="meeting-id" content="<?php echo htmlspecialchars($meetingId); ?>">
<meta name="username" content="<?php echo htmlspecialchars($userName); ?>">
<meta name="user-id" content="<?php echo htmlspecialchars($_SESSION['user_id'] ?? ''); ?>">
<meta name="user-avatar" content="<?php echo htmlspecialchars($_SESSION['avatar_url'] ?? '/public/assets/common/default-profile-picture.png'); ?>">
<meta name="channel-id" content="<?php echo htmlspecialchars($activeChannelId); ?>">
<meta name="server-id" content="<?php echo htmlspecialchars($currentServer->id ?? ''); ?>">

<div class="voice-call-app w-full h-screen bg-[#2f3136] flex flex-col relative overflow-hidden">
    <!-- Discord-style Header -->
    <div class="voice-header bg-[#36393f] border-b border-[#202225] px-4 py-3 flex items-center shadow-md">
        <div class="flex items-center space-x-3">
            <div class="w-6 h-6 text-[#72767d]">
                <i class="fas fa-volume-up"></i>
            </div>
            <div class="flex items-center space-x-2">
                <h1 class="text-white font-semibold text-base"><?php echo htmlspecialchars($channelName); ?></h1>
                <div class="flex items-center space-x-1 text-[#b9bbbe] text-xs">
                    <div class="w-2 h-2 bg-[#3ba55c] rounded-full"></div>
                    <span id="voiceParticipantCount">1</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col relative overflow-hidden">
        
        <!-- UNIFIED GRID VIEW -->
        <div id="unifiedGridView" class="flex-1 p-4">
            <div id="participantGrid" class="w-full h-full grid gap-3 auto-rows-fr">
                <!-- All participants (voice + video + screen share) will be added here -->
            </div>
        </div>

        <div id="screenShareView" class="hidden">
        </div>
    </div>

    <!-- Discord-style Voice Controls -->
    <div class="voice-controls bg-[#36393f] border-t border-[#202225] p-2">
        <div class="flex items-center justify-center space-x-4">
            <!-- Primary Controls -->
            <button id="micBtn" class="voice-control-btn mic-btn w-10 h-10 rounded-full bg-[#4f545c] hover:bg-[#ed4245] text-white transition-all duration-150 flex items-center justify-center group">
                <i class="fas fa-microphone text-sm"></i>
                <div class="voice-tooltip">Mute</div>
            </button>

            <button id="deafenBtn" class="voice-control-btn deafen-btn w-10 h-10 rounded-full bg-[#4f545c] hover:bg-[#ed4245] text-white transition-all duration-150 flex items-center justify-center group">
                <i class="fas fa-headphones text-sm"></i>
                <div class="voice-tooltip">Deafen</div>
            </button>

            <button id="videoBtn" class="voice-control-btn video-btn w-10 h-10 rounded-full bg-[#4f545c] hover:bg-[#3ba55c] text-white transition-all duration-150 flex items-center justify-center group">
                <i class="fas fa-video-slash text-sm"></i>
                <div class="voice-tooltip">Turn On Camera</div>
            </button>

            <button id="screenBtn" class="voice-control-btn screen-btn w-10 h-10 rounded-full bg-[#4f545c] hover:bg-[#5865f2] text-white transition-all duration-150 flex items-center justify-center group">
                <i class="fas fa-desktop text-sm"></i>
                <div class="voice-tooltip">Share Screen</div>
            </button>

            <button id="ticTacToeBtn" class="voice-control-btn tic-tac-toe-btn w-10 h-10 rounded-full bg-[#4f545c] hover:bg-[#8b5cf6] text-white transition-all duration-150 flex items-center justify-center group">
                <i class="fas fa-chess-board text-sm"></i>
                <div class="voice-tooltip">Play Tic Mac Voe</div>
            </button>

            <button id="musicBtn" class="voice-control-btn music-btn w-10 h-10 rounded-full bg-[#4f545c] hover:bg-[#00d166] text-white transition-all duration-150 flex items-center justify-center group" onclick="window.musicPlayer?.showSearchModal()">
                <i class="fas fa-music text-sm"></i>
                <div class="voice-tooltip">Music Player</div>
            </button>

            <div class="w-px h-6 bg-[#4f545c]"></div>

            <!-- Disconnect -->
            <button id="disconnectBtn" class="voice-control-btn disconnect-btn w-10 h-10 rounded-full bg-[#ed4245] hover:bg-[#da373c] text-white transition-all duration-150 flex items-center justify-center group">
                <i class="fas fa-phone-slash text-sm"></i>
                <div class="voice-tooltip">Leave</div>
            </button>
        </div>
    </div>

    <div id="loadingOverlay" class="hidden absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div class="bg-[#2f3136] rounded-2xl p-8 text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-[#5865f2]/30 border-t-[#5865f2] mx-auto mb-4"></div>
            <p class="text-white font-medium">Connecting to voice...</p>
        </div>
    </div>
</div>

<!-- Section UI/controls logic -->
<script src="/public/js/components/bot/bot.js?v=<?php echo time(); ?>"></script>
<script src="/public/js/components/messaging/chat-bot.js?v=<?php echo time(); ?>" type="module"></script>
<script src="/public/js/components/bot/music-player-system.js?v=<?php echo time(); ?>"></script>
<script src="/public/js/components/activity/tic-tac-toe.js?v=<?php echo time(); ?>"></script>
<script src="/public/js/utils/participant-coordination.js?v=<?php echo time(); ?>"></script>
<script src="/public/js/components/voice/voice-call-section.js?v=<?php echo time(); ?>"></script>
<script src="/public/js/debug/titibot-voice-music-test.js?v=<?php echo time(); ?>"></script>
<script type="module">
import ChatBot from '/public/js/components/messaging/chat-bot.js';


document.addEventListener('DOMContentLoaded', () => {
    if (!window.chatBot && window.globalSocketManager?.io) {

        

        const mockChatSection = {
            messageInput: null, // Voice channels don't have message input
            addSystemMessage: (content) => {

            }
        };
        

        window.chatBot = new ChatBot(mockChatSection);

    }
});
</script>

<script>
document.addEventListener('DOMContentLoaded', () => {
    if (window.voiceManager && typeof window.voiceManager.attachEventListeners === 'function') {
        try {
            window.voiceManager.attachEventListeners();
        } catch (e) {
            console.warn('VoiceManager attachEventListeners failed:', e);
        }
    }
    
    setTimeout(() => {

        if (!window.musicPlayer) {
            console.warn('⚠️ [VOICE-CALL] Music player not loaded, retrying...');
            setTimeout(() => {
                if (window.musicPlayer) {

                } else {
                    console.error('❌ [VOICE-CALL] Music player failed to load');
                }
            }, 1000);
        } else {

        }
        

        if (!window.BotComponent) {
            console.warn('⚠️ [VOICE-CALL] Bot component not loaded');
        } else {

        }
        
        if (!window.chatBot) {
            console.warn('⚠️ [VOICE-CALL] Chat bot not loaded');
        } else {

        }
    }, 500);
});


window.testTitiBotMusicIntegration = function() {

    

    const urlParams = new URLSearchParams(window.location.search);
    const channelType = urlParams.get('type');
    if (channelType !== 'voice') {

        return;
    }
    

    const checks = {
        musicPlayer: !!window.musicPlayer,
        botComponent: !!window.BotComponent,
        chatBot: !!window.chatBot,
        voiceCallSection: !!window.voiceCallSection,
        globalSocketManager: !!window.globalSocketManager?.io,
        unifiedVoiceStateManager: !!window.unifiedVoiceStateManager
    };
    

    
    const allComponentsReady = Object.values(checks).every(Boolean);
    
    if (!allComponentsReady) {
        console.log('❌ [TEST] Not all components are ready. Missing:', 
            Object.keys(checks).filter(key => !checks[key]));
        return;
    }
    

    

    if (typeof window.debugTitiBotVoiceContext === 'function') {

        window.debugTitiBotVoiceContext();
    }
    

    if (window.musicPlayer) {


    }
    

    return true;
};


window.debugBotJoinVoice = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const channelId = urlParams.get('channel');
    const channelType = urlParams.get('type');
    
    if (channelType !== 'voice' || !channelId) {

        return;
    }
    

    

    const mockBotData = {
        id: 'bot-voice-titibot',
        user_id: '4',
        username: 'TitiBot',
        avatar_url: '/public/assets/common/default-profile-picture.png',
        isBot: true,
        channelId: channelId,
        meetingId: 'voice_channel_' + channelId,
        joinedAt: Date.now()
    };
    

    window.dispatchEvent(new CustomEvent('bot-voice-participant-joined', {
        detail: { participant: mockBotData }
    }));
    

};


window.testTitiBotMusicFlow = function(songName = 'never gonna give you up') {

    

    const urlParams = new URLSearchParams(window.location.search);
    const channelType = urlParams.get('type');
    const channelId = urlParams.get('channel');
    
    if (channelType !== 'voice') {

        return false;
    }
    

    const checks = {
        musicPlayer: !!window.musicPlayer,
        botComponent: !!window.BotComponent,
        chatBot: !!window.chatBot,
        voiceCallSection: !!window.voiceCallSection,
        globalSocketManager: !!window.globalSocketManager?.io,
        chatSection: !!window.chatSection
    };
    

    
    const allComponentsReady = Object.values(checks).every(Boolean);
    if (!allComponentsReady) {
        console.log('❌ [TEST] Not all components ready. Missing:', 
            Object.keys(checks).filter(key => !checks[key]));
        return false;
    }
    


    window.debugBotJoinVoice();
    

    setTimeout(() => {

        
        if (window.chatSection && window.chatSection.messageInput) {

            const command = '/titibot play ' + songName;
            window.chatSection.messageInput.value = command;
            

            if (window.chatSection.sendReceiveHandler) {
                window.chatSection.sendReceiveHandler.sendMessage();

            }
        } else {

        }
    }, 2000);
    
    return true;
};

























window.debugSimpleVoiceContext = function() {

    
    const urlParams = new URLSearchParams(window.location.search);
    const currentChannelId = urlParams.get('channel');
    const currentChannelType = urlParams.get('type');
    
    console.log('📍 [DEBUG] URL Context:', {
        currentChannelId,
        currentChannelType,
        fullURL: window.location.href
    });
    
    if (window.unifiedVoiceStateManager) {
        const voiceState = window.unifiedVoiceStateManager.getState();

    }
    

};


window.testFixedTitiBotVoiceDetection = function() {
    try {

    
    const urlParams = new URLSearchParams(window.location.search);
    const currentChannelId = urlParams.get('channel');
    const currentChannelType = urlParams.get('type');
    
    console.log('📍 [TEST-FIX] Current Context:', {
        channelId: currentChannelId,
        channelType: currentChannelType,
        pathname: window.location.pathname
    });
    

    let voiceChannelId = null;
    let userInVoice = false;
    let detectionMethod = 'none';
    

    

    if (window.unifiedVoiceStateManager) {
        const voiceState = window.unifiedVoiceStateManager.getState();

        if (voiceState && voiceState.isConnected && voiceState.channelId) {
            voiceChannelId = voiceState.channelId;
            userInVoice = true;
            detectionMethod = 'unifiedVoiceStateManager';

        }
    }
    

    if (!userInVoice && window.videoSDKManager) {
        if (window.videoSDKManager.isConnected && window.videoSDKManager.isMeetingJoined) {
            const meetingId = window.videoSDKManager.meetingId;
            if (meetingId && meetingId.includes('voice_channel_')) {
                voiceChannelId = meetingId.replace('voice_channel_', '');
                userInVoice = true;
                detectionMethod = 'videoSDKManager';

            }
        }
    }
    

    if (!userInVoice && window.voiceManager) {
        if (window.voiceManager.isConnected && window.voiceManager.currentChannelId) {
            voiceChannelId = window.voiceManager.currentChannelId;
            userInVoice = true;
            detectionMethod = 'voiceManager';

        }
    }
    

    if (!userInVoice && window.globalSocketManager) {
        const currentActivity = window.globalSocketManager.currentActivityDetails;
        if (currentActivity && currentActivity.type) {
            if (currentActivity.type === 'In Voice Call' || currentActivity.type.startsWith('In Voice - ')) {
                if (currentActivity.channel_id) {
                    voiceChannelId = currentActivity.channel_id;
                    userInVoice = true;
                    detectionMethod = 'globalSocketManager';

                }
            }
        }
    }
    

    if (!userInVoice) {
        const metaChannelType = document.querySelector('meta[name="channel-type"]')?.content;
        if ((currentChannelType === 'voice' || metaChannelType === 'voice') && currentChannelId) {
            const channelElement = document.querySelector('[data-channel-id="' + currentChannelId + '"][data-channel-type="voice"]');
            if (channelElement) {
                voiceChannelId = currentChannelId;
                userInVoice = true;
                detectionMethod = 'currentVoiceChannel+present';

            }
        }
    }
    
    console.log('🎯 [TEST-FIX] Detection Result:', {
        voiceChannelId,
        userInVoice,
        detectionMethod,
        scenario: currentChannelType === 'voice' ? 'User on voice channel page' : 'User connected to voice, commanding from text channel'
    });
    
    if (userInVoice && voiceChannelId) {
        if (currentChannelType === 'text') {

        } else {

        }

        return true;
    } else {




        return false;
    }
    } catch (error) {
        console.error('❌ [TEST-FIX] Error in voice detection test:', error);
        return false;
    }
};


window.testTitiBotCommandWithFix = function(command = 'play never gonna give you up') {
    try {

    

    const result = window.testFixedTitiBotVoiceDetection();
    if (!result) {

        return false;
    }
    

    if (!window.chatSection || !window.chatSection.messageInput) {

        return false;
    }
    

    const fullCommand = '/titibot ' + command;

    

    window.chatSection.messageInput.value = '';
    

    window.chatSection.messageInput.value = fullCommand;
    

    if (window.chatSection.sendReceiveHandler && typeof window.chatSection.sendReceiveHandler.sendMessage === 'function') {

        window.chatSection.sendReceiveHandler.sendMessage();

        

        return true;
    } else {

        return false;
    }
    } catch (error) {
        console.error('❌ [TEST-FIX] Error in command test:', error);
        return false;
    }
};




window.validateJavaScriptSyntax = function() {





    return true;
};



setTimeout(() => {
    try {
        window.validateJavaScriptSyntax();
    } catch (error) {
        console.error('❌ [VALIDATION] JavaScript validation failed:', error);
    }
}, 100);





























window.testBotDirectly = function() {

    

    fetch('/api/debug/test-bot', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {

            

            if (window.globalSocketManager?.io) {
                const testMessage = {
                    id: 'test-' + Date.now(),
                    user_id: 1,
                    username: 'tester',
                    content: '/titibot ping',
                    channel_id: 14,
                    target_type: 'channel',
                    target_id: 14,
                    voice_context: {
                        voice_channel_id: 14,
                        user_in_voice: true
                    }
                };
                

                window.globalSocketManager.io.emit('bot-message-intercept', testMessage);

            } else {
                console.error('❌ [BOT-TEST] Socket not available');
            }
        } else {
            console.error('❌ [BOT-TEST] Bot test failed:', data.error);
        }
    })
    .catch(error => {
        console.error('❌ [BOT-TEST] Error testing bot:', error);
    });
};


window.testBotMusic = function(song = 'never gonna give you up') {

    
    if (window.globalSocketManager?.io) {
        const testMessage = {
            id: 'test-music-' + Date.now(),
            user_id: 1,
            username: 'tester',
            content: `/titibot play ${song}`,
            channel_id: 14,
            target_type: 'channel',
            target_id: 14,
            voice_context: {
                voice_channel_id: 14,
                user_in_voice: true
            }
        };
        

        window.globalSocketManager.io.emit('bot-message-intercept', testMessage);

    } else {
        console.error('❌ [BOT-TEST] Socket not available');
    }
};




</script>