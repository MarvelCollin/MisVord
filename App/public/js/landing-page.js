document.addEventListener('DOMContentLoaded', function() {
    // Initialize background image first (doesn't depend on GSAP)
    initBackgroundImage();
    
    // Initialize fixed carousel (works without GSAP)
    initFixedCarousel();
    
    // Create vanilla JS scramble text effect (doesn't rely on GSAP)
    initVanillaScrambleText();
    
    // Handle GSAP loading
    let retries = 0;
    const maxRetries = 5;
    const retryDelay = 500;
    
    function loadGSAPWithRetry() {
        // Check if GSAP is already loaded
        if (window.gsap) {
            console.log("GSAP already loaded");
            initGSAPFeatures();
            return;
        }
        
        console.log(`Attempting to load GSAP (${retries+1}/${maxRetries})`);
        
        // Create script tags for GSAP and plugins
        const gsapScript = document.createElement('script');
        gsapScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js';
        gsapScript.async = true;
        
        // Handle successful load
        gsapScript.onload = function() {
            console.log("GSAP core loaded successfully");
            loadScrollTrigger();
        };
        
        // Handle loading error
        gsapScript.onerror = function() {
            retries++;
            if (retries < maxRetries) {
                console.warn(`Failed to load GSAP, retrying (${retries}/${maxRetries})...`);
                setTimeout(loadGSAPWithRetry, retryDelay * Math.pow(1.5, retries));
            } else {
                console.error("Failed to load GSAP after multiple attempts");
                // Continue with non-GSAP features
            }
        };
        
        // Add to document
        document.head.appendChild(gsapScript);
    }
    
    function loadScrollTrigger() {
        if (!window.gsap) {
            console.warn("Cannot load ScrollTrigger because GSAP core is not available");
            return;
        }
        
        const scrollTriggerScript = document.createElement('script');
        scrollTriggerScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js';
        scrollTriggerScript.async = true;
        
        scrollTriggerScript.onload = function() {
            console.log("ScrollTrigger loaded successfully");
            try {
                gsap.registerPlugin(ScrollTrigger);
                console.log("ScrollTrigger registered");
            } catch (e) {
                console.warn("Error registering ScrollTrigger:", e);
            }
            initGSAPFeatures();
        };
        
        scrollTriggerScript.onerror = function() {
            console.warn("Failed to load ScrollTrigger, continuing without it");
            initGSAPFeatures();
        };
        
        document.head.appendChild(scrollTriggerScript);
    }
    
    function initGSAPFeatures() {
        // Check if GSAP is loaded
        if (typeof window.gsap === 'undefined') {
            console.warn("GSAP not available for animations");
            return;
        }
        
        console.log("Initializing GSAP features");
        
        // Initialize animations in sequence with error handling
        try {
            initGSAPAnimations();
        } catch (e) {
            console.warn("Error in GSAP animations:", e);
        }
        
        try {
            initParallaxZoomEffects();
        } catch (e) {
            console.warn("Error in parallax effects:", e);
        }
    }
    
    // Start loading GSAP
    loadGSAPWithRetry();
});

// Function to initialize the background image
function initBackgroundImage() {
    // Check if window.backgroundImageUrl was set in PHP
    if (window.backgroundImageUrl) {
        // Apply background image to the body::before pseudo-element via CSS variable
        document.documentElement.style.setProperty(
            '--landing-bg-image', 
            `url('${window.backgroundImageUrl}')`
        );
    }
}

