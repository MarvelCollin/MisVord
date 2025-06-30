<?php
$currentServer = $currentServer ?? $GLOBALS['currentServer'] ?? null;

if (!isset($currentServer) || empty($currentServer)) {
    error_log("[Channel Section] ERROR - No server loaded. currentServer: " . var_export($currentServer, true));
    error_log("[Channel Section] GLOBALS currentServer: " . var_export($GLOBALS['currentServer'] ?? 'not set', true));
    echo '<div class="p-4 text-gray-400 text-center">No server loaded</div>';
    return;
}

$currentServerId = $currentServer->id ?? 0;
$activeChannelId = $GLOBALS['activeChannelId'] ?? null;
$channels = $GLOBALS['serverChannels'] ?? [];
$categories = $GLOBALS['serverCategories'] ?? [];

error_log("[Channel Section] Data received - Server ID: " . $currentServerId . 
         ", Active Channel: " . ($activeChannelId ?? 'none') . 
         ", Channels: " . count($channels) . 
         ", Categories: " . count($categories));

if (!function_exists('getChannelIcon')) {
    function getChannelIcon($type) {
        return match(strtolower($type ?? 'text')) {
            'voice' => 'volume-high',
            'announcement' => 'bullhorn', 
            'forum' => 'users',
            default => 'hashtag'
        };
    }
}

if (!function_exists('renderChannel')) {
    function renderChannel($channel, $activeChannelId) {
    error_log("[Channel Section] Rendering channel: " . ($channel['name'] ?? 'unnamed') . " (ID: " . ($channel['id'] ?? 'no-id') . ")");
    
    $type = $channel['type'] ?? 'text';
    $icon = getChannelIcon($type);
    $isActive = $activeChannelId == $channel['id'];
    $activeClass = $isActive ? 'active-channel' : '';
    
    $serverId = $GLOBALS['currentServer']->id ?? ($GLOBALS['server']->id ?? '');
    
    echo '<div class="channel-item flex items-center py-2 px-3 rounded cursor-pointer text-gray-400 hover:text-gray-300 hover:bg-discord-lighten ' . $activeClass . ' group" 
              data-channel-id="' . $channel['id'] . '" 
              data-channel-name="' . htmlspecialchars($channel['name']) . '"
              data-channel-type="' . htmlspecialchars($type) . '"
              data-server-id="' . htmlspecialchars($serverId) . '">';
    echo '  <i class="fas fa-' . $icon . ' text-xs mr-3 text-gray-500"></i>';
    echo '  <span class="text-sm flex-1">' . htmlspecialchars($channel['name']) . '</span>';
    
    if ($type === 'voice') {
        echo '  <span class="ml-auto text-xs text-gray-500 voice-user-count">0</span>';
    }
    
    echo '  <div class="channel-menu relative ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">';
    echo '    <button class="channel-menu-btn text-gray-400 hover:text-white w-5 h-5 flex items-center justify-center rounded hover:bg-gray-600" data-channel-id="' . $channel['id'] . '">';
    echo '      <i class="fas fa-ellipsis-v text-xs"></i>';
    echo '    </button>';
    echo '    <div class="channel-dropdown hidden absolute right-0 top-6 w-32 bg-[#18191c] rounded-md shadow-lg z-50 py-1 text-sm">';
    echo '      <button class="edit-channel-btn flex items-center w-full px-3 py-2 text-gray-300 hover:bg-[#5865f2] hover:text-white" data-channel-id="' . $channel['id'] . '">';
    echo '        <i class="fas fa-edit w-4 text-center mr-2"></i>';
    echo '        <span>Edit</span>';
    echo '      </button>';
    echo '      <button class="delete-channel-btn flex items-center w-full px-3 py-2 text-red-400 hover:bg-red-600 hover:text-white" data-channel-id="' . $channel['id'] . '" data-channel-name="' . htmlspecialchars($channel['name']) . '">';
    echo '        <i class="fas fa-trash w-4 text-center mr-2"></i>';
    echo '        <span>Delete</span>';
    echo '      </button>';
    echo '    </div>';
    echo '  </div>';
    echo '</div>';
    }
}

