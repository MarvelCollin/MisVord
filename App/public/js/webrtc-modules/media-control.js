/**
 * WebRTC Media Control Module
 * Handles local media stream (camera, microphone, screen sharing)
 */

// Local media stream
let localStream = null;
let screenStream = null;
let isVideoEnabled = true;
let isAudioEnabled = true;
let isScreenSharing = false;

// Default media constraints
const defaultMediaConstraints = {
    audio: {
        echoCancellation: true,  // Reduce echo
        noiseSuppression: true,  // Reduce background noise
        autoGainControl: true    // Maintain consistent volume
    },
    video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
    }
};

// Mobile media constraints (lower quality)
const mobileMediaConstraints = {
    audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
    },
    video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { max: 20 }
    }
};

// Low bandwidth media constraints
const lowBandwidthMediaConstraints = {
    audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
    },
    video: {
        width: { ideal: 320 },
        height: { ideal: 240 },
        frameRate: { max: 15 }
    }
};

/**
 * Initialize the local media stream
 * @param {boolean} audio - Whether to request audio
 * @param {boolean} video - Whether to request video
 * @param {function} onSuccess - Callback when media is successfully initialized
 * @param {function} onError - Callback when media initialization fails
 * @returns {Promise<boolean>} Whether initialization was successful
 */
async function initLocalStream(audio = true, video = true, onSuccess = null, onError = null) {
    // Update UI to show we're accessing the camera
    updatePermissionUI('requesting');
    
    // Stop any existing stream
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    
    // Select appropriate constraints based on network conditions
    let constraints;
    if (window.isLowBandwidthConnection) {
        console.log('Using low bandwidth media constraints');
        constraints = lowBandwidthMediaConstraints;
    } else if (window.isMobileNetwork) {
        console.log('Using mobile-optimized media constraints');
        constraints = mobileMediaConstraints;
    } else {
        console.log('Using default media constraints');
        constraints = defaultMediaConstraints;
    }
    
    // Apply requested media types
    constraints.audio = audio ? constraints.audio : false;
    constraints.video = video ? constraints.video : false;
    
    // Try to get user media
    try {
        console.log('Requesting media with constraints:', constraints);
        
        // Request permissions
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        console.log('Media stream obtained:', localStream.getTracks().map(t => t.kind).join(', '));
        
        // Initialize state variables
        isVideoEnabled = video;
        isAudioEnabled = audio;
        
        // Update UI to show success
        updatePermissionUI('granted');
        
        // Update video element if it exists
        const localVideoElement = document.getElementById('localVideo');
        if (localVideoElement) {
            localVideoElement.srcObject = localStream;
            
            try {
                await localVideoElement.play();
                console.log('Local video playback started');
            } catch (playError) {
                console.error('Local video play error:', playError);
                
                // Try with muted first
                localVideoElement.muted = true;
                try {
                    await localVideoElement.play();
                    console.log('Local video playing (muted)');
                } catch (fallbackError) {
                    console.error('Even muted playback failed:', fallbackError);
                }
            }
        }
        
        // Hide permission dialog completely after a short delay
        setTimeout(() => {
            const permissionRequest = document.getElementById('permissionRequest');
            if (permissionRequest) {
                permissionRequest.style.display = 'none';
            }
        }, 1000);
        
        // Call success callback
        if (onSuccess) onSuccess(localStream);
        
        return true;
    } catch (error) {
        console.error('Error initializing local stream:', error);
        
        // Special handling for common errors
        let errorMessage = error.message;
        let fallbackAttempted = false;
        
        if (error.name === 'NotAllowedError') {
            errorMessage = 'Camera or microphone permission denied. Please check your browser settings.';
            updatePermissionUI('denied');
            
            // Show instructions for this browser
            if (window.WebRTCCompatibility && typeof window.WebRTCCompatibility.getResetInstructions === 'function') {
                const instructions = window.WebRTCCompatibility.getResetInstructions();
                console.log('Permission reset instructions:', instructions);
                
                // Update status message with reset instructions
                const permissionStatus = document.getElementById('permissionStatus');
                if (permissionStatus) {
                    permissionStatus.innerHTML = `
                        <div class="text-red-400"><i class="fas fa-ban"></i> Permission denied</div>
                        <div class="text-xs mt-2 text-left">
                            ${instructions.replace(/\n/g, '<br>')}
                        </div>
                    `;
                }
            }
        } else if (error.name === 'NotFoundError') {
            errorMessage = 'No camera or microphone found on your device.';
            updatePermissionUI('notfound');
            
            // Try audio-only as fallback if video was requested
            if (video && !fallbackAttempted) {
                console.log('Trying audio-only as fallback');
                fallbackAttempted = true;
                return initLocalStream(true, false, onSuccess, onError);
            }
        } else if (error.name === 'NotReadableError') {
            errorMessage = 'Your camera or microphone is already in use by another application.';
            updatePermissionUI('inuse');
        } else {
            // Generic error
            updatePermissionUI('error', errorMessage);
        }
        
        // Call error callback
        if (onError) onError(errorMessage);
        
        return false;
    }
}

