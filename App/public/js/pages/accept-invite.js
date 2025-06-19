import { showToast } from '../core/ui/toast.js';

document.addEventListener('DOMContentLoaded', function() {
    window.logger.info('general', "Accept Invite page loaded");

    const inviteCode = window.location.pathname.split('/').pop();
    window.logger.debug('general', "Invite code from URL:", inviteCode);

    const joinServerBtn = document.getElementById('join-server-btn');    if (joinServerBtn) {
        window.logger.debug('general', "Join server button found");

        joinServerBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.logger.info('general', "Join server button clicked");

            joinServerBtn.textContent = 'Joining...';
            joinServerBtn.disabled = true;

            showToast('Joining server...', 'info');

            window.logger.debug('general', "Sending request to join server with code:", inviteCode);

            fetch(`/api/servers/join/${inviteCode}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })            .then(response => {
                window.logger.debug('ajax', "Response received:", response.status);

                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    if (!response.ok) {
                        window.logger.error('ajax', "Error response:", response.status);
                        throw new Error('Failed to join server');
                    }
                    return response.json();
                } else {
                    window.logger.debug('ajax', "Non-JSON response, likely a redirect. Following it...");
                    window.location.href = response.url;
                    throw new Error('redirect_handled');
                }
            })
            .then(data => {
                window.logger.debug('ajax', "Parsed response data:", data);

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
        window.logger.warn('general', "Join server button not found - user might not be logged in");
    }
});