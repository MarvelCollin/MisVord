document.addEventListener('DOMContentLoaded', function() {
    let ticking = false;
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    initParallax();
    initScrollTransition();
    initSectionCoordination();
    handleLandingPageResize();
    initAuthIcon();
    initHeroAssets();
    initTaglineAnimation();
});

function initParallax() {
    const layers = document.querySelectorAll('.parallax-layer');
    
    if (window.innerWidth > 768 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        let mouseMoveRAF;
        document.addEventListener('mousemove', function(e) {
            if (mouseMoveRAF) return;
            
            mouseMoveRAF = requestAnimationFrame(() => {
                const x = e.clientX;
                const y = e.clientY;
                
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;
                
                const xPercent = (x / windowWidth - 0.5) * 0.5;
                const yPercent = (y / windowHeight - 0.5) * 0.5;        
                
                layers.forEach(layer => {
                    const depth = parseFloat(layer.getAttribute('data-depth'));
                    const translateX = xPercent * depth * 50;
                    const translateY = yPercent * depth * 50;
                    
                    layer.style.transform = `translate3d(${translateX}px, ${translateY}px, 0)`;
                });
                
                mouseMoveRAF = null;
            });
        }, { passive: true });
    } else {
        layers.forEach(layer => {
            layer.style.transform = 'none';
        });
    }
}

function initTaglineAnimation() {
    const taglineText = document.querySelector('.tagline-text');
    if (!taglineText || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    
    const originalText = "Confront the challenges of learning and outgrow the boundaries together.";
    taglineText.innerHTML = '';
    
    setTimeout(() => {
        let charIndex = 0;
        const words = originalText.split(' ');
        
        words.forEach((word, wordIndex) => {
            const wordSpan = document.createElement('span');
            wordSpan.style.display = 'inline-block';
            wordSpan.style.marginRight = '0.5em';
            
            const chars = word.split('');
            chars.forEach((char, charInWordIndex) => {
                const charSpan = document.createElement('span');
                charSpan.className = 'floating-char';
                charSpan.textContent = char;
                charSpan.style.cssText = `
                    display: inline-block;
                    opacity: 0;
                    transform: translateY(10px);
                    transition: all 0.4s ease-out;
                `;
                
                setTimeout(() => {
                    charSpan.style.opacity = '1';
                    charSpan.style.transform = 'translateY(0)';
                }, charIndex * 40);
                
                wordSpan.appendChild(charSpan);
                charIndex++;
            });
            
            taglineText.appendChild(wordSpan);
        });
        
        setTimeout(() => {
            const suffixElement = document.querySelector('.tagline-suffix');
            if (suffixElement) {
                suffixElement.style.opacity = '1';
                suffixElement.style.transform = 'translateY(0) scale(1)';
            }
            
            addReducedRandomMovements();
        }, (charIndex * 40) + 300);
        
    }, 1200);
}

function addReducedRandomMovements() {
    const floatingChars = document.querySelectorAll('.floating-char');
    
    floatingChars.forEach((char, index) => {
        if (index % 3 === 0) {
            setInterval(() => {
                if (Math.random() < 0.15) {
                    const randomY = (Math.random() - 0.5) * 4;
                    const randomScale = 0.98 + (Math.random() * 0.04);
                    
                    char.style.transform = `translateY(${randomY}px) scale(${randomScale})`;
                    
                    setTimeout(() => {
                        char.style.transform = 'translateY(0) scale(1)';
                    }, 400);
                }
            }, 4000 + (index * 200));
        }
    });
}
    
    setInterval(() => {
        const randomChar = floatingChars[Math.floor(Math.random() * floatingChars.length)];
        if (randomChar && Math.random() < 0.15) {
            randomChar.style.animation = `
                floatRandom 4s ease-in-out infinite,
                glowPulse 2s ease-in-out infinite alternate,
                gradientShift 3s ease-in-out infinite,
                extraBounce 1s ease-in-out
            `;
            
            setTimeout(() => {
                randomChar.style.animation = `
                    floatRandom 4s ease-in-out infinite,
                    glowPulse 2s ease-in-out infinite alternate,
                    gradientShift 3s ease-in-out infinite
                `;
            }, 1000);
        }
    }, 3000);
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
                const opacity = Math.max(0, 1 - (scrollPosition / (window.innerHeight * 0.6)));
                
                heroTitle.style.opacity = opacity;
                
                const translateY = scrollPosition * 0.3;
                heroTitle.style.transform = `translate3d(0, ${translateY}px, 0)`;
                
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
            
            featuredSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        });
    }
    
    document.addEventListener('featuredCardsVisible', function() {

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
    } else {
        const stars = document.querySelectorAll('.star');
        stars.forEach(star => {
            star.style.display = 'block';
        });
    }
    
    setTimeout(() => {
        initParallax();
    }, 100);
}

