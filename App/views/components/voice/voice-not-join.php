<?php
$activeChannel = $GLOBALS['activeChannel'] ?? null;
$channelName = $activeChannel ? (is_array($activeChannel) ? $activeChannel['name'] : $activeChannel->name) : 'Voice Channel';
$channelId = $GLOBALS['activeChannelId'] ?? null;
?>

<div id="joinView" class="h-full w-full flex flex-col items-center justify-center bg-gradient-to-b from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] relative overflow-hidden">
    <div class="absolute inset-8">
        <div class="absolute top-[10%] left-[15%] w-1 h-1 bg-white rounded-full animate-twinkle-star opacity-80"></div>
        <div class="absolute top-[20%] right-[20%] w-0.5 h-0.5 bg-blue-200 rounded-full animate-twinkle-star-2 opacity-70"></div>
        <div class="absolute bottom-[30%] right-[20%] w-0.5 h-0.5 bg-white rounded-full animate-twinkle-star-3 opacity-85"></div>
    </div>
    
    <div class="relative z-10 text-center space-y-8">
        <h2 class="text-4xl font-bold text-white mb-2">
            <?php echo htmlspecialchars($channelName); ?>
        </h2>
        
        <p class="text-blue-100/90 text-lg">No one is currently in this voice channel</p>
        
        <button id="joinBtn" class="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-4 px-12 rounded-xl hover:scale-105 transition-all">
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

document.addEventListener('DOMContentLoaded', function() {
    const joinBtn = document.getElementById('joinBtn');
    const joinView = document.getElementById('joinView');
    const connectingView = document.getElementById('connectingView');
    const channelId = '<?php echo htmlspecialchars($channelId ?? ''); ?>';
    const channelName = '<?php echo htmlspecialchars($channelName); ?>';
    
    if (joinBtn) {
        joinBtn.addEventListener('click', async function() {
            if (!window.voiceManager) {
                console.error('Voice manager not available');
                return;
            }
            
            MusicLoaderStatic.playCallSound();
            
            joinBtn.disabled = true;
            
            try {
                await window.voiceManager.joinVoice(channelId, channelName, { skipJoinSound: true });
                
                MusicLoaderStatic.stopCallSound();
                MusicLoaderStatic.playJoinVoiceSound();
                
                joinView.classList.add('hidden');
                connectingView.classList.remove('hidden');
                
                window.dispatchEvent(new CustomEvent('voiceConnect', {
                    detail: { channelId, channelName, skipJoinSound: true }
                }));
                
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