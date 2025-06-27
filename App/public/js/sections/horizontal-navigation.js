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
        
        this.inHorizontalSection = heroRect.bottom <= 100 && wrapperRect.top <= 100 && wrapperRect.bottom >= 100;
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

document.addEventListener('DOMContentLoaded', function() {
    window.horizontalNavigation = new HorizontalNavigation();
});

window.HorizontalNavigation = HorizontalNavigation; 