<?php
require_once __DIR__ . '/wifi-tooltip.php';
?>

<div id="voice-indicator" class="voice-ind-container fixed bottom-4 left-4 z-50 bg-[#1e1f22] max-h-[60px] text-white rounded-lg shadow-lg transform transition-all duration-300 scale-0 opacity-0 cursor-grab active:cursor-grabbing">
    <div class="voice-ind-header px-3 py-2">
        <div class="voice-ind-main flex items-center justify-between gap-2">
            <div class="voice-ind-info flex items-center gap-2 drag-handle cursor-grab active:cursor-grabbing">
                <i class="fas fa-volume-up text-[#3ba55c] text-sm pulse-icon"></i>
                <div class="voice-ind-titles flex flex-col">
                    <div class="voice-ind-title text-sm font-medium text-white">Voice Connected</div>
                    <div class="voice-ind-details text-[11px] text-[#a3a6aa] flex items-center">
                        <span class="channel-name">k...</span>
                        <span class="mx-1">/</span>
                        <span class="connection-duration">00-05</span>
                    </div>
                </div>
            </div>
            <div class="voice-ind-actions flex items-center gap-3">
                <div class="voice-ind-signal flex items-center gap-[2px]">
                    <div class="h-2.5 w-[3px] bg-[#3ba55c] rounded-sm"></div>
                    <div class="h-3.5 w-[3px] bg-[#3ba55c] rounded-sm"></div>
                    <div class="h-4.5 w-[3px] bg-[#3ba55c] rounded-sm"></div>
                </div>
                <button class="disconnect-btn w-6 h-6 flex items-center justify-center rounded hover:bg-[#2c2e33] transition-all">
                    <i class="fas fa-phone-slash text-[#ed4245] text-xs hover:text-[#fc5054] transition-colors"></i>
                </button>
            </div>
        </div>
    </div>
    
    <div class="voice-ind-controls border-t border-[#2f3136] bg-[#232428] px-3 py-2 flex justify-between rounded-b-lg">
        <button class="mic-btn voice-ind-btn w-9 h-8 bg-[#232428] hover:bg-[#2c2e33] rounded-md flex items-center justify-center transition-all" title="Mute">
            <i class="fas fa-microphone text-[#b9bbbe] hover:text-white text-lg transition-colors"></i>
        </button>
        
        <button class="screen-btn voice-ind-btn w-9 h-8 bg-[#232428] hover:bg-[#2c2e33] rounded-md flex items-center justify-center transition-all" title="Share Your Screen">
            <i class="fas fa-desktop text-[#b9bbbe] hover:text-white text-lg transition-colors"></i>
        </button>
        
        <button class="deafen-btn voice-ind-btn w-9 h-8 bg-[#232428] hover:bg-[#2c2e33] rounded-md flex items-center justify-center transition-all" title="Deafen">
            <i class="fas fa-headphones text-[#b9bbbe] hover:text-white text-lg transition-colors"></i>
        </button>
        
        <button class="voice-ind-btn w-9 h-8 bg-[#232428] hover:bg-[#2c2e33] rounded-md flex items-center justify-center transition-all" title="Voice Settings">
            <i class="fas fa-cog text-[#b9bbbe] hover:text-white text-lg transition-colors"></i>
        </button>
    </div>
</div>