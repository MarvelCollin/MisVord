document.addEventListener('DOMContentLoaded', function() {
    initHeroCarousel();
    initFeatureCarousel();
    initSection2Animations();
    initSection3Interactions();
    initTornadoEffects();
});

function initHeroCarousel() {
    const carousel = document.querySelector('.features-section .carousel-track');
    const indicators = document.querySelectorAll('.nav-indicators .indicator');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    if (!carousel) return;

    let currentIndex = 0;
    const slideCount = 3;

    function updateCarousel() {
        carousel.style.transform = `translateX(-${currentIndex * (100 / slideCount)}%)`;

        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === currentIndex);
            indicator.classList.toggle('bg-blue-500', index === currentIndex);
            indicator.classList.toggle('bg-gray-300', index !== currentIndex);
        });

        if (prevBtn) prevBtn.disabled = currentIndex === 0;
        if (nextBtn) nextBtn.disabled = currentIndex === slideCount - 1;
    }

    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            currentIndex = index;
            updateCarousel();
        });
    });

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateCarousel();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentIndex < slideCount - 1) {
                currentIndex++;
                updateCarousel();
            }
        });
    }

    updateCarousel();
}

function initFeatureCarousel() {
    const carousel = document.querySelector('.feature-carousel');
    if (!carousel) return;

    const track = carousel.querySelector('.carousel-track');
    const slides = carousel.querySelectorAll('.carousel-slide');
    const dots = carousel.querySelectorAll('.carousel-dot');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');

    let currentSlide = 0;
    let isAnimating = false;
    const slideCount = slides.length;

    if (slides.length > 0) {
        slides[0].classList.add('active');
        slides[0].setAttribute('aria-hidden', 'false');
    }

    function goToSlide(index) {
        if (isAnimating || index < 0 || index >= slideCount) return;

        isAnimating = true;

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

        setTimeout(() => {
            isAnimating = false;
        }, 500);
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            goToSlide(currentSlide - 1);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            goToSlide(currentSlide + 1);
        });
    }

    dots.forEach((dot, index) => {
        dot.addEventListener('click', function() {
            goToSlide(index);
        });
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
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const swipeDistance = touchStartX - touchEndX;

        if (Math.abs(swipeDistance) > 50) {
            if (swipeDistance > 0 && currentSlide < slideCount - 1) {
                goToSlide(currentSlide + 1);
            } else if (swipeDistance < 0 && currentSlide > 0) {
                goToSlide(currentSlide - 1);
            }
        }
    }
}

function initSection2Animations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated-visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.animated-fade-in, .animated-slide-in-left, .animated-slide-in-right').forEach(element => {
        observer.observe(element);
    });

    const timelineVisuals = document.querySelectorAll('.timeline-visual');
    timelineVisuals.forEach(visual => {
        const overlayElement = visual.querySelector('.audio-wave-overlay, .screen-overlay, .video-chat-overlay');
        if (overlayElement) {
            visual.addEventListener('mouseenter', () => {
                overlayElement.style.opacity = '1';
            });

            visual.addEventListener('mouseleave', () => {
                overlayElement.style.opacity = '0';
            });
        }
    });

    function toggleSpeakingAnimation() {
        const audioIndicators = document.querySelectorAll('.audio-indicator');
        audioIndicators.forEach(indicator => {
            if (Math.random() > 0.7) {
                const spans = indicator.querySelectorAll('span');
                spans.forEach(span => {
                    if (Math.random() > 0.5) {
                        span.classList.toggle('speaking');
                    }
                });
            }
        });
    }

    setInterval(toggleSpeakingAnimation, 2000);
}

function initSection3Interactions() {
    createParticles();
    initTypingAnimation();
    initFeatureCardInteractions();
    initCommunityProgressionAnimations();
}

