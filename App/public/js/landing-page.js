/**
 * MiscVord Landing Page JavaScript
 * Handles all interactive elements and animations for the landing page
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the feature carousel
    initializeFeatureCarousel();
    
    // Create dynamic background effects
    createBackgroundEffects();
    
    // Setup interactive elements
    setupInteractions();
    
    // Initialize other carousels
    initializeOtherCarousels();
    
    // Add text scramble effect to hero title
    initTextScramble();
});

/**
 * Initialize the main feature carousel with enhanced interactions
 */
function initializeFeatureCarousel() {
    const track = document.querySelector('.carousel-track');
    if (!track) return;
    
    const cards = document.querySelectorAll('.feature-card');
    const indicators = document.querySelectorAll('.nav-indicators .indicator');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    let currentIndex = 0;

    // Determine how many cards to show based on screen size
    const cardsPerView = window.innerWidth > 768 ? 3 : 1;
    const cardWidth = 100 / cardsPerView;
    
    // Set initial state
    updateCarousel();
    
    // Add button event listeners
    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            currentIndex = Math.max(0, currentIndex - 1);
            updateCarousel();
        });
        
        nextBtn.addEventListener('click', () => {
            currentIndex = Math.min(cards.length - cardsPerView, currentIndex + 1);
            updateCarousel();
        });
    }
    
    // Add indicator event listeners
    indicators.forEach(indicator => {
        indicator.addEventListener('click', () => {
            currentIndex = parseInt(indicator.dataset.index || 0);
            if (currentIndex > cards.length - cardsPerView) {
                currentIndex = cards.length - cardsPerView;
            }
            updateCarousel();
        });
    });
    
    // Add keyboard navigation
    document.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft') {
            currentIndex = Math.max(0, currentIndex - 1);
            updateCarousel();
        } else if (e.key === 'ArrowRight') {
            currentIndex = Math.min(cards.length - cardsPerView, currentIndex + 1);
            updateCarousel();
        }
    });
    
    // Update carousel position and active states
    function updateCarousel() {
        if (!track) return;
        track.style.transform = `translateX(-${currentIndex * cardWidth}%)`;
        
        // Update indicators
        indicators.forEach((indicator, index) => {
            if (index === currentIndex) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
        
        // Update button states
        if (prevBtn) prevBtn.disabled = currentIndex === 0;
        if (nextBtn) nextBtn.disabled = currentIndex >= cards.length - cardsPerView;
        
        // Add active class to visible cards for animations
        cards.forEach((card, index) => {
            if (index >= currentIndex && index < currentIndex + cardsPerView) {
                card.classList.add('visible');
                // Trigger feature-specific animations when card becomes visible
                setupFeatureSpecificAnimations(card);
            } else {
                card.classList.remove('visible');
            }
        });
    }
    
    // Setup expand/collapse for each card
    cards.forEach(card => {
        const expandBtn = card.querySelector('.card-expand-btn');
        const collapseBtn = card.querySelector('.card-collapse-btn');
        
        if (expandBtn) {
            expandBtn.addEventListener('click', () => {
                cards.forEach(c => c.classList.remove('expanded'));
                card.classList.add('expanded');
            });
        }
        
        if (collapseBtn) {
            collapseBtn.addEventListener('click', () => {
                card.classList.remove('expanded');
            });
        }
        
        // Add hover 3D effect
        card.addEventListener('mousemove', e => {
            if (card.classList.contains('expanded')) return;
            
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const angleX = (y - centerY) / 20;
            const angleY = (centerX - x) / 20;
            
            const cardContent = card.querySelector('.card-content');
            if (cardContent) {
                cardContent.style.transform = 
                    `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg)`;
            }
        });
        
        card.addEventListener('mouseleave', () => {
            if (card.classList.contains('expanded')) return;
            const cardContent = card.querySelector('.card-content');
            if (cardContent) {
                cardContent.style.transform = 
                    'perspective(1000px) rotateX(0) rotateY(0)';
            }
        });
    });
    
    // Add auto rotation if desired
    let autoRotationInterval;
    
    function startAutoRotation() {
        autoRotationInterval = setInterval(() => {
            if (currentIndex < cards.length - cardsPerView) {
                currentIndex++;
                updateCarousel();
            } else {
                currentIndex = 0;
                updateCarousel();
            }
        }, 5000);
    }
    
    function stopAutoRotation() {
        clearInterval(autoRotationInterval);
    }
    
    // Uncomment to enable auto rotation
    // startAutoRotation();
    
    // Stop rotation on hover or touch
    const carouselSection = document.querySelector('.carousel-section');
    if (carouselSection) {
        carouselSection.addEventListener('mouseenter', stopAutoRotation);
        carouselSection.addEventListener('mouseleave', startAutoRotation);
        carouselSection.addEventListener('touchstart', stopAutoRotation, { passive: true });
    }
    
    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const newCardsPerView = window.innerWidth > 768 ? 3 : 1;
            if (cardsPerView !== newCardsPerView) {
                location.reload();
            }
        }, 250);
    });
}

