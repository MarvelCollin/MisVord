import { UserAPI } from '../api/user-api.js';
import { FriendAPI } from '../api/friend-api.js';

const friendAPI = FriendAPI;

document.addEventListener('DOMContentLoaded', function() {
    initFriendProfileCards();
    initSearchFilter();
    setupFriendSocketListeners();
    initPendingRequests();
});

function initFriendProfileCards() {
    const friendItems = document.querySelectorAll('.friend-item');

    friendItems.forEach(item => {
        item.addEventListener('mouseenter', showProfileCard);
        item.addEventListener('mouseleave', hideProfileCard);
    });
}

function showProfileCard(e) {
    const friendItem = e.currentTarget;
    const userId = friendItem.dataset.userId;

    if (!userId) return;

    if (window.activeProfileCard) {
        window.activeProfileCard.remove();
        window.activeProfileCard = null;
    }

    const rect = friendItem.getBoundingClientRect();    UserAPI.getUserProfile(userId)
        .then(data => {
            if (!data) return;

            const { user } = data;

            if (!user) return;

            const card = document.createElement('div');
            card.className = 'profile-card';
            card.innerHTML = createProfileCardContent(user);

            document.body.appendChild(card);

            positionProfileCard(card, rect);

            window.activeProfileCard = card;
        })
        .catch(error => console.error('Error fetching profile data:', error));
}

function createProfileCardContent(user) {
    const statusColors = {
        'online': 'bg-discord-green',
        'away': 'bg-discord-yellow',
        'dnd': 'bg-discord-red',
        'offline': 'bg-gray-500'
    };

    const statusColor = statusColors[user.status] || 'bg-gray-500';

    const badges = user.badges || [];
    let badgeHtml = '';

    if (badges.length > 0) {
        badgeHtml = `
            <div class="profile-badges">
                ${badges.map(badge => `
                    <div class="profile-badge" title="${badge.name}">
                        <img src="${badge.icon}" alt="${badge.name}" class="w-full h-full">
                    </div>
                `).join('')}
            </div>
        `;
    }

    return `
        <div class="profile-header" style="background-color: ${user.banner_color || '#5865f2'}"></div>
        <div class="profile-content">
            <div class="flex items-start mb-3">
                <div class="relative">                    <div class="profile-avatar">
                        <img src="${user.avatar_url || '/public/assets/common/main-logo.png'}" 
                             alt="Avatar" class="w-full h-full object-cover rounded-full">
                    </div>
                    <span class="absolute bottom-0 right-0 w-5 h-5 rounded-full border-4 border-[#18191c] ${statusColor}"></span>
                </div>
                <div class="flex-1 pt-4 pl-3">
                    <div class="bg-[#111214] rounded-md px-2 py-1">
                        <div class="font-semibold text-white">${escapeHtml(user.username)}</div>
                        <div class="text-sm text-gray-400">#${user.discriminator || '0000'}</div>
                    </div>
                </div>
            </div>

            ${badgeHtml}

            ${user.about ? `
                <div class="mb-3">
                    <div class="text-xs font-bold text-gray-400 uppercase mb-1">About Me</div>
                    <div class="bg-[#111214] rounded-md p-2 text-sm text-gray-300">
                        ${escapeHtml(user.about)}
                    </div>
                </div>
            ` : ''}

            ${user.member_since ? `
                <div class="mb-3">
                    <div class="text-xs font-bold text-gray-400 uppercase mb-1">Member Since</div>
                    <div class="bg-[#111214] rounded-md p-2 text-sm text-gray-300">
                        ${new Date(user.member_since).toLocaleDateString()}
                    </div>
                </div>
            ` : ''}

            <div class="profile-divider"></div>

            <div class="flex space-x-2 py-2">
                <button class="bg-discord-green hover:bg-discord-green/90 text-white rounded flex-1 py-2 text-sm font-medium">Send Message</button>
                <button class="bg-discord-dark hover:bg-discord-light text-white rounded p-2">
                    <i class="fas fa-ellipsis-vertical"></i>
                </button>
            </div>
        </div>
    `;
}

