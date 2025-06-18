// Minimal landing page script - only scramble text functionality
window.LANDING_PAGE_MODE = true;
window.DISABLE_MESSAGING = true;

// Block WebSocket and messaging functionality
(function() {
    // Define GlobalSocketManager as read-only
    Object.defineProperty(window, 'GlobalSocketManager', {
        value: {
            init: () => false,
            connect: () => false,
            disconnect: () => false,
            updatePresence: () => false,
            trackActivity: () => false,
            isReady: () => false,
            getStatus: () => ({ isGuest: true, connected: false }),
            error: () => {},
            log: () => {}
        },
        writable: false,
        configurable: false
    });

    Object.defineProperty(window, 'globalSocketManager', {
        value: null,
        writable: false,
        configurable: false
    });

    Object.defineProperty(window, 'io', {
        value: function() {
            return {
                on: () => ({ on: () => {}, emit: () => {}, connect: () => {}, disconnect: () => {} }),
                emit: () => {},
                connect: () => {},
                disconnect: () => {},
                connected: false
            };
        },
        writable: false,
        configurable: false
    });

    // Block WebSocket
    const OriginalWebSocket = window.WebSocket;
    window.WebSocket = function() {
        throw new Error('WebSocket disabled on landing page');
    };
})();

// Simple scramble text implementation
document.addEventListener('DOMContentLoaded', function() {
    console.log('Landing page loaded - initializing scramble text');
    initScrambleText();
});

function initScrambleText() {
    const scrambleElements = document.querySelectorAll('.scramble-text');
    
    if (scrambleElements.length === 0) {
        console.log('No scramble text elements found');
        return;
    }

    scrambleElements.forEach((element, index) => {
        const originalText = element.getAttribute('data-text') || element.textContent.trim();
        
        if (!originalText) {
            console.warn('No text found for scramble element');
            return;
        }
        
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
        
        // Clear element and create character spans
        element.innerHTML = '';
        const spans = [];

        for (let i = 0; i < originalText.length; i++) {
            const span = document.createElement('span');
            span.style.cssText = `
                display: inline-block;
                position: relative;
                opacity: 0;
                transition: all 0.3s ease;
            `;

            if (originalText[i] === ' ') {
                span.innerHTML = '&nbsp;';
                span.style.opacity = '1';
            } else {
                span.textContent = originalText[i];
                span.dataset.finalChar = originalText[i];
            }

            element.appendChild(span);
            spans.push(span);
        }

        // Start animation after a delay
        setTimeout(() => {
            startScrambleAnimation(spans, chars, originalText);
        }, 500 + (index * 300));
    });
}

function startScrambleAnimation(spans, chars, originalText) {
    let counter = 0;
    const totalDuration = 2000;
    const interval = 80;
    const totalSteps = totalDuration / interval;

    const scrambleInterval = setInterval(() => {
        counter++;
        const progress = counter / totalSteps;
        const revealCount = Math.floor(progress * spans.length);

        spans.forEach((span, index) => {
            if (originalText[index] === ' ') return; // Skip spaces

            if (index < revealCount && !span.classList.contains('revealed')) {
                // Reveal final character
                span.textContent = span.dataset.finalChar;
                span.classList.add('revealed');
                span.style.opacity = '1';
                span.style.color = '#FFFFFF';
            } else if (index >= revealCount) {
                // Show random character
                if (counter % 2 === 0) {
                    const randomChar = chars[Math.floor(Math.random() * chars.length)];
                    span.textContent = randomChar;
                    span.style.opacity = '1';
                    span.style.color = '#5865F2';
                }
            }
        });

        if (progress >= 1) {
            clearInterval(scrambleInterval);
            
            // Final cleanup - ensure all characters are revealed
            spans.forEach((span, index) => {
                if (originalText[index] !== ' ') {
                    span.textContent = span.dataset.finalChar;
                    span.style.color = '#FFFFFF';
                    span.style.opacity = '1';
                }
            });
        }
    }, interval);
}
