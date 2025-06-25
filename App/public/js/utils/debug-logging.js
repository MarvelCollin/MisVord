const safeLog = {
    info: (module, ...args) => {
        if (typeof window.logger !== 'undefined') {
            window.logger.info(module, ...args);
        } else {
            console.log(`[${module.toUpperCase()}]`, ...args);
        }
    },
    debug: (module, ...args) => {
        if (typeof window.logger !== 'undefined') {
            window.logger.debug(module, ...args);
        } else {
            console.log(`[${module.toUpperCase()}]`, ...args);
        }
    },
    error: (module, ...args) => {
        if (typeof window.logger !== 'undefined') {
            window.logger.error(module, ...args);
        } else {
            console.error(`[${module.toUpperCase()}]`, ...args);
        }
    }
};

safeLog.info('general', 'Scripts loading started');

document.addEventListener('DOMContentLoaded', function() {
    document.body.classList.add('page-loaded');
    
    safeLog.debug('general', 'Available modules check:');
    safeLog.debug('general', '- LazyLoader:', typeof window.LazyLoader);
    safeLog.debug('general', '- showToast:', typeof window.showToast);
    safeLog.debug('general', '- globalSocketManager:', typeof window.globalSocketManager);
    
    function handleLazyLoaderReady() {
        safeLog.info('ui', 'LazyLoader is available globally');
        
        const lazyElements = document.querySelectorAll('[data-lazyload]');
        safeLog.debug('ui', `Found ${lazyElements.length} elements with data-lazyload attribute:`, 
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
            safeLog.debug('general', 'MainModulesReady event received', event.detail);
            handleLazyLoaderReady();
        });
        
        setTimeout(function() {
            if (window.LazyLoader) {
                safeLog.info('ui', 'LazyLoader is available globally (fallback check)');
                handleLazyLoaderReady();
            } else {
                safeLog.error('ui', 'LazyLoader is NOT available globally - skeleton loading will not work');
                const relevantGlobals = Object.keys(window).filter(key => 
                    (key.includes('API') || key.includes('Manager') || key.includes('Loader') || 
                     key.includes('Lazy') || key.includes('API')));
                safeLog.debug('ui', 'Available global objects:', relevantGlobals);
            }
        }, 2000);
    }
}); 