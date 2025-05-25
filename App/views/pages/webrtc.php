<?php

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}


if (!function_exists('asset')) {
    require_once dirname(dirname(__DIR__)) . '/config/helpers.php';
}


$page_title = 'MiscVord - Global Video Chat';
$body_class = 'bg-gray-900 text-white overflow-hidden';
$page_js = 'webrtc';

// Environment Detection
$is_production = getenv('APP_ENV') === 'production';
$is_vps = getenv('IS_VPS') === 'true';
$use_https = getenv('USE_HTTPS') === 'true';

// Host and Protocol Detection
$host_domain = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'localhost';
$is_local = $host_domain === 'localhost' || strpos($host_domain, '127.0.0.1') !== false || strpos($host_domain, '::1') !== false;
$is_marvel_domain = strpos($host_domain, 'marvelcollin.my.id') !== false;

// Improved HTTPS detection
$is_https = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') || 
            (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') ||
            (isset($_SERVER['HTTP_X_FORWARDED_SSL']) && $_SERVER['HTTP_X_FORWARDED_SSL'] === 'on');
$protocol = $is_https ? 'https' : 'http';

// Get port from environment or use default
$socket_port = getenv('SOCKET_PORT') ?: 1002;
$secure_socket_port = getenv('SOCKET_SECURE_PORT') ?: 1443;

// Define path components
$socket_base_path = getenv('SOCKET_BASE_PATH') ?: '/socket.io';
$socket_subpath = getenv('SOCKET_SUBPATH') ?: 'misvord/socket';

// Normalize paths for consistent joining
$socket_base_path = strpos($socket_base_path, '/') === 0 ? $socket_base_path : "/{$socket_base_path}";
$socket_subpath = trim($socket_subpath, '/'); // Remove leading/trailing slashes

// Determine if we're in a subpath deployment
$request_uri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '';
$is_subpath = strpos($request_uri, '/misvord/') !== false || 
              strpos($request_uri, '/miscvord/') !== false || 
              $is_marvel_domain || 
              $is_vps;

// Unified Socket URL and Path Construction
if ($is_local) {
    // Local development
    $host_without_port = preg_replace('/:(\d+)$/', '', $host_domain);
    $socket_server_url = ($is_https ? "https://" : "http://") . $host_without_port . ":" . $socket_port;
    $socket_path = $socket_base_path; // For localhost, just use base path
} else {
    // Production/VPS environment
    $host_without_port = preg_replace('/:(\d+)$/', '', $host_domain);
    $socket_server_url = ($is_https ? "https://" : "http://") . $host_without_port;
    $socket_path = "/{$socket_subpath}{$socket_base_path}"; // Join with proper slashes
}

// Make sure paths are properly formatted (no double slashes)
$socket_path = str_replace('//', '/', $socket_path);
$socket_server_url = rtrim($socket_server_url, '/');

// Log for debugging
$env_type = $is_local ? 'local' : ($is_marvel_domain ? 'marvel' : 'vps');
error_log("WebRTC socket configuration: URL: " . $socket_server_url . ", Path: " . $socket_path . ", Protocol: " . $protocol . ", Env: " . $env_type);

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


<!-- Legacy permission UI elements for backward compatibility -->
<div id="permissionRequest" style="display: none;">
    <div id="permissionStatus"></div>
    <button id="retryPermissionBtn">Retry with Camera</button>
    <button id="audioOnlyBtn">Audio Only</button>
</div>

<!-- Initialize legacy permission buttons -->
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Initialize legacy permission buttons
    const retryBtn = document.getElementById('retryPermissionBtn');
    const audioOnlyBtn = document.getElementById('audioOnlyBtn');
    
    if (retryBtn) {
        retryBtn.addEventListener('click', function() {
            if (window.WebRTCMedia && typeof window.WebRTCMedia.retryMediaAccess === 'function') {
                window.WebRTCMedia.retryMediaAccess(true);
            }
        });
    }
    
    if (audioOnlyBtn) {
        audioOnlyBtn.addEventListener('click', function() {
            if (window.WebRTCMedia && typeof window.WebRTCMedia.retryMediaAccess === 'function') {
                window.WebRTCMedia.retryMediaAccess(false);
            }
        });
    }
});
</script>

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

