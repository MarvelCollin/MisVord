document.addEventListener('DOMContentLoaded', function() {
    // Initialize GSAP for advanced animations
    gsap.registerPlugin(ScrollTrigger);
    
    // Hero animations
    gsap.from(".hero-title", {
        opacity: 0,
        y: 50,
        duration: 1,
        ease: "power3.out"
    });
    
    gsap.from(".hero-text", {
        opacity: 0,
        y: 30,
        duration: 1,
        delay: 0.3,
        ease: "power3.out"
    });
    
    gsap.from(".hero-buttons", {
        opacity: 0,
        y: 30,
        duration: 1,
        delay: 0.6,
        ease: "power3.out"
    });
    
    // Feature section animations
    gsap.utils.toArray(".feature-section").forEach((section, i) => {
        // Staggered animation for alternating sections
        const direction = i % 2 === 0 ? 1 : -1;
        
        // Content animation
        gsap.from(section.querySelector(".feature-content"), {
            scrollTrigger: {
                trigger: section,
                start: "top 75%",
                toggleActions: "play none none none"
            },
            x: 50 * direction,
            opacity: 0,
            duration: 1,
            ease: "power2.out"
        });
        
        // Image animation with slight delay
        gsap.from(section.querySelector(".feature-image"), {
            scrollTrigger: {
                trigger: section,
                start: "top 75%",
                toggleActions: "play none none none"
            },
            x: -50 * direction,
            opacity: 0,
            duration: 1,
            delay: 0.2,
            ease: "power2.out"
        });
    });
    
    // Journey section animation
    gsap.from(".journey-content", {
        scrollTrigger: {
            trigger: ".journey-content",
            start: "top 80%",
            toggleActions: "play none none none"
        },
        opacity: 0,
        y: 50,
        duration: 1,
        ease: "power2.out"
    });
    
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
                                  (scrollDirection * scrollSpeed * 0.2 * rotation);
            
            // Add subtle scale effect based on scroll speed
            const scaleAmount = 1 + (Math.min(scrollSpeed, 10) * 0.005 * speed);
            
            // Apply enhanced transformation with easing
            element.style.transform = `translate3d(${xPos}px, ${yPos}px, 0) rotate(${rotationAmount}deg) scale(${scaleAmount})`;
            
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
    
    // Enhanced mouse interaction with 3D effect
    document.addEventListener('mousemove', function(e) {
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        floatingElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            // Calculate distance from mouse to element center
            const distanceX = mouseX - centerX;
            const distanceY = mouseY - centerY;
            const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
            
            // Only affect elements within a certain range of the mouse
            if (distance < 400) {
                // Calculate movement based on distance (move away from mouse)
                const moveX = distanceX * 0.05 * (1 - distance / 400);
                const moveY = distanceY * 0.05 * (1 - distance / 400);
                
                // Add subtle 3D rotation effect
                const rotateX = -moveY * 0.2;
                const rotateY = moveX * 0.2;
                
                // Apply smooth movement transformation
                gsap.to(element, {
                    x: moveX,
                    y: moveY,
                    rotateX: rotateX,
                    rotateY: rotateY,
                    duration: 0.8,
                    ease: "power2.out"
                });
            }
        });
    });
    
    // Function to create enhanced floating particles
    function createEnhancedParticles() {
        const container = document.getElementById('particles-container');
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
            
            const duration = Math.random() * (type.speed[1] - type.speed[0]) + type.speed[0];
            const delay = Math.random() * 15;
            particle.style.animation = `float ${duration}s ease-in-out infinite`;
            particle.style.animationDelay = `${delay}s`;
            
            container.appendChild(particle);
        }
    }
    
    createEnhancedParticles();
    
    // Add scramble text animation for hero title
    function initScrambleText() {
        const heroTitle = document.getElementById('heroTitle');
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
    
    // Initialize the fixed scramble text animation
    initScrambleText();
});
