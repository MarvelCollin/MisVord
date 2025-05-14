/**
 * WebRTC Video Player Module
 * Handles video playback and autoplay issues
 */

// Helper function to play video with temporary mute to bypass autoplay restrictions
function playWithUnmuteSequence(videoElement, userId) {
    // First check if video element exists
    if (!videoElement) return;
    
    console.log(`Starting play with unmute sequence for ${userId}`);
    
    // Use debug overlay if available
    if (window.WebRTCDebug && typeof window.WebRTCDebug.showOverlay === 'function') {
        window.WebRTCDebug.showOverlay(userId, "Attempting to play video...", "info");
    }
    
    // Verify we have a valid stream and tracks
    const stream = videoElement.srcObject;
    if (!stream) {
        if (window.WebRTCDebug) {
            window.WebRTCDebug.showOverlay(userId, "No stream attached to video element", "error");
        }
        return;
    }
    
    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length === 0) {
        if (window.WebRTCDebug) {
            window.WebRTCDebug.showOverlay(userId, "Stream has no video tracks", "error");
        }
        return;
    }
    
    // Log track status
    videoTracks.forEach(track => {
        if (window.WebRTCDebug) {
            window.WebRTCDebug.showOverlay(userId, `Track: ${track.enabled ? "enabled" : "disabled"}, ${track.muted ? "muted" : "unmuted"}, state: ${track.readyState}`, "info");
        }
    });
    
    // Save the original properties
    const wasMuted = videoElement.muted;
    const wasControls = videoElement.controls;
    
    // Apply autoplay-friendly settings
    videoElement.muted = true;
    videoElement.controls = true; // Shows native controls in some browsers, helps with autoplay
    
    // Additional attributes to encourage playback
    videoElement.setAttribute('playsinline', '');
    videoElement.setAttribute('webkit-playsinline', '');
    
    // First try: normal play attempt
    videoElement.play().then(() => {
        if (window.WebRTCDebug) {
            window.WebRTCDebug.showOverlay(userId, "Initial muted play succeeded", "success");
        }
        handleSuccessfulPlay();
    }).catch(err => {
        if (window.WebRTCDebug) {
            window.WebRTCDebug.showOverlay(userId, `Play attempt failed: ${err.message}`, "error");
        }
        // Final fallback: Keep muted but add manual play button
        videoElement.muted = true; // Keep muted so at least it can play
        addImprovedPlayButton(videoElement, userId);
    });
    
    // Handle successful play
    function handleSuccessfulPlay() {
        // After successful play, restore original properties with a delay
        setTimeout(() => {
            // Check if video is actually receiving frames
            if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
                if (window.WebRTCDebug) {
                    window.WebRTCDebug.showOverlay(userId, "Video playing but no frames received (0x0)", "error");
                }
                // Keep it muted and controls on so it at least plays
                return;
            }
            
            // Restore original properties
            videoElement.muted = wasMuted;
            videoElement.controls = wasControls;
            
            if (window.WebRTCDebug) {
                window.WebRTCDebug.showOverlay(userId, `Video unmuted, dimensions: ${videoElement.videoWidth}x${videoElement.videoHeight}`, "success");
            }
            
            // Monitor for any further issues
            monitorVideoPlayback(videoElement, userId);
        }, 2000);
    }
}

// Simulate a user gesture to help with autoplay
function simulateUserGesture(callback) {
    // Create a temporary button that will trigger the callback
    const tempButton = document.createElement('button');
    tempButton.style.display = 'none';
    tempButton.addEventListener('click', () => {
        callback();
        // Remove after use
        if (tempButton.parentNode) {
            tempButton.parentNode.removeChild(tempButton);
        }
    });
    
    document.body.appendChild(tempButton);
    tempButton.click();
}