function initAuthIcon() {
    const loginIcon = document.getElementById('loginIcon');
    const userIcon = document.getElementById('userIcon');
    const userDropdown = document.getElementById('userDropdown');
    const userDropdownContainer = document.querySelector('.user-dropdown-container');
    const homeItem = document.getElementById('homeItem');
    const logoutItem = document.getElementById('logoutItem');
    
    if (loginIcon) {
        loginIcon.addEventListener('click', function(e) {
            e.preventDefault();
            
            loginIcon.style.transform = 'scale(0.95)';
            
            setTimeout(() => {
                window.location.href = '/login';
            }, 150);
        });
    }
    
    if (userIcon && userDropdown && userDropdownContainer) {
        let hoverTimeout;
        
        userDropdownContainer.addEventListener('mouseenter', function() {
            clearTimeout(hoverTimeout);
            userDropdown.classList.add('show');
        });
        
        userDropdownContainer.addEventListener('mouseleave', function() {
            hoverTimeout = setTimeout(() => {
                userDropdown.classList.remove('show');
            }, 100);
        });
        
        if (homeItem) {
            homeItem.addEventListener('click', function(e) {
                e.preventDefault();
                handleHomeNavigation();
            });
        }
        
        if (logoutItem) {
            logoutItem.addEventListener('click', function(e) {
                e.preventDefault();
                handleLogout();
            });
        }
    }
}

function handleHomeNavigation() {
    const homeItem = document.getElementById('homeItem');
    
    if (homeItem) {
        homeItem.style.opacity = '0.5';
        homeItem.style.pointerEvents = 'none';
    }
    
    const userDropdown = document.getElementById('userDropdown');
    if (userDropdown) {
        userDropdown.classList.remove('show');
    }
    
    setTimeout(() => {
        window.location.href = '/home';
    }, 150);
}

function handleLogout() {
    const logoutItem = document.getElementById('logoutItem');
    
    if (logoutItem) {
        logoutItem.style.opacity = '0.5';
        logoutItem.style.pointerEvents = 'none';
    }
    
    fetch('/logout', {
        method: 'GET',
        credentials: 'same-origin'
    })
    .then(response => {
        if (response.ok) {
            window.location.href = '/login';
        } else {
            console.error('Logout failed');
            if (logoutItem) {
                logoutItem.style.opacity = '1';
                logoutItem.style.pointerEvents = 'auto';
            }
        }
    })
    .catch(error => {
        console.error('Logout error:', error);
        if (logoutItem) {
            logoutItem.style.opacity = '1';
            logoutItem.style.pointerEvents = 'auto';
        }
    });
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

function initHeroAssets() {
    const assets = document.querySelectorAll('.floating-asset');
    
    assets.forEach((asset, index) => {
        setTimeout(() => {
            asset.classList.add('animate');
        }, 1000 + (index * 200));
    });

    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallax1 = document.querySelector('.assets-layer-1');
        const parallax2 = document.querySelector('.assets-layer-2');
        const parallax3 = document.querySelector('.assets-layer-3');
        
        if (parallax1) parallax1.style.transform = `translateY(${scrolled * 0.3}px)`;
        if (parallax2) parallax2.style.transform = `translateY(${scrolled * 0.5}px)`;
        if (parallax3) parallax3.style.transform = `translateY(${scrolled * 0.7}px)`;
    });

    setInterval(() => {
        assets.forEach(asset => {
            if (Math.random() < 0.1) {
                addRandomSparkle(asset);
            }
        });
    }, 2000);
}

function addRandomSparkle(asset) {
    const sparkle = document.createElement('div');
    sparkle.style.cssText = `
        position: absolute;
        width: 6px;
        height: 6px;
        background: linear-gradient(45deg, #fff, #5865F2);
        border-radius: 50%;
        pointer-events: none;
        top: ${Math.random() * 100}%;
        left: ${Math.random() * 100}%;
        animation: assetSparkle 1s ease-out forwards;
        z-index: 1000;
        box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
    `;
    
    asset.appendChild(sparkle);
    setTimeout(() => sparkle.remove(), 1000);
}

window.landingPageAPI = {
    initParallax,
    initScrollTransition,
    handleLandingPageResize,
    debounce,
    triggerFeaturedCardsEnhancements,
    initAuthIcon,
    handleHomeNavigation,
    handleLogout,
    initHeroAssets,
    addRandomSparkle
};
