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
    });
</script> 