<!-- Define global path helper functions -->
<script>
// Helper function to detect the base path
window.getBasePath = function() {
    const hostname = window.location.hostname;
    const currentPath = window.location.pathname;
    
    // Special handling for marvelcollin.my.id domain
    if (hostname.includes('marvelcollin.my.id')) {
        return '/misvord';
    }
    
    // Remove the special case for /webrtc URLs that's causing the issue
    // If someone is directly accessing through /webrtc URL, don't add any prefix
    if (currentPath === '/webrtc' || currentPath === '/webrtc/') {
        return '';  // Return empty string instead of '/misvord'
    }
    
    // Check if we're in a subpath deployment (like /misvord/ or /miscvord/)
    if (currentPath.includes('/misvord/')) {
        return '/misvord';
    } else if (currentPath.includes('/miscvord/')) {
        return '/miscvord';
    }
    
    return '';
};

// Define utility functions for path manipulation
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

window.logPathInfo = function(source, path) {
    console.log(`[${source}] Path: ${path}`);
};
</script>

<!-- Preload socket.io script to ensure it's available early -->
<?php if (file_exists(PUBLIC_PATH . '/js/socket.io.min.js')): ?>
<script src="<?php echo js('socket.io.min.js'); ?>"></script>
<?php else: ?>
<script src="https://cdn.socket.io/4.6.0/socket.io.min.js"></script>
<?php endif; ?>

<script>
// Socket.io path validation function - helps prevent 404 errors
function validateSocketIoPath() {
    // Check if Socket.IO is already loaded
    if (typeof io === 'function') {
        console.log('Socket.IO already loaded');
        return true;
    }
    
    // Use our local socket.io.min.js file instead of constructing paths
    // This avoids any path construction issues
    const script = document.createElement('script');
    
    // If on localhost, use direct path to socket.io.js on port 1002
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Use socket server on port 1002 with standard path
        script.src = 'http://localhost:1002/socket.io/socket.io.js';
    } else {
        // For production, just use our local copy
        script.src = '/js/socket.io.min.js';
    }
    
    console.log(`Attempting to load Socket.IO from ${script.src}`);
    
    // Load error fallback to CDN
    script.onerror = function() {
        console.warn(`Failed to load Socket.IO from ${script.src}, falling back to CDN`);
        const cdnScript = document.createElement('script');
        cdnScript.src = 'https://cdn.socket.io/4.6.0/socket.io.min.js';
        document.head.appendChild(cdnScript);
    };
    
    document.head.appendChild(script);
    return true;
}

// Try to validate Socket.IO path immediately
validateSocketIoPath();

// Initialize socket diagnostics after Socket.IO is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load socket diagnostics utility
    const diagnosticsScript = document.createElement('script');
    diagnosticsScript.src = '<?php echo js('socket-diagnostics'); ?>';
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
});
</script>

<!-- Direct camera access script - completely independent from WebRTC modules -->
<script>
// Create audio unblocking utilities using Web Audio API instead of problematic base64 audio
const AudioUnblocker = {
    context: null,
    initialized: false,
    
    // Initialize the audio context
    init() {
        if (this.initialized) return true;
        
        try {
            // Create audio context
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) {
                console.warn('[SimpleCam] AudioContext not supported in this browser');
                return false;
            }
            
            this.context = new AudioContext();
            this.initialized = true;
            console.log('[SimpleCam] Audio context created:', this.context.state);
            return true;
        } catch (e) {
            console.error('[SimpleCam] Failed to create AudioContext:', e);
            return false;
        }
    },
    
    // Try to unlock audio by playing silent sound
    unlock() {
        if (!this.init()) return Promise.reject(new Error('Audio context initialization failed'));
        
        return new Promise((resolve, reject) => {
            // If context is already running, we're good
            if (this.context.state === 'running') {
                console.log('[SimpleCam] AudioContext already running');
                return resolve(true);
            }
            
            console.log('[SimpleCam] Attempting to unlock audio context...');
            
            // Create a short audio buffer of silence
            const buffer = this.context.createBuffer(1, 1024, 22050);
            const source = this.context.createBufferSource();
            source.buffer = buffer;
            source.connect(this.context.destination);
            
            // Play the silent sound
            source.start(0);
            source.onended = () => {
                console.log('[SimpleCam] Silent sound played, audio context state:', this.context.state);
                if (this.context.state === 'running') {
                    resolve(true);
                } else {
                    reject(new Error(`Audio context state is ${this.context.state} after unlock attempt`));
                }
            };
        });
    }
};

