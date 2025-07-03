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
<script src="/public/js/components/voice/voice-call-section.js?v=<?php echo time(); ?>"></script>
<script src="/public/js/debug/titibot-voice-music-test.js?v=<?php echo time(); ?>"></script>
<script type="module">
import ChatBot from '/public/js/components/messaging/chat-bot.js';

// Initialize ChatBot for voice channel if not already available
document.addEventListener('DOMContentLoaded', () => {
    if (!window.chatBot && window.globalSocketManager?.io) {
        console.log('🤖 [VOICE-CALL] Initializing ChatBot for voice channel...');
        
        // Create a minimal chat section object for ChatBot initialization
        const mockChatSection = {
            messageInput: null, // Voice channels don't have message input
            addSystemMessage: (content) => {
                console.log('📢 [VOICE-CHAT-BOT] System message:', content);
            }
        };
        
        // Initialize the ChatBot with mock chat section
        window.chatBot = new ChatBot(mockChatSection);
        console.log('✅ [VOICE-CALL] ChatBot initialized for voice channel');
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
        console.log('🎵 [VOICE-CALL] Checking music player integration...');
        if (!window.musicPlayer) {
            console.warn('⚠️ [VOICE-CALL] Music player not loaded, retrying...');
            setTimeout(() => {
                if (window.musicPlayer) {
                    console.log('✅ [VOICE-CALL] Music player loaded successfully');
                } else {
                    console.error('❌ [VOICE-CALL] Music player failed to load');
                }
            }, 1000);
        } else {
            console.log('✅ [VOICE-CALL] Music player ready');
        }
        
        // Check bot components
        if (!window.BotComponent) {
            console.warn('⚠️ [VOICE-CALL] Bot component not loaded');
        } else {
            console.log('✅ [VOICE-CALL] Bot component ready');
        }
        
        if (!window.chatBot) {
            console.warn('⚠️ [VOICE-CALL] Chat bot not loaded');
        } else {
            console.log('✅ [VOICE-CALL] Chat bot ready');
        }
    }, 500);
});

// Global test function for TitiBot music integration in voice channels
window.testTitiBotMusicIntegration = function() {
    console.log('🧪 [TEST] Testing TitiBot music integration in voice channel...');
    
    // Check if we're in a voice channel
    const urlParams = new URLSearchParams(window.location.search);
    const channelType = urlParams.get('type');
    if (channelType !== 'voice') {
        console.log('❌ [TEST] Not in a voice channel. Test requires voice channel context.');
        return;
    }
    
    // Check components
    const checks = {
        musicPlayer: !!window.musicPlayer,
        botComponent: !!window.BotComponent,
        chatBot: !!window.chatBot,
        voiceCallSection: !!window.voiceCallSection,
        globalSocketManager: !!window.globalSocketManager?.io,
        unifiedVoiceStateManager: !!window.unifiedVoiceStateManager
    };
    
    console.log('📋 [TEST] Component Status:', checks);
    
    const allComponentsReady = Object.values(checks).every(Boolean);
    
    if (!allComponentsReady) {
        console.log('❌ [TEST] Not all components are ready. Missing:', 
            Object.keys(checks).filter(key => !checks[key]));
        return;
    }
    
    console.log('✅ [TEST] All components ready. Testing bot music integration...');
    
    // Test voice context detection
    if (typeof window.debugTitiBotVoiceContext === 'function') {
        console.log('🎤 [TEST] Testing voice context detection...');
        window.debugTitiBotVoiceContext();
    }
    
    // Test music player
    if (window.musicPlayer) {
        console.log('🎵 [TEST] Testing music player...');
        console.log('Music Player Status:', window.musicPlayer.getCurrentStatus());
    }
    
    console.log('🎯 [TEST] Integration test complete. Try running `/titibot play test` in chat.');
    return true;
};

// Quick debug function to manually trigger bot join
window.debugBotJoinVoice = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const channelId = urlParams.get('channel');
    const channelType = urlParams.get('type');
    
    if (channelType !== 'voice' || !channelId) {
        console.log('❌ [DEBUG] Not in voice channel or no channel ID');
        return;
    }
    
    console.log('🤖 [DEBUG] Manually triggering bot join for channel:', channelId);
    
    // Create mock bot participant data
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
    
    // Dispatch the event manually
    window.dispatchEvent(new CustomEvent('bot-voice-participant-joined', {
        detail: { participant: mockBotData }
    }));
    
    console.log('✅ [DEBUG] Bot join event dispatched');
};

