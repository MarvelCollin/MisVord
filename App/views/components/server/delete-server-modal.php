<?php if (isset($serverId)): ?>
<div id="delete-server-modal" class="fixed inset-0 flex items-center justify-center hidden z-50">
    <div class="absolute inset-0 bg-black bg-opacity-70"></div>
    
    <div class="bg-discord-dark max-w-md w-full rounded-lg z-10 transform transition-transform duration-200 scale-95">
        <div class="p-6">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold text-white">Delete Server</h2>
                <button id="close-delete-modal" class="text-discord-lighter hover:text-white p-1">
                    <i class="fas fa-times h-5 w-5"></i>
                </button>
            </div>
            
            <div class="text-center mb-6">
                <div class="bg-discord-red bg-opacity-10 text-discord-red inline-block p-3 rounded-full mb-3">
                    <i class="fas fa-exclamation-triangle h-8 w-8"></i>
                </div>
                
                <h3 class="text-xl font-semibold text-white mb-2">Delete '<span class="server-name-to-confirm"></span>'</h3>
                <p class="text-discord-lighter">Are you sure you want to delete <strong class="server-name-to-confirm"></strong>? This action cannot be undone.</p>
            </div>
            
            <div class="mb-6">
                <label for="confirm-server-name" class="block text-sm font-medium text-discord-lighter mb-1">ENTER SERVER NAME</label>
                <input type="text" id="confirm-server-name" class="form-input bg-discord-dark-input text-white w-full rounded mb-1" placeholder="Enter server name">
                <p class="text-xs text-discord-lighter">Enter the server name to confirm deletion: <strong id="delete-server-name"></strong></p>
            </div>
            
            <div class="flex justify-end items-center space-x-3">
                <button id="cancel-delete-server" class="px-4 py-2 text-white bg-discord-dark hover:bg-discord-dark-hover rounded transition-colors">
                    Cancel
                </button>
                <button id="confirm-delete-server" class="px-4 py-2 text-white bg-discord-red hover:bg-red-700 rounded transition-colors cursor-not-allowed opacity-50" disabled>
                    Delete Server
                </button>
            </div>
        </div>
    </div>
</div>
<?php endif; ?>




