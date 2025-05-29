<?php
function tooltip($content, $text, $position = 'right', $additionalClasses = '') {
    $positionClasses = [
        'right' => 'left-full ml-3 top-1/2 -translate-y-1/2',
        'left' => 'right-full mr-3 top-1/2 -translate-y-1/2',
        'top' => 'bottom-full mb-3 left-1/2 -translate-x-1/2',
        'bottom' => 'top-full mt-3 left-1/2 -translate-x-1/2'
    ];
    
    $arrowClasses = [
        'right' => 'right-full top-1/2 -translate-y-1/2 border-r-gray-800 border-r-8 border-y-transparent border-y-8 border-l-0',
        'left' => 'left-full top-1/2 -translate-y-1/2 border-l-gray-800 border-l-8 border-y-transparent border-y-8 border-r-0',
        'top' => 'top-full left-1/2 -translate-x-1/2 border-t-gray-800 border-t-8 border-x-transparent border-x-8 border-b-0',
        'bottom' => 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-800 border-b-8 border-x-transparent border-x-8 border-t-0'
    ];
    
    return '<div class="relative group ' . $additionalClasses . '">
        ' . $content . '
        <div class="absolute ' . $positionClasses[$position] . ' opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 delay-500 pointer-events-none z-50">
            <div class="bg-gray-800 text-white text-sm font-semibold px-3 py-2 rounded-md whitespace-nowrap shadow-lg">
                ' . htmlspecialchars($text) . '
            </div>
            <div class="absolute ' . $arrowClasses[$position] . '"></div>
        </div>
    </div>';
}
?>
