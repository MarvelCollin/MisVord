export class TextCaptcha {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Captcha container with ID ${containerId} not found`);
            return;
        }

        const isProduction = window.location.hostname !== 'localhost' && 
                           !window.location.hostname.includes('127.0.0.1') && 
                           !window.location.hostname.includes('dev');

        this.options = {
            length: options.length || 6,
            refreshButtonId: options.refreshButtonId || null,
            inputId: options.inputId || null,
            caseSensitive: options.caseSensitive || false,
            showDebug: options.showDebug !== undefined ? options.showDebug : !isProduction,
        };

        this.code = '';
        this.serverCode = '';
        this.init();
    }

    init() {
        try {
            this.createCaptchaUI();
            this.generateCode();
            this.setupListeners();
        } catch (e) {
            console.error('Error initializing captcha:', e);
        }
    }

    createCaptchaUI() {
        this.container.innerHTML = `
            <div class="captcha-wrapper">
                <div class="captcha-code" id="${this.container.id}-code"></div>
                <button type="button" class="captcha-refresh" id="${this.container.id}-refresh">
                    <i class="fa-solid fa-rotate-right"></i>
                </button>
            </div>
            ${this.options.showDebug ? `<div class="captcha-debug" id="${this.container.id}-debug" style="margin-top: 4px; padding: 4px 8px; background: #36393f; border-radius: 4px; font-size: 12px; color: #b9bbbe; font-family: monospace;">Debug: Loading...</div>` : ''}
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            .captcha-wrapper {
                display: flex;
                align-items: center;
                background: #202225;
                border: 1px solid #40444b;
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 8px;
            }
            .captcha-code {
                flex-grow: 1;
                padding: 10px;
                letter-spacing: 3px;
                font-family: 'Courier New', monospace;
                font-weight: bold;
                text-align: center;
                user-select: none;
                position: relative;
            }
            .captcha-code span {
                display: inline-block;
                position: relative;
                transform: translateY(0);
            }
            .captcha-refresh {
                background: #36393f;
                border: none;
                color: #b9bbbe;
                padding: 10px 12px;
                cursor: pointer;
                transition: all 0.2s;
                z-index: 1000;
            }
            .captcha-refresh:hover {
                background: #2f3136;
                color: #ffffff;
                z-index: 1000;
            }
            .captcha-char-0 { transform: rotate(-5deg) translateY(-1px); }
            .captcha-char-1 { transform: rotate(3deg) translateY(2px); }
            .captcha-char-2 { transform: rotate(-2deg) translateY(-2px); }
            .captcha-char-3 { transform: rotate(5deg) translateY(1px); }
            .captcha-char-4 { transform: rotate(-3deg) translateY(3px); }
            .captcha-char-5 { transform: rotate(2deg) translateY(-3px); }
            
            .captcha-input {
                width: 100%;
                background: #202225;
                color: white;
                border: 1px solid #40444b;
                border-radius: 4px;
                padding: 10px;
                transition: all 0.2s;
            }
            
            .captcha-input:focus {
                border-color: #5865f2;
                outline: none;
                box-shadow: 0 0 0 2px rgba(88, 101, 242, 0.3);
            }
            
            .captcha-debug {
                user-select: text;
                cursor: text;
            }
        `;
        document.head.appendChild(style);
    }

    async generateCode() {
        try {
            const timestamp = new Date().getTime();
            const response = await fetch(`/api/captcha/generate?_t=${timestamp}`, {
                method: 'GET',
                credentials: 'include',
                headers: { 'Cache-Control': 'no-cache' }
            });
            
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            
            const data = await response.json();

            if (data.success && data.captcha_code) {
                this.code = data.captcha_code;
                this.serverCode = data.captcha_code.toLowerCase();
                this.displayCode();
                this.updateDebugDisplay();
            } else {
                throw new Error('Server did not return captcha code');
            }
        } catch (error) {
            console.error('Error generating captcha:', error);
            this.displayError('Failed to load captcha. Please refresh the page.');
        }
    }

    displayError(message) {
        const codeDisplay = document.getElementById(`${this.container.id}-code`);
        if (codeDisplay) {
            codeDisplay.innerHTML = `<div style="color: #f87171; text-align: center; padding: 10px; font-size: 12px;">${message}</div>`;
        }
        
        if (this.options.showDebug) {
            const debugDisplay = document.getElementById(`${this.container.id}-debug`);
            if (debugDisplay) {
                debugDisplay.textContent = `Debug: Error - ${message}`;
                debugDisplay.style.color = '#f87171';
            }
        }
    }

    displayCode() {
        const codeDisplay = document.getElementById(`${this.container.id}-code`);
        if (!codeDisplay) return;
        
        codeDisplay.innerHTML = '';
        
        for (let i = 0; i < this.code.length; i++) {
            const charSpan = document.createElement('span');
            charSpan.textContent = this.code[i];
            charSpan.className = `captcha-char-${i % 6}`;
            
            const hue = Math.floor(Math.random() * 360);
            charSpan.style.color = `hsl(${hue}, 70%, 70%)`;
            charSpan.style.textShadow = `0px 1px 0px rgba(0,0,0,0.2)`;
            
            codeDisplay.appendChild(charSpan);
        }
        
        for (let i = 0; i < 3; i++) {
            const line = document.createElement('div');
            const top = Math.floor(Math.random() * 30) + 5;
            const height = Math.floor(Math.random() * 2) + 1;
            const width = Math.floor(Math.random() * 70) + 30;
            const left = Math.floor(Math.random() * 30);
            const hue = Math.floor(Math.random() * 360);
            
            line.style.position = 'absolute';
            line.style.top = `${top}px`;
            line.style.left = `${left}%`;
            line.style.width = `${width}%`;
            line.style.height = `${height}px`;
            line.style.background = `hsl(${hue}, 70%, 70%)`;
            line.style.opacity = '0.7';
            line.style.transform = `rotate(${Math.floor(Math.random() * 20) - 10}deg)`;
            line.style.zIndex = '1';
            
            codeDisplay.appendChild(line);
        }
        
        codeDisplay.querySelectorAll('span').forEach(span => {
            span.style.position = 'relative';
            span.style.zIndex = '2';
        });
    }

    updateDebugDisplay() {
        if (!this.options.showDebug) return;
        
        const debugDisplay = document.getElementById(`${this.container.id}-debug`);
        if (debugDisplay) {
            debugDisplay.textContent = `Debug: Correct answer is "${this.serverCode}" (case insensitive)`;
            debugDisplay.style.color = '#4ade80';
        }
    }

    setupListeners() {
        const refreshBtn = document.getElementById(`${this.container.id}-refresh`);
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.generateCode();
                if (this.options.inputId) {
                    const input = document.getElementById(this.options.inputId);
                    if (input) {
                        input.value = '';
                    }
                }
            });
        }
    }

    verify(input) {
        if (!input) return false;
        if (!this.serverCode) return false;
        
        const inputLower = input.toLowerCase().trim();
        
        console.log('Captcha verification:', {
            input: input,
            inputLower: inputLower,
            serverCode: this.serverCode,
            match: inputLower === this.serverCode
        });
        
        return inputLower === this.serverCode;
    }

    async verifyWithServer(input) {
        try {
            const response = await fetch('/api/captcha/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                },
                credentials: 'include',
                body: JSON.stringify({ captcha: input })
            });
            
            if (!response.ok) {
                return false;
            }
            
            const data = await response.json();
            return data.success === true;
        } catch (error) {
            console.error('Error verifying captcha with server:', error);
            return this.verify(input);
        }
    }

    refresh() {
        try {
            const codeDisplay = document.getElementById(`${this.container.id}-code`);
            if (codeDisplay) {
                codeDisplay.innerHTML = '<div style="text-align:center;padding:10px;">Loading...</div>';
            }
            
            if (this.options.showDebug) {
                const debugDisplay = document.getElementById(`${this.container.id}-debug`);
                if (debugDisplay) {
                    debugDisplay.textContent = 'Debug: Loading new captcha...';
                    debugDisplay.style.color = '#b9bbbe';
                }
            }
            
            this.generateCode();
            
            if (this.options.inputId) {
                const input = document.getElementById(this.options.inputId);
                if (input) {
                    input.value = '';
                }
            }
        } catch (e) {
            console.error('Error refreshing captcha:', e);
        }
    }

    isValid(input) {
        return this.verify(input);
    }
}

window.TextCaptcha = TextCaptcha;
