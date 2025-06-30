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
        
        <div class="space-y-4">
            <button id="joinBtn" class="relative transition-all duration-300 bg-gradient-to-r from-[#8b5cf6]/20 to-[#06b6d4]/20 border border-white/30 text-white font-semibold py-4 px-12 rounded-xl hover:scale-110 cursor-pointer z-50" style="pointer-events: auto;" onclick="joinVoiceChannel()">
                <span class="relative z-10 flex items-center gap-3">
                    <i class="fas fa-microphone text-xl transition-transform group-hover:scale-110"></i>
                    Enter the voice channel
                </span>
            </button>
            
            <button id="ticTacToeBtn" class="relative transition-all duration-300 bg-gradient-to-r from-[#ff6b6b]/20 to-[#4ecdc4]/20 border border-white/20 text-white font-medium py-3 px-10 rounded-xl hover:scale-105 cursor-pointer z-50" style="pointer-events: auto;" onclick="openTicTacToeFromVoice()">
                <span class="relative z-10 flex items-center gap-3">
                    <i class="fas fa-gamepad text-lg transition-transform group-hover:scale-110"></i>
                    Play Tic Mac Voe
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



async function ensureVoiceScriptsLoaded() {
    try {
        if (typeof VideoSDK === 'undefined') {
            console.log('[voice-not-join.php] Loading VideoSDK...');
            await window.loadVoiceScript('https://sdk.videosdk.live/js-sdk/0.2.7/videosdk.js');
        }
        
        if (!window.videoSDKManager) {
            await window.loadVoiceScript('/public/js/components/videosdk/videosdk.js?v=' + Date.now());
        }
        
        if (!window.voiceManager) {
            await window.loadVoiceScript('/public/js/components/voice/voice-manager.js?v=' + Date.now());
        }
        
        if (!window.VoiceSection) {
            await window.loadVoiceScript('/public/js/components/voice/voice-section.js?v=' + Date.now());
        }
        

        
        await new Promise(resolve => {
            const checkReady = () => {
                if (window.voiceManager && window.videoSDKManager && window.VoiceSection) {
                    resolve();
                } else {
                    setTimeout(checkReady, 50);
                }
            };
            checkReady();
        });
        
        if (window.videoSDKManager && !window.videoSDKManager.initialized) {
            console.log('[voice-not-join.php] Initializing VideoSDK...');
            try {
                await window.videoSDKManager.init();
                console.log('[voice-not-join.php] VideoSDK initialized successfully');
            } catch (error) {
                console.error('[voice-not-join.php] Failed to initialize VideoSDK:', error);
                throw error;
            }
        }
        
        return true;
    } catch (error) {
        console.error('[voice-not-join.php] Error loading voice scripts:', error);
        throw error;
    }
}



function resetJoinState() {
    const joinBtn = document.getElementById('joinBtn');
    const joinView = document.getElementById('joinView');
    const connectingView = document.getElementById('connectingView');
    
    if (joinBtn) joinBtn.disabled = false;
    if (joinView) joinView.classList.remove('hidden');
    if (connectingView) connectingView.classList.add('hidden');
}

async function joinVoiceChannel() {
    console.log('[voice-not-join.php] Join voice channel function called');
    
    const joinBtn = document.getElementById('joinBtn');
    const joinView = document.getElementById('joinView');
    const connectingView = document.getElementById('connectingView');
    
    if (joinBtn) joinBtn.disabled = true;
    if (joinView) joinView.classList.add('hidden');
    if (connectingView) connectingView.classList.remove('hidden');
    
    try {
        console.log('[voice-not-join.php] Ensuring voice scripts are loaded...');
        await ensureVoiceScriptsLoaded();
        
        console.log('[voice-not-join.php] Voice scripts loaded, attempting to join...');
        
        if (window.voiceManager) {
            console.log('[voice-not-join.php] Using voiceManager.joinVoice()');
            await window.voiceManager.joinVoice();
            console.log('[voice-not-join.php] Waiting for VideoSDK to be fully ready...');
            await window.waitForVideoSDKReady();
            console.log('[voice-not-join.php] Voice joined and VideoSDK is fully ready');
        } else {
            throw new Error('Voice manager not available');
        }
        
    } catch (error) {
        console.error('[voice-not-join.php] Error joining voice:', error);
        resetJoinState();
        
        if (window.showToast) {
            window.showToast('Failed to join voice channel. Please try again.', 'error');
        }
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
    
    const joinBtn = document.getElementById('joinBtn');
    console.log('[voice-not-join.php] Join button found:', !!joinBtn);
    
    if (joinBtn) {
        joinBtn.addEventListener('click', async function(e) {
            console.log('[voice-not-join.php] Join button clicked');
            e.preventDefault();
            e.stopPropagation();
            try {
                await joinVoiceChannel();
            } catch (error) {
                console.error('[voice-not-join.php] Error in click handler:', error);
            }
        });
    }
    
    console.log('[voice-not-join.php] Dispatching voiceUIReady event to start preloading');
    window.dispatchEvent(new CustomEvent('voiceUIReady'));
});

function openTicTacToeFromVoice() {
    const serverId = document.querySelector('meta[name="server-id"]')?.content;
    const userId = document.querySelector('meta[name="user-id"]')?.content;
    const username = document.querySelector('meta[name="username"]')?.content;
    
    if (!serverId || !userId || !username) {
        if (window.showToast) {
            window.showToast('Missing required information. Please refresh the page.', 'error');
        }
        return;
    }
    
    if (!window.globalSocketManager?.isReady()) {
        if (window.showToast) {
            window.showToast('Connection not ready. Please wait a moment.', 'warning');
        }
        return;
    }
    
    if (window.TicTacToeModal) {
        window.TicTacToeModal.createTicTacToeModal(serverId, userId, username);
    } else if (window.activityManager) {
        window.activityManager.openTicTacToe();
    } else {
        if (window.showToast) {
            window.showToast('Game not available. Please try again later.', 'error');
        }
    }
}
</script>
