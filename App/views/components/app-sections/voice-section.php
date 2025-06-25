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

$additional_js[] = 'components/videosdk/videosdk';
$additional_js[] = 'components/voice/voice-manager';
$additional_js[] = 'components/voice/voice-section';
$additional_js[] = 'core/ui/toast';
?>

<link rel="stylesheet" href="/public/css/voice-section.css">

<script>
document.addEventListener('DOMContentLoaded', function() {
    localStorage.setItem('onVoiceChannelPage', 'true');
    
    // Check for auto-join flag
    const autoJoinChannelId = localStorage.getItem('autoJoinVoiceChannel');
    const currentChannelId = document.querySelector('meta[name="channel-id"]')?.getAttribute('content');
    const forceAutoJoin = sessionStorage.getItem('forceAutoJoin') === 'true';
    
    console.log('Voice section loaded:', {autoJoinChannelId, currentChannelId, forceAutoJoin});
    
    if (autoJoinChannelId && autoJoinChannelId === currentChannelId && forceAutoJoin) {
        // Auto-join this voice channel
        console.log('Auto-joining voice channel immediately');
        
        // Clear the flags
        localStorage.removeItem('autoJoinVoiceChannel');
        sessionStorage.removeItem('forceAutoJoin');
        
        // Auto-click join button after a short delay
        setTimeout(function() {
            const joinBtn = document.getElementById('joinBtn');
            if (joinBtn && !joinBtn.disabled) {
                console.log('Auto-clicking join button');
                joinBtn.click();
            }
        }, 1000);
    }
});
</script>

<meta name="meeting-id" content="<?php echo htmlspecialchars($meetingId); ?>">
<meta name="username" content="<?php echo htmlspecialchars($userName); ?>">
<meta name="channel-id" content="<?php echo htmlspecialchars($activeChannelId); ?>">

