<?php

if (!isset($currentServer) || empty($currentServer)) {
    echo '<div class="flex-1 bg-[#313338] flex items-center justify-center text-white text-lg">Select a server to view channels</div>';
    return;
}

$activeChannelId = $GLOBALS['activeChannelId'] ?? null;
$activeChannel = $GLOBALS['activeChannel'] ?? null;

if (!$activeChannel) {
    echo '<div class="flex-1 bg-[#313338] flex items-center justify-center text-white text-lg">Select a voice channel</div>';
    return;
}

$meetingId = 'voice_channel_' . $activeChannelId;
$userName = $_SESSION['username'] ?? 'Anonymous';

$additional_js[] = 'components/voice/voice-manager';
$additional_js[] = 'core/ui/toast';
?>

<link rel="stylesheet" href="/public/css/voice-section.css">

<script>
// Global flags to prevent race conditions
window.voiceAutoJoinInProgress = false;
window.voiceUIInitialized = false;

// Function to handle auto-join logic - can be called immediately or on DOM ready
window.handleAutoJoin = function() {
    if (window.voiceAutoJoinInProgress) {
        console.log('🔊 Auto-join already in progress, skipping');
        return;
    }
    
    localStorage.setItem('onVoiceChannelPage', 'true');
    
    // Check for auto-join flag
    const autoJoinChannelId = localStorage.getItem('autoJoinVoiceChannel');
    const currentChannelId = document.querySelector('meta[name="channel-id"]')?.getAttribute('content');
    const forceAutoJoin = sessionStorage.getItem('forceAutoJoin') === 'true';
    
    console.log('🔊 Voice section loaded - checking auto-join:', {autoJoinChannelId, currentChannelId, forceAutoJoin});
    
    if (autoJoinChannelId && autoJoinChannelId === currentChannelId && forceAutoJoin) {
        // Auto-join this voice channel
        console.log('🔊 ✅ Auto-join conditions met! Joining voice channel immediately');
        window.voiceAutoJoinInProgress = true;
        
        // Clear the flags
        localStorage.removeItem('autoJoinVoiceChannel');
        sessionStorage.removeItem('forceAutoJoin');
        
        // Set a flag for initVoiceUI to know auto-join should happen
        sessionStorage.setItem('triggerAutoJoin', 'true');
        
        // If voice UI is already initialized, trigger auto-join immediately
        if (window.voiceUIInitialized && window.triggerVoiceAutoJoin) {
            console.log('🔊 Voice UI already initialized, triggering auto-join now');
            window.triggerVoiceAutoJoin();
        }
    }
}

// If DOM is already loaded (AJAX content loading), run immediately
if (document.readyState === 'loading') {
    // If DOM is still loading, wait for it
    document.addEventListener('DOMContentLoaded', window.handleAutoJoin);
} else {
    // DOM is already loaded, run immediately
    window.handleAutoJoin();
}
</script>

<meta name="meeting-id" content="<?php echo htmlspecialchars($meetingId); ?>">
<meta name="username" content="<?php echo htmlspecialchars($userName); ?>">
<meta name="channel-id" content="<?php echo htmlspecialchars($activeChannelId); ?>">

