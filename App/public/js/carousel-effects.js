/**
 * Advanced carousel effects for MiscVord landing page
 * Provides enhanced interactive animations and effects for carousels
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize circular carousel with 3D rotation effect
    if (typeof Swiper !== 'undefined' && document.querySelector('.circular-carousel')) {
        const circularCarousel = new Swiper('.circular-carousel', {
            effect: 'coverflow',
            grabCursor: true,
            centeredSlides: true,
            slidesPerView: 'auto',
            initialSlide: 2,
            loop: true,
            loopAdditionalSlides: 3,
            coverflowEffect: {
                rotate: 0,
                stretch: 0,
                depth: 300,
                modifier: 1,
                slideShadows: false,
            },
            pagination: {
                el: '.circular-pagination',
                clickable: true,
                renderBullet: function (index, className) {
                    return '<span class="circular-pagination-bullet ' + className + '"></span>';
                },
            },
            autoplay: {
                delay: 4000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true
            },
            on: {
                init: function() {
                    createFloatingBubbles();
                }
            }
        });

        // Enhanced interaction with hover effects for circular items
        const circularItems = document.querySelectorAll('.circular-item');
        
        circularItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                if (typeof gsap !== 'undefined') {
                    gsap.to(item, {
                        boxShadow: '0 20px 40px rgba(88, 101, 242, 0.4)',
                        borderColor: 'rgba(88, 101, 242, 0.5)',
                        duration: 0.5
                    });
                    
                    const image = item.querySelector('.circular-image');
                    if (image) {
                        gsap.to(image, {
                            scale: 1.1,
                            duration: 1,
                            ease: "power2.out"
                        });
                    }
                }
            });
            
            item.addEventListener('mouseleave', () => {
                if (typeof gsap !== 'undefined') {
                    gsap.to(item, {
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        duration: 0.5
                    });
                    
                    const image = item.querySelector('.circular-image');
                    if (image) {
                        gsap.to(image, {
                            scale: 1,
                            duration: 1,
                            ease: "power2.out"
                        });
                    }
                }
            });
        });
        
        // Add 3D tilt effect on mouse move
        if (typeof gsap !== 'undefined') {
            circularItems.forEach(item => {
                item.addEventListener('mousemove', (e) => {
                    const rect = item.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;
                    
                    // Calculate normalized coordinates (-1 to 1)
                    const normalizedX = (e.clientX - centerX) / (rect.width / 2);
                    const normalizedY = (e.clientY - centerY) / (rect.height / 2);
                    
                    // Apply rotation
                    gsap.to(item, {
                        rotationY: normalizedX * 10,
                        rotationX: -normalizedY * 10,
                        duration: 0.5,
                        ease: "power2.out"
                    });
                });
                
                item.addEventListener('mouseleave', () => {
                    gsap.to(item, {
                        rotationY: 0,
                        rotationX: 0,
                        duration: 0.8,
                        ease: "elastic.out(1, 0.5)"
                    });
                });
            });
        }
    }
    
    // Create floating bubbles effect for the circular carousel section
    function createFloatingBubbles() {
        const container = document.querySelector('.bubbles-container');
        if (!container) return;
        
        const bubbleCount = 20;
        
        for (let i = 0; i < bubbleCount; i++) {
            const bubble = document.createElement('div');
            bubble.className = 'bubble';
            
            // Random size
            const size = Math.random() * 70 + 30;
            bubble.style.width = `${size}px`;
            bubble.style.height = `${size}px`;
            
            // Random position
            const posX = Math.random() * 100;
            bubble.style.left = `${posX}%`;
            
            // Random animation duration and delay
            const duration = Math.random() * 10 + 10;
            const delay = Math.random() * 10;
            bubble.style.animation = `bubble-rise ${duration}s ease-in ${delay}s infinite`;
            
            container.appendChild(bubble);
        }
    }
    
    // Add magnetic effect to buttons for more interactivity
    const discordButtons = document.querySelectorAll('.discord-btn');
    
    discordButtons.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            if (typeof gsap === 'undefined') return;
            
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Calculate distance from center
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const distanceX = x - centerX;
            const distanceY = y - centerY;
            
            // Apply magnetic effect - button follows cursor slightly
            gsap.to(btn, {
                x: distanceX * 0.2,
                y: distanceY * 0.2,
                duration: 0.6,
                ease: "power2.out"
            });
            
            // Add subtle glow where cursor is
            const glow = btn.querySelector('.btn-glow') || document.createElement('div');
            if (!glow.classList.contains('btn-glow')) {
                glow.className = 'btn-glow';
                glow.style.position = 'absolute';
                glow.style.borderRadius = '50%';
                glow.style.pointerEvents = 'none';
                glow.style.background = 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)';
                glow.style.width = '100px';
                glow.style.height = '100px';
                glow.style.transform = 'translate(-50%, -50%)';
                btn.style.position = 'relative';
                btn.style.overflow = 'hidden';
                btn.appendChild(glow);
            }
            
            // Position the glow at cursor position
            gsap.to(glow, {
                left: x,
                top: y,
                opacity: 0.5,
                duration: 0.3
            });
        });
        
        btn.addEventListener('mouseleave', () => {
            if (typeof gsap === 'undefined') return;
            
            // Reset button position
            gsap.to(btn, {
                x: 0,
                y: 0,
                duration: 0.8,
                ease: "elastic.out(1, 0.5)"
            });
            
            // Fade out glow
            const glow = btn.querySelector('.btn-glow');
            if (glow) {
                gsap.to(glow, {
                    opacity: 0,
                    duration: 0.3,
                    onComplete: () => {
                        glow.remove();
                    }
                });
            }
        });
    });
});
```

Add this script reference to the landing page by adding this line in the `$additional_head` variable in the landing page:

<script src="<?php echo asset('/js/carousel-effects.js'); ?>"></script>
