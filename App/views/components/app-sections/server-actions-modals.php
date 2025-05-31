<?php
// Server Actions Modals Component
// This component contains all the modals for server dropdown actions
$serverId = isset($GLOBALS['currentServer']) ? $GLOBALS['currentServer']->id : 0;

// Get categories for the server for dropdown in channel creation
require_once __DIR__ . '/../../../database/models/Category.php';
$categories = Category::getForServer($serverId);
?>

<!-- Animation Styles for Modals -->
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
    
    /* Dialog animation */
    .transform.transition-all {
        animation: scaleIn 0.15s ease-out forwards;
    }
    
    /* Custom checkbox styling */
    input[type="checkbox"].peer:checked + div svg {
        display: block;
    }
</style>

<!-- Create Channel Modal -->
<div id="create-channel-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 hidden animate-fade-in">
    <div class="w-full max-w-md transform transition-all">
        <div class="bg-[#313338] modal-content rounded-md shadow-xl overflow-hidden">
            <!-- Header -->
            <div class="px-4 py-3 border-b border-[#232428] flex justify-between items-center">
                <h2 class="text-[#f2f3f5] text-base font-semibold">Create Channel</h2>
                <button id="close-create-channel-modal" class="text-[#b5bac1] hover:text-white" aria-label="Close">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            
            <!-- Content -->
            <form id="create-channel-form" action="/api/channels" method="POST" onsubmit="return submitChannelForm(event)" class="p-4">
                <input type="hidden" name="server_id" value="<?php echo $serverId; ?>">
                <input type="hidden" name="position" id="channel-position" value="">
                <input type="hidden" name="category_id" id="category-id" value="">
                <input type="hidden" name="ajax_fallback" id="channel-ajax-fallback" value="false">
                
                <div class="mb-4">
                    <label class="flex items-center text-xs font-bold text-[#b5bac1] mb-2">
                        CHANNEL TYPE
                    </label>
                    <div class="relative">
                        <select id="channel-type" name="type" 
                                class="w-full bg-[#1e1f22] border border-[#1a1b1e] rounded-[3px] px-3 py-2 text-white appearance-none focus:outline-none focus:border-[#5865f2] text-sm">
                            <option value="text">Text</option>
                            <option value="voice">Voice</option>
                        </select>
                        <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                            <svg class="w-4 h-4 text-[#b5bac1]" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div class="mb-4">
                    <div class="flex items-center justify-between mb-2">
                        <label for="channel-name" class="text-xs font-bold text-[#b5bac1]">CHANNEL NAME</label>
                    </div>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <span class="text-[#b5bac1]">#</span>
                        </div>
                        <input type="text" id="channel-name" name="name" 
                              class="w-full bg-[#1e1f22] border border-[#1a1b1e] rounded-[3px] pl-8 pr-3 py-2 text-white focus:outline-none focus:border-[#5865f2] text-sm" 
                              placeholder="new-channel" required>
                    </div>
                    <p class="text-xs text-[#949ba4] mt-1">Use lowercase letters, numbers, hyphens, and underscores</p>
                </div>
                
                <div class="mb-4">
                    <div class="flex items-center gap-2">
                        <div class="relative">
                            <input type="checkbox" id="is-private" name="is_private" 
                                class="absolute w-4 h-4 opacity-0 cursor-pointer peer">
                            <div class="w-5 h-5 bg-[#1e1f22] border border-[#1a1b1e] rounded peer-checked:bg-[#5865f2] peer-checked:border-[#5865f2] transition-all peer-focus:ring-2 peer-focus:ring-[#5865f2]/25">
                                <svg class="w-5 h-5 text-white opacity-0 peer-checked:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                        </div>
                        <div class="flex items-center gap-1">
                            <label for="is-private" class="text-sm text-[#dbdee1] cursor-pointer">Private Channel</label>
                            <div class="group relative">
                                <span class="text-[#949ba4] cursor-help">
                                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                                    </svg>
                                </span>
                                <div class="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 invisible group-hover:visible bg-black text-white text-xs p-2 rounded w-48">
                                    Only specific members will be able to view this channel
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            
                <!-- Footer -->
                <div class="bg-[#2b2d31] mt-4 -mx-4 -mb-4 px-4 py-3 flex justify-end gap-3">
                    <button type="button" id="cancel-create-channel" class="px-3 py-2 text-sm font-medium text-[#dbdee1] hover:underline">
                        Cancel
                    </button>
                    <button type="submit" class="bg-[#5865f2] hover:bg-[#4752c4] text-white text-sm font-medium px-4 py-2 rounded-[3px] transition-colors">
                        Create Channel
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Create Category Modal -->
<div id="create-category-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 hidden animate-fade-in">
    <div class="w-full max-w-md transform transition-all">
        <div class="bg-[#313338] modal-content rounded-md shadow-xl overflow-hidden">
            <!-- Header -->
            <div class="px-4 py-3 border-b border-[#232428] flex justify-between items-center">
                <h2 class="text-[#f2f3f5] text-base font-semibold">Create Category</h2>
                <button id="close-create-category-modal" class="text-[#b5bac1] hover:text-white" aria-label="Close">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            
            <!-- Content -->
            <form id="create-category-form" action="/api/categories" method="POST" onsubmit="return submitCategoryForm(event)" class="p-4">
                <input type="hidden" name="server_id" value="<?php echo $serverId; ?>">
                <input type="hidden" name="position" id="category-position" value="">
                <input type="hidden" name="ajax_fallback" id="category-ajax-fallback" value="false">
                
                <div class="mb-4">
                    <div class="flex items-center justify-between mb-2">
                        <label for="category-name" class="text-xs font-bold text-[#b5bac1]">CATEGORY NAME</label>
                    </div>
                    <input type="text" id="category-name" name="name" 
                          class="w-full bg-[#1e1f22] border border-[#1a1b1e] rounded-[3px] px-3 py-2 text-white focus:outline-none focus:border-[#5865f2] text-sm" 
                          placeholder="NEW CATEGORY" required>
                    <p class="text-xs text-[#949ba4] mt-1">Category names are typically displayed in uppercase</p>
                </div>
                
                <!-- Footer -->
                <div class="bg-[#2b2d31] mt-4 -mx-4 -mb-4 px-4 py-3 flex justify-end gap-3">
                    <button type="button" id="cancel-create-category" class="px-3 py-2 text-sm font-medium text-[#dbdee1] hover:underline">
                        Cancel
                    </button>
                    <button type="submit" class="bg-[#5865f2] hover:bg-[#4752c4] text-white text-sm font-medium px-4 py-2 rounded-[3px] transition-colors">
                        Create Category
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Invite People Modal -->
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

