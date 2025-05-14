document.addEventListener('DOMContentLoaded', function() {
    
    initScrollAnimations();
    
    
    initFloatingElements();
    
    
    createEnhancedParticles();
    
    
    initScrambleText();
    
    
    initFixedCarousel();
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
        
        
        scrollSpeed = Math.abs(scrollTop - lastScrollTop) * 0.1;
        lastScrollTop = scrollTop;
        
        
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
            
            
            const distanceY = mouseY - centerY;
            const distance = Math.abs(distanceY);
            
            
            if (distance < 300) {
                
                const moveY = distanceY * 0.02 * (1 - distance / 300);
                
                
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
    const heroTitle = document.getElementById('heroTitle');
    if (!heroTitle) return;
    
    const originalText = heroTitle.textContent;
    
    
    heroTitle.innerHTML = '';
    
    
    originalText.split('').forEach(char => {
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = char;
        heroTitle.appendChild(span);
    });
    
    
    const chars = heroTitle.querySelectorAll('.char');
    chars.forEach((char, index) => {
        
        char.style.opacity = '0';
        
        
        setTimeout(() => {
            char.style.opacity = '1';
            char.classList.add('scrambled');
        }, 80 * index);
    });
    
    
    setInterval(() => {
        
        const randomIndex = Math.floor(Math.random() * chars.length);
        if (chars[randomIndex].textContent !== ' ') {
            scrambleCharacter(chars[randomIndex]);
        }
    }, 2000);
}


function scrambleCharacter(charElement) {
    const originalChar = charElement.textContent;
    const glitchChars = '!<>-_\\/[]{}—=+*^?#';
    let iterations = 0;
    
    
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


function initFixedCarousel() {
    const carousel = document.querySelector('.feature-carousel');
    if (!carousel) return;
    
    
    const track = carousel.querySelector('.carousel-track');
    const slides = Array.from(carousel.querySelectorAll('.carousel-slide'));
    const dots = Array.from(carousel.querySelectorAll('.carousel-dot'));
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    
    if (!track || !slides.length || !prevBtn || !nextBtn) {
        console.error("Missing required carousel elements");
        return;
    }
    
    
    let currentSlide = 0;
    let isAnimating = false;
    const slideCount = slides.length;
    
    console.log("Carousel initialized with", slideCount, "slides");
    
    
    updateCarouselState(0);
    
    
    function goToSlide(index) {
        if (isAnimating) return;
        if (index < 0) index = 0;
        if (index >= slideCount) index = slideCount - 1;
        
        console.log("Navigating to slide", index);
        isAnimating = true;
        updateCarouselState(index);
        
        
        setTimeout(() => {
            isAnimating = false;
        }, 500);
    }
    
    
    function updateCarouselState(index) {
        
        track.style.transform = `translateX(-${index * 100}%)`;
        
        
        slides.forEach((slide, i) => {
            if (i === index) {
                slide.classList.add('active');
                slide.setAttribute('aria-hidden', 'false');
            } else {
                slide.classList.remove('active');
                slide.setAttribute('aria-hidden', 'true');
            }
        });
        
        
        dots.forEach((dot, i) => {
            if (i === index) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
        
        
        currentSlide = index;
        
        
        prevBtn.disabled = index === 0;
        prevBtn.classList.toggle('disabled', index === 0);
        nextBtn.disabled = index === slideCount - 1;
        nextBtn.classList.toggle('disabled', index === slideCount - 1);
    }
    
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log("Prev button clicked");
            goToSlide(currentSlide - 1);
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log("Next button clicked");
            goToSlide(currentSlide + 1);
        });
    }
    
    
    dots.forEach((dot, index) => {
        dot.addEventListener('click', function() {
            goToSlide(index);
        });
    });
    
    
    document.addEventListener('click', function(e) {
        if (e.target.closest('#carousel-prev')) {
            console.log("Prev button clicked via delegation");
            goToSlide(currentSlide - 1);
        } else if (e.target.closest('#carousel-next')) {
            console.log("Next button clicked via delegation");
            goToSlide(currentSlide + 1);
        }
    });
    
    
    carousel.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft') {
            goToSlide(currentSlide - 1);
        } else if (e.key === 'ArrowRight') {
            goToSlide(currentSlide + 1);
        }
    });
    
    
    let touchStartX = 0;
    let touchEndX = 0;
    
    carousel.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    carousel.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        const swipeDistance = touchStartX - touchEndX;
        
        if (Math.abs(swipeDistance) > 50) {
            if (swipeDistance > 0 && currentSlide < slideCount - 1) {
                
                goToSlide(currentSlide + 1);
            } else if (swipeDistance < 0 && currentSlide > 0) {
                
                goToSlide(currentSlide - 1);
            }
        }
    }, { passive: true });
    
    console.log("Carousel event listeners attached");
    
    
    const progressBar = carousel.querySelector('.carousel-progress');
    if (progressBar) {
        progressBar.style.width = '0%';
        progressBar.style.display = 'none';
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
