class NitroSection {
    constructor() {
        this.isVisible = false;
        this.animationTriggered = false;
        
        this.init();
    }
    
    init() {
        this.section = document.querySelector('.nitro-section');
        this.featureCards = document.querySelectorAll('.feature-card');
        this.nitroBtn = document.querySelector('.nitro-btn');
        this.codeInput = document.querySelector('.code-input');
        this.codeBtn = document.querySelector('.code-btn');
        
        if (!this.section) return;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('nitroVisible', () => {
            this.onSectionVisible();
        });
        
        if (this.nitroBtn) {
            this.nitroBtn.addEventListener('click', () => this.handleNitroClick());
        }
        
        if (this.codeBtn) {
            this.codeBtn.addEventListener('click', () => this.handleCodeRedeem());
        }
        
        if (this.codeInput) {
            this.codeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleCodeRedeem();
                }
            });
            
            this.codeInput.addEventListener('input', (e) => {
                this.formatCodeInput(e.target);
            });
        }
        
        this.featureCards.forEach(card => {
            card.addEventListener('mouseenter', () => this.animateCardHover(card));
            card.addEventListener('mouseleave', () => this.resetCardHover(card));
        });
        
        this.setupParticleEffects();
    }
    
    onSectionVisible() {
        if (this.animationTriggered) return;
        
        this.isVisible = true;
        this.animationTriggered = true;
        
        this.animateTitle();
        this.animateFeatureCards();
        this.startPremiumEffects();
    }
    
    animateTitle() {
        const title = document.querySelector('.nitro-title');
        const subtitle = document.querySelector('.nitro-subtitle');
        
        if (title) {
            setTimeout(() => {
                title.classList.add('revealed');
            }, 300);
        }
        
        if (subtitle) {
            setTimeout(() => {
                subtitle.classList.add('revealed');
            }, 700);
        }
    }
    
    animateFeatureCards() {
        this.featureCards.forEach((card, index) => {
            const delay = parseInt(card.dataset.delay) || index * 100;
            
            setTimeout(() => {
                card.classList.add('visible');
                this.addCardSparkles(card);
            }, 1000 + delay);
        });
    }
    
    addCardSparkles(card) {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const sparkle = document.createElement('div');
                sparkle.className = 'card-sparkle';
                sparkle.style.position = 'absolute';
                sparkle.style.width = '4px';
                sparkle.style.height = '4px';
                sparkle.style.background = '#ffd700';
                sparkle.style.borderRadius = '50%';
                sparkle.style.boxShadow = '0 0 8px #ffd700';
                sparkle.style.top = Math.random() * 100 + '%';
                sparkle.style.left = Math.random() * 100 + '%';
                sparkle.style.opacity = '0';
                sparkle.style.transform = 'scale(0)';
                sparkle.style.transition = 'all 0.6s ease';
                sparkle.style.pointerEvents = 'none';
                sparkle.style.zIndex = '10';
                
                card.style.position = 'relative';
                card.appendChild(sparkle);
                
                setTimeout(() => {
                    sparkle.style.opacity = '1';
                    sparkle.style.transform = 'scale(1.5)';
                }, 10);
                
                setTimeout(() => {
                    sparkle.style.opacity = '0';
                    sparkle.style.transform = 'scale(0) translateY(-20px)';
                }, 600);
                
                setTimeout(() => {
                    if (sparkle.parentNode) {
                        sparkle.parentNode.removeChild(sparkle);
                    }
                }, 1200);
            }, i * 200);
        }
    }
    
    animateCardHover(card) {
        const icon = card.querySelector('.feature-icon');
        if (icon) {
            icon.style.transform = 'scale(1.1) rotate(5deg)';
            icon.style.transition = 'all 0.3s ease';
        }
        
        this.createHoverSparkles(card);
    }
    
    resetCardHover(card) {
        const icon = card.querySelector('.feature-icon');
        if (icon) {
            icon.style.transform = 'scale(1) rotate(0deg)';
        }
    }
    
    createHoverSparkles(card) {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const sparkle = document.createElement('div');
                sparkle.className = 'hover-sparkle';
                sparkle.style.position = 'absolute';
                sparkle.style.width = '3px';
                sparkle.style.height = '3px';
                sparkle.style.background = '#ff69b4';
                sparkle.style.borderRadius = '50%';
                sparkle.style.boxShadow = '0 0 6px #ff69b4';
                sparkle.style.top = Math.random() * 100 + '%';
                sparkle.style.left = Math.random() * 100 + '%';
                sparkle.style.opacity = '1';
                sparkle.style.transform = 'scale(1)';
                sparkle.style.transition = 'all 0.8s ease-out';
                sparkle.style.pointerEvents = 'none';
                sparkle.style.zIndex = '10';
                
                card.appendChild(sparkle);
                
                setTimeout(() => {
                    sparkle.style.opacity = '0';
                    sparkle.style.transform = 'scale(0) translateY(-30px)';
                }, 10);
                
                setTimeout(() => {
                    if (sparkle.parentNode) {
                        sparkle.parentNode.removeChild(sparkle);
                    }
                }, 800);
            }, i * 50);
        }
    }
    
    handleNitroClick() {
        this.createButtonEffect(this.nitroBtn);
        
        setTimeout(() => {
            this.showPremiumModal();
        }, 200);
    }
    
    createButtonEffect(button) {
        const rect = button.getBoundingClientRect();
        const ripple = document.createElement('div');
        
        ripple.style.position = 'absolute';
        ripple.style.width = '4px';
        ripple.style.height = '4px';
        ripple.style.background = 'rgba(255, 255, 255, 0.6)';
        ripple.style.borderRadius = '50%';
        ripple.style.transform = 'scale(0)';
        ripple.style.animation = 'ripple 0.6s linear';
        ripple.style.left = '50%';
        ripple.style.top = '50%';
        ripple.style.marginLeft = '-2px';
        ripple.style.marginTop = '-2px';
        
        button.appendChild(ripple);
        
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);
    }
    
    handleCodeRedeem() {
        const code = this.codeInput.value.trim();
        
        if (!code) {
            this.showCodeError('Please enter a valid code');
            return;
        }
        
        if (code.length < 8) {
            this.showCodeError('Code must be at least 8 characters');
            return;
        }
        
        this.createButtonEffect(this.codeBtn);
        this.showCodeSuccess('Code redeemed successfully!');
        this.codeInput.value = '';
    }
    
    formatCodeInput(input) {
        let value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        
        if (value.length > 4) {
            value = value.substring(0, 4) + '-' + value.substring(4);
        }
        if (value.length > 9) {
            value = value.substring(0, 9) + '-' + value.substring(9);
        }
        if (value.length > 14) {
            value = value.substring(0, 14) + '-' + value.substring(14);
        }
        
        input.value = value.substring(0, 19);
    }
    
    showCodeError(message) {
        this.showCodeMessage(message, 'error');
    }
    
    showCodeSuccess(message) {
        this.showCodeMessage(message, 'success');
    }
    
    showCodeMessage(message, type) {
        const existingMessage = document.querySelector('.code-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        const messageEl = document.createElement('div');
        messageEl.className = `code-message ${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            margin-top: 0.5rem;
            padding: 0.5rem;
            border-radius: 8px;
            font-size: 0.9rem;
            font-weight: 600;
            text-align: center;
            opacity: 0;
            transform: translateY(-10px);
            transition: all 0.3s ease;
            ${type === 'error' ? 'background: rgba(255, 0, 0, 0.1); color: #ff6b6b; border: 1px solid rgba(255, 0, 0, 0.2);' : 'background: rgba(0, 255, 0, 0.1); color: #51cf66; border: 1px solid rgba(0, 255, 0, 0.2);'}
        `;
        
        const codeSection = document.querySelector('.code-section');
        codeSection.style.position = 'relative';
        codeSection.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.style.opacity = '1';
            messageEl.style.transform = 'translateY(0)';
        }, 10);
        
        setTimeout(() => {
            messageEl.style.opacity = '0';
            messageEl.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 3000);
    }
    
    showPremiumModal() {
        console.log('Premium purchase flow would start here');
    }
    
    setupParticleEffects() {
        if (!this.section) return;
        
        setInterval(() => {
            if (this.isVisible) {
                this.createFloatingParticle();
            }
        }, 2000);
    }
    
    createFloatingParticle() {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: 6px;
            height: 6px;
            background: linear-gradient(45deg, #ffd700, #ff69b4);
            border-radius: 50%;
            opacity: 0.8;
            pointer-events: none;
            z-index: 5;
            animation: floatUp 4s linear forwards;
        `;
        
        particle.style.left = Math.random() * 100 + '%';
        particle.style.bottom = '0';
        
        this.section.appendChild(particle);
        
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 4000);
    }
    
    startPremiumEffects() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(15);
                    opacity: 0;
                }
            }
            
            @keyframes floatUp {
                0% {
                    transform: translateY(0) rotate(0deg);
                    opacity: 0.8;
                }
                50% {
                    opacity: 1;
                }
                100% {
                    transform: translateY(-100vh) rotate(360deg);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    window.nitroSection = new NitroSection();
});

window.NitroSection = NitroSection;