if (!function_exists('renderChannelSkeleton')) {
    function renderChannelSkeleton($count = 1, $extraClass = '') {
        for ($i = 0; $i < $count; $i++) {
            echo '<div class="flex items-center py-2 px-3 ' . $extraClass . '">';
            echo '  <div class="h-3 w-3 bg-gray-700 rounded-sm mr-3 animate-pulse"></div>';
            echo '  <div class="h-4 bg-gray-700 rounded w-' . rand(16, 32) . ' animate-pulse"></div>';
            echo '</div>';
        }
    }
}

if (!function_exists('renderCategorySkeleton')) {
    function renderCategorySkeleton($count = 1) {
        for ($i = 0; $i < $count; $i++) {
            echo '<div class="mb-3">';
            echo '  <div class="flex items-center px-3 py-1 mb-1">';
            echo '    <div class="h-4 bg-gray-700 rounded w-24 animate-pulse"></div>';
            echo '    <div class="ml-auto h-3 w-3 bg-gray-700 rounded-sm animate-pulse"></div>';
            echo '  </div>';
            renderChannelSkeleton(rand(2, 4), 'ml-2');
            echo '</div>';
        }
    }
}
?>

<div class="w-60 bg-discord-dark flex flex-col h-full border-r border-gray-800">
    <div class="h-12 border-b border-black flex items-center px-4 shadow-sm relative">
        <h2 class="font-bold text-white truncate flex-1"><?php echo htmlspecialchars(is_array($currentServer) ? ($currentServer['name'] ?? 'Server') : ($currentServer->name ?? 'Server')); ?></h2>
        <button id="server-dropdown-btn" class="text-gray-400 hover:text-white focus:outline-none w-5 h-5 flex items-center justify-center">
            <i class="fas fa-chevron-down text-sm"></i>
        </button>
        
        <div id="server-dropdown" class="hidden absolute right-2 top-12 w-56 bg-[#18191c] rounded-md shadow-lg z-50 py-2 text-gray-100 text-sm overflow-hidden">
            <div class="server-dropdown-item flex items-center px-3 py-2 hover:bg-[#5865f2] cursor-pointer text-gray-300 hover:text-white">
                <i class="fas fa-user-plus w-5 text-center mr-2.5 text-gray-300 group-hover:text-white"></i>
                <span>Invite People</span>
            </div>
            
            <div class="server-dropdown-item flex items-center px-3 py-2 hover:bg-[#5865f2] cursor-pointer text-gray-300 hover:text-white">
                <i class="fas fa-cog w-5 text-center mr-2.5 text-gray-300 group-hover:text-white"></i>
                <span>Server Settings</span>
            </div>
            
            <div class="server-dropdown-item flex items-center px-3 py-2 hover:bg-[#5865f2] cursor-pointer text-gray-300 hover:text-white">
                <i class="fas fa-plus-circle w-5 text-center mr-2.5 text-gray-300 group-hover:text-white"></i>
                <span>Create Channel</span>
            </div>
            
            <div class="server-dropdown-item flex items-center px-3 py-2 hover:bg-[#5865f2] cursor-pointer text-gray-300 hover:text-white">
                <i class="fas fa-folder-plus w-5 text-center mr-2.5 text-gray-300 group-hover:text-white"></i>
                <span>Create Category</span>
            </div>
            
            <div class="border-t border-gray-700 my-1"></div>
            
            <div class="server-dropdown-item flex items-center px-3 py-2 hover:bg-[#5865f2] cursor-pointer text-red-400 hover:text-white">
                <i class="fas fa-sign-out-alt w-5 text-center mr-2.5 text-red-400 group-hover:text-white"></i>
                <span>Leave Server</span>
            </div>
        </div>
    </div>