<div class="flex flex-col h-screen bg-[#313338] text-white" id="voice-container">
    <div class="h-12 border-b border-[#1e1f22] flex items-center px-4 bg-[#313338] z-20">
        <div class="flex items-center">
            <i class="fas fa-volume-high text-gray-400 mr-2"></i>
            <span class="font-medium text-white"><?php echo htmlspecialchars($activeChannel->name ?? 'Voice Channel'); ?></span>
        </div>
        <div class="ml-auto">
            <button class="text-gray-400 hover:text-white">
                <i class="fas fa-comment-alt"></i>
            </button>
        </div>
    </div>
    
    <div class="flex-1 flex">
        <div class="flex-1 flex flex-col">
            <div id="joinView" class="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-[#1e1f3a] via-[#2b2272] to-[#1e203a]">
                <h2 class="text-2xl font-bold text-white mb-2"><?php echo htmlspecialchars($activeChannel->name ?? 'Voice Channel'); ?></h2>
                <p class="text-gray-300 text-base mb-6">No one is currently in voice</p>
                
                <button id="joinBtn" class="bg-[#5865F2] hover:bg-[#4752c4] text-white font-medium py-2 px-6 rounded transition-colors">
                    Join Voice
                </button>
            </div>
            
            <div id="connectingView" class="flex-1 flex flex-col items-center justify-center bg-[#2b2d31] hidden">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5865F2] mb-4"></div>
                <p class="text-white text-lg">Connecting to voice...</p>
            </div>
            
            <div id="connectedView" class="flex-1 flex flex-col bg-[#2b2d31] hidden">
                <div class="flex-1 flex flex-col justify-center items-center">
                    <div class="w-full max-w-xl">
                        <div class="user-voice-item w-full bg-[#313338] rounded-md overflow-hidden mb-4">
                            <div class="px-3 py-2 flex items-center justify-between">
                                <div class="flex items-center">
                                    <div class="relative w-8 h-8 rounded-full bg-[#5865F2] flex items-center justify-center overflow-hidden mr-2">
                                        <span class="text-white text-sm font-semibold"><?php echo substr($userName, 0, 1); ?></span>
                                    </div>
                                    <div class="flex flex-col">
                                        <div class="flex items-center">
                                            <span class="text-white text-sm font-medium"><?php echo htmlspecialchars($userName); ?></span>
                                            <span class="ml-1 text-xs px-1.5 py-0.5 bg-[#5865F2] text-white rounded text-[10px] uppercase font-bold">you</span>
                                        </div>
                                        <div class="text-xs text-gray-400">
                                            <span class="text-[#3ba55c]">Connected to voice</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="text-gray-400">
                                    <div class="flex items-center space-x-1">
                                        <div class="w-4 h-4 flex items-center justify-center">
                                            <i class="fas fa-microphone text-xs"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div id="participants" class="w-full"></div>
                        
                        <div id="emptyMessage" class="flex flex-col items-center justify-center py-8 text-center">
                            <div class="w-40 h-40 mb-4 opacity-70">
                                <img src="https://discord.com/assets/cb0d3973-ea92-4d74-9f1e-88ed59493a63.svg" alt="No one here" class="w-full h-full" />
                            </div>
                            <h2 class="text-xl font-bold mb-2 text-white">No one's around to hang out with</h2>
                            <p class="text-gray-400 max-w-md text-sm">When friends are in this voice channel, you'll see them here.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div id="voiceControls" class="hidden">
        <?php include __DIR__ . '/../voice/voice-tool.php'; ?>
    </div>
</div>

<style>
:root {
    --discord-primary: #5865F2;
    --discord-primary-hover: #4752c4;
    --discord-green: #3BA55D;
    --discord-red: #ED4245;
    --discord-background: #313338;
    --discord-dark: #1e1f22;
    --discord-channel-hover: rgba(79, 84, 92, 0.16);
}

/* Voice UI class to hide/show elements */
.voice-ui-element {
    transition: opacity 0.3s ease, transform 0.3s ease;
    opacity: 0;
    transform: translateY(5px);
}

.voice-ui-element.visible {
    opacity: 1;
    transform: translateY(0);
}

.btn-voice {
    position: relative;
    overflow: hidden;
}

.btn-voice:after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 5px;
    height: 5px;
    background: rgba(255, 255, 255, 0.3);
    opacity: 0;
    border-radius: 100%;
    transform: scale(1, 1) translate(-50%);
    transform-origin: 50% 50%;
}

.btn-voice:focus:not(:active)::after {
    animation: ripple 1s ease-out;
}

@keyframes ripple {
    0% {
        transform: scale(0, 0);
        opacity: 0.5;
    }
    20% {
        transform: scale(25, 25);
        opacity: 0.3;
    }
    100% {
        opacity: 0;
        transform: scale(40, 40);
    }
}
                        
@keyframes pulse {
    0% {
        box-shadow: 0 0 0 0 rgba(88, 101, 242, 0.4);
    }
    70% {
        box-shadow: 0 0 0 3px rgba(88, 101, 242, 0);
    }
    100% {
        box-shadow: 0 0 0 0 rgba(88, 101, 242, 0);
    }
}

