/**
 * Enhanced WebRTC Video Player Module
 * Optimized for handling common WebRTC video issues including autoplay,
 * black screen detection, and quality adaptation.
 */

function playWithUnmuteSequence(videoElement, userId) {
    if (!videoElement) return;
    
    console.log(`Starting play with unmute sequence for ${userId}`);
    
    if (window.WebRTCDebug && typeof window.WebRTCDebug.showOverlay === 'function') {
        window.WebRTCDebug.showOverlay(userId, "Attempting to play video...", "info");
    }
    
    // Check if we have a valid stream
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
    
    // Set video track constraints for better performance if possible
    try {
        const capabilities = videoTracks[0].getCapabilities();
        if (capabilities) {
            // Only try to adjust if the browser supports this API
            const constraints = {};
            
            // First try to maintain HD if available
            if (capabilities.width && capabilities.width.max >= 1280) {
                constraints.width = { ideal: 1280 };
            }
            if (capabilities.height && capabilities.height.max >= 720) {
                constraints.height = { ideal: 720 };
            }
            
            // Try to set framerate to 30fps if supported
            if (capabilities.frameRate && capabilities.frameRate.max >= 30) {
                constraints.frameRate = { ideal: 30 };
            }
            
            if (Object.keys(constraints).length > 0) {
                videoTracks[0].applyConstraints(constraints)
                    .then(() => {
                        if (window.WebRTCDebug) {
                            window.WebRTCDebug.showOverlay(userId, `Applied video constraints: ${JSON.stringify(constraints)}`, "info");
                        }
                    })
                    .catch(err => {
                        if (window.WebRTCDebug) {
                            window.WebRTCDebug.showOverlay(userId, `Could not apply constraints: ${err.message}`, "warn");
                        }
                    });
            }
        }
    } catch (e) {
        console.log("Track capabilities not supported, skipping constraint optimization");
    }
    
    // Log current track state
    videoTracks.forEach(track => {
        if (window.WebRTCDebug) {
            window.WebRTCDebug.showOverlay(userId, `Track: ${track.enabled ? "enabled" : "disabled"}, ${track.muted ? "muted" : "unmuted"}, state: ${track.readyState}`, "info");
        }
    });
    
    // Save original settings
    const wasMuted = videoElement.muted;
    const wasControls = videoElement.controls;
    
    // Initially mute to help with autoplay
    videoElement.muted = true;
    videoElement.controls = true; 
    
    // Set attributes for iOS Safari
    videoElement.setAttribute('playsinline', '');
    videoElement.setAttribute('webkit-playsinline', '');
    
    // First try playing muted (more likely to work with autoplay restrictions)
    videoElement.play().then(() => {
        if (window.WebRTCDebug) {
            window.WebRTCDebug.showOverlay(userId, "Initial muted play succeeded", "success");
        }
        
        // Add unmute button if we're auto-playing muted but need sound
        if (!wasMuted) {
            addUnmuteButton(videoElement, userId);
        }
        
        handleSuccessfulPlay();
    }).catch(err => {
        if (window.WebRTCDebug) {
            window.WebRTCDebug.showOverlay(userId, `Play attempt failed: ${err.message}`, "error");
        }
        
        videoElement.muted = true; 
        addImprovedPlayButton(videoElement, userId);
    });
    
    // Function to handle successful playback
    function handleSuccessfulPlay() {
        // Wait for video frames to appear
        setTimeout(() => {
            // Check if video is actually playing (has dimensions)
            if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
                if (window.WebRTCDebug) {
                    window.WebRTCDebug.showOverlay(userId, "Video playing but no frames received (0x0)", "error");
                }
                
                // Try to recover from no-frame issue
                triggerStreamRefresh();
                return;
            }
            
            // Successfully playing, restore original settings
            // We'll handle unmuting with the unmute button instead
            // videoElement.muted = wasMuted;
            videoElement.controls = wasControls;
            
            if (window.WebRTCDebug) {
                window.WebRTCDebug.showOverlay(userId, `Video playing, dimensions: ${videoElement.videoWidth}x${videoElement.videoHeight}, muted: ${videoElement.muted}`, "success");
            }
            
            // Start monitoring playback quality
            monitorVideoPlayback(videoElement, userId);
        }, 2000);
    }
    
    // Function to refresh the stream if we have issues
    function triggerStreamRefresh() {
        if (!stream) return;
        
        if (window.WebRTCDebug) {
            window.WebRTCDebug.showOverlay(userId, "Attempting to refresh video stream", "info");
        }
        
        // Create a new MediaStream from the current tracks
        const refreshedStream = new MediaStream();
        
        // Use the existing tracks but "refresh" them
        stream.getTracks().forEach(track => {
            refreshedStream.addTrack(track);
        });
        
        // Apply the refreshed stream
        videoElement.srcObject = refreshedStream;
        
        // Try playing again
        videoElement.play().catch(e => {
            if (window.WebRTCDebug) {
                window.WebRTCDebug.showOverlay(userId, `Refresh play failed: ${e.message}`, "error");
            }
        });
    }
}