<!-- Server Settings Modal -->
<div id="server-settings-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 hidden">
    <div class="w-full max-w-lg">
        <div class="bg-discord-background rounded-lg shadow-lg overflow-hidden">
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-bold text-white">Server Settings</h2>
                    <button id="close-server-settings-modal" class="text-gray-400 hover:text-white">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <form id="server-settings-form" class="space-y-4">
                    <div>
                        <label for="settings-server-name" class="block text-sm font-medium text-gray-300 mb-1">
                            SERVER NAME <span class="text-discord-red">*</span>
                        </label>
                        <input type="text" id="settings-server-name" name="name" 
                               class="w-full bg-discord-dark border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-discord-primary"
                               placeholder="Enter server name" required>
                    </div>
                    
                    <div>
                        <label for="settings-server-description" class="block text-sm font-medium text-gray-300 mb-1">
                            SERVER DESCRIPTION
                        </label>
                        <textarea id="settings-server-description" name="description" rows="3"
                                  class="w-full bg-discord-dark border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-discord-primary resize-none"
                                  placeholder="What's this server about?"></textarea>
                    </div>
                    
                    <div class="flex items-center">
                        <input type="checkbox" id="settings-server-public" name="is_public" value="1" 
                               class="h-4 w-4 accent-discord-primary bg-discord-dark border-gray-700">
                        <label for="settings-server-public" class="ml-2 text-sm text-gray-300">Make this server public</label>
                    </div>
                    
                    <div class="pt-4 flex space-x-3">
                        <button type="button" id="cancel-server-settings" 
                                class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded">
                            Cancel
                        </button>
                        <button type="submit" 
                                class="flex-1 bg-discord-primary hover:bg-discord-primary/90 text-white font-medium py-2 px-4 rounded">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<!-- Notification Settings Modal -->
