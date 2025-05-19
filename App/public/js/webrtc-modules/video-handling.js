/**
 * WebRTC Video Handling Module
 * Handles video playback, autoplay permissions, and video element management
 */

const WebRTCVideoHandler = {
    // Configuration
    config: {
        autoplayTimeout: 3000,            // Timeout for autoplay attempts
        useUnmuteButtons: true,           // Whether to show unmute buttons
        usePlayButtons: true,             // Whether to show play buttons
        debugMode: false,                 // Whether to show debug information
        retryAttempts: 3,                 // Number of playback retry attempts
        autoOptimizeVideoElements: true   // Auto optimize videos for mobile/weak devices
    },

    // State tracking
    state: {
        autoplayPermissionGranted: null,  // null=unknown, true=granted, false=denied
        lastVideoElements: {},            // Keep track of recently handled video elements
        playbackIssuesCount: 0            // Counter for playback issues
    },

    /**
     * Initialize the video handling module
     * @param {Object} config - Configuration options
     */
    init(config = {}) {
        this.config = {...this.config, ...config};
        
        // Check for autoplay permission
        this.checkAutoplayPermission().then(granted => {
            this.state.autoplayPermissionGranted = granted;
            
            if (window.WebRTCUI) {
                window.WebRTCUI.addLogEntry(
                    `Initial autoplay permission: ${granted ? 'Granted' : 'Denied'}`, 
                    granted ? 'success' : 'warn'
                );
            }
            
            // If denied, show request UI
            if (!granted) {
                this.requestAutoplayPermission();
            }
        });
        
        return this;
    },
    
    /**
     * Check if autoplay is allowed in this browser/context
     * @returns {Promise<boolean>} Whether autoplay is permitted
     */
    async checkAutoplayPermission() {
        try {
            // Create a silent audio element to test autoplay
            const audioTest = document.createElement('audio');
            audioTest.volume = 0.01; // Nearly silent
            
            // Try with both MP3 and OGG sources for wider browser support
            audioTest.src = 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU3LjU2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbAAYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGD/+xDE1gAJuAFp1QAAJHG3HzqkAERMQU1FMy45OS41VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
            
            // Try to play
            const playPromise = audioTest.play();
            
            // Modern browsers will return a promise for play()
            if (playPromise !== undefined) {
                let permissionGranted = false;
                
                try {
                    await playPromise;
                    // If play succeeds, autoplay is permitted
                    permissionGranted = true;
                } catch (playError) {
                    // Play was prevented, autoplay is restricted
                    permissionGranted = false;
                }
                
                // Always clean up the test element
                audioTest.pause();
                audioTest.remove();
                
                return permissionGranted;
            } else {
                // Older browsers without promise support
                // We'll conservatively assume autoplay is not supported
                return false;
            }
        } catch (e) {
            if (window.WebRTCUI) {
                window.WebRTCUI.addLogEntry(`Error checking autoplay: ${e.message}`, 'error');
            }
            return false;
        }
    },
    
    /**
     * Request explicit permission from the user for autoplay
     * @returns {Promise<boolean>} Whether permission was granted
     */
    async requestAutoplayPermission() {
        return new Promise((resolve) => {
            // Find or create permission request UI elements
            let permissionRequest = document.getElementById('permissionRequest');
            const permissionStatus = document.getElementById('permissionStatus');
            const retryPermissionBtn = document.getElementById('retryPermissionBtn');
            const audioOnlyBtn = document.getElementById('audioOnlyBtn');
            
            // Create the permission request UI if it doesn't exist
            if (!permissionRequest) {
                permissionRequest = document.createElement('div');
                permissionRequest.id = 'permissionRequest';
                permissionRequest.className = 'fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center';
                
                permissionRequest.innerHTML = `
                    <div class="bg-gray-800 p-6 rounded-lg max-w-md text-center">
                        <h3 class="text-xl text-white mb-2">Media Playback Permission</h3>
                        <p class="text-gray-300 mb-4">
                            To enable proper video call functionality, we need you to interact with this page.
                            Please click the button below to enable audio and video playback.
                        </p>
                        <div id="permissionStatus" class="text-yellow-400 mb-4">
                            <i class="fas fa-exclamation-triangle"></i> Autoplay is currently blocked
                        </div>
                        <button id="retryPermissionBtn" class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg m-2">
                            Enable Media
                        </button>
                        <button id="audioOnlyBtn" class="bg-gray-600 hover:bg-gray-700 text-white py-2 px-6 rounded-lg m-2">
                            Audio Only
                        </button>
                    </div>
                `;
                
                document.body.appendChild(permissionRequest);
            } else {
                permissionRequest.style.display = 'flex';
            }
            
            // Set up event listeners for the buttons
            document.getElementById('retryPermissionBtn').addEventListener('click', async () => {
                // Create and play a silent audio to trigger user interaction
                const audioEl = document.createElement('audio');
                audioEl.src = 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU3LjU2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbAAYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGD/+xDE1gAJuAFp1QAAJHG3HzqkAERMQU1FMy45OS41VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
                audioEl.volume = 0.1;
                
                try {
                    await audioEl.play();
                    // If successful, update UI and resolve promise
                    if (permissionStatus) {
                        permissionStatus.innerHTML = '<i class="fas fa-check-circle text-green-500"></i> Autoplay enabled!';
                        permissionStatus.className = 'text-green-500 mb-4';
                    }
                    
                    setTimeout(() => {
                        permissionRequest.style.display = 'none';
                    }, 1500);
                    
                    this.state.autoplayPermissionGranted = true;
                    resolve(true);
                    
                    if (window.WebRTCUI) {
                        window.WebRTCUI.addLogEntry('Autoplay permission granted by user interaction', 'success');
                    }
                } catch (e) {
                    // Still denied
                    if (permissionStatus) {
                        permissionStatus.innerHTML = '<i class="fas fa-times-circle text-red-500"></i> Still blocked. Please try again.';
                        permissionStatus.className = 'text-red-500 mb-4';
                    }
                    
                    this.state.autoplayPermissionGranted = false;
                    resolve(false);
                    
                    if (window.WebRTCUI) {
                        window.WebRTCUI.addLogEntry('Autoplay permission still denied after user interaction', 'error');
                    }
                }
            });
            
            // Audio-only mode button
            document.getElementById('audioOnlyBtn').addEventListener('click', () => {
                permissionRequest.style.display = 'none';
                
                // Set to audio-only mode logic would be here
                if (window.WebRTCMedia) {
                    window.WebRTCMedia.setAudioOnlyMode(true);
                }
                
                resolve(false); // Don't consider this full permission
            });
        });
    },
    
    /**
     * Safely attempt to play a video element with fallback mechanisms
     * @param {HTMLVideoElement} videoElement - The video element to play
     * @returns {Promise<boolean>} Whether playback was successful
     */
    async safePlayVideo(videoElement) {
        if (!videoElement) return false;
        
        // Optimize video element for playback
        this.optimizeVideoForAutoplay(videoElement);
        
        // Try to start playback
        try {
            const playPromise = videoElement.play();
            
            // Modern browsers return a Promise from play()
            if (playPromise !== undefined) {
                try {
                    await playPromise;
                    
                    // Play succeeded
                    if (window.WebRTCUI && this.config.debugMode) {
                        window.WebRTCUI.addLogEntry(`Video played successfully: ${videoElement.id}`, 'success');
                    }
                    return true;
                } catch (playError) {
                    // Play was prevented
                    if (window.WebRTCUI) {
                        window.WebRTCUI.addLogEntry(`Video play error: ${playError.message}`, 'error');
                    }
                    
                    // Add UI controls for user interaction
                    this.addVideoPlayRetryButton(videoElement);
                    return false;
                }
            } else {
                // Older browsers without promise support
                return true; // Assume it worked
            }
        } catch (e) {
            if (window.WebRTCUI) {
                window.WebRTCUI.addLogEntry(`Video play exception: ${e.message}`, 'error');
            }
            return false;
        }
    },
    
    /**
     * Optimize a video element for better autoplay performance
     * @param {HTMLVideoElement} videoElement - The video element to optimize
     */
    optimizeVideoForAutoplay(videoElement) {
        if (!videoElement) return;
        
        // Ensure these attributes exist for best mobile compatibility
        videoElement.setAttribute('playsinline', '');
        videoElement.setAttribute('webkit-playsinline', '');
        
        // Remote videos should have low volume by default for safety
        if (!videoElement.id.includes('local')) {
            videoElement.volume = 0.7;
        } else {
            // Local video should always be muted to prevent echo
            videoElement.muted = true;
        }
        
        // Performance optimizations
        videoElement.autoplay = true;
        videoElement.preload = 'auto';
        
        // Mobile-specific optimizations
        const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|Windows Phone/i.test(navigator.userAgent);
        if (isMobile) {
            // Lower resolution and framerate improves performance on mobile
            videoElement.classList.add('mobile-optimized');
        }
    },
    
    /**
     * Add a retry button over a video that failed to autoplay
     * @param {HTMLVideoElement} videoElement - The video element that needs a play button
     */
    addVideoPlayRetryButton(videoElement) {
        if (!videoElement) return;
        
        // Generate a unique ID for this control
        const videoId = videoElement.id || `video-${Math.random().toString(36).substring(2, 9)}`;
        const controlId = `play-control-${videoId}`;
        
        // Check if control already exists
        if (document.getElementById(controlId)) return;
        
        // Create control container
        const controlContainer = document.createElement('div');
        controlContainer.id = controlId;
        controlContainer.className = 'absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 cursor-pointer';
        
        // Create play button
        controlContainer.innerHTML = `
            <div class="play-button-large p-4 rounded-full bg-blue-600 bg-opacity-80 text-white hover:bg-opacity-100 transition-all transform hover:scale-110">
                <i class="fas fa-play fa-2x"></i>
            </div>
            <div class="text-white text-sm absolute bottom-4 left-0 right-0 text-center">
                Click to play video
            </div>
        `;
        
        // Position the control container
        const videoContainer = videoElement.parentElement;
        if (videoContainer) {
            // Make sure the container can position the overlay correctly
            if (getComputedStyle(videoContainer).position === 'static') {
                videoContainer.style.position = 'relative';
            }
            
            videoContainer.appendChild(controlContainer);
        } else {
            // If no parent container, wrap the video
            const wrapper = document.createElement('div');
            wrapper.style.position = 'relative';
            wrapper.style.display = 'inline-block';
            
            if (videoElement.nextSibling) {
                videoElement.parentNode.insertBefore(wrapper, videoElement.nextSibling);
            } else {
                videoElement.parentNode.appendChild(wrapper);
            }
            
            wrapper.appendChild(videoElement);
            wrapper.appendChild(controlContainer);
        }
        
        // Add event listener to play the video
        controlContainer.addEventListener('click', async () => {
            try {
                await videoElement.play();
                controlContainer.remove();
                
                if (window.WebRTCUI) {
                    window.WebRTCUI.addLogEntry(`Video playback started via user interaction: ${videoId}`, 'success');
                }
            } catch (e) {
                if (window.WebRTCUI) {
                    window.WebRTCUI.addLogEntry(`Failed to play video despite user interaction: ${e.message}`, 'error');
                }
                
                // Show error message
                controlContainer.innerHTML = `
                    <div class="bg-red-600 bg-opacity-80 text-white px-4 py-2 rounded">
                        <i class="fas fa-exclamation-triangle mr-2"></i> Playback error
                        <div class="text-sm mt-1">Try refreshing the page</div>
                    </div>
                `;
                
                // Second click removes the error message
                controlContainer.addEventListener('click', () => {
                    controlContainer.remove();
                }, { once: true });
            }
        });
    },
    
    /**
     * Add a simple unmute button for audio-muted videos
     * @param {HTMLVideoElement} videoElement - The video element to add button to
     * @param {string} userId - User ID associated with this video
     */
    addSimpleUnmuteButton(videoElement, userId) {
        if (!videoElement || !this.config.useUnmuteButtons) return;
        
        const buttonId = `unmute-btn-${userId || Math.random().toString(36).substr(2, 9)}`;
        
        // Check if button already exists
        if (document.getElementById(buttonId)) return;
        
        const unmuteBtn = document.createElement('button');
        unmuteBtn.id = buttonId;
        unmuteBtn.className = 'absolute bottom-2 right-2 bg-gray-800 bg-opacity-70 text-white p-1 rounded-full hover:bg-opacity-100 focus:outline-none';
        unmuteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        unmuteBtn.title = 'Unmute';
        
        // Position the button relative to the video
        const videoContainer = videoElement.parentElement;
        if (videoContainer) {
            if (getComputedStyle(videoContainer).position === 'static') {
                videoContainer.style.position = 'relative';
            }
            
            videoContainer.appendChild(unmuteBtn);
        }
        
        // Add click handler
        unmuteBtn.addEventListener('click', () => {
            videoElement.muted = !videoElement.muted;
            
            unmuteBtn.innerHTML = videoElement.muted ? 
                '<i class="fas fa-volume-mute"></i>' : 
                '<i class="fas fa-volume-up"></i>';
                
            unmuteBtn.title = videoElement.muted ? 'Unmute' : 'Mute';
        });
    },
    
    /**
     * Add a simple play button for a video
     * @param {HTMLVideoElement} videoElement - The video element to add button to
     * @param {string} userId - User ID associated with this video
     */
    addSimplePlayButton(videoElement, userId) {
        if (!videoElement || !this.config.usePlayButtons) return;
        
        const buttonId = `play-btn-${userId || Math.random().toString(36).substr(2, 9)}`;
        
        // Check if button already exists
        if (document.getElementById(buttonId)) return;
        
        const playBtn = document.createElement('button');
        playBtn.id = buttonId;
        playBtn.className = 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 bg-opacity-70 text-white p-3 rounded-full hover:bg-opacity-100 focus:outline-none';
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        playBtn.title = 'Play';
        
        // Position the button relative to the video
        const videoContainer = videoElement.parentElement;
        if (videoContainer) {
            if (getComputedStyle(videoContainer).position === 'static') {
                videoContainer.style.position = 'relative';
            }
            
            videoContainer.appendChild(playBtn);
        }
        
        // Add click handler
        playBtn.addEventListener('click', async () => {
            try {
                await videoElement.play();
                playBtn.style.display = 'none';
                
                if (window.WebRTCUI) {
                    window.WebRTCUI.addLogEntry(`Video playback started for user ${userId}`, 'success');
                }
            } catch (e) {
                if (window.WebRTCUI) {
                    window.WebRTCUI.addLogEntry(`Failed to play video for user ${userId}: ${e.message}`, 'error');
                }
                
                playBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
                playBtn.classList.add('bg-red-600');
                
                setTimeout(() => {
                    playBtn.innerHTML = '<i class="fas fa-play"></i>';
                    playBtn.classList.remove('bg-red-600');
                }, 2000);
            }
        });
    },
    
    /**
     * Update a remote video element with proper handling for autoplay
     * @param {HTMLVideoElement} remoteVideoElement - The video element to update
     * @param {string} userId - ID of the user this video belongs to
     * @param {MediaStream} stream - Media stream to attach to the video
     */
    updateRemoteVideoElement(remoteVideoElement, userId, stream) {
        if (!remoteVideoElement || !stream) return;
        
        // Track this element
        this.state.lastVideoElements[userId] = remoteVideoElement;
        
        // Set stream
        remoteVideoElement.srcObject = stream;
        
        // Optimize the video element
        this.optimizeVideoForAutoplay(remoteVideoElement);
        
        // Try to play the video with enhanced error handling
        remoteVideoElement.play().catch(error => {
            window.WebRTCUI.addLogEntry(`Autoplay error for ${userId}: ${error.message}`, 'error');
            
            // Use the new handleAutoplayError function
            handleAutoplayError(remoteVideoElement, userId);
            
            // Still attempt to use our existing fallback methods
            if (this.state.autoplayPermissionGranted === false) {
                // If we know autoplay is blocked, add UI controls immediately
                this.addSimplePlayButton(remoteVideoElement, userId);
                this.addSimpleUnmuteButton(remoteVideoElement, userId);
            } else {
                // Try requesting permission first
                this.requestAutoplayPermission().then(granted => {
                    if (granted) {
                        // Try again after permission granted
                        this.safePlayVideo(remoteVideoElement).catch(() => {
                            // If it still fails, make sure we have the overlay
                            handleAutoplayError(remoteVideoElement, userId);
                        });
                    } else {
                        // Add UI controls if still not granted
                        this.addSimplePlayButton(remoteVideoElement, userId);
                        this.addSimpleUnmuteButton(remoteVideoElement, userId);
                    }
                });
            }
        });
        
        // Monitor the video element for issues
        this.monitorVideoPlayback(remoteVideoElement, userId);
    },
    
    /**
     * Monitor a video element for playback issues
     * @param {HTMLVideoElement} videoElement - The video element to monitor
     * @param {string} userId - ID of the user this video belongs to
     */
    monitorVideoPlayback(videoElement, userId) {
        if (!videoElement) return;
        
        // Listen for stalled event
        videoElement.addEventListener('stalled', () => {
            if (window.WebRTCUI) {
                window.WebRTCUI.addLogEntry(`Video stalled for user ${userId}`, 'warn');
            }
            
            this.state.playbackIssuesCount++;
            this.retryVideoPlayback(videoElement, userId);
        });
        
        // Listen for waiting too long
        let waitingTimeout;
        videoElement.addEventListener('waiting', () => {
            waitingTimeout = setTimeout(() => {
                if (window.WebRTCUI) {
                    window.WebRTCUI.addLogEntry(`Video waiting too long for user ${userId}`, 'warn');
                }
                
                this.state.playbackIssuesCount++;
                this.retryVideoPlayback(videoElement, userId);
            }, 5000); // 5 seconds of waiting triggers a retry
        });
        
        videoElement.addEventListener('playing', () => {
            if (waitingTimeout) {
                clearTimeout(waitingTimeout);
            }
        });
    },
    
    /**
     * Retry video playback after an issue
     * @param {HTMLVideoElement} videoElement - The video element to retry
     * @param {string} userId - ID of the user this video belongs to
     */
    retryVideoPlayback(videoElement, userId) {
        if (!videoElement) return;
        
        // Don't retry too many times
        if (this.state.playbackIssuesCount > this.config.retryAttempts) {
            if (window.WebRTCUI) {
                window.WebRTCUI.addLogEntry(`Too many playback issues, adding manual controls for ${userId}`, 'error');
            }
            
            // Show manual controls instead of auto-retrying
            this.addSimplePlayButton(videoElement, userId);
            return;
        }
        
        // Try to play again
        this.safePlayVideo(videoElement).then(success => {
            if (success) {
                if (window.WebRTCUI) {
                    window.WebRTCUI.addLogEntry(`Video playback recovered for ${userId}`, 'success');
                }
            } else {
                if (window.WebRTCUI) {
                    window.WebRTCUI.addLogEntry(`Failed to recover video playback for ${userId}`, 'error');
                }
                
                // Show manual controls
                this.addSimplePlayButton(videoElement, userId);
            }
        });
    }
};