/**
 * Creates background effects for the carousel section
 */
function createBackgroundEffects() {
    // Create animated orbs in background
    animateBackgroundOrbs();
    
    // Create particles for feature highlight section
    createParticles();
}

/**
 * Animates background orbs with parallax effect
 */
function animateBackgroundOrbs() {
    const orbs = document.querySelectorAll('.gradient-orb');
    
    window.addEventListener('mousemove', e => {
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        orbs.forEach((orb, index) => {
            const speed = 0.05 + (index * 0.01);
            const x = (mouseX - 0.5) * speed * 100;
            const y = (mouseY - 0.5) * speed * 100;
            
            orb.style.transform = `translate(${x}px, ${y}px)`;
        });
    });
}

/**
 * Creates particles for feature highlight section
 */
function createParticles() {
    const container = document.querySelector('.particles-container');
    if (!container) return;
    
    const particleCount = Math.min(30, Math.floor(window.innerWidth / 30));
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random size, position and animation delay
        const size = Math.random() * 5 + 2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 5}s`;
        particle.style.opacity = Math.random() * 0.5 + 0.1;
        
        container.appendChild(particle);
    }
}

/**
 * Sets up feature-specific animations for each card
 */
function setupFeatureSpecificAnimations(card) {
    if (!card || !card.dataset.feature) return;
    
    const feature = card.dataset.feature;
    
    // Clear existing animations/intervals
    if (card.animationInterval) {
        clearInterval(card.animationInterval);
    }
    
    switch(feature) {
        case 'chat':
            // Typing animation for chat messages
            const messages = card.querySelectorAll('.chat-message');
            messages.forEach((msg, index) => {
                if (msg.classList.contains('incoming')) {
                    setTimeout(() => {
                        simulateTyping(msg.querySelector('.message-text'));
                    }, index * 1000);
                }
            });
            break;
            
        case 'voice':
            // Animate audio wave for speaking users
            const audioWaves = card.querySelectorAll('.audio-waves');
            audioWaves.forEach(wave => {
                if (!wave.parentElement.classList.contains('speaking')) {
                    return;
                }
                
                // Randomly activate/deactivate waves to simulate speech
                card.animationInterval = setInterval(() => {
                    const spans = wave.querySelectorAll('span');
                    spans.forEach(span => {
                        // Random height for each bar
                        const height = Math.floor(Math.random() * 12) + 3;
                        span.style.height = `${height}px`;
                    });
                }, 200);
            });
            break;
            
        case 'video':
            // Pulse animation for video frames
            const videoFrames = card.querySelectorAll('.video-frame');
            videoFrames.forEach(frame => {
                frame.classList.add('pulse-subtle');
                
                // Add small random movements to video placeholders
                const placeholder = frame.querySelector('.video-placeholder');
                if (placeholder) {
                    card.animationInterval = setInterval(() => {
                        const x = (Math.random() - 0.5) * 10;
                        const y = (Math.random() - 0.5) * 10;
                        placeholder.style.transform = `translate(${x}px, ${y}px)`;
                    }, 2000);
                }
            });
            break;
            
        case 'nitro':
            // Rocket animation
            const rocket = card.querySelector('.rocket');
            if (rocket) {
                card.animationInterval = setInterval(() => {
                    rocket.classList.add('launch');
                    
                    setTimeout(() => {
                        rocket.classList.remove('launch');
                    }, 2000);
                }, 4000);
            }
            break;
            
        case 'community':
            // Animate community bubbles
            const bubbles = card.querySelectorAll('.community-bubble');
            bubbles.forEach((bubble, index) => {
                // Slightly different animation for each bubble
                const delay = index * 0.5;
                bubble.style.animation = `float ${3 + index}s ease-in-out ${delay}s infinite alternate`;
            });
            break;
            
        case 'stats':
            // Animate chart bars
            const chartBars = card.querySelectorAll('.chart-bar');
            chartBars.forEach((bar, index) => {
                setTimeout(() => {
                    bar.classList.add('animate');
                }, index * 100);
            });
            
            // Periodically update numbers to show "live" data
            card.animationInterval = setInterval(() => {
                const metricValues = card.querySelectorAll('.metric-value');
                metricValues.forEach(value => {
                    // Get current value and add small random change
                    let currentValue = parseInt(value.textContent.replace(/,/g, ''));
                    const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
                    currentValue += change;
                    
                    // Format with commas
                    value.textContent = currentValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                    
                    // Update growth indicators
                    const growthElement = value.parentElement.querySelector('.metric-growth');
                    if (growthElement) {
                        const isPositive = Math.random() > 0.3; // 70% chance of positive
                        const growthValue = Math.floor(Math.random() * 10) + 1;
                        
                        growthElement.textContent = isPositive ? `+${growthValue}%` : `-${growthValue}%`;
                        growthElement.className = isPositive ? 'metric-growth positive' : 'metric-growth negative';
                    }
                });
            }, 5000);
            break;
    }
}

/**
 * Simulates typing text character by character
 */
function simulateTyping(element) {
    if (!element) return;
    
    const text = element.textContent;
    element.textContent = '';
    element.style.opacity = 1;
    
    let i = 0;
    const interval = setInterval(() => {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
        } else {
            clearInterval(interval);
        }
    }, 40);
}

/**
 * Sets up interactive elements throughout the page
 */
function setupInteractions() {
    // Add 3D tilt effect to highlight card
    const highlightCard = document.querySelector('.highlight-card');
    if (highlightCard) {
        document.addEventListener('mousemove', e => {
            const { clientX, clientY } = e;
            const rect = highlightCard.getBoundingClientRect();
            
            // Calculate mouse position relative to card center
            const x = clientX - rect.left - rect.width / 2;
            const y = clientY - rect.top - rect.height / 2;
            
            // Calculate rotation angle based on mouse position
            const maxRotation = 5; // max rotation in degrees
            const angleX = (y / rect.height) * maxRotation * -1;
            const angleY = (x / rect.width) * maxRotation;
            
            // Apply the rotation
            highlightCard.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg)`;
            
            // Move 3D layers slightly for parallax effect
            const layers = highlightCard.querySelectorAll('.card-3d-layer');
            layers.forEach((layer, index) => {
                const depth = (layers.length - index) * 10;
                layer.style.transform = `translateZ(-${depth}px) translateX(${x * 0.01}px) translateY(${y * 0.01}px)`;
            });
        });
        
        // Reset rotation when mouse leaves
        highlightCard.addEventListener('mouseleave', () => {
            highlightCard.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
            
            const layers = highlightCard.querySelectorAll('.card-3d-layer');
            layers.forEach((layer, index) => {
                const depth = (layers.length - index) * 10;
                layer.style.transform = `translateZ(-${depth}px)`;
            });
        });
    }
    
    // Add mouse trail effect to cursor
    addMouseTrail();
    
    // Add parallax effect to floating elements
    addParallaxEffects();
    
    // Mobile menu toggle
    setupMobileMenu();
}

