<?php
$activeChannel = $GLOBALS['activeChannel'] ?? null;
$currentServer = $GLOBALS['currentServer'] ?? $GLOBALS['server'] ?? null;
$channelName = $activeChannel ? (is_array($activeChannel) ? $activeChannel['name'] : $activeChannel->name) : 'Voice Channel';
?>

<div id="joinView" class="h-full w-full flex flex-col items-center justify-center bg-gradient-to-b from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] relative overflow-hidden" onmousemove="handleMouseMove(event)">
    <div id="interactive-glow" class="absolute w-96 h-96 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.2)_0%,transparent_70%)] blur-2xl opacity-0 transition-all duration-300 pointer-events-none"></div>
    
    <div class="absolute inset-8">
        <div class="absolute top-[10%] left-[15%] w-1 h-1 bg-white rounded-full animate-twinkle-star opacity-80"></div>
        <div class="absolute top-[20%] right-[20%] w-0.5 h-0.5 bg-blue-200 rounded-full animate-twinkle-star-2 opacity-70"></div>
        <div class="absolute top-[35%] left-[25%] w-1.5 h-1.5 bg-purple-200 rounded-full animate-twinkle-star-3 opacity-90"></div>
        <div class="absolute top-[45%] right-[30%] w-0.5 h-0.5 bg-cyan-200 rounded-full animate-twinkle-star opacity-60"></div>
        <div class="absolute bottom-[40%] left-[15%] w-1 h-1 bg-indigo-200 rounded-full animate-twinkle-star-2 opacity-75"></div>
        <div class="absolute bottom-[30%] right-[20%] w-0.5 h-0.5 bg-white rounded-full animate-twinkle-star-3 opacity-85"></div>
        <div class="absolute top-[15%] left-[50%] w-1 h-1 bg-blue-100 rounded-full animate-twinkle-star opacity-70"></div>
        <div class="absolute bottom-[20%] left-[40%] w-0.5 h-0.5 bg-purple-100 rounded-full animate-twinkle-star-2 opacity-65"></div>
        <div class="absolute top-[25%] right-[15%] w-1.5 h-1.5 bg-cyan-100 rounded-full animate-twinkle-star-3 opacity-80"></div>
        <div class="absolute top-[55%] left-[10%] w-0.5 h-0.5 bg-white rounded-full animate-twinkle-star opacity-75"></div>
        <div class="absolute bottom-[15%] right-[25%] w-1 h-1 bg-blue-200 rounded-full animate-twinkle-star-2 opacity-70"></div>
        <div class="absolute top-[8%] left-[60%] w-0.5 h-0.5 bg-indigo-100 rounded-full animate-twinkle-star-3 opacity-60"></div>
    </div>
    
    <div class="absolute top-[25%] left-[15%] w-24 h-24 rounded-full bg-gradient-to-br from-[#8b5cf6]/25 via-[#6366f1]/15 to-transparent animate-cosmic-drift-1 blur-xl"></div>
    <div class="absolute bottom-[35%] right-[12%] w-20 h-20 rounded-full bg-gradient-to-tl from-[#06b6d4]/20 via-[#3b82f6]/12 to-transparent animate-cosmic-drift-2 blur-lg"></div>
    <div class="absolute bottom-[15%] left-[12%] w-16 h-16 rounded-full bg-gradient-to-r from-[#4f46e5]/15 to-transparent animate-cosmic-drift-3 blur-md"></div>
    <div class="absolute top-[12%] right-[18%] w-14 h-14 rounded-full bg-gradient-to-bl from-[#8b5cf6]/12 to-transparent animate-cosmic-drift-4 blur-lg"></div>
    
    <div class="absolute inset-0 bg-gradient-to-t from-[#0a0a0f]/60 via-transparent to-[#0a0a0f]/30"></div>
    
    <div class="absolute inset-0">
        <div class="absolute animate-meteor-1">
            <div class="w-1 h-1 bg-white rounded-full shadow-lg shadow-white/50"></div>
            <div class="absolute inset-0 w-8 h-0.5 bg-gradient-to-r from-white/80 to-transparent transform -translate-y-0.5 blur-sm"></div>
        </div>
        <div class="absolute animate-meteor-2">
            <div class="w-0.5 h-0.5 bg-cyan-200 rounded-full shadow-md shadow-cyan-300/50"></div>
            <div class="absolute inset-0 w-6 h-0.5 bg-gradient-to-r from-cyan-200/60 to-transparent transform -translate-y-0.25 blur-sm"></div>
        </div>
    </div>
    
    <div class="relative z-10 text-center space-y-8 animate-fade-in-cosmic">
        <div class="relative">
            <h2 class="text-4xl font-bold text-white mb-2 drop-shadow-2xl tracking-wide bg-gradient-to-r from-white via-blue-100 via-purple-100 to-cyan-100 bg-clip-text text-transparent animate-cosmic-shimmer">
                <?php echo htmlspecialchars($channelName); ?>
            </h2>
        </div>
        
        <p class="text-blue-100/90 text-lg drop-shadow-lg font-light tracking-wide">No one is currently exploring this space</p>
        
        <div class="">
            <button id="joinBtn" class="relative transition-all duration-300 bg-gradient-to-r from-[#8b5cf6]/20 to-[#06b6d4]/20 border border-white/30 text-white font-semibold py-4 px-12 rounded-xl hover:scale-110 cursor-pointer z-50" style="pointer-events: auto;" onclick="joinVoiceChannel()">
                <span class="relative z-10 flex items-center gap-3">
                    <i class="fas fa-microphone text-xl transition-transform group-hover:scale-110"></i>
                    Enter the voice channel
                </span>
            </button>
        </div>
    </div>
    
    <div class="absolute top-[10%] left-[8%] w-2.5 h-2.5 bg-gradient-to-br from-white to-blue-200 rounded-full animate-distant-star opacity-60 shadow-lg shadow-blue-300/50"></div>
    <div class="absolute top-[30%] right-[10%] w-2 h-2 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full animate-distant-star-2 opacity-70 shadow-md shadow-purple-300/40"></div>
    <div class="absolute bottom-[20%] right-[12%] w-2.5 h-2.5 bg-gradient-to-br from-cyan-200 to-blue-200 rounded-full animate-distant-star-3 opacity-75 shadow-lg shadow-cyan-300/50"></div>
