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
        this.avatar = this.modal.querySelector('#user-detail-avatar');
        this.banner = this.modal.querySelector('.user-banner');
        this.nameElement = this.modal.querySelector('#user-detail-name');
        this.discriminatorElement = this.modal.querySelector('#user-detail-discriminator');
        this.statusIndicator = this.modal.querySelector('.user-status-indicator');

        this.aboutSection = this.modal.querySelector('#user-detail-about');
        this.memberSinceSection = this.modal.querySelector('#user-detail-member-since');
        this.rolesSection = this.modal.querySelector('#user-detail-roles');
        this.noteInput = this.modal.querySelector('#user-detail-note');

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

        if (this.noteInput) {
            this.noteInput.addEventListener('change', (e) => this.handleNoteChange(e.target.value));
        }
    }

    show(options = {}) {
        const { userId, serverId, triggerElement } = options;

        if (!userId) {
            console.error('User ID is required to show user detail modal');
            return;
        }

        this.currentUserId = userId;
        this.currentServerId = serverId || null;

        if (triggerElement && typeof triggerElement.getBoundingClientRect === 'function') {
            const rect = triggerElement.getBoundingClientRect();
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

        this.showLoadingState();

        this.fetchUserData()
            .then(userData => {
                this.displayUserData(userData);
            })
            .catch(error => {
                console.error('Error fetching user data:', error);
                this.showErrorState();
            });

        this.modal.classList.add('active');
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
        if (this.nameElement) this.nameElement.textContent = 'Loading...';
        if (this.discriminatorElement) this.discriminatorElement.textContent = '';
        if (this.aboutSection) this.aboutSection.innerHTML = '<div class="loading-placeholder"></div>';
        if (this.memberSinceSection) this.memberSinceSection.innerHTML = '<div class="loading-placeholder"></div>';
        if (this.rolesSection) this.rolesSection.innerHTML = '<div class="loading-placeholder"></div>';

        if (this.mutualServersElement) this.mutualServersElement.textContent = 'Loading...';
        if (this.mutualFriendsElement) this.mutualFriendsElement.textContent = 'Loading...';

        if (this.avatar) this.avatar.src = '';
        if (this.banner) this.banner.style.backgroundColor = '#5865f2';
    }


    showErrorState() {
        if (this.nameElement) this.nameElement.textContent = 'User not found';
        if (this.discriminatorElement) this.discriminatorElement.textContent = '';
        if (this.aboutSection) this.aboutSection.textContent = 'Could not load user information.';
        if (this.memberSinceSection) this.memberSinceSection.textContent = 'Unknown';
        if (this.rolesSection) this.rolesSection.textContent = 'No roles available';
        
        if (this.mutualServersElement) this.mutualServersElement.textContent = '0 Mutual Servers';
        if (this.mutualFriendsElement) this.mutualFriendsElement.textContent = '0 Mutual Friends';
    }


    async fetchUserData() {
        try {
            // Import UserAPI
            const userApi = await import('../../api/user-api.js').then(module => module.default);
            
            // First check if we can directly get the user profile
            try {
                // Get user profile data using the direct profile endpoint
                const userData = await userApi.getUserProfile(this.currentUserId, this.currentServerId);
                if (userData.success) {
                    // Don't fetch mutual data for current user
                    const currentUserId = document.getElementById('app-container')?.dataset.userId;
                    if (currentUserId && this.currentUserId !== currentUserId) {
                        try {
                            const mutualResponse = await fetch(`/api/users/${this.currentUserId}/mutual`);
                            if (mutualResponse.ok) {
                                const mutualData = await mutualResponse.json();
                                if (mutualData.success) {
                                    userData.data.mutualData = mutualData.data;
                                }
                            }
                        } catch (error) {
                            console.error('Error fetching mutual data:', error);
                        }
                    }
                    
                    return userData.data;
                }
            } catch (profileError) {
                console.error('Error fetching user profile, trying fallback:', profileError);
                
                // Fallback to general user endpoint
                const response = await fetch(`/api/users/${this.currentUserId}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch user data: ${response.status}`);
                }
                
                const userData = await response.json();
                if (!userData.success) {
                    throw new Error(userData.message || 'Failed to fetch user data');
                }
                
                return userData.data;
            }
            
            throw new Error('Failed to fetch user data');
        } catch (error) {
            console.error('Error fetching user data:', error);
            throw error;
        }
    }

    displayUserData(userData) {
        if (!userData || !userData.user) {
            this.showErrorState();
            return;
        }

        const user = userData.user;
        const isSelf = document.getElementById('app-container')?.dataset.userId === user.id.toString();

        if (this.nameElement) {
            this.nameElement.textContent = user.display_name || user.username;
        }

        if (this.discriminatorElement) {
            this.discriminatorElement.textContent = `#${user.discriminator || '0000'}`;
        }

        if (this.avatar && user.avatar_url) {
            this.avatar.src = user.avatar_url;
        } else if (this.avatar) {
            const avatarContainer = this.avatar.parentNode;
            avatarContainer.innerHTML = `
                <div class="w-full h-full flex items-center justify-center bg-discord-dark text-white">
                    ${(user.username || '?').charAt(0).toUpperCase()}
                </div>
            `;
        }

        if (this.banner && user.banner_url) {
            this.banner.style.backgroundImage = `url(${user.banner_url})`;
        } else if (this.banner) {
            this.banner.style.backgroundImage = '';
            this.banner.style.backgroundColor = '#5865f2';
        }

        if (this.statusIndicator) {
            this.statusIndicator.className = 'user-status-indicator';
            if (user.status) {
                this.statusIndicator.classList.add(user.status);
            }
        }

        if (this.aboutSection) {
            if (user.bio) {
                this.aboutSection.textContent = user.bio;
                this.aboutSection.classList.remove('text-discord-lighter');
            } else {
                this.aboutSection.textContent = 'This user has not added a bio yet.';
                this.aboutSection.classList.add('text-discord-lighter');
            }
        }

        if (this.memberSinceSection && user.created_at) {
            const joinDate = new Date(user.created_at);
            const formattedDate = joinDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            this.memberSinceSection.textContent = formattedDate;
        } else if (this.memberSinceSection) {
            this.memberSinceSection.textContent = 'Unknown';
        }

        if (this.rolesSection && userData.roles) {
            if (userData.roles.length > 0) {
                this.rolesSection.innerHTML = '';
                this.rolesSection.classList.remove('text-discord-lighter');
                
                userData.roles.forEach(role => {
                    const roleElement = document.createElement('div');
                    roleElement.className = 'user-detail-role';
                    roleElement.textContent = role.name || 'Unknown Role';
                    
                    if (role.color) {
                        roleElement.style.backgroundColor = role.color;
                    }
                    
                    this.rolesSection.appendChild(roleElement);
                });
            } else {
                this.rolesSection.textContent = 'No roles';
                this.rolesSection.classList.add('text-discord-lighter');
            }
        }

        if (this.mutualSection) {
            this.mutualSection.style.display = isSelf ? 'none' : 'flex';
        }

        if (!isSelf && userData.mutualData) {
            if (this.mutualServersElement) {
                const serverCount = userData.mutualData.mutual_server_count || 0;
                this.mutualServersElement.textContent = `${serverCount} Mutual Server${serverCount !== 1 ? 's' : ''}`;
            }
            
            if (this.mutualFriendsElement) {
                const friendCount = userData.mutualData.mutual_friend_count || 0;
                this.mutualFriendsElement.textContent = `${friendCount} Mutual Friend${friendCount !== 1 ? 's' : ''}`;
            }
        } else if (!isSelf) {
            if (this.mutualServersElement) this.mutualServersElement.textContent = '0 Mutual Servers';
            if (this.mutualFriendsElement) this.mutualFriendsElement.textContent = '0 Mutual Friends';
        }

        if (this.noteInput && user.note) {
            this.noteInput.value = user.note;
        } else if (this.noteInput) {
            this.noteInput.value = '';
        }

        this.updateActionButtons(userData);
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

    async handleNoteChange(note) {
        if (!this.currentUserId) return;

        try {
            const response = await fetch(`/api/users/${this.currentUserId}/note`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ note })
            });

            if (!response.ok) throw new Error('Failed to save note');
        } catch (error) {
            console.error('Error saving note:', error);
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