// New vanilla JS implementation of scramble text effect (no GSAP dependency)
function initVanillaScrambleText() {
    const heroTitle = document.getElementById('heroTitle');
    const heroSubtitle = document.getElementById('heroSubtitle');
    const heroDecorativeLine = document.getElementById('heroDecorativeLine');
    const scrollIndicator = document.getElementById('scrollIndicator');
    
    if (!heroTitle) return;
    
    // Original text to reveal
    const finalText = "IMAGINE A PLACE";
    // Characters for scrambling effect
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+{}|:<>?";
    
    // Prepare the title
    heroTitle.textContent = '';
    heroTitle.style.opacity = '0';
    
    // Create spans for each character
    const spans = [];
    for (let i = 0; i < finalText.length; i++) {
        const span = document.createElement('span');
        span.textContent = chars[Math.floor(Math.random() * chars.length)];
        span.dataset.finalChar = finalText[i];
        span._fixed = false;
        spans.push(span);
        heroTitle.appendChild(span);
    }
    
    // Fade in the title container
    setTimeout(() => {
        heroTitle.style.opacity = '1';
        heroTitle.style.transition = 'opacity 0.8s ease';
    }, 300);
    
    // Scramble effect variables
    let interval;
    let counter = 0;
    const scrambleDuration = 2000; // 2 seconds
    const scrambleInterval = 50; // Update every 50ms
    const totalIterations = scrambleDuration / scrambleInterval;
    
    // Start the scramble effect
    setTimeout(() => {
        interval = setInterval(() => {
            counter++;
            const progress = counter / totalIterations;
            
            // The number of characters to fix this iteration
            const charsToFix = Math.ceil(progress * finalText.length);
            
            // Update each character
            spans.forEach((span, index) => {
                if (index < charsToFix && !span._fixed) {
                    // Fix this character to its final state
                    span.textContent = span.dataset.finalChar;
                    span._fixed = true;
                    
                    // Add a small highlight effect to newly fixed chars
                    span.style.color = '#5865F2';
                    span.style.textShadow = '0 0 10px rgba(88, 101, 242, 0.8)';
                    setTimeout(() => {
                        span.style.transition = 'color 0.5s ease, text-shadow 0.5s ease';
                        span.style.color = '';
                        span.style.textShadow = '';
                    }, 200);
                    
                } else if (!span._fixed) {
                    // Still scrambling this character
                    span.textContent = chars[Math.floor(Math.random() * chars.length)];
                }
            });
            
            // Stop when all characters are fixed
            if (progress >= 1) {
                clearInterval(interval);
                
                // Start secondary animations after scramble effect
                animateHeroSecondary();
            }
        }, scrambleInterval);
    }, 800);
    
    // Add hover effects after animation is complete
    setTimeout(() => {
        // Add hover interactions to individual chars
        spans.forEach(span => {
            // Skip spaces
            if (span.dataset.finalChar === ' ') return;
            
            span.addEventListener('mouseenter', () => {
                // Only if we're not currently animating this char
                if (!span._isAnimating) {
                    span._isAnimating = true;
                    
                    // Start with original character
                    const originalChar = span.textContent;
                    
                    // Quick scramble effect on hover
                    let hoverCounter = 0;
                    const hoverInterval = setInterval(() => {
                        hoverCounter++;
                        
                        if (hoverCounter < 5) {
                            // Show random character during scramble
                            span.textContent = chars[Math.floor(Math.random() * chars.length)];
                        } else {
                            // Stop scrambling and restore final character
                            clearInterval(hoverInterval);
                            span.textContent = originalChar;
                            span._isAnimating = false;
                        }
                    }, 50);
                    
                    // Add visual effects
                    span.style.color = '#5865F2';
                    span.style.textShadow = '0 0 10px rgba(88, 101, 242, 0.8)';
                    span.style.transform = 'scale(1.5)';
                    span.style.display = 'inline-block';
                    span.style.transition = 'color 0.3s ease, text-shadow 0.3s ease, transform 0.3s ease';
                    
                    // Reset after a delay
                    setTimeout(() => {
                        span.style.color = '';
                        span.style.textShadow = '';
                        span.style.transform = '';
                    }, 300);
                }
            });
        });
    }, scrambleDuration + 1200);
    
    // Function to animate secondary elements
    function animateHeroSecondary() {
        // Animate the decorative line
        if (heroDecorativeLine) {
            heroDecorativeLine.style.transition = 'width 1.2s ease-out';
            heroDecorativeLine.style.width = '96px';
        }
        
        // Fade in subtitle
        if (heroSubtitle) {
            setTimeout(() => {
                heroSubtitle.style.transition = 'opacity 0.5s ease, transform 0.8s ease';
                heroSubtitle.style.opacity = '1';
                heroSubtitle.style.transform = 'translateY(0)';
            }, 300);
        }
        
        // Animate scroll indicator
        if (scrollIndicator) {
            setTimeout(() => {
                scrollIndicator.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
                scrollIndicator.style.opacity = '1';
                scrollIndicator.style.transform = 'translateY(0)';
                
                // Add continuous bounce animation
                setInterval(() => {
                    scrollIndicator.animate([
                        { transform: 'translateY(0)' },
                        { transform: 'translateY(10px)' },
                        { transform: 'translateY(0)' }
                    ], {
                        duration: 1500,
                        iterations: Infinity
                    });
                }, 1500);
            }, 800);
        }
    }
}

