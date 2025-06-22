/**
 * User Detail Modal Component
 * 
 * This component handles displaying a modal with detailed user information
 * similar to Discord's user profile card.
 */

class UserDetailModal {
    constructor() {
        this.modal = document.getElementById('user-detail-modal');
        this.currentUserId = null;
        this.currentServerId = null;
        
        // Initialize if modal exists in the DOM
        if (this.modal) {
            this.initElements();
            this.initEvents();
        }
    }
    
    /**
     * Initialize element references
     */
    initElements() {
        // Main elements
        this.closeBtn = this.modal.querySelector('.user-detail-close-btn');
        this.avatar = this.modal.querySelector('#user-detail-avatar');
        this.banner = this.modal.querySelector('.user-banner');
        this.nameElement = this.modal.querySelector('#user-detail-name');
        this.discriminatorElement = this.modal.querySelector('#user-detail-discriminator');
        this.statusIndicator = this.modal.querySelector('.user-status-indicator');
        
        // Content sections
        this.aboutSection = this.modal.querySelector('#user-detail-about');
        this.memberSinceSection = this.modal.querySelector('#user-detail-member-since');
        this.rolesSection = this.modal.querySelector('#user-detail-roles');
        this.noteInput = this.modal.querySelector('#user-detail-note');
        
        // Action buttons
        this.messageBtn = this.modal.querySelector('#user-detail-message-btn');
        this.addFriendBtn = this.modal.querySelector('#user-detail-add-friend-btn');
    }
    
