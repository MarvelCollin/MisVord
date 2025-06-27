<div class="modal-backdrop hidden fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center" id="new-direct-modal" style="z-index: 100000;">
    <div class="modal w-full max-w-md mx-4 bg-discord-darkest rounded-lg shadow-2xl" onclick="event.stopPropagation();">
        <div class="p-4 border-b border-discord-darker">
            <div class="flex justify-between items-center">
                <h3 class="text-lg font-semibold text-white">New Message</h3>
                <button id="close-new-direct-modal" class="text-gray-400 hover:text-white focus:outline-none focus:ring-0">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
        </div>
        <div class="p-4">
            <div class="mb-4">
                <label class="block text-xs text-gray-400 uppercase font-semibold mb-2">Select a Friend</label>
                <div class="relative">
                    <input type="text" placeholder="Search by username" class="w-full bg-discord-dark text-white rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-discord-primary" id="dm-search-input">
                    <i class="fas fa-search absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"></i>
                </div>
            </div>
            
            <div id="dm-selected-friends" class="flex flex-wrap gap-2 mb-4">
                </div>

            <div id="dm-friends-list" class="max-h-60 overflow-y-auto py-2 space-y-2 custom-scrollbar">
                <!-- Friends will be loaded here dynamically -->
                <div class="text-gray-400 text-center py-4 hidden" id="no-dm-friends">
                    <i class="fas fa-user-friends text-2xl mb-2"></i>
                    <p>No friends found</p>
                </div>
            </div>
        </div>
        <div class="p-4 bg-discord-darker flex justify-end space-x-3 rounded-b-lg">
            <button class="px-4 py-2 text-white bg-gray-600 hover:bg-gray-700 rounded-md transition-colors duration-150" id="cancel-new-direct">
                Cancel
            </button>
            <button class="px-4 py-2 text-white bg-discord-primary hover:bg-discord-primary-dark rounded-md opacity-50 cursor-not-allowed transition-colors duration-150" id="create-new-direct" disabled>
                Create Message
            </button>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const createButton = document.getElementById('create-new-direct');
    const modal = document.getElementById('new-direct-modal');
    let selectedUserId = null;

    function loadFriendsForDM() {
        const friendsList = document.getElementById('dm-friends-list');
        const noFriendsMsg = document.getElementById('no-dm-friends');
        
        if (!friendsList) return;
        
        friendsList.innerHTML = generateSkeletonItems(5);
        if (window.FriendAPI) {
            window.FriendAPI.getFriends()
                .then(friends => {
                    friendsList.innerHTML = '';
                    
                    if (friends && friends.length > 0) {
                        friends.forEach(friend => {
                            const statusColor = getStatusColor(friend.status || 'offline');
                            const statusText = getStatusText(friend.status || 'offline');
                            
                            const friendItem = document.createElement('div');
                            friendItem.className = 'dm-friend-item flex items-center p-2 rounded hover:bg-discord-dark cursor-pointer';
                            friendItem.setAttribute('data-username', friend.username);
                            friendItem.setAttribute('data-user-id', friend.id);
                            
                            friendItem.innerHTML = `
                                <div class="relative mr-3">
                                    <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                        <img src="${friend.avatar_url || '/public/assets/common/default-profile-picture.png'}" 
                                             alt="Avatar" class="w-full h-full object-cover">
                                    </div>
                                    <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-darker ${statusColor}"></span>
                                </div>
                                <div>
                                    <p class="font-medium text-white">${escapeHtml(friend.username)}</p>
                                    <p class="text-gray-400 text-sm">${statusText}</p>
                                </div>
                            `;
                            
                            friendItem.addEventListener('click', function() {
                                selectFriendForDM(this);
                            });
                            
                            friendsList.appendChild(friendItem);
                        });
                        
                        if (noFriendsMsg) {
                            noFriendsMsg.classList.add('hidden');
                        }
                    } else {
                        if (noFriendsMsg) {
                            noFriendsMsg.classList.remove('hidden');
                        }
                    }
                })
                .catch(error => {
                    console.error('Error loading friends:', error);
                    friendsList.innerHTML = '<div class="text-gray-400 text-center py-2">Failed to load friends</div>';
                });
        } else {
            friendsList.innerHTML = '<div class="text-gray-400 text-center py-2">Friend API not available</div>';
        }
    }

    function generateSkeletonItems(count) {
        let skeletonHtml = '';
        
        for (let i = 0; i < count; i++) {
            skeletonHtml += `
                <div class="skeleton-item flex items-center p-2">
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

    function selectFriendForDM(element) {
        const allFriends = document.querySelectorAll('.dm-friend-item');
        
        allFriends.forEach(friend => {
            friend.classList.remove('bg-discord-light');
            friend.classList.add('hover:bg-discord-dark');
        });
        
        element.classList.add('bg-discord-light');
        element.classList.remove('hover:bg-discord-dark');
        
        selectedUserId = element.getAttribute('data-user-id');
        
        if (createButton) {
            createButton.disabled = false;
            createButton.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }

    function createDirectMessage() {
        if (!selectedUserId) return;
        
        fetch('/api/chat/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ user_id: selectedUserId })
        })
        .then(response => response.json())
        .then(data => {
            if (modal) {
                modal.classList.add('hidden');
            }
            
            if (data.success && data.data && data.data.channel_id) {
                                        window.location.href = `/home/channels/dm/${data.data.channel_id}`;
            } else {
                if (window.showToast) {
                    window.showToast('Failed to create conversation: ' + (data.message || 'Unknown error'), 'error');
                }
            }
        })
        .catch(error => {
            console.error('Error creating direct message:', error);
            if (window.showToast) {
                window.showToast('Failed to create conversation. Please try again.', 'error');
            }
        });
    }

    function getStatusColor(status) {
        switch (status) {
            case 'online': return 'bg-discord-green';
            case 'away': return 'bg-discord-yellow';
            case 'dnd': return 'bg-discord-red';
            default: return 'bg-gray-500';
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
            loadFriendsForDM();
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
        searchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase();
            const friends = document.querySelectorAll('.dm-friend-item');
            
            let hasVisibleFriends = false;
            
            friends.forEach(friend => {
                const username = friend.getAttribute('data-username').toLowerCase();
                if (username.includes(query)) {
                    friend.classList.remove('hidden');
                    hasVisibleFriends = true;
                } else {
                    friend.classList.add('hidden');
                }
            });
            
            const noFriendsMsg = document.getElementById('no-dm-friends');
            if (noFriendsMsg) {
                noFriendsMsg.classList.toggle('hidden', hasVisibleFriends);
            }
        });
    }

    if (createButton) {
        createButton.addEventListener('click', createDirectMessage);
    }
});
</script>