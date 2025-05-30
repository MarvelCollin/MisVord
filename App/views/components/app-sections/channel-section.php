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

// Group channels by type if no categories exist
$textChannels = [];
$voiceChannels = [];

if (empty($categories)) {
    foreach ($channels as $channel) {
        $type = isset($channel['type_name']) ? $channel['type_name'] : ($channel['type'] ?? 'text');
        
        if ($type === 'voice' || $type === '2') {
            $voiceChannels[] = $channel;
        } else {
            $textChannels[] = $channel;
        }
    }
}

function getChannelType($channel) {
    if (isset($channel['type_name'])) {
        return $channel['type_name'];
    }
    if (isset($channel['type'])) {
        if ($channel['type'] === '2' || $channel['type'] === 2) {
            return 'voice';
        }
        if ($channel['type'] === '1' || $channel['type'] === 1) {
            return 'text';
        }
    }
    return 'text'; // Default to text
}

function getChannelIcon($channelType) {
    switch ($channelType) {
        case 'voice':
        case '2':
            return 'volume-high';
        case 'announcement':
        case '4':
            return 'bullhorn';
        case 'text':
        case '1':
        default:
            return 'hashtag';
    }
}
?>

<meta name="server-id" content="<?php echo $currentServerId; ?>">

<div id="channel-loading" class="py-2 px-2 text-xs text-gray-400 hidden">
    <!-- <div class="flex items-center justify-center">
        <i class="fas fa-circle-notch fa-spin mr-1"></i>
        <span>Updating channels...</span>
    </div> -->
</div>

