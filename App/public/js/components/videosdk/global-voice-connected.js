class GlobalVoiceIndicator {
    constructor() {
        this.isConnected = false;
        this.channelName = '';
        this.meetingId = '';
        this.connectionTime = 0;
        this.initialized = false;
        this.indicator = null;
        
        this.init();
    }
    
    init() {
        if (this.initialized) return;
        
        this.loadConnectionState();
        this.createIndicator();
        this.setupEventListeners();
        
        this.initialized = true;
        
        if (this.isConnected) {
            this.showIndicator();
            this.startTimer();
        }
    }
    
    loadConnectionState() {
        const savedState = localStorage.getItem('voiceConnectionState');
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                this.isConnected = state.isConnected || false;
                this.channelName = state.channelName || '';
                this.meetingId = state.meetingId || '';
                this.connectionTime = state.connectionTime || 0;
            } catch (e) {
                console.error('Failed to parse voice connection state', e);
                this.resetState();
            }
        }
    }
    
    saveConnectionState() {
        const state = {
            isConnected: this.isConnected,
            channelName: this.channelName,
            meetingId: this.meetingId,
            connectionTime: this.connectionTime
        };
        localStorage.setItem('voiceConnectionState', JSON.stringify(state));
    }
    
    resetState() {
        this.isConnected = false;
        this.channelName = '';
        this.meetingId = '';
        this.connectionTime = 0;
        localStorage.removeItem('voiceConnectionState');
    }
    
    createIndicator() {
        if (this.indicator) return;
        
        const indicator = document.createElement('div');
        indicator.className = 'fixed top-4 left-4 z-50 bg-black bg-opacity-90 text-white rounded-md shadow-lg transform transition-all duration-300 scale-0 opacity-0';
        indicator.innerHTML = `
            <div class="flex items-center p-2">
                <div class="mr-2">
                    <i class="fas fa-headphones text-white"></i>
                </div>
                <div class="flex flex-col">
                    <div class="text-xs text-gray-400">Voice Connected</div>
                    <div class="flex items-center">
                        <span class="channel-name text-sm font-medium"></span>
                        <span class="mx-1 text-xs text-gray-400">/</span>
                        <span class="timer text-xs text-gray-400">00:00</span>
                    </div>
                </div>
                <div class="ml-4">
                    <button class="disconnect-btn text-gray-400 hover:text-white p-1 rounded">
                        <i class="fas fa-phone-slash"></i>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(indicator);
        this.indicator = indicator;
        
        const disconnectBtn = indicator.querySelector('.disconnect-btn');
        disconnectBtn.addEventListener('click', () => this.handleDisconnect());
    }
    
    setupEventListeners() {
        window.addEventListener('voiceConnect', (e) => {
            this.handleConnect(e.detail.channelName, e.detail.meetingId);
        });
        
        window.addEventListener('voiceDisconnect', () => {
            this.handleDisconnect();
        });
        
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && this.isConnected) {
                this.showIndicator();
            }
        });
    }
    
    handleConnect(channelName, meetingId) {
        this.isConnected = true;
        this.channelName = channelName;
        this.meetingId = meetingId;
        this.connectionTime = Date.now();
        this.saveConnectionState();
        
        this.showIndicator();
        this.startTimer();
    }
    
    handleDisconnect() {
        this.isConnected = false;
        this.hideIndicator();
        this.stopTimer();
        this.resetState();
        
        const event = new CustomEvent('globalVoiceDisconnect');
        window.dispatchEvent(event);
        
        if (window.videosdkMeeting) {
            try {
                window.videosdkMeeting.leave();
            } catch (e) {
                console.error('Error when trying to leave meeting', e);
            }
        }
    }
    
    showIndicator() {
        if (!this.indicator) return;
        
        const channelNameEl = this.indicator.querySelector('.channel-name');
        channelNameEl.textContent = this.channelName;
        
        this.indicator.classList.remove('scale-0', 'opacity-0');
        this.indicator.classList.add('scale-100', 'opacity-100');
    }
    
    hideIndicator() {
        if (!this.indicator) return;
        
        this.indicator.classList.remove('scale-100', 'opacity-100');
        this.indicator.classList.add('scale-0', 'opacity-0');
    }
    
    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        const timerEl = this.indicator ? this.indicator.querySelector('.timer') : null;
        if (!timerEl) return;
        
        this.timerInterval = setInterval(() => {
            if (!this.isConnected) {
                clearInterval(this.timerInterval);
                return;
            }
            
            const elapsedSeconds = Math.floor((Date.now() - this.connectionTime) / 1000);
            const minutes = Math.floor(elapsedSeconds / 60);
            const seconds = elapsedSeconds % 60;
            
            timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
}

// Initialize the global voice indicator
const globalVoiceIndicator = new GlobalVoiceIndicator();

// Expose the global voice indicator for other components to use
window.globalVoiceIndicator = globalVoiceIndicator;

// Listen for voice connection events from the voice manager
document.addEventListener('DOMContentLoaded', function() {
    const meta = document.querySelector('meta[name="meeting-id"]');
    
    if (meta && localStorage.getItem('voiceConnectionState')) {
        try {
            const state = JSON.parse(localStorage.getItem('voiceConnectionState'));
            if (state.isConnected) {
                const event = new CustomEvent('voiceConnect', { 
                    detail: { 
                        channelName: state.channelName,
                        meetingId: state.meetingId
                    } 
                });
                window.dispatchEvent(event);
            }
        } catch (e) {
            console.error('Failed to parse voice connection state', e);
        }
    }
});
