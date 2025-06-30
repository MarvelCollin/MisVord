class UserDetailModal {
    constructor() {
        this.modal = document.getElementById('user-detail-modal');
        this.mutualDetailModal = document.getElementById('mutual-detail-modal');
        this.currentUserId = null;
        this.currentServerId = null;
        this.userData = null;

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
        this.discriminatorElement = this.modal.querySelector('#user-detail-discriminator');
        this.statusIndicator = this.modal.querySelector('.user-status-indicator');

        this.aboutSection = this.modal.querySelector('#user-detail-about');
        this.memberSinceSection = this.modal.querySelector('#user-detail-member-since');
        this.rolesSection = this.modal.querySelector('#user-detail-roles');

        this.mutualSection = this.modal.querySelector('.user-detail-mutual');
        this.mutualServersElement = this.modal.querySelector('#user-detail-mutual-servers');
        this.mutualFriendsElement = this.modal.querySelector('#user-detail-mutual-friends');
        this.mutualServersItem = this.modal.querySelector('#mutual-servers-item');
        this.mutualFriendsItem = this.modal.querySelector('#mutual-friends-item');

        this.messageBtn = this.modal.querySelector('#user-detail-message-btn');
        this.addFriendBtn = this.modal.querySelector('#user-detail-add-friend-btn');
        
        // Mutual detail modal elements
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
                if (this.mutualDetailModal.classList.contains('active')) {
                    this.hideMutualDetail();
                } else {
                    this.hide();
                }
            }
        });

        if (this.messageBtn) {
            this.messageBtn.addEventListener('click', () => this.handleMessageClick());
        }

        if (this.addFriendBtn) {
            this.addFriendBtn.addEventListener('click', () => this.handleAddFriendClick());
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
    }

    show(options = {}) {
        console.log('User detail requested for user ID:', options.userId);
        
        if (!options.userId) {
            console.error('User ID is required to show user detail modal');
            return;
        }
        
        this.currentUserId = options.userId;
        this.currentServerId = options.serverId || null;
        
        this.modal.classList.add('active');
        
        if (options.triggerElement && typeof options.triggerElement.getBoundingClientRect === 'function') {
            const rect = options.triggerElement.getBoundingClientRect();
            const modalWidth = 340;

            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            const showOnRight = rect.left + rect.width + modalWidth <= viewportWidth;
            const left = showOnRight ? rect.left + rect.width + 10 : rect.left - modalWidth - 10;

            let top = rect.top;
            if (top + 400 > viewportHeight) {
                top = Math.max(10, viewportHeight - 400 - 10);
            }
            
            const container = this.modal.querySelector('.user-detail-container');
            if (container) {
                container.style.position = 'absolute';
                container.style.left = `${left}px`;
                container.style.top = `${top}px`;
                container.style.transform = 'none';
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


    showLoadingState() {
        if (this.nameElement) {
            this.nameElement.innerHTML = '<div class="skeleton-loading skeleton-name"></div>';
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
                    <img src="/assets/default-profile-picture.png" alt="Default Avatar" id="user-detail-avatar" class="opacity-30">
                    <div class="skeleton-loading skeleton-avatar absolute top-0 left-0 right-0 bottom-0"></div>
                </div>
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
            
            console.log('Fetching user profile for user ID:', this.currentUserId, 'server ID:', this.currentServerId);
            const userData = await window.userAPI.getUserProfile(this.currentUserId, this.currentServerId);
            console.log('User profile API response:', userData);
            
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
                    console.log('Fetching mutual relations for user ID:', this.currentUserId);
                    const mutualData = await window.userAPI.getMutualRelations(this.currentUserId);
                    console.log('Mutual relations API response:', mutualData);
                    
                    if (mutualData && mutualData.success && mutualData.data) {
                        console.log('Mutual servers count:', mutualData.data.mutual_server_count);
                        console.log('Mutual friends count:', mutualData.data.mutual_friend_count);
                        
                        if (mutualData.data.mutual_servers && mutualData.data.mutual_servers.length > 0) {
                            console.log('Sample mutual server:', mutualData.data.mutual_servers[0]);
                        }
                        
                        if (mutualData.data.mutual_friends && mutualData.data.mutual_friends.length > 0) {
                            console.log('Sample mutual friend:', mutualData.data.mutual_friends[0]);
                        }
                        
                        userData.data.mutualData = mutualData.data;
                    } else {
                        console.warn('Mutual data API returned unsuccessful response:', mutualData);
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
                this.nameElement.classList.add('fade-in');
                
                if (user.has_nitro && window.nitroCrownManager) {
                    window.nitroCrownManager.addCrownToElement(this.nameElement, 'inline');
                }
            }

            if (this.discriminatorElement) {
                this.discriminatorElement.innerHTML = '';
                this.discriminatorElement.textContent = user.discriminator ? `#${user.discriminator}` : '#0000';
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
                if (user.status) {
                    statusIndicator.classList.add(user.status);
                }
                avatarWrapper.appendChild(statusIndicator);
                this.avatarContainer.appendChild(avatarWrapper);
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

            if (this.rolesSection && userData.roles) {
                this.rolesSection.innerHTML = '';
                if (userData.roles.length > 0) {
                    userData.roles.forEach(role => {
                        const roleElement = document.createElement('div');
                        roleElement.className = 'user-detail-role fade-in';
                        roleElement.textContent = role.name || 'Unknown Role';
                        
                        if (role.color) {
                            roleElement.style.backgroundColor = role.color;
                        }
                        
                        this.rolesSection.appendChild(roleElement);
                    });
                    this.rolesSection.classList.remove('text-discord-lighter');
                } else {
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

        if (this.addFriendBtn) {
            if (user.is_self) {
                this.addFriendBtn.style.display = 'none';
            } else if (user.is_friend) {
                this.addFriendBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                    Remove Friend
                `;
                this.addFriendBtn.classList.add('bg-discord-red');
                this.addFriendBtn.classList.remove('bg-discord-dark');
            } else if (user.friend_request_sent) {
                this.addFriendBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                    Pending
                `;
                this.addFriendBtn.disabled = true;
                this.addFriendBtn.classList.add('opacity-50', 'cursor-not-allowed');
            } else {
                this.addFriendBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                    Add Friend
                `;
                this.addFriendBtn.disabled = false;
                this.addFriendBtn.classList.remove('opacity-50', 'cursor-not-allowed');
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


    async handleAddFriendClick() {
        if (!this.currentUserId) return;

        try {
            const isFriend = this.addFriendBtn.textContent.trim().includes('Remove');

            if (isFriend) {
                const response = await fetch('/api/friends', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify({ user_id: this.currentUserId })
                });

                if (!response.ok) throw new Error('Failed to remove friend');

                this.addFriendBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                    Add Friend
                `;
                this.addFriendBtn.classList.remove('bg-discord-red');
                this.addFriendBtn.classList.add('bg-discord-dark');
            } else {
                const response = await fetch('/api/friends', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify({ user_id: this.currentUserId })
                });

                if (!response.ok) throw new Error('Failed to send friend request');

                this.addFriendBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                    Pending
                `;
                this.addFriendBtn.disabled = true;
                this.addFriendBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
        } catch (error) {
            console.error('Error updating friend status:', error);
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
            
            if (server.icon_url) {
                const img = document.createElement('img');
                img.src = server.icon_url;
                img.alt = server.name || 'Server';
                serverIcon.appendChild(img);
            } else {
                const initials = document.createElement('div');
                initials.className = 'mutual-detail-initials';
                initials.textContent = (server.name || 'S').charAt(0).toUpperCase();
                serverIcon.appendChild(initials);
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
                    // Show user detail for this friend
                    this.hideMutualDetail();
                    
                    // Small delay to avoid UI glitches
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
        
        this.mutualDetailModal.classList.add('active');
    }
    
    hideMutualDetail() {
        this.mutualDetailModal.classList.remove('active');
    }
}

const userDetailModal = new UserDetailModal();

window.userDetailModal = userDetailModal;

document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.user-profile-trigger');

    if (trigger) {
        if (trigger.classList.contains('mention-all') || trigger.classList.contains('bubble-mention-all') || trigger.dataset.mentionType === 'all') {
            console.log('🚫 [USER-DETAIL] @all mention clicked, ignoring user detail trigger');
            return;
        }

        let userId = trigger.dataset.userId;
        const serverId = trigger.dataset.serverId;
        const username = trigger.dataset.username;

        if (userId && userId !== 'null' && userId !== '') {
            e.preventDefault();
            userDetailModal.show({
                userId,
                serverId,
                triggerElement: trigger
            });
        } else if (username && trigger.classList.contains('mention-user')) {
            e.preventDefault();
            console.log('🔍 [USER-DETAIL] Mention clicked without user ID, looking up:', username);
            
            if (window.chatSection?.mentionHandler?.availableUsers) {
                const user = window.chatSection.mentionHandler.availableUsers.get(username.toLowerCase());
                if (user && user.id) {
                    console.log('✅ [USER-DETAIL] Found user in cache:', user);
                    userDetailModal.show({
                        userId: user.id,
                        serverId,
                        triggerElement: trigger
                    });
                    return;
                }
            }
            
            console.log('🔍 [USER-DETAIL] User not in cache, attempting API lookup');
        }
    }
});

export default userDetailModal;