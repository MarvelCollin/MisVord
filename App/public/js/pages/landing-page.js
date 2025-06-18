document.addEventListener('DOMContentLoaded', function() {
    initParallax();
    initScrollTransition();
});

function initParallax() {
    const layers = document.querySelectorAll('.parallax-layer');
    
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
