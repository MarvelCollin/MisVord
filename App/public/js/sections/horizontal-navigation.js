class HorizontalNavigation {
    constructor() {
        this.currentIndex = 0;
        this.totalSections = 3;
        this.isTransitioning = false;
        this.scrollThreshold = 50;
        this.inHorizontalSection = false;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.threshold = 50;
        
        this.init();
    }
    
    init() {
        this.wrapper = document.getElementById('swipe-wrapper');
        this.heroSection = document.querySelector('.hero-section');
        if (!this.wrapper) return;
        
        this.sections = this.wrapper.querySelectorAll('.swipe-section');
        this.navDots = document.querySelectorAll('.nav-dot');
        this.setupEventListeners();
        this.checkScrollPosition();
    }
    
    setupEventListeners() {
        let scrollTimeout;
        
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.handleScroll();
            }, 10);
        }, { passive: true });
        
        window.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
        
        this.wrapper.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.wrapper.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.wrapper.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        this.navDots.forEach((dot, index) => {
            dot.addEventListener('click', () => this.goToSection(index));
        });
        
        window.addEventListener('resize', this.handleResize.bind(this));
    }
    
    handleScroll() {
        this.checkScrollPosition();
    }
    
    checkScrollPosition() {
        const heroRect = this.heroSection.getBoundingClientRect();
        const wrapperRect = this.wrapper.getBoundingClientRect();
        
        const wasInSection = this.inHorizontalSection;
        this.inHorizontalSection = heroRect.bottom <= 50 && wrapperRect.top <= 50 && wrapperRect.bottom >= window.innerHeight / 2;
        
        if (!wasInSection && this.inHorizontalSection) {
            this.currentIndex = 0;
            this.navigateToSection(0);
        }
    }
    
    handleWheel(e) {
        if (!this.inHorizontalSection || this.isTransitioning || window.innerWidth <= 768) return;
        
        const deltaY = e.deltaY;
        const deltaX = e.deltaX;
        
        const major = Math.abs(deltaX) >= Math.abs(deltaY) ? deltaX : deltaY;
        
        if (Math.abs(major) > this.scrollThreshold) {
            e.preventDefault();
            
            if (major > 0) {
                this.goToNext();
            } else {
                this.goToPrev();
            }
        }
    }
    
    handleTouchStart(e) {
        if (!this.inHorizontalSection) return;
        
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
    }
    
    handleTouchMove(e) {
        if (!this.inHorizontalSection || window.innerWidth <= 768) return;
        
        const deltaX = Math.abs(this.touchStartX - e.touches[0].clientX);
        const deltaY = Math.abs(this.touchStartY - e.touches[0].clientY);
        
        if (deltaX > deltaY) {
            e.preventDefault();
        }
    }
    
    handleTouchEnd(e) {
        if (!this.inHorizontalSection) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const deltaX = this.touchStartX - touchEndX;
        const deltaY = Math.abs(this.touchStartY - touchEndY);
        
        if (Math.abs(deltaX) > this.threshold && Math.abs(deltaX) > deltaY) {
            if (deltaX > 0) {
                this.goToNext();
            } else {
                this.goToPrev();
            }
        }
    }
    
    handleKeyDown(e) {
        if (!this.inHorizontalSection || this.isTransitioning || window.innerWidth <= 768) return;
        
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            this.goToPrev();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            this.goToNext();
        }
    }
    
    goToNext() {
        if (this.currentIndex < this.totalSections - 1) {
            this.currentIndex++;
            this.navigateToSection(this.currentIndex);
        }
    }
    
    goToPrev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.navigateToSection(this.currentIndex);
        }
    }
    
    navigateToSection(index) {
        if (this.isTransitioning) return;
        
        if (window.innerWidth <= 768) {
            this.currentIndex = index;
            this.updateActiveSection();
            return;
        }
        
        this.isTransitioning = true;
        this.currentIndex = index;
        
        const translateX = -index * 100;
        this.wrapper.style.transform = `translateX(${translateX}vw)`;
        
        setTimeout(() => {
            this.isTransitioning = false;
            this.updateActiveSection();
        }, 800);
    }
    
    updateActiveSection() {
        this.sections.forEach((section, index) => {
            if (index === this.currentIndex) {
                section.classList.add('is-active');
            } else {
                section.classList.remove('is-active');
            }
        });
        
        this.navDots.forEach((dot, index) => {
            if (index === this.currentIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
        
        this.triggerSectionEvents();
    }
    
    triggerSectionEvents() {
        const sectionNames = ['featured-cards', 'carousel', 'nitro'];
        const currentSection = sectionNames[this.currentIndex];
        
        if (currentSection) {
            const event = new CustomEvent(`${currentSection}Visible`);
            document.dispatchEvent(event);
        }
        
        // Initialize carousel when it becomes active
        if (currentSection === 'carousel') {
            this.initCarousel();
        }
    }
    
    initCarousel() {
        if (!this.carouselInstance) {
            this.carouselInstance = new CarouselHandler();
        }
        this.carouselInstance.onSectionVisible();
    }
    
    goToSection(index) {
        if (index >= 0 && index < this.totalSections) {
            this.navigateToSection(index);
        }
    }
    
    handleResize() {
        this.isTransitioning = false;
        this.checkScrollPosition();
        
        if (window.innerWidth <= 768) {
            this.wrapper.style.transform = 'translateX(0)';
        } else {
            this.navigateToSection(this.currentIndex);
        }
    }
}

class CarouselHandler {
    constructor() {
        this.currentSlide = 0;
        this.totalSlides = 4;
        this.isAnimating = false;
        this.autoPlayInterval = null;
        this.autoPlayDelay = 5000;
        
        this.init();
    }
    
    init() {
        this.track = document.getElementById('carouselTrack');
        this.slides = document.querySelectorAll('.book-page');
        this.indicators = document.querySelectorAll('.book-bookmark .bookmark');
        this.prevBtn = document.getElementById('carouselPrev');
        this.nextBtn = document.getElementById('carouselNext');
        
        if (!this.track) return;
        
        this.setupEventListeners();
        this.updateSlides();
    }
    
    setupEventListeners() {
        // Carousel navigation buttons
        this.prevBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.prevSlide();
        });
        
        this.nextBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.nextSlide();
        });
        
        // Carousel indicators
        this.indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.goToSlide(index);
            });
        });
        
        // Auto-play controls
        this.track?.addEventListener('mouseenter', () => this.stopAutoPlay());
        this.track?.addEventListener('mouseleave', () => this.startAutoPlay());
        
        // Keyboard navigation (only when carousel section is active)
        document.addEventListener('keydown', (e) => {
            if (this.isCarouselSectionActive()) {
                if (e.key === 'ArrowUp') {
                    e.stopPropagation();
                    e.preventDefault();
                    this.prevSlide();
                } else if (e.key === 'ArrowDown') {
                    e.stopPropagation();
                    e.preventDefault();
                    this.nextSlide();
                }
            }
        });
    }
    
    isCarouselSectionActive() {
        const carouselSection = document.querySelector('.carousel-section');
        return carouselSection && carouselSection.classList.contains('is-active');
    }
    
    prevSlide() {
        if (this.isAnimating) return;
        
        this.currentSlide = this.currentSlide > 0 ? this.currentSlide - 1 : this.totalSlides - 1;
        this.updateSlides();
    }
    
    nextSlide() {
        if (this.isAnimating) return;
        
        this.currentSlide = this.currentSlide < this.totalSlides - 1 ? this.currentSlide + 1 : 0;
        this.updateSlides();
    }
    
    goToSlide(index) {
        if (this.isAnimating || index === this.currentSlide) return;
        
        this.currentSlide = index;
        this.updateSlides();
    }
    
    updateSlides() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        
        // Move the track to show the current slide
        const translateX = -this.currentSlide * 25; // 25% per slide since each slide is 25% width
        if (this.track) {
            this.track.style.transform = `translateX(${translateX}%)`;
        }
        
        // Update active states
        this.slides.forEach((slide, index) => {
            if (index === this.currentSlide) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });
        
        this.updateIndicators();
        
        // Animate content after track movement
        setTimeout(() => {
            this.animateSlideContent();
        }, 100);
        
        setTimeout(() => {
            this.isAnimating = false;
        }, 600);
    }
    
    updateIndicators() {
        this.indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === this.currentSlide);
        });
    }
    
    animateSlideContent() {
        const activeSlide = this.slides[this.currentSlide];
        if (!activeSlide) return;
        
        const title = activeSlide.querySelector('.chapter-title');
        const description = activeSlide.querySelector('.story-text');
        const stats = activeSlide.querySelectorAll('.metric-badge');
        const image = activeSlide.querySelector('.chapter-icon');
        
        // Animate title
        if (title) {
            title.style.opacity = '0';
            title.style.transform = 'translateY(30px)';
            setTimeout(() => {
                title.style.transition = 'all 0.6s ease';
                title.style.opacity = '1';
                title.style.transform = 'translateY(0)';
            }, 100);
        }
        
        // Animate description
        if (description) {
            description.style.opacity = '0';
            description.style.transform = 'translateY(20px)';
            setTimeout(() => {
                description.style.transition = 'all 0.6s ease';
                description.style.opacity = '1';
                description.style.transform = 'translateY(0)';
            }, 200);
        }
        
        // Animate stats
        stats.forEach((stat, index) => {
            stat.style.opacity = '0';
            stat.style.transform = 'translateY(20px)';
            setTimeout(() => {
                stat.style.transition = 'all 0.6s ease';
                stat.style.opacity = '1';
                stat.style.transform = 'translateY(0)';
            }, 300 + (index * 100));
        });
        
        // Animate image
        if (image) {
            image.style.transform = 'scale(0.8) rotate(-5deg)';
            setTimeout(() => {
                image.style.transition = 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)';
                image.style.transform = 'scale(1) rotate(0deg)';
            }, 150);
        }
    }
    
    startAutoPlay() {
        this.stopAutoPlay();
        this.autoPlayInterval = setInterval(() => {
            this.nextSlide();
        }, this.autoPlayDelay);
    }
    
    stopAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }
    
    onSectionVisible() {
        // Animate section title and subtitle
        const title = document.querySelector('.carousel-title');
        const subtitle = document.querySelector('.carousel-subtitle');
        
        if (title) {
            setTimeout(() => {
                title.classList.add('revealed');
            }, 200);
        }
        
        if (subtitle) {
            setTimeout(() => {
                subtitle.classList.add('revealed');
            }, 600);
        }
        
        // Start slide content animation
        setTimeout(() => {
            this.animateSlideContent();
        }, 800);
        
        // Start auto-play
        this.startAutoPlay();
    }
    
    destroy() {
        this.stopAutoPlay();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    window.horizontalNavigation = new HorizontalNavigation();
});

window.HorizontalNavigation = HorizontalNavigation; 
window.CarouselHandler = CarouselHandler; 