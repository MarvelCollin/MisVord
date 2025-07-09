class ChannelVoiceParticipants {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadInitialState();
    }
    
    setupEventListeners() {
        window.addEventListener('participantJoined', (e) => this.updateSidebar());
        window.addEventListener('participantLeft', (e) => this.updateSidebar());
        window.addEventListener('voiceConnect', (e) => this.handleVoiceConnect(e));
        window.addEventListener('voiceDisconnect', () => this.handleVoiceDisconnect());
        
        window.addEventListener('bot-voice-participant-joined', (e) => this.handleBotJoined(e));
        window.addEventListener('bot-voice-participant-left', (e) => this.handleBotLeft(e));
        
        if (window.globalSocketManager?.io) {
            this.attachSocketEvents();
        } else {
            window.addEventListener('globalSocketReady', () => this.attachSocketEvents());
        }
    }
    
    attachSocketEvents() {
        const socket = window.globalSocketManager?.io;
        if (!socket) {
            console.warn('[ChannelVoiceParticipants] Socket not available');
            return;
        }
        
        socket.on('voice-meeting-update', (data) => {
            if (data.action === 'join' || data.action === 'leave') {
                this.updateSidebar();
                this.updateAllChannelCounts();
            }
        });
        
        socket.on('voice-meeting-status', (data) => {
            if (data.has_meeting && data.channel_id) {
                this.updateChannelCount(data.channel_id, data.participant_count || 0);
            }
        });
        
        socket.on('bot-voice-participant-joined', (data) => {
            if (data.participant && data.channelId) {
                this.updateChannelCount(data.channelId, null);
            }
        });
        
        socket.on('bot-voice-participant-left', (data) => {
            if (data.participant && data.channelId) {
                this.updateChannelCount(data.channelId, null);
            }
        });
    }
    
    handleVoiceConnect(event) {
        const { channelId } = event.detail;
        if (channelId) {
            const container = document.querySelector(`.voice-participants[data-channel-id="${channelId}"]`);
            if (container) {
                container.classList.remove('hidden');
                this.updateSidebar();
            }
        }
    }
    
    handleVoiceDisconnect() {
        document.querySelectorAll('.voice-participants').forEach(container => {
            container.classList.add('hidden');
            container.innerHTML = '';
        });
        
        document.querySelectorAll('.voice-user-count').forEach(count => {
            count.textContent = '0';
            count.classList.add('hidden');
        });
    }
    
    handleBotJoined(event) {
        const { participant } = event.detail;
        if (participant && participant.channelId) {
            this.updateChannelCount(participant.channelId, null);
            if (window.voiceManager && window.voiceManager.currentChannelId === participant.channelId) {
                this.updateSidebar();
            }
        }
    }
    
    handleBotLeft(event) {
        const { participant } = event.detail;
        if (participant && participant.channelId) {
            this.updateChannelCount(participant.channelId, null);
            if (window.voiceManager && window.voiceManager.currentChannelId === participant.channelId) {
                this.updateSidebar();
            }
        }
    }
    
    updateSidebar() {
        if (!window.voiceManager || !window.voiceManager.currentChannelId) return;
        
        const channelId = window.voiceManager.currentChannelId;
        const container = document.querySelector(`.voice-participants[data-channel-id="${channelId}"]`);
        if (!container) return;
        
        container.innerHTML = '';
        
        const allParticipants = window.voiceManager.getAllParticipants();
        allParticipants.forEach((data, id) => {
            const element = this.createParticipantElement(data);
            container.appendChild(element);
        });
        
        this.updateChannelCount(channelId, allParticipants.size);
        
        if (allParticipants.size > 0) {
            container.classList.remove('hidden');
        }
    }
    
    createParticipantElement(participant) {
        const div = document.createElement('div');
        div.className = 'flex items-center py-1 px-2 text-gray-300 hover:text-white transition-colors duration-200';
        div.setAttribute('data-user-id', participant.user_id || participant.id);
        
        const avatarUrl = participant.avatar_url || '/public/assets/common/default-profile-picture.png';
        const displayName = participant.name || participant.username || 'Unknown';
        const isBot = participant.isBot || false;
        
        div.innerHTML = `
            <div class="relative mr-2">
                <img src="${avatarUrl}" 
                     alt="${displayName}" 
                     class="w-5 h-5 rounded-full bg-gray-600 object-cover"
                     onerror="this.src='/public/assets/common/default-profile-picture.png'">
                <div class="absolute -bottom-0.5 -right-0.5 w-2 h-2 ${isBot ? 'bg-[#5865f2]' : 'bg-discord-green'} rounded-full border border-discord-dark"></div>
                ${isBot ? '<div class="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#5865f2] rounded-full flex items-center justify-center"><i class="fas fa-robot text-white" style="font-size: 6px;"></i></div>' : ''}
            </div>
            <span class="text-sm truncate">${displayName}${isBot ? ' (Bot)' : ''}</span>
        `;
        
        return div;
    }
    
    updateChannelCount(channelId, count) {
        const channelItem = document.querySelector(`[data-channel-id="${channelId}"]`);
        if (!channelItem) return;
        
        if (count === null) {
            count = this.calculateChannelParticipantCount(channelId);
        }
        
        const countEl = channelItem.querySelector('.voice-user-count');
        if (countEl) {
            countEl.textContent = count.toString();
            if (count > 0) {
                countEl.classList.remove('hidden');
            } else {
                countEl.classList.add('hidden');
            }
        }
    }
    
    calculateChannelParticipantCount(channelId) {
        let count = 0;
        
        if (window.voiceManager && window.voiceManager.currentChannelId === channelId) {
            count = window.voiceManager.getAllParticipants().size;
        }
        
        if (window.BotComponent && window.BotComponent.voiceBots) {
            window.BotComponent.voiceBots.forEach((botData, botId) => {
                if (botData.channel_id === channelId) {
                    if (!window.voiceManager || window.voiceManager.currentChannelId !== channelId) {
                        count++;
                    }
                }
            });
        }
        
        return count;
    }
    
    updateAllChannelCounts() {
        document.querySelectorAll('[data-channel-type="voice"]').forEach(channel => {
            const channelId = channel.getAttribute('data-channel-id');
            if (channelId) {
                this.updateChannelCount(channelId, null);
            }
        });
    }
    
    loadInitialState() {
        document.querySelectorAll('[data-channel-type="voice"]').forEach(channel => {
            const channelId = channel.getAttribute('data-channel-id');
            if (channelId && window.globalSocketManager?.io) {
                window.globalSocketManager.io.emit('check-voice-meeting', { channel_id: channelId });
            }
        });
        
        setTimeout(() => {
            this.loadExistingBotParticipants();
        }, 1000);
    }
    
    loadExistingBotParticipants() {
        if (window.BotComponent && window.BotComponent.voiceBots) {
            window.BotComponent.voiceBots.forEach((botData, botId) => {
                if (botData.channel_id) {
                    this.updateChannelCount(botData.channel_id, null);
                }
            });
        }
    }
    
    static getInstance() {
        if (!window._channelVoiceParticipants) {
            window._channelVoiceParticipants = new ChannelVoiceParticipants();
        }
        return window._channelVoiceParticipants;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    ChannelVoiceParticipants.getInstance();
});

window.ChannelVoiceParticipants = ChannelVoiceParticipants;