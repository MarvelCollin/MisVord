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
            return true;
        }

        if (this.loadingPromises.has(src)) {
            return await this.loadingPromises.get(src);
        }

        const promise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            
            script.onload = () => {
                this.loadedScripts.add(src);
                console.log(`✅ Loaded: ${src.split('/').pop()}`);
                resolve(true);
            };
            
            script.onerror = () => {
                console.error(`❌ Failed to load: ${src}`);
                reject(new Error(`Failed to load ${src}`));
            };
            
            document.head.appendChild(script);
        });

        this.loadingPromises.set(src, promise);
        return await promise;
    }

    async loadAllDependencies() {
        console.log('🔄 Loading voice dependencies...');
        
        try {
            for (const dependency of this.dependencies) {
                await this.loadScript(dependency);
            }

            await this.waitForDependencies();
            console.log('✅ All voice dependencies loaded');
            return true;
        } catch (error) {
            console.error('❌ Failed to load voice dependencies:', error);
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

window.voiceDependencyLoader = new VoiceDependencyLoader();

window.ensureVoiceReady = async function() {
    if (window.voiceDependencyLoader.isReady()) {
        return true;
    }
    
    return await window.voiceDependencyLoader.loadAllDependencies();
}; 