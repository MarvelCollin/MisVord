document.addEventListener('DOMContentLoaded', function() {
    console.log('Debug Assets Script Loaded');
    
    const styles = Array.from(document.styleSheets);
    console.log('CSS Files Loaded:', styles.length);
    
    styles.forEach(style => {
        try {
            const href = style.href;
            if (href) {
                console.log('CSS:', href);
                if (href.includes('feature-cards.css')) {
                    console.log('FEATURE CARDS CSS FOUND!');
                }
            } else {
                console.log('Inline style or CORS protected CSS');
            }
        } catch (e) {
            console.log('Error checking stylesheet:', e);
        }
    });

    const scripts = Array.from(document.scripts);
    console.log('JS Files Loaded:', scripts.length);
    scripts.forEach(script => {
        const src = script.src;
        if (src) {
            console.log('JS:', src);
            if (src.includes('parallax-scroll.js')) {
                console.log('PARALLAX SCROLL JS FOUND!');
            }
        }
    });

    checkFeatureCardsSection();
});

function checkFeatureCardsSection() {
    const featureCardsSection = document.getElementById('feature-cards-section');
    if (!featureCardsSection) {
        console.error('Feature Cards Section not found in DOM!');
        return;
    }
    
    console.log('Feature Cards Section found in DOM');
    
    const featureCards = featureCardsSection.querySelectorAll('.feature-card');
    console.log('Feature Cards found:', featureCards.length);
    
    if (featureCards.length === 0) {
        console.error('No feature cards found!');
    } else {
        console.log('Feature cards styles:');
        featureCards.forEach((card, i) => {
            const computedStyle = window.getComputedStyle(card);
            console.log(`Card ${i+1} opacity:`, computedStyle.opacity);
            console.log(`Card ${i+1} transform:`, computedStyle.transform);
            console.log(`Card ${i+1} display:`, computedStyle.display);
            console.log(`Card ${i+1} visibility:`, computedStyle.visibility);
            console.log(`Card ${i+1} position:`, computedStyle.position);
        });
    }
} 