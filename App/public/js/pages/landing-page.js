document.addEventListener('DOMContentLoaded', function() {
    initParallax();
    initScrollTransition();
    handleLandingPageResize();
});

function initParallax() {
    const layers = document.querySelectorAll('.parallax-layer');
    
    // Only enable parallax on desktop/tablet for better performance
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
        // Reset transform on mobile
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

// Enhanced responsive handling for landing page
function handleLandingPageResize() {
    const isMobile = window.innerWidth <= 768;
    
    // Disable certain animations on mobile for better performance
    if (isMobile) {
        const layers = document.querySelectorAll('.parallax-layer');
        layers.forEach(layer => {
            layer.style.transform = 'none';
        });
        
        // Reduce star count on mobile
        const stars = document.querySelectorAll('.star');
        stars.forEach((star, index) => {
            if (index > 30) { // Keep only first 30 stars on mobile
                star.style.display = 'none';
            }
        });
    } else {
        // Re-enable animations on desktop
        const stars = document.querySelectorAll('.star');
        stars.forEach(star => {
            star.style.display = 'block';
        });
    }
}

// Add resize listener for landing page
window.addEventListener('resize', debounce(handleLandingPageResize, 150));

// Debounce function for performance
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
