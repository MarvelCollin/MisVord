document.addEventListener('DOMContentLoaded', function() {
    initParallaxScroll();
    initCardAnimations();
    initSnapScroll();
    initScrollIndicator();
    initScrollTransitions();
});

function initParallaxScroll() {
    const heroSection = document.querySelector('.hero-section');
    const featuresSection = document.querySelector('.feature-cards-section');
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
    const sectionTitle = document.querySelector('.feature-cards-section .section-title');
    const cards = document.querySelectorAll('.feature-card');
    
    if (sectionTitle) {
        sectionTitle.classList.add('revealed');
    }
    
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('revealed');
            
            if (window.innerWidth >= 1024) {
                initCardPositioning(card, index, cards.length);
            }
        }, 300 + (index * 150));
    });
}

function initCardPositioning(card, index, totalCards) {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const radius = Math.min(window.innerWidth, window.innerHeight) * 0.25;
    let angle = 0;
    
    if (totalCards === 5) {
        if (index === 0) angle = -60;
        else if (index === 1) angle = -30;
        else if (index === 2) angle = 0;
        else if (index === 3) angle = 30;
        else if (index === 4) angle = 60;
    } else {
        angle = (index / totalCards) * 120 - 60;
    }
    
    const radian = angle * Math.PI / 180;
    const offsetX = Math.sin(radian) * radius;
    const offsetY = Math.cos(radian) * radius * 0.3 - 50;
    
    card.style.transformOrigin = 'center center';
    
    setTimeout(() => {
        card.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0) rotate3d(0, 1, 0, ${angle * 0.25}deg)`;
    }, 100);
    
    const inner = card.querySelector('.card-inner');
    if (inner) {
        if (index === 0 || index === 1) {
            inner.style.transform = 'rotateY(-15deg)';
        } else if (index === 3 || index === 4) {
            inner.style.transform = 'rotateY(15deg)';
        } else {
            inner.style.transform = 'rotateY(0deg)';
        }
    }
}

function initCardAnimations() {
    const cards = document.querySelectorAll('.feature-card');
    const container = document.querySelector('.cards-container');
    
    if (container) {
        container.addEventListener('mousemove', e => {
            const { left, top, width, height } = container.getBoundingClientRect();
            const mouseX = e.clientX - left;
            const mouseY = e.clientY - top;
            
            const centerX = width / 2;
            const centerY = height / 2;
            
            const percentX = (mouseX - centerX) / centerX;
            const percentY = (mouseY - centerY) / centerY;
            
            cards.forEach((card, index) => {
                const factor = index === 2 ? 0.05 : 0.1;
                const rotateY = 15 * percentX * factor;
                const rotateX = -15 * percentY * factor;
                const translateZ = index === 2 ? 30 : 15;
                
                const depth = index === 2 ? 40 : index === 0 || index === 4 ? 0 : 20;
                
                if (!card.classList.contains('active-card')) {
                    card.style.transform = `translateZ(${depth}px) translateX(${percentX * 10}px) translateY(${percentY * 10}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
                }
            });
        });
        
        container.addEventListener('mouseleave', () => {
            cards.forEach((card, index) => {
                if (!card.classList.contains('active-card')) {
                    if (window.innerWidth >= 1024) {
                        initCardPositioning(card, index, cards.length);
                    } else {
                        card.style.transform = '';
                    }
                }
            });
        });
    }
    
    cards.forEach((card, index) => {
        card.addEventListener('mouseenter', () => {
            card.classList.add('active-card');
            const inner = card.querySelector('.card-inner');
            if (inner) {
                inner.style.transform = 'rotateY(180deg)';
            }
            
            if (window.innerWidth >= 1024) {
                card.style.zIndex = 10;
                card.style.transform = `scale(1.1) translateZ(60px)`;
            }
        });
        
        card.addEventListener('mouseleave', () => {
            card.classList.remove('active-card');
            const inner = card.querySelector('.card-inner');
            
            if (inner) {
                if (index === 0 || index === 1) {
                    inner.style.transform = 'rotateY(-15deg)';
                } else if (index === 3 || index === 4) {
                    inner.style.transform = 'rotateY(15deg)';
                } else {
                    inner.style.transform = 'rotateY(0deg)';
                }
            }
            
            if (window.innerWidth >= 1024) {
                setTimeout(() => {
                    card.style.zIndex = index === 2 ? 5 : index === 0 || index === 4 ? 1 : 2;
                    initCardPositioning(card, index, cards.length);
                }, 300);
            }
        });
        
        const cardFront = card.querySelector('.card-front');
        const cardBack = card.querySelector('.card-back');
        
        if (cardFront && cardBack) {
            const shine = document.createElement('div');
            shine.classList.add('card-shine');
            cardFront.appendChild(shine);
            
            const backShine = document.createElement('div');
            backShine.classList.add('card-shine');
            cardBack.appendChild(backShine);
        }
        
        card.addEventListener('mousemove', e => {
            const { left, top, width, height } = card.getBoundingClientRect();
            const x = (e.clientX - left) / width - 0.5;
            const y = (e.clientY - top) / height - 0.5;
            
            const inner = card.querySelector('.card-inner');
            
            if (inner) {
                const tiltAmount = 10;
                let originalRotateY;
                
                if (inner.style.transform.includes('rotateY(180deg)')) {
                    originalRotateY = 180;
                } else {
                    if (index <= 1) originalRotateY = -15;
                    else if (index >= 3) originalRotateY = 15;
                    else originalRotateY = 0;
                }
                
                inner.style.transform = `rotateY(${originalRotateY}deg) rotateX(${y * -tiltAmount}deg) rotateZ(${x * tiltAmount/2}deg)`;
            }
            
            const shine = card.querySelector('.card-shine');
            if (shine) {
                shine.style.opacity = '1';
                shine.style.transform = `translateX(${x * 50}px) translateY(${y * 50}px)`;
            }
        });
    });
    
    // Add resize handler to adjust card positioning
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 1024) {
            cards.forEach((card, index) => {
                if (card.classList.contains('revealed') && !card.classList.contains('active-card')) {
                    initCardPositioning(card, index, cards.length);
                }
            });
        } else {
            cards.forEach(card => {
                card.style.transform = '';
            });
        }
    });
}

