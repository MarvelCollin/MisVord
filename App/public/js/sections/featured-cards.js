document.addEventListener('DOMContentLoaded', function() {
    initFeaturedCards();
});

function initFeaturedCards() {
    const featuredSection = document.getElementById('featured-cards');
    if (!featuredSection) return;

    const cards = featuredSection.querySelectorAll('.feature-card');
    const sectionTitle = featuredSection.querySelector('.section-title');
    const sectionSubtitle = featuredSection.querySelector('.section-subtitle');

    
    if (sectionTitle) {
        animateTitle(sectionTitle);
    }
    if (sectionSubtitle) {
        setTimeout(() => {
            sectionSubtitle.classList.add('revealed');
        }, 300);
    }

    
    cards.forEach((card, index) => {
        card.setAttribute('data-card-index', index);
        card._isHovered = false;
        card._isFlipped = false;
        
        setupDynamicDescription(card);
        addEnhancedCardParticles(card);
        setupCardMouseTracking(card);
        
        
        card.style.opacity = '1';
        card.style.visibility = 'visible';
        card.style.willChange = 'transform, filter';
    });

    
    setTimeout(() => {
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('revealed');
                if (window.innerWidth > 768) {
                    const vShapeTransform = getVShapeTransform(index);
                    card.style.transform = vShapeTransform;
                }
            }, index * 150);
        });
    }, 500);

    
    if (window.innerWidth > 768) {
        initEnhancedDesktopInteractions(cards);
    } else {
        initEnhancedMobileInteractions(cards);
    }

    
    window.addEventListener('resize', debounce(() => {
        handleResponsiveLayout(cards);
    }, 200));
}

function animateTitle(titleElement) {
    titleElement.style.opacity = '1';
    titleElement.style.transform = 'translateY(0)';
    titleElement.style.display = 'block';
    titleElement.style.visibility = 'visible';
    titleElement.classList.add('revealed');
    
    
    splitTextIntoChars(titleElement);
}

function splitTextIntoChars(element) {
    const text = element.textContent;
    element.innerHTML = '';
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === ' ') {
            element.appendChild(document.createTextNode(' '));
        } else {
            const span = document.createElement('span');
            span.textContent = char;
            span.className = 'char';
            span.style.transitionDelay = `${i * 0.03}s`;
            span.style.opacity = '1';
            span.style.transform = 'translateY(0)';
            element.appendChild(span);
        }
    }
}

function setupDynamicDescription(card) {
    const tooltipContent = card.getAttribute('data-tooltip');
    const backFace = card.querySelector('.card-back');
    const descriptionElement = backFace.querySelector('.card-description');
    
    if (tooltipContent && descriptionElement) {
        descriptionElement.textContent = tooltipContent;
    }
}

function addEnhancedCardParticles(card) {
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'card-particles enhanced';
    
    
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'card-particle';
        particle.style.left = (10 + Math.random() * 80) + '%';
        particle.style.animationDelay = Math.random() * 3 + 's';
        particle.style.animationDuration = (2 + Math.random() * 2) + 's';
        
        
        const size = 1 + Math.random() * 2;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        
        particlesContainer.appendChild(particle);
    }
    
    card.appendChild(particlesContainer);
}

function setupCardMouseTracking(card) {
    card.addEventListener('mousemove', (e) => {
        if (window.innerWidth <= 768) return;
        
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        card.style.setProperty('--mouse-x', x + '%');
        card.style.setProperty('--mouse-y', y + '%');
        
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((e.clientY - rect.top - centerY) / centerY) * 5;
        const rotateY = ((e.clientX - rect.left - centerX) / centerX) * 5;
        
        if (card._isHovered && !card._isFlipped) {
            card.style.transform = `${getVShapeTransform(parseInt(card.dataset.cardIndex))} 
                                   rotateX(${-rotateX}deg) rotateY(${rotateY}deg) 
                                   translateZ(20px)`;
        }
    });
}

function getVShapeTransform(index) {
    const spacing = Math.min(window.innerWidth / 8, 100);

    switch (index) {
        case 0:
            return `translateX(-${spacing * 2}px) translateY(20px)`;
        case 1:
            return `translateX(-${spacing}px) translateY(10px)`;
        case 2:
            return `translateX(0px) translateY(0px)`;
        case 3:
            return `translateX(${spacing}px) translateY(10px)`;
        case 4:
            return `translateX(${spacing * 2}px) translateY(20px)`;
        default:
            return 'translateX(0px) translateY(0px)';
    }
}

