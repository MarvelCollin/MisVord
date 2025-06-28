import { getUserProfile, getMutualInfo } from '../../api/user-api.js';
import { createDirectMessage } from '../../api/chat-api.js';
import { addFriend } from '../../api/friend-api.js';
import { socket } from '../../core/socket/global-socket-manager.js';
import { showToast } from '../../core/ui/toast.js';

class UserDetail {
    constructor() {
        this.modal = document.getElementById('user-detail-modal');
        this.closeBtn = this.modal.querySelector('.user-detail-close-btn');
        this.avatar = document.getElementById('user-detail-avatar');
        this.name = document.getElementById('user-detail-name');
        this.discriminator = document.getElementById('user-detail-discriminator');
        this.bio = document.getElementById('user-detail-bio');
        this.serverInfo = document.getElementById('user-detail-server-info');
        this.mutualServers = document.getElementById('user-detail-mutual-servers');
        this.mutualFriends = document.getElementById('user-detail-mutual-friends');
        this.messageInput = document.getElementById('user-detail-message-input');
        this.sendBtn = document.getElementById('user-detail-send-btn');
        this.messageBtn = document.getElementById('user-detail-message-btn');
        this.addFriendBtn = document.getElementById('user-detail-add-friend-btn');
        this.statusIndicator = this.modal.querySelector('.user-status-indicator');
        
        this.currentUserId = null;
        this.bindEvents();
    }

    bindEvents() {
        this.closeBtn.addEventListener('click', () => this.hide());
        this.messageBtn.addEventListener('click', () => this.startDirectMessage());
        this.addFriendBtn.addEventListener('click', () => this.sendFriendRequest());
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Listen for user status updates
        socket.on('user_status_update', (data) => {
            if (data.user_id === this.currentUserId) {
                this.updateStatus(data.status);
            }
        });
    }

    async show(userId) {
        try {
            this.currentUserId = userId;
            const [profile, mutual] = await Promise.all([
                getUserProfile(userId),
                getMutualInfo(userId)
            ]);

            this.updateUI(profile, mutual);
            this.modal.style.display = 'flex';
        } catch (error) {
            showToast('Error loading user profile', 'error');
            console.error('Error loading user profile:', error);
        }
    }

    hide() {
        this.modal.style.display = 'none';
        this.currentUserId = null;
        this.resetUI();
    }

    updateUI(profile, mutual) {
        // Update basic info
        this.avatar.src = profile.avatar_url || '/assets/common/default-profile-picture.png';
        this.name.textContent = profile.username;
        this.discriminator.textContent = `#${profile.discriminator}`;
        this.bio.textContent = profile.bio || 'This user has not added a bio yet.';
        
        // Update mutual info
        this.mutualServers.textContent = `${mutual.server_count} Mutual Servers`;
        this.mutualFriends.textContent = `${mutual.friend_count} Mutual Friends`;
        
        // Update server info if available
        if (profile.server_join_date) {
            const joinDate = new Date(profile.server_join_date).toLocaleDateString();
            this.serverInfo.textContent = `Joined ${joinDate}`;
        } else {
            this.serverInfo.textContent = 'Not a member of this server';
        }

        // Update status
        this.updateStatus(profile.status);

        // Update action buttons based on relationship
        this.updateActionButtons(profile.relationship);
    }

    updateStatus(status) {
        this.statusIndicator.className = 'user-status-indicator';
        this.statusIndicator.classList.add(status);
    }

    updateActionButtons(relationship) {
        switch (relationship) {
            case 'friend':
                this.addFriendBtn.style.display = 'none';
                this.messageBtn.style.display = 'block';
                break;
            case 'pending_outgoing':
                this.addFriendBtn.textContent = 'Friend Request Sent';
                this.addFriendBtn.disabled = true;
                this.messageBtn.style.display = 'none';
                break;
            case 'pending_incoming':
                this.addFriendBtn.textContent = 'Accept Friend Request';
                this.messageBtn.style.display = 'none';
                break;
            case 'none':
                this.addFriendBtn.textContent = 'Add Friend';
                this.addFriendBtn.disabled = false;
                this.messageBtn.style.display = 'none';
                break;
            case 'blocked':
                this.addFriendBtn.style.display = 'none';
                this.messageBtn.style.display = 'none';
                break;
        }
    }

    resetUI() {
        this.avatar.src = '/assets/common/default-profile-picture.png';
        this.name.textContent = '';
        this.discriminator.textContent = '';
        this.bio.textContent = '';
        this.serverInfo.textContent = '';
        this.mutualServers.textContent = '0 Mutual Servers';
        this.mutualFriends.textContent = '0 Mutual Friends';
        this.messageInput.value = '';
        this.statusIndicator.className = 'user-status-indicator';
    }

    async startDirectMessage() {
        try {
            const response = await createDirectMessage(this.currentUserId);
            if (response.success) {
                window.location.href = `/chat/${response.chat_id}`;
            }
        } catch (error) {
            showToast('Error starting conversation', 'error');
            console.error('Error starting conversation:', error);
        }
    }

    async sendFriendRequest() {
        try {
            const response = await addFriend(this.currentUserId);
            if (response.success) {
                this.updateActionButtons('pending_outgoing');
                showToast('Friend request sent!', 'success');
            }
        } catch (error) {
            showToast('Error sending friend request', 'error');
            console.error('Error sending friend request:', error);
        }
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        try {
            const response = await createDirectMessage(this.currentUserId, message);
            if (response.success) {
                window.location.href = `/chat/${response.chat_id}`;
            }
        } catch (error) {
            showToast('Error sending message', 'error');
            console.error('Error sending message:', error);
        }
    }
}

export const userDetail = new UserDetail();