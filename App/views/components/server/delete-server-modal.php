<?php if (isset($serverId)): ?>
<div id="delete-server-modal" class="fixed inset-0 flex items-center justify-center hidden z-50">
    <div class="absolute inset-0 bg-black bg-opacity-70"></div>
    
    <div class="bg-discord-dark max-w-md w-full rounded-lg z-10 transform transition-transform duration-200 scale-95">
        <div class="p-6">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold text-white">Server Options</h2>
                <button id="close-delete-modal" class="text-discord-lighter hover:text-white p-1">
                    <i class="fas fa-times h-5 w-5"></i>
                </button>
            </div>
            
            <!-- Transfer Ownership Section -->
            <div class="mb-6 pb-6 border-b border-discord-dark-hover">
                <div class="text-center mb-5">
                    <div class="bg-discord-blurple bg-opacity-10 text-discord-blurple inline-block p-3 rounded-full mb-3">
                        <i class="fas fa-exchange-alt h-8 w-8"></i>
                    </div>
                    
                    <h3 class="text-xl font-semibold text-white mb-2">Transfer Ownership</h3>
                    <p class="text-discord-lighter">Search for a member to transfer the server ownership to.</p>
                </div>
                
                <div class="mb-5">
                    <label for="user-search" class="block text-sm font-medium text-discord-lighter mb-1">SEARCH USER</label>
                    <div class="relative">
                        <input type="text" id="user-search" class="form-input bg-discord-dark-input text-white w-full rounded mb-1 pl-8" placeholder="Search by username...">
                        <div class="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-discord-lighter">
                            <i class="fas fa-search"></i>
                        </div>
                    </div>
                    <div id="users-container" class="bg-discord-dark-hover rounded mt-2 max-h-36 overflow-y-auto hidden">
                        <!-- Users will be populated here -->
                    </div>
                    <!-- Skeleton loading for search results -->
                    <div id="users-loading" class="bg-discord-dark-hover rounded mt-2 max-h-36 overflow-y-auto hidden">
                        <!-- Skeleton loading items -->
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
                    <div class="bg-discord-dark-hover rounded p-2 flex items-center">
                        <div class="w-10 h-10 rounded-full overflow-hidden mr-2 flex-shrink-0" id="selected-user-avatar"></div>
                        <div class="flex-grow">
                            <div class="text-white font-medium" id="selected-user-name"></div>
                            <div class="text-discord-lighter text-xs" id="selected-user-role"></div>
                        </div>
                    </div>
                </div>
                
                <div class="flex justify-end items-center space-x-3">
                    <button id="confirm-transfer" class="px-4 py-2 text-white bg-discord-blurple hover:bg-discord-blurple-hover rounded transition-colors cursor-not-allowed opacity-50" disabled>
                        Transfer Ownership
                    </button>
                </div>
            </div>
            
            <!-- Delete Server Section -->
            <div>
                <div class="text-center mb-5">
                    <div class="bg-discord-red bg-opacity-10 text-discord-red inline-block p-3 rounded-full mb-3">
                        <i class="fas fa-exclamation-triangle h-8 w-8"></i>
                    </div>
                    
                    <h3 class="text-xl font-semibold text-white mb-2">Delete '<span class="server-name-to-confirm"></span>'</h3>
                    <p class="text-discord-lighter mb-2">Are you sure you want to delete <strong class="server-name-to-confirm"></strong>?</p>
                    <p class="text-discord-red text-sm font-medium">This action cannot be undone.</p>
                </div>
                
                <div class="flex justify-end items-center space-x-3">
                    <button id="cancel-delete-server" class="px-4 py-2 text-white bg-discord-dark hover:bg-discord-dark-hover rounded transition-colors">
                        Cancel
                    </button>
                    <button id="confirm-delete-server" class="px-4 py-2 text-white bg-discord-red hover:bg-red-700 rounded transition-colors">
                        Delete Server
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>
<?php endif; ?>