    /**
     * Initialize event listeners
     */
    initEvents() {
        // Close modal when clicking the close button
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.hide());
        }
        
        // Close modal when clicking outside the modal
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });
        
        // Close modal when pressing Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible()) {
                this.hide();
            }
        });
        
        // Message button click handler
        if (this.messageBtn) {
            this.messageBtn.addEventListener('click', () => this.handleMessageClick());
        }
        
        // Add friend button click handler
        if (this.addFriendBtn) {
            this.addFriendBtn.addEventListener('click', () => this.handleAddFriendClick());
        }
        
        // Note input change handler
        if (this.noteInput) {
            this.noteInput.addEventListener('change', (e) => this.handleNoteChange(e.target.value));
        }
    }
    
    /**
     * Show the modal with user information
     * @param {Object} options - Options for showing the modal
     * @param {string} options.userId - The ID of the user to display
     * @param {string} options.serverId - The ID of the server context (optional)
     * @param {HTMLElement} options.triggerElement - The element that triggered the modal
     */
    show(options = {}) {
        const { userId, serverId, triggerElement } = options;
        
        if (!userId) {
            console.error('User ID is required to show user detail modal');
            return;
        }
        
        this.currentUserId = userId;
        this.currentServerId = serverId || null;
        
        // Position the modal near the trigger element if provided
        if (triggerElement && typeof triggerElement.getBoundingClientRect === 'function') {
            const rect = triggerElement.getBoundingClientRect();
            const modalWidth = 340; // Default modal width
            
            // Calculate position to show near the trigger element
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // Determine if modal should appear on left or right side of trigger
            const showOnRight = rect.left + rect.width + modalWidth <= viewportWidth;
            const left = showOnRight ? rect.left + rect.width + 10 : rect.left - modalWidth - 10;
            
            // Ensure modal is fully visible vertically
            let top = rect.top;
            if (top + 400 > viewportHeight) { // 400px is an estimated modal height
                top = Math.max(10, viewportHeight - 400 - 10);
            }
            
            // Apply custom positioning
            const container = this.modal.querySelector('.user-detail-container');
            if (container) {
                container.style.position = 'absolute';
                container.style.left = `${left}px`;
                container.style.top = `${top}px`;
                container.style.transform = 'none';
            }
        }
        
        // Show loading state
        this.showLoadingState();
        
        // Fetch and display user data
        this.fetchUserData()
            .then(userData => {
                this.displayUserData(userData);
            })
            .catch(error => {
                console.error('Error fetching user data:', error);
                this.showErrorState();
            });
        
        // Show the modal
        this.modal.classList.add('active');
    }
    
    /**
     * Hide the modal
     */
    hide() {
        this.modal.classList.remove('active');
        this.resetModalPosition();
    }
    
    /**
     * Check if the modal is currently visible
     * @returns {boolean} True if modal is visible
     */
    isVisible() {
        return this.modal.classList.contains('active');
    }
    
    /**
     * Reset the modal position to center
     */
    resetModalPosition() {
        const container = this.modal.querySelector('.user-detail-container');
        if (container) {
            container.style.position = '';
            container.style.left = '';
            container.style.top = '';
            container.style.transform = '';
        }
    }
    
    /**
     * Show loading state while fetching user data
     */
    showLoadingState() {
        // Clear previous data
        if (this.nameElement) this.nameElement.textContent = 'Loading...';
        if (this.discriminatorElement) this.discriminatorElement.textContent = '';
        if (this.aboutSection) this.aboutSection.innerHTML = '<div class="loading-placeholder"></div>';
        if (this.memberSinceSection) this.memberSinceSection.innerHTML = '<div class="loading-placeholder"></div>';
        if (this.rolesSection) this.rolesSection.innerHTML = '<div class="loading-placeholder"></div>';
        
        // Reset avatar and banner
        if (this.avatar) this.avatar.src = '';
        if (this.banner) this.banner.style.backgroundColor = '#5865f2';
    }
    
    /**
     * Show error state if user data couldn't be loaded
     */
    showErrorState() {
        if (this.nameElement) this.nameElement.textContent = 'User not found';
        if (this.discriminatorElement) this.discriminatorElement.textContent = '';
        if (this.aboutSection) this.aboutSection.textContent = 'Could not load user information.';
        if (this.memberSinceSection) this.memberSinceSection.textContent = 'Unknown';
        if (this.rolesSection) this.rolesSection.textContent = 'No roles available';
    }
    
    /**
     * Fetch user data from the API
     * @returns {Promise<Object>} User data
     */
    async fetchUserData() {
        try {
            // If we have a server context, fetch user data with server context
            if (this.currentServerId) {
                const response = await fetch(`/api/users/${this.currentUserId}?server_id=${this.currentServerId}`);
                if (!response.ok) throw new Error('Failed to fetch user data');
                return await response.json();
            } else {
                // Otherwise fetch general user data
                const response = await fetch(`/api/users/${this.currentUserId}`);
                if (!response.ok) throw new Error('Failed to fetch user data');
                return await response.json();
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            throw error;
        }
    }
    
    /**
     * Display user data in the modal
     * @param {Object} userData - The user data to display
     */
    displayUserData(userData) {
        if (!userData || !userData.user) {
            this.showErrorState();
            return;
        }
        
        const user = userData.user;
        
        // Set user name and discriminator
        if (this.nameElement) {
            this.nameElement.textContent = user.display_name || user.username;
        }
        
        if (this.discriminatorElement) {
            this.discriminatorElement.textContent = `#${user.discriminator || '0000'}`;
        }
        
        // Set avatar
        if (this.avatar && user.avatar_url) {
            this.avatar.src = user.avatar_url;
        } else if (this.avatar) {
            // Set default avatar with first letter of username
            const avatarContainer = this.avatar.parentNode;
            avatarContainer.innerHTML = `
                <div class="w-full h-full flex items-center justify-center bg-discord-dark text-white">
                    ${(user.username || '?').charAt(0).toUpperCase()}
                </div>
            `;
        }
        
        // Set banner if available
        if (this.banner && user.banner_url) {
            this.banner.style.backgroundImage = `url(${user.banner_url})`;
        }
        
        // Set status indicator
        if (this.statusIndicator) {
            this.statusIndicator.className = 'user-status-indicator';
            if (user.status) {
                this.statusIndicator.classList.add(user.status);
            }
        }
        
        // Set about me section
        if (this.aboutSection) {
            if (user.bio) {
                this.aboutSection.textContent = user.bio;
            } else {
                this.aboutSection.textContent = 'This user has not added a bio yet.';
                this.aboutSection.classList.add('text-discord-lighter');
            }
        }
        
        // Set member since date
        if (this.memberSinceSection && user.created_at) {
            const joinDate = new Date(user.created_at);
            const formattedDate = joinDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            this.memberSinceSection.textContent = formattedDate;
        }
        
        // Set roles if in server context
        if (this.rolesSection && userData.roles) {
            if (userData.roles.length > 0) {
                this.rolesSection.innerHTML = '';
                userData.roles.forEach(role => {
                    const roleElement = document.createElement('div');
                    roleElement.className = `user-detail-role ${role.name.toLowerCase()}`;
                    roleElement.textContent = role.name;
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
        
        // Set note if available
        if (this.noteInput && user.note) {
            this.noteInput.value = user.note;
        }
        
        // Update action buttons based on relationship
        this.updateActionButtons(userData);
    }
    
    /**
     * Update action buttons based on user relationship
     * @param {Object} userData - The user data
     */
    updateActionButtons(userData) {
        const user = userData.user;
        
        // Update message button
        if (this.messageBtn) {
            // Disable message button if it's the current user
            if (user.is_self) {
                this.messageBtn.disabled = true;
                this.messageBtn.classList.add('opacity-50', 'cursor-not-allowed');
            } else {
                this.messageBtn.disabled = false;
                this.messageBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        }
        
        // Update add friend button based on relationship
        if (this.addFriendBtn) {
            if (user.is_self) {
                // Can't add yourself as friend
                this.addFriendBtn.style.display = 'none';
            } else if (user.is_friend) {
                // Already friends
                this.addFriendBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                    Remove Friend
                `;
                this.addFriendBtn.classList.add('bg-discord-red');
                this.addFriendBtn.classList.remove('bg-discord-dark');
            } else if (user.friend_request_sent) {
                // Friend request pending
                this.addFriendBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                    Pending
                `;
                this.addFriendBtn.disabled = true;
                this.addFriendBtn.classList.add('opacity-50', 'cursor-not-allowed');
            } else {
                // Can send friend request
                this.addFriendBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                    Add Friend
                `;
                this.addFriendBtn.disabled = false;
                this.addFriendBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        }
    }
    
    /**
     * Handle message button click
     */
    handleMessageClick() {
        if (!this.currentUserId) return;
        
        // Close the modal
        this.hide();
        
        // Create or navigate to DM with this user
        this.createOrOpenDM(this.currentUserId);
    }
    
    /**
     * Create or open a DM with a user
     * @param {string} userId - The user ID to message
     */
    async createOrOpenDM(userId) {
        try {
            // Call API to create or get DM room
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
                // Navigate to the DM room
                window.location.href = `/app/channels/dm/${data.room_id}`;
            } else {
                console.error('Failed to create DM:', data.message || 'Unknown error');
            }
        } catch (error) {
            console.error('Error creating DM:', error);
        }
    }
    
    /**
     * Handle add friend button click
     */
    async handleAddFriendClick() {
        if (!this.currentUserId) return;
        
        try {
            const isFriend = this.addFriendBtn.textContent.trim().includes('Remove');
            
            if (isFriend) {
                // Remove friend
                const response = await fetch('/api/friends', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify({ user_id: this.currentUserId })
                });
                
                if (!response.ok) throw new Error('Failed to remove friend');
                
                // Update button
                this.addFriendBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                    Add Friend
                `;
                this.addFriendBtn.classList.remove('bg-discord-red');
                this.addFriendBtn.classList.add('bg-discord-dark');
            } else {
                // Send friend request
                const response = await fetch('/api/friends', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify({ user_id: this.currentUserId })
                });
                
                if (!response.ok) throw new Error('Failed to send friend request');
                
                // Update button
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
    
    /**
     * Handle note change
     * @param {string} note - The new note text
     */
    async handleNoteChange(note) {
        if (!this.currentUserId) return;
        
        try {
            // Save note to API
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

// Initialize and export the UserDetailModal instance
const userDetailModal = new UserDetailModal();

// Add global click handler for user profile elements
document.addEventListener('click', (e) => {
    // Check if the clicked element or its parent has the user-profile-trigger class
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