</div>

<div id="connectingView" class="h-full w-full flex flex-col items-center justify-center bg-gradient-to-b from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] hidden relative overflow-hidden">
    <div class="relative z-10 text-center space-y-6">
        <div class="relative">
            <div class="animate-spin rounded-full h-16 w-16 border-2 border-transparent bg-gradient-to-r from-[#8b5cf6] via-[#06b6d4] to-[#6366f1] shadow-2xl shadow-purple-500/30"></div>
            <div class="absolute inset-3 bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] rounded-full"></div>
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-cosmic-scan"></div>
        </div>
        <p class="text-white text-xl font-light tracking-wide drop-shadow-lg animate-pulse-cosmic">Entering the cosmic void...</p>
    </div>
</div>

<script>
console.log('[voice-not-join.php] File loaded');

// Remove the ES6 import that might not work in inline script
// import { playCallSound } from '/public/js/utils/music-loader-static.js';

function handleMouseMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const interactiveGlow = document.getElementById('interactive-glow');
    if (interactiveGlow) {
        interactiveGlow.style.left = (x - 192) + 'px';
        interactiveGlow.style.top = (y - 192) + 'px';
        interactiveGlow.style.opacity = '0.6';
    }
    
    const driftElements = document.querySelectorAll('[class*="animate-cosmic-drift"]');
    driftElements.forEach((element, index) => {
        const speed = (index + 1) * 0.02;
        const moveX = (x - rect.width / 2) * speed;
        const moveY = (y - rect.height / 2) * speed;
        element.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });
}

