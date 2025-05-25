/**
 * WebRTC Application Main Entry Point
 * This file now serves as a thin wrapper around our modular WebRTC implementation
 */

// ENV Configuration - Similar to .env file values
if (typeof window.ENV_CONFIG === 'undefined') {
    // Determine if running in a production-like environment (not localhost)
    const isProductionEnvironment = (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1');

    window.ENV_CONFIG = {
        IS_VPS: isProductionEnvironment, // IS_VPS can be determined by hostname for client-side
        
        // Production (VPS) settings
        SOCKET_BASE_URL_PROD: 'wss://marvelcollin.my.id/misvord/socket',
        
        // Local development settings
        // User specified "localhost:1002", existing client code uses wss.
        SOCKET_BASE_URL_LOCAL: 'wss://localhost:1002/misvord/socket',
        
        // Common Socket.IO path component
        SOCKET_IO_PATH: '/socket.io', // The actual path part for Socket.IO connections
        
        // For backward compatibility or other modules that might still use older names,
        // these can be derived if needed, but direct use of above is preferred.
        // SOCKET_DOMAIN_PROD: 'wss://marvelcollin.my.id', // Old structure
        // SOCKET_DOMAIN_LOCAL: 'wss://localhost:1002', // Old structure
        // SOCKET_FULL_PATH: '/misvord/socket/socket.io', // Old structure
    };
}

// Initialize namespaces
window.WebRTCUI = window.WebRTCUI || {};
window.WebRTCSignaling = window.WebRTCSignaling || {};
window.WebRTCMedia = window.WebRTCMedia || {};
window.WebRTCPeerConnection = window.WebRTCPeerConnection || {};
window.WebRTCDiagnostics = window.WebRTCDiagnostics || {};
window.WebRTCPingSystem = window.WebRTCPingSystem || {};
window.WebRTCVideoHandler = window.WebRTCVideoHandler || {};
window.WebRTCMonitor = window.WebRTCMonitor || {};
window.VideoDebug = window.VideoDebug || {};

// Set application-level debug mode
window.appDebugMode = window.appDebugMode ?? true;

// Track module loading status
let modulesLoaded = false;

// Initialize the application when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('[WebRTC] DOM fully loaded - initializing webcam permissions UI');
    
    // Make sure the permission request is initially visible
    const permissionRequest = document.getElementById('permissionRequest');
    if (permissionRequest) {
        permissionRequest.style.display = 'flex';
        
        // Set the initial status message
        const permissionStatus = document.getElementById('permissionStatus');
        if (permissionStatus) {
            permissionStatus.innerHTML = 'Waiting for module initialization...';
        }
    }
    
    // Add handler for retry connection button
    const retryConnectionBtn = document.getElementById('retryConnection');
    if (retryConnectionBtn) {
        retryConnectionBtn.addEventListener('click', function() {
            console.log('[WebRTC] Manual reconnection requested');
            if (window.WebRTCMonitor && typeof window.WebRTCMonitor.retryConnection === 'function') {
                window.WebRTCMonitor.retryConnection();
            } else if (window.WebRTCSignaling && typeof window.WebRTCSignaling.reconnect === 'function') {
                window.WebRTCSignaling.reconnect();
            } else if (window.socket) {
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
    
    // Check if modules have been loaded from webrtc.php's script tags
    const modulesLoadedByPage = (
        window.WebRTCMedia && 
        typeof window.WebRTCMedia.retryMediaAccess === 'function' &&
        window.WebRTCController
    );
    
    console.log('[WebRTC] Modules pre-loaded by page:', modulesLoadedByPage);
    
    if (modulesLoadedByPage) {
        // Modules already loaded by webrtc.php
        modulesLoaded = true;
        console.log("[WebRTC] Using modules pre-loaded by page");
        initializeAfterModulesLoaded();
            } else {
        // Load modules ourselves as a backup
        console.log("[WebRTC] Pre-loaded modules not detected, loading modules manually");
        loadModules().then(() => {
            modulesLoaded = true;
            console.log("[WebRTC] All WebRTC modules have been loaded manually");
            initializeAfterModulesLoaded();
        }).catch(error => {
            console.error("[WebRTC] Failed to load WebRTC modules:", error);
            showModuleLoadError();
        });
    }
    
    // Force initialize permission handlers regardless of module loading
    // This ensures buttons can respond even if modules fail to load
    setupRetryPermissionHandler();
});

/**
 * Initialize the application after modules are loaded
 */
function initializeAfterModulesLoaded() {
    // Configure and initialize the WebRTC controller
    if (window.WebRTCController && typeof window.WebRTCController.init === 'function') {
        window.WebRTCController.init({
            debugMode: window.appDebugMode,
            roomId: 'global-video-chat',
            userName: 'User_' + Math.floor(Math.random() * 10000),
            autoJoin: true
        });
        } else {
        console.error("[WebRTC] WebRTCController not available for initialization");
        
        // Direct fallback for socket connection if controller failed
        ensureSocketConnection();
    }

    // Initialize early ICE candidates buffer
    window.earlyIceCandidates = new Map();

    // Create a function to unlock audio/video autoplay
    function unlockAudioVideo() {
        // Create and play a silent audio context
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const audioContext = new AudioContext();
            const source = audioContext.createBufferSource();
            source.buffer = audioContext.createBuffer(1, 1, 22050);
            source.connect(audioContext.destination);
            source.start(0);
            
            console.log("[WebRTC] Audio context started on user interaction");
            
            // Try to play any videos that need to be played
            if (window.WebRTCVideoHandler && typeof window.WebRTCVideoHandler.enableMediaPlayback === 'function') {
                window.WebRTCVideoHandler.enableMediaPlayback();
            }
            } catch (e) {
            console.error("[WebRTC] Error unlocking audio context:", e);
        }
        
        // Remove listeners after first interaction
        document.removeEventListener('click', unlockAudioVideo);
        document.removeEventListener('touchstart', unlockAudioVideo);
        document.removeEventListener('keydown', unlockAudioVideo);
    }
    
    // Add event listeners for user interactions
    document.addEventListener('click', unlockAudioVideo);
    document.addEventListener('touchstart', unlockAudioVideo);
    document.addEventListener('keydown', unlockAudioVideo);
    
    console.log("[WebRTC] Added user interaction handlers for autoplay");
    
    // If we've initialized but the permission UI is still visible,
    // update the status to prompt the user
                    setTimeout(() => {
        const permissionRequest = document.getElementById('permissionRequest');
        if (permissionRequest && permissionRequest.style.display !== 'none') {
            const permissionStatus = document.getElementById('permissionStatus');
        if (permissionStatus) {
                permissionStatus.innerHTML = 'Please click "Allow Camera & Mic" below to start.';
            }
        }
        
        // Double-check the socket connection after a short delay
        ensureSocketConnection();
                }, 3000);
            }

/**
 * Ensure the socket connection is established
 * This serves as a fallback if WebRTCController fails
 */
function ensureSocketConnection() {
    // Check if socket exists and is connected
    if (window.socket && window.socket.connected) {
        console.log('[WebRTC] Socket already connected:', window.socket.id);
        return;
    }

    // If WebRTCSignaling exists, use it
    if (window.WebRTCSignaling && typeof window.WebRTCSignaling.connectToSignalingServer === 'function') {
        console.log('[WebRTC] Initializing socket via WebRTCSignaling');
        
        // Get user name and room
        const roomId = 'global-video-chat';
        const userName = 'User_' + Math.floor(Math.random() * 10000);
        window.userName = userName; // Store globally
        window.VIDEO_CHAT_ROOM = roomId; // Store globally
        
        // Connect to signaling server
        window.WebRTCSignaling.connectToSignalingServer(
            roomId, 
            userName,
            (users) => {
                console.log('[WebRTC] Connected to signaling server successfully, users:', users);
                // Force export socket to window
                if (typeof window.WebRTCSignaling.exportSocket === 'function') {
                    window.WebRTCSignaling.exportSocket();
                }
                updateDebugInfo();
            },
            (error) => {
                console.error('[WebRTC] Error connecting to signaling server:', error);
                
                // Create direct connection as last resort
                createDirectSocketConnection();
            }
        );
        return;
    }

    // Last resort: create socket connection directly
    createDirectSocketConnection();
}

// Call ensureSocketConnection immediately to start socket connection as soon as possible
setTimeout(ensureSocketConnection, 100);

/**
 * Create a direct socket connection as last resort
 */
function createDirectSocketConnection() {
    if (window.socket && window.socket.connected) {
        console.log('[WebRTC] Direct socket connection already established.');
        return;
    }

    console.log('[WebRTC] Attempting direct socket connection.');
    try {
        if (typeof io === 'undefined') {
            console.error('[WebRTC] Socket.IO client (io) not loaded. Cannot create direct connection.');
            return;
        }
        if (!window.ENV_CONFIG || !window.ENV_CONFIG.SOCKET_IO_PATH || (!window.ENV_CONFIG.SOCKET_BASE_URL_PROD && !window.ENV_CONFIG.SOCKET_BASE_URL_LOCAL)) {
            console.error('[WebRTC] ENV_CONFIG is not properly defined (missing base URLs or IO path). Cannot determine socket URL.');
            return;
        }

        const useProdSettings = window.ENV_CONFIG.IS_VPS;

        const socketBaseUrl = useProdSettings ? window.ENV_CONFIG.SOCKET_BASE_URL_PROD : window.ENV_CONFIG.SOCKET_BASE_URL_LOCAL;
        const socketIoPath = window.ENV_CONFIG.SOCKET_IO_PATH;

        if (!socketBaseUrl) {
            console.error('[WebRTC] Socket base URL is undefined. Cannot create connection. IS_VPS:', useProdSettings);
            return;
        }
        
        console.log(`[WebRTC] Direct Connection - Base URL: ${socketBaseUrl}, IO Path: ${socketIoPath}, IS_VPS mode: ${useProdSettings}`);

        window.socket = io(socketBaseUrl, {
            path: socketIoPath,
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            reconnectionDelay: 3000,
            timeout: 20000,
            secure: socketBaseUrl.startsWith('wss://'),
        });
        
        window.socket.on('connect', () => {
            console.log('[WebRTC] Socket connected:', window.socket.id);
            
            // Join video chat room
            window.socket.emit('joinRoom', {
                roomId: 'global-video-chat',
                userName: 'User_' + Math.floor(Math.random() * 10000)
            });
            
            // Update debug info if available
            if (typeof updateDebugInfo === 'function') {
                updateDebugInfo();
            }
        });
        
        window.socket.on('connect_error', (error) => {
            console.error('[WebRTC] Socket connection error:', error);
        });
        
        window.socket.on('disconnect', (reason) => {
            console.warn('[WebRTC] Socket disconnected:', reason);
        });
        
        // Set a global reference
        window.WebRTCSocket = window.socket;
        
    } catch (e) {
        console.error('[WebRTC] Error creating direct socket connection:', e);
    }
}

// Add debug info updater to the global scope
function updateDebugInfo() {
    // Find debug elements
    const debugSocketStatus = document.getElementById('debugSocketStatus');
    const debugSocketURL = document.getElementById('debugSocketURL');
    const debugSocketTransport = document.getElementById('debugSocketTransport');
    const debugSocketRoom = document.getElementById('debugSocketRoom');
    const debugLocalUserName = document.getElementById('debugLocalUserName');
    const debugSocketId = document.getElementById('debugSocketId');
    
    if (!debugSocketStatus) return;
    
    try {
        // Socket connection info
        if (window.socket) {
            debugSocketStatus.textContent = window.socket.connected ? 'Connected' : 'Disconnected';
            debugSocketStatus.className = window.socket.connected ? 'text-green-400' : 'text-red-400';
            debugSocketURL.textContent = window.socket.io ? window.socket.io.uri : 'Unknown';
            
            if (window.socket.io && window.socket.io.engine && window.socket.io.engine.transport) {
                debugSocketTransport.textContent = window.socket.io.engine.transport.name;
            } else {
                debugSocketTransport.textContent = 'Unknown';
            }
            
            debugSocketRoom.textContent = window.VIDEO_CHAT_ROOM || 'Unknown';
        } else {
            debugSocketStatus.textContent = 'Not Initialized';
            debugSocketStatus.className = 'text-yellow-400';
        }
        
        // User info
        debugLocalUserName.textContent = window.userName || 'Unknown';
        debugSocketId.textContent = window.socketId || 'Unknown';
    } catch (e) {
        console.error('[WebRTC] Error updating debug info:', e);
    }
}

// Expose to global scope
window.webrtcUpdateDebugInfo = updateDebugInfo;
window.webrtcEnsureSocketConnection = ensureSocketConnection;

/**
 * Get the base URL for assets based on the current page
 * This handles subpath deployments and different environments
 * @returns {string} The base URL for assets
 */
function getAssetBasePath() {
    // Get the current URL to determine if we're in a subpath
    const currentPath = window.location.pathname;
    const hostname = window.location.hostname;
    
    // Special handling for marvelcollin.my.id domain - always return /misvord
    if (hostname.includes('marvelcollin.my.id')) {
        console.log('Detected marvelcollin.my.id domain, using /misvord path');
        return '/misvord';
    }
    
    // Check if we're in a subpath deployment (like /misvord/ or /miscvord/)
    if (currentPath.includes('/misvord/')) {
        return '/misvord'; // Return the subpath for this deployment
    } else if (currentPath.includes('/miscvord/')) {
        return '/miscvord'; // Return the subpath for this deployment
    }
    
    // Default - no subpath
    return '';
}

/**
 * Helper function to join paths without double slashes
 * @param {string} base - The base path
 * @param {string} path - The path to append
 * @returns {string} - The joined path
 */
function joinPaths(base, path) {
    if (!path) return base;
    // Remove leading slash from path if base is not empty
    if (base && path.startsWith('/')) {
        path = path.substring(1);
    }
    // Handle case where base is empty
    if (!base) return path;
    // Join with a slash
    return base + '/' + path;
}

/**
 * Load all required WebRTC modules
 * The order matters - dependencies must be loaded first
 */
async function loadModules() {
    try {
        // Get the base path for assets
        const basePath = getAssetBasePath();
        console.log(`Using asset base path: "${basePath}"`);
        
        // Build the module base path with the asset base path
        const moduleBase = joinPaths(basePath, 'js/webrtc-modules/');
        
        // First try to load Socket.IO since it's critical
        try {
            await loadScript(joinPaths(basePath, 'js/socket.io.min.js'));
            console.log('Socket.IO loaded successfully');
        } catch (error) {
            console.warn('Failed to load local Socket.IO, trying CDN fallback:', error);
            // Try loading from CDN as fallback
            await loadScript('https://cdn.socket.io/4.6.0/socket.io.min.js');
            console.log('Socket.IO loaded from CDN successfully');
        }
        
        const requiredModules = [
            // Core modules - load media-control.js first to ensure it's available
            'media-control.js',
            'ui-manager.js', 
            'signaling.js', 
            'peer-connection.js',
            
            // Support modules
            'diagnostics.js',
            'ping-system.js',
            'video-handling.js',
            'video-player.js',
            'video-debug.js',
            'connection-monitor.js',
            'browser-compatibility.js',
            
            // Main controller (must be loaded last)
            'webrtc-controller.js'
        ];
        
        // Load each module in sequence
        for (const module of requiredModules) {
            try {
                await loadScript(joinPaths(moduleBase, module));
                console.log(`Loaded WebRTC module: ${module}`);
            } catch (error) {
                console.error(`Failed to load module ${module}:`, error);
                throw error; // Propagate the error
            }
        }
        
        return true;
    } catch (error) {
        console.error('Error loading WebRTC modules:', error);
        showModuleLoadError();
        return false;
    }
}

/**
 * Load a JavaScript file dynamically
 * @param {string} src - The script source URL
 * @returns {Promise} - Resolves when script is loaded
 */
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        
        script.onload = () => resolve();
        script.onerror = () => {
            console.error(`Failed to load script: ${src}`);
            reject(new Error(`Failed to load script: ${src}`));
        };
        
        document.head.appendChild(script);
    });
}

