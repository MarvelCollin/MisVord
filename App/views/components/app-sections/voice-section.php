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
?>

<link rel="stylesheet" href="/public/css/voice-section.css">

<script>
document.addEventListener('DOMContentLoaded', function() {
    localStorage.setItem('onVoiceChannelPage', 'true');
    
    setTimeout(function() {
        const joinBtn = document.getElementById('joinBtn');
        if (joinBtn) {
            console.log('Auto-joining voice channel from voice-section.php');
            joinBtn.click();
        }
    }, 1000);
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
            
            <!-- Join UI component (hidden initially) -->
            <div id="joinUI" class="flex-1 flex flex-col items-center justify-center z-10 hidden voice-ui-element bg-gradient-to-b from-[#1e1f3a] via-[#2b2272] to-[#1e203a]">
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

    <!-- Connection toast notification -->
    <div id="connectionToast" class="fixed bottom-5 right-5 bg-[#36393f] border-l-4 border-[#3ba55c] rounded shadow-lg px-4 py-3 z-50 flex items-center transform translate-x-full transition-transform duration-300">
        <div class="flex items-center">
            <div class="flex-shrink-0 mr-3">
                <i class="fas fa-check-circle text-[#3ba55c] text-xl"></i>
            </div>
            <div>
                <p class="font-medium text-white text-sm">Connected to voice</p>
                <p class="text-gray-300 text-xs"><?php echo htmlspecialchars($activeChannel['name'] ?? 'Voice Channel'); ?></p>
            </div>
        </div>
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
    const connectionToast = document.getElementById('connectionToast');
    
    // Function to show voice UI elements with animation
    function showVoiceUIElements() {
        // Hide skeleton header
        if (skeletonHeader) skeletonHeader.style.display = 'none';
        
        // Show all voice UI elements with staggered animation
        voiceUIElements.forEach((element, index) => {
            setTimeout(() => {
                element.classList.remove('hidden');
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
        });
    }
    
    // Function to show connection toast
    function showConnectionToast() {
        if (!connectionToast) return;
        
        // Show toast
        connectionToast.classList.remove('translate-x-full');
        
        // Hide after 5 seconds
        setTimeout(() => {
            connectionToast.classList.add('translate-x-full');
        }, 5000);
    }
    
    // Initial state: hide all UI elements, show only skeleton loading
    hideVoiceUIElements();
    if (skeletonLoadingView) skeletonLoadingView.style.display = 'flex';
    
    // After a short delay, check if there's a voice session already or show join UI
    setTimeout(() => {
        const isVoiceActive = localStorage.getItem('voiceActive') === 'true';
        
        if (isVoiceActive) {
            // If voice is active, trigger connect event
            window.dispatchEvent(new Event('voiceConnect'));
        } else {
            // Not connected, show join UI and header
            if (skeletonLoadingView) skeletonLoadingView.style.display = 'none';
            showVoiceUIElements();
            if (discordVoiceView) discordVoiceView.style.display = 'none';
            if (joinUI) joinUI.style.display = 'flex';
            if (voiceControlsContainer) voiceControlsContainer.style.display = 'none';
        }
    }, 1500);
    
    // Listen for join button clicks
    const joinBtn = document.getElementById('joinBtn');
    if (joinBtn) {
        joinBtn.addEventListener('click', function() {
            // Set loading state
            joinBtn.textContent = 'Connecting...';
            joinBtn.classList.add('opacity-70', 'cursor-not-allowed');
            
            // Hide all UI, show skeleton loading while connecting
            hideVoiceUIElements();
            if (skeletonLoadingView) skeletonLoadingView.style.display = 'flex';
            
            // Mark voice as active
            localStorage.setItem('voiceActive', 'true');
        });
    }
    
    // Listen for connection events
    window.addEventListener('voiceConnect', function(event) {
        // Hide skeleton, show proper Discord voice UI with animation
        if (skeletonLoadingView) {
            // Add fade out animation to skeleton
            skeletonLoadingView.classList.add('fade-out');
            
            // After fade out completes, hide skeleton and show UI
            setTimeout(() => {
                skeletonLoadingView.style.display = 'none';
                showVoiceUIElements();
                
                // Show voice view, hide join UI
                if (joinUI) joinUI.style.display = 'none';
                if (discordVoiceView) discordVoiceView.style.display = 'flex';
                
                // Show the connection toast
                showConnectionToast();
                
                // After a delay, check if there are any participants
                setTimeout(() => {
                    const hasParticipants = document.getElementById('participants').children.length > 0;
                    
                    // Show empty message if no participants
                    if (!hasParticipants && emptyVoiceMessage) {
                        emptyVoiceMessage.style.display = 'flex';
                    }
                }, 1000);
            }, 300); // Match the fade-out animation duration
        } else {
            // Fallback if skeleton view is not present
            showVoiceUIElements();
            if (joinUI) joinUI.style.display = 'none';
            if (discordVoiceView) discordVoiceView.style.display = 'flex';
            showConnectionToast();
        }
        
        // Remove gradient background when connected
        if (mainContent) {
            mainContent.style.background = '#2b2d31';
        }
    });
    
    window.addEventListener('voiceDisconnect', function(event) {
        // Reset to join UI state
        if (skeletonLoadingView) skeletonLoadingView.style.display = 'none';
        showVoiceUIElements();
        
        if (discordVoiceView) discordVoiceView.style.display = 'none';
        if (joinUI) joinUI.style.display = 'flex';
        if (voiceControlsContainer) voiceControlsContainer.style.display = 'none';
        
        // Mark voice as inactive
        localStorage.setItem('voiceActive', 'false');
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