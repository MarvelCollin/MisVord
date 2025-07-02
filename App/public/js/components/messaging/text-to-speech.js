class TextToSpeech {
    constructor() {
        this.isSpeaking = false;
        this.voiceLoading = false;
        this.currentSpeakingMessageId = null;
        this.currentUtterance = null;
        this.currentSpeechIndicator = null;
    }

    speakMessageText(messageId) {
        console.log('[TTS] Speaking message text:', messageId);
        
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (!messageElement) {
            console.error('[TTS] Message element not found for ID:', messageId);
            return;
        }
        
        console.log('[TTS] Found message element:', messageElement);
        
        const textElement = messageElement.querySelector('.bubble-message-text, .message-main-text');
        if (!textElement) {
            console.error('[TTS] Message text element not found in:', messageElement);
            console.log('[TTS] Available text elements:', {
                bubbleText: messageElement.querySelector('.bubble-message-text'),
                mainText: messageElement.querySelector('.message-main-text'),
                allTextDivs: messageElement.querySelectorAll('div'),
                messageContent: messageElement.textContent
            });
            return;
        }
        
        console.log('[TTS] Found text element:', textElement);
        console.log('[TTS] Text element content:', {
            textContent: textElement.textContent,
            innerText: textElement.innerText,
            innerHTML: textElement.innerHTML
        });
        
        let messageText = textElement.textContent || textElement.innerText || '';
        
        if (!messageText || messageText.trim() === '') {
            console.warn('[TTS] No text content found, trying alternative extraction methods');
            
            const bubbleContent = messageElement.querySelector('.bubble-message-content');
            if (bubbleContent) {
                messageText = bubbleContent.textContent || bubbleContent.innerText || '';
                console.log('[TTS] Alternative extraction from bubble-content:', messageText);
            }
            
            if (!messageText || messageText.trim() === '') {
                messageText = messageElement.textContent || messageElement.innerText || '';
                console.log('[TTS] Alternative extraction from message element:', messageText);
            }
        }
        
        messageText = messageText.replace(/\s*\(edited\)\s*$/, '').trim();
        
        messageText = messageText.replace(/@\w+/g, '').trim();
        
        messageText = messageText.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu, '').trim();
        
        console.log('[TTS] Final processed text:', messageText);
        
        if (!messageText || messageText.length < 1) {
            console.warn('[TTS] No meaningful text content to speak');
            return;
        }
        
        if (messageText === messageId || messageText === messageId.toString()) {
            console.error('[TTS] Text content is the same as message ID, something is wrong');
            return;
        }
        
        if (!('speechSynthesis' in window)) {
            console.error('[TTS] Speech synthesis not supported');
            return;
        }
        
        if (window.speechSynthesis.speaking || this.isSpeaking || this.voiceLoading) {
            console.log('[TTS] Already speaking or loading, stopping current speech');
            this.stopAllSpeech();
            
            setTimeout(() => {
                if (!window.speechSynthesis.speaking && !this.isSpeaking && !this.voiceLoading) {
                    console.log('[TTS] Previous speech stopped, retrying...');
                    this.speakMessageText(messageId);
                }
            }, 500);
            return;
        }
        
        if (this.currentSpeakingMessageId === messageId) {
            console.log('[TTS] Same message already being processed, ignoring');
            return;
        }
        
        this.isSpeaking = true;
        this.voiceLoading = true;
        this.currentSpeakingMessageId = messageId;
        this.initializeSpeechSynthesis(messageText, messageId);
        
        const contextMenu = document.getElementById('message-context-menu');
        if (contextMenu) {
            contextMenu.classList.add('hidden');
        }
    }
    
    initializeSpeechSynthesis(text, messageId) {
        const utterance = new SpeechSynthesisUtterance(text);
        
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        utterance.lang = 'en-US';
        
        this.currentUtterance = utterance;
        this.loadVoicesAndSpeak(utterance, messageId);
    }
    
    loadVoicesAndSpeak(utterance, messageId) {
        if (!this.voiceLoading || !this.isSpeaking) {
            console.log('[TTS] Voice loading cancelled');
            return;
        }
        
        let voices = window.speechSynthesis.getVoices();
        
        if (voices.length === 0) {
            console.log('[TTS] Voices not loaded yet, waiting for voiceschanged event...');
            
            const handleVoicesChanged = () => {
                window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
                console.log('[TTS] Voices changed event received, retrying...');
                
                if (this.voiceLoading && this.isSpeaking) {
                    setTimeout(() => {
                        this.loadVoicesAndSpeak(utterance, messageId);
                    }, 100);
                }
            };
            
            window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
            
            setTimeout(() => {
                window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
                console.log('[TTS] Voice loading timeout, trying with default voice...');
                
                if (this.voiceLoading && this.isSpeaking) {
                    this.voiceLoading = false;
                    this.setupSpeechEvents(utterance, messageId);
                    this.startSpeech(utterance, messageId);
                }
            }, 3000);
            
            return;
        }
        
        console.log('[TTS] Voices available:', voices.length);
        
        const preferredVoices = [
            voices.find(voice => voice.lang === 'en-US' && voice.name.includes('Google')),
            voices.find(voice => voice.lang === 'en-US' && voice.name.includes('Microsoft')),
            voices.find(voice => voice.lang === 'en-US'),
            voices.find(voice => voice.lang.startsWith('en')),
            voices[0]
        ].filter(Boolean);
        
        if (preferredVoices.length > 0) {
            utterance.voice = preferredVoices[0];
            console.log('[TTS] Selected voice:', utterance.voice.name, utterance.voice.lang);
        } else {
            console.log('[TTS] No suitable voice found, using default');
        }
        
        this.voiceLoading = false;
        this.setupSpeechEvents(utterance, messageId);
        this.startSpeech(utterance, messageId);
    }
    
    setupSpeechEvents(utterance, messageId) {
        utterance.onstart = () => {
            console.log('[TTS] Speech started');
            this.showSpeechIndicator(messageId);
        };
        
        utterance.onend = () => {
            console.log('[TTS] Speech completed');
            this.cleanupSpeech();
        };
        
        utterance.onerror = (error) => {
            if (error.error === 'interrupted') {
                console.log('[TTS] Speech was interrupted (normal when stopping)');
            } else {
                console.error('[TTS] Speech error:', error);
            }
            this.cleanupSpeech();
        };
        
        utterance.onpause = () => {
            console.log('[TTS] Speech paused');
        };
        
        utterance.onresume = () => {
            console.log('[TTS] Speech resumed');
        };
    }
    
    startSpeech(utterance, messageId) {
        try {
            window.speechSynthesis.speak(utterance);
            console.log('[TTS] Text-to-speech initiated successfully');
        } catch (error) {
            console.error('[TTS] Failed to start speech:', error);
            this.cleanupSpeech();
        }
    }
    
    cleanupSpeech() {
        console.log('[TTS] Cleaning up speech state');
        this.isSpeaking = false;
        this.voiceLoading = false;
        this.currentSpeakingMessageId = null;
        this.currentUtterance = null;
        this.removeSpeechIndicator();
        
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
            window.speechSynthesis.cancel();
        }
    }
    
    showSpeechIndicator(messageId) {
        this.removeSpeechIndicator();
        
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (!messageElement) return;
        
        const speechIndicator = document.createElement('span');
        speechIndicator.className = 'speech-indicator';
        speechIndicator.innerHTML = `
            <i class="fas fa-volume-up text-[#5865f2] animate-pulse"></i>
            <span class="ml-1 text-xs text-[#5865f2]">Speaking...</span>
        `;
        speechIndicator.style.cssText = `
            display: inline-flex;
            align-items: center;
            margin-left: 8px;
            padding: 2px 6px;
            background: rgba(88, 101, 242, 0.1);
            border-radius: 12px;
            border: 1px solid rgba(88, 101, 242, 0.3);
        `;
        
        const messageHeader = messageElement.querySelector('.bubble-header, .message-header');
        if (messageHeader) {
            messageHeader.appendChild(speechIndicator);
        }
        
        this.currentSpeechIndicator = speechIndicator;
    }
    
    removeSpeechIndicator() {
        if (this.currentSpeechIndicator) {
            this.currentSpeechIndicator.remove();
            this.currentSpeechIndicator = null;
        }
        
        document.querySelectorAll('.speech-indicator').forEach(indicator => {
            indicator.remove();
        });
    }
    
    stopAllSpeech() {
        if (window.speechSynthesis.speaking || this.isSpeaking) {
            window.speechSynthesis.cancel();
            console.log('[TTS] All speech stopped');
        }
        this.cleanupSpeech();
    }

    isSupported() {
        return 'speechSynthesis' in window;
    }

    getStatus() {
        return {
            isSpeaking: this.isSpeaking,
            voiceLoading: this.voiceLoading,
            currentMessageId: this.currentSpeakingMessageId,
            browserSpeaking: window.speechSynthesis?.speaking || false,
            browserPending: window.speechSynthesis?.pending || false,
            browserPaused: window.speechSynthesis?.paused || false
        };
    }
}

