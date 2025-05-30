<?php
$serverId = isset($GLOBALS['currentServer']) ? $GLOBALS['currentServer']->id : 0;

// Get categories for the server
require_once __DIR__ . '/../../../database/models/Category.php';
$categories = Category::getForServer($serverId);
?>

<!-- Create Channel Modal -->
<div id="create-channel-modal" class="modal hidden fixed inset-0 z-50">
    <div class="modal-overlay absolute inset-0 bg-gray-900 opacity-80"></div>
    <div class="modal-container w-full max-w-md mx-auto py-12 px-4">
        <div class="modal-content bg-gray-800 rounded-lg shadow-xl p-6">
            <div class="modal-header flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-white">Create Channel</h3>
                <button id="close-channel-modal" class="text-gray-400 hover:text-white">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="modal-body">
                <form id="create-channel-form">
                    <input type="hidden" name="server_id" value="<?php echo $serverId; ?>">
                    
                    <div class="mb-4">
                        <label for="channel-name" class="block mb-1 text-sm font-medium text-gray-300">Channel Name</label>
                        <input type="text" id="channel-name" name="name" 
                              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-indigo-500 focus:outline-none" 
                              placeholder="new-channel" required>
                        <p class="text-xs text-gray-500 mt-1">Channel names can only contain lowercase letters, numbers, hyphens, and underscores.</p>
                    </div>
                    
                    <div class="mb-4">
                        <label for="channel-type" class="block mb-1 text-sm font-medium text-gray-300">Channel Type</label>
                        <select id="channel-type" name="type" 
                               class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-indigo-500 focus:outline-none">
                            <option value="text">Text Channel</option>
                            <option value="voice">Voice Channel</option>
                        </select>
                    </div>
                    
                    <div class="mb-4">
                        <label for="category-id" class="block mb-1 text-sm font-medium text-gray-300">Category</label>
                        <select id="category-id" name="category_id" 
                               class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-indigo-500 focus:outline-none">
                            <option value="">No Category</option>
                            <?php foreach ($categories as $category): ?>
                                <option value="<?php echo $category['id']; ?>"><?php echo htmlspecialchars($category['name']); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    
                    <div class="mb-4 flex items-center">
                        <input type="checkbox" id="is-private" name="is_private" class="mr-2">
                        <label for="is-private" class="text-sm text-gray-300">Private Channel</label>
                        <p class="text-xs text-gray-500 ml-2">Only specific members will be able to see this channel.</p>
                    </div>
                    
                    <div class="mt-6 flex justify-end">
                        <button type="button" class="cancel-btn mr-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600">
                            Cancel
                        </button>
                        <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500">
                            Create Channel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<script>
    document.addEventListener('DOMContentLoaded', function() {
        const createChannelModal = document.getElementById('create-channel-modal');
        const closeChannelModalBtn = document.getElementById('close-channel-modal');
        const cancelBtn = createChannelModal.querySelector('.cancel-btn');
        
        // Close modal function
        function closeCreateChannelModal() {
            createChannelModal.classList.add('hidden');
        }
        
        // Close events
        if (closeChannelModalBtn) {
            closeChannelModalBtn.addEventListener('click', closeCreateChannelModal);
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', closeCreateChannelModal);
        }
        
        // Close when clicking outside
        createChannelModal.addEventListener('click', function(e) {
            if (e.target === createChannelModal || e.target.classList.contains('modal-overlay')) {
                closeCreateChannelModal();
            }
        });
        
        // Global function to open modal
        window.openCreateChannelModal = function(categoryId = null) {
            // Reset the form
            const form = createChannelModal.querySelector('form');
            if (form) form.reset();
            
            // Set category if provided
            if (categoryId) {
                const categorySelect = document.getElementById('category-id');
                if (categorySelect) {
                    categorySelect.value = categoryId;
                }
            }
            
            createChannelModal.classList.remove('hidden');
        };
        
        // Global function to close modal
        window.closeCreateChannelModal = function() {
            closeCreateChannelModal();
        };
    });
</script> 