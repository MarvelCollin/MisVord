<?php
require_once dirname(__DIR__) . '/common/channel-functions.php';

$currentServer = $currentServer ?? $GLOBALS['currentServer'] ?? null;

if (!isset($currentServer) || empty($currentServer)) {
    echo '<div class="p-4 text-gray-400 text-center">No server loaded</div>';
    return;
}

$currentServerId = $currentServer->id ?? 0;
$activeChannelId = $GLOBALS['activeChannelId'] ?? null;
$channels = $GLOBALS['serverChannels'] ?? [];
$categories = $GLOBALS['serverCategories'] ?? [];
?>

<div class="w-60 bg-discord-dark flex flex-col h-full border-r border-gray-800">
    <div class="h-12 border-b border-black flex items-center px-4 shadow-sm relative">
        <h2 class="font-bold text-white truncate flex-1"><?php echo htmlspecialchars(is_array($currentServer) ? ($currentServer['name'] ?? 'Server') : ($currentServer->name ?? 'Server')); ?></h2>
        <button id="server-dropdown-btn" class="text-gray-400 hover:text-white focus:outline-none w-5 h-5 flex items-center justify-center">
            <i class="fas fa-chevron-down text-sm"></i>
        </button>
        
        <div id="server-dropdown" class="hidden absolute right-2 top-12 w-56 bg-[#18191c] rounded-md shadow-lg z-50 py-2 text-gray-100 text-sm overflow-hidden">
            <div class="server-dropdown-item flex items-center px-3 py-2 hover:bg-[#5865f2] cursor-pointer text-gray-300 hover:text-white" data-role-restricted="false" style="display: flex;">
                <i class="fas fa-user-plus w-5 text-center mr-2.5 text-gray-300 group-hover:text-white"></i>
                <span>Invite People</span>
            </div>
            
            <div class="server-dropdown-item flex items-center px-3 py-2 hover:bg-[#5865f2] cursor-pointer text-gray-300 hover:text-white" data-role-restricted="false" style="display: flex;">
                <i class="fas fa-cog w-5 text-center mr-2.5 text-gray-300 group-hover:text-white"></i>
                <span>Server Settings</span>
            </div>
            
            <div class="server-dropdown-item flex items-center px-3 py-2 hover:bg-[#5865f2] cursor-pointer text-gray-300 hover:text-white" data-role-restricted="false" style="display: flex;">
                <i class="fas fa-plus-circle w-5 text-center mr-2.5 text-gray-300 group-hover:text-white"></i>
                <span>Create Channel</span>
            </div>
            
            <div class="server-dropdown-item flex items-center px-3 py-2 hover:bg-[#5865f2] cursor-pointer text-gray-300 hover:text-white" data-role-restricted="false" style="display: flex;">
                <i class="fas fa-folder-plus w-5 text-center mr-2.5 text-gray-300 group-hover:text-white"></i>
                <span>Create Category</span>
            </div>
            
            <div class="border-t border-gray-700 my-1"></div>
            
            <div class="server-dropdown-item flex items-center px-3 py-2 hover:bg-[#5865f2] cursor-pointer text-red-400 hover:text-white" data-role-restricted="false" style="display: flex;">
                <i class="fas fa-sign-out-alt w-5 text-center mr-2.5 text-red-400 group-hover:text-white"></i>
                <span>Leave Server</span>
            </div>
        </div>
    </div>

