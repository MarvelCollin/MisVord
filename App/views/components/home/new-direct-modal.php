<div class="modal-backdrop hidden fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center" id="new-direct-modal" style="z-index: 100000;">
    <div class="modal w-full max-w-md mx-4 bg-[#2b2d31] rounded-lg shadow-2xl border border-[#1e1f22]" onclick="event.stopPropagation();">
        <div class="p-4 border-b border-[#1e1f22] bg-[#2b2d31]">
            <div class="flex justify-between items-center">
                <h3 class="text-lg font-semibold text-white" id="modal-title">New Message</h3>
                <button id="close-new-direct-modal" class="text-gray-400 hover:text-white focus:outline-none focus:ring-0">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
        </div>
        <div class="p-4 bg-[#2b2d31]">
            <div class="mb-4">
                <label class="block text-xs text-gray-400 uppercase font-semibold mb-2">Select Users</label>
                <div class="relative">
                    <input type="text" placeholder="Search by username" class="w-full bg-[#1e1f22] text-white rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#5865f2] border border-[#404249]" id="dm-search-input">
                    <i class="fas fa-search absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"></i>
                </div>
            </div>
            
            <div id="dm-selected-users" class="flex flex-wrap gap-2 mb-4 hidden">
                <div class="text-xs text-gray-400 uppercase font-semibold mb-2 w-full">Selected Users:</div>
            </div>

            <div id="group-options" class="mb-4 hidden">
                <div class="mb-3">
                    <label class="block text-xs text-gray-400 uppercase font-semibold mb-2">Group Name</label>
                    <input type="text" placeholder="Enter group name" class="w-full bg-[#1e1f22] text-white rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#5865f2] border border-[#404249]" id="group-name-input">
                </div>
                <div class="mb-3">
                    <label class="block text-xs text-gray-400 uppercase font-semibold mb-2">Group Image (Optional)</label>
                    <input type="url" placeholder="Enter image URL" class="w-full bg-[#1e1f22] text-white rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#5865f2] border border-[#404249]" id="group-image-input">
                </div>
            </div>

            <div id="dm-users-list" class="max-h-60 overflow-y-auto py-2 space-y-2 custom-scrollbar">
                <div class="text-gray-400 text-center py-4 hidden" id="no-dm-users">
                    <i class="fas fa-users text-2xl mb-2"></i>
                    <p>No users found</p>
                </div>
            </div>
        </div>
        <div class="p-4 bg-[#2b2d31] flex justify-end space-x-3 rounded-b-lg border-t border-[#1e1f22]">
            <button class="px-4 py-2 text-white bg-[#4e5058] hover:bg-[#5c5e66] rounded-md transition-colors duration-150" id="cancel-new-direct">
                Cancel
            </button>
            <button class="px-4 py-2 text-white bg-[#5865f2] hover:bg-[#4752c4] rounded-md opacity-50 cursor-not-allowed transition-colors duration-150" id="create-new-direct" disabled>
                Create Message
            </button>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const createButton = document.getElementById('create-new-direct');
    const modal = document.getElementById('new-direct-modal');
    const modalTitle = document.getElementById('modal-title');
    const selectedUsersContainer = document.getElementById('dm-selected-users');
    const groupOptions = document.getElementById('group-options');
    const groupNameInput = document.getElementById('group-name-input');
    const groupImageInput = document.getElementById('group-image-input');
    let selectedUserIds = new Set();
    let allUsers = [];
    let searchTimeout = null;

    function loadAllUsers() {
        const usersList = document.getElementById('dm-users-list');
        const noUsersMsg = document.getElementById('no-dm-users');
        
        if (!usersList) return;
        
        console.log('🔍 loadAllUsers called');
        usersList.innerHTML = generateSkeletonItems(5);
        
        if (!window.userAPI) {
            console.error('❌ window.userAPI not available');
            usersList.innerHTML = '<div class="text-gray-400 text-center py-2">User API not available</div>';
            return;
        }
        
        if (!window.userAPI.getAllUsers) {
            console.error('❌ window.userAPI.getAllUsers method not available');
            usersList.innerHTML = '<div class="text-gray-400 text-center py-2">getAllUsers method not found</div>';
            return;
        }
        
        console.log('🔗 Calling userAPI.getAllUsers()');
        window.userAPI.getAllUsers()
            .then(response => {
                console.log('📥 getAllUsers response:', response);
                usersList.innerHTML = '';
                
                if (response && response.success) {
                    let users = null;
                    let total = 0;
                    
                    if (response.data && response.data.users && Array.isArray(response.data.users)) {
                        users = response.data.users;
                        total = response.data.total || users.length;
                    } else if (response.users && Array.isArray(response.users)) {
                        users = response.users;
                        total = response.total || users.length;
                    }
                    
                    if (users && users.length > 0) {
                        console.log(`✅ Found ${users.length} users`);
                        allUsers = users;
                        renderUsers(allUsers);
                        
                        if (noUsersMsg) {
                            noUsersMsg.classList.add('hidden');
                        }
                    } else {
                        console.warn('⚠️ No users found in response');
                        if (noUsersMsg) {
                            noUsersMsg.classList.remove('hidden');
                        }
                        
                        usersList.innerHTML = '<div class="text-gray-400 text-center py-2">No users found</div>';
                    }
                } else {
                    console.error('❌ Invalid response format:', response);
                    usersList.innerHTML = '<div class="text-gray-400 text-center py-2">Invalid response format</div>';
                }
            })
            .catch(error => {
                console.error('❌ Error loading users:', error);
                usersList.innerHTML = `<div class="text-gray-400 text-center py-2">Failed to load users: ${error.message}</div>`;
            });
    }

    function renderUsers(users) {
        const usersList = document.getElementById('dm-users-list');
        usersList.innerHTML = '';

        users.forEach(user => {
            const statusColor = getStatusColor(user.status || 'offline');
            const statusText = getStatusText(user.status || 'offline');
            
            const userItem = document.createElement('div');
            userItem.className = 'modal-user-item flex items-center p-2 rounded hover:bg-[#35373c] cursor-pointer transition-colors duration-150';
            userItem.setAttribute('data-username', user.username);
            userItem.setAttribute('data-user-id', user.id);
            
            const isSelected = selectedUserIds.has(user.id);
            
            userItem.innerHTML = `
                <div class="flex items-center mr-3">
                    <input type="checkbox" class="user-checkbox mr-3 w-4 h-4 text-[#5865f2] bg-[#1e1f22] border-[#404249] rounded focus:ring-[#5865f2] focus:ring-2" ${isSelected ? 'checked' : ''}>
                </div>
                <div class="relative mr-3">
                    <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                        <img src="${user.avatar_url || '/public/assets/common/default-profile-picture.png'}" 
                             alt="Avatar" class="w-full h-full object-cover">
                    </div>
                    <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#2b2d31] ${statusColor}"></span>
                </div>
                <div>
                    <p class="font-medium text-white">${escapeHtml(user.username)}</p>
                    <p class="text-gray-400 text-sm">${statusText}</p>
                </div>
            `;
            
            const checkbox = userItem.querySelector('.user-checkbox');
            checkbox.addEventListener('change', function() {
                toggleUserSelection(user.id, user.username, this.checked);
            });
            
            usersList.appendChild(userItem);
        });
    }

    function generateSkeletonItems(count) {
        let skeletonHtml = '';
        
        for (let i = 0; i < count; i++) {
            skeletonHtml += `
                <div class="skeleton-item flex items-center p-2">
                    <div class="skeleton skeleton-checkbox mr-3"></div>
                    <div class="skeleton skeleton-avatar mr-3"></div>
                    <div class="flex-1">
                        <div class="skeleton skeleton-text"></div>
                        <div class="skeleton skeleton-text skeleton-text-sm mt-1"></div>
                    </div>
                </div>
            `;
        }
        
        return skeletonHtml;
    }

    function toggleUserSelection(userId, username, isSelected) {
        if (isSelected) {
            selectedUserIds.add(userId);
        } else {
            selectedUserIds.delete(userId);
        }
        
        updateSelectedUsersDisplay();
        updateCreateButton();
        updateModalTitle();
        updateGroupOptions();
    }

    function updateSelectedUsersDisplay() {
        const container = selectedUsersContainer;
        
        if (selectedUserIds.size === 0) {
            container.classList.add('hidden');
            return;
        }
        
        container.classList.remove('hidden');
        
        const selectedUsers = allUsers.filter(user => selectedUserIds.has(user.id));
        const usersHtml = selectedUsers.map(user => `
            <div class="inline-flex items-center bg-[#404249] text-white px-2 py-1 rounded-md text-sm">
                ${escapeHtml(user.username)}
                <button class="ml-2 text-gray-400 hover:text-white" onclick="removeSelectedUser(${user.id})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
        
        container.innerHTML = `
            <div class="text-xs text-gray-400 uppercase font-semibold mb-2 w-full">Selected Users (${selectedUserIds.size}):</div>
            ${usersHtml}
        `;
    }

    function updateCreateButton() {
        if (createButton) {
            const canCreate = selectedUserIds.size > 0;
            createButton.disabled = !canCreate;
            createButton.classList.toggle('opacity-50', !canCreate);
            createButton.classList.toggle('cursor-not-allowed', !canCreate);
        }
    }

    function updateModalTitle() {
        if (modalTitle) {
            if (selectedUserIds.size === 0) {
                modalTitle.textContent = 'New Message';
            } else if (selectedUserIds.size === 1) {
                modalTitle.textContent = 'New Direct Message';
            } else {
                modalTitle.textContent = 'New Group Chat';
            }
        }
    }

    function updateGroupOptions() {
        if (selectedUserIds.size > 1) {
            groupOptions.classList.remove('hidden');
        } else {
            groupOptions.classList.add('hidden');
            groupNameInput.value = '';
            groupImageInput.value = '';
        }
    }

    window.removeSelectedUser = function(userId) {
        selectedUserIds.delete(userId);
        const checkbox = document.querySelector(`[data-user-id="${userId}"] .user-checkbox`);
        if (checkbox) {
            checkbox.checked = false;
        }
        updateSelectedUsersDisplay();
        updateCreateButton();
        updateModalTitle();
        updateGroupOptions();
    };

    function createChat() {
        if (selectedUserIds.size === 0) return;
        
        const userIdsArray = Array.from(selectedUserIds);
        
        let requestData;
        
        if (userIdsArray.length === 1) {
            requestData = { user_id: userIdsArray[0] };
        } else {
            const groupName = groupNameInput.value.trim();
            if (!groupName) {
                if (window.showToast) {
                    window.showToast('Group name is required for group chats', 'error');
                }
                return;
            }
            
            requestData = {
                user_ids: userIdsArray,
                group_name: groupName,
                group_image: groupImageInput.value.trim() || null
            };
        }
        
        fetch('/api/chat/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(requestData)
        })
        .then(response => response.json())
        .then(data => {
            if (modal) {
                modal.classList.add('hidden');
            }
            
            if (data.success && data.data && data.data.room_id) {
                window.location.href = `/home/channels/dm/${data.data.room_id}`;
            } else if (data.error && data.error.includes('already exists')) {
                if (window.showToast) {
                    window.showToast('Conversation already exists', 'info');
                }
            } else {
                if (window.showToast) {
                    window.showToast('Failed to create conversation: ' + (data.message || data.error || 'Unknown error'), 'error');
                }
            }
        })
        .catch(error => {
            console.error('Error creating chat:', error);
            if (window.showToast) {
                window.showToast('Failed to create conversation. Please try again.', 'error');
            }
        });
    }

    function getStatusColor(status) {
        switch (status) {
            case 'online': return 'bg-[#23a559]';
            case 'away': return 'bg-[#f0b232]';
            case 'dnd': return 'bg-[#f23f43]';
            default: return 'bg-[#80848e]';
        }
    }

    function getStatusText(status) {
        switch (status) {
            case 'online': return 'Online';
            case 'away': return 'Away';
            case 'dnd': return 'Do Not Disturb';
            default: return 'Offline';
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    const newDirectMessageBtn = document.getElementById('new-direct-message-btn');
    const closeBtn = document.getElementById('close-new-direct-modal');
    const cancelBtn = document.getElementById('cancel-new-direct');
    const searchInput = document.getElementById('dm-search-input');
    
    if (newDirectMessageBtn && modal) {
        newDirectMessageBtn.addEventListener('click', function() {
            modal.classList.remove('hidden');
            selectedUserIds.clear();
            updateSelectedUsersDisplay();
            updateCreateButton();
            updateModalTitle();
            updateGroupOptions();
            loadAllUsers();
        });
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', function() {
            modal.classList.add('hidden');
        });
    }

    if (cancelBtn && modal) {
        cancelBtn.addEventListener('click', function() {
            modal.classList.add('hidden');
        });
    }

    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.trim();
            
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
            
            searchTimeout = setTimeout(() => {
                if (searchTerm.length >= 2) {
                    performSearch(searchTerm);
                } else if (searchTerm.length === 0) {
                    renderUsers(allUsers);
                }
            }, 300);
        });
    }

    if (createButton) {
        createButton.addEventListener('click', createChat);
    }

    function performSearch(searchTerm) {
        if (!window.userAPI) return;
        
        const usersList = document.getElementById('dm-users-list');
        usersList.innerHTML = generateSkeletonItems(3);
        
        window.userAPI.getAllUsers(searchTerm)
            .then(response => {
                console.log('🔍 Search response:', response);
                usersList.innerHTML = '';
                
                if (response && response.success) {
                    let users = null;
                    
                    if (response.data && response.data.users && Array.isArray(response.data.users)) {
                        users = response.data.users;
                    } else if (response.users && Array.isArray(response.users)) {
                        users = response.users;
                    }
                    
                    if (users && users.length > 0) {
                        console.log(`🔍 Found ${users.length} users matching search`);
                        renderUsers(users);
                    } else {
                        usersList.innerHTML = '<div class="text-gray-400 text-center py-2">No users found</div>';
                    }
                } else {
                    console.error('❌ Search failed:', response);
                    usersList.innerHTML = '<div class="text-gray-400 text-center py-2">Search failed</div>';
                }
            })
            .catch(error => {
                console.error('❌ Search error:', error);
                usersList.innerHTML = '<div class="text-gray-400 text-center py-2">Search error</div>';
            });
    }
});
</script>