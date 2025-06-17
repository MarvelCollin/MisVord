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
$core_scripts = ['core/toast', 'core/ajax-handler', 'core/global-socket-manager'];
?>

<!-- Vendor JS -->
<!-- Load Socket.IO first as non-module script to ensure it's available globally -->
<script src="<?php echo js('socket.io.min'); ?>?v=<?php echo time(); ?>"></script>

<!-- Socket Status Utility (for debugging and monitoring) -->
<script src="<?php echo js('utils/socket-status'); ?>?v=<?php echo time(); ?>"></script>

<!-- Core scripts (modules) -->
<script src="<?php echo js('main'); ?>?v=<?php echo time(); ?>" type="module"></script>

<!-- Page specific scripts -->
<?php foreach($additional_js as $script): ?>
    <script src="<?php echo js(rtrim($script, '.js')); ?>?v=<?php echo time(); ?>" type="module"></script>
<?php endforeach; ?>

<script>
    document.addEventListener('DOMContentLoaded', function() {
        document.body.classList.add('page-loaded');
        
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
                console.log('MainModulesReady event received');
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
</script>