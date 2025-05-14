


function playWithUnmuteSequence(videoElement, userId) {
    
    if (!videoElement) return;
    
    console.log(`Starting play with unmute sequence for ${userId}`);
    
    
    if (window.WebRTCDebug && typeof window.WebRTCDebug.showOverlay === 'function') {
        window.WebRTCDebug.showOverlay(userId, "Attempting to play video...", "info");
    }
    
    
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
    
    
    videoTracks.forEach(track => {
        if (window.WebRTCDebug) {
            window.WebRTCDebug.showOverlay(userId, `Track: ${track.enabled ? "enabled" : "disabled"}, ${track.muted ? "muted" : "unmuted"}, state: ${track.readyState}`, "info");
        }
    });
    
    
    const wasMuted = videoElement.muted;
    const wasControls = videoElement.controls;
    
    
    videoElement.muted = true;
    videoElement.controls = true; 
    
    
    videoElement.setAttribute('playsinline', '');
    videoElement.setAttribute('webkit-playsinline', '');
    
    
    videoElement.play().then(() => {
        if (window.WebRTCDebug) {
            window.WebRTCDebug.showOverlay(userId, "Initial muted play succeeded", "success");
        }
        handleSuccessfulPlay();
    }).catch(err => {
        if (window.WebRTCDebug) {
            window.WebRTCDebug.showOverlay(userId, `Play attempt failed: ${err.message}`, "error");
        }
        
        videoElement.muted = true; 
        addImprovedPlayButton(videoElement, userId);
    });
    
    
    function handleSuccessfulPlay() {
        
        setTimeout(() => {
            
            if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
                if (window.WebRTCDebug) {
                    window.WebRTCDebug.showOverlay(userId, "Video playing but no frames received (0x0)", "error");
                }
                
                return;
            }
            
            
            videoElement.muted = wasMuted;
            videoElement.controls = wasControls;
            
            if (window.WebRTCDebug) {
                window.WebRTCDebug.showOverlay(userId, `Video unmuted, dimensions: ${videoElement.videoWidth}x${videoElement.videoHeight}`, "success");
            }
            
            
            monitorVideoPlayback(videoElement, userId);
        }, 2000);
    }
}


function simulateUserGesture(callback) {
    
    const tempButton = document.createElement('button');
    tempButton.style.display = 'none';
    tempButton.addEventListener('click', () => {
        callback();
        
        if (tempButton.parentNode) {
            tempButton.parentNode.removeChild(tempButton);
        }
    });
    
    document.body.appendChild(tempButton);
    tempButton.click();
}


function monitorVideoPlayback(videoElement, userId) {
    if (!videoElement) return;
    
    let blackFrameCount = 0;
    let lastWidth = videoElement.videoWidth;
    let lastHeight = videoElement.videoHeight;
    
    const monitor = setInterval(() => {
        
        if (!document.contains(videoElement)) {
            clearInterval(monitor);
            return;
        }
        
        
        if (videoElement.paused) {
            if (window.WebRTCDebug) {
                window.WebRTCDebug.showOverlay(userId, "Video playback paused unexpectedly", "error");
            }
            
            
            videoElement.play().catch(e => {
                if (window.WebRTCDebug) {
                    window.WebRTCDebug.showOverlay(userId, `Cannot resume: ${e.message}`, "error");
                }
            });
        }
        
        
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
        
        
        const stream = videoElement.srcObject;
        if (stream) {
            const videoTracks = stream.getVideoTracks();
            if (videoTracks.length === 0) {
                if (window.WebRTCDebug) {
                    window.WebRTCDebug.showOverlay(userId, "Video tracks have been removed", "error");
                }
            } else {
                
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
        
        
        if (++blackFrameCount > 10) {
            clearInterval(monitor);
        }
    }, 3000);
}


function addImprovedPlayButton(videoElement, userId) {
    
    const container = document.getElementById(`container-${userId}`);
    if (!container) return;
    
    
    const existingButton = container.querySelector('.remote-play-button');
    if (existingButton) {
        existingButton.remove();
    }
    
    
    const playButton = document.createElement('div');
    playButton.className = 'remote-play-button absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center text-white z-30';
    
    
    const iconContainer = document.createElement('div');
    iconContainer.innerHTML = `
        <svg xmlns="http:
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    `;
    
    
    const text = document.createElement('div');
    text.className = 'mt-4 text-center px-4';
    text.innerHTML = `
        <div class="text-lg font-bold mb-2">Click to Play Video</div>
        <div class="text-sm opacity-80">Autoplay was blocked by your browser</div>
    `;
    
    
    const diagInfo = document.createElement('div');
    diagInfo.className = 'mt-4 text-xs text-gray-400 max-w-xs text-center';
    
    
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
    
    
    playButton.appendChild(iconContainer);
    playButton.appendChild(text);
    playButton.appendChild(diagInfo);
    
    
    container.appendChild(playButton);
    
    
    playButton.addEventListener('click', () => {
        playButton.innerHTML = '<div class="text-lg">Starting video...</div>';
        
        
        playWithUnmuteSequence(videoElement, userId);
        
        
        setTimeout(() => {
            if (playButton.parentNode) {
                playButton.parentNode.removeChild(playButton);
            }
        }, 1000);
    });
}


window.WebRTCPlayer = {
    playWithUnmuteSequence,
    simulateUserGesture,
    monitorVideoPlayback,
    addImprovedPlayButton
}; 
