class ServerDetailModal {
    constructor() {
        this.modal = null;
        this.modalContent = null;
        this.closeButton = null;
        this.joinButton = null;
        this.currentServerId = null;
        this.currentInviteLink = null;
        this.initialized = false;
        this.skeletonTimeout = null;
        
        this.initModal();
    }
    
    initModal() {
        this.findModalElements();
        
        if (this.modal && this.modalContent && this.closeButton && this.joinButton) {
            this.init();
            this.initialized = true;
        } else {
            this.waitForModalElements();
        }
    }
    
    findModalElements() {
        this.modal = document.getElementById('server-detail-modal');
        this.modalContent = this.modal ? document.getElementById('server-modal-content') : null;
        this.closeButton = this.modal ? document.getElementById('close-server-modal') : null;
        this.joinButton = this.modal ? document.getElementById('server-modal-join') : null;
    }
    
    waitForModalElements() {
        let attempts = 0;
        const maxAttempts = 10;
        
        const checkForElements = () => {
            attempts++;
            this.findModalElements();
            
            if (this.modal && this.modalContent && this.closeButton && this.joinButton) {
                this.init();
                this.initialized = true;
            } else if (attempts < maxAttempts) {
                setTimeout(checkForElements, 200);
            } else {
                this.initialized = false;
            }
        };
        
        setTimeout(checkForElements, 100);
    }
    
    init() {
        if (!this.modal || !this.closeButton || !this.joinButton) {
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
        if (!this.initialized || !this.modal) {
            return;
        }
        
        this.currentServerId = serverId;
        this.showModalWithAnimation();
        
        if (serverData) {
            setTimeout(() => {
                this.updateModalContent(serverData);
            }, 500);
            return;
        }
        
        try {
            if (typeof window.serverAPI === 'undefined') {
                this.hideSkeletonAndShowContent();
                return;
            }
            
            const response = await window.serverAPI.getServer(serverId);
            const server = response.server;
            
            if (!server) {
                this.hideSkeletonAndShowContent();
                return;
            }
            
            this.updateModalContent(server);
        } catch (error) {
            console.error('[Server Detail] Error loading server details:', error);
            this.hideSkeletonAndShowContent();
        }
    }
    
    updateModalContent(server) {
        console.log('[Server Detail] Updating modal with server data:', server);
        
        const nameElement = document.getElementById('server-modal-name');
        const descriptionElement = document.getElementById('server-modal-description');
        const membersCountElement = document.querySelector('.member-count');
        const iconElement = document.getElementById('server-modal-icon');
        const bannerElement = document.getElementById('server-modal-banner');
        
        console.log('[Server Detail] Image URLs - Icon:', server.image_url, 'Banner:', server.banner_url);
        
        if (nameElement) nameElement.textContent = server.name || 'Unknown Server';
        
        if (descriptionElement) {
            if (server.description && server.description.trim()) {
                descriptionElement.textContent = server.description;
            } else {
                descriptionElement.textContent = 'No description available';
            }
        }
        
        if (membersCountElement) {
            membersCountElement.textContent = (server.member_count || 0).toLocaleString();
        }
        
        if (iconElement) {
            const fallbackElement = document.getElementById('server-modal-icon-fallback');
            
            if (server.image_url && server.image_url.trim() !== '') {
                iconElement.src = server.image_url;
                iconElement.onload = function() {
                    this.classList.remove('hidden');
                    if (fallbackElement) {
                        fallbackElement.classList.add('hidden');
                    }
                };
                iconElement.onerror = function() {
                    this.onerror = null;
                    this.classList.add('hidden');
                    if (fallbackElement) {
                        fallbackElement.classList.remove('hidden');
                        fallbackElement.textContent = (server.name || 'S').charAt(0).toUpperCase();
                    }
                };
                iconElement.classList.remove('hidden');
                if (fallbackElement) {
                    fallbackElement.classList.add('hidden');
                }
            } else {
                iconElement.classList.add('hidden');
                if (fallbackElement) {
                    fallbackElement.classList.remove('hidden');
                    fallbackElement.textContent = (server.name || 'S').charAt(0).toUpperCase();
                }
            }
        }
        
        if (bannerElement) {
            if (server.banner_url && server.banner_url.trim() !== '') {
                bannerElement.src = server.banner_url;
                bannerElement.onload = function() {
                    this.classList.remove('hidden');
                };
                bannerElement.onerror = function() {
                    this.onerror = null;
                    this.classList.add('hidden');
                };
                bannerElement.classList.remove('hidden');
            } else {
                bannerElement.classList.add('hidden');
            }
        }
        
        this.updateJoinButton(server);
        this.currentInviteLink = server.invite_link;
        
        this.hideSkeletonAndShowContent();
        this.addContentAnimations();
    }
    
    addContentAnimations() {
        const elements = [
            this.modal.querySelector('h2'),
            this.modal.querySelector('.member-stats'),
            this.modal.querySelector('.server-info-section'),
            this.modal.querySelector('#server-modal-join-container')
        ].filter(el => el);
        
        elements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            setTimeout(() => {
                el.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, 200 + (index * 100));
        });
    }
    