function joinVoiceChannel() {
    console.log('[voice-not-join.php] Join voice channel function called');
    
    const joinBtn = document.getElementById('joinBtn');
    const joinView = document.getElementById('joinView');
    const connectingView = document.getElementById('connectingView');
    
    console.log('[voice-not-join.php] Elements found:', {
        joinBtn: !!joinBtn,
        joinView: !!joinView,
        connectingView: !!connectingView
    });
    
    if (joinBtn) joinBtn.disabled = true;
    if (joinView) joinView.classList.add('hidden');
    if (connectingView) connectingView.classList.remove('hidden');
    
    // Try to trigger voice join through various methods
    if (window.voiceManager) {
        console.log('[voice-not-join.php] Using voiceManager.joinVoice()');
        window.voiceManager.joinVoice()
            .then(() => {
                // Ensure UI switches to call section
                const channelName = document.querySelector('meta[name="channel-id"]')?.content || 'Voice Channel';
                const meetingId = document.querySelector('meta[name="meeting-id"]')?.content;
                const channelId = document.querySelector('meta[name="channel-id"]')?.content;
                
                if (meetingId) {
                    window.dispatchEvent(new CustomEvent('voiceConnect', {
                        detail: {
                            channelName: channelName,
                            meetingId: meetingId,
                            channelId: channelId
                        }
                    }));
                }
            })
            .catch(error => {
                console.error('[voice-not-join.php] Error joining voice:', error);
                if (joinBtn) joinBtn.disabled = false;
                if (joinView) joinView.classList.remove('hidden');
                if (connectingView) connectingView.classList.add('hidden');
            });
    } else if (window.channelSwitchManager && window.channelSwitchManager.loadVoiceScripts) {
        console.log('[voice-not-join.php] Using channelSwitchManager.loadVoiceScripts()');
        window.channelSwitchManager.loadVoiceScripts().then(() => {
            if (window.voiceManager) {
                console.log('[voice-not-join.php] voiceManager loaded, joining voice');
                window.voiceManager.joinVoice()
                    .then(() => {
                        // Ensure UI switches to call section
                        const channelName = document.querySelector('meta[name="channel-id"]')?.content || 'Voice Channel';
                        const meetingId = document.querySelector('meta[name="meeting-id"]')?.content;
                        const channelId = document.querySelector('meta[name="channel-id"]')?.content;
                        
                        if (meetingId) {
                            window.dispatchEvent(new CustomEvent('voiceConnect', {
                                detail: {
                                    channelName: channelName,
                                    meetingId: meetingId,
                                    channelId: channelId
                                }
                            }));
                        }
                    });
            }
        });
    } else if (window.voiceSection && window.voiceSection.autoJoin) {
        console.log('[voice-not-join.php] Using voiceSection.autoJoin()');
        window.voiceSection.autoJoin();
        // The voiceSection.autoJoin will trigger the voiceConnect event
    } else if (window.triggerVoiceAutoJoin) {
        console.log('[voice-not-join.php] Using triggerVoiceAutoJoin()');
        window.triggerVoiceAutoJoin();
        // These functions should trigger the voiceConnect event
    } else if (window.handleAutoJoin) {
        console.log('[voice-not-join.php] Using handleAutoJoin()');
        window.handleAutoJoin();
        // These functions should trigger the voiceConnect event
    } else {
        console.log('[voice-not-join.php] No voice join method found');
        // Reset UI if no method is available
        if (joinBtn) joinBtn.disabled = false;
        if (joinView) joinView.classList.remove('hidden');
        if (connectingView) connectingView.classList.add('hidden');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('[voice-not-join.php] DOM content loaded');
    const joinView = document.getElementById('joinView');
    if (joinView) {
        joinView.addEventListener('mouseleave', function() {
            const interactiveGlow = document.getElementById('interactive-glow');
            if (interactiveGlow) {
                interactiveGlow.style.opacity = '0';
            }
            
            const driftElements = document.querySelectorAll('[class*="animate-cosmic-drift"]');
            driftElements.forEach(element => {
                element.style.transform = '';
            });
        });
    }
    
    // Ensure join button is clickable
    const joinBtn = document.getElementById('joinBtn');
    console.log('[voice-not-join.php] Join button found:', !!joinBtn);
    if (joinBtn) {
        console.log('[voice-not-join.php] Join button HTML:', joinBtn.outerHTML);
        joinBtn.addEventListener('click', function(e) {
            console.log('[voice-not-join.php] Join button clicked via addEventListener');
            joinVoiceChannel();
        });
    }
    
    // Add global click handler
    document.body.addEventListener('click', function(e) {
        console.log('[voice-not-join.php] Document body click detected on:', e.target.tagName, e.target.id, e.target.className);
        
        // Check if click was on or inside join button
        const clickedJoinBtn = e.target.id === 'joinBtn' || e.target.closest('#joinBtn');
        if (clickedJoinBtn) {
            console.log('[voice-not-join.php] Join button clicked via document body handler');
            e.stopPropagation();
            joinVoiceChannel();
        }
    }, true);
    
    // Dispatch event to start preloading VideoSDK resources
    console.log('[voice-not-join.php] Dispatching voiceUIReady event to start preloading');
    window.dispatchEvent(new CustomEvent('voiceUIReady'));
});
</script>