// New function for parallax zoom effects with GSAP
function initParallaxZoomEffects() {
    if (!window.gsap || !window.gsap.ScrollTrigger) {
        console.warn('GSAP ScrollTrigger not available for parallax effects');
        return;
    }
    
    // Get all elements with zoom data attributes
    const zoomElements = document.querySelectorAll('[data-zoom-factor]');
    
    zoomElements.forEach(element => {
        const zoomFactor = parseFloat(element.dataset.zoomFactor) || 1.0;
        const zoomDirection = element.dataset.zoomDirection || 'in';
        
        // Calculate start and end scale based on direction
        const startScale = zoomDirection === 'in' ? 1.0 : zoomFactor;
        const endScale = zoomDirection === 'in' ? zoomFactor : 1.0;
        
        // Create scroll-triggered animation for zoom effect with improved smoothness
        gsap.fromTo(element, 
            { 
                scale: startScale,
                opacity: zoomDirection === 'in' ? 0.7 : 1
            },
            {
                scale: endScale,
                opacity: zoomDirection === 'in' ? 1 : 0.7,
                scrollTrigger: {
                    trigger: '#heroContainer',
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 1,
                    markers: false,
                    toggleActions: "play none none reverse"
                },
                ease: "power1.inOut"
            }
        );
    });
    
    // Enhanced zoom effect for the hero container
    gsap.fromTo("#heroContainer",
        { scale: 1, opacity: 1 },
        {
            scale: 0.9,
            opacity: 0.8,
            scrollTrigger: {
                trigger: "header",
                start: "top top",
                end: "bottom top",
                scrub: 1,
                markers: false
            },
            ease: "power1.inOut"
        }
    );
    
    // Set up floating animations for elements with improved physics
    const floatElements = document.querySelectorAll('.gsap-float');
    
    floatElements.forEach((element, index) => {
        // Create random parameters for varied animations
        const duration = 3 + Math.random() * 2;
        const yDistance = 15 + Math.random() * 15;
        const rotationAmount = (Math.random() * 10) - 5;
        const delay = Math.random() * 0.8;
        
        // Create floating animation with subtle ease
        gsap.to(element, {
            y: yDistance,
            rotation: rotationAmount,
            duration: duration,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: delay
        });
    });
    
    // Animate the floating layer elements with enhanced zoom
    const floatingElements = document.querySelectorAll('#gsapFloatingLayer .gsap-element');
    
    floatingElements.forEach((element, index) => {
        // Create random parameters for each element
        const floatDuration = 4 + Math.random() * 3;
        const floatDistance = 20 + Math.random() * 20;
        const rotationAmount = (Math.random() * 15) - 7.5;
        const delay = Math.random();
        
        // Create floating animation with easing
        gsap.to(element, {
            y: floatDistance,
            rotation: rotationAmount,
            duration: floatDuration,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: delay
        });
        
        // Create zoom effect for floating elements with improved visibility
        const zoomFactor = parseFloat(element.dataset.zoomFactor) || 1.0;
        const zoomDirection = element.dataset.zoomDirection || 'in';
        
        const startScale = zoomDirection === 'in' ? 1.0 : zoomFactor;
        const endScale = zoomDirection === 'in' ? zoomFactor : 1.0;
        
        gsap.fromTo(element, 
            { 
                scale: startScale,
                opacity: 0.8
            },
            {
                scale: endScale,
                opacity: 1,
                scrollTrigger: {
                    trigger: 'header',
                    start: "top top",
                    end: "bottom top",
                    scrub: 1,
                    markers: false
                },
                ease: "power1.inOut"
            }
        );
    });
    
    // Add parallax scroll effect to all sections
    gsap.utils.toArray('.feature-section').forEach(section => {
        // Create a zoom effect on scroll for each feature section
        gsap.fromTo(section.querySelector('.content-card'),
            { y: 50, opacity: 0.5, scale: 0.95 },
            {
                y: 0,
                opacity: 1,
                scale: 1,
                scrollTrigger: {
                    trigger: section,
                    start: "top bottom-=100px",
                    end: "center center",
                    scrub: 1,
                    markers: false
                },
                ease: "power2.out"
            }
        );
    });
}

// Remove tornado parallax initialization to prevent errors
window.addEventListener('load', function() {
    // We don't need the tornado effect anymore as we've replaced it with GSAP animations
    // setTimeout(initTornadoParallax, 500); // Commented out to prevent errors
});

function initScrollAnimations() {
    
    const fadeElements = document.querySelectorAll('.hero-title, .hero-text, .hero-buttons, .journey-content');
    fadeElements.forEach(element => {
        element.classList.add('animated-fade-in');
    });
    
    
    const featureSections = document.querySelectorAll('.feature-section');
    featureSections.forEach((section, i) => {
        
        const contentElement = section.querySelector('.feature-content');
        const imageElement = section.querySelector('.feature-image');
        
        if (i % 2 === 0) {
            contentElement?.classList.add('animated-slide-in-left');
            imageElement?.classList.add('animated-slide-in-right');
        } else {
            contentElement?.classList.add('animated-slide-in-right');
            imageElement?.classList.add('animated-slide-in-left');
        }
    });
    
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated-visible');
                
                observer.unobserve(entry.target);
            }
        });
    }, {
        root: null, 
        threshold: 0.1, 
        rootMargin: '0px 0px -50px 0px' 
    });
    
    
    const elementsToAnimate = document.querySelectorAll(
        '.animated-fade-in, .animated-slide-in-left, .animated-slide-in-right'
    );
    
    
    elementsToAnimate.forEach(element => {
        observer.observe(element);
    });
    
    
    setTimeout(() => {
        document.querySelectorAll('.hero-title, .hero-text, .hero-buttons').forEach(el => {
            el.classList.add('animated-visible');
        });
    }, 100);
}


function initFloatingElements() {
    const floatingElements = document.querySelectorAll('.floating-element');
    
    // Apply random animation delay to floating elements
    floatingElements.forEach(element => {
        const delay = Math.random() * 2;
        element.style.animationDelay = `${delay}s`;
    });
    
    floatingElements.forEach(element => {
        
        const trail = document.createElement('div');
        trail.className = 'floating-trail';
        element.parentNode.insertBefore(trail, element);
        element.trail = trail;
        
        
        const randomOffset = (Math.random() - 0.5) * 10;
        element.style.transform = `translateY(${randomOffset}px)`;
    });
    
    
    let lastScrollTop = 0;
    let scrollSpeed = 0;
    let ticking = false;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset;
        
        // Calculate scroll speed
        scrollSpeed = Math.abs(scrollTop - lastScrollTop) * 0.1;
        lastScrollTop = scrollTop;
        
        // Use requestAnimationFrame to update elements
        if (!ticking) {
            window.requestAnimationFrame(function() {
                updateFloatingElements(scrollTop, scrollSpeed);
                ticking = false;
            });
            ticking = true;
        }
    });
    
    
    document.addEventListener('mousemove', function(e) {
        const mouseY = e.clientY;
        
        floatingElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const centerY = rect.top + rect.height / 2;
            
            // Calculate distance from mouse to element center
            const distanceY = mouseY - centerY;
            const distance = Math.abs(distanceY);
            
            // Apply movement based on distance (closer = more movement)
            if (distance < 300) {
                // Calculate movement with easing
                const moveY = distanceY * 0.02 * (1 - distance / 300);
                
                // Apply movement with transition
                element.style.transition = 'transform 0.8s ease-out';
                element.style.transform = `translateY(${moveY}px)`;
            }
        });
    });
    
    
    updateFloatingElements(window.pageYOffset, 0);
}