.speaking {
    animation: pulse 2s infinite;
}

.user-voice-item {
    transition: background-color 0.2s ease;
}

.user-voice-item:hover {
    background-color: #36393f;
}

.user-voice-item.speaking {
    background-color: #3c3f45;
}

.fade-in {
    animation: fadeIn 0.3s ease forwards;
}

.fade-out {
    animation: fadeOut 0.3s ease forwards;
}

.slide-up {
    animation: slideUp 0.3s ease forwards;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
}

@keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

#skeletonLoadingView {
    transition: opacity 0.3s ease;
}

.voice-controls-container {
    transition: opacity 0.3s ease;
}

#voice-container {
    min-height: 100vh;
    height: 100vh;
}

#joinUI {
    min-height: 100vh !important;
    height: 100% !important;
}

#joinUI.visible {
    opacity: 1 !important;
    transform: translateY(0) !important;
}

.flex-1 {
    flex: 1 1 0% !important;
    min-height: 0 !important;
}

.h-screen {
    height: 100vh !important;
    min-height: 100vh !important;
}

#voice-container.bg-\[#313338\] {
    background-color: #313338 !important;
}

#joinUI h2, #joinUI p, #joinUI button {
    z-index: 20;
    position: relative;
}

#joinUI.hidden {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
}

/* Skeleton loading animation */
.skeleton-circle,
.skeleton-text,
.skeleton-icon {
    position: relative;
    overflow: hidden;
}

.skeleton-circle::after,
.skeleton-text::after,
.skeleton-icon::after {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    transform: translateX(-100%);
    background-image: linear-gradient(
        90deg,
        rgba(59, 61, 68, 0) 0,
        rgba(59, 61, 68, 0.2) 20%,
        rgba(59, 61, 68, 0.5) 60%,
        rgba(59, 61, 68, 0)
    );
    animation: shimmer 2s infinite;
}

@keyframes shimmer {
    100% {
        transform: translateX(100%);
    }
}
</style>

<template id="participantTemplate">
    <div class="user-voice-item w-full bg-[#313338] rounded-md overflow-hidden mb-2">
        <div class="px-3 py-2 flex items-center justify-between">
            <div class="flex items-center">
                <div class="participant-avatar relative w-8 h-8 rounded-full bg-[#3ba55c] flex items-center justify-center overflow-hidden mr-2">
                    <span class="text-white text-sm font-semibold">U</span>
                </div>
                <div class="flex flex-col">
                    <div class="flex items-center">
                        <span class="participant-name text-white text-sm font-medium">User</span>
                    </div>
                    <div class="text-xs text-gray-400 participant-status"></div>
                </div>
            </div>
            <div class="text-gray-400 participant-icons">
                <div class="flex items-center space-x-1">
                    <div class="w-4 h-4 flex items-center justify-center">
                        <i class="fas fa-microphone-slash text-xs"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
if (!document.querySelector('script[src*="voice-manager.js"]')) {
    const voiceScript = document.createElement('script');
    voiceScript.src = '/public/js/components/voice/voice-manager.js?v=' + Date.now();
    voiceScript.onload = function() {
        console.log('🔊 Voice manager script loaded dynamically');
        
        setTimeout(() => {
            const shouldAutoJoin = sessionStorage.getItem('triggerAutoJoin') === 'true';
            if (shouldAutoJoin && window.voiceUIInitialized && typeof window.triggerVoiceAutoJoin === 'function' && !window.voiceAutoJoinInProgress) {
                console.log('🔊 Voice manager now available, triggering pending auto-join');
                window.triggerVoiceAutoJoin();
            }
        }, 300);
    };
    document.head.appendChild(voiceScript);
}

