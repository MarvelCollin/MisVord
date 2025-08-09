class TextToSpeech {
    constructor() {
        this.isSpeaking = false;
        this.voiceLoading = false;
        this.currentSpeakingMessageId = null;
        this.currentUtterance = null;
        this.currentSpeechIndicator = null;
    }

    speakMessageText(messageId) {

        
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (!messageElement) {
            console.error('[TTS] Message element not found for ID:', messageId);
            return;
        }
        

        
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

            }
            
            if (!messageText || messageText.trim() === '') {
                messageText = messageElement.textContent || messageElement.innerText || '';

            }
        }
        
        messageText = messageText.replace(/\s*\(edited\)\s*$/, '').trim();
        
        messageText = messageText.replace(/@\w+/g, '').trim();
        
        messageText = messageText.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu, '').trim();
        

        
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

            this.stopAllSpeech();
            
            setTimeout(() => {
                if (!window.speechSynthesis.speaking && !this.isSpeaking && !this.voiceLoading) {

                    this.speakMessageText(messageId);
                }
            }, 500);
            return;
        }
        
        if (this.currentSpeakingMessageId === messageId) {

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

            return;
        }
        
        let voices = window.speechSynthesis.getVoices();
        
        if (voices.length === 0) {

            
            const handleVoicesChanged = () => {
                window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);

                
                if (this.voiceLoading && this.isSpeaking) {
                    setTimeout(() => {
                        this.loadVoicesAndSpeak(utterance, messageId);
                    }, 100);
                }
            };
            
            window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
            
            setTimeout(() => {
                window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);

                
                if (this.voiceLoading && this.isSpeaking) {
                    this.voiceLoading = false;
                    this.setupSpeechEvents(utterance, messageId);
                    this.startSpeech(utterance, messageId);
                }
            }, 3000);
            
            return;
        }
        

        
        const preferredVoices = [
            voices.find(voice => voice.lang === 'en-US' && voice.name.includes('Google')),
            voices.find(voice => voice.lang === 'en-US' && voice.name.includes('Microsoft')),
            voices.find(voice => voice.lang === 'en-US'),
            voices.find(voice => voice.lang.startsWith('en')),
            voices[0]
        ].filter(Boolean);
        
        if (preferredVoices.length > 0) {
            utterance.voice = preferredVoices[0];

        } else {

        }
        
        this.voiceLoading = false;
        this.setupSpeechEvents(utterance, messageId);
        this.startSpeech(utterance, messageId);
    }
    
    setupSpeechEvents(utterance, messageId) {
        utterance.onstart = () => {

            this.showSpeechIndicator(messageId);
        };
        
        utterance.onend = () => {

            this.cleanupSpeech();
        };
        
        utterance.onerror = (error) => {
            if (error.error === 'interrupted') {

            } else {
                console.error('[TTS] Speech error:', error);
            }
            this.cleanupSpeech();
        };
        
        utterance.onpause = () => {

        };
        
        utterance.onresume = () => {

        };
    }
    
    startSpeech(utterance, messageId) {
        try {
            window.speechSynthesis.speak(utterance);

        } catch (error) {
            console.error('[TTS] Failed to start speech:', error);
            this.cleanupSpeech();
        }
    }
    
    cleanupSpeech() {

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

    
    if (!messageId) {
        const messageElements = document.querySelectorAll('[data-message-id]');
        if (messageElements.length > 0) {
            messageId = messageElements[0].dataset.messageId;

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
    




    
    const bubbleText = messageElement.querySelector('.bubble-message-text');
    const mainText = messageElement.querySelector('.message-main-text');
    



    
    if (bubbleText) {




    }
    
    if (mainText) {




    }
    



    
    const allTextElements = messageElement.querySelectorAll('div, span, p');

    allTextElements.forEach((el, index) => {
        if (el.textContent && el.textContent.trim()) {

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
    

    
    try {
        window.chatSection.tts.speakMessageText(messageId);

        
        setTimeout(() => {
            const status = window.chatSection.tts.getStatus();

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







export default TextToSpeech;
