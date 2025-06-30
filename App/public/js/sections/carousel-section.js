class CarouselSection {
    constructor() {
        this.currentPage = 0;
        this.totalPages = 4;
        this.isAnimating = false;
        this.isBookOpen = false;
        
        this.init();
    }
    
    init() {
        this.bookCover = document.getElementById('bookCover');
        this.bookContent = document.getElementById('bookContent');
        this.bookNav = document.getElementById('bookNav');
        this.pages = document.querySelectorAll('.page');
        this.contentPages = document.querySelectorAll('.page:not(.book-cover)');
        this.prevBtn = document.getElementById('prevPage');
        this.nextBtn = document.getElementById('nextPage');
        this.pageIndicator = document.getElementById('pageIndicator');
        
        if (!this.bookCover) return;
        
        this.setupEventListeners();
        this.updatePageIndicator();
    }
    
    setupEventListeners() {
        this.bookCover?.addEventListener('click', () => {
            if (!this.isBookOpen) {
                this.openBook();
            }
        });
        
        this.prevBtn?.addEventListener('click', () => this.prevPage());
        this.nextBtn?.addEventListener('click', () => this.nextPage());
        
        document.addEventListener('carouselVisible', () => {
            this.onSectionVisible();
        });
        
        document.addEventListener('keydown', (e) => {
            if (this.isBookActive()) {
                if (this.isBookOpen) {
                    if (e.key === 'ArrowLeft') {
                        e.stopPropagation();
                        this.prevPage();
                    } else if (e.key === 'ArrowRight') {
                        e.stopPropagation();
                        this.nextPage();
                    } else if (e.key === 'Escape') {
                        e.stopPropagation();
                        this.closeBook();
                    }
                } else {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        this.openBook();
                    }
                }
            }
        });
        
        this.contentPages.forEach((page, index) => {
            page.addEventListener('click', () => {
                if (!this.isBookOpen) return;
                const actualIndex = index + 1;
                if (actualIndex < this.currentPage) {
                    this.prevPage();
                } else if (actualIndex > this.currentPage) {
                    this.nextPage();
                }
            });
        });
    }
    
    isBookActive() {
        const carouselSection = document.querySelector('.carousel-section');
        return carouselSection && carouselSection.classList.contains('is-active');
    }
    
    openBook() {
        if (this.isAnimating || this.isBookOpen) return;
        
        this.isAnimating = true;
        this.isBookOpen = true;
        this.currentPage = 1;
        
        this.bookCover.classList.add('flipping-forward');
        this.bookCover.classList.remove('active');
        
        setTimeout(() => {
            this.bookCover.classList.remove('flipping-forward');
            this.bookCover.classList.add('behind');
            
            this.pages[1].classList.add('active');
            this.pages[1].classList.remove('behind');
            
            this.bookNav.style.opacity = '1';
            this.bookNav.style.visibility = 'visible';
            
            this.updatePages();
            this.updatePageIndicator();
            this.isAnimating = false;
        }, 800);
    }
    
    closeBook() {
        if (this.isAnimating || !this.isBookOpen) return;
        
        this.isAnimating = true;
        this.isBookOpen = false;
        
        this.bookNav.style.opacity = '0';
        this.bookNav.style.visibility = 'hidden';
        
        const currentPageEl = this.pages[this.currentPage];
        currentPageEl.classList.add('flipping-backward');
        currentPageEl.classList.remove('active');
        
        setTimeout(() => {
            this.pages.forEach(page => {
                page.classList.remove('active', 'behind', 'flipping-forward', 'flipping-backward');
            });
            
            this.currentPage = 0;
            this.bookCover.classList.add('active');
            this.updatePageIndicator();
            this.isAnimating = false;
        }, 800);
    }
    
    prevPage() {
        if (this.isAnimating || !this.isBookOpen || this.currentPage <= 1) return;
        
        this.currentPage--;
        this.turnPage('backward');
    }
    
    nextPage() {
        if (this.isAnimating || !this.isBookOpen || this.currentPage >= this.totalPages - 1) return;
        
        this.currentPage++;
        this.turnPage('forward');
    }
    
    turnPage(direction) {
        this.isAnimating = true;
        
        const currentPageEl = this.pages[direction === 'forward' ? this.currentPage - 1 : this.currentPage + 1];
        const targetPageEl = this.pages[this.currentPage];
        
        if (direction === 'forward') {
            currentPageEl.classList.add('flipping-forward');
            currentPageEl.classList.remove('active');
            
            setTimeout(() => {
                currentPageEl.classList.remove('flipping-forward');
                currentPageEl.classList.add('behind');
                targetPageEl.classList.add('active');
                targetPageEl.classList.remove('behind');
                
                this.updatePages();
                this.updatePageIndicator();
                this.isAnimating = false;
            }, 800);
        } else {
            targetPageEl.classList.add('flipping-backward');
            targetPageEl.classList.remove('behind');
            
            setTimeout(() => {
                targetPageEl.classList.remove('flipping-backward');
                targetPageEl.classList.add('active');
                currentPageEl.classList.remove('active');
                currentPageEl.classList.add('behind');
                
                this.updatePages();
                this.updatePageIndicator();
                this.isAnimating = false;
            }, 800);
        }
    }
    
    updatePages() {
        this.pages.forEach((page, index) => {
            page.classList.remove('active', 'behind');
            
            if (index === this.currentPage) {
                page.classList.add('active');
            } else if (index < this.currentPage) {
                page.classList.add('behind');
            }
        });
    }
    
    updatePageIndicator() {
        if (this.pageIndicator) {
            if (this.isBookOpen) {
                this.pageIndicator.textContent = `${this.currentPage} / ${this.totalPages - 1}`;
            } else {
                this.pageIndicator.textContent = `Cover`;
            }
        }
        
        if (this.prevBtn) {
            this.prevBtn.disabled = this.currentPage <= 1;
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
        if (this.bookCover) {
            this.bookCover.style.transform = 'scale(0.8) rotateX(20deg)';
            this.bookCover.style.opacity = '0';
            
            setTimeout(() => {
                this.bookCover.style.transition = 'all 1s cubic-bezier(0.23, 1, 0.32, 1)';
                this.bookCover.style.transform = 'scale(1) rotateX(0deg)';
                this.bookCover.style.opacity = '1';
            }, 100);
        }
    }
    
    destroy() {
        if (this.isBookOpen) {
            this.closeBook();
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    window.carouselSection = new CarouselSection();
});

window.CarouselSection = CarouselSection; 