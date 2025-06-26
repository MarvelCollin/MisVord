class ChannelAPI {
    constructor() {
        this.baseURL = '/api';
        this.cache = new Map();
        this.cacheTimeout = 30000;
    }

    async makeRequest(url, options = {}) {
        try {
            const defaultOptions = {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            };

            const mergedOptions = {
                ...defaultOptions,
                ...options,
                headers: {
                    ...defaultOptions.headers,
                    ...options.headers
                }
            };

            if (options.body instanceof FormData) {
                delete mergedOptions.headers['Content-Type'];
            }

            const response = await fetch(url, mergedOptions);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'API request failed');
            }

            return data.data || data;
        } catch (error) {
            console.error('Channel API request failed:', error);
            throw error;
        }
    }

    getCacheKey(serverId, channelId, type) {
        return `${serverId}-${channelId}-${type}`;
    }

    getCachedData(serverId, channelId, type) {
        const key = this.getCacheKey(serverId, channelId, type);
        const cached = this.cache.get(key);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        
        return null;
    }

    setCachedData(serverId, channelId, type, data) {
        const key = this.getCacheKey(serverId, channelId, type);
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    clearCache() {
        this.cache.clear();
    }

    async getChannelData(serverId, channelId, type = 'text') {
        if (!serverId || !channelId) {
            throw new Error('Server ID and Channel ID are required');
        }
        
        const cached = this.getCachedData(serverId, channelId, type);
        if (cached) {
            console.log('Using cached channel data');
            return cached;
        }
        
        const url = `${this.baseURL}/channel-content?server_id=${encodeURIComponent(serverId)}&channel_id=${encodeURIComponent(channelId)}&type=${encodeURIComponent(type)}`;
        
        const data = await this.makeRequest(url, { method: 'GET' });
        
        this.setCachedData(serverId, channelId, type, data);
        
        return data;
    }

    async createChannel(channelData) {
        return await this.makeRequest(`${this.baseURL}/channels`, {
            method: 'POST',
            body: JSON.stringify(channelData)
        });
    }

    async updateChannel(channelId, channelData) {
        return await this.makeRequest(`${this.baseURL}/channels/${channelId}`, {
            method: 'PUT',
            body: JSON.stringify(channelData)
        });
    }

    async deleteChannel(channelId) {
        return await this.makeRequest(`${this.baseURL}/channels/${channelId}`, {
            method: 'DELETE'
        });
    }

    async getChannelParticipants(channelId) {
        return await this.makeRequest(`${this.baseURL}/channels/${channelId}/participants`, {
            method: 'GET'
        });
    }

    async updateChannelPosition(positionData) {
        return await this.makeRequest(`${this.baseURL}/channels/position`, {
            method: 'POST',
            body: JSON.stringify(positionData)
        });
    }

    async createCategory(categoryData) {
        return await this.makeRequest(`${this.baseURL}/categories`, {
            method: 'POST',
            body: JSON.stringify(categoryData)
        });
    }

    invalidateCache(serverId, channelId = null, type = null) {
        if (channelId && type) {
            const key = this.getCacheKey(serverId, channelId, type);
            this.cache.delete(key);
        } else {
            for (let key of this.cache.keys()) {
                if (key.startsWith(`${serverId}-`)) {
                    this.cache.delete(key);
                }
            }
        }
    }
}

class ChannelRenderer {
    constructor(channelAPI) {
        this.api = channelAPI;
        this.currentChannelId = null;
        this.currentServerId = null;
        this.isLoading = false;
    }

    showSkeleton(type) {
        const mainContent = document.querySelector('.main-content-area');
        if (!mainContent) return;

        const skeletonHTML = type === 'voice' ? this.getVoiceSkeletonHTML() : this.getChatSkeletonHTML();
        mainContent.innerHTML = skeletonHTML;
    }

    getVoiceSkeletonHTML() {
        return `
            <div class="flex flex-col h-screen bg-[#313338] text-white">
                <div class="h-12 border-b border-[#1e1f22] flex items-center px-4 bg-[#313338]">
                    <div class="flex items-center">
                        <div class="w-4 h-4 bg-gray-700 rounded mr-2 animate-pulse"></div>
                        <div class="h-4 bg-gray-700 rounded w-32 animate-pulse"></div>
                    </div>
                </div>
                <div class="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-[#1e1f3a] via-[#2b2272] to-[#1e203a]">
                    <div class="h-8 bg-gray-700 rounded w-48 mb-2 animate-pulse"></div>
                    <div class="h-6 bg-gray-700 rounded w-64 mb-6 animate-pulse"></div>
                    <div class="h-10 bg-gray-700 rounded w-32 animate-pulse"></div>
                </div>
            </div>
        `;
    }

