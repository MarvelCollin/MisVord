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
// Global username initialization - available on all pages
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

<link rel="stylesheet" href="<?= asset('/css/server-dropdown.css') ?>?v=<?php echo $cache_version; ?>">

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
    
    if (socketManager?.isReady()) {
        const status = socketManager.currentPresenceStatus || 'Unknown';
        const activity = socketManager.currentActivityDetails;
        const isInVoice = socketManager.isUserInVoiceCall();
        const lastSource = socketManager.lastPresenceSource || 'N/A';
        const videosdkConnected = (window.videoSDKManager && window.videoSDKManager.isMeetingJoined) || sessionStorage.getItem('isInVoiceCall')==='true';
        
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
document.addEventListener('DOMContentLoaded', function() {
    if (window.addEventListener) {
        window.addEventListener('globalSocketReady', function(event) {
            if (event.detail?.manager?.io) {
                event.detail.manager.io.on('debug-test-response', function(response) {
                    if (response.success) {
                        console.log('Debug test acknowledged by server:', response);
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
            
            console.log('🎯 Presence Debug Panel triggered...');
            showPresenceDebugPanel();
        }
    });
    
    console.log('🎯 Presence Debug Panel: Press Ctrl+1 to open presence debugging tools');
    
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
