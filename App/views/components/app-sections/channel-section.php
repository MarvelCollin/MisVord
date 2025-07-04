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
        <h2 class="font-bold text-white flex-1"><?php echo htmlspecialchars(is_array($currentServer) ? ($currentServer['name'] ?? 'Server') : ($currentServer->name ?? 'Server')); ?></h2>
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
        <div class="channels-section group" data-section-type="text" data-server-id="<?php echo $currentServerId; ?>">
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
        <div class="voice-channels-section group" data-section-type="voice" data-server-id="<?php echo $currentServerId; ?>">
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
                    <div class="category-header flex items-center px-3 py-1 mb-1 cursor-pointer group transition-all duration-200" 
                         data-category-id="<?php echo $category['id']; ?>">
                        <i class="fas fa-chevron-down text-xs mr-1 text-gray-500"></i>
                        <span class="text-xs font-semibold uppercase text-gray-400"><?php echo htmlspecialchars($category['name']); ?></span>
                    </div>
                    <div class="category-channels ml-2" data-category-id="<?php echo $category['id']; ?>">
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

.voice-participants {
    margin-left: 1.5rem;
    margin-bottom: 0.5rem;
    border-radius: 0.375rem;
    background-color: rgba(79, 84, 92, 0.12);
    padding: 0.25rem;
    transition: all 0.2s ease;
    min-height: 20px;
    border: 1px solid rgba(79, 84, 92, 0.2);
}

.voice-participants:hover {
    background-color: rgba(79, 84, 92, 0.20);
}

.voice-participants .user-avatar {
    transition: transform 0.2s ease;
}

.voice-participants .user-avatar:hover {
    transform: scale(1.1);
}

.voice-participants > div:hover {
    background-color: rgba(79, 84, 92, 0.3);
    border-radius: 0.25rem;
}

.voice-participants .text-sm {
    font-weight: 500;
    max-width: 8rem;
}

.voice-participants .relative::after {
    content: '';
    position: absolute;
    bottom: -1px;
    right: -1px;
    width: 8px;
    height: 8px;
    background-color: #313338;
    border-radius: 50%;
    z-index: 1;
}

.voice-participants .bg-discord-green {
    z-index: 2;
}

.voice-user-count.flex {
    align-items: center;
    justify-content: flex-end;
    min-height: 20px;
}

.voice-user-count .w-5 {
    border: 2px solid #313338;
    transition: transform 0.2s ease;
}

.voice-user-count .w-5:hover {
    transform: scale(1.1);
    z-index: 20 !important;
}

.voice-user-count .relative:not(:first-child) {
    margin-left: -6px;
}

.voice-user-count img {
    transition: all 0.2s ease;
}

.voice-user-count .text-xs {
    font-weight: 500;
    line-height: 1;
}
</style>