    getChatSkeletonHTML() {
        return `
            <div class="flex flex-col flex-1 h-screen bg-[#313338]">
                <div class="h-12 border-b border-[#1e1f22] flex items-center px-4 bg-[#313338]">
                    <div class="flex items-center">
                        <div class="w-4 h-4 bg-gray-700 rounded mr-2 animate-pulse"></div>
                        <div class="h-5 bg-gray-700 rounded w-40 animate-pulse"></div>
                    </div>
                </div>
                <div class="flex-1 overflow-y-auto bg-[#313338] p-4">
                    ${Array(5).fill(0).map(() => `
                        <div class="flex items-start mb-4">
                            <div class="w-10 h-10 bg-gray-700 rounded-full mr-3 animate-pulse"></div>
                            <div class="flex-1">
                                <div class="h-4 bg-gray-700 rounded w-32 mb-2 animate-pulse"></div>
                                <div class="h-4 bg-gray-700 rounded w-full animate-pulse"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="px-4 pb-6 bg-[#313338]">
                    <div class="h-12 bg-gray-700 rounded animate-pulse"></div>
                </div>
            </div>
        `;
    }

    async switchToChannel(serverId, channelId, channelType) {
        if (this.isLoading) {
            console.log('Channel switch already in progress');
            return;
        }

        this.isLoading = true;
        this.currentServerId = serverId;
        this.currentChannelId = channelId;

        try {
            this.showSkeleton(channelType);
            
            this.updateMetaTags(channelId, channelType);
            this.updateURL(serverId, channelId, channelType);
            
            const channelData = await this.api.getChannelData(serverId, channelId, channelType);
            
            this.renderChannelContent(channelData, channelType);
            
            this.dispatchChannelSwitchEvent(channelData);
            
        } catch (error) {
            console.error('Failed to switch channel:', error);
            this.showError(error.message);
        } finally {
            this.isLoading = false;
        }
    }

    renderChannelContent(data, type) {
        const mainContent = document.querySelector('.main-content-area');
        if (!mainContent) return;

        if (type === 'voice') {
            this.renderVoiceChannel(data, mainContent);
        } else {
            this.renderChatChannel(data, mainContent);
        }
    }

    renderVoiceChannel(data, container) {
        const { channel, meeting_id, username } = data;
        
        container.innerHTML = `
            <div class="flex flex-col h-screen bg-[#313338] text-white" id="voice-container">
                <div class="h-12 border-b border-[#1e1f22] flex items-center px-4 bg-[#313338]">
                    <div class="flex items-center">
                        <i class="fas fa-volume-high text-gray-400 mr-2"></i>
                        <span class="font-medium text-white">${channel.name}</span>
                    </div>
                </div>
                <div class="flex-1 flex">
                    <div class="flex-1 flex flex-col">
                        <div id="joinView" class="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-[#1e1f3a] via-[#2b2272] to-[#1e203a]">
                            <h2 class="text-2xl font-bold text-white mb-2">${channel.name}</h2>
                            <p class="text-gray-300 text-base mb-6">No one is currently in voice</p>
                            <button id="joinBtn" class="bg-[#5865F2] hover:bg-[#4752c4] text-white font-medium py-2 px-6 rounded transition-colors">
                                Join Voice
                            </button>
                        </div>
                        <div id="connectingView" class="flex-1 flex flex-col items-center justify-center bg-[#2b2d31] hidden">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5865F2] mb-4"></div>
                            <p class="text-white text-lg">Connecting to voice...</p>
                        </div>
                        <div id="connectedView" class="flex-1 flex flex-col bg-[#2b2d31] hidden">
                            <div class="flex-1 flex flex-col justify-center items-center">
                                <div id="participants" class="w-full max-w-xl"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.initializeVoiceControls(channel, meeting_id, username);
    }

    renderChatChannel(data, container) {
        const { channel, messages = [] } = data;
        
        container.innerHTML = `
            <div class="flex flex-col flex-1 h-screen bg-[#313338]">
                <div class="h-12 border-b border-[#1e1f22] flex items-center px-4 bg-[#313338]">
                    <div class="flex items-center">
                        <i class="fas fa-hashtag text-[#b5bac1] mr-2"></i>
                        <h2 class="font-semibold text-white">${channel.name}</h2>
                    </div>
                </div>
                <div class="flex-1 overflow-y-auto bg-[#313338]" id="chat-messages">
                    ${this.renderMessages(messages)}
                </div>
                <div class="px-4 pb-6 bg-[#313338]">
                    <div class="bg-[#383a40] rounded-lg overflow-hidden">
                        <div class="flex items-center px-4 py-2">
                            <div class="flex-1 relative mx-3">
                                <textarea 
                                    id="message-input" 
                                    class="w-full bg-transparent text-[#dcddde] placeholder-[#95999e] resize-none border-none outline-none text-base"
                                    placeholder="Message #${channel.name}"
                                    rows="1"></textarea>
                            </div>
                            <button id="send-button" class="text-[#b5bac1] hover:text-white">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.initializeChatControls(channel);
    }

    renderMessages(messages) {
        if (!messages || messages.length === 0) {
            return '<div class="flex items-center justify-center h-full text-gray-400">No messages yet</div>';
        }

        return messages.map(message => `
            <div class="flex items-start p-4 hover:bg-[#36393f]">
                <div class="w-10 h-10 bg-[#5865f2] rounded-full flex items-center justify-center mr-3">
                    <span class="text-white text-sm font-bold">${(message.username || 'U').charAt(0).toUpperCase()}</span>
                </div>
                <div class="flex-1">
                    <div class="flex items-center mb-1">
                        <span class="font-semibold text-white mr-2">${message.username || 'Unknown'}</span>
                        <span class="text-xs text-gray-400">${this.formatTimestamp(message.created_at)}</span>
                    </div>
                    <div class="text-[#dcddde]">${message.content}</div>
                </div>
            </div>
        `).join('');
    }

    formatTimestamp(timestamp) {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    initializeVoiceControls(channel, meetingId, username) {
        const joinBtn = document.getElementById('joinBtn');
        if (joinBtn) {
            joinBtn.addEventListener('click', () => {
                console.log('Joining voice channel:', channel.name);
            });
        }
    }

    initializeChatControls(channel) {
        const sendButton = document.getElementById('send-button');
        const messageInput = document.getElementById('message-input');
        
        if (sendButton && messageInput) {
            sendButton.addEventListener('click', () => {
                const content = messageInput.value.trim();
                if (content) {
                    console.log('Sending message:', content);
                    messageInput.value = '';
                }
            });
        }
    }

    updateMetaTags(channelId, channelType) {
        const updateOrCreateMeta = (name, content) => {
            let meta = document.querySelector(`meta[name="${name}"]`);
            if (meta) {
                meta.setAttribute('content', content);
            } else {
                meta = document.createElement('meta');
                meta.setAttribute('name', name);
                meta.setAttribute('content', content);
                document.head.appendChild(meta);
            }
        };

        updateOrCreateMeta('channel-id', channelId);
        if (channelType === 'text') {
            updateOrCreateMeta('chat-id', channelId);
        }
    }

    updateURL(serverId, channelId, channelType) {
        const newUrl = `/server/${serverId}?channel=${channelId}&type=${channelType}`;
        history.pushState({ channelId, channelType, serverId }, '', newUrl);
    }

    dispatchChannelSwitchEvent(channelData) {
        document.dispatchEvent(new CustomEvent('channelSwitched', {
            detail: channelData
        }));
    }

    showError(message) {
        const mainContent = document.querySelector('.main-content-area');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="flex items-center justify-center h-full text-red-400">
                    <div class="text-center">
                        <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                        <div class="text-lg font-semibold mb-2">Error</div>
                        <div>${message}</div>
                    </div>
                </div>
            `;
        }
    }
}

const channelAPI = new ChannelAPI();
const channelRenderer = new ChannelRenderer(channelAPI);

window.channelAPI = channelAPI;
window.channelRenderer = channelRenderer;

// ES6 exports
export { ChannelAPI, ChannelRenderer };
export default channelAPI;
