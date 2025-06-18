import { showToast } from '../../core/ui/toast.js';
import { MisVordAjax } from '../../core/ajax/ajax-handler.js';

export class ChannelLoader {
    constructor() {
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('Channel loader initialized');
            this.setupChannelLoading();
        });
    }

    setupChannelLoading() {
        document.addEventListener('LazyLoad', (event) => {
            const { element, type } = event.detail;
            if (type === 'channel-list') {
                this.loadChannelData(element);
            }
        });

        const channelElements = document.querySelectorAll('[data-lazyload="channel-list"]');
        
        if (channelElements.length > 0) {
            console.log(`Found ${channelElements.length} channel elements to load`);
            channelElements.forEach(element => {
                const serverId = element.getAttribute('data-server-id');
                if (serverId) {
                    document.dispatchEvent(new CustomEvent('LazyLoadStart', { 
                        detail: { element } 
                    }));
                }
            });
        }
    }

    async loadChannelData(element) {
        try {
            const serverId = element.getAttribute('data-server-id');
            if (!serverId) {
                console.warn('No server ID found for channel loading');
                return;
            }

            console.log(`Loading channels for server ${serverId}`);
            
            const response = await MisVordAjax.get(`/api/servers/${serverId}/channels`);
            
            if (response && response.success) {
                this.renderChannels(element, response.data);
                
                document.dispatchEvent(new CustomEvent('LazyLoadComplete', { 
                    detail: { element } 
                }));
                
                console.log(`Channels loaded for server ${serverId}`);
            } else {
                console.error('Failed to load channels:', response?.message || 'Unknown error');
                showToast('Failed to load channels', 'error');
            }
        } catch (error) {
            console.error('Error loading channels:', error);
            showToast('Error loading channels', 'error');
        }
    }

    renderChannels(container, data) {
        if (!data || !data.categories || data.categories.length === 0) {
            container.innerHTML = '<div class="text-gray-400 text-center p-4">No channels found</div>';
            return;
        }

        let html = '';
        
        data.categories.forEach(category => {
            html += this.renderCategory(category);
        });
        
        container.innerHTML = html;
        
        this.setupChannelEvents(container);
    }

    renderCategory(category) {
        let channels = '';
        
        if (category.channels && category.channels.length > 0) {
            category.channels.forEach(channel => {
                channels += this.renderChannel(channel);
            });
        }
        
        return `
            <div class="category mb-2" data-category-id="${category.id}">
                <div class="category-header flex items-center justify-between px-2 py-1 text-gray-400 hover:text-gray-200 cursor-pointer">
                    <div class="flex items-center">
                        <i class="fas fa-chevron-down text-xs mr-1"></i>
                        <span class="uppercase text-xs font-semibold">${category.name}</span>
                    </div>
                    <div>
                        <i class="fas fa-plus text-xs hover:text-white" data-action="add-channel" data-category-id="${category.id}"></i>
                    </div>
                </div>
                <div class="channels">
                    ${channels}
                </div>
            </div>
        `;
    }

    renderChannel(channel) {
        const icon = channel.type === 'text' ? 'fa-hashtag' : 'fa-volume-up';
        
        return `
            <div class="channel-item flex items-center px-2 py-1 rounded hover:bg-gray-700 cursor-pointer text-gray-400 hover:text-white" 
                data-channel-id="${channel.id}" 
                data-channel-type="${channel.type}">
                <i class="fas ${icon} text-sm mr-2"></i>
                <span>${channel.name}</span>
            </div>
        `;
    }

    setupChannelEvents(container) {
        const categories = container.querySelectorAll('.category-header');
        categories.forEach(header => {
            header.addEventListener('click', (e) => {
                if (!e.target.matches('[data-action]')) {
                    const category = header.parentElement;
                    const channels = category.querySelector('.channels');
                    const icon = header.querySelector('i.fa-chevron-down, i.fa-chevron-right');
                    
                    channels.classList.toggle('hidden');
                    
                    if (channels.classList.contains('hidden')) {
                        icon.classList.remove('fa-chevron-down');
                        icon.classList.add('fa-chevron-right');
                    } else {
                        icon.classList.remove('fa-chevron-right');
                        icon.classList.add('fa-chevron-down');
                    }
                }
            });
        });
        
        const channelItems = container.querySelectorAll('.channel-item');
        channelItems.forEach(item => {
            item.addEventListener('click', () => {
                const channelId = item.getAttribute('data-channel-id');
                const channelType = item.getAttribute('data-channel-type');
                
                console.log(`Channel clicked: ${channelId} (${channelType})`);
                
                document.dispatchEvent(new CustomEvent('ChannelSelected', {
                    detail: {
                        channelId,
                        channelType
                    }
                }));
            });
        });
    }
}

export const channelLoader = new ChannelLoader();

if (typeof window !== 'undefined') {
    window.ChannelLoader = ChannelLoader;
    window.channelLoader = channelLoader;
}
