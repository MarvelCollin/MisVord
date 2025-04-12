document.addEventListener('DOMContentLoaded', function() {
    // Initialize scroll based animations with Intersection Observer
    initScrollAnimations();
    
    // Add floating element effects with vertical movement only
    initFloatingElements();
    
    // Initialize particle effects 
    createEnhancedParticles();
    
    // Add text scramble animation for hero title
    initScrambleText();
    
    // Initialize the new carousel
    initCarousel();
});

/**
 * Initialize scroll-based animations with Intersection Observer
 */
function initScrollAnimations() {
    // Elements that fade in
    const fadeElements = document.querySelectorAll('.hero-title, .hero-text, .hero-buttons, .journey-content');
    fadeElements.forEach(element => {
        element.classList.add('animated-fade-in');
    });
    
    // Feature section animations
    const featureSections = document.querySelectorAll('.feature-section');
    featureSections.forEach((section, i) => {
        // Alternate slide-in directions
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
    
    // Create intersection observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated-visible');
                // Unobserve after animation is triggered
                observer.unobserve(entry.target);
            }
        });
    }, {
        root: null, // viewport
        threshold: 0.1, // trigger when 10% is visible
        rootMargin: '0px 0px -50px 0px' // trigger earlier
    });
    
    // Elements to observe
    const elementsToAnimate = document.querySelectorAll(
        '.animated-fade-in, .animated-slide-in-left, .animated-slide-in-right'
    );
    
    // Add elements to observer
    elementsToAnimate.forEach(element => {
        observer.observe(element);
    });
    
    // Trigger hero animations immediately
    setTimeout(() => {
        document.querySelectorAll('.hero-title, .hero-text, .hero-buttons').forEach(el => {
            el.classList.add('animated-visible');
        });
    }, 100);
}

/**
 * Initialize floating elements with vertical-only parallax
 */
function initFloatingElements() {
    const floatingElements = document.querySelectorAll('.floating-element');
    
    // Create floating trails
    floatingElements.forEach(element => {
        // Create trail effect
        const trail = document.createElement('div');
        trail.className = 'floating-trail';
        element.parentNode.insertBefore(trail, element);
        element.trail = trail;
        
        // Add random starting position offset for more natural movement
        const randomOffset = (Math.random() - 0.5) * 10;
        element.style.transform = `translateY(${randomOffset}px)`;
    });
    
    // Handle scroll parallax effect
    let lastScrollTop = 0;
    let scrollSpeed = 0;
    let ticking = false;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset;
        
        // Calculate scroll speed
        scrollSpeed = Math.abs(scrollTop - lastScrollTop) * 0.1;
        lastScrollTop = scrollTop;
        
        // Use requestAnimationFrame for smoother animations
        if (!ticking) {
            window.requestAnimationFrame(function() {
                updateFloatingElements(scrollTop, scrollSpeed);
                ticking = false;
            });
            ticking = true;
        }
    });
    
    // Handle mouse movement - vertical effect only
    document.addEventListener('mousemove', function(e) {
        const mouseY = e.clientY;
        
        floatingElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const centerY = rect.top + rect.height / 2;
            
            // Calculate vertical distance from mouse to element center
            const distanceY = mouseY - centerY;
            const distance = Math.abs(distanceY);
            
            // Only affect elements within a certain range of the mouse
            if (distance < 300) {
                // Calculate movement based on vertical distance (move away from mouse)
                const moveY = distanceY * 0.02 * (1 - distance / 300);
                
                // Apply smooth vertical movement using CSS transitions
                element.style.transition = 'transform 0.8s ease-out';
                element.style.transform = `translateY(${moveY}px)`;
            }
        });
    });
    
    // Initial position update
    updateFloatingElements(window.pageYOffset, 0);
}

/**
 * Update floating elements position based on scroll - vertical movement only
 */
function updateFloatingElements(scrollTop, scrollSpeed) {
    const floatingElements = document.querySelectorAll('.floating-element');
    
    floatingElements.forEach(element => {
        const speed = parseFloat(element.getAttribute('data-speed')) || 0.3;
        const rotation = parseFloat(element.getAttribute('data-rotation')) || 0;
        
        // Calculate vertical movement based on scroll position
        const yPos = -(scrollTop * speed);
        
        // Add rotation based on scroll for subtle effect
        const rotationAmount = Math.sin(scrollTop * 0.001) * rotation;
        
        // Add subtle scale effect based on scroll speed
        const scaleAmount = 1 + (Math.min(scrollSpeed, 10) * 0.003 * speed);
        
        // Apply vertical-only transformation
        element.style.transform = `translateY(${yPos}px) rotate(${rotationAmount}deg) scale(${scaleAmount})`;
        
        // Update the trail position and opacity based on movement
        if (element.trail) {
            element.trail.style.width = element.offsetWidth * 1.5 + 'px';
            element.trail.style.height = element.offsetHeight * 1.5 + 'px';
            element.trail.style.left = element.offsetLeft - element.offsetWidth * 0.25 + 'px';
            element.trail.style.top = element.offsetTop - element.offsetHeight * 0.25 + 'px';
            
            // Increase trail opacity based on scroll speed for more visible effect
            const trailOpacity = Math.min((scrollSpeed * speed) / 10, 0.5);
            element.trail.style.opacity = trailOpacity;
        }
    });
}