function initSnapScroll() {
    const sections = document.querySelectorAll('.scroll-section, .hero-section, .feature-cards-section');
    let isScrolling = false;
    let currentSection = 0;
    
    // Disable default scroll behavior
    window.addEventListener('wheel', function(e) {
        if (isScrolling) return;
        
        isScrolling = true;
        
        if (e.deltaY > 0 && currentSection < sections.length - 1) {
            // Scroll down
            currentSection++;
        } else if (e.deltaY < 0 && currentSection > 0) {
            // Scroll up
            currentSection--;
        }
        
        sections[currentSection].scrollIntoView({ behavior: 'smooth' });
        
        setTimeout(() => {
            isScrolling = false;
        }, 1000);
        
        e.preventDefault();
    }, { passive: false });
    
    // Handle touch events for mobile
    let touchStartY = 0;
    
    window.addEventListener('touchstart', function(e) {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    window.addEventListener('touchend', function(e) {
        if (isScrolling) return;
        
        const touchEndY = e.changedTouches[0].clientY;
        const diff = touchStartY - touchEndY;
        
        if (Math.abs(diff) < 50) return;
        
        isScrolling = true;
        
        if (diff > 0 && currentSection < sections.length - 1) {
            // Swipe up (scroll down)
            currentSection++;
        } else if (diff < 0 && currentSection > 0) {
            // Swipe down (scroll up)
            currentSection--;
        }
        
        sections[currentSection].scrollIntoView({ behavior: 'smooth' });
        
        setTimeout(() => {
            isScrolling = false;
        }, 1000);
    }, { passive: true });
}

function initScrollIndicator() {
    const scrollIndicator = document.querySelector('.scroll-down-indicator');
    const featuresSection = document.querySelector('.feature-cards-section');
    
    if (scrollIndicator && featuresSection) {
        scrollIndicator.addEventListener('click', () => {
            featuresSection.scrollIntoView({ behavior: 'smooth' });
        });
    }
}

function initScrollTransitions() {
    const sections = document.querySelectorAll('.hero-section, .feature-cards-section');
    const navbar = document.querySelector('.navbar'); 
    
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const scrollDirection = scrollTop > lastScrollTop ? 'down' : 'up';
        
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
        
        if (navbar) {
            if (scrollDirection === 'down' && scrollTop > 100) {
                navbar.classList.add('navbar-hidden');
            } else {
                navbar.classList.remove('navbar-hidden');
            }
        }
        
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