function positionProfileCard(card, targetRect) {
    const cardHeight = card.offsetHeight;
    const windowHeight = window.innerHeight;

    let top = targetRect.top;

    if (targetRect.top + cardHeight > windowHeight - 20) {
        top = windowHeight - cardHeight - 20;
    }

    card.style.top = 'auto';
    card.style.bottom = 'auto';
    card.style.left = `${targetRect.left + targetRect.width + 10}px`;
    card.style.top = `${top}px`;
}

function hideProfileCard() {
    if (window.activeProfileCard) {
        setTimeout(() => {
            if (window.activeProfileCard && !window.activeProfileCard.matches(':hover')) {
                window.activeProfileCard.remove();
                window.activeProfileCard = null;
            }
        }, 300);
    }
}

function initSearchFilter() {
    const searchInput = document.querySelector('.search-input');
    if (!searchInput) return;

    searchInput.addEventListener('input', filterFriends);
}

function filterFriends() {
    const searchInput = document.querySelector('.search-input');
    if (!searchInput) return;

    const query = searchInput.value.toLowerCase();
    const friendItems = document.querySelectorAll('.friend-item');

    friendItems.forEach(item => {
        const username = item.querySelector('.friend-name').textContent.toLowerCase();

        if (username.includes(query)) {
            item.classList.remove('hidden');
        } else {
            item.classList.add('hidden');
        }
    });
}

function setupFriendSocketListeners() {
    if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
        window.logger?.warn('home', 'Global socket manager not ready for friend listeners');
        return;
    }

    const socket = window.globalSocketManager.socket;
    if (!socket) return;

    socket.on('friend-request', handleFriendRequest);
    socket.on('friend-status-update', updateFriendStatus);
    socket.on('friend-activity-update', updateFriendActivity);
}

function handleFriendRequest(data) {
    const { type, user } = data;

    if (type === 'new') {
        addPendingRequest(user);
        updatePendingCount();
    } else if (type === 'accepted') {
        addNewFriend(user);
        showNotification(`${user.username} accepted your friend request`);
    }
}

function updateFriendStatus(data) {
    const { userId, status } = data;
    const friendItems = document.querySelectorAll(`.friend-item[data-user-id="${userId}"]`);

    const statusColors = {
        'online': 'bg-discord-green',
        'away': 'bg-discord-yellow',
        'dnd': 'bg-discord-red',
        'offline': 'bg-gray-500'
    };

    const statusTexts = {
        'online': 'Online',
        'away': 'Away',
        'dnd': 'Do Not Disturb',
        'offline': 'Offline'
    };

    friendItems.forEach(item => {
        const statusDot = item.querySelector('.status-indicator');
        const statusText = item.querySelector('.friend-status');

        if (statusDot) {
            statusDot.className = `status-indicator ${statusColors[status] || 'bg-gray-500'}`;
        }

        if (statusText) {
            statusText.textContent = statusTexts[status] || 'Offline';
        }
    });
}

function updateFriendActivity(data) {
    const { userId, activity } = data;
    const activeNowSection = document.querySelector('.active-now-list');

    if (!activeNowSection) return;

    const existingActivity = document.querySelector(`.activity-item[data-user-id="${userId}"]`);

    if (activity) {
        if (existingActivity) {
            existingActivity.querySelector('.activity-name').textContent = activity.name;
            existingActivity.querySelector('.activity-time').textContent = `for ${getElapsedTime(activity.started_at)}`;
        } else {
            const activityHtml = createActivityItem(data);
            activeNowSection.insertAdjacentHTML('beforeend', activityHtml);
        }
    } else if (existingActivity) {
        existingActivity.remove();
    }
}

