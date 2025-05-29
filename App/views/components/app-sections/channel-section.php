<?php
require_once __DIR__ . '/../../../controllers/ChannelController.php';

if (!isset($currentServer) || empty($currentServer)) {
    error_log("channel-section.php: currentServer is not set");
    return;
}

$currentServerId = $currentServer->id ?? 0;
$currentUserId = $_SESSION['user_id'] ?? 0;
$activeChannelId = $_GET['channel'] ?? null;

error_log("channel-section.php: Loading channels for server ID $currentServerId");
$channelController = new ChannelController();
$channelData = $channelController->getServerChannels($currentServerId);

$channels = $channelData['channels'] ?? [];
$categories = $channelData['categories'] ?? [];

error_log("channel-section.php: Retrieved " . count($channels) . " channels and " . count($categories) . " categories");

// Helper function to determine channel type
function getChannelType($channel) {
    // Try type_name first (from join with channel_types)
    if (isset($channel['type_name'])) {
        return $channel['type_name'];
    }
    // Fall back to direct type field 
    return $channel['type'] ?? 'text';
}

// Helper function to get channel icon based on type
function getChannelIcon($channelType) {
    switch ($channelType) {
        case 'voice':
            return 'volume-high';
        case 'announcement':
            return 'bullhorn';
        case 'text':
        default:
            return 'hashtag';
    }
}
?>

<div class="space-y-4">
    <?php if (empty($categories)): ?>
        <div class="space-y-1">
            <?php foreach ($channels as $channel): 
                $isActive = $channel['id'] == $activeChannelId;
                $channelType = getChannelType($channel);
                $channelIcon = getChannelIcon($channelType);
            ?>
                <a href="/server/<?php echo $currentServerId; ?>?channel=<?php echo $channel['id']; ?>" 
                   class="flex items-center px-2 py-1 rounded <?php echo $isActive ? 'bg-discord-light text-white' : 'text-gray-400 hover:bg-discord-light/50 hover:text-gray-300'; ?>">
                    <i class="fas fa-<?php echo $channelIcon; ?> w-5"></i>
                    <span class="ml-1 truncate"><?php echo htmlspecialchars($channel['name']); ?></span>
                </a>
            <?php endforeach; ?>
        </div>
    <?php else: ?>
        <?php foreach ($categories as $category): 
            $categoryId = $category['id'];
            $categoryChannels = array_filter($channels, function($c) use ($categoryId) {
                return isset($c['parent_id']) && $c['parent_id'] == $categoryId;
            });
            
            $isExpanded = isset($_COOKIE['category_' . $categoryId]) ? $_COOKIE['category_' . $categoryId] === 'expanded' : true;
        ?>
            <div class="space-y-1">
                <div class="flex items-center text-xs font-semibold text-gray-500 hover:text-gray-400 cursor-pointer px-1 py-1.5 select-none" 
                     data-category-id="<?php echo $categoryId; ?>" 
                     onclick="toggleCategory(this)">
                    <i class="fas fa-chevron-<?php echo $isExpanded ? 'down' : 'right'; ?> w-3 mr-1"></i>
                    <span class="uppercase tracking-wide"><?php echo htmlspecialchars($category['name']); ?></span>
                </div>
                
                <div class="space-y-1 <?php echo $isExpanded ? '' : 'hidden'; ?>" id="category-<?php echo $categoryId; ?>-channels">
                    <?php foreach ($categoryChannels as $channel): 
                        $isActive = $channel['id'] == $activeChannelId;
                        $channelType = getChannelType($channel);
                        $channelIcon = getChannelIcon($channelType);
                    ?>
                        <a href="/server/<?php echo $currentServerId; ?>?channel=<?php echo $channel['id']; ?>" 
                           class="flex items-center px-2 py-1 ml-2 rounded group <?php echo $isActive ? 'bg-discord-light text-white' : 'text-gray-400 hover:bg-discord-light/50 hover:text-gray-300'; ?>">
                            <i class="fas fa-<?php echo $channelIcon; ?> w-4 text-sm"></i>
                            <span class="ml-1 truncate"><?php echo htmlspecialchars($channel['name']); ?></span>
                            <div class="ml-auto hidden group-hover:flex">
                                <button class="text-gray-500 hover:text-gray-300 p-1">
                                    <i class="fas fa-user-plus text-xs"></i>
                                </button>
                                <button class="text-gray-500 hover:text-gray-300 p-1">
                                    <i class="fas fa-cog text-xs"></i>
                                </button>
                            </div>
                        </a>
                    <?php endforeach; ?>
                </div>
            </div>
        <?php endforeach; ?>
        
        <?php 
        $uncategorizedChannels = array_filter($channels, function($c) {
            return !isset($c['parent_id']) || $c['parent_id'] === null;
        });
        
        if (!empty($uncategorizedChannels)): 
        ?>
            <div class="space-y-1 mt-2">
                <?php foreach ($uncategorizedChannels as $channel): 
                    $isActive = $channel['id'] == $activeChannelId;
                    $channelType = getChannelType($channel);
                    $channelIcon = getChannelIcon($channelType);
                ?>
                    <a href="/server/<?php echo $currentServerId; ?>?channel=<?php echo $channel['id']; ?>" 
                       class="flex items-center px-2 py-1 rounded group <?php echo $isActive ? 'bg-discord-light text-white' : 'text-gray-400 hover:bg-discord-light/50 hover:text-gray-300'; ?>">
                        <i class="fas fa-<?php echo $channelIcon; ?> w-4 text-sm"></i>
                        <span class="ml-1 truncate"><?php echo htmlspecialchars($channel['name']); ?></span>
                        <div class="ml-auto hidden group-hover:flex">
                            <button class="text-gray-500 hover:text-gray-300 p-1">
                                <i class="fas fa-user-plus text-xs"></i>
                            </button>
                            <button class="text-gray-500 hover:text-gray-300 p-1">
                                <i class="fas fa-cog text-xs"></i>
                            </button>
                        </div>
                    </a>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    <?php endif; ?>
</div>

<script>
function toggleCategory(element) {
    const categoryId = element.getAttribute('data-category-id');
    const channelsContainer = document.getElementById(`category-${categoryId}-channels`);
    const icon = element.querySelector('i');
    
    if (channelsContainer.classList.contains('hidden')) {
        channelsContainer.classList.remove('hidden');
        icon.classList.replace('fa-chevron-right', 'fa-chevron-down');
        document.cookie = `category_${categoryId}=expanded; path=/;`;
    } else {
        channelsContainer.classList.add('hidden');
        icon.classList.replace('fa-chevron-down', 'fa-chevron-right');
        document.cookie = `category_${categoryId}=collapsed; path=/;`;
    }
}
</script>
