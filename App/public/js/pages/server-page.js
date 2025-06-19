document.addEventListener('DOMContentLoaded', function() {

    initializeChannelClickHandlers();

    initializeServerModals();

    logger.info('server', 'Server page JS initialized');
});

function initializeChannelClickHandlers() {
    const channelItems = document.querySelectorAll('.channel-item');
    const currentServerId = document.querySelector('meta[name="server-id"]')?.getAttribute('content');

    channelItems.forEach(item => {
        item.addEventListener('click', function() {
            const channelId = this.getAttribute('data-channel-id');
            const channelType = this.getAttribute('data-channel-type') || 'text';

            if (!channelId || !currentServerId) return;

            const newUrl = `/server/${currentServerId}?channel=${channelId}`;
            window.location.href = newUrl;
        });
    });
}

function initializeServerModals() {
    const createServerBtn = document.querySelector('[data-action="create-server"]');
    const modal = document.getElementById('create-server-modal');
    const closeBtn = document.getElementById('close-server-modal');

    if (createServerBtn && modal) {
        createServerBtn.addEventListener('click', function(e) {
            e.preventDefault();
            modal.classList.remove('hidden');
        });
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', function() {
            modal.classList.add('hidden');
        });
    }

    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    }
}