<div class="flex flex-col h-screen bg-[#313338] text-white" id="voice-container">
    <!-- Channel header - Hidden during skeleton loading -->
    <div class="h-12 border-b border-[#1e1f22] flex items-center px-4 shadow-sm bg-[#313338] z-20 voice-ui-element hidden">
        <div class="flex items-center">
            <i class="fas fa-volume-high text-gray-400 mr-2"></i>
            <span class="font-medium text-white"><?php echo htmlspecialchars($activeChannel['name'] ?? 'Voice Channel'); ?></span>
        </div>
        <div class="ml-auto">
            <button class="text-gray-400 hover:text-white">
                <i class="fas fa-comment-alt"></i>
            </button>
        </div>
    </div>
    
    <!-- Skeleton header - Shown during loading -->
    <div class="h-12 border-b border-[#1e1f22] flex items-center px-4 shadow-sm bg-[#313338] z-20" id="skeleton-header">
        <div class="flex items-center">
            <div class="skeleton-circle w-4 h-4 bg-[#3b3d44] rounded-full mr-2"></div>
            <div class="skeleton-text w-32 h-4 bg-[#3b3d44] rounded"></div>
        </div>
    </div>
    
    <!-- Main content area -->
    <div class="flex-1 flex">
        <!-- No participants message when empty -->
        <div class="flex-1 flex flex-col">
            <!-- Video grid container -->
            <div id="videoContainer" class="w-full h-full flex flex-wrap justify-center items-center gap-8 p-4 hidden voice-ui-element">
                <div id="videosContainer" class="flex flex-wrap justify-center items-center gap-8"></div>
            </div>
            
            <!-- Skeleton loading view (shown first) -->
            <div id="skeletonLoadingView" class="flex-1 flex flex-col justify-center items-center bg-[#2b2d31]">
                <div class="w-full max-w-xl">
                    <!-- Current user skeleton -->
                    <div class="user-voice-item w-full bg-[#313338] rounded-md overflow-hidden mb-4">
                        <div class="px-3 py-2 flex items-center justify-between">
                            <div class="flex items-center">
                                <div class="skeleton-circle w-8 h-8 rounded-full bg-[#3b3d44] mr-2"></div>
                                <div class="flex flex-col">
                                    <div class="skeleton-text w-28 h-4 bg-[#3b3d44] rounded mb-1"></div>
                                    <div class="skeleton-text w-24 h-3 bg-[#3b3d44] rounded"></div>
                                </div>
                            </div>
                            <div class="skeleton-icon w-4 h-4 bg-[#3b3d44] rounded"></div>
                        </div>
                    </div>
                    
                    <!-- Skeleton participants -->
                    <div class="user-voice-item w-full bg-[#313338] rounded-md overflow-hidden mb-2">
                        <div class="px-3 py-2 flex items-center justify-between">
                            <div class="flex items-center">
                                <div class="skeleton-circle w-8 h-8 rounded-full bg-[#3b3d44] mr-2"></div>
                                <div class="flex flex-col">
                                    <div class="skeleton-text w-24 h-4 bg-[#3b3d44] rounded mb-1"></div>
                                    <div class="skeleton-text w-16 h-3 bg-[#3b3d44] rounded"></div>
                                </div>
                            </div>
                            <div class="skeleton-icon w-4 h-4 bg-[#3b3d44] rounded"></div>
                        </div>
                    </div>
                    <div class="user-voice-item w-full bg-[#313338] rounded-md overflow-hidden mb-2">
                        <div class="px-3 py-2 flex items-center justify-between">
                            <div class="flex items-center">
                                <div class="skeleton-circle w-8 h-8 rounded-full bg-[#3b3d44] mr-2"></div>
                                <div class="flex flex-col">
                                    <div class="skeleton-text w-20 h-4 bg-[#3b3d44] rounded mb-1"></div>
                                    <div class="skeleton-text w-12 h-3 bg-[#3b3d44] rounded"></div>
                                </div>
                            </div>
                            <div class="skeleton-icon w-4 h-4 bg-[#3b3d44] rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Discord-style voice channel view (shown when connected) -->
            <div class="flex-1 flex flex-col justify-center items-center bg-[#2b2d31] hidden voice-ui-element" id="discordVoiceView">
                <!-- Current user (you) -->
                <div class="user-voice-item w-full max-w-xl mb-4 bg-[#313338] rounded-md overflow-hidden">
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
                                <div class="text-xs text-gray-400" id="user-voice-status">
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
                
                <!-- Participants will be dynamically added here -->
                <div id="participants" class="w-full max-w-xl"></div>
                
                <!-- Empty state message (shows when no other participants) -->
                <div id="emptyVoiceMessage" class="flex flex-col items-center justify-center py-8 text-center hidden">
                    <div class="w-40 h-40 mb-4 opacity-70">
                        <img src="https://discord.com/assets/cb0d3973-ea92-4d74-9f1e-88ed59493a63.svg" alt="No one here" class="w-full h-full" />
                    </div>
                    <h2 class="text-xl font-bold mb-2 text-white">No one's around to hang out with</h2>
                    <p class="text-gray-400 max-w-md text-sm">When friends are in this voice channel, you'll see them here.</p>
                </div>
            </div>
            
            <!-- Join UI component (hidden initially) - Based on voice-not-join.php -->
            <div id="joinUI" class="flex-1 flex flex-col items-center justify-center z-10 hidden voice-ui-element bg-gradient-to-b from-[#1e1f3a] via-[#2b2272] to-[#1e203a]" style="min-height: 100vh; height: 100%;">
                <h2 class="text-2xl font-bold text-white mb-2"><?php echo htmlspecialchars($activeChannel['name'] ?? 'Voice Channel'); ?></h2>
                <p class="text-gray-300 text-base mb-6">No one is currently in voice</p>
                
                <button id="joinBtn" class="bg-[#5865F2] hover:bg-[#4752c4] text-white font-medium py-2 px-6 rounded transition-colors">
                    Join Voice
                </button>
            </div>
        </div>
    </div>
    
    <!-- Voice tools at bottom - Hidden during loading -->
    <div class="voice-controls-container voice-ui-element hidden">
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

<!-- Add scripts only if not already loaded -->
<script>
if (typeof VideoSDK === 'undefined') {
    console.log("Loading VideoSDK from voice-section.php");
    const videoSDKScript = document.createElement('script');
    videoSDKScript.src = "https://sdk.videosdk.live/js-sdk/0.2.7/videosdk.js";
    document.head.appendChild(videoSDKScript);
} else {
    console.log("VideoSDK already loaded");
}

