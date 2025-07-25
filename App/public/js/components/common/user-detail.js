class UserDetailModal {
    constructor() {
        this.modal = document.getElementById('user-detail-modal');
        this.mutualDetailModal = document.getElementById('mutual-detail-modal');
        this.currentUserId = null;
        this.currentServerId = null;
        this.userData = null;
        this.initialRoleName = null;
        this.isOpening = false;
        this.openingTimeout = null;

        if (this.modal) {
            this.initElements();
            this.initEvents();
        }
    }

    initElements() {
        this.closeBtn = this.modal.querySelector('.user-detail-close-btn');
        this.avatarContainer = this.modal.querySelector('#user-detail-avatar-container');
        this.banner = this.modal.querySelector('.user-banner');
        this.nameElement = this.modal.querySelector('#user-detail-name');
        this.usernameElement = this.modal.querySelector('#user-detail-username');
        this.discriminatorElement = this.modal.querySelector('#user-detail-discriminator');
        this.statusIndicator = this.modal.querySelector('#user-detail-status-indicator');

        this.aboutSection = this.modal.querySelector('#user-detail-bio');
        this.memberSinceSection = this.modal.querySelector('#user-detail-server-info');
        this.rolesSection = this.modal.querySelector('#user-detail-roles');
        this.rolesWrapper = this.modal.querySelector('#user-detail-roles-wrapper');

        this.mutualSection = this.modal.querySelector('.user-detail-mutual');
        this.mutualServersElement = this.modal.querySelector('#user-detail-mutual-servers');
        this.mutualFriendsElement = this.modal.querySelector('#user-detail-mutual-friends');
        this.mutualServersItem = this.modal.querySelector('#mutual-servers-item');
        this.mutualFriendsItem = this.modal.querySelector('#mutual-friends-item');

        this.messageBtn = this.modal.querySelector('#user-detail-message-btn');
        
        this.mutualDetailTitle = this.modal.querySelector('#mutual-detail-title');
        this.mutualDetailContent = this.modal.querySelector('#mutual-detail-content');
        this.mutualDetailCloseBtn = this.modal.querySelector('.mutual-detail-close-btn');
    }

    initEvents() {
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.hide());
        }

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible()) {
                this.hide();
            }
        });

        if (this.messageBtn) {
            this.messageBtn.addEventListener('click', () => this.handleMessageClick());
        }

        if (this.mutualServersItem) {
            this.mutualServersItem.addEventListener('click', () => this.showMutualServersDetail());
        }
        
        if (this.mutualFriendsItem) {
            this.mutualFriendsItem.addEventListener('click', () => this.showMutualFriendsDetail());
        }
        
        if (this.mutualDetailCloseBtn) {
            this.mutualDetailCloseBtn.addEventListener('click', () => this.hideMutualDetail());
        }
        
        if (this.mutualDetailModal) {
            this.mutualDetailModal.addEventListener('click', (e) => {
                if (e.target === this.mutualDetailModal) {
                    this.hideMutualDetail();
                }
            });
        }

        window.addEventListener('ownPresenceUpdate', () => {
            if (this.isVisible() && this.currentUserId) {
                this.updateStatusIndicator(this.currentUserId);
            }
        });

        window.addEventListener('user-presence-update', (event) => {
            if (this.isVisible() && this.currentUserId && event.detail?.user_id === this.currentUserId) {
                this.updateStatusIndicator(this.currentUserId);
            }
        });

        if (window.globalSocketManager?.io) {
            window.globalSocketManager.io.on('user-presence-update', (data) => {
                if (this.isVisible() && this.currentUserId && data.user_id === this.currentUserId) {
                    this.updateStatusIndicator(this.currentUserId);
                }
            });
        }

        document.addEventListener('scroll', (e) => {
            if (this.isVisible() && e.target.classList.contains('participant-content')) {
                this.hide();
            }
        }, true);

        window.addEventListener('resize', () => {
            if (this.isVisible()) {
                this.hide();
            }
        });
    }

    show(options = {}) {
        if (!options.userId) {
            console.error('User ID is required to show user detail modal');
            return;
        }

        if (this.isOpening) {
            return;
        }

        if (this.openingTimeout) {
            clearTimeout(this.openingTimeout);
        }

        const participantContainer = options.triggerElement?.closest('.participant-content');
        if (participantContainer) {
            if (participantContainer.classList.contains('scrolling')) {
                return;
            }
            
            const scrollBefore = participantContainer.scrollTop;
            requestAnimationFrame(() => {
                const scrollAfter = participantContainer.scrollTop;
                if (Math.abs(scrollBefore - scrollAfter) > 1) {
                    return;
                }
                this.performShow(options);
            });
        } else {
            this.performShow(options);
        }
    }

    performShow(options = {}) {

        this.isOpening = true;
        this.openingTimeout = setTimeout(() => {
            this.isOpening = false;
        }, 500);
        
        this.currentUserId = options.userId;
        this.currentServerId = options.serverId || null;
        this.initialRoleName = options.role || null;

        if (this.rolesWrapper) {
            this.rolesWrapper.style.display = this.currentServerId ? 'block' : 'none';
        }
        
        this.modal.classList.add('active');
        
        if (options.triggerElement && typeof options.triggerElement.getBoundingClientRect === 'function') {
            const rect = options.triggerElement.getBoundingClientRect();
            
            if (rect.width === 0 && rect.height === 0) {
                this.showCenteredModal();
                return;
            }
            
            if (rect.left === 0 && rect.top === 0 && rect.right === 0 && rect.bottom === 0) {
                this.showCenteredModal();
                return;
            }
            
            const modalWidth = 340;
            const modalHeight = 400;

            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            if (viewportWidth === 0 || viewportHeight === 0) {
                this.showCenteredModal();
                return;
            }

            let adjustedLeft = rect.left;
            let adjustedTop = rect.top;

            const participantContainer = options.triggerElement.closest('.participant-content');
            if (participantContainer) {
                const containerRect = participantContainer.getBoundingClientRect();
                
                adjustedTop = rect.top;
                adjustedLeft = rect.left;
                
                if (adjustedTop < containerRect.top + 10) {
                    adjustedTop = containerRect.top + 10;
                }
                if (adjustedTop + modalHeight > containerRect.bottom - 10) {
                    adjustedTop = containerRect.bottom - modalHeight - 10;
                }
                
                if (adjustedLeft < containerRect.left) {
                    adjustedLeft = containerRect.left + 10;
                }
            }

            const showOnRight = adjustedLeft + rect.width + modalWidth <= viewportWidth;
            let left = showOnRight ? adjustedLeft + rect.width + 10 : adjustedLeft - modalWidth - 10;

            let top = adjustedTop;
            if (top + modalHeight > viewportHeight) {
                top = Math.max(10, viewportHeight - modalHeight - 10);
            }
            if (top < 10) {
                top = 10;
            }

            if (left < 10) {
                left = 10;
            }
            if (left + modalWidth > viewportWidth - 10) {
                left = viewportWidth - modalWidth - 10;
            }

            if (top < 10) {
                top = 10;
            }
            if (top + modalHeight > viewportHeight - 10) {
                top = viewportHeight - modalHeight - 10;
            }
            
            const container = this.modal.querySelector('.user-detail-container');
            if (container) {
                container.style.position = 'absolute';
                container.style.left = `${Math.max(10, left)}px`;
                container.style.top = `${Math.max(10, top)}px`;
                container.style.transform = 'none';
                container.style.zIndex = '1001';
            }
        }   
        else if (options.position) {
            const { left, top } = options.position;
            
            const container = this.modal.querySelector('.user-detail-container');
            if (container) {
                container.style.position = 'absolute';
                container.style.left = `${left}px`;
                container.style.top = `${top}px`;
                container.style.transform = 'none';
            }
        } else {
            this.showCenteredModal();
        }

        const startTime = Date.now();
        const minLoadingTime = 800;

        this.showLoadingState();
        
        this.fetchUserData()
            .then(userData => {
                const elapsedTime = Date.now() - startTime;
                const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
                
                setTimeout(() => {
                    if (userData) {
                        this.displayUserData(userData);
                        
                        if (this.currentUserId) {
                            this.updateStatusIndicator(this.currentUserId);
                        }
                    }
                }, remainingTime);
            })
            .catch(error => {
                console.error('Error fetching user data:', error);
                
                const elapsedTime = Date.now() - startTime;
                const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
                
                setTimeout(() => {
                    this.showErrorState();
                }, remainingTime);
            });
    }

    hide() {
        this.modal.classList.remove('active');
        this.resetModalPosition();
        this.isOpening = false;
        if (this.openingTimeout) {
            clearTimeout(this.openingTimeout);
            this.openingTimeout = null;
        }
    }

    isVisible() {
        return this.modal.classList.contains('active');
    }

    resetModalPosition() {
        const container = this.modal.querySelector('.user-detail-container');
        if (container) {
            container.style.position = '';
            container.style.left = '';
            container.style.top = '';
            container.style.transform = '';
        }
    }

    showCenteredModal() {
        const container = this.modal.querySelector('.user-detail-container');
        if (container) {
            container.style.position = 'fixed';
            container.style.left = '50%';
            container.style.top = '50%';
            container.style.transform = 'translate(-50%, -50%)';
            container.style.zIndex = '1001';
        }
    }

    showLoadingState() {
        if (this.nameElement) {
            this.nameElement.innerHTML = '<div class="skeleton-loading skeleton-name"></div>';
        }
        
        if (this.usernameElement) {
            this.usernameElement.innerHTML = '<div class="skeleton-loading skeleton-username"></div>';
        }
        
        if (this.discriminatorElement) {
            this.discriminatorElement.innerHTML = '<div class="skeleton-loading skeleton-discriminator"></div>';
        }
        
        if (this.aboutSection) {
            this.aboutSection.innerHTML = `
                <div class="skeleton-loading skeleton-text"></div>
                <div class="skeleton-loading skeleton-text medium"></div>
                <div class="skeleton-loading skeleton-text short"></div>
            `;
        }
        
        if (this.memberSinceSection) {
            this.memberSinceSection.innerHTML = '<div class="skeleton-loading skeleton-text short"></div>';
        }
        
        if (this.rolesSection) {
            this.rolesSection.innerHTML = `
                <div class="skeleton-loading skeleton-role"></div>
                <div class="skeleton-loading skeleton-role"></div>
                <div class="skeleton-loading skeleton-role"></div>
            `;
        }
        
        if (this.mutualServersElement) {
            this.mutualServersElement.innerHTML = '<div class="skeleton-loading skeleton-mutual"></div>';
        }
        
        if (this.mutualFriendsElement) {
            this.mutualFriendsElement.innerHTML = '<div class="skeleton-loading skeleton-mutual"></div>';
        }
        
        if (this.avatarContainer) {
            this.avatarContainer.innerHTML = `
                <div class="user-avatar">
                    <img src="/public/assets/common/default-profile-picture.png" alt="Default Avatar" id="user-detail-avatar" class="opacity-30">
                    <div class="skeleton-loading skeleton-avatar absolute top-0 left-0 right-0 bottom-0"></div>
                </div>
                <div class="user-status-indicator inactive" id="user-detail-status-indicator"></div>
            `;
        }
        
        if (this.banner) {
            this.banner.style.backgroundImage = `url(/public/assets/common/default-profile-picture.png)`;
            this.banner.style.backgroundSize = 'contain';
            this.banner.style.backgroundRepeat = 'no-repeat';
            this.banner.style.backgroundPosition = 'center';
            this.banner.style.backgroundColor = '#5865f2';
            this.banner.style.opacity = '0.3';
        }
        
        const actionButtons = this.modal.querySelectorAll('.user-detail-action-btn');
        actionButtons.forEach(button => {
            button.disabled = true;
            button.classList.add('opacity-50');
        });
    }

    showErrorState(errorMessage = 'User not found') {
        if (this.nameElement) {
            this.nameElement.textContent = errorMessage;
        }
        
        if (this.usernameElement) {
            this.usernameElement.textContent = '';
        }
        
        if (this.discriminatorElement) {
            this.discriminatorElement.textContent = '';
        }
        
        if (this.aboutSection) {
            this.aboutSection.textContent = 'Could not load user information.';
            this.aboutSection.classList.add('text-discord-lighter');
        }
        
        if (this.memberSinceSection) {
            this.memberSinceSection.textContent = 'Unknown';
            this.memberSinceSection.classList.add('text-discord-lighter');
        }
        
        if (this.rolesSection) {
            this.rolesSection.textContent = 'No roles available';
            this.rolesSection.classList.add('text-discord-lighter');
        }
        
        if (this.mutualServersElement) {
            this.mutualServersElement.textContent = '0 Mutual Servers';
        }
        
        if (this.mutualFriendsElement) {
            this.mutualFriendsElement.textContent = '0 Mutual Friends';
        }
        
        if (this.avatarContainer) {
            this.avatarContainer.innerHTML = `
                <div class="user-avatar">
                    <img src="/public/assets/common/default-profile-picture.png" alt="Default Avatar" id="user-detail-avatar">
                </div>
                <div class="user-status-indicator inactive" id="user-detail-status-indicator"></div>
            `;
        }
        
        if (this.banner) {
            this.banner.style.backgroundImage = `url(/public/assets/common/default-profile-picture.png)`;
            this.banner.style.backgroundSize = 'contain';
            this.banner.style.backgroundRepeat = 'no-repeat';
            this.banner.style.backgroundPosition = 'center';
            this.banner.style.backgroundColor = '#5865f2';
        }
        
        const actionButtons = this.modal.querySelector('.user-detail-actions');
        if (actionButtons) {
            actionButtons.style.display = 'none';
        }
    }

    async fetchUserData() {
        try {
            if (!window.userAPI) {
                console.error('UserAPI not available globally');
                throw new Error('User API not available');
            }
            
            const userData = await window.userAPI.getUserProfile(this.currentUserId, this.currentServerId);

            if (!userData || !userData.success) {
                const errorMessage = userData?.message || 'Failed to fetch user data';
                console.error('User profile API error:', errorMessage);
                
                if (userData?.error?.code === 404) {
                    console.warn('User not found. User might not exist in the database.');
                    this.showErrorState(userData?.message || 'User not found');
                    return null;
                }
                
                throw new Error(errorMessage);
            }
            
            if (!userData.data || !userData.data.user) {
                console.error('User profile API returned unexpected format:', userData);
                throw new Error('Unexpected data format from server');
            }
            
            const currentUserId = document.getElementById('app-container')?.dataset.userId;
            if (currentUserId && this.currentUserId !== currentUserId) {
                try {
                    const mutualData = await window.userAPI.getMutualRelations(this.currentUserId);

                    if (mutualData && mutualData.success && mutualData.data) {
                        if (mutualData.data.mutual_servers && mutualData.data.mutual_servers.length > 0) {
                            
                        }
                        
                        if (mutualData.data.mutual_friends && mutualData.data.mutual_friends.length > 0) {

                        }
                        
                        userData.data.mutualData = mutualData.data;
                    } else {
                        console.warn('Mutual data API returned unsuccessful response or no data:', mutualData);

                        userData.data.mutualData = {
                            mutual_friend_count: 0,
                            mutual_server_count: 0,
                            mutual_friends: [],
                            mutual_servers: []
                        };
                    }
                } catch (error) {
                    console.error('Error fetching mutual data:', error);

                    userData.data.mutualData = {
                        mutual_friend_count: 0,
                        mutual_server_count: 0,
                        mutual_friends: [],
                        mutual_servers: []
                    };
                }
            } else {

            }
            
            this.userData = userData.data;
            return userData.data;
        } catch (error) {
            console.error('Error in fetchUserData:', error);
            throw error;
        }
    }

    displayUserData(userData) {
        if (!userData || !userData.user) {
            console.error('Invalid user data received:', userData);
            this.showErrorState();
            return;
        }

        const user = userData.user;
        if (!user || typeof user !== 'object') {
            console.error('User data is not a valid object:', user);
            this.showErrorState();
            return;
        }

        const isSelf = document.getElementById('app-container')?.dataset.userId === user.id?.toString();

        const containers = [
            this.nameElement,
            this.usernameElement,
            this.discriminatorElement,
            this.avatarContainer,
            this.banner,
            this.aboutSection,
            this.memberSinceSection,
            this.rolesSection,
            this.mutualServersElement,
            this.mutualFriendsElement
        ];
        
        containers.forEach(container => {
            if (container) {
                const skeletonElements = container.querySelectorAll('.skeleton-loading');
                skeletonElements.forEach(element => {
                    element.classList.add('fade-out');
                });
            }
        });
        
        setTimeout(() => {
            if (this.banner && this.banner.style.opacity !== '1') {
                this.banner.style.opacity = '1';
            }
            
            if (this.nameElement) {
                this.nameElement.innerHTML = '';
                const displayName = user.display_name || user.username || 'Unknown User';
                this.nameElement.textContent = displayName;
                this.nameElement.setAttribute('data-user-id', user.id || '');
                this.nameElement.classList.add('fade-in');
                
                if (window.nitroCrownManager && user.id) {
                    setTimeout(() => {
                        window.nitroCrownManager.updateUserElement(this.nameElement, user.id);
                    }, 100);
                }
            }

            if (this.usernameElement) {
                this.usernameElement.innerHTML = '';
                const username = user.username || 'unknown';
                const discriminator = user.discriminator || '0000';
                this.usernameElement.textContent = `${username}#${discriminator}`;
                this.usernameElement.classList.add('fade-in');
            }

            if (this.discriminatorElement) {
                this.discriminatorElement.innerHTML = '';
                this.discriminatorElement.classList.add('fade-in');
            }

            if (this.avatarContainer) {
                this.avatarContainer.innerHTML = '';
                const avatarWrapper = document.createElement('div');
                avatarWrapper.className = 'user-avatar fade-in';

                if (user.avatar_url) {
                    const img = document.createElement('img');
                    img.src = user.avatar_url;
                    img.alt = 'User Avatar';
                    img.id = 'user-detail-avatar';
                    avatarWrapper.appendChild(img);
                } else {
                    const img = document.createElement('img');
                    img.src = '/public/assets/common/default-profile-picture.png';
                    img.alt = 'Default Avatar';
                    img.id = 'user-detail-avatar';
                    avatarWrapper.appendChild(img);
                }

                const statusIndicator = document.createElement('div');
                statusIndicator.className = 'user-status-indicator';
                statusIndicator.id = 'user-detail-status-indicator';
                this.avatarContainer.appendChild(avatarWrapper);
                this.avatarContainer.appendChild(statusIndicator);
                
                this.statusIndicator = statusIndicator;
                this.updateStatusIndicator(user.id);
            }

            if (this.banner) {
                if (user.banner_url) {
                    this.banner.style.backgroundImage = `url(${user.banner_url})`;
                } else {
                    this.banner.style.backgroundImage = `url(/public/assets/common/default-profile-picture.png)`;
                    this.banner.style.backgroundSize = 'contain';
                    this.banner.style.backgroundRepeat = 'no-repeat';
                    this.banner.style.backgroundPosition = 'center';
                    this.banner.style.backgroundColor = '#5865f2';
                }
                this.banner.classList.add('fade-in');
            }

            if (this.aboutSection) {
                this.aboutSection.innerHTML = '';
                if (user.bio && user.bio.trim() !== '') {
                    this.aboutSection.textContent = user.bio;
                    this.aboutSection.classList.remove('text-discord-lighter');
                } else {
                    this.aboutSection.textContent = 'This user has not added a bio yet.';
                    this.aboutSection.classList.add('text-discord-lighter');
                }
                this.aboutSection.classList.add('fade-in');
            }

            if (this.memberSinceSection && user.created_at) {
                this.memberSinceSection.innerHTML = '';
                const joinDate = new Date(user.created_at);
                const formattedDate = joinDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                this.memberSinceSection.textContent = formattedDate;
                this.memberSinceSection.classList.add('fade-in');
            }

            if (this.rolesSection) {
                this.rolesSection.innerHTML = '';
                let roles = (this.currentServerId && userData.roles) ? [...userData.roles] : [];
                
                if (this.currentServerId && roles.length === 0 && this.initialRoleName) {
                    const roleName = this.initialRoleName.charAt(0).toUpperCase() + this.initialRoleName.slice(1);
                    const colors = { 'owner': '#f1c40f', 'admin': '#e74c3c', 'moderator': '#3498db' };
                    roles.push({
                        name: roleName,
                        color: colors[this.initialRoleName.toLowerCase()] || '#99aab5'
                    });
                }

                if (this.currentServerId && roles.length > 0) {
                    roles.forEach(role => {
                        const roleElement = document.createElement('div');
                        roleElement.className = 'user-detail-role fade-in';
                        
                        const roleColorDot = document.createElement('span');
                        roleColorDot.className = 'user-detail-role-color';
                        if (role.color) {
                            roleColorDot.style.backgroundColor = role.color;
                        }
                        
                        const roleNameSpan = document.createElement('span');
                        roleNameSpan.className = 'user-detail-role-name';
                        roleNameSpan.textContent = role.name || 'Unknown Role';
                        
                        roleElement.appendChild(roleColorDot);
                        roleElement.appendChild(roleNameSpan);
                        
                        this.rolesSection.appendChild(roleElement);
                    });
                    this.rolesSection.classList.remove('text-discord-lighter');
                } else if (this.currentServerId) {
                    this.rolesSection.textContent = 'No roles';
                    this.rolesSection.classList.add('text-discord-lighter', 'fade-in');
                }
            }

            this.updateMutualInfo(userData, isSelf);
            this.updateActionButtons(userData);
        }, 200);
    }

    updateMutualInfo(userData, isSelf) {
        if (this.mutualSection) {
            this.mutualSection.style.display = isSelf ? 'none' : 'flex';
        }

        if (!isSelf && userData.mutualData) {
            if (this.mutualServersElement) {
                this.mutualServersElement.innerHTML = '';
                const serverCount = userData.mutualData.mutual_server_count || 0;
                this.mutualServersElement.textContent = `${serverCount} Mutual Server${serverCount !== 1 ? 's' : ''}`;
                this.mutualServersElement.classList.add('fade-in');
                
                if (serverCount > 0) {
                    this.mutualServersItem.classList.add('has-data');
                    if (userData.mutualData.mutual_servers && userData.mutualData.mutual_servers.length > 0) {
                        const serverNames = userData.mutualData.mutual_servers.map(server => server.name || 'Unknown Server').join(', ');
                        this.mutualServersElement.title = serverNames;
                    }
                } else {
                    this.mutualServersItem.classList.remove('has-data');
                    this.mutualServersItem.classList.add('no-data');
                }
            }
            
            if (this.mutualFriendsElement) {
                this.mutualFriendsElement.innerHTML = '';
                const friendCount = userData.mutualData.mutual_friend_count || 0;
                this.mutualFriendsElement.textContent = `${friendCount} Mutual Friend${friendCount !== 1 ? 's' : ''}`;
                this.mutualFriendsElement.classList.add('fade-in');
                
                if (friendCount > 0) {
                    this.mutualFriendsItem.classList.add('has-data');
                    if (userData.mutualData.mutual_friends && userData.mutualData.mutual_friends.length > 0) {
                        const friendNames = userData.mutualData.mutual_friends.map(friend => friend.username || 'Unknown User').join(', ');
                        this.mutualFriendsElement.title = friendNames;
                    }
                } else {
                    this.mutualFriendsItem.classList.remove('has-data');
                    this.mutualFriendsItem.classList.add('no-data');
                }
            }
        } else if (!isSelf) {
            if (this.mutualServersElement) {
                this.mutualServersElement.innerHTML = '';
                this.mutualServersElement.textContent = '0 Mutual Servers';
                this.mutualServersElement.classList.add('fade-in');
                this.mutualServersItem.classList.remove('has-data');
                this.mutualServersItem.classList.add('no-data');
            }
            
            if (this.mutualFriendsElement) {
                this.mutualFriendsElement.innerHTML = '';
                this.mutualFriendsElement.textContent = '0 Mutual Friends';
                this.mutualFriendsElement.classList.add('fade-in');
                this.mutualFriendsItem.classList.remove('has-data');
                this.mutualFriendsItem.classList.add('no-data');
            }
        }
    }

    updateActionButtons(userData) {
        const user = userData.user;

        if (this.messageBtn) {
            if (user.is_self) {
                this.messageBtn.disabled = true;
                this.messageBtn.classList.add('opacity-50', 'cursor-not-allowed');
            } else {
                this.messageBtn.disabled = false;
                this.messageBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        }
    }

    handleMessageClick() {
        if (!this.currentUserId) return;

        this.hide();

        this.createOrOpenDM(this.currentUserId);
    }

    async createOrOpenDM(userId) {
        try {
            if (!window.ChatAPI) {
                console.error('ChatAPI not available');
                return;
            }

            const data = await window.ChatAPI.createDirectMessage(userId);

            if (data.data && data.data.room_id) {
                window.location.href = `/home/channels/dm/${data.data.room_id}`;
            } else if (data.data && data.data.channel_id) {
                window.location.href = `/home/channels/dm/${data.data.channel_id}`;
            } else {
                console.error('Failed to create DM:', data.message || 'Unknown error');
            }
        } catch (error) {
            console.error('Error creating DM:', error);
        }
    }

    showMutualServersDetail() {
        if (!this.userData || !this.userData.mutualData || !this.userData.mutualData.mutual_servers || this.userData.mutualData.mutual_servers.length === 0) {
            return;
        }
        
        this.mutualDetailTitle.textContent = 'Mutual Servers';
        this.mutualDetailContent.innerHTML = '';
        
        const servers = this.userData.mutualData.mutual_servers;
        
        servers.forEach(server => {
            const serverItem = document.createElement('div');
            serverItem.className = 'mutual-detail-item';
            
            const serverIcon = document.createElement('div');
            serverIcon.className = 'mutual-detail-icon';
            

            const normalizeIconUrl = (url) => {
                if (!url) return null;
                url = url.trim();
                if (!url) return null;
                

                if (url.startsWith('/') && !url.startsWith('//')) {

                    if (!url.includes('/public/') && !url.includes('/assets/')) {
                        return '/public' + url;
                    }
                    return url;
                }
                

                if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
                    return url;
                }
                
                return null;
            };
            

            const serverIconUrl = server.icon_url || server.image_url;
            const iconUrl = normalizeIconUrl(serverIconUrl);
            
            if (iconUrl) {
                const img = document.createElement('img');
                img.src = iconUrl;
                img.alt = server.name || 'Server';
                img.onerror = function() {
                    this.src = '/public/assets/common/default-profile-picture.png';
                };
                serverIcon.appendChild(img);
            } else {
                const img = document.createElement('img');
                img.src = '/public/assets/common/default-profile-picture.png';
                img.alt = server.name || 'Server';
                serverIcon.appendChild(img);
            }
            
            const serverInfo = document.createElement('div');
            serverInfo.className = 'mutual-detail-info';
            
            const serverName = document.createElement('div');
            serverName.className = 'mutual-detail-name';
            serverName.textContent = server.name || 'Unknown Server';
            
            serverInfo.appendChild(serverName);
            
            if (server.member_count) {
                const memberCount = document.createElement('div');
                memberCount.className = 'mutual-detail-subtext';
                const userIcon = document.createElement('i');
                userIcon.className = 'fas fa-users fa-sm';
                memberCount.appendChild(userIcon);
                const countText = document.createTextNode(` ${server.member_count} members`);
                memberCount.appendChild(countText);
                serverInfo.appendChild(memberCount);
            }
            
            serverItem.appendChild(serverIcon);
            serverItem.appendChild(serverInfo);
            
            if (server.id) {
                serverItem.addEventListener('click', () => {
                    window.location.href = `/server/${server.id}`;
                });
            }
            
            this.mutualDetailContent.appendChild(serverItem);
        });
        
        this.mutualDetailModal.classList.add('active');
    }
    
    showMutualFriendsDetail() {
        if (!this.userData || !this.userData.mutualData || !this.userData.mutualData.mutual_friends || this.userData.mutualData.mutual_friends.length === 0) {
            return;
        }
        
        this.mutualDetailTitle.textContent = 'Mutual Friends';
        this.mutualDetailContent.innerHTML = '';
        
        const friends = this.userData.mutualData.mutual_friends;
        
        friends.forEach(friend => {
            const friendItem = document.createElement('div');
            friendItem.className = 'mutual-detail-item';
            
            const friendIcon = document.createElement('div');
            friendIcon.className = 'mutual-detail-icon';
            
            if (friend.avatar_url) {
                const img = document.createElement('img');
                img.src = friend.avatar_url;
                img.alt = friend.username || 'User';
                friendIcon.appendChild(img);
            } else {
                const initials = document.createElement('div');
                initials.className = 'mutual-detail-initials';
                initials.textContent = (friend.username || 'U').charAt(0).toUpperCase();
                friendIcon.appendChild(initials);
            }
            
            const statusIndicator = document.createElement('div');
            statusIndicator.className = 'mutual-detail-status';
            if (friend.status) {
                statusIndicator.classList.add(friend.status);
            } else {
                statusIndicator.classList.add('offline');
            }
            friendIcon.appendChild(statusIndicator);
            
            const friendInfo = document.createElement('div');
            friendInfo.className = 'mutual-detail-info';
            
            const friendName = document.createElement('div');
            friendName.className = 'mutual-detail-name';
            friendName.textContent = friend.display_name || friend.username || 'Unknown User';
            friendName.setAttribute('data-user-id', friend.id || '');
            
            friendInfo.appendChild(friendName);
            
            if (friend.username && friend.discriminator) {
                const friendTag = document.createElement('div');
                friendTag.className = 'mutual-detail-subtext';
                
                const userIcon = document.createElement('i');
                userIcon.className = 'fas fa-user fa-sm';
                friendTag.appendChild(userIcon);
                
                const tagText = document.createTextNode(` ${friend.username}#${friend.discriminator}`);
                friendTag.appendChild(tagText);
                
                friendInfo.appendChild(friendTag);
            }
            
            friendItem.appendChild(friendIcon);
            friendItem.appendChild(friendInfo);
            
            if (friend.id) {
                friendItem.addEventListener('click', () => {
                    this.hideMutualDetail();
                    
                    setTimeout(() => {
                        const userDetailModal = new UserDetailModal();
                        userDetailModal.show({
                            userId: friend.id,
                            serverId: this.currentServerId
                        });
                    }, 100);
                });
            }
            
            this.mutualDetailContent.appendChild(friendItem);
        });
        
        if (window.nitroCrownManager) {
            setTimeout(() => {
                this.mutualDetailContent.querySelectorAll('.mutual-detail-name[data-user-id]').forEach(nameEl => {
                    const userId = nameEl.getAttribute('data-user-id');
                    if (userId && userId !== 'null') {
                        window.nitroCrownManager.updateUserElement(nameEl, userId);
                    }
                });
            }, 100);
        }
        
        this.mutualDetailModal.classList.add('active');
    }
    
    hideMutualDetail() {
        this.mutualDetailModal.classList.remove('active');
    }

    getUserPresenceStatus(userId) {
        if (!userId) return 'offline';
        
        const currentUserId = window.globalSocketManager?.userId;
        
        if (String(userId) === String(currentUserId)) {
            const status = window.globalSocketManager?.currentPresenceStatus || 'online';
            const activityDetails = window.globalSocketManager?.currentActivityDetails;
            
            const isInVoice = activityDetails?.type && 
                             (activityDetails.type === 'In Voice Call' || 
                              activityDetails.type.startsWith('In Voice'));
            
            if (isInVoice) return 'active';
            
            if (status === 'afk') return 'away';
            if (status === 'online' || status === 'appear') return 'active';
            if (status === 'do_not_disturb') return 'do_not_disturb';
            return 'inactive';
        }
        
        if (window.FriendsManager) {
            const friendsManager = window.FriendsManager.getInstance();
            const onlineUsers = friendsManager.cache.onlineUsers || {};
            const userData = onlineUsers[userId];
            
            if (userData) {
                const isInVoice = userData.activity_details?.type && 
                                 (userData.activity_details.type === 'In Voice Call' || 
                                  userData.activity_details.type.startsWith('In Voice'));
                
                if (isInVoice) return 'active';
                
                if (userData.status === 'afk') return 'away';
                if (userData.status === 'online' || userData.status === 'appear') return 'active';
                if (userData.status === 'do_not_disturb') return 'do_not_disturb';
            }
        }
        
        return 'inactive';
    }

    updateStatusIndicator(userId) {
        if (!this.statusIndicator) return;
        
        const status = this.getUserPresenceStatus(userId);
        
        this.statusIndicator.className = 'user-status-indicator';
        this.statusIndicator.classList.add(status);
    }

}

