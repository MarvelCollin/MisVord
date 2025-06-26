<?php
$activeChannel = $GLOBALS['activeChannel'] ?? null;
?>

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
