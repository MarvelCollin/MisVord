import { showToast } from '../core/ui/toast.js';

document.addEventListener('DOMContentLoaded', function() {
    logger.info('general', "Accept Invite page loaded");

    const inviteCode = window.location.pathname.split('/').pop();
    logger.debug('general', "Invite code from URL:", inviteCode);

    const joinServerBtn = document.getElementById('join-server-btn');    if (joinServerBtn) {
        logger.debug('general', "Join server button found");

        joinServerBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logger.info('general', "Join server button clicked");

            joinServerBtn.textContent = 'Joining...';
            joinServerBtn.disabled = true;

            showToast('Joining server...', 'info');

            logger.debug('general', "Sending request to join server with code:", inviteCode);

            fetch(`/api/servers/join/${inviteCode}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })            .then(response => {
                logger.debug('ajax', "Response received:", response.status);

                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    if (!response.ok) {
                        logger.error('ajax', "Error response:", response.status);
                        throw new Error('Failed to join server');
                    }
                    return response.json();
                } else {
                    logger.debug('ajax', "Non-JSON response, likely a redirect. Following it...");
                    window.location.href = response.url;
                    throw new Error('redirect_handled');
                }
            })
            .then(data => {
                logger.debug('ajax', "Parsed response data:", data);

                if (data.success) {

                    showToast('Successfully joined server!', 'success');

                    if (data.data && data.data.redirect) {
                        console.log("Redirecting to:", data.data.redirect);
                        window.location.href = data.data.redirect;
                    } else {
                        console.log("No redirect URL in response, going to app");
                        window.location.href = '/app';
                    }
                } else {

                    console.error("Error in response:", data.message);
                    throw new Error(data.message || 'Failed to join server');
                }
            })
            .catch(error => {
                if (error.message === 'redirect_handled') {
                    console.log("Redirect already handled, no further action needed");
                    return;
                }

                console.error('Error joining server:', error);

                joinServerBtn.textContent = 'Accept Invitation';
                joinServerBtn.disabled = false;

                showToast(error.message || 'Failed to join server. Please try again.', 'error');
            });
        });    } else {
        logger.warn('general', "Join server button not found - user might not be logged in");
    }
});