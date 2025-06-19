document.addEventListener('DOMContentLoaded', function() {
    initFeaturedCards();
});

function initFeaturedCards() {
    const featuredSection = document.getElementById('featured-cards');
    if (!featuredSection) return;

    const cards = featuredSection.querySelectorAll('.feature-card');
    const sectionTitle = featuredSection.querySelector('.section-title');
    const sectionSubtitle = featuredSection.querySelector('.section-subtitle');
    const cardWrapper = featuredSection.querySelector('.card-wrapper');
    
    if (sectionTitle) sectionTitle.classList.add('revealed');
    if (sectionSubtitle) sectionSubtitle.classList.add('revealed');
    
    // Set wrapper state to track when cursor is within the wrapper
    if (cardWrapper) {
        cardWrapper._isActive = false;
        cardWrapper.setAttribute('data-stable', 'true');
    }
    
    cards.forEach((card, index) => {
        card.setAttribute('data-card-index', index);
        card._isHovered = false;
        card.setAttribute('data-fixed-position', 'true');
    });
    
    handleResponsiveLayout();
    
    // Position cards once and stabilize them
    setTimeout(() => {
        cards.forEach((card, index) => {
            card.classList.add('revealed');
            card.style.opacity = '1';
            
            if (window.innerWidth > 768) {
                const baseTransform = getBaseCardTransform(index);
                card.style.transform = baseTransform;
                card.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
            } else {
                card.style.transform = 'none';
            }
        });
        
        // Mark cards as stable after initial positioning
        setTimeout(() => {
            cards.forEach(card => {
                card.setAttribute('data-stable', 'true');
            });
        }, 600);
    }, 100);
    
    // Add mouse event listeners for cards
    if (window.innerWidth > 480) {
        cards.forEach((card, index) => {
            let hoverTimeout;
            
            card.addEventListener('mouseenter', (e) => {
                if (cardWrapper && cardWrapper._isActive) return;
                
                card._isHovered = true;
                showTooltip(card, e);
                clearTimeout(hoverTimeout);
                
                hoverTimeout = setTimeout(() => {
                    if (!card._isHovered) return;
                    
                    const currentlyFlipped = featuredSection.querySelector('.feature-card.flipped');
                    if (currentlyFlipped && currentlyFlipped !== card) {
                        currentlyFlipped.classList.remove('flipped');
                    }
                    
                    card.classList.add('flipped');
                    card.style.zIndex = '100';
                }, 800);
            });
            
            card.addEventListener('mouseleave', () => {
                card._isHovered = false;
                clearTimeout(hoverTimeout);
                hideTooltip();
                
                if (card.classList.contains('flipped')) {
                    card.classList.remove('flipped');
                    setTimeout(() => {
                        card.style.zIndex = getCardZIndex(index);
                    }, 300);
                }
            });
            
            card.addEventListener('mousemove', (e) => {
                if (card._isHovered) {
                    updateTooltipPosition(e);
                }
            });
        });
    }

    // Add wrapper mouse events
    if (cardWrapper && window.innerWidth > 768) {
        cardWrapper.addEventListener('mouseenter', () => {
            cardWrapper._isActive = true;
            cardWrapper.classList.add('hover-lock');
        });
        
        cardWrapper.addEventListener('mouseleave', () => {
            cardWrapper._isActive = false;
            cardWrapper.classList.remove('hover-lock');
            hideTooltip();
        });
    }
    
    window.addEventListener('resize', debounce(() => {
        if (cardWrapper) cardWrapper._isActive = false;
        
        cards.forEach((card) => {
            card.classList.remove('flipped');
            card._isHovered = false;
        });
        
        handleResponsiveLayout();
    }, 200));
}

