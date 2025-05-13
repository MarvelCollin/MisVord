/**
 * WebRTC Video Player Module
 * Handles video playback and autoplay issues
 */

// Check if autoplay is supported/enabled
async function checkAutoplaySupport() {
    try {
        // Create a test video element
        const video = document.createElement('video');
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        video.muted = true;
        video.src = 'data:video/mp4;base64,AAAAIGZ0eXBtcDQyAAAAAG1wNDJtcDQxaXNvbWF2YzEAAATKbW9vdgAAAGxtdmhkAAAAANLEP5XSxD+VAAB+AAAAKgABAAAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAACFpb2RzAAAAABCAgIAQAE////8/AABwZHJhawAAAFx0a2hkAAAAAdLEP5XSxD+VAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAbAAAAGUAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAADEAAAAAAABAAAAAAKobWRpYQAAACBtZGhkAAAAANLEP5XSxD+VAAB+AAAAKgAAAAAAAQAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAABAAAAAAbAAAAGUAAAAAAAkZXNkcwAAAAAOdXVpZAAAAAVYrVBKJ44XeHPtFG+grE050EoqbaTkZdwXX2J+15zxJNe1AAAAGnN0dHMAAAAAAAAAAwAAAQwAAAQAAAAAAQAAA9wAAAOQAAAAKHN0c2MAAAAAAAAAAQAAAAEAAAARAAAAAAAAc3RzegAAAAAAAAAAAAAAdC/i9/IAAAAud2NndAAAAAAAAAABAAAADQAAA+wAAAAsc3RjbwAAAAAAAAACAAANvgAABRAAAAAUc3RzcwAAAAAAAAACAAAAAQAABAAAAAABAAAgAAAAACC4ASNJAAEAAABQAAAAP8ixgewaRzdNQu5zTHRk1mHmY3NkQWFkaDRyNjZ1cmxTQXRGUTlndW5MRXVDUmVwUU40RVF6ODRnQnVBQW5nd0hWS3pSZ1FZRENoQkV5L1pBZitkM0JRU1FJNXl2c1hFUGMrZlNpdEJRMzA5V0JvRXU1bjdUSFJoNHJQc2NPYmJrVW4za1FUZWVMQjd1S3ZRZ1B4dXF1Q0ZBPT0AZG1kYXRhAAAAGbWV0YQAAAAAAAAAImhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALWlsc3QAAAAlqXRvbwAAAB1kYXRhAAAAAQAAAABMYXZmNTcuODMuMTAw';
        video.load();
        
        // Try to play - this will fail in browsers that block autoplay
        await video.play();
        return true;
    } catch (error) {
        console.log("Autoplay not supported without user interaction:", error);
        return false;
    }
}

// Request user permission for autoplay
function requestAutoplayPermission() {
    return new Promise((resolve) => {
        // Create a modal dialog
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md text-white">
                <h2 class="text-xl font-bold mb-4">Enable Video Autoplay</h2>
                <p class="mb-4">Your browser is blocking video autoplay. To enjoy video calls without interruptions, please allow autoplay by clicking the button below.</p>
                <p class="mb-4 text-sm text-gray-300">This will allow videos to play automatically when you join a call.</p>
                <div class="flex justify-center">
                    <button id="enable-autoplay-btn" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium">Enable Autoplay</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add click event to the button
        const enableBtn = document.getElementById('enable-autoplay-btn');
        enableBtn.addEventListener('click', () => {
            // Create and play a silent video to satisfy browser's autoplay policy
            const video = document.createElement('video');
            video.muted = true;
            video.playsInline = true;
            video.src = 'data:video/mp4;base64,AAAAIGZ0eXBtcDQyAAAAAG1wNDJtcDQxaXNvbWF2YzEAAATKbW9vdgAAAGxtdmhkAAAAANLEP5XSxD+VAAB+AAAAKgABAAAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAACFpb2RzAAAAABCAgIAQAE////8/AABwZHJhawAAAFx0a2hkAAAAAdLEP5XSxD+VAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAbAAAAGUAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAADEAAAAAAABAAAAAAKobWRpYQAAACBtZGhkAAAAANLEP5XSxD+VAAB+AAAAKgAAAAAAAQAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAABAAAAAAbAAAAGUAAAAAAAkZXNkcwAAAAAOdXVpZAAAAAVYrVBKJ44XeHPtFG+grE050EoqbaTkZdwXX2J+15zxJNe1AAAAGnN0dHMAAAAAAAAAAwAAAQwAAAQAAAAAAQAAA9wAAAOQAAAAKHN0c2MAAAAAAAAAAQAAAAEAAAARAAAAAAAAc3RzegAAAAAAAAAAAAAAdC/i9/IAAAAud2NndAAAAAAAAAABAAAADQAAA+wAAAAsc3RjbwAAAAAAAAACAAANvgAABRAAAAAUc3RzcwAAAAAAAAACAAAAAQAABAAAAAABAAAgAAAAACC4ASNJAAEAAABQAAAAP8ixgewaRzdNQu5zTHRk1mHmY3NkQWFkaDRyNjZ1cmxTQXRGUTlndW5MRXVDUmVwUU40RVF6ODRnQnVBQW5nd0hWS3pSZ1FZRENoQkV5L1pBZitkM0JRU1FJNXl2c1hFUGMrZlNpdEJRMzA5V0JvRXU1bjdUSFJoNHJQc2NPYmJrVW4za1FUZWVMQjd1S3ZRZ1B4dXF1Q0ZBPT0AZG1kYXRhAAAAGbWV0YQAAAAAAAAAImhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALWlsc3QAAAAlqXRvbwAAAB1kYXRhAAAAAQAAAABMYXZmNTcuODMuMTAw';
            video.load();
            
            // Play the video to enable autoplay
            video.play().then(() => {
                // Remove the modal
                document.body.removeChild(modal);
                resolve(true);
            }).catch(error => {
                console.error("Failed to enable autoplay:", error);
                // Show a message that user needs to enable autoplay in browser settings
                const errorMsg = document.createElement('p');
                errorMsg.className = 'text-red-500 mt-2';
                errorMsg.textContent = 'Could not enable autoplay. You may need to change your browser settings.';
                enableBtn.parentNode.appendChild(errorMsg);
                
                // Add a link to browser-specific instructions
                const browserInfo = getBrowserInfo();
                const helpLink = document.createElement('a');
                helpLink.href = getAutoplayHelpLink(browserInfo.name);
                helpLink.target = '_blank';
                helpLink.className = 'block mt-2 text-blue-400 underline';
                helpLink.textContent = `How to enable autoplay in ${browserInfo.name}`;
                enableBtn.parentNode.appendChild(helpLink);
                
                // Allow closing the modal anyway
                const closeBtn = document.createElement('button');
                closeBtn.className = 'mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white';
                closeBtn.textContent = 'Continue anyway';
                closeBtn.onclick = () => {
                    document.body.removeChild(modal);
                    resolve(false);
                };
                enableBtn.parentNode.appendChild(closeBtn);
            });
        });
    });
}

