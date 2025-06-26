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
    $activeClass = $isActive ? 'bg-discord-lighten text-white active-channel' : '';
    
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
    
    initializeChannelHandlers();
});

function initializeChannelHandlers() {
    const channelItems = document.querySelectorAll('.channel-item');
    
    channelItems.forEach(item => {
        const clone = item.cloneNode(true);
        item.parentNode.replaceChild(clone, item);
        
        clone.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const channelId = clone.getAttribute('data-channel-id');
            const channelType = clone.getAttribute('data-channel-type');
            const serverId = document.getElementById('current-server-id')?.value;
            
            if (!channelId || !serverId) {
                return;
            }
            
            handleChannelSwitch(serverId, channelId, channelType, clone);
        });
    });
}

async function handleChannelSwitch(serverId, channelId, channelType, clickedElement) {
    try {
        updateActiveChannelUI(clickedElement);
        addSwitchingIndicator(clickedElement);
        
        if (channelType !== 'voice' && (window.voiceState?.isConnected || window.voiceManager?.isConnected)) {
            if (window.videosdkMeeting && window.videoSDKManager) {
                window.videoSDKManager.leaveMeeting();
                window.videosdkMeeting = null;
            }
            
            if (window.voiceState) {
                window.voiceState.isConnected = false;
            }
            
            if (window.voiceManager) {
                window.voiceManager.isConnected = false;
            }
            
            window.dispatchEvent(new CustomEvent('voiceDisconnect'));
        }
        
        if (window.channelRenderer) {
            await window.channelRenderer.switchToChannel(serverId, channelId, channelType);
        } else {
            await loadChannelRenderer();
            if (window.channelRenderer) {
                await window.channelRenderer.switchToChannel(serverId, channelId, channelType);
            } else {
                throw new Error('Failed to load channel renderer');
            }
        }
        
        if (channelType === 'voice') {
            await autoJoinVoiceChannel(channelId);
        }
        
    } catch (error) {
        showChannelSwitchError(error.message);
        resetChannelUI();
    } finally {
        removeSwitchingIndicator(clickedElement);
    }
}

function updateActiveChannelUI(clickedElement) {
    document.querySelectorAll('.channel-item').forEach(ch => {
        ch.classList.remove('bg-discord-lighten', 'text-white', 'active-channel');
    });
    
    clickedElement.classList.add('bg-discord-lighten', 'text-white', 'active-channel');
}

function addSwitchingIndicator(element) {
    element.classList.add('switching');
    
    const indicator = document.createElement('span');
    indicator.className = 'channel-switch-indicator';
    element.appendChild(indicator);
}

function removeSwitchingIndicator(element) {
    element.classList.remove('switching');
    
    const indicator = element.querySelector('.channel-switch-indicator');
    if (indicator) {
        indicator.remove();
    }
}

function resetChannelUI() {
    document.querySelectorAll('.channel-item').forEach(ch => {
        ch.classList.remove('switching');
        const indicator = ch.querySelector('.channel-switch-indicator');
        if (indicator) {
            indicator.remove();
        }
    });
}

