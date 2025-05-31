<?php
require_once __DIR__ . '/../../../controllers/ChannelController.php';

// Check for required server data
if (!isset($currentServer) || empty($currentServer)) {
    return;
}

$currentServerId = $currentServer->id ?? 0;
$currentUserId = $_SESSION['user_id'] ?? 0;
$activeChannelId = $_GET['channel'] ?? null;

// Debug mode flag
$debugMode = isset($_GET['debug']) && $_GET['debug'] === 'true';

// Get channel data
$channelController = new ChannelController();
$channelData = $channelController->getServerChannels($currentServerId);

$channels = $channelData['channels'] ?? [];
$categories = $channelData['categories'] ?? [];

// Debugging output for channel types
if ($debugMode) {
    echo '<div style="background-color: #111; color: #0f0; padding: 10px; margin: 10px; border: 1px solid #0f0; font-family: monospace; font-size: 12px; position: fixed; top: 10px; left: 10px; z-index: 9999; max-width: 90%; max-height: 80%; overflow: auto;">';
    echo '<h3>Channel Debug Info:</h3>';
    
    // Raw channel data
    echo '<h4>Raw Channel Data from DB:</h4>';
    echo '<pre>' . print_r($channels, true) . '</pre>';
    
    // Processed channel data
    echo '<h4>Processed Channel Types:</h4>';
    echo '<ul>';
    foreach ($channels as $channel) {
        $type = isset($channel['type']) ? $channel['type'] : 'undefined';
        $typeName = isset($channel['type_name']) ? $channel['type_name'] : 'undefined';
        $channelType = getChannelType($channel);
        $icon = getChannelIcon($channelType);
        
        echo '<li>';
        echo htmlspecialchars($channel['name']) . ' - ';
        echo 'DB type: [' . htmlspecialchars($type) . '] - ';
        echo 'type_name: [' . htmlspecialchars($typeName) . '] - ';
        echo 'Resolved type: [' . htmlspecialchars($channelType) . '] - ';
        echo 'Icon: [' . htmlspecialchars($icon) . ']';
        echo '</li>';
    }
    echo '</ul>';
    
    // Button to close debug panel
    echo '<button onclick="this.parentNode.style.display=\'none\'" style="background: #333; color: white; border: none; padding: 5px 10px; margin-top: 10px; cursor: pointer;">Close Debug Panel</button>';
    echo '</div>';
}

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
    // Debug output to help troubleshoot
    if (isset($_GET['debug_channel']) && $_GET['debug_channel'] == 'true') {
        echo '<pre style="background:#111;color:#0f0;padding:5px;position:fixed;top:50px;right:10px;z-index:9999;max-width:400px;font-size:10px;">';
        echo "Channel data for '{$channel['name']}':<br>";
        echo "type: " . (isset($channel['type']) ? $channel['type'] : 'undefined') . "<br>";
        echo "type_name: " . (isset($channel['type_name']) ? $channel['type_name'] : 'undefined') . "<br>";
        echo '</pre>';
    }
    
    // First check if it's a numeric type directly
    if (isset($channel['type']) && is_numeric($channel['type'])) {
        $numericType = intval($channel['type']);
        
        // Direct mapping for numeric types
        switch($numericType) {
            case 1: return 'text';
            case 2: return 'voice';
            case 3: return 'category';
            case 4: return 'announcement';
            // Default to text for unknown values
            default: return 'text';
        }
    }
    
    // Next check for explicit type_name field
    if (isset($channel['type_name'])) {
        $typeName = strtolower($channel['type_name']);
        // Direct mapping for type_name
        if ($typeName === 'voice') return 'voice';
        if ($typeName === 'text') return 'text';
        if ($typeName === 'announcement') return 'announcement';
        if ($typeName === 'forum') return 'forum';
    }
    
    // Then check for type field as string
    if (isset($channel['type'])) {
        // Force string comparison for consistency
        $type = strval($channel['type']);
        
        // Explicit check for text channels (type 1)
        if ($type === '1') {
            return 'text';
        }
        
        // Handle other types
        if ($type === '2') {
            return 'voice';
        }
        if ($type === '4') {
            return 'announcement';
        }
        if ($type === '15') {
            return 'forum';
        }
    }
    
    // Default to text channel if nothing else matches
    return 'text';
}

