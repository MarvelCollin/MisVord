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
            if (window.videosdkMeeting) {
                this.showIndicator();
                this.startTimer();
            } else {
                this.resetState();
            }
        } else {
            this.hideIndicator();
        }
        
        this.startConnectionVerification();
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
                
                if (this.isConnected && !window.videosdkMeeting) {
                    this.resetState();
                }
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
        this.hideIndicator();
        this.stopTimer();
    }
    
    createIndicator() {
        if (this.indicator) return;
        
        const indicator = document.createElement('div');
        indicator.className = 'fixed top-4 left-4 z-50 bg-black bg-opacity-90 text-white rounded-md shadow-lg transform transition-all duration-300 scale-0 opacity-0 cursor-grab active:cursor-grabbing';
        indicator.innerHTML = `
            <div class="flex items-center p-2">
                <div class="drag-handle mr-2 cursor-grab active:cursor-grabbing">
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
        
        // Load saved position
        this.loadPosition();
        
        // Make it draggable
        this.makeDraggable();
    }
    
    makeDraggable() {
        if (!this.indicator) return;
        
        let isDragging = false;
        let offsetX, offsetY;
        
        const onMouseDown = (e) => {
            if (e.target.closest('.disconnect-btn')) return;
            
            isDragging = true;
            this.indicator.style.transition = 'none';
            
            // Get the current position of the element
            const rect = this.indicator.getBoundingClientRect();
            
            // Calculate offset - where inside the element was clicked
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            
            // Change cursor style
            this.indicator.classList.add('active');
        };
        
        const onMouseMove = (e) => {
            if (!isDragging) return;
            
            // Calculate new position
            let left = e.clientX - offsetX;
            let top = e.clientY - offsetY;
            
            // Keep within viewport bounds
            const rect = this.indicator.getBoundingClientRect();
            left = Math.max(0, Math.min(left, window.innerWidth - rect.width));
            top = Math.max(0, Math.min(top, window.innerHeight - rect.height));
            
            // Apply new position
            this.indicator.style.left = left + 'px';
            this.indicator.style.top = top + 'px';
        };
        
        const onMouseUp = () => {
            if (!isDragging) return;
            
            isDragging = false;
            this.indicator.style.transition = 'transform 0.3s, opacity 0.3s';
            
            // Save new position
            this.savePosition();
            
            // Reset cursor style
            this.indicator.classList.remove('active');
        };
        
        this.indicator.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        
        // Handle touch events for mobile
        this.indicator.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            onMouseDown({ clientX: touch.clientX, clientY: touch.clientY, target: touch.target });
        });
        
        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            e.preventDefault(); // Prevent scrolling
            const touch = e.touches[0];
            onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
        }, { passive: false });
        
        document.addEventListener('touchend', onMouseUp);
    }
    
    savePosition() {
        if (!this.indicator) return;
        
        const rect = this.indicator.getBoundingClientRect();
        const position = {
            left: rect.left,
            top: rect.top
        };
        
        localStorage.setItem('voiceIndicatorPosition', JSON.stringify(position));
    }
    
    loadPosition() {
        if (!this.indicator) return;
        
        const savedPosition = localStorage.getItem('voiceIndicatorPosition');
        if (savedPosition) {
            try {
                const position = JSON.parse(savedPosition);
                this.indicator.style.left = position.left + 'px';
                this.indicator.style.top = position.top + 'px';
            } catch (e) {
                console.error('Failed to parse saved position', e);
            }
        }
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
        
        this.indicator.style.display = '';
        
        this.indicator.offsetHeight;
        
        this.indicator.classList.remove('scale-0', 'opacity-0');
        this.indicator.classList.add('scale-100', 'opacity-100');
    }
    
    hideIndicator() {
        if (!this.indicator) return;
        
        this.indicator.classList.remove('scale-100', 'opacity-100');
        this.indicator.classList.add('scale-0', 'opacity-0');
        
        setTimeout(() => {
            if (!this.isConnected && this.indicator) {
                this.indicator.style.display = 'none';
            }
        }, 300);
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
    
    startConnectionVerification() {
        this.verificationInterval = setInterval(() => {
            if (this.isConnected) {
                if (!window.videosdkMeeting) {
                    console.log('Voice connection lost, resetting state');
                    this.resetState();
                    this.hideIndicator();
                }
            }
        }, 5000);
    }
    
    stopConnectionVerification() {
        if (this.verificationInterval) {
            clearInterval(this.verificationInterval);
            this.verificationInterval = null;
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
                // Check if we're on a voice page and already have a meeting initialized
                if (document.getElementById('videoContainer')) {
                    // We're on a voice page, let the normal voice manager handle it
                    return;
                }
                
                // We're not on a voice page, but might have an active connection
                // Wait a moment to see if videosdkMeeting gets initialized
                setTimeout(() => {
                    if (window.videosdkMeeting) {
                        const event = new CustomEvent('voiceConnect', { 
                            detail: { 
                                channelName: state.channelName,
                                meetingId: state.meetingId
                            } 
                        });
                        window.dispatchEvent(event);
                    } else {
                        // No meeting was found, clear the saved state
                        localStorage.removeItem('voiceConnectionState');
                    }
                }, 1000);
            }
        } catch (e) {
            console.error('Failed to parse voice connection state', e);
            localStorage.removeItem('voiceConnectionState');
        }
    }
});
