import '../api/friend-api.js';
import '../api/user-api.js';
import '../utils/friends-manager.js';
import '../core/ui/toast.js';

const friendAPI = window.FriendAPI;

function getStatusClass(status) {
    switch (status) {
        case 'online': return 'bg-discord-green';
        case 'afk': return 'bg-yellow-500';
        case 'offline':
        default: return 'bg-gray-500';
    }
}

function getStatusText(status) {
    switch (status) {
        case 'online': return 'Online';
        case 'afk': return 'Away';
        case 'offline':
        default: return 'Offline';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    initFriendRequestForm();
    
    // Initialize fallback image handler
    if (window.FallbackImageHandler) {
        window.fallbackImageHandler = window.FallbackImageHandler.getInstance();
    }
    
    if (window.location.pathname === '/home/friends' || window.location.pathname === '/home') {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab') || 'online';
        
        setTimeout(() => {
            if (window.FriendsTabManager) {
                const tabManager = window.FriendsTabManager.getInstance();
                if (tabManager) {
                    tabManager.switchTab(tab);
                }
            }
        }, 100);
    }

    requestAnimationFrame(() => {
        initServerModal();
        initResponsiveHandling();
        initMobileMenu();
        initializeOnPageLoad();
    });
});

function initServerModal() {
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

async function loadOnlineFriends(forceRefresh = false) {
    const container = document.getElementById('online-friends-container');
    if (!container) return;
    
    clearContainerSkeleton(container);
    
    if (!window.FriendsManager) {
        console.error('FriendsManager not loaded');
        container.innerHTML = '<div class="text-gray-400 p-4">Loading friends system...</div>';
        return;
    }

    const friendsManager = window.FriendsManager.getInstance();
    
    try {
        const friends = await friendsManager.getFriends(forceRefresh);
        let onlineUsers = {};
        
        if (window.globalSocketManager && window.globalSocketManager.isReady()) {
            onlineUsers = await friendsManager.getOnlineUsers();
        }

        if (!friends || friends.length === 0) {
            container.innerHTML = `
                <div class="p-4 bg-discord-dark rounded text-center">
                    <div class="mb-2 text-gray-400">
                        <i class="fa-solid fa-user-group text-3xl"></i>
                    </div>
                    <p class="text-gray-300 mb-1">You have no friends yet</p>
                    <p class="text-gray-500 text-sm">Add friends to see them here when they're online</p>
                </div>
            `;
            updateOnlineCount(0);
            return;
        }

        const onlineFriends = friends.filter(friend => {
            const userData = onlineUsers[friend.id];
            return userData && (userData.status === 'online' || userData.status === 'afk');
        });

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

        onlineFriends.sort((a, b) => {
            const nameA = a.display_name || a.username;
            const nameB = b.display_name || b.username;
            return nameA.localeCompare(nameB);
        });
        
        let friendsHtml = '';
        onlineFriends.forEach(friend => {
            const userData = onlineUsers[friend.id];
            const status = userData?.status || 'offline';
            const statusClass = getStatusClass(status);
            const statusText = getStatusText(status);
            const displayName = friend.display_name || friend.username;
            const userTag = friend.discriminator ? `${friend.username}#${friend.discriminator}` : friend.username;
            
            friendsHtml += `
                <div class="flex justify-between items-center p-3 rounded hover:bg-discord-light group friend-item transition-all duration-200 animate-fadeIn" onclick="createDirectMessage('${friend.id}')">
                    <div class="flex items-center">
                        <div class="relative mr-3">
                            <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                <img src="${friend.avatar_url || ''}" 
                                     alt="${displayName}" 
                                     class="w-full h-full object-cover user-avatar">
                            </div>
                            <div class="absolute bottom-0 right-0 w-3 h-3 ${statusClass} rounded-full border-2 border-discord-background transition-colors duration-300"></div>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="font-medium text-white truncate">${friendsManager.escapeHtml(displayName)}</div>
                            <div class="text-xs text-gray-400">${friendsManager.escapeHtml(userTag)}</div>
                            <div class="text-xs text-gray-400">${statusText}</div>
                        </div>
                    </div>
                    <div class="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button class="p-2 text-gray-400 hover:text-white hover:bg-discord-background rounded-full" title="Message" onclick="event.stopPropagation(); createDirectMessage('${friend.id}')">
                            <i class="fa-solid fa-message"></i>
                        </button>
                        <button class="p-2 text-gray-400 hover:text-white hover:bg-discord-background rounded-full" title="More" onclick="event.stopPropagation()">
                            <i class="fa-solid fa-ellipsis-vertical"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = friendsHtml;
        updateOnlineCount(onlineFriends.length);
        
        if (window.fallbackImageHandler) {
            setTimeout(() => {
                container.querySelectorAll('img.user-avatar').forEach(img => {
                    window.fallbackImageHandler.processImage(img);
                });
            }, 100);
        }
        
        if (window.nitroCrownManager) {
            setTimeout(() => {
                container.querySelectorAll('.friend-item').forEach(friendEl => {
                    const userId = friendEl.onclick?.toString().match(/createDirectMessage\('([^']+)'\)/)?.[1];
                    const nameEl = friendEl.querySelector('.font-medium.text-white');
                    if (userId && nameEl && userId !== 'null') {
                        window.nitroCrownManager.updateUserElement(nameEl, userId);
                    }
                });
            }, 150);
        }
        
    } catch (error) {
        console.error('Error loading online friends:', error);
        container.innerHTML = '<div class="text-gray-400 p-4">Error loading online friends</div>';
        updateOnlineCount(0);
    }
}

async function loadAllFriends(forceRefresh = false) {
    const container = document.getElementById('all-friends-container');
    if (!container) return;
    
    clearContainerSkeleton(container);
    
    if (!window.FriendsManager) {
        console.error('FriendsManager not loaded');
        container.innerHTML = '<div class="text-gray-400 p-4">Loading friends system...</div>';
        return;
    }
    
    const friendsManager = window.FriendsManager.getInstance();
    
    try {
        const friends = await friendsManager.getFriends(forceRefresh);
        let onlineUsers = {};
        
        if (window.globalSocketManager && window.globalSocketManager.isReady()) {
            onlineUsers = await friendsManager.getOnlineUsers();
        }

        if (!friends || friends.length === 0) {
            container.innerHTML = `
                <div class="p-4 bg-discord-dark rounded text-center">
                    <div class="mb-2 text-gray-400">
                        <i class="fa-solid fa-user-group text-3xl"></i>
                    </div>
                    <p class="text-gray-300 mb-1">No friends yet</p>
                    <p class="text-gray-500 text-sm">Send friend requests to get started</p>
                </div>
            `;
            return;
        }

        friends.sort((a, b) => {
            const statusA = onlineUsers[a.id]?.status || 'offline';
            const statusB = onlineUsers[b.id]?.status || 'offline';
            
            const priorityOrder = { 'online': 0, 'afk': 1, 'offline': 2 };
            const priorityA = priorityOrder[statusA] || 2;
            const priorityB = priorityOrder[statusB] || 2;
            
            if (priorityA !== priorityB) return priorityA - priorityB;
            
            const nameA = a.display_name || a.username;
            const nameB = b.display_name || b.username;
            return nameA.localeCompare(nameB);
        });
        
        let friendsHtml = '';
        friends.forEach(friend => {
            const userData = onlineUsers[friend.id];
            const status = userData?.status || 'offline';
            const statusClass = getStatusClass(status);
            const statusText = getStatusText(status);
            const displayName = friend.display_name || friend.username;
            const userTag = friend.discriminator ? `${friend.username}#${friend.discriminator}` : friend.username;
            
            friendsHtml += `
                <div class="flex justify-between items-center p-3 rounded hover:bg-discord-light group friend-item transition-all duration-200" onclick="createDirectMessage('${friend.id}')">
                    <div class="flex items-center">
                        <div class="relative mr-3">
                            <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                <img src="${friend.avatar_url || ''}" 
                                     alt="${displayName}" 
                                     class="w-full h-full object-cover user-avatar">
                            </div>
                            <div class="friend-status-indicator absolute bottom-0 right-0 w-3 h-3 ${statusClass} rounded-full border-2 border-discord-background transition-colors duration-300" data-user-id="${friend.id}"></div>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="font-medium text-white truncate">${friendsManager.escapeHtml(displayName)}</div>
                            <div class="text-xs text-gray-400">${friendsManager.escapeHtml(userTag)}</div>
                            <div class="friend-status-text text-xs text-gray-400" data-user-id="${friend.id}">${statusText}</div>
                        </div>
                    </div>
                    <div class="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button class="p-2 text-gray-400 hover:text-white hover:bg-discord-background rounded-full" title="Message" onclick="event.stopPropagation(); createDirectMessage('${friend.id}')">
                            <i class="fa-solid fa-message"></i>
                        </button>
                        <button class="p-2 text-gray-400 hover:text-white hover:bg-discord-background rounded-full" title="More" onclick="event.stopPropagation()">
                            <i class="fa-solid fa-ellipsis-vertical"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = friendsHtml;
        
        if (window.fallbackImageHandler) {
            setTimeout(() => {
                container.querySelectorAll('img.user-avatar').forEach(img => {
                    window.fallbackImageHandler.processImage(img);
                });
            }, 100);
        }
        
        if (window.nitroCrownManager) {
            setTimeout(() => {
                container.querySelectorAll('.friend-item').forEach(friendEl => {
                    const userId = friendEl.onclick?.toString().match(/createDirectMessage\('([^']+)'\)/)?.[1];
                    const nameEl = friendEl.querySelector('.font-medium.text-white');
                    if (userId && nameEl && userId !== 'null') {
                        window.nitroCrownManager.updateUserElement(nameEl, userId);
                    }
                });
            }, 150);
        }
        
    } catch (error) {
        console.error('Error loading all friends:', error);
        container.innerHTML = '<div class="text-gray-400 p-4">Error loading friends</div>';
    }
}

async function loadPendingRequests(forceRefresh = false) {
    const container = document.getElementById('pending-friends-container');
    if (!container) return;
    
    clearContainerSkeleton(container);
    
    if (!window.FriendsManager) {
        console.error('FriendsManager not loaded');
        container.innerHTML = '<div class="text-gray-400 p-4">Loading friends system...</div>';
        return;
    }
    
    const friendsManager = window.FriendsManager.getInstance();
    
    try {
        const pending = await friendsManager.getPendingRequests(forceRefresh);
        const { incoming = [], outgoing = [] } = pending;

        if (incoming.length === 0 && outgoing.length === 0) {
            container.innerHTML = `
                <div class="p-4 bg-discord-dark rounded text-center">
                    <div class="mb-2 text-gray-400">
                        <i class="fa-solid fa-user-clock text-3xl"></i>
                    </div>
                    <p class="text-gray-300 mb-1">No pending friend requests</p>
                    <p class="text-gray-500 text-sm">Send friend requests to connect with others</p>
                </div>
            `;
            updatePendingCount(0);
            return;
        }

        let html = '';
        
        if (incoming.length > 0) {
            html += `
                <h3 class="text-xs uppercase font-semibold text-gray-400 mb-2">Incoming Friend Requests — ${incoming.length}</h3>
                <div class="space-y-2 mb-4">
                    ${incoming.map(user => `
                        <div class="flex items-center justify-between p-3 bg-discord-dark rounded transition-all duration-200">
                            <div class="flex items-center">
                                <div class="relative mr-3">
                                    <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                        <img src="${user.avatar_url || ''}" 
                                             alt="${user.username}" 
                                             class="w-full h-full object-cover user-avatar">
                                    </div>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="font-medium text-white truncate friend-name" data-user-id="${user.id}">${friendsManager.escapeHtml(user.username)}</div>
                                    <div class="text-xs text-gray-400">Incoming Friend Request</div>
                                </div>
                            </div>
                            <div class="flex space-x-2">
                                <button class="bg-discord-green hover:bg-discord-green/90 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-md px-3 py-1 text-sm transition-colors"
                                        onclick="acceptFriendRequest('${user.friendship_id}')">Accept</button>
                                <button class="bg-discord-dark hover:bg-discord-light disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md px-3 py-1 text-sm border border-gray-600 transition-colors"
                                        onclick="ignoreFriendRequest('${user.friendship_id}')">Ignore</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        if (outgoing.length > 0) {
            html += `
                <h3 class="text-xs uppercase font-semibold text-gray-400 mt-4 mb-2">Outgoing Friend Requests — ${outgoing.length}</h3>
                <div class="space-y-2">
                    ${outgoing.map(user => `
                        <div class="flex items-center justify-between p-3 bg-discord-dark rounded transition-all duration-200">
                            <div class="flex items-center">
                                <div class="relative mr-3">
                                    <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                        <img src="${user.avatar_url || ''}" 
                                             alt="${user.username}" 
                                             class="w-full h-full object-cover user-avatar">
                                    </div>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="font-medium text-white truncate friend-name" data-user-id="${user.id}">${friendsManager.escapeHtml(user.username)}</div>
                                    <div class="text-xs text-gray-400">Outgoing Friend Request</div>
                                </div>
                            </div>
                            <div>
                                <button class="bg-discord-red hover:bg-discord-red/90 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-md px-3 py-1 text-sm transition-colors"
                                        onclick="cancelFriendRequest('${user.id}')">Cancel</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        container.innerHTML = html;
        updatePendingCount(incoming.length);
        
        if (window.fallbackImageHandler) {
            setTimeout(() => {
                container.querySelectorAll('img.user-avatar').forEach(img => {
                    window.fallbackImageHandler.processImage(img);
                });
            }, 100);
        }
        
        if (window.nitroCrownManager) {
            setTimeout(() => {
                container.querySelectorAll('.friend-name[data-user-id]').forEach(nameEl => {
                    const userId = nameEl.getAttribute('data-user-id');
                    if (userId && userId !== 'null') {
                        window.nitroCrownManager.updateUserElement(nameEl, userId);
                    }
                });
            }, 150);
        }
        
    } catch (error) {
        console.error('Error loading pending requests:', error);
        container.innerHTML = '<div class="text-gray-400 p-4">Error loading pending requests</div>';
    }
}

function clearContainerSkeleton(container) {
    if (!container) return;
    
    const skeletonContainer = container.querySelector('.skeleton-loading-container');
    if (skeletonContainer) {
        skeletonContainer.remove();
        console.log('🧹 [APP-LAYOUT] Cleared skeleton from container');
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
    const requestElement = button.closest('div[class*="flex"][class*="justify-between"]');
    
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
            friendsManager.getFriends(true);
            friendsManager.getPendingRequests(true);
            friendsManager.getOnlineUsers(true);
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
    const requestElement = button.closest('div[class*="flex"][class*="justify-between"]');
    
    try {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Ignoring...';
        
        const result = await window.userAPI.ignoreFriendRequest(friendshipId);
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to ignore friend request');
        }
        
        window.showToast('Friend request ignored', 'success');
        
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
            friendsManager.getPendingRequests(true);
        }
        
    } catch (error) {
        console.error('Error ignoring friend request:', error);
        window.showToast(error.message || 'Failed to ignore friend request', 'error');
        
        button.disabled = false;
        button.textContent = originalText;
    }
}

async function cancelFriendRequest(requestId) {
    const button = event.target;
    const originalText = button.textContent;
    const requestElement = button.closest('div[class*="flex"][class*="justify-between"]');
    
    try {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Canceling...';
        
        const result = await window.userAPI.cancelFriendRequest(requestId);
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to cancel friend request');
        }
        
        window.showToast('Friend request canceled', 'success');
        
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
            friendsManager.getPendingRequests(true);
        }
        
    } catch (error) {
        console.error('Error canceling friend request:', error);
        window.showToast(error.message || 'Failed to cancel friend request', 'error');
        
        button.disabled = false;
        button.textContent = originalText;
    }
}

function updatePendingCountAfterRemoval() {
    const pendingContainer = document.getElementById('pending-friends-container');
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
    const pendingContainer = document.getElementById('pending-friends-container');
    if (!pendingContainer) return;
    
    const requestElements = Array.from(pendingContainer.children).filter(el => 
        el.classList && el.classList.contains('flex') && (
            el.textContent.includes('Incoming Friend Request') || 
            el.textContent.includes('Outgoing Friend Request')
        )
    );
    
    if (requestElements.length === 0) {
        pendingContainer.innerHTML = `
            <div class="p-4 bg-discord-dark rounded text-center">
                <div class="mb-2 text-gray-400">
                    <i class="fa-solid fa-user-clock text-3xl"></i>
                </div>
                <p class="text-gray-300 mb-1">No pending friend requests</p>
                <p class="text-gray-500 text-sm">Send friend requests to connect with others</p>
            </div>
        `;
        updatePendingCountDisplay(0);
    }
}

function initFriendRequestForm() {
    const form = document.getElementById('friend-request-form');
    const input = document.getElementById('friend-username-input');
    const errorDiv = document.getElementById('add-friend-error');
    const successDiv = document.getElementById('add-friend-success');
    
    if (!form || !input) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = input.value.trim();
        
        if (!username) {
            showError(errorDiv, 'Please enter a username');
            return;
        }
        
        if (errorDiv) errorDiv.classList.add('hidden');
        if (successDiv) successDiv.classList.add('hidden');
        
        try {
            const response = await friendAPI.sendFriendRequest(username);
            
            if (response.success) {
                showSuccess(successDiv, response.message || 'Friend request sent successfully!');
                input.value = '';
                
                setTimeout(() => {
                    if (successDiv) successDiv.classList.add('hidden');
                }, 3000);
            } else {
                showError(errorDiv, response.message || 'Failed to send friend request');
            }
        } catch (error) {
            console.error('Error sending friend request:', error);
            showError(errorDiv, 'An error occurred while sending the friend request');
        }
    });
}

function updatePendingCountDisplay(count) {
    const pendingButtons = document.querySelectorAll('[data-tab="pending"]');
    pendingButtons.forEach(button => {
        const existingBadge = button.querySelector('span.bg-discord-red');
        if (existingBadge) {
            existingBadge.remove();
        }
        
        if (count > 0) {
            const badge = document.createElement('span');
            badge.className = 'bg-discord-red text-white text-xs rounded-full px-1.5 py-0.5 ml-1';
            badge.textContent = count;
            button.appendChild(badge);
        }
    });
}

function showToast(message, type = 'info') {
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
    } else {
        console.log(type + ': ' + message);
    }
}

function showError(errorDiv, message) {
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }
}

function showSuccess(successDiv, message) {
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.classList.remove('hidden');
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
    const isHomePage = currentPath === '/home' || currentPath === '/home/friends' || currentPath.startsWith('/home/');
    
    if (window.directMessageNavigation) {
        window.directMessageNavigation.init();
    }
    
    if (window.initDirectMessageNavigation) {
        window.initDirectMessageNavigation();
    }
    
    if (isHomePage && window.initFriendsTabManager) {
        window.initFriendsTabManager();
    }
    
    const setupSocketListeners = () => {
        if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
            setTimeout(setupSocketListeners, 200);
            return;
        }
        

    };
    
    if (window.globalSocketManager && window.globalSocketManager.isReady()) {
        setupSocketListeners();
    } else {
        window.addEventListener('globalSocketReady', () => {
            console.log('🔌 [APP-LAYOUT] Socket ready event received');
            setupSocketListeners();
        });
        window.addEventListener('socketAuthenticated', () => {
            console.log('🔐 [APP-LAYOUT] Socket authenticated event received');
            setupSocketListeners();
        });
    }
    

    

    
    setupCreateServerButton();
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

function updatePendingCount(count) {
    const pendingTabs = document.querySelectorAll('[data-tab="pending"]');
    pendingTabs.forEach(tab => {
        const existingBadge = tab.querySelector('.bg-discord-red');
        if (existingBadge) {
            existingBadge.remove();
        }
        
        if (count > 0) {
            const badge = document.createElement('span');
            badge.className = 'bg-discord-red text-white text-xs rounded-full px-1.5 py-0.5 ml-1';
            badge.textContent = count;
            tab.appendChild(badge);
        }
    });
}