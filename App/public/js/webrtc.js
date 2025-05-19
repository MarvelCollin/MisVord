/**
 * WebRTC Application Main Entry Point
 * This file now serves as a thin wrapper around our modular WebRTC implementation
 */

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
    
    // Load all required modules
    loadModules().then(() => {
        // Set flag that modules are loaded
        modulesLoaded = true;
        console.log("All WebRTC modules have been loaded successfully");
        // Configure and initialize the WebRTC controller
        window.WebRTCController.init({
            debugMode: window.appDebugMode,
            roomId: 'global-video-chat',
            userName: 'User_' + Math.floor(Math.random() * 10000),
            autoJoin: true
        });

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
                
                console.log("Audio context started on user interaction");
                
                // Try to play any videos that need to be played
                if (window.WebRTCVideoHandler && typeof window.WebRTCVideoHandler.enableMediaPlayback === 'function') {
                    window.WebRTCVideoHandler.enableMediaPlayback();
                }
            } catch (e) {
                console.error("Error unlocking audio context:", e);
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
        
        console.log("Added user interaction handlers for autoplay");
        
        // Set up retry permission button handler
        setupRetryPermissionHandler();
        
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
        }, 3000);
    }).catch(error => {
        console.error("Failed to load WebRTC modules:", error);
        // Show error message on permission UI
        const permissionStatus = document.getElementById('permissionStatus');
        if (permissionStatus) {
            permissionStatus.className = 'p-3 bg-red-700 rounded mb-4 text-center text-white';
            permissionStatus.innerHTML = '<i class="fas fa-exclamation-triangle mr-2"></i> Failed to load WebRTC modules. Please refresh the page.';
        }
    });
});

/**
 * Load all required WebRTC modules
 * The order matters - dependencies must be loaded first
 */
async function loadModules() {
    try {
        const moduleBase = './js/webrtc-modules/';
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
            await loadScript(moduleBase + module);
            console.log(`Loaded WebRTC module: ${module}`);
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
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        
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
    // Add click handler for retry button
    const retryBtn = document.getElementById('retryPermissionBtn');
    if (retryBtn) {
        retryBtn.addEventListener('click', function() {
            console.log("Retry permission button clicked");
            
            // First verify if the module has been loaded
            if (window.WebRTCMedia && typeof window.WebRTCMedia.retryMediaAccess === 'function') {
                console.log("WebRTCMedia.retryMediaAccess is available, calling it");
                window.WebRTCMedia.retryMediaAccess(true);
            } else {
                console.error("WebRTCMedia.retryMediaAccess not available");
                
                // Manual fallback if the function isn't available
                if (modulesLoaded) {
                    const permissionStatus = document.getElementById('permissionStatus');
                    if (permissionStatus) {
                        permissionStatus.className = 'p-3 bg-gray-700 rounded mb-4 text-center text-yellow-300';
                        permissionStatus.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Requesting camera access...';
                    }
                    
                    // Direct getUserMedia call as fallback
                    navigator.mediaDevices.getUserMedia({ audio: true, video: true })
                        .then(stream => {
                            console.log("Camera access granted via fallback");
                            
                            // Update UI
                            if (permissionStatus) {
                                permissionStatus.className = 'p-3 bg-green-700 rounded mb-4 text-center text-white';
                                permissionStatus.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Permission granted! Starting video chat...';
                            }
                            
                            // Hide permission dialog after delay
                            setTimeout(() => {
                                const permissionRequest = document.getElementById('permissionRequest');
                                if (permissionRequest) {
                                    permissionRequest.style.display = 'none';
                                }
                                
                                // Store stream in WebRTCMedia if it exists
                                if (window.WebRTCMedia) {
                                    window.WebRTCMedia.localStream = stream;
                                }
                            }, 1000);
                        })
                        .catch(error => {
                            console.error("Camera access denied:", error);
                            
                            // Update UI based on error
                            if (permissionStatus) {
                                permissionStatus.className = 'p-3 bg-red-700 rounded mb-4 text-center text-white';
                                if (error.name === 'NotAllowedError') {
                                    permissionStatus.innerHTML = '<i class="fas fa-times-circle mr-2"></i> Permission denied. Please allow camera and microphone access.';
                                } else if (error.name === 'NotFoundError') {
                                    permissionStatus.innerHTML = '<i class="fas fa-exclamation-triangle mr-2"></i> No camera or microphone found on your device.';
                                } else {
                                    permissionStatus.innerHTML = `<i class="fas fa-exclamation-triangle mr-2"></i> ${error.message || 'Unknown error accessing media devices'}`;
                                }
                            }
                        });
                } else {
                    console.log("Modules not yet loaded, updating UI");
                    // Update UI to show we're still loading
                    const permissionStatus = document.getElementById('permissionStatus');
                    if (permissionStatus) {
                        permissionStatus.innerHTML = 'Modules still loading. Please wait a moment and try again...';
                    }
                }
            }
        });
    }
    
    // Audio only button 
    const audioOnlyBtn = document.getElementById('audioOnlyBtn');
    if (audioOnlyBtn) {
        audioOnlyBtn.addEventListener('click', function() {
            console.log("Audio only button clicked");
            
            if (window.WebRTCMedia && typeof window.WebRTCMedia.retryMediaAccess === 'function') {
                console.log("WebRTCMedia.retryMediaAccess is available, calling with video=false");
                window.WebRTCMedia.retryMediaAccess(false);
            } else {
                console.error("WebRTCMedia.retryMediaAccess not available");
                
                // Manual fallback if the function isn't available
                if (modulesLoaded) {
                    const permissionStatus = document.getElementById('permissionStatus');
                    if (permissionStatus) {
                        permissionStatus.className = 'p-3 bg-gray-700 rounded mb-4 text-center text-yellow-300';
                        permissionStatus.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Requesting audio only...';
                    }
                    
                    // Direct getUserMedia call as fallback
                    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
                        .then(stream => {
                            console.log("Audio access granted via fallback");
                            
                            // Update UI
                            if (permissionStatus) {
                                permissionStatus.className = 'p-3 bg-green-700 rounded mb-4 text-center text-white';
                                permissionStatus.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Audio access granted! Starting chat...';
                            }
                            
                            // Hide permission dialog after delay
                            setTimeout(() => {
                                const permissionRequest = document.getElementById('permissionRequest');
                                if (permissionRequest) {
                                    permissionRequest.style.display = 'none';
                                }
                                
                                // Store stream in WebRTCMedia if it exists
                                if (window.WebRTCMedia) {
                                    window.WebRTCMedia.localStream = stream;
                                }
                            }, 1000);
                        })
                        .catch(error => {
                            console.error("Audio access denied:", error);
                            
                            // Update UI based on error
                            if (permissionStatus) {
                                permissionStatus.className = 'p-3 bg-red-700 rounded mb-4 text-center text-white';
                                permissionStatus.innerHTML = '<i class="fas fa-times-circle mr-2"></i> Audio permission denied. Please allow microphone access.';
                            }
                        });
                }
            }
        });
    }
}

// Global error handler for WebRTC-related errors
window.addEventListener('error', (event) => {
    if (window.WebRTCUI && event.error) {
        window.WebRTCUI.addLogEntry(`Uncaught error: ${event.error.message}`, 'error');
    }
});