function createActivityItem(data) {
    const { user, activity } = data;

    return `        <div class="activity-item" data-user-id="${user.id}">
            <div class="mb-3 rounded-md bg-discord-background overflow-hidden">
                <div class="p-3">                    <div class="flex items-center mb-2">
                        <div class="relative mr-2">
                            <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                <img src="${user.avatar_url || '/public/assets/common/main-logo.png'}" 
                                     alt="Avatar" class="w-full h-full object-cover">
                            </div>
                            <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-background bg-discord-green"></span>
                        </div>
                        <div class="flex-1">
                            <div class="font-medium text-white text-sm">${escapeHtml(user.username)}</div>
                        </div>
                    </div>

                    <div class="flex items-center bg-discord-darker p-2 rounded">
                        <div class="w-8 h-8 rounded bg-discord-dark flex items-center justify-center mr-2">
                            <i class="fas fa-gamepad text-gray-400"></i>
                        </div>

                        <div class="flex-1">
                            <div class="text-xs text-gray-400">Playing</div>
                            <div class="text-sm text-white font-medium truncate activity-name">${escapeHtml(activity.name)}</div>
                            <div class="text-xs text-gray-400 activity-time">for ${getElapsedTime(activity.started_at)}</div>
                        </div>
                    </div>
                </div>

                <div class="bg-discord-darker py-2 px-3 flex">
                    <button class="flex-1 bg-discord-background text-white text-xs py-1 rounded hover:bg-gray-600 font-medium">Join</button>
                </div>
            </div>
        </div>
    `;
}

function getElapsedTime(startTime) {
    const start = new Date(startTime).getTime();
    const now = Date.now();
    const diff = now - start;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
        return `${hours}h ${mins}m`;
    } else {
        return `${mins} minutes`;
    }
}

function initPendingRequests() {
    const pendingTab = document.querySelector('button[data-tab="pending"]');
    if (!pendingTab) return;

    pendingTab.addEventListener('click', loadPendingRequests);
}

