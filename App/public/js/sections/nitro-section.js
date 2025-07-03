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
        this.setupDragFunctionality();
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
    
    setupDragFunctionality() {
        if (!this.crownCenter) return;
        
        this.isDragging = false;
        this.dragStartPos = { x: 0, y: 0 };
        this.containerStartPos = { x: 0, y: 0 };
        this.hexagonContainer = this.section.querySelector('.hexagon-container');
        this.dragRequestId = null;
        
        this.crownCenter.style.cursor = 'grab';
        
        this.crownCenter.addEventListener('mousedown', this.startDrag.bind(this));
        this.crownCenter.addEventListener('touchstart', this.startDrag.bind(this), { passive: false });
        
        document.addEventListener('mousemove', this.handleDrag.bind(this));
        document.addEventListener('touchmove', this.handleDrag.bind(this), { passive: false });
        
        document.addEventListener('mouseup', this.endDrag.bind(this));
        document.addEventListener('touchend', this.endDrag.bind(this));
    }
    
    startDrag(e) {
        e.preventDefault();
        this.isDragging = true;
        this.crownCenter.style.cursor = 'grabbing';
        this.crownCenter.classList.add('dragging');
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        this.dragStartPos.x = clientX;
        this.dragStartPos.y = clientY;
        
        const transform = this.hexagonContainer.style.transform;
        const matches = transform.match(/translate\((-?\d+(?:\.\d+)?)px,\s*(-?\d+(?:\.\d+)?)px\)/);
        if (matches) {
            this.containerStartPos.x = parseFloat(matches[1]);
            this.containerStartPos.y = parseFloat(matches[2]);
        } else {
            this.containerStartPos.x = 0;
            this.containerStartPos.y = 0;
        }
        
        const rotatingHexagons = this.section.querySelector('.rotating-hexagons');
        if (rotatingHexagons) {
            rotatingHexagons.style.animationPlayState = 'paused';
        }
    }
    
    handleDrag(e) {
        if (!this.isDragging) return;
        
        e.preventDefault();
        
        if (this.dragRequestId) {
            cancelAnimationFrame(this.dragRequestId);
        }
        
        this.dragRequestId = requestAnimationFrame(() => {
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            const deltaX = clientX - this.dragStartPos.x;
            const deltaY = clientY - this.dragStartPos.y;
            
            const newX = this.containerStartPos.x + deltaX;
            const newY = this.containerStartPos.y + deltaY;
            
            const maxOffset = 150;
            const constrainedX = Math.max(-maxOffset, Math.min(maxOffset, newX));
            const constrainedY = Math.max(-maxOffset, Math.min(maxOffset, newY));
            
            this.hexagonContainer.style.transform = `translate(${constrainedX}px, ${constrainedY}px)`;
            
            this.createDragParticles(clientX, clientY);
        });
    }
    
    endDrag() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.crownCenter.style.cursor = 'grab';
        this.crownCenter.classList.remove('dragging');
        
        if (this.dragRequestId) {
            cancelAnimationFrame(this.dragRequestId);
            this.dragRequestId = null;
        }
        
        this.hexagonContainer.style.transition = 'transform 0.8s cubic-bezier(0.23, 1, 0.32, 1)';
        this.hexagonContainer.style.transform = 'translate(0, 0)';
        
        const rotatingHexagons = this.section.querySelector('.rotating-hexagons');
        if (rotatingHexagons) {
            rotatingHexagons.style.animationPlayState = 'running';
        }
        
        this.createReturnEffect();
    }
    
    createDragParticles(x, y) {
        if (Math.random() < 0.3) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                width: 8px;
                height: 8px;
                background: linear-gradient(45deg, #ffd700, #ff69b4);
                border-radius: 50%;
                pointer-events: none;
                z-index: 1000;
                left: ${x - 4}px;
                top: ${y - 4}px;
                animation: dragParticle 1s ease-out forwards;
            `;
            
            document.body.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 1000);
        }
    }
    
    createReturnEffect() {
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const sparkle = document.createElement('div');
                sparkle.style.cssText = `
                    position: absolute;
                    width: 6px;
                    height: 6px;
                    background: #ffd700;
                    border-radius: 50%;
                    box-shadow: 0 0 10px #ffd700;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    opacity: 1;
                    z-index: 15;
                    animation: returnSparkle 0.8s ease-out forwards;
                `;
                
                this.crownCenter.appendChild(sparkle);
                
                setTimeout(() => {
                    if (sparkle.parentNode) {
                        sparkle.parentNode.removeChild(sparkle);
                    }
                }, 800);
            }, i * 50);
        }
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
                hexagon.style.animation = `hexagonAppear 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`;
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
