class CarouselSection {
    constructor() {
        this.currentPage = 0;
        this.totalPages = 4;
        this.isAnimating = false;
        
        this.init();
    }
    
    init() {
        this.bookContent = document.getElementById('bookContent');
        this.bookNav = document.getElementById('bookNav');
        this.pages = document.querySelectorAll('.page');
        this.prevBtn = document.getElementById('prevPage');
        this.nextBtn = document.getElementById('nextPage');
        this.pageIndicator = document.getElementById('pageIndicator');
        
        if (!this.bookContent) return;
        
        this.initializePages();
        this.setupEventListeners();
        this.updatePageIndicator();
        this.showNavigation();
    }
    
    initializePages() {
        this.pages.forEach((page, index) => {
            page.classList.remove('active', 'behind', 'flipping-forward', 'flipping-backward');
            page.style.zIndex = '';
            page.style.opacity = '1';
            page.style.visibility = 'visible';
            
            if (index === this.currentPage) {
                page.classList.add('active');
            } else if (index < this.currentPage) {
                page.classList.add('behind');
            }
        });
    }
    
    setupEventListeners() {
        this.prevBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.prevPage();
        });
        
        this.nextBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.nextPage();
        });
        
        document.addEventListener('carouselVisible', () => {
            this.onSectionVisible();
        });
        
        document.addEventListener('keydown', (e) => {
            if (this.isBookActive()) {
                if (e.key === 'ArrowLeft') {
                    e.stopPropagation();
                    this.prevPage();
                } else if (e.key === 'ArrowRight') {
                    e.stopPropagation();
                    this.nextPage();
                }
            }
        });
        
        this.pages.forEach((page, index) => {
            page.addEventListener('click', (e) => {
                if (this.isAnimating) return;
                
                const isBehind = page.classList.contains('behind');
                const isActive = page.classList.contains('active');
                
                if (isBehind) {
                    this.flipPageTo(index);
                    return;
                }
                
                if (!isActive) return;
                
                const rect = page.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const pageWidth = rect.width;
                const leftSide = clickX < pageWidth / 2;
                
                if (leftSide && this.currentPage > 0) {
                    this.flipPageTo(this.currentPage - 1);
                } else if (!leftSide && this.currentPage < this.totalPages - 1) {
                    this.flipPageTo(this.currentPage + 1);
                }
            });
        });
    }
    
    isBookActive() {
        const carouselSection = document.querySelector('.carousel-section');
        return carouselSection && carouselSection.classList.contains('is-active');
    }
    
    showNavigation() {
        this.bookNav.style.opacity = '1';
        this.bookNav.style.visibility = 'visible';
    }
    
    prevPage() {
        if (this.isAnimating || this.currentPage <= 0) return;
        this.flipPageTo(this.currentPage - 1);
    }
    
    nextPage() {
        if (this.isAnimating || this.currentPage >= this.totalPages - 1) return;
        this.flipPageTo(this.currentPage + 1);
    }
    
    flipPageTo(targetPage) {
        if (this.isAnimating || targetPage < 0 || targetPage >= this.totalPages || targetPage === this.currentPage) return;
        
        this.isAnimating = true;
        const currentPageEl = this.pages[this.currentPage];
        const targetPageEl = this.pages[targetPage];
        const direction = targetPage > this.currentPage ? 'forward' : 'backward';
        
        if (direction === 'forward') {
            targetPageEl.style.opacity = '0';
            targetPageEl.style.visibility = 'hidden';
            
            currentPageEl.style.zIndex = '25';
            currentPageEl.classList.add('flipping-forward');
            
            setTimeout(() => {
                currentPageEl.classList.remove('flipping-forward');
                currentPageEl.classList.remove('active');
                currentPageEl.classList.add('behind');
                currentPageEl.style.zIndex = '';
                
                setTimeout(() => {
                    targetPageEl.style.opacity = '1';
                    targetPageEl.style.visibility = 'visible';
                    targetPageEl.classList.add('active');
                    targetPageEl.classList.remove('behind');
                    targetPageEl.style.zIndex = '';
                    
                    this.currentPage = targetPage;
                    this.updatePageStates();
                    this.updatePageIndicator();
                    this.isAnimating = false;
                }, 50);
            }, 800);
        } else {
            currentPageEl.style.opacity = '0';
            currentPageEl.style.visibility = 'hidden';
            
            targetPageEl.style.zIndex = '25';
            targetPageEl.classList.add('flipping-backward');
            
            setTimeout(() => {
                targetPageEl.classList.remove('flipping-backward');
                targetPageEl.classList.remove('behind');
                targetPageEl.classList.add('active');
                targetPageEl.style.zIndex = '';
                
                setTimeout(() => {
                    currentPageEl.style.opacity = '1';
                    currentPageEl.style.visibility = 'visible';
                    currentPageEl.classList.remove('active');
                    currentPageEl.classList.add('behind');
                    currentPageEl.style.zIndex = '';
                    
                    this.currentPage = targetPage;
                    this.updatePageStates();
                    this.updatePageIndicator();
                    this.isAnimating = false;
                }, 50);
            }, 800);
        }
    }
    
    updatePageStates() {
        this.pages.forEach((page, index) => {
            page.classList.remove('active', 'behind', 'flipping-forward', 'flipping-backward');
            page.style.zIndex = '';
            page.style.opacity = '1';
            page.style.visibility = 'visible';
            
            if (index === this.currentPage) {
                page.classList.add('active');
            } else if (index < this.currentPage) {
                page.classList.add('behind');
            }
        });
    }
    
    updatePageIndicator() {
        if (this.pageIndicator) {
            this.pageIndicator.textContent = `${this.currentPage + 1} / ${this.totalPages}`;
        }
        
        if (this.prevBtn) {
            this.prevBtn.disabled = this.currentPage <= 0;
        }
        
        if (this.nextBtn) {
            this.nextBtn.disabled = this.currentPage >= this.totalPages - 1;
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
            this.animateBookAppearance();
        }, 800);
    }
    
    animateBookAppearance() {
        if (this.bookContent) {
            this.bookContent.style.transform = 'scale(0.8) rotateX(20deg)';
            this.bookContent.style.opacity = '0';
            
            setTimeout(() => {
                this.bookContent.style.transition = 'all 1s cubic-bezier(0.23, 1, 0.32, 1)';
                this.bookContent.style.transform = 'scale(1) rotateX(0deg)';
                this.bookContent.style.opacity = '1';
            }, 100);
        }
    }
    
    destroy() {
        
    }
}

document.addEventListener('DOMContentLoaded', function() {
    window.carouselSection = new CarouselSection();
});

window.CarouselSection = CarouselSection; 