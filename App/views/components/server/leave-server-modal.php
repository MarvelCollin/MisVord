<?php
?>
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
                    <button id="cancel-leave-server" class="cancel-button">
                        Cancel
                    </button>
                    <button id="confirm-leave-server" class="confirm-button">
                        Leave Server
                    </button>
                </div>
            </div>

            
            <div id="leave-server-owner-view" class="hidden">
                
                <div id="leave-server-transfer-view">
                    <div class="text-center mb-5">
                        <div class="bg-discord-blurple bg-opacity-10 text-discord-blurple inline-block p-3 rounded-full mb-3">
                            <i class="fas fa-crown h-8 w-8"></i>
                        </div>
                        <h3 class="text-xl font-semibold text-white mb-2">You are the Server Owner</h3>
                        <p class="text-discord-lighter">You must transfer ownership to another member before you can leave.</p>
                    </div>
                    
                    <div class="mb-5">
                        <label for="owner-transfer-user-search" class="block text-sm font-medium text-discord-lighter mb-2 uppercase">SEARCH FOR A MEMBER</label>
                        <div class="search-input-wrapper">
                            <i class="fas fa-search"></i>
                            <input type="text" id="owner-transfer-user-search" class="search-input" placeholder="Search by username...">
                        </div>
                        <div id="owner-transfer-users-container" class="mt-2 bg-discord-dark-hover rounded-md shadow-lg max-h-48 overflow-y-auto hidden"></div>
                    </div>

                    <div id="owner-transfer-selected-user-container" class="mb-5 hidden">
                        <label class="block text-sm font-medium text-discord-lighter mb-2 uppercase">Selected Member</label>
                        <div class="bg-discord-dark-hover rounded-md p-3 flex items-center border border-discord-dark-input">
                            <div id="owner-transfer-selected-user-avatar-container" class="w-10 h-10 rounded-full mr-3 bg-gray-700 overflow-hidden">
                                <img id="owner-transfer-selected-user-avatar" class="w-10 h-10 rounded-full mr-3" src="/public/assets/common/default-profile-picture.png">
                            </div>
                            <div class="flex-grow">
                                <div class="text-white font-medium" id="owner-transfer-selected-user-name"></div>
                                <div class="text-discord-lighter text-sm" id="owner-transfer-selected-user-role">Will become the new server owner</div>
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-end items-center space-x-3 mt-6">
                        <button id="cancel-owner-leave" class="cancel-button">
                            Cancel
                        </button>
                        <button id="confirm-owner-transfer" class="confirm-button opacity-50 cursor-not-allowed" disabled>
                            Transfer Ownership & Leave
                        </button>
                    </div>
                </div>

                
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
                        <button id="cancel-delete-leave" class="cancel-button">
                            Cancel
                        </button>
                        <button id="confirm-delete-leave" class="confirm-button">
                            Delete Server & Leave
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div> 