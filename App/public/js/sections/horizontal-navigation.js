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
        this.pageIndicator = document.getElementById('pageIndicator');
        
        console.log('Book elements found:', {
            cover: !!this.bookCover,
            content: !!this.bookContent,
            nav: !!this.bookNav,
            pages: this.pages.length,
            indicator: !!this.pageIndicator
        });
        
        if (!this.bookCover) return;
        
        // Apply hardware acceleration to all elements
        const applyHardwareAcceleration = (element) => {
            element.style.willChange = 'transform';
            element.style.transform = 'translateZ(0)';
        };
        
        // Ensure cover has highest z-index initially
        if (this.bookCover) {
            this.bookCover.style.zIndex = '100';
            this.bookCover.style.transform = 'rotateY(0deg) translateZ(0)';
            this.bookCover.style.transformOrigin = 'left center';
            this.bookCover.style.backfaceVisibility = 'visible';
            this.bookCover.style.cursor = 'pointer';
            this.bookCover.style.transition = 'transform 0.8s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.3s ease';
            applyHardwareAcceleration(this.bookCover);
        }
        
        // Make book content visible immediately but behind cover
        if (this.bookContent) {
            this.bookContent.style.opacity = '1';
            this.bookContent.style.visibility = 'visible';
            this.bookContent.style.zIndex = '10';
            applyHardwareAcceleration(this.bookContent);
        }
        
        // Initialize all pages immediately
        this.pages.forEach((page, index) => {
            page.style.opacity = '1';
            page.style.visibility = 'visible';
            page.style.top = '0';
            page.style.left = '0';
            page.style.transition = 'transform 0.8s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.3s ease';
            page.style.transformOrigin = 'left center';
            page.style.backfaceVisibility = 'visible';
            page.style.cursor = 'pointer';
            applyHardwareAcceleration(page);
            
            if (index === 0) {
                page.style.transform = 'rotateY(0deg) translateZ(0)';
                page.style.zIndex = '20';
                page.style.boxShadow = '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 0 30px rgba(102, 126, 234, 0.3)';
            } else {
                page.style.transform = 'rotateY(0deg) translateZ(0)';
                page.style.zIndex = this.totalPages - index + 3;
            }
        });
        
        this.setupEventListeners();
        this.updatePage();
    }
    
    setupEventListeners() {
        this.bookCover?.addEventListener('click', () => {
            if (!this.isBookOpen) {
                this.openBook();
            } else {
                this.closeBook();
            }
        });
        
        // Add click events to pages
        this.pages.forEach((page, index) => {
            // Left side click - go to previous page
            page.addEventListener('click', (e) => {
                const pageRect = page.getBoundingClientRect();
                const clickX = e.clientX - pageRect.left;
                
                if (this.isBookOpen) {
                    if (clickX < pageRect.width / 2) {
                        // Left side click
                        this.prevPage();
                    } else {
                        // Right side click
                        this.nextPage();
                    }
                }
            });
        });
        
        document.addEventListener('keydown', (e) => {
            if (this.isCarouselSectionActive()) {
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    if (this.isBookOpen) {
                        this.prevPage();
                    }
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    if (this.isBookOpen) {
                        this.nextPage();
                    } else {
                        this.openBook();
                    }
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    if (this.isBookOpen) {
                        this.closeBook();
                    }
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
            
            this.bookCover.style.zIndex = '80';
            this.bookCover.style.transition = 'transform 0.8s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.3s ease';
            this.bookCover.style.transformOrigin = 'left center';
            this.bookCover.style.backfaceVisibility = 'visible';
            this.bookCover.style.boxShadow = '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 30px rgba(102, 126, 234, 0.3)';
            
            // Use requestAnimationFrame for smoother animation
            requestAnimationFrame(() => {
                this.bookCover.style.transform = 'rotateY(-180deg) translateZ(0)';
            });
            
            setTimeout(() => {
                this.bookCover.style.zIndex = '5';
                this.bookCover.style.pointerEvents = 'auto';
                
                if (this.bookContent) {
                    this.bookContent.style.opacity = '1';
                    this.bookContent.style.visibility = 'visible';
                    this.bookContent.style.zIndex = '50';
                }
                
                if (this.bookNav) {
                    this.bookNav.style.opacity = '1';
                    this.bookNav.style.visibility = 'visible';
                }
                
                // Batch DOM operations
                const pageUpdates = document.createDocumentFragment();
                this.pages.forEach((page, index) => {
                    page.style.top = '0';
                    page.style.left = '0';
                    page.style.transition = 'transform 0.8s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.3s ease';
                    page.style.transformOrigin = 'left center';
                    page.style.backfaceVisibility = 'visible';
                    page.style.opacity = '1';
                    page.style.visibility = 'visible';
                    
                    if (index === 0) {
                        page.style.transform = 'rotateY(0deg) translateZ(0)';
                        page.style.zIndex = '60';
                        page.style.boxShadow = '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 0 30px rgba(102, 126, 234, 0.3)';
                    } else {
                        page.style.transform = 'rotateY(0deg) translateZ(0)';
                        page.style.zIndex = 59 - index;
                    }
                });
                
                this.updatePage();
            }, 800);
        }
    }
    
    closeBook() {
        if (this.isBookOpen) {
            // Reset all pages without hiding them
            this.pages.forEach((page, index) => {
                page.style.transition = 'transform 0.8s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.3s ease';
                page.style.transform = 'rotateY(0deg) translateZ(0)';
                page.style.zIndex = this.totalPages - index + 3;
                page.style.opacity = '1';
                page.style.visibility = 'visible';
            });
            
            // Reset current page
            this.currentPage = 0;
            
            // Animate the cover back to closed position
            this.bookCover.style.zIndex = '80';
            this.bookCover.style.transition = 'transform 0.8s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.3s ease';
            this.bookCover.style.transformOrigin = 'left center';
            this.bookCover.style.backfaceVisibility = 'visible';
            this.bookCover.style.boxShadow = '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 30px rgba(102, 126, 234, 0.3)';
            this.bookCover.style.pointerEvents = 'auto';
            
            // Use requestAnimationFrame for smoother animation
            requestAnimationFrame(() => {
                this.bookCover.style.transform = 'rotateY(0deg) translateZ(0)';
            });
            
            // Keep book content visible
            if (this.bookContent) {
                this.bookContent.style.opacity = '1';
                this.bookContent.style.visibility = 'visible';
            }
            
            // Keep navigation visible
            if (this.bookNav) {
                this.bookNav.style.opacity = '1';
                this.bookNav.style.visibility = 'visible';
            }
            
            setTimeout(() => {
                this.bookCover.style.zIndex = '100';
                this.isBookOpen = false;
                
                if (this.pageIndicator) {
                    this.pageIndicator.textContent = `${this.currentPage + 1} / ${this.totalPages}`;
                }
            }, 800);
        }
    }
    
    prevPage() {
        if (this.currentPage > 0 && !this.isFlipping) {
            this.flipPageBackward();
        } else if (this.currentPage === 0 && !this.isFlipping) {
            // If we're on the first page, close the book
            this.closeBook();
        }
    }
    
    nextPage() {
        if (this.currentPage < this.totalPages - 1 && !this.isFlipping) {
            this.flipPageForward();
        } else if (this.currentPage === this.totalPages - 1 && !this.isFlipping) {
            // If we're on the last page, close the book
            this.closeBook();
        }
    }
    
    flipPageForward() {
        if (this.isFlipping) return;
        
        this.isFlipping = true;
        const currentPageEl = this.pages[this.currentPage];
        
        // Set high z-index during animation
        currentPageEl.style.zIndex = '80';
        currentPageEl.style.boxShadow = '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 0 30px rgba(102, 126, 234, 0.3)';
        currentPageEl.style.transition = 'transform 0.8s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.3s ease';
        currentPageEl.style.backfaceVisibility = 'visible';
        
        // Start flip animation with requestAnimationFrame
        requestAnimationFrame(() => {
            currentPageEl.style.transform = 'rotateY(-180deg) translateZ(0)';
        });
        
        // Update page number
        this.currentPage++;
        
        // After animation completes
        setTimeout(() => {
            currentPageEl.style.zIndex = '20';
            this.updatePage();
            this.isFlipping = false;
        }, 800);
    }
    
    flipPageBackward() {
        if (this.isFlipping) return;
        
        this.isFlipping = true;
        this.currentPage--;
        const newPageEl = this.pages[this.currentPage];
        
        // Set high z-index during animation
        newPageEl.style.zIndex = '80';
        newPageEl.style.transform = 'rotateY(-180deg) translateZ(0)';
        newPageEl.style.boxShadow = '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 0 30px rgba(102, 126, 234, 0.3)';
        newPageEl.style.transition = 'transform 0.8s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.3s ease';
        newPageEl.style.backfaceVisibility = 'visible';
        
        // Start flip animation with requestAnimationFrame
        requestAnimationFrame(() => {
            newPageEl.style.transform = 'rotateY(0deg) translateZ(0)';
        });
        
        // After animation completes
        setTimeout(() => {
            newPageEl.style.zIndex = '60';
            this.updatePage();
            this.isFlipping = false;
        }, 800);
    }
    
    updatePage() {
        console.log('Updating page to:', this.currentPage);
        console.log('Total pages found:', this.pages.length);
        
        // Batch DOM operations
        this.pages.forEach((page, index) => {
            page.style.transition = 'transform 0.8s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.3s ease';
            page.style.backfaceVisibility = 'visible';
            page.style.opacity = '1';
            
            if (index === this.currentPage) {
                page.style.transform = 'rotateY(0deg) translateZ(0)';
                page.style.zIndex = '60';
                page.style.boxShadow = '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 0 30px rgba(102, 126, 234, 0.3)';
                console.log('Activated page:', index);
            } else if (index < this.currentPage) {
                page.style.transform = 'rotateY(-180deg) translateZ(0)';
                page.style.zIndex = '20';
                page.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.4)';
            } else {
                page.style.transform = 'rotateY(0deg) translateZ(0)';
                page.style.zIndex = 59 - index;
            }
        });
        
        if (this.pageIndicator) {
            this.pageIndicator.textContent = `${this.currentPage + 1} / ${this.totalPages}`;
        }
    }
    
    onSectionVisible() {
        const title = document.querySelector('.carousel-title');
        const subtitle = document.querySelector('.carousel-subtitle');
        
        this.pages.forEach((page, index) => {
            page.style.opacity = '1';
            page.style.visibility = 'visible';
            page.style.transform = 'rotateY(0deg)';
            page.style.zIndex = index === 0 ? '10' : (this.totalPages - index + 3);
        });
        
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