class GlobalVoiceIndicator {
    constructor() {
        this.isConnected = false;
        this.channelName = "";
        this.meetingId = "";
        this.connectionTime = 0;
        this.indicator = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadPosition();
    }

    setupEventListeners() {
        // Listen for voice connection events
        window.addEventListener('voiceConnect', (e) => {
            this.handleConnect(e.detail);
        });

        window.addEventListener('voiceDisconnect', () => {
            this.handleDisconnect();
        });

        // Clean up on page unload
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }

    handleConnect(detail) {
        console.log('🎤 Voice connected, showing global indicator');
        
        this.isConnected = true;
        this.channelName = detail.channelName || 'Voice Channel';
        this.meetingId = detail.meetingId || '';
        this.connectionTime = Date.now();
        
        // Check if we're on a voice channel page (don't show indicator there)
        if (this.isOnVoiceChannelPage()) {
            console.log('📍 On voice channel page, not showing indicator');
            return;
        }
        
        this.createIndicator();
        this.showIndicator();
    }

    handleDisconnect() {
        console.log('🔇 Voice disconnected, hiding global indicator');
        
        this.isConnected = false;
        this.hideIndicator();
        
        setTimeout(() => {
            this.cleanup();
        }, 300);
    }

    isOnVoiceChannelPage() {
        // Check various indicators that we're on a voice channel page
        const voiceElements = [
            document.getElementById('voice-container'),
            document.getElementById('joinView'),
            document.getElementById('connectingView'),
            document.getElementById('joinBtn'),
            document.querySelector('meta[name="meeting-id"]')
        ];
        
        return voiceElements.some(el => el !== null);
    }

    createIndicator() {
        // Remove any existing indicator
        this.cleanup();
        
        this.indicator = document.createElement('div');
        this.indicator.id = 'global-voice-indicator';
        this.indicator.className = 'fixed z-50 bg-[#1e1f22] text-white rounded-lg shadow-2xl border border-[#40444b] transition-all duration-300 cursor-grab active:cursor-grabbing select-none';
        this.indicator.style.cssText = `
            display: flex;
            flex-direction: column;
            min-width: 260px;
            max-width: 320px;
            bottom: 20px;
            left: 20px;
            opacity: 0;
            transform: scale(0.8);
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        `;

        this.indicator.innerHTML = this.getIndicatorHTML();
        
        document.body.appendChild(this.indicator);
        
        this.setupIndicatorEvents();
        this.updateConnectionInfo();
        this.startConnectionTimer();
    }

    getIndicatorHTML() {
        return `
            <!-- Header with drag handle -->
            <div class="voice-indicator-header flex items-center justify-between p-3 bg-[#2b2d31] rounded-t-lg cursor-grab active:cursor-grabbing">
                <div class="flex items-center gap-2">
                    <div class="w-3 h-3 bg-[#3ba55c] rounded-full animate-pulse"></div>
                    <span class="text-sm font-medium">Voice Connected</span>
                </div>
                <button class="disconnect-btn text-[#ed4245] hover:text-[#fc5054] transition-colors p-1 rounded hover:bg-[#ed4245]/10">
                    <i class="fas fa-phone-slash text-sm"></i>
                </button>
            </div>
            
            <!-- Connection Info -->
            <div class="voice-indicator-info p-3 border-b border-[#40444b]">
                <div class="text-xs text-[#b9bbbe] mb-1">Channel</div>
                <div class="channel-name text-sm font-medium text-[#3ba55c] truncate">${this.channelName}</div>
                <div class="connection-time text-xs text-[#72767d] mt-1">00:00</div>
            </div>
            
            <!-- Controls -->
            <div class="voice-indicator-controls p-3 bg-[#232428] rounded-b-lg">
                <div class="grid grid-cols-4 gap-2">
                    <!-- Microphone -->
                    <button class="mic-btn control-btn bg-[#2f3136] hover:bg-[#3c3f47] p-3 rounded-md transition-all duration-200 group" title="Mute/Unmute">
                        <i class="fas fa-microphone text-[#b9bbbe] group-hover:text-white transition-colors"></i>
                    </button>
                    
                    <!-- Deafen -->
                    <button class="deafen-btn control-btn bg-[#2f3136] hover:bg-[#3c3f47] p-3 rounded-md transition-all duration-200 group" title="Deafen/Undeafen">
                        <i class="fas fa-headphones text-[#b9bbbe] group-hover:text-white transition-colors"></i>
                    </button>
                    
                    <!-- Screen Share -->
                    <button class="screen-btn control-btn bg-[#2f3136] hover:bg-[#3c3f47] p-3 rounded-md transition-all duration-200 group" title="Share Screen">
                        <i class="fas fa-desktop text-[#b9bbbe] group-hover:text-white transition-colors"></i>
                    </button>
                    
                    <!-- Info/Settings -->
                    <button class="info-btn control-btn bg-[#2f3136] hover:bg-[#3c3f47] p-3 rounded-md transition-all duration-200 group" title="Connection Info">
                        <i class="fas fa-info-circle text-[#b9bbbe] group-hover:text-white transition-colors"></i>
                    </button>
                </div>
            </div>
        `;
    }

