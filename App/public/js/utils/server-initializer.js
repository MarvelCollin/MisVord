export async function initializeServerPage() {

    
    try {
        await initializeServerDropdown();
        await initializeChatSystems();
        await initializeVoiceSystems();
        await initializeChannelSystems();
        await initializeActivitySystems();
        await initializeInlineFeatures();
        

    } catch (error) {
        console.error('[Server Init] ❌ Initialization failed:', error);
    }
}

async function initializeServerDropdown() {

    
    if (typeof window.initServerDropdown === 'function') {
        try {
            await window.initServerDropdown();

        } catch (error) {
            console.error('[Server Init] Server dropdown error:', error);
        }
    }
}

async function initializeChatSystems() {

    
    setupChatInlineFeatures();
}

async function initializeVoiceSystems() {

    
    if (typeof window.initializeVoiceSection === 'function') {
        try {
            window.initializeVoiceSection();

        } catch (error) {
            console.error('[Server Init] Voice section error:', error);
        }
    }
    
    setupVoiceEventListeners();
    setupVoiceManager();
}

async function initializeChannelSystems() {

    
    if (window.SimpleChannelSwitcher && !window.simpleChannelSwitcher) {
        try {
            new window.SimpleChannelSwitcher();

        } catch (error) {
            console.error('[Server Init] Channel switcher error:', error);
        }
    }
    
    if (typeof window.initChannelManager === 'function') {
        try {
            window.initChannelManager();

        } catch (error) {
            console.error('[Server Init] Channel manager error:', error);
        }
    }
}

async function initializeActivitySystems() {

    
    const currentPage = document.body.getAttribute('data-page');
    if (currentPage === 'server' && typeof window.ActivityManager === 'function') {
        try {
            if (!window.activityManager) {
                window.activityManager = new window.ActivityManager();

            }
        } catch (error) {
            console.error('[Server Init] Activity manager error:', error);
        }
    }
}

function setupChatInlineFeatures() {

    
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        const existingListeners = messageInput.getAttribute('data-listeners-attached');
        if (!existingListeners) {
            messageInput.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = (this.scrollHeight) + 'px';
            });
            messageInput.setAttribute('data-listeners-attached', 'true');

        }
    }
    
    const fileUploadButton = document.getElementById('file-upload-button');
    const fileUploadInput = document.getElementById('file-upload');
    
    if (fileUploadButton && fileUploadInput) {
        const existingListeners = fileUploadButton.getAttribute('data-listeners-attached');
        if (!existingListeners && !window.chatSection) {
            fileUploadButton.addEventListener('click', function(e) {
                e.preventDefault();

                fileUploadInput.click();
            });
            fileUploadButton.setAttribute('data-listeners-attached', 'true');

        }
    }
}

function setupVoiceEventListeners() {

    
    const voiceConnectHandler = function() {

        document.getElementById('voice-not-join-container')?.classList.add('hidden');
        document.getElementById('voice-call-container')?.classList.remove('hidden');
    };
    
    const voiceDisconnectHandler = function() {

        document.getElementById('voice-not-join-container')?.classList.remove('hidden');
        document.getElementById('voice-call-container')?.classList.add('hidden');
    };
    
    if (!window.serverVoiceEventListeners) {
        window.addEventListener('voiceConnect', voiceConnectHandler);
        window.addEventListener('voiceDisconnect', voiceDisconnectHandler);
        window.serverVoiceEventListeners = true;

    } else {

    }
}

function setupVoiceManager() {

    
    setTimeout(() => {
        if (window.voiceManager && typeof window.voiceManager.setupVoice === 'function') {
            const channelIdMeta = document.querySelector('meta[name="channel-id"]');
            const channelId = channelIdMeta?.getAttribute('content');
            if (channelId) {

                try {
                    window.voiceManager.setupVoice(channelId);

                } catch (error) {
                    console.error('[Server Init] Voice manager setup error:', error);
                }
            }
        }
        
        if (window.VoiceSection && !window.voiceSection) {
            try {
                window.voiceSection = new window.VoiceSection();

            } catch (error) {
                console.error('[Server Init] Voice section instance error:', error);
            }
        }
    }, 100);
}

async function initializeInlineFeatures() {

    
    dispatchCustomEvents();
    initializeUserProfileComponents();
    

}

function initializeUserProfileComponents() {

    
    if (typeof window.initializeUserProfileVoiceControls === 'function') {
        try {
            window.initializeUserProfileVoiceControls();

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

    }, 50);
}

window.initializeServerPage = initializeServerPage; 