/**
 * Update the permission UI
 * @param {string} status - The permission status (requesting, granted, denied, notfound, inuse, error)
 * @param {string} message - Custom message for error status
 */
function updatePermissionUI(status, message = '') {
    const permissionRequest = document.getElementById('permissionRequest');
    const permissionStatus = document.getElementById('permissionStatus');
    const retryBtn = document.getElementById('retryPermissionBtn');
    const audioOnlyBtn = document.getElementById('audioOnlyBtn');
    const dismissBtn = document.getElementById('dismissPermissionBtn');
    
    if (!permissionRequest || !permissionStatus || !retryBtn || !audioOnlyBtn || !dismissBtn) {
        console.warn('Permission UI elements not found. Cannot update UI.');
        return;
    }
    
    // Make sure the permission request is visible (unless explicitly hiding)
    if (status !== 'hiding') { 
        permissionRequest.style.display = 'flex';
    }

    // Default button states
    retryBtn.style.display = 'none';
    audioOnlyBtn.style.display = 'none';
    dismissBtn.style.display = 'none';
    
    switch (status) {
        case 'requesting':
            permissionStatus.className = 'p-3 bg-gray-700 rounded mb-4 text-center text-yellow-300';
            permissionStatus.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Waiting for permission...';
            // Buttons remain hidden
            break;
        
        case 'granted':
            permissionStatus.className = 'p-3 bg-green-700 rounded mb-4 text-center text-white';
            permissionStatus.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Permission granted! Starting video chat...';
            // Buttons remain hidden, modal will be dismissed by initLocalStream
            break;
        
        case 'denied':
            permissionStatus.className = 'p-3 bg-red-700 rounded mb-4 text-center text-white';
            // The detailed instructions are already set by initLocalStream's error handler for NotAllowedError
            // If not set by that, use a generic message.
            if (!permissionStatus.innerHTML.includes('Permission reset instructions')) {
                 permissionStatus.innerHTML = '<i class="fas fa-times-circle mr-2"></i> Permission denied. Please check browser settings or try again.';
            }
            retryBtn.style.display = 'block';
            audioOnlyBtn.style.display = 'block';
            dismissBtn.style.display = 'block';
            break;
        
        case 'notfound':
            permissionStatus.className = 'p-3 bg-red-700 rounded mb-4 text-center text-white';
            permissionStatus.innerHTML = '<i class="fas fa-exclamation-triangle mr-2"></i> No camera or microphone found. Try audio only or check devices.';
            retryBtn.style.display = 'block'; // User might plug in a device
            audioOnlyBtn.style.display = 'block';
            dismissBtn.style.display = 'block';
            break;
        
        case 'inuse':
            permissionStatus.className = 'p-3 bg-red-700 rounded mb-4 text-center text-white';
            permissionStatus.innerHTML = '<i class="fas fa-exclamation-triangle mr-2"></i> Camera/microphone is in use by another app. Close it or try again.';
            retryBtn.style.display = 'block';
            audioOnlyBtn.style.display = 'block'; // Audio might still work
            dismissBtn.style.display = 'block';
            break;
        
        case 'error':
            permissionStatus.className = 'p-3 bg-red-700 rounded mb-4 text-center text-white';
            permissionStatus.innerHTML = `<i class="fas fa-exclamation-triangle mr-2"></i> ${message || 'Error accessing media devices. Please try again.'}`;
            retryBtn.style.display = 'block';
            audioOnlyBtn.style.display = 'block';
            dismissBtn.style.display = 'block';
            break;
        case 'hiding': // Special case to just hide the modal
            permissionRequest.style.display = 'none';
            break;
    }
}

/**
 * Toggle local video on/off
 */
function toggleLocalVideo() {
    if (!localStream) return false;
    
    const videoTracks = localStream.getVideoTracks();
    if (videoTracks.length === 0) return false;
    
    isVideoEnabled = !isVideoEnabled;
    
    videoTracks.forEach(track => {
        track.enabled = isVideoEnabled;
    });
    
    // Update UI state
    updateMediaToggleButtons();
    
    console.log(`Local video ${isVideoEnabled ? 'enabled' : 'disabled'}`);
    return isVideoEnabled;
}

/**
 * Toggle local audio on/off
 */
function toggleLocalAudio() {
    if (!localStream) return false;
    
    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length === 0) return false;
    
    isAudioEnabled = !isAudioEnabled;
    
    audioTracks.forEach(track => {
        track.enabled = isAudioEnabled;
    });
    
    // Update UI state
    updateMediaToggleButtons();
    
    console.log(`Local audio ${isAudioEnabled ? 'enabled' : 'disabled'}`);
    return isAudioEnabled;
}

/**
 * Update UI state for media toggle buttons
 */
