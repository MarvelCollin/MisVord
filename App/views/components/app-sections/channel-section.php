<?php
if (!isset($currentServer) || empty($currentServer)) {
    echo '<div class="p-4 text-gray-400 text-center">No server loaded</div>';
    return;
}

$currentServerId = $currentServer->id ?? 0;
$activeChannelId = $GLOBALS['activeChannelId'] ?? null;
$channels = $GLOBALS['serverChannels'] ?? [];
$categories = $GLOBALS['serverCategories'] ?? [];

function getChannelIcon($type) {
    return match(strtolower($type ?? 'text')) {
        'voice' => 'volume-high',
        'announcement' => 'bullhorn', 
        'forum' => 'users',
        default => 'hashtag'
    };
}

function renderChannel($channel, $activeChannelId) {
    $type = $channel['type'] ?? 'text';
    $icon = getChannelIcon($type);
    $isActive = $activeChannelId == $channel['id'];
    $activeClass = $isActive ? 'bg-discord-lighten text-white' : '';
    
    echo '<div class="channel-item flex items-center py-2 px-3 rounded cursor-pointer text-gray-400 hover:text-gray-300 hover:bg-discord-lighten ' . $activeClass . '" 
              data-channel-id="' . $channel['id'] . '" 
              data-channel-type="' . htmlspecialchars($type) . '">';
    echo '  <i class="fas fa-' . $icon . ' text-xs mr-3 text-gray-500"></i>';
    echo '  <span class="text-sm">' . htmlspecialchars($channel['name']) . '</span>';
    if ($type === 'voice') {
        echo '  <span class="ml-auto text-xs text-gray-500">0</span>';
    }
    echo '</div>';
}

function renderChannelSkeleton($count = 1, $extraClass = '') {
    for ($i = 0; $i < $count; $i++) {
        echo '<div class="flex items-center py-2 px-3 ' . $extraClass . '">';
        echo '  <div class="h-3 w-3 bg-gray-700 rounded-sm mr-3 animate-pulse"></div>';
        echo '  <div class="h-4 bg-gray-700 rounded w-' . rand(16, 32) . ' animate-pulse"></div>';
        echo '</div>';
    }
}

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
?>

<div class="channel-wrapper h-full w-full overflow-y-auto">
    <div class="channel-skeleton p-2 skeleton-loader">
        <div class="h-6 bg-gray-700 rounded w-32 mb-6 mx-auto animate-pulse"></div>
        
        <div class="mb-4">
            <div class="h-5 bg-gray-700 rounded w-32 mb-3 mx-2 animate-pulse"></div>
            <?php renderChannelSkeleton(3); ?>
        </div>
        
        <div class="mb-3">
            <div class="h-5 bg-gray-700 rounded w-24 mb-3 mx-2 animate-pulse"></div>
            <?php renderChannelSkeleton(2); ?>
        </div>
        
        <?php renderCategorySkeleton(2); ?>
    </div>

    <div class="channel-list p-2 hidden" data-server-id="<?php echo $currentServerId; ?>">
        <input type="hidden" id="current-server-id" value="<?php echo $currentServerId; ?>">
        
        <?php
        $uncategorizedChannels = array_filter($channels, function($ch) {
            return !isset($ch['category_id']) || $ch['category_id'] === null || $ch['category_id'] === '';
        });

        if (!empty($uncategorizedChannels)):
            $textChannels = array_filter($uncategorizedChannels, function($ch) {
                return ($ch['type'] ?? 'text') === 'text';
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
            
            if (!empty($voiceChannels)):
        ?>
        <div class="voice-channels-section group">
            <?php foreach ($voiceChannels as $channel): ?>
                <?php renderChannel($channel, $activeChannelId); ?>
            <?php endforeach; ?>
        </div>
        <?php endif; ?>
        <?php endif; ?>

        <?php if (empty($channels)): ?>
        <div class="p-4 text-gray-400 text-center text-sm">No channels available</div>
        <?php endif; ?>
    </div>
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
</style>

<script>
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        const skeleton = document.querySelector('.channel-skeleton');
        const channelList = document.querySelector('.channel-list');
        
        if (skeleton && channelList) {
            skeleton.classList.add('hidden');
            channelList.classList.remove('hidden');
        }
    }, 800);
    
    // Add a global function to handle voice channel clicks
    window.handleVoiceChannelClick = function(channelId) {
        // Set a flag to indicate we want to auto-join this voice channel
        localStorage.setItem('autoJoinVoiceChannel', channelId);
        console.log('Voice channel selected, auto-join set:', channelId);
        
        // Force auto-join flag to persist
        sessionStorage.setItem('forceAutoJoin', 'true');
    };
    
    const channelItems = document.querySelectorAll('.channel-item');
    
    channelItems.forEach(item => {
        // Remove existing click event listeners if any
        const clone = item.cloneNode(true);
        item.parentNode.replaceChild(clone, item);
        
        // Add click event handlers directly here for voice channels
        if (clone.getAttribute('data-channel-type') === 'voice') {
            clone.addEventListener('click', function(e) {
                const channelId = clone.getAttribute('data-channel-id');
                window.handleVoiceChannelClick(channelId);
            });
        }
    });
    
    // Let the server-page.js handle the other channel click events
    // The event listeners are set up in initializeChannelClickHandlers()
});

// Create a global helper function to attempt auto-joining voice
window.attemptAutoJoinVoice = function() {
    const autoJoinChannelId = localStorage.getItem('autoJoinVoiceChannel');
    const currentChannelId = document.querySelector('[data-channel-id]')?.getAttribute('data-channel-id');
    
    if (autoJoinChannelId && autoJoinChannelId === currentChannelId) {
        console.log('Attempting to auto-join voice channel:', autoJoinChannelId);
        const joinBtn = document.getElementById('joinBtn');
        
        if (joinBtn) {
            joinBtn.click();
            localStorage.removeItem('autoJoinVoiceChannel'); // Clear the flag after joining
        } else {
            // If join button is not found, try again after a short delay
            setTimeout(() => {
                const retryJoinBtn = document.getElementById('joinBtn');
                if (retryJoinBtn) {
                    retryJoinBtn.click();
                }
                localStorage.removeItem('autoJoinVoiceChannel');
            }, 800);
        }
    }
};

// Listen for channel content loaded events
document.addEventListener('channelContentLoaded', function(e) {
    // When a channel is loaded, check if we need to auto-join voice
    window.attemptAutoJoinVoice();
});

function openCreateChannelModal(type = 'text') {
    console.log('Create channel modal:', type);
}

function toggleChannelLoading(loading = true) {
    const channelWrapper = document.querySelector('.channel-wrapper');
    if (!channelWrapper) return;
    
    const skeleton = channelWrapper.querySelector('.channel-skeleton');
    const channelList = channelWrapper.querySelector('.channel-list');
    
    if (loading) {
        if (skeleton) skeleton.classList.remove('hidden');
        if (channelList) channelList.classList.add('hidden');
    } else {
        if (skeleton) skeleton.classList.add('hidden');
        if (channelList) channelList.classList.remove('hidden');
    }
}

window.toggleChannelLoading = toggleChannelLoading;
</script>