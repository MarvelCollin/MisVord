class GlobalVoiceIndicator {
    constructor() {
        this.isConnected = false;
        this.channelName = "";
        this.meetingId = "";
        this.connectionTime = 0;
        this.indicator = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.connectionTimer = null;
        this.periodicCheckInterval = null;
        this.mutationObserver = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkExistingConnection();
        this.startPeriodicCheck();
    }
    
    checkExistingConnection() {
        setTimeout(() => {
            const voiceState = this.getVoiceState();
            const voiceManagerConnected = window.voiceManager?.isConnected;
            const videoSDKConnected = window.videoSDKManager?.isConnected;
            
            if (voiceState?.isConnected || voiceManagerConnected || videoSDKConnected) {
                this.isConnected = true;
                this.channelName = voiceState?.channelName || window.voiceManager?.currentChannelName || 'Voice Channel';
                this.meetingId = voiceState?.meetingId || window.voiceManager?.currentMeetingId || '';
                this.connectionTime = voiceState?.connectionTime || Date.now();
                
                this.createIndicator();
                this.updateVisibility();
            }
        }, 500);
    }
    
    startPeriodicCheck() {
        if (this.periodicCheckInterval) {
            clearInterval(this.periodicCheckInterval);
        }
        
        this.periodicCheckInterval = setInterval(() => {
            if (this.isConnected || window.voiceManager?.isConnected || window.videoSDKManager?.isConnected) {
                this.updateVisibility();
            }
        }, 2000);
    }

    setupEventListeners() {
        window.addEventListener('voiceConnect', (e) => {
            this.handleConnect(e.detail);
        });

        window.addEventListener('voiceDisconnect', () => {
            this.handleDisconnect();
        });

        window.addEventListener('voiceStateChanged', () => {
            this.updateControls();
            this.updateVisibility();
        });

        window.addEventListener('popstate', () => {
            setTimeout(() => this.updateVisibility(), 100);
        });
        
        window.addEventListener('hashchange', () => {
            setTimeout(() => this.updateVisibility(), 100);
        });
        
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                setTimeout(() => this.updateVisibility(), 100);
            }
        });
        
        this.setupMutationObserver();

        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
        
        if (window.localStorageManager) {
            window.localStorageManager.addVoiceStateListener(() => {
                this.updateControls();
                this.updateVisibility();
            });
        }
    }
    
    setupMutationObserver() {
        if (typeof MutationObserver === 'undefined') return;
        
        this.mutationObserver = new MutationObserver((mutations) => {
            let shouldUpdate = false;
            
            mutations.forEach((mutation) => {
                if (mutation.target.id === 'main-content' || 
                    mutation.target.classList?.contains('main-content') ||
                    mutation.target.classList?.contains('app-content')) {
                    shouldUpdate = true;
                }
            });
            
            if (shouldUpdate) {
                setTimeout(() => this.updateVisibility(), 200);
            }
        });
        
        const mainContent = document.getElementById('main-content') || 
                           document.querySelector('.main-content') ||
                           document.querySelector('.app-content') ||
                           document.body;
                           
        if (mainContent) {
            this.mutationObserver.observe(mainContent, {
                childList: true,
                subtree: true
            });
        }
    }

    handleConnect(detail) {
        this.isConnected = true;
        this.channelName = detail.channelName || 'Voice Channel';
        this.meetingId = detail.meetingId || '';
        this.connectionTime = Date.now();
        
        this.createIndicator();
        this.updateVisibility();
    }

    handleDisconnect() {
        this.isConnected = false;
        this.hideIndicator();
        
        setTimeout(() => {
            this.cleanup();
        }, 300);
    }

    isOnVoiceChannelPage() {
        const voiceElements = [
            document.getElementById('voice-container'),
            document.getElementById('joinView'),
            document.getElementById('connectingView'),
            document.getElementById('connectedView'),
            document.getElementById('joinBtn'),
            document.querySelector('.voice-call-app'),
            document.querySelector('.voice-controls'),
            document.querySelector('meta[name="meeting-id"]')
        ];
        
        const urlParams = new URLSearchParams(window.location.search);
        const channelType = urlParams.get('type');
        const isVoiceURL = channelType === 'voice';
        
        const hasVoiceElements = voiceElements.some(el => el !== null && !el.classList.contains('hidden'));
        
        return hasVoiceElements || isVoiceURL;
    }

    createIndicator() {
        this.cleanup();
        
        this.indicator = document.createElement('div');
        this.indicator.id = 'global-voice-indicator';
        this.indicator.className = 'fixed z-50 bg-[#1e1f22] text-white rounded-lg shadow-2xl border border-[#40444b] transition-all duration-300 cursor-grab active:cursor-grabbing select-none';
        this.indicator.style.cssText = `
            display: flex;
            flex-direction: column;
            min-width: 280px;
            max-width: 320px;
            bottom: 20px;
            left: 20px;
            opacity: 0;
            transform: scale(0.9);
            backdrop-filter: blur(12px);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
            z-index: 9999;
            pointer-events: auto;
            user-select: none;
        `;

        this.indicator.innerHTML = this.getIndicatorHTML();
        
        document.body.appendChild(this.indicator);
        
        this.setupIndicatorEvents();
        this.updateConnectionInfo();
        this.startConnectionTimer();
    }

    getIndicatorHTML() {
        return `
            <div class="voice-indicator-header flex items-center justify-between p-3 bg-gradient-to-r from-[#2b2d31] to-[#36393f] rounded-t-lg cursor-grab active:cursor-grabbing">
                <div class="flex items-center gap-3">
                    <div class="w-3 h-3 bg-[#3ba55c] rounded-full animate-pulse shadow-lg"></div>
                    <span class="text-sm font-semibold">Voice Connected</span>
                </div>
                <button class="disconnect-btn text-[#ed4245] hover:text-[#fc5054] transition-all duration-200 p-2 rounded-md hover:bg-[#ed4245]/10">
                    <i class="fas fa-phone-slash text-sm"></i>
                </button>
            </div>
            
            <div class="voice-indicator-info p-4 border-b border-[#40444b]/50">
                <div class="text-xs text-[#b9bbbe] mb-2 uppercase tracking-wide">Channel</div>
                <div class="channel-name text-sm font-medium text-[#3ba55c] truncate mb-2">${this.channelName}</div>
                <div class="connection-time text-xs text-[#72767d] font-mono">00:00</div>
            </div>
            
            <div class="voice-indicator-controls p-4 bg-gradient-to-b from-[#232428] to-[#1e1f22] rounded-b-lg">
                <div class="grid grid-cols-3 gap-3">
                    <button class="mic-btn control-btn bg-[#2f3136] hover:bg-[#3c3f47] p-3 rounded-lg transition-all duration-200 group border border-[#40444b]/30" title="Mute/Unmute">
                        <i class="fas fa-microphone text-[#b9bbbe] group-hover:text-white transition-colors text-lg"></i>
                    </button>
                    
                    <button class="deafen-btn control-btn bg-[#2f3136] hover:bg-[#3c3f47] p-3 rounded-lg transition-all duration-200 group border border-[#40444b]/30" title="Deafen/Undeafen">
                        <i class="fas fa-headphones text-[#b9bbbe] group-hover:text-white transition-colors text-lg"></i>
                    </button>
                    
                    <button class="info-btn control-btn bg-[#2f3136] hover:bg-[#3c3f47] p-3 rounded-lg transition-all duration-200 group border border-[#40444b]/30" title="Connection Info">
                        <i class="fas fa-info-circle text-[#b9bbbe] group-hover:text-white transition-colors text-lg"></i>
                    </button>
                </div>
            </div>
        `;
    }

    setupIndicatorEvents() {
        if (!this.indicator) return;

        this.setupDragAndDrop();
        this.setupControlButtons();
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
        this.indicator.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        this.indicator.style.cursor = 'grab';
        
        this.savePosition();
    }

    setupControlButtons() {
        if (!this.indicator) return;

        const micBtn = this.indicator.querySelector('.mic-btn');
        if (micBtn) {
            this.handleMicClick = () => {
                if (window.videoSDKManager && window.videoSDKManager.isConnected) {
                    window.videoSDKManager.toggleMic();
                } else if (window.voiceCallManager && typeof window.voiceCallManager.toggleMic === 'function') {
                    window.voiceCallManager.toggleMic();
                } else if (window.localStorageManager) {
                    window.localStorageManager.toggleVoiceMute();
                }
                this.updateControls();
            };
            micBtn.addEventListener('click', this.handleMicClick);
        }

        const deafenBtn = this.indicator.querySelector('.deafen-btn');
        if (deafenBtn) {
            this.handleDeafenClick = () => {
                if (window.videoSDKManager && window.videoSDKManager.isConnected) {
                    window.videoSDKManager.toggleDeafen();
                } else if (window.voiceCallManager && typeof window.voiceCallManager.toggleDeafen === 'function') {
                    window.voiceCallManager.toggleDeafen();
                } else if (window.localStorageManager) {
                    window.localStorageManager.toggleVoiceDeafen();
                }
                this.updateControls();
            };
            deafenBtn.addEventListener('click', this.handleDeafenClick);
        }

        const infoBtn = this.indicator.querySelector('.info-btn');
        if (infoBtn) {
            this.handleInfoClick = () => {
                this.showConnectionInfo();
            };
            infoBtn.addEventListener('click', this.handleInfoClick);
        }

        const disconnectBtn = this.indicator.querySelector('.disconnect-btn');
        if (disconnectBtn) {
            this.handleDisconnectClick = () => {
                if (window.voiceManager && typeof window.voiceManager.leaveVoice === 'function') {
                    window.voiceManager.leaveVoice();
                } else if (window.videoSDKManager && window.videoSDKManager.isConnected) {
                    window.videoSDKManager.leaveMeeting();
                } else if (window.voiceStateManager) {
                    window.voiceStateManager.disconnectVoice();
                }
                
                this.handleDisconnect();
            };
            disconnectBtn.addEventListener('click', this.handleDisconnectClick);
        }
    }

    updateControls() {
        if (!this.indicator) return;

        this.updateVisibility();

        const state = this.getVoiceState();
        if (!state) return;
        
        const micBtn = this.indicator.querySelector('.mic-btn');
        const micIcon = micBtn?.querySelector('i');
        if (micBtn && micIcon) {
            if (state.isMuted || state.isDeafened) {
                micIcon.className = 'fas fa-microphone-slash text-[#ed4245] text-lg';
                micBtn.classList.add('bg-[#ed4245]/20', 'border-[#ed4245]/40');
                micBtn.classList.remove('bg-[#2f3136]', 'border-[#40444b]/30');
            } else {
                micIcon.className = 'fas fa-microphone text-[#b9bbbe] group-hover:text-white transition-colors text-lg';
                micBtn.classList.remove('bg-[#ed4245]/20', 'border-[#ed4245]/40');
                micBtn.classList.add('bg-[#2f3136]', 'border-[#40444b]/30');
            }
        }

        const deafenBtn = this.indicator.querySelector('.deafen-btn');
        const deafenIcon = deafenBtn?.querySelector('i');
        if (deafenBtn && deafenIcon) {
            if (state.isDeafened) {
                deafenIcon.className = 'fas fa-volume-xmark text-[#ed4245] text-lg';
                deafenBtn.classList.add('bg-[#ed4245]/20', 'border-[#ed4245]/40');
                deafenBtn.classList.remove('bg-[#2f3136]', 'border-[#40444b]/30');
            } else {
                deafenIcon.className = 'fas fa-headphones text-[#b9bbbe] group-hover:text-white transition-colors text-lg';
                deafenBtn.classList.remove('bg-[#ed4245]/20', 'border-[#ed4245]/40');
                deafenBtn.classList.add('bg-[#2f3136]', 'border-[#40444b]/30');
            }
        }
    }

    updateConnectionInfo() {
        if (!this.indicator) return;

        const channelNameEl = this.indicator.querySelector('.channel-name');
        if (channelNameEl) {
            const displayName = this.channelName.length > 25 
                ? this.channelName.substring(0, 22) + '...' 
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

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] backdrop-blur-sm';
        modal.innerHTML = `
            <div class="bg-gradient-to-b from-[#2f3136] to-[#36393f] rounded-xl p-6 m-4 max-w-md w-full shadow-2xl border border-[#40444b]">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-lg font-bold text-white">Connection Info</h3>
                    <button class="close-modal text-[#b9bbbe] hover:text-white p-1 rounded transition-colors">
                        <i class="fas fa-times text-lg"></i>
                    </button>
                </div>
                <div class="space-y-4 text-sm">
                    <div class="flex justify-between">
                        <span class="text-[#b9bbbe]">Channel:</span>
                        <span class="text-white font-medium">${this.channelName}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-[#b9bbbe]">Meeting ID:</span>
                        <span class="text-white font-mono text-xs bg-[#1e1f22] px-2 py-1 rounded">${this.meetingId}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-[#b9bbbe]">Connected:</span>
                        <span class="text-white">${new Date(this.connectionTime).toLocaleTimeString()}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-[#b9bbbe]">Status:</span>
                        <span class="text-[#3ba55c] flex items-center gap-1">
                            <i class="fas fa-circle text-xs animate-pulse"></i> Connected
                        </span>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => modal.remove());
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        setTimeout(() => {
            if (modal.parentNode) modal.remove();
        }, 10000);
    }

    showIndicator() {
        if (!this.indicator) return;

        this.loadPosition();

        requestAnimationFrame(() => {
            this.indicator.style.opacity = '1';
            this.indicator.style.transform = 'scale(1)';
        });
    }

    hideIndicator() {
        if (!this.indicator) return;

        this.indicator.style.opacity = '0';
        this.indicator.style.transform = 'scale(0.9)';
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
        
        if (this.periodicCheckInterval) {
            clearInterval(this.periodicCheckInterval);
            this.periodicCheckInterval = null;
        }
        
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.mutationObserver = null;
        }

        if (this.indicator) {
            this.indicator.remove();
            this.indicator = null;
        }

        const modals = document.querySelectorAll('.fixed.inset-0.bg-black\\/60');
        modals.forEach(modal => modal.remove());
    }

    getVoiceState() {
        let state = {
            isConnected: false,
            isMuted: false,
            isDeafened: false,
            isVideoOn: false,
            isScreenSharing: false,
            volume: 100,
            channelId: null,
            channelName: null,
            meetingId: null
        };
        
        if (window.localStorageManager) {
            const localState = window.localStorageManager.getVoiceState();
            if (localState) {
                state = { ...state, ...localState };
            }
        }
        
        if (window.voiceManager) {
            state.isConnected = state.isConnected || window.voiceManager.isConnected;
            state.channelName = state.channelName || window.voiceManager.currentChannelName;
            state.meetingId = state.meetingId || window.voiceManager.currentMeetingId;
        }
        
        if (window.videoSDKManager) {
            state.isConnected = state.isConnected || window.videoSDKManager.isConnected;
            state.channelName = state.channelName || window.videoSDKManager.currentChannelName;
            state.meetingId = state.meetingId || window.videoSDKManager.currentMeetingId;
        }
        
        if (window.voiceCallManager) {
            state.isMuted = state.isMuted || window.voiceCallManager.isMuted;
            state.isDeafened = state.isDeafened || window.voiceCallManager.isDeafened;
            state.isVideoOn = state.isVideoOn || window.voiceCallManager.isVideoOn;
            state.isScreenSharing = state.isScreenSharing || window.voiceCallManager.isScreenSharing;
        }
        
        return state;
    }
    
    forceUpdateIndicator() {
        this.checkExistingConnection();
        this.updateVisibility();
    }
    
    ensureIndicatorVisible() {
        if (!this.indicator && (this.isConnected || window.voiceManager?.isConnected || window.videoSDKManager?.isConnected)) {
            this.createIndicator();
        }
        this.updateVisibility();
    }

    updateVisibility() {
        if (!this.indicator) {
            return;
        }

        const voiceState = this.getVoiceState();
        const voiceManagerConnected = window.voiceManager?.isConnected;
        const videoSDKConnected = window.videoSDKManager?.isConnected;
        const localStorageConnected = voiceState?.isConnected;
        
        const isConnectedAnywhere = this.isConnected || voiceManagerConnected || videoSDKConnected || localStorageConnected;
        const isOnVoicePage = this.isOnVoiceChannelPage();
        
        if (isConnectedAnywhere && !isOnVoicePage) {
            this.indicator.style.display = 'flex';
            this.showIndicator();
        } else {
            this.indicator.style.display = 'none';
        }
    }
}

if (!window.globalVoiceIndicator) {
    window.globalVoiceIndicator = new GlobalVoiceIndicator();
}

export default window.globalVoiceIndicator;
