import { showToast } from '../../core/ui/toast.js';

if (typeof $ === 'undefined' && typeof jQuery !== 'undefined') {
    window.$ = jQuery;
}

function initChannelManager() {
    loadServerChannels();
    initUpdateChannelForms();
    initDeleteChannelButtons();
}

function loadServerChannels() {
    const serverId = getServerId();
    if (!serverId) return;

    window.serverAPI.getServerChannels(serverId)
        .then(response => {
            if (response.data) {
                renderChannelList(response.data);
            }
        })
        .catch(error => {
            console.error('Error loading channels:', error);
        });
}

function renderChannelList(data) {
    if (data.channels) {
        console.log('Channels loaded:', data.channels.length);
    }
}

function initUpdateChannelForms() {
    document.addEventListener('submit', function(e) {
        const form = e.target;
        if (!form.matches('form[data-action="update-channel"]')) return;
        
        e.preventDefault();
        
        const channelId = form.getAttribute('data-channel-id');
        const formData = new FormData(form);
        
        const data = {
            name: formData.get('name'),
            description: formData.get('description'),
            is_private: formData.get('is_private') === 'on'
        };
        
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Updating...';
        }
        
        window.channelAPI.updateChannel(channelId, data)
            .then(response => {
                if (response.success) {
                    showToast('Channel updated successfully', 'success');
                    refreshChannelData();
                } else {
                    showToast('Failed to update channel', 'error');
                }
            })
            .catch(error => {
                console.error('Error updating channel:', error);
                showToast('Error updating channel', 'error');
            })
            .finally(() => {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Update Channel';
                }
            });
    });
}

function initDeleteChannelButtons() {
    document.addEventListener('click', function(e) {
        if (!e.target.matches('[data-action="delete-channel"]')) return;
        
        e.preventDefault();
        
        const channelId = e.target.getAttribute('data-channel-id');
        const channelName = e.target.getAttribute('data-channel-name') || 'this channel';
        
        if (!confirm(`Are you sure you want to delete ${channelName}? This action cannot be undone.`)) {
            return;
        }
        
        const button = e.target;
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = 'Deleting...';
        
        window.channelAPI.deleteChannel(channelId)
            .then(response => {
                if (response.success) {
                    showToast('Channel deleted successfully', 'success');
                    refreshChannelData();
                } else {
                    showToast('Failed to delete channel', 'error');
                }
            })
            .catch(error => {
                console.error('Error deleting channel:', error);
                showToast('Error deleting channel', 'error');
            })
            .finally(() => {
                button.disabled = false;
                button.textContent = originalText;
            });
    });
}

function refreshChannelData() {
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

function getServerId() {
    const match = window.location.pathname.match(/\/server\/(\d+)/);
    return match ? match[1] : null;
}

function initChannelEventListeners() {
    console.log('Channel event listeners initialized');
}

if (typeof window.initChannelManager === 'undefined') {
    window.initChannelManager = initChannelManager;
    window.refreshChannelList = refreshChannelData;
    window.channelManager = {
        refreshChannelList: refreshChannelData
    };
}

export { initChannelManager };