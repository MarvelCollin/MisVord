console.log('🚀 Scripts loading started');

document.addEventListener('DOMContentLoaded', function() {
    document.body.classList.add('page-loaded');
    
    console.log('📦 Available modules check:');
    console.log('- LazyLoader:', typeof window.LazyLoader);
    console.log('- showToast:', typeof window.showToast);
    console.log('- MisVordAjax:', typeof window.MisVordAjax);
    
    function handleLazyLoaderReady() {
        console.log('✅ LazyLoader is available globally');
        
        const lazyElements = document.querySelectorAll('[data-lazyload]');
        console.log(`Found ${lazyElements.length} elements with data-lazyload attribute:`, 
            Array.from(lazyElements).map(el => ({
                type: el.getAttribute('data-lazyload'),
                hasSkeletonChild: !!el.querySelector('.skeleton-loader'),
                isLoading: el.classList.contains('content-loading')
            }))
        );
    }
    
    if (window.LazyLoader) {
        handleLazyLoaderReady();
    } else {
        window.addEventListener('MainModulesReady', function(event) {
            console.log('MainModulesReady event received', event.detail);
            handleLazyLoaderReady();
        });
        
        setTimeout(function() {
            if (window.LazyLoader) {
                console.log('✅ LazyLoader is available globally (fallback check)');
                handleLazyLoaderReady();
            } else {
                console.error('❌ LazyLoader is NOT available globally - skeleton loading will not work');
                console.log('Available global objects:', Object.keys(window).filter(key => key.includes('Lazy') || key.includes('Ajax')));
            }
        }, 2000);
    }
}); 