function addMorphingGlow(card, cardIndex) {
    const glow = document.createElement('div');
    glow.className = 'morphing-glow';
    
    const colors = [
        ['#5865F2', '#7289DA'],
        ['#9B59B6', '#E91E63'],
        ['#3498DB', '#00BCD4'],
        ['#2ECC71', '#4CAF50'],
        ['#E74C3C', '#FF5722']
    ];
    
    const [color1, color2] = colors[cardIndex] || colors[0];
    
    glow.style.cssText = `
        position: absolute;
        inset: -20px;
        background: conic-gradient(from 0deg, ${color1}, ${color2}, ${color1});
        border-radius: inherit;
        z-index: -1;
        opacity: 0;
        filter: blur(20px);
        animation: morphingGlow 4s ease-in-out infinite alternate;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes morphingGlow {
            0% {
                opacity: 0.3;
                transform: rotate(0deg) scale(0.8);
                filter: blur(20px) hue-rotate(0deg);
            }
            50% {
                opacity: 0.6;
                transform: rotate(180deg) scale(1.1);
                filter: blur(25px) hue-rotate(90deg);
            }
            100% {
                opacity: 0.4;
                transform: rotate(360deg) scale(0.9);
                filter: blur(20px) hue-rotate(180deg);
            }
        }
    `;
    
    glow.appendChild(style);
    card.appendChild(glow);
}

function addContinuousFloat(card, index) {
    const floatDistance = [12, 8, 15, 10, 14][index] || 10;
    const duration = [4.5, 3.8, 5.2, 4.1, 4.8][index] || 4;
    const delay = index * 0.3;
    
    const keyframes = `
        @keyframes continuousFloat${index} {
            0%, 100% {
                transform: ${getBaseCardTransform(index)} translateY(0) rotateZ(${Math.sin(index) * 2}deg);
            }
            25% {
                transform: ${getBaseCardTransform(index)} translateY(-${floatDistance/2}px) rotateZ(${Math.sin(index + 1) * 3}deg);
            }
            50% {
                transform: ${getBaseCardTransform(index)} translateY(-${floatDistance}px) rotateZ(${Math.sin(index + 2) * 2}deg);
            }
            75% {
                transform: ${getBaseCardTransform(index)} translateY(-${floatDistance/2}px) rotateZ(${Math.sin(index + 3) * 3}deg);
            }
        }
    `;
    
    const style = document.createElement('style');
    style.textContent = keyframes;
    card.appendChild(style);
    
    card.style.animation = `continuousFloat${index} ${duration}s ease-in-out ${delay}s infinite`;
}

