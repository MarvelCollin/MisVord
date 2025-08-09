<?php
$activeChannel = $GLOBALS['activeChannel'] ?? null;
$channelName = $activeChannel ? (is_array($activeChannel) ? $activeChannel['name'] : $activeChannel->name) : 'Voice Channel';
$channelId = $GLOBALS['activeChannelId'] ?? null;
?>

<style>
@keyframes orbit-clockwise {
    0% { transform: rotate(0deg) translateX(80px) rotate(0deg); }
    100% { transform: rotate(360deg) translateX(80px) rotate(-360deg); }
}

@keyframes orbit-counter {
    0% { transform: rotate(0deg) translateX(120px) rotate(0deg); }
    100% { transform: rotate(-360deg) translateX(120px) rotate(360deg); }
}

@keyframes wander {
    0% { transform: translate(0, 0) scale(1); opacity: 0.8; }
    25% { transform: translate(50px, -30px) scale(1.2); opacity: 0.4; }
    50% { transform: translate(-30px, -60px) scale(0.8); opacity: 1; }
    75% { transform: translate(-60px, 20px) scale(1.1); opacity: 0.6; }
    100% { transform: translate(0, 0) scale(1); opacity: 0.8; }
}

@keyframes drift-diagonal {
    0% { transform: translate(-100vw, 100vh) rotate(0deg); opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { transform: translate(100vw, -100vh) rotate(720deg); opacity: 0; }
}

@keyframes spiral-in {
    0% { transform: rotate(0deg) translateX(200px) scale(0); opacity: 0; }
    50% { opacity: 1; }
    100% { transform: rotate(1080deg) translateX(0px) scale(1); opacity: 0.8; }
}

@keyframes pulse-wave {
    0%, 100% { transform: scale(1); opacity: 0.6; box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
    50% { transform: scale(1.5); opacity: 0.2; box-shadow: 0 0 0 20px rgba(59, 130, 246, 0); }
}

@keyframes float-random {
    0% { transform: translate(0, 0) rotate(0deg); }
    20% { transform: translate(30px, -40px) rotate(72deg); }
    40% { transform: translate(-20px, -80px) rotate(144deg); }
    60% { transform: translate(-50px, -40px) rotate(216deg); }
    80% { transform: translate(-30px, 20px) rotate(288deg); }
    100% { transform: translate(0, 0) rotate(360deg); }
}

@keyframes meteor-shower {
    0% { transform: translate(-50px, -50px) rotate(45deg) scale(0); opacity: 0; }
    10% { transform: translate(0, 0) rotate(45deg) scale(1); opacity: 1; }
    90% { opacity: 1; }
    100% { transform: translate(150vw, 150vh) rotate(45deg) scale(0); opacity: 0; }
}

.animate-orbit-clockwise {
    animation: orbit-clockwise 20s linear infinite;
}

.animate-orbit-counter {
    animation: orbit-counter 25s linear infinite;
}

.animate-wander {
    animation: wander 8s ease-in-out infinite;
}

.animate-drift-diagonal {
    animation: drift-diagonal 12s linear infinite;
}

.animate-spiral-in {
    animation: spiral-in 6s ease-out infinite;
}

.animate-pulse-wave {
    animation: pulse-wave 4s ease-in-out infinite;
}

.animate-float-random {
    animation: float-random 15s ease-in-out infinite;
}

.animate-meteor-shower {
    animation: meteor-shower 8s linear infinite;
}

.star-field {
    position: absolute;
    width: 2px;
    height: 2px;
    background: white;
    border-radius: 50%;
    animation: float-random 10s ease-in-out infinite;
}
</style>

<div id="joinView" class="h-full w-full flex flex-col items-center justify-center bg-gradient-to-b from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] relative overflow-hidden">
    <div class="absolute inset-0">
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div class="absolute w-1 h-1 bg-blue-400 rounded-full animate-orbit-clockwise"></div>
            <div class="absolute w-0.5 h-0.5 bg-purple-400 rounded-full animate-orbit-counter" style="animation-delay: 5s;"></div>
        </div>
        
        <div class="absolute top-[20%] left-[30%] w-1 h-1 bg-cyan-300 rounded-full animate-wander"></div>
        <div class="absolute bottom-[40%] right-[25%] w-0.5 h-0.5 bg-pink-300 rounded-full animate-wander" style="animation-delay: 3s;"></div>
        <div class="absolute top-[60%] left-[60%] w-1 h-1 bg-yellow-300 rounded-full animate-wander" style="animation-delay: 6s;"></div>
        
        <div class="absolute top-0 left-0 w-3 h-0.5 bg-gradient-to-r from-white via-blue-300 to-transparent rounded-full animate-drift-diagonal"></div>
        <div class="absolute top-0 left-0 w-2 h-0.5 bg-gradient-to-r from-purple-300 to-transparent rounded-full animate-drift-diagonal" style="animation-delay: 4s;"></div>
        <div class="absolute top-0 left-0 w-4 h-0.5 bg-gradient-to-r from-cyan-300 to-transparent rounded-full animate-drift-diagonal" style="animation-delay: 8s;"></div>
        
        <div class="absolute top-[30%] right-[20%] w-2 h-2 bg-gradient-radial from-blue-500/60 to-transparent rounded-full animate-spiral-in"></div>
        <div class="absolute bottom-[30%] left-[40%] w-1.5 h-1.5 bg-gradient-radial from-purple-500/50 to-transparent rounded-full animate-spiral-in" style="animation-delay: 2s;"></div>
        
        <div class="absolute top-[40%] left-[20%] w-4 h-4 bg-blue-500/30 rounded-full animate-pulse-wave"></div>
        <div class="absolute bottom-[50%] right-[30%] w-3 h-3 bg-purple-500/40 rounded-full animate-pulse-wave" style="animation-delay: 2s;"></div>
        
        <div class="absolute top-[15%] left-[50%] w-0.5 h-0.5 bg-white rounded-full animate-float-random"></div>
        <div class="absolute top-[70%] left-[15%] w-1 h-1 bg-blue-200 rounded-full animate-float-random" style="animation-delay: 5s;"></div>
        <div class="absolute top-[50%] right-[15%] w-0.5 h-0.5 bg-purple-200 rounded-full animate-float-random" style="animation-delay: 10s;"></div>
        
        <div class="absolute top-0 left-0 w-6 h-1 bg-gradient-to-r from-orange-400 via-yellow-300 to-transparent rounded-full animate-meteor-shower"></div>
        <div class="absolute top-0 left-0 w-5 h-1 bg-gradient-to-r from-blue-400 via-cyan-300 to-transparent rounded-full animate-meteor-shower" style="animation-delay: 6s;"></div>
        <div class="absolute top-0 left-0 w-4 h-1 bg-gradient-to-r from-purple-400 via-pink-300 to-transparent rounded-full animate-meteor-shower" style="animation-delay: 12s;"></div>
    </div>
    
    <div class="relative z-10 text-center space-y-8">
        <h2 class="text-4xl font-bold text-white mb-2 hover:text-blue-300 transition-colors cursor-default">
            <?php echo htmlspecialchars($channelName); ?>
        </h2>
        
        <p class="text-blue-100/90 text-lg">No one is currently in this voice channel</p>
        
        <button id="joinBtn" class="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-4 px-12 rounded-xl hover:scale-105 hover:from-blue-400 hover:to-purple-500 transition-all shadow-lg hover:shadow-blue-500/25">
            <span class="flex items-center gap-3">
                <i class="fas fa-phone-alt text-xl"></i>
                <span>Join Voice Channel</span>
            </span>
        </button>
    </div>
</div>

<div id="connectingView" class="h-full w-full flex items-center justify-center bg-gradient-to-b from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] hidden">
    <div class="text-center">
        <div class="animate-spin rounded-full h-16 w-16 border-2 border-transparent bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4] mb-4"></div>
        <p class="text-white text-xl">Connecting to voice...</p>
    </div>
</div>

<script type="module">
import MusicLoaderStatic from '/public/js/utils/music-loader-static.js';
import '/public/js/components/voice/voice-facade.js';

document.addEventListener('DOMContentLoaded', function() {
    const joinBtn = document.getElementById('joinBtn');
    const joinView = document.getElementById('joinView');
    const connectingView = document.getElementById('connectingView');
    const initialChannelId = '<?php echo htmlspecialchars($channelId ?? ''); ?>';
    const initialChannelName = '<?php echo htmlspecialchars($channelName); ?>';
    
    function createDynamicStars() {
        const container = joinView.querySelector('.absolute.inset-0');
        for (let i = 0; i < 15; i++) {
            const star = document.createElement('div');
            star.className = 'star-field';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.animationDelay = Math.random() * 10 + 's';
            star.style.animationDuration = (8 + Math.random() * 12) + 's';
            container.appendChild(star);
        }
    }
    
    createDynamicStars();
    
    if (joinBtn) {
        joinBtn.addEventListener('click', async function() {
            if (!window.voiceFacade) {
                console.error('Voice system not available');
                return;
            }
            
            MusicLoaderStatic.playCallSound();
            
            joinBtn.disabled = true;
            
            try {
                const metaChannelId = document.querySelector('meta[name="channel-id"]')?.content;
                const currentChannelId = metaChannelId || window.voiceManager?.currentChannelId || initialChannelId;
                const channelEl = document.querySelector(`[data-channel-id="${currentChannelId}"]`);
                const currentChannelName = channelEl?.querySelector('.channel-name')?.textContent?.trim() ||
                                        channelEl?.getAttribute('data-channel-name') ||
                                        initialChannelName;

                await window.voiceFacade.join(currentChannelId, currentChannelName, { skipJoinSound: true });
                
                MusicLoaderStatic.stopCallSound();
                MusicLoaderStatic.playJoinVoiceSound();
                
                joinView.classList.add('hidden');
                connectingView.classList.remove('hidden');
            } catch (error) {
                console.error('Failed to join voice:', error);
                joinBtn.disabled = false;
                
                MusicLoaderStatic.stopCallSound();
                
                if (window.showToast) {
                    window.showToast('Failed to join voice channel', 'error');
                }
            }
        });
    }
    
    window.addEventListener('voiceDisconnect', function() {
        if (joinBtn) joinBtn.disabled = false;
        if (joinView) joinView.classList.remove('hidden');
        if (connectingView) connectingView.classList.add('hidden');
        
        MusicLoaderStatic.stopCallSound();
    });
});
</script>