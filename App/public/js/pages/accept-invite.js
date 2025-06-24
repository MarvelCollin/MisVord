import { showToast } from '../core/ui/toast.js';

document.addEventListener('DOMContentLoaded', function() {
    window.logger.info('general', "Accept Invite page loaded");

    const inviteCode = window.location.pathname.split('/').pop();
    window.logger.debug('general', "Invite code from URL:", inviteCode);

    const joinServerBtn = document.getElementById('join-server-btn');
    const errorContainer = document.getElementById('invite-error-container');
    const inviteContent = document.getElementById('invite-content');
    const errorMessage = document.getElementById('error-message');
    
    // Add animations
    const inviteCard = document.querySelector('.invite-card');
    if (inviteCard) {
        setTimeout(() => {
            inviteCard.style.opacity = '1';
            inviteCard.style.transform = 'translateY(0)';
        }, 100);
    }
    
    // Check if we're on a JSON response page and redirect if needed
    if (document.body.textContent.trim().startsWith('{') && document.body.textContent.includes('"success":')) {
        try {
            const jsonResponse = JSON.parse(document.body.textContent);
            window.logger.debug('general', "JSON response detected:", jsonResponse);
            
            if (jsonResponse.data && jsonResponse.data.redirect) {
                // Use the redirect URL from the response
                const redirectUrl = jsonResponse.data.redirect.replace(/\\\//g, '/');
                window.logger.debug('general', "Redirecting to:", redirectUrl);
                window.location.href = redirectUrl;
                return;
            } else if (jsonResponse.redirect) {
                // Alternate redirect location
                const redirectUrl = jsonResponse.redirect.replace(/\\\//g, '/');
                window.logger.debug('general', "Redirecting to alternate location:", redirectUrl);
                window.location.href = redirectUrl;
                return;
            } else {
                // Fallback to app page
                window.logger.debug('general', "No redirect URL found, going to app");
                window.location.href = '/app';
                return;
            }
        } catch (e) {
            console.error("Error parsing JSON from body:", e);
            window.location.href = '/app';
            return;
        }
    }
    
    // If there's a join server button, add loading state
    if (joinServerBtn) {
        joinServerBtn.addEventListener('click', function(e) {
            // Don't prevent default - let the natural link navigate to the server join endpoint
            // This ensures server-side auth checks work properly
            
            // Add loading animation
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Joining...';
            this.classList.add('loading');
            this.disabled = true;
            
            // Store the original text
            this.dataset.originalText = 'Accept Invitation';
        });
    }
    
    function showInviteError(message) {
        if (errorMessage) {
            errorMessage.textContent = message;
        }
        
        if (errorContainer && inviteContent) {
            // Fade out invite content
            inviteContent.style.opacity = '0';
            inviteContent.style.transform = 'translateY(-10px)';
            
            // After content fades out, show error
            setTimeout(() => {
                inviteContent.classList.add('hidden');
                errorContainer.classList.remove('hidden');
                
                // Fade in error container
                setTimeout(() => {
                    errorContainer.style.opacity = '1';
                    errorContainer.style.transform = 'translateY(0)';
                }, 50);
            }, 300);
        }
    }
    
    // Check if we need to show an error from the URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('error')) {
        showInviteError(urlParams.get('error'));
    }
});