function addHoverPulse(card) {
    const pulseRing = document.createElement('div');
    pulseRing.className = 'hover-pulse-ring';
    
    pulseRing.style.cssText = `
        position: absolute;
        inset: -30px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: inherit;
        opacity: 0;
        z-index: -1;
        pointer-events: none;
        transition: all 0.3s ease;
    `;
    
    card.appendChild(pulseRing);
}
function addMagicalParticles(container) {
    for (let i = 0; i < 25; i++) {
        const particle = document.createElement('div');
        particle.className = 'magical-particle';
        
        const size = Math.random() * 6 + 2;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const duration = Math.random() * 20 + 15;
        const delay = Math.random() * 8;
        
        const colors = ['#5865F2', '#9B59B6', '#3498DB', '#2ECC71', '#E74C3C', '#F39C12', '#1ABC9C'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${posX}%;
            top: ${posY}%;
            background: radial-gradient(circle, ${color} 0%, transparent 70%);
            border-radius: 50%;
            box-shadow: 0 0 ${size * 3}px ${color}80;
            opacity: 0;
            z-index: 1;
            pointer-events: none;
            animation: magicalFloat ${duration}s ease-in-out ${delay}s infinite;
        `;
        
        const keyframes = `
            @keyframes magicalFloat {
                0%, 100% {
                    opacity: 0;
                    transform: translateY(0) translateX(0) scale(0.5) rotate(0deg);
                }
                10% {
                    opacity: 0.8;
                    transform: translateY(-20px) translateX(${Math.random() * 40 - 20}px) scale(1) rotate(45deg);
                }
                50% {
                    opacity: 1;
                    transform: translateY(-150px) translateX(${Math.random() * 80 - 40}px) scale(1.2) rotate(180deg);
                }
                90% {
                    opacity: 0.6;
                    transform: translateY(-280px) translateX(${Math.random() * 60 - 30}px) scale(0.8) rotate(315deg);
                }
            }
        `;
        
        const style = document.createElement('style');
        style.textContent = keyframes;
        particle.appendChild(style);
        
        container.appendChild(particle);
    }
}

function addInterCardConnection() {
    const cards = document.querySelectorAll('.feature-card.revealed');
    if (cards.length < 2) return;
    
    const connections = document.createElement('div');
    connections.className = 'card-connections';
    connections.style.cssText = `
        position: absolute;
        inset: 0;
        z-index: 1;
        pointer-events: none;
    `;
    
    for (let i = 0; i < cards.length - 1; i++) {
        const connection = document.createElement('div');
        connection.className = 'connection-line';
        
        connection.style.cssText = `
            position: absolute;
            height: 2px;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            opacity: 0;
            animation: connectionPulse ${3 + i * 0.5}s ease-in-out ${i * 0.2}s infinite alternate;
        `;
        
        const keyframes = `
            @keyframes connectionPulse {
                0% { opacity: 0; transform: scaleX(0); }
                50% { opacity: 0.6; transform: scaleX(1); }
                100% { opacity: 0.3; transform: scaleX(0.8); }
            }
        `;
        
        const style = document.createElement('style');
        style.textContent = keyframes;
        connection.appendChild(style);
        
        connections.appendChild(connection);
    }
    
    const cardWrapper = document.querySelector('.card-wrapper');
    if (cardWrapper) {
        cardWrapper.appendChild(connections);
    }
}

function createEnergyWaves() {
    const waves = document.createElement('div');
    waves.className = 'energy-waves';
    waves.style.cssText = `
        position: absolute;
        inset: 0;
        z-index: 0;
        pointer-events: none;
    `;
    
    for (let i = 0; i < 3; i++) {
        const wave = document.createElement('div');
        wave.className = 'energy-wave';
        
        wave.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 200px;
            height: 200px;
            border: 2px solid rgba(88, 101, 242, 0.2);
            border-radius: 50%;
            transform: translate(-50%, -50%) scale(0);
            animation: energyWave ${4 + i * 0.5}s ease-out ${i * 1.2}s infinite;
        `;
        
        const keyframes = `
            @keyframes energyWave {
                0% {
                    transform: translate(-50%, -50%) scale(0);
                    opacity: 0.8;
                }
                50% {
                    opacity: 0.4;
                }
                100% {
                    transform: translate(-50%, -50%) scale(4);
                    opacity: 0;
                }
            }
        `;
        
        const style = document.createElement('style');
        style.textContent = keyframes;
        wave.appendChild(style);
        
        waves.appendChild(wave);
    }
    
    const cardWrapper = document.querySelector('.card-wrapper');
    if (cardWrapper) {
        cardWrapper.appendChild(waves);
    }
}
function initAdvancedCardInteractions(cards) {
    const cardWrapper = document.querySelector('.card-wrapper');
    if (!cardWrapper) return;
    
    let mousePos = { x: 0, y: 0 };
    
    cardWrapper.addEventListener('mousemove', (e) => {
        if (window.innerWidth < 1024) return;
        
        const rect = cardWrapper.getBoundingClientRect();
        mousePos.x = (e.clientX - rect.left) / rect.width;
        mousePos.y = (e.clientY - rect.top) / rect.height;
        
        cards.forEach((card) => {
            if (card.classList.contains('revealed')) {
                updateCardWithMouse(card, mousePos);
            }
        });
    });
    
    cardWrapper.addEventListener('mouseleave', () => {
        if (window.innerWidth < 1024) return;
        
        cards.forEach((card) => {
            if (card.classList.contains('revealed')) {
                resetCardPosition(card, parseInt(card.getAttribute('data-card-index')));
                const pulseRing = card.querySelector('.hover-pulse-ring');
                if (pulseRing) pulseRing.style.opacity = '0';
            }
        });
    });
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            if (window.innerWidth < 1024) return;
            
            card.style.zIndex = "100";
            const cardInner = card.querySelector('.card-inner');
            if (cardInner) {
                cardInner.style.transform = 'translateZ(50px) scale(1.08)';
                cardInner.style.boxShadow = '0 30px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(88, 101, 242, 0.6)';
            }
            
            const pulseRing = card.querySelector('.hover-pulse-ring');
            if (pulseRing) {
                pulseRing.style.opacity = '1';
                pulseRing.style.transform = 'scale(1.1)';
            }
            
            addHoverParticles(card);
        });
        
        card.addEventListener('mouseleave', () => {
            if (window.innerWidth < 1024) return;
            
            setTimeout(() => {
                const cardIndex = parseInt(card.getAttribute('data-card-index'));
                card.style.zIndex = cardIndex === 2 ? "7" : cardIndex === 1 || cardIndex === 3 ? "6" : "5";
                
                const cardInner = card.querySelector('.card-inner');
                if (cardInner) {
                    cardInner.style.transform = '';
                    cardInner.style.boxShadow = '';
                }
                
                const pulseRing = card.querySelector('.hover-pulse-ring');
                if (pulseRing) {
                    pulseRing.style.opacity = '0';
                    pulseRing.style.transform = 'scale(1)';
                }
            }, 100);
        });
        
        card.addEventListener('click', () => {
            createClickRipple(card);
        });
    });
}

