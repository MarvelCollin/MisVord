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
<meta name="user-authenticated" content="true">
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
<link rel="stylesheet" href="<?php echo css('message-context-menu'); ?>?v=<?php echo $cache_version; ?>">
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
    console.log('🔍 SOCKET DIAGNOSTIC: Starting early diagnostic checks...');
    
    
    window.addEventListener('DOMContentLoaded', function() {
        console.log('🔍 DOM Loaded - Socket.IO available:', typeof io !== 'undefined');
        
        if (typeof io === 'undefined') {
            console.error('❌ CRITICAL: Socket.IO library failed to load!');
            return;
        }
        
        const isAuthenticated = document.querySelector('meta[name="user-authenticated"]')?.content === 'true';
        const userId = document.querySelector('meta[name="user-id"]')?.content;
        const username = document.querySelector('meta[name="username"]')?.content;
        const socketHost = document.querySelector('meta[name="socket-host"]')?.content;
        const socketPort = document.querySelector('meta[name="socket-port"]')?.content;
        
        console.log('🔍 Early User Check:', {
            isAuthenticated,
            userId,
            username,
            socketHost,
            socketPort
        });
        
        let checkCount = 0;
        const maxChecks = 20;
        
        const checkSocketManager = () => {
            checkCount++;
            
            if (window.globalSocketManager) {
                console.log('✅ GlobalSocketManager found after', checkCount * 500, 'ms');
                
                setTimeout(() => {
                    const status = window.globalSocketManager.getStatus();
                    console.log('🔍 Initial Socket Status:', status);
                    
                    if (!status.connected && !status.lastError) {
                        console.log('🔧 Socket not connected, attempting manual initialization...');
                        
                        if (isAuthenticated && userId && username) {
                            window.__SOCKET_INITIALISED__ = false;
                            const initResult = window.globalSocketManager.init({ user_id: userId, username: username });
                            console.log('🔧 Manual init result:', initResult);
                        }
                    }
                }, 1000);
                
                return;
            }
            
            if (checkCount >= maxChecks) {
                console.error('❌ GlobalSocketManager not found after 10 seconds');
                return;
            }
            
            setTimeout(checkSocketManager, 500);
        };
        
        setTimeout(checkSocketManager, 500);
    });
    
    window.addEventListener('globalSocketReady', function(event) {
        console.log('🎉 SOCKET READY EVENT:', event.detail);
    });
    
    window.addEventListener('socketAuthenticated', function(event) {
        console.log('🔐 SOCKET AUTHENTICATED EVENT:', event.detail);
    });
    
    window.addEventListener('error', function(event) {
        if (event.message && (event.message.includes('socket') || event.message.includes('Socket') || event.message.includes('io'))) {
            console.error('🚨 SOCKET-RELATED ERROR:', event.error);
        }
    });
    </script>
<?php endif; ?>

<?php if (isset($include_channel_loader) && $include_channel_loader): ?>
    
<?php endif; ?>

