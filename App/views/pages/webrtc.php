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
        z-index: 1000;
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


<!-- NEW SIMPLIFIED PERMISSION MODAL -->
<div id="simpleCameraModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); 
     display: flex; align-items: center; justify-content: center; z-index: 9999;">
    <div style="background: #1f2937; width: 90%; max-width: 500px; border-radius: 8px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
        <h2 style="font-size: 22px; color: white; margin-bottom: 15px; text-align: center;">Camera & Microphone Access</h2>
        
        <div id="cameraStatus" style="background: #374151; color: #ffc107; padding: 12px; border-radius: 4px; 
             margin: 15px 0; text-align: center; font-size: 16px;">
            Waiting for permission...
        </div>
        
        <div style="display: flex; justify-content: center; margin: 20px 0;">
            <div style="background: #4f46e5; width: 60px; height: 60px; border-radius: 50%; display: flex; 
                 justify-content: center; align-items: center; margin-right: 15px;">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            </div>
            <div style="background: #4f46e5; width: 60px; height: 60px; border-radius: 50%; display: flex; 
                 justify-content: center; align-items: center;">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
            </div>
        </div>
        
        <div style="margin: 15px 0; background: #374151; padding: 12px; border-radius: 4px;">
            <p style="color: #d1d5db; font-size: 14px; margin-bottom: 8px;"><strong>Troubleshooting Tips:</strong></p>
            <ul style="color: #d1d5db; font-size: 14px; padding-left: 20px;">
                <li style="margin-bottom: 5px;">Check if your camera is used by another app</li>
                <li style="margin-bottom: 5px;">Check browser permissions in the address bar</li>
                <li style="margin-bottom: 5px;">Click "Allow" when prompted by your browser</li>
                <li>Try refreshing the page if no prompt appears</li>
            </ul>
        </div>
        
        <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button id="startCameraBtn" style="flex: 1; background: #2563eb; color: white; border: none; padding: 12px; 
                   border-radius: 4px; font-weight: bold; font-size: 16px; cursor: pointer;">
                Allow Camera & Mic
            </button>
            <button id="startAudioBtn" style="background: #4b5563; color: white; border: none; padding: 12px; 
                   border-radius: 4px; font-size: 16px; cursor: pointer;">
                Audio Only
            </button>
        </div>
    </div>
</div>

<!-- Preload socket.io script to ensure it's available early -->
<script>
// Dynamic socket.io loader with fallback to CDN
(function() {
    function loadSocketIO() {
        // First try to load from local path
        const script = document.createElement('script');
        script.src = '/js/socket.io.min.js';
        script.onload = function() {
            console.log('Socket.IO loaded successfully from local path');
            initSocketDiagnostics();
        };
        script.onerror = function() {
            console.error('Failed to load Socket.IO from local path, trying CDN...');
            
            // Fallback to CDN
            const cdnScript = document.createElement('script');
            cdnScript.src = 'https://cdn.socket.io/4.6.0/socket.io.min.js';
            cdnScript.onload = function() {
                console.log('Socket.IO loaded successfully from CDN');
                initSocketDiagnostics();
            };
            cdnScript.onerror = function() {
                console.error('Failed to load Socket.IO even from CDN!');
                alert('Failed to load required libraries. Please check your internet connection and try again.');
            };
            document.head.appendChild(cdnScript);
        };
        document.head.appendChild(script);
    }
    
    function initSocketDiagnostics() {
        // Load socket diagnostics after Socket.IO is loaded
        const diagnosticsScript = document.createElement('script');
        diagnosticsScript.src = '/js/socket-diagnostics.js';
        diagnosticsScript.onload = function() {
            console.log('Socket diagnostics utility loaded');
            if (window.SocketDiagnostics) {
                window.SocketDiagnostics.init({
                    autoApplyFixes: true,
                    addDebugButton: true,
                    fixDockerServiceNames: true
                });
            }
        };
        document.head.appendChild(diagnosticsScript);
    }
    
    // Start loading Socket.IO
    loadSocketIO();
})();
</script>

