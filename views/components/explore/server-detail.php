<div id="server-detail-modal" class="fixed inset-0 z-[50000]" style="display: none;">
    <div class="modal-backdrop fixed inset-0 bg-black bg-opacity-90 z-[49999]"></div>
    <div class="modal-container glass-effect rounded-2xl w-full max-w-lg mx-auto my-auto overflow-hidden shadow-2xl relative z-[50001] transform transition-all border border-white/10">
        <button id="close-server-modal" class="absolute top-4 right-4 z-[50002] transition-all">
            <i class="fas fa-times text-lg"></i>
        </button>
        
        <div id="server-modal-content" class="relative modal-content-animate">
            <div id="server-modal-skeleton" class="skeleton-loading" style="display: none;">
                <div class="server-banner h-45 bg-gradient-to-br from-[#5865f2] via-[#7289da] to-[#eb459e] relative overflow-hidden" style="height: 180px;">
                    <div class="misvord-skeleton-shimmer w-full h-full"></div>
                </div>
                
                <div class="px-6 pt-16 pb-6 relative">
                    <div class="server-icon absolute -top-12 left-6">
                        <div class="w-24 h-24 rounded-full bg-[#2f3136] p-1 shadow-2xl border-4 border-[#2f3136] relative overflow-hidden" style="width: 96px; height: 96px; border-radius: 50%">
                            <div class="misvord-skeleton-shimmer w-full h-full rounded-full"></div>
                        </div>
                    </div>
                    
                    <div class="mb-6">
                        <div class="misvord-skeleton-shimmer w-48 h-8 mb-3 rounded"></div>
                        <div class="member-stats flex flex-wrap gap-3">
                            <div class="misvord-skeleton-shimmer w-24 h-5 rounded"></div>
                            <div class="misvord-skeleton-shimmer w-20 h-5 rounded"></div>
                        </div>
                    </div>
                    
                    <div class="server-info-section mb-6">
                        <div class="flex items-center mb-3">
                            <div class="misvord-skeleton-shimmer w-6 h-6 rounded mr-3"></div>
                            <div class="misvord-skeleton-shimmer w-32 h-5 rounded"></div>
                        </div>
                        <div class="misvord-skeleton-shimmer w-full h-4 mb-2 rounded"></div>
                        <div class="misvord-skeleton-shimmer w-3/4 h-4 rounded"></div>
                    </div>
                    
                    <div class="misvord-skeleton-shimmer w-full h-12 rounded-xl"></div>
                </div>
            </div>
            
            <div id="server-modal-actual-content">
                <div class="server-banner h-45 bg-gradient-to-br from-[#5865f2] via-[#7289da] to-[#eb459e] relative overflow-hidden" style="height: 180px;">
                    <img id="server-modal-banner" src="" alt="Server Banner" class="w-full h-full object-cover hidden absolute inset-0" style="z-index: 1;">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" style="z-index: 2;"></div>
                </div>
                
                <div class="px-6 pt-16 pb-6 relative">
                    <div class="server-icon absolute -top-12 left-6">
                        <div class="w-24 h-24 rounded-full bg-[#2f3136] p-1 shadow-2xl border-4 border-[#2f3136] relative overflow-hidden" style="width: 96px; height: 96px; border-radius: 50%">
                            <img id="server-modal-icon" src="" alt="Server Icon" class="w-full h-full object-cover rounded-full hidden" style="border-radius: 50%;">
                            <div id="server-modal-icon-fallback" class="w-full h-full rounded-full bg-gradient-to-br from-[#5865f2] to-purple-600 flex items-center justify-center text-white font-bold text-2xl absolute inset-0" style="border-radius: 50%;">
                                ?
                            </div>
                        </div>
                    </div>
                    
                    <div class="mb-6">
                        <h2 id="server-modal-name" class="text-2xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300"></h2>
                        <div class="member-stats flex flex-wrap gap-3">
                            <div class="stat-item text-[#b9bbbe] flex items-center">
                                <div class="stat-icon">
                                    <i class="fas fa-users text-[#5865f2]"></i>
                                </div>
                                <span class="member-count"></span> members
                            </div>
                        </div>
                    </div>
                    
                    <div class="server-info-section mb-6 hover:shadow-lg transition-all duration-300">
                        <div class="flex items-center mb-3">
                            <i class="fas fa-info-circle mr-3 text-[#5865f2] text-lg"></i>
                            <h3 class="text-white text-base font-semibold">About this server</h3>
                        </div>
                        <p id="server-modal-description" class="leading-relaxed"></p>
                    </div>
                    
                    <div id="server-modal-join-container" class="relative">
                        <div class="absolute -inset-1 bg-gradient-to-r from-[#5865f2]/50 to-[#7289da]/50 rounded-xl blur-lg opacity-70 group-hover:opacity-100 transition duration-300"></div>
                        <button id="server-modal-join" class="relative w-full bg-gradient-to-r from-[#5865f2] to-[#7289da] text-white rounded-xl py-3 font-semibold transition-all text-base flex items-center justify-center gap-2 shadow-lg">
                            <i class="fas fa-right-to-bracket mr-1"></i>
                            Join Server
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