function updateCardWithMouse(card, mousePos) {
    const cardIndex = parseInt(card.getAttribute('data-card-index'));
    const baseTransform = getBaseCardTransform(cardIndex);
    
    const rotateX = (mousePos.y - 0.5) * 10; 
    const rotateY = (mousePos.x - 0.5) * 10;
    
    card.style.transform = `${baseTransform} rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
}

function addHoverParticles(card) {
    const particleCount = 6;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'hover-particle';
        
        const size = Math.random() * 3 + 1;
        const delay = Math.random() * 0.5;
        
        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: radial-gradient(circle, #fff 0%, transparent 70%);
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            opacity: 0;
            z-index: 10;
            pointer-events: none;
            animation: hoverParticleFloat 1.5s ease-out ${delay}s forwards;
        `;
        
        const keyframes = `
            @keyframes hoverParticleFloat {
                0% {
                    opacity: 0;
                    transform: translateY(0) scale(0);
                }
                30% {
                    opacity: 1;
                    transform: translateY(-20px) scale(1);
                }
                100% {
                    opacity: 0;
                    transform: translateY(-60px) scale(0.5);
                }
            }
        `;
        
        const style = document.createElement('style');
        style.textContent = keyframes;
        particle.appendChild(style);
        
        card.appendChild(particle);
        
        setTimeout(() => particle.remove(), 1500);
    }
}