    setupIndicatorEvents() {
        if (!this.indicator) return;

        // Drag functionality
        this.setupDragAndDrop();
        
        // Control buttons
        this.setupControlButtons();
        
        // Update controls based on current state
        this.updateControls();
    }

    setupDragAndDrop() {
        const header = this.indicator.querySelector('.voice-indicator-header');
        if (!header) return;

        header.addEventListener('mousedown', (e) => this.startDrag(e));
        header.addEventListener('touchstart', (e) => this.startDrag(e.touches[0]), { passive: false });
        
        document.addEventListener('mousemove', (e) => this.onDrag(e));
        document.addEventListener('touchmove', (e) => this.onDrag(e.touches[0]), { passive: false });
        
        document.addEventListener('mouseup', () => this.endDrag());
        document.addEventListener('touchend', () => this.endDrag());
    }

    startDrag(e) {
        // Don't drag if clicking on buttons
        if (e.target.closest('button')) return;
        
        this.isDragging = true;
        this.indicator.style.transition = 'none';
        this.indicator.style.cursor = 'grabbing';
        
        const rect = this.indicator.getBoundingClientRect();
        this.dragOffset.x = e.clientX - rect.left;
        this.dragOffset.y = e.clientY - rect.top;
        
        e.preventDefault();
    }

    onDrag(e) {
        if (!this.isDragging || !this.indicator) return;
        
        let left = e.clientX - this.dragOffset.x;
        let top = e.clientY - this.dragOffset.y;
        
        // Keep indicator within viewport
        const rect = this.indicator.getBoundingClientRect();
        left = Math.max(0, Math.min(left, window.innerWidth - rect.width));
        top = Math.max(0, Math.min(top, window.innerHeight - rect.height));
        
        this.indicator.style.left = left + 'px';
        this.indicator.style.top = top + 'px';
        this.indicator.style.bottom = 'auto';
        this.indicator.style.right = 'auto';
        
        e.preventDefault();
    }

    endDrag() {
        if (!this.isDragging || !this.indicator) return;
        
        this.isDragging = false;
        this.indicator.style.transition = 'all 0.3s ease';
        this.indicator.style.cursor = 'grab';
        
        this.savePosition();
    }

