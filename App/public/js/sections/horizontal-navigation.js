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
            this.carouselInstance = new BookInterface();
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

class BookInterface {
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
        
        if (!this.bookCover) return;
        
        this.setupBookElements();
        this.setupEventListeners();
        this.updatePage();
    }
    
    setupBookElements() {
        const applyAcceleration = (element) => {
            element.style.willChange = 'transform';
            element.style.transform = 'translateZ(0)';
        };
        
        if (this.bookCover) {
            this.bookCover.style.zIndex = '100';
            this.bookCover.style.transform = 'rotateY(0deg) translateZ(0)';
            this.bookCover.style.transformOrigin = 'left center';
            this.bookCover.style.backfaceVisibility = 'visible';
            this.bookCover.style.cursor = 'pointer';
            this.bookCover.style.transition = 'transform 0.8s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.3s ease';
            applyAcceleration(this.bookCover);
        }
        
        if (this.bookContent) {
            this.bookContent.style.opacity = '1';
            this.bookContent.style.visibility = 'visible';
            this.bookContent.style.zIndex = '10';
            applyAcceleration(this.bookContent);
        }
        
        this.pages.forEach((page, index) => {
            page.style.opacity = '1';
            page.style.visibility = 'visible';
            page.style.top = '0';
            page.style.left = '0';
            page.style.transition = 'transform 0.8s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.3s ease';
            page.style.transformOrigin = 'left center';
            page.style.backfaceVisibility = 'visible';
            page.style.cursor = 'pointer';
            applyAcceleration(page);
            
            if (index === 0) {
                page.style.transform = 'rotateY(0deg) translateZ(0)';
                page.style.zIndex = '20';
                page.style.boxShadow = '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 0 30px rgba(102, 126, 234, 0.3)';
            } else {
                page.style.transform = 'rotateY(0deg) translateZ(0)';
                page.style.zIndex = this.totalPages - index + 3;
            }
        });
    }
    
    setupEventListeners() {
        this.bookCover?.addEventListener('click', () => {
            if (!this.isBookOpen) {
                this.openBook();
            } else {
                this.closeBook();
            }
        });
        
        this.pages.forEach((page, index) => {
            page.addEventListener('click', (e) => {
                const pageRect = page.getBoundingClientRect();
                const clickX = e.clientX - pageRect.left;
                
                if (this.isBookOpen) {
                    if (clickX < pageRect.width / 2) {
                        this.prevPage();
                    } else {
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
            this.pages.forEach((page, index) => {
                page.style.transition = 'transform 0.8s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.3s ease';
                page.style.transform = 'rotateY(0deg) translateZ(0)';
                page.style.zIndex = this.totalPages - index + 3;
                page.style.opacity = '1';
                page.style.visibility = 'visible';
            });
            
            this.currentPage = 0;
            
            this.bookCover.style.zIndex = '80';
            this.bookCover.style.transition = 'transform 0.8s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.3s ease';
            this.bookCover.style.transformOrigin = 'left center';
            this.bookCover.style.backfaceVisibility = 'visible';
            this.bookCover.style.boxShadow = '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 30px rgba(102, 126, 234, 0.3)';
            this.bookCover.style.pointerEvents = 'auto';
            
            requestAnimationFrame(() => {
                this.bookCover.style.transform = 'rotateY(0deg) translateZ(0)';
            });
            
            if (this.bookContent) {
                this.bookContent.style.opacity = '1';
                this.bookContent.style.visibility = 'visible';
            }
            
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
            this.closeBook();
        }
    }
    
    nextPage() {
        if (this.currentPage < this.totalPages - 1 && !this.isFlipping) {
            this.flipPageForward();
        } else if (this.currentPage === this.totalPages - 1 && !this.isFlipping) {
            this.closeBook();
        }
    }
    
    flipPageForward() {
        if (this.isFlipping) return;
        
        this.isFlipping = true;
        const currentPageEl = this.pages[this.currentPage];
        
        currentPageEl.style.zIndex = '80';
        currentPageEl.style.boxShadow = '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 0 30px rgba(102, 126, 234, 0.3)';
        currentPageEl.style.transition = 'transform 0.8s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.3s ease';
        currentPageEl.style.backfaceVisibility = 'visible';
        
        requestAnimationFrame(() => {
            currentPageEl.style.transform = 'rotateY(-180deg) translateZ(0)';
        });
        
        setTimeout(() => {
            currentPageEl.style.zIndex = '5';
            this.currentPage++;
            this.isFlipping = false;
            this.updatePage();
        }, 800);
    }
    
    flipPageBackward() {
        if (this.isFlipping) return;
        
        this.isFlipping = true;
        this.currentPage--;
        
        const targetPage = this.pages[this.currentPage];
        
        targetPage.style.zIndex = '80';
        targetPage.style.transform = 'rotateY(-180deg) translateZ(0)';
        
        requestAnimationFrame(() => {
            targetPage.style.transform = 'rotateY(0deg) translateZ(0)';
        });
        
        setTimeout(() => {
            this.isFlipping = false;
            this.updatePage();
        }, 800);
    }
    
    updatePage() {
        this.pages.forEach((page, index) => {
            if (index === this.currentPage && this.isBookOpen) {
                page.style.boxShadow = '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 0 30px rgba(102, 126, 234, 0.3)';
            } else {
                page.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
            }
        });
        
        if (this.pageIndicator) {
            this.pageIndicator.textContent = `${this.currentPage + 1} / ${this.totalPages}`;
        }
    }
    
    onSectionVisible() {
        if (!this.initialized) {
            this.init();
            this.initialized = true;
        }
    }
}

window.LandingNavigation = LandingNavigation;

document.addEventListener('DOMContentLoaded', function() {
    window.landingNav = new LandingNavigation();
});