<script>
function showMasterDebugModal() {
    const existingModal = document.getElementById('master-debug-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'master-debug-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4';
    
    modal.innerHTML = `
        <div class="bg-discord-dark rounded-lg border border-blue-500 max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
            <div class="flex items-center justify-between p-4 border-b border-gray-700">
                <h2 class="text-xl font-bold text-white flex items-center">
                    <i class="fas fa-tools mr-2 text-blue-400"></i>
                    Master Debug Panel
                    <span id="debug-status-indicator" class="ml-2 px-2 py-1 text-xs rounded bg-green-700 text-green-300">Ready</span>
                </h2>
                <button onclick="document.getElementById('master-debug-modal').remove()" class="text-gray-400 hover:text-white text-xl">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="flex-1 flex overflow-hidden">
                <div class="w-1/4 border-r border-gray-700 flex flex-col">
                    <div class="p-3 border-b border-gray-700">
                        <h3 class="text-sm font-semibold text-gray-300 mb-2">Navigation</h3>
                        <div class="space-y-1">
                            <button onclick="switchMasterTab('bot')" id="bot-master-tab" class="w-full text-left px-3 py-2 text-sm rounded bg-blue-600 text-white">
                                <i class="fas fa-robot mr-2"></i>Bot Management
                            </button>
                            <button onclick="switchMasterTab('debug')" id="debug-master-tab" class="w-full text-left px-3 py-2 text-sm rounded text-gray-400 hover:bg-gray-700 hover:text-white">
                                <i class="fas fa-bug mr-2"></i>Socket Debug
                            </button>
                            <button onclick="switchMasterTab('position')" id="position-master-tab" class="w-full text-left px-3 py-2 text-sm rounded text-gray-400 hover:bg-gray-700 hover:text-white">
                                <i class="fas fa-sort mr-2"></i>Position Sync
                            </button>
                            <button onclick="switchMasterTab('music')" id="music-master-tab" class="w-full text-left px-3 py-2 text-sm rounded text-gray-400 hover:bg-gray-700 hover:text-white">
                                <i class="fas fa-music mr-2"></i>Music Player
                            </button>
                            <button onclick="switchMasterTab('auth')" id="auth-master-tab" class="w-full text-left px-3 py-2 text-sm rounded text-gray-400 hover:bg-gray-700 hover:text-white">
                                <i class="fas fa-key mr-2"></i>Auth Reset
                            </button>
                            <button onclick="switchMasterTab('logs')" id="logs-master-tab" class="w-full text-left px-3 py-2 text-sm rounded text-gray-400 hover:bg-gray-700 hover:text-white">
                                <i class="fas fa-list mr-2"></i>Live Logs
                            </button>
                        </div>
                </div>
                
                    <div class="p-3 border-b border-gray-700">
                        <h3 class="text-sm font-semibold text-gray-300 mb-2">System Status</h3>
                        <div id="system-status-grid" class="space-y-1 text-xs">
                            <div class="flex justify-between">
                                <span class="text-gray-400">Socket:</span>
                                <span id="socket-status-master" class="text-red-400">❌ No</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-400">Bot:</span>
                                <span id="bot-status-master" class="text-red-400">❌ No</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-400">Music:</span>
                                <span id="music-status-master" class="text-red-400">❌ No</span>
                            </div>
                    </div>
                </div>
                
                    <div class="p-3 flex-1 overflow-y-auto">
                        <h3 class="text-sm font-semibold text-gray-300 mb-2">Quick Actions</h3>
                        <div class="space-y-1 text-xs">
                            <button onclick="testBotMessage()" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded">
                                <i class="fas fa-paper-plane mr-1"></i>Test Bot
                            </button>
                            <button onclick="debugSocketConnection()" class="w-full bg-green-600 hover:bg-green-700 text-white py-1 px-2 rounded">
                                <i class="fas fa-plug mr-1"></i>Debug Socket
                            </button>
                            <button onclick="refreshMasterStatus()" class="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-1 px-2 rounded">
                                <i class="fas fa-sync mr-1"></i>Refresh All
                    </button>
                </div>
                    </div>
                </div>
                
                <div class="flex-1 flex flex-col">
                    <div id="bot-master-content" class="flex-1 p-4 master-tab-content">
                        <h3 class="text-lg font-semibold text-white mb-4">Bot Management</h3>
                        <div class="space-y-4">
                            <div class="bg-gray-800 rounded-lg p-4">
                                <h4 class="text-md font-semibold text-gray-300 mb-3">TitiBot Control</h4>
                                <div class="mb-3">
                                    <label class="block text-gray-400 text-sm mb-2">Select Server:</label>
                                    <select id="server-select-master" class="w-full bg-discord-lighter text-white p-2 rounded">
                                        <option value="">Loading servers...</option>
                    </select>
                                </div>
                                <div class="grid grid-cols-2 gap-3">
                                    <button id="create-bot-master" onclick="createTitiBot()" class="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded">
                                        <i class="fas fa-plus mr-1"></i>Create Bot
                                    </button>
                                    <button id="init-bot-master" onclick="initializeTitiBot()" class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded">
                                        <i class="fas fa-play mr-1"></i>Initialize
                                    </button>
                                </div>
                                <div id="bot-status-info" class="mt-3 p-3 bg-gray-700 rounded text-sm text-gray-300">
                                    Checking bot status...
                                </div>
                </div>
                
                            <div class="bg-gray-800 rounded-lg p-4">
                                <h4 class="text-md font-semibold text-gray-300 mb-3">Bot Testing</h4>
                                <div class="flex space-x-2 mb-3">
                                    <input type="text" id="test-command-master" value="/titibot ping" 
                                           class="flex-1 bg-discord-lighter text-white px-3 py-2 rounded">
                                    <button onclick="sendTestCommand()" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded">
                                        Send
                    </button>
                                </div>
                                <div class="text-xs text-gray-500">
                                    Common commands: /titibot ping, /titibot help, /titibot time
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div id="debug-master-content" class="flex-1 p-4 master-tab-content hidden">
                        <h3 class="text-lg font-semibold text-white mb-4">Socket Debug</h3>
                        <div class="space-y-4">
                            <div class="bg-gray-800 rounded-lg p-4">
                                <h4 class="text-md font-semibold text-gray-300 mb-3">Connection Status</h4>
                                <div id="socket-debug-info" class="space-y-2 text-sm">
                                    <div>Socket ID: <span id="socket-id-master" class="text-blue-400">-</span></div>
                                    <div>User ID: <span id="user-id-master" class="text-green-400">-</span></div>
                                    <div>Username: <span id="username-master" class="text-yellow-400">-</span></div>
                                    <div>Current Room: <span id="current-room-master" class="text-purple-400">-</span></div>
                                </div>
                            </div>
                            
                            <div class="bg-gray-800 rounded-lg p-4">
                                <h4 class="text-md font-semibold text-gray-300 mb-3">Debug Actions</h4>
                                <div class="grid grid-cols-2 gap-2">
                                    <button onclick="forceBotInit()" class="bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm">
                                        Force Bot Init
                                    </button>
                                    <button onclick="testSocketConnection()" class="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 rounded text-sm">
                                        Test Connection
                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div id="position-master-content" class="flex-1 p-4 master-tab-content hidden">
                        <h3 class="text-lg font-semibold text-white mb-4">Position Sync Management</h3>
                        <div class="space-y-4">
                            <div class="bg-gray-800 rounded-lg p-4">
                                <h4 class="text-md font-semibold text-gray-300 mb-3">Sync Options</h4>
                                <div class="grid grid-cols-2 gap-3 mb-3">
                                    <button onclick="syncServerPositions(false)" class="bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded">
                                        <i class="fas fa-sort mr-1"></i>Traditional Sync
                                    </button>
                                    <button onclick="syncServerPositions(true)" class="bg-orange-600 hover:bg-orange-700 text-white py-2 px-3 rounded">
                                        <i class="fas fa-sort-numeric-down mr-1"></i>Global Sync
                                    </button>
                                </div>
                                <div class="grid grid-cols-2 gap-3">
                                    <button onclick="verifyPositions()" class="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-3 rounded">
                                        <i class="fas fa-search mr-1"></i>Check Positions
                                    </button>
                                    <button onclick="showPositionDetails()" class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded">
                                        <i class="fas fa-list mr-1"></i>Show Details
                                    </button>
                                </div>
                                <div id="sync-status-master" class="mt-3 p-3 bg-gray-700 rounded text-sm text-center">
                                    Ready for position sync
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div id="music-master-content" class="flex-1 p-4 master-tab-content hidden">
                        <h3 class="text-lg font-semibold text-white mb-4">Music Player</h3>
                        <div class="space-y-4">
                            <div class="bg-gray-800 rounded-lg p-4">
                                <h4 class="text-md font-semibold text-gray-300 mb-3">Music Controls</h4>
                                <div class="grid grid-cols-2 gap-3">
                                    <button onclick="showMusicDebug()" class="bg-pink-600 hover:bg-pink-700 text-white py-2 px-3 rounded">
                                        <i class="fas fa-music mr-1"></i>Music Debug
                                    </button>
                                    <button onclick="showMusicSearch()" class="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-3 rounded">
                                        <i class="fas fa-search mr-1"></i>Search Music
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div id="auth-master-content" class="flex-1 p-4 master-tab-content hidden">
                        <h3 class="text-lg font-semibold text-white mb-4">Authentication Reset</h3>
                        <div class="space-y-4">
                            <div class="bg-gray-800 rounded-lg p-4">
                                <h4 class="text-md font-semibold text-gray-300 mb-3">Reset Authentication</h4>
                                <div class="mb-3 p-3 bg-red-900/20 border border-red-700/30 rounded">
                                    <p class="text-red-300 text-sm">
                                        <i class="fas fa-exclamation-triangle mr-1"></i>
                                        This will log you out and clear all session data.
                                    </p>
                                </div>
                                <button onclick="resetAuthSession()" class="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded">
                                    <i class="fas fa-sign-out-alt mr-1"></i>Reset & Logout
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div id="logs-master-content" class="flex-1 p-4 master-tab-content hidden">
                        <h3 class="text-lg font-semibold text-white mb-4">Live Debug Logs</h3>
                        <div class="space-y-4">
                            <div class="flex items-center justify-between">
                                <span class="text-gray-300">Real-time system logs</span>
                                <button onclick="clearDebugLogs()" class="text-red-400 hover:text-red-300 text-sm">
                                    <i class="fas fa-trash mr-1"></i>Clear Logs
                                </button>
                            </div>
                            <div id="debug-logs-master" class="bg-black rounded p-3 h-96 overflow-y-auto font-mono text-xs text-green-400">
                                <div class="text-gray-500">Debug logs will appear here...</div>
                            </div>
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
    
    initializeMasterDebugPanel();
}

async function createTitiBot() {
    const button = document.getElementById('create-bot-master') || document.getElementById('create-bot-btn');
    if (!button) return;
    
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creating...';
    button.disabled = true;
    
    addDebugLogMaster('🤖 Creating TitiBot...', 'info');
    
    try {
        const response = await fetch('/api/bots/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'titibot',
                email: 'titibot@misvord.local'
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            addDebugLogMaster('✅ TitiBot created successfully!', 'success');
            
            if (window.showToast) {
                window.showToast('✅ TitiBot created successfully!', 'success');
            }
            
            window.titiBotData = (data.data && data.data.bot) ? data.data.bot : (data.bot || null);
            
            const statusInfo = document.getElementById('bot-status-info') || document.getElementById('bot-status');
            if (statusInfo) {
                statusInfo.innerHTML = '<span class="text-green-400"><i class="fas fa-check-circle mr-1"></i>TitiBot created and ready</span>';
            }
            
            button.innerHTML = '<i class="fas fa-plus mr-2"></i>Create Bot';
            button.disabled = false;
            
            refreshMasterStatus();
            
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create bot');
        }
    } catch (error) {
        addDebugLogMaster(`❌ Failed to create TitiBot: ${error.message}`, 'error');
        
        if (window.showToast) {
            window.showToast('❌ Failed to create TitiBot: ' + error.message, 'error');
        }
        
        button.innerHTML = '<i class="fas fa-plus mr-2"></i>Create Bot';
        button.disabled = false;
    }
}

async function initializeTitiBot() {
    const serverSelect = document.getElementById('server-select-master') || document.getElementById('server-select');
    const initButton = document.getElementById('init-bot-master') || document.getElementById('init-bot-btn');
    
    if (!serverSelect || !serverSelect.value) {
        if (window.showToast) {
            window.showToast('⚠️ Please select a server first', 'warning');
        }
        return;
    }
    
    const serverId = serverSelect.value;
    const serverName = serverSelect.options[serverSelect.selectedIndex].text;
    
    initButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Initializing...';
    initButton.disabled = true;
    
    try {
        let botId = window.titiBotData?.id;
        
        if (!botId) {
            const checkResponse = await fetch('/api/bots/check/titibot');
            if (checkResponse.ok) {
                const checkData = await checkResponse.json();
                if (checkData.exists && checkData.is_bot) {
                    botId = checkData.bot.id;
                    window.titiBotData = checkData.bot;
                }
            }
        }
        
        if (!botId) {
            throw new Error('TitiBot not found');
        }
        
        const addResponse = await fetch('/api/bots/add-to-server', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                bot_id: botId,
                server_id: serverId
            })
        });
        
        if (addResponse.ok) {
            console.log('Bot added to server successfully');
            
            if (window.globalSocketManager && window.globalSocketManager.isReady()) {
                
                window.globalSocketManager.io.emit('bot-init', {
                    bot_id: botId,
                    username: 'titibot'
                });
                
                window.globalSocketManager.io.emit('bot-join-channel', {
                    bot_id: botId,
                    channel_id: serverId
                });
                
                console.log('Bot initialization and channel join events sent');
            }
            
            if (window.showToast) {
                window.showToast(`✅ TitiBot initialized in ${serverName}!`, 'success');
            }
            
            document.getElementById('titibot-modal').remove();
            
        } else {
            const errorData = await addResponse.json();
            throw new Error(errorData.message || 'Failed to add bot to server');
        }
        
    } catch (error) {
        console.error('Error initializing TitiBot:', error);
        if (window.showToast) {
            window.showToast('❌ Failed to initialize TitiBot: ' + error.message, 'error');
        }
        
        initButton.innerHTML = '<i class="fas fa-play mr-2"></i>Initialize Bot';
        initButton.disabled = false;
    }
}

function switchMasterTab(tabName) {
    const tabs = ['bot', 'debug', 'position', 'music', 'auth', 'logs'];
    
    tabs.forEach(tab => {
        const tabButton = document.getElementById(`${tab}-master-tab`);
        const tabContent = document.getElementById(`${tab}-master-content`);
        
        if (tab === tabName) {
            tabButton.className = 'w-full text-left px-3 py-2 text-sm rounded bg-blue-600 text-white';
            tabContent.classList.remove('hidden');
        } else {
            tabButton.className = 'w-full text-left px-3 py-2 text-sm rounded text-gray-400 hover:bg-gray-700 hover:text-white';
            tabContent.classList.add('hidden');
        }
    });
}

function initializeMasterDebugPanel() {
    refreshMasterStatus();
    loadUserServersForMaster();
    checkBotStatusForMaster();
    
    addDebugLogMaster('🚀 Master Debug Panel initialized', 'success');
    addDebugLogMaster('All debugging tools consolidated in one interface', 'info');
    
    if (window.globalSocketManager?.io) {
        const originalEmit = window.globalSocketManager.io.emit;
        window.globalSocketManager.io.emit = function(event, data) {
            if (event === 'save-and-send-message') {
                addDebugLogMaster(`📤 Message: "${data.content?.substring(0, 30)}..."`, 'info');
            }
            return originalEmit.call(this, event, data);
        };
        
        window.globalSocketManager.io.on('bot-initialized', (data) => {
            addDebugLogMaster(`✅ Bot initialized: ${data.username}`, 'success');
            refreshMasterStatus();
        });
        
        window.globalSocketManager.io.on('bot-response', (data) => {
            addDebugLogMaster(`🎤 Bot response: "${data.content?.substring(0, 30)}..."`, 'success');
        });
    }
}

function refreshMasterStatus() {
    const socketConnected = window.globalSocketManager?.connected;
    const botReady = window.titiBotData?.id;
    const musicReady = window.musicPlayer && typeof MusicPlayerSystem !== 'undefined';
    
    document.getElementById('socket-status-master').innerHTML = socketConnected ? '✅ Yes' : '❌ No';
    document.getElementById('socket-status-master').className = socketConnected ? 'text-green-400' : 'text-red-400';
    
    document.getElementById('bot-status-master').innerHTML = botReady ? '✅ Yes' : '❌ No';
    document.getElementById('bot-status-master').className = botReady ? 'text-green-400' : 'text-red-400';
    
    document.getElementById('music-status-master').innerHTML = musicReady ? '✅ Yes' : '❌ No';
    document.getElementById('music-status-master').className = musicReady ? 'text-green-400' : 'text-red-400';
    
    const socketId = window.globalSocketManager?.io?.id;
    const userId = document.querySelector('meta[name="user-id"]')?.content;
    const username = document.querySelector('meta[name="username"]')?.content;
    
    if (document.getElementById('socket-id-master')) {
        document.getElementById('socket-id-master').textContent = socketId || '-';
        document.getElementById('user-id-master').textContent = userId || '-';
        document.getElementById('username-master').textContent = username || '-';
        document.getElementById('current-room-master').textContent = getCurrentChannelId() || 'Not in channel';
    }
}

async function loadUserServersForMaster() {
    try {
        const response = await fetch('/api/user/servers');
        const data = await response.json();
        const serverSelect = document.getElementById('server-select-master');
        
        if (data.success && data.servers) {
            serverSelect.innerHTML = '<option value="">Select a server...</option>';
            data.servers.forEach(server => {
                const option = document.createElement('option');
                option.value = server.id;
                option.textContent = server.name;
                serverSelect.appendChild(option);
            });
        } else {
            serverSelect.innerHTML = '<option value="">No servers available</option>';
        }
    } catch (error) {
        console.error('Failed to load servers:', error);
    }
}

async function checkBotStatusForMaster() {
    try {
        const response = await fetch('/api/bots/check/titibot');
        if (response.ok) {
            const data = await response.json();
            const botExists = data.exists && data.is_bot;
            const statusInfo = document.getElementById('bot-status-info');
            
            if (botExists) {
                window.titiBotData = data.bot;
                statusInfo.innerHTML = '<span class="text-green-400"><i class="fas fa-check-circle mr-1"></i>TitiBot exists and ready</span>';
            } else {
                statusInfo.innerHTML = '<span class="text-yellow-400"><i class="fas fa-exclamation-circle mr-1"></i>TitiBot needs to be created</span>';
            }
            
            refreshMasterStatus();
        }
    } catch (error) {
        console.error('Failed to check bot status:', error);
    }
}

function showMusicDebug() {
    if (window.musicPlayer) {
        window.musicPlayer.showMusicDebugPanel();
    } else if (typeof MusicPlayerSystem !== 'undefined') {
        window.musicPlayer = new MusicPlayerSystem();
        setTimeout(() => window.musicPlayer.showMusicDebugPanel(), 100);
    } else {
        addDebugLogMaster('🎵 Music player not available', 'warning');
    }
}

function showMusicSearch() {
    if (window.musicPlayer) {
        window.musicPlayer.showSearchModal();
    } else if (typeof MusicPlayerSystem !== 'undefined') {
        window.musicPlayer = new MusicPlayerSystem();
        setTimeout(() => window.musicPlayer.showSearchModal(), 100);
    } else {
        addDebugLogMaster('🎵 Music search not available', 'warning');
    }
}

function testSocketConnection() {
    addDebugLogMaster('🔍 Testing socket connection...', 'info');
    debugSocketConnection();
}

let debugLogCountMaster = 0;
function addDebugLogMaster(message, type = 'info') {
    const logsContainer = document.getElementById('debug-logs-master');
    if (!logsContainer) return;
    
    debugLogCountMaster++;
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
    
    if (debugLogCountMaster > 100) {
        logsContainer.removeChild(logsContainer.firstChild);
        debugLogCountMaster--;
    }
}

function resetAuthSession() {
    console.log('🔓 Starting authentication reset...');
    
    const modal = document.getElementById('auth-reset-modal');
    if (modal) {
        const button = modal.querySelector('button[onclick="resetAuthSession()"]');
        if (button) {
            button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Resetting...';
            button.disabled = true;
        }
    }
    
    try {
        if (window.globalSocketManager && window.globalSocketManager.io) {
            console.log('Disconnecting from socket...');
            window.globalSocketManager.io.disconnect();
        }
        
        if (window.MisVordMessaging && window.MisVordMessaging.disconnect) {
            console.log('Disconnecting messaging...');
            window.MisVordMessaging.disconnect();
        }
        
        console.log('Clearing localStorage...');
        const authKeys = [
            'authToken', 'rememberMe', 'userAuth', 'lastEmail', 
            'user_id', 'username', 'discriminator', 'avatar_url', 
            'banner_url', 'auth_data', 'session_id', 'login_state',
            'user_data', 'admin_access', 'login_history', 'user_settings',
            'user_status', 'fresh_login', 'csrf_token'
        ];
        
        authKeys.forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
        
        console.log('Clearing cookies...');
        document.cookie.split(';').forEach(cookie => {
            const [name] = cookie.trim().split('=');
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
        });
        
        console.log('Making logout request...');
        fetch('/logout', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        }).then(() => {
            console.log('✅ Logout request completed');
        }).catch(error => {
            console.warn('Logout request failed, but continuing with redirect:', error);
        }).finally(() => {
            console.log('🚀 Redirecting to login...');
            window.location.href = '/login';
        });
        
    } catch (error) {
        console.error('❌ Error during auth reset:', error);
        if (window.showToast) {
            window.showToast('Error during reset, redirecting anyway...', 'warning');
        }
        setTimeout(() => {
            window.location.href = '/login';
        }, 1000);
    }
}

function clearDebugLogs() {
    const logsContainer = document.getElementById('debug-logs-master') || document.getElementById('debug-logs');
    if (logsContainer) {
        logsContainer.innerHTML = '<div class="text-gray-500">Logs cleared...</div>';
        debugLogCountMaster = 0;
        debugLogCount = 0;
    }
}
    
function sendTestCommand() {
    const command = document.getElementById('test-command-master')?.value || document.getElementById('test-command')?.value;
    const roomId = document.getElementById('test-room-id')?.value || getCurrentChannelId();
    
    if (!command) {
        addDebugLogMaster('❌ No test command specified', 'error');
        return;
    }
    
    addDebugLogMaster(`🎯 Sending test command: "${command}" to room: ${roomId}`, 'info');
    
    const testMessage = {
        content: command,
        target_type: window.location.pathname.includes('/server/') ? 'channel' : 'dm',
        target_id: roomId,
        message_type: 'text',
        attachments: [],
        timestamp: new Date().toISOString()
    };
    
    if (window.globalSocketManager?.io) {
        window.globalSocketManager.io.emit('save-and-send-message', testMessage);
        addDebugLogMaster('📤 Test command sent via WebSocket', 'success');
    } else {
        addDebugLogMaster('❌ No socket connection to send test command', 'error');
    }
}
            
            function testBotMessage() {
    addDebugLogMaster('🧪 Testing bot message flow...', 'info');
    
    if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
        addDebugLogMaster('❌ Socket not ready for testing', 'error');
        return;
    }
    
    const currentChannelId = getCurrentChannelId();
    const userId = document.querySelector('meta[name="user-id"]')?.content;
    const username = document.querySelector('meta[name="username"]')?.content;
    
    addDebugLogMaster(`🔍 Current context: channelId=${currentChannelId}, userId=${userId}, username=${username}`, 'info');
    
    let targetType, targetId;
    if (window.location.pathname.includes('/server/') && currentChannelId) {
        targetType = 'channel';
        targetId = currentChannelId;
    } else if (window.location.pathname.includes('/home/channels/dm/')) {
        targetType = 'dm';
        const dmMatch = window.location.pathname.match(/\/dm\/([^\/]+)/);
        targetId = dmMatch ? dmMatch[1] : currentChannelId;
    } else {
        targetType = 'channel';
        targetId = currentChannelId || '1';
    }
    
    const testMessage = {
        content: '/titibot ping',
        target_type: targetType,
        target_id: targetId,
        message_type: 'text',
        attachments: [],
        timestamp: new Date().toISOString()
    };
    
    addDebugLogMaster(`🎯 Sending test message with correct fields:`, 'info');
    addDebugLogMaster(`   content: "${testMessage.content}"`, 'info');
    addDebugLogMaster(`   target_type: "${testMessage.target_type}"`, 'info');
    addDebugLogMaster(`   target_id: "${testMessage.target_id}"`, 'info');
    
    window.globalSocketManager.io.emit('save-and-send-message', testMessage);
}

function debugSocketConnection() {
    addDebugLogMaster('🔍 Debugging socket connection...', 'info');
    
    const socketStatus = {
        socketIOAvailable: typeof io !== 'undefined',
        globalSocketManager: !!window.globalSocketManager,
        socketConnected: window.globalSocketManager?.connected,
        socketId: window.globalSocketManager?.io?.id,
        rooms: Array.from(window.globalSocketManager?.io?.rooms || [])
    };
    
    addDebugLogMaster(`Socket.IO Available: ${socketStatus.socketIOAvailable}`, socketStatus.socketIOAvailable ? 'success' : 'error');
    addDebugLogMaster(`Global Manager Ready: ${socketStatus.globalSocketManager}`, socketStatus.globalSocketManager ? 'success' : 'error');
    addDebugLogMaster(`Socket Connected: ${socketStatus.socketConnected}`, socketStatus.socketConnected ? 'success' : 'error');
    addDebugLogMaster(`Socket ID: ${socketStatus.socketId || 'N/A'}`, 'info');
    addDebugLogMaster(`Joined Rooms: ${socketStatus.rooms.join(', ') || 'None'}`, 'info');
    
    if (window.globalSocketManager?.io) {
        window.globalSocketManager.io.emit('debug-test', 'Master Debug Panel Test');
        addDebugLogMaster('📡 Debug test signal sent to server', 'info');
    }
}

function forceBotInit() {
    addDebugLogMaster('⚡ Forcing bot initialization...', 'warning');
    
    if (!window.globalSocketManager?.io) {
        addDebugLogMaster('❌ No socket connection for bot initialization', 'error');
        return;
    }
    
    const initData = {
        bot_id: 'titibot',
        username: 'titibot',
        force: true
    };
    
    window.globalSocketManager.io.emit('bot-init', initData);
    addDebugLogMaster('🤖 Bot initialization signal sent', 'success');
}
                    
function getCurrentChannelId() {
    const urlParams = new URLSearchParams(window.location.search);
    let channelId = urlParams.get('channel');
    
    if (!channelId) {
        const serverMatch = window.location.pathname.match(/\/server\/(\d+)/);
        if (serverMatch) {
            channelId = urlParams.get('channel');
        }
    }
    
    if (!channelId) {
        const dmMatch = window.location.pathname.match(/\/dm\/([^\/]+)/);
        if (dmMatch) {
            channelId = dmMatch[1];
        }
    }
    
    if (!channelId) {
        if (window.chatSection && window.chatSection.targetId) {
            channelId = window.chatSection.targetId;
        }
    }
    
    if (!channelId) {
        const chatIdMeta = document.querySelector('meta[name="chat-id"]');
        if (chatIdMeta) {
            channelId = chatIdMeta.getAttribute('content');
        }
    }
    
    addDebugLogMaster(`🔍 getCurrentChannelId result: ${channelId}`, 'info');
    return channelId;
}

function getCurrentServerId() {
    const path = window.location.pathname;
    const serverMatch = path.match(/\/server\/(\d+)/);
    return serverMatch ? serverMatch[1] : null;
}

function switchDebugTab(tabName) {
    const tabs = ['logs', 'test', 'monitor'];
    
    tabs.forEach(tab => {
        const tabButton = document.getElementById(`${tab}-tab`);
        const tabContent = document.getElementById(`${tab}-content`);
        
        if (tab === tabName) {
            tabButton.className = 'px-4 py-2 text-sm text-blue-400 border-b-2 border-blue-400';
            tabContent.classList.remove('hidden');
        } else {
            tabButton.className = 'px-4 py-2 text-sm text-gray-400 hover:text-white';
            tabContent.classList.add('hidden');
        }
    });
}

let debugLogCount = 0;
function addDebugLog(message, type = 'info') {
    const logsContainer = document.getElementById('debug-logs');
    if (!logsContainer) return;
    
    debugLogCount++;
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
    
    if (debugLogCount > 100) {
        logsContainer.removeChild(logsContainer.firstChild);
        debugLogCount--;
    }
}

function clearDebugLogs() {
    const logsContainer = document.getElementById('debug-logs');
    if (logsContainer) {
        logsContainer.innerHTML = '<div class="text-gray-500">Logs cleared...</div>';
        debugLogCount = 0;
    }
}

function testBotMessage() {
    addDebugLog('🧪 Testing bot message flow...', 'info');
    
    if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
        addDebugLog('❌ Socket not ready for testing', 'error');
        return;
    }
    
    const currentChannelId = getCurrentChannelId();
    const userId = document.querySelector('meta[name="user-id"]')?.content;
    const username = document.querySelector('meta[name="username"]')?.content;
    
    addDebugLog(`🔍 Current context: channelId=${currentChannelId}, userId=${userId}, username=${username}`, 'info');
    
    // Determine target type and ID correctly
    let targetType, targetId;
    if (window.location.pathname.includes('/server/') && currentChannelId) {
        targetType = 'channel';
        targetId = currentChannelId;
    } else if (window.location.pathname.includes('/home/channels/dm/')) {
        targetType = 'dm';
        const dmMatch = window.location.pathname.match(/\/dm\/([^\/]+)/);
        targetId = dmMatch ? dmMatch[1] : currentChannelId;
    } else {
        targetType = 'channel';
        targetId = currentChannelId || '1'; // fallback to channel 1
    }
    
    const testMessage = {
        content: '/titibot ping',
        target_type: targetType,
        target_id: targetId,
        message_type: 'text',
        attachments: [],
        timestamp: new Date().toISOString()
    };
    
    addDebugLog(`🎯 Sending test message with correct fields:`, 'info');
    addDebugLog(`   content: "${testMessage.content}"`, 'info');
    addDebugLog(`   target_type: "${testMessage.target_type}"`, 'info');
    addDebugLog(`   target_id: "${testMessage.target_id}"`, 'info');
    
    window.globalSocketManager.io.emit('save-and-send-message', testMessage);
}

function debugSocketConnection() {
    addDebugLog('🔍 Debugging socket connection...', 'info');
    
    const socketStatus = {
        socketIOAvailable: typeof io !== 'undefined',
        globalSocketManager: !!window.globalSocketManager,
        socketConnected: window.globalSocketManager?.connected,
        socketId: window.globalSocketManager?.io?.id,
        rooms: Array.from(window.globalSocketManager?.io?.rooms || [])
    };
    
    addDebugLog(`Socket.IO Available: ${socketStatus.socketIOAvailable}`, socketStatus.socketIOAvailable ? 'success' : 'error');
    addDebugLog(`Global Manager Ready: ${socketStatus.globalSocketManager}`, socketStatus.globalSocketManager ? 'success' : 'error');
    addDebugLog(`Socket Connected: ${socketStatus.socketConnected}`, socketStatus.socketConnected ? 'success' : 'error');
    addDebugLog(`Socket ID: ${socketStatus.socketId || 'N/A'}`, 'info');
    addDebugLog(`Joined Rooms: ${socketStatus.rooms.join(', ') || 'None'}`, 'info');
    
    if (window.globalSocketManager?.io) {
        window.globalSocketManager.io.emit('debug-test', 'Bot Debug Panel Test');
        addDebugLog('📡 Debug test signal sent to server', 'info');
    }
}

function refreshBotStatus() {
    addDebugLog('🔄 Refreshing bot status...', 'info');
    
    const socketStatus = document.getElementById('socket-status');
    const botInitStatus = document.getElementById('bot-init-status');
    const listenerStatus = document.getElementById('listener-status');
    const interceptStatus = document.getElementById('intercept-status');
    
    const socketConnected = window.globalSocketManager?.connected;
    const socketId = window.globalSocketManager?.io?.id;
    const userId = document.querySelector('meta[name="user-id"]')?.content;
    const username = document.querySelector('meta[name="username"]')?.content;
    
    socketStatus.innerHTML = socketConnected ? '✅ Yes' : '❌ No';
    socketStatus.className = socketConnected ? 'text-green-400' : 'text-red-400';
    
    document.getElementById('socket-id').textContent = socketId || '-';
    document.getElementById('user-id-info').textContent = userId || '-';
    document.getElementById('username-info').textContent = username || '-';
    document.getElementById('current-room').textContent = getCurrentChannelId() || 'Not in channel';
    
    if (window.globalSocketManager?.io) {
        window.globalSocketManager.io.emit('bot-status-check', { username: 'titibot' });
        addDebugLog('📋 Bot status check requested from server', 'info');
    }
}

function forceBotInit() {
    addDebugLog('⚡ Forcing bot initialization...', 'warning');
    
    if (!window.globalSocketManager?.io) {
        addDebugLog('❌ No socket connection for bot initialization', 'error');
        return;
    }
    
    const initData = {
        bot_id: 'titibot',
        username: 'titibot',
        force: true
    };
    
    window.globalSocketManager.io.emit('bot-init', initData);
    addDebugLog('🤖 Bot initialization signal sent', 'success');
}

function sendTestCommand() {
    const command = document.getElementById('test-command')?.value;
    const roomId = document.getElementById('test-room-id')?.value || getCurrentChannelId();
    
    if (!command) {
        addDebugLog('❌ No test command specified', 'error');
        return;
    }
    
    addDebugLog(`🎯 Sending test command: "${command}" to room: ${roomId}`, 'info');
    
    const testMessage = {
        content: command,
        user_id: document.querySelector('meta[name="user-id"]')?.content,
        username: document.querySelector('meta[name="username"]')?.content,
        channel_id: roomId,
        timestamp: new Date().toISOString()
    };
    
    if (window.globalSocketManager?.io) {
        window.globalSocketManager.io.emit('save-and-send-message', testMessage);
        addDebugLog('📤 Test command sent via WebSocket', 'success');
    } else {
        addDebugLog('❌ No socket connection to send test command', 'error');
    }
}

function setTestCommand(command) {
    const input = document.getElementById('test-command');
    if (input) {
        input.value = command;
        addDebugLog(`🎯 Test command set to: "${command}"`, 'info');
    }
}

function getCurrentChannelId() {
    // Try URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    let channelId = urlParams.get('channel');
    
    if (!channelId) {
        // Try to extract from path for server pages
        const serverMatch = window.location.pathname.match(/\/server\/(\d+)/);
        if (serverMatch) {
            channelId = urlParams.get('channel');
        }
    }
    
    if (!channelId) {
        // Try to extract from DM paths
        const dmMatch = window.location.pathname.match(/\/dm\/([^\/]+)/);
        if (dmMatch) {
            channelId = dmMatch[1];
        }
    }
    
    if (!channelId) {
        // Try to get from chat section if available
        if (window.chatSection && window.chatSection.targetId) {
            channelId = window.chatSection.targetId;
        }
    }
    
    if (!channelId) {
        // Try to get from meta tags
        const chatIdMeta = document.querySelector('meta[name="chat-id"]');
        if (chatIdMeta) {
            channelId = chatIdMeta.getAttribute('content');
        }
    }
    
    addDebugLog(`🔍 getCurrentChannelId result: ${channelId}`, 'info');
    return channelId;
}

function getCurrentServerId() {
    const path = window.location.pathname;
    const serverMatch = path.match(/\/server\/(\d+)/);
    return serverMatch ? serverMatch[1] : null;
}

function syncServerPositions(globalSequence = false) {
    const serverId = getCurrentServerId();
    let statusEl = document.getElementById('sync-status');
    const syncType = globalSequence ? 'Global' : 'Traditional';
    
    if (!serverId) {
        addDebugLogMaster('❌ Not on a server page - cannot sync positions', 'error');
        statusEl = document.getElementById('sync-status-master') || document.getElementById('sync-status');
        if (statusEl) statusEl.textContent = 'Error: Not on a server page';
        if (window.showToast) {
            window.showToast('❌ Please open a server page to sync positions', 'error');
        }
        return;
    }
    
    addDebugLogMaster(`🔧 Starting ${syncType} position sync for server ${serverId}...`, 'info');
    statusEl = document.getElementById('sync-status-master') || document.getElementById('sync-status');
    if (statusEl) statusEl.textContent = `Syncing positions (${syncType})...`;
    
    const requestBody = globalSequence ? { global_sequence: true } : {};
    
    fetch(`/api/servers/${serverId}/sync-positions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            addDebugLog(`✅ ${syncType} position sync successful:`, 'success');
            addDebugLog(`   Sync type: ${data.sync_type}`, 'info');
            addDebugLog(`   Categories synced: ${data.categories_synced}`, 'info');
            addDebugLog(`   Channels synced: ${data.channels_synced}`, 'info');
            
            if (data.global_items_synced) {
                addDebugLog(`   Global items synced: ${data.global_items_synced}`, 'info');
            }
            
            if (statusEl) {
                const syncedText = data.global_items_synced 
                    ? `✅ ${syncType}: ${data.global_items_synced} items synced`
                    : `✅ ${syncType}: ${data.categories_synced} categories, ${data.channels_synced} channels`;
                statusEl.textContent = syncedText;
            }
            
            const toastMessage = data.global_items_synced
                ? `✅ ${syncType} sync complete! ${data.global_items_synced} items with sequential positions`
                : `✅ ${syncType} sync complete! ${data.categories_synced} categories and ${data.channels_synced} channels`;
            
            if (window.showToast) {
                window.showToast(toastMessage, 'success');
            }
            
            // Auto-reload after 2 seconds
            setTimeout(() => {
                addDebugLog('🔄 Reloading page to show updated positions...', 'info');
                window.location.reload();
            }, 2000);
        } else {
            addDebugLog(`❌ ${syncType} position sync failed:`, 'error');
            addDebugLog(`   Error: ${data.message || 'Unknown error'}`, 'error');
            
            if (statusEl) statusEl.textContent = `❌ ${syncType} sync failed: ${data.message || 'Unknown error'}`;
            
            if (window.showToast) {
                window.showToast(`❌ Failed to sync positions (${syncType}): ` + (data.message || 'Unknown error'), 'error');
            }
        }
    })
    .catch(error => {
        addDebugLog(`❌ ${syncType} position sync request failed:`, 'error');
        addDebugLog(`   Network error: ${error.message}`, 'error');
        
        if (statusEl) statusEl.textContent = `❌ Network error during ${syncType} sync`;
        
        if (window.showToast) {
            window.showToast(`❌ Network error during ${syncType} position sync`, 'error');
        }
    });
}

