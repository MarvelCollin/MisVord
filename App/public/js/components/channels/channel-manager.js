import { showToast } from '../../core/ui/toast.js';

if (typeof $ === 'undefined' && typeof jQuery !== 'undefined') {
    window.$ = jQuery;
}

function initChannelManager() {
    initUpdateChannelForms();
    initDeleteChannelButtons();
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
                    updateChannelInUI(channelId, data);
                } else {
                    showToast('Failed to update channel', 'error');
                }
            })
            .catch(error => {
    
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
                    removeChannelFromUI(channelId);
                } else {
                    showToast('Failed to delete channel', 'error');
                }
            })
            .catch(error => {
    
                showToast('Error deleting channel', 'error');
            })
            .finally(() => {
                button.disabled = false;
                button.textContent = originalText;
            });
    });
}

function updateChannelInUI(channelId, data) {
    const channelElement = document.querySelector(`[data-channel-id="${channelId}"]`);
    if (channelElement) {
        const nameElement = channelElement.querySelector('.channel-name');
        if (nameElement && data.name) {
            nameElement.textContent = data.name;
        }
    }
}

function removeChannelFromUI(channelId) {
    const channelElement = document.querySelector(`[data-channel-id="${channelId}"]`);
    if (channelElement) {
        channelElement.remove();
    }
}

function getServerId() {
    const match = window.location.pathname.match(/\/server\/(\d+)/);
    return match ? match[1] : null;
}

function initChannelEventListeners() {
    
}

if (typeof window.initChannelManager === 'undefined') {
    window.initChannelManager = initChannelManager;
    window.channelManager = {
        updateChannelInUI,
        removeChannelFromUI
    };
}

export { initChannelManager };