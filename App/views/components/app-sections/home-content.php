<?php
$currentUser = $GLOBALS['currentUser'] ?? null;
$friends = $GLOBALS['friends'] ?? [];
$onlineFriends = $GLOBALS['onlineFriends'] ?? [];
?>

<div class="flex-1 p-4 overflow-y-auto bg-discord-background">
    <div class="flex items-center justify-between mb-4">
        <h2 class="text-gray-400 font-bold text-xs uppercase">Online — <?php echo count($onlineFriends); ?></h2>
        <div class="relative w-60">
            <input type="text" placeholder="Search" class="w-full bg-discord-dark text-white text-sm rounded px-3 py-1 pl-8 focus:outline-none focus:ring-1 focus:ring-discord-primary">
            <i class="fas fa-search absolute left-2.5 top-1.5 text-gray-500 text-sm"></i>
        </div>
    </div>

    <div class="space-y-1 online-friends-container" data-lazyload="friend-list">
        <!-- Skeleton loader - displayed until content loads -->
        <div class="skeleton-content">
            <?php for ($i = 0; $i < 5; $i++): ?>
                <div class="skeleton-item flex justify-between items-center p-2">
                    <div class="flex items-center">
                        <div class="skeleton skeleton-avatar mr-3"></div>
                        <div>
                            <div class="skeleton skeleton-text mb-1"></div>
                            <div class="skeleton skeleton-text-sm"></div>
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <div class="skeleton w-8 h-8 rounded-full"></div>
                        <div class="skeleton w-8 h-8 rounded-full"></div>
                    </div>
                </div>
            <?php endfor; ?>
        </div>
        
        <!-- Actual content loaded via LazyLoader -->
        <div class="friend-content hidden">
            <?php if (empty($friends)): ?>
            <div class="p-4 bg-discord-dark rounded text-center">
                <div class="mb-2 text-gray-400">
                    <i class="fa-solid fa-user-group text-3xl"></i>
                </div>
                <p class="text-gray-300 mb-1">No friends found</p>
                <p class="text-gray-500 text-sm">Add some friends to get started!</p>
            </div>
            <?php else: ?>
                <?php foreach ($friends as $friend): ?>
                    <?php 
                    $statusText = 'Offline';
                    $statusColor = 'bg-gray-500';

                    if ($friend['status'] === 'online') {
                        $statusText = 'Online';
                        $statusColor = 'bg-discord-green';
                    } elseif ($friend['status'] === 'away') {
                        $statusText = 'Away';
                        $statusColor = 'bg-discord-yellow';
                    } elseif ($friend['status'] === 'dnd') {
                        $statusText = 'Do Not Disturb';
                        $statusColor = 'bg-discord-red';
                    }
                    ?>
                    <div class="flex justify-between items-center p-2 rounded hover:bg-discord-light group">
                        <div class="flex items-center">
                            <div class="relative mr-3">
                                <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                    <img src="<?php echo isset($friend['avatar']) ? htmlspecialchars($friend['avatar']) : 'https://ui-avatars.com/api/?name=' . urlencode($friend['username'] ?? 'U') . '&background=random'; ?>" 
                                         alt="Avatar" class="w-full h-full object-cover">
                                </div>
                                <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-background <?php echo $statusColor; ?>"></span>
                            </div>
                            <div>
                                <div class="font-medium text-white"><?php echo htmlspecialchars($friend['username']); ?><?php if (isset($friend['discriminator'])): ?><span class="text-gray-400 text-xs ml-1">#<?php echo htmlspecialchars($friend['discriminator']); ?></span><?php endif; ?></div>
                                <div class="text-xs text-gray-400"><?php echo htmlspecialchars($statusText); ?></div>
                            </div>
                        </div>
                        <div class="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button class="p-2 text-gray-400 hover:text-white hover:bg-discord-background rounded-full" title="Message">
                                <i class="fa-solid fa-message"></i>
                            </button>
                            <button class="p-2 text-gray-400 hover:text-white hover:bg-discord-background rounded-full" title="More">
                                <i class="fa-solid fa-ellipsis-vertical"></i>
                            </button>
                        </div>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        if (window.LazyLoader && typeof window.LazyLoader.triggerDataLoaded === 'function') {
            window.LazyLoader.triggerDataLoaded('friend-list', <?php echo empty($friends) ? 'true' : 'false'; ?>);
            
            // Hide skeleton and show content
            document.querySelector('.skeleton-content').classList.add('hidden');
            document.querySelector('.friend-content').classList.remove('hidden');
        } else {
            console.warn('LazyLoader.triggerDataLoaded not available yet');
        }
    }, 750);
});
</script>