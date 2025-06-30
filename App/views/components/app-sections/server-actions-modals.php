<?php
$serverId = isset($GLOBALS['currentServer']) ? $GLOBALS['currentServer']->id : 0;

$categories = $GLOBALS['serverCategories'] ?? [];
?>

<style>
    .animate-fade-in {
        animation: fadeIn 0.15s ease-in-out forwards;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes scaleIn {
        from { transform: scale(0.95); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
    }
    
    .transform.transition-all {
        animation: scaleIn 0.15s ease-out forwards;
    }
    
    input[type="checkbox"].peer:checked + div svg {
        display: block;
    }
</style>

<div id="create-channel-modal" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 hidden opacity-0" style="display: none;">
    <div class="bg-[#36393f] rounded-md w-full max-w-md shadow-xl transform scale-95 overflow-hidden">
        <div class="p-6">
            <div class="flex justify-between items-center">
                <h2 class="text-white text-xl font-bold">Create Channel</h2>
                <button id="close-create-channel-modal" class="text-gray-400 hover:text-white">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <p class="text-gray-400 mt-2 mb-6">Create a new channel for your server</p>

            <form id="create-channel-form" action="/api/channels" method="POST" onsubmit="return submitChannelForm(event)" class="space-y-4">
                <input type="hidden" name="server_id" value="<?php echo $serverId; ?>">
                <input type="hidden" name="position" id="channel-position" value="">
                <input type="hidden" name="category_id" id="category-id" value="">
                <input type="hidden" name="ajax_fallback" id="channel-ajax-fallback" value="false">
                
                <div class="mb-4">
                    <label class="block text-gray-400 text-xs font-semibold mb-2 uppercase">Channel Type</label>
                    <div class="relative">
                        <select id="channel-type" name="type" 
                                class="bg-[#1e1f22] text-white w-full px-3 py-2 rounded appearance-none focus:outline-none focus:ring-2 focus:ring-discord-blue border border-[#1e1f22]">
                            <option value="text">Text</option>
                            <option value="voice">Voice</option>
                        </select>
                        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                            <i class="fas fa-chevron-down text-xs"></i>
                        </div>
                    </div>
                </div>
                
                <div class="mb-4">
                    <label for="channel-name" class="block text-gray-400 text-xs font-semibold mb-2 uppercase">Channel Name</label>
                    <div class="relative flex items-center bg-[#1e1f22] rounded border border-[#1e1f22]">
                        <span class="text-gray-400 pl-3">#</span>
                        <input type="text" id="channel-name" name="name" 
                              class="bg-transparent border-none text-white w-full px-2 py-2 focus:outline-none" 
                              placeholder="new-channel" required>
                    </div>
                    <p class="text-xs text-gray-400 mt-1">Use lowercase letters, numbers, hyphens, and underscores</p>
                </div>
                
                <div class="mb-4">
                    <label class="block text-gray-400 text-xs font-semibold mb-2 uppercase">Category</label>
                    <div class="relative">
                        <select id="channel-category" name="category_id"
                                class="bg-[#1e1f22] text-white w-full px-3 py-2 rounded appearance-none focus:outline-none focus:ring-2 focus:ring-discord-blue border border-[#1e1f22]">
                            <option value="">No Category</option>
                            <?php foreach ($categories as $category): ?>
                            <option value="<?php echo $category->id; ?>"><?php echo htmlspecialchars($category->name); ?></option>
                            <?php endforeach; ?>
                        </select>
                        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                            <i class="fas fa-chevron-down text-xs"></i>
                        </div>
                    </div>
                </div>
                
                <div class="flex items-center mb-4">
                    <label class="flex items-center cursor-pointer">
                        <input type="checkbox" id="is-private" name="is_private" class="sr-only peer">
                        <div class="relative w-10 h-5 bg-[#4e5058] rounded-full peer 
                            peer-focus:outline-none peer-focus:ring-0
                            peer-checked:bg-discord-green transition-colors duration-300 ease-in-out
                            before:content-[''] before:absolute before:top-[2px] before:left-[2px] 
                            before:bg-white before:rounded-full before:h-4 before:w-4 
                            before:transition-all before:duration-300 
                            peer-checked:before:translate-x-5">
                        </div>
                        <span class="ms-3 text-gray-300 text-sm">Private Channel</span>
                    </label>
                    <div class="group relative ml-2">
                        <span class="text-gray-500 cursor-help">
                            <i class="fas fa-circle-info text-xs"></i>
                        </span>
                        <div class="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 invisible group-hover:visible bg-black text-white text-xs p-2 rounded w-48 z-10">
                            Only specific members will be able to view this channel
                        </div>
                    </div>
                </div>
            </form>
        </div>
        
        <div class="bg-[#2b2d31] py-4 px-6 flex justify-end gap-3">
            <button type="button" id="cancel-create-channel" 
                    class="px-4 py-2 text-sm font-medium text-white hover:underline">
                Cancel
            </button>
            <button type="submit" form="create-channel-form" id="create-channel-btn"
                    class="bg-discord-blue text-white px-4 py-2 rounded text-sm font-medium hover:bg-opacity-80 transition-colors">
                Create Channel
            </button>
        </div>
    </div>
</div>

<div id="create-category-modal" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 hidden opacity-0" style="display: none;">
    <div class="bg-[#36393f] rounded-md w-full max-w-md shadow-xl transform scale-95 overflow-hidden">
        <div class="p-6">
            <div class="flex justify-between items-center">
                <h2 class="text-white text-xl font-bold">Create Category</h2>
                <button id="close-create-category-modal" class="text-gray-400 hover:text-white">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <p class="text-gray-400 mt-2 mb-6">Create a new category to organize your channels</p>

            <form id="create-category-form" action="/api/categories" method="POST" onsubmit="return submitCategoryForm(event)" class="space-y-4">
                <input type="hidden" name="server_id" value="<?php echo $serverId; ?>">
                <input type="hidden" name="position" id="category-position" value="">
                <input type="hidden" name="ajax_fallback" id="category-ajax-fallback" value="false">
                
                <div class="mb-4">
                    <label for="category-name" class="block text-gray-400 text-xs font-semibold mb-2 uppercase">Category Name</label>
                    <input type="text" id="category-name" name="name" 
                          class="bg-[#1e1f22] text-white w-full px-3 py-2 rounded border border-[#1e1f22] focus:outline-none focus:ring-2 focus:ring-discord-blue" 
                          placeholder="NEW CATEGORY" required>
                    <p class="text-xs text-gray-400 mt-1">Category names are typically displayed in uppercase</p>
                </div>
            </form>
        </div>
        
        <div class="bg-[#2b2d31] py-4 px-6 flex justify-end gap-3">
            <button type="button" id="cancel-create-category" 
                    class="px-4 py-2 text-sm font-medium text-white hover:underline">
                Cancel
            </button>
            <button type="submit" form="create-category-form" id="create-category-btn"
                    class="bg-discord-blue text-white px-4 py-2 rounded text-sm font-medium hover:bg-opacity-80 transition-colors">
                Create Category
            </button>
        </div>
    </div>
</div>

 <div id="invite-people-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 hidden">
    <div class="w-full max-w-md">
        <div class="bg-discord-background rounded-lg shadow-lg overflow-hidden">
            <div class="p-6">
                <div class="flex justify-between mb-6">
                    <h2 class="text-2xl font-bold text-white">Invite People</h2>
                    <button id="close-invite-modal" class="text-gray-400 hover:text-white">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="space-y-4">
                    <div>
                        <p class="text-gray-400 mb-2">Share this link with others to grant access to this server</p>
                    </div>
                    
                    <div class="flex">
                        <input type="text" id="invite-link" readonly 
                               class="flex-1 bg-discord-dark border border-gray-700 rounded-l px-3 py-2 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-discord-primary"
                               placeholder="Generating invite link...">
                        <button id="copy-invite-link" 
                                class="bg-discord-primary hover:bg-discord-primary/90 text-white px-4 py-2 rounded-r transition-colors">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                    
                    <div id="invite-expiration-info" class="text-sm text-gray-400 hidden">
                        <i class="fas fa-clock mr-1"></i>
                        <span>Expires...</span>
                    </div>
                    
                    <div class="mt-2">
                        <label for="invite-expiration" class="block text-sm font-medium text-gray-300 mb-1">Expire after</label>
                        <select id="invite-expiration" class="w-full bg-discord-dark border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-discord-primary">
                            <option value="never">Never</option>
                            <option value="hour">1 hour</option>
                            <option value="day">24 hours</option>
                            <option value="week">7 days</option>
                            <option value="month">30 days</option>
                        </select>
                    </div>
                    
                    <div class="pt-4 flex justify-center">
                        <button id="generate-new-invite" class="text-discord-primary hover:underline text-sm">
                            Generate a new link
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div id="transfer-ownership-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 hidden">
    <div class="w-full max-w-md">
        <div class="bg-discord-background rounded-lg shadow-lg overflow-hidden">
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-bold text-white">Transfer Ownership</h2>
                    <button id="close-transfer-ownership-modal" class="text-gray-400 hover:text-white">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="space-y-4">
                    <div class="text-center" id="transfer-content">
                        <i class="fas fa-crown text-yellow-500 text-4xl mb-4"></i>
                        <p class="text-white mb-2">You're about to leave your own server!</p>
                        <p class="text-gray-400 text-sm mb-4">You must transfer ownership to another member before leaving.</p>
                    </div>
                    
                    <div class="text-center hidden" id="delete-content">
                        <i class="fas fa-trash-alt text-red-500 text-4xl mb-4"></i>
                        <p class="text-white mb-2">You're about to leave your own server!</p>
                        <p class="text-gray-400 text-sm mb-4">Since there are no other members, the server will be permanently deleted.</p>
                        <div class="bg-red-900/20 border border-red-500/50 rounded-lg p-3 mt-4">
                            <p class="text-red-400 text-sm font-medium">⚠️ This action cannot be undone!</p>
                            <p class="text-gray-400 text-xs mt-1">All channels, messages, and server data will be lost forever.</p>
                        </div>
                    </div>
                    
                    <div id="member-selection">
                        <label class="block text-sm font-medium text-gray-300 mb-2">Select New Owner</label>
                        <select id="new-owner-select" class="w-full bg-discord-dark border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-discord-primary">
                            <option value="">Loading members...</option>
                        </select>
                    </div>
                    
                    <div class="pt-4 flex space-x-3">
                        <button type="button" id="cancel-transfer-ownership" 
                                class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded">
                            Cancel
                        </button>
                        <button type="button" id="confirm-transfer-ownership" 
                                class="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded" disabled>
                            Transfer & Leave
                        </button>
                        <button type="button" id="confirm-delete-server" 
                                class="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded hidden">
                            Delete Server & Leave
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div id="edit-profile-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 hidden">
    <div class="w-full max-w-md">
        <div class="bg-discord-background rounded-lg shadow-lg overflow-hidden">
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-bold text-white">Edit Server Profile</h2>
                    <button id="close-edit-profile-modal" class="text-gray-400 hover:text-white">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="space-y-4">
                    <div class="text-center py-8">
                        <p class="text-gray-400">Your username will be displayed in this server.</p>
                        <p class="text-white font-medium mt-2"><?php echo htmlspecialchars($_SESSION['username'] ?? 'User'); ?></p>
                    </div>
                    
                    <div class="pt-4 flex justify-center">
                        <button type="button" id="cancel-edit-profile" 
                                class="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div id="leave-server-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 hidden">
    <div class="w-full max-w-md">
        <div class="bg-discord-background rounded-lg shadow-lg overflow-hidden">
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
                        <button type="button" id="cancel-leave-server" 
                                class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded">
                            Cancel
                        </button>
                        <button type="button" id="confirm-leave-server" 
                                class="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded">
                            Leave Server
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div id="toast-container" class="fixed top-4 right-4 z-50 space-y-2"></div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeActiveModals();
        }
    });

    function closeActiveModals() {
        const openModals = document.querySelectorAll('.fixed.inset-0:not(.hidden)');
        openModals.forEach(modal => {
            if (modal.id === 'create-channel-modal') closeCreateChannelModal();
            if (modal.id === 'create-category-modal') closeCreateCategoryModal();
            if (modal.id === 'invite-people-modal') closeInvitePeopleModal();
            if (modal.id === 'notification-settings-modal') closeNotificationSettingsModal();
            if (modal.id === 'leave-server-modal') closeLeaveServerModal();
            if (modal.id === 'edit-profile-modal') closeEditProfileModal();
        });
    }

    function closeInvitePeopleModal() {
        const modal = document.getElementById('invite-people-modal');
        if (!modal) return;
        
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }

    function closeTransferOwnershipModal() {
        const modal = document.getElementById('transfer-ownership-modal');
        if (!modal) return;
        
        modal.classList.add('hidden');
        modal.style.display = 'none';
        
        resetTransferOwnershipModal();
        
        const newOwnerSelect = document.getElementById('new-owner-select');
        if (newOwnerSelect) {
            newOwnerSelect.innerHTML = '<option value="">Loading members...</option>';
        }
    }
    
    function resetTransferOwnershipModal() {
        document.getElementById('transfer-content').classList.remove('hidden');
        document.getElementById('delete-content').classList.add('hidden');
        document.getElementById('member-selection').classList.remove('hidden');
        document.getElementById('confirm-transfer-ownership').classList.remove('hidden');
        document.getElementById('confirm-delete-server').classList.add('hidden');
        
        const confirmTransferBtn = document.getElementById('confirm-transfer-ownership');
        if (confirmTransferBtn) {
            confirmTransferBtn.disabled = true;
        }
    }

    function closeLeaveServerModal() {
        const modal = document.getElementById('leave-server-modal');
        if (!modal) return;
        
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }

    function closeEditProfileModal() {
        const modal = document.getElementById('edit-profile-modal');
        if (!modal) return;
        
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }

    const invitePeopleModal = document.getElementById('invite-people-modal');
    const closeInviteBtn = document.getElementById('close-invite-modal');
    
    if (closeInviteBtn) {
        closeInviteBtn.addEventListener('click', closeInvitePeopleModal);
    }
    
    if (invitePeopleModal) {
        invitePeopleModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeInvitePeopleModal();
            }
        });
    }

    const transferOwnershipModal = document.getElementById('transfer-ownership-modal');
    const closeTransferBtn = document.getElementById('close-transfer-ownership-modal');
    const cancelTransferBtn = document.getElementById('cancel-transfer-ownership');
    const confirmTransferBtn = document.getElementById('confirm-transfer-ownership');
    const newOwnerSelect = document.getElementById('new-owner-select');
    
    if (closeTransferBtn) {
        closeTransferBtn.addEventListener('click', closeTransferOwnershipModal);
    }
    
    if (cancelTransferBtn) {
        cancelTransferBtn.addEventListener('click', closeTransferOwnershipModal);
    }
    
    if (transferOwnershipModal) {
        transferOwnershipModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeTransferOwnershipModal();
            }
        });
    }

    if (newOwnerSelect) {
        newOwnerSelect.addEventListener('change', function() {
            const confirmBtn = document.getElementById('confirm-transfer-ownership');
            if (confirmBtn) {
                confirmBtn.disabled = !this.value;
            }
        });
    }

    const leaveServerModal = document.getElementById('leave-server-modal');
    const closeLeaveBtn = document.getElementById('close-leave-server-modal');
    const cancelLeaveBtn = document.getElementById('cancel-leave-server');
    
    if (closeLeaveBtn) {
        closeLeaveBtn.addEventListener('click', closeLeaveServerModal);
    }
    
    if (cancelLeaveBtn) {
        cancelLeaveBtn.addEventListener('click', closeLeaveServerModal);
    }
    
    if (leaveServerModal) {
        leaveServerModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeLeaveServerModal();
            }
        });
    }

    const editProfileModal = document.getElementById('edit-profile-modal');
    const closeEditProfileBtn = document.getElementById('close-edit-profile-modal');
    const cancelEditProfileBtn = document.getElementById('cancel-edit-profile');
    
    if (closeEditProfileBtn) {
        closeEditProfileBtn.addEventListener('click', closeEditProfileModal);
    }
    
    if (cancelEditProfileBtn) {
        cancelEditProfileBtn.addEventListener('click', closeEditProfileModal);
    }
    
    if (editProfileModal) {
        editProfileModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeEditProfileModal();
            }
        });
    }

    const createChannelModal = document.getElementById('create-channel-modal');
    const closeChannelBtn = document.getElementById('close-create-channel-modal');
    const cancelChannelBtn = document.getElementById('cancel-create-channel');
    
    function closeCreateChannelModal() {
        const modal = document.getElementById('create-channel-modal');
        if (!modal) return;
        
        modal.classList.add('opacity-0');
        const modalContent = modal.querySelector('.bg-discord-background');
        if (modalContent) {
            modalContent.classList.add('scale-95');
        }
        
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.style.display = 'none';
            
            const form = modal.querySelector('form');
            if (form) form.reset();
        }, 300);
    }
    
    if (closeChannelBtn) {
        closeChannelBtn.addEventListener('click', closeCreateChannelModal);
    }
    
    if (cancelChannelBtn) {
        cancelChannelBtn.addEventListener('click', closeCreateChannelModal);
    }
    
    if (createChannelModal) {
        createChannelModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeCreateChannelModal();
            }
        });
    }
    
    const createCategoryModal = document.getElementById('create-category-modal');
    const closeCategoryBtn = document.getElementById('close-create-category-modal');
    const cancelCategoryBtn = document.getElementById('cancel-create-category');
    
    function closeCreateCategoryModal() {
        const modal = document.getElementById('create-category-modal');
        if (!modal) return;
        
        modal.classList.add('opacity-0');
        const modalContent = modal.querySelector('.bg-discord-background');
        if (modalContent) {
            modalContent.classList.add('scale-95');
        }
        
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.style.display = 'none';
            
            const form = modal.querySelector('form');
            if (form) form.reset();
        }, 300);
    }
    
    if (closeCategoryBtn) {
        closeCategoryBtn.addEventListener('click', closeCreateCategoryModal);
    }
    
    if (cancelCategoryBtn) {
        cancelCategoryBtn.addEventListener('click', closeCreateCategoryModal);
    }
    
    if (createCategoryModal) {
        createCategoryModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeCreateCategoryModal();
            }
        });
    }
    
    document.querySelectorAll('.modal-content').forEach(modal => {
        modal.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    });
    
    window.openCreateChannelModal = function(categoryId = null, position = null) {
        const modal = document.getElementById('create-channel-modal');
        if (!modal) return;

        const form = modal.querySelector('form');
        if (form) {
            form.reset();
            const categorySelect = form.querySelector('#channel-category');
            if (categorySelect) categorySelect.value = categoryId || '';

            const posInput = form.querySelector('#channel-position');
            if (posInput) posInput.value = position !== null ? position : '';
        }

        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        
        requestAnimationFrame(() => {
            modal.classList.remove('opacity-0');
            const modalContent = modal.querySelector('.bg-discord-background');
            if (modalContent) {
                modalContent.classList.remove('scale-95');
            }
        });

        setTimeout(() => {
            modal.querySelector('#channel-name')?.focus();
        }, 300);
    };
    
    window.closeCreateChannelModal = closeCreateChannelModal;
    
    window.openCreateCategoryModal = function(position = null) {
        const modal = document.getElementById('create-category-modal');
        if (!modal) return;

        const form = modal.querySelector('form');
        if (form) {
            form.reset();
            const posInput = form.querySelector('#category-position');
            if (posInput) posInput.value = position !== null ? position : '';
        }

        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        
        requestAnimationFrame(() => {
            modal.classList.remove('opacity-0');
            const modalContent = modal.querySelector('.bg-discord-background');
            if (modalContent) {
                modalContent.classList.remove('scale-95');
            }
        });

        setTimeout(() => {
            modal.querySelector('#category-name')?.focus();
        }, 300);
    };
    
    window.closeCreateCategoryModal = closeCreateCategoryModal;
    
    const channelNameInput = document.getElementById('channel-name');
    if (channelNameInput) {
        channelNameInput.addEventListener('input', function() {
            let value = this.value.toLowerCase();
            value = value.replace(/\s+/g, '-');
            value = value.replace(/[^a-z0-9\-_]/g, '');
            this.value = value;
        });
    }
    
    window.submitChannelForm = function(event) {
        event.preventDefault();
        console.log("Channel form submission started");
        
        const form = document.getElementById('create-channel-form');
        const formData = new FormData(form);
        
        const positionField = document.getElementById('channel-position');
        const categoryField = document.getElementById('category-id');
        
        if (positionField && (positionField.value === '' || positionField.value === null)) {
            formData.set('position', null);
        }
        
        if (categoryField && (categoryField.value === '' || categoryField.value === null)) {
            formData.delete('category_id');
            console.log("Removed category_id field from form data");
        } else {
            console.log("Using category_id:", categoryField ? categoryField.value : 'categoryField not found');
        }
        
        const submitBtn = form.querySelector('[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<svg class="animate-spin h-5 w-5 mr-2 inline" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Creating...';
        }
        
        try {
            const typeInput = form.querySelector('[name="type"]');
            if (typeInput && typeInput.value) {
                const typeValue = typeInput.value.toString().trim();
                formData.set('type', typeValue);
            }
            
            fetch('/api/channels', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                }
            })
            .then(response => {
                console.log("Channel API response received", response.status, response.statusText);
                
                return response.text().then(rawText => {
                    console.log("Raw response:", rawText.substring(0, 300) + (rawText.length > 300 ? '...' : ''));
                    
                    if (!response.ok) {
                        console.warn("Server returned error status:", response.status);
                        
                        try {
                            const errorData = JSON.parse(rawText);
                            console.error("Server error details:", errorData);
                            
                            if (errorData && errorData.message) {
                                if (typeof showToast === 'function') {
                                    showToast(errorData.message, 'error');
                                }
                                if (submitBtn) {
                                    submitBtn.disabled = false;
                                    submitBtn.innerHTML = 'Create Channel';
                                }
                                return { success: false, message: errorData.message };
                            }
                        } catch (parseError) {
                            console.error("Failed to parse error response:", parseError);
                            
                            if (response.status >= 500) {
                                return submitFormDirectly('create-channel-form');
                            }
                        }
                    }
                    
                    try {
                        const data = JSON.parse(rawText);
                        return data;
                    } catch (e) {
                        console.error("Failed to parse JSON:", e);
                        if (rawText.includes("</html>") || rawText.includes("<br />")) {
                            console.error("Server returned HTML instead of JSON. Possible PHP error.");
                            
                            return submitFormDirectly('create-channel-form');
                        }
                        throw new Error("Invalid response format from server");
                    }
                });
            })
            .then(data => {
                if (data === true) {
                    return; 
                }
                
                if (!data || data.success === false) {
                    const errorMsg = (data && data.message) ? data.message : 'Error creating channel';
                    console.error("Error from API:", errorMsg);
                    
                    if (typeof showToast === 'function') {
                        showToast(errorMsg, 'error');
                    }
                    
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = 'Create Channel';
                    }
                    return;
                }
                  console.log("Channel form processing response data", data);
                if (data && data.success) {
                    closeCreateChannelModal();
                    form.reset();
                    
                    
                    if (typeof showToast === 'function') {
                        showToast('Channel created successfully', 'success');
                    }
                    
                    
                    try {
                        if (typeof refreshChannelList === 'function') {
                            refreshChannelList();
                            console.log("Channel list refreshed via AJAX");
                        } else if (typeof window.channelManager !== 'undefined' && window.channelManager.refreshChannelList) {
                            window.channelManager.refreshChannelList();
                            console.log("Channel list refreshed via channel manager");
                        } else {
                            console.log("No AJAX refresh method available, falling back to page reload");
                            setTimeout(function() {
                                window.location.reload();
                            }, 500);
                        }
                    } catch (navError) {
                        console.error("Navigation error:", navError);
                        setTimeout(function() {
                            window.location.reload();
                        }, 1000);
                    }
                } else {
                    
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = 'Create Channel';
                    }
                }
            })
            .catch(error => {
                console.error('API Error:', error);
                
                if (typeof showToast === 'function') {
                    showToast('Error creating channel. Please try again.', 'error');
                }
                
                
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Create Channel';
                }
                
                
                submitFormDirectly('create-channel-form');
            });
        } catch (outerError) {
            console.error('Critical error in form submission:', outerError);
            
            
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Create Channel';
            }
            
            
            submitFormDirectly('create-channel-form');
        }
        
        
        return false;
    };
    
    
    window.submitCategoryForm = function(event) {
        event.preventDefault();
        console.log("Category form submission started");
        
        const form = document.getElementById('create-category-form');
        const formData = new FormData(form);
        
        
        const positionField = document.getElementById('category-position');
        
        
        if (positionField && (positionField.value === '' || positionField.value === null)) {
            formData.set('position', null);
        }
        
        
        const submitBtn = form.querySelector('[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<svg class="animate-spin h-5 w-5 mr-2 inline" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Creating...';
        }
        
        try {
            fetch('/api/categories', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                }
            })
            .then(response => {
                console.log("Category API response received", response.status, response.statusText);
                
                
                return response.text().then(rawText => {
                    console.log("Raw response:", rawText.substring(0, 300) + (rawText.length > 300 ? '...' : ''));
                    
                    
                    if (!response.ok) {
                        console.warn("Server returned error status:", response.status);
                        
                        try {
                            
                            const errorData = JSON.parse(rawText);
                            console.error("Server error details:", errorData);
                            
                            
                            if (errorData && errorData.message) {
                                if (typeof showToast === 'function') {
                                    showToast(errorData.message, 'error');
                                }
                                
                                if (submitBtn) {
                                    submitBtn.disabled = false;
                                    submitBtn.innerHTML = 'Create Category';
                                }
                                return { success: false, message: errorData.message };
                            }
                        } catch (parseError) {
                            
                            console.error("Failed to parse error response:", parseError);
                            
                            
                            if (response.status >= 500) {
                                return submitFormDirectly('create-category-form');
                            }
                        }
                    }
                    
                    try {
                        
                        const data = JSON.parse(rawText);
                        return data;
                    } catch (e) {
                        console.error("Failed to parse JSON:", e);
                        
                        if (rawText.includes("</html>") || rawText.includes("<br />")) {
                            console.error("Server returned HTML instead of JSON. Possible PHP error.");
                            
                            
                            return submitFormDirectly('create-category-form');
                        }
                        throw new Error("Invalid response format from server");
                    }
                });
            })
            .then(data => {
                
                if (data === true) {
                    return; 
                }
                
                
                if (!data || data.success === false) {
                    const errorMsg = (data && data.message) ? data.message : 'Error creating category';
                    console.error("Error from API:", errorMsg);
                    
                    if (typeof showToast === 'function') {
                        showToast(errorMsg, 'error');
                    }
                    
                    
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = 'Create Category';
                    }
                    return;
                }
                
                console.log("Category form processing response data", data);
                if (data && data.success) {
                    closeCreateCategoryModal();
                    form.reset();
                    
                    
                    if (typeof showToast === 'function') {
                        showToast('Category created successfully', 'success');
                    }
                    
                    
                    try {
                        if (data.redirect) {
                            console.log("Redirecting to:", data.redirect);
                            setTimeout(function() {
                                window.location.href = data.redirect;
                            }, 500);
                        } else if (data.data && data.data.redirect) {
                            console.log("Redirecting to:", data.data.redirect);
                            setTimeout(function() {
                                window.location.href = data.data.redirect;
                            }, 500);
                        } else {
                            console.log("No redirect URL found, reloading page");
                            setTimeout(function() {
                                window.location.reload();
                            }, 500);
                        }
                    } catch (navError) {
                        console.error("Navigation error:", navError);
                        
                        setTimeout(function() {
                            window.location.reload();
                        }, 1000);
                    }
                } else {
                    
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = 'Create Category';
                    }
                }
            })
            .catch(error => {
                console.error('API Error:', error);
                
                if (typeof showToast === 'function') {
                    showToast('Error creating category. Please try again.', 'error');
                }
                
                
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Create Category';
                }
                
                
                submitFormDirectly('create-category-form');
            });
        } catch (outerError) {
            console.error('Critical error in form submission:', outerError);
            
            
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Create Category';
            }
            
            
            submitFormDirectly('create-category-form');
        }
        
        
        return false;
    };
    
    
    window.submitFormDirectly = function(formId) {
        console.log("Attempting direct form submission for", formId);
        const form = document.getElementById(formId);
        if (form) {
            
            const fallbackField = form.querySelector('[name="ajax_fallback"]');
            if (fallbackField) {
                fallbackField.value = "true";
            }
            
            
            form.submit();
            return true;
        }
        return false;
    };

    
    console.log("Modal scripts initialized");
});
</script>
