if (typeof window.VoiceSection === 'undefined') {

// Define global voice events if not already defined
if (!window.VOICE_EVENTS) {
    window.VOICE_EVENTS = {
        VOICE_CONNECT: 'voiceConnect',
        VOICE_DISCONNECT: 'voiceDisconnect',
        VOICE_STATE_CHANGED: 'voiceStateChanged'
    };
}
    
class VoiceSection {
    constructor() {
        this.elements = {
            joinBtn: null,
            joinView: null,
            connectingView: null,
            voiceControls: null
        };
        
        this.durationInterval = null;
        this.connectionStartTime = null;
        this.initializationAttempts = 0;
        this.maxInitAttempts = 10;
        this.initialized = false;
        this.isProcessing = false;
        this.autoJoinInProgress = false;
        
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
            voiceControls: document.getElementById('voiceControls')
        };
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
                this.initialized = true;
            })
            .catch(error => {
                console.error('Failed to load voice section dependencies:', error);
            });
    }

    async loadDependencies() {
        if (typeof VideoSDK === 'undefined') {
            await window.loadVoiceScript('https://sdk.videosdk.live/js-sdk/0.2.7/videosdk.js');
        }
    }

    setupEventListeners() {
        if (!this.elements.joinBtn) {
            return;
        }
        
        if (!window.VOICE_EVENTS) {
            window.VOICE_EVENTS = {
                VOICE_CONNECT: 'voiceConnect',
                VOICE_DISCONNECT: 'voiceDisconnect',
                VOICE_STATE_CHANGED: 'voiceStateChanged'
            };
        }
        
        const oldJoinBtn = this.elements.joinBtn;
        const newJoinBtn = oldJoinBtn.cloneNode(true);
        oldJoinBtn.parentNode.replaceChild(newJoinBtn, oldJoinBtn);
        this.elements.joinBtn = newJoinBtn;
        
        this.elements.joinBtn.addEventListener('click', async (e) => {
            this.handleJoinClick();
        });
        
        window.addEventListener(window.VOICE_EVENTS.VOICE_CONNECT, (event) => {
            const details = event.detail || {};
            
            this.isProcessing = false;
            this.autoJoinInProgress = false;
            
            if (this.elements.connectingView) {
                this.elements.connectingView.classList.add('hidden');
            }
            
            if (this.elements.joinView) {
                this.elements.joinView.classList.add('hidden');
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
            
            if (window.unifiedVoiceStateManager && details.meetingId && details.channelName) {
                window.unifiedVoiceStateManager.setState({
                    isConnected: true,
                    channelName: details.channelName,
                    meetingId: details.meetingId,
                    channelId: details.channelId,
                    connectionTime: Date.now()
                });
            }
        });
        
        window.addEventListener(window.VOICE_EVENTS.VOICE_DISCONNECT, () => {
            this.isProcessing = false;
            this.autoJoinInProgress = false;
            window.voiceJoinInProgress = false;
            
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
            
            window.voiceState.isConnected = false;
            
            if (window.unifiedVoiceStateManager) {
                window.unifiedVoiceStateManager.setState({
                    isConnected: false,
                    channelId: null,
                    channelName: null,
                    meetingId: null,
                    connectionTime: null
                });
            }
        });
    }
    
    async handleJoinClick() {
        if (this.isProcessing || 
            this.elements.joinBtn?.getAttribute('data-processing') === 'true' ||
            window.voiceJoinInProgress ||
            window.voiceState?.isConnected) {
            console.log('🎧 [VOICE-SECTION] Join click ignored - already processing or connected');
            return;
        }
        
        this.isProcessing = true;
        
        if (this.elements.joinBtn) {
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
        }
        
        if (this.elements.joinView) {
            this.elements.joinView.classList.add('hidden');
        }
        
        if (this.elements.connectingView) {
            this.elements.connectingView.classList.remove('hidden');
        }
        
        try {
            await window.waitForVoiceManager();
            await this.connectToVoice();
        } catch (error) {
            this.handleConnectionError();
        } finally {
            this.isProcessing = false;
            this.autoJoinInProgress = false;
        }
    }
    
    async connectToVoice() {
        const voiceManager = await window.waitForVoiceManager();
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
            
            await voiceManager.joinVoice();
        } catch (error) {
            throw error;
        }
    }
    
    handleConnectionError() {
        this.isProcessing = false;
        this.autoJoinInProgress = false;
        
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
        
        if (window.unifiedVoiceStateManager) {
            window.unifiedVoiceStateManager.reset();
        }
    }
    
    updateChannelNames(channelName) {
        const channelNameElements = document.querySelectorAll('.voice-ind-title, .voice-channel-title, .voice-section .channel-name');
        channelNameElements.forEach(el => {
            if (el.classList.contains('channel-name') || el.classList.contains('voice-channel-title')) {
                el.textContent = channelName.length > 10 
                    ? channelName.substring(0, 8) + '...' 
                    : channelName;
            } else {
                el.textContent = channelName;
            }
        });
    }
    
    autoJoin() {
        if (this.autoJoinInProgress || this.isProcessing) {
            return false;
        }
        
        if (window.voiceState?.isConnected || 
            this.elements.joinBtn?.getAttribute('data-processing') === 'true') {
            return false;
        }
        
        if (this.elements.joinBtn) {
            this.autoJoinInProgress = true;
            this.handleJoinClick();
            return true;
        }
        return false;
    }

    resetState() {
        console.log('🔄 [VOICE-SECTION] Resetting voice section state');
        
        if (this.durationInterval) {
            clearInterval(this.durationInterval);
            this.durationInterval = null;
        }
        
        this.connectionStartTime = null;
        this.initializationAttempts = 0;
        this.isProcessing = false;
        this.autoJoinInProgress = false;
        
        if (this.elements.joinBtn) {
            this.elements.joinBtn.removeAttribute('data-processing');
            this.elements.joinBtn.style.pointerEvents = 'auto';
            this.elements.joinBtn.style.cursor = 'pointer';
            this.elements.joinBtn.textContent = 'Join Voice';
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
        
        console.log('✅ [VOICE-SECTION] State reset completed');
    }
    
    updateChannelId(channelId, forceFresh = false) {
        console.log('🔄 [VOICE-SECTION] Updating channel ID:', channelId, 'forceFresh:', forceFresh);
        
        if (forceFresh) {
            this.resetState();
        }
        
        this.currentChannelId = channelId;
        
        if (this.elements.joinBtn) {
            this.elements.joinBtn.setAttribute('data-channel-id', channelId);
        }
        
        if (forceFresh) {
            this.fetchChannelData(channelId);
        }
        
        const channelElement = document.querySelector(`[data-channel-id="${channelId}"]`);
        const channelName = channelElement?.querySelector('.channel-name')?.textContent?.trim() || 
                           channelElement?.getAttribute('data-channel-name') || 
                           'Voice Channel';
        
        this.updateChannelNames(channelName);
        
        if (window.voiceManager && window.voiceManager.isConnected) {
            if (typeof window.voiceManager.updateChannelContext === 'function') {
                window.voiceManager.updateChannelContext(channelId, channelName);
            }
        }
        
        console.log('✅ [VOICE-SECTION] Channel ID updated:', channelId);
    }
    
    async fetchChannelData(channelId) {
        try {
            console.log('📡 [VOICE-SECTION] Fetching channel data for:', channelId);
            
            const channelElement = document.querySelector(`[data-channel-id="${channelId}"]`);
            const channelName = channelElement?.querySelector('.channel-name')?.textContent?.trim() || 
                               channelElement?.getAttribute('data-channel-name') || 
                               'Voice Channel';
            
            window.currentChannelData = {
                id: channelId,
                name: channelName,
                type: 'voice'
            };
            
            this.updateChannelNames(channelName);
            console.log('✅ [VOICE-SECTION] Channel data set from DOM:', window.currentChannelData);
        } catch (error) {
            console.error('❌ [VOICE-SECTION] Error setting channel data:', error);
        }
    }
}

window.VoiceSection = VoiceSection;

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
    if (window.voiceSection) {
        return window.voiceSection.autoJoin();
    }
    
    const joinBtn = document.getElementById('joinBtn');
    if (joinBtn && !window.voiceState?.isConnected && joinBtn.getAttribute('data-processing') !== 'true') {
        joinBtn.click();
        return true;
    }
    return false;
};

} 