window.TextToSpeech = TextToSpeech;

window.debugMessageStructure = function(messageId) {
    console.log('[DEBUG-TTS] Analyzing message structure for ID:', messageId);
    
    if (!messageId) {
        const messageElements = document.querySelectorAll('[data-message-id]');
        if (messageElements.length > 0) {
            messageId = messageElements[0].dataset.messageId;
            console.log('[DEBUG-TTS] Using first available message ID:', messageId);
        } else {
            console.error('[DEBUG-TTS] No messages found on page');
            return;
        }
    }
    
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!messageElement) {
        console.error('[DEBUG-TTS] Message element not found for ID:', messageId);
        return;
    }
    
    console.log('[DEBUG-TTS] Message element structure:');
    console.log('  - Element:', messageElement);
    console.log('  - Classes:', Array.from(messageElement.classList));
    console.log('  - Data attributes:', messageElement.dataset);
    
    const bubbleText = messageElement.querySelector('.bubble-message-text');
    const mainText = messageElement.querySelector('.message-main-text');
    
    console.log('[DEBUG-TTS] Text elements found:');
    console.log('  - Bubble text element:', bubbleText);
    console.log('  - Main text element:', mainText);
    
    if (bubbleText) {
        console.log('[DEBUG-TTS] Bubble text content:');
        console.log('  - innerHTML:', bubbleText.innerHTML);
        console.log('  - textContent:', bubbleText.textContent);
        console.log('  - innerText:', bubbleText.innerText);
    }
    
    if (mainText) {
        console.log('[DEBUG-TTS] Main text content:');
        console.log('  - innerHTML:', mainText.innerHTML);
        console.log('  - textContent:', mainText.textContent);
        console.log('  - innerText:', mainText.innerText);
    }
    
    console.log('[DEBUG-TTS] Overall message content:');
    console.log('  - Message element textContent:', messageElement.textContent);
    console.log('  - Message element innerText:', messageElement.innerText);
    
    const allTextElements = messageElement.querySelectorAll('div, span, p');
    console.log('[DEBUG-TTS] All text-containing elements:');
    allTextElements.forEach((el, index) => {
        if (el.textContent && el.textContent.trim()) {
            console.log(`  ${index}: ${el.tagName}.${el.className} - "${el.textContent.substring(0, 50)}"`);
        }
    });
    
    return {
        messageElement,
        bubbleText,
        mainText,
        messageId
    };
};

