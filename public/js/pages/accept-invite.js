import { showToast } from '../core/ui/toast.js';

document.addEventListener('DOMContentLoaded', function() {
    window.logger.info('general', "Accept Invite page loaded");

    const inviteCode = window.location.pathname.split('/').pop();
    window.logger.debug('general', "Invite code from URL:", inviteCode);

    const joinServerBtn = document.getElementById('join-server-btn');
    const errorContainer = document.getElementById('invite-error-container');
    const inviteContent = document.getElementById('invite-content');
    const errorMessage = document.getElementById('error-message');
                
    const inviteCard = document.querySelector('.invite-card');
    if (inviteCard) {
        setTimeout(() => {
            inviteCard.style.opacity = '1';
            inviteCard.style.transform = 'translateY(0)';
        }, 100);
    }
    
    if (document.body.textContent.trim().startsWith('{') && document.body.textContent.includes('"success":')) {
        try {
            const jsonResponse = JSON.parse(document.body.textContent);
            window.logger.debug('general', "JSON response detected:", jsonResponse);
            
            if (jsonResponse.data && jsonResponse.data.redirect) {
                const redirectUrl = jsonResponse.data.redirect.replace(/\\\//g, '/');
                window.logger.debug('general', "Redirecting to:", redirectUrl);
                window.location.href = redirectUrl;
                return;
            } else if (jsonResponse.redirect) {
                const redirectUrl = jsonResponse.redirect.replace(/\\\//g, '/');
                window.logger.debug('general', "Redirecting to alternate location:", redirectUrl);
                window.location.href = redirectUrl;
                return;
            } else {
                window.logger.debug('general', "No redirect URL found, going to app");
                window.location.href = '/home';
                return;
            }
        } catch (e) {
            console.error("Error parsing JSON from body:", e);
            window.location.href = '/home';
            return;
        }
    }
    
    if (joinServerBtn) {
        joinServerBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Joining...';
            this.classList.add('loading');
            this.disabled = true;
            
            this.dataset.originalText = 'Accept Invitation';

            const href = this.getAttribute('href');
            fetch(href, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                credentials: 'include'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    if (data.data && data.data.user_data) {
                        if (window.globalSocketManager && window.globalSocketManager.isReady()) {
                            window.globalSocketManager.io.emit('server-member-joined', {
                                server_id: data.data.server_id,
                                server_name: data.data.server_name,
                                user_data: data.data.user_data
                            });
                        }
                    }
                    
                    if (data.data && data.data.redirect) {
                        window.location.href = data.data.redirect;
                    } else if (data.redirect) {
                        window.location.href = data.redirect;
                    } else {
                        window.location.href = '/home';
                    }
                } else {
                    window.location.href = '/home';
                }
            })
            .catch(error => {
                console.error('Error joining server:', error);
                showToast('Failed to join server. Please try again.', 'error');
                this.innerHTML = this.dataset.originalText;
                this.classList.remove('loading');
                this.disabled = false;
            });
        });
    }
    
    function showInviteError(message) {
        if (errorMessage) {
            errorMessage.textContent = message;
        }
        
        if (errorContainer && inviteContent) {
            inviteContent.style.opacity = '0';
            inviteContent.style.transform = 'translateY(-10px)';
            
            setTimeout(() => {
                inviteContent.classList.add('hidden');
                errorContainer.classList.remove('hidden');
                
                setTimeout(() => {
                    errorContainer.style.opacity = '1';
                    errorContainer.style.transform = 'translateY(0)';
                }, 50);
            }, 300);
        }
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('error')) {
        showInviteError(urlParams.get('error'));
    }
});