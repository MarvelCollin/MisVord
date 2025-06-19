document.addEventListener('DOMContentLoaded', function() {
    initServerPage();
});

function initServerPage() {
    console.log('Server page initialized');
    
    // Get the server ID from the URL
    const path = window.location.pathname;
    const matches = path.match(/\/server\/(\d+)/);
    
    // Don't trigger channel refresh if we have data-initial-load attribute
    // The channel-loader.js will handle it
    if (!document.body.hasAttribute('data-initial-load') && matches && matches[1]) {
        const serverId = matches[1];
        console.log(`Loading server page for server ID: ${serverId}`);
        
        // Trigger an immediate channel refresh
        document.dispatchEvent(
            new CustomEvent("RefreshChannels", {
                detail: {
                    serverId: serverId
                }
            })
        );
    } else if (document.body.hasAttribute('data-initial-load')) {
        console.log("Using server-rendered channels, skipping refresh event");
    }
    
    // Initialize channel click handlers for server-rendered content
    initializeChannelClickHandlers();
}

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