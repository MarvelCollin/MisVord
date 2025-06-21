<div class="modal-backdrop hidden fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center" id="new-direct-modal" style="z-index: 100000;">
    <div class="modal w-full max-w-md mx-4 bg-discord-darkest rounded-lg shadow-2xl" onclick="event.stopPropagation();">
        <div class="p-4 border-b border-discord-darker">
            <div class="flex justify-between items-center">
                <h3 class="text-lg font-semibold text-white">New Message</h3>
                <button id="close-new-direct-modal" class="text-gray-400 hover:text-white focus:outline-none focus:ring-0">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
        </div>
        <div class="p-4">
            <div class="mb-4">
                <label class="block text-xs text-gray-400 uppercase font-semibold mb-2">Select a Friend</label>
                <div class="relative">
                    <input type="text" placeholder="Search by username" class="w-full bg-discord-dark text-white rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-discord-primary" id="dm-search-input">
                    <i class="fas fa-search absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"></i>
                </div>
            </div>
            
            <div id="dm-selected-friends" class="flex flex-wrap gap-2 mb-4">
                </div>

            <div id="dm-friends-list" class="max-h-60 overflow-y-auto py-2 space-y-2 custom-scrollbar">
                <div class="flex items-center p-2 rounded-md hover:bg-discord-dark-hover cursor-pointer transition-colors duration-150" data-user-id="user-kolina-id">
                    <div class="w-8 h-8 rounded-full mr-3 bg-discord-primary flex items-center justify-center">
                        <i class="fas fa-user text-white text-sm"></i>
                    </div>
                    <div>
                        <p class="text-white font-medium">kolina</p>
                        <p class="text-gray-400 text-sm">Offline</p>
                    </div>
                </div>
                <div class="text-gray-400 text-center py-4 hidden" id="no-dm-friends">
                    <i class="fas fa-user-friends text-2xl mb-2"></i>
                    <p>No friends found</p>
                </div>
            </div>
        </div>
        <div class="p-4 bg-discord-darker flex justify-end space-x-3 rounded-b-lg">
            <button class="px-4 py-2 text-white bg-gray-600 hover:bg-gray-700 rounded-md transition-colors duration-150" id="cancel-new-direct">
                Cancel
            </button>
            <button class="px-4 py-2 text-white bg-discord-primary hover:bg-discord-primary-dark rounded-md opacity-50 cursor-not-allowed transition-colors duration-150" id="create-new-direct" disabled>
                Create Message
            </button>
        </div>
    </div>
</div>