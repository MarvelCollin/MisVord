class VoiceIndicator {
    constructor() {
        this.indicator = document.getElementById('voice-indicator');
        this.channelNameEl = this.indicator?.querySelector('.channel-name');
        this.durationEl = this.indicator?.querySelector('.connection-duration');
        this.disconnectBtn = this.indicator?.querySelector('.disconnect-btn');
        this.micBtn = this.indicator?.querySelector('.mic-btn');
        this.screenBtn = this.indicator?.querySelector('.screen-btn');
        this.deafenBtn = this.indicator?.querySelector('.deafen-btn');
        
        this.connectionStartTime = null;
        this.durationInterval = null;
        
        this.init();
    }
    
    init() {
        if (!this.indicator) return;
        
        this.setupDragAndDrop();
        this.setupEventListeners();
        this.setupVoiceStateSync();
    }
    
    setupDragAndDrop() {
        const dragHandle = this.indicator;
        if (!dragHandle) return;
        
        let isDragging = false;
        let xOffset = 0;
        let yOffset = 0;
        let initialX;
        let initialY;
        
        const dragStart = (e) => {
            if (e.target.closest('button')) {
                return;
            }
            
            isDragging = true;
            this.indicator.classList.add('active');
            document.body.style.userSelect = 'none';
            
            if (e.type === "touchstart") {
                initialX = e.touches[0].clientX - xOffset;
                initialY = e.touches[0].clientY - yOffset;
            } else {
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;
            }
        };
        
        const dragEnd = () => {
            if (!isDragging) return;
            
            isDragging = false;
            this.indicator.classList.remove('active');
            document.body.style.userSelect = 'auto';

            localStorage.setItem('voiceIndicatorPosition', JSON.stringify({ x: xOffset, y: yOffset }));
        };
        
        const drag = (e) => {
            if (!isDragging) return;
            
            e.preventDefault();
            
            let currentX, currentY;
            if (e.type === "touchmove") {
                currentX = e.touches[0].clientX - initialX;
                currentY = e.touches[0].clientY - initialY;
            } else {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
            }
            
            xOffset = currentX;
            yOffset = currentY;
            
            this.setTranslate(xOffset, yOffset);
        };
        
        dragHandle.addEventListener('mousedown', dragStart, false);
        document.addEventListener('mouseup', dragEnd, false);
        document.addEventListener('mousemove', drag, false);
        
        dragHandle.addEventListener('touchstart', dragStart, { passive: false });
        document.addEventListener('touchend', dragEnd, false);
        document.addEventListener('touchmove', drag, { passive: false });
        
        const savedPosition = localStorage.getItem('voiceIndicatorPosition');
        if (savedPosition) {
            try {
                const { x, y } = JSON.parse(savedPosition);
                if (typeof x === 'number' && typeof y === 'number') {
                    xOffset = x;
                    yOffset = y;
                    this.setTranslate(x, y);
                }
            } catch (error) {
                console.error('Error parsing voice indicator position:', error);
            }
        }
    }
    
    setTranslate(xPos, yPos) {
        this.indicator.style.transform = `translate3d(${xPos}px, ${yPos}px, 0) scale(1)`;
    }
    
    setupEventListeners() {
        if (this.disconnectBtn) {
            this.disconnectBtn.addEventListener('click', () => {
                if (window.voiceManager) {
                    window.voiceManager.leaveVoice();
                }
            });
        }
        
        if (this.micBtn) {
            this.micBtn.addEventListener('click', () => {
                if (window.voiceStateManager) {
                    window.voiceStateManager.toggleMic();
                }
            });
        }
        
        if (this.screenBtn) {
            this.screenBtn.addEventListener('click', () => {
                if (window.voiceStateManager) {
                    window.voiceStateManager.toggleScreenShare();
                }
            });
        }
        
        if (this.deafenBtn) {
            this.deafenBtn.addEventListener('click', () => {
                if (window.voiceStateManager) {
                    window.voiceStateManager.toggleDeafen();
                }
            });
        }
        
        window.addEventListener('voiceConnect', (event) => {
            this.handleConnect(event.detail);
        });
        
        window.addEventListener('voiceDisconnect', () => {
            this.handleDisconnect();
        });
    }
    
    setupVoiceStateSync() {
        if (!window.voiceStateManager) return;
        
        window.voiceStateManager.addListener((state) => {
            this.updateControlStates(state);
        });
    }
    
    updateControlStates(state) {
        if (this.micBtn) {
            const icon = this.micBtn.querySelector('i');
            if (state.isMuted || state.isDeafened) {
                icon.className = 'fas fa-microphone-slash text-[#ed4245] hover:text-[#fc5054] text-lg';
            } else {
                icon.className = 'fas fa-microphone text-[#b9bbbe] hover:text-white text-lg';
            }
        }
        
        if (this.deafenBtn) {
            const icon = this.deafenBtn.querySelector('i');
            if (state.isDeafened) {
                icon.className = 'fas fa-volume-xmark text-[#ed4245] hover:text-[#fc5054] text-lg';
            } else {
                icon.className = 'fas fa-headphones text-[#b9bbbe] hover:text-white text-lg';
            }
        }
        
        if (this.screenBtn) {
            const icon = this.screenBtn.querySelector('i');
            if (state.isScreenSharing) {
                icon.className = 'fas fa-desktop text-[#5865F2] hover:text-[#6b7bff] text-lg';
            } else {
                icon.className = 'fas fa-desktop text-[#b9bbbe] hover:text-white text-lg';
            }
        }
    }
    
    showIndicator() {
        if (!this.indicator) return;
        console.log('Showing voice indicator');
        this.indicator.style.display = 'block';
        this.indicator.classList.remove('scale-0', 'opacity-0');
    }
    
    hideIndicator() {
        if (!this.indicator) return;
        console.log('Hiding voice indicator');
        this.indicator.classList.add('scale-0', 'opacity-0');
        setTimeout(() => {
            if (!this.indicator) return;
            this.indicator.style.display = 'none';
        }, 300); // Wait for transition to complete
    }
    
    handleConnect(detail) {
        if (!this.indicator) return;
        
        console.log('Voice connected, showing indicator');
        this.showIndicator();
        
        if (this.channelNameEl && detail?.channelName) {
            this.channelNameEl.textContent = detail.channelName.length > 10 
                ? detail.channelName.substring(0, 8) + '...' 
                : detail.channelName;
        }
        
        this.connectionStartTime = Date.now();
        this.startDurationTimer();
    }
    
    handleDisconnect() {
        if (!this.indicator) return;
        
        console.log('Voice disconnected, hiding indicator');
        this.hideIndicator();
        this.stopDurationTimer();
        this.connectionStartTime = null;
    }
    
    startDurationTimer() {
        this.stopDurationTimer();
        
        this.durationInterval = setInterval(() => {
            if (!this.connectionStartTime || !this.durationEl) return;
            
            const duration = Math.floor((Date.now() - this.connectionStartTime) / 1000);
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;
            
            this.durationEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }, 1000);
    }
    
    stopDurationTimer() {
        if (this.durationInterval) {
            clearInterval(this.durationInterval);
            this.durationInterval = null;
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    window.globalVoiceIndicator = new VoiceIndicator();
}); 