function updateMediaToggleButtons() {
    const toggleVideoBtn = document.getElementById('toggleVideoBtn');
    const toggleAudioBtn = document.getElementById('toggleAudioBtn');
    
    if (toggleVideoBtn) {
        toggleVideoBtn.classList.toggle('active', isVideoEnabled);
        toggleVideoBtn.title = isVideoEnabled ? 'Turn off camera' : 'Turn on camera';
        
        const videoIcon = toggleVideoBtn.querySelector('i') || toggleVideoBtn;
        if (videoIcon.classList) {
            if (isVideoEnabled) {
                videoIcon.classList.remove('fa-video-slash');
                videoIcon.classList.add('fa-video');
            } else {
                videoIcon.classList.remove('fa-video');
                videoIcon.classList.add('fa-video-slash');
            }
        }
    }
    
    if (toggleAudioBtn) {
        toggleAudioBtn.classList.toggle('active', isAudioEnabled);
        toggleAudioBtn.title = isAudioEnabled ? 'Mute microphone' : 'Unmute microphone';
        
        const audioIcon = toggleAudioBtn.querySelector('i') || toggleAudioBtn;
        if (audioIcon.classList) {
            if (isAudioEnabled) {
                audioIcon.classList.remove('fa-microphone-slash');
                audioIcon.classList.add('fa-microphone');
            } else {
                audioIcon.classList.remove('fa-microphone');
                audioIcon.classList.add('fa-microphone-slash');
            }
        }
    }
}

/**
 * Start screen sharing
 * @param {function} onSuccess - Callback when screen sharing starts successfully
 * @param {function} onError - Callback when screen sharing fails
 * @param {function} onEnded - Callback when screen sharing ends
 */
async function startScreenSharing(onSuccess = null, onError = null, onEnded = null) {
    if (isScreenSharing) return;
    
    try {
        // Get screen sharing stream
        screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                cursor: "always",
                displaySurface: "monitor" // prefer screen over application/browser
            },
            audio: {
                suppressLocalAudioPlayback: true
            }
        });
        
        console.log('Screen sharing started');
        isScreenSharing = true;
        
        // Set up track ended listener
        screenStream.getVideoTracks().forEach(track => {
            track.onended = () => {
                console.log('Screen sharing ended by user');
                stopScreenSharing();
                
                if (onEnded) onEnded();
            };
        });
        
        // Call success callback
        if (onSuccess) onSuccess(screenStream);
        
        return true;
    } catch (error) {
        console.error('Error starting screen sharing:', error);
        
        // Call error callback
        if (onError) onError(error.message);
        
        return false;
    }
}

/**
 * Stop screen sharing
 */
function stopScreenSharing() {
    if (!isScreenSharing || !screenStream) return;
    
    // Stop all tracks
    screenStream.getTracks().forEach(track => track.stop());
    
    // Reset screen sharing state
    screenStream = null;
    isScreenSharing = false;
    
    console.log('Screen sharing stopped');
    
    return true;
}

/**
 * Apply low bandwidth optimizations to current media stream
 */
function applyLowBandwidthOptimizations() {
    if (!localStream) return false;
    
    console.log('Applying low bandwidth optimizations to media stream');
    
    // Lower video quality drastically
    const videoTracks = localStream.getVideoTracks();
    if (videoTracks.length > 0) {
        try {
            videoTracks[0].applyConstraints({
                width: { ideal: 320 },
                height: { ideal: 240 },
                frameRate: { max: 15 }
            });
            console.log('Applied low bandwidth video constraints');
            return true;
        } catch (e) {
            console.error('Could not lower video quality:', e);
            return false;
        }
    }
    
    return false;
}

/**
 * Force retrying the permission request 
 */
function retryMediaAccess(videoEnabled = true) {
    // Stop any existing streams
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    
    console.log("Retrying media access, video:", videoEnabled);
    
    // Show the permission dialog if it's hidden
    const permissionRequest = document.getElementById('permissionRequest');
    if (permissionRequest) {
        permissionRequest.style.display = 'flex';
    }
    
    // Update UI to show we're retrying
    updatePermissionUI('requesting');
    
    // Try again
    return initLocalStream(true, videoEnabled);
}

/**
 * Get the local media stream
 */
function getLocalStream() {
    return localStream;
}

/**
 * Get the screen sharing stream
 */
function getScreenStream() {
    return screenStream;
}

/**
 * Check if video is enabled
 */
function isVideoActive() {
    return isVideoEnabled;
}

/**
 * Check if audio is enabled
 */
function isAudioActive() {
    return isAudioEnabled;
}

/**
 * Check if screen sharing is active
 */
function isScreenSharingActive() {
    return isScreenSharing;
}

// Export functions
window.WebRTCMedia = {
    initLocalStream,
    toggleLocalVideo,
    toggleLocalAudio,
    updateMediaToggleButtons,
    startScreenSharing,
    stopScreenSharing,
    applyLowBandwidthOptimizations,
    getLocalStream,
    getScreenStream,
    isVideoActive,
    isAudioActive,
    isScreenSharingActive,
    retryMediaAccess,
    updatePermissionUI
}; 