/**
 * Adds a mouse trail effect
 */
function addMouseTrail() {
    const trailElements = 20;
    const trail = [];
    const trailContainer = document.createElement('div');
    trailContainer.className = 'mouse-trail-container';
    trailContainer.style.position = 'fixed';
    trailContainer.style.pointerEvents = 'none';
    trailContainer.style.zIndex = '9999';
    document.body.appendChild(trailContainer);
    
    // Create trail elements
    for (let i = 0; i < trailElements; i++) {
        const dot = document.createElement('div');
        dot.className = 'trail-dot';
        dot.style.position = 'absolute';
        dot.style.width = '5px';
        dot.style.height = '5px';
        dot.style.borderRadius = '50%';
        dot.style.backgroundColor = 'rgba(88, 101, 242, 0.7)';
        dot.style.transition = 'transform 0.1s, opacity 0.5s';
        dot.style.opacity = (trailElements - i) / trailElements * 0.6;
        dot.style.transform = 'scale(0)';
        trailContainer.appendChild(dot);
        trail.push({
            element: dot,
            x: 0,
            y: 0,
            scale: (trailElements - i) / trailElements
        });
    }
    
    // Move trail based on mouse position with delay
    document.addEventListener('mousemove', e => {
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        setTimeout(() => {
            trail[0].x = mouseX;
            trail[0].y = mouseY;
            trail[0].element.style.transform = `translate(${mouseX}px, ${mouseY}px) scale(${trail[0].scale})`;
            
            // Update trail positions with delay
            for (let i = 1; i < trail.length; i++) {
                setTimeout(() => {
                    trail[i].x = trail[i - 1].x;
                    trail[i].y = trail[i - 1].y;
                    trail[i].element.style.transform = `translate(${trail[i].x}px, ${trail[i].y}px) scale(${trail[i].scale})`;
                }, i * 20);
            }
        }, 10);
    });
}

