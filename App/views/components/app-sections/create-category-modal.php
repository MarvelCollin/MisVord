<?php
$serverId = isset($GLOBALS['currentServer']) ? $GLOBALS['currentServer']->id : 0;
?>

<!-- Create Category Modal -->
<div id="create-category-modal" class="modal hidden fixed inset-0 z-50">
    <div class="modal-overlay absolute inset-0 bg-gray-900 opacity-80"></div>
    <div class="modal-container w-full max-w-md mx-auto py-12 px-4">
        <div class="modal-content bg-gray-800 rounded-lg shadow-xl p-6">
            <div class="modal-header flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-white">Create Category</h3>
                <button id="close-category-modal" class="text-gray-400 hover:text-white">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="modal-body">
                <form id="create-category-form">
                    <input type="hidden" name="server_id" value="<?php echo $serverId; ?>">
                    
                    <div class="mb-4">
                        <label for="category-name" class="block mb-1 text-sm font-medium text-gray-300">Category Name</label>
                        <input type="text" id="category-name" name="name" 
                              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-indigo-500 focus:outline-none" 
                              placeholder="CATEGORY NAME" required>
                        <p class="text-xs text-gray-500 mt-1">Category names are typically displayed in uppercase.</p>
                    </div>
                    
                    <div class="mt-6 flex justify-end">
                        <button type="button" class="cancel-btn mr-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600">
                            Cancel
                        </button>
                        <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500">
                            Create Category
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<script>
    document.addEventListener('DOMContentLoaded', function() {
        const createCategoryModal = document.getElementById('create-category-modal');
        const closeCategoryModalBtn = document.getElementById('close-category-modal');
        const cancelBtn = createCategoryModal.querySelector('.cancel-btn');
        
        // Close modal function
        function closeCreateCategoryModal() {
            createCategoryModal.classList.add('hidden');
        }
        
        // Close events
        if (closeCategoryModalBtn) {
            closeCategoryModalBtn.addEventListener('click', closeCreateCategoryModal);
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', closeCreateCategoryModal);
        }
        
        // Close when clicking outside
        createCategoryModal.addEventListener('click', function(e) {
            if (e.target === createCategoryModal || e.target.classList.contains('modal-overlay')) {
                closeCreateCategoryModal();
            }
        });
        
        // Global function to open modal
        window.openCreateCategoryModal = function() {
            createCategoryModal.classList.remove('hidden');
        };
        
        // Global function to close modal
        window.closeCreateCategoryModal = function() {
            closeCreateCategoryModal();
        };
    });
</script> 