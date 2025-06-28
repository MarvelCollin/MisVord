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
            content.innerHTML = '<div style="color: #5865f2;">🔄 Loading comprehensive debug data...</div>';

            // 1. Basic Info
            const basicInfo = {
                server_id: serverId,
                current_channel: channelId,
                url: window.location.href,
                timestamp: new Date().toISOString(),
                user_agent: navigator.userAgent,
                page_title: document.title
            };

            // 2. Channel Data
            let channelData = {};
            let channelsResponse = null;
            try {
                channelsResponse = await window.serverAPI.getServerChannels(serverId);
                channelData = channelsResponse.data || {};
            } catch (error) {
                channelData = { error: error.message, stack: error.stack };
            }

            // 3. Messages API Test
            let messages = [];
            let apiResponse = null;
            let apiError = null;
            
            if (channelId) {
                try {
                    const messagesResponse = await fetch(`/api/chat/channel/${channelId}/messages`);
                    const responseText = await messagesResponse.text();
                    
                    try {
                        apiResponse = JSON.parse(responseText);
                        if (apiResponse.success && apiResponse.data && apiResponse.data.messages) {
                            messages = apiResponse.data.messages;
                        }
                    } catch (parseError) {
                        apiError = {
                            status: messagesResponse.status,
                            statusText: messagesResponse.statusText,
                            responseText: responseText.substring(0, 500),
                            parseError: parseError.message
                        };
                    }
                } catch (error) {
                    apiError = { fetchError: error.message, stack: error.stack };
                }
            }

            // 4. Enhanced DOM Analysis
            const channelItems = document.querySelectorAll('.channel-item');
            const activeChannels = document.querySelectorAll('.channel-item.active-channel');
            const channelDetails = Array.from(channelItems).map((item, index) => ({
                index: index,
                channel_id: item.dataset.channelId,
                channel_type: item.dataset.channelType,
                is_active: item.classList.contains('active-channel'),
                classes: Array.from(item.classList).join(' '),
                text_content: item.textContent?.trim(),
                parent_element: item.parentElement?.className
            }));

            const domAnalysis = {
                channel_items: channelItems.length,
                active_channels: activeChannels.length,
                chat_messages_element: !!document.getElementById('chat-messages'),
                channel_wrapper: !!document.querySelector('.channel-wrapper'),
                channel_list: !!document.querySelector('.channel-list'),
                duplicate_channel_ids: this.findDuplicateChannelIds(),
                channel_details: channelDetails,
                channel_container_server_id: document.querySelector('.channel-list')?.getAttribute('data-server-id'),
                meta_tags: {
                    chat_id: document.querySelector('meta[name="chat-id"]')?.content,
                    chat_type: document.querySelector('meta[name="chat-type"]')?.content,
                    server_id: document.querySelector('meta[name="server-id"]')?.content
                }
            };

            // 5. Enhanced JavaScript State
            const jsState = {
                chat_section: {
                    exists: !!window.chatSection,
                    target_id: window.chatSection?.targetId,
                    chat_type: window.chatSection?.chatType,
                    messages_loaded: window.chatSection?.messagesLoaded,
                    processed_message_ids: window.chatSection?.processedMessageIds?.size || 0
                },
                channel_switch_manager: {
                    exists: !!window.channelSwitchManager,
                    is_loading: window.channelSwitchManager?.isLoading,
                    current_channel_id: window.channelSwitchManager?.currentChannelId,
                    current_server_id: window.channelSwitchManager?.currentServerId
                },
                channel_switching: window.channelSwitching || false,
                global_socket: {
                    exists: !!window.globalSocketManager,
                    ready: window.globalSocketManager?.isReady?.() || false,
                    connected: window.globalSocketManager?.socket?.connected || false
                },
                available_functions: {
                    refreshChannelList: typeof window.refreshChannelList,
                    renderChannelList: typeof window.renderChannelList,
                    forceHighlightCurrentChannel: typeof window.forceHighlightCurrentChannel,
                    debugChannelState: typeof window.debugChannelState
                },
                errors: this.collectJavaScriptErrors()
            };

            // 6. Event Listeners Check
            const eventListeners = this.checkEventListeners();

            // 7. Network Requests Log
            const networkLog = this.getRecentNetworkActivity();

            // 8. Console Errors
            const consoleErrors = this.getConsoleErrors();

            // Store debug data globally for copying
            window.debugData = {
                basicInfo,
                domAnalysis,
                jsState,
                apiResponse,
                apiError,
                channelData,
                eventListeners,
                networkLog,
                consoleErrors,
                timestamp: new Date().toISOString()
            };

            content.innerHTML = `
                <div style="margin-bottom: 12px;">
                    <div style="color: #5865f2; font-weight: bold; margin-bottom: 4px;">📊 BASIC INFO</div>
                    <pre style="color: #dcddde; font-size: 10px; background: #2f3136; padding: 8px; border-radius: 4px;">${JSON.stringify(basicInfo, null, 2)}</pre>
                </div>

                <div style="margin-bottom: 12px;">
                    <div style="color: #5865f2; font-weight: bold; margin-bottom: 4px;">🏗️ DOM ANALYSIS (DETAILED)</div>
                    <pre style="color: #dcddde; font-size: 10px; background: #2f3136; padding: 8px; border-radius: 4px;">${JSON.stringify(domAnalysis, null, 2)}</pre>
                </div>

                <div style="margin-bottom: 12px;">
                    <div style="color: #5865f2; font-weight: bold; margin-bottom: 4px;">⚡ JAVASCRIPT STATE (ENHANCED)</div>
                    <pre style="color: #dcddde; font-size: 10px; background: #2f3136; padding: 8px; border-radius: 4px;">${JSON.stringify(jsState, null, 2)}</pre>
                </div>

                <div style="margin-bottom: 12px;">
                    <div style="color: #5865f2; font-weight: bold; margin-bottom: 4px;">📡 API RESPONSE</div>
                    ${apiError ? 
                        `<div style="color: #ed4245; margin-bottom: 4px;">❌ API ERROR:</div>
                         <pre style="color: #ed4245; font-size: 10px; background: #2f3136; padding: 8px; border-radius: 4px;">${JSON.stringify(apiError, null, 2)}</pre>` :
                        `<div style="color: #57f287; margin-bottom: 4px;">✅ API SUCCESS (${messages.length} messages)</div>
                         <pre style="color: #dcddde; font-size: 10px; background: #2f3136; padding: 8px; border-radius: 4px;">${JSON.stringify(apiResponse, null, 2)}</pre>`
                    }
                </div>

                <div style="margin-bottom: 12px;">
                    <div style="color: #5865f2; font-weight: bold; margin-bottom: 4px;">📋 CHANNELS DATA</div>
                    <pre style="color: #dcddde; font-size: 10px; background: #2f3136; padding: 8px; border-radius: 4px;">${JSON.stringify(channelData, null, 2)}</pre>
                </div>

                <div style="margin-bottom: 12px;">
                    <div style="color: #5865f2; font-weight: bold; margin-bottom: 4px;">🎯 EVENT LISTENERS</div>
                    <pre style="color: #dcddde; font-size: 10px; background: #2f3136; padding: 8px; border-radius: 4px;">${JSON.stringify(eventListeners, null, 2)}</pre>
                </div>

                <div style="margin-bottom: 12px;">
                    <div style="color: #5865f2; font-weight: bold; margin-bottom: 4px;">🌐 NETWORK LOG</div>
                    <pre style="color: #dcddde; font-size: 10px; background: #2f3136; padding: 8px; border-radius: 4px;">${JSON.stringify(networkLog, null, 2)}</pre>
                </div>

                <div style="margin-bottom: 12px;">
                    <div style="color: #5865f2; font-weight: bold; margin-bottom: 4px;">🚨 CONSOLE ERRORS</div>
                    <pre style="color: #ed4245; font-size: 10px; background: #2f3136; padding: 8px; border-radius: 4px;">${JSON.stringify(consoleErrors, null, 2)}</pre>
                </div>

                <div style="margin-top: 12px; padding: 8px; background: #5865f2; border-radius: 4px;">
                    <div style="color: white; font-weight: bold; margin-bottom: 8px;">📋 COPY DEBUG DATA</div>
                    <button onclick="copyDebugData()" style="padding: 8px 16px; background: #57f287; border: none; border-radius: 4px; color: black; cursor: pointer; font-weight: bold;">
                        📋 Copy All Debug Info
                    </button>
                    <div id="copy-status" style="margin-top: 8px; color: white; font-size: 12px;"></div>
                </div>
            `;

        } catch (error) {
            content.innerHTML = `
                <div style="color: #ed4245;">❌ Error loading debug info:</div>
                <pre style="color: #ed4245;">${error.message}</pre>
                <pre style="color: #ed4245; font-size: 10px;">${error.stack}</pre>
            `;
        }
    }

    findDuplicateChannelIds() {
        const channelElements = document.querySelectorAll('[data-channel-id]');
        const channelIds = Array.from(channelElements).map(el => el.dataset.channelId);
        const duplicates = channelIds.filter((id, index) => channelIds.indexOf(id) !== index);
        return [...new Set(duplicates)];
    }

    checkEventListeners() {
        const channelItems = document.querySelectorAll('.channel-item');
        let hasClickListeners = 0;
        
        channelItems.forEach(item => {
            // Check if element has click listeners (approximate)
            if (item.onclick || item.addEventListener) {
                hasClickListeners++;
            }
        });

        return {
            channel_items_total: channelItems.length,
            estimated_with_listeners: hasClickListeners,
            channel_switch_manager_setup: !!window.channelSwitchManager?.setupChannelClickHandlers
        };
    }

    getRecentNetworkActivity() {
        // Simple network activity tracking
        if (!window.debugNetworkLog) {
            window.debugNetworkLog = [];
        }

        // Intercept fetch if not already done
        if (!window.fetchIntercepted) {
            const originalFetch = window.fetch;
            window.fetch = function(...args) {
                const url = args[0];
                const timestamp = new Date().toISOString();
                
                if (window.debugNetworkLog) {
                    window.debugNetworkLog.push({
                        url: url,
                        timestamp: timestamp,
                        type: 'fetch'
                    });
                    
                    // Keep only last 10 requests
                    if (window.debugNetworkLog.length > 10) {
                        window.debugNetworkLog = window.debugNetworkLog.slice(-10);
                    }
                }
                
                return originalFetch.apply(this, args);
            };
            window.fetchIntercepted = true;
        }

        return window.debugNetworkLog || [];
    }

    collectJavaScriptErrors() {
        if (!window.debugErrors) {
            window.debugErrors = [];
            
            // Capture console errors
            const originalError = console.error;
            console.error = function(...args) {
                window.debugErrors.push({
                    type: 'console.error',
                    message: args.join(' '),
                    timestamp: new Date().toISOString(),
                    stack: new Error().stack
                });
                if (window.debugErrors.length > 20) {
                    window.debugErrors = window.debugErrors.slice(-20);
                }
                return originalError.apply(console, args);
            };

            // Capture unhandled errors
            window.addEventListener('error', (event) => {
                window.debugErrors.push({
                    type: 'unhandled_error',
                    message: event.message,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    timestamp: new Date().toISOString(),
                    stack: event.error?.stack
                });
                if (window.debugErrors.length > 20) {
                    window.debugErrors = window.debugErrors.slice(-20);
                }
            });

            // Capture unhandled promise rejections
            window.addEventListener('unhandledrejection', (event) => {
                window.debugErrors.push({
                    type: 'unhandled_promise_rejection',
                    message: event.reason?.message || event.reason,
                    timestamp: new Date().toISOString(),
                    stack: event.reason?.stack
                });
                if (window.debugErrors.length > 20) {
                    window.debugErrors = window.debugErrors.slice(-20);
                }
            });
        }

        return window.debugErrors || [];
    }

    getConsoleErrors() {
        return this.collectJavaScriptErrors();
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

            if (data.default_channel_id && window.channelSwitchManager) {
                await window.channelSwitchManager.switchToChannel(data.server.id, data.default_channel_id);
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

// Global copy function
window.copyDebugData = function() {
    if (!window.debugData) {
        const status = document.getElementById('copy-status');
        if (status) status.textContent = '❌ No debug data available';
        return;
    }

    const debugText = `
=== MISVORD DEBUG REPORT ===
Generated: ${new Date().toISOString()}
URL: ${window.location.href}

${JSON.stringify(window.debugData, null, 2)}

=== END DEBUG REPORT ===
    `.trim();

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(debugText).then(() => {
            const status = document.getElementById('copy-status');
            if (status) {
                status.textContent = '✅ Debug data copied to clipboard!';
                status.style.color = '#57f287';
                setTimeout(() => {
                    status.textContent = '';
                }, 3000);
            }
        }).catch(err => {
            console.error('Failed to copy to clipboard:', err);
            fallbackCopy(debugText);
        });
    } else {
        fallbackCopy(debugText);
    }
};

function fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        const status = document.getElementById('copy-status');
        if (status) {
            if (successful) {
                status.textContent = '✅ Debug data copied to clipboard!';
                status.style.color = '#57f287';
            } else {
                status.textContent = '❌ Failed to copy. Please copy manually from console.';
                status.style.color = '#ed4245';
                console.log('DEBUG DATA:', text);
            }
            setTimeout(() => {
                status.textContent = '';
            }, 3000);
        }
    } catch (err) {
        console.error('Fallback copy failed:', err);
        console.log('DEBUG DATA:', text);
        const status = document.getElementById('copy-status');
        if (status) {
            status.textContent = '❌ Copy failed. Check console for debug data.';
            status.style.color = '#ed4245';
        }
    }
    
    document.body.removeChild(textArea);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('[ServerAjaxLoader] DOM ready');
    if (window.location.pathname.includes('/server/')) {
        console.log('[ServerAjaxLoader] init');
        new ServerAjaxLoader();
    }
});

export default ServerAjaxLoader;
