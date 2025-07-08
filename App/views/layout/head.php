<?php
if (!function_exists('css')) {
    require_once dirname(dirname(__DIR__)) . '/config/helpers.php';
}

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$page_title = $page_title ?? $title ?? 'MisVord';
$page_description = $page_description ?? 'A modern Discord-like communication platform';
$cache_version = time();
$include_socket_io = true;
?>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="<?php echo htmlspecialchars($page_description); ?>">
<meta name="author" content="MisVord Team">
<meta name="robots" content="index, follow">

<?php if (isset($_SESSION['user_id'])): ?>
<meta name="user-id" content="<?php echo htmlspecialchars($_SESSION['user_id']); ?>">
<meta name="username" content="<?php echo htmlspecialchars($_SESSION['username'] ?? ''); ?>">
<meta name="user-avatar" content="<?php echo htmlspecialchars($_SESSION['avatar_url'] ?? '/public/assets/common/default-profile-picture.png'); ?>">
<meta name="user-authenticated" content="true">
<script>

window.currentUserId = <?php echo json_encode($_SESSION['user_id']); ?>;
window.currentUsername = <?php echo json_encode($_SESSION['username'] ?? ''); ?>;
window.currentUserAvatar = <?php echo json_encode($_SESSION['avatar_url'] ?? '/public/assets/common/default-profile-picture.png'); ?>;
</script>
<?php else: ?>
<meta name="user-authenticated" content="false">
<?php endif; ?>

<?php if (isset($extraHeadContent)): ?>
<?php echo $extraHeadContent; ?>
<?php endif; ?>

<meta name="socket-host" content="localhost">
<meta name="socket-port" content="1002">
<meta name="socket-secure" content="false">

<title><?php echo htmlspecialchars($page_title); ?></title>

<!-- Favicon -->
<link rel="icon" type="image/png" href="/public/assets/common/default-profile-picture.png">
<link rel="shortcut icon" type="image/png" href="/public/assets/common/default-profile-picture.png">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://cdnjs.cloudflare.com">
<link rel="preconnect" href="https://cdn.tailwindcss.com">

<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
<script src="https://cdn.tailwindcss.com"></script>

<!-- Font Awesome CDN -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" crossorigin="anonymous" referrerpolicy="no-referrer" />

<!-- Fetch Polyfill for legacy browsers -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/whatwg-fetch/3.6.2/fetch.umd.min.js"></script>