<style>
@keyframes twinkle-star {
    0%, 100% {
        opacity: 0.3;
        transform: scale(1);
        box-shadow: 0 0 6px currentColor;
    }
    50% {
        opacity: 1;
        transform: scale(1.5);
        box-shadow: 0 0 12px currentColor, 0 0 20px currentColor;
    }
}

@keyframes twinkle-star-2 {
    0%, 100% {
        opacity: 0.4;
        transform: scale(1) rotate(0deg);
        box-shadow: 0 0 4px currentColor;
    }
    50% {
        opacity: 0.9;
        transform: scale(1.3) rotate(180deg);
        box-shadow: 0 0 8px currentColor, 0 0 16px currentColor;
    }
}

@keyframes twinkle-star-3 {
    0%, 100% {
        opacity: 0.5;
        transform: scale(1);
        box-shadow: 0 0 8px currentColor;
    }
    50% {
        opacity: 1;
        transform: scale(1.4);
        box-shadow: 0 0 16px currentColor, 0 0 24px currentColor;
    }
}

@keyframes cosmic-drift-1 {
    0%, 100% {
        transform: translate(0, 0) rotate(0deg) scale(1);
        opacity: 0.25;
    }
    25% {
        transform: translate(8px, -12px) rotate(90deg) scale(1.05);
        opacity: 0.15;
    }
    50% {
        transform: translate(-4px, -8px) rotate(180deg) scale(0.95);
        opacity: 0.3;
    }
    75% {
        transform: translate(-8px, 6px) rotate(270deg) scale(1.02);
        opacity: 0.2;
    }
}

@keyframes cosmic-drift-2 {
    0%, 100% {
        transform: translate(0, 0) rotate(0deg) scale(1);
        opacity: 0.2;
    }
    33% {
        transform: translate(-12px, 8px) rotate(120deg) scale(1.08);
        opacity: 0.28;
    }
    66% {
        transform: translate(6px, -6px) rotate(240deg) scale(0.92);
        opacity: 0.15;
    }
}

@keyframes cosmic-drift-3 {
    0%, 100% {
        transform: translate(0, 0) scale(1);
        opacity: 0.15;
    }
    50% {
        transform: translate(10px, -12px) scale(1.1);
        opacity: 0.25;
    }
}

@keyframes cosmic-drift-4 {
    0%, 100% {
        transform: translate(0, 0) rotate(0deg);
        opacity: 0.12;
    }
    50% {
        transform: translate(-10px, 12px) rotate(-180deg);
        opacity: 0.2;
    }
}