    updateJoinButton(server) {
        if (!this.joinButton) return;
        
        const isJoined = server.is_member || false;
        
        if (isJoined) {
            this.joinButton.innerHTML = '<i class="fas fa-check mr-2"></i>Joined';
            this.joinButton.classList.add('joined');
            this.joinButton.className = this.joinButton.className.replace(/bg-gradient-to-r.*?to-\[#7289da\]/, 'bg-gradient-to-r from-[#3ba55c] to-[#57f287]');
        } else {
            this.joinButton.innerHTML = '<i class="fas fa-right-to-bracket mr-2"></i>Join Server';
            this.joinButton.classList.remove('joined');
            this.joinButton.className = this.joinButton.className.replace(/bg-gradient-to-r.*?to-\[#57f287\]/, 'bg-gradient-to-r from-[#5865f2] to-[#7289da]');
        }
    }
    
    async handleJoinServer() {
        if (!this.currentServerId || !this.joinButton) return;
        
        if (this.joinButton.classList.contains('joined')) {
            this.animateButtonPress();
            setTimeout(() => {
                window.location.href = `/server/${this.currentServerId}`;
            }, 300);
            return;
        }
        
        const originalContent = this.joinButton.innerHTML;
        
        this.joinButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Joining...';
        this.joinButton.classList.add('joining');
        this.joinButton.style.pointerEvents = 'none';
        
        try {
            if (typeof window.serverAPI === 'undefined') {
                throw new Error('Server API not available');
            }
            
            const response = await window.serverAPI.joinServer({ server_id: this.currentServerId });
            
            if (response.success) {
                this.joinButton.innerHTML = '<i class="fas fa-check mr-2"></i>Joined!';
                this.joinButton.classList.remove('joining');
                this.joinButton.classList.add('joined');
                this.joinButton.className = this.joinButton.className.replace(/bg-gradient-to-r.*?to-\[#7289da\]/, 'bg-gradient-to-r from-[#3ba55c] to-[#57f287]');
                
                this.animateSuccess();
                
                if (window.showToast) {
                    window.showToast('Successfully joined server!', 'success');
                }
                
                setTimeout(() => {
                    window.location.href = `/server/${this.currentServerId}`;
                }, 1500);
            } else {
                this.joinButton.innerHTML = originalContent;
                this.joinButton.classList.remove('joining');
                this.joinButton.style.pointerEvents = 'auto';
                
                this.animateError();
                
                if (window.showToast) {
                    window.showToast(response.message || 'Failed to join server', 'error');
                }
            }
        } catch (error) {
            console.error('Error joining server:', error);
            this.joinButton.innerHTML = originalContent;
            this.joinButton.classList.remove('joining');
            this.joinButton.style.pointerEvents = 'auto';
            
            this.animateError();
            
            if (window.showToast) {
                window.showToast('Error joining server', 'error');
            }
        }
    }
    
    animateButtonPress() {
        if (!this.joinButton) return;
        this.joinButton.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.joinButton.style.transform = 'scale(1)';
        }, 150);
    }
    
    animateSuccess() {
        if (!this.joinButton) return;
        this.joinButton.style.transform = 'scale(1.05)';
        setTimeout(() => {
            this.joinButton.style.transform = 'scale(1)';
        }, 200);
        
        const successRipple = document.createElement('div');
        successRipple.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            background: rgba(59, 165, 92, 0.3);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;
        
        this.joinButton.style.position = 'relative';
        this.joinButton.appendChild(successRipple);
        
        setTimeout(() => {
            successRipple.remove();
        }, 600);
    }
    
    animateError() {
        if (!this.joinButton) return;
        this.joinButton.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            this.joinButton.style.animation = '';
        }, 500);
    }
    
    hideModal() {
        if (!this.modal) return;
        
        if (this.skeletonTimeout) {
            clearTimeout(this.skeletonTimeout);
            this.skeletonTimeout = null;
        }
        
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        
        const container = this.modal.querySelector('.modal-container');
        if (container) {
            container.style.transform = 'scale(0.8) translateY(40px)';
        }
        
        setTimeout(() => {
            this.modal.style.display = 'none';
            if (container) {
                container.style.transform = '';
            }
        }, 300);
    }
    
    isModalVisible() {
        return this.modal && this.modal.classList.contains('active');
    }
    
    showModalWithAnimation() {
        if (!this.modal) return;
        
        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        const skeleton = document.getElementById('server-modal-skeleton');
        const actualContent = document.getElementById('server-modal-actual-content');
        
        if (skeleton && actualContent) {
            skeleton.style.display = 'block';
            actualContent.style.display = 'none';
        }
        
        if (this.skeletonTimeout) {
            clearTimeout(this.skeletonTimeout);
        }
        
        this.skeletonTimeout = setTimeout(() => {
            this.hideSkeletonAndShowContent();
            this.skeletonTimeout = null;
        }, 5000);
        
        requestAnimationFrame(() => {
            this.modal.classList.add('active');
            
            const container = this.modal.querySelector('.modal-container');
            if (container) {
                container.classList.add('modal-enter');
                setTimeout(() => {
                    container.classList.remove('modal-enter');
                }, 400);
            }
        });
    }
    
    hideSkeletonAndShowContent() {
        if (this.skeletonTimeout) {
            clearTimeout(this.skeletonTimeout);
            this.skeletonTimeout = null;
        }
        
        const skeleton = document.getElementById('server-modal-skeleton');
        const actualContent = document.getElementById('server-modal-actual-content');
        
        if (skeleton && actualContent) {
            skeleton.style.display = 'none';
            actualContent.style.display = 'block';
        }
    }
}

if (!window.customAnimationStyles) {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                width: 100px;
                height: 100px;
                opacity: 0;
            }
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
        
        .modal-enter {
            animation: modalBounceIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        @keyframes modalBounceIn {
            0% {
                opacity: 0;
                transform: scale(0.8) translateY(40px) rotate(-2deg);
            }
            50% {
                transform: scale(1.05) translateY(-10px) rotate(1deg);
            }
            100% {
                opacity: 1;
                transform: scale(1) translateY(0) rotate(0deg);
            }
        }
    `;
    document.head.appendChild(style);
    window.customAnimationStyles = true;
}

window.ServerDetailModal = ServerDetailModal;

function initServerDetailModal() {
    if (window.serverDetailModal) {
        console.log('[Server Detail] Modal already initialized');
        return;
    }
    
    const modalExists = document.getElementById('server-detail-modal');
    if (!modalExists) {
        console.log('[Server Detail] Modal HTML not available, skipping initialization');
        return;
    }
    
    try {
        window.serverDetailModal = new ServerDetailModal();
        
        window.showServerDetail = (serverId, serverData) => {
            if (window.serverDetailModal && window.serverDetailModal.initialized) {
                window.serverDetailModal.showServerDetail(serverId, serverData);
            } else {
                console.log('[Server Detail] Modal not ready for showServerDetail call');
            }
        };
        
        console.log('[Server Detail] Initialization completed');
    } catch (error) {
        console.error('[Server Detail] Initialization failed:', error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initServerDetailModal);
} else {
    initServerDetailModal();
}

export { ServerDetailModal };
export default ServerDetailModal;
