import { showToast } from '../core/ui/toast.js';

document.addEventListener('DOMContentLoaded', function() {
    window.logger.info('general', "Accept Invite page loaded");

    const inviteCode = window.location.pathname.split('/').pop();
    window.logger.debug('general', "Invite code from URL:", inviteCode);

    const joinServerBtn = document.getElementById('join-server-btn');
    const errorContainer = document.getElementById('invite-error-container');
    const inviteContent = document.getElementById('invite-content');
    const errorMessage = document.getElementById('error-message');
    
    // Check if we're on a JSON response page and redirect if needed
    if (document.body.textContent.trim().startsWith('{') && document.body.textContent.includes('"success":')) {
        try {
            const jsonResponse = JSON.parse(document.body.textContent);
            window.location.href = `/join/${inviteCode}`;
            return;
        } catch (e) {
            console.error("Error parsing JSON from body:", e);
            window.location.href = `/join/${inviteCode}`;
            return;
        }
    }
    
    // If there's a join server button, make it redirect directly instead of using AJAX
    if (joinServerBtn) {
        joinServerBtn.addEventListener('click', function(e) {
            // Don't prevent default - let the natural link navigate to the server join endpoint
            // This ensures server-side auth checks work properly
        });
    }
    
    function showInviteError(message) {
        if (errorMessage) {
            errorMessage.textContent = message;
        }
        if (errorContainer) {
            errorContainer.classList.remove('hidden');
        }
        if (inviteContent) {
            inviteContent.classList.add('hidden');
        }
    }
});