function updateFloatingElements(scrollTop, scrollSpeed) {
    const floatingElements = document.querySelectorAll('.floating-element');
    
    floatingElements.forEach(element => {
        const speed = parseFloat(element.getAttribute('data-speed')) || 0.3;
        const rotation = parseFloat(element.getAttribute('data-rotation')) || 0;
        
        
        const yPos = -(scrollTop * speed);
        
        
        const rotationAmount = Math.sin(scrollTop * 0.001) * rotation;
        
        
        const scaleAmount = 1 + (Math.min(scrollSpeed, 10) * 0.003 * speed);
        
        
        element.style.transform = `translateY(${yPos}px) rotate(${rotationAmount}deg) scale(${scaleAmount})`;
        
        
        if (element.trail) {
            element.trail.style.width = element.offsetWidth * 1.5 + 'px';
            element.trail.style.height = element.offsetHeight * 1.5 + 'px';
            element.trail.style.left = element.offsetLeft - element.offsetWidth * 0.25 + 'px';
            element.trail.style.top = element.offsetTop - element.offsetHeight * 0.25 + 'px';
            
            
            const trailOpacity = Math.min((scrollSpeed * speed) / 10, 0.5);
            element.trail.style.opacity = trailOpacity;
        }
    });
}


function initGSAPAnimations() {
    // If GSAP isn't loaded yet, exit gracefully
    if (!window.gsap) {
        console.warn('GSAP not available for animations');
        return;
    }
    
    // Register ScrollTrigger plugin if available
    if (window.gsap.ScrollTrigger && !ScrollTrigger) {
        try {
            gsap.registerPlugin(ScrollTrigger);
        } catch (e) {
            console.warn('Unable to register ScrollTrigger:', e);
        }
    }
    
    // Fade in the hero content
    gsap.to(".gsap-fade-in", {
        opacity: 1,
        duration: 1.5,
        ease: "power3.out"
    });
    
    // Staggered fade for subtitle sections
    gsap.to(".gsap-stagger-fade > *", {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out"
    });
    
    // Width reveal for decorative line
    gsap.to(".gsap-width-reveal", {
        width: "24px",
        duration: 1.2,
        ease: "power2.out",
        delay: 0.5
    });
    
    // Prepare text for char-by-char animation
    const textElement = document.querySelector(".gsap-chars-reveal");
    if (textElement) {
        // Split text into characters
        const text = textElement.textContent;
        textElement.innerHTML = '';
        
        text.split('').forEach(char => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char;
            textElement.appendChild(span);
        });
        
        // Animate each character
        gsap.to(textElement.querySelectorAll('span'), {
            opacity: 1,
            duration: 0.03,
            stagger: 0.015,
            ease: "none",
            delay: 0.8
        });
    }
    
    // Bounce animation for scroll indicator
    gsap.to(".gsap-bounce", {
        opacity: 1,
        duration: 1,
        ease: "power2.out",
        delay: 1.5
    });
    
    // Create continuous bounce animation
    gsap.to(".scroll-indicator svg", {
        y: -10,
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut"
    });
    
    // Zoom effect on shapes based on scroll position
    const shapes = document.querySelectorAll('.parallax-shape');
    shapes.forEach(shape => {
        const direction = shape.getAttribute('data-direction') || 'in';
        const zoomFactor = parseFloat(shape.getAttribute('data-zoom') || 1.2);
        
        // Create zoom effect that triggers on scroll
        gsap.to(shape, {
            scale: direction === 'in' ? zoomFactor : 1 / zoomFactor,
            ease: "none",
            scrollTrigger: {
                trigger: ".scroll-parallax-container",
                start: "top bottom",
                end: "bottom top",
                scrub: true
            }
        });
    });
    
    // Animate parallax icons with scroll
    const icons = document.querySelectorAll('.parallax-icon');
    icons.forEach(icon => {
        const speed = parseFloat(icon.getAttribute('data-scroll-speed') || 1);
        const rotation = parseFloat(icon.getAttribute('data-rotation') || 0);
        
        // Complex movement and rotation on scroll
        gsap.to(icon, {
            y: speed * 100,
            rotation: rotation,
            ease: "none",
            scrollTrigger: {
                trigger: ".scroll-parallax-container",
                start: "top bottom",
                end: "bottom top",
                scrub: true
            }
        });
    });
    
    // Add scroll-triggered zoom effect to hero container
    gsap.to(".scroll-parallax-container", {
        scale: 0.85,
        opacity: 0.8,
        ease: "none",
        scrollTrigger: {
            trigger: ".scroll-parallax-container",
            start: "top top",
            end: "bottom top-=300",
            scrub: true
        }
    });
}

