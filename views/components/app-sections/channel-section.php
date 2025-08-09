<?php
require_once dirname(__DIR__) . '/common/channel-functions.php';

$currentServer = $currentServer ?? $GLOBALS['currentServer'] ?? null;
if (!$currentServer) {
    echo '<div class="p-4 text-gray-400 text-center">No server loaded</div>';
    return;
}

$currentServerId = $currentServer->id ?? 0;
$activeChannelId = $GLOBALS['activeChannelId'] ?? null;
$channels = $GLOBALS['serverChannels'] ?? [];
$categories = $GLOBALS['serverCategories'] ?? [];
?>

<div class="w-48 sm:w-56 md:w-60 bg-discord-dark flex flex-col h-full border-r border-gray-800/80">
    <div class="h-12 border-b border-gray-800/90 flex items-center px-2 sm:px-4 shadow-sm bg-discord-dark/95 server-header-container">
        <button id="mobile-channel-close" class="md:hidden mr-2 p-1 text-gray-400 hover:text-white rounded" onclick="window.toggleChannelSidebar && window.toggleChannelSidebar()">
            <i class="fas fa-times text-sm"></i>
        </button>
        <h2 class="font-bold text-white flex-1 truncate server-name text-sm sm:text-base">
            <?php echo htmlspecialchars(is_array($currentServer) ? ($currentServer['name'] ?? 'Server') : ($currentServer->name ?? 'Server')); ?>
        </h2>
        <button id="server-dropdown-btn" class="server-dropdown-btn ml-2 p-1 rounded hover:bg-gray-700/50 transition-colors">
            <i class="fas fa-chevron-down text-xs sm:text-sm"></i>
        </button>
        
        <div id="server-dropdown" class="server-dropdown hidden">
            <div class="server-dropdown-item">
                <i class="fas fa-user-plus"></i>
                <span>Invite People</span>
            </div>
            <div class="server-dropdown-item">
                <i class="fas fa-cog"></i>
                <span>Server Settings</span>
            </div>
            <div class="server-dropdown-item">
                <i class="fas fa-plus"></i>
                <span>Create Channel</span>
            </div>
            <div class="server-dropdown-separator"></div>
            <div class="server-dropdown-item destructive">
                <i class="fas fa-sign-out-alt"></i>
                <span>Leave Server</span>
            </div>
        </div>
    </div>

    <div class="channel-wrapper flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800">
        <div id="channel-skeleton-loading" class="p-2 space-y-4" style="outline: none !important; border: none !important;">
            <?php for ($i = 0; $i < 3; $i++): ?>
                <div class="space-y-0.5">
                    <div class="flex items-center px-2 py-1">
                        <div class="h-2.5 w-2.5 bg-gray-700 rounded-sm mr-2 animate-pulse" style="outline: none !important; border: none !important;"></div>
                        <div class="h-3.5 bg-gray-700 rounded w-24 animate-pulse" style="outline: none !important; border: none !important;"></div>
                    </div>
                    <div class="ml-2 space-y-0.5">
                        <?php for ($j = 0; $j < 3; $j++): ?>
                            <div class="flex items-center py-1 px-2">
                                <div class="h-2.5 w-2.5 bg-gray-700 rounded-sm mr-2 animate-pulse" style="outline: none !important; border: none !important;"></div>
                                <div class="h-3.5 bg-gray-700 rounded w-20 animate-pulse" style="outline: none !important; border: none !important;"></div>
                            </div>
                        <?php endfor; ?>
                    </div>
                </div>
            <?php endfor; ?>
        </div>
        
        <div class="channel-list p-1 sm:p-2 space-y-1 sm:space-y-2" id="channel-real-content" style="display: none;">
            <input type="hidden" id="active-channel-id" value="<?php echo $activeChannelId; ?>">
            
            <?php

            $uncategorizedChannels = array_filter($channels, fn($ch) => empty($ch['category_id']));
            usort($uncategorizedChannels, fn($a, $b) => ($a['position'] ?? 0) <=> ($b['position'] ?? 0));

            if (!empty($uncategorizedChannels)):
                foreach ($uncategorizedChannels as $channel):
                    renderChannel($channel, $activeChannelId);
                endforeach;
            endif;


            if (!empty($categories)):
                usort($categories, fn($a, $b) => ($a['position'] ?? 0) <=> ($b['position'] ?? 0));
                
                foreach ($categories as $category):
                    $categoryChannels = array_filter($channels, fn($ch) => ($ch['category_id'] ?? '') == $category['id']);
                    if (empty($categoryChannels)) continue;
                    
                    usort($categoryChannels, fn($a, $b) => ($a['position'] ?? 0) <=> ($b['position'] ?? 0));
            ?>
                    <div class="category-section mb-2 sm:mb-4">
                        <div class="category-header flex items-center px-2 sm:px-3 py-1 mb-1 cursor-pointer">
                            <i class="fas fa-chevron-down text-xs mr-1 text-gray-500"></i>
                            <span class="text-xs font-semibold uppercase text-gray-400 truncate"><?php echo htmlspecialchars($category['name']); ?></span>
                        </div>
                        <div class="category-channels ml-1 sm:ml-2">
                            <?php foreach ($categoryChannels as $channel): ?>
                                <?php renderChannel($channel, $activeChannelId); ?>
                            <?php endforeach; ?>
                        </div>
                    </div>
            <?php
                endforeach;
            endif;

            if (empty($channels)):
            ?>
                <div class="p-2 sm:p-4 text-gray-400 text-center text-xs sm:text-sm">No channels available</div>
            <?php endif; ?>
        </div>
    </div>
    <?php require_once dirname(__DIR__) . '/common/user-profile.php'; ?>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const skeleton = document.getElementById('channel-skeleton-loading');
        const content = document.getElementById('channel-real-content');
        
        if (skeleton) skeleton.style.display = 'none';
        if (content) content.style.display = 'block';
    }, 800);
    
    if (typeof window.initServerDropdown === 'function') {
        setTimeout(() => {
            window.initServerDropdown();
        }, 100);
    }
});
</script>