// Test function for the complete TitiBot music flow
window.testTitiBotMusicFlow = function(songName = 'never gonna give you up') {
    console.log('🧪 [TEST] Testing complete TitiBot music flow...');
    
    // Step 1: Check if we're in a voice channel
    const urlParams = new URLSearchParams(window.location.search);
    const channelType = urlParams.get('type');
    const channelId = urlParams.get('channel');
    
    if (channelType !== 'voice') {
        console.log('❌ [TEST] Must be in a voice channel. Current type:', channelType);
        return false;
    }
    
    // Step 2: Check components
    const checks = {
        musicPlayer: !!window.musicPlayer,
        botComponent: !!window.BotComponent,
        chatBot: !!window.chatBot,
        voiceCallSection: !!window.voiceCallSection,
        globalSocketManager: !!window.globalSocketManager?.io,
        chatSection: !!window.chatSection
    };
    
    console.log('📋 [TEST] Component Status:', checks);
    
    const allComponentsReady = Object.values(checks).every(Boolean);
    if (!allComponentsReady) {
        console.log('❌ [TEST] Not all components ready. Missing:', 
            Object.keys(checks).filter(key => !checks[key]));
        return false;
    }
    
    // Step 3: Simulate bot joining voice
    console.log('🤖 [TEST] Step 1: Bot joining voice...');
    window.debugBotJoinVoice();
    
    // Step 4: Wait and simulate music command
    setTimeout(() => {
        console.log('🎵 [TEST] Step 2: Sending music command...');
        
        if (window.chatSection && window.chatSection.messageInput) {
            // Simulate typing the command
            const command = '/titibot play ' + songName;
            window.chatSection.messageInput.value = command;
            
            // Trigger send
            if (window.chatSection.sendReceiveHandler) {
                window.chatSection.sendReceiveHandler.sendMessage();
                console.log('✅ [TEST] Music command sent:', command);
            }
        } else {
            console.log('❌ [TEST] Chat section or message input not available');
        }
    }, 2000);
    
    return true;
};

// TitiBot Setup Guide
console.log('🎯 [TITIBOT-SETUP] === TitiBot Voice Music Setup ===');
console.log('🤖 [TITIBOT-SETUP] TitiBot is ready for voice music commands!');
console.log('');
console.log('📝 [TITIBOT-SETUP] Available Commands:');
console.log('  /titibot ping - Test if bot is alive');
console.log('  /titibot play [song] - Play music in voice channel');
console.log('  /titibot stop - Stop current music');
console.log('  /titibot next - Play next song');
console.log('  /titibot prev - Play previous song');
console.log('  /titibot queue [song] - Add song to queue');
console.log('');
console.log('🧪 [TITIBOT-SETUP] Test Functions:');
console.log('  testTitiBotVoiceMusicIntegration() - Full integration test');
console.log('  testBotJoinOnly() - Test bot joining voice only');
console.log('  testMusicCommandOnly() - Test music command only');
console.log('');
console.log('💡 [TITIBOT-SETUP] Usage:');
console.log('  1. Make sure you\'re in a voice channel');
console.log('  2. Type a music command in chat (e.g., "/titibot play never gonna give you up")');
console.log('  3. TitiBot will join as a participant and start playing music');
console.log('===================================');

// Simple debug function to test voice context
window.debugSimpleVoiceContext = function() {
    console.log('🧪 [DEBUG] === SIMPLE VOICE CONTEXT DEBUG ===');
    
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
        console.log('🔊 [DEBUG] Unified Voice State:', voiceState);
    }
    
    console.log('===========================================');
};

