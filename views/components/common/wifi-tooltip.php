<?php
require_once __DIR__ . '/tooltip.php';

function wifi_icon_with_tooltip($classes = '') {
    $iconHtml = '<i class="fas fa-wifi wifi-strength-icon ' . $classes . '"></i>';
    
    return '<div class="wifi-tooltip-wrapper relative inline-flex">' . $iconHtml . '</div>';
}
?> 