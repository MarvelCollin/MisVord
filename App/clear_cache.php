<?php
// Clear OpCache
if (function_exists('opcache_reset')) {
    opcache_reset();
    echo "OpCache cleared successfully!\n";
} else {
    echo "OpCache is not enabled.\n";
}

// Clear any file stat cache
clearstatcache();
echo "File stat cache cleared.\n";

echo "All caches cleared. Please restart your web server now.\n";
?>