// Function to add an unmute button overlay when video plays muted
function addUnmuteButton(videoElement, userId) {
    // Check if container exists - try both naming patterns
    let container = document.getElementById(`container-${userId}`);
    
    // If not found, try the video-container pattern
    if (!container) {
        container = document.getElementById(`video-container-${userId}`);
    }
    
    // If still no container, try the parent of the video element
    if (!container && videoElement && videoElement.parentElement) {
        container = videoElement.parentElement;
    }
    
    if (!container) return;
    
    // First check if we already have an unmute button
    if (document.getElementById(`unmute-btn-${userId}`)) return;
    
    // Create the unmute button overlay
    const unmuteOverlay = document.createElement('div');
    unmuteOverlay.id = `unmute-overlay-${userId}`;
    unmuteOverlay.className = 'absolute inset-0 flex items-center justify-center z-20 pointer-events-none';
    
    const unmuteButton = document.createElement('button');
    unmuteButton.id = `unmute-btn-${userId}`;
    unmuteButton.className = 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full pointer-events-auto flex items-center';
    unmuteButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clip-rule="evenodd" />
        </svg>
        Tap to Unmute
    `;
    
    // Handle click event
    unmuteButton.addEventListener('click', function() {
        try {
            // Unmute the video
            videoElement.muted = false;
            
            // Check if video is paused, if so play it
            if (videoElement.paused) {
                videoElement.play().catch(e => {
                    console.error("Failed to play video after unmuting:", e);
                });
            }
            
            // Remove the unmute button
            if (unmuteOverlay.parentNode) {
                unmuteOverlay.parentNode.removeChild(unmuteOverlay);
            }
            
            // Log the unmute action
            if (window.WebRTCDebug) {
                window.WebRTCDebug.showOverlay(userId, "Video unmuted by user", "success");
            }
        } catch (err) {
            console.error("Error unmuting video:", err);
            if (window.WebRTCDebug) {
                window.WebRTCDebug.showOverlay(userId, `Failed to unmute: ${err.message}`, "error");
            }
        }
    });
    
    unmuteOverlay.appendChild(unmuteButton);
    container.appendChild(unmuteOverlay);
    
    // Auto-remove the unmute button after 15 seconds if not clicked
    setTimeout(() => {
        if (document.getElementById(`unmute-overlay-${userId}`)) {
            // Make it fade away visually
            const overlay = document.getElementById(`unmute-overlay-${userId}`);
            if (overlay) {
                overlay.style.transition = 'opacity 1s';
                overlay.style.opacity = '0';
                
                // Then remove it from DOM after fade out
                setTimeout(() => {
                    if (overlay.parentNode) {
                        overlay.parentNode.removeChild(overlay);
                    }
                }, 1000);
            }
        }
    }, 15000);
}

// Function to simulate a user gesture to help with autoplay
function simulateUserGesture(callback) {
    // Create a temporary button element
    const tempButton = document.createElement('button');
    tempButton.style.display = 'none';
    tempButton.addEventListener('click', () => {
        callback();
        
        // Clean up after ourselves
        if (tempButton.parentNode) {
            tempButton.parentNode.removeChild(tempButton);
        }
    });
    
    // Add to DOM and click it
    document.body.appendChild(tempButton);
    tempButton.click();
}

// Advanced video monitoring function
function monitorVideoPlayback(videoElement, userId) {
    if (!videoElement) return;
    
    let blackFrameCount = 0;
    let stalledFrameDetector = { lastHash: null, unchangedCount: 0 };
    let lastWidth = videoElement.videoWidth;
    let lastHeight = videoElement.videoHeight;
    let frameCounter = 0;
    let recoveryAttemptsCount = 0;
    const MAX_RECOVERY_ATTEMPTS = 3;
    
    // Setup the low-resolution canvas for frame comparison
    const canvas = document.createElement('canvas');
    canvas.width = 32; // Small size for efficient comparison
    canvas.height = 24;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    // Show a small indicator to show monitoring is active
    const container = document.getElementById(`container-${userId}`);
    if (container) {
        const indicator = document.createElement('div');
        indicator.className = 'absolute bottom-4 right-2 w-2 h-2 bg-green-500 rounded-full z-20';
        indicator.id = `frame-indicator-${userId}`;
        container.appendChild(indicator);
    }
    
    // Start the monitoring loop
    const monitor = setInterval(() => {
        // Stop monitoring if the video element is removed from DOM
        if (!document.contains(videoElement)) {
            clearInterval(monitor);
            return;
        }
        
        // Skip processing if video dimensions are not available
        if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
            blackFrameCount++; // Consider this potentially a black screen issue
            
            if (blackFrameCount > 3) {
                if (window.WebRTCDebug) {
                    window.WebRTCDebug.showOverlay(userId, "Zero dimensions detected - attempting recovery", "error");
                }
                
                // Try to recover from zero dimensions
                if (recoveryAttemptsCount < MAX_RECOVERY_ATTEMPTS) {
                    attemptStreamRecovery("zero-dimensions");
                    recoveryAttemptsCount++;
                }
                blackFrameCount = 0;
            }
            return;
        }
        
        // Check if video is paused unexpectedly
        if (videoElement.paused) {
            if (window.WebRTCDebug) {
                window.WebRTCDebug.showOverlay(userId, "Video playback paused unexpectedly", "error");
            }
            
            // Try to resume playback
            videoElement.play().catch(e => {
                if (window.WebRTCDebug) {
                    window.WebRTCDebug.showOverlay(userId, `Cannot resume: ${e.message}`, "error");
                }
                
                if (recoveryAttemptsCount < MAX_RECOVERY_ATTEMPTS) {
                    attemptStreamRecovery("paused-playback");
                    recoveryAttemptsCount++;
                }
            });
        }
        
        // Check if video dimensions changed
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
        
        // Check track status
        const stream = videoElement.srcObject;
        if (stream) {
            const videoTracks = stream.getVideoTracks();
            if (videoTracks.length === 0) {
                if (window.WebRTCDebug) {
                    window.WebRTCDebug.showOverlay(userId, "Video tracks have been removed", "error");
                }
                
                if (recoveryAttemptsCount < MAX_RECOVERY_ATTEMPTS) {
                    attemptStreamRecovery("no-video-tracks");
                    recoveryAttemptsCount++;
                }
            } else {
                // Check each track's state
                let hasLiveTrack = false;
                videoTracks.forEach(track => {
                    if (track.readyState !== 'live') {
                        if (window.WebRTCDebug) {
                            window.WebRTCDebug.showOverlay(userId, `Track state changed to ${track.readyState}`, "error");
                        }
                    } else {
                        hasLiveTrack = true;
                    }
                });
                
                // If no tracks are live, try recovery
                if (!hasLiveTrack && videoTracks.length > 0 && recoveryAttemptsCount < MAX_RECOVERY_ATTEMPTS) {
                    attemptStreamRecovery("no-live-tracks");
                    recoveryAttemptsCount++;
                }
            }
        } else {
            if (window.WebRTCDebug) {
                window.WebRTCDebug.showOverlay(userId, "Video srcObject has been removed", "error");
            }
            
            if (recoveryAttemptsCount < MAX_RECOVERY_ATTEMPTS) {
                attemptStreamRecovery("no-stream");
                recoveryAttemptsCount++;
            }
        }
        
        // Advanced frame monitoring - detect stalled video
        try {
            // Update indicator
            const indicator = document.getElementById(`frame-indicator-${userId}`);
            if (indicator) {
                indicator.style.opacity = indicator.style.opacity === '1' ? '0.3' : '1';
            }
            
            // Capture a tiny version of the frame for comparison
            if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
                try {
                    ctx.drawImage(videoElement, 0, 0, videoElement.videoWidth, videoElement.videoHeight, 0, 0, canvas.width, canvas.height);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const frameHash = hashFrameData(imageData.data);
                    
                    // Check for frozen frames
                    if (stalledFrameDetector.lastHash === frameHash) {
                        stalledFrameDetector.unchangedCount++;
                        if (stalledFrameDetector.unchangedCount > 5) {
                            // Frame hasn't changed for several checks
                            if (window.WebRTCDebug) {
                                window.WebRTCDebug.showOverlay(userId, "Video appears frozen - attempting recovery", "error");
                            }
                            
                            // Try to recover the frozen video
                            if (recoveryAttemptsCount < MAX_RECOVERY_ATTEMPTS) {
                                attemptStreamRecovery("frozen-frame");
                                recoveryAttemptsCount++;
                                
                                // Reset counter after recovery attempt
                                stalledFrameDetector.unchangedCount = 0;
                            }
                        }
                    } else {
                        stalledFrameDetector.unchangedCount = 0;
                        stalledFrameDetector.lastHash = frameHash;
                    }
                    
                    // Also detect black frames
                    const blackness = detectBlackFrame(imageData.data);
                    if (blackness > 0.9) { // If 90% of the frame is black
                        blackFrameCount++;
                        if (blackFrameCount > 3) {
                            if (window.WebRTCDebug) {
                                window.WebRTCDebug.showOverlay(userId, "Black screen detected - attempting recovery", "error");
                            }
                            
                            // Try to recover from black screen
                            if (recoveryAttemptsCount < MAX_RECOVERY_ATTEMPTS) {
                                attemptStreamRecovery("black-screen");
                                recoveryAttemptsCount++;
                                blackFrameCount = 0;
                            }
                        }
                    } else {
                        blackFrameCount = 0;
                    }
                } catch (drawError) {
                    if (window.WebRTCDebug) {
                        window.WebRTCDebug.showOverlay(userId, `Error analyzing frame: ${drawError.message}`, "error");
                    }
                }
            }
            
        } catch (e) {
            console.error(`Error analyzing video for ${userId}:`, e);
        }
        
        // Count frames for performance monitoring
        frameCounter++;
        
        // Reset recovery attempts count periodically if things are working well
        if (frameCounter % 10 === 0 && recoveryAttemptsCount > 0 && blackFrameCount === 0 && stalledFrameDetector.unchangedCount === 0) {
            recoveryAttemptsCount = Math.max(0, recoveryAttemptsCount - 1);
        }
        
    }, 2000); // Check every 2 seconds
    
    // Comprehensive stream recovery function
    function attemptStreamRecovery(reason) {
        if (window.WebRTCDebug) {
            window.WebRTCDebug.showOverlay(userId, `Recovery attempt for: ${reason}`, "info");
        }
        
        // 1. First try - pause and resume
        videoElement.pause();
        setTimeout(() => {
            videoElement.play().catch(e => console.log("Play failed during recovery"));
        }, 500);
        
        // 2. Second try - recreate MediaStream
        setTimeout(() => {
            const stream = videoElement.srcObject;
            if (!stream) return;
            
            const newStream = new MediaStream();
            stream.getTracks().forEach(track => {
                if (track.readyState === 'live') {
                    newStream.addTrack(track);
                }
            });
            
            if (newStream.getTracks().length > 0) {
                videoElement.srcObject = newStream;
                videoElement.play().catch(e => console.log("Play failed with new stream"));
            }
        }, 1500);
        
        // 3. Third try - dispatch event for WebRTC to handle
        setTimeout(() => {
            const event = new CustomEvent('webrtc-stream-recovery', {
                detail: { userId: userId, reason: reason }
            });
            document.dispatchEvent(event);
            
            if (typeof window.WebRTCDebug?.triggerRefresh === 'function') {
                window.WebRTCDebug.triggerRefresh(videoElement, userId);
            }
        }, 2500);
    }
    
    // Helper to create a simple hash of frame data to detect frozen frames
    function hashFrameData(data) {
        let hash = 0;
        for (let i = 0; i < data.length; i += 16) { // Sample every 16th pixel for efficiency
            hash = ((hash << 5) - hash) + data[i];
        }
        return hash >>> 0; // Convert to 32-bit unsigned
    }
    
    // Helper function to detect black frames with improved accuracy
    function detectBlackFrame(data) {
        let blackPixels = 0;
        let totalPixels = 0;
        
        // Sample pixels throughout the image for better coverage
        for (let i = 0; i < data.length; i += 16) { // Check every 16th pixel
            totalPixels++;
            
            // R, G, B values (skip alpha)
            const r = data[i];
            const g = data[i+1];
            const b = data[i+2];
            
            // Calculate perceived brightness using luminance formula
            const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
            
            // Consider dark pixels (very low brightness) as black
            if (brightness < 15) {
                blackPixels++;
            }
        }
        
        return blackPixels / totalPixels;
    }
}

// Add a better play button with more diagnostics
function addImprovedPlayButton(videoElement, userId) {
    // Find the container - try multiple naming patterns
    let container = document.getElementById(`container-${userId}`);
    
    // If not found, try the video-container pattern
    if (!container) {
        container = document.getElementById(`video-container-${userId}`);
    }
    
    // If still no container, try the parent of the video element
    if (!container && videoElement && videoElement.parentElement) {
        container = videoElement.parentElement;
    }
    
    if (!container) return;
    
    // Remove existing button if any
    const existingButton = container.querySelector('.remote-play-button');
    if (existingButton) {
        existingButton.remove();
    }
    
    // Create play button overlay
    const playButton = document.createElement('div');
    playButton.className = 'remote-play-button absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center text-white z-30';
    
    // Add play icon
    const iconContainer = document.createElement('div');
    iconContainer.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    
    // Gather diagnostic information
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
    
    // Assemble the overlay
    playButton.appendChild(iconContainer);
    playButton.appendChild(text);
    playButton.appendChild(diagInfo);
    
    // Add to container
    container.appendChild(playButton);
    
    // Add click handler to attempt playback with user gesture
    playButton.addEventListener('click', () => {
        playButton.innerHTML = '<div class="text-lg">Starting video...</div>';
        
        // Try to start the video with user gesture context
        try {
            videoElement.muted = true; // Start muted to avoid autoplay restrictions
            
            videoElement.play()
                .then(() => {
                    // Try to unmute after playing successfully
                    setTimeout(() => {
                        videoElement.muted = false;
                        playButton.remove();
                    }, 1000);
                    
                    if (window.WebRTCDebug) {
                        window.WebRTCDebug.showOverlay(userId, "Play button: Video started successfully", "success");
                    }
                })
                .catch(err => {
                    if (window.WebRTCDebug) {
                        window.WebRTCDebug.showOverlay(userId, `Play button: Error starting video: ${err.message}`, "error");
                    }
                    
                    // Show error in the button
                    playButton.innerHTML = `
                        <div class="text-lg font-bold mb-2">Playback Failed</div>
                        <div class="text-sm opacity-80">${err.message}</div>
                        <button class="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700">Try Again</button>
                    `;
                    
                    // Add click handler to the Try Again button
                    const tryAgainBtn = playButton.querySelector('button');
                    if (tryAgainBtn) {
                        tryAgainBtn.addEventListener('click', (e) => {
                            e.stopPropagation(); // Prevent triggering parent click handler
                            addImprovedPlayButton(videoElement, userId); // Recreate the play button
                        });
                    }
                });
        } catch (e) {
            playButton.innerHTML = `
                <div class="text-lg font-bold mb-2">Unexpected Error</div>
                <div class="text-sm opacity-80">${e.message}</div>
                <button class="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700">Try Again</button>
            `;
        }
    });
}

// Export functions to the global scope
window.WebRTCPlayer = {
    playWithUnmuteSequence: playWithUnmuteSequence,
    simulateUserGesture: simulateUserGesture,
    monitorVideoPlayback: monitorVideoPlayback,
    addImprovedPlayButton: addImprovedPlayButton
}; 
