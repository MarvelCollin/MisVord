<?php if (isset($serverId)): ?>
<style>
    @keyframes pulse-once {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    .animate-pulse-once {
        animation: pulse-once 0.6s ease-in-out;
    }
</style>
<div id="delete-server-modal" class="fixed inset-0 flex items-center justify-center hidden z-50 px-4">
    <div class="absolute inset-0 bg-black bg-opacity-70"></div>
    
    <div class="bg-discord-dark max-w-md w-full rounded-lg z-10 transform transition-transform duration-200 scale-95 sm:max-w-sm sm:mx-4">
        <div class="p-6 sm:p-4">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold text-white sm:text-lg">Server Options</h2>
                <button id="close-delete-modal" class="text-discord-lighter hover:text-white p-1">
                    <i class="fas fa-times h-5 w-5"></i>
                </button>
            </div>
            
            
            <div class="mb-6 pb-6 border-b border-discord-dark-hover sm:mb-4 sm:pb-4">
                <div class="text-center mb-5 sm:mb-4">
                    <div class="bg-discord-blurple bg-opacity-10 text-discord-blurple inline-block p-3 rounded-full mb-3 sm:p-2 sm:mb-2">
                        <i class="fas fa-exchange-alt h-8 w-8 sm:h-6 sm:w-6"></i>
                    </div>
                    
                    <h3 class="text-xl font-semibold text-white mb-2 sm:text-lg sm:mb-1">Transfer Ownership</h3>
                    <p class="text-discord-lighter sm:text-sm">Search for a member to transfer the server ownership to.</p>
                </div>
                
                <div class="mb-5 sm:mb-4">
                    <label for="user-search" class="block text-sm font-medium text-discord-lighter mb-1">SEARCH USER</label>
                    <div class="relative">
                        <input type="text" id="user-search" class="form-input bg-discord-dark-input text-white w-full rounded mb-1 pl-8 sm:text-base" placeholder="Search by username...">
                        <div class="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-discord-lighter">
                            <i class="fas fa-search"></i>
                        </div>
                    </div>
                    <div id="users-container" class="bg-discord-dark-hover rounded mt-2 max-h-36 overflow-y-auto hidden">
                        
                    </div>
                    
                    <div id="users-loading" class="bg-discord-dark-hover rounded mt-2 max-h-36 overflow-y-auto hidden">
                        
                        <div class="p-2 flex items-center animate-pulse">
                            <div class="w-8 h-8 rounded-full bg-discord-dark-input mr-2 flex-shrink-0"></div>
                            <div class="flex-grow">
                                <div class="h-4 bg-discord-dark-input rounded w-3/4 mb-1"></div>
                                <div class="h-3 bg-discord-dark-input rounded w-1/2"></div>
                            </div>
                        </div>
                        <div class="p-2 flex items-center animate-pulse">
                            <div class="w-8 h-8 rounded-full bg-discord-dark-input mr-2 flex-shrink-0"></div>
                            <div class="flex-grow">
                                <div class="h-4 bg-discord-dark-input rounded w-2/3 mb-1"></div>
                                <div class="h-3 bg-discord-dark-input rounded w-1/3"></div>
                            </div>
                        </div>
                        <div class="p-2 flex items-center animate-pulse">
                            <div class="w-8 h-8 rounded-full bg-discord-dark-input mr-2 flex-shrink-0"></div>
                            <div class="flex-grow">
                                <div class="h-4 bg-discord-dark-input rounded w-1/2 mb-1"></div>
                                <div class="h-3 bg-discord-dark-input rounded w-1/4"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div id="selected-user-container" class="mb-5 hidden">
                    <label class="block text-sm font-medium text-discord-lighter mb-1">SELECTED USER</label>
                    <div class="bg-discord-dark-hover rounded p-3 flex items-center border border-discord-dark-input">
                        <div class="w-12 h-12 rounded-full overflow-hidden mr-3 flex-shrink-0" id="selected-user-avatar"></div>
                        <div class="flex-grow">
                            <div class="flex items-center mb-1">
                                <div class="text-white font-medium text-lg mr-2" id="selected-user-name"></div>
                                <div id="selected-user-role-badge" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold"></div>
                            </div>
                            <div class="text-discord-lighter text-sm flex items-center">
                                <span class="w-2 h-2 rounded-full mr-1.5" id="selected-user-status-indicator"></span>
                                <span id="selected-user-status">offline</span>
                            </div>
                        </div>
                    </div>
                    <div class="mt-3 text-sm text-discord-lighter">
                        <i class="fas fa-info-circle mr-1"></i>
                        This user will become the new owner of the server.
                    </div>
                </div>
                
                <div class="flex justify-end items-center space-x-3 sm:flex-col sm:space-x-0 sm:space-y-2">
                    <button id="confirm-transfer" class="px-4 py-2 text-white bg-discord-blurple hover:bg-discord-blurple-hover rounded transition-colors cursor-not-allowed opacity-50 sm:w-full sm:order-2">
                        Transfer Ownership
                    </button>
                </div>
            </div>
            
            
            <div>
                <div class="text-center mb-5 sm:mb-4">
                    <div class="bg-discord-red bg-opacity-10 text-discord-red inline-block p-3 rounded-full mb-3 sm:p-2 sm:mb-2">
                        <i class="fas fa-exclamation-triangle h-8 w-8 sm:h-6 sm:w-6"></i>
                    </div>
                    
                    <h3 class="text-xl font-semibold text-white mb-2 sm:text-lg sm:mb-1">Delete '<span class="server-name-to-confirm"></span>'</h3>
                    <p class="text-discord-lighter mb-2 sm:text-sm sm:mb-1">Are you sure you want to delete <strong class="server-name-to-confirm"></strong>?</p>
                    <p class="text-discord-red text-sm font-medium sm:text-xs">This action cannot be undone.</p>
                </div>
                
                <div class="flex justify-end items-center space-x-3 sm:flex-col sm:space-x-0 sm:space-y-2">
                    <button id="cancel-delete-server" class="px-4 py-2 text-white bg-discord-dark hover:bg-discord-dark-hover rounded transition-colors sm:w-full sm:order-1">
                        Cancel
                    </button>
                    <button id="confirm-delete-server" class="px-4 py-2 text-white bg-discord-red hover:bg-red-700 rounded transition-colors sm:w-full sm:order-2">
                        Delete Server
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>
<?php endif; ?>




