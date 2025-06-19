<?php
require_once __DIR__ . '/../config/helpers.php';

echo "CSS URL: " . css('global') . "\n";
echo "CSS URL featured-cards: " . css('featured-cards') . "\n";
echo "JS URL: " . js('pages/landing-page') . "\n";
echo "Base URL: " . getBaseUrl() . "\n";
?>