function createClickRipple(card) {
    const ripple = document.createElement('div');
    ripple.className = 'click-ripple';
    
    ripple.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0);
        width: 400px;
        height: 400px;
        background: radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%);
        border-radius: 50%;
        z-index: 5;
        pointer-events: none;
        animation: clickRippleEffect 1.2s ease-out forwards;
    `;
    
    const keyframes = `
        @keyframes clickRippleEffect {
            0% {
                transform: translate(-50%, -50%) scale(0);
                opacity: 0.8;
            }
            50% {
                opacity: 0.4;
            }
            100% {
                transform: translate(-50%, -50%) scale(1);
                opacity: 0;
            }
        }
    `;
    
    const style = document.createElement('style');
    style.textContent = keyframes;
    ripple.appendChild(style);
    
    card.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 1200);
}
function showTooltip(card, event) {
    const tooltip = document.getElementById('modern-tooltip');
    if (!tooltip) return;
    
    const text = card.getAttribute('data-tooltip');
    if (!text) return;
    
    const content = tooltip.querySelector('.modern-tooltip-content');
    if (content) {
        content.textContent = text;
    }
    
    tooltip.classList.add('show');
    updateTooltipPosition(event);
    
    // Lock tooltip position
    if (card.getAttribute('data-tooltip-locked') !== 'true') {
        card.setAttribute('data-tooltip-locked', 'true');
        document.body._tooltipCard = card;
    }
}

function hideTooltip() {
    const tooltip = document.getElementById('modern-tooltip');
    if (!tooltip) return;
    
    tooltip.classList.remove('show');
    tooltip.style.visibility = 'hidden';
    
    if (document.body._tooltipCard) {
        document.body._tooltipCard.setAttribute('data-tooltip-locked', 'false');
        document.body._tooltipCard = null;
    }
}

function updateTooltipPosition(event) {
    const tooltip = document.getElementById('modern-tooltip');
    if (!tooltip || !tooltip.classList.contains('show')) return;
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Fixed position
    const x = Math.round(event.clientX);
    const y = Math.round(event.clientY);
    
    tooltip.style.visibility = 'visible';
    
    const rect = tooltip.getBoundingClientRect();
    const tooltipWidth = rect.width;
    const tooltipHeight = rect.height;
    
    // Position calculations
    let left = x - tooltipWidth / 2;
    let top = y - tooltipHeight - 15;
    
    // Ensure tooltip stays within viewport bounds
    if (left < 20) left = 20;
    if (left + tooltipWidth > viewportWidth - 20) left = viewportWidth - tooltipWidth - 20;
    
    if (top < 20) {
        top = y + 15;
        const arrow = tooltip.querySelector('.modern-tooltip-arrow');
        if (arrow) {
            arrow.style.top = '-8px';
            arrow.style.bottom = 'auto';
            arrow.style.borderTop = 'none';
            arrow.style.borderBottom = '8px solid rgba(0, 0, 0, 0.95)';
        }
    } else {
        const arrow = tooltip.querySelector('.modern-tooltip-arrow');
        if (arrow) {
            arrow.style.top = 'auto';
            arrow.style.bottom = '-8px';
            arrow.style.borderTop = '8px solid rgba(0, 0, 0, 0.95)';
            arrow.style.borderBottom = 'none';
        }
    }
    
    // Apply rounded coordinates to prevent subpixel rendering issues
    tooltip.style.left = `${Math.round(left)}px`;
    tooltip.style.top = `${Math.round(top)}px`;
}

function getCardZIndex(index) {
    switch(index) {
        case 2: return "7"; 
        case 1:
        case 3: return "6"; 
        case 0:
        case 4: return "5"; 
        default: return "5";
    }
}

function getBaseCardTransform(index) {
    const spacing = Math.min(window.innerWidth / 8, 100); 
    
    if (window.innerWidth >= 1400) {
        switch (index) {
            case 0:
                return `translateX(-${spacing * 2}px) translateY(60px) rotateY(-20deg) rotateX(5deg)`;
            case 1:
                return `translateX(-${spacing}px) translateY(30px) rotateY(-10deg) rotateX(3deg)`;
            case 2:
                return 'translateX(0) translateY(-10px) rotateY(0) rotateX(0) scale(1.1)';
            case 3:
                return `translateX(${spacing}px) translateY(30px) rotateY(10deg) rotateX(3deg)`;
            case 4:
                return `translateX(${spacing * 2}px) translateY(60px) rotateY(20deg) rotateX(5deg)`;
            default:
                return '';
        }
    } else if (window.innerWidth >= 1200) {
        switch (index) {
            case 0:
                return `translateX(-${spacing * 1.8}px) translateY(50px) rotateY(-18deg) rotateX(4deg)`;
            case 1:
                return `translateX(-${spacing * 0.9}px) translateY(25px) rotateY(-9deg) rotateX(2deg)`;
            case 2:
                return 'translateX(0) translateY(-8px) rotateY(0) rotateX(0) scale(1.08)';
            case 3:
                return `translateX(${spacing * 0.9}px) translateY(25px) rotateY(9deg) rotateX(2deg)`;
            case 4:
                return `translateX(${spacing * 1.8}px) translateY(50px) rotateY(18deg) rotateX(4deg)`;
            default:
                return '';
        }
    } else if (window.innerWidth >= 768) {
        switch (index) {
            case 0:
                return `translateX(-${spacing * 1.5}px) translateY(40px) rotateY(-15deg) rotateX(3deg)`;
            case 1:
                return `translateX(-${spacing * 0.75}px) translateY(20px) rotateY(-7deg) rotateX(1deg)`;
            case 2:
                return 'translateX(0) translateY(-5px) rotateY(0) rotateX(0) scale(1.05)';
            case 3:
                return `translateX(${spacing * 0.75}px) translateY(20px) rotateY(7deg) rotateX(1deg)`;
            case 4:
                return `translateX(${spacing * 1.5}px) translateY(40px) rotateY(15deg) rotateX(3deg)`;
            default:
                return '';
        }
    } else {
        return 'translateX(0) translateY(0) rotateY(0) rotateX(0)';
    }
}
function resetCardPosition(card, index) {
    if (!card) return;
    
    // Skip repositioning if card is being interacted with
    if (card._isHovered || 
        card.classList.contains('flipped') || 
        card.getAttribute('data-fixed-position') === 'true' ||
        card.closest('.card-wrapper')?._isActive) {
        return;
    }
    
    if (window.innerWidth < 768) {
        card.style.transform = 'translateX(0) translateY(0)';
        return;
    }
    
    const baseTransform = getBaseCardTransform(index);
    card.style.transform = baseTransform;
}

function repositionCards() {
    const cards = document.querySelectorAll('.feature-card.revealed');
    
    cards.forEach(card => {
        if (card._isHovered || card.getAttribute('data-fixed-position') === 'true') return;
        const cardIndex = parseInt(card.getAttribute('data-card-index'));
        resetCardPosition(card, cardIndex);
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.bottom >= 0
    );
}

document.addEventListener('keydown', function(event) {
    if (event.key.toLowerCase() === 'd') {
        const featuredSection = document.getElementById('featured-cards');
        if (featuredSection) {
            console.log("Debug mode toggled");
            featuredSection.classList.toggle('debug-visible');
            
            if (featuredSection.classList.contains('debug-visible')) {
                const cards = featuredSection.querySelectorAll('.feature-card');
                cards.forEach((card, i) => {
                    console.log(`Card ${i} - revealed: ${card.classList.contains('revealed')}, opacity: ${card.style.opacity}, transform: ${card.style.transform}`);
                });
            }
        }
    }
});

console.log('Enhanced Featured Cards loaded at ' + new Date().toISOString());

// Enhanced responsive handling for featured cards
function handleResponsiveLayout() {
    const featuredSection = document.getElementById('featured-cards');
    if (!featuredSection) return;
    
    const cards = featuredSection.querySelectorAll('.feature-card');
    const cardWrapper = featuredSection.querySelector('.card-wrapper');
    const isMobile = window.innerWidth <= 768;
    
    // Lock the wrapper during layout changes
    if (cardWrapper) {
        cardWrapper.setAttribute('data-stable', 'false');
        setTimeout(() => {
            cardWrapper.setAttribute('data-stable', 'true');
        }, 600);
    }
    
    cards.forEach((card, index) => {
        card.setAttribute('data-stable', 'false');
        
        if (isMobile) {
            card.style.transform = 'none';
            card.style.zIndex = '10';
            card.classList.remove('flipped');
        } else {
            const baseTransform = getBaseCardTransform(index);
            card.style.transform = baseTransform;
            card.style.zIndex = getCardZIndex(index);
        }
        
        setTimeout(() => {
            card.setAttribute('data-stable', 'true');
        }, 500);
    });
}

// Add window resize listener
window.addEventListener('resize', debounce(handleResponsiveLayout, 100));