// Monitor video playback to detect issues
function monitorVideoPlayback(videoElement, userId) {
    if (!videoElement) return;
    
    let blackFrameCount = 0;
    let lastWidth = videoElement.videoWidth;
    let lastHeight = videoElement.videoHeight;
    
    const monitor = setInterval(() => {
        // Check if video element still exists
        if (!document.contains(videoElement)) {
            clearInterval(monitor);
            return;
        }
        
        // Check if paused
        if (videoElement.paused) {
            if (window.WebRTCDebug) {
                window.WebRTCDebug.showOverlay(userId, "Video playback paused unexpectedly", "error");
            }
            
            // Try to resume
            videoElement.play().catch(e => {
                if (window.WebRTCDebug) {
                    window.WebRTCDebug.showOverlay(userId, `Cannot resume: ${e.message}`, "error");
                }
            });
        }
        
        // Check for dimension changes (might indicate stream started/stopped)
        if (lastWidth !== videoElement.videoWidth || lastHeight !== videoElement.videoHeight) {
            if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
                if (window.WebRTCDebug) {
                    window.WebRTCDebug.showOverlay(userId, "Video dimensions changed to 0x0", "error");
                }
            } else {
                if (window.WebRTCDebug) {
                    window.WebRTCDebug.showOverlay(userId, `Video dimensions changed to ${videoElement.videoWidth}x${videoElement.videoHeight}`, "info");
                }
            }
            
            lastWidth = videoElement.videoWidth;
            lastHeight = videoElement.videoHeight;
        }
        
        // Check if stream still has tracks
        const stream = videoElement.srcObject;
        if (stream) {
            const videoTracks = stream.getVideoTracks();
            if (videoTracks.length === 0) {
                if (window.WebRTCDebug) {
                    window.WebRTCDebug.showOverlay(userId, "Video tracks have been removed", "error");
                }
            } else {
                // Check track status
                videoTracks.forEach(track => {
                    if (track.readyState !== 'live') {
                        if (window.WebRTCDebug) {
                            window.WebRTCDebug.showOverlay(userId, `Track state changed to ${track.readyState}`, "error");
                        }
                    }
                });
            }
        } else {
            if (window.WebRTCDebug) {
                window.WebRTCDebug.showOverlay(userId, "Video srcObject has been removed", "error");
            }
        }
        
        // Stop monitoring after 30 seconds to save resources
        if (++blackFrameCount > 10) {
            clearInterval(monitor);
        }
    }, 3000);
}

// Enhanced play button with more information
function addImprovedPlayButton(videoElement, userId) {
    // Get container
    const container = document.getElementById(`container-${userId}`);
    if (!container) return;
    
    // Remove any existing play buttons
    const existingButton = container.querySelector('.remote-play-button');
    if (existingButton) {
        existingButton.remove();
    }
    
    // Create button with more details
    const playButton = document.createElement('div');
    playButton.className = 'remote-play-button absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center text-white z-30';
    
    // Add icon
    const iconContainer = document.createElement('div');
    iconContainer.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    `;
    
    // Add text
    const text = document.createElement('div');
    text.className = 'mt-4 text-center px-4';
    text.innerHTML = `
        <div class="text-lg font-bold mb-2">Click to Play Video</div>
        <div class="text-sm opacity-80">Autoplay was blocked by your browser</div>
    `;
    
    // Add diagnostic info
    const diagInfo = document.createElement('div');
    diagInfo.className = 'mt-4 text-xs text-gray-400 max-w-xs text-center';
    
    // Check stream and tracks
    const stream = videoElement.srcObject;
    let diagText = 'Diagnostic: ';
    
    if (!stream) {
        diagText += 'No media stream found.';
    } else {
        const videoTracks = stream.getVideoTracks();
        diagText += `${videoTracks.length} video tracks. `;
        
        if (videoTracks.length > 0) {
            diagText += `Track state: ${videoTracks[0].readyState}, ${videoTracks[0].enabled ? 'enabled' : 'disabled'}.`;
        }
    }
    
    diagInfo.textContent = diagText;
    
    // Assemble button
    playButton.appendChild(iconContainer);
    playButton.appendChild(text);
    playButton.appendChild(diagInfo);
    
    // Add to container
    container.appendChild(playButton);
    
    // Add click handler
    playButton.addEventListener('click', () => {
        playButton.innerHTML = '<div class="text-lg">Starting video...</div>';
        
        // Try to play with unmute sequence
        playWithUnmuteSequence(videoElement, userId);
        
        // Remove button after a short delay
        setTimeout(() => {
            if (playButton.parentNode) {
                playButton.parentNode.removeChild(playButton);
            }
        }, 1000);
    });
}

// Export functions for use in the main module
window.WebRTCPlayer = {
    playWithUnmuteSequence,
    simulateUserGesture,
    monitorVideoPlayback,
    addImprovedPlayButton
}; 