// Export the video handler module
window.WebRTCVideoHandler = WebRTCVideoHandler;

/**
 * Add autoplay error handling to handle browser restrictions
 * This is called when a video element fails to autoplay
 * @param {HTMLVideoElement} videoElement - The video element that failed to autoplay
 * @param {string} userId - The user ID associated with this video
 */
function handleAutoplayError(videoElement, userId) {
    if (!videoElement) return;
    
    window.WebRTCUI.addLogEntry(`Autoplay failed for user ${userId}`, 'media');
    
    // Create an overlay with a play button
    const container = videoElement.parentElement;
    if (!container) return;
    
    // Check if we already added a play button
    if (container.querySelector('.autoplay-overlay')) return;
    
    // Create an overlay with a play button
    const overlay = document.createElement('div');
    overlay.className = 'autoplay-overlay absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-30';
    
    const playButton = document.createElement('button');
    playButton.className = 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full flex items-center';
    playButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg> Tap to Unmute';
    
    playButton.addEventListener('click', () => {
        // Try to play the video when the user clicks the button
        videoElement.muted = false; // First try unmuted
        videoElement.play().catch(() => {
            // If it still fails, try muted (which has less restrictions)
            videoElement.muted = true;
            videoElement.play().then(() => {
                window.WebRTCUI.addLogEntry(`Video playing (muted) for ${userId}`, 'media');
                window.WebRTCUI.showLowBandwidthWarning('Audio muted due to browser restrictions. Click the microphone icon to unmute.');
            }).catch(e => {
                window.WebRTCUI.addLogEntry(`Still cannot play video: ${e.message}`, 'error');
            });
        });
        
        // Remove the overlay
        overlay.remove();
    });
    
    overlay.appendChild(playButton);
    container.appendChild(overlay);
}

/**
 * Ensure all media playback can start
 * This should be called after user interaction (click, etc)
 */
function enableMediaPlayback() {
    // Get all video elements in the page
    const videos = document.querySelectorAll('video');
    
    // Try to play each video element
    videos.forEach(video => {
        if (video.paused) {
            video.play().catch(error => {
                window.WebRTCUI.addLogEntry(`Autoplay still denied: ${error.message}`, 'error');
                // Get userId from video id (format: remote-video-{userId})
                const userId = video.id.replace('remote-video-', '');
                handleAutoplayError(video, userId);
            });
        }
    });
}

// Add a global click handler to enable media playback after user interaction
document.addEventListener('click', function() {
    // Use timeout to ensure this happens after other click handlers
    setTimeout(enableMediaPlayback, 100);
}, { once: true });

// Export the autoplay handling functions to the namespace
window.WebRTCVideoHandler = window.WebRTCVideoHandler || {};
window.WebRTCVideoHandler.handleAutoplayError = handleAutoplayError;
window.WebRTCVideoHandler.enableMediaPlayback = enableMediaPlayback; 