function reloadChannelList() {
    const serverId = getCurrentServerId();
    
    if (!serverId) {
        addDebugLog('❌ Not on a server page - cannot reload channels', 'error');
        if (window.showToast) {
            window.showToast('❌ Please open a server page to reload channels', 'error');
        }
        return;
    }
    
    addDebugLog('🔄 Reloading channel list...', 'info');
    
    if (window.showToast) {
        window.showToast('🔄 Reloading channel list...', 'info');
    }
    
    // Simple page reload for now - could be enhanced to do AJAX reload
    setTimeout(() => {
        window.location.reload();
    }, 500);
}

function verifyPositions() {
    const serverId = getCurrentServerId();
    
    if (!serverId) {
        addDebugLog('❌ Not on a server page - cannot check positions', 'error');
        if (window.showToast) {
            window.showToast('❌ Please open a server page to check positions', 'error');
        }
        return;
    }
    
    addDebugLog(`🔍 Checking positions for server ${serverId}...`, 'info');
    
    fetch(`/api/test-position-verify?server_id=${serverId}`)
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            addDebugLog('✅ Position check completed:', 'success');
            addDebugLog(`   Total items: Categories=${data.analysis.total_categories}, Channels=${data.analysis.total_channels}`, 'info');
            addDebugLog(`   Categories positions: ${data.position_ranges.categories.min}-${data.position_ranges.categories.max}`, 'info');
            addDebugLog(`   Uncategorized channels: ${data.position_ranges.uncategorized_channels.min}-${data.position_ranges.uncategorized_channels.max}`, 'info');
            
            // Show detailed breakdown
            const categories = data.current_state.categories;
            const uncategorized = data.current_state.uncategorized_channels;
            
            addDebugLog('📋 Current positions:', 'info');
            categories.forEach(cat => {
                addDebugLog(`   Category "${cat.name}": position ${cat.position}`, 'info');
            });
            uncategorized.forEach(ch => {
                addDebugLog(`   Channel "${ch.name}": position ${ch.position}`, 'info');
            });
            
            if (window.showToast) {
                window.showToast(`✅ Position check complete - see debug logs for details`, 'success');
            }
        } else {
            addDebugLog('❌ Position check failed:', 'error');
            addDebugLog(`   Error: ${data.error}`, 'error');
            if (window.showToast) {
                window.showToast('❌ Failed to check positions', 'error');
            }
        }
    })
    .catch(error => {
        addDebugLog('❌ Position check request failed:', 'error');
        addDebugLog(`   Network error: ${error.message}`, 'error');
        if (window.showToast) {
            window.showToast('❌ Network error during position check', 'error');
        }
    });
}