<div class="channel-wrapper flex-1 overflow-y-auto">
    <div class="channel-list p-2" data-server-id="<?php echo $currentServerId; ?>">
        <input type="hidden" id="current-server-id" value="<?php echo $currentServerId; ?>">
        <input type="hidden" id="active-channel-id" value="<?php echo $activeChannelId; ?>">
        
        <?php
        error_log("[Channel Section] Processing channels - Total: " . count($channels));
        
        $uncategorizedChannels = array_filter($channels, function($ch) {
            return !isset($ch['category_id']) || $ch['category_id'] === null || $ch['category_id'] === '';
        });
        
        usort($uncategorizedChannels, function($a, $b) {
            return ($a['position'] ?? 0) <=> ($b['position'] ?? 0);
        });
        
        error_log("[Channel Section] Uncategorized channels: " . count($uncategorizedChannels));

        if (!empty($uncategorizedChannels)):
            $textChannels = array_filter($uncategorizedChannels, function($ch) {
                return ($ch['type'] ?? 'text') === 'text';
            });
            
            usort($textChannels, function($a, $b) {
                return ($a['position'] ?? 0) <=> ($b['position'] ?? 0);
            });
            
            error_log("[Channel Section] Text channels: " . count($textChannels));
            if (!empty($textChannels)) {
                error_log("[Channel Section] Rendering text channels: " . json_encode(array_column($textChannels, 'name')));
            }
            
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
        <?php error_log("[Channel Section] No channels found - showing 'No channels available' message"); ?>
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

<?php if (isset($_GET['debug'])): ?>
<div style="position:fixed;top:10px;right:10px;background:#000;color:#0f0;padding:10px;font-size:12px;max-width:300px;z-index:9999;border:1px solid #0f0;">
    <strong>Debug Info:</strong><br>
    Channels: <?php echo count($channels); ?><br>
    Categories: <?php echo count($categories); ?><br>
    Server ID: <?php echo $currentServerId; ?><br>
    Active Channel: <?php echo $activeChannelId ?? 'none'; ?><br>
    <pre style="font-size:10px;max-height:200px;overflow:auto;"><?php echo htmlspecialchars(json_encode($channels, JSON_PRETTY_PRINT)); ?></pre>
    <button onclick="this.parentNode.style.display='none'" style="background:#333;color:white;border:none;padding:2px 5px;margin-top:5px;">Close</button>
</div>
<?php endif; ?>

<style>
.channel-item {
    transition: all 0.15s ease;
    border-radius: 4px;
}

.channel-item:hover {
    background-color: rgba(79, 84, 92, 0.16) !important;
}

.group:hover .opacity-0 {
    opacity: 1 !important;
}

.channel-item.switching {
    opacity: 0.6;
    pointer-events: none;
}

.channel-switch-indicator {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid #ffffff;
    border-radius: 50%;
    border-top-color: transparent;
    animation: spin 1s linear infinite;
    margin-left: 8px;
}