<div id="channel-container" class="space-y-4" data-lazyload="channel-list">
    <?php if (empty($categories) && (!empty($textChannels) || !empty($voiceChannels))): ?>
        <!-- Display grouped channels by type -->
        <?php if (!empty($textChannels)): ?>
            <div class="space-y-1">
                <div class="flex items-center text-xs font-semibold text-gray-400 hover:text-gray-300 cursor-pointer px-1 py-1.5 select-none" 
                     onclick="toggleCategory(this)" data-category-id="text-channels">
                    <i class="fas fa-chevron-down w-3 mr-1"></i>
                    <span class="uppercase tracking-wide">Text Channels</span>
                </div>
                
                <div class="space-y-1" id="category-text-channels-channels">
                    <?php foreach ($textChannels as $channel): 
                        $isActive = $channel['id'] == $activeChannelId;
                    ?>
                        <a href="/server/<?php echo $currentServerId; ?>?channel=<?php echo $channel['id']; ?>" 
                           class="channel-item flex items-center px-2 py-1 ml-2 rounded group <?php echo $isActive ? 'bg-discord-light text-white active' : 'text-gray-400 hover:bg-discord-light/50 hover:text-gray-300'; ?>"
                           data-channel-id="<?php echo $channel['id']; ?>">
                            <i class="fas fa-hashtag w-4 text-sm"></i>
                            <span class="ml-1 truncate"><?php echo htmlspecialchars($channel['name']); ?></span>
                            <?php if (!$isActive): ?>
                                <div class="ml-auto hidden group-hover:flex">
                                    <button class="text-gray-500 hover:text-gray-300 p-1">
                                        <i class="fas fa-user-plus text-xs"></i>
                                    </button>
                                    <button class="text-gray-500 hover:text-gray-300 p-1">
                                        <i class="fas fa-cog text-xs"></i>
                                    </button>
                                </div>
                            <?php endif; ?>
                        </a>
                    <?php endforeach; ?>
                </div>
            </div>
        <?php endif; ?>
        
        <?php if (!empty($voiceChannels)): ?>
            <div class="space-y-1">
                <div class="flex items-center text-xs font-semibold text-gray-400 hover:text-gray-300 cursor-pointer px-1 py-1.5 select-none" 
                     onclick="toggleCategory(this)" data-category-id="voice-channels">
                    <i class="fas fa-chevron-down w-3 mr-1"></i>
                    <span class="uppercase tracking-wide">Voice Channels</span>
                </div>
                
                <div class="space-y-1" id="category-voice-channels-channels">
                    <?php foreach ($voiceChannels as $channel): 
                        $isActive = $channel['id'] == $activeChannelId;
                    ?>
                        <a href="/server/<?php echo $currentServerId; ?>?channel=<?php echo $channel['id']; ?>" 
                           class="channel-item flex items-center px-2 py-1 ml-2 rounded group <?php echo $isActive ? 'bg-discord-light text-white active' : 'text-gray-400 hover:bg-discord-light/50 hover:text-gray-300'; ?>"
                           data-channel-id="<?php echo $channel['id']; ?>">
                            <i class="fas fa-volume-high w-4 text-sm"></i>
                            <span class="ml-1 truncate"><?php echo htmlspecialchars($channel['name']); ?></span>
                            <?php if (!$isActive): ?>
                                <div class="ml-auto hidden group-hover:flex">
                                    <button class="text-gray-500 hover:text-gray-300 p-1">
                                        <i class="fas fa-cog text-xs"></i>
                                    </button>
                                </div>
                            <?php endif; ?>
                        </a>
                    <?php endforeach; ?>
                </div>
            </div>
        <?php endif; ?>
        
    <?php elseif (!empty($categories)): ?>
        <!-- Display channels by categories -->
        <?php foreach ($categories as $category): 
            $categoryId = $category['id'];
            $categoryChannels = array_filter($channels, function($c) use ($categoryId) {
                return (isset($c['category_id']) && $c['category_id'] == $categoryId) || 
                       (isset($c['parent_id']) && $c['parent_id'] == $categoryId);
            });
            
            // Skip empty categories
            if (empty($categoryChannels)) {
                continue;
            }
            
            $isExpanded = isset($_COOKIE['category_' . $categoryId]) ? $_COOKIE['category_' . $categoryId] === 'expanded' : true;
        ?>
            <div class="space-y-1">
                <div class="flex items-center text-xs font-semibold text-gray-400 hover:text-gray-300 cursor-pointer px-1 py-1.5 select-none" 
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
                           class="channel-item flex items-center px-2 py-1 ml-2 rounded group <?php echo $isActive ? 'bg-discord-light text-white active' : 'text-gray-400 hover:bg-discord-light/50 hover:text-gray-300'; ?>"
                           data-channel-id="<?php echo $channel['id']; ?>">
                            <i class="fas fa-<?php echo $channelIcon; ?> w-4 text-sm"></i>
                            <span class="ml-1 truncate"><?php echo htmlspecialchars($channel['name']); ?></span>
                            <?php if (!$isActive): ?>
                                <div class="ml-auto hidden group-hover:flex">
                                    <button class="text-gray-500 hover:text-gray-300 p-1">
                                        <i class="fas fa-user-plus text-xs"></i>
                                    </button>
                                    <button class="text-gray-500 hover:text-gray-300 p-1">
                                        <i class="fas fa-cog text-xs"></i>
                                    </button>
                                </div>
                            <?php endif; ?>
                        </a>
                    <?php endforeach; ?>
                </div>
            </div>
        <?php endforeach; ?>
        
        <?php 
        // Show uncategorized channels at the bottom
        $uncategorizedChannels = array_filter($channels, function($c) {
            return !isset($c['category_id']) || $c['category_id'] === null || $c['category_id'] === '';
        });
        
        if (!empty($uncategorizedChannels)): 
            // Group uncategorized channels by type
            $uncatTextChannels = [];
            $uncatVoiceChannels = [];
            
            foreach ($uncategorizedChannels as $channel) {
                $type = getChannelType($channel);
                if ($type === 'voice') {
                    $uncatVoiceChannels[] = $channel;
                } else {
                    $uncatTextChannels[] = $channel;
                }
            }
        ?>
            <?php if (!empty($uncatTextChannels)): ?>
                <div class="space-y-1 mt-2">
                    <div class="flex items-center text-xs font-semibold text-gray-400 hover:text-gray-300 cursor-pointer px-1 py-1.5 select-none" 
                         onclick="toggleCategory(this)" data-category-id="uncat-text">
                        <i class="fas fa-chevron-down w-3 mr-1"></i>
                        <span class="uppercase tracking-wide">Text Channels</span>
                    </div>
                    
                    <div class="space-y-1" id="category-uncat-text-channels">
                        <?php foreach ($uncatTextChannels as $channel): 
                            $isActive = $channel['id'] == $activeChannelId;
                        ?>
                            <a href="/server/<?php echo $currentServerId; ?>?channel=<?php echo $channel['id']; ?>" 
                               class="channel-item flex items-center px-2 py-1 ml-2 rounded group <?php echo $isActive ? 'bg-discord-light text-white active' : 'text-gray-400 hover:bg-discord-light/50 hover:text-gray-300'; ?>"
                               data-channel-id="<?php echo $channel['id']; ?>">
                                <i class="fas fa-hashtag w-4 text-sm"></i>
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
            <?php endif; ?>
            
            <?php if (!empty($uncatVoiceChannels)): ?>
                <div class="space-y-1 mt-2">
                    <div class="flex items-center text-xs font-semibold text-gray-400 hover:text-gray-300 cursor-pointer px-1 py-1.5 select-none" 
                         onclick="toggleCategory(this)" data-category-id="uncat-voice">
                        <i class="fas fa-chevron-down w-3 mr-1"></i>
                        <span class="uppercase tracking-wide">Voice Channels</span>
                    </div>
                    
                    <div class="space-y-1" id="category-uncat-voice-channels">
                        <?php foreach ($uncatVoiceChannels as $channel): 
                            $isActive = $channel['id'] == $activeChannelId;
                        ?>
                            <a href="/server/<?php echo $currentServerId; ?>?channel=<?php echo $channel['id']; ?>" 
                               class="channel-item flex items-center px-2 py-1 ml-2 rounded group <?php echo $isActive ? 'bg-discord-light text-white active' : 'text-gray-400 hover:bg-discord-light/50 hover:text-gray-300'; ?>"
                               data-channel-id="<?php echo $channel['id']; ?>">
                                <i class="fas fa-volume-high w-4 text-sm"></i>
                                <span class="ml-1 truncate"><?php echo htmlspecialchars($channel['name']); ?></span>
                                <div class="ml-auto hidden group-hover:flex">
                                    <button class="text-gray-500 hover:text-gray-300 p-1">
                                        <i class="fas fa-cog text-xs"></i>
                                    </button>
                                </div>
                            </a>
                        <?php endforeach; ?>
                    </div>
                </div>
            <?php endif; ?>
        <?php endif; ?>
    <?php else: ?>
        <!-- No channels found -->
        <div class="text-center p-4">
            <div class="text-gray-500 text-sm">No channels found.</div>
            
            <?php if (isset($_SESSION['user_id'])): ?>
                <button class="mt-2 text-xs text-white bg-discord-blurple hover:bg-discord-blurple/90 px-3 py-1 rounded">
                    Create Channel
                </button>
            <?php endif; ?>
        </div>
    <?php endif; ?>
</div>

<script>
function toggleCategory(element) {
    const categoryId = element.getAttribute('data-category-id');
    const channelsContainer = document.getElementById(`category-${categoryId}-channels`);
    
    if (!channelsContainer) {
        console.error(`Could not find container for category ${categoryId}`);
        return;
    }
    
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

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        if (window.LazyLoader) {
            window.LazyLoader.triggerDataLoaded('channel-list', <?php echo empty($channels) ? 'true' : 'false'; ?>);
        }
    }, 600);
});
</script>
