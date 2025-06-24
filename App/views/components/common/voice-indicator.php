<div id="voice-indicator" class="fixed bottom-4 left-4 z-50 bg-[#1e1f22] text-white rounded-md shadow-lg transform transition-all duration-300 scale-0 opacity-0 cursor-grab active:cursor-grabbing w-60" style="height: 90px;">
    <div class="px-3 py-1">
        <div class="flex items-center justify-between">
            <div class="flex items-center">
                <i class="fas fa-wifi text-[#43b581] mr-2 text-sm"></i>
                <div class="text-sm font-medium text-[#43b581] drag-handle cursor-grab active:cursor-grabbing">Voice Connected</div>
            </div>
            <div class="flex items-center space-x-2">
                <div class="text-white">
                    <i class="fas fa-signal text-sm"></i>
                </div>
                <button class="disconnect-btn w-5 h-5 flex items-center justify-center rounded-full hover:bg-[#36393f]">
                    <i class="fas fa-circle-xmark text-white text-sm"></i>
                </button>
            </div>
        </div>
        <div class="text-sm text-[#B9BBBE] drag-handle cursor-grab active:cursor-grabbing channel-info"></div>
    </div>
    <div class="border-t border-[#2f3136]">
        <div class="flex justify-between px-3 py-1">
            <button class="w-7 h-7 bg-[#2a2b30] rounded-full flex items-center justify-center hover:bg-[#36393f]">
                <i class="fas fa-microphone-slash text-[#B9BBBE] text-sm"></i>
            </button>
            <button class="w-7 h-7 bg-[#2a2b30] rounded-full flex items-center justify-center hover:bg-[#36393f]">
                <i class="fas fa-video text-[#B9BBBE] text-sm"></i>
            </button>
            <button class="w-7 h-7 bg-[#2a2b30] rounded-full flex items-center justify-center hover:bg-[#36393f] relative">
                <i class="fas fa-gamepad text-[#B9BBBE] text-sm"></i>
                <div class="absolute w-2 h-2 bg-white rounded-full top-0 right-0"></div>
            </button>
            <button class="w-7 h-7 bg-[#2a2b30] rounded-full flex items-center justify-center hover:bg-[#36393f]">
                <i class="fas fa-cog text-[#B9BBBE] text-sm"></i>
            </button>
        </div>
    </div>
</div>