class CarouselSection {
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
        this.slides = document.querySelectorAll('.carousel-slide');
        this.indicators = document.querySelectorAll('.carousel-indicators .indicator');
        this.prevBtn = document.getElementById('carouselPrev');
        this.nextBtn = document.getElementById('carouselNext');
        
        if (!this.track) return;
        
        this.setupEventListeners();
        this.updateSlides();
        this.startAutoPlay();
    }
    
    setupEventListeners() {
        this.prevBtn?.addEventListener('click', () => this.prevSlide());
        this.nextBtn?.addEventListener('click', () => this.nextSlide());
        
        this.indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => this.goToSlide(index));
        });
        
        this.track.addEventListener('mouseenter', () => this.stopAutoPlay());
        this.track.addEventListener('mouseleave', () => this.startAutoPlay());
        
        document.addEventListener('carouselVisible', () => {
            this.onSectionVisible();
        });
        
        document.addEventListener('keydown', (e) => {
            if (this.isCarouselActive()) {
                if (e.key === 'ArrowLeft') {
                    e.stopPropagation();
                    this.prevSlide();
                } else if (e.key === 'ArrowRight') {
                    e.stopPropagation();
                    this.nextSlide();
                }
            }
        });
    }
    
    isCarouselActive() {
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
        
        this.slides.forEach((slide, index) => {
            slide.classList.remove('active');
            if (index === this.currentSlide) {
                setTimeout(() => {
                    slide.classList.add('active');
                }, 50);
            }
        });
        
        this.updateIndicators();
        this.animateSlideContent();
        
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
        
        const title = activeSlide.querySelector('.slide-title');
        const description = activeSlide.querySelector('.slide-description');
        const stats = activeSlide.querySelectorAll('.stat-item');
        const image = activeSlide.querySelector('.image-placeholder');
        
        if (title) {
            title.style.opacity = '0';
            title.style.transform = 'translateY(30px)';
            setTimeout(() => {
                title.style.transition = 'all 0.6s ease';
                title.style.opacity = '1';
                title.style.transform = 'translateY(0)';
            }, 100);
        }
        
        if (description) {
            description.style.opacity = '0';
            description.style.transform = 'translateY(20px)';
            setTimeout(() => {
                description.style.transition = 'all 0.6s ease';
                description.style.opacity = '1';
                description.style.transform = 'translateY(0)';
            }, 200);
        }
        
        stats.forEach((stat, index) => {
            stat.style.opacity = '0';
            stat.style.transform = 'translateY(20px)';
            setTimeout(() => {
                stat.style.transition = 'all 0.6s ease';
                stat.style.opacity = '1';
                stat.style.transform = 'translateY(0)';
            }, 300 + (index * 100));
        });
        
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
        
        setTimeout(() => {
            this.animateSlideContent();
        }, 800);
        
        this.startAutoPlay();
    }
    
    destroy() {
        this.stopAutoPlay();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    window.carouselSection = new CarouselSection();
});

window.CarouselSection = CarouselSection;
