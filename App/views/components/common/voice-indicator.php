<div id="voice-indicator" class="fixed bottom-4 left-4 z-50 bg-[#1e1f22] text-white rounded-md shadow-lg transform transition-all duration-300 scale-0 opacity-0 cursor-grab active:cursor-grabbing w-56 max-h-32">
    <div class="px-2 py-1">
        <div class="flex items-center justify-between mb-0">
            <div class="flex items-center">
                <i class="fas fa-wifi text-[#43b581] mr-1 text-xs"></i>
                <div class="text-xs font-medium text-[#43b581] drag-handle cursor-grab active:cursor-grabbing">Voice Connected</div>
            </div>
            <div class="flex items-center space-x-1">
                <div class="text-white">
                    <i class="fas fa-signal text-xs"></i>
                </div>
                <button class="disconnect-btn w-4 h-4 flex items-center justify-center rounded-full hover:bg-[#36393f]">
                    <i class="fas fa-circle-xmark text-white text-xs"></i>
                </button>
            </div>
        </div>
        <div class="text-xs text-[#B9BBBE] drag-handle cursor-grab active:cursor-grabbing channel-info mt-0 text-[10px]"></div>
    </div>
    <div class="border-t border-[#2f3136]">
        <div class="flex justify-between px-3 py-1">
            <button class="w-6 h-6 bg-[#2a2b30] rounded-full flex items-center justify-center hover:bg-[#36393f]">
                <i class="fas fa-microphone-slash text-[#B9BBBE] text-xs"></i>
            </button>
            <button class="w-6 h-6 bg-[#2a2b30] rounded-full flex items-center justify-center hover:bg-[#36393f]">
                <i class="fas fa-video text-[#B9BBBE] text-xs"></i>
            </button>
            <button class="w-6 h-6 bg-[#2a2b30] rounded-full flex items-center justify-center hover:bg-[#36393f] relative">
                <i class="fas fa-gamepad text-[#B9BBBE] text-xs"></i>
                <div class="absolute w-1 h-1 bg-white rounded-full top-0.5 right-0.5"></div>
            </button>
            <button class="w-6 h-6 bg-[#2a2b30] rounded-full flex items-center justify-center hover:bg-[#36393f]">
                <i class="fas fa-cog text-[#B9BBBE] text-xs"></i>
            </button>
        </div>
    </div>
</div>