function createParticles() {
    const container = document.querySelector('.particles-container');
    if (!container) return;

    const particleCount = 40;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';

        const size = Math.random() * 4 + 1;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const hue = Math.random() * 60 + 180;

        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${posX}%;
            top: ${posY}%;
            background: hsla(${hue}, 80%, 70%, 0.6);
            border-radius: 50%;
            box-shadow: 0 0 ${size * 2}px hsla(${hue}, 80%, 70%, 0.8);
            pointer-events: none;
        `;

        const duration = Math.random() * 15 + 10;
        const delay = Math.random() * 5;

        particle.style.animation = `particleFloat ${duration}s ease-in-out infinite`;
        particle.style.animationDelay = `${delay}s`;

        container.appendChild(particle);
    }
}

function initTypingAnimation() {
    const typingText = document.querySelector('.typing-text');
    const cursor = document.querySelector('.cursor');

    if (typingText && cursor) {
        const originalText = typingText.textContent;

        function startTypingAnimation() {
            typingText.textContent = '';
            cursor.classList.add('active');

            let i = 0;
            const typingInterval = setInterval(() => {
                if (i < originalText.length) {
                    typingText.textContent += originalText.charAt(i);
                    i++;
                } else {
                    clearInterval(typingInterval);
                    setTimeout(() => {
                        cursor.classList.remove('active');
                    }, 1500);
                }
            }, 100);
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    startTypingAnimation();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        const section3 = document.querySelector('.feature-section-3');
        if (section3) {
            observer.observe(section3);
        }
    }
}

function initFeatureCardInteractions() {
    const featureCards = document.querySelectorAll('.feature-card');
    const featureDetail = document.querySelector('.feature-detail');
    const closeButtons = document.querySelectorAll('.close-detail');
    const featureDetailContents = document.querySelectorAll('.feature-detail-content');

    featureCards.forEach(card => {
        card.addEventListener('click', () => {
            const feature = card.getAttribute('data-feature');

            featureDetailContents.forEach(content => {
                content.classList.add('hidden');
            });

            const targetContent = document.querySelector(`.feature-detail-content[data-feature="${feature}"]`);
            if (targetContent) {
                targetContent.classList.remove('hidden');
            }

            if (featureDetail) {
                featureDetail.classList.add('active');

                setTimeout(() => {
                    featureDetail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 100);
            }
        });
    });

    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (featureDetail) {
                featureDetail.classList.remove('active');
            }
        });
    });
}

function initCommunityProgressionAnimations() {
    const stages = document.querySelectorAll('.stage');

    stages.forEach((stage, index) => {
        stage.addEventListener('mouseenter', () => {
            const icon = stage.querySelector('.stage-icon');
            const label = stage.querySelector('.stage-label');

            if (icon) {
                icon.style.transform = 'scale(1.1)';
                icon.style.transition = 'transform 0.3s ease';
            }

            if (label) {
                label.style.color = '#57F287';
                label.style.fontWeight = 'bold';
                label.style.transition = 'color 0.3s ease, font-weight 0.3s ease';
            }
        });

        stage.addEventListener('mouseleave', () => {
            const icon = stage.querySelector('.stage-icon');
            const label = stage.querySelector('.stage-label');

            if (icon) {
                icon.style.transform = 'scale(1)';
            }

            if (label) {
                label.style.color = 'white';
                label.style.fontWeight = 'bold';
            }
        });

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    stage.style.opacity = '0';
                    stage.style.transform = 'translateY(30px)';
                    stage.style.transition = 'all 0.8s ease';

                    setTimeout(() => {
                        stage.style.opacity = '1';
                        stage.style.transform = 'translateY(0)';
                    }, index * 200);

                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        observer.observe(stage);
    });

    const chartBars = document.querySelectorAll('.analytics-chart .chart-bar');
    if (chartBars.length > 0) {
        const chartObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    chartBars.forEach((bar, i) => {
                        const originalHeight = bar.style.height;
                        bar.style.height = '0%';
                        bar.style.transition = 'height 1s ease';

                        setTimeout(() => {
                            bar.style.height = originalHeight;
                        }, i * 100);
                    });
                    chartObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        const analyticsContainer = document.querySelector('.analytics-dashboard');
        if (analyticsContainer) {
            chartObserver.observe(analyticsContainer);
        }
    }
}

function initTornadoEffects() {
    const tornadoObjects = document.querySelectorAll('.tornado-object');

    tornadoObjects.forEach(obj => {
        const top = obj.dataset.top;
        const left = obj.dataset.left;
        const delay = obj.dataset.delay;
        const duration = obj.dataset.duration;

        obj.style.top = `${top}%`;
        obj.style.left = `${left}%`;
        obj.style.animationDelay = `${delay}s`;
        obj.style.animationDuration = `${duration}s`;
    });

    function triggerLightning() {
        const lightnings = document.querySelectorAll('.lightning');
        lightnings.forEach(lightning => {
            lightning.style.opacity = '1';
            setTimeout(() => {
                lightning.style.opacity = '0';
            }, 200);
        });

        setTimeout(triggerLightning, Math.random() * 10000 + 5000);
    }

    setTimeout(triggerLightning, 3000);
}

const particleAnimationStyle = document.createElement('style');
particleAnimationStyle.textContent = `
    @keyframes particleFloat {
        0%, 100% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0.6;
        }
        33% {
            transform: translateY(-20px) rotate(120deg);
            opacity: 1;
        }
        66% {
            transform: translateY(20px) rotate(240deg);
            opacity: 0.8;
        }
    }
`;

if (document.head) {
    document.head.appendChild(particleAnimationStyle);
}

document.addEventListener('DOMContentLoaded', function() {

    const buttons = document.querySelectorAll('.cta-button, .discord-btn');

    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = button.getBoundingClientRect();

            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            ripple.className = 'ripple';
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;

            button.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
});