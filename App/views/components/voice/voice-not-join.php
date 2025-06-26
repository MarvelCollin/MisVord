<?php
$activeChannel = $GLOBALS['activeChannel'] ?? null;
?>

<div id="joinView" class="flex-1 flex flex-col items-center justify-center bg-[#313338] relative overflow-hidden">
    <div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-br from-[#5865F2]/30 via-[#7289DA]/20 to-[#4752c4]/10 animate-pulse-breathing"></div>
    
    <h2 class="text-2xl font-bold text-white mb-2 relative z-10"><?php echo htmlspecialchars($activeChannel->name ?? 'Voice Channel'); ?></h2>
    <p class="text-gray-300 text-base mb-6 relative z-10">No one is currently in voice</p>
    
    <button id="joinBtn" class="bg-[#5865F2] hover:bg-[#4752c4] text-white font-medium py-2 px-6 rounded transition-colors relative z-10">
        Join Voice
    </button>
</div>

<div id="connectingView" class="flex-1 flex flex-col items-center justify-center bg-[#2b2d31] hidden">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5865F2] mb-4"></div>
    <p class="text-white text-lg">Connecting to voice...</p>
</div>

<style>
@keyframes pulse-breathing {
    0%, 100% {
        transform: translateX(-50%) translateY(50%) scale(0.8);
        opacity: 0.6;
    }
    50% {
        transform: translateX(-50%) translateY(50%) scale(1.2);
        opacity: 0.8;
    }
}

.animate-pulse-breathing {
    animation: pulse-breathing 4s ease-in-out infinite;
}
</style>
