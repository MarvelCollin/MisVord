import serverAPI from '../../api/server-api.js';

class ServerDetailModal {
    constructor() {
        this.modal = document.getElementById('server-detail-modal');
        this.modalContent = document.getElementById('server-modal-content');
        this.closeButton = document.getElementById('close-server-modal');
        this.joinButton = document.getElementById('server-modal-join');
        this.currentServerId = null;
        this.currentInviteLink = null;
        
        this.init();
    }
    
    init() {
        if (!this.modal) {
            console.error('Server detail modal element not found');
            return;
        }
        
        this.closeButton.addEventListener('click', () => this.hideModal());
        this.joinButton.addEventListener('click', () => this.handleJoinServer());
        
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal || e.target.classList.contains('modal-backdrop')) {
                this.hideModal();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isModalVisible()) {
                this.hideModal();
            }
        });
    }
    
    async showServerDetail(serverId, serverData = null) {
        this.currentServerId = serverId;
        
        try {
            let server;
            
            if (serverData) {
                server = serverData;
            } else {
                const response = await serverAPI.getServer(serverId);
                server = response.server;
            }
            
            if (!server) {
                console.error('Failed to load server details');
                return;
            }
            
            this.updateModalContent(server);
            
            this.modal.style.display = 'flex';
            setTimeout(() => {
                this.modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }, 10);
            
        } catch (error) {
            console.error('Error loading server details:', error);
            if (window.showToast) {
                window.showToast('Failed to load server details', 'error');
            }
        }
    }
    
    updateModalContent(server) {
        const nameElement = document.getElementById('server-modal-name');
        const descriptionElement = document.getElementById('server-modal-description');
        const membersCountElement = document.querySelector('#server-modal-members .member-count');
        const onlineCountElement = document.querySelector('#server-modal-online .online-count');
        const iconElement = document.getElementById('server-modal-icon');
        const iconFallback = document.getElementById('server-modal-icon-fallback');
        const iconFallbackText = iconFallback.querySelector('span');
        const bannerElement = document.getElementById('server-modal-banner');
        
        nameElement.textContent = server.name || 'Unknown Server';
        
        if (server.description && server.description.trim()) {
            descriptionElement.textContent = server.description;
        } else {
            descriptionElement.textContent = 'No description available';
        }
        
        membersCountElement.textContent = server.member_count || 0;
        
        const onlineCount = Math.min(
            Math.floor(Math.random() * (server.member_count || 10)) + 1,
            server.member_count || 1
        );
        onlineCountElement.textContent = onlineCount;
        
        if (server.image_url) {
            iconElement.src = server.image_url;
            iconElement.classList.remove('hidden');
            iconFallback.classList.add('hidden');
        } else {
            iconElement.classList.add('hidden');
            iconFallback.classList.remove('hidden');
            iconFallbackText.textContent = (server.name || 'S').charAt(0).toUpperCase();
        }
        
        if (server.banner_url) {
            bannerElement.src = server.banner_url;
            bannerElement.classList.remove('hidden');
        } else {
            bannerElement.classList.add('hidden');
        }
        
        this.updateJoinButton(server);
        this.currentInviteLink = server.invite_link;
        
        this.updateFeatures(server);
    }
    
    updateFeatures(server) {
        const featuresContainer = document.getElementById('server-modal-features');
        
        const hasVoiceChannels = true;
        const hasTextChannels = true;
        const isPublic = server.is_public;
        
        let featuresHTML = `
            <div class="feature px-3 py-2 bg-discord-light/40 rounded-md text-xs">
                <i class="fas fa-users mr-2"></i> Community
            </div>
        `;
        
        if (hasTextChannels) {
            featuresHTML += `
                <div class="feature px-3 py-2 bg-discord-light/40 rounded-md text-xs">
                    <i class="fas fa-comment mr-2"></i> Text channels
                </div>
            `;
        }
        
        if (hasVoiceChannels) {
            featuresHTML += `
                <div class="feature px-3 py-2 bg-discord-light/40 rounded-md text-xs">
                    <i class="fas fa-video mr-2"></i> Voice channels
                </div>
            `;
        }
        
        if (isPublic) {
            featuresHTML += `
                <div class="feature px-3 py-2 bg-discord-light/40 rounded-md text-xs">
                    <i class="fas fa-globe mr-2"></i> Public
                </div>
            `;
        }
        
        if (server.category) {
            featuresHTML += `
                <div class="feature px-3 py-2 bg-discord-light/40 rounded-md text-xs">
                    <i class="fas fa-tag mr-2"></i> ${this.formatCategory(server.category)}
                </div>
            `;
        }
        
        featuresContainer.innerHTML = featuresHTML;
    }
    
    formatCategory(category) {
        if (!category) return '';
        
        return category.charAt(0).toUpperCase() + category.slice(1);
    }
    
    updateJoinButton(server) {
        const isJoined = server.is_member || false;
        
        if (isJoined) {
            this.joinButton.textContent = 'Joined';
            this.joinButton.classList.add('joined');
            this.joinButton.classList.add('bg-discord-green');
            this.joinButton.classList.remove('bg-discord-primary');
        } else {
            this.joinButton.textContent = 'Join Server';
            this.joinButton.classList.remove('joined');
            this.joinButton.classList.add('bg-discord-primary');
            this.joinButton.classList.remove('bg-discord-green');
        }
    }
    
    async handleJoinServer() {
        if (!this.currentServerId) return;
        
        if (this.joinButton.classList.contains('joined')) {
            window.location.href = `/server/${this.currentServerId}`;
            return;
        }
        
        this.joinButton.textContent = 'Joining...';
        this.joinButton.classList.add('joining');
        
        try {
            const response = await serverAPI.joinServer({ server_id: this.currentServerId });
            
            if (response.success) {
                this.joinButton.textContent = 'Joined';
                this.joinButton.classList.remove('joining');
                this.joinButton.classList.add('joined');
                this.joinButton.classList.remove('bg-discord-primary');
                this.joinButton.classList.add('bg-discord-green');
                
                if (window.showToast) {
                    window.showToast('Successfully joined server!', 'success');
                }
                
                setTimeout(() => {
                    window.location.href = `/server/${this.currentServerId}`;
                }, 1500);
            } else {
                this.joinButton.textContent = 'Join Server';
                this.joinButton.classList.remove('joining');
                
                if (window.showToast) {
                    window.showToast(response.message || 'Failed to join server', 'error');
                }
            }
        } catch (error) {
            console.error('Error joining server:', error);
            this.joinButton.textContent = 'Join Server';
            this.joinButton.classList.remove('joining');
            
            if (window.showToast) {
                window.showToast('Error joining server', 'error');
            }
        }
    }
    
    hideModal() {
        document.body.style.overflow = '';
        this.modal.classList.remove('active');
        setTimeout(() => {
            this.modal.style.display = '';
        }, 200); // Wait for transition to finish
    }
    
    isModalVisible() {
        return this.modal && this.modal.classList.contains('active');
    }
}

window.ServerDetailModal = ServerDetailModal;

document.addEventListener('DOMContentLoaded', () => {
    window.serverDetailModal = new ServerDetailModal();
    
    window.showServerDetail = (serverId, serverData) => {
        if (window.serverDetailModal) {
            window.serverDetailModal.showServerDetail(serverId, serverData);
        }
    };
});

export default ServerDetailModal;