/**
 * Show an error message when module loading fails
 */
function showModuleLoadError() {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message fixed inset-0 bg-red-900 bg-opacity-90 flex items-center justify-center z-50';
    errorElement.innerHTML = `
        <div class="bg-gray-800 p-6 rounded-lg max-w-md text-center">
            <h3 class="text-xl text-white mb-4">WebRTC Module Error</h3>
            <p class="text-gray-300 mb-4">
                Failed to load WebRTC modules. This could be due to a network issue or missing files.
            </p>
            <button id="reload-btn" class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg">
                Reload Page
            </button>
        </div>
    `;
    
    document.body.appendChild(errorElement);
    
    document.getElementById('reload-btn').addEventListener('click', () => {
        window.location.reload();
    });
}

/**
 * Set up the retry permission handler
 */
function setupRetryPermissionHandler() {
    console.log("[WebRTC] Setting up permission button handlers");
    
    // Add click handler for retry button
    const retryBtn = document.getElementById('retryPermissionBtn');
    if (retryBtn) {
        console.log("[WebRTC] Found retry button, adding click handler");
        
        // Remove any existing handlers first to prevent duplicates
        const newRetryBtn = retryBtn.cloneNode(true);
        retryBtn.parentNode.replaceChild(newRetryBtn, retryBtn);
        
        newRetryBtn.addEventListener('click', function(event) {
            console.log("[WebRTC] Retry permission button clicked");
            event.preventDefault();  // Ensure the click doesn't propagate
            
            const permissionStatus = document.getElementById('permissionStatus');
            if (permissionStatus) {
                permissionStatus.className = 'p-3 bg-gray-700 rounded mb-4 text-center text-yellow-300';
                permissionStatus.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Retrying camera & microphone access...';
            }
            
            if (window.WebRTCMedia && typeof window.WebRTCMedia.retryMediaAccess === 'function') {
                console.log("[WebRTC] Using WebRTCMedia.retryMediaAccess");
                window.WebRTCMedia.retryMediaAccess(true); // true for video
                } else {
                console.warn('[WebRTC] WebRTCMedia.retryMediaAccess not available, attempting direct getUserMedia.');
                // Direct getUserMedia call as fallback
                navigator.mediaDevices.getUserMedia({ audio: true, video: true })
                    .then(stream => {
                        console.log("[WebRTC] Camera access granted via fallback");
                        
                        // Update UI
                        if (permissionStatus) {
                            permissionStatus.className = 'p-3 bg-green-700 rounded mb-4 text-center text-white';
                            permissionStatus.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Permission granted! Starting video chat...';
                        }
                        
                        // Hide permission dialog after delay
                        setTimeout(() => {
                            const permissionRequestModal = document.getElementById('permissionRequest');
                            if (permissionRequestModal) {
                                permissionRequestModal.style.display = 'none';
                            }
                            
                            // Store stream in WebRTCMedia if it exists
                            if (window.WebRTCMedia) {
                                window.WebRTCMedia.localStream = stream;
        } else {
                                // Global fallback
                                window.localStream = stream;
                            }
                        }, 1000);
                    })
                    .catch(error => {
                        console.error("[WebRTC] Camera access denied via fallback:", error);
                        // Update UI based on error
                        if (permissionStatus) {
                            permissionStatus.className = 'p-3 bg-red-700 rounded mb-4 text-center text-white';
                            permissionStatus.innerHTML = '<i class="fas fa-times-circle mr-2"></i> Permission denied. Please allow camera access in browser settings.';
            }
        });
    }
        });
    } else {
        console.error("[WebRTC] Retry permission button not found in DOM");
    }

    // Add click handler for audio-only button
    const audioOnlyBtn = document.getElementById('audioOnlyBtn');
    if (audioOnlyBtn) {
        console.log("[WebRTC] Found audio-only button, adding click handler");
        
        // Remove any existing handlers first to prevent duplicates
        const newAudioOnlyBtn = audioOnlyBtn.cloneNode(true);
        audioOnlyBtn.parentNode.replaceChild(newAudioOnlyBtn, audioOnlyBtn);
        
        newAudioOnlyBtn.addEventListener('click', function(event) {
            console.log("[WebRTC] Audio only button clicked");
            event.preventDefault();  // Ensure the click doesn't propagate
            
            const permissionStatus = document.getElementById('permissionStatus');
            if (permissionStatus) {
                permissionStatus.className = 'p-3 bg-gray-700 rounded mb-4 text-center text-yellow-300';
                permissionStatus.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Retrying microphone access...';
            }
            
            if (window.WebRTCMedia && typeof window.WebRTCMedia.retryMediaAccess === 'function') {
                console.log("[WebRTC] Using WebRTCMedia.retryMediaAccess for audio only");
                window.WebRTCMedia.retryMediaAccess(false);
            } else {
                console.warn('[WebRTC] WebRTCMedia.retryMediaAccess not available, attempting direct getUserMedia for audio.');
                // Direct getUserMedia call as fallback
                navigator.mediaDevices.getUserMedia({ audio: true, video: false })
                    .then(stream => {
                        console.log("[WebRTC] Audio access granted via fallback");
                        if (permissionStatus) {
                            permissionStatus.className = 'p-3 bg-green-700 rounded mb-4 text-center text-white';
                            permissionStatus.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Audio access granted! Starting chat...';
                        }
    setTimeout(() => {
                            const permissionRequestModal = document.getElementById('permissionRequest');
                            if (permissionRequestModal) {
                                permissionRequestModal.style.display = 'none';
                            }
                            if (window.WebRTCMedia) {
                                window.WebRTCMedia.localStream = stream;
        } else {
                                // Global fallback
                                window.localStream = stream;
                            }
                        }, 1000);
                    })
                    .catch(error => {
                        console.error("[WebRTC] Audio access denied:", error);
                        if (permissionStatus) {
                            permissionStatus.className = 'p-3 bg-red-700 rounded mb-4 text-center text-white';
                            permissionStatus.innerHTML = '<i class="fas fa-times-circle mr-2"></i> Audio permission denied. Please allow microphone access.';
                        }
                    });
            }
        });
    } else {
        console.error("[WebRTC] Audio-only button not found in DOM");
    }
}

// Global error handler for WebRTC-related errors
window.addEventListener('error', (event) => {
    if (window.WebRTCUI && event.error) {
        window.WebRTCUI.addLogEntry(`Uncaught error: ${event.error.message}`, 'error');
    }
});

