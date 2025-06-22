document.addEventListener('DOMContentLoaded', function() {
    initParallax();
    initScrollTransition();
    handleLandingPageResize();
});

function initParallax() {
    const layers = document.querySelectorAll('.parallax-layer');
    
    if (window.innerWidth > 768) {
        document.addEventListener('mousemove', function(e) {
            const x = e.clientX;
            const y = e.clientY;
            
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            
            const xPercent = x / windowWidth - 0.5;
            const yPercent = y / windowHeight - 0.5;        
            
            layers.forEach(layer => {
                const depth = parseFloat(layer.getAttribute('data-depth'));
                const translateX = xPercent * depth * 100;
                const translateY = yPercent * depth * 100;
                
                layer.style.transform = `translate(${translateX}px, ${translateY}px)`;
            });
        });
    } else {
        layers.forEach(layer => {
            layer.style.transform = 'none';
        });
    }
}

function initScrollTransition() {
    const heroSection = document.querySelector('.hero-section');
    const heroTitle = document.querySelector('.hero-title');
    
    if (!heroSection || !heroTitle) return;
    
    window.addEventListener('scroll', () => {
        const scrollPosition = window.scrollY;
        const opacity = Math.max(0, 1 - (scrollPosition / (window.innerHeight * 0.5)));
        
        heroTitle.style.opacity = opacity;
        
        const translateY = scrollPosition * 0.5;
        heroTitle.style.transform = `translateY(${translateY}px)`;
        
        const layers = document.querySelectorAll('.parallax-layer');
        layers.forEach(layer => {
            const depth = parseFloat(layer.getAttribute('data-depth'));
            const translateY = scrollPosition * depth;
            
            const currentTransform = layer.style.transform;
            if (currentTransform.includes('translate(')) {
                const existingTranslate = currentTransform.match(/translate\(([^)]+)\)/)[1].split(',');
                const existingX = parseFloat(existingTranslate[0]);
                
                layer.style.transform = `translate(${existingX}px, ${translateY}px)`;
            } else {
                layer.style.transform = `translateY(${translateY}px)`;
            }
        });
    });
}

function handleLandingPageResize() {
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        const layers = document.querySelectorAll('.parallax-layer');
        layers.forEach(layer => {
            layer.style.transform = 'none';
        });
        
        const stars = document.querySelectorAll('.star');
        stars.forEach((star, index) => {
            if (index > 30) {
                star.style.display = 'none';
            }
        });
    } else {
        const stars = document.querySelectorAll('.star');
        stars.forEach(star => {
            star.style.display = 'block';
        });
    }
}
        
window.addEventListener('resize', debounce(handleLandingPageResize, 150));

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