<div id="notification-settings-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 hidden">
    <div class="w-full max-w-md">
        <div class="bg-discord-background rounded-lg shadow-lg overflow-hidden">
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-bold text-white">Notification Settings</h2>
                    <button id="close-notification-settings-modal" class="text-gray-400 hover:text-white">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <form id="notification-settings-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">SERVER NOTIFICATIONS</label>
                        <div class="space-y-2">
                            <label class="flex items-center p-3 border border-gray-700 rounded cursor-pointer hover:bg-discord-dark">
                                <input type="radio" name="notification_type" value="all_messages" 
                                       class="mr-3 accent-discord-primary">
                                <div>
                                    <div class="text-white font-medium">All Messages</div>
                                    <div class="text-gray-400 text-sm">You'll be notified when anyone sends a message</div>
                                </div>
                            </label>
                            <label class="flex items-center p-3 border border-gray-700 rounded cursor-pointer hover:bg-discord-dark">
                                <input type="radio" name="notification_type" value="mentions_only" checked 
                                       class="mr-3 accent-discord-primary">
                                <div>
                                    <div class="text-white font-medium">Only @mentions</div>
                                    <div class="text-gray-400 text-sm">You'll only be notified when someone mentions you</div>
                                </div>
                            </label>
                            <label class="flex items-center p-3 border border-gray-700 rounded cursor-pointer hover:bg-discord-dark">
                                <input type="radio" name="notification_type" value="muted" 
                                       class="mr-3 accent-discord-primary">
                                <div>
                                    <div class="text-white font-medium">Nothing</div>
                                    <div class="text-gray-400 text-sm">You won't receive any notifications</div>
                                </div>
                            </label>
                        </div>
                    </div>
                    
                    <div class="space-y-3">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-white font-medium">Suppress @everyone and @here</div>
                                <div class="text-gray-400 text-sm">Don't notify me for @everyone or @here mentions</div>
                            </div>
                            <input type="checkbox" id="suppress-everyone" name="suppress_everyone" 
                                   class="h-4 w-4 accent-discord-primary bg-discord-dark border-gray-700">
                        </div>
                        
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-white font-medium">Suppress Role @mentions</div>
                                <div class="text-gray-400 text-sm">Don't notify me when roles I have are mentioned</div>
                            </div>
                            <input type="checkbox" id="suppress-roles" name="suppress_roles" 
                                   class="h-4 w-4 accent-discord-primary bg-discord-dark border-gray-700">
                        </div>
                    </div>
                    
                    <div class="pt-4 flex space-x-3">
                        <button type="button" id="cancel-notification-settings" 
                                class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded">
                            Cancel
                        </button>
                        <button type="submit" 
                                class="flex-1 bg-discord-primary hover:bg-discord-primary/90 text-white font-medium py-2 px-4 rounded">
                            Save Settings
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<!-- Edit Per-server Profile Modal -->
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
                
                <form id="edit-profile-form" class="space-y-4">
                    <div>
                        <label for="profile-nickname" class="block text-sm font-medium text-gray-300 mb-1">
                            NICKNAME
                        </label>
                        <input type="text" id="profile-nickname" name="nickname" 
                               class="w-full bg-discord-dark border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-discord-primary"
                               placeholder="Enter nickname (leave empty to use global username)">
                        <div class="text-xs text-gray-400 mt-1">This nickname will only be visible in this server</div>
                    </div>
                    
                    <div class="pt-4 flex space-x-3">
                        <button type="button" id="cancel-edit-profile" 
                                class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded">
                            Cancel
                        </button>
                        <button type="submit" 
                                class="flex-1 bg-discord-primary hover:bg-discord-primary/90 text-white font-medium py-2 px-4 rounded">
                            Save Profile
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<!-- Leave Server Confirmation Modal -->
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

