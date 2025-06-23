/**
 * Simple Text-based Captcha Implementation
 */
class TextCaptcha {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Captcha container with ID ${containerId} not found`);
            return;
        }

        this.options = {
            length: options.length || 6,
            refreshButtonId: options.refreshButtonId || null,
            inputId: options.inputId || null,
            caseSensitive: options.caseSensitive || false,
        };

        this.code = '';
        this.init();
    }

    init() {
        this.createCaptchaUI();
        this.generateCode();
        this.setupListeners();
    }

    createCaptchaUI() {
        this.container.innerHTML = `
            <div class="captcha-wrapper">
                <div class="captcha-code" id="${this.container.id}-code"></div>
                <button type="button" class="captcha-refresh" id="${this.container.id}-refresh">
                    <i class="fa-solid fa-rotate-right"></i>
                </button>
            </div>
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
        `;
        document.head.appendChild(style);
    }

    generateCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let code = '';
        
        for (let i = 0; i < this.options.length; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        this.code = code;
        this.displayCode();
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

    setupListeners() {
        const refreshBtn = document.getElementById(`${this.container.id}-refresh`);
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.generateCode();
            });
        }
    }

    verify(input) {
        if (!input) return false;
        
        if (this.options.caseSensitive) {
            return input === this.code;
        } else {
            return input.toLowerCase() === this.code.toLowerCase();
        }
    }

    refresh() {
        this.generateCode();
    }
}

window.TextCaptcha = TextCaptcha;
