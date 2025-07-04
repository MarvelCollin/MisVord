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

function refreshChannelList() {
    const serverId = 
        document.getElementById('current-server-id')?.value || 
        document.querySelector('meta[name="server-id"]')?.content;
    
    if (!serverId) {
        console.error('Server ID not found, cannot refresh channel list');
        return;
    }
    
    if (window.channelSectionSkeleton && window.channelSectionSkeleton.show) {
        window.channelSectionSkeleton.show();
    }
    
    window.channelAPI.getChannels(serverId)
        .done(function(response) {
            if (!response || !response.success) {
                showToast('Failed to refresh channel list', 'error');
                return;
            }
            
            const channels = response.data?.channels || response.channels || [];
            const channelList = document.querySelector('.channel-list');
            
            if (!channelList) {
                console.error('Channel list container not found');
                return;
            }
            
            const activeChannelId = document.getElementById('active-channel-id')?.value;
            
            const categories = {};
            const uncategorizedTextChannels = [];
            const uncategorizedVoiceChannels = [];
            
            channels.forEach(channel => {
                if (!channel.category_id) {
                    if (channel.type === 'voice') {
                        uncategorizedVoiceChannels.push(channel);
                    } else {
                        uncategorizedTextChannels.push(channel);
                    }
                } else {
                    if (!categories[channel.category_id]) {
                        categories[channel.category_id] = {
                            id: channel.category_id,
                            name: channel.category_name || 'Category',
                            channels: []
                        };
                    }
                    categories[channel.category_id].channels.push(channel);
                }
            });
            
            uncategorizedTextChannels.sort((a, b) => (a.position || 0) - (b.position || 0));
            uncategorizedVoiceChannels.sort((a, b) => (a.position || 0) - (b.position || 0));
            
            let html = '';
            
            if (uncategorizedTextChannels.length > 0) {
                html += '<div class="channels-section group" data-section-type="text" data-server-id="' + serverId + '">';
                uncategorizedTextChannels.forEach(channel => {
                    html += renderChannelHTML(channel, activeChannelId);
                });
                html += '</div>';
            }
            
            if (uncategorizedVoiceChannels.length > 0) {
                html += '<div class="voice-channels-section group" data-section-type="voice" data-server-id="' + serverId + '">';
                uncategorizedVoiceChannels.forEach(channel => {
                    html += renderChannelHTML(channel, activeChannelId);
                });
                html += '</div>';
            }
            
            const categoryIds = Object.keys(categories);
            categoryIds.forEach(catId => {
                const category = categories[catId];
                category.channels.sort((a, b) => (a.position || 0) - (b.position || 0));
                
                html += `
                <div class="category-section mb-4" data-category-id="${category.id}">
                    <div class="category-header flex items-center px-3 py-1 mb-1 cursor-pointer group transition-all duration-200" 
                         data-category-id="${category.id}">
                        <i class="fas fa-chevron-down text-xs mr-1 text-gray-500"></i>
                        <span class="text-xs font-semibold uppercase text-gray-400">${escapeHTML(category.name)}</span>
                    </div>
                    <div class="category-channels ml-2" data-category-id="${category.id}">`;
                
                category.channels.forEach(channel => {
                    html += renderChannelHTML(channel, activeChannelId);
                });
                
                html += `
                    </div>
                </div>`;
            });
            
            if (channels.length === 0) {
                html = '<div class="p-4 text-gray-400 text-center text-sm">No channels available</div>';
            }
            
            channelList.innerHTML = html;
            
            if (window.channelSectionSkeleton && window.channelSectionSkeleton.hide) {
                window.channelSectionSkeleton.hide();
            }
            
            initChannelEventListeners();
        })
        .fail(function(xhr, status, error) {
            console.error('Error refreshing channel list:', error);
            showToast('Failed to refresh channel list', 'error');
            
            if (window.channelSectionSkeleton && window.channelSectionSkeleton.hide) {
                window.channelSectionSkeleton.hide();
            }
        });
}

function renderChannelHTML(channel, activeChannelId) {
    const isActive = channel.id == activeChannelId;
    const isVoice = channel.type === 'voice';
    const iconClass = isVoice ? 'fa-volume-high' : 'fa-hashtag';
    const activeClass = isActive ? 'active bg-[#5865f2] text-white' : 'text-gray-400';
    const iconColorClass = isActive ? 'text-white' : 'text-gray-500';
    
    return `
    <div class="channel-item flex items-center px-2 py-1 mb-1 rounded cursor-pointer ${activeClass}" 
         data-channel-id="${channel.id}" 
         data-channel-type="${channel.type}" 
         data-channel-name="${escapeHTML(channel.name)}"
         ${isActive ? 'data-active="true"' : ''}>
        <div class="flex-1 flex items-center overflow-hidden">
            <i class="fas ${iconClass} ${iconColorClass} mr-1.5 w-4 text-center"></i>
            <span class="channel-name text-sm truncate">${escapeHTML(channel.name)}</span>
        </div>
        ${isVoice ? `
        <div class="voice-user-count text-xs text-gray-500 flex items-center">
            <span class="count">0</span>
        </div>` : ''}
    </div>`;
}

function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
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
        removeChannelFromUI,
        refreshChannelList
    };
    
    window.refreshChannelList = refreshChannelList;
}

export { initChannelManager };