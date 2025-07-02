class LandingNavigation {
    constructor() {
        this.currentIndex = 0;
        this.totalHorizontalSections = 3;
        this.isTransitioning = false;
        this.inHorizontalMode = false;
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
        
        this.setupNavigation();
        this.checkPosition();
    }
    
    setupNavigation() {
        let scrollTimeout;
        
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.handleScroll();
            }, 16);
        }, { passive: true });
        
        window.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
        
        if (this.wrapper) {
            this.wrapper.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        this.wrapper.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
            this.wrapper.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
        }
        
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        this.navDots.forEach((dot, index) => {
            dot.addEventListener('click', () => this.goToHorizontalSection(index));
        });
        
        window.addEventListener('resize', this.handleResize.bind(this));
    }
    
    handleScroll() {
        this.checkPosition();
    }
    
    checkPosition() {
        if (!this.heroSection || !this.wrapper) return;
        
        const heroRect = this.heroSection.getBoundingClientRect();
        const wrapperRect = this.wrapper.getBoundingClientRect();
        
        const wasInHorizontal = this.inHorizontalMode;
        this.inHorizontalMode = heroRect.bottom <= 100 && wrapperRect.top <= 100;
        
        const sectionNav = document.querySelector('.section-navigation');
        const swipeHint = document.querySelector('.swipe-hint');
        
        if (sectionNav) {
            if (this.inHorizontalMode) {
                sectionNav.classList.add('show-navigation');
            } else {
                sectionNav.classList.remove('show-navigation');
            }
        }
        
        if (swipeHint) {
            if (this.inHorizontalMode) {
                swipeHint.classList.add('show-navigation');
            } else {
                swipeHint.classList.remove('show-navigation');
            }
        }
        
        if (!wasInHorizontal && this.inHorizontalMode) {
            this.currentIndex = 0;
            this.transitionToHorizontal(0);
        } else if (wasInHorizontal && !this.inHorizontalMode) {
            this.currentIndex = 0;
            this.updateInterface();
        }
    }
    
    handleWheel(e) {
        if (!this.inHorizontalMode || this.isTransitioning || window.innerWidth <= 768) return;
        
        const deltaX = Math.abs(e.deltaX);
        const deltaY = Math.abs(e.deltaY);
        
        if (deltaX > deltaY && deltaX > 30) {
            e.preventDefault();
        
            if (e.deltaX > 0) {
                this.goToNext();
            } else {
                this.goToPrevious();
            }
        } else if (deltaY > 30) {
            e.preventDefault();
            
            if (e.deltaY > 0) {
                this.goToNext();
            } else {
                this.goToPrevious();
            }
        }
    }
    
    handleTouchStart(e) {
        if (!this.inHorizontalMode) return;
        
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
    }
    
    handleTouchMove(e) {
        if (!this.inHorizontalMode || window.innerWidth <= 768) return;
        
        const deltaX = Math.abs(this.touchStartX - e.touches[0].clientX);
        const deltaY = Math.abs(this.touchStartY - e.touches[0].clientY);
        
        if (deltaX > deltaY) {
            e.preventDefault();
        }
    }
    
    handleTouchEnd(e) {
        if (!this.inHorizontalMode) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const deltaX = this.touchStartX - touchEndX;
        const deltaY = Math.abs(this.touchStartY - e.changedTouches[0].clientY);
        
        if (Math.abs(deltaX) > this.threshold && Math.abs(deltaX) > deltaY) {
            if (deltaX > 0) {
                this.goToNext();
            } else {
                this.goToPrevious();
            }
        }
    }
    
    handleKeyDown(e) {
        if (!this.inHorizontalMode || this.isTransitioning || window.innerWidth <= 768) return;
        
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            this.goToPrevious();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            this.goToNext();
        }
    }
    
    goToNext() {
        if (this.currentIndex < this.totalHorizontalSections - 1) {
            this.currentIndex++;
            this.transitionToHorizontal(this.currentIndex);
        }
    }
    
    goToPrevious() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.transitionToHorizontal(this.currentIndex);
        }
    }
    
    transitionToHorizontal(index) {
        if (this.isTransitioning) return;
        
        if (window.innerWidth <= 768) {
            this.currentIndex = index;
            this.updateInterface();
            return;
        }
        
        this.isTransitioning = true;
        this.currentIndex = index;
        
        const translateX = -index * 100;
        this.wrapper.style.transform = `translateX(${translateX}vw)`;
        
        setTimeout(() => {
            this.isTransitioning = false;
            this.updateInterface();
        }, 800);
    }
    
    updateInterface() {
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
        
        if (currentSection === 'carousel') {
            this.initCarousel();
        }
    }
    
    initCarousel() {
        if (!this.carouselInstance) {
            this.carouselInstance = new CarouselSection();
        }
        this.carouselInstance.onSectionVisible();
    }
    
    goToHorizontalSection(index) {
        if (index >= 0 && index < this.totalHorizontalSections) {
            this.transitionToHorizontal(index);
        }
    }
    
    handleResize() {
        this.isTransitioning = false;
        this.checkPosition();
        
        if (window.innerWidth <= 768) {
            this.wrapper.style.transform = 'translateX(0)';
        } else {
            this.transitionToHorizontal(this.currentIndex);
        }
    }
}



window.LandingNavigation = LandingNavigation;

document.addEventListener('DOMContentLoaded', function() {
    window.landingNav = new LandingNavigation();
});