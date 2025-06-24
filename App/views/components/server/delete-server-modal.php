<div id="delete-server-modal" class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 hidden">
    <div class="bg-discord-dark w-full max-w-md rounded-lg shadow-xl">
        <div class="p-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-white">Delete '<span id="delete-server-name"></span>'</h3>
                <button id="close-delete-modal" class="text-gray-400 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                </button>
            </div>
            
            <div class="bg-discord-red bg-opacity-10 text-discord-red border-l-4 border-discord-red px-4 py-3 mb-4 rounded-r">
                <div class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span class="font-medium">Warning: This action cannot be undone</span>
                </div>
            </div>

            <p class="text-discord-lighter mb-6">
                This will permanently delete the server, all of its channels, and all of its messages. This action <strong class="text-white">cannot be undone</strong>.
            </p>
            
            <div class="mb-6">
                <label for="confirm-server-name" class="block text-discord-lighter mb-2 text-sm">
                    Please type <strong class="text-white font-semibold server-name-to-confirm"></strong> to confirm
                </label>
                <input type="text" id="confirm-server-name" class="w-full px-3 py-2 bg-discord-dark-input border border-discord-600 rounded-md text-white focus:outline-none focus:border-discord-red focus:ring-1 focus:ring-discord-red" placeholder="Enter server name">
            </div>

            <div class="flex justify-end">
                <button id="cancel-delete-server" class="px-4 py-2 mr-3 rounded-md text-white bg-discord-darker hover:bg-gray-700 transition-colors">
                    Cancel
                </button>
                <button id="confirm-delete-server" class="px-4 py-2 rounded-md bg-discord-red text-white opacity-50 cursor-not-allowed transition-all" disabled>
                    Delete Server
                </button>
            </div>
        </div>
    </div>
</div>
