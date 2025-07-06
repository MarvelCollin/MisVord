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

<div id="create-channel-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 hidden">
    <div class="w-full max-w-md">
        <div class="bg-discord-background rounded-lg shadow-lg overflow-hidden">
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
                    
                </form>
            </div>
        </div>
    </div>
</div>

<div id="create-category-modal" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 hidden opacity-0">
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
                     <div class="mt-4 pt-4 border-t border-gray-700 flex justify-center">
                        <button id="invite-bot-btn" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition duration-300">
                            <i class="fas fa-robot mr-2"></i> Invite Bot
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div id="invite-bot-modal" class="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-70 hidden">
    <div class="bg-discord-darker p-6 rounded-lg shadow-xl w-full max-w-md">
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold text-white">Invite a Bot</h2>
            <button id="close-invite-bot-modal" class="text-gray-400 hover:text-white">&times;</button>
        </div>
        <div>
            <input type="text" id="bot-search-input" placeholder="Search for a bot" class="w-full p-2 rounded bg-discord-dark text-white mb-4">
            <div id="bot-list" class="space-y-2 max-h-60 overflow-y-auto">
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

<div id="toast-container" class="fixed top-4 right-4 z-50 space-y-2"></div>

<div id="edit-channel-modal" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 hidden opacity-0">
    <div class="bg-[#36393f] rounded-md w-full max-w-md shadow-xl transform scale-95 overflow-hidden">
        <div class="p-6">
            <div class="flex justify-between items-center">
                <h2 class="text-white text-xl font-bold">Edit Channel</h2>
                <button id="close-edit-channel-modal" class="text-gray-400 hover:text-white">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <p class="text-gray-400 mt-2 mb-6">Make changes to your channel</p>

            <form id="edit-channel-form" class="space-y-4">
                <input type="hidden" id="edit-channel-id" name="channel_id" value="">
                
                <div class="mb-4">
                    <label class="block text-gray-400 text-xs font-semibold mb-2 uppercase">Channel Type</label>
                    <div class="relative">
                        <select id="edit-channel-type" name="type" 
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
                    <label for="edit-channel-name" class="block text-gray-400 text-xs font-semibold mb-2 uppercase">Channel Name</label>
                    <div class="relative flex items-center bg-[#1e1f22] rounded border border-[#1e1f22]">
                        <span class="text-gray-400 pl-3">#</span>
                        <input type="text" id="edit-channel-name" name="name" 
                              class="bg-transparent border-none text-white w-full px-2 py-2 focus:outline-none" 
                              placeholder="channel-name" required>
                    </div>
                    <p class="text-xs text-gray-400 mt-1">Use lowercase letters, numbers, hyphens, and underscores</p>
                </div>
            </form>
        </div>
        
        <div class="bg-[#2b2d31] py-4 px-6 flex justify-end gap-3">
            <button type="button" id="cancel-edit-channel" 
                    class="px-4 py-2 text-sm font-medium text-white hover:underline">
                Cancel
            </button>
            <button type="button" id="save-edit-channel"
                    class="bg-discord-blue text-white px-4 py-2 rounded text-sm font-medium hover:bg-opacity-80 transition-colors">
                Save Changes
            </button>
        </div>
    </div>
</div>

<div id="delete-channel-confirm-modal" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 hidden opacity-0">
    <div class="bg-[#36393f] rounded-md w-full max-w-md shadow-xl transform scale-95 overflow-hidden">
        <div class="p-6">
            <div class="flex justify-between items-center">
                <h2 class="text-white text-xl font-bold">Delete Channel</h2>
                <button id="close-delete-channel-modal" class="text-gray-400 hover:text-white">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="mt-4">
                <div class="text-center">
                    <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                    <p class="text-white mb-2">Are you sure you want to delete this channel?</p>
                    <p class="text-gray-400 text-sm mb-4" id="delete-channel-name-display">This action cannot be undone.</p>
                </div>
            </div>
        </div>
        
        <div class="bg-[#2b2d31] py-4 px-6 flex justify-end gap-3">
            <button type="button" id="cancel-delete-channel" 
                    class="px-4 py-2 text-sm font-medium text-white hover:underline">
                Cancel
            </button>
            <button type="button" id="confirm-delete-channel"
                    class="bg-red-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-700 transition-colors">
                Delete Channel
            </button>
        </div>
    </div>
