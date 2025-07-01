export async function initializeServerPage() {
    console.log('[Server Init] Starting comprehensive server page initialization');
    
    try {
        await initializeServerDropdown();
        await initializeChatSystems();
        await initializeVoiceSystems();
        await initializeChannelSystems();
        await initializeActivitySystems();
        await initializeInlineFeatures();
        
        console.log('[Server Init] ✅ All server systems initialized successfully');
    } catch (error) {
        console.error('[Server Init] ❌ Initialization failed:', error);
    }
}

async function initializeServerDropdown() {
    console.log('[Server Init] Initializing server dropdown');
    
    if (typeof window.initServerDropdown === 'function') {
        try {
            await window.initServerDropdown();
            console.log('[Server Init] ✅ Server dropdown initialized');
        } catch (error) {
            console.error('[Server Init] Server dropdown error:', error);
        }
    }
}

async function initializeChatSystems() {
    console.log('[Server Init] Chat systems handled by main chat component');
    
    setupChatInlineFeatures();
}

async function initializeVoiceSystems() {
    console.log('[Server Init] Initializing voice systems');
    
    if (typeof window.initializeVoiceSection === 'function') {
        try {
            window.initializeVoiceSection();
            console.log('[Server Init] ✅ Voice section initialized');
        } catch (error) {
            console.error('[Server Init] Voice section error:', error);
        }
    }
    
    setupVoiceEventListeners();
    setupVoiceManager();
}

async function initializeChannelSystems() {
    console.log('[Server Init] Initializing channel systems');
    
    if (window.SimpleChannelSwitcher && !window.simpleChannelSwitcher) {
        try {
            new window.SimpleChannelSwitcher();
            console.log('[Server Init] ✅ Channel switcher initialized');
        } catch (error) {
            console.error('[Server Init] Channel switcher error:', error);
        }
    }
    
    if (typeof window.initChannelManager === 'function') {
        try {
            window.initChannelManager();
            console.log('[Server Init] ✅ Channel manager initialized');
        } catch (error) {
            console.error('[Server Init] Channel manager error:', error);
        }
    }
}

async function initializeActivitySystems() {
    console.log('[Server Init] Initializing activity systems');
    
    const currentPage = document.body.getAttribute('data-page');
    if (currentPage === 'server' && typeof window.ActivityManager === 'function') {
        try {
            if (!window.activityManager) {
                window.activityManager = new window.ActivityManager();
                console.log('[Server Init] ✅ Activity manager initialized');
            }
        } catch (error) {
            console.error('[Server Init] Activity manager error:', error);
        }
    }
}

function setupChatInlineFeatures() {
    console.log('[Server Init] Setting up chat inline features');
    
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        const existingListeners = messageInput.getAttribute('data-listeners-attached');
        if (!existingListeners) {
            messageInput.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = (this.scrollHeight) + 'px';
            });
            messageInput.setAttribute('data-listeners-attached', 'true');
            console.log('[Server Init] ✅ Message input auto-resize attached');
        }
    }
    
    const fileUploadButton = document.getElementById('file-upload-button');
    const fileUploadInput = document.getElementById('file-upload');
    
    if (fileUploadButton && fileUploadInput) {
        const existingListeners = fileUploadButton.getAttribute('data-listeners-attached');
        if (!existingListeners && !window.chatSection) {
            fileUploadButton.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('📎 File upload button clicked (fallback)');
                fileUploadInput.click();
            });
            fileUploadButton.setAttribute('data-listeners-attached', 'true');
            console.log('[Server Init] ✅ File upload button attached');
        }
    }
}

function setupVoiceEventListeners() {
    console.log('[Server Init] Setting up voice event listeners');
    
    const voiceConnectHandler = function() {
        console.log('[Voice Section] Voice connect event received');
        document.getElementById('voice-not-join-container')?.classList.add('hidden');
        document.getElementById('voice-call-container')?.classList.remove('hidden');
    };
    
    const voiceDisconnectHandler = function() {
        console.log('[Voice Section] Voice disconnect event received');
        document.getElementById('voice-not-join-container')?.classList.remove('hidden');
        document.getElementById('voice-call-container')?.classList.add('hidden');
    };
    
    if (!window.serverVoiceEventListeners) {
        window.addEventListener('voiceConnect', voiceConnectHandler);
        window.addEventListener('voiceDisconnect', voiceDisconnectHandler);
        window.serverVoiceEventListeners = true;
        console.log('[Server Init] ✅ Voice event listeners attached');
    } else {
        console.log('[Server Init] ✅ Voice event listeners already attached');
    }
}

function setupVoiceManager() {
    console.log('[Server Init] Setting up voice manager');
    
    setTimeout(() => {
        if (window.voiceManager && typeof window.voiceManager.setupVoice === 'function') {
            const channelIdMeta = document.querySelector('meta[name="channel-id"]');
            const channelId = channelIdMeta?.getAttribute('content');
            if (channelId) {
                console.log('[Server Init] Setting up voice manager for channel:', channelId);
                try {
                    window.voiceManager.setupVoice(channelId);
                    console.log('[Server Init] ✅ Voice manager setup completed');
                } catch (error) {
                    console.error('[Server Init] Voice manager setup error:', error);
                }
            }
        }
        
        if (window.VoiceSection && !window.voiceSection) {
            try {
                window.voiceSection = new window.VoiceSection();
                console.log('[Server Init] ✅ Voice section instance created');
            } catch (error) {
                console.error('[Server Init] Voice section instance error:', error);
            }
        }
    }, 100);
}

async function initializeInlineFeatures() {
    console.log('[Server Init] Initializing additional inline features');
    
    dispatchCustomEvents();
    initializeUserProfileComponents();
    
    console.log('[Server Init] ✅ Inline features initialized');
}

function initializeUserProfileComponents() {
    console.log('[Server Init] 🎯 Initializing user profile components...');
    
    if (typeof window.initializeUserProfileVoiceControls === 'function') {
        try {
            window.initializeUserProfileVoiceControls();
            console.log('[Server Init] ✅ User profile voice controls initialized');
        } catch (error) {
            console.error('[Server Init] ❌ Failed to initialize user profile voice controls:', error);
        }
    } else {
        console.error('[Server Init] ❌ CRITICAL: initializeUserProfileVoiceControls function not available');
        console.error('[Server Init] Available window functions:', Object.keys(window).filter(key => key.includes('Profile') || key.includes('Voice')));
    }
}

function dispatchCustomEvents() {
    setTimeout(() => {
        const channelContentEvent = new CustomEvent('channelContentLoaded', {
            detail: {
                type: 'chat',
                channelId: document.querySelector('meta[name="channel-id"]')?.getAttribute('content')
            }
        });
        document.dispatchEvent(channelContentEvent);
        console.log('[Server Init] ✅ Custom events dispatched');
    }, 50);
}

window.initializeServerPage = initializeServerPage; 