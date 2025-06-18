<?php
if (!isset($currentServer) || empty($currentServer)) {
    return;
}

$currentServerId = $currentServer->id ?? 0;
$currentUserId = $_SESSION['user_id'] ?? 0;
$activeChannelId = $_GET['channel'] ?? null;

$channels = $GLOBALS['serverChannels'] ?? [];
$categories = $GLOBALS['serverCategories'] ?? [];

$debugMode = isset($_GET['debug']) && $_GET['debug'] === 'true';
if ($debugMode) {
    echo '<div style="background-color: #111; color: #0f0; padding: 10px; margin: 10px; border: 1px solid #0f0; font-family: monospace; font-size: 12px; position: fixed; top: 10px; left: 10px; z-index: 9999; max-width: 90%; max-height: 80%; overflow: auto;">';
    echo '<h3>Channel Debug Info:</h3>';
    echo '<h4>Channels Count:</h4>';
    echo '<p>Total channels: ' . count($channels) . '</p>';
    echo '<h4>Categories Count:</h4>';
    echo '<p>Total categories: ' . count($categories) . '</p>';
    echo '<button onclick="this.parentNode.style.display=\'none\'" style="background: #333; color: white; border: none; padding: 5px 10px; margin-top: 10px; cursor: pointer;">Close Debug Panel</button>';
    echo '</div>';
}

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

    if (isset($channel['type_name']) && !empty($channel['type_name'])) {
        $typeName = strtolower(trim($channel['type_name']));
        if (in_array($typeName, ['text', 'voice', 'category', 'announcement', 'forum'])) {
            return $typeName;
        }
    }

    if (isset($channel['type'])) {
        $type = $channel['type'];

        if (is_string($type)) {
            $typeStr = strtolower(trim($type));
            if (in_array($typeStr, ['text', 'voice', 'category', 'announcement', 'forum'])) {
                return $typeStr;
            }
        }

        if (is_numeric($type)) {
            switch ((int)$type) {
                case 1: return 'text';
                case 2: return 'voice';
                case 3: return 'category';
                case 4: return 'announcement';
                case 5: return 'forum';
            }
        }
    }

    return 'text';
}

function getChannelIcon($channelType) {

    switch (strtolower(trim($channelType))) {
        case 'voice':
            return 'volume-high';
        case 'announcement':
            return 'bullhorn';
        case 'forum':
            return 'users';
        case 'category':
            return 'folder';
        case 'text':
        default:
            return 'hashtag';
    }
}
?>

<style>

#channel-loading {
    opacity: 1;
    transition: opacity 0.3s ease-in-out;
    position: absolute; 
    top: 0;
    left: 0;
    right: 0;
    background-color: #2f3136; 
    z-index: 10;
}

#channel-loading.hidden {
    opacity: 0;
    pointer-events: none;
}

