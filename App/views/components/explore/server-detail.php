<div id="server-detail-modal" class="fixed inset-0 z-[99999]" style="display: none;">
    <div class="modal-backdrop fixed inset-0 bg-black bg-opacity-80 z-[99998]"></div>
    <div class="modal-container bg-discord-darker rounded-lg w-full max-w-md mx-auto my-auto overflow-hidden shadow-xl relative z-[100000] transform transition-all">
        <button id="close-server-modal" class="absolute top-4 right-4 text-gray-400 hover:text-white z-[100001]">
            <i class="fas fa-times text-xl"></i>
        </button>
        
        <div id="server-modal-content" class="relative">
            <div class="server-banner h-32 bg-gradient-to-r from-discord-primary/90 to-purple-500/90 relative">
                <img id="server-modal-banner" src="" alt="Server Banner" class="w-full h-full object-cover hidden absolute inset-0">
                <div class="absolute inset-0 bg-black/20"></div>
            </div>
            
            <div class="px-6 pt-14 pb-6 relative">
                <div class="server-icon absolute -top-8 left-6">
                    <div class="w-16 h-16 rounded-full bg-discord-dark p-1 shadow-lg">
                        <img id="server-modal-icon" src="" alt="Server Icon" class="w-full h-full object-cover rounded-full hidden">
                        <div id="server-modal-icon-fallback" class="w-full h-full bg-discord-primary rounded-full flex items-center justify-center">
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
                            <i class="fas fa-circle text-discord-green text-[6px] mr-1"></i>
                            <span class="online-count"></span> online
                        </span>
                    </div>
                </div>
                
                <div class="mb-5">
                    <div class="flex items-center mb-2">
                        <h3 class="text-white text-sm font-medium">About this server</h3>
                    </div>
                    <p id="server-modal-description" class="text-gray-300 text-sm"></p>
                </div>
                
                <div id="server-modal-join-container" class="mb-5">
                    <button id="server-modal-join" class="w-full bg-discord-primary hover:bg-discord-primary/90 text-white rounded-md py-2.5 font-medium transition-colors text-sm">
                        Join Server
                    </button>
                </div>
                
                <div>
                    <div class="flex items-center mb-2">
                        <h3 class="text-white text-sm font-medium">Features</h3>
                    </div>
                    <div id="server-modal-features" class="grid grid-cols-2 gap-2"></div>
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