/**
 * Create enhanced particle effects without external libraries
 */
function createEnhancedParticles() {
    const container = document.getElementById('particles-container');
    if (!container) return;
    
    const particleCount = 120; // More particles for a richer effect
    
    const particleTypes = [
        { 
            color: '#5865F2', 
            size: [1, 3], 
            speed: [15, 30], 
            opacity: [0.1, 0.3],
            glow: true
        },
        { 
            color: '#57F287', 
            size: [2, 4], 
            speed: [20, 35], 
            opacity: [0.1, 0.25],
            glow: true
        },
        { 
            color: '#EB459E', 
            size: [1, 2.5], 
            speed: [25, 40], 
            opacity: [0.05, 0.2],
            glow: true
        },
        { 
            color: '#FEE75C', 
            size: [0.5, 2], 
            speed: [10, 25], 
            opacity: [0.1, 0.3],
            glow: true
        },
        { 
            color: '#FFFFFF', 
            size: [0.5, 3], 
            speed: [15, 30], 
            opacity: [0.05, 0.15],
            glow: false
        }
    ];
    
    for (let i = 0; i < particleCount; i++) {
        const typeIndex = Math.floor(Math.random() * particleTypes.length);
        const type = particleTypes[typeIndex];
        
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        
        const size = Math.random() * (type.size[1] - type.size[0]) + type.size[0];
        const opacity = Math.random() * (type.opacity[1] - type.opacity[0]) + type.opacity[0];
        
        particle.style.left = posX + '%';
        particle.style.top = posY + '%';
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.opacity = opacity;
        
        if (type.glow) {
            particle.style.background = type.color;
            particle.style.boxShadow = `0 0 10px ${type.color}`;
        } else {
            particle.style.background = 'rgba(255, 255, 255, 0.6)';
        }
        
        // Custom animation styles
        const duration = Math.random() * (type.speed[1] - type.speed[0]) + type.speed[0];
        const delay = Math.random() * 15;
        
        // Custom animation properties
        const startX = posX;
        const startY = posY;
        const endX = startX + (Math.random() * 20 - 10);
        const endY = startY + (Math.random() * 20 - 10);
        
        // Apply CSS animation
        particle.style.animation = `float ${duration}s ease-in-out infinite`;
        particle.style.animationDelay = `${delay}s`;
        
        container.appendChild(particle);
    }
}

/**
 * Initialize scramble text effect for hero title
 */
function initScrambleText() {
    const heroTitle = document.getElementById('heroTitle');
    if (!heroTitle) return;
    
    const originalText = heroTitle.textContent;
    
    // Clear the element
    heroTitle.innerHTML = '';
    
    // Create individual character spans
    originalText.split('').forEach(char => {
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = char;
        heroTitle.appendChild(span);
    });
    
    // Initial effect with each character being revealed one by one
    const chars = heroTitle.querySelectorAll('.char');
    chars.forEach((char, index) => {
        // Initially hide all characters
        char.style.opacity = '0';
        
        // Reveal characters one by one with delay
        setTimeout(() => {
            char.style.opacity = '1';
            char.classList.add('scrambled');
        }, 80 * index);
    });
    
    // Periodic scramble effect
    setInterval(() => {
        // Get a random character
        const randomIndex = Math.floor(Math.random() * chars.length);
        if (chars[randomIndex].textContent !== ' ') {
            scrambleCharacter(chars[randomIndex]);
        }
    }, 2000);
}

/**
 * Scramble a single character with glitch effect
 */
function scrambleCharacter(charElement) {
    const originalChar = charElement.textContent;
    const glitchChars = '!<>-_\\/[]{}—=+*^?#';
    let iterations = 0;
    
    // Create glitch effect
    const interval = setInterval(() => {
        charElement.textContent = glitchChars[Math.floor(Math.random() * glitchChars.length)];
        
        iterations++;
        if (iterations > 3) {
            clearInterval(interval);
            charElement.textContent = originalChar;
            charElement.classList.add('scrambled');
            
            setTimeout(() => {
                charElement.classList.remove('scrambled');
            }, 800);
        }
    }, 50);
}

/**
 * Initialize the feature carousel with enhanced animations and interactions
 */