<script>
    tailwind.config = {
        theme: {
            extend: {
                colors: {
                    discord: {
                        'primary': '#5865F2',
                        'green': '#3BA55C',
                        'yellow': '#FAA61A',
                        'red': '#ED4245',
                        'background': '#36393F',
                        'dark': '#202225',
                        'darker': '#18191C',
                        'light': '#42464D',
                        'lighter': '#B9BBBE',
                    }
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif']
            }
        }
    }
</script>

<link rel="stylesheet" href="<?php echo css('global'); ?>?v=<?php echo $cache_version; ?>">
<link rel="stylesheet" href="<?php echo css('lazy-loading'); ?>?v=<?php echo $cache_version; ?>">
<link rel="stylesheet" href="<?= asset('/css/friends-mobile-menu.css') ?>?v=<?php echo $cache_version; ?>">
<link rel="stylesheet" href="<?= asset('/css/user-detail.css') ?>">

<link rel="stylesheet" href="<?= asset('/css/server-dropdown.css') ?>?v=<?php echo time(); ?>">

<?php if (isset($page_css)): ?>
    <?php if (is_array($page_css)): ?>
        <?php foreach ($page_css as $css_file): ?>
            <link rel="stylesheet" href="<?php echo css($css_file); ?>?v=<?php echo $cache_version; ?>">
        <?php endforeach; ?>
    <?php else: ?>
    <link rel="stylesheet" href="<?php echo css($page_css); ?>?v=<?php echo $cache_version; ?>">
    <?php endif; ?>
<?php endif; ?>

<?php if (isset($extraCss) && is_array($extraCss)): ?>
    <?php foreach ($extraCss as $css_file): ?>
        <link rel="stylesheet" href="<?php echo $css_file; ?>?v=<?php echo $cache_version; ?>">
    <?php endforeach; ?>
<?php endif; ?>

<?php if (isset($include_legacy_css) && $include_legacy_css): ?>
    <link rel="stylesheet" href="/css/landing-page.css?v=<?php echo $cache_version; ?>">
    <link rel="stylesheet" href="/css/authentication.css?v=<?php echo $cache_version; ?>">
<?php endif; ?>

<?php if (isset($include_socket_io) && $include_socket_io): ?>
    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js" crossorigin="anonymous"></script>
    
    <script>
    window.addEventListener('DOMContentLoaded', function() {
        if (typeof io === 'undefined') {
            return;
        }
        
        const isAuthenticated = document.querySelector('meta[name="user-authenticated"]')?.content === 'true';
        const userId = document.querySelector('meta[name="user-id"]')?.content;
        const username = document.querySelector('meta[name="username"]')?.content;
        
        if (!isAuthenticated) {
            return;
        }
        
        let checkCount = 0;
        const maxChecks = 20;
        
        const checkSocketManager = () => {
            checkCount++;
            
            if (window.globalSocketManager) {
                setTimeout(() => {
                    const status = window.globalSocketManager.getStatus();
                    
                    if (!status.connected && !status.lastError) {
                        if (isAuthenticated && userId && username) {
                            window.__SOCKET_INITIALISED__ = false;
                            const initResult = window.globalSocketManager.init({ user_id: userId, username: username });
                        }
                    }
                }, 1000);
                
                return;
            }
            
            if (checkCount >= maxChecks) {
                return;
            }
            
            setTimeout(checkSocketManager, 500);
        };
        
        setTimeout(checkSocketManager, 500);
    });
    
    window.addEventListener('globalSocketReady', function(event) {
    });
    
    window.addEventListener('socketAuthenticated', function(event) {
    });
    
    window.testSocketConnection = function() {
        if (typeof io === 'undefined') {
            return false;
        }
        
        if (!window.globalSocketManager) {
            return false;
        }
        
        const status = window.globalSocketManager.getStatus();
        
        if (status.connected && status.authenticated) {
            if (window.chatSection) {
                const chatStatus = window.chatSection.getDetailedSocketStatus();
                
                if (chatStatus.isReady && window.chatSection.targetId) {
                    window.chatSection.joinSocketRoom();
                }
            }
            
            return true;
        }
        
        const userData = {
            user_id: document.querySelector('meta[name="user-id"]')?.content,
            username: document.querySelector('meta[name="username"]')?.content
        };
        
        if (!userData.user_id || !userData.username) {
            return false;
        }
        
        window.__SOCKET_INITIALISED__ = false;
        
        const initResult = window.globalSocketManager.init(userData);
        
        setTimeout(() => {
            const newStatus = window.globalSocketManager.getStatus();
        }, 2000);
        
        return true;
    };
    
    window.shouldInitializeSocket = function() {
        const isAuthPage = document.body?.getAttribute('data-page') === 'auth';
        const isLandingPage = window.location.pathname === '/';
        const hasUserData = document.querySelector('meta[name="user-id"]')?.content;
        
        return !isAuthPage && !isLandingPage && hasUserData;
    };
    
    window.ensureSocketInitialized = function() {
        if (!window.shouldInitializeSocket()) {
            return false;
        }
        
        if (window.globalSocketManager?.isReady()) {
            return true;
        }
        
        if (!window.globalSocketManager) {
            console.warn('⚠️ [SOCKET] GlobalSocketManager not available');
            return false;
        }
        
        const userData = {
            user_id: document.querySelector('meta[name="user-id"]')?.content,
            username: document.querySelector('meta[name="username"]')?.content
        };
        
        if (!userData.user_id || !userData.username) {
            console.warn('⚠️ [SOCKET] No user data available for socket initialization');
            return false;
        }
        
        try {
            window.__SOCKET_INITIALISED__ = false;
            const result = window.globalSocketManager.init(userData);
            return result;
        } catch (error) {
            console.error('❌ [SOCKET] Error ensuring socket initialization:', error);
            return false;
        }
    };
    
    window.addEventListener('error', function(event) {
        if (event.message && (event.message.includes('socket') || event.message.includes('Socket') || event.message.includes('io'))) {
        }
    });
    </script>
<?php endif; ?>

<?php if (isset($include_channel_loader) && $include_channel_loader): ?>
    
<?php endif; ?>

<script>
function showPresenceDebugPanel() {
    const existingModal = document.getElementById('presence-debug-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'presence-debug-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4';
    
    modal.innerHTML = `
        <div class="bg-discord-dark rounded-lg border border-purple-500 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div class="flex items-center justify-between p-4 border-b border-gray-700">
                <h2 class="text-xl font-bold text-white flex items-center">
                    <i class="fas fa-user-circle mr-2 text-purple-400"></i>
                    Presence System Debug Panel
                    <span id="presence-status-indicator" class="ml-2 px-2 py-1 text-xs rounded bg-green-700 text-green-300">Ready</span>
                </h2>
                <button onclick="document.getElementById('presence-debug-modal').remove()" class="text-gray-400 hover:text-white text-xl">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="flex-1 flex overflow-hidden">
                <div class="w-1/3 border-r border-gray-700 p-4">
                    <h3 class="text-lg font-semibold text-white mb-4">Current Status</h3>
                    <div class="space-y-3">
                        <div class="bg-gray-800 rounded p-3">
                            <div class="text-sm text-gray-400">Current Presence:</div>
                            <div id="current-presence-status" class="text-lg font-semibold text-green-400">Loading...</div>
                        </div>
                        <div class="bg-gray-800 rounded p-3">
                            <div class="text-sm text-gray-400">Activity Details:</div>
                            <div id="current-activity-details" class="text-sm text-blue-400">Loading...</div>
                        </div>
                        <div class="bg-gray-800 rounded p-3">
                            <div class="text-sm text-gray-400">Last Change Source:</div>
                            <div id="last-presence-source" class="text-sm font-mono text-yellow-400">N/A</div>
                        </div>
                        <div class="bg-gray-800 rounded p-3">
                            <div class="text-sm text-gray-400">Voice Call Status:</div>
                            <div id="voice-call-status" class="text-sm text-purple-400">Checking...</div>
                        </div>
                        <div class="bg-gray-800 rounded p-3">
                            <div class="text-sm text-gray-400">Socket Status:</div>
                            <div id="socket-connection-status" class="text-sm text-yellow-400">Checking...</div>
                        </div>
                        <div class="bg-gray-800 rounded p-3">
                            <div class="text-sm text-gray-400">VideoSDK Status:</div>
                            <div id="videosdk-status" class="text-sm text-indigo-400">Detecting...</div>
                        </div>
                        <div class="bg-gray-800 rounded p-3">
                            <div class="text-sm text-gray-400">Meeting ID:</div>
                            <div id="meeting-id-status" class="text-xs font-mono text-cyan-400">N/A</div>
                        </div>
                    </div>
                    
                    <h3 class="text-lg font-semibold text-white mb-4 mt-6">Quick Actions</h3>
                    <div class="space-y-2">
                        <button onclick="runPresenceHierarchyTest()" class="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded text-sm">
                            <i class="fas fa-list mr-1"></i>Test Hierarchy
                        </button>
                        <button onclick="runVoiceProtectionTest()" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm">
                            <i class="fas fa-shield-alt mr-1"></i>Test Voice Protection
                        </button>
                        <button onclick="runAllPresenceTests()" class="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm">
                            <i class="fas fa-play mr-1"></i>Run All Tests
                        </button>
                        <button onclick="refreshPresenceStatus()" class="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded text-sm">
                            <i class="fas fa-sync mr-1"></i>Refresh Status
                        </button>
                    </div>
                </div>
                
                <div class="flex-1 flex flex-col">
                    <div class="p-4 border-b border-gray-700">
                        <h3 class="text-lg font-semibold text-white">Manual Presence Control</h3>
                        <div class="mt-3 space-y-3">
                            <div class="grid grid-cols-2 gap-3">
                                <button onclick="setPresenceStatus('online', {type: 'active'})" class="bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm">
                                    <i class="fas fa-circle mr-1"></i>Set Online
                                </button>
                                <button onclick="setPresenceStatus('afk', {type: 'afk'})" class="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-3 rounded text-sm">
                                    <i class="fas fa-moon mr-1"></i>Set AFK
                                </button>
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                                <button onclick="setPresenceStatus('online', {type: 'In Voice - Test Channel'})" class="bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded text-sm">
                                    <i class="fas fa-microphone mr-1"></i>Set Voice Call
                                </button>
                                <button onclick="setPresenceStatus('online', {type: 'playing Tic Tac Toe'})" class="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 rounded text-sm">
                                    <i class="fas fa-gamepad mr-1"></i>Set Gaming
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex-1 p-4">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="text-lg font-semibold text-white">Debug Logs</h3>
                            <button onclick="clearPresenceDebugLogs()" class="text-red-400 hover:text-red-300 text-sm">
                                <i class="fas fa-trash mr-1"></i>Clear
                            </button>
                        </div>
                        <div id="presence-debug-logs" class="bg-black rounded p-3 h-64 overflow-y-auto font-mono text-xs text-green-400">
                            <div class="text-gray-500">Presence debug logs will appear here...</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    initializePresenceDebugPanel();
}

function initializePresenceDebugPanel() {
    addPresenceDebugLog('🚀 Presence Debug Panel initialized', 'success');
    refreshPresenceStatus();
    
    window.addEventListener('ownPresenceUpdate', (e) => {
        const { source, status, activity_details } = e.detail;
        const inVoice = sessionStorage.getItem('isInVoiceCall')==='true';
        if(inVoice){
            const activityType = activity_details?.type || '';
            if(!activityType.toLowerCase().includes('in voice')){
                const channelName = sessionStorage.getItem('voiceChannelName') || 'Voice';
                if(window.globalSocketManager?.isReady()){
                    window.globalSocketManager.updatePresence('online',{type:`In Voice - ${channelName}`},'presence-watchdog');
                    addPresenceDebugLog(`[WATCHDOG] Restored In Voice presence (overrode "${activityType}")`, 'warning');
                }
            }
        }
        addPresenceDebugLog(`[EVENT] ownPresenceUpdate from "${source}" | Status: ${status} | Activity: ${activity_details?.type || 'none'}`, 'info');
        refreshPresenceStatus();
    });

    window.addEventListener('presenceUpdateBlocked', (e) => {
        const { source, newStatus, newActivity, currentStatus, currentActivity } = e.detail;
        addPresenceDebugLog(`[EVENT] Update from "${source}" BLOCKED. Attempted: ${newStatus} (${newActivity?.type}), Current: ${currentStatus} (${currentActivity?.type})`, 'warning');
        refreshPresenceStatus();
    });

    if (window.globalSocketManager?.io) {
        addPresenceDebugLog('🔌 Socket connection detected', 'success');
    } else {
        addPresenceDebugLog('⚠️ Socket not ready - limited functionality', 'warning');
    }

    window.addEventListener('voiceConnect', () => {
        addPresenceDebugLog('🎤 VoiceConnect event detected - updating VideoSDK status', 'info');
        refreshPresenceStatus();
    });
    window.addEventListener('voiceDisconnect', () => {
        addPresenceDebugLog('🔇 VoiceDisconnect event detected - updating VideoSDK status', 'info');
        refreshPresenceStatus();
    });
}

function refreshPresenceStatus() {
    const socketManager = window.globalSocketManager;
    
    const currentPresenceEl = document.getElementById('current-presence-status');
    const activityDetailsEl = document.getElementById('current-activity-details');
    const voiceCallStatusEl = document.getElementById('voice-call-status');
    const socketStatusEl = document.getElementById('socket-connection-status');
    const lastSourceEl = document.getElementById('last-presence-source');
    const videosdkStatusEl = document.getElementById('videosdk-status');
    const meetingIdEl = document.getElementById('meeting-id-status');
    
    if (socketManager?.isReady()) {
        const status = socketManager.currentPresenceStatus || 'Unknown';
        const activity = socketManager.currentActivityDetails;
        const isInVoice = socketManager.isUserInVoiceCall();
        const lastSource = socketManager.lastPresenceSource || 'N/A';
        const videosdkConnected = (window.videoSDKManager && window.videoSDKManager.isMeetingJoined) || sessionStorage.getItem('isInVoiceCall')==='true';
        const meetingId = window.videoSDKManager?.meeting?.id || window.voiceManager?.currentMeetingId || 'N/A';
        
        if (currentPresenceEl) currentPresenceEl.textContent = status;
        if (activityDetailsEl) activityDetailsEl.textContent = activity?.type || 'None';
        if (lastSourceEl) lastSourceEl.textContent = lastSource;
        if (voiceCallStatusEl) {
            voiceCallStatusEl.textContent = isInVoice ? 'In Voice Call' : 'Not in voice';
            voiceCallStatusEl.className = isInVoice ? 'text-sm text-purple-400' : 'text-sm text-gray-400';
        }
        if (socketStatusEl) {
            socketStatusEl.textContent = 'Connected';
            socketStatusEl.className = 'text-sm text-green-400';
        }
        if (videosdkStatusEl) {
            videosdkStatusEl.textContent = videosdkConnected ? 'Connected' : 'Not Connected';
            videosdkStatusEl.className = videosdkConnected ? 'text-sm text-indigo-400' : 'text-sm text-gray-400';
        }
        if (meetingIdEl) {
            meetingIdEl.textContent = meetingId;
            meetingIdEl.className = meetingId !== 'N/A' ? 'text-xs font-mono text-cyan-400' : 'text-xs font-mono text-gray-500';
        }
    } else {
        if (currentPresenceEl) currentPresenceEl.textContent = 'Disconnected';
        if (activityDetailsEl) activityDetailsEl.textContent = 'N/A';
        if (voiceCallStatusEl) voiceCallStatusEl.textContent = 'N/A';
        if (socketStatusEl) {
            socketStatusEl.textContent = 'Disconnected';
            socketStatusEl.className = 'text-sm text-red-400';
        }
        if (lastSourceEl) lastSourceEl.textContent = 'N/A';
        if (videosdkStatusEl) {
            const videosdkConnected = sessionStorage.getItem('isInVoiceCall')==='true';
            videosdkStatusEl.textContent = videosdkConnected ? 'Connected' : 'Not Connected';
            videosdkStatusEl.className = videosdkConnected ? 'text-sm text-indigo-400' : 'text-sm text-gray-400';
        }
        if (meetingIdEl) {
            const meetingId = window.voiceManager?.currentMeetingId || 'N/A';
            meetingIdEl.textContent = meetingId;
            meetingIdEl.className = meetingId !== 'N/A' ? 'text-xs font-mono text-cyan-400' : 'text-xs font-mono text-gray-500';
        }
    }
}

function setPresenceStatus(status, activityDetails) {
    if (!window.globalSocketManager?.isReady()) {
        addPresenceDebugLog('❌ Cannot set presence - socket not ready', 'error');
        return;
    }
    
    addPresenceDebugLog(`🎯 Setting presence: ${status} | ${activityDetails?.type || 'No activity'}`, 'info');
    
    const result = window.globalSocketManager.updatePresence(status, activityDetails, 'manual-debug-panel');
    
    if (result !== false) {
        addPresenceDebugLog('✅ Presence set successfully', 'success');
    } else {
        addPresenceDebugLog('❌ Presence update was blocked by hierarchy protection', 'warning');
    }
    
    refreshPresenceStatus();
}

function runPresenceHierarchyTest() {
    addPresenceDebugLog('🧪 Starting presence hierarchy test...', 'info');
    
    if (window.testPresenceHierarchy) {
        window.testPresenceHierarchy().then(result => {
            if (result) {
                addPresenceDebugLog('✅ Presence hierarchy test passed!', 'success');
            } else {
                addPresenceDebugLog('❌ Presence hierarchy test failed', 'error');
            }
        }).catch(error => {
            addPresenceDebugLog(`💥 Hierarchy test error: ${error.message}`, 'error');
        });
    } else {
        addPresenceDebugLog('❌ testPresenceHierarchy function not found', 'error');
    }
}

function runVoiceProtectionTest() {
    addPresenceDebugLog('🛡️ Starting voice call protection test...', 'info');
    
    if (window.testVoiceCallProtection) {
        window.testVoiceCallProtection().then(result => {
            if (result) {
                addPresenceDebugLog('✅ Voice protection test passed!', 'success');
            } else {
                addPresenceDebugLog('❌ Voice protection test failed', 'error');
            }
        }).catch(error => {
            addPresenceDebugLog(`💥 Voice protection test error: ${error.message}`, 'error');
        });
    } else {
        addPresenceDebugLog('❌ testVoiceCallProtection function not found', 'error');
    }
}

function runAllPresenceTests() {
    addPresenceDebugLog('🚀 Starting all presence system tests...', 'info');
    
    if (window.runAllPresenceTests && typeof window.runAllPresenceTests === 'function') {
        window.runAllPresenceTests().then(result => {
            if (result) {
                addPresenceDebugLog('🎉 All presence tests passed!', 'success');
            } else {
                addPresenceDebugLog('💥 Some presence tests failed', 'error');
            }
        }).catch(error => {
            addPresenceDebugLog(`❌ Test suite error: ${error.message}`, 'error');
        });
    } else {
        addPresenceDebugLog('❌ runAllPresenceTests function not found', 'error');
    }
}

let presenceDebugLogCount = 0;
function addPresenceDebugLog(message, type = 'info') {
    const logsContainer = document.getElementById('presence-debug-logs');
    if (!logsContainer) return;
    
    presenceDebugLogCount++;
    const timestamp = new Date().toLocaleTimeString();
    const colors = {
        info: 'text-green-400',
        warning: 'text-yellow-400',
        error: 'text-red-400',
        success: 'text-blue-400'
    };
    
    const logEntry = document.createElement('div');
    logEntry.className = `${colors[type] || 'text-green-400'} mb-1`;
    logEntry.innerHTML = `<span class="text-gray-500">[${timestamp}]</span> ${message}`;
    
    logsContainer.appendChild(logEntry);
    logsContainer.scrollTop = logsContainer.scrollHeight;
    
    if (presenceDebugLogCount > 50) {
        logsContainer.removeChild(logsContainer.firstChild);
        presenceDebugLogCount--;
    }
}

function clearPresenceDebugLogs() {
    const logsContainer = document.getElementById('presence-debug-logs');
    if (logsContainer) {
        logsContainer.innerHTML = '<div class="text-gray-500">Logs cleared...</div>';
        presenceDebugLogCount = 0;
    }
}
</script>

<script>
function showBotDebugPanel() {
    const existingModal = document.getElementById('bot-debug-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'bot-debug-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4';
    
    modal.innerHTML = `
        <div class="bg-discord-dark rounded-lg border border-blue-500 max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div class="flex items-center justify-between p-4 border-b border-gray-700">
                <h2 class="text-xl font-bold text-white flex items-center">
                    <i class="fas fa-robot mr-2 text-blue-400"></i>
                    Bot System Debug Panel
                    <span id="bot-status-indicator" class="ml-2 px-2 py-1 text-xs rounded bg-green-700 text-green-300">Ready</span>
                </h2>
                <button onclick="document.getElementById('bot-debug-modal').remove()" class="text-gray-400 hover:text-white text-xl">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="flex-1 flex overflow-hidden">
                <div class="w-1/3 border-r border-gray-700 p-4">
                    <h3 class="text-lg font-semibold text-white mb-4">Bot Status</h3>
                    <div class="space-y-3">
                        <div class="bg-gray-800 rounded p-3">
                            <div class="text-sm text-gray-400">Bot Component:</div>
                            <div id="bot-component-status" class="text-lg font-semibold text-green-400">Loading...</div>
                        </div>
                        <div class="bg-gray-800 rounded p-3">
                            <div class="text-sm text-gray-400">Voice Connection:</div>
                            <div id="bot-voice-status" class="text-sm text-blue-400">Loading...</div>
                        </div>
                        <div class="bg-gray-800 rounded p-3 border-l-4 border-purple-500">
                            <div class="text-sm text-gray-400 flex items-center">
                                <i class="fas fa-music mr-1 text-purple-400"></i>Music Status:
                            </div>
                            <div id="music-player-status" class="text-sm text-purple-400">Loading...</div>
                            <div class="text-xs text-gray-400 mt-1">Currently Playing:</div>
                            <div id="currently-playing-song" class="text-xs text-purple-300">None</div>
                        </div>
                        <div class="bg-gray-800 rounded p-3 border-l-4 border-purple-500">
                            <div class="text-sm text-gray-400 flex items-center">
                                <i class="fas fa-headphones mr-1 text-purple-400"></i>Music Listeners:
                            </div>
                            <div id="music-listeners" class="text-xs text-purple-300">None</div>
                        </div>
                        <div class="bg-gray-800 rounded p-3">
                            <div class="text-sm text-gray-400">Current Channel:</div>
                            <div id="bot-current-channel" class="text-sm text-yellow-400">N/A</div>
                        </div>
                        <div class="bg-gray-800 rounded p-3">
                            <div class="text-sm text-gray-400">User Voice State:</div>
                            <div id="user-voice-state" class="text-sm text-cyan-400">Checking...</div>
                        </div>
                        <div class="bg-gray-800 rounded p-3">
                            <div class="text-sm text-gray-400">Socket Connection:</div>
                            <div id="bot-socket-status" class="text-sm text-green-400">Checking...</div>
                        </div>
                    </div>
                    
                    <h3 class="text-lg font-semibold text-white mb-4 mt-6">Quick Actions</h3>
                    <div class="space-y-2">
                        <button onclick="testBotCommand()" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm">
                            <i class="fas fa-play mr-1"></i>Test Bot Command
                        </button>
                        <button onclick="testVoiceJoin()" class="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded text-sm">
                            <i class="fas fa-microphone mr-1"></i>Test Voice Join
                        </button>
                        <button onclick="testMusicPlay()" class="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm">
                            <i class="fas fa-music mr-1"></i>Test Music Play
                        </button>
                        <button onclick="testVoiceContextDetection()" class="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-3 rounded text-sm">
                            <i class="fas fa-search mr-1"></i>Test Voice Detection
                        </button>
                        <button onclick="checkMusicListeners()" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 rounded text-sm">
                            <i class="fas fa-headphones mr-1"></i>Check Music Listeners
                        </button>
                        <button onclick="trackMusicPlayback()" class="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm">
                            <i class="fas fa-heartbeat mr-1"></i>Track Music Playback
                        </button>
                        <button onclick="validateMusicState()" class="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-3 rounded text-sm">
                            <i class="fas fa-stethoscope mr-1"></i>Validate Music State
                        </button>
                        <button onclick="refreshBotStatus()" class="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded text-sm">
                            <i class="fas fa-sync mr-1"></i>Refresh Status
                        </button>
                    </div>
                </div>
                
                <div class="flex-1 flex flex-col">
                    <div class="p-4 border-b border-gray-700">
                        <h3 class="text-lg font-semibold text-white">Manual Bot Control</h3>
                        <div class="mt-3 space-y-3">
                            <div class="flex gap-2">
                                <input type="text" id="bot-command-input" placeholder="/titibot play song name" class="flex-1 bg-gray-800 text-white px-3 py-2 rounded text-sm">
                                <button onclick="sendBotCommand()" class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm">
                                    <i class="fas fa-paper-plane mr-1"></i>Send
                                </button>
                            </div>
                            <div class="grid grid-cols-3 gap-2">
                                <button onclick="sendBotCommand('/titibot play test')" class="bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm">
                                    <i class="fas fa-play mr-1"></i>Play Test
                                </button>
                                <button onclick="sendBotCommand('/titibot stop')" class="bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm">
                                    <i class="fas fa-stop mr-1"></i>Stop
                                </button>
                                <button onclick="sendBotCommand('/titibot next')" class="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-3 rounded text-sm">
                                    <i class="fas fa-forward mr-1"></i>Next
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex-1 p-4">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="text-lg font-semibold text-white">Bot Debug Logs</h3>
                            <button onclick="clearBotDebugLogs()" class="text-red-400 hover:text-red-300 text-sm">
                                <i class="fas fa-trash mr-1"></i>Clear
                            </button>
                        </div>
                        <div id="bot-debug-logs" class="bg-black rounded p-3 h-64 overflow-y-auto font-mono text-xs text-green-400">
                            <div class="text-gray-500">Bot debug logs will appear here...</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    initializeBotDebugPanel();
}

function initializeBotDebugPanel() {
    addBotDebugLog('🤖 Bot Debug Panel initialized', 'success');
    refreshBotStatus();
    
    // Set up socket listeners
    if (window.globalSocketManager?.io) {
        window.globalSocketManager.io.on('bot-voice-participant-joined', (data) => {
            addBotDebugLog(`🎤 Bot joined voice channel: ${data.channel_id}`, 'success');
            refreshBotStatus();
        });
        
        window.globalSocketManager.io.on('bot-voice-participant-left', (data) => {
            addBotDebugLog(`🔇 Bot left voice channel: ${data.channel_id}`, 'info');
            refreshBotStatus();
        });
        
        window.globalSocketManager.io.on('bot-music-command', (data) => {
            const actionType = data.music_data?.action || 'unknown';
            const songQuery = data.music_data?.query || 'N/A';
            
            addBotDebugLog(`🎵 Music command received: ${actionType} - ${songQuery}`, 'info');
            
            // We need to wait a moment for the music to actually start playing
            setTimeout(() => {
                refreshBotStatus();
                setTimeout(refreshBotStatus, 2000); // Check again after 2 seconds
            }, 500);
        });
        
        window.globalSocketManager.io.on('bot-response', (data) => {
            addBotDebugLog(`💬 Bot response: ${data.message}`, 'info');
        });
    }
    
    // Set up listeners for music player events
    setupMusicPlayerTracking();
}

function setupMusicPlayerTracking() {
    const musicPlayer = window.musicPlayer || window.musicPlayerSystem;
    if (!musicPlayer || !musicPlayer.audio) {
        addBotDebugLog('⚠️ Music player not available for event tracking', 'warning');
        
        // Try again in a second
        setTimeout(setupMusicPlayerTracking, 1000);
        return;
    }
    
    // Track audio element events
    ['play', 'playing', 'pause', 'ended', 'error'].forEach(eventName => {
        musicPlayer.audio.addEventListener(eventName, () => {
            addBotDebugLog(`🔊 Audio event: ${eventName}`, 'info');
            refreshBotStatus();
        });
    });
    
    addBotDebugLog('✅ Music player tracking initialized', 'success');
}

// Function to actively track music playback
let musicTrackingInterval = null;
function trackMusicPlayback() {
    if (musicTrackingInterval) {
        clearInterval(musicTrackingInterval);
        musicTrackingInterval = null;
        addBotDebugLog('⏹️ Music tracking stopped', 'info');
        return;
    }
    
    addBotDebugLog('▶️ Starting music tracking (will update every 3 seconds)', 'success');
    
    // First check now
    checkCurrentMusicStatus();
    
    // Then set up interval
    musicTrackingInterval = setInterval(() => {
        checkCurrentMusicStatus();
    }, 3000);
}

function checkCurrentMusicStatus() {
    const musicPlayer = window.musicPlayer || window.musicPlayerSystem;
    if (!musicPlayer) {
        addBotDebugLog('❌ Music player not available', 'error');
        return;
    }
    
    const isPlaying = musicPlayer.isPlaying || 
                      (musicPlayer.audio && !musicPlayer.audio.paused && musicPlayer.audio.src);
                      
    if (isPlaying) {
        let songInfo = '';
        if (musicPlayer.currentSong && musicPlayer.currentSong.title) {
            songInfo = `"${musicPlayer.currentSong.title}" by ${musicPlayer.currentSong.artist || 'Unknown'}`;
        } else if (musicPlayer.audio && musicPlayer.audio.src) {
            songInfo = `Audio from: ${musicPlayer.audio.src.substring(0, 30)}...`;
        } else {
            songInfo = 'Unknown track';
        }
        
        // Get current position
        let position = '';
        if (musicPlayer.audio) {
            const current = Math.round(musicPlayer.audio.currentTime || 0);
            const total = Math.round(musicPlayer.audio.duration || 0);
            position = `${current}/${total}s`;
        }
        
        addBotDebugLog(`🎵 Currently playing: ${songInfo} (${position})`, 'success');
        
        // Update the display in the music status area
        const currentlyPlayingSongEl = document.getElementById('currently-playing-song');
        if (currentlyPlayingSongEl) {
            currentlyPlayingSongEl.textContent = songInfo;
            currentlyPlayingSongEl.className = 'text-xs text-purple-300 font-semibold';
        }
        
        // Update the music player status
        const musicPlayerEl = document.getElementById('music-player-status');
        if (musicPlayerEl) {
            musicPlayerEl.textContent = 'Playing';
            musicPlayerEl.className = 'text-sm text-green-400';
        }
    } else {
        addBotDebugLog('⏸️ No music currently playing', 'info');
    }
}

function refreshBotStatus() {
    const botComponentEl = document.getElementById('bot-component-status');
    const botVoiceEl = document.getElementById('bot-voice-status');
    const musicPlayerEl = document.getElementById('music-player-status');
    const currentlyPlayingSongEl = document.getElementById('currently-playing-song');
    const musicListenersEl = document.getElementById('music-listeners');
    const botChannelEl = document.getElementById('bot-current-channel');
    const userVoiceEl = document.getElementById('user-voice-state');
    const botSocketEl = document.getElementById('bot-socket-status');
    
    if (botComponentEl) {
        const botInitialized = window.BotComponent?.isInitialized();
        botComponentEl.textContent = botInitialized ? 'Initialized' : 'Not Initialized';
        botComponentEl.className = botInitialized ? 'text-lg font-semibold text-green-400' : 'text-lg font-semibold text-red-400';
    }
    
    if (botVoiceEl) {
        const voiceConnected = window.voiceManager?.isConnected;
        botVoiceEl.textContent = voiceConnected ? 'Connected' : 'Disconnected';
        botVoiceEl.className = voiceConnected ? 'text-sm text-green-400' : 'text-sm text-red-400';
    }
    
    // Check music player status
    if (musicPlayerEl) {
        const musicPlayer = window.musicPlayer || window.musicPlayerSystem;
        if (musicPlayer) {
            // Direct check for actual audio playback status, mirroring getMusicPlaybackInfo
            const isAudioPlaying = musicPlayer.audio && !musicPlayer.audio.paused && musicPlayer.audio.src;
            // Use the same logic as getMusicPlaybackInfo to determine if music is playing
            const isPlaying = isAudioPlaying || musicPlayer.isPlaying || false;
            
            musicPlayerEl.textContent = isPlaying ? 'Playing' : 'Not Playing';
            musicPlayerEl.className = isPlaying ? 'text-sm text-green-400' : 'text-sm text-gray-400';
            
            // Debug music playback info
            const musicInfo = getMusicPlaybackInfo();
            
            if (currentlyPlayingSongEl) {
                // Get the track from any available source
                const currentTrack = musicPlayer.currentSong || musicPlayer.currentTrack;
                if (currentTrack && isPlaying) {
                    currentlyPlayingSongEl.textContent = `${currentTrack.title} by ${currentTrack.artist || 'Unknown'}`;
                    currentlyPlayingSongEl.className = 'text-xs text-purple-300 font-semibold';
                } else {
                    currentlyPlayingSongEl.textContent = 'None';
                    currentlyPlayingSongEl.className = 'text-xs text-gray-400';
                }
            }
            
            // Update listeners info
            if (musicListenersEl) {
                if (musicInfo.listeners.length > 0) {
                    musicListenersEl.innerHTML = musicInfo.listeners.map(listener => 
                        `<div class="flex items-center mt-1">
                            <span class="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                            ${listener.username || listener.user_id} (${listener.listening ? 'Listening' : 'In Voice'})
                        </div>`
                    ).join('');
                } else {
                    musicListenersEl.textContent = 'No listeners detected';
                    musicListenersEl.className = 'text-xs text-gray-400';
                }
                
                // Add debug info to logs
                if (musicInfo.isPlaying) {
                    addBotDebugLog(`🎵 Music playing: "${musicInfo.songTitle}" for ${musicInfo.listeners.length} users`, 'info');
                }
            }
        } else {
            musicPlayerEl.textContent = 'Not Available';
            musicPlayerEl.className = 'text-sm text-red-400';
            
            if (currentlyPlayingSongEl) {
                currentlyPlayingSongEl.textContent = 'Music player not available';
                currentlyPlayingSongEl.className = 'text-xs text-red-400';
            }
        }
    }
    
    if (botChannelEl) {
        const currentChannel = window.voiceManager?.currentChannelId || 'N/A';
        botChannelEl.textContent = currentChannel;
        botChannelEl.className = currentChannel !== 'N/A' ? 'text-sm text-yellow-400' : 'text-sm text-gray-400';
    }
    
    if (userVoiceEl) {
        const userInVoice = window.unifiedVoiceStateManager?.getState()?.isConnected;
        userVoiceEl.textContent = userInVoice ? 'In Voice' : 'Not In Voice';
        userVoiceEl.className = userInVoice ? 'text-sm text-cyan-400' : 'text-sm text-gray-400';
    }
    
    if (botSocketEl) {
        const socketReady = window.globalSocketManager?.isReady();
        botSocketEl.textContent = socketReady ? 'Connected' : 'Disconnected';
        botSocketEl.className = socketReady ? 'text-sm text-green-400' : 'text-sm text-red-400';
    }
    

    const debugInfo = analyzeVoiceContextForBot();
    addBotDebugLog(`🔍 Voice Context Analysis: ${debugInfo.summary}`, debugInfo.status);
    if (debugInfo.details) {
        addBotDebugLog(`   Details: ${debugInfo.details}`, 'info');
    }
    if (debugInfo.recommendation) {
        addBotDebugLog(`   💡 ${debugInfo.recommendation}`, 'warning');
    }
}


function analyzeVoiceContextForBot() {
    const urlParams = new URLSearchParams(window.location.search);
    const currentChannelId = urlParams.get('channel');
    const currentChannelType = urlParams.get('type');
    const metaChannelType = document.querySelector('meta[name="channel-type"]')?.content;
    const metaChannelId = document.querySelector('meta[name="channel-id"]')?.content;
    
    const unifiedState = window.unifiedVoiceStateManager?.getState();
    const voiceManagerConnected = window.voiceManager?.isConnected;
    const voiceManagerChannelId = window.voiceManager?.currentChannelId;
    

    let voiceChannelId = null;
    let userInVoice = false;
    let detectionMethod = 'none';
    
    if (unifiedState && unifiedState.isConnected && unifiedState.channelId) {
        voiceChannelId = unifiedState.channelId;
        userInVoice = true;
        detectionMethod = 'unifiedVoiceStateManager';
    } else if (metaChannelType === 'voice' && currentChannelId) {
        voiceChannelId = currentChannelId;
        userInVoice = false; // This is the problematic case!
        detectionMethod = 'currentVoiceChannelPage';
    }
    
    const botWouldWork = voiceChannelId && userInVoice;
    
    let summary = '';
    let status = 'info';
    let details = '';
    let recommendation = '';
    
    if (botWouldWork) {
        summary = 'Bot commands should work correctly';
        status = 'success';
        details = `Detection: ${detectionMethod}, Channel: ${voiceChannelId}`;
    } else if (voiceChannelId && !userInVoice) {
        summary = 'Bot commands will FAIL - detected as not in voice';
        status = 'error';
        details = `Detection: ${detectionMethod}, Channel: ${voiceChannelId}, UserInVoice: ${userInVoice}`;
        recommendation = 'This is the bug! You ARE in voice but detection says you are not.';
    } else if (unifiedState?.isConnected && !voiceChannelId) {
        summary = 'Voice connected but no channel ID detected';
        status = 'warning';
        details = `UnifiedState connected: ${unifiedState.isConnected}, ChannelId: ${unifiedState.channelId}`;
        recommendation = 'Voice state manager missing channel context';
    } else {
        summary = 'No voice context detected';
        status = 'error';
        details = `Currently viewing: ${currentChannelType} channel ${currentChannelId}`;
        recommendation = 'Join a voice channel first';
    }
    
    return { summary, status, details, recommendation };
}


function sendBotCommand(command) {
    const input = document.getElementById('bot-command-input');
    const messageText = command || input?.value;
    
    if (!messageText) {
        addBotDebugLog('❌ No command to send', 'error');
        return;
    }
    
    addBotDebugLog(`📤 Sending command: ${messageText}`, 'info');
    
    if (!window.globalSocketManager?.isReady()) {
        addBotDebugLog('❌ Socket not ready', 'error');
        return;
    }
    

    addBotDebugLog('🔍 Analyzing voice context before sending...', 'info');
    
    const urlParams = new URLSearchParams(window.location.search);
    const currentChannelId = urlParams.get('channel');
    const currentChannelType = urlParams.get('type');
    const metaChannelType = document.querySelector('meta[name="channel-type"]')?.content;
    const metaChannelId = document.querySelector('meta[name="channel-id"]')?.content;
    
    addBotDebugLog(`   📍 URL Context: Channel ${currentChannelId}, Type ${currentChannelType}`, 'info');
    addBotDebugLog(`   🏷️ Meta Context: Channel ${metaChannelId}, Type ${metaChannelType}`, 'info');
    
    const unifiedState = window.unifiedVoiceStateManager?.getState();
    if (unifiedState) {
        addBotDebugLog(`   🎤 Unified Voice State: Connected ${unifiedState.isConnected}, Channel ${unifiedState.channelId}`, 'info');
    } else {
        addBotDebugLog(`   🎤 Unified Voice State: Not available`, 'warning');
    }
    
    const voiceManagerState = {
        connected: window.voiceManager?.isConnected,
        channelId: window.voiceManager?.currentChannelId,
        meetingId: window.voiceManager?.currentMeetingId
    };
    addBotDebugLog(`   🎙️ Voice Manager: Connected ${voiceManagerState.connected}, Channel ${voiceManagerState.channelId}`, 'info');
    

    let voiceChannelId = null;
    let userInVoice = false;
    let detectionMethod = 'none';
    
    if (unifiedState && unifiedState.isConnected && unifiedState.channelId) {
        voiceChannelId = unifiedState.channelId;
        userInVoice = true;
        detectionMethod = 'unifiedVoiceStateManager';
        addBotDebugLog(`   ✅ Voice context from UnifiedVoiceState: channel ${voiceChannelId}`, 'success');
    } else {
        if (metaChannelType === 'voice' && currentChannelId) {
            voiceChannelId = currentChannelId;
            userInVoice = false; // This is the problem!
            detectionMethod = 'currentVoiceChannelPage';
            addBotDebugLog(`   ⚠️ Voice context from current page view: channel ${voiceChannelId} (userInVoice: false)`, 'warning');
        } else {
            addBotDebugLog(`   ❌ No voice context detected`, 'error');
        }
    }
    
    const payload = {
        message: messageText,
        target_type: 'channel',
        target_id: '1'
    };
    
    if (voiceChannelId) {
        payload.voice_context = {
            voice_channel_id: voiceChannelId,
            user_in_voice: userInVoice
        };
        addBotDebugLog(`   🎯 Voice context attached: ${JSON.stringify(payload.voice_context)}`, 'info');
        
        if (!userInVoice) {
            addBotDebugLog(`   🚨 WARNING: userInVoice is false - bot will reject this command!`, 'error');
        }
    } else {
        addBotDebugLog(`   ❌ No voice context to attach`, 'error');
    }
    
    window.globalSocketManager.io.emit('save-and-send-message', payload);
    
    if (input) {
        input.value = '';
    }
    
    addBotDebugLog('✅ Command sent successfully', 'success');
}

function testBotCommand() {
    addBotDebugLog('🧪 Testing bot command detection...', 'info');
    
    if (!window.BotComponent?.isInitialized()) {
        addBotDebugLog('❌ Bot component not initialized', 'error');
        return;
    }
    
    const testMessage = '/titibot hello';
    addBotDebugLog(`📤 Sending test message: ${testMessage}`, 'info');
    
    if (window.globalSocketManager?.isReady()) {
        window.globalSocketManager.io.emit('save-and-send-message', {
            message: testMessage,
            target_type: 'channel',
            target_id: '1'
        });
        addBotDebugLog('✅ Test message sent', 'success');
    } else {
        addBotDebugLog('❌ Socket not ready', 'error');
    }
}

function testVoiceJoin() {
    addBotDebugLog('🎤 Testing bot voice join...', 'info');
    
    const userVoiceState = window.unifiedVoiceStateManager?.getState();
    if (!userVoiceState?.isConnected) {
        addBotDebugLog('❌ User not in voice channel', 'error');
        return;
    }
    
    let channelId = userVoiceState.channelId;
    if (!channelId && userVoiceState.meetingId?.includes('voice_channel_')) {
        channelId = userVoiceState.meetingId.replace('voice_channel_', '');
    }
    
    if (!channelId) {
        addBotDebugLog('❌ Could not determine voice channel ID', 'error');
        return;
    }
    
    addBotDebugLog(`📤 Attempting to join voice channel: ${channelId}`, 'info');
    sendBotCommand('/titibot join');
}

function testMusicPlay() {
    addBotDebugLog('🎵 Testing music play...', 'info');
    sendBotCommand('/titibot play never gonna give you up');
}

function getMusicPlaybackInfo() {
    const musicPlayer = window.musicPlayer || window.musicPlayerSystem;
    const result = {
        isPlaying: false,
        songTitle: 'None',
        songArtist: 'None',
        listeners: [],
        voiceChannelId: null,
        debug: {}
    };
    
    if (!musicPlayer) {
        addBotDebugLog('❌ Music player not available for debugging', 'warning');
        return result;
    }
    
    // Direct check for actual audio playback status
    const isAudioPlaying = musicPlayer.audio && !musicPlayer.audio.paused && musicPlayer.audio.src;
    
    // Get current song info from multiple possible locations
    result.isPlaying = isAudioPlaying || musicPlayer.isPlaying || false;
    
    // Store debug info
    result.debug = {
        audioElement: {
            src: musicPlayer.audio?.src || 'none',
            paused: musicPlayer.audio?.paused,
            currentTime: musicPlayer.audio?.currentTime,
            duration: musicPlayer.audio?.duration
        },
        isPlayingFlag: musicPlayer.isPlaying,
        currentSong: musicPlayer.currentSong,
        currentTrack: musicPlayer.currentTrack,
        queue: musicPlayer.queue?.length || 0
    };
    
    // Check all possible locations for current song info
    if (musicPlayer.currentSong) {
        result.songTitle = musicPlayer.currentSong.title || 'Unknown';
        result.songArtist = musicPlayer.currentSong.artist || 'Unknown';
    } else if (musicPlayer.currentTrack) {
        result.songTitle = musicPlayer.currentTrack.title || 'Unknown';
        result.songArtist = musicPlayer.currentTrack.artist || 'Unknown';
    } else if (musicPlayer.queue && musicPlayer.queue.length > 0 && musicPlayer.currentIndex >= 0) {
        // Try to get from queue
        const currentQueueItem = musicPlayer.queue[musicPlayer.currentIndex];
        if (currentQueueItem) {
            result.songTitle = currentQueueItem.title || 'Unknown';
            result.songArtist = currentQueueItem.artist || 'Unknown';
        }
    }
    
    // If we have a playing audio element but no song info, use the URL as a fallback
    if (result.isPlaying && result.songTitle === 'None' && musicPlayer.audio?.src) {
        const url = musicPlayer.audio.src;
        try {
            // Extract song name from URL
            const urlParts = url.split('/');
            const filename = urlParts[urlParts.length - 1].split('?')[0];
            result.songTitle = decodeURIComponent(filename) || 'Unknown track';
            result.songArtist = 'Unknown artist';
        } catch (e) {
            result.songTitle = 'Playing unknown track';
        }
    }
    
    // Get voice channel ID
    const voiceContext = window.debugTitiBotVoiceContext ? window.debugTitiBotVoiceContext() : null;
    if (voiceContext && voiceContext.voiceChannelId) {
        result.voiceChannelId = voiceContext.voiceChannelId;
    } else {
        result.voiceChannelId = window.unifiedVoiceStateManager?.getState()?.channelId || 
                               window.voiceManager?.currentChannelId || 
                               null;
    }
    
    // Get listeners in voice channel
    if (result.voiceChannelId) {
        // Get participants from voice channel
        const participants = getVoiceChannelParticipants(result.voiceChannelId);
        
        // Map to listeners with status
        result.listeners = participants.map(participant => {
            // The bot is always "listening" when it's in the channel
            const isBot = participant.isBot || participant.user_id === '4' || participant.username?.toLowerCase() === 'titibot';
            
            // For regular users, we check if they're in the same channel
            const isInSameChannel = participant.channelId === result.voiceChannelId;
            
            // For a user to be listening, they must be in the same channel AND music must be playing
            const isListening = isInSameChannel && (isBot || result.isPlaying);
            
            return {
                user_id: participant.user_id,
                username: participant.username || 'Unknown',
                isBot: isBot,
                listening: isListening
            };
        });
    }
    
    return result;
}

// Helper function to get all participants in a voice channel
function getVoiceChannelParticipants(channelId) {
    if (!channelId) return [];
    
    const participantMap = new Map();
    
    const extractUserId = (id, name) => {
        if (!id) return null;
        const idStr = String(id);
        if (/^\d+$/.test(idStr)) return idStr;
        if (idStr.includes('_')) {
            const parts = idStr.split('_');
            const lastPart = parts[parts.length - 1];
            if (/^\d+$/.test(lastPart)) return lastPart;
        }
        if (name && name.includes('_')) {
            const nameParts = name.split('_');
            const lastPart = nameParts[nameParts.length - 1];
            if (/^\d+$/.test(lastPart)) return lastPart;
        }
        return null;
    };
    
    const addParticipant = (userId, username, isBot = false, isSelf = false) => {
        const normalizedId = extractUserId(userId, username) || userId;
        if (!participantMap.has(normalizedId)) {
            participantMap.set(normalizedId, {
                user_id: normalizedId,
                username: username || 'Unknown',
                channelId: channelId,
                isBot: isBot,
                isSelf: isSelf
            });
        }
    };
    
    if (window.videoSDKManager && window.videoSDKManager.meeting) {
        const peers = window.videoSDKManager.meeting.participants;
        if (peers) {
            peers.forEach(peer => {
                if (peer.id) {
                    addParticipant(peer.id, peer.displayName || 'Unknown');
                }
            });
        }
    }
    
    if (window.BotComponent && window.BotComponent.voiceBots) {
        window.BotComponent.voiceBots.forEach((botData, botId) => {
            if (botData.channel_id === channelId) {
                addParticipant(botId, botData.username || 'Bot', true);
            }
        });
    }
    
    const currentUserId = document.querySelector('meta[name="user-id"]')?.content;
    const currentUsername = document.querySelector('meta[name="username"]')?.content;
    const userInVoice = window.unifiedVoiceStateManager?.getState()?.isConnected && 
                       window.unifiedVoiceStateManager?.getState()?.channelId === channelId;
                       
    if (currentUserId && userInVoice && !participantMap.has(currentUserId)) {
        addParticipant(currentUserId, currentUsername || 'You', false, true);
    }
    
    return Array.from(participantMap.values());
}


function checkMusicListeners() {
    addBotDebugLog('🎵 Checking music playback and listeners...', 'info');
    
    const musicInfo = getMusicPlaybackInfo();
    
    // First examine the actual music player debug info
    addBotDebugLog('🔍 Analyzing music player state...', 'info');
    const debugInfo = musicInfo.debug;
    
    // Check audio element status
    const audio = debugInfo.audioElement;
    if (audio.src && audio.src !== 'none') {
        addBotDebugLog(`🎧 Audio element has source: ${audio.src.substring(0, 30)}...`, 'info');
        addBotDebugLog(`   Paused: ${audio.paused}, Time: ${Math.round(audio.currentTime || 0)}/${Math.round(audio.duration || 0)}s`, 'info');
    } else {
        addBotDebugLog('❌ Audio element has no source', 'warning');
    }
    
    // Check tracking variables
    addBotDebugLog(`🔄 Player state variables:`, 'info');
    addBotDebugLog(`   isPlaying flag: ${debugInfo.isPlayingFlag}`, debugInfo.isPlayingFlag ? 'success' : 'warning');
    addBotDebugLog(`   Has currentSong: ${!!debugInfo.currentSong}`, debugInfo.currentSong ? 'success' : 'info');
    addBotDebugLog(`   Has currentTrack: ${!!debugInfo.currentTrack}`, debugInfo.currentTrack ? 'success' : 'info');
    addBotDebugLog(`   Queue size: ${debugInfo.queue}`, 'info');
    
    // Check voice channel
    if (!musicInfo.voiceChannelId) {
        addBotDebugLog('❌ No voice channel detected', 'error');
        return;
    }
    
    addBotDebugLog(`🎤 Voice Channel: ${musicInfo.voiceChannelId}`, 'info');
    
    if (musicInfo.isPlaying) {
        addBotDebugLog(`🎵 Now Playing: "${musicInfo.songTitle}" by ${musicInfo.songArtist}`, 'success');
    } else {
        addBotDebugLog('⏹️ No music currently playing', 'warning');
    }
    
    // Analyze command flow
    analyzeMusicCommandFlow();
    
    addBotDebugLog(`👥 Detected ${musicInfo.listeners.length} participants in voice channel:`, 'info');
    
    musicInfo.listeners.forEach(listener => {
        const icon = listener.isBot ? '🤖' : '👤';
        const status = listener.listening ? 'Listening' : 'Not listening';
        const style = listener.listening ? 'success' : 'info';
        
        addBotDebugLog(`   ${icon} ${listener.username} (${listener.user_id}): ${status}`, style);
    });
    
    // Summary
    const listenersCount = musicInfo.listeners.filter(l => l.listening).length;
    
    if (musicInfo.isPlaying && listenersCount > 0) {
        addBotDebugLog(`✅ Music is playing for ${listenersCount} listener(s)`, 'success');
    } else if (musicInfo.isPlaying) {
        addBotDebugLog(`⚠️ Music is playing but no one is listening!`, 'warning');
    } else if (listenersCount > 0) {
        addBotDebugLog(`⚠️ Detected ${listenersCount} listeners but no music is playing`, 'warning');
    } else {
        addBotDebugLog(`ℹ️ No music playing and no listeners`, 'info');
    }
}

function analyzeMusicCommandFlow() {
    const musicPlayer = window.musicPlayer || window.musicPlayerSystem;
    if (!musicPlayer) {
        addBotDebugLog('❌ Music player not available for flow analysis', 'error');
        return;
    }
    
    addBotDebugLog('🔄 Analyzing music command flow...', 'info');
    
    // 1. Command reception
    const socketManager = window.globalSocketManager;
    if (socketManager && socketManager.isReady()) {
        addBotDebugLog('1️⃣ Socket ready for command reception', 'success');
    } else {
        addBotDebugLog('1️⃣ Socket not ready - command reception may fail', 'warning');
    }
    
    // 2. Music player initialization
    if (musicPlayer._audioInitialized) {
        addBotDebugLog('2️⃣ Music player properly initialized', 'success');
    } else {
        addBotDebugLog('2️⃣ Music player not fully initialized', 'warning');
    }
    
    // 3. Audio unlocking
    const audioContext = musicPlayer._audioContext;
    if (audioContext) {
        const contextState = audioContext.state;
        addBotDebugLog(`3️⃣ Audio context state: ${contextState}`, 
            contextState === 'running' ? 'success' : 'warning');
    } else {
        addBotDebugLog('3️⃣ No audio context available', 'warning');
    }
    
    // 4. Music search and track loading
    const lastFoundTrack = musicPlayer.currentSong || musicPlayer.currentTrack;
    if (lastFoundTrack) {
        addBotDebugLog(`4️⃣ Last found track: ${lastFoundTrack.title || 'Unknown'}`, 'success');
        if (lastFoundTrack.previewUrl) {
            addBotDebugLog(`   Has preview URL: ${lastFoundTrack.previewUrl.substring(0, 30)}...`, 'success');
        } else {
            addBotDebugLog('   No preview URL available', 'warning');
        }
    } else {
        addBotDebugLog('4️⃣ No track has been found/loaded', 'warning');
    }
    
    // Check for hooks to intercept command execution
    if (typeof musicPlayer.processBotMusicCommand === 'function') {
        addBotDebugLog('5️⃣ Music command processor available', 'success');
    } else {
        addBotDebugLog('5️⃣ Music command processor missing!', 'error');
    }
}

function testVoiceContextDetection() {
    addBotDebugLog('🔍 Testing voice context detection for bot commands...', 'info');
    

    let voiceChannelId = null;
    let userInVoice = false;
    let detectionMethod = 'none';
    
    addBotDebugLog('🔍 Step 1: Checking unified voice state manager...', 'info');
    const voiceState = window.unifiedVoiceStateManager?.getState();
    
    if (voiceState && voiceState.isConnected && voiceState.channelId) {
        voiceChannelId = voiceState.channelId;
        userInVoice = true;
        detectionMethod = 'unifiedVoiceStateManager';
        addBotDebugLog(`✅ Primary detection successful: channel ${voiceChannelId}`, 'success');
    } 
    else if (window.voiceManager && window.voiceManager.isConnected && window.voiceManager.currentChannelId) {
        voiceChannelId = window.voiceManager.currentChannelId;
        userInVoice = true;
        detectionMethod = 'voiceManagerConnected';
        addBotDebugLog(`✅ Secondary detection successful: channel ${voiceChannelId}`, 'success');
    }
    else if (sessionStorage.getItem('isInVoiceCall') === 'true') {
        const sessionVoiceChannelId = sessionStorage.getItem('voiceChannelId') || 
                                    sessionStorage.getItem('currentVoiceChannelId');
        if (sessionVoiceChannelId) {
            voiceChannelId = sessionVoiceChannelId;
            userInVoice = true;
            detectionMethod = 'sessionStorageVoiceCall';
            addBotDebugLog(`✅ Tertiary detection successful: channel ${voiceChannelId}`, 'success');
        }
    }
    else {
        addBotDebugLog('🔍 Step 2: Checking current page context...', 'info');
        const urlParams = new URLSearchParams(window.location.search);
        const currentChannelId = urlParams.get('channel');
        const metaChannelType = document.querySelector('meta[name="channel-type"]')?.content;

        if (metaChannelType === 'voice' && currentChannelId) {
            voiceChannelId = currentChannelId;
            const channelElement = document.querySelector(`[data-channel-id="${currentChannelId}"][data-channel-type="voice"]`);
            if (channelElement) {
                const hasVoiceIndicator = document.querySelector('.voice-call-app:not(.hidden)') || 
                                        document.querySelector('[data-voice-connected="true"]') ||
                                        window.videoSDKManager?.isMeetingJoined;
                
                userInVoice = hasVoiceIndicator || false;
                detectionMethod = hasVoiceIndicator ? 'currentVoiceChannelPage+connected' : 'currentVoiceChannelPage+notConnected';
                
                addBotDebugLog(`🔍 Page detection: channel ${voiceChannelId}, connected: ${userInVoice}`, userInVoice ? 'success' : 'warning');
            }
        }
    }
    

    if (voiceChannelId && !userInVoice) {
        addBotDebugLog('🔍 Step 3: Performing additional verification checks...', 'info');
        
        if (window.videoSDKManager && window.videoSDKManager.isMeetingJoined) {
            userInVoice = true;
            detectionMethod += '+videoSDKVerified';
            addBotDebugLog('✅ VideoSDK connection verified - user IS in voice', 'success');
        }
        
        if (!userInVoice) {
            const voiceUIVisible = document.querySelector('.voice-call-app:not(.hidden)') || 
                                 document.querySelector('.voice-controls:not(.hidden)') ||
                                 document.querySelector('[data-voice-status="connected"]');
            
            if (voiceUIVisible) {
                userInVoice = true;
                detectionMethod += '+voiceUIVerified';
                addBotDebugLog('✅ Voice UI indicators verified - user IS in voice', 'success');
            }
        }
        
        if (!userInVoice && window.unifiedVoiceStateManager) {
            const freshState = window.unifiedVoiceStateManager.getState();
            if (freshState && freshState.isConnected) {
                userInVoice = true;
                detectionMethod += '+freshStateVerified';
                addBotDebugLog('✅ Fresh unified state verified - user IS in voice', 'success');
            }
        }
    }
    

    addBotDebugLog('🎯 FINAL DETECTION RESULT:', 'info');
    addBotDebugLog(`   Voice Channel ID: ${voiceChannelId || 'None'}`, voiceChannelId ? 'success' : 'error');
    addBotDebugLog(`   User In Voice: ${userInVoice}`, userInVoice ? 'success' : 'error');
    addBotDebugLog(`   Detection Method: ${detectionMethod}`, 'info');
    
    if (voiceChannelId && userInVoice) {
        addBotDebugLog('🎉 SUCCESS: Bot commands should work!', 'success');
        return true;
    } else if (voiceChannelId && !userInVoice) {
        addBotDebugLog('❌ FAILURE: Bot will reject commands (detected as not in voice)', 'error');
        addBotDebugLog('💡 This indicates the bug is still present', 'warning');
        return false;
    } else {
        addBotDebugLog('❌ FAILURE: No voice context detected', 'error');
        addBotDebugLog('💡 User may not be in a voice channel', 'warning');
        return false;
    }
}

let botDebugLogCount = 0;
function addBotDebugLog(message, type = 'info') {
    const logsContainer = document.getElementById('bot-debug-logs');
    if (!logsContainer) return;
    
    botDebugLogCount++;
    const timestamp = new Date().toLocaleTimeString();
    const colors = {
        info: 'text-green-400',
        warning: 'text-yellow-400',
        error: 'text-red-400',
        success: 'text-blue-400'
    };
    
    const logEntry = document.createElement('div');
    logEntry.className = `${colors[type] || 'text-green-400'} mb-1`;
    logEntry.innerHTML = `<span class="text-gray-500">[${timestamp}]</span> ${message}`;
    
    logsContainer.appendChild(logEntry);
    logsContainer.scrollTop = logsContainer.scrollHeight;
    
    if (botDebugLogCount > 50) {
        logsContainer.removeChild(logsContainer.firstChild);
        botDebugLogCount--;
    }
}

function clearBotDebugLogs() {
    const logsContainer = document.getElementById('bot-debug-logs');
    if (logsContainer) {
        logsContainer.innerHTML = '<div class="text-gray-500">Logs cleared...</div>';
        botDebugLogCount = 0;
    }
}

function testParticipantDeduplication() {
    addBotDebugLog('🧪 Testing participant deduplication fix...', 'info');
    
    const voiceChannelId = window.unifiedVoiceStateManager?.getState()?.channelId;
    if (!voiceChannelId) {
        addBotDebugLog('❌ No voice channel detected', 'error');
        return;
    }
    
    const participants = getVoiceChannelParticipants(voiceChannelId);
    
    addBotDebugLog(`📊 Found ${participants.length} participants:`, 'info');
    participants.forEach(p => {
        addBotDebugLog(`   👤 ${p.username} (${p.user_id}) ${p.isBot ? '🤖' : ''} ${p.isSelf ? '👆' : ''}`, 'info');
    });
    
    const uniqueIds = new Set(participants.map(p => p.user_id));
    if (uniqueIds.size !== participants.length) {
        addBotDebugLog(`❌ DUPLICATION STILL EXISTS! ${participants.length} participants but only ${uniqueIds.size} unique IDs`, 'error');
        
        const duplicates = participants.filter((p, index) => 
            participants.findIndex(other => other.user_id === p.user_id) !== index
        );
        duplicates.forEach(dup => {
            addBotDebugLog(`   🔄 Duplicate: ${dup.username} (${dup.user_id})`, 'error');
        });
        return false;
    } else {
        addBotDebugLog(`✅ NO DUPLICATES FOUND! All ${participants.length} participants are unique`, 'success');
        return true;
    }
}
</script>

<script>
document.addEventListener('DOMContentLoaded', function() {
    if (window.addEventListener) {
        window.addEventListener('globalSocketReady', function(event) {
            if (event.detail?.manager?.io) {
                event.detail.manager.io.on('debug-test-response', function(response) {
                    if (response.success) {

                    } else {
                        console.error('❌ Debug test failed on server:', response);
                    }
                });
            }
        });
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === '1') {
            e.preventDefault();
            

            showPresenceDebugPanel();
        }
        
        if (e.ctrlKey && e.key === '2') {
            e.preventDefault();
            

            showBotDebugPanel();
        }
    });
    


    
    window.addEventListener('error', function(event) {
        if (event.message && (event.message.includes('socket') || event.message.includes('Socket') || event.message.includes('io'))) {
            console.error('🚨 SOCKET-RELATED ERROR:', event.error);
        }
    });
});
</script>

<?php if (isset($head_scripts) && is_array($head_scripts)): ?>
    <?php foreach ($head_scripts as $script): ?>
        <script src="<?php echo js($script); ?>?v=<?php echo $cache_version; ?>" type="module"></script>
    <?php endforeach; ?>
<?php endif; ?>

<script src="<?php echo js('utils/lazy-loader'); ?>?v=<?php echo $cache_version; ?>" type="module"></script>

<script>
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === '9') {
            e.preventDefault();
            
            fetch('/api/bot/create-titibot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            })
            .then(response => {
                return response.json().then(data => ({
                    status: response.status,
                    body: data
                }));
            })
            .then(({ status, body }) => {
                if (body.success) {
                    alert(body.message || 'Bot created successfully!');
                } else {
                    if (status === 409) {
                        alert('Info: ' + (body.message || 'Bot already exists.'));
                    } else {
                        alert('Error: ' + (body.message || 'Could not create bot.'));
                    }
                }
            })
            .catch(error => {
                console.error('Error creating titibot:', error);
                alert('An unexpected error occurred.');
            });
        }
    });
</script>