// Get browser information
function getBrowserInfo() {
    const userAgent = navigator.userAgent;
    let browserName = "Unknown";
    
    if (userAgent.match(/chrome|chromium|crios/i)) {
        browserName = "Chrome";
    } else if (userAgent.match(/firefox|fxios/i)) {
        browserName = "Firefox";
    } else if (userAgent.match(/safari/i)) {
        browserName = "Safari";
    } else if (userAgent.match(/opr\//i)) {
        browserName = "Opera";
    } else if (userAgent.match(/edg/i)) {
        browserName = "Edge";
    }
    
    return { name: browserName };
}

// Get help link for browser-specific autoplay instructions
function getAutoplayHelpLink(browserName) {
    switch(browserName) {
        case 'Chrome':
            return 'https://support.google.com/chrome/answer/114662';
        case 'Firefox':
            return 'https://support.mozilla.org/kb/block-autoplay';
        case 'Safari':
            return 'https://support.apple.com/guide/safari/websites-preferences-ibrwe2159f50/mac';
        case 'Edge':
            return 'https://support.microsoft.com/microsoft-edge/block-pop-ups-in-microsoft-edge-1d8ba4f8-f385-9a0b-e944-aa47339b6bb5';
        default:
            return 'https://www.google.com/search?q=how+to+enable+autoplay+in+browser';
    }
}

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
            window.WebRTCDebug.showOverlay(userId, `First play attempt failed: ${err.message}`, "error");
        }
        
        // Check autoplay support and request permission if needed
        checkAutoplaySupport().then(isSupported => {
            if (!isSupported) {
                requestAutoplayPermission().then(permissionGranted => {
                    // Try playing again after permission request
                    videoElement.play().then(() => {
                        if (window.WebRTCDebug) {
                            window.WebRTCDebug.showOverlay(userId, "Play succeeded after permission", "success");
                        }
                        handleSuccessfulPlay();
                    }).catch(err => {
                        // Final fallback: Keep muted but add manual play button
                        if (window.WebRTCDebug) {
                            window.WebRTCDebug.showOverlay(userId, `All play attempts failed: ${err.message}`, "error");
                        }
                        videoElement.muted = true; // Keep muted so at least it can play
                        addImprovedPlayButton(videoElement, userId);
                    });
                });
            } else {
                // Second try: with user gesture simulation
                simulateUserGesture(() => {
                    videoElement.play().then(() => {
                        if (window.WebRTCDebug) {
                            window.WebRTCDebug.showOverlay(userId, "Play with user gesture succeeded", "success");
                        }
                        handleSuccessfulPlay();
                    }).catch(err => {
                        // Final fallback: Keep muted but add manual play button
                        if (window.WebRTCDebug) {
                            window.WebRTCDebug.showOverlay(userId, `All play attempts failed: ${err.message}`, "error");
                        }
                        videoElement.muted = true; // Keep muted so at least it can play
                        addImprovedPlayButton(videoElement, userId);
                    });
                });
            }
        });
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
    addImprovedPlayButton,
    checkAutoplaySupport,
    requestAutoplayPermission
}; 