class CarouselSection {
    constructor() {
        this.currentPage = -1;
        this.totalPages = 4;
        this.isAnimating = false;
        
        this.init();
    }
    
    init() {
        this.bookContent = document.getElementById('bookContent');
        this.pages = document.querySelectorAll('.page');
        
        if (!this.bookContent) return;
        
        this.setupEventListeners();
        this.updatePageStates();
    }
    
    setupEventListeners() {
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
                
                const pageNumber = this.getPageNumber(page);
                const isBehind = page.classList.contains('behind');
                const isActive = page.classList.contains('active');
                
                if (isBehind) {
                    this.flipPageTo(pageNumber);
                    return;
                }
                
                if (!isActive) return;
                
                const rect = page.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const pageWidth = rect.width;
                const leftSide = clickX < pageWidth / 2;
                
                if (leftSide && this.currentPage > -1) {
                    this.flipPageTo(this.currentPage - 1);
                } else if (!leftSide && this.currentPage < 2) {
                    this.flipPageTo(this.currentPage + 1);
                }
            });
        });
    }
    
    getPageNumber(page) {
        const dataPage = page.getAttribute('data-page');
        if (dataPage === 'cover') return -1;
        return parseInt(dataPage);
    }
    
    getPageByNumber(pageNumber) {
        return Array.from(this.pages).find(page => this.getPageNumber(page) === pageNumber);
    }
    
    isBookActive() {
        const carouselSection = document.querySelector('.carousel-section');
        return carouselSection && carouselSection.classList.contains('is-active');
    }
    
    prevPage() {
        if (this.isAnimating || this.currentPage <= -1) return;
        this.flipPageTo(this.currentPage - 1);
    }
    
    nextPage() {
        if (this.isAnimating || this.currentPage >= 2) return;
        this.flipPageTo(this.currentPage + 1);
    }
    
    flipPageTo(targetPage) {
        if (this.isAnimating || targetPage < -1 || targetPage > 2 || targetPage === this.currentPage) return;
        
        this.isAnimating = true;
        const currentPageEl = this.getPageByNumber(this.currentPage);
        const targetPageEl = this.getPageByNumber(targetPage);
        const direction = targetPage > this.currentPage ? 'forward' : 'backward';
        
        if (direction === 'forward') {
            currentPageEl.style.zIndex = '25';
            currentPageEl.classList.add('flipping-forward');
            
            setTimeout(() => {
                this.currentPage = targetPage;
                this.finishFlipAnimation();
            }, 800);
        } else {
            targetPageEl.style.zIndex = '25';
            targetPageEl.classList.add('flipping-backward');
            
            setTimeout(() => {
                this.currentPage = targetPage;
                this.finishFlipAnimation();
            }, 800);
        }
    }
    
    finishFlipAnimation() {
        this.pages.forEach((page) => {
            const pageNumber = this.getPageNumber(page);
            page.classList.remove('active', 'behind', 'flipping-forward', 'flipping-backward');
            page.style.zIndex = '';
            
            if (pageNumber === this.currentPage) {
                page.classList.add('active');
            } else if (pageNumber < this.currentPage) {
                page.classList.add('behind');
            }
        });
        
        this.isAnimating = false;
    }
    
    updatePageStates() {
        this.pages.forEach((page) => {
            const pageNumber = this.getPageNumber(page);
            page.classList.remove('active', 'behind', 'flipping-forward', 'flipping-backward');
            page.style.zIndex = '';
            
            if (pageNumber === this.currentPage) {
                page.classList.add('active');
            } else if (pageNumber < this.currentPage) {
                page.classList.add('behind');
            }
        });
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
}

document.addEventListener('DOMContentLoaded', function() {
    window.carouselSection = new CarouselSection();
});

window.CarouselSection = CarouselSection; 