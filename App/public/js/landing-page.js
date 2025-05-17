document.addEventListener('DOMContentLoaded', function() {
    // Initialize background image
    initBackgroundImage();
    
    // Initialize scroll animations
    initScrollAnimations();
    
    // Initialize floating elements
    initFloatingElements();
    
    // Create enhanced particles
    createEnhancedParticles();
    
    // Initialize scramble text effect
    initScrambleText();
    
    // Initialize fixed carousel
    initFixedCarousel();
});

// Add a separate window load event for tornado effect to ensure images are loaded
window.addEventListener('load', function() {
    // Initialize tornado parallax effect after all resources are loaded
    setTimeout(initTornadoParallax, 500);
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


function createEnhancedParticles() {
    const container = document.getElementById('particles-container');
    if (!container) return;
    
    const particleCount = 120; 
    
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
        
        
        const duration = Math.random() * (type.speed[1] - type.speed[0]) + type.speed[0];
        const delay = Math.random() * 15;
        
        
        const startX = posX;
        const startY = posY;
        const endX = startX + (Math.random() * 20 - 10);
        const endY = startY + (Math.random() * 20 - 10);
        
        
        particle.style.animation = `float ${duration}s ease-in-out infinite`;
        particle.style.animationDelay = `${delay}s`;
        
        container.appendChild(particle);
    }
}


function initScrambleText() {
    const heroTitle = document.getElementById("heroTitle");
    if (heroTitle) {
        // Get the original text
        const originalText = heroTitle.textContent;
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
        
        function scrambleText(target, original) {
            let iterations = 0;
            const maxIterations = 15;
            
            const interval = setInterval(() => {
                target.innerText = original.split("")
                    .map((letter, index) => {
                        if (index < iterations) {
                            return original[index];
                        }
                        return chars[Math.floor(Math.random() * chars.length)];
                    })
                    .join("");
                
                if (iterations >= original.length) {
                    clearInterval(interval);
                }
                
                iterations += 1 / 3;
            }, 50);
        }
        
        // Start the scramble animation after a delay
        setTimeout(() => {
            scrambleText(heroTitle, originalText);
        }, 1000);
    }
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