function loadPendingRequests() {
    const pendingContainer = document.getElementById('pending-requests');
    if (!pendingContainer) return;

    friendAPI.getPendingRequests()
        .then(data => {
            pendingContainer.innerHTML = '';

            if (data.incoming && data.incoming.length > 0) {
                const incomingHtml = `
                    <h3 class="text-xs uppercase font-semibold text-gray-400 mb-2">Incoming Friend Requests — ${data.incoming.length}</h3>
                    <div class="space-y-2">
                        ${data.incoming.map(createPendingRequestItem).join('')}
                    </div>
                `;
                pendingContainer.insertAdjacentHTML('beforeend', incomingHtml);
            }

            if (data.outgoing && data.outgoing.length > 0) {
                const outgoingHtml = `
                    <h3 class="text-xs uppercase font-semibold text-gray-400 mt-4 mb-2">Outgoing Friend Requests — ${data.outgoing.length}</h3>
                    <div class="space-y-2">
                        ${data.outgoing.map(createOutgoingRequestItem).join('')}
                    </div>
                `;
                pendingContainer.insertAdjacentHTML('beforeend', outgoingHtml);
            }

            if (!data.incoming?.length && !data.outgoing?.length) {
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

function createPendingRequestItem(user) {
    return `
        <div class="flex items-center justify-between p-2 bg-discord-background rounded">
            <div class="flex items-center">                <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden mr-3">
                    <img src="${user.avatar_url || '/public/assets/common/main-logo.png'}" 
                         alt="Avatar" class="w-full h-full object-cover">
                </div>
                <div>
                    <div class="font-medium text-white">${escapeHtml(user.username)}</div>
                    <div class="text-xs text-gray-400">Incoming Friend Request</div>
                </div>
            </div>
            <div class="flex space-x-2">
                <button class="bg-discord-green hover:bg-discord-green/90 text-white rounded-md px-3 py-1 text-sm"
                        onclick="acceptFriendRequest('${user.id}')">Accept</button>
                <button class="bg-discord-dark hover:bg-discord-light text-white rounded-md px-3 py-1 text-sm"
                        onclick="ignoreFriendRequest('${user.id}')">Ignore</button>
            </div>
        </div>
    `;
}

function createOutgoingRequestItem(user) {
    return `
        <div class="flex items-center justify-between p-2 bg-discord-background rounded">
            <div class="flex items-center">                <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden mr-3">
                    <img src="${user.avatar_url || '/public/assets/common/main-logo.png'}" 
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
    `;
}

function acceptFriendRequest(userId) {
    if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {        window.logger?.warn('home', 'Socket not ready for friend request acceptance');
        return;
    }

    const socket = window.globalSocketManager.socket;
    if (socket) {
        socket.emit('friend-request-response', { userId, action: 'accept' });

        const requestElement = document.querySelector(`.pending-request[data-user-id="${userId}"]`);
        if (requestElement) {
            requestElement.remove();
        }

        updatePendingCount();
    }
}

function ignoreFriendRequest(userId) {
    if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
        window.logger?.warn('home', 'Socket not ready for friend request ignore');
        return;
    }

    const socket = window.globalSocketManager.socket;
    if (socket) {
        socket.emit('friend-request-response', { userId, action: 'ignore' });

        const requestElement = document.querySelector(`.pending-request[data-user-id="${userId}"]`);
        if (requestElement) {
            requestElement.remove();
        }

        updatePendingCount();
    }
}

function cancelFriendRequest(userId) {
    if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
        window.logger?.warn('home', 'Socket not ready for friend request cancellation');
        return;
    }

    const socket = window.globalSocketManager.socket;
    if (socket) {
        socket.emit('friend-request-response', { userId, action: 'cancel' });

        const requestElement = document.querySelector(`.pending-request[data-user-id="${userId}"]`);
        if (requestElement) {
            requestElement.remove();
        }
    }
}

function addPendingRequest(user) {
    const pendingContainer = document.getElementById('pending-requests');
    const pendingHeader = pendingContainer?.querySelector('h3');

    if (!pendingContainer) return;

    if (pendingHeader) {
        const countEl = pendingHeader.textContent.match(/(\d+)/);
        if (countEl) {
            const count = parseInt(countEl[1]) + 1;
            pendingHeader.textContent = pendingHeader.textContent.replace(/(\d+)/, count);
        }

        const requestHtml = createPendingRequestItem(user);
        pendingContainer.querySelector('div').insertAdjacentHTML('afterbegin', requestHtml);
    } else {
        pendingContainer.innerHTML = `
            <h3 class="text-xs uppercase font-semibold text-gray-400 mb-2">Incoming Friend Requests — 1</h3>
            <div class="space-y-2">
                ${createPendingRequestItem(user)}
            </div>
        `;
    }
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

function addNewFriend(user) {
    const friendsList = document.querySelector('.friends-list');
    if (!friendsList) return;

    const friendHtml = `
        <div class="flex justify-between items-center p-2 rounded hover:bg-discord-light group friend-item" data-user-id="${user.id}">
            <div class="flex items-center">
                <div class="relative mr-3">                    <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                        <img src="${user.avatar_url || '/public/assets/common/main-logo.png'}" 
                             alt="Avatar" class="w-full h-full object-cover">
                    </div>
                    <span class="status-indicator bg-discord-green"></span>
                </div>
                <div>
                    <div class="font-medium text-white friend-name">${escapeHtml(user.username)}</div>
                    <div class="text-xs text-gray-400 friend-status">Online</div>
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

    friendsList.insertAdjacentHTML('afterbegin', friendHtml);

    const newFriendItem = friendsList.querySelector(`.friend-item[data-user-id="${user.id}"]`);
    if (newFriendItem) {
        newFriendItem.addEventListener('mouseenter', showProfileCard);
        newFriendItem.addEventListener('mouseleave', hideProfileCard);
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 right-4 bg-discord-dark border border-discord-primary text-white p-3 rounded-md shadow-lg z-50 transition-opacity duration-300';
    notification.innerHTML = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('opacity-0');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}