function getChannelIcon($channelType) {
    // First check if it's a numeric value
    if (is_numeric($channelType) || (is_string($channelType) && is_numeric(trim($channelType)))) {
        $numericType = intval($channelType);
        // Direct mapping for numeric types - BE VERY EXPLICIT HERE
        if ($numericType === 1) return 'hashtag'; // Text channel
        if ($numericType === 2) return 'volume-high'; // Voice channel
        if ($numericType === 3) return 'folder'; // Category
        if ($numericType === 4) return 'bullhorn'; // Announcement
        
        // Default to text channel
        return 'hashtag';
    }
    
    // Convert to lowercase string for consistent comparison if not numeric
    $channelType = strtolower(strval($channelType));
    
    // Explicit mapping for all types
    if ($channelType === 'voice' || $channelType === '2') {
        return 'volume-high';
    }
    
    if ($channelType === 'announcement' || $channelType === '4') {
        return 'bullhorn';
    }
    
    if ($channelType === 'forum' || $channelType === '15') {
        return 'users';
    }
    
    // Default to text channel for any other value including 'text' or '1'
    return 'hashtag';
}
?>

<style>
/* Handle visibility transitions */
#channel-loading {
    opacity: 1;
    transition: opacity 0.3s ease-in-out;
    position: absolute; /* Position over the channel list */
    top: 0;
    left: 0;
    right: 0;
    background-color: #2f3136; /* Discord background color */
    z-index: 10;
}

#channel-loading.hidden {
    opacity: 0;
    pointer-events: none;
}

/* Ensure channels are always visible with !important flags */
.channel-item, 
.force-visible,
.channels-loaded .channel-item {
    display: flex !important;
    visibility: visible !important;
    opacity: 1 !important;
    pointer-events: auto !important;
}

/* Ensure no other CSS can hide the channels once loaded */
.channels-loaded .channels-container:not(.hidden) {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    max-height: none !important;
    overflow: visible !important;
}
</style>