</div>

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
            if (modal.id === 'edit-profile-modal') closeEditProfileModal();
        });
    }

    function closeInvitePeopleModal() {
        const modal = document.getElementById('invite-people-modal');
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
    
    window.openCreateChannelModal = function(position = null) {
        const modal = document.getElementById('create-channel-modal');
        if (!modal) return;

        const form = modal.querySelector('form');
        if (form) {
            form.reset();
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

        const channelNameInput = modal.querySelector('#channel-name');
        if (channelNameInput && !channelNameInput.dataset.inputListenerAttached) {
            channelNameInput.addEventListener('input', function() {
                this.value = this.value.toLowerCase().replace(/\s/g, '-').replace(/[^a-z0-9-_]/g, '');
            });
            channelNameInput.dataset.inputListenerAttached = 'true';
        }

        setTimeout(() => {
            modal.querySelector('#channel-name')?.focus();
        }, 300);
    };
    
    window.submitChannelForm = function(event) {
        event.preventDefault();

        const form = document.getElementById('create-channel-form');
        if (form.hasAttribute('data-submitting')) {
            return false;
        }
        form.setAttribute('data-submitting', 'true');

        const formData = new FormData(form);
        const submitBtn = form.querySelector('[type="submit"]');

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin h-5 w-5 mr-2 inline"></i> Creating...';
        }

        fetch('/api/channels', {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                closeCreateChannelModal();
                form.reset();
                if (typeof showToast === 'function') {
                    showToast('Channel created successfully', 'success');
                }
                if (typeof refreshChannelList === 'function') {
                    refreshChannelList();
                }
            } else {
                if (typeof showToast === 'function') {
                    showToast(data.message || 'Error creating channel', 'error');
                }
            }
        })
        .catch(error => {
            console.error('API Error:', error);
            if (typeof showToast === 'function') {
                showToast('Error creating channel. Please try again.', 'error');
            }
        })
        .finally(() => {
            form.removeAttribute('data-submitting');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Create Channel';
            }
        });

        return false;
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
    
    window.showCreateChannelModal = window.openCreateChannelModal;
    window.showCreateCategoryModal = window.openCreateCategoryModal;
    
    window.openEditChannelModal = function(channelId, channelData) {
        const modal = document.getElementById('edit-channel-modal');
        if (!modal) return;

        document.getElementById('edit-channel-id').value = channelId;
        document.getElementById('edit-channel-name').value = channelData.name || '';
        document.getElementById('edit-channel-type').value = channelData.type || 'text';

        modal.classList.remove('hidden', 'opacity-0');
        modal.style.display = 'flex';
        modal.style.opacity = '1';
        
        requestAnimationFrame(() => {
            const modalContent = modal.querySelector('.bg-\\[\\#36393f\\]');
            if (modalContent) {
                modalContent.classList.remove('scale-95');
                modalContent.style.transform = 'scale(1)';
            }
        });

        setTimeout(() => {
            document.getElementById('edit-channel-name')?.focus();
        }, 300);
    };
    
    window.closeEditChannelModal = function() {
        const modal = document.getElementById('edit-channel-modal');
        if (!modal) return;
        
        modal.classList.add('opacity-0');
        const modalContent = modal.querySelector('.bg-\\[\\#36393f\\]');
        if (modalContent) {
            modalContent.classList.add('scale-95');
        }
        
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.style.display = 'none';
            
            const form = modal.querySelector('form');
            if (form) form.reset();
        }, 300);
    };
    
    window.openDeleteChannelModal = function(channelId, channelName) {
        const modal = document.getElementById('delete-channel-confirm-modal');
        if (!modal) return;

        modal.setAttribute('data-channel-id', channelId);
        document.getElementById('delete-channel-name-display').textContent = 
            `Channel "#${channelName}" and all its messages will be permanently deleted.`;

        modal.classList.remove('hidden', 'opacity-0');
        modal.style.display = 'flex';
        modal.style.opacity = '1';
        
        requestAnimationFrame(() => {
            const modalContent = modal.querySelector('.bg-\\[\\#36393f\\]');
            if (modalContent) {
                modalContent.classList.remove('scale-95');
                modalContent.style.transform = 'scale(1)';
            }
        });
    };
    
    window.closeDeleteChannelModal = function() {
        const modal = document.getElementById('delete-channel-confirm-modal');
        if (!modal) return;
        
        modal.classList.add('opacity-0');
        const modalContent = modal.querySelector('.bg-\\[\\#36393f\\]');
        if (modalContent) {
            modalContent.classList.add('scale-95');
        }
        
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.style.display = 'none';
            modal.removeAttribute('data-channel-id');
        }, 300);
    };
    
    document.getElementById('close-edit-channel-modal')?.addEventListener('click', window.closeEditChannelModal);
    document.getElementById('cancel-edit-channel')?.addEventListener('click', window.closeEditChannelModal);
    
    document.getElementById('close-delete-channel-modal')?.addEventListener('click', window.closeDeleteChannelModal);
    document.getElementById('cancel-delete-channel')?.addEventListener('click', window.closeDeleteChannelModal);
    
    document.getElementById('save-edit-channel')?.addEventListener('click', async function() {
        const channelId = document.getElementById('edit-channel-id').value;
        const name = document.getElementById('edit-channel-name').value;
        const type = document.getElementById('edit-channel-type').value;
        
        if (!name.trim()) {
            if (typeof showToast === 'function') {
                showToast('Channel name is required', 'error');
            }
            return;
        }
        
        try {
            const data = { name: name.trim(), type };
            
            const response = await window.channelAPI.updateChannel(channelId, data);
            
            if (response && (response.success || response.data)) {
                if (typeof showToast === 'function') {
                    showToast('Channel updated successfully', 'success');
                }
                window.closeEditChannelModal();
                
                if (typeof window.refreshChannelList === 'function') {
                    window.refreshChannelList();
                } else if (typeof window.channelManager?.refreshChannelList === 'function') {
                    window.channelManager.refreshChannelList();
                }
            } else {
                throw new Error(response?.message || 'Failed to update channel');
            }
        } catch (error) {
            console.error('Error updating channel:', error);
            if (typeof showToast === 'function') {
                showToast('Error updating channel: ' + error.message, 'error');
            }
        }
    });
    
    document.getElementById('confirm-delete-channel')?.addEventListener('click', async function() {
        const modal = document.getElementById('delete-channel-confirm-modal');
        const channelId = modal.getAttribute('data-channel-id');
        
        if (!channelId) return;
        
        try {
            const response = await window.channelAPI.deleteChannel(channelId);
            
            if (response && (response.success || response.data)) {
                if (typeof showToast === 'function') {
                    showToast('Channel deleted successfully', 'success');
                }
                window.closeDeleteChannelModal();
                
                if (typeof window.refreshChannelList === 'function') {
                    window.refreshChannelList();
                } else if (typeof window.channelManager?.refreshChannelList === 'function') {
                    window.channelManager.refreshChannelList();
                }
                
                const currentChannelId = new URLSearchParams(window.location.search).get('channel');
                if (currentChannelId && currentChannelId === channelId) {
                    const urlParts = window.location.pathname.split('/');
                    const serverId = urlParts[urlParts.indexOf('server') + 1];
                    if (serverId) {
                        window.history.replaceState({}, '', `/server/${serverId}`);
                        if (typeof window.loadServerPage === 'function') {
                            window.loadServerPage(serverId);
                        }
                    }
                }
            } else {
                throw new Error(response?.message || 'Failed to delete channel');
            }
        } catch (error) {
            console.error('Error deleting channel:', error);
            if (typeof showToast === 'function') {
                showToast('Error deleting channel: ' + error.message, 'error');
            }
        }
    });
    
    window.debugModalFunctions = function() {
        try {
            window.showCreateChannelModal();
        } catch (error) {
            console.error('❌ Channel modal error:', error);
        }
    };
    
    window.testModalDirectly = function() {
        console.clear();

        const modal = document.getElementById('create-channel-modal');
        if (!modal) {
            console.error('❌ Modal not found!');
            return;
        }
        
        console.log('🎨 Modal initial styles:', {
            display: getComputedStyle(modal).display,
            visibility: getComputedStyle(modal).visibility,
            opacity: getComputedStyle(modal).opacity,
            zIndex: getComputedStyle(modal).zIndex,
            position: getComputedStyle(modal).position
        });
        
        modal.classList.remove('hidden', 'opacity-0');
        modal.style.display = 'flex';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
        modal.style.zIndex = '99999';
        modal.style.position = 'fixed';
        modal.style.inset = '0';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        
        console.log('🎨 Modal after forced styles:', {
            display: getComputedStyle(modal).display,
            visibility: getComputedStyle(modal).visibility,
            opacity: getComputedStyle(modal).opacity,
            zIndex: getComputedStyle(modal).zIndex,
            position: getComputedStyle(modal).position
        });
        
        const modalContent = modal.querySelector('.bg-\\[\\#36393f\\]');
        if (modalContent) {
            modalContent.classList.remove('scale-95');
            modalContent.style.transform = 'scale(1)';
        } else {
            console.warn('⚠️ Modal content not found');
        }
    };
});
</script>
