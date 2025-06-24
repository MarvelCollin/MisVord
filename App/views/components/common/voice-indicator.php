<?php
require_once __DIR__ . '/wifi-tooltip.php';
?>

<div id="voice-indicator" class="fixed bottom-4 left-4 z-50 bg-[#1e1f22] text-white rounded-md shadow-lg transform transition-all duration-300 scale-0 opacity-0 cursor-grab active:cursor-grabbing" style="width: 280px; height: 44px;">
    <div class="h-full flex items-center px-3">
        <!-- Left section: Connection status -->
        <div class="flex items-center space-x-2 drag-handle cursor-grab active:cursor-grabbing">
            <?php echo wifi_icon_with_tooltip('text-[#23a559] text-sm'); ?>
            <div class="text-sm font-medium text-[#23a559]">Voice Connected</div>
        </div>
        
        <!-- Right section: Controls & User info -->
        <div class="flex items-center justify-end ml-auto">
            <!-- User and timer -->
            <div class="flex items-center pr-2 mr-2 border-r border-[#2f3136] drag-handle cursor-grab active:cursor-grabbing">
                <span class="text-white text-sm font-medium channel-name">kolin</span>
                <span class="mx-1 text-[#b5bac1] text-xs">•</span>
                <span class="text-[#b5bac1] text-sm connection-duration">0:00</span>
            </div>
            
            <!-- Controls -->
            <div class="flex items-center space-x-2">
                <div class="text-gray-300">
                    <i class="fas fa-signal text-xs"></i>
                </div>
                <button class="disconnect-btn w-5 h-5 flex items-center justify-center rounded-full hover:bg-[#36393f]">
                    <i class="fas fa-times text-gray-300 text-xs"></i>
                </button>
            </div>
        </div>
    </div>
</div>