// Make sure our scripts get loaded through the PHP architecture
if (typeof window.videoSDKManager === 'undefined') {
    console.log("Adding videosdk.js to additional_js");
    if (typeof additional_js !== 'undefined') {
        if (!additional_js.includes('components/videosdk/videosdk')) {
            additional_js.push('components/videosdk/videosdk');
        }
    }
}
if (typeof additional_js !== 'undefined') {
    if (!additional_js.includes('components/voice/voice-manager')) {
        additional_js.push('components/voice/voice-manager');
    }
}

// JavaScript to handle participant template rendering and UI visibility
document.addEventListener("DOMContentLoaded", function() {
    // Signal that the voice channel content has loaded
    document.dispatchEvent(new CustomEvent('channelContentLoaded', {
        detail: {
            type: 'voice',
            channelId: '<?php echo htmlspecialchars($activeChannelId); ?>'
        }
    }));
    
    // Check if we should auto-join this channel
    if (window.attemptAutoJoinVoice) {
        // Try to auto-join a few times to make sure the UI is fully loaded
        setTimeout(() => window.attemptAutoJoinVoice(), 300);
        setTimeout(() => window.attemptAutoJoinVoice(), 800);
        setTimeout(() => window.attemptAutoJoinVoice(), 1500);
    }
    
    // Handle UI visibility
    const joinUI = document.getElementById('joinUI');
    const discordVoiceView = document.getElementById('discordVoiceView');
    const voiceControlsContainer = document.querySelector('.voice-controls-container');
    const mainContent = document.querySelector('.flex-1.flex.flex-col');
    const skeletonLoadingView = document.getElementById('skeletonLoadingView');
    const skeletonHeader = document.getElementById('skeleton-header');
    const emptyVoiceMessage = document.getElementById('emptyVoiceMessage');
    const voiceUIElements = document.querySelectorAll('.voice-ui-element');
    
    // Function to show voice UI elements with animation
    function showVoiceUIElements() {
        // Hide skeleton header
        if (skeletonHeader) skeletonHeader.style.display = 'none';
        
        // Show all voice UI elements with staggered animation
        voiceUIElements.forEach((element, index) => {
            setTimeout(() => {
                // Don't show joinUI if we're in connected state
                if (element.id === 'joinUI' && localStorage.getItem('voiceActive') === 'true') {
                    return; // Skip showing joinUI when connected
                }
                
                element.classList.remove('hidden');
                
                // Special handling for joinUI to ensure proper layout (only when not connected)
                if (element.id === 'joinUI' && localStorage.getItem('voiceActive') !== 'true') {
                    element.style.display = 'flex';
                    element.style.minHeight = '100vh';
                    element.style.height = '100%';
                    element.style.opacity = '1';
                    element.style.visibility = 'visible';
                }
                
                // Add a small delay to allow the browser to process the display change
                setTimeout(() => {
                    element.classList.add('visible');
                }, 50);
            }, index * 100); // Stagger the animations
        });
    }
    
    // Function to hide voice UI elements
    function hideVoiceUIElements() {
        // Show skeleton header
        if (skeletonHeader) skeletonHeader.style.display = 'flex';
        
        // Hide all voice UI elements
        voiceUIElements.forEach(element => {
            element.classList.remove('visible');
            element.classList.add('hidden');
            
            // Extra hiding for joinUI
            if (element.id === 'joinUI') {
                element.style.display = 'none';
                element.style.visibility = 'hidden';
                element.style.opacity = '0';
            }
        });
    }
    
    // Function to show connection toast
    function showConnectionToast() {
        if (!window.showToast) return;
        
        // Show toast
        window.showToast('Connected to <?php echo htmlspecialchars($activeChannel['name'] ?? 'voice channel'); ?>', 'success', 5000);
    }
    
    // Function to preload all voice UI elements
    function preloadVoiceElements() {
        return new Promise((resolve) => {
            // Preload all voice UI elements but keep them hidden
            voiceUIElements.forEach(element => {
                element.classList.remove('hidden');
                element.style.visibility = 'hidden';
                element.style.position = 'absolute';
            });
            
            // Ensure all images and assets are loaded
            const images = document.querySelectorAll('#voice-container img');
            let loadedImages = 0;
            const totalImages = images.length;
            
            if (totalImages === 0) {
                setTimeout(resolve, 100);
                return;
            }
            
            images.forEach(img => {
                if (img.complete) {
                    loadedImages++;
                    if (loadedImages === totalImages) {
                        setTimeout(resolve, 100);
                    }
                } else {
                    img.addEventListener('load', () => {
                        loadedImages++;
                        if (loadedImages === totalImages) {
                            setTimeout(resolve, 100);
                        }
                    });
                }
            });
            
            // Fallback timeout
            setTimeout(resolve, 800);
        });
    }
    
    // Initial state: show join UI immediately, hide skeleton
    if (skeletonLoadingView) skeletonLoadingView.style.display = 'none';
    
    // Preload elements in background while showing join UI
    preloadVoiceElements().then(() => {
        console.log('Voice elements preloaded and ready');
    });
    
    // Check if we're already connected
    const isAlreadyConnected = localStorage.getItem('voiceActive') === 'true';
    
    if (!isAlreadyConnected) {
        // Show join UI immediately only if not connected
        showVoiceUIElements();
        if (discordVoiceView) discordVoiceView.style.display = 'none';
        if (joinUI) {
            joinUI.style.display = 'flex';
            joinUI.style.opacity = '1';
            joinUI.style.visibility = 'visible';
            joinUI.classList.remove('hidden');
        }
        if (voiceControlsContainer) voiceControlsContainer.style.display = 'none';
    } else {
        // If already connected, hide join UI and show appropriate connected state
        if (joinUI) {
            joinUI.style.display = 'none';
            joinUI.style.visibility = 'hidden';
            joinUI.classList.add('hidden');
            joinUI.style.opacity = '0';
        }
        if (skeletonLoadingView) skeletonLoadingView.style.display = 'flex';
    }
    
    // Listen for join button clicks
    const joinBtn = document.getElementById('joinBtn');
    if (joinBtn) {
        joinBtn.addEventListener('click', async function(event) {
            // Prevent multiple clicks
            if (joinBtn.disabled) return;
            
            console.log('Join button clicked - starting connection process');
            
            // Set loading state
            joinBtn.textContent = 'Connecting...';
            joinBtn.classList.add('opacity-70', 'cursor-not-allowed');
            joinBtn.disabled = true;
            
            // Fade out current UI smoothly
            if (joinUI) {
                joinUI.style.transition = 'opacity 0.3s ease';
                joinUI.style.opacity = '0';
            }
            
            // After fade out, show skeleton and start connection
            setTimeout(() => {
                // Hide all UI elements
                hideVoiceUIElements();
                
                // Show skeleton loading
                if (skeletonLoadingView) {
                    skeletonLoadingView.classList.remove('fade-out');
                    skeletonLoadingView.style.opacity = '1';
                    skeletonLoadingView.style.display = 'flex';
                }
                
                // Don't set voiceActive here - wait for actual connection
                console.log('Showing skeleton, waiting for voice connection...');
                
                // The voice-manager.js will handle the actual connection and fire voiceConnect event
                // We just need to wait for that event
            }, 300);
        });
    }
    
    // Function to ensure all elements are ready before showing
    function ensureElementsReady() {
        return new Promise((resolve) => {
            // Check if all critical elements are loaded
            const checkElements = () => {
                const voiceTools = document.querySelector('.voice-tools');
                const voiceIndicator = document.getElementById('voice-connection-indicator');
                const userStatus = document.getElementById('user-voice-status');
                
                // Check if elements have proper dimensions
                if (voiceTools && voiceIndicator && userStatus) {
                    const toolsRect = voiceTools.getBoundingClientRect();
                    if (toolsRect.width > 0 && toolsRect.height > 0) {
                        resolve();
                        return;
                    }
                }
                
                // Retry after a short delay
                setTimeout(checkElements, 50);
            };
            
            checkElements();
            
            // Fallback timeout
            setTimeout(resolve, 1000);
        });
    }
    
    // Listen for connection events
    window.addEventListener('voiceConnect', async function(event) {
        console.log('Voice connection established - transitioning from skeleton to content');
        
        // Mark voice as active now that we're actually connected
        localStorage.setItem('voiceActive', 'true');
        
        // Ensure all elements are ready before showing
        await preloadVoiceElements();
        await ensureElementsReady();
        
        // Reset visibility and position of elements
        voiceUIElements.forEach(element => {
            element.style.visibility = '';
            element.style.position = '';
        });
        
        // Prepare connected content but keep it hidden initially
        if (joinUI) {
            joinUI.style.display = 'none';
            joinUI.style.visibility = 'hidden';
            joinUI.classList.add('hidden');
        }
        if (discordVoiceView) {
            discordVoiceView.style.display = 'flex';
            discordVoiceView.style.opacity = '0';
            discordVoiceView.classList.remove('hidden');
        }
        if (voiceControlsContainer) {
            voiceControlsContainer.style.display = 'flex';
            voiceControlsContainer.style.opacity = '0';
            voiceControlsContainer.classList.remove('hidden');
        }
        
        // Start transition: fade out skeleton
        if (skeletonLoadingView) {
            skeletonLoadingView.style.transition = 'opacity 0.3s ease';
            skeletonLoadingView.style.opacity = '0';
            
            // After skeleton fades out, show connected content
            setTimeout(() => {
                // Hide skeleton completely
                skeletonLoadingView.style.display = 'none';
                
                // Ensure joinUI is completely hidden
                if (joinUI) {
                    joinUI.style.display = 'none';
                    joinUI.style.visibility = 'hidden';
                    joinUI.classList.add('hidden');
                    joinUI.style.opacity = '0';
                }
                
                // Show voice UI elements (but not joinUI due to our check)
                showVoiceUIElements();
                
                // Fade in connected content
                if (discordVoiceView) {
                    discordVoiceView.style.transition = 'opacity 0.3s ease';
                    discordVoiceView.style.opacity = '1';
                }
                
                if (voiceControlsContainer) {
                    voiceControlsContainer.style.transition = 'opacity 0.3s ease';
                    voiceControlsContainer.style.opacity = '1';
                }
                
                // Remove gradient background when connected
                if (mainContent) {
                    mainContent.style.background = '#2b2d31';
                }
                
                // Show connection toast after content is visible
                setTimeout(() => {
                    showConnectionToast();
                    
                    // Check for participants
                    const hasParticipants = document.getElementById('participants').children.length > 0;
                    if (!hasParticipants && emptyVoiceMessage) {
                        emptyVoiceMessage.style.display = 'flex';
                    }
                }, 200);
                
            }, 300);
        }
    });
    
    window.addEventListener('voiceDisconnect', function(event) {
        console.log('Voice disconnected - showing join UI');
        
        // Mark voice as inactive
        localStorage.setItem('voiceActive', 'false');
        
        // Hide skeleton and connected content
        if (skeletonLoadingView) skeletonLoadingView.style.display = 'none';
        if (discordVoiceView) discordVoiceView.style.display = 'none';
        if (voiceControlsContainer) voiceControlsContainer.style.display = 'none';
        
        // Apply gradient background from voice-not-join.php
        if (mainContent) {
            mainContent.style.background = 'linear-gradient(180deg, #1e1f3a 0%, #2b2272 50%, #1e203a 100%)';
        }
        
        // Ensure parent containers have proper height
        const voiceContainer = document.getElementById('voice-container');
        if (voiceContainer) {
            voiceContainer.style.height = '100vh';
            voiceContainer.style.minHeight = '100vh';
        }
        
        // Reset and show join UI
        if (joinUI) {
            // Reset all styles and classes
            joinUI.className = 'flex-1 flex flex-col items-center justify-center z-10 bg-gradient-to-b from-[#1e1f3a] via-[#2b2272] to-[#1e203a]';
            joinUI.style.cssText = 'display: flex; height: 100%; width: 100%; min-height: 100vh; opacity: 1;';
            
            // Load voice-not-join content
            joinUI.innerHTML = `
                <h2 class="text-2xl font-bold text-white mb-2"><?php echo htmlspecialchars($activeChannel['name'] ?? 'Voice Channel'); ?></h2>
                <p class="text-gray-300 text-base mb-6">No one is currently in voice</p>
                
                <button id="joinBtn" class="bg-[#5865F2] hover:bg-[#4752c4] text-white font-medium py-2 px-6 rounded transition-colors">
                    Join Voice
                </button>
            `;
        }
        
        // Show voice UI elements  
        showVoiceUIElements();
        
        // Reattach the join button handler for the new button
        setTimeout(() => {
            const newJoinBtn = document.getElementById('joinBtn');
            if (newJoinBtn) {
                newJoinBtn.addEventListener('click', function(event) {
                    // Prevent multiple clicks
                    if (newJoinBtn.disabled) return;
                    
                    console.log('Join button clicked after disconnect - starting connection process');
                    
                    // Set loading state
                    newJoinBtn.textContent = 'Connecting...';
                    newJoinBtn.classList.add('opacity-70', 'cursor-not-allowed');
                    newJoinBtn.disabled = true;
                    
                    // Fade out current UI smoothly
                    if (joinUI) {
                        joinUI.style.transition = 'opacity 0.3s ease';
                        joinUI.style.opacity = '0';
                    }
                    
                    // After fade out, show skeleton and start connection
                    setTimeout(() => {
                        // Hide all UI elements
                        hideVoiceUIElements();
                        
                        // Show skeleton loading
                        if (skeletonLoadingView) {
                            skeletonLoadingView.classList.remove('fade-out');
                            skeletonLoadingView.style.opacity = '1';
                            skeletonLoadingView.style.display = 'flex';
                        }
                        
                        console.log('Showing skeleton after disconnect, waiting for voice connection...');
                    }, 300);
                });
            }
        }, 100);
    });
    
    // This function will be called by voice-manager.js when adding participants
    window.renderParticipant = function(participant) {
        if (!participant) return;
        
        const template = document.getElementById('participantTemplate');
        if (!template) return;
        
        const clone = document.importNode(template.content, true);
        
        // Set participant details
        const nameElement = clone.querySelector('.participant-name');
        if (nameElement) nameElement.textContent = participant.displayName || 'User';
        
        // Set avatar initial
        const avatarElement = clone.querySelector('.participant-avatar span');
        if (avatarElement) {
            const initial = participant.displayName ? participant.displayName.charAt(0).toUpperCase() : 'U';
            avatarElement.textContent = initial;
        }
        
        // Add to participants container with animation
        const container = document.getElementById('participants');
        if (container) {
            const participantDiv = document.createElement('div');
            participantDiv.id = `participant-item-${participant.id}`;
            participantDiv.appendChild(clone);
            participantDiv.classList.add('opacity-0', 'transform', 'translate-y-4');
            container.appendChild(participantDiv);
            
            // Trigger animation after a small delay
            setTimeout(() => {
                participantDiv.classList.add('transition-all', 'duration-300', 'ease-in-out');
                participantDiv.classList.remove('opacity-0', 'translate-y-4');
            }, 50);
            
            // Hide empty message if we have participants
            if (emptyVoiceMessage) emptyVoiceMessage.style.display = 'none';
        }
    };
});

// Add IDs to server and channel sidebars for fullscreen mode
document.addEventListener('DOMContentLoaded', function() {
    // Find server sidebar
    const serverSidebar = document.querySelector('#app-container > .flex > .flex.flex-col.bg-discord-dark');
    if (serverSidebar && !serverSidebar.id) {
        serverSidebar.id = 'server-sidebar';
    }
    
    // Find channel sidebar
    const channelSidebar = document.querySelector('#app-container > .flex > .w-60.flex.flex-col.bg-discord-light');
    if (channelSidebar && !channelSidebar.id) {
        channelSidebar.id = 'channel-sidebar';
    }
    
    // Find main content
    const mainContent = document.querySelector('#app-container > .flex > .flex-1');
    if (mainContent && !mainContent.id) {
        mainContent.id = 'main-content';
    }
});
</script>