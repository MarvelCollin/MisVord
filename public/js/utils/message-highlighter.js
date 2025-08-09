class MessageHighlighter {
    constructor() {
        this.activeHighlight = null;
        this.highlightTimeout = null;
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.checkForMessageHash();
        });

        window.addEventListener('hashchange', () => {
            this.checkForMessageHash();
        });

        window.addEventListener('popstate', () => {
            setTimeout(() => this.checkForMessageHash(), 100);
        });
    }

    checkForMessageHash() {
        const hash = window.location.hash;
        if (hash.startsWith('#message-')) {
            const messageId = hash.replace('#message-', '');
            this.highlightMessage(messageId, true);
        }
    }

    highlightMessage(messageId, fromNotification = false) {
        if (!messageId) return false;



        this.clearActiveHighlight();

        const messageElement = this.findMessageElement(messageId);
        if (!messageElement) {
            console.warn('⚠️ [MESSAGE-HIGHLIGHTER] Message element not found:', messageId);
            
            setTimeout(() => {
                const retryElement = this.findMessageElement(messageId);
                if (retryElement) {
                    this.performHighlight(retryElement, fromNotification);
                }
            }, 500);
            return false;
        }

        this.performHighlight(messageElement, fromNotification);
        return true;
    }

    findMessageElement(messageId) {
        const selectors = [
            `[data-message-id="${messageId}"]`,
            `#message-${messageId}`,
            `.message-${messageId}`,
            `[id="message-${messageId}"]`
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {

                return element;
            }
        }


        const allMessages = document.querySelectorAll('[data-message-id]');
        for (const msg of allMessages) {
            if (msg.dataset.messageId == messageId || msg.id.includes(messageId)) {

                return msg;
            }
        }

        return null;
    }

    performHighlight(messageElement, fromNotification = false) {
        this.scrollToMessage(messageElement);

        setTimeout(() => {
            const highlightClass = fromNotification ? 'message-notification-target' : 'highlight-message';
            
            messageElement.classList.add(highlightClass);
            this.activeHighlight = {
                element: messageElement,
                class: highlightClass
            };



            this.highlightTimeout = setTimeout(() => {
                this.clearActiveHighlight();
            }, fromNotification ? 8000 : 5000);

            if (fromNotification) {
                this.playHighlightSound();
                this.showHighlightToast();
            }
        }, 300);
    }

    scrollToMessage(messageElement) {
        const container = this.findScrollContainer();
        if (!container) {
            messageElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'nearest'
            });
            return;
        }

        const elementTop = messageElement.offsetTop;
        const elementHeight = messageElement.offsetHeight;
        const containerHeight = container.clientHeight;
        const scrollTop = elementTop - (containerHeight / 2) + (elementHeight / 2);

        container.scrollTo({
            top: Math.max(0, scrollTop),
            behavior: 'smooth'
        });


    }

    findScrollContainer() {
        const containers = [
            '#chat-messages',
            '.messages-container',
            '.chat-messages',
            '#message-container'
        ];

        for (const selector of containers) {
            const container = document.querySelector(selector);
            if (container) {
                return container;
            }
        }

        return null;
    }

    clearActiveHighlight() {
        if (this.activeHighlight) {
            this.activeHighlight.element.classList.remove(this.activeHighlight.class);
            this.activeHighlight = null;

        }

        if (this.highlightTimeout) {
            clearTimeout(this.highlightTimeout);
            this.highlightTimeout = null;
        }
    }

    playHighlightSound() {
        try {
            const audio = new Audio('/public/assets/sound/mention_sound.mp3');
            audio.volume = 0.3;
            audio.play().catch(() => {});
        } catch (error) {
        }
    }

    showHighlightToast() {
        if (window.showToast) {
            window.showToast(
                '<div class="flex items-center space-x-2"><span class="text-blue-400">🎯</span><span>Message highlighted from notification</span></div>', 
                'info', 
                3000
            );
        }
    }

    highlightMessageFromUrl(url) {
        try {
            const urlObj = new URL(url);
            const hash = urlObj.hash;
            if (hash.startsWith('#message-')) {
                const messageId = hash.replace('#message-', '');
                return this.highlightMessage(messageId, true);
            }
        } catch (error) {
            console.error('❌ [MESSAGE-HIGHLIGHTER] Invalid URL:', error);
        }
        return false;
    }

    addHighlightClickHandler(element, messageId) {
        if (!element || !messageId) return;

        element.addEventListener('click', (e) => {
            if (e.shiftKey || e.ctrlKey || e.metaKey) {
                this.highlightMessage(messageId, false);
                window.location.hash = `#message-${messageId}`;
            }
        });
    }

    static createInstance() {
        if (!window.messageHighlighter) {
            window.messageHighlighter = new MessageHighlighter();
        }
        return window.messageHighlighter;
    }
}

MessageHighlighter.createInstance();

window.MessageHighlighter = MessageHighlighter; 