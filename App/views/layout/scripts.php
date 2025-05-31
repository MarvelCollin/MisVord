<?php
/**
 * Script inclusion helper
 * This file helps with properly including JavaScript files with module support
 */

// Check if additional_js is defined
$additional_js = $additional_js ?? [];

// Define base/core scripts that should be loaded on every page
$core_scripts = ['core/toast', 'core/ajax-handler'];
?>

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
        
        // Debug lazy loading
        console.log('DOMContentLoaded event fired - checking LazyLoader status');
        setTimeout(function() {
            if (window.LazyLoader) {
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
            } else {
                console.error('❌ LazyLoader is NOT available globally - skeleton loading will not work');
            }
        }, 500);
    });
</script> 