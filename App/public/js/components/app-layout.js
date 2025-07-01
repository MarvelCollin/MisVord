import '../api/friend-api.js';
import '../api/user-api.js';
import '../utils/friends-manager.js';
import '../core/ui/toast.js';

const friendAPI = window.FriendAPI;

document.addEventListener('DOMContentLoaded', function () {
    initFriendRequestForm();
    
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
    console.log('🔄 [APP-LAYOUT] loadOnlineFriends called, forceRefresh:', forceRefresh);
    
    const mainLayoutContainer = document.querySelector('#app-container .flex.flex-1.overflow-hidden');
    const skeletonAttribute = mainLayoutContainer?.getAttribute('data-skeleton');
    console.log('🔍 [APP-LAYOUT] Skeleton check:', {
        containerFound: !!mainLayoutContainer,
        skeletonAttribute: skeletonAttribute,
        willSkip: skeletonAttribute === 'home'
    });
    
    if (mainLayoutContainer && skeletonAttribute === 'home') {
        console.log('⏸️ [APP-LAYOUT] Skeleton loading active, skipping online friends load');
        return;
    }
    
    const container = document.getElementById('online-friends-container');
    if (!container) {
        console.warn('⚠️ [APP-LAYOUT] Online friends container not found');
        return;
    }
    
    if (!window.FriendsManager) {
        console.error('❌ [APP-LAYOUT] FriendsManager not loaded');
        container.innerHTML = '<div class="text-gray-400 p-4">Loading friends system...</div>';
        return;
    }
    
    const friendsManager = window.FriendsManager.getInstance();
    console.log('📊 [APP-LAYOUT] FriendsManager instance obtained');
    
    try {
        const friends = await friendsManager.getFriends(forceRefresh);
        let onlineUsers = {};
        
        if (window.globalSocketManager && window.globalSocketManager.isReady()) {
            onlineUsers = await friendsManager.getOnlineUsers(forceRefresh);
        }
        
        console.log('📊 [APP-LAYOUT] Data loaded:', {
            friendsCount: friends?.length || 0,
            onlineUsersCount: Object.keys(onlineUsers).length,
            onlineUsers: Object.keys(onlineUsers),
            friendIds: friends?.map(f => f.id) || []
        });
        
        const onlineFriends = friends ? friends.filter(friend => {
            const userData = onlineUsers[friend.id];
            const isOnline = userData && userData.status !== 'offline';
            console.log(`🔍 [APP-LAYOUT] Friend ${friend.username} (${friend.id}):`, {
                userData,
                isOnline,
                status: userData?.status
            });
            return isOnline;
        }) : [];
        
        console.log('✨ [APP-LAYOUT] Online friends found:', onlineFriends.length, onlineFriends.map(f => f.username));

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
            console.log('📭 [APP-LAYOUT] No online friends, showing empty state');
            return;
        }

        onlineFriends.sort((a, b) => {
            const statusA = onlineUsers[a.id]?.status || 'offline';
            const statusB = onlineUsers[b.id]?.status || 'offline';
            
            if (statusA === 'online' && statusB !== 'online') return -1;
            if (statusB === 'online' && statusA !== 'online') return 1;
            if (statusA === 'idle' && statusB === 'offline') return -1;
            if (statusB === 'idle' && statusA === 'offline') return 1;
            
            return a.username.localeCompare(b.username);
        });
        
        let friendsHtml = '';
        onlineFriends.forEach(friend => {
            const userData = onlineUsers[friend.id];
            const status = userData?.status || 'offline';
            const statusClass = getStatusClass(status);
            const statusText = getStatusText(status);
            
            friendsHtml += `
                <div class="flex items-center p-3 hover:bg-discord-light rounded group cursor-pointer transition-colors animate-fadeIn" onclick="createDirectMessage('${friend.id}')">
                    <div class="relative mr-3">
                        <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                            <img src="${friend.avatar_url || '/public/assets/common/default-profile-picture.png'}" 
                                 alt="Avatar" class="w-full h-full object-cover">
                        </div>
                        <div class="absolute bottom-0 right-0 w-3 h-3 ${statusClass} rounded-full border-2 border-discord-background"></div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="font-medium text-white truncate">${friendsManager.escapeHtml(friend.username)}</div>
                        <div class="text-xs text-gray-400">${statusText}</div>
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
        
        console.log(`✅ [APP-LAYOUT] Successfully updated UI with ${onlineFriends.length} online friends`);
    } catch (error) {
        console.error('❌ [APP-LAYOUT] Error loading online friends:', error);
        container.innerHTML = '<div class="text-red-400 p-4">Error loading friends</div>';
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
            
            if (statusA !== 'offline' && statusB === 'offline') return -1;
            if (statusB !== 'offline' && statusA === 'offline') return 1;
            if (statusA === 'online' && statusB !== 'online') return -1;
            if (statusB === 'online' && statusA !== 'online') return 1;
            
            return a.username.localeCompare(b.username);
        });
        
        let friendsHtml = '';
        friends.forEach(friend => {
            const userData = onlineUsers[friend.id];
            const status = userData?.status || 'offline';
            const statusClass = getStatusClass(status);
            const statusText = getStatusText(status);
            
            friendsHtml += `
                <div class="flex items-center p-3 hover:bg-discord-light rounded group cursor-pointer transition-colors" onclick="createDirectMessage('${friend.id}')">
                    <div class="relative mr-3">
                        <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                            <img src="${friend.avatar_url || '/public/assets/common/default-profile-picture.png'}" 
                                 alt="Avatar" class="w-full h-full object-cover">
                        </div>
                        <div class="friend-status-indicator absolute bottom-0 right-0 w-3 h-3 ${statusClass} rounded-full border-2 border-discord-background" data-user-id="${friend.id}"></div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="font-medium text-white truncate">${friendsManager.escapeHtml(friend.username)}</div>
                        <div class="friend-status-text text-xs text-gray-400" data-user-id="${friend.id}">${statusText}</div>
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
        console.log(`[App Layout] Loaded ${friends.length} friends with real-time presence`);
    } catch (error) {
        console.error('[App Layout] Error loading all friends:', error);
        container.innerHTML = '<div class="text-red-400 p-4">Error loading friends</div>';
    }
}

async function loadPendingRequests(forceRefresh = false) {
    const container = document.getElementById('pending-friends-container');
    if (!container) return;
    
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
        }

        if (outgoing.length > 0) {
            html += `
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
        }

        container.innerHTML = html;
        updatePendingCount(incoming.length);
        console.log(`[App Layout] Loaded ${incoming.length} incoming and ${outgoing.length} outgoing friend requests`);
    } catch (error) {
        console.error('[App Layout] Error loading pending requests:', error);
        container.innerHTML = '<div class="text-red-400 p-4">Error loading pending requests</div>';
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
            friendsManager.getPendingRequests(true);
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
            friendsManager.getPendingRequests(true);
        }
        
    } catch (error) {
        console.error('Error cancelling friend request:', error);
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
    
    if (window.directMessageNavigation) {
        window.directMessageNavigation.init();
    }
    
    if (window.initDirectMessageNavigation) {
        window.initDirectMessageNavigation();
    }
    
    if (window.initFriendsTabManager) {
        window.initFriendsTabManager();
    }
    
    const setupSocketListeners = () => {
        if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
            setTimeout(setupSocketListeners, 200);
            return;
        }
        
        if (window.FriendsManager) {
            const friendsManager = window.FriendsManager.getInstance();
            console.log('🔗 [APP-LAYOUT] Setting up FriendsManager listeners');
            
            friendsManager.subscribe((type, data) => {
                console.log(`🔄 [APP-LAYOUT] FriendsManager event: ${type}`, data);
                switch(type) {
                    case 'user-online':
                    case 'user-offline':
                    case 'user-presence-update':
                    case 'online-users-updated':
                        console.log('🔄 [APP-LAYOUT] Refreshing online friends due to presence update');
                        loadOnlineFriends(true);
                        break;
                    case 'friends-updated':
                        console.log('🔄 [APP-LAYOUT] Refreshing all friends due to friends update');
                        loadAllFriends(true);
                        break;
                    case 'pending-updated':
                        console.log('🔄 [APP-LAYOUT] Refreshing pending requests due to pending update');
                        loadPendingRequests(true);
                        break;
                }
            });
            
            if (friendsManager && friendsManager.setupSocketListeners) {
                friendsManager.setupSocketListeners();
            }
            console.log('✅ [APP-LAYOUT] FriendsManager integration complete');
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
    
    if (currentPath === '/home' || currentPath === '/home/friends' || currentPath.startsWith('/home/')) {
        setTimeout(() => {
            const urlParams = new URLSearchParams(window.location.search);
            const tab = urlParams.get('tab') || 'online';
            
            switch (tab) {
                case 'online':
                    loadOnlineFriends();
                    break;
                case 'all':
                    loadAllFriends();
                    break;
                case 'pending':
                    loadPendingRequests();
                    break;
            }
        }, 200);
    }
    
    setInterval(() => {
        if (window.globalSocketManager && window.globalSocketManager.isReady()) {
            window.globalSocketManager.io.emit('get-online-users');
        }
    }, 30000);
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

function getStatusClass(status) {
    switch (status) {
        case 'online':
            return 'bg-discord-green';
        case 'offline':
        default:
            return 'bg-gray-500';
    }
}

function getStatusText(status) {
    switch (status) {
        case 'online':
            return 'Online';
        case 'offline':
        default:
            return 'Offline';
    }
}