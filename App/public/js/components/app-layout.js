import '../api/friend-api.js';
import '../api/user-api.js';
import '../utils/friends-manager.js';
import '../core/ui/toast.js';

const friendAPI = window.FriendAPI;

document.addEventListener('DOMContentLoaded', function () {
    initTabHandling();
    initFriendRequestForm();
    
    if (window.location.pathname === '/home/friends' || window.location.pathname === '/home') {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab') || 'online';
        
        activateTab(tab);
    }

    requestAnimationFrame(() => {
        initServerModal();
        initDirectMessageModal();
        initResponsiveHandling();
        initMobileMenu();
        
        const createServerButtons = document.querySelectorAll('[data-action="create-server"]');
        if (createServerButtons.length > 0) {
            console.log('Found create server buttons in app-layout.js:', createServerButtons.length);
            
            createServerButtons.forEach(button => {
                const newButton = button.cloneNode(true);
                button.parentNode.replaceChild(newButton, button);
                
                newButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Create server button clicked from app-layout.js');
                    
                    const modal = document.getElementById('create-server-modal');
                    if (modal) {
                        console.log('Modal found, opening directly');
                        modal.classList.remove('hidden');
                        modal.style.display = 'flex';
                        
                        requestAnimationFrame(() => {
                            modal.classList.remove('opacity-0');
                        });
                    } else {
                        console.error('Modal not found in the DOM from app-layout.js');
                    }
                });
            });
        }
        
        initializeOnPageLoad();
    });
});

