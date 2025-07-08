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
            }
        });
        
        socket.on('voice-meeting-status', (data) => {
            if (data.has_meeting && data.channel_id) {
                this.updateChannelCount(data.channel_id, data.participant_count || 0);
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
    
    updateSidebar() {
        if (!window.voiceManager || !window.voiceManager.currentChannelId) return;
        
        const channelId = window.voiceManager.currentChannelId;
        const container = document.querySelector(`.voice-participants[data-channel-id="${channelId}"]`);
        if (!container) return;
        
        container.innerHTML = '';
        
        const participants = window.voiceManager.participants;
        participants.forEach((data, id) => {
            const element = this.createParticipantElement(data);
            container.appendChild(element);
        });
        
        this.updateChannelCount(channelId, participants.size);
        
        if (participants.size > 0) {
            container.classList.remove('hidden');
        }
    }
    
    createParticipantElement(participant) {
        const div = document.createElement('div');
        div.className = 'flex items-center py-1 px-2 text-gray-300 hover:text-white transition-colors duration-200';
        div.setAttribute('data-user-id', participant.id);
        
        const avatarUrl = participant.avatar_url || '/public/assets/common/default-profile-picture.png';
        const displayName = participant.name || 'Unknown';
        
        div.innerHTML = `
            <div class="relative mr-2">
                <img src="${avatarUrl}" 
                     alt="${displayName}" 
                     class="w-5 h-5 rounded-full bg-gray-600 object-cover"
                     onerror="this.src='/public/assets/common/default-profile-picture.png'">
                <div class="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-discord-green rounded-full border border-discord-dark"></div>
            </div>
            <span class="text-sm truncate">${displayName}</span>
        `;
        
        return div;
    }
    
    updateChannelCount(channelId, count) {
        const channelItem = document.querySelector(`[data-channel-id="${channelId}"]`);
        if (!channelItem) return;
        
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
    
    loadInitialState() {
        document.querySelectorAll('[data-channel-type="voice"]').forEach(channel => {
            const channelId = channel.getAttribute('data-channel-id');
            if (channelId && window.globalSocketManager?.io) {
                window.globalSocketManager.io.emit('check-voice-meeting', { channel_id: channelId });
            }
        });
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