@keyframes meteor-1 {
    0% {
        top: -20px;
        left: 100%;
        opacity: 0;
    }
    10% {
        opacity: 1;
    }
    90% {
        opacity: 1;
    }
    100% {
        top: 100vh;
        left: -100px;
        opacity: 0;
    }
}

@keyframes meteor-2 {
    0% {
        top: -20px;
        right: 100%;
        opacity: 0;
    }
    15% {
        opacity: 1;
    }
    85% {
        opacity: 1;
    }
    100% {
        top: 100vh;
        right: -100px;
        opacity: 0;
    }
}

@keyframes fade-in-cosmic {
    0% {
        opacity: 0;
        transform: translateY(50px) scale(0.9);
    }
    100% {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

@keyframes cosmic-shimmer {
    0%, 100% {
        background-position: 0% 50%;
    }
    50% {
        background-position: 100% 50%;
    }
}



@keyframes distant-star {
    0%, 100% {
        opacity: 0.6;
        transform: scale(1);
    }
    50% {
        opacity: 1;
        transform: scale(1.2);
    }
}

@keyframes distant-star-2 {
    0%, 100% {
        opacity: 0.7;
        transform: scale(1) rotate(0deg);
    }
    50% {
        opacity: 1;
        transform: scale(1.1) rotate(180deg);
    }
}

@keyframes distant-star-3 {
    0%, 100% {
        opacity: 0.75;
        transform: scale(1);
    }
    50% {
        opacity: 1;
        transform: scale(1.15);
    }
}

@keyframes cosmic-scan {
    0% {
        transform: translateX(-100%);
        opacity: 0;
    }
    50% {
        opacity: 1;
    }
    100% {
        transform: translateX(100%);
        opacity: 0;
    }
}

@keyframes pulse-cosmic {
    0%, 100% {
        opacity: 0.8;
    }
    50% {
        opacity: 1;
    }
}

.animate-twinkle-star {
    animation: twinkle-star 3s ease-in-out infinite;
}

.animate-twinkle-star-2 {
    animation: twinkle-star-2 4s ease-in-out infinite 1s;
}

.animate-twinkle-star-3 {
    animation: twinkle-star-3 3.5s ease-in-out infinite 2s;
}

.animate-cosmic-drift-1 {
    animation: cosmic-drift-1 30s ease-in-out infinite;
    transition: transform 0.3s ease-out;
}

.animate-cosmic-drift-2 {
    animation: cosmic-drift-2 25s ease-in-out infinite 8s;
    transition: transform 0.3s ease-out;
}

.animate-cosmic-drift-3 {
    animation: cosmic-drift-3 35s ease-in-out infinite 15s;
    transition: transform 0.3s ease-out;
}

.animate-cosmic-drift-4 {
    animation: cosmic-drift-4 28s ease-in-out infinite 3s;
    transition: transform 0.3s ease-out;
}

.animate-meteor-1 {
    animation: meteor-1 8s linear infinite 3s;
}

.animate-meteor-2 {
    animation: meteor-2 12s linear infinite 7s;
}

.animate-fade-in-cosmic {
    animation: fade-in-cosmic 1.5s ease-out;
}

.animate-cosmic-shimmer {
    background-size: 400% 400%;
    animation: cosmic-shimmer 4s ease-in-out infinite;
}



.animate-distant-star {
    animation: distant-star 5s ease-in-out infinite;
}

.animate-distant-star-2 {
    animation: distant-star-2 6s ease-in-out infinite 2s;
}

.animate-distant-star-3 {
    animation: distant-star-3 4.5s ease-in-out infinite 1s;
}

.animate-cosmic-scan {
    animation: cosmic-scan 3s ease-in-out infinite;
}

.animate-pulse-cosmic {
    animation: pulse-cosmic 2s ease-in-out infinite;
}
</style>
