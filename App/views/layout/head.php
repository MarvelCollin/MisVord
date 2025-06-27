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

<meta name="socket-host" content="<?php 
    $socketHost = 'localhost'; 
    echo htmlspecialchars($socketHost);
?>">
<meta name="socket-port" content="<?php echo htmlspecialchars($_ENV['SOCKET_PORT'] ?? '1002'); ?>">

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
<link rel="stylesheet" href="<?= asset('/css/voice-indicator.css') ?>">

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
    <script src="https://cdn.socket.io/4.6.0/socket.io.min.js" integrity="sha384-c79GN5VsunZvi+Q/WObgk2in0CbZsHnjEqvFxC5DxHn9lTfNce2WW6h2pH6u/kF+" crossorigin="anonymous"></script>
<?php endif; ?>

<?php if (isset($include_channel_loader) && $include_channel_loader): ?>
    
<?php endif; ?>

<script>
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
                
                window.globalSocketManager.io.emit('debug-test', username);
                console.log('Debug ping sent:', username);
                
                if (window.showToast) {
                    window.showToast(`Ping sent from ${username}`, 'success');
                }
            } else {
                console.warn('🧪 Cannot send debug message: socket not ready');
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
            
            console.log('Auth reset modal triggered...');
            
            const existingModal = document.getElementById('auth-reset-modal');
            if (existingModal) {
                existingModal.remove();
            }
            
            const modal = document.createElement('div');
            modal.id = 'auth-reset-modal';
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-discord-dark rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-white flex items-center">
                            <i class="fas fa-sign-out-alt mr-2 text-red-400"></i>
                            Reset Authentication
                        </h3>
                        <button class="text-gray-400 hover:text-white" onclick="document.getElementById('auth-reset-modal').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="mb-6">
                        <p class="text-gray-300 mb-2">This will:</p>
                        <ul class="text-gray-400 text-sm space-y-1 ml-4">
                            <li>• Clear all authentication sessions</li>
                            <li>• Remove stored user data</li>
                            <li>• Disconnect from socket connections</li>
                            <li>• Redirect to login page</li>
                        </ul>
                        <div class="mt-4 p-3 bg-red-900/20 border border-red-700/30 rounded">
                            <p class="text-red-300 text-sm">
                                <i class="fas fa-exclamation-triangle mr-1"></i>
                                You will need to log in again after this action.
                            </p>
                        </div>
                    </div>
                    <div class="flex space-x-3">
                        <button 
                            onclick="document.getElementById('auth-reset-modal').remove()" 
                            class="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onclick="resetAuthSession()" 
                            class="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition-colors flex items-center justify-center"
                        >
                            <i class="fas fa-sign-out-alt mr-2"></i>
                            Reset & Logout
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    modal.remove();
                }
            });
            
            if (window.showToast) {
                window.showToast('🔓 Auth reset modal opened', 'info');
            }
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
    
    console.log('Debug mode active: Ctrl+1 (test message), Ctrl+2 (bot modal), Ctrl+3 (force messaging init), Ctrl+4 (join DM room), Ctrl+5 (debug room status), Ctrl+9 (auth reset)');
    
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
});
</script>

<?php if (isset($head_scripts) && is_array($head_scripts)): ?>
    <?php foreach ($head_scripts as $script): ?>
        <script src="<?php echo js($script); ?>?v=<?php echo $cache_version; ?>" type="module"></script>
    <?php endforeach; ?>
<?php endif; ?>

<script src="<?php echo js('utils/lazy-loader'); ?>?v=<?php echo $cache_version; ?>" type="module"></script>
<?php 
$current_path = $_SERVER['REQUEST_URI'] ?? '';
if (strpos($current_path, '/server/') !== false): 
?>
<script src="<?php echo js('components/channels/channel-loader'); ?>?v=<?php echo $cache_version; ?>" type="module"></script>
<?php endif; ?>