@keyframes spin {
    to { transform: rotate(360deg); }
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

.channel-item.dragging {
    opacity: 0.5 !important;
    transform: rotate(2deg);
    z-index: 1000;
}

.category-section.drag-over {
    background-color: rgba(88, 101, 242, 0.1);
    border: 2px dashed rgba(88, 101, 242, 0.3);
    border-radius: 8px;
}

.category-section.drop-zone-active {
    background-color: rgba(88, 101, 242, 0.05);
    border-radius: 8px;
    transition: background-color 0.2s ease;
}

.channel-list.uncategorized-drop-zone-active {
    background-color: rgba(88, 101, 242, 0.02);
    border-radius: 8px;
}

.drop-indicator {
    height: 2px;
    margin: 2px 0;
    pointer-events: none;
}

.drop-line {
    height: 100%;
    background: linear-gradient(90deg, #5865f2, #7983f5);
    border-radius: 1px;
    opacity: 0.8;
    animation: dropPulse 1s ease-in-out infinite alternate;
}

@keyframes dropPulse {
    from { opacity: 0.5; transform: scaleY(0.8); }
    to { opacity: 1; transform: scaleY(1.2); }
}

.drag-handle {
    display: flex;
    align-items: center;
    padding: 2px;
    border-radius: 3px;
    transition: all 0.15s ease;
}

.drag-handle:hover {
    background-color: rgba(79, 84, 92, 0.3);
}

.category-drag-handle {
    display: flex;
    align-items: center;
    padding: 2px;
    border-radius: 3px;
    transition: all 0.15s ease;
}

.category-drag-handle:hover {
    background-color: rgba(79, 84, 92, 0.3);
}

.group:hover .drag-handle,
.group:hover .category-drag-handle {
    opacity: 1;
}

.channel-item:hover .drag-handle {
    opacity: 1;
}

.cursor-grab {
    cursor: grab;
}

.cursor-grabbing {
    cursor: grabbing;
}

.channel-menu {
    z-index: 1000;
}

.channel-dropdown {
    z-index: 1001;
}

@media (max-width: 768px) {
    .drag-handle,
    .category-drag-handle {
        opacity: 1;
    }
}
</style>

<script>
document.addEventListener('DOMContentLoaded', function() {
    initChannelMenus();
    checkUserRoleAndUpdateMenus();
});

async function checkUserRoleAndUpdateMenus() {
    try {
        const serverId = document.getElementById('current-server-id')?.value;
        if (!serverId) return;
        
        if (typeof window.getUserRole === 'function') {
            const role = await window.getUserRole(serverId);
            updateChannelMenuVisibility(role);
        } else {
            console.warn('getUserRole function not available');
        }
    } catch (error) {
        console.error('Error checking user role:', error);
    }
}

function updateChannelMenuVisibility(role) {
    const isAdminOrOwner = role === 'admin' || role === 'owner';
    const channelMenus = document.querySelectorAll('.channel-menu');
    
    channelMenus.forEach(menu => {
        if (isAdminOrOwner) {
            menu.style.display = 'block';
        } else {
            menu.style.display = 'none';
        }
    });
}

function initChannelMenus() {
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.channel-menu')) {
            closeAllChannelDropdowns();
        }
    });

    document.querySelectorAll('.channel-menu-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const dropdown = this.parentElement.querySelector('.channel-dropdown');
            const isOpen = !dropdown.classList.contains('hidden');
            
            closeAllChannelDropdowns();
            
            if (!isOpen) {
                dropdown.classList.remove('hidden');
            }
        });
    });

    document.querySelectorAll('.edit-channel-btn').forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const channelId = this.getAttribute('data-channel-id');
            const channelItem = document.querySelector(`[data-channel-id="${channelId}"]`);
            
            if (!channelItem) return;
            
            const channelData = {
                name: channelItem.getAttribute('data-channel-name'),
                type: channelItem.getAttribute('data-channel-type'),
                category_id: null 
            };
            
            closeAllChannelDropdowns();
            
            if (typeof window.openEditChannelModal === 'function') {
                window.openEditChannelModal(channelId, channelData);
            }
        });
    });

    document.querySelectorAll('.delete-channel-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const channelId = this.getAttribute('data-channel-id');
            const channelName = this.getAttribute('data-channel-name');
            
            closeAllChannelDropdowns();
            
            if (typeof window.openDeleteChannelModal === 'function') {
                window.openDeleteChannelModal(channelId, channelName);
            }
        });
    });
}

function closeAllChannelDropdowns() {
    document.querySelectorAll('.channel-dropdown').forEach(dropdown => {
        dropdown.classList.add('hidden');
    });
}

function initChannelClicks() {
    document.querySelectorAll('.channel-item').forEach(item => {
        item.addEventListener('click', function(e) {
            if (e.target.closest('.channel-menu')) {
                return;
            }
            
            const channelId = this.getAttribute('data-channel-id');
            const serverId = this.getAttribute('data-server-id');
            const channelType = this.getAttribute('data-channel-type');
            
            if (channelId && serverId) {
                if (typeof window.channelAPI?.switchToChannel === 'function') {
                    window.channelAPI.switchToChannel(serverId, channelId, channelType);
                } else {
                    window.location.href = `/server/${serverId}?channel=${channelId}`;
                }
            }
        });
    });
}

document.addEventListener('channelListUpdated', function() {
    initChannelMenus();
    initChannelClicks();
    checkUserRoleAndUpdateMenus();
});

initChannelClicks();

window.refreshChannelMenus = function() {
    initChannelMenus();
    initChannelClicks();
    checkUserRoleAndUpdateMenus();
};

console.log('✅ Channel menu system initialized');
</script>