function showPositionDetails() {
    const serverId = getCurrentServerId();
    
    if (!serverId) {
        addDebugLog('❌ Not on a server page - cannot show position details', 'error');
        return;
    }
    
    addDebugLog('📊 Fetching detailed position information...', 'info');
    
    fetch(`/api/test-position-verify?server_id=${serverId}`)
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Create a detailed modal or section
            let detailsHtml = '<div style="background: #2f3136; padding: 15px; border-radius: 8px; margin: 10px 0; font-family: monospace; font-size: 12px; line-height: 1.4;">';
            detailsHtml += '<h3 style="color: #ffffff; margin: 0 0 10px 0;">Position Details for Server ' + serverId + '</h3>';
            
            // Categories section
            detailsHtml += '<div style="color: #f1c40f; font-weight: bold; margin: 10px 0 5px 0;">Categories:</div>';
            if (data.current_state.categories.length > 0) {
                data.current_state.categories.forEach(cat => {
                    detailsHtml += `<div style="color: #e74c3c;">  📁 "${cat.name}" → Position: ${cat.position} (ID: ${cat.id})</div>`;
                });
            } else {
                detailsHtml += '<div style="color: #95a5a6;">  No categories found</div>';
            }
            
            // Uncategorized channels section
            detailsHtml += '<div style="color: #3498db; font-weight: bold; margin: 10px 0 5px 0;">Uncategorized Channels:</div>';
            if (data.current_state.uncategorized_channels.length > 0) {
                data.current_state.uncategorized_channels.forEach(ch => {
                    detailsHtml += `<div style="color: #2ecc71;">  # "${ch.name}" → Position: ${ch.position} (ID: ${ch.id})</div>`;
                });
            } else {
                detailsHtml += '<div style="color: #95a5a6;">  No uncategorized channels found</div>';
            }
            
            // Categorized channels section
            if (Object.keys(data.current_state.channels_by_category).length > 0) {
                detailsHtml += '<div style="color: #9b59b6; font-weight: bold; margin: 10px 0 5px 0;">Channels by Category:</div>';
                Object.entries(data.current_state.channels_by_category).forEach(([categoryId, channels]) => {
                    const category = data.current_state.categories.find(cat => cat.id == categoryId);
                    const categoryName = category ? category.name : `Category ${categoryId}`;
                    detailsHtml += `<div style="color: #e67e22; margin: 5px 0;">  📁 ${categoryName}:</div>`;
                    channels.forEach(ch => {
                        detailsHtml += `<div style="color: #2ecc71; margin-left: 20px;">    # "${ch.name}" → Position: ${ch.position} (ID: ${ch.id})</div>`;
                    });
                });
            }
            
            detailsHtml += '</div>';
            
            // Show in debug logs
            addDebugLog('📊 Detailed position breakdown displayed below:', 'success');
            
            // Insert details into the logs container
            const logsContainer = document.getElementById('debug-logs');
            if (logsContainer) {
                const detailsDiv = document.createElement('div');
                detailsDiv.innerHTML = detailsHtml;
                logsContainer.appendChild(detailsDiv);
                logsContainer.scrollTop = logsContainer.scrollHeight;
            }
            
            if (window.showToast) {
                window.showToast('📊 Position details displayed in debug logs', 'success');
            }
        } else {
            addDebugLog('❌ Failed to fetch position details:', 'error');
            addDebugLog(`   Error: ${data.error}`, 'error');
        }
    })
    .catch(error => {
        addDebugLog('❌ Failed to fetch position details:', 'error');
        addDebugLog(`   Network error: ${error.message}`, 'error');
    });
}

