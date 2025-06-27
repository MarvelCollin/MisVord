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
            this.carouselInstance = new SimpleBookHandler();
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

class SimpleBookHandler {
    constructor() {
        this.currentPage = 0;
        this.totalPages = 3;
        this.isBookOpen = false;
        this.isFlipping = false;
        
        this.init();
    }
    
    init() {
        this.bookCover = document.getElementById('bookCover');
        this.bookContent = document.getElementById('bookContent');
        this.bookNav = document.getElementById('bookNav');
        this.pages = document.querySelectorAll('.page');
        this.prevBtn = document.getElementById('prevPage');
        this.nextBtn = document.getElementById('nextPage');
        this.pageIndicator = document.getElementById('pageIndicator');
        
        console.log('Book elements found:', {
            cover: !!this.bookCover,
            content: !!this.bookContent,
            nav: !!this.bookNav,
            pages: this.pages.length,
            prevBtn: !!this.prevBtn,
            nextBtn: !!this.nextBtn,
            indicator: !!this.pageIndicator
        });
        
        if (!this.bookCover) return;
        
        this.setupEventListeners();
        this.updatePage();
    }
    
    setupEventListeners() {
        this.bookCover?.addEventListener('click', () => this.openBook());
        
        this.prevBtn?.addEventListener('click', () => this.prevPage());
        this.nextBtn?.addEventListener('click', () => this.nextPage());
        
        document.addEventListener('keydown', (e) => {
            if (this.isBookOpen && this.isCarouselSectionActive()) {
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    this.prevPage();
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    this.nextPage();
                }
            }
        });
    }
    
    isCarouselSectionActive() {
        const carouselSection = document.querySelector('.carousel-section');
        return carouselSection && carouselSection.classList.contains('is-active');
    }
    
    openBook() {
        if (!this.isBookOpen) {
            this.isBookOpen = true;
            this.bookCover.classList.add('opened');
            
            // Show the book content after cover animation
            setTimeout(() => {
                if (this.bookContent) {
                    this.bookContent.style.opacity = '1';
                    this.bookContent.style.visibility = 'visible';
                    this.bookContent.style.zIndex = '1';
                }
                if (this.bookNav) {
                    this.bookNav.style.opacity = '1';
                    this.bookNav.style.visibility = 'visible';
                }
                
                // Ensure pages are positioned correctly
                this.pages.forEach((page, index) => {
                    page.style.top = '0';
                    page.style.left = '0';
                });
                
                this.updatePage(); // Ensure first page is visible
            }, 800);
        }
    }
    
    prevPage() {
        if (this.currentPage > 0 && !this.isFlipping) {
            this.flipPageBackward();
        }
    }
    
    nextPage() {
        if (this.currentPage < this.totalPages - 1 && !this.isFlipping) {
            this.flipPageForward();
        }
    }
    
    flipPageForward() {
        if (this.isFlipping) return;
        
        this.isFlipping = true;
        const currentPageEl = this.pages[this.currentPage];
        
        // Start flip animation
        currentPageEl.style.zIndex = '20';
        currentPageEl.classList.add('flipping-forward');
        
        // Update page number
        this.currentPage++;
        
        // After animation completes
        setTimeout(() => {
            currentPageEl.classList.remove('flipping-forward');
            currentPageEl.classList.add('behind');
            this.updatePage();
            this.isFlipping = false;
        }, 800);
    }
    
    flipPageBackward() {
        if (this.isFlipping) return;
        
        this.isFlipping = true;
        this.currentPage--;
        const newPageEl = this.pages[this.currentPage];
        
        // Start flip animation
        newPageEl.style.zIndex = '20';
        newPageEl.classList.remove('behind');
        newPageEl.classList.add('flipping-backward');
        
        // After animation completes
        setTimeout(() => {
            newPageEl.classList.remove('flipping-backward');
            this.updatePage();
            this.isFlipping = false;
        }, 800);
    }
    
    updatePage() {
        console.log('Updating page to:', this.currentPage);
        console.log('Total pages found:', this.pages.length);
        
        this.pages.forEach((page, index) => {
            // Remove all classes first
            page.classList.remove('active', 'behind', 'flipping-forward', 'flipping-backward');
            
            if (index === this.currentPage) {
                page.classList.add('active');
                page.style.zIndex = '10';
                console.log('Activated page:', index);
            } else if (index < this.currentPage) {
                page.classList.add('behind');
                page.style.zIndex = '2';
            } else {
                page.style.zIndex = '8';
            }
        });
        
        if (this.pageIndicator) {
            this.pageIndicator.textContent = `${this.currentPage + 1} / ${this.totalPages}`;
        }
        
        if (this.prevBtn) {
            this.prevBtn.disabled = this.currentPage === 0;
        }
        
        if (this.nextBtn) {
            this.nextBtn.disabled = this.currentPage === this.totalPages - 1;
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
            this.openBook();
        }, 1000);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    window.horizontalNavigation = new HorizontalNavigation();
});

window.HorizontalNavigation = HorizontalNavigation;
window.SimpleBookHandler = SimpleBookHandler; 