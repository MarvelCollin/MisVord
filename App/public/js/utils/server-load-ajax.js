class ServerAjaxLoader {
    constructor() {
        this.currentServerId = null;
        this.isLoading = false;
        this.debounceTimer = null;
        this.debugPanel = null;
        this.init();
    }

    init() {
        this.bindServerSidebarClicks();
        this.currentServerId = this.getCurrentServerIdFromURL();
        window.serverAjaxLoader = this;
        this.createDebugPanel();

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.serverId) {
                this.switchToServer(e.state.serverId);
            }
        });
    }

    createDebugPanel() {
        this.debugPanel = document.createElement('div');
        this.debugPanel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 400px;
            max-height: 80vh;
            background: rgba(47, 49, 54, 0.95);
            border: 1px solid #5865f2;
            border-radius: 8px;
            padding: 12px;
            color: #dcddde;
            font-family: monospace;
            font-size: 12px;
            z-index: 9999;
            overflow-y: auto;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            display: none;
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            padding-bottom: 8px;
            border-bottom: 1px solid #40444b;
        `;
        header.innerHTML = `
            <div style="font-weight: bold; color: #fff;">🔍 Debug Panel</div>
            <div>
                <button id="debug-refresh" style="margin-right: 8px; padding: 4px 8px; background: #5865f2; border: none; border-radius: 4px; color: white; cursor: pointer;">
                    Refresh
                </button>
                <button id="debug-toggle" style="padding: 4px 8px; background: #ed4245; border: none; border-radius: 4px; color: white; cursor: pointer;">
                    Close
                </button>
            </div>
        `;

        const content = document.createElement('div');
        content.id = 'debug-content';
        content.style.cssText = `
            white-space: pre-wrap;
            word-break: break-word;
        `;

        this.debugPanel.appendChild(header);
        this.debugPanel.appendChild(content);
        document.body.appendChild(this.debugPanel);

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                this.toggleDebugPanel();
            }
        });

        document.getElementById('debug-toggle').addEventListener('click', () => {
            this.toggleDebugPanel();
        });

        document.getElementById('debug-refresh').addEventListener('click', () => {
            this.updateDebugInfo();
        });
    }

    toggleDebugPanel() {
        if (this.debugPanel) {
            const isVisible = this.debugPanel.style.display !== 'none';
            this.debugPanel.style.display = isVisible ? 'none' : 'block';
            if (!isVisible) {
                this.updateDebugInfo();
            }
        }
    }

    async updateDebugInfo() {
        if (!this.debugPanel || this.debugPanel.style.display === 'none') return;

        const content = document.getElementById('debug-content');
        if (!content) return;

        const serverId = this.currentServerId;
        const channelId = new URLSearchParams(window.location.search).get('channel');

        try {
            content.innerHTML = '<div style="color: #5865f2;">Loading data...</div>';

            const channelsResponse = await window.serverAPI.getServerChannels(serverId);
            const channelData = channelsResponse.data || {};

            let messages = [];
            if (channelId && window.chatSection) {
                const messageElements = document.querySelectorAll('.message-content');
                messages = Array.from(messageElements).map(el => ({
                    id: el.dataset.messageId,
                    content: el.querySelector('.message-main-text')?.textContent || '',
                    username: el.closest('.message-group')?.querySelector('.message-username')?.textContent || '',
                    timestamp: el.querySelector('.message-timestamp')?.textContent || ''
                }));
            }

            const debugInfo = {
                server_id: serverId,
                current_channel: channelId,
                channels: {
                    uncategorized: channelData.uncategorizedChannels || [],
                    categories: channelData.categories || []
                },
                current_messages: messages
            };

            content.innerHTML = `
                <div style="color: #5865f2; margin-bottom: 8px;">Server ID: ${serverId}</div>
                <div style="color: #5865f2; margin-bottom: 8px;">Current Channel: ${channelId}</div>
                <div style="margin-bottom: 12px;">
                    <div style="color: #5865f2; margin-bottom: 4px;">Channels:</div>
                    <pre style="color: #dcddde;">${JSON.stringify(debugInfo.channels, null, 2)}</pre>
                </div>
                <div>
                    <div style="color: #5865f2; margin-bottom: 4px;">Current Messages:</div>
                    <pre style="color: #dcddde;">${JSON.stringify(debugInfo.current_messages, null, 2)}</pre>
                </div>
            `;

        } catch (error) {
            content.innerHTML = `
                <div style="color: #ed4245;">Error loading debug info:</div>
                <pre style="color: #ed4245;">${error.message}</pre>
            `;
        }
    }

    getCurrentServerIdFromURL() {
        const match = window.location.pathname.match(/\/server\/(\d+)/);
        return match ? match[1] : null;
    }

    bindServerSidebarClicks() {
        document.addEventListener('click', (e) => {
            const serverLink = e.target.closest('a[data-server-id]');
            if (!serverLink) return;

            const serverId = serverLink.dataset.serverId;
            if (!serverId || serverId === this.currentServerId) return;

            e.preventDefault();
            e.stopPropagation();

            this.debounceServerSwitch(serverId);
        }, true);
    }

    debounceServerSwitch(serverId) {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(() => {
            this.switchToServer(serverId);
        }, 200);
    }

    async switchToServer(serverId) {
        if (this.isLoading) return;

        try {
            this.isLoading = true;
            this.currentServerId = serverId;
            this.showLoadingState();

            const response = await window.serverAPI.getServerBundle(serverId);
            
            if (!response.success) {
                throw new Error(response.message || 'Failed to load server');
            }

            await this.renderServerContent(response.data);
            this.updateURL(serverId, response.data.default_channel_id);

            document.querySelectorAll('a[data-server-id]').forEach(link => {
                const icon = link.closest('.server-icon');
                if (icon) {
                    icon.classList.toggle('active', link.dataset.serverId === serverId);
                }
            });

        } catch (error) {
            console.error('Server switch error:', error);
            this.showErrorToast('Failed to switch server: ' + error.message);
            this.currentServerId = null;
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    showLoadingState() {
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            chatMessages.innerHTML = `
                <div class="flex items-center justify-center h-full">
                    <div class="text-center">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        <p class="text-gray-400">Loading server...</p>
                    </div>
                </div>
            `;
        }

        const channelWrapper = document.querySelector('.channel-wrapper');
        if (channelWrapper) {
            const skeleton = channelWrapper.querySelector('.channel-skeleton');
            if (skeleton) {
                skeleton.classList.remove('hidden');
            }
            const channelList = channelWrapper.querySelector('.channel-list');
            if (channelList) {
                channelList.classList.add('hidden');
            }
        }

        document.querySelectorAll('a[data-server-id]').forEach(link => {
            const icon = link.closest('.server-icon');
            if (icon) {
                icon.classList.remove('active');
                if (link.dataset.serverId === this.currentServerId) {
                    icon.classList.add('active');
                }
            }
        });
    }

    hideLoadingState() {
        const channelWrapper = document.querySelector('.channel-wrapper');
        if (channelWrapper) {
            const skeleton = channelWrapper.querySelector('.channel-skeleton');
            if (skeleton) {
                skeleton.classList.add('hidden');
            }
            const channelList = channelWrapper.querySelector('.channel-list');
            if (channelList) {
                channelList.classList.remove('hidden');
            }
        }
    }

    async renderServerContent(data) {
        try {
            this.updateServerHeader(data.server);

            const channelWrapper = document.querySelector('.channel-wrapper');
            if (channelWrapper) {
                const skeleton = channelWrapper.querySelector('.channel-skeleton');
                const channelList = channelWrapper.querySelector('.channel-list');
                
                if (skeleton) skeleton.classList.remove('hidden');
                if (channelList) channelList.classList.add('hidden');
            }

            const chatMessages = document.getElementById('chat-messages');
            if (chatMessages) {
                chatMessages.innerHTML = `
                    <div class="flex items-center justify-center h-full">
                        <div class="text-center">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                            <p class="text-gray-400">Loading messages...</p>
                        </div>
                    </div>
                `;
            }

            document.body.removeAttribute('data-initial-load');
            await window.refreshChannelList();

            if (data.default_channel_id) {
                if (window.chatSection && typeof window.chatSection.joinNewChannel === 'function') {
                    await window.chatSection.joinNewChannel(data.default_channel_id);
                } else if (window.chatSection && typeof window.chatSection.loadMessages === 'function') {
                    await window.chatSection.loadMessages();
                }
            }

            if (channelWrapper) {
                const skeleton = channelWrapper.querySelector('.channel-skeleton');
                const channelList = channelWrapper.querySelector('.channel-list');
                
                if (skeleton) skeleton.classList.add('hidden');
                if (channelList) channelList.classList.remove('hidden');
            }

            if (window.globalSocketManager && window.globalSocketManager.io) {
                window.globalSocketManager.io.emit('leave_server', { 
                    server_id: this.currentServerId 
                });
                
                window.globalSocketManager.io.emit('join_server', { 
                    server_id: data.server.id 
                });
            }

            if (window.getCurrentServerId) {
                window.getCurrentServerId = () => data.server.id;
            }
            
            if (typeof initServerDropdown === 'function') {
                setTimeout(initServerDropdown, 100);
            }

            setTimeout(() => this.updateDebugInfo(), 500);

        } catch (error) {
            console.error('Error rendering server content:', error);
            this.showErrorToast('Failed to load server content: ' + error.message);
            throw error;
        }
    }

    updateServerHeader(server) {
        const serverNameElements = document.querySelectorAll('[data-server-name], .server-name');
        serverNameElements.forEach(el => {
            el.textContent = server.name;
        });

        const serverDescriptionElements = document.querySelectorAll('[data-server-description]');
        serverDescriptionElements.forEach(el => {
            el.textContent = server.description || '';
        });

        document.title = `${server.name} - Discord Clone`;
    }

    updateURL(serverId, channelId) {
        const newURL = `/server/${serverId}?channel=${channelId}`;
        window.history.pushState({ serverId }, '', newURL);
    }

    showErrorToast(message) {
        if (window.showToast) {
            window.showToast(message, 'error');
        } else {
            console.error(message);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('[ServerAjaxLoader] DOM ready');
    if (window.location.pathname.includes('/server/')) {
        console.log('[ServerAjaxLoader] init');
        new ServerAjaxLoader();
    }
});

export default ServerAjaxLoader;
