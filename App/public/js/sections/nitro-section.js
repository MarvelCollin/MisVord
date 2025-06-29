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
        this.setupConnectingLines();
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
    
    setupConnectingLines() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        `;
        
        this.hexagons.forEach((hexagon, i) => {
            if (i < this.hexagons.length - 1) {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('class', 'connecting-line');
                line.style.cssText = `
                    stroke: url(#gradient);
                    stroke-width: 2;
                    opacity: 0.3;
                `;
                svg.appendChild(line);
            }
        });
        
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.setAttribute('id', 'gradient');
        gradient.innerHTML = `
            <stop offset="0%" stop-color="#ffd700"/>
            <stop offset="50%" stop-color="#ff69b4"/>
            <stop offset="100%" stop-color="#9370db"/>
        `;
        svg.appendChild(gradient);
        
        const hexagonGrid = this.section.querySelector('.hexagon-grid');
        if (hexagonGrid) {
            hexagonGrid.appendChild(svg);
            this.updateConnectingLines();
        }
        
        window.addEventListener('resize', () => this.updateConnectingLines());
    }
    
    updateConnectingLines() {
        const lines = document.querySelectorAll('.connecting-line');
        const hexagonGrid = this.section.querySelector('.hexagon-grid');
        
        if (!hexagonGrid) return;
        
        this.hexagons.forEach((hexagon, i) => {
            if (i < this.hexagons.length - 1) {
                const rect1 = hexagon.getBoundingClientRect();
                const rect2 = this.hexagons[i + 1].getBoundingClientRect();
                const gridRect = hexagonGrid.getBoundingClientRect();
                
                const x1 = rect1.left + rect1.width / 2 - gridRect.left;
                const y1 = rect1.top + rect1.height / 2 - gridRect.top;
                const x2 = rect2.left + rect2.width / 2 - gridRect.left;
                const y2 = rect2.top + rect2.height / 2 - gridRect.top;
                
                lines[i].setAttribute('x1', x1);
                lines[i].setAttribute('y1', y1);
                lines[i].setAttribute('x2', x2);
                lines[i].setAttribute('y2', y2);
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
        if (icon) {
            icon.style.transform = 'scale(1.1) rotate(5deg)';
        }
        
        this.createHoverSparkles(hexagon);
        this.pulseConnectedHexagons(hexagon);
    }
    
    resetHexagonHover(hexagon) {
        const icon = hexagon.querySelector('.feature-icon');
        if (icon) {
            icon.style.transform = '';
        }
    }
    
    pulseConnectedHexagons(hexagon) {
        const index = Array.from(this.hexagons).indexOf(hexagon);
        const connectedIndexes = [];
        
        if (index % 2 === 0) {
            if (index > 0) connectedIndexes.push(index - 1);
            if (index < this.hexagons.length - 1) connectedIndexes.push(index + 1);
        }
        
        connectedIndexes.forEach(i => {
            const connectedHexagon = this.hexagons[i];
            const border = connectedHexagon.querySelector('.hexagon-border');
            if (border) {
                border.style.opacity = '0.6';
                border.style.filter = 'blur(8px)';
                setTimeout(() => {
                    border.style.opacity = '0.3';
                    border.style.filter = 'blur(4px)';
                }, 300);
            }
        });
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