// Function to try unblocking autoplay restrictions
function tryUnblockAutoplay() {
    try {
        console.log('[SimpleCam] Attempting to unblock autoplay...');
        
        // Try unlocking audio with Web Audio API
        AudioUnblocker.unlock().then(() => {
            console.log('[SimpleCam] Audio context successfully unlocked');
        }).catch(e => {
            console.warn('[SimpleCam] Audio context unlock failed:', e.message);
        });
        
        // Try to unlock video playback by finding and playing all videos
        document.querySelectorAll('video').forEach(video => {
            if (video.paused) {
                video.muted = true; // Must be muted for autoplay
                video.play().then(() => {
                    console.log('[SimpleCam] Successfully unblocked video playback for:', video.id || 'unnamed video');
                }).catch(e => {
                    console.warn('[SimpleCam] Failed to play video element:', e);
                });
            }
        });
    } catch (e) {
        console.warn('[SimpleCam] Autoplay unblocking failed:', e);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Try unblocking on page load (will likely fail but worth trying)
    tryUnblockAutoplay();
    
    // Set up global interaction tracking to unblock media
    let interactionCount = 0;
    let unlockedAutoplay = false;
    
    function handleUserInteraction(e) {
        // Only need to handle a few interactions
        interactionCount++;
        console.log('[SimpleCam] User interaction detected, attempt:', interactionCount);
        
        // Try to unlock audio context first
        if (!unlockedAutoplay) {
            AudioUnblocker.unlock().then(() => {
                console.log('[SimpleCam] Autoplay successfully unlocked by user interaction');
                unlockedAutoplay = true;
                
                // Try playing any video elements after user interaction
                document.querySelectorAll('video').forEach(video => {
                    // First try with muted
                    video.muted = true;
                    video.play().then(() => {
                        // If successful, attempt to unmute after a short delay
                        setTimeout(() => {
                            video.muted = false;
                            console.log('[SimpleCam] Successfully unmuted video:', video.id || 'unnamed video');
                        }, 500);
                    }).catch(e => {
                        console.warn('[SimpleCam] Failed to play video even after user interaction:', e);
                    });
                });
                
                // Call the full unblock function to handle any other elements
                tryUnblockAutoplay();
                
                // After successful unlock, remove listeners
                document.removeEventListener('click', handleUserInteraction);
                document.removeEventListener('touchstart', handleUserInteraction);
                document.removeEventListener('keydown', handleUserInteraction);
            }).catch(e => {
                console.warn('[SimpleCam] Failed to unlock autoplay despite user interaction:', e);
                
                // Keep trying with future interactions
                if (interactionCount >= 5) {
                    console.warn('[SimpleCam] Multiple unlock attempts failed, removing listeners');
                    document.removeEventListener('click', handleUserInteraction);
                    document.removeEventListener('touchstart', handleUserInteraction);
                    document.removeEventListener('keydown', handleUserInteraction);
                }
            });
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
        
        // More accurate browser detection
        if (userAgent.indexOf('firefox') > -1) {
            return {
                name: 'firefox',
                version: parseInt((userAgent.match(/firefox\/(\d+)/) || [])[1] || '0', 10)
            };
        } else if (userAgent.indexOf('edg') > -1 || userAgent.indexOf('edge') > -1) {
            return {
                name: 'edge',
                version: parseInt((userAgent.match(/edge\/(\d+)/) || userAgent.match(/edg\/(\d+)/) || [])[1] || '0', 10)
            };
        } else if (userAgent.indexOf('chrome') > -1) {
            return {
                name: 'chrome',
                version: parseInt((userAgent.match(/chrome\/(\d+)/) || [])[1] || '0', 10)
            };
        } else if (userAgent.indexOf('safari') > -1) {
            return {
                name: 'safari',
                version: parseInt((userAgent.match(/version\/(\d+)/) || [])[1] || '0', 10)
            };
        }
        
        return {
            name: 'unknown',
            version: 0
        };
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
        
        // First unlock audio context to improve chances of video autoplay
        try {
            await AudioUnblocker.unlock();
        } catch (e) {
            console.warn('[SimpleCam] Audio context unlock failed:', e);
            // Continue anyway - video might still work
        }
        
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
            
            // After successful play while muted, try to unmute after user interaction
            const unmuter = () => {
                videoElement.muted = false;
                console.log('[SimpleCam] Video unmuted after user interaction');
                document.removeEventListener('click', unmuter);
                document.removeEventListener('touchstart', unmuter);
            };
            
            document.addEventListener('click', unmuter, { once: true });
            document.addEventListener('touchstart', unmuter, { once: true });
            
            return true;
        } catch (e) {
            console.warn('[SimpleCam] Initial play attempt failed:', e.name);
            
            // Create a more robust retry mechanism
            let attempts = 0;
            const maxAttempts = 3;
            
            const retryPlay = async () => {
                if (attempts >= maxAttempts) {
                    console.error('[SimpleCam] Failed to play video after', attempts, 'attempts');
                    return false;
                }
                
                attempts++;
                console.log(`[SimpleCam] Retry attempt ${attempts}/${maxAttempts}`);
                
                // Make sure video is muted for retry
                videoElement.muted = true;
                
                try {
                    // Wait a bit longer with each retry
                    await new Promise(resolve => setTimeout(resolve, 300 * attempts));
                    await videoElement.play();
                    console.log('[SimpleCam] Retry successful on attempt', attempts);
                    return true;
                } catch (retryError) {
                    console.warn(`[SimpleCam] Retry ${attempts} failed:`, retryError.name);
                    return retryPlay(); // Recursive retry
                }
            };
            
            // Start retry process
            retryPlay().catch(error => {
                console.error('[SimpleCam] All retry attempts failed:', error);
                
                // Setup user-interaction-triggered play as last resort
                const playHandler = () => {
                    videoElement.muted = true; // Ensure muted for first play
                    videoElement.play().then(() => {
                        console.log('[SimpleCam] Video playing after user interaction');
                        // Try to unmute after a delay
                        setTimeout(() => {
                            videoElement.muted = false;
                            console.log('[SimpleCam] Video unmuted after successful play');
                        }, 1000);
                    }).catch(err => {
                        console.error('[SimpleCam] Play failed even after user interaction:', err);
                    });
                };
                
                // Add temporary listeners for a single attempt
                document.addEventListener('click', playHandler, { once: true });
                document.addEventListener('touchstart', playHandler, { once: true });
            });
            
            return false;
        }
    }
    
    // Request camera & mic access with browser-specific handling
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
            
            // First try to unlock audio context
            try {
                await AudioUnblocker.unlock();
            } catch (e) {
                console.log('[SimpleCam] Audio context unlock attempted before camera access');
                // Continue anyway
            }
            
            // Browser detection for specific handling
            const browser = detectBrowser();
            console.log(`[SimpleCam] Detected browser: ${browser.name} ${browser.version}`);
            
            // Browser-specific fixes
            if (browser.name === 'firefox') {
                console.log('[SimpleCam] Firefox-specific handling activated');
                // Firefox needs special handling for getUserMedia permissions
                updateStatus('Firefox detected - click "Allow" when prompted', 'warning');
            } else if (browser.name === 'safari') {
                updateStatus('Safari detected - click again to grant permissions', 'warning');
                if (browser.version < 14) {
                    return; // In older Safari, rely on the second click
                }
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
            
            // If WebRTCMedia exists, leverage this stream in the WebRTC system
            if (window.WebRTCMedia) {
                // If WebRTCMedia has already been initialized
                if (typeof window.WebRTCMedia.setLocalStreamFromAdapter === 'function') {
                    window.WebRTCMedia.setLocalStreamFromAdapter(localStream);
                } else {
                    // Create a bridge to initialize WebRTCMedia with this stream when it loads
                    window.localStreamFromSimpleUI = localStream;
                    
                    // Override the WebRTCMedia.initLocalStream function when it becomes available
                    const originalInitLocalStream = window.WebRTCMedia ? window.WebRTCMedia.initLocalStream : null;
                    
                    Object.defineProperty(window, 'WebRTCMedia', {
                        get: function() {
                            return this._webRTCMedia;
                        },
                        set: function(newWebRTCMedia) {
                            // Store the new value
                            this._webRTCMedia = newWebRTCMedia;
                            
                            // If localStream is already set from SimpleUI, use it
                            if (window.localStreamFromSimpleUI && newWebRTCMedia) {
                                console.log('[SimpleCam] Bridging stream to WebRTCMedia');
                                const originalInit = newWebRTCMedia.initLocalStream;
                                
                                // Override initLocalStream to use existing stream
                                if (originalInit) {
                                    newWebRTCMedia.initLocalStream = function(audio, video, onSuccess) {
                                        console.log('[SimpleCam] Using existing stream in WebRTCMedia');
                                        if (onSuccess) onSuccess(window.localStreamFromSimpleUI);
                                        return Promise.resolve(true);
                                    };
                                    
                                    // Create a helper method to explicitly set the stream
                                    newWebRTCMedia.setLocalStreamFromAdapter = function(stream) {
                                        window.localStream = stream;
                                        newWebRTCMedia.localStream = stream;
                                        if (originalInit) newWebRTCMedia.initLocalStream = originalInit;
                                        return stream;
                                    };
                                }
                            }
                        },
                        configurable: true
                    });
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
            } else if (error.name === 'TypeError' && browser.name === 'safari') {
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

<!-- WebRTC Script Loading - Using consolidated modules -->
<?php 
// Using consolidated WebRTC modules instead of individual files
$webrtcModules = [
    'webrtc-core',    // Core functionality (config, signaling, peer connections, media control)
    'webrtc-ui',      // UI management and utilities
    'webrtc'          // Main application entry point
];

// Load each consolidated module using the js() helper function
foreach ($webrtcModules as $module) {
    echo '<script src="' . js($module) . '"></script>' . PHP_EOL;
}
?>

<!-- Socket.io path checking utility -->
<script>
// Improved socket path checking utility
window.checkSocketIoPath = function() {
    console.group('Socket.IO Path Diagnostics');
    
    // Check if Socket.IO is loaded
    console.log('Socket.IO available:', typeof io === 'function' ? 'Yes' : 'No');
    
    // Check if we're on localhost
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // Get the base path - this is crucial for correct path checking
    const basePath = window.getBasePath(); // Use the global function
    console.log('Base path detected:', basePath || '/' + ' (empty means root)');
    
    // Always using the standardized path - removing other options to avoid confusion
    // BUT: Actually use the standard Socket.IO path on localhost
    const socketPath = isLocalhost ? '/socket.io' : '/misvord/socket/socket.io';
    console.log('Using socket path:', socketPath);
    
    // Get current URL origin (no /webrtc path)
    let originUrl = window.location.origin;
    
    // Create paths to check based on environment
    const paths = [];
    
    // Standard path check
    if (isLocalhost) {
        // For localhost, check socket.io.js on port 1002 with standard path
        paths.push(`http://localhost:1002/socket.io/socket.io.js`);
    } else {
        // For production, check standard path
        paths.push(`${originUrl}/js/socket.io.min.js`);
    }
    
    // Also check local copy in all cases
    paths.push(`${originUrl}/js/socket.io.min.js`);
    
    // Check meta tag configuration
    const socketServerMeta = document.querySelector('meta[name="socket-server"]');
    const socketPathMeta = document.querySelector('meta[name="socket-path"]');
    
    console.log('Meta tag - socket-server:', socketServerMeta ? socketServerMeta.content : 'Not found');
    console.log('Meta tag - socket-path:', socketPathMeta ? socketPathMeta.content : 'Not found');
    
    // Check each path with a test request
    console.log('Testing paths:');
    paths.forEach(path => {
        fetch(path, { method: 'HEAD' })
            .then(response => {
                console.log(`${path}: ${response.ok ? 'Found ✓' : 'Not found ✗'} (${response.status})`);
            })
            .catch(error => {
                console.error(`${path}: Error - ${error.message}`);
            });
    });
    
    console.groupEnd();
}

// Auto-run on page load with a delay
setTimeout(window.checkSocketIoPath, 2000);
</script>

<!-- WebRTC Debugging Script -->
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Fix for compatibility between the old permission UI and the new simplified modal
    // Connect the old and new UI elements
    
    // Connect the new buttons to trigger the old buttons for backward compatibility
    const startCameraBtn = document.getElementById('startCameraBtn');
    const startAudioBtn = document.getElementById('startAudioBtn');
    const retryPermissionBtn = document.getElementById('retryPermissionBtn');
    const audioOnlyBtn = document.getElementById('audioOnlyBtn');
    
    if (startCameraBtn && retryPermissionBtn) {
        startCameraBtn.addEventListener('click', function() {
            // Also trigger legacy button click if exists
            if (retryPermissionBtn) retryPermissionBtn.click();
        });
    }
    
    if (startAudioBtn && audioOnlyBtn) {
        startAudioBtn.addEventListener('click', function() {
            // Also trigger legacy button click if exists
            if (audioOnlyBtn) audioOnlyBtn.click();
        });
    }
    
    // Replace any references to the old modal with our new implementation
    if (window.WebRTCMedia) {
        // Create a bridge between the old and new UI
        window.WebRTCMedia.updatePermissionUI = function(status, message) {
            const modal = document.getElementById('simpleCameraModal');
            const statusEl = document.getElementById('cameraStatus');
            const oldStatusEl = document.getElementById('permissionStatus');
            
            if (!modal || !statusEl) return;
            
            // Keep old elements updated too for legacy code
            if (oldStatusEl) {
                oldStatusEl.innerHTML = message || status;
            }
            
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
                case 'denied':
                    statusEl.textContent = 'Permission denied. Please check browser settings.';
                    statusEl.style.color = '#ef4444';
                    statusEl.style.background = '#7f1d1d';
                    break;
                case 'notfound':
                    statusEl.textContent = 'No camera/microphone found. Try audio only or check devices.';
                    statusEl.style.color = '#ef4444';
                    statusEl.style.background = '#7f1d1d';
                    break;
                case 'inuse':
                    statusEl.textContent = 'Camera/mic is in use by another app. Close it and try again.';
                    statusEl.style.color = '#ef4444';
                    statusEl.style.background = '#7f1d1d';
                    break;
                case 'error':
                    statusEl.textContent = message || 'Error accessing media devices';
                    statusEl.style.color = '#ef4444';
                    statusEl.style.background = '#7f1d1d';
                    break;
                default:
                    // Don't change the status for other cases
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
                
                // Fix for /webrtc URL - correctly rewrite URL if necessary
                if (!socketServerMeta && window.location.pathname.startsWith('/webrtc')) {
                    // When we're on the /webrtc page and no explicit server URL is provided,
                    // ensure we're using the correct socket URL without the /webrtc prefix
                    socketUrl = window.location.origin;
                }
                
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

    // Add handler for retry connection button
    const retryConnectionBtn = document.getElementById('retryConnection');
    if (retryConnectionBtn) {
        retryConnectionBtn.addEventListener('click', function() {
            console.log('[WebRTC] Manual reconnection requested');
            
            // Use the enhanced connection recovery function if available
            if (window.WebRTCMonitor && typeof window.WebRTCMonitor.recoverConnection === 'function') {
                window.WebRTCMonitor.recoverConnection();
            } 
            // Fall back to standard reconnect if enhanced recovery not available
            else if (window.WebRTCSignaling && typeof window.WebRTCSignaling.reconnect === 'function') {
                window.WebRTCSignaling.reconnect();
            } 
            // Last resort: direct socket connection
            else if (window.socket) {
                try {
                    console.log('[WebRTC] Attempting direct socket reconnection');
                    window.socket.connect();
                } catch (e) {
                    console.error('[WebRTC] Error reconnecting socket:', e);
                    // If direct reconnection fails, reload page as last resort
                    if (confirm('Cannot reconnect to server. Would you like to reload the page?')) {
                        window.location.reload();
                    }
                }
            } else {
                console.error('[WebRTC] No reconnection method available');
                // Reload page as last resort
                if (confirm('Cannot reconnect to server. Would you like to reload the page?')) {
                    window.location.reload();
                }
            }
        });
    }
});
</script>

<?php 

$content = ob_get_clean(); 


include dirname(dirname(__DIR__)) . '/views/layout/main-app.php';
?>