function initializeBotDebugPanel() {
    addDebugLog('🚀 Bot Debug Panel initialized', 'success');
    addDebugLog('Use the tabs above to navigate different debug sections', 'info');
    addDebugLog('💡 Position Sync Options:', 'info');
    addDebugLog('   Traditional: Categories 1,2,3... | Channels 1,2,3... (separate sequences)', 'info');
    addDebugLog('   Global: All items get sequential positions 1,2,3,4,5... (single sequence)', 'info');
    
    refreshBotStatus();
    
    // Force bot initialization first
    setTimeout(() => {
        addDebugLog('🤖 Attempting to initialize TitiBot...', 'info');
        forceBotInit();
    }, 1000);
    
    if (window.globalSocketManager?.io) {
        const originalEmit = window.globalSocketManager.io.emit;
        window.globalSocketManager.io.emit = function(event, data) {
            if (event === 'save-and-send-message') {
                addDebugLog(`📤 Outgoing message: "${data.content?.substring(0, 50)}..."`, 'info');
                addDebugLog(`   Fields: content=${!!data.content}, target_type=${data.target_type}, target_id=${data.target_id}`, 'info');
                
                // Check for missing required fields
                const missing = [];
                if (!data.content) missing.push('content');
                if (!data.target_type) missing.push('target_type');
                if (!data.target_id) missing.push('target_id');
                
                if (missing.length > 0) {
                    addDebugLog(`❌ Missing required fields: ${missing.join(', ')}`, 'error');
                }
            }
            return originalEmit.call(this, event, data);
        };
        
        // Listen for message errors
        window.globalSocketManager.io.on('message_error', (error) => {
            addDebugLog(`❌ Message error: ${error.error || JSON.stringify(error)}`, 'error');
        });
        
        // Listen for bot events
        window.globalSocketManager.io.on('bot-message-intercept', (data) => {
            addDebugLog(`🤖 Bot intercepted: "${data.content?.substring(0, 30)}..."`, 'success');
            
            const historyContainer = document.getElementById('message-history');
            if (historyContainer) {
                const entry = document.createElement('div');
                entry.innerHTML = `<span class="text-blue-400">${data.username}:</span> ${data.content?.substring(0, 40)}...`;
                historyContainer.appendChild(entry);
                historyContainer.scrollTop = historyContainer.scrollHeight;
            }
            
            // Update bot status
            document.getElementById('intercept-status').innerHTML = '✅ Yes';
            document.getElementById('intercept-status').className = 'text-green-400';
        });
        
        window.globalSocketManager.io.on('bot-response', (data) => {
            addDebugLog(`🎤 Bot response: "${data.content?.substring(0, 30)}..."`, 'success');
            
            const responsesContainer = document.getElementById('bot-responses');
            if (responsesContainer) {
                const entry = document.createElement('div');
                entry.innerHTML = `<span class="text-green-400">TitiBot:</span> ${data.content?.substring(0, 40)}...`;
                responsesContainer.appendChild(entry);
                responsesContainer.scrollTop = responsesContainer.scrollHeight;
            }
        });
        
        // Listen for bot initialization confirmation
        window.globalSocketManager.io.on('bot-initialized', (data) => {
            addDebugLog(`✅ Bot initialized: ${data.username || 'Unknown'}`, 'success');
            document.getElementById('bot-init-status').innerHTML = '✅ Yes';
            document.getElementById('bot-init-status').className = 'text-green-400';
            document.getElementById('listener-status').innerHTML = '✅ Yes';
            document.getElementById('listener-status').className = 'text-green-400';
        });
        
        // Listen for bot status responses
        window.globalSocketManager.io.on('bot-status-response', (data) => {
            addDebugLog(`📊 Bot status: ${JSON.stringify(data)}`, 'info');
            if (data.initialized) {
                document.getElementById('bot-init-status').innerHTML = '✅ Yes';
                document.getElementById('bot-init-status').className = 'text-green-400';
            }
            if (data.listening) {
                document.getElementById('listener-status').innerHTML = '✅ Yes';
                document.getElementById('listener-status').className = 'text-green-400';
            }
        });
        
        addDebugLog('🔗 Socket event listeners attached for monitoring', 'success');
        
        // Patch the frontend message sending to ensure required fields
        setTimeout(() => {
            if (window.SendReceiveHandler && window.SendReceiveHandler.prototype.sendMessage) {
                const originalSendMessage = window.SendReceiveHandler.prototype.sendMessage;
                window.SendReceiveHandler.prototype.sendMessage = function() {
                    // Validate that we have the required data before sending
                    if (!this.chatSection.targetId) {
                        addDebugLog('❌ Cannot send message: No target ID', 'error');
                        console.error('❌ Cannot send message: No target ID');
                        return;
                    }
                    
                    if (!this.chatSection.chatType) {
                        addDebugLog('❌ Cannot send message: No chat type', 'error');
                        console.error('❌ Cannot send message: No chat type');
                        return;
                    }
                    
                    addDebugLog(`🔧 Message validation passed: chatType=${this.chatSection.chatType}, targetId=${this.chatSection.targetId}`, 'info');
                    
                    return originalSendMessage.call(this);
                };
                addDebugLog('✅ Frontend message sending patched for validation', 'success');
            }
        }, 2000);
    }
    
    document.getElementById('debug-status-indicator').textContent = 'Ready';
    document.getElementById('debug-status-indicator').className = 'ml-2 px-2 py-1 text-xs rounded bg-green-700 text-green-300';
}

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
            
            if (window.globalSocketManager && window.globalSocketManager.isReady()) {
                const username = document.querySelector('meta[name="username"]')?.content || 'unknown';
                
                window.globalSocketManager.debug('Sending debug ping to server...', {
                    username: username,
                    socketId: window.globalSocketManager.io.id,
                    timestamp: new Date().toISOString()
                });
                
                window.globalSocketManager.io.emit('debug-test', username);
                
                if (window.showToast) {
                    window.showToast(`Debug ping sent. Check server logs for response.`, 'info');
                }
            } else {
                console.warn('%c🧪 Cannot send debug message: socket not ready', 'color: #ff9800; font-weight: bold');
                if (window.showToast) {
                    window.showToast('Socket not ready for debug test', 'error');
                }
            }
        }
        
        if (e.ctrlKey && e.key === '2') {
            e.preventDefault();
            
            console.log('Bot Development Modal triggered...');
            
            if (window.openBotDevModal) {
                window.openBotDevModal();
            } else {
                console.log('Bot development modal not found - make sure bot-dev.php is included');
            }
        }
        
        if (e.ctrlKey && e.key === '3') {
            e.preventDefault();
            
            console.log('Manual MisVordMessaging initialization triggered...');
            
            if (!window.MisVordMessaging) {
                console.error('❌ MisVordMessaging not available');
                if (window.showToast) {
                    window.showToast('❌ MisVordMessaging not available', 'error');
                }
                return;
            }
            
            try {
                console.log('Current MisVordMessaging state:', {
                    initialized: window.MisVordMessaging.initialized,
                    connected: window.MisVordMessaging.connected,
                    socketManager: !!window.MisVordMessaging.socketManager,
                    globalSocketManager: !!window.globalSocketManager
                });

                if (!window.MisVordMessaging.initialized) {
                    console.log('Forcing initialization...');
                    window.MisVordMessaging.init();
                }
                
                if (window.MisVordMessaging.socketManager && window.globalSocketManager) {
                    console.log('Forcing connection to global socket manager...');
                    window.MisVordMessaging.socketManager.connectToGlobalSocketManager();
                }
                
                const urlParams = new URLSearchParams(window.location.search);
                const dmParam = urlParams.get('dm');
                if (dmParam) {
                    console.log('Re-setting DM context:', dmParam);
                    window.MisVordMessaging.activeChatRoom = dmParam;
                    window.MisVordMessaging.chatType = 'direct';
                    if (window.MisVordMessaging.joinDMRoom) {
                        window.MisVordMessaging.joinDMRoom(dmParam);
                    }
                }
                
                console.log('Manual initialization completed');
                if (window.showToast) {
                    window.showToast('✅ MisVordMessaging manual initialization completed', 'success');
                }
                
            } catch (error) {
                console.error('❌ Manual initialization failed:', error);
                if (window.showToast) {
                    window.showToast('❌ Manual initialization failed: ' + error.message, 'error');
                }
            }
        }

        if (e.ctrlKey && e.key === '4') {
            e.preventDefault();
            
            console.log('Manual DM room check and join triggered...');
            
            const urlParams = new URLSearchParams(window.location.search);
            const dmParam = urlParams.get('dm');
            
            if (!dmParam) {
                console.log('No DM parameter in URL');
                if (window.showToast) {
                    window.showToast('❌ Not on a DM page', 'error');
                }
                return;
            }
            
            console.log('DM Context Check:', {
                dmParam: dmParam,
                MisVordMessaging: !!window.MisVordMessaging,
                activeChatRoom: window.MisVordMessaging?.activeChatRoom,
                chatType: window.MisVordMessaging?.chatType,
                globalSocketManager: !!window.globalSocketManager,
                socketConnected: window.globalSocketManager?.connected
            });
            
            if (window.MisVordMessaging) {
                try {
                    window.MisVordMessaging.activeChatRoom = dmParam;
                    window.MisVordMessaging.chatType = 'direct';
                    console.log('DM context set');
                    
                    if (window.globalSocketManager && window.globalSocketManager.io) {
                        console.log('Emitting join-dm-room event:', { roomId: dmParam });
                        window.globalSocketManager.io.emit('join-dm-room', { roomId: dmParam });
                        console.log('Join DM room event sent');
                    }
                    
                    if (window.MisVordMessaging.joinDMRoom) {
                        console.log('Calling MisVordMessaging.joinDMRoom');
                        window.MisVordMessaging.joinDMRoom(dmParam);
                    }
                    
                    if (window.showToast) {
                        window.showToast(`✅ DM room ${dmParam} join attempt completed`, 'success');
                    }
                    
                } catch (error) {
                    console.error('❌ DM room join failed:', error);
                    if (window.showToast) {
                        window.showToast('❌ DM room join failed: ' + error.message, 'error');
                    }
                }
            } else {
                console.error('❌ MisVordMessaging not available');
                if (window.showToast) {
                    window.showToast('❌ MisVordMessaging not available', 'error');
                }
            }
        }
        
        if (e.ctrlKey && e.key === '5') {
            e.preventDefault();
            
            console.log('Room status debug triggered...');
            
            if (window.globalSocketManager && window.globalSocketManager.io) {
                console.log('Requesting room debug info...');
                window.globalSocketManager.io.emit('debug-rooms');
                
                console.log('Socket room membership check:', {
                    socketId: window.globalSocketManager.io?.id,
                    rooms: Array.from(window.globalSocketManager.io?.rooms || [])
                });
                
                if (window.showToast) {
                    window.showToast('📊 Room debug info requested - check console', 'info');
                }
            } else {
                console.error('❌ No socket connection for room debugging');
                if (window.showToast) {
                    window.showToast('❌ No socket connection', 'error');
                }
            }
        }

        if (e.ctrlKey && e.key === '9') {
            e.preventDefault();
            
            console.log('Master Debug Panel triggered...');
            showMasterDebugModal();
        }
    });
    
    function getDetailedSocketStatus() {
        const status = {
            socketIOAvailable: typeof io !== 'undefined',
            globalSocketReady: !!(window.globalSocketManager && window.globalSocketManager.isReady()),
            socketConnected: false,
            userAuthenticated: false,
            messagingReady: false,
            socketId: null,
            socketUrl: null,
            connectionAttempts: 0,
            lastConnectionError: null,
            issues: [],
            overallStatus: 'disconnected'
        };
        
        if (!status.socketIOAvailable) {
            status.issues.push('Socket.IO library not loaded');
        }
        
        if (window.globalSocketManager) {
            status.socketConnected = window.globalSocketManager.connected;
            status.userAuthenticated = window.globalSocketManager.authenticated;
            status.socketId = window.globalSocketManager.io?.id;
            status.socketUrl = window.globalSocketManager.io?.uri;
            status.connectionAttempts = window.globalSocketManager.io?._reconnectionAttempts || 0;
            status.lastConnectionError = window.globalSocketManager.lastError;
            
            if (!status.socketConnected) {
                status.issues.push('Socket not connected');
            }
            if (!status.userAuthenticated) {
                status.issues.push('User not authenticated');
            }
        } else {
            status.issues.push('Global socket manager not available');
        }

        if (window.MisVordMessaging) {
            status.messagingReady = window.MisVordMessaging.initialized && window.MisVordMessaging.connected;
            if (!status.messagingReady) {
                if (!window.MisVordMessaging.initialized) {
                    status.issues.push('MisVordMessaging not initialized');
                }
                if (!window.MisVordMessaging.connected) {
                    status.issues.push('MisVordMessaging not connected');
                }
            }
        } else {
            status.issues.push('MisVordMessaging not available');
        }
        
        const socketHost = document.querySelector('meta[name="socket-host"]')?.content;
        const socketPort = document.querySelector('meta[name="socket-port"]')?.content;
        if (!socketHost || !socketPort) {
            status.issues.push('Socket connection config missing');
        }
        
        if (status.globalSocketReady && status.socketConnected && status.userAuthenticated && status.messagingReady) {
            status.overallStatus = 'fully-connected';
        } else if (status.globalSocketReady && status.socketConnected) {
            status.overallStatus = 'connected-but-issues';
        } else if (status.socketIOAvailable) {
            status.overallStatus = 'library-available';
        } else {
            status.overallStatus = 'disconnected';
        }
        
        return status;
    }
    
    console.log('Debug mode active: Ctrl+1 (test message), Ctrl+2 (bot modal), Ctrl+3 (force messaging init), Ctrl+4 (join DM room), Ctrl+5 (debug room status), Ctrl+9 (Master Debug Panel)');
    
    if (window.MisVordMessaging && !window.MisVordMessaging.initialized) {
        console.log('MisVordMessaging exists but not initialized, attempting manual initialization...');
        try {
            window.MisVordMessaging.init();
            console.log('Manual MisVordMessaging initialization successful');
        } catch (error) {
            console.error('❌ Manual MisVordMessaging initialization failed:', error);
        }
    }
                
    if (window.MisVordMessaging && window.globalSocketManager && 
        !window.MisVordMessaging.connected && window.globalSocketManager.isReady()) {
        console.log('Forcing MisVordMessaging connection to global socket manager...');
        try {
            if (window.MisVordMessaging.socketManager && window.MisVordMessaging.socketManager.connectToGlobalSocketManager) {
                window.MisVordMessaging.socketManager.connectToGlobalSocketManager();
                console.log('Forced connection attempt completed');
            }
        } catch (error) {
            console.error('❌ Forced connection failed:', error);
        }
    }
    
    setTimeout(() => {
        if (typeof MusicPlayerSystem !== 'undefined' && !window.musicPlayer) {
            console.log('🎵 Initializing music player system...');
            window.musicPlayer = new MusicPlayerSystem();
        }
    }, 500);
});
</script>

<?php if (isset($head_scripts) && is_array($head_scripts)): ?>
    <?php foreach ($head_scripts as $script): ?>
        <script src="<?php echo js($script); ?>?v=<?php echo $cache_version; ?>" type="module"></script>
    <?php endforeach; ?>
<?php endif; ?>

<script src="<?php echo js('utils/lazy-loader'); ?>?v=<?php echo $cache_version; ?>" type="module"></script>