function showChannelSwitchError(message) {
    const mainContent = document.querySelector('.main-content-area');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="flex items-center justify-center h-full text-red-400">
                <div class="text-center">
                    <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                    <div class="text-lg font-semibold mb-2">Channel Switch Failed</div>
                    <div class="text-sm">${message}</div>
                    <button onclick="location.reload()" class="mt-4 bg-red-600 text-white px-4 py-2 rounded">
                        Reload Page
                    </button>
                </div>
            </div>
        `;
    }
}

async function autoJoinVoiceChannel(channelId) {
    const username = document.querySelector('meta[name="username"]')?.content || 'Anonymous';
    
    if (!channelId) {
        console.error('Auto join voice failed: No channel ID provided');
        showJoinView();
        throw new Error('No channel ID provided');
    }
    
    if (window.voiceState && window.voiceState.isConnected) {
        console.log('Already connected to voice, skipping');
        return;
    }
    
    if (window.videosdkMeeting) {
        console.log('VideoSDK meeting already exists, skipping');
        return;
    }
    
    showConnectingView();
    
    if (typeof VideoSDK === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://sdk.videosdk.live/js-sdk/0.2.7/videosdk.js';
        document.head.appendChild(script);
        await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
        });
    }
    
    if (!window.videoSDKManager) {
        const managerScript = document.createElement('script');
        managerScript.src = '/public/js/components/videosdk/videosdk.js?v=' + Date.now();
        document.head.appendChild(managerScript);
        await new Promise((resolve, reject) => {
            managerScript.onload = resolve;
            managerScript.onerror = reject;
        });
    }
    
    try {
        let meetingId = await getVoiceMeetingId(channelId);
        
        const authToken = await window.videoSDKManager.getAuthToken();
        window.videoSDKManager.init(authToken);
        
        window.videosdkMeeting = window.videoSDKManager.initMeeting({
            meetingId: meetingId,
            name: username,
            micEnabled: true,
            webcamEnabled: false
        });
        
        await window.videoSDKManager.joinMeeting();
        
        if (window.globalSocketManager && window.globalSocketManager.socket) {
            window.globalSocketManager.socket.emit('register-voice-meeting', {
                channelId: channelId,
                meetingId: meetingId,
                username: username
            });
        }
        
        window.dispatchEvent(new CustomEvent('voiceConnect', {
            detail: { meetingId: meetingId }
        }));
        
        if (window.voiceState) {
            window.voiceState.isConnected = true;
        }
        
        if (window.voiceManager) {
            window.voiceManager.isConnected = true;
        }
        
        showConnectedView();
        
    } catch (error) {
        console.error('Auto join voice failed:', error);
        showJoinView();
        throw error;
    }
}

async function getVoiceMeetingId(channelId) {
    return new Promise((resolve) => {
        if (!window.globalSocketManager || !window.globalSocketManager.socket) {
            createNewMeeting().then(resolve);
            return;
        }

        const socket = window.globalSocketManager.socket;
        const timeout = setTimeout(() => {
            socket.off('voice-meeting-info');
            createNewMeeting().then(resolve);
        }, 2000);

        socket.once('voice-meeting-info', (data) => {
            clearTimeout(timeout);
            if (data.channelId == channelId && data.meetingId && data.participantCount > 0) {
                resolve(data.meetingId);
            } else {
                createNewMeeting().then(resolve);
            }
        });

        socket.emit('check-voice-meeting', { channelId: channelId });

        async function createNewMeeting() {
            try {
                const newId = await window.videoSDKManager.createMeetingRoom();
                return newId || 'voice_fallback_' + Date.now();
            } catch {
                return 'voice_fallback_' + Date.now();
            }
        }
    });
}

function showJoinView() {
    const joinView = document.getElementById('joinView');
    const connectingView = document.getElementById('connectingView');
    const connectedView = document.getElementById('connectedView');
    const voiceControls = document.getElementById('voiceControls');
    
    if (joinView) joinView.classList.remove('hidden');
    if (connectingView) connectingView.classList.add('hidden');
    if (connectedView) connectedView.classList.add('hidden');
    if (voiceControls) voiceControls.classList.add('hidden');
}

function showConnectingView() {
    const joinView = document.getElementById('joinView');
    const connectingView = document.getElementById('connectingView');
    const connectedView = document.getElementById('connectedView');
    const voiceControls = document.getElementById('voiceControls');
    
    if (joinView) joinView.classList.add('hidden');
    if (connectingView) connectingView.classList.remove('hidden');
    if (connectedView) connectedView.classList.add('hidden');
    if (voiceControls) voiceControls.classList.add('hidden');
}

function showConnectedView() {
    const joinView = document.getElementById('joinView');
    const connectingView = document.getElementById('connectingView');
    const connectedView = document.getElementById('connectedView');
    const voiceControls = document.getElementById('voiceControls');
    
    if (joinView) joinView.classList.add('hidden');
    if (connectingView) connectingView.classList.add('hidden');
    if (connectedView) connectedView.classList.remove('hidden');
    if (voiceControls) voiceControls.classList.remove('hidden');
}

async function loadChannelRenderer() {
    return new Promise((resolve, reject) => {
        if (window.channelRenderer) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = '/public/js/api/channel-api.js?v=' + Date.now();
        script.onload = () => {
            setTimeout(() => {
                if (window.channelRenderer) {
                    resolve();
                } else {
                    reject(new Error('Channel renderer not initialized'));
                }
            }, 100);
        };
        script.onerror = () => reject(new Error('Failed to load channel API'));
        document.head.appendChild(script);
    });
}

window.autoJoinVoiceChannel = autoJoinVoiceChannel;
window.refreshChannelHandlers = function() {
    initializeChannelHandlers();
};
</script>