<script src="/public/js/utils/channel-voice-participants.js"></script>

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
    
    window.testVoiceParticipants = function() {

        
        if (!window.ChannelVoiceParticipants) {
            console.error('[VOICE-PARTICIPANT] ChannelVoiceParticipants not loaded');
            return;
        }
        
        const manager = window.ChannelVoiceParticipants.getInstance();
        if (!manager) {
            console.error('[VOICE-PARTICIPANT] Failed to get manager instance');
            return;
        }
        
        const voiceChannels = document.querySelectorAll('[data-channel-type="voice"]');

        
        voiceChannels.forEach((channel, index) => {
            const channelId = channel.getAttribute('data-channel-id');
            const channelName = channel.getAttribute('data-channel-name');

            
            const participantContainer = document.querySelector(`.voice-participants[data-channel-id="${channelId}"]`);

            
            if (participantContainer) {


            }
        });
        
        if (window.globalSocketManager?.isReady()) {

            voiceChannels.forEach(channel => {
                const channelId = channel.getAttribute('data-channel-id');
                window.globalSocketManager.io.emit('check-voice-meeting', { channel_id: channelId });
            });
        } else {
            console.warn('[VOICE-PARTICIPANT] Socket not ready');
        }
        

    };
    
    window.addTestVoiceParticipant = function(channelId, userId, username) {

        
        if (!window.ChannelVoiceParticipants) {
            console.error('[VOICE-PARTICIPANT] ChannelVoiceParticipants not loaded');
            return;
        }
        
        const manager = window.ChannelVoiceParticipants.getInstance();
        if (!manager) {
            console.error('[VOICE-PARTICIPANT] Failed to get manager instance');
            return;
        }
        
        manager.addParticipant(channelId, userId, username);
        manager.updateParticipantContainer(channelId);
        

    };
    
    window.listVoiceParticipantContainers = function() {

        
        const containers = document.querySelectorAll('.voice-participants');

        
        containers.forEach((container, index) => {
            const channelId = container.getAttribute('data-channel-id');
            const isHidden = container.classList.contains('hidden');
            const displayStyle = container.style.display;
            
            console.log(`[VOICE-PARTICIPANT] Container ${index + 1}:`, {
                channelId: channelId,
                hidden: isHidden,
                display: displayStyle,
                classes: container.className,
                children: container.children.length
            });
        });
    };
    
    window.testVoiceParticipantCount = function(channelId, count) {

        
        if (!window.ChannelVoiceParticipants) {
            console.error('[VOICE-PARTICIPANT] ChannelVoiceParticipants not loaded');
            return;
        }
        
        const manager = window.ChannelVoiceParticipants.getInstance();
        if (!manager) {
            console.error('[VOICE-PARTICIPANT] Failed to get manager instance');
            return;
        }
        
        const channelElement = document.querySelector(`[data-channel-id="${channelId}"]`);
        if (!channelElement) {
            console.error('[VOICE-PARTICIPANT] Channel element not found for ID:', channelId);
            return;
        }
        
        const countElement = channelElement.querySelector('.voice-user-count');
        if (!countElement) {
            console.error('[VOICE-PARTICIPANT] voice-user-count element not found in channel');
            return;
        }
        

        manager.updateChannelCount(channelId, count);


    };
    
    window.verifyVoiceParticipantSystem = function() {

        
        const voiceChannels = document.querySelectorAll('[data-channel-type="voice"]');

        
        let allGood = true;
        
        voiceChannels.forEach((channel, index) => {
            const channelId = channel.getAttribute('data-channel-id');
            const channelName = channel.getAttribute('data-channel-name');
            const countElement = channel.querySelector('.voice-user-count');
            const participantContainer = document.querySelector(`.voice-participants[data-channel-id="${channelId}"]`);
            

            
            if (!countElement) {
                console.error('[VOICE-PARTICIPANT] Missing voice-user-count element for channel:', channelId);
                allGood = false;
            } else {

            }
            
            if (!participantContainer) {
                console.error('[VOICE-PARTICIPANT] Missing voice-participants container for channel:', channelId);
                allGood = false;
            } else {

            }
        });
        
        if (allGood) {

        } else {
            console.error('[VOICE-PARTICIPANT] System verification found issues');
        }
        
        return allGood;
    };
    






    
    window.testVoiceParticipantProfiles = function(channelId) {
        if (!window.ChannelVoiceParticipants) {
            console.error('[VOICE-PARTICIPANT] ChannelVoiceParticipants not loaded');
            return;
        }
        
        const manager = window.ChannelVoiceParticipants.getInstance();
        if (!manager) {
            console.error('[VOICE-PARTICIPANT] Failed to get manager instance');
            return;
        }
        
        manager.testVoiceParticipantProfiles(channelId);
    };
    
    window.debugVoiceParticipantProfiles = function() {
        if (!window.ChannelVoiceParticipants) {
            console.error('[VOICE-PARTICIPANT] ChannelVoiceParticipants not loaded');
            return;
        }
        
        const manager = window.ChannelVoiceParticipants.getInstance();
        if (!manager) {
            console.error('[VOICE-PARTICIPANT] Failed to get manager instance');
            return;
        }
        
        manager.debugVoiceParticipantFlow();
    };
});