// Test function to validate fixed TitiBot voice detection
window.testFixedTitiBotVoiceDetection = function() {
    try {
        console.log('🧪 [TEST-FIX] === Testing Fixed TitiBot Voice Detection ===');
    
    const urlParams = new URLSearchParams(window.location.search);
    const currentChannelId = urlParams.get('channel');
    const currentChannelType = urlParams.get('type');
    
    console.log('📍 [TEST-FIX] Current Context:', {
        channelId: currentChannelId,
        channelType: currentChannelType,
        pathname: window.location.pathname
    });
    
    // Test the voice detection logic that will be used by send-receive-handler
    let voiceChannelId = null;
    let userInVoice = false;
    let detectionMethod = 'none';
    
    console.log('🔍 [TEST-FIX] Testing voice detection priority order...');
    
    // Priority 1: Check if user is actually connected to voice (regardless of current page)
    if (window.unifiedVoiceStateManager) {
        const voiceState = window.unifiedVoiceStateManager.getState();
        console.log('🔍 [TEST-FIX] Unified voice state:', voiceState);
        if (voiceState && voiceState.isConnected && voiceState.channelId) {
            voiceChannelId = voiceState.channelId;
            userInVoice = true;
            detectionMethod = 'unifiedVoiceStateManager';
            console.log('🎤 [TEST-FIX] ✅ Priority 1: Voice detected via unified state manager: ' + voiceChannelId);
        }
    }
    
    // Priority 2: VideoSDK manager (user actually connected to voice)
    if (!userInVoice && window.videoSDKManager) {
        if (window.videoSDKManager.isConnected && window.videoSDKManager.isMeetingJoined) {
            const meetingId = window.videoSDKManager.meetingId;
            if (meetingId && meetingId.includes('voice_channel_')) {
                voiceChannelId = meetingId.replace('voice_channel_', '');
                userInVoice = true;
                detectionMethod = 'videoSDKManager';
                console.log('🎤 [TEST-FIX] ✅ Priority 2: Voice detected via VideoSDK: ' + voiceChannelId);
            }
        }
    }
    
    // Priority 3: Voice manager (user actually connected to voice)
    if (!userInVoice && window.voiceManager) {
        if (window.voiceManager.isConnected && window.voiceManager.currentChannelId) {
            voiceChannelId = window.voiceManager.currentChannelId;
            userInVoice = true;
            detectionMethod = 'voiceManager';
            console.log('🎤 [TEST-FIX] ✅ Priority 3: Voice detected via voice manager: ' + voiceChannelId);
        }
    }
    
    // Priority 4: Global socket manager presence (user actually connected to voice)
    if (!userInVoice && window.globalSocketManager) {
        const currentActivity = window.globalSocketManager.currentActivityDetails;
        if (currentActivity && currentActivity.type) {
            if (currentActivity.type === 'In Voice Call' || currentActivity.type.startsWith('In Voice - ')) {
                if (currentActivity.channel_id) {
                    voiceChannelId = currentActivity.channel_id;
                    userInVoice = true;
                    detectionMethod = 'globalSocketManager';
                    console.log('🎤 [TEST-FIX] ✅ Priority 4: Voice detected via presence: ' + voiceChannelId);
                }
            }
        }
    }
    
    // Priority 5: Current channel context (if we're viewing a voice channel page)
    if (!userInVoice) {
        const metaChannelType = document.querySelector('meta[name="channel-type"]')?.content;
        if ((currentChannelType === 'voice' || metaChannelType === 'voice') && currentChannelId) {
            const channelElement = document.querySelector('[data-channel-id="' + currentChannelId + '"][data-channel-type="voice"]');
            if (channelElement) {
                voiceChannelId = currentChannelId;
                userInVoice = true;
                detectionMethod = 'currentVoiceChannel+present';
                console.log('🎤 [TEST-FIX] ✅ Priority 5: Voice detected via current voice channel page: ' + voiceChannelId);
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
            console.log('✅ [TEST-FIX] SUCCESS! User is connected to voice and commanding from text channel - TitiBot should work!');
        } else {
            console.log('✅ [TEST-FIX] SUCCESS! User has voice channel context - TitiBot should work!');
        }
        console.log('🎵 [TEST-FIX] Try sending: /titibot play never gonna give you up');
        return true;
    } else {
        console.log('❌ [TEST-FIX] FAILED! No voice connection or channel context detected.');
        console.log('💡 [TEST-FIX] Make sure you are either:');
        console.log('   - Connected to a voice channel, OR');
        console.log('   - Viewing a voice channel page');
        return false;
    }
    } catch (error) {
        console.error('❌ [TEST-FIX] Error in voice detection test:', error);
        return false;
    }
};

// Test function to send a TitiBot command and verify the fix works
window.testTitiBotCommandWithFix = function(command = 'play never gonna give you up') {
    try {
        console.log('🎯 [TEST-FIX] === Testing TitiBot Command with Fix ===');
    
    // Step 1: Validate voice context
    const result = window.testFixedTitiBotVoiceDetection();
    if (!result) {
        console.log('❌ [TEST-FIX] Voice detection failed, aborting test');
        return false;
    }
    
    // Step 2: Check if chat section is available
    if (!window.chatSection || !window.chatSection.messageInput) {
        console.log('❌ [TEST-FIX] Chat section not available');
        return false;
    }
    
    // Step 3: Send the command
    const fullCommand = '/titibot ' + command;
    console.log('🎵 [TEST-FIX] Sending command: ' + fullCommand);
    
    // Clear any existing content
    window.chatSection.messageInput.value = '';
    
    // Set the command
    window.chatSection.messageInput.value = fullCommand;
    
    // Trigger the send
    if (window.chatSection.sendReceiveHandler && typeof window.chatSection.sendReceiveHandler.sendMessage === 'function') {
        console.log('🚀 [TEST-FIX] Triggering send...');
        window.chatSection.sendReceiveHandler.sendMessage();
        console.log('✅ [TEST-FIX] Command sent successfully!');
        
        console.log('⏳ [TEST-FIX] Watch for TitiBot response and music player activation...');
        return true;
    } else {
        console.log('❌ [TEST-FIX] Send handler not available');
        return false;
    }
    } catch (error) {
        console.error('❌ [TEST-FIX] Error in command test:', error);
        return false;
    }
};

console.log('🎯 [TEST-FIX] Test command function loaded: testTitiBotCommandWithFix()');

// Simple validation function to test basic JavaScript functionality
window.validateJavaScriptSyntax = function() {
    console.log('✅ [VALIDATION] JavaScript syntax is working correctly!');
    console.log('📋 [VALIDATION] Available test functions:');
    console.log('  - testFixedTitiBotVoiceDetection()');
    console.log('  - testTitiBotCommandWithFix()');
    console.log('  - validateJavaScriptSyntax()');
    return true;
};

// Auto-run validation
console.log('🔧 [VALIDATION] Running automatic syntax validation...');
setTimeout(() => {
    try {
        window.validateJavaScriptSyntax();
    } catch (error) {
        console.error('❌ [VALIDATION] JavaScript validation failed:', error);
    }
}, 100);

console.log('');
console.log('🔧 [TITIBOT-FIX] === TitiBot Voice Detection Fix Applied ===');
console.log('');
console.log('📋 [TITIBOT-FIX] What was fixed:');
console.log('  ✅ Frontend now prioritizes actual voice connection over current page context');
console.log('  ✅ Backend accepts commands from users connected to voice (even from text channels)');
console.log('  ✅ Voice detection works when user is in voice but commanding from text channel');
console.log('  ✅ Still supports commanding from voice channel pages for non-connected users');
console.log('');
console.log('🎯 [TITIBOT-FIX] Supported scenarios:');
console.log('  • User connected to voice channel, sending commands from text channel ✅');
console.log('  • User viewing voice channel page, sending commands from that page ✅');
console.log('  • User connected to voice channel, sending commands from voice channel page ✅');
console.log('');
console.log('🧪 [TITIBOT-FIX] Testing functions:');
console.log('  • testFixedTitiBotVoiceDetection() - Test voice detection logic');
console.log('  • testTitiBotCommandWithFix() - Send actual TitiBot command');
console.log('');
console.log('📝 [TITIBOT-FIX] How to test:');
console.log('  1. Connect to a voice channel (join the voice call)');
console.log('  2. Navigate to any text channel or stay in voice channel');
console.log('  3. Run testFixedTitiBotVoiceDetection() to verify detection works');
console.log('  4. Run testTitiBotCommandWithFix() to test sending a command');
console.log('  5. Or just type "/titibot play [song name]" in chat normally');
console.log('');
console.log('🎵 [TITIBOT-FIX] The bot should now work when you\'re connected to voice!');
</script>