// New function for improved scramble text using GSAP
function initImprovedScrambleText() {
    // If GSAP isn't loaded yet, wait for it
    if (!window.gsap) {
        setTimeout(initImprovedScrambleText, 100);
        return;
    }
    
    const heroTitle = document.getElementById("heroTitle");
    if (!heroTitle) return;
    
    // Get the original text
    const originalText = heroTitle.textContent;
    
    // Clear the container
    heroTitle.innerHTML = '';
    
    // Create individual spans for each character
    originalText.split('').forEach(char => {
        const span = document.createElement('span');
        
        if (char === ' ') {
            // Handle spaces
            span.innerHTML = '&nbsp;';
            span.className = 'space';
            span.style.margin = '0 0.2em';
        } else {
            span.textContent = char;
            span.className = 'char';
            span.dataset.char = char;
        }
        
        heroTitle.appendChild(span);
    });
    
    // Characters for scrambling
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    
    // Get all character spans (excluding spaces)
    const charSpans = heroTitle.querySelectorAll('.char');
    
    // Set up initial state - all are scrambled characters
    charSpans.forEach(span => {
        span.textContent = chars[Math.floor(Math.random() * chars.length)];
        span._gsapTargetChar = span.dataset.char; // Store target character
    });
    
    // GSAP animation for scramble text
    gsap.to(charSpans, {
        duration: 0.05,
        stagger: 0.03,
        repeatRefresh: true,
        repeat: 10,
        onRepeat: function(self) {
            const target = self.targets()[0];
            if (target.textContent !== target._gsapTargetChar) {
                target.textContent = chars[Math.floor(Math.random() * chars.length)];
            }
        },
        onComplete: function() {
            // Set all chars to their final values
            charSpans.forEach(span => {
                span.textContent = span._gsapTargetChar;
                
                // Add hover interaction
                span.addEventListener('mouseenter', () => {
                    // Only if we're not currently animating this char
                    if (!span._isAnimating) {
                        span._isAnimating = true;
                        
                        // Store original char
                        const targetChar = span._gsapTargetChar;
                        
                        // Quick scramble effect on hover
                        const scrambleTl = gsap.timeline({
                            onComplete: function() {
                                span._isAnimating = false;
                            }
                        });
                        
                        scrambleTl.to(span, {
                            duration: 0.05,
                            repeat: 5,
                            onRepeat: function() {
                                span.textContent = chars[Math.floor(Math.random() * chars.length)];
                            },
                            onComplete: function() {
                                span.textContent = targetChar;
                            }
                        });
                        
                        // Scale effect
                        gsap.to(span, {
                            scale: 1.5,
                            color: "#5865F2",
                            textShadow: "0 0 10px rgba(88, 101, 242, 0.8)",
                            duration: 0.3,
                            ease: "back.out(1.7)",
                            yoyo: true,
                            repeat: 1
                        });
                    }
                });
            });
            
            // Add whole title hover interaction
            heroTitle.addEventListener('mouseenter', () => {
                gsap.to(charSpans, {
                    stagger: 0.02,
                    color: function(i) {
                        // Cycle through Discord brand colors
                        const colors = ["#5865F2", "#57F287", "#FEE75C", "#EB459E"];
                        return colors[i % colors.length];
                    },
                    textShadow: function(i) {
                        const colors = ["#5865F2", "#57F287", "#FEE75C", "#EB459E"];
                        return `0 0 10px ${colors[i % colors.length]}`;
                    },
                    duration: 0.5
                });
            });
            
            heroTitle.addEventListener('mouseleave', () => {
                gsap.to(charSpans, {
                    color: "white",
                    textShadow: "none",
                    duration: 0.5
                });
            });
        }
    });
    
    // Start revealing from invisible
    gsap.from(heroTitle, {
        opacity: 0,
        y: 30,
        duration: 1,
        ease: "power3.out"
    });
}


function initFixedCarousel() {
    const prevBtn = document.getElementById("carousel-prev");
    const nextBtn = document.getElementById("carousel-next");
    const track = document.querySelector(".carousel-track");
    const slides = document.querySelectorAll(".carousel-slide");
    const dots = document.querySelectorAll(".carousel-dot");
    
    if (prevBtn && nextBtn && track && slides.length) {
        let currentSlide = 0;
        
        // Function to navigate to a specific slide
        function goToSlide(index) {
            if (index < 0) index = 0;
            if (index >= slides.length) index = slides.length - 1;
            
            // Move the track
            track.style.transform = `translateX(-${index * 100}%)`;
            
            // Update active state on slides
            slides.forEach((slide, i) => {
                if (i === index) {
                    slide.classList.add("active");
                } else {
                    slide.classList.remove("active");
                }
            });
            
            // Update active state on dots
            dots.forEach((dot, i) => {
                if (i === index) {
                    dot.classList.add("active");
                } else {
                    dot.classList.remove("active");
                }
            });
            
            // Store the current slide index
            currentSlide = index;
            
            // Update button disabled states
            prevBtn.disabled = currentSlide === 0;
            nextBtn.disabled = currentSlide === slides.length - 1;
        }
        
        // Add event listeners to the navigation buttons
        prevBtn.addEventListener("click", function() {
            goToSlide(currentSlide - 1);
        });
        
        nextBtn.addEventListener("click", function() {
            goToSlide(currentSlide + 1);
        });
        
        // Add event listeners to the dots
        dots.forEach((dot, index) => {
            dot.addEventListener("click", function() {
                goToSlide(index);
            });
        });

        // Initialize the first slide
        goToSlide(0);
    }
}


