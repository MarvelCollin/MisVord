export function ajax(options = {}) {
    if (!options || typeof options !== 'object') {
        throw new Error('ajax: options must be an object');
    }

    let {
        url = '',
        method = options.type || 'GET',
        data = null,
        headers = {},
        dataType = 'json',
        beforeSend,
        success,
        error,
        complete
    } = options;

    method = method.toUpperCase();

    
    if ((method === 'GET' || method === 'HEAD') && data && typeof data === 'object') {
        const queryString = new URLSearchParams(data).toString();
        url += (url.includes('?') ? '&' : '?') + queryString;
        data = null; 
    }

    const fetchHeaders = { ...headers };

    
    if (data && !fetchHeaders['Content-Type'] && method !== 'GET' && method !== 'HEAD') {
        fetchHeaders['Content-Type'] = 'application/json';
    }

    let body = null;
    if (data && method !== 'GET' && method !== 'HEAD') {
        if (fetchHeaders['Content-Type'] === 'application/json' && typeof data === 'string') {
            body = data; 
        } else if (fetchHeaders['Content-Type'] === 'application/json') {
            body = JSON.stringify(data);
        } else {
            body = data; 
        }
    }

    
    if (typeof beforeSend === 'function') {
        try { beforeSend(); } catch (_) {}
    }

    const handleVoiceChannelContent = (content) => {
        console.log("Voice channel content detected, initializing components");
        
        // Reset voice components if they exist
        if (window.voiceSection) {
            window.voiceSection.resetState();
        }
        if (window.voiceManager) {
            window.voiceManager.resetState();
        }
        
        // Re-initialize voice components after content update with increased timeout
        setTimeout(() => {
            console.log("Initializing voice components");
            
            if (window.voiceSection) {
                try {
                    window.voiceSection.init();
                } catch (e) {
                    console.error("Error initializing voice section:", e);
                }
            }
            
            // Initialize voice tools with retry mechanism
            const initializeTools = (attempts = 0) => {
                console.log(`Attempting to initialize voice tools (attempt ${attempts + 1})`);
                
                if (typeof window.initializeVoiceTools === 'function') {
                    try {
                        window.initializeVoiceTools();
                        
                        // Check if voice state manager exists, if not retry
                        if (!window.voiceStateManager && attempts < 3) {
                            console.log("Voice state manager not found, retrying...");
                            setTimeout(() => initializeTools(attempts + 1), 500);
                        }
                    } catch (e) {
                        console.error("Error initializing voice tools:", e);
                        if (attempts < 3) {
                            setTimeout(() => initializeTools(attempts + 1), 500);
                        }
                    }
                } else if (attempts < 3) {
                    console.log("initializeVoiceTools function not available yet, retrying...");
                    setTimeout(() => initializeTools(attempts + 1), 500);
                }
            };
            
            initializeTools();
            
            // Make sure voice controls are visible if we're already connected
            if (window.voiceState && window.voiceState.isConnected) {
                const voiceControls = document.getElementById('voiceControls');
                const videoGrid = document.getElementById('videoGrid');
                const joinView = document.getElementById('joinView');
                
                if (voiceControls) voiceControls.classList.remove('hidden');
                if (videoGrid) videoGrid.classList.remove('hidden');
                if (joinView) joinView.classList.add('hidden');
            }
        }, 300);
        
        return content;
    };

    return fetch(url, { method, headers: fetchHeaders, body })
        .then(async (response) => {
            
            const responseClone = response.clone();
            
            let parsed;
            try {
                if (dataType === 'text') {
                    parsed = await response.text();
                } else if (dataType === 'blob') {
                    parsed = await response.blob();
                } else {
                    
                    try {
                        parsed = await response.json();
                    } catch (jsonError) {
                        const text = await response.text();
                        // Check if response contains voice channel content
                        if (text.includes('voice-container') || 
                            text.includes('voice-section') || 
                            text.includes('voice-indicator') ||
                            text.includes('voice-tool')) {
                            parsed = handleVoiceChannelContent(text);
                        }
                        parsed = text;
                    }
                }
            } catch (error) {
                
                const text = await responseClone.text();
                if (text.includes('voice-container') || 
                    text.includes('voice-section') || 
                    text.includes('voice-indicator') ||
                    text.includes('voice-tool')) {
                    parsed = handleVoiceChannelContent(text);
                } else {
                    throw new Error('Failed to parse response: ' + error.message);
                }
            }

            if (!response.ok) {
                const err = new Error(`HTTP ${response.status}`);
                if (typeof error === 'function') error(err, response);
                throw err;
            }

            if (typeof success === 'function') success(parsed, response);
            if (typeof complete === 'function') complete(response);
            return parsed;
        })
        .catch((err) => {
            if (typeof error === 'function') error(err);
            if (typeof complete === 'function') complete(null, err);
            throw err;
        });
}


if (typeof window !== 'undefined' && !window.ajax) {
    window.ajax = ajax;
} 