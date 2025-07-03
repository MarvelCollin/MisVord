window.waitForVideoSDKReady = async function(timeout = 10000) {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new Error('Timeout waiting for VideoSDK to be fully ready'));
        }, timeout);
        
        const checkReady = () => {
            if (window.videoSDKManager && window.videoSDKManager.isReady()) {
                clearTimeout(timeoutId);
                resolve();
                return;
            }
            setTimeout(checkReady, 200);
        };
        
        if (window.videoSDKManager && window.videoSDKManager.isReady()) {
            clearTimeout(timeoutId);
            resolve();
        } else {
            const onMeetingReady = () => {
                clearTimeout(timeoutId);
                window.removeEventListener('videosdkMeetingFullyJoined', onMeetingReady);
                resolve();
            };
            
            window.addEventListener('videosdkMeetingFullyJoined', onMeetingReady);
            checkReady();
        }
    });
};

window.waitForVoiceManager = async function(maxAttempts = 15) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const checkManager = () => {
            if (window.voiceManager) {
                resolve(window.voiceManager);
            } else if (attempts >= maxAttempts) {
                reject(new Error('Voice manager initialization timeout'));
            } else {
                attempts++;
                setTimeout(checkManager, 300);
            }
        };
        checkManager();
    });
};

window.loadVoiceScript = async function(src) {
    return new Promise((resolve, reject) => {
        const scriptPath = src.split('?')[0];
        const existingScript = document.querySelector(`script[src*="${scriptPath.split('/').pop()}"]`);
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
        script.onerror = () => {
            reject(new Error(`Failed to load ${src}`));
        };
        document.head.appendChild(script);
    });
}; 