const userDetailModal = new UserDetailModal();

window.userDetailModal = userDetailModal;

let clickDebounceTimer = null;

document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.user-profile-trigger');

    if (trigger) {
        if (trigger.classList.contains('mention-all') || trigger.classList.contains('bubble-mention-all') || trigger.dataset.mentionType === 'all') {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        if (clickDebounceTimer) {
            clearTimeout(clickDebounceTimer);
        }

        clickDebounceTimer = setTimeout(() => {
            let userId = trigger.dataset.userId;
            const serverId = trigger.dataset.serverId;
            const username = trigger.dataset.username;
            const role = trigger.dataset.role;

            if (userId && userId !== 'null' && userId !== '') {
                userDetailModal.show({
                    userId,
                    serverId,
                    triggerElement: trigger,
                    role
                });
            } else if (username && (trigger.classList.contains('mention-user') || trigger.classList.contains('bubble-mention-user'))) {
                if (window.chatSection?.mentionHandler?.availableUsers) {
                    const user = window.chatSection.mentionHandler.availableUsers.get(username.toLowerCase());
                    if (user && user.id) {
                        userDetailModal.show({
                            userId: user.id,
                            serverId,
                            triggerElement: trigger
                        });
                        return;
                    }
                }

                lookupUserByUsernameGlobal(username).then(foundUserId => {
                    if (foundUserId) {
                        userDetailModal.show({
                            userId: foundUserId,
                            serverId,
                            triggerElement: trigger
                        });
                    }
                }).catch(error => {
                    console.error('Error looking up user:', error);
                });
            }
            clickDebounceTimer = null;
        }, 100);
    }
});

async function lookupUserByUsernameGlobal(username) {
    try {
        const chatType = window.chatSection?.chatType;
        const targetId = window.chatSection?.targetId;
        
        if (!chatType || !targetId) {
            return null;
        }
        
        let endpoint;
        if (chatType === 'channel') {
            endpoint = `/api/channels/${targetId}/members`;
        } else if (chatType === 'dm' || chatType === 'direct') {
            endpoint = `/api/chat/dm/${targetId}/participants`;
        } else {
            return null;
        }
        
        const response = await fetch(endpoint);
        if (!response.ok) {
            return null;
        }
        
        const result = await response.json();
        let users = [];
        
        if (result.success && result.data) {
            if (Array.isArray(result.data)) {
                users = result.data;
            } else if (result.data.data && Array.isArray(result.data.data)) {
                users = result.data.data;
            }
        }
        
        const user = users.find(u => u.username && u.username.toLowerCase() === username.toLowerCase());
        return user ? user.user_id || user.id : null;
        
    } catch (error) {
        console.error('API error:', error);
        return null;
    }
}

export default userDetailModal;