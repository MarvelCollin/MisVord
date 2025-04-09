document.addEventListener('DOMContentLoaded', function() {
    // Page loading animation
    const pageLoader = document.createElement('div');
    pageLoader.className = 'page-transition-overlay';
    pageLoader.innerHTML = '<div class="page-loader"></div>';
    document.body.appendChild(pageLoader);
    
    setTimeout(() => {
        pageLoader.style.opacity = '0';
        setTimeout(() => {
            pageLoader.remove();
        }, 800);
    }, 500);
    
    // Check if GSAP is available
    if (typeof gsap !== 'undefined') {
        // Initialize GSAP for advanced animations
        if (typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
        }
        
        // Hero animations with staggered appearance
        const heroElements = [".hero-title", ".hero-text", ".hero-buttons"];
        
        gsap.set(heroElements, { opacity: 0, y: 50 });
        
        const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
        
        heroTl.to(".hero-title", {
            opacity: 1,
            y: 0,
            duration: 1.2
        })
        .to(".hero-text", {
            opacity: 1,
            y: 0,
            duration: 1
        }, "-=0.8")
        .to(".hero-buttons", {
            opacity: 1,
            y: 0,
            duration: 1,
            stagger: 0.2
        }, "-=0.6");
        
        // Feature section animations with better scroll triggers
        gsap.utils.toArray(".feature-section").forEach((section, i) => {
            // Staggered animation for alternating sections
            const direction = i % 2 === 0 ? 1 : -1;
            
            // Set initial state
            gsap.set(section.querySelector(".feature-content"), { 
                opacity: 0, 
                x: 50 * direction 
            });
            
            if (section.querySelector(".feature-image")) {
                gsap.set(section.querySelector(".feature-image"), { 
                    opacity: 0, 
                    x: -50 * direction 
                });
            }
            
            // Create scroll-triggered animations
            ScrollTrigger.create({
                trigger: section,
                start: "top 75%",
                onEnter: () => {
                    // Content animation
                    gsap.to(section.querySelector(".feature-content"), {
                        x: 0,
                        opacity: 1,
                        duration: 1.2,
                        ease: "power2.out"
                    });
                    
                    // Image animation with slight delay
                    if (section.querySelector(".feature-image")) {
                        gsap.to(section.querySelector(".feature-image"), {
                            x: 0,
                            opacity: 1,
                            duration: 1.2,
                            delay: 0.2,
                            ease: "power2.out"
                        });
                    }
                },
                once: true
            });
        });
        
        // Journey section animation with enhanced entrance
        if (document.querySelector(".journey-content")) {
            ScrollTrigger.create({
                trigger: ".journey-content",
                start: "top 80%",
                onEnter: () => {
                    gsap.fromTo(".journey-content", 
                        { opacity: 0, y: 50 },
                        {
                            opacity: 1,
                            y: 0,
                            duration: 1.2,
                            ease: "power3.out"
                        }
                    );
                    
                    // Add particle burst animation to the wiggle gif
                    if (document.querySelector('.journey-content img')) {
                        createParticleBurst(document.querySelector('.journey-content img'));
                    }
                },
                once: true
            });
        }
    } else {
        // Fallback animations for when GSAP is not available
        document.querySelectorAll(".hero-title, .hero-text, .hero-buttons").forEach(el => {
            el.style.opacity = "1";
        });
    }
    
    // Initialize Swiper carousels
    initCarousels();
    
    // Function to create particle burst animation
    function createParticleBurst(element) {
        if (!element || typeof gsap === 'undefined') return;
        
        const container = document.createElement('div');
        container.className = 'particle-burst-container';
        container.style.position = 'absolute';
        container.style.top = '50%';
        container.style.left = '50%';
        container.style.transform = 'translate(-50%, -50%)';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.pointerEvents = 'none';
        container.style.zIndex = '5';
        
        element.parentNode.style.position = 'relative';
        element.parentNode.appendChild(container);
        
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'burst-particle';
            particle.style.position = 'absolute';
            particle.style.backgroundColor = getRandomColor();
            particle.style.width = `${Math.random() * 10 + 5}px`;
            particle.style.height = `${Math.random() * 10 + 5}px`;
            particle.style.borderRadius = '50%';
            particle.style.top = '50%';
            particle.style.left = '50%';
            particle.style.transform = 'translate(-50%, -50%)';
            particle.style.opacity = '0';
            
            container.appendChild(particle);
            
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 100 + 50;
            const duration = Math.random() * 1 + 0.8;
            
            gsap.to(particle, {
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                opacity: 1,
                duration: duration / 3,
                ease: "power2.out",
                onComplete: () => {
                    gsap.to(particle, {
                        opacity: 0,
                        duration: duration / 2,
                        delay: duration / 3,
                        ease: "power2.in",
                        onComplete: () => {
                            particle.remove();
                        }
                    });
                }
            });
        }
        
        // Create pulsating effect for the element
        gsap.timeline({ repeat: 1 })
            .to(element, {
                scale: 1.2,
                duration: 0.5,
                ease: "elastic.out(1, 0.5)"
            })
            .to(element, {
                scale: 1,
                duration: 0.5,
                ease: "elastic.out(1, 0.5)"
            });
    }
    
    function getRandomColor() {
        const colors = ['#5865F2', '#57F287', '#EB459E', '#FEE75C', '#FFFFFF'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    // Enhanced parallax scrolling effect with more active movement
    const floatingElements = document.querySelectorAll('.floating-element');
    
    // Create floating trails and setup enhanced effect
    floatingElements.forEach(element => {
        // Create trail effect
        const trail = document.createElement('div');
        trail.className = 'floating-trail';
        element.parentNode.insertBefore(trail, element);
        element.trail = trail;
        
        // Add random starting position offset for more natural movement
        const randomOffset = (Math.random() - 0.5) * 20;
        element.style.transform = `translate3d(${randomOffset}px, ${randomOffset}px, 0)`;
    });
    
    // More active scroll handler with smoother animations
    let lastScrollTop = 0;
    let scrollDirection = 0;
    let scrollSpeed = 0;
    let ticking = false;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset;
        
        // Calculate scroll direction and speed
        scrollDirection = scrollTop > lastScrollTop ? 1 : -1;
        scrollSpeed = Math.abs(scrollTop - lastScrollTop) * 0.1;
        lastScrollTop = scrollTop;
        
        // Use requestAnimationFrame for smoother animations
        if (!ticking) {
            window.requestAnimationFrame(function() {
                updateFloatingElements(scrollTop, scrollDirection, scrollSpeed);
                ticking = false;
            });
            ticking = true;
        }
    });
    
    function updateFloatingElements(scrollTop, scrollDirection, scrollSpeed) {
        floatingElements.forEach(element => {
            const speed = parseFloat(element.getAttribute('data-speed')) || 0.3;
            const rotation = parseFloat(element.getAttribute('data-rotation')) || 0;
            const amplitude = parseFloat(element.getAttribute('data-amplitude')) || 20;
            
            // Calculate vertical movement based on scroll position with enhanced amplitude
            const yPos = -(scrollTop * speed);
            
            // Add horizontal sway based on scroll with dynamic amplitude
            const xPos = Math.sin(scrollTop * 0.002) * amplitude * speed;
            
            // Add rotation based on scroll and direction for more dynamic movement
            const rotationAmount = (Math.sin(scrollTop * 0.001) * rotation) + 
                                  (scrollDirection * Math.min(scrollSpeed, 5) * 0.2 * rotation);
            
            // Apply enhanced transformation with easing
            element.style.transform = `translate3d(${xPos}px, ${yPos}px, 0) rotate(${rotationAmount}deg)`;
            
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
    
    // Add scramble text animation for hero title
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
    
    // Scramble a single character
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

    // Mobile menu toggle functionality
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const menuClose = document.querySelector('.mobile-menu-close');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (menuToggle && menuClose && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.style.display = 'flex';
            setTimeout(() => {
                mobileMenu.classList.add('active');
            }, 10);
        });
        
        menuClose.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            setTimeout(() => {
                mobileMenu.style.display = 'none';
            }, 500);
        });
    }
    
    // Function to create enhanced floating particles
    function createEnhancedParticles() {
        const container = document.getElementById('particles-container');
        if (!container) return;
        
        const particleCount = 50; // Reduced for better performance
        
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
            particle.style.animation = `float ${duration}s ease-in-out infinite`;
            particle.style.animationDelay = `${delay}s`;
            
            container.appendChild(particle);
        }
    }
    
    // Initialize all components
    createEnhancedParticles();
    initScrambleText();
});