<!-- Channel container wrapper - always visible -->
<div class="channel-wrapper h-full w-full relative">
    <meta name="server-id" content="<?php echo $currentServerId; ?>">

    <!-- Channel list container with lazy loading -->
    <div class="channel-list-container space-y-0 overflow-y-auto scrollbar-thin scrollbar-thumb-discord-light scrollbar-track-transparent" data-lazyload="channel-list">
        <!-- Hidden input with server ID for JS -->
        <input type="hidden" id="current-server-id" value="<?php echo $currentServerId; ?>">
        
        <?php if (!empty($categories)): ?>
        <!-- Categories with their channels -->
        <div class="category-list">
            <?php foreach ($categories as $category): ?>
            <div class="category-item my-4" data-category-id="<?php echo $category['id']; ?>">
                <div class="category-header flex items-center justify-between text-gray-400 hover:text-gray-300 mb-1 px-1 py-1 rounded cursor-pointer">
                    <div class="flex items-center">
                        <span class="drag-handle hidden"><span class="drag-icon"></span></span>
                        <i class="fas fa-chevron-down text-xs mr-1"></i>
                        <span class="font-semibold uppercase text-xs"><?php echo htmlspecialchars($category['name']); ?></span>
                    </div>
                    <div class="flex items-center space-x-1 text-gray-500">
                        <button class="hover:text-gray-300 text-xs" onclick="showAddChannelToCategory(<?php echo $category['id']; ?>)">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="hover:text-gray-300 text-xs edit-category" data-category-id="<?php echo $category['id']; ?>">
                            <i class="fas fa-cog"></i>
                        </button>
                    </div>
                </div>
                
                <div class="category-channels pl-2">
                    <?php
                    $categoryChannels = array_filter($channels, function($ch) use ($category) {
                        return isset($ch['category_id']) && $ch['category_id'] == $category['id'];
                    });
                    
                    foreach ($categoryChannels as $channel):
                        $channelType = getChannelType($channel);
                        $channelIcon = getChannelIcon($channelType);
                        $isActive = $activeChannelId == $channel['id'];
                    ?>
                    <div class="channel-item flex items-center justify-between py-1 px-2 rounded text-gray-400 hover:text-gray-300 hover:bg-discord-lighten <?php echo $isActive ? 'bg-discord-lighten text-white' : ''; ?>" 
                         data-channel-id="<?php echo $channel['id']; ?>">
                        <div class="flex items-center w-full">
                            <?php if ($channelIcon === 'hashtag'): ?>
                                <span class="channel-hash mr-1">#</span>
                            <?php else: ?>
                                <i class="fas fa-<?php echo $channelIcon; ?> channel-hash mr-1"></i>
                            <?php endif; ?>
                            <span class="channel-name text-sm truncate"><?php echo htmlspecialchars($channel['name']); ?></span>
                            <?php if ($channel['is_private'] ?? false): ?>
                                <i class="fas fa-lock ml-auto text-xs" title="Private channel"></i>
                            <?php endif; ?>
                        </div>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
        
        <!-- Uncategorized channels -->
        <div class="my-4">
            <div class="text-gray-400 flex items-center justify-between mb-1 px-1">
                <div class="font-semibold uppercase text-xs">Channels</div>
                <button class="text-xs hover:text-gray-300" onclick="openCreateChannelModal()">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
            
            <div class="uncategorized-channels pl-2">
                <?php
                $uncategorizedChannels = array_filter($channels, function($ch) {
                    return !isset($ch['category_id']) || empty($ch['category_id']);
                });
                
                foreach ($uncategorizedChannels as $channel):
                    $channelType = getChannelType($channel);
                    $channelIcon = getChannelIcon($channelType);
                    $isActive = $activeChannelId == $channel['id'];
                ?>
                <div class="channel-item flex items-center justify-between py-1 px-2 rounded text-gray-400 hover:text-gray-300 hover:bg-discord-lighten <?php echo $isActive ? 'bg-discord-lighten text-white' : ''; ?>" 
                     data-channel-id="<?php echo $channel['id']; ?>">
                    <div class="flex items-center w-full">
                        <?php if ($channelIcon === 'hashtag'): ?>
                            <span class="channel-hash mr-1">#</span>
                        <?php else: ?>
                            <i class="fas fa-<?php echo $channelIcon; ?> channel-hash mr-1"></i>
                        <?php endif; ?>
                        <span class="channel-name text-sm truncate"><?php echo htmlspecialchars($channel['name']); ?></span>
                        <?php if ($channel['is_private'] ?? false): ?>
                            <i class="fas fa-lock ml-auto text-xs" title="Private channel"></i>
                        <?php endif; ?>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
        <?php else: ?>
        <!-- No categories, simple channel list -->
        <div class="my-4">
            <div class="text-gray-400 flex items-center justify-between mb-1 px-1">
                <div class="font-semibold uppercase text-xs">Text Channels</div>
                <button class="text-xs hover:text-gray-300" onclick="openCreateChannelModal()">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
            
            <div class="uncategorized-channels pl-2">
                <?php foreach ($textChannels as $channel): 
                    $isActive = $activeChannelId == $channel['id'];
                    $channelType = getChannelType($channel);
                    $channelIcon = getChannelIcon($channelType);
                ?>
                <div class="channel-item flex items-center justify-between py-1 px-2 rounded text-gray-400 hover:text-gray-300 hover:bg-discord-lighten <?php echo $isActive ? 'bg-discord-lighten text-white' : ''; ?>" 
                     data-channel-id="<?php echo $channel['id']; ?>">
                    <div class="flex items-center w-full">
                        <?php if ($channelIcon === 'hashtag'): ?>
                            <span class="channel-hash mr-1">#</span>
                        <?php else: ?>
                            <i class="fas fa-<?php echo $channelIcon; ?> channel-hash mr-1"></i>
                        <?php endif; ?>
                        <span class="channel-name text-sm truncate"><?php echo htmlspecialchars($channel['name']); ?></span>
                        <?php if ($channel['is_private'] ?? false): ?>
                            <i class="fas fa-lock ml-auto text-xs" title="Private channel"></i>
                        <?php endif; ?>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
        
        <?php if (!empty($voiceChannels)): ?>
        <div class="my-4">
            <div class="text-gray-400 flex items-center justify-between mb-1 px-1">
                <div class="font-semibold uppercase text-xs">Voice Channels</div>
                <button class="text-xs hover:text-gray-300" onclick="openCreateChannelModal('voice')">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
            
            <div class="voice-channels pl-2">
                <?php foreach ($voiceChannels as $channel): 
                    $isActive = $activeChannelId == $channel['id'];
                    $channelType = getChannelType($channel);
                    $channelIcon = getChannelIcon($channelType);
                ?>
                <div class="channel-item flex items-center justify-between py-1 px-2 rounded text-gray-400 hover:text-gray-300 hover:bg-discord-lighten <?php echo $isActive ? 'bg-discord-lighten text-white' : ''; ?>" 
                     data-channel-id="<?php echo $channel['id']; ?>">
                    <div class="flex items-center w-full">
                        <?php if ($channelIcon === 'hashtag'): ?>
                            <span class="channel-hash mr-1">#</span>
                        <?php else: ?>
                            <i class="fas fa-<?php echo $channelIcon; ?> channel-hash mr-1"></i>
                        <?php endif; ?>
                        <span class="channel-name text-sm truncate"><?php echo htmlspecialchars($channel['name']); ?></span>
                        <?php if ($channel['is_private'] ?? false): ?>
                            <i class="fas fa-lock ml-auto text-xs" title="Private channel"></i>
                        <?php endif; ?>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
        <?php endif; ?>
        
        <?php endif; ?>
    </div>
