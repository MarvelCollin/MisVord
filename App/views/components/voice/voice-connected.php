<?php
$userName = $_SESSION['username'] ?? 'Anonymous';
$activeChannel = $GLOBALS['activeChannel'] ?? null;
?>

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

<div id="voiceControls" class="hidden">
    <?php include __DIR__ . '/voice-tool.php'; ?>
</div>

