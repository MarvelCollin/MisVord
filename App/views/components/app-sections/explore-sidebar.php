<?php
$categories = $GLOBALS['categories'] ?? [];
$featuredServers = $GLOBALS['featuredServers'] ?? [];
$servers = $GLOBALS['servers'] ?? [];
?>

<div class="w-60 bg-discord-dark flex flex-col">
    <div class="p-3">
        <div class="w-full bg-discord-darker rounded px-2 py-1.5 flex items-center">
            <input type="text" 
                   id="explore-search" 
                   placeholder="Search servers..." 
                   class="w-full bg-transparent border-0 text-sm text-discord-lighter focus:outline-none">
            <i class="fas fa-search text-discord-lighter"></i>
        </div>
    </div>

    <div class="px-2 mb-2">
        <div class="flex items-center p-2 rounded bg-discord-light text-white cursor-pointer">
            <div class="w-8 h-8 rounded-full bg-discord-background flex items-center justify-center mr-3">
                <i class="fas fa-compass"></i>
            </div>
            <span class="font-medium">Explore Servers</span>
        </div>
    </div>

    <div class="px-4 mt-1 flex items-center justify-between">
        <h3 class="uppercase text-discord-lighter font-semibold text-xs tracking-wider">Categories</h3>
    </div>

    <div class="px-2 mt-1 flex-grow overflow-y-auto">
        <div class="category-item flex items-center p-2 rounded hover:bg-discord-light text-discord-lighter hover:text-white cursor-pointer active" 
             data-category="">
            <div class="w-8 h-8 rounded-full bg-discord-background flex items-center justify-center mr-3">
                <i class="fas fa-globe"></i>
            </div>
            <span class="font-medium">All Servers</span>
            <span class="ml-auto text-xs bg-discord-darker px-2 py-1 rounded"><?php echo count($servers); ?></span>
        </div>

        <?php foreach ($categories as $key => $name): ?>
            <div class="category-item flex items-center p-2 rounded hover:bg-discord-light text-discord-lighter hover:text-white cursor-pointer mt-1" 
                 data-category="<?php echo htmlspecialchars($key); ?>">
                <div class="w-8 h-8 rounded-full bg-discord-background flex items-center justify-center mr-3">
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
            </div>
        <?php endforeach; ?>
    </div>

    <?php if (!empty($featuredServers)): ?>
    <div class="px-4 mt-4 flex items-center justify-between">
        <h3 class="uppercase text-discord-lighter font-semibold text-xs tracking-wider">Featured</h3>
    </div>

    <div class="px-2 mt-1 mb-4">
        <?php foreach (array_slice($featuredServers, 0, 3) as $server): ?>
            <div class="featured-server-item flex items-center p-2 rounded hover:bg-discord-light text-discord-lighter hover:text-white cursor-pointer mt-1" 
                 data-server-id="<?php echo htmlspecialchars($server['id']); ?>">
                <div class="w-8 h-8 rounded-full bg-discord-background flex items-center justify-center mr-3 overflow-hidden">
                    <?php if (!empty($server['image_url'])): ?>
                        <img src="<?php echo htmlspecialchars($server['image_url']); ?>" 
                             alt="<?php echo htmlspecialchars($server['name']); ?>" 
                             class="w-full h-full object-cover">
                    <?php else: ?>
                        <span class="text-white font-bold text-sm"><?php echo strtoupper(substr($server['name'], 0, 1)); ?></span>
                    <?php endif; ?>
                </div>
                <div class="flex-1 min-w-0">
                    <span class="font-medium truncate block text-sm"><?php echo htmlspecialchars($server['name']); ?></span>
                    <span class="text-xs text-discord-lighter"><?php echo $server['member_count'] ?? 0; ?> members</span>
                </div>
                <div class="ml-2">
                    <i class="fas fa-star text-yellow-500 text-xs"></i>
                </div>
            </div>
        <?php endforeach; ?>
    </div>
    <?php endif; ?>

    <?php include dirname(__DIR__) . '/common/user-profile.php'; ?>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('explore-search');
    const categoryItems = document.querySelectorAll('.category-item');
    const featuredItems = document.querySelectorAll('.featured-server-item');

    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const serverSearchInput = document.getElementById('server-search');
            if (serverSearchInput) {
                serverSearchInput.value = e.target.value;
                serverSearchInput.dispatchEvent(new Event('input'));
            }
        });
    }

    categoryItems.forEach(item => {
        item.addEventListener('click', function() {
            categoryItems.forEach(cat => cat.classList.remove('active', 'bg-discord-light', 'text-white'));
            categoryItems.forEach(cat => cat.classList.add('text-discord-lighter'));
            
            this.classList.add('active', 'bg-discord-light', 'text-white');
            this.classList.remove('text-discord-lighter');
            
            const category = this.getAttribute('data-category');
            const categoryFilter = document.getElementById('category-filter');
            if (categoryFilter) {
                categoryFilter.value = category;
                categoryFilter.dispatchEvent(new Event('change'));
            }
        });
    });

    featuredItems.forEach(item => {
        item.addEventListener('click', function() {
            const serverId = this.getAttribute('data-server-id');
            const serverCard = document.querySelector(`[data-server-id="${serverId}"]`);
            if (serverCard) {
                serverCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                serverCard.classList.add('highlight');
                setTimeout(() => serverCard.classList.remove('highlight'), 2000);
            }
        });
    });
});
</script>

<style>
.highlight {
    animation: highlight 2s ease-in-out;
}

@keyframes highlight {
    0%, 100% { 
        transform: scale(1); 
        box-shadow: none; 
    }
    50% { 
        transform: scale(1.02); 
        box-shadow: 0 0 20px rgba(88, 101, 242, 0.3); 
    }
}

.category-item.active {
    background-color: #5865f2 !important;
    color: white !important;
}
</style> 