window.testTTSDirectly = function() {
    console.log('[TTS-TEST] Testing TTS directly...');
    
    if (!window.chatSection || !window.chatSection.tts) {
        console.error('[TTS-TEST] Chat section or TTS not available');
        return false;
    }
    
    const messageElements = document.querySelectorAll('[data-message-id]');
    if (messageElements.length === 0) {
        console.error('[TTS-TEST] No messages found to test');
        return false;
    }
    
    const firstMessage = messageElements[0];
    const messageId = firstMessage.dataset.messageId;
    
    console.log('[TTS-TEST] Testing with message ID:', messageId);
    
    try {
        window.chatSection.tts.speakMessageText(messageId);
        console.log('[TTS-TEST] TTS call successful');
        
        setTimeout(() => {
            const status = window.chatSection.tts.getStatus();
            console.log('[TTS-TEST] TTS status after 1 second:', status);
        }, 1000);
        
        return true;
    } catch (error) {
        console.error('[TTS-TEST] TTS test failed:', error);
        return false;
    }
};

window.getTTSStatus = function() {
    if (window.chatSection && window.chatSection.tts) {
        return window.chatSection.tts.getStatus();
    }
    return null;
};

console.log('🔊 [TTS] Enhanced Text-to-Speech functions loaded:');
console.log('  - testTextToSpeech() - Test TTS with first message');
console.log('  - stopAllSpeech() - Stop any current speech');  
console.log('  - getSpeechInfo() - Get speech synthesis info');
console.log('  - debugMessageStructure(messageId) - Debug message DOM structure');

export default TextToSpeech;
