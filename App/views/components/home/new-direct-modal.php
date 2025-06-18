<div class="modal-backdrop hidden" id="new-direct-modal">
    <div class="modal w-full max-w-md mx-4" onclick="event.stopPropagation();">
        <div class="p-4 border-b border-discord-dark">
            <div class="flex justify-between items-center">
                <h3 class="text-lg font-semibold text-white">New Message</h3>
                <button id="close-new-direct-modal" class="text-gray-400 hover:text-white">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
        <div class="p-4">
            <div class="mb-4">
                <label class="block text-xs text-gray-400 uppercase font-semibold mb-2">Select a Friend</label>
                <div class="relative">
                    <input type="text" placeholder="Search by username" class="w-full bg-discord-dark text-white rounded px-3 py-2 focus:outline-none" id="dm-search-input">
                    <i class="fas fa-search absolute right-3 top-2.5 text-gray-500"></i>
                </div>
            </div>
            
            <div id="dm-friends-list" class="max-h-60 overflow-y-auto py-2 space-y-2">
                <div class="text-gray-400 text-center py-4 hidden" id="no-dm-friends">
                    <i class="fas fa-user-friends text-2xl mb-2"></i>
                    <p>No friends found</p>
                </div>
            </div>
        </div>
        <div class="p-4 bg-discord-darker flex justify-end space-x-3">
            <button class="px-4 py-2 text-white bg-discord-dark hover:bg-discord-light rounded-md" id="cancel-new-direct">
                Cancel
            </button>
            <button class="px-4 py-2 text-white bg-discord-primary hover:bg-discord-primary/90 rounded-md opacity-50 cursor-not-allowed" id="create-new-direct" disabled>
                Create Message
            </button>
        </div>
    </div>
</div>