    setupControlButtons() {
        if (!this.indicator) return;

        // Microphone toggle
        const micBtn = this.indicator.querySelector('.mic-btn');
        if (micBtn) {
            micBtn.addEventListener('click', () => {
                if (window.voiceStateManager) {
                    window.voiceStateManager.toggleMic();
                    this.updateControls();
                }
            });
        }

        // Deafen toggle
        const deafenBtn = this.indicator.querySelector('.deafen-btn');
        if (deafenBtn) {
            deafenBtn.addEventListener('click', () => {
                if (window.voiceStateManager) {
                    window.voiceStateManager.toggleDeafen();
                    this.updateControls();
                }
            });
        }

        // Screen share toggle
        const screenBtn = this.indicator.querySelector('.screen-btn');
        if (screenBtn) {
            screenBtn.addEventListener('click', () => {
                if (window.voiceStateManager) {
                    window.voiceStateManager.toggleScreenShare();
                    this.updateControls();
                }
            });
        }

        // Info/Settings
        const infoBtn = this.indicator.querySelector('.info-btn');
        if (infoBtn) {
            infoBtn.addEventListener('click', () => {
                this.showConnectionInfo();
            });
        }

        // Disconnect button
        const disconnectBtn = this.indicator.querySelector('.disconnect-btn');
        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', () => {
                if (window.voiceStateManager) {
                    window.voiceStateManager.disconnectVoice();
                } else if (window.voiceManager) {
                    window.voiceManager.leaveVoice();
                }
            });
        }
    }

    updateControls() {
        if (!this.indicator || !window.voiceStateManager) return;

        const state = window.voiceStateManager.getState();
        
        // Update mic button
        const micBtn = this.indicator.querySelector('.mic-btn');
        const micIcon = micBtn?.querySelector('i');
        if (micBtn && micIcon) {
            if (state.isMuted || state.isDeafened) {
                micIcon.className = 'fas fa-microphone-slash text-[#ed4245]';
                micBtn.classList.add('bg-[#ed4245]/20');
                micBtn.classList.remove('bg-[#2f3136]');
            } else {
                micIcon.className = 'fas fa-microphone text-[#b9bbbe] group-hover:text-white';
                micBtn.classList.remove('bg-[#ed4245]/20');
                micBtn.classList.add('bg-[#2f3136]');
            }
        }

        // Update deafen button
        const deafenBtn = this.indicator.querySelector('.deafen-btn');
        const deafenIcon = deafenBtn?.querySelector('i');
        if (deafenBtn && deafenIcon) {
            if (state.isDeafened) {
                deafenIcon.className = 'fas fa-volume-xmark text-[#ed4245]';
                deafenBtn.classList.add('bg-[#ed4245]/20');
                deafenBtn.classList.remove('bg-[#2f3136]');
            } else {
                deafenIcon.className = 'fas fa-headphones text-[#b9bbbe] group-hover:text-white';
                deafenBtn.classList.remove('bg-[#ed4245]/20');
                deafenBtn.classList.add('bg-[#2f3136]');
            }
        }

        // Update screen share button
        const screenBtn = this.indicator.querySelector('.screen-btn');
        const screenIcon = screenBtn?.querySelector('i');
        if (screenBtn && screenIcon) {
            if (state.isScreenSharing) {
                screenIcon.className = 'fas fa-desktop text-[#5865f2]';
                screenBtn.classList.add('bg-[#5865f2]/20');
                screenBtn.classList.remove('bg-[#2f3136]');
            } else {
                screenIcon.className = 'fas fa-desktop text-[#b9bbbe] group-hover:text-white';
                screenBtn.classList.remove('bg-[#5865f2]/20');
                screenBtn.classList.add('bg-[#2f3136]');
            }
        }
    }

    updateConnectionInfo() {
        if (!this.indicator) return;

        const channelNameEl = this.indicator.querySelector('.channel-name');
        if (channelNameEl) {
            const displayName = this.channelName.length > 20 
                ? this.channelName.substring(0, 17) + '...' 
                : this.channelName;
            channelNameEl.textContent = displayName;
        }
    }

    startConnectionTimer() {
        if (this.connectionTimer) {
            clearInterval(this.connectionTimer);
        }

        this.connectionTimer = setInterval(() => {
            this.updateConnectionTime();
        }, 1000);
    }

    updateConnectionTime() {
        if (!this.indicator || !this.connectionTime) return;

        const timeEl = this.indicator.querySelector('.connection-time');
        if (!timeEl) return;

        const elapsed = Math.floor((Date.now() - this.connectionTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;

        timeEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    showConnectionInfo() {
        if (!this.indicator) return;

        // Create info modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]';
        modal.innerHTML = `
            <div class="bg-[#2f3136] rounded-lg p-6 m-4 max-w-md w-full">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-white">Connection Info</h3>
                    <button class="close-modal text-[#b9bbbe] hover:text-white">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="space-y-3 text-sm">
                    <div>
                        <span class="text-[#b9bbbe]">Channel:</span>
                        <span class="text-white ml-2">${this.channelName}</span>
                    </div>
                    <div>
                        <span class="text-[#b9bbbe]">Meeting ID:</span>
                        <span class="text-white ml-2 font-mono text-xs">${this.meetingId}</span>
                    </div>
                    <div>
                        <span class="text-[#b9bbbe]">Connected:</span>
                        <span class="text-white ml-2">${new Date(this.connectionTime).toLocaleTimeString()}</span>
                    </div>
                    <div>
                        <span class="text-[#b9bbbe]">Status:</span>
                        <span class="text-[#3ba55c] ml-2">
                            <i class="fas fa-circle text-xs"></i> Connected
                        </span>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close modal handlers
        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => modal.remove());
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        // Auto-close after 10 seconds
        setTimeout(() => {
            if (modal.parentNode) modal.remove();
        }, 10000);
    }

    showIndicator() {
        if (!this.indicator) return;

        // Load saved position
        this.loadPosition();

        // Animate in
        requestAnimationFrame(() => {
            this.indicator.style.opacity = '1';
            this.indicator.style.transform = 'scale(1)';
        });

        console.log('✅ Global voice indicator shown');
    }

    hideIndicator() {
        if (!this.indicator) return;

        this.indicator.style.opacity = '0';
        this.indicator.style.transform = 'scale(0.8)';

        console.log('🔇 Global voice indicator hidden');
    }

    savePosition() {
        if (!this.indicator) return;

        const rect = this.indicator.getBoundingClientRect();
        const position = {
            left: rect.left,
            top: rect.top
        };

        localStorage.setItem('globalVoiceIndicatorPosition', JSON.stringify(position));
    }

    loadPosition() {
        if (!this.indicator) return;

        try {
            const saved = localStorage.getItem('globalVoiceIndicatorPosition');
            if (saved) {
                const position = JSON.parse(saved);
                
                // Ensure position is within viewport
                const maxLeft = window.innerWidth - this.indicator.offsetWidth;
                const maxTop = window.innerHeight - this.indicator.offsetHeight;
                
                const left = Math.max(0, Math.min(position.left, maxLeft));
                const top = Math.max(0, Math.min(position.top, maxTop));
                
                this.indicator.style.left = left + 'px';
                this.indicator.style.top = top + 'px';
                this.indicator.style.bottom = 'auto';
                this.indicator.style.right = 'auto';
            }
        } catch (error) {
            console.warn('Failed to load indicator position:', error);
        }
    }

    cleanup() {
        if (this.connectionTimer) {
            clearInterval(this.connectionTimer);
            this.connectionTimer = null;
        }

        if (this.indicator) {
            this.indicator.remove();
            this.indicator = null;
        }

        // Clean up any info modals
        const modals = document.querySelectorAll('.fixed.inset-0.bg-black\\/50');
        modals.forEach(modal => modal.remove());
    }
}

// Create global instance
if (!window.globalVoiceIndicator) {
    window.globalVoiceIndicator = new GlobalVoiceIndicator();
    console.log('✅ GlobalVoiceIndicator initialized');
}

export default window.globalVoiceIndicator;
