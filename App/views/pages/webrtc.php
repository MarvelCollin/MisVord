<?php

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}


if (!function_exists('asset')) {
    require_once dirname(dirname(__DIR__)) . '/config/helpers.php';
}


$page_title = 'MiscVord - Global Video Chat';
$body_class = 'bg-gray-900 text-white overflow-hidden';

// Define the socket server URL based on environment
$is_production = getenv('APP_ENV') === 'production';
$host_domain = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'localhost';
$is_local = $host_domain === 'localhost' || strpos($host_domain, '127.0.0.1') !== false;
$is_marvel_domain = strpos($host_domain, 'marvelcollin.my.id') !== false;

// Improved HTTPS detection - more reliable than just checking $_SERVER['HTTPS']
$is_https = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') || 
            (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') ||
            (isset($_SERVER['HTTP_X_FORWARDED_SSL']) && $_SERVER['HTTP_X_FORWARDED_SSL'] === 'on');

$protocol = $is_https ? 'https' : 'http';

// Get socket URL from environment or use appropriate default
$socket_server_url = getenv('SOCKET_SERVER');

// Auto-detect environment and set appropriate socket URL
if (empty($socket_server_url)) {
    // DOCKER ENVIRONMENT FIX - Always use direct port for WebSocket in browser
    // When using Docker, we need to connect directly to the socket server port
    
    // Check if we're accessing through port 1001 (PHP app)
    if (strpos($_SERVER['HTTP_HOST'], ':1001') !== false) {
        // Extract hostname without port
        $host_without_port = preg_replace('/:1001$/', '', $_SERVER['HTTP_HOST']);
        
        // Force connection to port 1002 for WebSockets
        $socket_server_url = $is_https ? "https://{$host_without_port}:1002" : "http://{$host_without_port}:1002";
        error_log("Accessing through port 1001, using socket server on port 1002: " . $socket_server_url);
    } else {
        // Standard connection - still use port 1002 for socket server
    $socket_server_url = $is_https ? 'https://localhost:1002' : 'http://localhost:1002'; 
    }
    
    // In production environments, we might need subpath
    if ($is_marvel_domain) {
        // Production on marvelcollin.my.id domain with subpath
        // IMPORTANT: ALWAYS use HTTPS for marvelcollin.my.id domain
        $socket_server_url = 'https://' . $host_domain . '/misvord/socket';
    } else if (!$is_local && ($is_production || getenv('IS_VPS') === 'true')) {
        // Other production/VPS environments
        // Force HTTPS for WebSockets when the page is loaded over HTTPS
        $host_domain = preg_replace('#^https?://#', '', $host_domain);
        
        // Check if we're in a subpath
        $request_uri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '';
        if (strpos($request_uri, '/misvord/') !== false) {
            $socket_server_url = $protocol . '://' . $host_domain . '/misvord/socket';
        } else if (strpos($request_uri, '/miscvord/') !== false) {
            $socket_server_url = $protocol . '://' . $host_domain . '/miscvord/socket';
        }
    }
}

// Add socket path config for JavaScript
$is_subpath = false;
if (strpos($socket_server_url, '/misvord/socket') !== false) {
    // For a subpath installation, make sure the path is correct for Socket.IO
    $socket_path = '/misvord/socket/socket.io'; // This path must match server configuration
    $is_subpath = true;
} else if (strpos($socket_server_url, '/miscvord/socket') !== false) {
    // Alternative subpath
    $socket_path = '/miscvord/socket/socket.io'; // This path must match server configuration
    $is_subpath = true;
} else if (strpos($socket_server_url, 'localhost:1002') !== false || strpos($socket_server_url, '127.0.0.1:1002') !== false) {
    // Direct connection to socket server in Docker - use standard path
    $socket_path = '/socket.io'; // Standard Socket.IO path
    $is_subpath = false;
} else {
    // Default path
    $socket_path = '/socket.io'; // Standard Socket.IO path
}

// Additional check to ensure the path doesn't have a namespace appended
if (strpos($socket_path, '#') !== false || strpos($socket_path, '?') !== false) {
    // Remove any query parameters or hash fragments
    $socket_path = strtok($socket_path, '?#');
    error_log("Removed invalid characters from socket path: " . $socket_path);
}

// Ensure the path doesn't end with an invalid character
$socket_path = rtrim($socket_path, '/');

// Log for debugging
$env_type = $is_local ? 'local' : ($is_marvel_domain ? 'marvel' : 'vps');
error_log("WebRTC socket server URL: " . $socket_server_url . ", Path: " . $socket_path . ", Protocol: " . $protocol . ", Env: " . $env_type);

$additional_head = '
<!-- Socket server configuration -->
<meta name="socket-server" content="' . $socket_server_url . '">
<meta name="socket-path" content="' . $socket_path . '">
<meta name="env-type" content="' . $env_type . '">
<meta name="socket-secure" content="' . ($is_https ? 'true' : 'false') . '">
<meta name="socket-subpath" content="' . ($is_subpath ? 'true' : 'false') . '">
<style>
    .video-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1rem;
    }
    
    .video-container {
        position: relative;
        border-radius: 0.5rem;
        overflow: hidden;
        background-color: #2D3748;
        aspect-ratio: 4/3;
        min-height: 225px;
    }
    
    .video-container video {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .video-container .username {
        position: absolute;
        bottom: 0.5rem;
        left: 0.5rem;
        background-color: rgba(0, 0, 0, 0.5);
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.875rem;
    }
    
    .controls {
        display: flex;
        justify-content: center;
        gap: 1rem;
        padding: 1rem;
        background-color: #1A202C;
        border-radius: 0.5rem;
        position: fixed;
        bottom: 1rem;
        left: 50%;
        transform: translateX(-50%);
        z-index: 50;
    }
    
    .control-btn {
        width: 3rem;
        height: 3rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    
    .control-btn:hover {
        opacity: 0.8;
    }
    
    .control-btn.active {
        background-color: #48BB78;
    }
    
    .control-btn.inactive {
        background-color: #718096;
    }
    
    .control-btn.danger {
        background-color: #F56565;
    }
    
    .local-video-container {
        position: fixed;
        bottom: 5rem;
        right: 1rem;
        width: 200px;
        height: 150px;
        border-radius: 0.5rem;
        overflow: hidden;
        z-index: 40;
        border: 2px solid #4A5568;
    }
    
    .local-video-container video {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transform: scaleX(-1); 
    }
    
    .participants-panel {
        position: fixed;
        right: 0;
        top: 0;
        bottom: 0;
        width: 250px;
        background-color: #1A202C;
        border-left: 1px solid #2D3748;
        padding: 1rem;
        overflow-y: auto;
    }
    
    .participant-item {
        display: flex;
        align-items: center;
        padding: 0.5rem;
        margin-bottom: 0.5rem;
        border-radius: 0.25rem;
        background-color: #2D3748;
    }
    
    .participant-avatar {
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
        background-color: #4A5568;
        margin-right: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
    }
    
    .main-content {
        margin-right: 250px;
        height: 100vh;
        padding: 1rem;
    }
    
    .username-modal {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(0, 0, 0, 0.7);
        z-index: 100;
    }
    
    .connection-status {
        padding: 0.5rem 1rem;
        background-color: #2D3748;
        border-radius: 0.25rem;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .status-indicator {
        width: 10px;
        height: 10px;
        border-radius: 50%;
    }
    
    .status-indicator.connected {
        background-color: #48BB78;
    }
    
    .status-indicator.connecting {
        background-color: #ECC94B;
    }
    
    .status-indicator.disconnected {
        background-color: #F56565;
    }
    
    #socketLogs.visible {
        opacity: 1;
        pointer-events: auto;
    }
    
    @media (max-width: 768px) {
        .participants-panel {
            display: none;
        }
        
        .main-content {
            margin-right: 0;
        }
    }
</style>';
?>


<?php ob_start(); ?>


<div id="permissionRequest" class="username-modal" style="display: flex;">
    <div class="bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-lg">
        <h3 class="text-xl font-bold mb-4">Camera & Microphone Access</h3>
        <p class="mb-4 text-gray-300">Please allow access to your camera and microphone when prompted by your browser.</p>
        
        <div class="flex justify-center mb-4">
            <div class="flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fill-rule="evenodd" d="M10 1a9 9 0 100 18A9 9 0 0010 1zm0 16a7 7 0 100-14 7 7 0 000 14z" clip-rule="evenodd" />
                </svg>
            </div>
        </div>
        
        <div id="permissionStatus" class="p-3 bg-gray-700 rounded mb-4 text-center text-yellow-300">
            Waiting for permission...
        </div>
        
        <div class="flex justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-indigo-500 ml-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
        </div>
        
        <div class="mt-4 text-sm text-gray-400 mb-4">
            <p class="mb-2"><strong>Troubleshooting Tips:</strong></p>
            <ul class="list-disc pl-5">
                <li>Check if your camera is not being used by another application</li>
                <li>Click the camera icon in your browser's address bar to grant permission</li>
                <li>Make sure you click "Allow" when the browser permission popup appears</li>
                <li>Try reloading the page if the permission dialog doesn't appear</li>
            </ul>
        </div>
        
        <div class="flex gap-2">
            <button id="retryPermissionBtn" class="flex-1 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-bold text-lg">
                Allow Camera & Mic
            </button>
            <button id="audioOnlyBtn" class="px-4 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700">
                Audio Only
            </button>
        </div>
    </div>
</div>

<!-- Debug Panel for WebRTC (Initially Hidden) -->
<div id="webrtcDebugPanel" class="fixed left-0 top-0 bottom-0 bg-gray-800 border-r border-gray-700 w-80 p-4 transform -translate-x-full transition-transform duration-300 z-50 overflow-y-auto">
    <div class="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
        <h3 class="text-lg font-bold">WebRTC Debug</h3>
        <button id="closeDebugPanel" class="text-gray-400 hover:text-white">&times;</button>
    </div>
    
    <div class="mb-4">
        <h4 class="text-sm font-semibold mb-2 text-blue-400">Socket Connection</h4>
        <div id="debugSocketInfo" class="bg-gray-900 rounded p-2 text-xs">
            <div>Status: <span id="debugSocketStatus">Unknown</span></div>
            <div>URL: <span id="debugSocketURL">Unknown</span></div>
            <div>Transport: <span id="debugSocketTransport">Unknown</span></div>
            <div>Room: <span id="debugSocketRoom">Unknown</span></div>
        </div>
    </div>
    
    <div class="mb-4">
        <h4 class="text-sm font-semibold mb-2 text-blue-400">User Info</h4>
        <div id="debugUserInfo" class="bg-gray-900 rounded p-2 text-xs">
            <div>Local Name: <span id="debugLocalUserName">Unknown</span></div>
            <div>Socket ID: <span id="debugSocketId">Unknown</span></div>
            <div>Media Status: <span id="debugMediaStatus">Unknown</span></div>
        </div>
    </div>
    
    <div class="mb-4">
        <h4 class="text-sm font-semibold mb-2 text-blue-400">Peer Connections</h4>
        <div id="debugPeerList" class="bg-gray-900 rounded p-2 text-xs">
            <div class="italic text-gray-500">No peers connected</div>
        </div>
    </div>
    
    <div>
        <button id="refreshDebugInfo" class="w-full bg-blue-600 text-white text-xs py-1 px-2 rounded hover:bg-blue-700">
            Refresh Info
        </button>
    </div>
</div>

<!-- Debug Toggle Button -->
<button id="toggleDebugPanel" class="fixed bottom-4 left-4 bg-gray-700 hover:bg-gray-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg z-50">
    <span class="text-lg">��</span>
</button>

<div class="flex h-screen">
    <div class="main-content flex-1 flex flex-col">
        <div class="flex justify-between items-center mb-4">
            <h1 class="text-xl font-bold">Global Video Chat</h1>
            <div id="connectionStatus" class="connection-status">
                <div class="status-indicator disconnected" id="statusIndicator"></div>
                <span id="statusText">Disconnected</span>
                <button id="retryConnection" class="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                    Retry
                </button>
            </div>
        </div>
        
        <!-- Socket logs panel (hidden by default) -->
        <div id="socketLogs" class="fixed bottom-24 right-4 w-96 h-64 bg-gray-800 rounded shadow-lg overflow-y-auto z-50 opacity-0 pointer-events-none">
            <div class="flex justify-between items-center p-2 bg-gray-700 sticky top-0">
                <h3 class="text-sm font-bold">Socket Logs</h3>
                <div class="flex gap-2">
                    <button id="clearLogs" class="px-2 py-1 bg-red-600 text-white text-xs rounded">Clear</button>
                    <button id="toggleLogs" class="px-2 py-1 bg-blue-600 text-white text-xs rounded">Hide Logs</button>
                </div>
            </div>
            <div id="logEntries" class="p-2 text-xs"></div>
        </div>
        
        <div class="video-grid flex-1" id="videoGrid"></div>
        
        <div class="local-video-container">
            <video id="localVideo" autoplay muted playsinline></video>
        </div>
        
        <div class="controls">
            <div class="control-btn active" id="toggleVideoBtn" title="Toggle Video">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />                </svg>
            </div>
            <div class="control-btn active" id="toggleAudioBtn" title="Toggle Audio">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />                </svg>
            </div>
            <div class="control-btn inactive" id="toggleScreenBtn" title="Share Screen">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />                </svg>
            </div>
            <div class="control-btn bg-blue-600" id="pingBtn" title="Ping All Users">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />                </svg>
            </div>
            <div class="control-btn danger" id="hangupBtn" title="Leave Chat">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />                </svg>
            </div>
        </div>
    </div>
    
    <div class="participants-panel">
        <h2 class="text-lg font-bold mb-4">Participants</h2>
        <div id="participantsList"></div>
    </div>
</div>

<!-- Replace script tags with dynamic loading script -->
<script>
    // Get correct asset path based on current domain
    (function() {
        // Check if shared joinPaths function exists, otherwise create it
        if (typeof window.joinPaths !== 'function') {
            window.joinPaths = function(base, path) {
                if (!path) return base;
                // Remove leading slash from path if base is not empty
                if (base && path.startsWith('/')) {
                    path = path.substring(1);
                }
                // Handle case where base is empty
                if (!base) return path;
                // Join with a slash
                return base + '/' + path;
            };
        }
        
        // Check if shared logPathInfo function exists, otherwise create it
        if (typeof window.logPathInfo !== 'function') {
            window.logPathInfo = function(source, path) {
                console.log(`[${source}] Path: ${path}`);
            };
        }
        
        function getScriptBasePath() {
            const hostname = window.location.hostname;
            
            // Special handling for marvelcollin.my.id domain
            if (hostname.includes('marvelcollin.my.id')) {
                return '/misvord/js';
                }
            
            // Default path for other environments
            const currentPath = window.location.pathname;
            if (currentPath.includes('/misvord/')) {
                return '/misvord/js';
            } else if (currentPath.includes('/miscvord/')) {
                return '/miscvord/js';
    } else {
                return '/js';
            }
        }
        
        // Load scripts with proper base path
        const basePath = getScriptBasePath();
        console.log("Loading scripts from base path:", basePath);
        
        // Function to create and append script with error handling
        function loadScript(path) {
            const fullPath = joinPaths(basePath, path);
            logPathInfo('WebRTC Module', fullPath);
            
            const script = document.createElement('script');
            script.src = fullPath;
            script.async = false; // Keep script execution order
            
            // Add load/error events for debugging
            script.onload = function() {
                console.log(`✓ Successfully loaded: ${fullPath}`);
            };
            script.onerror = function() {
                console.error(`✗ Failed to load script: ${fullPath}`);
            };
            
            document.head.appendChild(script);
        }
        
        // Load all required scripts in the correct order
        loadScript('socket.io.min.js');
        loadScript('webrtc-modules/browser-compatibility.js');
        loadScript('webrtc-modules/video-debug.js');
        loadScript('webrtc-modules/video-player.js');
        loadScript('webrtc-modules/connection-monitor.js');
        loadScript('webrtc.js');
    })();
</script>

<!-- WebRTC Debugging Script -->
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Debug panel elements
    const debugPanel = document.getElementById('webrtcDebugPanel');
    const toggleDebugBtn = document.getElementById('toggleDebugPanel');
    const closeDebugBtn = document.getElementById('closeDebugPanel');
    const refreshDebugBtn = document.getElementById('refreshDebugInfo');
    
    // Debug info elements
    const debugSocketStatus = document.getElementById('debugSocketStatus');
    const debugSocketURL = document.getElementById('debugSocketURL');
    const debugSocketTransport = document.getElementById('debugSocketTransport');
    const debugSocketRoom = document.getElementById('debugSocketRoom');
    const debugLocalUserName = document.getElementById('debugLocalUserName');
    const debugSocketId = document.getElementById('debugSocketId');
    const debugMediaStatus = document.getElementById('debugMediaStatus');
    const debugPeerList = document.getElementById('debugPeerList');
    
    // Toggle debug panel visibility
    toggleDebugBtn.addEventListener('click', function() {
        debugPanel.classList.toggle('-translate-x-full');
        updateDebugInfo();
    });
    
    // Close debug panel
    closeDebugBtn.addEventListener('click', function() {
        debugPanel.classList.add('-translate-x-full');
    });
    
    // Refresh debug info
    refreshDebugBtn.addEventListener('click', updateDebugInfo);
    
    // Update debug information
    function updateDebugInfo() {
        // Access window-level WebRTC variables
        setTimeout(() => {
            try {
                // Socket connection info
                if (window.socket) {
                    debugSocketStatus.textContent = window.socket.connected ? 'Connected' : 'Disconnected';
                    debugSocketStatus.className = window.socket.connected ? 'text-green-400' : 'text-red-400';
                    debugSocketURL.textContent = window.socket.io.uri || 'Unknown';
                    debugSocketTransport.textContent = window.socket.io.engine.transport.name || 'Unknown';
                    debugSocketRoom.textContent = window.VIDEO_CHAT_ROOM || 'Unknown';
                } else {
                    debugSocketStatus.textContent = 'Not Initialized';
                    debugSocketStatus.className = 'text-yellow-400';
                }
                
                // User info
                debugLocalUserName.textContent = window.userName || 'Unknown';
                debugSocketId.textContent = window.socketId || 'Unknown';
                
                // Media status
                const mediaState = [];
                if (window.localStream) {
                    const videoTracks = window.localStream.getVideoTracks();
                    const audioTracks = window.localStream.getAudioTracks();
                    mediaState.push(`Video: ${videoTracks.length > 0 ? (videoTracks[0].enabled ? 'On' : 'Off') : 'None'}`);
                    mediaState.push(`Audio: ${audioTracks.length > 0 ? (audioTracks[0].enabled ? 'On' : 'Off') : 'None'}`);
                } else {
                    mediaState.push('No local media');
                }
                debugMediaStatus.textContent = mediaState.join(', ');
                
                // Peer connections
                if (window.peers && Object.keys(window.peers).length > 0) {
                    let peerHTML = '';
                    for (const [peerId, peerData] of Object.entries(window.peers)) {
                        const connectionState = peerData.pc ? peerData.pc.connectionState : 'unknown';
                        const iceState = peerData.pc ? peerData.pc.iceConnectionState : 'unknown';
                        
                        let stateColor = 'text-yellow-400';
                        if (connectionState === 'connected' || iceState === 'connected') {
                            stateColor = 'text-green-400';
                        } else if (connectionState === 'failed' || iceState === 'failed' || 
                                 connectionState === 'disconnected' || iceState === 'disconnected') {
                            stateColor = 'text-red-400';
                        }
                        
                        peerHTML += `
                            <div class="border-b border-gray-700 py-2">
                                <div><span class="font-semibold">User:</span> ${peerData.userName || 'Unknown'}</div>
                                <div><span class="font-semibold">ID:</span> <span class="text-xs">${peerId.substring(0,8)}...</span></div>
                                <div><span class="font-semibold">State:</span> <span class="${stateColor}">${connectionState} / ${iceState}</span></div>
                            </div>
                        `;
                    }
                    debugPeerList.innerHTML = peerHTML;
                } else {
                    debugPeerList.innerHTML = '<div class="italic text-gray-500">No peers connected</div>';
                }
                
                console.log('[DEBUG] Info updated at', new Date().toLocaleTimeString());
            } catch (err) {
                console.error('[DEBUG] Error updating debug info:', err);
            }
        }, 100); // Small delay to ensure window variables are available
    }
    
    // Update info every 3 seconds
    setInterval(updateDebugInfo, 3000);
    
    // Show debug panel with keyboard shortcut (Ctrl+D)
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            debugPanel.classList.toggle('-translate-x-full');
            updateDebugInfo();
        }
    });
});
</script>

<?php 

$content = ob_get_clean(); 


include dirname(dirname(__DIR__)) . '/views/layout/main-app.php';
?>

