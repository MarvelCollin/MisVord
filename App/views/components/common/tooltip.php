<?php
function tooltip($content, $text, $position = 'top', $additionalClasses = '') {
    // Simple tooltip that uses only CSS
    return '
    <div class="tooltip-wrapper relative inline-block ' . $additionalClasses . '">
        ' . $content . '
        <span class="tooltip-text absolute z-[9999] bg-black text-white text-xs rounded px-2 py-1 
                    opacity-0 pointer-events-none whitespace-nowrap shadow-lg
                    transition-all duration-150 left-full ml-2 top-1/2 -translate-y-1/2
                    group-hover:opacity-100">
            ' . htmlspecialchars($text) . '
        </span>
    </div>';
}
