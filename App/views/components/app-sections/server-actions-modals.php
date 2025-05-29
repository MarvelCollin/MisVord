<?php
// Server Actions Modals Component
// This component contains all the modals for server dropdown actions
?>

<!-- Invite People Modal -->
<div id="invite-people-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 hidden">
    <div class="w-full max-w-md">
        <div class="bg-discord-background rounded-lg shadow-lg overflow-hidden">
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-bold text-white">Invite People</h2>
                    <button id="close-invite-modal" class="text-gray-400 hover:text-white">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="space-y-4">
                    <div class="text-center">
                        <p class="text-gray-400 mb-4">Share this link with others to grant access to this server</p>
                    </div>
                    
                    <div class="flex">
                        <input type="text" id="invite-link" readonly 
                               class="flex-1 bg-discord-dark border border-gray-700 rounded-l px-3 py-2 text-white text-sm font-mono"
                               placeholder="Generating invite link...">
                        <button id="copy-invite-link" 
                                class="bg-discord-primary hover:bg-discord-primary/90 text-white px-4 py-2 rounded-r border border-discord-primary">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                    
                    <div class="text-center">
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

<!-- Create Channel Modal -->
<div id="create-channel-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 hidden">
    <div class="w-full max-w-md">
        <div class="bg-discord-background rounded-lg shadow-lg overflow-hidden">
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-bold text-white">Create Channel</h2>
                    <button id="close-create-channel-modal" class="text-gray-400 hover:text-white">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <form id="create-channel-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">CHANNEL TYPE</label>
                        <div class="space-y-2">
                            <label class="flex items-center p-3 border border-gray-700 rounded cursor-pointer hover:bg-discord-dark">
                                <input type="radio" name="channel_type" value="text" checked 
                                       class="mr-3 accent-discord-primary">
                                <div class="flex items-center">
                                    <i class="fas fa-hashtag text-gray-400 mr-2"></i>
                                    <div>
                                        <div class="text-white font-medium">Text</div>
                                        <div class="text-gray-400 text-sm">Send messages, images, GIFs, emoji, opinions, and puns</div>
                                    </div>
                                </div>
                            </label>
                            <label class="flex items-center p-3 border border-gray-700 rounded cursor-pointer hover:bg-discord-dark">
                                <input type="radio" name="channel_type" value="voice" 
                                       class="mr-3 accent-discord-primary">
                                <div class="flex items-center">
                                    <i class="fas fa-volume-up text-gray-400 mr-2"></i>
                                    <div>
                                        <div class="text-white font-medium">Voice</div>
                                        <div class="text-gray-400 text-sm">Hang out together with voice, video, and screen share</div>
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>
                    
                    <div>
                        <label for="channel-name" class="block text-sm font-medium text-gray-300 mb-1">
                            CHANNEL NAME <span class="text-discord-red">*</span>
                        </label>
                        <input type="text" id="channel-name" name="name" 
                               class="w-full bg-discord-dark border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-discord-primary"
                               placeholder="new-channel" required>
                        <div class="text-xs text-gray-400 mt-1">Only lowercase letters, numbers, hyphens, and underscores allowed</div>
                    </div>
                    
                    <div class="flex items-center">
                        <input type="checkbox" id="channel-private" name="is_private" value="1" 
                               class="h-4 w-4 accent-discord-primary bg-discord-dark border-gray-700">
                        <label for="channel-private" class="ml-2 text-sm text-gray-300">
                            <i class="fas fa-lock mr-1"></i>
                            Private Channel
                        </label>
                    </div>
                    
                    <div class="pt-4 flex space-x-3">
                        <button type="button" id="cancel-create-channel" 
                                class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded">
                            Cancel
                        </button>
                        <button type="submit" 
                                class="flex-1 bg-discord-primary hover:bg-discord-primary/90 text-white font-medium py-2 px-4 rounded">
                            Create Channel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<!-- Create Category Modal -->
<div id="create-category-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 hidden">
    <div class="w-full max-w-md">
        <div class="bg-discord-background rounded-lg shadow-lg overflow-hidden">
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-bold text-white">Create Category</h2>
                    <button id="close-create-category-modal" class="text-gray-400 hover:text-white">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <form id="create-category-form" class="space-y-4">
                    <div>
                        <label for="category-name" class="block text-sm font-medium text-gray-300 mb-1">
                            CATEGORY NAME <span class="text-discord-red">*</span>
                        </label>
                        <input type="text" id="category-name" name="name" 
                               class="w-full bg-discord-dark border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-discord-primary"
                               placeholder="New Category" required>
                    </div>
                    
                    <div class="pt-4 flex space-x-3">
                        <button type="button" id="cancel-create-category" 
                                class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded">
                            Cancel
                        </button>
                        <button type="submit" 
                                class="flex-1 bg-discord-primary hover:bg-discord-primary/90 text-white font-medium py-2 px-4 rounded">
                            Create Category
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