<!-- Direct camera access script - completely independent from WebRTC modules -->
<script>
// Create a dedicated diagnostics logger
const MediaDiagnostics = {
    logs: [],
    maxLogs: 50,
    
    log: function(level, ...args) {
        const timestamp = new Date().toISOString().substring(11, 23); // HH:MM:SS.mmm
        const message = args.map(arg => {
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg);
                } catch (e) {
                    return String(arg);
                }
            }
            return String(arg);
        }).join(' ');
        
        const entry = {
            timestamp,
            level,
            message
        };
        
        // Add to log array (with size limit)
        this.logs.unshift(entry);
        if (this.logs.length > this.maxLogs) {
            this.logs.pop();
        }
        
        // Output to console with proper formatting
        const consoleMethod = level === 'error' ? console.error : 
                            level === 'warn' ? console.warn : 
                            level === 'info' ? console.info : console.log;
        
        consoleMethod(`[MediaDiagnostics][${level}][${timestamp}]`, ...args);
        
        // Update UI if diagnostic panel exists
        this.updateUI();
        
        return entry;
    },
    
    error: function(...args) {
        return this.log('error', ...args);
    },
    
    warn: function(...args) {
        return this.log('warn', ...args);
    },
    
    info: function(...args) {
        return this.log('info', ...args);
    },
    
    debug: function(...args) {
        return this.log('debug', ...args);
    },
    
    updateUI: function() {
        // Add logs to debug panel if exists
        const logContainer = document.getElementById('mediaDiagnosticsLog');
        if (logContainer) {
            let html = '';
            this.logs.forEach(entry => {
                const colorClass = entry.level === 'error' ? 'text-red-500' :
                                  entry.level === 'warn' ? 'text-yellow-500' :
                                  entry.level === 'info' ? 'text-blue-400' : 'text-gray-400';
                
                html += `<div class="${colorClass} text-xs mb-1">
                           <span class="text-gray-500">[${entry.timestamp}]</span> 
                           <span class="font-bold">[${entry.level}]</span> 
                           ${entry.message}
                         </div>`;
            });
            logContainer.innerHTML = html;
        }
    },
    
    createDiagnosticPanel: function() {
        // Create a diagnostics panel if not already exists
        if (!document.getElementById('mediaDiagnosticsPanel')) {
            const panel = document.createElement('div');
            panel.id = 'mediaDiagnosticsPanel';
            panel.style.cssText = 'position:fixed; bottom:10px; left:10px; width:400px; max-height:300px; background:#1a1a1a; border:1px solid #444; border-radius:4px; z-index:9999; overflow:hidden; display:none;';
            
            panel.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:5px 10px; background:#333; border-bottom:1px solid #444;">
                    <h3 style="margin:0; font-size:14px; color:#fff;">Media Diagnostics</h3>
                    <div>
                        <button id="clearMediaLogs" style="padding:2px 6px; background:#555; color:#fff; border:none; border-radius:2px; margin-right:5px; font-size:12px;">Clear</button>
                        <button id="closeMediaDiagnostics" style="padding:2px 6px; background:#555; color:#fff; border:none; border-radius:2px; font-size:12px;">Close</button>
                    </div>
                </div>
                <div id="mediaDiagnosticsLog" style="padding:10px; overflow-y:auto; max-height:250px; font-family:monospace;"></div>
            `;
            
            document.body.appendChild(panel);
            
            // Add event listeners
            document.getElementById('closeMediaDiagnostics').addEventListener('click', () => {
                panel.style.display = 'none';
            });
            
            document.getElementById('clearMediaLogs').addEventListener('click', () => {
                this.logs = [];
                this.updateUI();
            });
            
            // Add keyboard shortcut to toggle panel
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'm') {
                    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                    if (panel.style.display === 'block') {
                        this.updateUI();
                    }
                }
            });
        }
    },
    
    showPanel: function() {
        const panel = document.getElementById('mediaDiagnosticsPanel');
        if (panel) {
            panel.style.display = 'block';
            this.updateUI();
        } else {
            this.createDiagnosticPanel();
            this.showPanel();
        }
    }
};

// Create the diagnostics panel
MediaDiagnostics.createDiagnosticPanel();
MediaDiagnostics.info('Media diagnostics system initialized');

// Add button to toggle diagnostics panel to debug panel
document.addEventListener('DOMContentLoaded', function() {
    // Find the refresh button in the debug panel and add media diagnostics button next to it
    setTimeout(() => {
        const refreshBtn = document.getElementById('refreshDebugInfo');
        if (refreshBtn && refreshBtn.parentNode) {
            const mediaDiagBtn = document.createElement('button');
            mediaDiagBtn.id = 'showMediaDiagnostics';
            mediaDiagBtn.className = 'w-full bg-indigo-600 text-white text-xs py-1 px-2 rounded hover:bg-indigo-700 mt-2';
            mediaDiagBtn.innerText = 'Show Media Diagnostics';
            mediaDiagBtn.addEventListener('click', () => {
                MediaDiagnostics.showPanel();
            });
            refreshBtn.parentNode.appendChild(mediaDiagBtn);
        }
    }, 1000);
});

// Create an in-memory audio element to help unblock autoplay restrictions
const unblockAudio = document.createElement('audio');
unblockAudio.src = 'data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
unblockAudio.loop = false;
unblockAudio.volume = 0.01; // Very quiet
unblockAudio.autoplay = false;
unblockAudio.muted = true;

// Function to try unblocking autoplay restrictions
function tryUnblockAutoplay() {
    try {
        // Try to play the audio (will likely be blocked)
        unblockAudio.play().then(() => {
            console.log('[SimpleCam] Autoplay unblocking successful');
        }).catch(e => {
            console.log('[SimpleCam] Autoplay still blocked, waiting for user interaction');
        });
        
        // Create and initialize AudioContext (may help in some browsers)
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            const audioCtx = new AudioContext();
            const source = audioCtx.createBufferSource();
            source.connect(audioCtx.destination);
            source.start(0);
            source.stop(0.001);
        }
    } catch (e) {
        console.warn('[SimpleCam] AudioContext unblocking failed:', e);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Try unblocking on page load (will likely fail but worth trying)
    tryUnblockAutoplay();
    
    // Set up global interaction tracking to unblock media
    let interactionCount = 0;
    
    function handleUserInteraction(e) {
        // Only need to handle a few interactions
        interactionCount++;
        
        // Try to play the unblocking audio
        tryUnblockAutoplay();
        
        // After a few interactions, remove the listeners
        if (interactionCount >= 3) {
            document.removeEventListener('click', handleUserInteraction);
            document.removeEventListener('touchstart', handleUserInteraction);
            document.removeEventListener('keydown', handleUserInteraction);
        }
    }
    
    // Add listeners to detect user interaction
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    
    // Elements
    const modal = document.getElementById('simpleCameraModal');
    const statusEl = document.getElementById('cameraStatus');
    const startCameraBtn = document.getElementById('startCameraBtn');
    const startAudioBtn = document.getElementById('startAudioBtn');
    
    // Local stream
    let localStream = null;
    
    // Check for button existence
    if (!startCameraBtn || !startAudioBtn) {
        console.error('[SimpleCam] Camera buttons not found in DOM');
        return;
    }
    
    // Update status display
    function updateStatus(text, type = 'normal') {
        if (!statusEl) return;
        
        statusEl.textContent = text;
        
        // Update styling based on status type
        switch (type) {
            case 'success':
                statusEl.style.color = '#10b981'; // Green
                statusEl.style.background = '#064e3b';
                break;
            case 'error':
                statusEl.style.color = '#ef4444'; // Red
                statusEl.style.background = '#7f1d1d';
                break;
            case 'warning':
                statusEl.style.color = '#f59e0b'; // Yellow
                statusEl.style.background = '#78350f';
                break;
            default:
                statusEl.style.color = '#ffc107'; // Default yellow
                statusEl.style.background = '#374151';
        }
    }

    // Function to detect browser for specific fixes
    function detectBrowser() {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.indexOf('chrome') > -1) return 'chrome';
        if (userAgent.indexOf('firefox') > -1) return 'firefox';
        if (userAgent.indexOf('safari') > -1) return 'safari';
        if (userAgent.indexOf('edge') > -1) return 'edge';
        return 'unknown';
    }
    
    // Function to safely play a video element with multiple fallbacks
    async function safePlayVideo(videoElement, stream) {
        if (!videoElement) return false;
        
        // Always mute the video first to help with autoplay restrictions
        videoElement.muted = true;
        videoElement.autoplay = true;
        videoElement.playsInline = true; // Important for iOS
        
        // Ensure video is visible (some browsers won't play invisible videos)
        videoElement.style.display = 'block';
        
        // Set the stream
        try {
            videoElement.srcObject = stream;
        } catch (e) {
            console.warn('[SimpleCam] Error setting srcObject, trying URL.createObjectURL fallback', e);
            try {
                videoElement.src = URL.createObjectURL(stream);
            } catch (e2) {
                console.error('[SimpleCam] Both srcObject and createObjectURL failed', e2);
                return false;
            }
        }
        
        // Try playing with immediate error handling
        try {
            // First play attempt with await
            await videoElement.play();
            console.log('[SimpleCam] Video playing successfully (muted)');
            return true;
        } catch (e) {
            console.warn('[SimpleCam] Initial play attempt failed:', e.name);
            
            // Try without awaiting (works in some browsers)
            try {
                const playPromise = videoElement.play();
                if (playPromise === undefined) {
                    // Play started synchronously (old browsers)
                    console.log('[SimpleCam] Video playing started synchronously');
                    return true;
                } else {
                    // Modern browsers return a promise, but we won't await it
                    // Instead we'll set up handling for when it resolves/rejects
                    playPromise.then(() => {
                        console.log('[SimpleCam] Deferred play successful');
                    }).catch(err => {
                        console.warn('[SimpleCam] Deferred play failed:', err);
                        
                        // Try one more special case for iOS
                        videoElement.controls = true; // Show controls can help on iOS
                        setTimeout(() => {
                            videoElement.play().catch(() => {
                                console.warn('[SimpleCam] iOS-specific play attempt failed');
                            });
                        }, 100);
                    });
                    
                    // Continuing regardless, as stream is set and UI can proceed
                    return false;
                }
            } catch (e2) {
                console.error('[SimpleCam] Secondary play attempt failed:', e2);
                
                // Setup user-interaction-triggered play as last resort
                const playHandler = () => {
                    videoElement.play().then(() => {
                        console.log('[SimpleCam] Video playing after user interaction');
                    }).catch(err => {
                        console.error('[SimpleCam] Play failed even after user interaction:', err);
                    });
                };
                
                // Add temporary listeners for a single attempt
                document.addEventListener('click', playHandler, { once: true });
                document.addEventListener('touchstart', playHandler, { once: true });
                
                return false;
            }
        }
    }
    
    // Request camera & mic access
    async function requestCameraAccess(videoEnabled = true) {
        try {
            updateStatus(videoEnabled ? 'Requesting camera & microphone...' : 'Requesting microphone only...', 'warning');
            
            // Stop any existing stream to avoid conflicts
            if (localStream) {
                localStream.getTracks().forEach(track => {
                    track.stop();
                    console.log('[SimpleCam] Stopped existing track:', track.kind);
                });
                localStream = null;
            }
            
            // Fix for Safari which requires user gesture to access getUserMedia
            const browser = detectBrowser();
            if (browser === 'safari') {
                updateStatus('Safari detected - click again to grant permissions', 'warning');
                return; // In Safari, we'll rely on the second click
            }
            
            // Simple constraints with reasonable defaults for different devices
            const constraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: videoEnabled ? {
                    width: { ideal: 1280, max: 1920 },
                    height: { ideal: 720, max: 1080 },
                    facingMode: 'user',
                    frameRate: { max: 30 }
                } : false
            };
            
            console.log('[SimpleCam] Requesting media with constraints:', constraints);
            
            // Get user media with more detailed error handling
            try {
                localStream = await navigator.mediaDevices.getUserMedia(constraints);
                console.log('[SimpleCam] Media stream obtained:', 
                    localStream.getTracks().map(t => `${t.kind}:${t.label}`).join(', '));
            } catch (mediaError) {
                // If high-res fails, try lower resolution
                if (videoEnabled && mediaError.name === 'OverconstrainedError') {
                    console.warn('[SimpleCam] High-res failed, trying lower resolution');
                    constraints.video = {
                        width: { ideal: 640, max: 640 },
                        height: { ideal: 480, max: 480 },
                        facingMode: 'user'
                    };
                    localStream = await navigator.mediaDevices.getUserMedia(constraints);
                } else {
                    // Re-throw if it's not a resolution issue
                    throw mediaError;
                }
            }
            
            // Successfully got stream
            updateStatus(videoEnabled ? 'Camera & microphone access granted!' : 'Microphone access granted!', 'success');
            
            // Update video element if available and video is enabled
            const localVideo = document.getElementById('localVideo');
            if (localVideo && videoEnabled) {
                // Try to play the video with fallbacks
                const playSuccess = await safePlayVideo(localVideo, localStream);
                
                if (!playSuccess) {
                    console.log('[SimpleCam] Video play delayed, will attempt again on user interaction');
                    updateStatus('Video ready! Click/tap anywhere to start video', 'warning');
                    tryUnblockAutoplay();
                }
            }
            
            // Make stream available globally AND to the WebRTC modules
            window.localStream = localStream;
            
            // If Modal Adapter exists, use it to integrate with WebRTC system
            if (window.ModalAdapter && typeof window.ModalAdapter.setLocalStream === 'function') {
                window.ModalAdapter.setLocalStream(localStream);
            }
            
            // Also try to update WebRTCMedia directly
            if (window.WebRTCMedia) {
                if (typeof window.WebRTCMedia.setLocalStreamFromAdapter === 'function') {
                    window.WebRTCMedia.setLocalStreamFromAdapter(localStream);
                } else {
                    window.WebRTCMedia.localStream = localStream;
                }
                
                // Update WebRTCMedia state to match new stream
                if (videoEnabled && typeof window.WebRTCMedia.updateMediaToggleButtons === 'function') {
                    window.WebRTCMedia.updateMediaToggleButtons();
                }
            }
            
            // Close modal after a successful delay
            setTimeout(() => {
                if (modal) modal.style.display = 'none';
                // Also hide any old permission UI elements that might be shown
                const oldPermissionUI = document.getElementById('permissionRequest');
                if (oldPermissionUI) oldPermissionUI.style.display = 'none';
            }, 1500);
            
            return true;
        } catch (error) {
            console.error('[SimpleCam] Media access error:', error);
            
            // Handle common errors with friendly messages
            if (error.name === 'NotAllowedError') {
                updateStatus('Permission denied by browser. Please check your camera settings.', 'error');
            } else if (error.name === 'NotFoundError') {
                updateStatus(videoEnabled ? 
                    'Camera not found. Try audio only.' : 
                    'Microphone not found. Please check your settings.', 'error');
            } else if (error.name === 'NotReadableError') {
                updateStatus('Camera or microphone is already in use by another app.', 'error');
            } else if (error.name === 'AbortError') {
                updateStatus('Permission request was aborted. Please try again.', 'error');
            } else if (error.name === 'TypeError' && browser === 'safari') {
                // Safari sometimes throws TypeError if not triggered by user gesture
                updateStatus('Safari requires you to click the button to allow camera access', 'warning');
            } else {
                updateStatus('Error accessing media: ' + error.message, 'error');
            }
            
            return false;
        }
    }
    
    // Set up button handlers - ensure they actually work
    startCameraBtn.addEventListener('click', function() {
        console.log('[SimpleCam] Camera button clicked');
        requestCameraAccess(true);
    });
    
    startAudioBtn.addEventListener('click', function() {
        console.log('[SimpleCam] Audio button clicked');
        requestCameraAccess(false);
    });
    
    console.log('[SimpleCam] Simple camera access handlers initialized');
});
</script>

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
    
    <div class="mb-4">
        <h4 class="text-sm font-semibold mb-2 text-blue-400">Network Info</h4>
        <div id="debugNetworkInfo" class="bg-gray-900 rounded p-2 text-xs">
            <div>Online: <span id="debugNetworkOnline">Checking...</span></div>
            <div>Connection: <span id="debugNetworkType">Checking...</span></div>
            <div>Protocol: <span id="debugNetworkProtocol">Checking...</span></div>
            <div>WebRTC Support: <span id="debugWebRTCSupport">Checking...</span></div>
            <div>App Port: <span class="text-teal-400">1001</span> | Socket Port: <span class="text-teal-400">1002</span></div>
            <div>Socket Path: <span id="debugSocketPath">Checking...</span></div>
        </div>
    </div>
    
    <div class="mb-4">
        <h4 class="text-sm font-semibold mb-2 text-blue-400">Troubleshooting</h4>
        <div id="debugTroubleshooting" class="bg-gray-900 rounded p-2 text-xs">
            <div class="text-yellow-400 mb-1">If socket connection fails:</div>
            <ol class="list-decimal list-inside text-gray-400">
                <li>Check if your network blocks WebSockets</li>
                <li>Try refreshing the page</li>
                <li>Clear browser cache and cookies</li>
                <li>Click "Force Socket Connection" button</li>
                <li>Try a different browser or network</li>
            </ol>
            <div class="mt-2">
                <button id="runSocketDiagnostics" class="w-full bg-green-600 text-white text-xs py-1 px-2 rounded hover:bg-green-700">
                    Run Socket Diagnostics
                </button>
            </div>
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

<!-- Socket.io path checking utility -->
<script>
// Utility to help diagnose socket.io loading issues
window.checkSocketIoPath = function() {
    console.group('Socket.IO Path Diagnostics');
    
    // Check if Socket.IO is loaded
    console.log('Socket.IO available:', typeof io === 'function' ? 'Yes' : 'No');
    
    // Check if we're on localhost
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // Get potential paths
    const paths = [
        '/js/socket.io.min.js', // Local script in js folder on port 1001
        '/socket.io/socket.io.js' // Standard Socket.IO path on current port (1001)
    ];
    
    // Add direct socket server path for localhost
    if (isLocalhost) {
        // This is on port 1002 - direct access to socket server
        paths.push('http://localhost:1002/socket.io/socket.io.js');
    }
    
    // Check meta tag configuration
    const socketServerMeta = document.querySelector('meta[name="socket-server"]');
    const socketPathMeta = document.querySelector('meta[name="socket-path"]');
    
    console.log('Meta tag - socket-server:', socketServerMeta ? socketServerMeta.content : 'Not found');
    console.log('Meta tag - socket-path:', socketPathMeta ? socketPathMeta.content : 'Not found');
    
    // Check each path with a test request
    console.log('Testing paths:');
    paths.forEach(path => {
        // Handle both relative and absolute URLs
        const fullUrl = path.startsWith('http') ? path : window.location.origin + path;
        console.log(`- Checking ${fullUrl}`);
        
        fetch(fullUrl, { method: 'HEAD' })
            .then(response => {
                console.log(`  ${path}: ${response.ok ? 'Found ✓' : 'Not found ✗'} (${response.status})`);
            })
            .catch(error => {
                console.log(`  ${path}: Error (${error.message})`);
            });
    });
    
    // Log WebSocket URLs for clarity
    if (isLocalhost) {
        console.log('Expected WebSocket connection should be to: ws://localhost:1002/socket.io/');
    }
    
    console.groupEnd();
    
    return 'Socket.IO path diagnostics initiated';
};

// Auto-run on page load with a delay
setTimeout(window.checkSocketIoPath, 2000);
</script>

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
                console.error(`✗ Failed to load script: ${fullPath}`, script.src);
                
                // Try CDN fallback for socket.io if that's what failed
                if (path.includes('socket.io.min.js')) {
                    console.log('Attempting Socket.IO CDN fallback after local load failed');
                    const cdnScript = document.createElement('script');
                    cdnScript.src = 'https://cdn.socket.io/4.6.0/socket.io.min.js';
                    document.head.appendChild(cdnScript);
                }
            };
            
            document.head.appendChild(script);
        }
        
        // Load all required scripts in the correct order
        // Skip Socket.IO since we already loaded it at the top
        // loadScript('socket.io.min.js');
        loadScript('webrtc-modules/browser-compatibility.js');
        loadScript('webrtc-modules/media-control.js');
        loadScript('webrtc-modules/ui-manager.js');
        loadScript('webrtc-modules/signaling.js');
        loadScript('webrtc-modules/peer-connection.js');
        loadScript('webrtc-modules/diagnostics.js');
        loadScript('webrtc-modules/ping-system.js');
        loadScript('webrtc-modules/video-handling.js');
        loadScript('webrtc-modules/video-player.js');
        loadScript('webrtc-modules/video-debug.js');
        loadScript('webrtc-modules/connection-monitor.js');
        loadScript('webrtc-modules/webrtc-controller.js');
        loadScript('webrtc-modules/modal-adapter.js');
        loadScript('webrtc.js');
    })();
</script>

<!-- WebRTC Debugging Script -->
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Fix for previous permission modal code - update to work with our new simplified modal
    if (window.WebRTCMedia) {
        // Replace any references to the old modal with our new implementation
        window.WebRTCMedia.updatePermissionUI = function(status, message) {
            const modal = document.getElementById('simpleCameraModal');
            const statusEl = document.getElementById('cameraStatus');
            if (!modal || !statusEl) return;
            
            // Update status based on the status parameter
            switch(status) {
                case 'granted':
                    statusEl.textContent = 'Permission granted! Starting video chat...';
                    statusEl.style.color = '#10b981';
                    statusEl.style.background = '#064e3b';
                    setTimeout(() => { modal.style.display = 'none'; }, 1500);
                    break;
                case 'hiding':
                    modal.style.display = 'none';
                    break;
                default:
                    // Don't change the status for other cases - our direct implementation handles this
                    break;
            }
        };
        
        // Update retryMediaAccess as well
        window.WebRTCMedia.retryMediaAccess = function(videoEnabled) {
            const startCameraBtn = document.getElementById('startCameraBtn');
            const startAudioBtn = document.getElementById('startAudioBtn');
            
            if (videoEnabled && startCameraBtn) {
                startCameraBtn.click();
            } else if (!videoEnabled && startAudioBtn) {
                startAudioBtn.click();
            }
        };
    }
    
    // Debug panel elements
    const debugPanel = document.getElementById('webrtcDebugPanel');
    const toggleDebugBtn = document.getElementById('toggleDebugPanel');
    const closeDebugBtn = document.getElementById('closeDebugPanel');
    const refreshDebugBtn = document.getElementById('refreshDebugInfo');
    const runSocketDiagnosticsBtn = document.getElementById('runSocketDiagnostics');
    
    // Socket diagnostics button handler
    if (runSocketDiagnosticsBtn) {
        runSocketDiagnosticsBtn.addEventListener('click', function() {
            if (window.SocketDiagnostics) {
                if (typeof window.SocketDiagnostics.checkSocketConfiguration === 'function') {
                    // First run the configuration check
                    console.log('Running socket configuration check...');
                    window.SocketDiagnostics.checkSocketConfiguration();
                    
                    // Then run the connection test
                    setTimeout(() => {
                        console.log('Running socket connection test...');
                        window.SocketDiagnostics.runDiagnostics();
                    }, 1500);
                } else {
                    // Fall back to just running diagnostics if config check not available
                    window.SocketDiagnostics.runDiagnostics();
                }
            } else {
                alert('Socket Diagnostics utility not available. Make sure socket-diagnostics.js is loaded.');
            }
        });
    }
    
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
    refreshDebugBtn.addEventListener('click', function() {
        console.log('[DEBUG] Manual refresh requested');
        updateDebugInfo();
        
        // Also try to ensure socket connection if not connected
        if (window.webrtcEnsureSocketConnection) {
            window.webrtcEnsureSocketConnection();
        }
    });
    
    // Update debug information
    function updateDebugInfo() {
        // First try to use the global updater function
        if (window.webrtcUpdateDebugInfo) {
            window.webrtcUpdateDebugInfo();
            return;
        }
        
        // Fall back to local implementation if global doesn't exist
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
                
                // Network information
                const debugNetworkOnline = document.getElementById('debugNetworkOnline');
                const debugNetworkType = document.getElementById('debugNetworkType');
                const debugNetworkProtocol = document.getElementById('debugNetworkProtocol');
                const debugWebRTCSupport = document.getElementById('debugWebRTCSupport');
                
                if (debugNetworkOnline) {
                    const isOnline = navigator.onLine;
                    debugNetworkOnline.textContent = isOnline ? 'Yes' : 'No';
                    debugNetworkOnline.className = isOnline ? 'text-green-400' : 'text-red-400';
                }
                
                if (debugNetworkType) {
                    if ('connection' in navigator && navigator.connection) {
                        debugNetworkType.textContent = navigator.connection.effectiveType || 'Unknown';
                    } else {
                        debugNetworkType.textContent = 'API not supported';
                    }
                }
                
                if (debugNetworkProtocol) {
                    debugNetworkProtocol.textContent = window.location.protocol.replace(':', '');
                }
                
                if (debugWebRTCSupport) {
                    const hasWebRTC = !!(navigator.mediaDevices && 
                                      navigator.mediaDevices.getUserMedia && 
                                      window.RTCPeerConnection);
                    debugWebRTCSupport.textContent = hasWebRTC ? 'Yes' : 'No';
                    debugWebRTCSupport.className = hasWebRTC ? 'text-green-400' : 'text-red-400';
                }
                
                // Update socket path info
                const debugSocketPath = document.getElementById('debugSocketPath');
                if (debugSocketPath) {
                    // Check if socket is available
                    if (window.socket && window.socket.io) {
                        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                        if (isLocalhost) {
                            // Show simplified info for localhost
                            debugSocketPath.textContent = window.socket.io.opts.path || '/socket.io';
                            debugSocketPath.className = 'text-green-400';
                        } else {
                            // Show full path for production
                            const fullPath = window.socket.io.uri + (window.socket.io.opts.path || '/socket.io');
                            debugSocketPath.textContent = fullPath;
                            debugSocketPath.className = 'text-green-400';
                        }
                    } else {
                        debugSocketPath.textContent = 'Socket not initialized';
                        debugSocketPath.className = 'text-yellow-400';
                    }
                }
                
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
    
    // Add a button to force socket connection
    const refreshBtn = document.getElementById('refreshDebugInfo');
    if (refreshBtn && refreshBtn.parentNode) {
        const connectBtn = document.createElement('button');
        connectBtn.className = 'w-full bg-green-600 text-white text-xs py-1 px-2 rounded hover:bg-green-700 mt-2';
        connectBtn.innerText = 'Force Socket Connection';
        connectBtn.onclick = function() {
            if (window.webrtcEnsureSocketConnection) {
                window.webrtcEnsureSocketConnection();
                setTimeout(updateDebugInfo, 1000);
            } else if (window.WebRTCSignaling && typeof window.WebRTCSignaling.reconnect === 'function') {
                window.WebRTCSignaling.reconnect();
                setTimeout(updateDebugInfo, 1000);
            }
        };
        refreshBtn.parentNode.appendChild(connectBtn);
        
        // Add a test socket button as well
        const testSocketBtn = document.createElement('button');
        testSocketBtn.className = 'w-full bg-purple-600 text-white text-xs py-1 px-2 rounded hover:bg-purple-700 mt-2';
        testSocketBtn.innerText = 'Test Direct Socket';
        testSocketBtn.onclick = function() {
            try {
                // Get socket server details
                const socketServerMeta = document.querySelector('meta[name="socket-server"]');
                const socketPathMeta = document.querySelector('meta[name="socket-path"]');
                
                let socketUrl = socketServerMeta ? socketServerMeta.content : window.location.origin;
                let socketPath = socketPathMeta ? socketPathMeta.content : '/socket.io';
                
                console.log(`Testing direct socket connection to ${socketUrl} with path ${socketPath}`);
                
                // Check if io exists
                if (typeof io !== 'function') {
                    alert('Socket.IO library not loaded! Cannot create connection.');
                    return;
                }
                
                // Create a test socket
                const testSocket = io(socketUrl, {
                    path: socketPath,
                    transports: ['websocket', 'polling'],
                    timeout: 5000,
                    query: { test: 'direct-debug-connection', t: new Date().getTime() }
                });
                
                // Show status in UI
                const statusDiv = document.createElement('div');
                statusDiv.className = 'bg-gray-800 text-xs p-2 mt-2 rounded';
                statusDiv.innerHTML = '<div>Testing connection...</div>';
                refreshBtn.parentNode.appendChild(statusDiv);
                
                // Set up events
                testSocket.on('connect', () => {
                    statusDiv.innerHTML = `
                        <div class="text-green-400">Connected! Socket ID: ${testSocket.id}</div>
                        <div>Transport: ${testSocket.io.engine.transport.name}</div>
                    `;
                    console.log('Test socket connected!', testSocket);
                    
                    // Disconnect after 10 seconds
                    setTimeout(() => {
                        testSocket.disconnect();
                        statusDiv.innerHTML += '<div class="text-gray-400">Test disconnected after timeout</div>';
                    }, 10000);
                });
                
                testSocket.on('connect_error', (error) => {
                    statusDiv.innerHTML = `<div class="text-red-400">Connection error: ${error.message}</div>`;
                    console.error('Test socket connection error:', error);
                });
                
                testSocket.on('disconnect', (reason) => {
                    statusDiv.innerHTML += `<div class="text-yellow-400">Disconnected: ${reason}</div>`;
                    console.log('Test socket disconnected:', reason);
                });
            } catch (error) {
                console.error('Error testing direct socket:', error);
                alert(`Socket test error: ${error.message}`);
            }
        };
        refreshBtn.parentNode.appendChild(testSocketBtn);
    }
    
    // Update info more frequently (every second) when the panel is visible
    const debugUpdateInterval = setInterval(() => {
        if (!debugPanel.classList.contains('-translate-x-full')) {
            updateDebugInfo();
        }
    }, 1000);
    
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

