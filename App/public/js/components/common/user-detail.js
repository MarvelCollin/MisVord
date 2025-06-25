class UserDetailModal {
    constructor() {
        this.modal = document.getElementById('user-detail-modal');
        this.currentUserId = null;
        this.currentServerId = null;

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
        
        this.messageInput = this.modal.querySelector('#user-detail-message-input');
        this.sendBtn = this.modal.querySelector('#user-detail-send-btn');

        this.mutualSection = this.modal.querySelector('.user-detail-mutual');
        this.mutualServersElement = this.modal.querySelector('#user-detail-mutual-servers');
        this.mutualFriendsElement = this.modal.querySelector('#user-detail-mutual-friends');

        this.messageBtn = this.modal.querySelector('#user-detail-message-btn');
        this.addFriendBtn = this.modal.querySelector('#user-detail-add-friend-btn');
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

        if (this.addFriendBtn) {
            this.addFriendBtn.addEventListener('click', () => this.handleAddFriendClick());
        }

        if (this.sendBtn) {
            this.sendBtn.addEventListener('click', () => this.handleSendMessage());
        }
        
        if (this.messageInput) {
            this.messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleSendMessage();
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
                    <img src="/assets/main-logo.png" alt="Default Avatar" id="user-detail-avatar" class="opacity-30">
                    <div class="skeleton-loading skeleton-avatar absolute top-0 left-0 right-0 bottom-0"></div>
                </div>
            `;
        }
        
        if (this.banner) {
            this.banner.style.backgroundImage = `url(/assets/main-logo.png)`;
            this.banner.style.backgroundSize = 'contain';
            this.banner.style.backgroundRepeat = 'no-repeat';
            this.banner.style.backgroundPosition = 'center';
            this.banner.style.backgroundColor = '#5865f2';
            this.banner.style.opacity = '0.3';
        }
        
        const messageInput = this.modal.querySelector('.user-detail-message-input');
        if (messageInput) {
            messageInput.disabled = true;
            messageInput.placeholder = 'Loading...';
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
                    <img src="/assets/main-logo.png" alt="Default Avatar" id="user-detail-avatar">
                </div>
            `;
        }
        
        if (this.banner) {
            this.banner.style.backgroundImage = `url(/assets/main-logo.png)`;
            this.banner.style.backgroundSize = 'contain';
            this.banner.style.backgroundRepeat = 'no-repeat';
            this.banner.style.backgroundPosition = 'center';
            this.banner.style.backgroundColor = '#5865f2';
        }
        
        const messageInput = this.modal.querySelector('.user-detail-message-input');
        if (messageInput) {
            messageInput.disabled = true;
            messageInput.placeholder = 'Unavailable';
        }
        
        const sendBtn = this.modal.querySelector('#user-detail-send-btn');
        if (sendBtn) {
            sendBtn.disabled = true;
            sendBtn.classList.add('opacity-50');
        }
        
        const actionButtons = this.modal.querySelector('.user-detail-actions');
        if (actionButtons) {
            actionButtons.style.display = 'none';
        }
    }


    async fetchUserData() {
        try {
            const userApi = await import('../../api/user-api.js').then(module => module.default);
            
            // Get user profile data
            console.log('Fetching user profile for user ID:', this.currentUserId, 'server ID:', this.currentServerId);
            const userData = await userApi.getUserProfile(this.currentUserId, this.currentServerId);
            console.log('User profile API response:', userData);
            
            if (!userData || !userData.success) {
                const errorMessage = userData?.message || 'Failed to fetch user data';
                console.error('User profile API error:', errorMessage);
                
                // If we get a 404 error, it means the user ID doesn't exist in the database
                if (userData?.error?.code === 404) {
                    console.warn('User not found. User might not exist in the database.');
                    this.showErrorState(userData?.message || 'User not found');
                    return null;
                }
                
                throw new Error(errorMessage);
            }
            
            // Check for data in the expected format
            if (!userData.data || !userData.data.user) {
                console.error('User profile API returned unexpected format:', userData);
                throw new Error('Unexpected data format from server');
            }
            
            // Check if this is another user (not the current user) to get mutual data
            const currentUserId = document.getElementById('app-container')?.dataset.userId;
            if (currentUserId && this.currentUserId !== currentUserId) {
                try {
                    // Get mutual relations
                    console.log('Fetching mutual relations for user ID:', this.currentUserId);
                    const mutualData = await userApi.getMutualRelations(this.currentUserId);
                    console.log('Mutual relations API response:', mutualData);
                    
                    if (mutualData && mutualData.success && mutualData.data) {
                        userData.data.mutualData = mutualData.data;
                    } else {
                        console.warn('Mutual data API returned unsuccessful response:', mutualData);
                        userData.data.mutualData = {
                            mutual_friend_count: 0,
                            mutual_server_count: 0
                        };
                    }
                } catch (error) {
                    console.error('Error fetching mutual data:', error);
                    // Continue even if mutual data fails to load
                    userData.data.mutualData = {
                        mutual_friend_count: 0,
                        mutual_server_count: 0
                    };
                }
            }
            
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

        // Create a fade-in effect for all containers
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
        
        // First remove any skeleton loading elements
        containers.forEach(container => {
            if (container) {
                const skeletonElements = container.querySelectorAll('.skeleton-loading');
                skeletonElements.forEach(element => {
                    element.classList.add('fade-out');
                });
            }
        });
        
        // Small delay to let fade-out happen before updating content
        setTimeout(() => {
            // Reset banner opacity if it was set during loading
            if (this.banner && this.banner.style.opacity !== '1') {
                this.banner.style.opacity = '1';
            }
            
            if (this.nameElement) {
                this.nameElement.innerHTML = '';
                this.nameElement.textContent = user.username || 'Unknown User';
                this.nameElement.classList.add('fade-in');
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
                    img.src = '/assets/main-logo.png';
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
                    this.banner.style.backgroundImage = `url(/assets/main-logo.png)`;
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

            // Update the rest of the UI as before
            this.updateMutualInfo(userData, isSelf);
            this.updateMessageSection(user, isSelf);
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
                
                if (userData.mutualData.mutual_servers && userData.mutualData.mutual_servers.length > 0) {
                    const serverNames = userData.mutualData.mutual_servers.map(server => server.name || 'Unknown Server').join(', ');
                    this.mutualServersElement.title = serverNames;
                }
            }
            
            if (this.mutualFriendsElement) {
                this.mutualFriendsElement.innerHTML = '';
                const friendCount = userData.mutualData.mutual_friend_count || 0;
                this.mutualFriendsElement.textContent = `${friendCount} Mutual Friend${friendCount !== 1 ? 's' : ''}`;
                this.mutualFriendsElement.classList.add('fade-in');
                
                if (userData.mutualData.mutual_friends && userData.mutualData.mutual_friends.length > 0) {
                    const friendNames = userData.mutualData.mutual_friends.map(friend => friend.username || 'Unknown User').join(', ');
                    this.mutualFriendsElement.title = friendNames;
                }
            }
        } else if (!isSelf) {
            if (this.mutualServersElement) {
                this.mutualServersElement.innerHTML = '';
                this.mutualServersElement.textContent = '0 Mutual Servers';
                this.mutualServersElement.classList.add('fade-in');
            }
            if (this.mutualFriendsElement) {
                this.mutualFriendsElement.innerHTML = '';
                this.mutualFriendsElement.textContent = '0 Mutual Friends';
                this.mutualFriendsElement.classList.add('fade-in');
            }
        }
    }

    updateMessageSection(user, isSelf) {
        const messageSection = this.modal.querySelector('.user-detail-message-section');
        if (messageSection) {
            messageSection.style.display = isSelf ? 'none' : 'block';
        }

        if (this.messageInput) {
            this.messageInput.disabled = isSelf;
            this.messageInput.placeholder = `Message @${user.username || 'user'}`;
            this.messageInput.classList.add('fade-in');
        }

        if (this.sendBtn) {
            this.sendBtn.disabled = isSelf;
            this.sendBtn.classList.add('fade-in');
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
            const response = await fetch('/api/chat/dm/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ user_id: userId })
            });

            if (!response.ok) throw new Error('Failed to create DM');

            const data = await response.json();

            if (data.success && data.room_id) {
                window.location.href = `/app/channels/dm/${data.room_id}`;
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

    async handleSendMessage() {
        if (!this.currentUserId || !this.messageInput || !this.messageInput.value.trim()) {
            return;
        }

        const content = this.messageInput.value.trim();
        this.messageInput.value = '';
        this.messageInput.disabled = true;
        this.sendBtn.disabled = true;

        try {
            const chatApi = await import('../../api/chat-api.js').then(module => module.default);

            // Step 1: Get or create the DM room
            const dmRoomData = await chatApi.createDirectMessageRoom(this.currentUserId);
            
            if (!dmRoomData.success || !dmRoomData.room_id) {
                throw new Error(dmRoomData.message || 'Could not open a DM with this user.');
            }

            const roomId = dmRoomData.room_id;

            // Step 2: Send the message using the correct method and parameters
            await chatApi.sendMessage(roomId, content, 'direct');

            // Hide the modal and optionally show a success toast
            this.hide();
            if (window.showToast) {
                window.showToast('Message sent!', 'success');
            }

        } catch (error) {
            console.error('Error sending direct message:', error);
            if (window.showToast) {
                window.showToast(error.message || 'Failed to send message.', 'error');
            }
        } finally {
            if (this.messageInput) this.messageInput.disabled = false;
            if (this.sendBtn) this.sendBtn.disabled = false;
        }
    }
}

const userDetailModal = new UserDetailModal();

document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.user-profile-trigger');

    if (trigger) {
        const userId = trigger.dataset.userId;
        const serverId = trigger.dataset.serverId;

        if (userId) {
            e.preventDefault();
            userDetailModal.show({
                userId,
                serverId,
                triggerElement: trigger
            });
        }
    }
});

export default userDetailModal;