// Test functions for VideoSDK-based voice participants
function testVideoSDKVoiceParticipants() {

    
    const voiceManager = window.voiceManager;
    const videoSDK = window.videoSDKManager;
    const participantSystem = window.ChannelVoiceParticipants?.getInstance();
    
    console.log('📊 [TEST] System Status:', {
        voiceManagerExists: !!voiceManager,
        videoSDKExists: !!videoSDK,
        participantSystemExists: !!participantSystem,
        isVoiceConnected: voiceManager?.isConnected || false,
        videoSDKReady: videoSDK?.isReady() || false,
        currentChannel: voiceManager?.currentChannelId || 'none',
        meetingParticipants: videoSDK?.meeting?.participants?.size || 0,
        localParticipant: !!videoSDK?.meeting?.localParticipant
    });
    
    if (videoSDK?.meeting?.participants) {

        videoSDK.meeting.participants.forEach((participant, id) => {

        });
        
        if (videoSDK.meeting.localParticipant) {

        }
    }
    
    return {
        voiceManager,
        videoSDK,
        participantSystem,
        participantCount: videoSDK?.meeting?.participants?.size || 0
    };
}

function syncVideoSDKToChannelDisplay() {

    
    const participantSystem = window.ChannelVoiceParticipants?.getInstance();
    if (participantSystem && participantSystem.syncVideoSDKParticipants) {
        participantSystem.syncVideoSDKParticipants();

    } else {
        console.error('❌ [TEST] Participant system not available or missing sync method');
    }
}

function testVideoSDKParticipantEvents() {

    
    const testParticipantId = 'test-participant-' + Date.now();
    const testParticipantName = 'Test User';
    
    // Simulate VideoSDK participant joined

    window.dispatchEvent(new CustomEvent('videosdkParticipantJoined', {
        detail: {
            participant: testParticipantId,
            participantObj: {
                id: testParticipantId,
                displayName: testParticipantName,
                name: testParticipantName
            }
        }
    }));
    
    setTimeout(() => {
        // Simulate VideoSDK participant left

        window.dispatchEvent(new CustomEvent('videosdkParticipantLeft', {
            detail: {
                participant: testParticipantId
            }
        }));
    }, 2000);
    

}

function getVideoSDKConnectionHealth() {

    
    const videoSDK = window.videoSDKManager;
    const voiceManager = window.voiceManager;
    
    const health = {
        timestamp: new Date().toISOString(),
        videoSDK: {
            exists: !!videoSDK,
            initialized: videoSDK?.initialized || false,
            hasAuthToken: !!videoSDK?.authToken,
            hasMeeting: !!videoSDK?.meeting,
            isConnected: videoSDK?.isConnected || false,
            isMeetingJoined: videoSDK?.isMeetingJoined || false,
            isReady: videoSDK?.isReady() || false,
            sdkVersion: videoSDK?.sdkVersion || 'unknown'
        },
        voiceManager: {
            exists: !!voiceManager,
            isConnected: voiceManager?.isConnected || false,
            currentChannelId: voiceManager?.currentChannelId || null,
            currentMeetingId: voiceManager?.currentMeetingId || null
        },
        meeting: null,
        participants: {
            total: 0,
            local: null,
            remote: []
        }
    };
    
    if (videoSDK?.meeting) {
        health.meeting = {
            id: videoSDK.meeting.id || 'unknown',
            participantCount: videoSDK.meeting.participants?.size || 0,
            localParticipantId: videoSDK.meeting.localParticipant?.id || null
        };
        
        health.participants.total = videoSDK.meeting.participants?.size || 0;
        
        if (videoSDK.meeting.localParticipant) {
            health.participants.local = {
                id: videoSDK.meeting.localParticipant.id,
                name: videoSDK.meeting.localParticipant.displayName || videoSDK.meeting.localParticipant.name || 'You'
            };
        }
        
        if (videoSDK.meeting.participants) {
            videoSDK.meeting.participants.forEach((participant, id) => {
                health.participants.remote.push({
                    id: id,
                    name: participant.displayName || participant.name || 'Unknown'
                });
            });
        }
    }
    
    console.table(health.videoSDK);
    console.table(health.voiceManager);
    if (health.meeting) console.table(health.meeting);
    console.table(health.participants);
    
    return health;
}

function testGlobalParticipantBroadcast() {

    
    const voiceCallManager = window.voiceCallManager;
    const globalSocket = window.globalSocketManager;
    const currentChannelId = window.voiceManager?.currentChannelId;
    
    if (!voiceCallManager) {
        console.error('❌ [TEST] VoiceCallManager not found');
        return false;
    }
    
    if (!globalSocket?.isReady()) {
        console.error('❌ [TEST] Global socket not ready');
        return false;
    }
    
    if (!currentChannelId) {
        console.error('❌ [TEST] No current voice channel');
        return false;
    }
    

    
    const testParticipantId = 'test-global-' + Date.now();
    const testParticipantName = 'Test Global User';
    
    // Test the broadcast functionality
    voiceCallManager.broadcastParticipantUpdate('join', testParticipantId, testParticipantName);
    
    setTimeout(() => {

        voiceCallManager.broadcastParticipantUpdate('leave', testParticipantId, testParticipantName);
    }, 2000);
    

    return true;
}

