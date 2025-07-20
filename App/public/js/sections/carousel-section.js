class CarouselSection {
    constructor() {
        this.currentPage = -1;
        this.totalPages = 3;
        this.isAnimating = false;
        this.isMobile = window.innerWidth <= 768;
        
        this.init();
        this.handleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.handleResize);
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
                } else if (!leftSide && this.currentPage < this.totalPages - 1) {
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
        if (this.isAnimating || this.currentPage >= this.totalPages - 1) return;
        this.flipPageTo(this.currentPage + 1);
    }
    
    flipPageTo(targetPage) {
        if (this.isAnimating || targetPage < -1 || targetPage > this.totalPages - 1 || targetPage === this.currentPage) return;
        this.isAnimating = true;
        const currentPageEl = this.getPageByNumber(this.currentPage);
        const targetPageEl = this.getPageByNumber(targetPage);
        const direction = targetPage > this.currentPage ? 'forward' : 'backward';
        const animationDuration = this.isMobile ? 400 : 600;
        
        if (direction === 'forward' && currentPageEl) {
            currentPageEl.style.zIndex = '25';
            currentPageEl.style.willChange = 'transform';
            currentPageEl.classList.add('flipping-forward');
        } else if (direction === 'backward' && targetPageEl) {
            targetPageEl.style.zIndex = '25';
            targetPageEl.style.willChange = 'transform';
            targetPageEl.style.opacity = '1';
            targetPageEl.style.pointerEvents = 'auto';
            targetPageEl.classList.add('flipping-backward');
        }
        
        if (direction === 'forward' && targetPageEl) {
            targetPageEl.style.opacity = '1';
            targetPageEl.style.pointerEvents = 'auto';
        }
        
        setTimeout(() => {
            this.currentPage = targetPage;
            this.updatePageStates();
            if (currentPageEl) currentPageEl.style.willChange = '';
            if (targetPageEl) targetPageEl.style.willChange = '';
            this.isAnimating = false;
        }, animationDuration);
    }
    
    updatePageStates() {
        this.pages.forEach((page) => {
            const pageNumber = this.getPageNumber(page);
            page.classList.remove('active', 'behind', 'flipping-forward', 'flipping-backward');
            page.style.zIndex = '';
            
            if (pageNumber === this.currentPage) {
                page.classList.add('active');
                page.style.zIndex = '10';
                page.style.transform = 'rotateY(0deg)';
            } else if (pageNumber < this.currentPage) {
                page.classList.add('behind');
                page.style.zIndex = '5';
                page.style.transform = 'rotateY(-180deg)';
            } else {
                page.style.zIndex = '1';
                page.style.transform = 'rotateY(0deg)';
                page.style.opacity = '0';
                page.style.pointerEvents = 'none';
            }
        });
        
        const activePage = this.getPageByNumber(this.currentPage);
        if (activePage) {
            activePage.style.opacity = '1';
            activePage.style.pointerEvents = 'auto';
        }
    }
    
    onSectionVisible() {
        
    }
    
    handleResize() {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth <= 768;
        
        if (wasMobile !== this.isMobile) {
            this.updatePageStates();
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    window.carouselSection = new CarouselSection();
});

window.CarouselSection = CarouselSection; 