<!-- Toast Notification Container -->
<div id="toast-container" class="fixed top-4 right-4 z-50 space-y-2"></div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Add keydown event listener for Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeActiveModals();
        }
    });

    // Close all active modals
    function closeActiveModals() {
        const openModals = document.querySelectorAll('.fixed.inset-0:not(.hidden)');
        openModals.forEach(modal => {
            if (modal.id === 'create-channel-modal') closeCreateChannelModal();
            if (modal.id === 'create-category-modal') closeCreateCategoryModal();
            // Add other modals here as needed
        });
    }

    // Channel Modal Event Handlers
    const createChannelModal = document.getElementById('create-channel-modal');
    const closeChannelBtn = document.getElementById('close-create-channel-modal');
    const cancelChannelBtn = document.getElementById('cancel-create-channel');
    
    function closeCreateChannelModal() {
        if (!createChannelModal) return;
        
        // Add fade-out animation
        createChannelModal.classList.add('opacity-0');
        createChannelModal.style.transition = 'opacity 150ms ease-in-out';
        
        // Hide after animation
        setTimeout(() => {
            createChannelModal.classList.add('hidden');
            createChannelModal.classList.remove('opacity-0');
            createChannelModal.style.transition = '';
            
            // Reset form
            const form = createChannelModal.querySelector('form');
            if (form) form.reset();
        }, 150);
    }
    
    if (closeChannelBtn) {
        closeChannelBtn.addEventListener('click', closeCreateChannelModal);
    }
    
    if (cancelChannelBtn) {
        cancelChannelBtn.addEventListener('click', closeCreateChannelModal);
    }
    
    // Close modal when clicking the backdrop
    if (createChannelModal) {
        createChannelModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeCreateChannelModal();
            }
        });
    }
    
    // Category Modal Event Handlers
    const createCategoryModal = document.getElementById('create-category-modal');
    const closeCategoryBtn = document.getElementById('close-create-category-modal');
    const cancelCategoryBtn = document.getElementById('cancel-create-category');
    
    function closeCreateCategoryModal() {
        if (!createCategoryModal) return;
        
        // Add fade-out animation
        createCategoryModal.classList.add('opacity-0');
        createCategoryModal.style.transition = 'opacity 150ms ease-in-out';
        
        // Hide after animation
        setTimeout(() => {
            createCategoryModal.classList.add('hidden');
            createCategoryModal.classList.remove('opacity-0');
            createCategoryModal.style.transition = '';
            
            // Reset form
            const form = createCategoryModal.querySelector('form');
            if (form) form.reset();
        }, 150);
    }
    
    if (closeCategoryBtn) {
        closeCategoryBtn.addEventListener('click', closeCreateCategoryModal);
    }
    
    if (cancelCategoryBtn) {
        cancelCategoryBtn.addEventListener('click', closeCreateCategoryModal);
    }
    
    // Close modal when clicking the backdrop
    if (createCategoryModal) {
        createCategoryModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeCreateCategoryModal();
            }
        });
    }
    
    // Prevent form clicks from bubbling to backdrop
    document.querySelectorAll('.modal-content').forEach(modal => {
        modal.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    });
    
    // Global functions for opening modals
    window.openCreateChannelModal = function(categoryId = null, position = null) {
        // Reset the form
        const form = createChannelModal.querySelector('form');
        if (form) form.reset();
        
        // Set category if provided
        if (categoryId) {
            const categoryInput = document.getElementById('category-id');
            if (categoryInput) {
                categoryInput.value = categoryId;
            }
        } else {
            // Clear category
            const categoryInput = document.getElementById('category-id');
            if (categoryInput) {
                categoryInput.value = '';
            }
        }
        
        // Set position if provided
        if (position !== null) {
            const positionInput = document.getElementById('channel-position');
            if (positionInput) {
                positionInput.value = position;
            }
        } else {
            // Clear position
            const positionInput = document.getElementById('channel-position');
            if (positionInput) {
                positionInput.value = '';
            }
        }
        
        // Show modal with fade-in
        createChannelModal.classList.remove('hidden');
        
        // Focus the channel name input
        setTimeout(() => {
            const nameInput = document.getElementById('channel-name');
            if (nameInput) nameInput.focus();
        }, 100);
    };
    
    window.closeCreateChannelModal = closeCreateChannelModal;
    
    window.openCreateCategoryModal = function(position = null) {
        // Reset the form
        const form = createCategoryModal.querySelector('form');
        if (form) form.reset();
        
        // Set position if provided
        if (position !== null) {
            const positionInput = document.getElementById('category-position');
            if (positionInput) {
                positionInput.value = position;
            }
        } else {
            // Clear position
            const positionInput = document.getElementById('category-position');
            if (positionInput) {
                positionInput.value = '';
            }
        }
        
        // Show modal with fade-in
        createCategoryModal.classList.remove('hidden');
        
        // Focus the category name input
        setTimeout(() => {
            const nameInput = document.getElementById('category-name');
            if (nameInput) nameInput.focus();
        }, 100);
    };
    
    window.closeCreateCategoryModal = closeCreateCategoryModal;
    
    // Format channel name to be URL-friendly
    const channelNameInput = document.getElementById('channel-name');
    if (channelNameInput) {
        channelNameInput.addEventListener('input', function() {
            // Convert to lowercase and replace spaces with hyphens
            let value = this.value.toLowerCase();
            value = value.replace(/\s+/g, '-');
            // Remove any character that isn't lowercase letter, number, hyphen, or underscore
            value = value.replace(/[^a-z0-9\-_]/g, '');
            this.value = value;
        });
    }
    
    // AJAX form submission for Channel
    window.submitChannelForm = function(event) {
        event.preventDefault();
        console.log("Channel form submission started");
        
        const form = document.getElementById('create-channel-form');
        const formData = new FormData(form);
        
        // Handle empty values for integer fields
        const positionField = document.getElementById('channel-position');
        const categoryField = document.getElementById('category-id');
        
        // Handle position - make sure we use null instead of empty string
        if (positionField && (positionField.value === '' || positionField.value === null)) {
            formData.set('position', null);
        }
        
        // Handle category - make sure we use null instead of empty string
        if (categoryField && (categoryField.value === '' || categoryField.value === null)) {
            // Remove the category_id field entirely rather than setting it to "null"
            formData.delete('category_id');
            console.log("Removed category_id field from form data");
        } else {
            console.log("Using category_id:", categoryField ? categoryField.value : 'categoryField not found');
        }
        
        // Show loading state
        const submitBtn = form.querySelector('[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<svg class="animate-spin h-5 w-5 mr-2 inline" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Creating...';
        }
        
        try {
            // Make sure the type value is properly formatted as a string
            const typeInput = form.querySelector('[name="type"]');
            if (typeInput && typeInput.value) {
                // Ensure type is a string value
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
                
                // First capture the raw text of the response for debugging
                return response.text().then(rawText => {
                    console.log("Raw response:", rawText.substring(0, 300) + (rawText.length > 300 ? '...' : ''));
                    
                    // If response status is not ok, handle error appropriately
                    if (!response.ok) {
                        console.warn("Server returned error status:", response.status);
                        
                        try {
                            // Try to parse as JSON first
                            const errorData = JSON.parse(rawText);
                            console.error("Server error details:", errorData);
                            
                            // Show error message from server if available
                            if (errorData && errorData.message) {
                                if (typeof showToast === 'function') {
                                    showToast(errorData.message, 'error');
                                }
                                // Reset button state
                                if (submitBtn) {
                                    submitBtn.disabled = false;
                                    submitBtn.innerHTML = 'Create Channel';
                                }
                                return { success: false, message: errorData.message };
                            }
                        } catch (parseError) {
                            // If it's not JSON, it could be HTML error page
                            console.error("Failed to parse error response:", parseError);
                            
                            // For server errors, attempt fallback
                            if (response.status >= 500) {
                                return submitFormDirectly('create-channel-form');
                            }
                        }
                    }
                    
                    try {
                        // Try to parse as JSON
                        const data = JSON.parse(rawText);
                        return data;
                    } catch (e) {
                        console.error("Failed to parse JSON:", e);
                        // If this is HTML, it could be a PHP error
                        if (rawText.includes("</html>") || rawText.includes("<br />")) {
                            console.error("Server returned HTML instead of JSON. Possible PHP error.");
                            
                            // Try direct submission
                            return submitFormDirectly('create-channel-form');
                        }
                        throw new Error("Invalid response format from server");
                    }
                });
            })
            .then(data => {
                // If the data is true, it means we triggered the fallback
                if (data === true) {
                    return; // Let the fallback handle it
                }
                
                // Check for error response
                if (!data || data.success === false) {
                    const errorMsg = (data && data.message) ? data.message : 'Error creating channel';
                    console.error("Error from API:", errorMsg);
                    
                    if (typeof showToast === 'function') {
                        showToast(errorMsg, 'error');
                    }
                    
                    // Reset button state
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
                    
                    // Show success message
                    if (typeof showToast === 'function') {
                        showToast('Channel created successfully', 'success');
                    }
                    
                    // Handle redirect or page reload with safety checks
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
                        // Final fallback - just reload
                        setTimeout(function() {
                            window.location.reload();
                        }, 1000);
                    }
                } else {
                    // Reset button state
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
                
                // Reset button state
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Create Channel';
                }
                
                // For serious errors, fallback to traditional form submission
                submitFormDirectly('create-channel-form');
            });
        } catch (outerError) {
            console.error('Critical error in form submission:', outerError);
            
            // Reset button state
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Create Channel';
            }
            
            // Fallback to traditional form submission
            submitFormDirectly('create-channel-form');
        }
        
        // Return false to prevent traditional form submission
        return false;
    };
    
    // AJAX form submission for Category
    window.submitCategoryForm = function(event) {
        event.preventDefault();
        console.log("Category form submission started");
        
        const form = document.getElementById('create-category-form');
        const formData = new FormData(form);
        
        // Handle empty values for integer fields
        const positionField = document.getElementById('category-position');
        
        // Handle position - make sure we use null instead of empty string
        if (positionField && (positionField.value === '' || positionField.value === null)) {
            formData.set('position', null);
        }
        
        // Show loading state
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
                
                // First capture the raw text of the response for debugging
                return response.text().then(rawText => {
                    console.log("Raw response:", rawText.substring(0, 300) + (rawText.length > 300 ? '...' : ''));
                    
                    // If response status is not ok, handle error appropriately
                    if (!response.ok) {
                        console.warn("Server returned error status:", response.status);
                        
                        try {
                            // Try to parse as JSON first
                            const errorData = JSON.parse(rawText);
                            console.error("Server error details:", errorData);
                            
                            // Show error message from server if available
                            if (errorData && errorData.message) {
                                if (typeof showToast === 'function') {
                                    showToast(errorData.message, 'error');
                                }
                                // Reset button state
                                if (submitBtn) {
                                    submitBtn.disabled = false;
                                    submitBtn.innerHTML = 'Create Category';
                                }
                                return { success: false, message: errorData.message };
                            }
                        } catch (parseError) {
                            // If it's not JSON, it could be HTML error page
                            console.error("Failed to parse error response:", parseError);
                            
                            // For server errors, attempt fallback
                            if (response.status >= 500) {
                                return submitFormDirectly('create-category-form');
                            }
                        }
                    }
                    
                    try {
                        // Try to parse as JSON
                        const data = JSON.parse(rawText);
                        return data;
                    } catch (e) {
                        console.error("Failed to parse JSON:", e);
                        // If this is HTML, it could be a PHP error
                        if (rawText.includes("</html>") || rawText.includes("<br />")) {
                            console.error("Server returned HTML instead of JSON. Possible PHP error.");
                            
                            // Try direct submission
                            return submitFormDirectly('create-category-form');
                        }
                        throw new Error("Invalid response format from server");
                    }
                });
            })
            .then(data => {
                // If the data is true, it means we triggered the fallback
                if (data === true) {
                    return; // Let the fallback handle it
                }
                
                // Check for error response
                if (!data || data.success === false) {
                    const errorMsg = (data && data.message) ? data.message : 'Error creating category';
                    console.error("Error from API:", errorMsg);
                    
                    if (typeof showToast === 'function') {
                        showToast(errorMsg, 'error');
                    }
                    
                    // Reset button state
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
                    
                    // Show success message
                    if (typeof showToast === 'function') {
                        showToast('Category created successfully', 'success');
                    }
                    
                    // Handle redirect or page reload with safety checks
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
                        // Final fallback - just reload
                        setTimeout(function() {
                            window.location.reload();
                        }, 1000);
                    }
                } else {
                    // Reset button state
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
                
                // Reset button state
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Create Category';
                }
                
                // For serious errors, fallback to traditional form submission
                submitFormDirectly('create-category-form');
            });
        } catch (outerError) {
            console.error('Critical error in form submission:', outerError);
            
            // Reset button state
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Create Category';
            }
            
            // Fallback to traditional form submission
            submitFormDirectly('create-category-form');
        }
        
        // Return false to prevent traditional form submission
        return false;
    };
    
    // Fallback submission function - non-AJAX direct submit
    window.submitFormDirectly = function(formId) {
        console.log("Attempting direct form submission for", formId);
        const form = document.getElementById(formId);
        if (form) {
            // Set flag to indicate this is a fallback submission
            const fallbackField = form.querySelector('[name="ajax_fallback"]');
            if (fallbackField) {
                fallbackField.value = "true";
            }
            
            // Submit the form directly
            form.submit();
            return true;
        }
        return false;
    };

    // Log debug info to help diagnose redirect issues
    console.log("Modal scripts initialized");
});
</script>
