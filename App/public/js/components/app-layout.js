import { DirectMessageAPI } from '../api/direct-message-api.js';
import { FriendAPI } from '../api/friend-api.js';

const directMessageAPI = DirectMessageAPI;
const friendAPI = FriendAPI;

document.addEventListener('DOMContentLoaded', function() {
    initServerModal();
    initDirectMessageModal();
    initTabHandling();
    initFriendRequestForm();
    updatePendingCount();
});

function initServerModal() {
    const createServerBtn = document.querySelector('[data-action="create-server"]');
    const modal = document.getElementById('create-server-modal');
    const closeBtn = document.getElementById('close-server-modal');

    if (createServerBtn && modal) {
        createServerBtn.addEventListener('click', function(e) {
            e.preventDefault();
            modal.classList.remove('hidden');
        });
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', function() {
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
}

function initDirectMessageModal() {
    const newDirectMessageBtn = document.getElementById('new-direct-message-btn');
    const modal = document.getElementById('new-direct-modal');
    const closeBtn = document.getElementById('close-new-direct-modal');
    const cancelBtn = document.getElementById('cancel-new-direct');
    const searchInput = document.getElementById('dm-search-input');
    const friendsList = document.getElementById('dm-friends-list');
    const createButton = document.getElementById('create-new-direct');

    if (!newDirectMessageBtn || !modal) return;

    newDirectMessageBtn.addEventListener('click', function() {
        modal.classList.remove('hidden');
        loadFriendsForDM();
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            modal.classList.add('hidden');
        });
    }

    if (cancelBtn) {
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
            const friends = friendsList.querySelectorAll('.dm-friend-item');
            
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
}

function loadFriendsForDM() {
    const friendsList = document.getElementById('dm-friends-list');
    const noFriendsMsg = document.getElementById('no-dm-friends');
    
    if (!friendsList) return;
    
    friendsList.innerHTML = generateSkeletonItems(5);
    
    FriendAPI.getFriends()
        .then(friends => {
            friendsList.innerHTML = '';
            
            if (friends && friends.length > 0) {
                friends.forEach(friend => {
                    const statusColor = getStatusColor(friend.status || 'offline');
                    
                    const friendItem = document.createElement('div');
                    friendItem.className = 'dm-friend-item flex items-center p-2 rounded hover:bg-discord-dark cursor-pointer';
                    friendItem.setAttribute('data-username', friend.username);
                    friendItem.setAttribute('data-user-id', friend.id);
                    
                    friendItem.innerHTML = `
                        <div class="relative mr-3">
                            <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                <img src="${friend.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.username)}&background=random`}" 
                                     alt="Avatar" class="w-full h-full object-cover">
                            </div>
                            <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-darker ${statusColor}"></span>
                        </div>
                        <span class="font-medium text-white">${escapeHtml(friend.username)}</span>
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
}

function generateSkeletonItems(count) {
    let skeletonHtml = '';
    
    for (let i = 0; i < count; i++) {
        skeletonHtml += `
            <div class="skeleton-item flex items-center">
                <div class="skeleton skeleton-avatar mr-3"></div>
                <div class="flex-1">
                    <div class="skeleton skeleton-text"></div>
                </div>
            </div>
        `;
    }
    
    return skeletonHtml;
}

function selectFriendForDM(element) {
    const createButton = document.getElementById('create-new-direct');
    const allFriends = document.querySelectorAll('.dm-friend-item');
    
    allFriends.forEach(friend => {
        friend.classList.remove('bg-discord-light');
        friend.classList.add('hover:bg-discord-dark');
    });
    
    element.classList.add('bg-discord-light');
    element.classList.remove('hover:bg-discord-dark');
    
    if (createButton) {
        createButton.disabled = false;
        createButton.classList.remove('opacity-50', 'cursor-not-allowed');
        
        createButton.onclick = function() {
            const userId = element.getAttribute('data-user-id');
            createDirectMessage(userId);
        };
    }
}

function createDirectMessage(userId) {
    const modal = document.getElementById('new-direct-modal');
    
    DirectMessageAPI.createDirectMessage({ user_id: userId })
        .then(data => {
            if (modal) {
                modal.classList.add('hidden');
            }
            
            if (data.success && data.data && data.data.channel_id) {
                window.location.href = `/app/channels/dm/${data.data.channel_id}`;
            } else {
                showToast('Failed to create conversation: ' + (data.message || 'Unknown error'), 'error');
            }
        })
        .catch(error => {
            console.error('Error creating direct message:', error);
            showToast('Failed to create conversation. Please try again.', 'error');
        });
}

function initTabHandling() {
    const tabs = document.querySelectorAll('[data-tab]');
    
    if (!tabs.length) return;
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            activateTab(tabName);
        });
    });
}

function activateTab(tabName) {
    const tabs = document.querySelectorAll('[data-tab]');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        if (tab.getAttribute('data-tab') === tabName) {
            tab.classList.remove('text-gray-300');
            tab.classList.add('text-white');
            
            if (tabName === 'online' || tabName === 'add-friend') {
                tab.classList.add(tabName === 'online' ? 'bg-discord-primary' : 'bg-discord-green');
                tab.classList.remove(tabName === 'online' ? 'hover:bg-discord-light' : 'hover:bg-discord-green/90');
            } else {
                tab.classList.add('bg-discord-primary');
                tab.classList.remove('hover:bg-discord-light');
            }
        } else {
            tab.classList.add('text-gray-300');
            tab.classList.remove('text-white');
            
            const currentTabName = tab.getAttribute('data-tab');
            if (currentTabName === 'online' || currentTabName === 'add-friend') {
                tab.classList.remove(currentTabName === 'online' ? 'bg-discord-primary' : 'bg-discord-green');
                tab.classList.add('hover:bg-discord-light');
            } else {
                tab.classList.remove('bg-discord-primary');
                tab.classList.add('hover:bg-discord-light');
            }
        }
    });
    
    tabContents.forEach(content => {
        if (content.id === tabName + '-tab') {
            content.classList.remove('hidden');
            
            if (tabName === 'all') {
                loadAllFriends();
            } else if (tabName === 'pending') {
                loadPendingRequests();
            } else if (tabName === 'blocked') {
                loadBlockedUsers();
            }
        } else {
            content.classList.add('hidden');
        }
    });
}