</div>

<!-- Server-side rendered channel list (hidden) -->
<div id="channel-container" class="hidden"></div>

<!-- Script to handle the channel lazy loading -->
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const loadingIndicator = document.getElementById('channel-loading');
    const channelListContainer = document.querySelector('.channel-list-container');
    
    // Get server ID
    const serverId = document.querySelector('meta[name="server-id"]')?.getAttribute('content');
    if (!serverId) {
        // No server ID, hide loading and show any fallback content
        if (loadingIndicator) loadingIndicator.classList.add('hidden');
        return;
    }
    
    // Tell LazyLoader this container is already handled
    if (window.LazyLoader) {
        channelListContainer.classList.add('lazy-loaded');
        channelListContainer.setAttribute('aria-busy', 'false');
    }
    
    // Keep track of initialization
    let channelsInitialized = false;
    
    // Initialize channels - with short delay to allow DOM to settle
    setTimeout(function() {
        if (typeof window.loadChannels === 'function') {
            initializeChannels(serverId);
        } else {
            // Wait for channel-loader.js to load
            document.addEventListener('channelLoaderLoaded', function() {
                initializeChannels(serverId);
            }, { once: true });
            
            // Backup timeout
            setTimeout(function() {
                if (typeof window.loadChannels === 'function') {
                    initializeChannels(serverId);
                } else {
                    // Loading failed, hide loader
                    if (loadingIndicator) loadingIndicator.classList.add('hidden');
                }
            }, 2000);
        }
    }, 200);
    
    function initializeChannels(serverId) {
        if (channelsInitialized) return; // Prevent duplicate initialization
        channelsInitialized = true;
        
        try {
            console.log('Initializing channels for server:', serverId);
            
            // With the simplified approach, we don't need to load channels via AJAX
            // Just hide the loading indicator
            if (loadingIndicator) {
                loadingIndicator.classList.add('hidden');
            }
            
            // Make sure all channel items are visible
            document.querySelectorAll('.channel-item').forEach(item => {
                item.style.cssText = 'display: flex !important; visibility: visible !important; opacity: 1 !important; pointer-events: auto !important;';
            });
            
            // Also ensure container has the right class
            if (channelListContainer) {
                channelListContainer.classList.add('channels-loaded');
            }
        } catch (error) {
            console.error('Error initializing channels:', error);
            // Hide loading indicator on error
            if (loadingIndicator) loadingIndicator.classList.add('hidden');
        }
    }
});

