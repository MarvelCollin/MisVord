if (typeof window.VoiceDependencyLoader === 'undefined') {
class VoiceDependencyLoader {
    constructor() {
        this.loadedScripts = new Set();
        this.loadingPromises = new Map();
        this.dependencies = [
            '/public/js/components/voice/voice-events.js',
            '/public/js/utils/voice-utils.js',
            'https://sdk.videosdk.live/js-sdk/0.2.7/videosdk.js',
            '/public/js/components/videosdk/videosdk.js',
            '/public/js/components/voice/voice-manager.js',
            '/public/js/components/voice/voice-section.js'
        ];
    }

    async loadScript(src) {
        if (this.loadedScripts.has(src)) {
            console.log(`[VoiceDependencyLoader] Script already loaded: ${src}`);
            return true;
        }

        if (this.loadingPromises.has(src)) {
            console.log(`[VoiceDependencyLoader] Script loading in progress: ${src}`);
            return await this.loadingPromises.get(src);
        }

        console.log(`[VoiceDependencyLoader] Loading script: ${src}`);
        
        const promise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            
            script.onload = () => {
                console.log(`[VoiceDependencyLoader] Successfully loaded: ${src}`);
                this.loadedScripts.add(src);
                resolve(true);
            };
            
            script.onerror = () => {
                console.error(`[VoiceDependencyLoader] Failed to load: ${src}`);
                reject(new Error(`Failed to load ${src}`));
            };
            
            document.head.appendChild(script);
        });

        this.loadingPromises.set(src, promise);
        return await promise;
    }

    async loadAllDependencies() {
        try {
            for (const dependency of this.dependencies) {
                await this.loadScript(dependency);
            }

            await this.waitForDependencies();
            return true;
        } catch (error) {
            throw error;
        }
    }

    async waitForDependencies() {
        return new Promise((resolve) => {
            const check = () => {
                if (
                    window.VOICE_EVENTS &&
                    window.loadVoiceScript &&
                    window.waitForVideoSDKReady &&
                    typeof VideoSDK !== 'undefined' &&
                    window.videoSDKManager &&
                    window.voiceManager &&
                    window.VoiceSection
                ) {
                    resolve();
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    }

    isReady() {
        return (
            window.VOICE_EVENTS &&
            window.loadVoiceScript &&
            window.waitForVideoSDKReady &&
            typeof VideoSDK !== 'undefined' &&
            window.videoSDKManager &&
            window.voiceManager &&
            window.VoiceSection
        );
    }
}

window.VoiceDependencyLoader = VoiceDependencyLoader;
}

if (!window.voiceDependencyLoader) {
    window.voiceDependencyLoader = new VoiceDependencyLoader();
}

window.ensureVoiceReady = async function() {
    if (window.voiceDependencyLoader.isReady()) {
        return true;
    }
    
    return await window.voiceDependencyLoader.loadAllDependencies();
}; 