// Function to initialize voice UI - can be called immediately or on DOM ready
window.initVoiceUI = function() {
    if (window.voiceUIInitialized) {
        console.log('🔊 Voice UI already initialized, skipping');
        return;
    }
    
    console.log('🔊 Initializing voice UI');
    
    const joinBtn = document.getElementById('joinBtn');
    const joinView = document.getElementById('joinView');
    const connectingView = document.getElementById('connectingView');
    const connectedView = document.getElementById('connectedView');
    const voiceControls = document.getElementById('voiceControls');
    
    if (!joinBtn || !joinView || !connectingView || !connectedView) {
        console.log('🔊 ⚠️ Voice UI elements not found, retrying in 200ms');
        setTimeout(window.initVoiceUI, 200);
        return;
    }
    
    let isConnected = false;
    
    function autoJoinVoice() {
        if (isConnected) {
            console.log('🔊 Already connected to voice, skipping auto-join');
            return;
        }
        
        console.log('🔊 Starting auto-join process...');
        
        joinView.classList.add('hidden');
        connectingView.classList.remove('hidden');
        
        if (window.voiceManager && typeof window.voiceManager.joinVoice === 'function') {
            console.log('🔊 Using VoiceManager for auto-join');
            window.voiceManager.joinVoice().then(() => {
                setTimeout(() => {
                    connectingView.classList.add('hidden');
                    connectedView.classList.remove('hidden');
                    voiceControls.classList.remove('hidden');
                    isConnected = true;
                    console.log('🔊 ✅ Voice connection successful');
                }, 300);
            }).catch((error) => {
                console.error('🔊 ❌ Auto-join failed:', error);
                connectingView.classList.add('hidden');
                joinView.classList.remove('hidden');
                window.voiceAutoJoinInProgress = false;
            });
        } else {
            console.log('🔊 Using fallback auto-join (no VoiceManager)');
            setTimeout(() => {
                connectingView.classList.add('hidden');
                connectedView.classList.remove('hidden');
                voiceControls.classList.remove('hidden');
                
                isConnected = true;
                window.dispatchEvent(new Event('voiceConnect'));
                
                if (window.showToast) {
                    window.showToast('Connected to <?php echo htmlspecialchars($activeChannel->name ?? 'voice channel'); ?>', 'success', 3000);
                }
                console.log('🔊 ✅ Voice connection successful (fallback)');
            }, 1500);
        }
        
        // Reset the auto-join flag
        setTimeout(() => {
            window.voiceAutoJoinInProgress = false;
            sessionStorage.removeItem('triggerAutoJoin');
        }, 2000);
    }
    
    // Make auto-join function globally available
    window.triggerVoiceAutoJoin = autoJoinVoice;
    
    // Set up join button click handler
    joinBtn.addEventListener('click', function() {
        if (isConnected) {
            console.log('🔊 Already connected, ignoring click');
            return;
        }
        
        console.log('🔊 Manual join button clicked');
        joinBtn.disabled = true;
        joinBtn.textContent = 'Connecting...';
        
        autoJoinVoice();
    });
    
    // Set up disconnect handler
    window.addEventListener('voiceDisconnect', function() {
        console.log('🔊 Voice disconnect event received');
        isConnected = false;
        
        connectedView.classList.add('hidden');
        voiceControls.classList.add('hidden');
        joinView.classList.remove('hidden');
        
        joinBtn.disabled = false;
        joinBtn.textContent = 'Join Voice';
        window.voiceAutoJoinInProgress = false;
    });
    
    // Mark as initialized
    window.voiceUIInitialized = true;
    console.log('🔊 ✅ Voice UI initialization complete');
    
    // Check if auto-join was requested before UI was ready
    const shouldAutoJoin = sessionStorage.getItem('triggerAutoJoin') === 'true';
    if (shouldAutoJoin && !window.voiceAutoJoinInProgress) {
        console.log('🔊 Auto-join was requested, triggering now that UI is ready');
        setTimeout(() => {
            autoJoinVoice();
        }, 500);
    }
    
    // Dispatch custom event
    document.dispatchEvent(new CustomEvent('channelContentLoaded', {
        detail: {
            type: 'voice',
            channelId: '<?php echo htmlspecialchars($activeChannelId); ?>'
        }
    }));
}

// Initialize voice UI immediately if DOM is ready, or wait for DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initVoiceUI);
} else {
    // DOM is already loaded (AJAX scenario), run immediately
    setTimeout(window.initVoiceUI, 100);
}
</script>