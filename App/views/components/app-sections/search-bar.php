<?php
// Customizable parameters with defaults
$placeholder = $placeholder ?? 'Search...';
$width = $width ?? 'w-full';
$bgColor = $bgColor ?? 'bg-[#202225]';
$iconPosition = $iconPosition ?? 'right'; // 'right' or 'left'
$customClasses = $customClasses ?? '';
?>

<div class="relative <?php echo $width; ?> <?php echo $customClasses; ?>">
    <?php if ($iconPosition === 'left'): ?>
        <div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <i class="fa-solid fa-magnifying-glass text-[14px]"></i>
        </div>
        <input type="text" 
               placeholder="<?php echo htmlspecialchars($placeholder); ?>" 
               class="w-full <?php echo $bgColor; ?> text-gray-200 text-sm rounded pl-9 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-discord-blue">
    <?php else: ?>
        <input type="text" 
               placeholder="<?php echo htmlspecialchars($placeholder); ?>" 
               class="w-full <?php echo $bgColor; ?> text-gray-200 text-sm rounded pl-3 pr-9 py-1.5 focus:outline-none focus:ring-1 focus:ring-discord-blue">
        <div class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <i class="fa-solid fa-magnifying-glass text-[14px]"></i>
        </div>
    <?php endif; ?>
</div> 