<div class="channel-wrapper flex-1 overflow-y-auto">
    <div id="channel-skeleton-loading" class="channel-skeleton-container p-2">
        <div class="mb-4">
            <div class="flex items-center px-3 py-1 mb-1 animate-pulse">
                <div class="h-3 w-3 bg-gray-700 rounded-sm mr-1"></div>
                <div class="h-4 bg-gray-700 rounded w-24"></div>
            </div>
            <div class="ml-2">
                <?php renderChannelSkeleton(3, 'animate-pulse'); ?>
            </div>
        </div>
        <div class="mb-4">
            <div class="flex items-center px-3 py-1 mb-1 animate-pulse">
                <div class="h-3 w-3 bg-gray-700 rounded-sm mr-1"></div>
                <div class="h-4 bg-gray-700 rounded w-32"></div>
            </div>
            <div class="ml-2">
                <?php renderChannelSkeleton(4, 'animate-pulse'); ?>
            </div>
        </div>
        <div class="mb-4">
            <div class="flex items-center px-3 py-1 mb-1 animate-pulse">
                <div class="h-3 w-3 bg-gray-700 rounded-sm mr-1"></div>
                <div class="h-4 bg-gray-700 rounded w-28"></div>
            </div>
            <div class="ml-2">
                <?php renderChannelSkeleton(2, 'animate-pulse'); ?>
            </div>
        </div>
    </div>
    
    <div class="channel-list p-2" data-server-id="<?php echo $currentServerId; ?>" id="channel-real-content" style="display: none;">
        <input type="hidden" id="current-server-id" value="<?php echo $currentServerId; ?>">
        <input type="hidden" id="active-channel-id" value="<?php echo $activeChannelId; ?>">
        
        <?php
        $uncategorizedChannels = array_filter($channels, function($ch) {
            return !isset($ch['category_id']) || $ch['category_id'] === null || $ch['category_id'] === '';
        });
        
        usort($uncategorizedChannels, function($a, $b) {
            return ($a['position'] ?? 0) <=> ($b['position'] ?? 0);
        });

        if (!empty($uncategorizedChannels)):
            $textChannels = array_filter($uncategorizedChannels, function($ch) {
                return ($ch['type'] ?? 'text') === 'text';
            });
            
            usort($textChannels, function($a, $b) {
                return ($a['position'] ?? 0) <=> ($b['position'] ?? 0);
            });
            
            if (!empty($textChannels)):
        ?>
        <div class="channels-section group">
            <?php foreach ($textChannels as $channel): ?>
                <?php renderChannel($channel, $activeChannelId); ?>
            <?php endforeach; ?>
        </div>
        <?php 
            endif;
            
            $voiceChannels = array_filter($uncategorizedChannels, function($ch) {
                return ($ch['type'] ?? 'text') === 'voice';
            });
            
            usort($voiceChannels, function($a, $b) {
                return ($a['position'] ?? 0) <=> ($b['position'] ?? 0);
            });
            
            if (!empty($voiceChannels)):
        ?>
        <div class="voice-channels-section group">
            <?php foreach ($voiceChannels as $channel): ?>
                <?php renderChannel($channel, $activeChannelId); ?>
            <?php endforeach; ?>
        </div>
        <?php endif; ?>
        <?php endif; ?>

        <?php if (!empty($categories)): ?>
            <?php 
            usort($categories, function($a, $b) {
                return ($a['position'] ?? 0) <=> ($b['position'] ?? 0);
            });
            ?>
            <?php foreach ($categories as $category): ?>
                <?php
                $categoryChannels = array_filter($channels, function($ch) use ($category) {
                    return isset($ch['category_id']) && $ch['category_id'] == $category['id'];
                });
                
                usort($categoryChannels, function($a, $b) {
                    return ($a['position'] ?? 0) <=> ($b['position'] ?? 0);
                });
                
                if (empty($categoryChannels)) continue;
                ?>
                <div class="category-section mb-4" data-category-id="<?php echo $category['id']; ?>">
                    <div class="category-header flex items-center px-3 py-1 mb-1 cursor-pointer group">
                        <i class="fas fa-chevron-down text-xs mr-1 text-gray-500"></i>
                        <span class="text-xs font-semibold uppercase text-gray-400"><?php echo htmlspecialchars($category['name']); ?></span>
                    </div>
                    <div class="category-channels ml-2">
                        <?php foreach ($categoryChannels as $channel): ?>
                            <?php renderChannel($channel, $activeChannelId); ?>
                        <?php endforeach; ?>
                    </div>
                </div>
            <?php endforeach; ?>
        <?php endif; ?>

        <?php if (empty($channels)): ?>
        <div class="p-4 text-gray-400 text-center text-sm">No channels available</div>
        <?php endif; ?>
    </div>
</div>

    <?php 
    $userProfilePath = dirname(__DIR__) . '/common/user-profile.php';
    if (file_exists($userProfilePath)) {
        include $userProfilePath;
    }
    ?>
</div>

<style>
.channel-skeleton-container {
    animation-delay: 0.1s;
}

.channel-skeleton-container > div:nth-child(1) {
    animation-delay: 0ms;
}

.channel-skeleton-container > div:nth-child(2) {
    animation-delay: 300ms;
}

.channel-skeleton-container > div:nth-child(3) {
    animation-delay: 600ms;
}

.channel-item {
    transition: all 0.15s ease;
    border-radius: 4px;
    position: relative;
}

.channel-item:hover {
    background-color: rgba(79, 84, 92, 0.16) !important;
}

.channel-item.active:hover {
    background-color: #4752c4 !important;
    color: #ffffff !important;
}

.channel-item.active:hover i {
    color: #ffffff !important;
}

.channel-item.active:hover .voice-user-count {
    color: rgba(255, 255, 255, 0.7) !important;
}

.channel-item.active {
    background-color: #5865f2 !important;
    color: #ffffff !important;
}

.channel-item.active i {
    color: #ffffff !important;
}

.group:hover .opacity-0 {
    opacity: 1 !important;
}

.category-header {
    transition: color 0.15s ease;
}

.category-header:hover {
    color: #ffffff;
}

.category-channels {
    transition: max-height 0.3s ease;
}

.category-channels.hidden {
    max-height: 0;
    overflow: hidden;
}

.channel-menu {
    z-index: 1000;
}

.channel-dropdown {
    z-index: 1001;
}
</style>

<script>
document.addEventListener('DOMContentLoaded', function() {
    function initializeChannelSkeleton() {
        setTimeout(() => {
            hideChannelSkeleton();
        }, 1200);
    }
    
    function hideChannelSkeleton() {
        const skeletonContainer = document.getElementById('channel-skeleton-loading');
        const realContent = document.getElementById('channel-real-content');
        
        if (skeletonContainer) {
            skeletonContainer.style.display = 'none';
        }
        
        if (realContent) {
            realContent.style.display = 'block';
        }
    }
    
    function showChannelSkeleton() {
        const skeletonContainer = document.getElementById('channel-skeleton-loading');
        const realContent = document.getElementById('channel-real-content');
        
        if (skeletonContainer) {
            skeletonContainer.style.display = 'block';
        }
        
        if (realContent) {
            realContent.style.display = 'none';
        }
    }
    
    initializeChannelSkeleton();
    
    window.channelSectionSkeleton = {
        show: showChannelSkeleton,
        hide: hideChannelSkeleton,
        initialized: true
    };
});
</script>