// Initialize the carousels separately to ensure Swiper is loaded
function initCarousels() {
    if (typeof Swiper === 'undefined') {
        console.warn('Swiper is not loaded. Carousels will not be initialized.');
        return;
    }

    // Feature carousel with 3D effect
    if (document.querySelector('.feature-carousel')) {
        const featureCarousel = new Swiper('.feature-carousel', {
            effect: 'coverflow',
            grabCursor: true,
            centeredSlides: true,
            slidesPerView: 'auto',
            coverflowEffect: {
                rotate: 20,
                stretch: 0,
                depth: 200,
                modifier: 1,
                slideShadows: true
            },
            loop: true,
            autoplay: {
                delay: 5000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
                dynamicBullets: true
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev'
            },
            breakpoints: {
                320: {
                    slidesPerView: 1,
                    spaceBetween: 20
                },
                640: {
                    slidesPerView: 2,
                    spaceBetween: 30
                },
                1024: {
                    slidesPerView: 'auto',
                    spaceBetween: 40
                }
            }
        });

        // Add slide change animation if GSAP is available
        if (typeof gsap !== 'undefined') {
            featureCarousel.on('slideChange', function() {
                const activeSlide = this.slides[this.activeIndex];
                if (!activeSlide) return;
                
                const icon = activeSlide.querySelector('.card-icon');
                const title = activeSlide.querySelector('.card-title');
                const description = activeSlide.querySelector('.card-description');
                const image = activeSlide.querySelector('.card-image-container');
                
                if (icon && title && description && image) {
                    gsap.fromTo([icon, title, description, image], 
                        { 
                            opacity: 0.6, 
                            y: 20, 
                            scale: 0.95 
                        }, 
                        { 
                            opacity: 1, 
                            y: 0, 
                            scale: 1, 
                            duration: 0.6, 
                            stagger: 0.1, 
                            ease: "power2.out"
                        }
                    );
                }
            });
        }
    }
    
    // Testimonial carousel with smooth scrolling effect
    if (document.querySelector('.testimonial-carousel')) {
        const testimonialCarousel = new Swiper('.testimonial-carousel', {
            slidesPerView: 1,
            spaceBetween: 30,
            grabCursor: true,
            loop: true,
            autoplay: {
                delay: 6000,
                disableOnInteraction: false
            },
            scrollbar: {
                el: '.testimonial-scrollbar',
                draggable: true,
            },
            breakpoints: {
                768: {
                    slidesPerView: 2,
                    spaceBetween: 30
                },
                1024: {
                    slidesPerView: 3,
                    spaceBetween: 40
                }
            }
        });

        // Add slide change animation if GSAP is available
        if (typeof gsap !== 'undefined') {
            testimonialCarousel.on('slideChange', function() {
                const activeSlides = document.querySelectorAll('.swiper-slide-active, .swiper-slide-next, .swiper-slide-next + .swiper-slide');
                
                activeSlides.forEach(slide => {
                    if (!slide) return;
                    
                    // Animate testimonial content
                    const avatar = slide.querySelector('.user-avatar');
                    const content = slide.querySelector('.testimonial-content');
                    
                    if (avatar) {
                        gsap.fromTo(avatar, 
                            { scale: 0.8, opacity: 0.6 }, 
                            { scale: 1, opacity: 1, duration: 0.8, ease: "elastic.out(1, 0.5)" }
                        );
                    }
                    
                    if (content) {
                        gsap.fromTo(content, 
                            { x: 20, opacity: 0.6 }, 
                            { x: 0, opacity: 1, duration: 0.6, ease: "power2.out" }
                        );
                    }
                });
            });
        }
    }
}