function loadAllFriends() {
    const container = document.getElementById('all-friends-container');
    if (!container) return;
    
    container.innerHTML = generateSkeletonFriends(5);
    
    FriendAPI.getFriends()
        .then(friends => {
            if (friends && friends.length > 0) {
                let friendsHtml = '';
                friends.forEach(friend => {
                    const statusColor = getStatusColor(friend.status || 'offline');
                    const statusText = getStatusText(friend.status || 'offline');
                    
                    friendsHtml += `
                        <div class="flex justify-between items-center p-2 rounded hover:bg-discord-light group friend-item" data-user-id="${friend.id}">
                            <div class="flex items-center">
                                <div class="relative mr-3">
                                    <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                        <img src="${friend.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.username)}&background=random`}" 
                                             alt="Avatar" class="w-full h-full object-cover">
                                    </div>
                                    <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-background ${statusColor}"></span>
                                </div>
                                <div>
                                    <div class="font-medium text-white friend-name">${escapeHtml(friend.username)}</div>
                                    <div class="text-xs text-gray-400 friend-status">${statusText}</div>
                                </div>
                            </div>
                            <div class="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button class="p-2 text-gray-400 hover:text-white hover:bg-discord-background rounded-full" title="Message">
                                    <i class="fa-solid fa-message"></i>
                                </button>
                                <button class="p-2 text-gray-400 hover:text-white hover:bg-discord-background rounded-full" title="More">
                                    <i class="fa-solid fa-ellipsis-vertical"></i>
                                </button>
                            </div>
                        </div>
                    `;
                });
                
                container.innerHTML = friendsHtml;
            } else {
                container.innerHTML = `
                    <div class="p-4 bg-discord-dark rounded text-center">
                        <div class="mb-2 text-gray-400">
                            <i class="fa-solid fa-user-group text-3xl"></i>
                        </div>
                        <p class="text-gray-300 mb-1">No friends found</p>
                        <p class="text-gray-500 text-sm">Add some friends to get started!</p>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Error loading friends:', error);
            container.innerHTML = '<div class="text-gray-400 p-4">Failed to load friends</div>';
        });
}

function generateSkeletonFriends(count) {
    let skeletonHtml = '';
    
    for (let i = 0; i < count; i++) {
        skeletonHtml += `
            <div class="skeleton-item flex justify-between items-center p-2">
                <div class="flex items-center">
                    <div class="skeleton skeleton-avatar mr-3"></div>
                    <div>
                        <div class="skeleton skeleton-text mb-1"></div>
                        <div class="skeleton skeleton-text-sm"></div>
                    </div>
                </div>
                <div class="flex space-x-2">
                    <div class="skeleton w-8 h-8 rounded-full"></div>
                    <div class="skeleton w-8 h-8 rounded-full"></div>
                </div>
            </div>
        `;
    }
    
    return skeletonHtml;
}

function loadPendingRequests() {
    const pendingContainer = document.getElementById('pending-requests');
    if (!pendingContainer) return;

    pendingContainer.innerHTML = generateSkeletonPending();
    
    FriendAPI.getPendingRequests()
        .then(pendingData => {
            pendingContainer.innerHTML = '';

            if (pendingData) {
                const { incoming, outgoing } = pendingData;
                
                if (incoming && incoming.length > 0) {
                    const incomingHtml = `
                        <h3 class="text-xs uppercase font-semibold text-gray-400 mb-2">Incoming Friend Requests — ${incoming.length}</h3>
                        <div class="space-y-2">
                            ${incoming.map(user => `
                                <div class="flex items-center justify-between p-2 bg-discord-dark rounded">
                                    <div class="flex items-center">
                                        <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden mr-3">
                                            <img src="${user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=random`}" 
                                                 alt="Avatar" class="w-full h-full object-cover">
                                        </div>
                                        <div>
                                            <div class="font-medium text-white">${escapeHtml(user.username)}</div>
                                            <div class="text-xs text-gray-400">Incoming Friend Request</div>
                                        </div>
                                    </div>
                                    <div class="flex space-x-2">
                                        <button class="bg-discord-green hover:bg-discord-green/90 text-white rounded-md px-3 py-1 text-sm"
                                                onclick="acceptFriendRequest('${user.friendship_id}')">Accept</button>
                                        <button class="bg-discord-dark hover:bg-discord-light text-white rounded-md px-3 py-1 text-sm"
                                                onclick="ignoreFriendRequest('${user.friendship_id}')">Ignore</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `;
                    pendingContainer.insertAdjacentHTML('beforeend', incomingHtml);
                }

                if (outgoing && outgoing.length > 0) {
                    const outgoingHtml = `
                        <h3 class="text-xs uppercase font-semibold text-gray-400 mt-4 mb-2">Outgoing Friend Requests — ${outgoing.length}</h3>
                        <div class="space-y-2">
                            ${outgoing.map(user => `
                                <div class="flex items-center justify-between p-2 bg-discord-dark rounded">
                                    <div class="flex items-center">
                                        <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden mr-3">
                                            <img src="${user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=random`}" 
                                                 alt="Avatar" class="w-full h-full object-cover">
                                        </div>
                                        <div>
                                            <div class="font-medium text-white">${escapeHtml(user.username)}</div>
                                            <div class="text-xs text-gray-400">Outgoing Friend Request</div>
                                        </div>
                                    </div>
                                    <div>
                                        <button class="bg-discord-red hover:bg-discord-red/90 text-white rounded-md px-3 py-1 text-sm"
                                                onclick="cancelFriendRequest('${user.id}')">Cancel</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `;
                    pendingContainer.insertAdjacentHTML('beforeend', outgoingHtml);
                }

                if ((!incoming || incoming.length === 0) && (!outgoing || outgoing.length === 0)) {
                    pendingContainer.innerHTML = `
                        <div class="flex flex-col items-center justify-center py-8">
                            <div class="mb-4 text-gray-400">
                                <i class="fas fa-user-plus text-4xl"></i>
                            </div>
                            <div class="text-white font-medium mb-1">Wumpus is waiting on friends</div>
                            <div class="text-gray-400 text-sm text-center">You don't have any pending friend requests. Here's Wumpus for now.</div>
                        </div>
                    `;
                }
            } else {
                pendingContainer.innerHTML = `
                    <div class="flex flex-col items-center justify-center py-8">
                        <div class="mb-4 text-gray-400">
                            <i class="fas fa-user-plus text-4xl"></i>
                        </div>
                        <div class="text-white font-medium mb-1">Wumpus is waiting on friends</div>
                        <div class="text-gray-400 text-sm text-center">You don't have any pending friend requests. Here's Wumpus for now.</div>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Error loading pending requests:', error);
            pendingContainer.innerHTML = '<div class="text-gray-400 p-4">Failed to load pending requests</div>';
        });
}

function generateSkeletonPending() {
    return `
        <h3 class="skeleton w-32 h-4 mb-4"></h3>
        ${generateSkeletonPendingItems(2)}
        
        <h3 class="skeleton w-32 h-4 my-4"></h3>
        ${generateSkeletonPendingItems(1)}
    `;
}

function generateSkeletonPendingItems(count) {
    let html = '<div class="space-y-2">';
    
    for (let i = 0; i < count; i++) {
        html += `
            <div class="skeleton-item flex items-center justify-between p-2">
                <div class="flex items-center">
                    <div class="skeleton skeleton-avatar mr-3" style="width: 40px; height: 40px;"></div>
                    <div>
                        <div class="skeleton skeleton-text mb-1"></div>
                        <div class="skeleton skeleton-text-sm"></div>
                    </div>
                </div>
                <div class="flex space-x-2">
                    <div class="skeleton w-16 h-8 rounded"></div>
                    <div class="skeleton w-16 h-8 rounded"></div>
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    return html;
}

function loadBlockedUsers() {
    const container = document.getElementById('blocked-users-container');
    if (!container) return;
    
    container.innerHTML = generateSkeletonItems(3);
    
    FriendAPI.getBlockedUsers()
        .then(blockedUsers => {
            if (blockedUsers && blockedUsers.length > 0) {
                let blockedHtml = '';
                blockedUsers.forEach(user => {
                    blockedHtml += `
                        <div class="flex justify-between items-center p-2 rounded hover:bg-discord-light">
                            <div class="flex items-center">
                                <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden mr-3">
                                    <img src="${user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=random`}" 
                                         alt="Avatar" class="w-full h-full object-cover">
                                </div>
                                <div class="font-medium text-white">${escapeHtml(user.username)}</div>
                            </div>
                            <button class="text-gray-400 hover:text-white bg-discord-dark hover:bg-discord-light px-2 py-1 rounded text-sm"
                                    onclick="unblockUser('${user.id}')">
                                Unblock
                            </button>
                        </div>
                    `;
                });
                
                container.innerHTML = blockedHtml;
            } else {
                container.innerHTML = `
                    <div class="p-4 bg-discord-dark rounded text-center">
                        <div class="mb-2 text-gray-400">
                            <i class="fa-solid fa-ban text-3xl"></i>
                        </div>
                        <p class="text-gray-300 mb-1">You haven't blocked anyone</p>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Error loading blocked users:', error);
            container.innerHTML = '<div class="text-gray-400 p-4">Failed to load blocked users</div>';
        });
}

function getStatusColor(status) {
    const statusColors = {
        'online': 'bg-discord-green',
        'away': 'bg-discord-yellow',
        'dnd': 'bg-discord-red',
        'offline': 'bg-gray-500'
    };
    
    return statusColors[status] || 'bg-gray-500';
}

function getStatusText(status) {
    const statusTexts = {
        'online': 'Online',
        'away': 'Away',
        'dnd': 'Do Not Disturb',
        'offline': 'Offline'
    };
    
    return statusTexts[status] || 'Offline';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function acceptFriendRequest(userId) {
    friendAPI.acceptFriendRequest(userId)
        .then(() => {
            showToast('Friend request accepted!', 'success');
            loadPendingRequests();
            updatePendingCount();
        })
        .catch(error => {
            console.error('Error accepting friend request:', error);
            showToast(error.message || 'Failed to accept friend request', 'error');
        });
}

function ignoreFriendRequest(userId) {
    FriendAPI.declineFriendRequest(userId)
        .then(() => {
            showToast('Friend request ignored', 'info');
            loadPendingRequests();
            updatePendingCount();
        })
        .catch(error => {
            console.error('Error ignoring friend request:', error);
            showToast(error.message || 'Failed to ignore friend request', 'error');
        });
}

function cancelFriendRequest(userId) {
    friendAPI.removeFriend(userId)
        .then(() => {
            showToast('Friend request cancelled', 'info');
            loadPendingRequests();
        })
        .catch(error => {
            console.error('Error cancelling friend request:', error);
            showToast(error.message || 'Failed to cancel friend request', 'error');
        });
}

function unblockUser(userId) {
    friendAPI.unblockUser(userId)
        .then(() => {
            showToast('User unblocked', 'success');
            loadBlockedUsers();
        })
        .catch(error => {
            console.error('Error unblocking user:', error);
            showToast(error.message || 'Failed to unblock user', 'error');
        });
}

function initFriendRequestForm() {
    const friendUsernameInput = document.getElementById('friend-username-input');
    const sendFriendRequestBtn = document.getElementById('send-friend-request');
    const errorDiv = document.getElementById('friend-request-error');
    const successDiv = document.getElementById('friend-request-success');
    
    if (!friendUsernameInput || !sendFriendRequestBtn) return;
    
    friendUsernameInput.addEventListener('input', function() {
        const value = this.value.trim();
        const validation = FriendAPI.validateUsername(value);
        
        sendFriendRequestBtn.disabled = !validation.valid;
        
        if (validation.valid) {
            sendFriendRequestBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
            sendFriendRequestBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
        
        if (errorDiv) errorDiv.classList.add('hidden');
        if (successDiv) successDiv.classList.add('hidden');
    });
    
    sendFriendRequestBtn.addEventListener('click', async function() {
        const username = friendUsernameInput.value.trim();
        
        // Validate input
        const validation = FriendAPI.validateUsername(username);
        if (!validation.valid) {
            if (errorDiv) {
                errorDiv.textContent = validation.message || 'Invalid username format';
                errorDiv.classList.remove('hidden');
            }
            return;
        }
        
        // Disable button and show loading state
        sendFriendRequestBtn.disabled = true;
        sendFriendRequestBtn.classList.add('opacity-50', 'cursor-not-allowed');
        
        try {
            await friendAPI.sendFriendRequest(username);
            
            if (successDiv) {
                successDiv.textContent = 'Friend request sent!';
                successDiv.classList.remove('hidden');
            }
            if (errorDiv) errorDiv.classList.add('hidden');
            friendUsernameInput.value = '';
            
            updatePendingCount();
            
        } catch (error) {
            console.error('Error sending friend request:', error);
            if (errorDiv) {
                errorDiv.textContent = error.message || 'Failed to send friend request';
                errorDiv.classList.remove('hidden');
            }
            if (successDiv) successDiv.classList.add('hidden');
        } finally {
            // Re-enable button if input is still valid
            const currentValidation = friendAPI.validateUsername(friendUsernameInput.value.trim());
            sendFriendRequestBtn.disabled = !currentValidation.valid;
            if (currentValidation.valid) {
                sendFriendRequestBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        }
    });
}

function updatePendingCount() {
    friendAPI.getPendingCount()
        .then(count => {
            const pendingTab = document.querySelector('button[data-tab="pending"]');

            if (pendingTab) {
                if (count > 0) {
                    pendingTab.innerHTML = `Pending <span class="bg-discord-red px-1.5 py-0.5 rounded text-white ml-1">${count}</span>`;
                } else {
                    pendingTab.textContent = 'Pending';
                }
            }
        })
        .catch(error => console.error('Error updating pending count:', error));
}

function showToast(message, type = 'info') {
    if (typeof window.Toast === 'function') {
        window.Toast(message, { type });
    } else {
        console.log(type + ': ' + message);
    }
}

// Global functions for handling friend request actions
window.acceptFriendRequest = async function(friendshipId) {
    try {
        console.log('Accepting friend request:', friendshipId);
        const result = await FriendAPI.acceptFriendRequest(friendshipId);
        
        if (result.success) {
            showToast('Friend request accepted!', 'success');
            // Refresh the pending requests to update the UI
            loadPendingRequests();
            // Update the pending count badge
            updatePendingCount();
        } else {
            showToast(result.message || 'Failed to accept friend request', 'error');
        }
    } catch (error) {
        console.error('Error accepting friend request:', error);
        showToast(error.message || 'Failed to accept friend request', 'error');
    }
};

window.ignoreFriendRequest = async function(friendshipId) {
    try {
        console.log('Ignoring friend request:', friendshipId);
        const result = await FriendAPI.declineFriendRequest(friendshipId);
        
        if (result.success) {
            showToast('Friend request ignored', 'info');
            // Refresh the pending requests to update the UI
            loadPendingRequests();
            // Update the pending count badge
            updatePendingCount();
        } else {
            showToast(result.message || 'Failed to ignore friend request', 'error');
        }
    } catch (error) {
        console.error('Error ignoring friend request:', error);
        showToast(error.message || 'Failed to ignore friend request', 'error');
    }
};