<div id="server-detail-modal" class="fixed inset-0 z-[99999]" style="display: none;">
    <div class="modal-backdrop fixed inset-0 bg-black bg-opacity-80 z-[99998]"></div>
    <div class="modal-container bg-[#2f3136] rounded-lg w-full max-w-md mx-auto my-auto overflow-hidden shadow-2xl relative z-[100000] transform transition-all border border-[#202225]">
        <button id="close-server-modal" class="absolute top-4 right-4 text-gray-400 hover:text-white z-[100001] transition-colors">
            <i class="fas fa-times text-xl"></i>
        </button>
        
        <div id="server-modal-content" class="relative">
            <div class="server-banner h-32 bg-gradient-to-r from-[#5865f2]/90 to-[#7289da]/90 relative">
                <img id="server-modal-banner" src="" alt="Server Banner" class="w-full h-full object-cover hidden absolute inset-0">
                <div class="absolute inset-0 bg-black/20"></div>
            </div>
            
            <div class="px-6 pt-14 pb-6 relative">
                <div class="server-icon absolute -top-8 left-6">
                    <div class="w-16 h-16 rounded-2xl bg-[#2f3136] p-1 shadow-lg border-4 border-[#2f3136]">
                        <img id="server-modal-icon" src="" alt="Server Icon" class="w-full h-full object-cover rounded-xl hidden">
                        <div id="server-modal-icon-fallback" class="w-full h-full bg-[#5865f2] rounded-xl flex items-center justify-center">
                            <span class="text-white font-bold text-2xl"></span>
                        </div>
                    </div>
                </div>
                
                <div class="flex flex-col mb-5">
                    <h2 id="server-modal-name" class="text-xl font-bold text-white"></h2>
                    <div class="flex items-center mt-1 text-gray-400">
                        <span id="server-modal-members" class="flex items-center text-xs">
                            <i class="fas fa-users mr-1"></i>
                            <span class="member-count"></span> members
                        </span>
                        <span class="mx-2 text-xs">•</span>
                        <span id="server-modal-online" class="flex items-center text-xs">
                            <i class="fas fa-circle text-[#3ba55d] text-[6px] mr-1"></i>
                            <span class="online-count"></span> online
                        </span>
                    </div>
                </div>
                
                <div class="mb-6 bg-[#36393f] p-3 rounded-md">
                    <div class="flex items-center mb-2">
                        <i class="fas fa-info-circle mr-2 text-[#b9bbbe]"></i>
                        <h3 class="text-white text-sm font-medium">About this server</h3>
                    </div>
                    <p id="server-modal-description" class="text-[#b9bbbe] text-sm leading-relaxed"></p>
                </div>
                
                <div id="server-modal-join-container">
                    <button id="server-modal-join" class="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-md py-3 font-medium transition-colors text-sm flex items-center justify-center">
                        <i class="fas fa-right-to-bracket mr-2"></i>
                        Join Server
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('server-detail-modal');
    const closeBtn = document.getElementById('close-server-modal');
    
    if (closeBtn && modal) {
        closeBtn.addEventListener('click', function() {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            setTimeout(() => {
                modal.style.display = 'none';
            }, 200);
        });
    }
});
</script>
