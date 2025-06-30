class NitroSection {
    constructor() {
        this.isVisible = false;
        this.animationTriggered = false;
        
        this.init();
    }
    
    init() {
        this.section = document.querySelector('.nitro-section');
        this.hexagons = document.querySelectorAll('.hexagon-feature');
        this.crownCenter = document.querySelector('.crown-center');
        
        if (!this.section) return;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('nitroVisible', () => {
            this.onSectionVisible();
        });
        
        this.hexagons.forEach(hexagon => {
            hexagon.addEventListener('mouseenter', () => this.animateHexagonHover(hexagon));
            hexagon.addEventListener('mouseleave', () => this.resetHexagonHover(hexagon));
        });
        
        if (this.crownCenter) {
            this.crownCenter.addEventListener('mouseenter', () => this.onCrownHoverStart());
            this.crownCenter.addEventListener('mouseleave', () => this.onCrownHoverEnd());
        }
        
        this.setupParticleEffects();
    }
    
    onCrownHoverStart() {
        this.hexagons.forEach(hexagon => {
            const icon = hexagon.querySelector('.feature-icon');
            if (icon) {
                icon.style.transform = 'scale(1.2)';
            }
        });
    }
    
    onCrownHoverEnd() {
        this.hexagons.forEach(hexagon => {
            const icon = hexagon.querySelector('.feature-icon');
            if (icon) {
                icon.style.transform = '';
            }
        });
    }
    
    
    
    onSectionVisible() {
        if (this.animationTriggered) return;
        
        this.isVisible = true;
        this.animationTriggered = true;
        
        this.animateTitle();
        this.animateHexagons();
        this.startPremiumEffects();
    }
    
    animateTitle() {
        const title = document.querySelector('.nitro-title');
        
        if (title) {
            setTimeout(() => {
                title.classList.add('revealed');
            }, 300);
        }
    }
    
    animateHexagons() {
        this.hexagons.forEach((hexagon, index) => {
            const delay = parseInt(hexagon.dataset.delay) || index * 100;
            
            setTimeout(() => {
                hexagon.classList.add('visible');
                this.addHexagonSparkles(hexagon);
            }, 1000 + delay);
        });
    }
    
    addHexagonSparkles(hexagon) {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const sparkle = document.createElement('div');
                sparkle.className = 'hexagon-sparkle';
                sparkle.style.cssText = `
                    position: absolute;
                    width: 4px;
                    height: 4px;
                    background: #ffd700;
                    border-radius: 50%;
                    box-shadow: 0 0 8px #ffd700;
                    top: ${Math.random() * 100}%;
                    left: ${Math.random() * 100}%;
                    opacity: 0;
                    transform: scale(0);
                    transition: all 0.6s ease;
                    pointer-events: none;
                    z-index: 10;
                `;
                
                hexagon.appendChild(sparkle);
                
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
    
        animateHexagonHover(hexagon) {
        const icon = hexagon.querySelector('.feature-icon');
        const content = hexagon.querySelector('.hexagon-content');
        const border = hexagon.querySelector('.hexagon-border');
        
        if (icon) {
            icon.style.transform = 'scale(1.2) rotate(10deg)';
        }
        
        if (content) {
            content.style.transform = content.style.transform + ' scale(1.1)';
            content.style.background = 'rgba(255, 255, 255, 0.1)';
        }
        
        if (border) {
            border.style.opacity = '0.8';
            border.style.transform = border.style.transform + ' scale(1.05)';
        }
        
        hexagon.style.transform = hexagon.style.transform.replace(/scale\([^)]*\)/, '') + ' scale(1.15)';
        hexagon.style.zIndex = '100';
        hexagon.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
        
        this.createHoverSparkles(hexagon);
    }

    resetHexagonHover(hexagon) {
        const icon = hexagon.querySelector('.feature-icon');
        const content = hexagon.querySelector('.hexagon-content');
        const border = hexagon.querySelector('.hexagon-border');
        
        if (icon) {
            icon.style.transform = '';
        }
        
        if (content) {
            content.style.transform = content.style.transform.replace(/scale\([^)]*\)/g, '');
            content.style.background = 'rgba(255, 255, 255, 0.05)';
        }
        
        if (border) {
            border.style.opacity = '0.3';
            border.style.transform = border.style.transform.replace(/scale\([^)]*\)/g, '');
        }
        
        hexagon.style.transform = hexagon.style.transform.replace(/scale\([^)]*\)/, '');
        hexagon.style.zIndex = '';
    }
    
    createHoverSparkles(hexagon) {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const sparkle = document.createElement('div');
                sparkle.className = 'hover-sparkle';
                sparkle.style.cssText = `
                    position: absolute;
                    width: 3px;
                    height: 3px;
                    background: #ff69b4;
                    border-radius: 50%;
                    box-shadow: 0 0 6px #ff69b4;
                    top: ${Math.random() * 100}%;
                    left: ${Math.random() * 100}%;
                    opacity: 1;
                    transform: scale(1);
                    transition: all 0.8s ease-out;
                    pointer-events: none;
                    z-index: 10;
                `;
                
                hexagon.appendChild(sparkle);
                
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