function initCarousel() {
    const carousel = document.querySelector('.feature-carousel');
    if (!carousel) return;
    
    const track = carousel.querySelector('.carousel-track');
    const slides = carousel.querySelectorAll('.carousel-slide');
    const dotsContainer = carousel.querySelector('.carousel-dots');
    const nextButton = carousel.querySelector('.carousel-next');
    const prevButton = carousel.querySelector('.carousel-prev');
    
    if (!track || slides.length === 0) return;
    
    // Create dots with enhanced styling and previews
    if (dotsContainer) {
        slides.forEach((slide, index) => {
            // Create the dot
            const dot = document.createElement('button');
            dot.className = index === 0 ? 'carousel-dot active' : 'carousel-dot';
            dot.setAttribute('aria-label', `View feature ${index + 1}`);
            dot.dataset.slide = index;
            
            // Extract the feature title for the tooltip
            const featureTitle = slide.querySelector('h3').textContent;
            dot.setAttribute('title', featureTitle);
            
            // Add to container
            dotsContainer.appendChild(dot);
        });
    }
    
    // Variables
    const dots = carousel.querySelectorAll('.carousel-dot');
    let currentSlide = 0;
    let isMoving = false;
    const slideWidth = 100; // percentage
    
    // Enhanced carousel navigation logic
    function updateCarousel(newIndex, direction = null) {
        if (isMoving) return;
        if (newIndex < 0 || newIndex >= slides.length) return;
        
        isMoving = true;
        
        // Determine animation direction
        const outgoingSlide = currentSlide;
        currentSlide = newIndex;
        
        // Apply transition based on direction
        track.style.transition = 'transform 0.5s cubic-bezier(0.645, 0.045, 0.355, 1.000)';
        track.style.transform = `translateX(-${currentSlide * slideWidth}%)`;
        
        // Update slide states with delay for better visual transitions
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
        
        // Update dot states with smooth transition
        dots.forEach((dot, index) => {
            // Add special animation class for the transitions
            if (index === currentSlide) {
                dot.classList.add('active');
                dot.setAttribute('aria-current', 'true');
            } else {
                dot.classList.remove('active');
                dot.removeAttribute('aria-current');
            }
        });
        
        // Update button states with transitions
        if (prevButton) {
            prevButton.disabled = currentSlide === 0;
            prevButton.classList.toggle('disabled', currentSlide === 0);
            
            // Add ripple effect on click
            if (direction === 'prev' && !prevButton.disabled) {
                addButtonRipple(prevButton);
            }
        }
        
        if (nextButton) {
            nextButton.disabled = currentSlide === slides.length - 1;
            nextButton.classList.toggle('disabled', currentSlide === slides.length - 1);
            
            // Add ripple effect on click
            if (direction === 'next' && !nextButton.disabled) {
                addButtonRipple(nextButton);
            }
        }
        
        // Animate the content of the active slide
        animateActiveSlideContent(slides[currentSlide]);
        
        // Reset isMoving after transition
        setTimeout(() => {
            isMoving = false;
        }, 500);
    }
    
    // Add ripple effect to carousel buttons
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
    
    // Animate the active slide content with staggered animations
    function animateActiveSlideContent(slide) {
        // Find elements to animate
        const icon = slide.querySelector('.feature-icon');
        const heading = slide.querySelector('h3');
        const listItems = slide.querySelectorAll('li');
        const button = slide.querySelector('button');
        const visual = slide.querySelector('.md\\:w-1\\/2:last-child > div');
        
        // Reset animations
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
        
        // Apply staggered animations
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
    
    // Navigate to previous/next slide
    function goToSlide(index, direction = null) {
        updateCarousel(index, direction);
    }
    
    // Event listeners
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            goToSlide(currentSlide + 1, 'next');
            stopAutoRotate(); // Stop auto-rotation on user interaction
            setTimeout(startAutoRotate, 5000); // Resume after 5 seconds
        });
    }
    
    if (prevButton) {
        prevButton.addEventListener('click', () => {
            goToSlide(currentSlide - 1, 'prev');
            stopAutoRotate(); // Stop auto-rotation on user interaction
            setTimeout(startAutoRotate, 5000); // Resume after 5 seconds
        });
    }
    
    // Dot navigation with enhanced interaction
    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            const slideIndex = parseInt(dot.dataset.slide);
            const direction = slideIndex > currentSlide ? 'next' : 'prev';
            goToSlide(slideIndex, direction);
            stopAutoRotate(); // Stop auto-rotation on user interaction
            setTimeout(startAutoRotate, 5000); // Resume after 5 seconds
        });
        
        // Add hover effect
        dot.addEventListener('mouseenter', () => {
            dot.style.transform = 'scaleY(1.2)';
        });
        
        dot.addEventListener('mouseleave', () => {
            dot.style.transform = 'scaleY(1)';
        });
    });
    
    // Keyboard navigation
    carousel.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            goToSlide(currentSlide - 1, 'prev');
            stopAutoRotate();
            setTimeout(startAutoRotate, 5000);
        } else if (e.key === 'ArrowRight') {
            goToSlide(currentSlide + 1, 'next');
            stopAutoRotate();
            setTimeout(startAutoRotate, 5000);
        }
    });
    
    // Enhanced touch events for swiping with animations
    let touchStartX = 0;
    let touchEndX = 0;
    let touchStartTime = 0;
    
    carousel.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartTime = new Date().getTime();
        stopAutoRotate();
    }, {passive: true});
    
    carousel.addEventListener('touchmove', (e) => {
        const currentX = e.changedTouches[0].screenX;
        const diff = touchStartX - currentX;
        const offset = (diff / carousel.offsetWidth) * 100;
        
        // Only apply drag if it's not at the edges or the drag isn't too large
        if ((currentSlide > 0 || diff < 0) && (currentSlide < slides.length - 1 || diff > 0) && Math.abs(diff) < 100) {
            track.style.transition = 'none';
            track.style.transform = `translateX(-${(currentSlide * 100) + offset}%)`;
        }
    }, {passive: true});
    
    carousel.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const touchEndTime = new Date().getTime();
        
        // Calculate swipe speed and distance
        const swipeDistance = touchStartX - touchEndX;
        const swipeTime = touchEndTime - touchStartTime;
        const swipeSpeed = Math.abs(swipeDistance / swipeTime);
        
        // Determine if swipe was intentional based on speed and distance
        if (swipeSpeed > 0.5 || Math.abs(swipeDistance) > 50) {
            if (swipeDistance > 0 && currentSlide < slides.length - 1) {
                // Swipe left - go to next
                goToSlide(currentSlide + 1, 'next');
            } else if (swipeDistance < 0 && currentSlide > 0) {
                // Swipe right - go to previous
                goToSlide(currentSlide - 1, 'prev');
            } else {
                // Snap back to current slide
                track.style.transition = 'transform 0.3s ease';
                track.style.transform = `translateX(-${currentSlide * 100}%)`;
            }
        } else {
            // If the swipe wasn't fast enough, revert to current slide
            track.style.transition = 'transform 0.3s ease';
            track.style.transform = `translateX(-${currentSlide * 100}%)`;
        }
        
        // Resume auto-rotation after delay
        setTimeout(startAutoRotate, 5000);
    }, {passive: true});
    
    // Automatic rotation with progress indicator
    let autoRotateInterval;
    let progressBar;
    
    function addProgressIndicator() {
        if (dotsContainer) {
            progressBar = document.createElement('div');
            progressBar.className = 'carousel-progress';
            progressBar.style.cssText = `
                width: 0%;
                height: 2px;
                background: rgba(88, 101, 242, 0.5);
                position: absolute;
                bottom: -10px;
                left: 0;
                transition: width 5000ms linear;
            `;
            dotsContainer.style.position = 'relative';
            dotsContainer.appendChild(progressBar);
        }
    }
    
    function updateProgressBar(reset = false) {
        if (progressBar) {
            if (reset) {
                progressBar.style.transition = 'none';
                progressBar.style.width = '0%';
                setTimeout(() => {
                    progressBar.style.transition = 'width 5000ms linear';
                    progressBar.style.width = '100%';
                }, 50);
            } else {
                progressBar.style.width = '100%';
            }
        }
    }
    
    function startAutoRotate() {
        // Clear any existing intervals
        stopAutoRotate();
        
        // Reset and start progress bar
        updateProgressBar(true);
        
        // Start new interval
        autoRotateInterval = setInterval(() => {
            // Loop back to the beginning if we're at the end
            const nextSlide = currentSlide === slides.length - 1 ? 0 : currentSlide + 1;
            goToSlide(nextSlide, 'next');
            
            // Reset progress bar
            updateProgressBar(true);
        }, 5000); // Change slide every 5 seconds
    }
    
    function stopAutoRotate() {
        clearInterval(autoRotateInterval);
        if (progressBar) {
            progressBar.style.width = '0%';
        }
    }
    
    // Add progress indicator
    addProgressIndicator();
    
    // Set up interaction listeners for pausing/resuming auto-rotation
    carousel.addEventListener('mouseenter', stopAutoRotate);
    carousel.addEventListener('mouseleave', startAutoRotate);
    carousel.addEventListener('focusin', stopAutoRotate);
    carousel.addEventListener('focusout', () => {
        if (!carousel.contains(document.activeElement)) {
            startAutoRotate();
        }
    });
    
    // Initial animations and setup
    animateActiveSlideContent(slides[0]);
    updateCarousel(0);
    startAutoRotate();
    
    // Set up typing animation for demo
    setupTypingAnimation();
}

/**
 * Set up typing animations for the carousel demos
 */
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
        
        // Start typing animation when element is in view
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