// Simple category toggle function
function toggleCategory(element) {
    const categoryId = element.getAttribute('data-category-id');
    const channelsContainer = document.getElementById(`category-${categoryId}-channels`);
    
    if (!channelsContainer) return;
    
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
    
    // Force all channels in the container to be visible after toggling
    setTimeout(() => {
        const channelItems = channelsContainer.querySelectorAll('.channel-item');
        channelItems.forEach(item => {
            item.style.cssText = 'display: flex !important; visibility: visible !important; opacity: 1 !important; pointer-events: auto !important;';
        });
    }, 10);
}

// Initialize channel list with LazyLoader
document.addEventListener('DOMContentLoaded', function() {
    // Handle lazy loading of channel list
    const channelListContainer = document.querySelector('.channel-list-container');
    const channelContent = document.querySelector('#channel-container');
    
    if (channelListContainer && channelContent) {
        // Simulate network request with a random delay between 500-900ms
        const loadDelay = Math.floor(Math.random() * 400) + 500;
        
        setTimeout(function() {
            if (window.LazyLoader) {
                // Get actual channel content
                const contentHtml = channelContent.innerHTML;
                
                // Trigger data loaded event
                window.LazyLoader.triggerDataLoaded('channel-list', false);
                console.log('Channel list loaded after ' + loadDelay + 'ms');
                
                // Move the content from hidden container to the visible one
                setTimeout(function() {
                    // Only move content if it wasn't already done by LazyLoader
                    if (!channelListContainer.querySelector('.channel-item')) {
                        const hiddenOriginalContent = channelListContainer.querySelector('.original-content');
                        if (hiddenOriginalContent) {
                            hiddenOriginalContent.remove();
                        }
                        
                        channelListContainer.innerHTML += contentHtml;
                        
                        // Initialize toggle functionality
                        if (typeof toggleCategory === 'function') {
                            document.querySelectorAll('[onclick*="toggleCategory"]').forEach(el => {
                                el.addEventListener('click', function() {
                                    const categoryId = this.getAttribute('data-category-id');
                                    toggleCategory(this);
                                });
                            });
                        }
                    }
                }, 300); // Wait for skeleton to fade out
            }
        }, loadDelay);
    }
});

// Toggle category function (if not defined elsewhere)
if (typeof window.toggleCategory !== 'function') {
    window.toggleCategory = function(element) {
        const categoryId = element.getAttribute('data-category-id');
        const channelsContainer = document.getElementById(`category-${categoryId}-channels`);
        
        if (!channelsContainer) return;
        
        const icon = element.querySelector('i');
        
        if (channelsContainer.classList.contains('hidden')) {
            channelsContainer.classList.remove('hidden');
            if (icon) icon.classList.replace('fa-chevron-right', 'fa-chevron-down');
        } else {
            channelsContainer.classList.add('hidden');
            if (icon) icon.classList.replace('fa-chevron-down', 'fa-chevron-right');
        }
    };
}
</script>
