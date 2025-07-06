<?php
?>
<!-- Leave Server Modal (Unified) -->
<div id="leave-server-modal" class="fixed inset-0 flex items-center justify-center hidden z-50">
    <div class="absolute inset-0 bg-black bg-opacity-70"></div>
    
    <div class="bg-discord-dark max-w-md w-full rounded-lg z-10 transform transition-transform duration-200 scale-95">
        <div class="p-6">
            <div class="flex justify-between items-center mb-4">
                <h2 id="leave-server-modal-title" class="text-xl font-bold text-white">Leave Server</h2>
                <button id="close-leave-server-modal" class="text-discord-lighter hover:text-white p-1">
                    <i class="fas fa-times h-5 w-5"></i>
                </button>
            </div>
            
            <!-- Member View -->
            <div id="leave-server-member-view">
                <div class="text-center mb-5">
                    <div class="bg-discord-red bg-opacity-10 text-discord-red inline-block p-3 rounded-full mb-3">
                        <i class="fas fa-exclamation-triangle h-8 w-8"></i>
                    </div>
                    <h3 class="text-xl font-semibold text-white mb-2">Leave '<span class="server-name-to-confirm"></span>'</h3>
                    <p class="text-discord-lighter mb-2">Are you sure you want to leave <strong class="server-name-to-confirm"></strong>?</p>
                    <p class="text-discord-red text-sm font-medium">You won't be able to rejoin unless invited back.</p>
                </div>
                <div class="flex justify-end items-center space-x-3">
                    <button id="cancel-leave-server" class="px-4 py-2 text-white bg-discord-dark-hover hover:bg-discord-dark-input rounded transition-colors">
                        Cancel
                    </button>
                    <button id="confirm-leave-server" class="px-4 py-2 text-white bg-discord-red hover:bg-red-700 rounded transition-colors">
                        Leave Server
                    </button>
                </div>
            </div>

            <!-- Owner View -->
            <div id="leave-server-owner-view" class="hidden">
                <!-- Transfer Ownership Section -->
                <div id="leave-server-transfer-view">
                    <div class="text-center mb-5">
                        <div class="bg-discord-blurple bg-opacity-10 text-discord-blurple inline-block p-3 rounded-full mb-3">
                            <i class="fas fa-crown h-8 w-8"></i>
                        </div>
                        <h3 class="text-xl font-semibold text-white mb-2">You are the Server Owner</h3>
                        <p class="text-discord-lighter">You must transfer ownership to another member before you can leave.</p>
                    </div>
                    
                    <!-- Skeleton loading for member list -->
                    <div id="owner-transfer-skeleton" class="mb-5">
                        <div class="text-sm font-medium text-discord-lighter mb-1 uppercase">Eligible Members</div>
                        <div class="bg-discord-dark-hover rounded p-1">
                            <div class="p-2 flex items-center">
                                <div class="w-8 h-8 rounded-full bg-discord-dark-input mr-2 skeleton-item"></div>
                                <div class="flex-grow">
                                    <div class="h-4 bg-discord-dark-input rounded w-3/4 skeleton-item"></div>
                                </div>
                            </div>
                            <div class="p-2 flex items-center">
                                <div class="w-8 h-8 rounded-full bg-discord-dark-input mr-2 skeleton-item"></div>
                                <div class="flex-grow">
                                    <div class="h-4 bg-discord-dark-input rounded w-3/4 skeleton-item"></div>
                                </div>
                            </div>
                            <div class="p-2 flex items-center">
                                <div class="w-8 h-8 rounded-full bg-discord-dark-input mr-2 skeleton-item"></div>
                                <div class="flex-grow">
                                    <div class="h-4 bg-discord-dark-input rounded w-3/4 skeleton-item"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- List of eligible members -->
                    <div class="mb-5 hidden">
                        <div class="text-sm font-medium text-discord-lighter mb-1 uppercase">Eligible Members</div>
                        <div id="eligible-members-list" class="bg-discord-dark-hover rounded max-h-36 overflow-y-auto">
                            <!-- Members will be populated here by JS -->
                        </div>
                    </div>
                    
                    <div class="mb-5">
                        <label for="owner-transfer-user-search" class="block text-sm font-medium text-discord-lighter mb-1 uppercase">Search for a member</label>
                        <div class="relative">
                            <input type="text" id="owner-transfer-user-search" class="form-input bg-discord-dark-input text-white w-full rounded mb-1 pl-8" placeholder="Search by username...">
                            <div class="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-discord-lighter">
                                <i class="fas fa-search"></i>
                            </div>
                        </div>
                        <div id="owner-transfer-users-container" class="bg-discord-dark-hover rounded mt-2 max-h-36 overflow-y-auto hidden">
                            <!-- Users will be populated here by JS -->
                        </div>
                        <div id="owner-transfer-users-loading" class="bg-discord-dark-hover rounded mt-2 max-h-36 overflow-y-auto hidden">
                            <!-- Skeleton loading -->
                            <div class="p-2 flex items-center">
                                <div class="w-8 h-8 rounded-full bg-discord-dark-input mr-2 skeleton-item"></div>
                                <div class="flex-grow">
                                    <div class="h-4 bg-discord-dark-input rounded w-3/4 skeleton-item"></div>
                                </div>
                            </div>
                            <div class="p-2 flex items-center">
                                <div class="w-8 h-8 rounded-full bg-discord-dark-input mr-2 skeleton-item"></div>
                                <div class="flex-grow">
                                    <div class="h-4 bg-discord-dark-input rounded w-3/4 skeleton-item"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="owner-transfer-selected-user-container" class="mb-5 hidden">
                        <label class="block text-sm font-medium text-discord-lighter mb-1 uppercase">Selected User</label>
                        <div class="bg-discord-dark-hover rounded p-3 flex items-center border border-discord-dark-input">
                            <img id="owner-transfer-selected-user-avatar" class="w-12 h-12 rounded-full mr-3">
                            <div class="flex-grow">
                                <div class="text-white font-medium text-lg" id="owner-transfer-selected-user-name"></div>
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-end items-center space-x-3">
                        <button id="cancel-owner-leave" class="px-4 py-2 text-white bg-discord-dark-hover hover:bg-discord-dark-input rounded transition-colors">
                            Cancel
                        </button>
                        <button id="confirm-owner-transfer" class="px-4 py-2 text-white bg-discord-blurple hover:bg-discord-blurple-hover rounded transition-colors cursor-not-allowed opacity-50" disabled>
                            Transfer Ownership & Leave
                        </button>
                    </div>
                </div>

                <!-- Delete Server View (when owner is last member) -->
                <div id="leave-server-delete-view" class="hidden">
                     <div class="text-center mb-5">
                        <div class="bg-discord-red bg-opacity-10 text-discord-red inline-block p-3 rounded-full mb-3">
                            <i class="fas fa-trash-alt h-8 w-8"></i>
                        </div>
                        <h3 class="text-xl font-semibold text-white mb-2">Delete Server</h3>
                        <p class="text-discord-lighter">You are the last member. Leaving the server will delete it permanently.</p>
                        <p class="text-discord-red text-sm font-medium mt-2">This action cannot be undone.</p>
                    </div>
                    <div class="flex justify-end items-center space-x-3">
                        <button id="cancel-delete-leave" class="px-4 py-2 text-white bg-discord-dark-hover hover:bg-discord-dark-input rounded transition-colors">
                            Cancel
                        </button>
                        <button id="confirm-delete-leave" class="px-4 py-2 text-white bg-discord-red hover:bg-red-700 rounded transition-colors">
                            Delete Server & Leave
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div> 