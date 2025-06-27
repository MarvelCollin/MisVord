document.addEventListener('DOMContentLoaded', function() {
    console.log('Landing page initializing...');
    
    initParallax();
    initScrollTransition();
    initSectionCoordination();
    handleLandingPageResize();
    initScrollEnhancements();
    
    console.log('Landing page initialized successfully');
});

function initParallax() {
    const layers = document.querySelectorAll('.parallax-layer');
    
    if (window.innerWidth > 768) {
        document.addEventListener('mousemove', function(e) {
            const x = e.clientX;
            const y = e.clientY;
            
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            
            const xPercent = x / windowWidth - 0.5;
            const yPercent = y / windowHeight - 0.5;        
            
            layers.forEach(layer => {
                const depth = parseFloat(layer.getAttribute('data-depth'));
                const translateX = xPercent * depth * 100;
                const translateY = yPercent * depth * 100;
                
                layer.style.transform = `translate(${translateX}px, ${translateY}px)`;
            });
        });
    } else {
        layers.forEach(layer => {
            layer.style.transform = 'none';
        });
    }
}

function initScrollTransition() {
    const heroSection = document.querySelector('.hero-section');
    const heroTitle = document.querySelector('.hero-title');
    
    if (!heroSection || !heroTitle) return;
    
    let ticking = false;
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const scrollPosition = window.scrollY;
                const opacity = Math.max(0, 1 - (scrollPosition / (window.innerHeight * 0.5)));
                
                heroTitle.style.opacity = opacity;
                
                const translateY = scrollPosition * 0.5;
                heroTitle.style.transform = `translateY(${translateY}px)`;
                
                const layers = document.querySelectorAll('.parallax-layer');
                layers.forEach(layer => {
                    const depth = parseFloat(layer.getAttribute('data-depth'));
                    const translateY = scrollPosition * depth;
                    
                    const currentTransform = layer.style.transform;
                    if (currentTransform.includes('translate(')) {
                        const existingTranslate = currentTransform.match(/translate\(([^)]+)\)/)[1].split(',');
                        const existingX = parseFloat(existingTranslate[0]);
                        
                        layer.style.transform = `translate(${existingX}px, ${translateY}px)`;
                    } else {
                        layer.style.transform = `translateY(${translateY}px)`;
                    }
                });
                
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

function initSectionCoordination() {
    const featuredSection = document.querySelector('.featured-cards-section');
    const scrollIndicator = document.querySelector('.scroll-down-indicator');
    
    if (scrollIndicator && featuredSection) {
        scrollIndicator.addEventListener('click', (e) => {
            e.preventDefault();
            
            document.body.style.scrollSnapType = 'none';
            
            featuredSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
            
            setTimeout(() => {
                document.body.style.scrollSnapType = 'y proximity';
            }, 1000);
        });
    }
    
    document.addEventListener('featuredCardsVisible', function() {
        console.log('Featured cards section is now visible');
    });
    
    let coordinationTicking = false;
    window.addEventListener('scroll', () => {
        if (!coordinationTicking) {
            requestAnimationFrame(() => {
                handleSectionCoordination();
                coordinationTicking = false;
            });
            coordinationTicking = true;
        }
    }, { passive: true });
}

function handleSectionCoordination() {
    const heroSection = document.querySelector('.hero-section');
    const featuredSection = document.querySelector('.featured-cards-section');
    
    if (!heroSection || !featuredSection) return;
    
    const heroRect = heroSection.getBoundingClientRect();
    const featuredRect = featuredSection.getBoundingClientRect();
    
    const scrollIndicator = document.querySelector('.scroll-down-indicator');
    if (scrollIndicator) {
        if (heroRect.bottom > window.innerHeight * 0.5) {
            scrollIndicator.style.opacity = '1';
            scrollIndicator.style.visibility = 'visible';
        } else {
            scrollIndicator.style.opacity = '0';
            scrollIndicator.style.visibility = 'hidden';
        }
    }
    
    if (featuredRect.top < window.innerHeight * 0.7 && featuredRect.bottom > 0) {
        if (!featuredSection.dataset.animated) {
            featuredSection.dataset.animated = 'true';
            
            const sectionTitle = featuredSection.querySelector('[data-animate="title"]');
            const sectionSubtitle = featuredSection.querySelector('[data-animate="subtitle"]');
            
            if (sectionTitle) {
                sectionTitle.classList.add('revealed');
            }
            
            if (sectionSubtitle) {
                setTimeout(() => {
                    sectionSubtitle.classList.add('revealed');
                }, 200);
            }
            
            const event = new CustomEvent('featuredCardsVisible');
            document.dispatchEvent(event);
        }
    }
}

function initScrollEnhancements() {
    const sections = document.querySelectorAll('.scroll-section');
    
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                
                if (entry.target.classList.contains('featured-cards-section')) {
                    triggerFeaturedCardsEnhancements();
                }
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    sections.forEach(section => {
        sectionObserver.observe(section);
    });
    
    document.addEventListener('wheel', (e) => {
        if (Math.abs(e.deltaY) > 50) {
            document.body.style.scrollSnapType = 'none';
            clearTimeout(window.snapTimeout);
            window.snapTimeout = setTimeout(() => {
                document.body.style.scrollSnapType = 'y proximity';
            }, 100);
        }
    }, { passive: true });
}

function triggerFeaturedCardsEnhancements() {
    const cards = document.querySelectorAll('.featured-card');
    
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.style.transition = 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0) scale(1)';
        }, index * 100);
    });
    
    const parallaxCards = document.querySelectorAll('.parallax-card');
    parallaxCards.forEach(card => {
        const enhancedDepth = parseFloat(card.dataset.enhancedDepth) || 0.8;
        card.style.willChange = 'transform';
    });
}

function handleLandingPageResize() {
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        const layers = document.querySelectorAll('.parallax-layer');
        layers.forEach(layer => {
            layer.style.transform = 'none';
        });
        
        const stars = document.querySelectorAll('.star');
        stars.forEach((star, index) => {
            if (index > 30) {
                star.style.display = 'none';
            }
        });
        
        const cards = document.querySelectorAll('.featured-card');
        cards.forEach(card => {
            card.style.transform = 'none';
        });
        
        document.body.style.scrollSnapType = 'y proximity';
    } else {
        const stars = document.querySelectorAll('.star');
        stars.forEach(star => {
            star.style.display = 'block';
        });
        
        document.body.style.scrollSnapType = 'y proximity';
    }
    
    setTimeout(() => {
        initParallax();
    }, 100);
}

window.addEventListener('resize', debounce(handleLandingPageResize, 150));

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

window.landingPageAPI = {
    initParallax,
    initScrollTransition,
    handleLandingPageResize,
    debounce,
    triggerFeaturedCardsEnhancements
};
