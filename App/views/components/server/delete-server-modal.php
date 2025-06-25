<?php if (isset($serverId)): ?>
<div id="delete-server-modal" class="fixed inset-0 flex items-center justify-center hidden z-50">
    <div class="absolute inset-0 bg-black bg-opacity-70"></div>
    
    <div class="bg-discord-dark max-w-md w-full rounded-lg z-10 transform transition-transform duration-200 scale-95">
        <div class="p-6">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold text-white">Delete Server</h2>
                <button id="close-delete-modal" class="text-discord-lighter hover:text-white p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            <div class="text-center mb-6">
                <div class="bg-discord-red bg-opacity-10 text-discord-red inline-block p-3 rounded-full mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
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

<div id="leave-server-modal" class="fixed inset-0 flex items-center justify-center hidden z-50">
    <div class="absolute inset-0 bg-black bg-opacity-70"></div>
    
    <div class="bg-discord-dark max-w-md w-full rounded-lg z-10">
        <div class="p-6">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold text-white">Leave Server</h2>
                <button id="close-leave-server-modal" class="text-gray-400 hover:text-white">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="space-y-4">
                <div class="text-center">
                    <i class="fas fa-exclamation-triangle text-yellow-500 text-4xl mb-4"></i>
                    <p class="text-white mb-2">Are you sure you want to leave this server?</p>
                    <p class="text-gray-400 text-sm">You won't be able to rejoin this server unless you are re-invited.</p>
                </div>
                
                <div class="pt-4 flex space-x-3">
                    <button type="button" id="cancel-leave-server" class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded">
                        Cancel
                    </button>
                    <button type="button" id="confirm-leave-server" class="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded">
                        Leave Server
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const leaveServerModal = document.getElementById('leave-server-modal');
    
    if (leaveServerModal && window.location.pathname.includes('/settings/user')) {
        leaveServerModal.remove();
    }
    
    if (document.body.classList.contains('settings-user')) {
        const modals = document.querySelectorAll('#leave-server-modal, #delete-server-modal');
        modals.forEach(modal => {
            if (modal) modal.remove();
        });
    }
});
</script>
