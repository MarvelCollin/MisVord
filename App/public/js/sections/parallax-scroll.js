document.addEventListener('DOMContentLoaded', function() {
    initParallaxScroll();
    initSnapScroll();
    initScrollIndicator();
    initScrollTransitions();
});

function initParallaxScroll() {
    const heroSection = document.querySelector('.hero-section');
    const featuresSection = document.querySelector('.featured-cards-section');
    const scrambleText = document.querySelector('.scramble-text');
    
    if (!heroSection || !featuresSection || !scrambleText) return;
    
    let isTransitioning = false;
    let hasTriggeredFeatures = false;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.target === featuresSection) {
                if (!hasTriggeredFeatures) {
                    revealFeatureCards();
                    hasTriggeredFeatures = true;
                }
            }
        });
    }, { threshold: 0.3 });
    
    observer.observe(featuresSection);
    
    window.addEventListener('scroll', () => {
        const scrollPosition = window.scrollY;
        const windowHeight = window.innerHeight;
        const heroHeight = heroSection.offsetHeight;
        
        const scrollPercentage = scrollPosition / (heroHeight * 0.8);
        
        if (scrollPosition > 50) {
            scrambleText.style.filter = `blur(${Math.min(scrollPercentage * 5, 10)}px)`;
            scrambleText.style.opacity = Math.max(1 - scrollPercentage, 0);
            scrambleText.style.transform = `scale(${Math.max(1 - scrollPercentage * 0.3, 0.7)}) translateY(${Math.min(scrollPercentage * 100, 100)}px)`;
        } else {
            scrambleText.style.filter = 'blur(0px)';
            scrambleText.style.opacity = 1;
            scrambleText.style.transform = 'scale(1) translateY(0)';
        }
    });
}

function revealFeatureCards() {
    const sectionTitle = document.querySelector('.featured-cards-section .section-title');
    const sectionSubtitle = document.querySelector('.featured-cards-section .section-subtitle');
    
    if (sectionTitle) {
        sectionTitle.classList.add('revealed');
    }
    
    if (sectionSubtitle) {
        sectionSubtitle.classList.add('revealed');
    }
}

function initScrollIndicator() {
    const scrollIndicator = document.querySelector('.scroll-down-indicator');
    const featuresSection = document.querySelector('.featured-cards-section');
    
    if (scrollIndicator && featuresSection) {
        scrollIndicator.addEventListener('click', () => {
            featuresSection.scrollIntoView({ behavior: 'smooth' });
        });
    }
}

function initScrollTransitions() {
    const sections = document.querySelectorAll('.hero-section, .featured-cards-section');
    
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            
            if (rect.top < window.innerHeight * 0.5 && rect.bottom > 0) {
                section.classList.add('in-view');
                
                const parallaxElements = section.querySelectorAll('[data-parallax]');
                parallaxElements.forEach(el => {
                    const speed = el.getAttribute('data-parallax') || 0.1;
                    const y = (window.innerHeight * 0.5 - rect.top) * speed;
                    el.style.transform = `translateY(${y}px)`;
                });
            } else {
                section.classList.remove('in-view');
            }
        });
        
        lastScrollTop = scrollTop;
    });
    
    animateOnScroll();
}

function animateOnScroll() {
    const animatedElements = document.querySelectorAll('.fade-in, .slide-in');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    animatedElements.forEach(el => {
        observer.observe(el);
    });
}

function initSnapScroll() {
    const sections = document.querySelectorAll('.scroll-section');
    if (sections.length === 0) return;
    
    let isScrolling = false;
    let currentSection = 0;
    
    // Find current section based on scroll position
    function getCurrentSection() {
        const scrollPosition = window.scrollY + window.innerHeight / 2;
        
        sections.forEach((section, index) => {
            const sectionTop = section.offsetTop;
            const sectionBottom = sectionTop + section.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                currentSection = index;
            }
        });
    }
    
    // Enhanced wheel handler for section snapping
    function wheelHandler(e) {
        if (isScrolling) return;
        
        if (Math.abs(e.deltaY) < 8) return;
        
        e.preventDefault();
        isScrolling = true;
        
        getCurrentSection();
        
        let targetSection = currentSection;
        if (e.deltaY > 0 && currentSection < sections.length - 1) {
            targetSection = currentSection + 1;
        } else if (e.deltaY < 0 && currentSection > 0) {
            targetSection = currentSection - 1;
        }
        
        if (targetSection !== currentSection) {
            sections[targetSection].scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
            currentSection = targetSection;
            
            if (targetSection === 1) {
                setTimeout(() => {
                    const event = new CustomEvent('featuredCardsVisible');
                    document.dispatchEvent(event);
                }, 200);
            }
        }
        
        setTimeout(() => {
            isScrolling = false;
        }, 800);
    }
    
    // Touch handling for mobile
    let touchStartY = 0;
    
    function touchStart(e) {
        touchStartY = e.touches[0].clientY;
    }
    
    function touchEnd(e) {
        if (isScrolling) return;
        
        const touchEndY = e.changedTouches[0].clientY;
        const deltaY = touchStartY - touchEndY;
        
        // Require significant swipe distance
        if (Math.abs(deltaY) < 50) return;
        
        isScrolling = true;
        getCurrentSection();
        
        let targetSection = currentSection;
        if (deltaY > 0 && currentSection < sections.length - 1) {
            // Swipe up (scroll down)
            targetSection = currentSection + 1;
        } else if (deltaY < 0 && currentSection > 0) {
            // Swipe down (scroll up)
            targetSection = currentSection - 1;
        }
        
        if (targetSection !== currentSection) {
            sections[targetSection].scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
            currentSection = targetSection;
        }
        
        setTimeout(() => {
            isScrolling = false;
        }, 1000);
    }
    
    // Add event listeners
    window.addEventListener('wheel', wheelHandler, { passive: false });
    window.addEventListener('touchstart', touchStart, { passive: true });
    window.addEventListener('touchend', touchEnd, { passive: true });
    
    // Initialize current section
    getCurrentSection();
}