function initServerModal() {
    const createServerBtn = document.querySelector('[data-action="create-server"]');
    const modal = document.getElementById('create-server-modal');
    const closeBtn = document.getElementById('close-server-modal');

    if (createServerBtn && modal) {
        createServerBtn.addEventListener('click', function (e) {
            e.preventDefault();
            modal.classList.remove('hidden');
        });
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', function () {
            modal.classList.add('hidden');
        });
    }

    if (modal) {
        modal.addEventListener('click', function (e) {
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

    newDirectMessageBtn.addEventListener('click', function () {
        modal.classList.remove('hidden');
        loadFriendsForDM();
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', function () {
            modal.classList.add('hidden');
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', function () {
            modal.classList.add('hidden');
        });
    }

    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', function () {
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

    friendsList.innerHTML = generateSkeletonItems(3);

    friendAPI.getFriends()
        .then(friends => {
            friendsList.innerHTML = '';

            if (friends && friends.length > 0) {
                friends.forEach(friend => {
                    const statusColor = window.FriendsManager.getInstance().getStatusColor(friend.status || 'offline');

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
                        <span class="font-medium text-white">${window.FriendsManager.getInstance().escapeHtml(friend.username)}</span>
                    `;

                    friendItem.addEventListener('click', function () {
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

        createButton.onclick = function () {
            const userId = element.getAttribute('data-user-id');
            createDirectMessage(userId);
        };
    }
}

function createDirectMessage(userId) {
    const modal = document.getElementById('new-direct-modal');

    if (!window.ChatAPI) {
        showToast('Chat system not ready. Please try again.', 'error');
        return;
    }

    window.ChatAPI.createDirectMessage(userId)
        .then(data => {
            if (modal) {
                modal.classList.add('hidden');
            }

            if (data.data && data.data.room_id) {
                window.location.href = `/home/channels/dm/${data.data.room_id}`;
            } else if (data.data && data.data.channel_id) {
                window.location.href = `/home/channels/dm/${data.data.channel_id}`;
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
        tab.addEventListener('click', function (e) {
            e.preventDefault();
            const tabName = this.getAttribute('data-tab');
            activateTab(tabName);
        });
    });
}

function activateTab(tabName) {
    const tabs = document.querySelectorAll('[data-tab]');
    const tabContents = document.querySelectorAll('.tab-content');
    
    updateTabUI(tabName, tabs, tabContents);
    
    if (window.location.pathname === '/home/friends' || window.location.pathname === '/home') {
        const url = new URL(window.location);
        url.searchParams.set('tab', tabName);
        window.history.pushState({}, '', url);
    } else {
        window.location.href = '/home/friends?tab=' + tabName;
    }
}

function updateTabUI(tabName, tabs, tabContents) {
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
            
            if (window.FriendsManager) {
                const friendsManager = window.FriendsManager.getInstance();
                friendsManager.invalidateCache(['friends', 'pending', 'online']);
            }
            
            if (tabName === 'online') {
                loadOnlineFriends(true);
            } else if (tabName === 'all') {
                loadAllFriends(true);
            } else if (tabName === 'pending') {
                loadPendingRequests(true);
            }
        } else {
            content.classList.add('hidden');
        }
    });
}

async function loadOnlineFriends(forceRefresh = false) {
    const container = document.getElementById('online-friends-container');
    if (!container) return;
    
    if (!window.FriendsManager) {
        console.error('FriendsManager not loaded');
        container.innerHTML = '<div class="text-gray-400 p-4">Loading friends system...</div>';
        return;
    }
    
    const friendsManager = window.FriendsManager.getInstance();
    
    if (forceRefresh) {
        container.innerHTML = generateSkeletonFriends(3);
    }
    
    try {
        const friends = await friendsManager.getFriends(forceRefresh);
        const onlineFriends = friends ? friends.filter(friend => friend.status === 'online') : [];

        if (!onlineFriends || onlineFriends.length === 0) {
            container.innerHTML = `
                <div class="p-4 bg-discord-dark rounded text-center">
                    <div class="mb-2 text-gray-400">
                        <i class="fa-solid fa-user-group text-3xl"></i>
                    </div>
                    <p class="text-gray-300 mb-1">No friends online</p>
                    <p class="text-gray-500 text-sm">Friends will appear here when they come online</p>
                </div>
            `;
            updateOnlineCount(0);
            return;
        }
        
        let friendsHtml = '';
        
        onlineFriends.forEach(friend => {
            const statusColor = friendsManager.getStatusColor('online');
            const statusText = friendsManager.getStatusText('online');
            
            friendsHtml += `
                <div class="flex justify-between items-center p-2 rounded hover:bg-discord-light group friend-item" data-user-id="${friend.id}">
                    <div class="flex items-center">
                        <div class="relative mr-3">
                            <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                <img src="${friend.avatar_url || '/public/assets/common/default-profile-picture.png'}" 
                                     alt="Avatar" class="w-full h-full object-cover">
                            </div>
                            <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-background ${statusColor}"></span>
                        </div>
                        <div>
                            <div class="font-medium text-white">${friendsManager.escapeHtml(friend.username)}</div>
                            <div class="text-xs text-gray-400">${statusText}</div>
                        </div>
                    </div>
                    <div class="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button class="p-2 text-gray-400 hover:text-white hover:bg-discord-background rounded-full" title="Message" onclick="createDirectMessage('${friend.id}')">
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
        updateOnlineCount(onlineFriends.length);
    } catch (error) {
        console.error('Error loading online friends:', error);
        container.innerHTML = '<div class="text-gray-400 p-4">Failed to load online friends</div>';
        updateOnlineCount(0);
    }
}

async function loadAllFriends(forceRefresh = false) {
    const container = document.getElementById('all-friends-container');
    if (!container) return;
    
    if (!window.FriendsManager) {
        console.error('FriendsManager not loaded');
        container.innerHTML = '<div class="text-gray-400 p-4">Loading friends system...</div>';
        return;
    }
    
    const friendsManager = window.FriendsManager.getInstance();
    
    if (forceRefresh) {
        container.innerHTML = generateSkeletonFriends(3);
    }
    
    try {
        const friends = await friendsManager.getFriends(forceRefresh);

        if (!friends || friends.length === 0) {
            container.innerHTML = `
                <div class="p-4 bg-discord-dark rounded text-center">
                    <div class="mb-2 text-gray-400">
                        <i class="fa-solid fa-user-group text-3xl"></i>
                    </div>
                    <p class="text-gray-300 mb-1">No friends found</p>
                    <p class="text-gray-500 text-sm">Add some friends to get started!</p>
                </div>
            `;
            return;
        }
        
        let friendsHtml = '';
        
        if (!Array.isArray(friends)) {
            console.error('Friends data is not an array:', typeof friends, friends);
            friends = [];
        }
        
        friends.forEach(friend => {
            const status = 'offline';
            const statusColor = friendsManager.getStatusColor(status);
            const statusText = friendsManager.getStatusText(status);
            
            friendsHtml += `
                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 sm:p-3 rounded hover:bg-discord-light group friend-item gap-2 sm:gap-0" data-user-id="${friend.id}">
                    <div class="flex items-center">
                        <div class="relative mr-3">
                            <div class="w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                <img src="${friend.avatar_url || '/public/assets/common/default-profile-picture.png'}" 
                                     alt="Avatar" class="w-full h-full object-cover">
                            </div>
                            <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-background ${statusColor}"></span>
                        </div>
                        <div>
                            <div class="font-medium text-white friend-name text-sm sm:text-base">${friendsManager.escapeHtml(friend.username)}</div>
                            <div class="text-xs text-gray-400 friend-status">${statusText}</div>
                        </div>
                    </div>
                    <div class="flex space-x-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity self-end sm:self-auto">
                        <button class="p-2 text-gray-400 hover:text-white hover:bg-discord-background rounded-full text-sm" title="Message" onclick="createDirectMessage('${friend.id}')">
                            <i class="fa-solid fa-message"></i>
                        </button>
                        <button class="p-2 text-gray-400 hover:text-white hover:bg-discord-background rounded-full text-sm" title="More">
                            <i class="fa-solid fa-ellipsis-vertical"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = friendsHtml;
    } catch (error) {
        console.error('Error loading friends:', error);
        container.innerHTML = '<div class="text-gray-400 p-4">Failed to load friends</div>';
    }
}

async function loadPendingRequests(forceRefresh = false) {
    const pendingContainer = document.getElementById('pending-requests');
    if (!pendingContainer) return;

    if (!window.FriendsManager) {
        console.error('FriendsManager not loaded');
        pendingContainer.innerHTML = '<div class="text-gray-400 p-4">Loading friends system...</div>';
        return;
    }

    const friendsManager = window.FriendsManager.getInstance();
    
    if (forceRefresh) {
        pendingContainer.innerHTML = generateSkeletonPending();
    }

    try {
        const pendingData = await friendsManager.getPendingRequests(forceRefresh);
        pendingContainer.innerHTML = '';

        if (pendingData) {
            const { incoming, outgoing, count } = pendingData;
            
            updatePendingCountDisplay(count || incoming?.length || 0);

            if (incoming && incoming.length > 0) {
                const incomingHtml = `
                    <h3 class="text-xs uppercase font-semibold text-gray-400 mb-2">Incoming Friend Requests — ${incoming.length}</h3>
                    <div class="space-y-2">
                        ${incoming.map(user => `
                            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-discord-dark rounded gap-3 sm:gap-0">
                                <div class="flex items-center">
                                    <div class="w-12 h-12 sm:w-10 sm:h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden mr-3">
                                        <img src="${user.avatar_url || '/public/assets/common/default-profile-picture.png'}" 
                                             alt="Avatar" class="w-full h-full object-cover">
                                    </div>
                                    <div>
                                        <div class="font-medium text-white text-sm sm:text-base">${friendsManager.escapeHtml(user.username)}</div>
                                        <div class="text-xs text-gray-400">Incoming Friend Request</div>
                                    </div>
                                </div>
                                <div class="flex flex-col sm:flex-row gap-2 sm:space-x-2 sm:gap-0">
                                    <button class="bg-discord-green hover:bg-discord-green/90 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-md px-3 py-2 sm:py-1 text-sm order-1 sm:order-none transition-colors"
                                            onclick="acceptFriendRequest('${user.friendship_id}')">Accept</button>
                                    <button class="bg-discord-dark hover:bg-discord-light disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md px-3 py-2 sm:py-1 text-sm border border-gray-600 order-2 sm:order-none transition-colors"
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
                            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-discord-dark rounded gap-3 sm:gap-0">
                                <div class="flex items-center">
                                    <div class="w-12 h-12 sm:w-10 sm:h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden mr-3">
                                        <img src="${user.avatar_url || '/public/assets/common/default-profile-picture.png'}" 
                                             alt="Avatar" class="w-full h-full object-cover">
                                    </div>
                                    <div>
                                        <div class="font-medium text-white text-sm sm:text-base">${friendsManager.escapeHtml(user.username)}</div>
                                        <div class="text-xs text-gray-400">Outgoing Friend Request</div>
                                    </div>
                                </div>
                                <div class="self-start sm:self-auto">
                                    <button class="bg-discord-red hover:bg-discord-red/90 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-md px-3 py-2 sm:py-1 text-sm w-full sm:w-auto transition-colors"
                                            onclick="cancelFriendRequest('${user.id}')">Cancel</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
                pendingContainer.insertAdjacentHTML('beforeend', outgoingHtml);
            }

            if ((!incoming || incoming.length === 0) && (!outgoing || outgoing.length === 0)) {
                updatePendingCountDisplay(0);
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
            updatePendingCountDisplay(0);
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
    } catch (error) {
        console.error('Error loading pending requests:', error);
        pendingContainer.innerHTML = '<div class="text-gray-400 p-4">Failed to load pending requests</div>';
    }
}

function generateSkeletonFriends(count = 3) {
    const skeletonItems = Array(count).fill().map(() => `
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
    `).join('');

    return skeletonItems;
}

function generateSkeletonPending() {
    return `
        <h3 class="skeleton w-32 h-4 mb-4"></h3>
        ${generateSkeletonPendingItems(1)}
        
        <h3 class="skeleton w-32 h-4 my-4"></h3>
        ${generateSkeletonPendingItems(1)}
    `;
}

function generateSkeletonPendingItems(count = 1) {
    const skeletonItems = Array(count).fill().map(() => `
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
    `).join('');

    return `<div class="space-y-2">${skeletonItems}</div>`;
}

async function acceptFriendRequest(friendshipId) {
    const button = event.target;
    const originalText = button.textContent;
    const requestElement = button.closest('div[class*="flex"][class*="flex-col"]');
    
    try {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Accepting...';
        
        const result = await window.userAPI.acceptFriendRequest(friendshipId);
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to accept friend request');
        }
        
        window.showToast('Friend request accepted!', 'success');
        
        if (requestElement) {
            requestElement.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
            requestElement.style.opacity = '0';
            requestElement.style.transform = 'translateX(20px)';
            
            setTimeout(() => {
                requestElement.remove();
                updatePendingCountAfterRemoval();
                checkIfNoPendingRequests();
            }, 300);
        }
        
        if (window.FriendsManager) {
            const friendsManager = window.FriendsManager.getInstance();
            friendsManager.invalidateCache(['friends', 'pending']);
        }
        
    } catch (error) {
        console.error('Error accepting friend request:', error);
        window.showToast(error.message || 'Failed to accept friend request', 'error');
        
        button.disabled = false;
        button.textContent = originalText;
    }
}

async function ignoreFriendRequest(friendshipId) {
    const button = event.target;
    const originalText = button.textContent;
    const requestElement = button.closest('div[class*="flex"][class*="flex-col"]');
    
    try {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Ignoring...';
        
        const result = await window.userAPI.declineFriendRequest(friendshipId);
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to ignore friend request');
        }
        
        window.showToast('Friend request ignored', 'info');
        
        if (requestElement) {
            requestElement.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
            requestElement.style.opacity = '0';
            requestElement.style.transform = 'translateX(-20px)';
            
            setTimeout(() => {
                requestElement.remove();
                updatePendingCountAfterRemoval();
                checkIfNoPendingRequests();
            }, 300);
        }
        
        if (window.FriendsManager) {
            const friendsManager = window.FriendsManager.getInstance();
            friendsManager.invalidateCache('pending');
        }
        
    } catch (error) {
        console.error('Error ignoring friend request:', error);
        window.showToast(error.message || 'Failed to ignore friend request', 'error');
        
        button.disabled = false;
        button.textContent = originalText;
    }
}

async function cancelFriendRequest(userId) {
    const button = event.target;
    const originalText = button.textContent;
    const requestElement = button.closest('div[class*="flex"][class*="flex-col"]');
    
    try {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Canceling...';
        
        const result = await window.userAPI.cancelFriendRequest(userId);
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to cancel friend request');
        }
        
        window.showToast('Friend request cancelled', 'info');
        
        if (requestElement) {
            requestElement.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
            requestElement.style.opacity = '0';
            requestElement.style.transform = 'translateX(-20px)';
            
            setTimeout(() => {
                requestElement.remove();
                updatePendingCountAfterRemoval();
                checkIfNoPendingRequests();
            }, 300);
        }
        
        if (window.FriendsManager) {
            const friendsManager = window.FriendsManager.getInstance();
            friendsManager.invalidateCache('pending');
        }
        
    } catch (error) {
        console.error('Error cancelling friend request:', error);
        window.showToast(error.message || 'Failed to cancel friend request', 'error');
        
        button.disabled = false;
        button.textContent = originalText;
    }
}

function updatePendingCountAfterRemoval() {
    const pendingContainer = document.getElementById('pending-requests');
    if (!pendingContainer) return;
    
    const incomingCount = Array.from(pendingContainer.children).filter(el => 
        el.classList && el.classList.contains('flex') && 
        el.textContent.includes('Incoming Friend Request')
    ).length;
    
    updatePendingCountDisplay(incomingCount);
    
    const incomingHeader = Array.from(pendingContainer.querySelectorAll('h3')).find(el => 
        el.textContent.includes('Incoming Friend Requests')
    );
    if (incomingHeader) {
        incomingHeader.textContent = `Incoming Friend Requests — ${incomingCount}`;
    }
    
    const outgoingCount = Array.from(pendingContainer.children).filter(el => 
        el.classList && el.classList.contains('flex') && 
        el.textContent.includes('Outgoing Friend Request')
    ).length;
    
    const outgoingHeader = Array.from(pendingContainer.querySelectorAll('h3')).find(el => 
        el.textContent.includes('Outgoing Friend Requests')
    );
    if (outgoingHeader) {
        outgoingHeader.textContent = `Outgoing Friend Requests — ${outgoingCount}`;
    }
}

function checkIfNoPendingRequests() {
    const pendingContainer = document.getElementById('pending-requests');
    if (!pendingContainer) return;
    
    const requestElements = pendingContainer.querySelectorAll('div[class*="flex"][class*="flex-col"]');
    
    if (requestElements.length === 0) {
        pendingContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center py-8">
                <div class="mb-4 text-gray-400">
                    <i class="fas fa-user-plus text-4xl"></i>
                </div>
                <div class="text-white font-medium mb-1">Wumpus is waiting on friends</div>
                <div class="text-gray-400 text-sm text-center">You don't have any pending friend requests. Here's Wumpus for now.</div>
            </div>
        `;
        updatePendingCountDisplay(0);
    }
}

function initFriendRequestForm() {
    const friendUsernameInput = document.getElementById('friend-username-input');
    const sendFriendRequestBtn = document.getElementById('send-friend-request');
    const errorDiv = document.getElementById('friend-request-error');
    const successDiv = document.getElementById('friend-request-success');

    if (!friendUsernameInput || !sendFriendRequestBtn) return;

    let validationTimeout;
    
    function updateButtonState(isValid) {
        sendFriendRequestBtn.disabled = !isValid;
        
        if (isValid) {
            sendFriendRequestBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
            sendFriendRequestBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
    }
    
    function clearMessages() {
        if (errorDiv) errorDiv.classList.add('hidden');
        if (successDiv) successDiv.classList.add('hidden');
    }

    friendUsernameInput.addEventListener('input', function () {
        const value = this.value.trim();
        
        clearTimeout(validationTimeout);
        clearMessages();
        
        if (value.length === 0) {
            updateButtonState(false);
            return;
        }
        
        if (value.length >= 2) {
            updateButtonState(true);
        } else {
            updateButtonState(false);
        }
        
        validationTimeout = setTimeout(() => {
            const validation = friendAPI.validateUsername(value);
            updateButtonState(validation.valid);
            
            if (!validation.valid && validation.message && errorDiv) {
                errorDiv.textContent = validation.message;
                errorDiv.classList.remove('hidden');
            }
        }, 100);
    });

    sendFriendRequestBtn.addEventListener('click', async function () {
        if (this.disabled) return;
        
        const username = friendUsernameInput.value.trim();
        if (!username) return;

        const originalText = this.textContent;
        updateButtonState(false);
        clearMessages();
        
        this.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Sending...';

        try {
            const result = await window.userAPI.sendFriendRequest(username);
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to send friend request');
            }

            window.showToast('Friend request sent!', 'success');
            
            if (successDiv) {
                successDiv.textContent = 'Friend request sent!';
                successDiv.classList.remove('hidden');
            }
            friendUsernameInput.value = '';
            this.textContent = originalText;
            updateButtonState(false);

            if (window.FriendsManager) {
                const friendsManager = window.FriendsManager.getInstance();
                friendsManager.invalidateCache('pending');
            }

        } catch (error) {
            console.error('Error sending friend request:', error);
            window.showToast(error.message || 'Failed to send friend request', 'error');
            
            if (errorDiv) {
                errorDiv.textContent = error.message || 'Failed to send friend request';
                errorDiv.classList.remove('hidden');
            }
            
            this.textContent = originalText;
            updateButtonState(!!friendUsernameInput.value.trim());
        }
    });
}

function updatePendingCountDisplay(count) {
    const pendingTab = document.querySelector('button[data-tab="pending"]');
    if (pendingTab) {
        if (count > 0) {
            pendingTab.innerHTML = `Pending <span class="bg-discord-red px-1.5 py-0.5 rounded text-white ml-1">${count}</span>`;
        } else {
            pendingTab.textContent = 'Pending';
        }
    }
}

function showToast(message, type = 'info') {
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
    } else {
        console.log(type + ': ' + message);
    }
}

window.acceptFriendRequest = acceptFriendRequest;
window.ignoreFriendRequest = ignoreFriendRequest;
window.cancelFriendRequest = cancelFriendRequest;
window.createDirectMessage = createDirectMessage;

function initResponsiveHandling() {
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            const activeTab = document.querySelector('.tab-content:not(.hidden)');
            if (activeTab && window.innerWidth < 640) {
                adjustMobileElements();
            }
            
            const mobileMenu = document.getElementById('friends-mobile-menu');
            const menuIcon = document.querySelector('#friends-menu-toggle i');
            
            if (window.innerWidth >= 768 && mobileMenu && !mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.add('hidden');
                mobileMenu.style.maxHeight = '';
                mobileMenu.style.overflow = '';
                mobileMenu.style.transition = '';
                
                if (menuIcon) {
                    menuIcon.classList.remove('fa-times');
                    menuIcon.classList.add('fa-bars');
                }
            }
        }, 250);
    });
    
    if (window.innerWidth < 640) {
        adjustMobileElements();
    }
}

function adjustMobileElements() {
    const searchInputs = document.querySelectorAll('input[placeholder="Search"]');
    searchInputs.forEach(input => {
        if (window.innerWidth < 640) {
            input.style.minHeight = '44px';
        } else {
            input.style.minHeight = '';
        }
    });
    
    const buttons = document.querySelectorAll('.tab-content button');
    buttons.forEach(button => {
        if (window.innerWidth < 640) {
            button.style.minHeight = '44px';
        } else {
            button.style.minHeight = '';
        }
    });
}

function initMobileMenu() {
    const toggleBtn = document.getElementById('friends-menu-toggle');
    const mobileMenu = document.getElementById('friends-mobile-menu');
    const menuIcon = toggleBtn?.querySelector('i');
    
    if (!toggleBtn || !mobileMenu) return;
    
    function closeMobileMenu() {
        mobileMenu.style.maxHeight = '0px';
        
        setTimeout(() => {
            mobileMenu.classList.add('hidden');
            mobileMenu.style.maxHeight = '';
            mobileMenu.style.overflow = '';
            mobileMenu.style.transition = '';
        }, 300);
        
        if (menuIcon) {
            menuIcon.classList.remove('fa-times');
            menuIcon.classList.add('fa-bars');
        }
    }
    
    toggleBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const isHidden = mobileMenu.classList.contains('hidden');
        
        if (isHidden) {
            mobileMenu.classList.remove('hidden');
            mobileMenu.style.maxHeight = '0px';
            mobileMenu.style.overflow = 'hidden';
            mobileMenu.style.transition = 'max-height 0.3s ease-out';
            
            requestAnimationFrame(() => {
                mobileMenu.style.maxHeight = mobileMenu.scrollHeight + 'px';
            });
            
            if (menuIcon) {
                menuIcon.classList.remove('fa-bars');
                menuIcon.classList.add('fa-times');
            }
        } else {
            closeMobileMenu();
        }
    });
    
    mobileMenu.addEventListener('click', function(e) {
        if (e.target.closest('a[data-tab]')) {
            closeMobileMenu();
        }
    });
    
    document.addEventListener('click', function(e) {
        if (!toggleBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
            if (!mobileMenu.classList.contains('hidden')) {
                closeMobileMenu();
            }
        }
    });
    
    window.addEventListener('resize', function() {
        if (window.innerWidth >= 768 && !mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
            mobileMenu.style.maxHeight = '';
            mobileMenu.style.overflow = '';
            mobileMenu.style.transition = '';
            
            if (menuIcon) {
                menuIcon.classList.remove('fa-times');
                menuIcon.classList.add('fa-bars');
            }
        }
    });
}

function initializeOnPageLoad() {
    const currentPath = window.location.pathname;
    if (currentPath.includes('/friends')) {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab') || 'online';
        
        if (tab === 'online') {
            loadOnlineFriends(false);
        } else if (tab === 'all') {
            loadAllFriends(false);
        } else if (tab === 'pending') {
            loadPendingRequests(false);
        }
    }
}

function setupCreateServerButton() {
    const createServerButtons = document.querySelectorAll('.create-server-btn');
    
    createServerButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = document.querySelector('.create-server-modal');
            if (modal) {
                modal.classList.remove('hidden');
            }
        });
    });
}

function updateOnlineCount(count) {
    const onlineCountElement = document.getElementById('online-count');
    if (onlineCountElement) {
        onlineCountElement.textContent = count;
    }
}