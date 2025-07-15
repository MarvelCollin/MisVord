import '../utils/friends-manager.js';

document.addEventListener('DOMContentLoaded', function() {
    initFriendProfileCards();
    initSearchFilter();
    setupUniqueSocketListeners();
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

    const rect = friendItem.getBoundingClientRect();
    
    window.userAPI.getUserProfile(userId)
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

    return `
        <div class="profile-header" style="background-color: ${user.banner_color || '#5865f2'}"></div>
        <div class="profile-content">
            <div class="flex items-start mb-3">
                <div class="relative">
                    <div class="profile-avatar">
                        <img src="${user.avatar_url || '/public/assets/common/default-profile-picture.png'}" 
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

function setupUniqueSocketListeners() {
    if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {

        return false;
    }
    
    const io = window.globalSocketManager.io;
    io.on('friend-activity-update', updateFriendActivity);

    return true;
}

window.addEventListener('globalSocketReady', function() {

    setupUniqueSocketListeners();
});

window.addEventListener('socketAuthenticated', function() {

    setupUniqueSocketListeners();
});

function updateFriendActivity(data) {
    const { user_id: userId, activity } = data;
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

    return `
        <div class="activity-item" data-user-id="${user.id}">
            <div class="mb-3 rounded-md bg-discord-background overflow-hidden">
                <div class="p-3">
                    <div class="flex items-center mb-2">
                        <div class="relative mr-2">
                            <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                <img src="${user.avatar_url || '/public/assets/common/default-profile-picture.png'}" 
                                     alt="Avatar" class="w-full h-full object-cover">
                            </div>
                            <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-background bg-discord-green z-30"></span>
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
    const start = new Date(startTime);
    start.setTime(start.getTime() + (7 * 60 * 60 * 1000));
    
    const now = new Date();
    now.setTime(now.getTime() + (7 * 60 * 60 * 1000));
    
    const diff = now - start;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
        return `${hours}h ${mins}m`;
    } else {
        return `${mins} minutes`;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

