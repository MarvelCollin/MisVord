class ChannelSwitchManager {
    constructor() {
        this.isLoading = false;
        this.currentChannelId = null;
        this.currentServerId = null;
        this.currentChannelType = null;
        this.switchQueue = [];
        this.init();
    }

    init() {
        this.currentServerId = this.getServerIdFromURL();
        this.currentChannelId = this.getChannelIdFromURL();
        this.currentChannelType = this.getChannelTypeFromURL();
        window.channelSwitchManager = this;
        this.attachEventListeners();
        console.log('🔄 Channel Switch Manager initialized:', {
            serverId: this.currentServerId,
            channelId: this.currentChannelId,
            channelType: this.currentChannelType
        });
    }

    attachEventListeners() {
        document.addEventListener('click', (e) => {
            const channelItem = e.target.closest('.channel-item');
            if (channelItem) {
                console.log('🎯 Channel item clicked:', channelItem.dataset);
                const serverId = channelItem.dataset.serverId;
                const channelId = channelItem.dataset.channelId;
                const channelType = channelItem.dataset.channelType || 'text';
                
                if (serverId && channelId) {
                    this.switchToChannel(serverId, channelId, channelItem);
                } else {
                    console.error('❌ Missing data attributes:', { serverId, channelId });
                }
            }
        });
    }

    getServerIdFromURL() {
        const match = window.location.pathname.match(/\/server\/(\\d+)/);
        return match ? match[1] : null;
    }

    getChannelIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('channel');
    }

    getChannelTypeFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('type') || 'text';
    }

    async switchToChannel(serverId, channelId, clickedElement) {
        console.log('🔄 Attempting to switch channel:', {
            serverId,
            channelId,
            currentChannelId: this.currentChannelId,
            isLoading: this.isLoading
        });

        if (this.isLoading) {
            console.log('⏳ Channel switch in progress, queueing request');
            this.switchQueue.push({ serverId, channelId, clickedElement });
            return;
        }

        try {
            this.isLoading = true;
            clickedElement.classList.add('switching');
            
            const channelType = clickedElement?.dataset?.channelType || 'text';
            console.log('📡 Channel type:', channelType);

            await this.updateSections(channelType);
            console.log('✅ Sections updated');

            const response = await this.loadChannelContent(serverId, channelId, channelType);
            console.log('📥 Channel content loaded:', response);

            this.currentChannelId = channelId;
            this.currentServerId = serverId;
            this.currentChannelType = channelType;

            this.updateURL(serverId, channelId, channelType);
            this.updateActiveStates(clickedElement);

            if (window.socketManager) {
                console.log('🔌 Joining channel room:', channelId);
                window.socketManager.joinChannelRoom(channelId);
            }

        } catch (error) {
            console.error('❌ Channel switch failed:', error);
        } finally {
            this.isLoading = false;
            clickedElement.classList.remove('switching');
            if (this.switchQueue.length > 0) {
                console.log('📋 Processing next queued switch');
                const next = this.switchQueue.shift();
                this.switchToChannel(next.serverId, next.channelId, next.clickedElement);
            }
        }
    }

    async loadChannelContent(serverId, channelId, channelType) {
        console.log('📡 Loading channel content:', {
            serverId,
            channelId,
            channelType
        });

        try {
            const response = await ajax({
                url: `/api/channels/content?server_id=${serverId}&channel_id=${channelId}&type=${channelType}&render_html=true`,
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            console.log('📥 Channel content response:', response);

            if (response.success && response.data.html) {
                if (channelType === 'voice') {
                    const voiceSection = document.querySelector('.voice-section');
                    if (voiceSection) {
                        voiceSection.innerHTML = response.data.html;
                        console.log('🎤 Voice section updated');
                    }
                } else {
                    const chatSection = document.querySelector('.chat-section');
                    if (chatSection) {
                        chatSection.innerHTML = response.data.html;
                        console.log('💬 Chat section updated');
                    }
                }
            }

            return response;
        } catch (error) {
            console.error('❌ Failed to load channel content:', error);
            throw error;
        }
    }

    updateSections(channelType) {
        console.log('🔄 Updating sections for type:', channelType);
        const chatSection = document.querySelector('.chat-section');
        const voiceSection = document.querySelector('.voice-section');

        if (channelType === 'voice') {
            if (chatSection) chatSection.classList.add('hidden');
            if (voiceSection) voiceSection.classList.remove('hidden');
            if (window.chatSection) {
                window.chatSection = null;
            }
        } else {
            if (voiceSection) voiceSection.classList.add('hidden');
            if (chatSection) chatSection.classList.remove('hidden');
            if (window.voiceManager && window.voiceManager.isConnected) {
                window.voiceManager.leaveVoice();
            }
            if (window.voiceManager) {
                window.voiceManager = null;
            }
        }
    }

    updateURL(serverId, channelId, channelType) {
        const newURL = `/server/${serverId}?channel=${channelId}${channelType === 'voice' ? '&type=voice' : ''}`;
        window.history.pushState({ path: newURL }, '', newURL);
        console.log('🔗 URL updated:', newURL);
    }

    updateActiveStates(clickedElement) {
        if (!clickedElement) return;

        const allChannels = document.querySelectorAll('.channel-item');
        allChannels.forEach(channel => {
            channel.classList.remove('active', 'bg-discord-500');
            channel.classList.add('hover:bg-discord-500');
        });

        clickedElement.classList.add('active', 'bg-discord-500');
        clickedElement.classList.remove('hover:bg-discord-500');
        console.log('✨ Active states updated');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('/server/')) {
        new ChannelSwitchManager();
    }
});

export default ChannelSwitchManager; 