<?php
$categories = $GLOBALS['categories'] ?? [];
$servers = $GLOBALS['servers'] ?? [];

$categoryCounts = [];
foreach ($categories as $key => $name) {
    $categoryCounts[$key] = 0;
}

foreach ($servers as $server) {
    $serverCategory = $server['category'] ?? '';
    if ($serverCategory && isset($categoryCounts[$serverCategory])) {
        $categoryCounts[$serverCategory]++;
    }
}
?>

<div class="w-60 bg-discord-dark flex flex-col">

    <div class="px-4 pt-4 flex items-center justify-between">
        <h3 class="uppercase text-discord-lighter font-semibold text-xs tracking-wider">Categories</h3>
    </div>

    <div class="px-2 mt-1 flex-grow overflow-y-auto">
        <div class="category-item flex items-center p-2 rounded hover:bg-discord-light text-discord-lighter hover:text-white cursor-pointer active" 
             data-category="">
            <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                <i class="fas fa-globe"></i>
            </div>
            <span class="font-medium">All Servers</span>
            <span class="ml-auto text-xs bg-discord-darker px-2 py-1 rounded misvord-category-count misvord-category-count-skeleton" data-count="<?php echo count($servers); ?>"></span>
        </div>

        <?php foreach ($categories as $key => $name): ?>
            <div class="category-item flex items-center p-2 rounded hover:bg-discord-light text-discord-lighter hover:text-white cursor-pointer mt-1" 
                 data-category="<?php echo htmlspecialchars($key); ?>">
                <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                    <?php
                    $icons = [
                        'gaming' => 'fas fa-gamepad',
                        'music' => 'fas fa-music',
                        'education' => 'fas fa-graduation-cap',
                        'science' => 'fas fa-flask',
                        'entertainment' => 'fas fa-film',
                        'community' => 'fas fa-users'
                    ];
                    $icon = $icons[$key] ?? 'fas fa-folder';
                    ?>
                    <i class="<?php echo $icon; ?>"></i>
                </div>
                <span class="font-medium"><?php echo htmlspecialchars($name); ?></span>
                <span class="ml-auto text-xs bg-discord-darker px-2 py-1 rounded misvord-category-count misvord-category-count-skeleton" data-count="<?php echo $categoryCounts[$key] ?? 0; ?>"></span>
            </div>
        <?php endforeach; ?>
    </div>



    <?php include dirname(__DIR__) . '/common/user-profile.php'; ?>
</div>

<style>
.category-item.active {
    background-color: #5865f2 !important;
    color: white !important;
}
</style> 