function verifyGlobalParticipantSystem() {

    
    const results = {
        videoSDKExists: !!window.videoSDKManager,
        voiceManagerExists: !!window.voiceManager,
        voiceCallManagerExists: !!window.voiceCallManager,
        participantSystemExists: !!window.ChannelVoiceParticipants,
        globalSocketReady: window.globalSocketManager?.isReady() || false,
        voiceConnected: window.voiceManager?.isConnected || false
    };
    

    
    // Test VideoSDK participant detection
    if (results.videoSDKExists && results.voiceConnected) {
        const videoSDK = window.videoSDKManager;

        
        if (videoSDK.meeting?.participants) {
            videoSDK.meeting.participants.forEach((participant, id) => {

            });
        }
        
        if (videoSDK.meeting?.localParticipant) {

        }
    }
    
    // Test channel display participants  
    if (results.participantSystemExists) {
        const participantSystem = window.ChannelVoiceParticipants.getInstance();
        const currentChannelId = window.voiceManager?.currentChannelId;
        
        if (currentChannelId) {
            const channelParticipants = participantSystem.getChannelParticipants(currentChannelId);

            channelParticipants.forEach((participant, id) => {

            });
        }
    }
    
    // Test global broadcasting capability
    if (results.voiceCallManagerExists && results.globalSocketReady) {

    } else {
        console.warn('⚠️ [TEST] Global broadcast system not ready');
    }
    
    const allSystemsGo = Object.values(results).every(v => v === true);

    
    return results;
}

function testChannelSwitchCompatibility() {

    
    const participantSystem = window.ChannelVoiceParticipants?.getInstance();
    if (!participantSystem) {
        console.error('❌ [TEST] ChannelVoiceParticipants not available');
        return false;
    }
    
    const methods = [
        'refreshAllChannelParticipants',
        'refreshAllChannelCounts', 
        'updateAllParticipantContainers',
        'getChannelParticipants',
        'getParticipantCount',
        'updateChannelCount'
    ];
    
    const methodResults = {};
    methods.forEach(method => {
        methodResults[method] = typeof participantSystem[method] === 'function';

    });
    
    const allMethodsExist = Object.values(methodResults).every(exists => exists);

    
    if (allMethodsExist) {

        try {
            participantSystem.refreshAllChannelCounts();

        } catch (error) {
            console.error('❌ [TEST] refreshAllChannelCounts failed:', error);
        }
    }
    
    return { allMethodsExist, methodResults };
}

function forceRefreshAllVoiceChannels() {

    
    const participantSystem = window.ChannelVoiceParticipants?.getInstance();
    if (participantSystem) {
        if (typeof participantSystem.refreshAllChannelParticipants === 'function') {
            participantSystem.refreshAllChannelParticipants();
        } else {
            if (typeof participantSystem.loadAllVoiceChannels === 'function') {
                participantSystem.loadAllVoiceChannels();
            }
            if (typeof participantSystem.updateAllParticipantContainers === 'function') {
                participantSystem.updateAllParticipantContainers();
            }
        }

    } else {
        console.error('❌ [TEST] Participant system not available');
    }
}

window.testVideoSDKVoiceParticipants = testVideoSDKVoiceParticipants;
window.syncVideoSDKToChannelDisplay = syncVideoSDKToChannelDisplay;
window.testVideoSDKParticipantEvents = testVideoSDKParticipantEvents;
window.getVideoSDKConnectionHealth = getVideoSDKConnectionHealth;
window.testGlobalParticipantBroadcast = testGlobalParticipantBroadcast;
window.verifyGlobalParticipantSystem = verifyGlobalParticipantSystem;
window.testChannelSwitchCompatibility = testChannelSwitchCompatibility;
window.forceRefreshAllVoiceChannels = forceRefreshAllVoiceChannels;










</script>

