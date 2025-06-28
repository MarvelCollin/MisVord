class VoiceSection {
    constructor() {
        this.elements = {
            joinBtn: document.getElementById('joinBtn'),
            joinView: document.getElementById('joinView'),
            connectingView: document.getElementById('connectingView'),
            connectedView: document.getElementById('connectedView'),
            voiceControls: document.getElementById('voiceControls'),
            voiceIndicator: document.getElementById('voice-indicator')
        };
        
        this.durationInterval = null;
        this.connectionStartTime = null;
        this.initializationAttempts = 0;
        this.maxInitAttempts = 10;
        
        this.init();
    }
    
    init() {
        if (!this.elements.joinBtn) {
            if (this.initializationAttempts < this.maxInitAttempts) {
                this.initializationAttempts++;
                setTimeout(() => this.init(), 200);
            }
            return;
        }
        
        if (!window.voiceState) {
            window.voiceState = { isConnected: false };
        }
        
        // Ensure VideoSDK is loaded
        this.loadDependencies().then(() => {
            // Wait for voice manager to be available
            this.waitForVoiceManager().then(() => {
                this.setupEventListeners();
                this.checkExistingConnection();
            }).catch(error => {
                console.error('Failed to initialize voice manager:', error);
            });
        }).catch(error => {
            console.error('Failed to load dependencies:', error);
        });
    }

    async loadDependencies() {
        // Load VideoSDK if not already loaded
        if (typeof VideoSDK === 'undefined') {
            await this.loadScript('https://sdk.videosdk.live/js-sdk/0.2.7/videosdk.js');
            console.log('✅ VideoSDK script loaded');
        }
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            console.log(`Loading script: ${src}`);
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            
            script.onload = () => {
                console.log(`✅ Script loaded: ${src}`);
                resolve();
            };
            
            script.onerror = (error) => {
                console.error(`❌ Failed to load script: ${src}`, error);
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
                    console.log('✅ Voice manager found');
                    resolve(window.voiceManager);
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Voice manager initialization timeout'));
                } else {
                    attempts++;
                    console.log('⏳ Waiting for voice manager...', attempts);
                    setTimeout(checkManager, 500);
                }
            };
            checkManager();
        });
    }
    
    setupEventListeners() {
        if (!this.elements.joinBtn) return;
        
        this.elements.joinBtn.onclick = async () => {
            console.log('🎯 Join button clicked');
            this.elements.joinBtn.disabled = true;
            this.elements.joinBtn.textContent = 'Connecting...';
            this.elements.joinView.classList.add('hidden');
            this.elements.connectingView.classList.remove('hidden');
            
            try {
                // Make sure voice manager is available before trying to connect
                await this.waitForVoiceManager();
                await this.connectToVoice();
            } catch (error) {
                console.error('❌ Error connecting to voice:', error);
                this.handleConnectionError();
            }
        };
        
        window.addEventListener('voiceConnect', (event) => {
            console.log('📡 Voice connect event received:', event.detail);
            const details = event.detail || {};
            
            this.elements.connectingView.classList.add('hidden');
            this.elements.joinView.classList.add('hidden');
            this.elements.connectedView.classList.remove('hidden');
            this.elements.voiceControls.classList.remove('hidden');
            window.voiceState.isConnected = true;
            this.elements.joinBtn.disabled = false;
            this.elements.joinBtn.textContent = 'Connected';
            
            if (details.channelName) {
                this.updateChannelNames(details.channelName);
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
            this.elements.connectedView.classList.add('hidden');
            this.elements.connectingView.classList.add('hidden');
            this.elements.joinView.classList.remove('hidden');
            this.elements.voiceControls.classList.add('hidden');
            this.elements.joinBtn.disabled = false;
            this.elements.joinBtn.textContent = 'Join Voice';
            window.voiceState.isConnected = false;
            localStorage.removeItem("voiceConnectionState");
        });
    }
    
    async connectToVoice() {
        const voiceManager = await this.waitForVoiceManager();
        if (!voiceManager) {
            console.error('❌ Voice manager not available');
            throw new Error('Voice manager not available');
        }

        try {
            // Set UI to connecting state
            if (this.elements.connectingView) {
                this.elements.connectingView.classList.remove('hidden');
            }
            if (this.elements.joinView) {
                this.elements.joinView.classList.add('hidden');
            }
            
            // Try to join voice with retry logic
            let attempts = 0;
            const maxAttempts = 3;
            
            while (attempts < maxAttempts) {
                try {
                    attempts++;
                    console.log(`Attempting to connect to voice (attempt ${attempts}/${maxAttempts})`);
                    await voiceManager.joinVoice();
                    return; // Success, exit the function
                } catch (error) {
                    console.error(`❌ Connection attempt ${attempts} failed:`, error);
                    
                    if (attempts >= maxAttempts) {
                        throw error; // Rethrow the error after all attempts failed
                    }
                    
                    // Wait before retrying
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        } catch (error) {
            console.error('❌ Connection error:', error);
            throw error;
        }
    }
    
    handleConnectionError() {
        console.error('❌ Connection error occurred');
        this.elements.joinBtn.disabled = false;
        this.elements.joinBtn.textContent = 'Join Voice';
        this.elements.joinView.classList.remove('hidden');
        this.elements.connectingView.classList.add('hidden');
        this.elements.voiceControls.classList.add('hidden');
        window.showToast?.('Failed to connect to voice', 'error', 3000);
        localStorage.removeItem("voiceConnectionState");
    }
    
    checkExistingConnection() {
        const savedState = localStorage.getItem("voiceConnectionState");
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                const currentChannelId = document.querySelector('meta[name="channel-id"]')?.content;
                
                if (state.isConnected && state.currentChannelId === currentChannelId) {
                    this.elements.joinView.classList.add('hidden');
                    this.elements.connectingView.classList.remove('hidden');
                    this.elements.joinBtn.disabled = true;
                    this.elements.joinBtn.textContent = 'Connecting...';
                    
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
                    
                    // Wait for voice manager to be available before attempting reconnection
                    this.waitForVoiceManager().then(() => {
                        this.connectToVoice().catch(error => {
                            console.error('❌ Error auto-connecting to voice:', error);
                            this.handleConnectionError();
                        });
                    }).catch(error => {
                        console.error('❌ Failed to initialize voice manager for auto-connect:', error);
                        this.handleConnectionError();
                    });
                }
            } catch (error) {
                console.error('❌ Error parsing saved voice connection state:', error);
                localStorage.removeItem("voiceConnectionState");
            }
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
}

// Initialize voice section after DOM is loaded and make sure voice manager is loaded first
document.addEventListener('DOMContentLoaded', async function() {
    // Load VideoSDK first
    if (typeof VideoSDK === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://sdk.videosdk.live/js-sdk/0.2.7/videosdk.js';
        script.async = true;
        document.head.appendChild(script);
        
        script.onload = () => {
            console.log('✅ VideoSDK loaded from voice section');
            // Now initialize voice section
            window.voiceSection = new VoiceSection();
        };
    } else {
        // VideoSDK already loaded, just initialize voice section
        window.voiceSection = new VoiceSection();
    }
});

window.initializeVoiceUI = async function() {
    if (!window.voiceSection) {
        window.voiceSection = new VoiceSection();
    } else {
        await window.voiceSection.init();
    }
}; 