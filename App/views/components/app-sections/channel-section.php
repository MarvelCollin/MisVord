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
?>

<div class="channel-wrapper h-full w-full overflow-y-auto">
    <div class="channel-list p-2" data-server-id="<?php echo $currentServerId; ?>">
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
    console.log('Channel section initialized');
    
    const channelItems = document.querySelectorAll('.channel-item');
    console.log('Found channels:', channelItems.length);
    
    channelItems.forEach(item => {
        item.addEventListener('click', function() {
            const channelId = this.getAttribute('data-channel-id');
            const channelType = this.getAttribute('data-channel-type'); 
            const serverId = document.querySelector('#current-server-id')?.value;
            
            channelItems.forEach(el => {
                el.classList.remove('bg-discord-lighten', 'text-white');
            });
            this.classList.add('bg-discord-lighten', 'text-white');
            
            if (channelId && serverId) {
                if (channelType === 'text') {
                    window.location.href = `/server/${serverId}?channel=${channelId}`;
                } else if (channelType === 'voice') {
                    window.location.href = `/server/${serverId}?channel=${channelId}&type=voice`;
                }
            }
        });
    });
});

function openCreateChannelModal(type = 'text') {
    console.log('Create channel modal:', type);
}
</script>