function initCarousel() {
    const carousel = document.querySelector('.feature-carousel');
    if (!carousel) return;
    
    const track = carousel.querySelector('.carousel-track');
    const slides = carousel.querySelectorAll('.carousel-slide');
    const dotsContainer = carousel.querySelector('.carousel-dots');
    const nextButton = carousel.querySelector('.carousel-next');
    const prevButton = carousel.querySelector('.carousel-prev');
    
    if (!track || slides.length === 0) return;
    
    
    if (dotsContainer) {
        slides.forEach((slide, index) => {
            
            const dot = document.createElement('button');
            dot.className = index === 0 ? 'carousel-dot active' : 'carousel-dot';
            dot.setAttribute('aria-label', `View feature ${index + 1}`);
            dot.dataset.slide = index;
            
            
            const featureTitle = slide.querySelector('h3').textContent;
            dot.setAttribute('title', featureTitle);
            
            
            dotsContainer.appendChild(dot);
        });
    }
    
    
    const dots = carousel.querySelectorAll('.carousel-dot');
    let currentSlide = 0;
    let isMoving = false;
    const slideWidth = 100; 
    
    
    function updateCarousel(newIndex, direction = null) {
        if (isMoving) return;
        if (newIndex < 0 || newIndex >= slides.length) return;
        
        isMoving = true;
        
        
        const outgoingSlide = currentSlide;
        currentSlide = newIndex;
        
        
        track.style.transition = 'transform 0.5s cubic-bezier(0.645, 0.045, 0.355, 1.000)';
        track.style.transform = `translateX(-${currentSlide * slideWidth}%)`;
        
        
        slides.forEach((slide, index) => {
            setTimeout(() => {
                if (index === currentSlide) {
                    slide.setAttribute('aria-hidden', 'false');
                    slide.classList.add('active');
                } else {
                    slide.setAttribute('aria-hidden', 'true');
                    slide.classList.remove('active');
                }
            }, index === currentSlide ? 100 : 0);
        });
        
        
        dots.forEach((dot, index) => {
            
            if (index === currentSlide) {
                dot.classList.add('active');
                dot.setAttribute('aria-current', 'true');
            } else {
                dot.classList.remove('active');
                dot.removeAttribute('aria-current');
            }
        });
        
        
        if (prevButton) {
            prevButton.disabled = currentSlide === 0;
            prevButton.classList.toggle('disabled', currentSlide === 0);
            
            
            if (direction === 'prev' && !prevButton.disabled) {
                addButtonRipple(prevButton);
            }
        }
        
        if (nextButton) {
            nextButton.disabled = currentSlide === slides.length - 1;
            nextButton.classList.toggle('disabled', currentSlide === slides.length - 1);
            
            
            if (direction === 'next' && !nextButton.disabled) {
                addButtonRipple(nextButton);
            }
        }
        
        
        animateActiveSlideContent(slides[currentSlide]);
        
        
        setTimeout(() => {
            isMoving = false;
        }, 500);
    }
    
    
    function addButtonRipple(button) {
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        button.appendChild(ripple);
        
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${rect.width / 2 - size / 2}px`;
        ripple.style.top = `${rect.height / 2 - size / 2}px`;
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
    
    
    function animateActiveSlideContent(slide) {
        
        const icon = slide.querySelector('.feature-icon');
        const heading = slide.querySelector('h3');
        const listItems = slide.querySelectorAll('li');
        const button = slide.querySelector('button');
        const visual = slide.querySelector('.md\\:w-1\\/2:last-child > div');
        
        
        [icon, heading, button, visual].forEach(el => {
            if (el) {
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
            }
        });
        
        listItems.forEach(item => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(15px)';
        });
        
        
        setTimeout(() => {
            if (icon) {
                icon.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                icon.style.opacity = '1';
                icon.style.transform = 'translateY(0)';
            }
        }, 100);
        
        setTimeout(() => {
            if (heading) {
                heading.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                heading.style.opacity = '1';
                heading.style.transform = 'translateY(0)';
            }
        }, 200);
        
        listItems.forEach((item, i) => {
            setTimeout(() => {
                item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, 300 + (i * 100));
        });
        
        setTimeout(() => {
            if (button) {
                button.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                button.style.opacity = '1';
                button.style.transform = 'translateY(0)';
            }
        }, 300 + (listItems.length * 100) + 100);
        
        setTimeout(() => {
            if (visual) {
                visual.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
                visual.style.opacity = '1';
                visual.style.transform = 'translateY(0) scale(1)';
            }
        }, 200);
    }
    
    
    function goToSlide(index, direction = null) {
        updateCarousel(index, direction);
    }
    
    
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            goToSlide(currentSlide + 1, 'next');
        });
    }
    
    if (prevButton) {
        prevButton.addEventListener('click', () => {
            goToSlide(currentSlide - 1, 'prev');
        });
    }
    
    
    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            const slideIndex = parseInt(dot.dataset.slide);
            const direction = slideIndex > currentSlide ? 'next' : 'prev';
            goToSlide(slideIndex, direction);
        });
        
        
        dot.addEventListener('mouseenter', () => {
            dot.style.transform = 'scaleY(1.2)';
        });
        
        dot.addEventListener('mouseleave', () => {
            dot.style.transform = 'scaleY(1)';
        });
    });
    
    
    carousel.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            goToSlide(currentSlide - 1, 'prev');
        } else if (e.key === 'ArrowRight') {
            goToSlide(currentSlide + 1, 'next');
        }
    });
    
    
    let touchStartX = 0;
    let touchEndX = 0;
    let touchStartTime = 0;
    
    carousel.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartTime = new Date().getTime();
    }, {passive: true});
    
    carousel.addEventListener('touchmove', (e) => {
        const currentX = e.changedTouches[0].screenX;
        const diff = touchStartX - currentX;
        const offset = (diff / carousel.offsetWidth) * 100;
        
        
        if ((currentSlide > 0 || diff < 0) && (currentSlide < slides.length - 1 || diff > 0) && Math.abs(diff) < 100) {
            track.style.transition = 'none';
            track.style.transform = `translateX(-${(currentSlide * 100) + offset}%)`;
        }
    }, {passive: true});
    
    carousel.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const touchEndTime = new Date().getTime();
        
        
        const swipeDistance = touchStartX - touchEndX;
        const swipeTime = touchEndTime - touchStartTime;
        const swipeSpeed = Math.abs(swipeDistance / swipeTime);
        
        
        if (swipeSpeed > 0.5 || Math.abs(swipeDistance) > 50) {
            if (swipeDistance > 0 && currentSlide < slides.length - 1) {
                
                goToSlide(currentSlide + 1, 'next');
            } else if (swipeDistance < 0 && currentSlide > 0) {
                
                goToSlide(currentSlide - 1, 'prev');
            } else {
                
                track.style.transition = 'transform 0.3s ease';
                track.style.transform = `translateX(-${currentSlide * 100}%)`;
            }
        } else {
            
            track.style.transition = 'transform 0.3s ease';
            track.style.transform = `translateX(-${currentSlide * 100}%)`;
        }
    }, {passive: true});
    
    
    const progressBar = carousel.querySelector('.carousel-progress');
    if (progressBar) {
        progressBar.style.display = 'none';
    }
    
    
    animateActiveSlideContent(slides[0]);
    updateCarousel(0);
    
    
    setupTypingAnimation();
}


function setupTypingAnimation() {
    const typingElements = document.querySelectorAll('.typing-animation');
    
    typingElements.forEach(element => {
        const text = element.textContent;
        element.textContent = '';
        
        let i = 0;
        function typeWriter() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 50 + Math.random() * 50);
            }
        }
        
        
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(typeWriter, 500);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        observer.observe(element);
    });
}

// Function to initialize the tornado parallax effect
function initTornadoParallax() {
    console.log("Initializing tornado parallax effect");
    
    const parallaxHero = document.getElementById('parallax-hero');
    if (!parallaxHero) {
        console.error("Parallax hero section not found");
        return;
    }

    const parallaxLayers = document.querySelectorAll('.parallax-layer');
    console.log(`Found ${parallaxLayers.length} parallax layers`);
    
    // Calculate funnel center (needs to be updated on resize)
    let funnelCenter = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2
    };
    console.log(`Initial funnel center: x=${funnelCenter.x}, y=${funnelCenter.y}`);
    
    // Initial setup after a slight delay to ensure DOM is fully loaded
    setTimeout(() => {
        updateTornadoParallax(0);
        initTornadoObjects();
    }, 100);
    
    // Track mouse movement for interactive parallax
    let mouseX = 0;
    let mouseY = 0;
    
    window.addEventListener('mousemove', (e) => {
        // Calculate mouse position relative to the center of the window
        mouseX = (e.clientX - window.innerWidth / 2) / window.innerWidth;
        mouseY = (e.clientY - window.innerHeight / 2) / window.innerHeight;
        
        // Update parallax effect based on mouse position
        updateTornadoParallax(window.scrollY);
    });
    
    // Handle scroll events for parallax
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        updateTornadoParallax(scrollY);
        
        // Add intensity to tornado effects during scroll
        addTornadoScrollIntensity(Math.min(scrollY / 20, 50));
    });
    
    // Handle resize events
    window.addEventListener('resize', () => {
        // Recalculate funnel center
        funnelCenter = {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
        };
        console.log(`Recalculated funnel center: x=${funnelCenter.x}, y=${funnelCenter.y}`);
        
        updateTornadoParallax(window.scrollY);
        
        // Reinitialize tornado objects on significant resize
        initTornadoObjects();
    });
    
    function updateTornadoParallax(scrollY) {
        parallaxLayers.forEach(layer => {
            const depth = parseFloat(layer.getAttribute('data-depth')) || 0.1;
            const translateY = scrollY * depth * -1;
            
            // Add mouse influence for subtle interactivity
            const mouseMoveX = mouseX * 50 * depth;
            const mouseMoveY = mouseY * 50 * depth;
            
            // Apply the transform with both scroll and mouse effects
            layer.style.transform = `translate3d(${mouseMoveX}px, ${translateY + mouseMoveY}px, 0)`;
        });
    }
    
    function addTornadoScrollIntensity(intensity) {
        const tornadoFunnel = document.querySelector('.tornado-funnel');
        if (tornadoFunnel) {
            // Intensify the tornado blur and scale based on scroll
            const blurAmount = 8 + (intensity * 0.3);
            const scaleAmount = 1 + (intensity * 0.01);
            tornadoFunnel.style.filter = `blur(${blurAmount}px)`;
            tornadoFunnel.style.transform = `scale(${scaleAmount})`;
        }
        
        // Intensify lightning flashes during scroll
        const lightnings = document.querySelectorAll('.lightning');
        if (intensity > 20 && Math.random() > 0.92) {
            lightnings.forEach(lightning => {
                lightning.style.opacity = '1';
                setTimeout(() => {
                    lightning.style.opacity = '0';
                }, 100);
            });
        }
        
        // Affect debris items during scroll
        const debrisItems = document.querySelectorAll('.debris-item');
        debrisItems.forEach(item => {
            const randomFactor = Math.random() * 0.5 + 0.5;
            const extraTranslate = intensity * randomFactor;
            item.style.transform = `translateY(${-extraTranslate}px) rotate(${item.style.getPropertyValue('--rotate') || '0deg'})`;
        });
    }
    
    // Create a lightning flash effect that triggers occasionally
    setInterval(() => {
        if (Math.random() > 0.7) {
            const lightningId = Math.random() > 0.5 ? 'lightning1' : 'lightning2';
            const lightning = document.getElementById(lightningId);
            if (lightning) {
                lightning.style.height = `${100 + Math.random() * 200}px`;
                lightning.style.transform = `rotate(${(Math.random() * 10) - 5}deg)`;
                
                // Create branching effect occasionally
                if (Math.random() > 0.6) {
                    const branch = document.createElement('div');
                    branch.className = 'lightning-branch';
                    branch.style.position = 'absolute';
                    branch.style.width = '2px';
                    branch.style.height = `${30 + Math.random() * 70}px`;
                    branch.style.background = 'rgba(255, 255, 255, 0.8)';
                    branch.style.top = `${30 + Math.random() * 40}%`;
                    branch.style.left = '0';
                    branch.style.transform = `rotate(${(Math.random() * 40) - 20}deg)`;
                    branch.style.transformOrigin = '0 0';
                    branch.style.filter = 'blur(1px)';
                    
                    lightning.appendChild(branch);
                    
                    // Remove branch after animation
                    setTimeout(() => {
                        if (branch.parentNode === lightning) {
                            lightning.removeChild(branch);
                        }
                    }, 100);
                }
            }
        }
    }, 3000);
    
    // Initialize tornado objects relative to the hero section
    function initTornadoObjects() {
        const tornadoObjects = document.querySelectorAll('.tornado-object');
        console.log(`Found ${tornadoObjects.length} tornado objects`);
        
        if (!tornadoObjects.length) {
            console.warn("No tornado objects found");
            return;
        }
        
        // Get hero section dimensions for proper positioning
        const heroRect = parallaxHero.getBoundingClientRect();
        console.log(`Hero rect: left=${heroRect.left}, top=${heroRect.top}, width=${heroRect.width}, height=${heroRect.height}`);
                
        tornadoObjects.forEach((obj, index) => {
            const dataTop = obj.getAttribute('data-top');
            const dataLeft = obj.getAttribute('data-left');
            console.log(`Tornado object ${index}: data-top=${dataTop}, data-left=${dataLeft}, src=${obj.src}`);
            animateTornadoObject(obj, funnelCenter);
        });
    }
}

function animateTornadoObject(obj, funnelCenter) {
    // Set initial position from data attributes
    const initialLeft = parseInt(obj.getAttribute('data-left')) || 50;
    const initialTop = parseInt(obj.getAttribute('data-top')) || 50;
    const delay = parseFloat(obj.getAttribute('data-delay')) || 0;
    const duration = parseFloat(obj.getAttribute('data-duration')) || 7;
    
    // Create orbit parameters
    const orbitRadius = 100 + Math.random() * 150;
    const orbitSpeed = 0.0005 + Math.random() * 0.001;
    let angle = Math.random() * Math.PI * 2;
    let scale = 0.8 + Math.random() * 0.4;
    let lastTimestamp = 0;
    
    // Initial positioning - set to fixed pixel positions
    obj.style.left = `${initialLeft}%`;
    obj.style.top = `${initialTop}%`;
    obj.style.opacity = '0';
    
    // Start animation after delay
    setTimeout(() => {
        obj.style.opacity = '1';
        obj.style.transition = 'opacity 0.5s ease';
        
        function animateObject(timestamp) {
            if (lastTimestamp === 0) lastTimestamp = timestamp;
            const deltaTime = timestamp - lastTimestamp;
            lastTimestamp = timestamp;
            
            // Update angle based on time and duration
            const speedFactor = 7 / duration; // normalize based on default 7s
            angle += orbitSpeed * deltaTime * speedFactor;
            
            // Calculate new position in orbit around tornado center
            const x = funnelCenter.x + Math.cos(angle) * orbitRadius;
            const y = funnelCenter.y + Math.sin(angle) * orbitRadius;
            
            // Calculate distance from center for scaling and opacity
            const dx = x - funnelCenter.x;
            const dy = y - funnelCenter.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Make objects appear to be caught in the tornado
            const normalizedDistance = Math.min(distance / orbitRadius, 1);
            scale = 0.4 + normalizedDistance * 0.8;
            const opacity = 0.4 + normalizedDistance * 0.6;
            const rotation = angle * (180 / Math.PI);
            
            // Apply the new styles
            obj.style.position = 'absolute';
            obj.style.left = `${x}px`;
            obj.style.top = `${y}px`;
            obj.style.transform = `rotate(${rotation}deg) scale(${scale})`;
            obj.style.opacity = opacity.toString();
            
            requestAnimationFrame(animateObject);
        }
        
        requestAnimationFrame(animateObject);
    }, delay * 1000);
}