function initEnhancedDesktopInteractions(cards) {
    cards.forEach((card, index) => {
        let hoverTimeout;
        let flipTimeout;

        card.addEventListener('mouseenter', (e) => {
            card._isHovered = true;
            
            
            card.style.transition = 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)';
            card.style.transform = `${getVShapeTransform(index)} translateY(-15px) scale(1.05)`;
            card.style.filter = 'drop-shadow(0 25px 50px rgba(255, 107, 53, 0.4))';
            card.style.zIndex = '200';
            
            
            const particles = card.querySelector('.card-particles');
            if (particles) {
                particles.classList.add('active');
            }

            
            hoverTimeout = setTimeout(() => {
                if (!card._isHovered) return;

                const currentlyFlipped = document.querySelector('.feature-card.flipped');
                if (currentlyFlipped && currentlyFlipped !== card) {
                    resetCard(currentlyFlipped);
                }

                flipCard(card, true);
            }, 800);
        });

        card.addEventListener('mouseleave', () => {
            card._isHovered = false;
            clearTimeout(hoverTimeout);
            clearTimeout(flipTimeout);

            
            const particles = card.querySelector('.card-particles');
            if (particles) {
                particles.classList.remove('active');
            }

            
            setTimeout(() => {
                resetCard(card, index);
            }, 100);
        });
    });
}

function initEnhancedMobileInteractions(cards) {
    cards.forEach((card, index) => {
        card.addEventListener('click', (event) => {
            event.preventDefault();
            
            const isFlipped = card._isFlipped;

            
            cards.forEach(c => resetCard(c));

            if (!isFlipped) {
                flipCard(card, true);
                
                
                const particles = card.querySelector('.card-particles');
                if (particles) {
                    particles.classList.add('active');
                }
            }
        });
    });
}

function flipCard(card, shouldFlip) {
    card._isFlipped = shouldFlip;
    
    if (shouldFlip) {
        card.classList.add('flipped');
        card.style.transform = `${card.style.transform} rotateY(180deg)`;
        
        
        const cardInner = card.querySelector('.card-inner');
        if (cardInner) {
            cardInner.style.transition = 'transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        }
    } else {
        card.classList.remove('flipped');
        const cardInner = card.querySelector('.card-inner');
        if (cardInner) {
            cardInner.style.transition = 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)';
        }
    }
}

function resetCard(card, index = null) {
    if (!card) return;
    
    const cardIndex = index !== null ? index : parseInt(card.dataset.cardIndex);
    
    card._isHovered = false;
    card._isFlipped = false;
    card.classList.remove('flipped');
    
    
    const particles = card.querySelector('.card-particles');
    if (particles) {
        particles.classList.remove('active');
    }
    
    
    card.style.transition = 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
    
    if (window.innerWidth > 768) {
        card.style.transform = getVShapeTransform(cardIndex);
        card.style.filter = 'drop-shadow(0 15px 35px rgba(0, 0, 0, 0.4))';
    } else {
        card.style.transform = 'none';
        card.style.filter = 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.3))';
    }
    
    card.style.zIndex = getCardZIndex(cardIndex);
    
    
    const cardInner = card.querySelector('.card-inner');
    if (cardInner) {
        cardInner.style.transition = 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)';
    }
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

function handleResponsiveLayout(cards) {
    const featuredSection = document.getElementById('featured-cards');
    if (!featuredSection) return;

    const isMobile = window.innerWidth <= 768;

    cards.forEach((card, index) => {
        
        clearTimeout(card._stabilizeTimeout);
        card.classList.remove('hover-locked');

        
        resetCard(card, index);

        if (isMobile) {
            
            card.style.transform = 'none';
            card.style.zIndex = '10';
            card.style.filter = 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.3))';
            card.style.willChange = 'transform';
        } else {
            
            const vShapeTransform = getVShapeTransform(index);
            card.style.transform = vShapeTransform;
            card.style.zIndex = getCardZIndex(index);
            card.style.filter = 'drop-shadow(0 15px 35px rgba(0, 0, 0, 0.4))';
            card.style.willChange = 'transform, filter';
        }

        card.style.transition = 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1), filter 0.4s ease';
        
        
        setupDynamicDescription(card);
    });

    
    if (isMobile) {
        initEnhancedMobileInteractions(cards);
    } else {
        initEnhancedDesktopInteractions(cards);
    }
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


function addPassiveEventListener(element, event, handler) {
    element.addEventListener(event, handler, { passive: true });
}


if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            if (entry.entryType === 'paint') {
                console.log(`${entry.name}: ${entry.startTime}ms`);
            }
        }
    });
    observer.observe({ entryTypes: ['paint'] });
}

console.log('Optimized Enhanced Featured Cards (No Tooltips) loaded at ' + new Date().toISOString());