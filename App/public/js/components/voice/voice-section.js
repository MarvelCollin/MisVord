class VoiceSection {
    constructor() {
        this.elements = {
            joinBtn: null,
            joinView: null,
            connectingView: null,
            videoGrid: null,
            voiceControls: null,
            voiceIndicator: null
        };
        
        this.durationInterval = null;
        this.connectionStartTime = null;
        this.initializationAttempts = 0;
        this.maxInitAttempts = 10;
        this.initialized = false;
        
        setTimeout(() => {
            this.findElements();
            this.init();
        }, 300);
    }
    
    findElements() {
        this.elements = {
            joinBtn: document.getElementById('joinBtn'),
            joinView: document.getElementById('joinView'),
            connectingView: document.getElementById('connectingView'),
            videoGrid: document.getElementById('videoGrid'),
            voiceControls: document.getElementById('voiceControls'),
            voiceIndicator: document.getElementById('voice-indicator')
        };
        
        // Log which elements were found/not found for debugging
        console.log("Voice elements found:", Object.entries(this.elements).reduce((acc, [key, val]) => {
            acc[key] = !!val;
            return acc;
        }, {}));
    }
    
    init() {
        if (this.initialized) return;
        
        this.findElements();
        this.setupEventListeners();
        
        if (!window.voiceState) {
            window.voiceState = { isConnected: false };
        }
        
        this.loadDependencies()
            .then(() => {
                console.log('Voice section dependencies loaded');
                this.initialized = true;
            })
            .catch(error => {
                console.error('Failed to load voice section dependencies:', error);
            });
            
        // No auto-connection on page load
    }

    async loadDependencies() {
        if (typeof VideoSDK === 'undefined') {
            await this.loadScript('https://sdk.videosdk.live/js-sdk/0.2.7/videosdk.js');
        }
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const existingScript = document.querySelector(`script[src="${src}"]`);
            if (existingScript) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            
            script.onload = () => {
                resolve();
            };
            
            script.onerror = (error) => {
                reject(new Error(`Failed to load script: ${src}`));
            };
            
            document.head.appendChild(script);
        });
    }

    async waitForVoiceManager(maxAttempts = 20) {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const checkManager = () => {
                if (window.voiceManager) {
                    resolve(window.voiceManager);
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Voice manager initialization timeout'));
                } else {
                    attempts++;
                    setTimeout(checkManager, 500);
                }
            };
            checkManager();
        });
    }
    
    setupEventListeners() {
        if (!this.elements.joinBtn) {
            console.warn("Join button not found, can't set up event listeners");
            return;
        }
        
        // Clone and replace to avoid duplicate event listeners
        const oldJoinBtn = this.elements.joinBtn;
        const newJoinBtn = oldJoinBtn.cloneNode(true);
        oldJoinBtn.parentNode.replaceChild(newJoinBtn, oldJoinBtn);
        this.elements.joinBtn = newJoinBtn;
        
        this.elements.joinBtn.addEventListener('click', async (e) => {
            if (this.elements.joinBtn.getAttribute('data-processing') === 'true') {
                return;
            }
            
            this.elements.joinBtn.setAttribute('data-processing', 'true');
            
            const btnSpan = this.elements.joinBtn.querySelector('span');
            if (btnSpan) {
                const icon = btnSpan.querySelector('i');
                btnSpan.textContent = 'Connecting...';
                if (icon) {
                    btnSpan.prepend(icon);
                }
            } else {
                this.elements.joinBtn.textContent = 'Connecting...';
            }
            
            if (this.elements.joinView) {
                this.elements.joinView.classList.add('hidden');
            }
            
            if (this.elements.connectingView) {
                this.elements.connectingView.classList.remove('hidden');
            }
            
            try {
                await this.waitForVoiceManager();
                await this.connectToVoice();
            } catch (error) {
                console.error('Error connecting to voice:', error);
                this.handleConnectionError();
            }
        });
        
        window.addEventListener('voiceConnect', (event) => {
            const details = event.detail || {};
            
            if (this.elements.connectingView) {
                this.elements.connectingView.classList.add('hidden');
            }
            
            if (this.elements.joinView) {
                this.elements.joinView.classList.add('hidden');
            }
            
            if (this.elements.videoGrid) {
                this.elements.videoGrid.classList.remove('hidden');
            }
            
            if (this.elements.voiceControls) {
                this.elements.voiceControls.classList.remove('hidden');
            }
            
            window.voiceState.isConnected = true;
            
            if (this.elements.joinBtn) {
                this.elements.joinBtn.removeAttribute('data-processing');
                this.elements.joinBtn.style.pointerEvents = 'auto';
                this.elements.joinBtn.style.cursor = 'pointer';
                this.elements.joinBtn.textContent = 'Connected';
            }
            
            if (details.channelName) {
                this.updateChannelNames(details.channelName);
            }
            
            // Show and update the voice indicator
            if (this.elements.voiceIndicator) {
                this.elements.voiceIndicator.style.display = 'block';
                this.elements.voiceIndicator.classList.remove('scale-0', 'opacity-0');
                
                // Update channel name in voice indicator if applicable
                const channelNameEl = this.elements.voiceIndicator.querySelector('.channel-name');
                if (channelNameEl && details.channelName) {
                    channelNameEl.textContent = details.channelName.length > 10 
                        ? details.channelName.substring(0, 8) + '...' 
                        : details.channelName;
                }
                
                // Initialize duration timer if it exists
                const durationEl = this.elements.voiceIndicator.querySelector('.connection-duration');
                if (durationEl) {
                    this.connectionStartTime = Date.now();
                    if (this.durationInterval) {
                        clearInterval(this.durationInterval);
                    }
                    
                    this.durationInterval = setInterval(() => {
                        if (!this.connectionStartTime || !durationEl) return;
                        
                        const duration = Math.floor((Date.now() - this.connectionStartTime) / 1000);
                        const minutes = Math.floor(duration / 60);
                        const seconds = duration % 60;
                        
                        durationEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                    }, 1000);
                }
            }
            
            if (details.meetingId && details.channelName) {
                localStorage.setItem("voiceConnectionState", JSON.stringify({
                    isConnected: true,
                    channelName: details.channelName,
                    meetingId: details.meetingId,
                    currentChannelId: details.channelId,
                    connectionTime: Date.now()
                }));
            }
        });
        
        window.addEventListener('voiceDisconnect', () => {
            if (this.elements.videoGrid) {
                this.elements.videoGrid.classList.add('hidden');
            }
            
            if (this.elements.connectingView) {
                this.elements.connectingView.classList.add('hidden');
            }
            
            if (this.elements.joinView) {
                this.elements.joinView.classList.remove('hidden');
            }
            
            if (this.elements.voiceControls) {
                this.elements.voiceControls.classList.add('hidden');
            }
            
            if (this.elements.joinBtn) {
                this.elements.joinBtn.removeAttribute('data-processing');
                this.elements.joinBtn.style.pointerEvents = 'auto';
                this.elements.joinBtn.style.cursor = 'pointer';
                this.elements.joinBtn.textContent = 'Join Voice';
            }
            
            // Hide voice indicator
            if (this.elements.voiceIndicator) {
                this.elements.voiceIndicator.classList.add('scale-0', 'opacity-0');
                setTimeout(() => {
                    if (this.elements.voiceIndicator) {
                        this.elements.voiceIndicator.style.display = 'none';
                    }
                }, 300);
                
                // Clear duration timer
                if (this.durationInterval) {
                    clearInterval(this.durationInterval);
                    this.durationInterval = null;
                }
                this.connectionStartTime = null;
            }
            
            window.voiceState.isConnected = false;
            localStorage.removeItem("voiceConnectionState");
        });
    }
    
    async connectToVoice() {
        const voiceManager = await this.waitForVoiceManager();
        if (!voiceManager) {
            throw new Error('Voice manager not available');
        }

        try {
            if (this.elements.connectingView) {
                this.elements.connectingView.classList.remove('hidden');
            }
            if (this.elements.joinView) {
                this.elements.joinView.classList.add('hidden');
            }
            
            let attempts = 0;
            const maxAttempts = 3;
            
            while (attempts < maxAttempts) {
                try {
                    attempts++;
                    await voiceManager.joinVoice();
                    return; 
                } catch (error) {
                    console.error(`Connection attempt ${attempts} failed:`, error);
                    
                    if (attempts >= maxAttempts) {
                        throw error; 
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        } catch (error) {
            console.error('Connection error:', error);
            throw error;
        }
    }
    
    handleConnectionError() {
        console.error('Connection error occurred');
        
        if (this.elements.joinBtn) {
            this.elements.joinBtn.removeAttribute('data-processing');
            this.elements.joinBtn.style.pointerEvents = 'auto';
            this.elements.joinBtn.style.cursor = 'pointer';
            this.elements.joinBtn.textContent = 'Join Voice';
        }
        
        if (this.elements.joinView) {
            this.elements.joinView.classList.remove('hidden');
        }
        
        if (this.elements.connectingView) {
            this.elements.connectingView.classList.add('hidden');
        }
        
        if (this.elements.voiceControls) {
            this.elements.voiceControls.classList.add('hidden');
        }
        
        if (typeof window.showToast === 'function') {
            window.showToast('Failed to connect to voice', 'error', 3000);
        }
        
        localStorage.removeItem("voiceConnectionState");
    }
    
    checkExistingConnection() {
        const savedState = localStorage.getItem("voiceConnectionState");
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                const currentChannelId = document.querySelector('meta[name="channel-id"]')?.content;
                
                if (state.isConnected && state.currentChannelId === currentChannelId) {
                    if (this.elements.joinView) {
                        this.elements.joinView.classList.add('hidden');
                    }
                    
                    if (this.elements.connectingView) {
                        this.elements.connectingView.classList.remove('hidden');
                    }
                    
                    if (this.elements.joinBtn) {
                        this.elements.joinBtn.disabled = true;
                        this.elements.joinBtn.textContent = 'Connecting...';
                    }
                    
                    if (state.channelName) {
                        this.updateChannelNames(state.channelName);
                        
                        if (this.elements.voiceIndicator) {
                            const durationEl = this.elements.voiceIndicator.querySelector('.connection-duration');
                            if (durationEl && state.connectionTime) {
                                const duration = Math.floor((Date.now() - state.connectionTime) / 1000);
                                const minutes = Math.floor(duration / 60);
                                const seconds = duration % 60;
                                durationEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                            }
                        }
                    }
                    
                    this.waitForVoiceManager().then(() => {
                        this.connectToVoice().catch(error => {
                            console.error('Error auto-connecting to voice:', error);
                            this.handleConnectionError();
                        });
                    }).catch(error => {
                        console.error('Failed to initialize voice manager for auto-connect:', error);
                        this.handleConnectionError();
                    });
                }
            } catch (error) {
                console.error('Error parsing saved voice connection state:', error);
                localStorage.removeItem("voiceConnectionState");
            }
        }
    }
    
    checkForAutoJoin() {
        const forceAutoJoin = sessionStorage.getItem('forceAutoJoin') === 'true';
        const autoJoinChannelId = localStorage.getItem('autoJoinVoiceChannel');
        const currentChannelId = document.querySelector('meta[name="channel-id"]')?.content;
        
        if (forceAutoJoin && autoJoinChannelId && autoJoinChannelId === currentChannelId) {
            sessionStorage.removeItem('forceAutoJoin');
            
            setTimeout(() => {
                if (this.elements.joinBtn && !window.voiceState.isConnected) {
                    this.elements.joinBtn.click();
                }
            }, 500);
        }
    }
    
    updateChannelNames(channelName) {
        const channelNameElements = document.querySelectorAll('.channel-name, .voice-ind-title');
        channelNameElements.forEach(el => {
            if (el.classList.contains('channel-name')) {
                el.textContent = channelName.length > 10 
                    ? channelName.substring(0, 8) + '...' 
                    : channelName;
            } else {
                el.textContent = channelName;
            }
        });
    }
    
    autoJoin() {
        if (this.elements.joinBtn && !window.voiceState.isConnected) {
            const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            this.elements.joinBtn.dispatchEvent(clickEvent);
            return true;
        }
        return false;
    }

    resetState() {
        console.log("⚠️ Voice section reset triggered");
        
        // Clear any running intervals
        if (this.durationInterval) {
            clearInterval(this.durationInterval);
            this.durationInterval = null;
        }
        
        // Set initialization state back to initial
        this.connectionStartTime = null;
        this.initializationAttempts = 0;
        this.initialized = false;
        
        // Clear references to DOM elements
        this.elements = {
            joinBtn: null,
            joinView: null,
            connectingView: null,
            videoGrid: null,
            voiceControls: null,
            voiceIndicator: null
        };
        
        // Re-initialize after a short delay to let the DOM update
        console.log("🔄 Re-initializing voice section after reset");
        setTimeout(() => {
            this.findElements();
            this.init();
        }, 300);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    if (!window.voiceSection) {
        window.voiceSection = new VoiceSection();
    }
});

window.initializeVoiceUI = async function() {
    if (!window.voiceSection) {
        window.voiceSection = new VoiceSection();
    } else {
        window.voiceSection.findElements();
        await window.voiceSection.init();
    }
};

window.triggerVoiceAutoJoin = function() {
    if (window.voiceSection) {
        return window.voiceSection.autoJoin();
    }
    return false;
};

window.handleAutoJoin = function() {
    const joinBtn = document.getElementById('joinBtn');
    if (joinBtn && !window.voiceState?.isConnected) {
        const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        joinBtn.dispatchEvent(clickEvent);
        return true;
    }
    return false;
}; 