.channel-item, 
.force-visible,
.channels-loaded .channel-item {
    display: flex !important;
    visibility: visible !important;
    opacity: 1 !important;
    pointer-events: auto !important;
}

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
                        <span class="drag-handle mr-1 opacity-40 hover:opacity-100"><i class="fas fa-grip-lines fa-xs"></i></span>
                        <i class="fas fa-chevron-down text-xs mr-1"></i>
                        <span class="font-semibold uppercase text-xs"><?php echo htmlspecialchars($category['name']); ?></span>
                    </div>
                    <div class="flex items-center space-x-1 text-gray-500">
                        <button class="hover:text-gray-300 text-xs" onclick="showAddChannelToCategory(<?php echo $category['id']; ?>)">
                            <i class="fas fa-plus"></i>
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
                         data-channel-id="<?php echo $channel['id']; ?>"
                         data-channel-type="<?php echo htmlspecialchars($channelType); ?>">
                        <div class="flex items-center w-full">
                            <span class="drag-handle mr-1 opacity-0 hover:opacity-50"><i class="fas fa-grip-lines fa-xs"></i></span>
                            <?php if ($channelIcon === 'hashtag'): ?>
                                <span class="channel-hash mr-1">#</span>
                            <?php else: ?>
                                <i class="fas fa-<?php echo $channelIcon; ?> channel-hash mr-1"></i>
                            <?php endif; ?>
                            <span class="channel-name text-sm truncate"><?php echo htmlspecialchars($channel['name']); ?></span>

                            <div class="ml-auto flex items-center">
                                <?php if (($channel['is_private'] ?? false) === true): ?>
                                    <i class="fas fa-lock text-xs mr-2" title="Private channel"></i>
                                <?php endif; ?>

                                <?php if ($channelType === 'voice'): ?>
                                    <span class="text-xs text-gray-500">0/99</span>
                                <?php endif; ?>
                            </div>
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
                     data-channel-id="<?php echo $channel['id']; ?>"
                     data-channel-type="<?php echo htmlspecialchars($channelType); ?>">
                    <div class="flex items-center w-full">
                        <span class="drag-handle mr-1 opacity-0 hover:opacity-50"><i class="fas fa-grip-lines fa-xs"></i></span>
                        <?php if ($channelIcon === 'hashtag'): ?>
                            <span class="channel-hash mr-1">#</span>
                        <?php else: ?>
                            <i class="fas fa-<?php echo $channelIcon; ?> channel-hash mr-1"></i>
                        <?php endif; ?>
                        <span class="channel-name text-sm truncate"><?php echo htmlspecialchars($channel['name']); ?></span>
                        <?php if (($channel['is_private'] ?? false) === true): ?>
                            <i class="fas fa-lock ml-auto text-xs" title="Private channel"></i>
                        <?php endif; ?>

                        <?php if ($channelType === 'voice'): ?>
                            <span class="ml-auto text-xs text-gray-500">0/99</span>
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
            </div>

            <div class="uncategorized-channels pl-2">
                <?php foreach ($textChannels as $channel): 
                    $isActive = $activeChannelId == $channel['id'];
                    $channelType = getChannelType($channel);
                    $channelIcon = getChannelIcon($channelType);
                ?>
                <div class="channel-item flex items-center justify-between py-1 px-2 rounded text-gray-400 hover:text-gray-300 hover:bg-discord-lighten <?php echo $isActive ? 'bg-discord-lighten text-white' : ''; ?>" 
                     data-channel-id="<?php echo $channel['id']; ?>"
                     data-channel-type="<?php echo htmlspecialchars($channelType); ?>">
                    <div class="flex items-center w-full">
                        <span class="drag-handle mr-1 opacity-40 hover:opacity-100"><i class="fas fa-grip-lines fa-xs"></i></span>
                        <?php if ($channelIcon === 'hashtag'): ?>
                            <span class="channel-hash mr-1">#</span>
                        <?php else: ?>
                            <i class="fas fa-<?php echo $channelIcon; ?> channel-hash mr-1"></i>
                        <?php endif; ?>
                        <span class="channel-name text-sm truncate"><?php echo htmlspecialchars($channel['name']); ?></span>
                        <?php if (($channel['is_private'] ?? false) === true): ?>
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
                     data-channel-id="<?php echo $channel['id']; ?>"
                     data-channel-type="<?php echo htmlspecialchars($channelType); ?>">
                    <div class="flex items-center w-full">
                        <span class="drag-handle mr-1 opacity-0 hover:opacity-50"><i class="fas fa-grip-lines fa-xs"></i></span>
                        <i class="fas fa-<?php echo $channelIcon; ?> channel-hash mr-1"></i>
                        <span class="channel-name text-sm truncate"><?php echo htmlspecialchars($channel['name']); ?></span>
                        <?php if (($channel['is_private'] ?? false) === true): ?>
                            <i class="fas fa-lock ml-auto text-xs" title="Private channel"></i>
                        <?php endif; ?>
                        <span class="ml-auto text-xs text-gray-500">0/99</span>
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

    const loadingIndicator = document.getElementById('channel-loading');
    const channelListContainer = document.querySelector('.channel-list-container');

    const serverId = document.querySelector('meta[name="server-id"]')?.getAttribute('content');
    if (!serverId) {

        if (loadingIndicator) loadingIndicator.classList.add('hidden');
        return;
    }

    if (window.LazyLoader) {
        channelListContainer.classList.add('lazy-loaded');
        channelListContainer.setAttribute('aria-busy', 'false');
    }

    let channelsInitialized = false;

    setTimeout(function() {
        if (typeof window.loadChannels === 'function') {
            initializeChannels(serverId);
        } else {

            document.addEventListener('channelLoaderLoaded', function() {
                initializeChannels(serverId);
            }, { once: true });

            setTimeout(function() {
                if (typeof window.loadChannels === 'function') {
                    initializeChannels(serverId);
                } else {

                    if (loadingIndicator) loadingIndicator.classList.add('hidden');
                }
            }, 2000);
        }
    }, 200);

    function initializeChannels(serverId) {
        if (channelsInitialized) return; 
        channelsInitialized = true;

        try {
            console.log('Initializing channels for server:', serverId);

            if (loadingIndicator) {
                loadingIndicator.classList.add('hidden');
            }

            document.querySelectorAll('.channel-item').forEach(item => {
                item.style.cssText = 'display: flex !important; visibility: visible !important; opacity: 1 !important; pointer-events: auto !important;';
            });

            if (channelListContainer) {
                channelListContainer.classList.add('channels-loaded');
            }
        } catch (error) {
            console.error('Error initializing channels:', error);

            if (loadingIndicator) loadingIndicator.classList.add('hidden');
        }
    }
});

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

    setTimeout(() => {
        const channelItems = channelsContainer.querySelectorAll('.channel-item');
        channelItems.forEach(item => {
            item.style.cssText = 'display: flex !important; visibility: visible !important; opacity: 1 !important; pointer-events: auto !important;';
        });
    }, 10);
}

document.addEventListener('DOMContentLoaded', function() {

    const channelListContainer = document.querySelector('.channel-list-container');
    const channelContent = document.querySelector('#channel-container');

    if (channelListContainer && channelContent) {

        const loadDelay = Math.floor(Math.random() * 400) + 500;        setTimeout(function() {
            if (window.LazyLoader && typeof window.LazyLoader.triggerDataLoaded === 'function') {

                const contentHtml = channelContent.innerHTML;

                window.LazyLoader.triggerDataLoaded('channel-list', false);
                console.log('Channel list loaded after ' + loadDelay + 'ms');

                setTimeout(function() {

                    if (!channelListContainer.querySelector('.channel-item')) {
                        const hiddenOriginalContent = channelListContainer.querySelector('.original-content');
                        if (hiddenOriginalContent) {
                            hiddenOriginalContent.remove();
                        }

                        channelListContainer.innerHTML += contentHtml;

                        if (typeof toggleCategory === 'function') {
                            document.querySelectorAll('[onclick*="toggleCategory"]').forEach(el => {
                                el.addEventListener('click', function() {
                                    const categoryId = this.getAttribute('data-category-id');
                                    toggleCategory(this);
                                });
                            });
                        }
                    }                }, 300); 
            } else {
                console.warn('LazyLoader.triggerDataLoaded not available yet');
            }
        }, loadDelay);
    }
});

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