/**
 * Adds parallax effects to floating elements
 */
function addParallaxEffects() {
    const floatingElements = document.querySelectorAll('.floating-element');
    
    document.addEventListener('mousemove', e => {
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        floatingElements.forEach(element => {
            const speed = parseFloat(element.dataset.speed || 0.2);
            const rotation = parseFloat(element.dataset.rotation || 0);
            const amplitude = parseFloat(element.dataset.amplitude || 20);
            
            const xOffset = (mouseX - 0.5) * amplitude * speed;
            const yOffset = (mouseY - 0.5) * amplitude * speed;
            const rotate = (mouseX - 0.5) * rotation;
            
            element.style.transform = `translate(${xOffset}px, ${yOffset}px) rotate(${rotate}deg)`;
        });
    });
}

/**
 * Initializes other carousels on the page
 */
function initializeOtherCarousels() {
    // Initialize testimonial carousel if it exists
    const testimonialCarousel = document.querySelector('.testimonial-carousel');
    if (testimonialCarousel && window.Swiper) {
        new Swiper(testimonialCarousel, {
            slidesPerView: window.innerWidth > 768 ? 2 : 1,
            spaceBetween: 30,
            grabCursor: true,
            pagination: {
                el: '.testimonial-scrollbar',
                type: 'progressbar'
            },
            keyboard: {
                enabled: true
            },
            autoplay: {
                delay: 5000,
                disableOnInteraction: true
            },
            effect: 'coverflow',
            coverflowEffect: {
                rotate: 30,
                stretch: 0,
                depth: 100,
                modifier: 1,
                slideShadows: false
            }
        });
    }
    
    // Initialize circular carousel if it exists
    const circularCarousel = document.querySelector('.circular-carousel');
    if (circularCarousel && window.Swiper) {
        new Swiper(circularCarousel, {
            effect: 'coverflow',
            grabCursor: true,
            centeredSlides: true,
            slidesPerView: 'auto',
            coverflowEffect: {
                rotate: 50,
                stretch: 0,
                depth: 100,
                modifier: 1,
                slideShadows: false
            },
            pagination: {
                el: '.circular-pagination',
                clickable: true,
                renderBullet: function (index, className) {
                    return `<span class="circular-pagination-bullet ${className}"></span>`;
                }
            },
            loop: true,
            autoplay: {
                delay: 3000,
                disableOnInteraction: false
            }
        });
    }
}

/**
 * Initializes the text scramble effect on hero title
 */
function initTextScramble() {
    const heroTitle = document.getElementById('heroTitle');
    if (!heroTitle) return;
    
    const text = heroTitle.textContent;
    const chars = text.split('');
    
    // Clear the title and create span for each character
    heroTitle.textContent = '';
    chars.forEach(char => {
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = char;
        heroTitle.appendChild(span);
    });
    
    // Scramble animation on load
    setTimeout(() => {
        const charElements = heroTitle.querySelectorAll('.char');
        
        charElements.forEach((char, i) => {
            setTimeout(() => {
                char.classList.add('scrambled');
                
                setTimeout(() => {
                    char.classList.remove('scrambled');
                }, 1000);
                
            }, i * 50);
        });
    }, 500);
    
    // Scramble animation on hover
    heroTitle.addEventListener('mouseenter', () => {
        const charElements = heroTitle.querySelectorAll('.char');
        
        charElements.forEach((char, i) => {
            setTimeout(() => {
                char.classList.add('scrambled');
                
                setTimeout(() => {
                    char.classList.remove('scrambled');
                }, 500);
                
            }, i * 30);
        });
    });
}

/**
 * Sets up the mobile menu
 */
function setupMobileMenu() {
    const mobileMenu = document.querySelector('.mobile-menu');
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const closeBtn = document.querySelector('.mobile-menu-close');
    
    if (!mobileMenu || !menuToggle) return;
    
    menuToggle.addEventListener('click', () => {
        mobileMenu.classList.add('active');
        document.body.classList.add('menu-open');
    });
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            document.body.classList.remove('menu-open');
        });
    }
}
