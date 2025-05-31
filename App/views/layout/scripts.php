<?php
/**
 * Script inclusion helper
 * This file helps with properly including JavaScript files with module support
 */

// Check if additional_js is defined
$additional_js = $additional_js ?? [];

// Filter out socket.io.min.js from additional_js if it's there, as we'll load it separately
$additional_js = array_filter($additional_js, function($script) {
    return $script !== 'socket.io.min.js';
});

// Define base/core scripts that should be loaded on every page
$core_scripts = ['core/toast', 'core/ajax-handler'];
?>

<!-- Vendor JS -->
<!-- Load Socket.IO first as non-module script to ensure it's available globally -->
<script src="<?php echo js('socket.io.min'); ?>?v=<?php echo time(); ?>"></script>

<!-- Core scripts -->
<script src="<?php echo js('main'); ?>?v=<?php echo time(); ?>" type="module"></script>

<!-- Page specific scripts -->
<?php foreach($additional_js as $script): ?>
    <script src="<?php echo js(rtrim($script, '.js')); ?>?v=<?php echo time(); ?>" type="module"></script>
<?php endforeach; ?>

<!-- Include any non-module scripts that need to be loaded synchronously -->
<script>
    // Add any non-module scripts or inline code here
    document.addEventListener('DOMContentLoaded', function() {
        // Make body visible when everything is loaded
        document.body.classList.add('page-loaded');
        
        // Listen for LazyLoader ready event
        function handleLazyLoaderReady() {
            console.log('✅ LazyLoader is available globally');
            
            // Log all lazy-loaded elements
            const lazyElements = document.querySelectorAll('[data-lazyload]');
            console.log(`Found ${lazyElements.length} elements with data-lazyload attribute:`, 
                Array.from(lazyElements).map(el => ({
                    type: el.getAttribute('data-lazyload'),
                    hasSkeletonChild: !!el.querySelector('.skeleton-loader'),
                    isLoading: el.classList.contains('content-loading')
                }))
            );
        }
        
        // Check if LazyLoader is already available
        if (window.LazyLoader) {
            handleLazyLoaderReady();
        } else {
            // Listen for the LazyLoader ready event
            window.addEventListener('MainModulesReady', function(event) {
                console.log('MainModulesReady event received');
                handleLazyLoaderReady();
            });
            
            // Fallback timeout in case events don't fire
            setTimeout(function() {
                if (window.LazyLoader) {
                    console.log('✅ LazyLoader is available globally (fallback check)');
                    handleLazyLoaderReady();
                } else {
                    console.error('❌ LazyLoader is NOT available globally - skeleton loading will not work');
                    console.log('Available global objects:', Object.keys(window).filter(key => key.includes('Lazy') || key.includes('Ajax')));
                }
            }, 2000); // Increased timeout as final fallback
        }
    });
</script>