/**
 * WebRTC Video Debug Module
 * 
 * Enhanced debugging, monitoring and recovery system for WebRTC video calls.
 * Features:
 * - On-screen debug overlay for video issues
 * - Frame freezing detection
 * - Black screen detection
 * - Video quality monitoring
 * - Automatic recovery attempts
 */

// Enable debug mode by default for troubleshooting
const debugMode = true;

// Debug levels and settings
const DEBUG_LEVELS = {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  SUCCESS: 'success'
};

// Keep track of recovery attempts to prevent infinite loops
const recoveryAttempts = {};
const MAX_RECOVERY_ATTEMPTS = 3;

// Display a debug overlay on video elements for the specified user
function showVideoDebugOverlay(userId, message, type = 'warning') {
    if (!debugMode) return;
    
    const container = document.getElementById(`container-${userId}`);
    if (!container) return;
    
    let overlay = document.getElementById(`video-debug-overlay-${userId}`);
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = `video-debug-overlay-${userId}`;
        overlay.className = 'absolute top-0 left-0 right-0 p-2 text-white text-xs z-20 text-center';
        container.appendChild(overlay);
    }
    
    // Choose appropriate style based on message type
    let bgColor = 'bg-yellow-600';
    if (type === 'error') bgColor = 'bg-red-600';
    if (type === 'info') bgColor = 'bg-blue-600';
    if (type === 'success') bgColor = 'bg-green-600';
    
    // Create the message element
    const msgElement = document.createElement('div');
    msgElement.className = `${bgColor} bg-opacity-90 mb-1 p-1 rounded`;
    msgElement.textContent = message;
    
    // Add to overlay
    overlay.appendChild(msgElement);
    
    // Auto-remove after some time to avoid cluttering the UI
    setTimeout(() => {
        if (msgElement.parentNode) {
            msgElement.parentNode.removeChild(msgElement);
        }
    }, 10000);
    
    // Also log to console for easier debugging
    console.log(`[VIDEO DEBUG] ${userId}: ${message}`);
}

// Advanced video analysis for quality and freezing detection
function setupVideoAnalyzer(videoElement, userId) {
    if (!videoElement || !debugMode) return;
    
    // Reset recovery attempts counter for this user
    recoveryAttempts[userId] = 0;
    
    // Create an offscreen canvas for video analysis
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    // Add a visual indicator to show the analyzer is working
    const container = document.getElementById(`container-${userId}`);
    if (container) {
        const indicator = document.createElement('div');
        indicator.className = 'absolute bottom-4 right-2 w-2 h-2 bg-green-500 rounded-full z-20';
        indicator.id = `frame-indicator-${userId}`;
        container.appendChild(indicator);
        
        // Add a stats overlay if in debug mode
        if (debugMode) {
            const statsOverlay = document.createElement('div');
            statsOverlay.className = 'absolute bottom-4 left-2 text-xs bg-black bg-opacity-70 p-1 rounded text-white z-20';
            statsOverlay.id = `stats-overlay-${userId}`;
            statsOverlay.textContent = 'Monitoring...';
            container.appendChild(statsOverlay);
        }
    }
    
    // Video quality metrics
    let lastFrameHash = null;
    let unchangedFrameCount = 0;
    let frameCount = 0;
    let blackFrameCount = 0;
    let lastAnalysisTime = performance.now();
    let fps = 0;
    
    // Set up the analyzer to run periodically
    const analyzeInterval = setInterval(() => {
        // Stop if video element is removed from the DOM
        if (!document.contains(videoElement)) {
            clearInterval(analyzeInterval);
            return;
        }
        
        // Skip analysis if video isn't ready or has no dimensions
        if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
            return;
        }
        
        try {
            // Update the visual indicator to show activity
            const indicator = document.getElementById(`frame-indicator-${userId}`);
            if (indicator) {
                indicator.style.opacity = indicator.style.opacity === '1' ? '0.3' : '1';
            }
            
            // Capture frame to the canvas for analysis
            ctx.drawImage(
                videoElement, 
                0, 0, videoElement.videoWidth, videoElement.videoHeight,
                0, 0, canvas.width, canvas.height
            );
            
            // Get image data for analysis
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // Calculate FPS
            const now = performance.now();
            const elapsed = now - lastAnalysisTime;
            lastAnalysisTime = now;
            
            if (elapsed > 0) {
                // Update running FPS calculation
                fps = 0.7 * fps + 0.3 * (1000 / elapsed);
                
                // Update stats display if available
                const statsOverlay = document.getElementById(`stats-overlay-${userId}`);
                if (statsOverlay && frameCount % 3 === 0) { // Update less frequently to avoid flicker
                    statsOverlay.textContent = `${Math.round(fps)} FPS`;
                }
            }
            
            // Analyze for black frames (low brightness)
            let blackCount = 0;
            let totalSampled = 0;
            
            for (let i = 0; i < data.length; i += 200) { // Sample 1/200 of pixels for performance
                totalSampled++;
                
                // Check if pixel is very dark
                if (data[i] < 15 && data[i+1] < 15 && data[i+2] < 15) {
                    blackCount++;
                }
            }
            
            // Calculate what percentage of the frame is black
            const blackPercentage = totalSampled > 0 ? (blackCount / totalSampled) : 0;
            
            // Handle black screen detection
            if (blackPercentage > 0.95) { // 95% of sampled pixels are black
                blackFrameCount++;
                
                if (blackFrameCount >= 3) { // Multiple consecutive black frames
                    showVideoDebugOverlay(userId, `Black screen detected (${Math.round(blackPercentage*100)}%)`, "error");
                    blackFrameCount = 0; // Reset counter
                    
                    // Try to refresh the video if we haven't attempted too many times
                    if (recoveryAttempts[userId] < MAX_RECOVERY_ATTEMPTS) {
                        triggerVideoRefresh(videoElement, userId);
                        recoveryAttempts[userId]++;
                    }
                }
            } else {
                // Not a black frame, reset counter
                blackFrameCount = Math.max(0, blackFrameCount - 1);
            }
            
            // Generate a simple hash of the frame to detect frozen video
            const frameHash = hashImageData(data);
            
            // Check if frame hasn't changed
            if (lastFrameHash === frameHash) {
                unchangedFrameCount++;
                
                // If several frames are identical, video might be frozen
                if (unchangedFrameCount >= 5) {
                    showVideoDebugOverlay(userId, `Possible frozen video detected (${unchangedFrameCount} identical frames)`, "error");
                    
                    // Try to refresh the video if we haven't attempted too many times
                    if (recoveryAttempts[userId] < MAX_RECOVERY_ATTEMPTS) {
                        triggerVideoRefresh(videoElement, userId);
                        recoveryAttempts[userId]++;
                    }
                    
                    unchangedFrameCount = 0; // Reset counter
                }
            } else {
                // Frame changed, reset counter
                unchangedFrameCount = 0;
                lastFrameHash = frameHash;
            }
            
            // Increment frame counter
            frameCount++;
            
        } catch (e) {
            console.error(`Error analyzing video for ${userId}:`, e);
        }
    }, 2000); // Check every 2 seconds
    
    // Helper function to generate a simple hash of frame data
    function hashImageData(data) {
        let hash = 0;
        // Sample a subset of pixels for efficiency
        for (let i = 0; i < data.length; i += 500) {
            hash = ((hash << 5) - hash) + data[i];
        }
        return hash;
    }
}

// Attempts to refresh a video stream that appears frozen or black
function triggerVideoRefresh(videoElement, userId) {
    if (!videoElement) return;
    
    // Get the current stream
    const currentStream = videoElement.srcObject;
    if (!currentStream) return;
    
    showVideoDebugOverlay(userId, "Attempting to refresh video stream...", "info");
    
    try {
        // Try first approach: Pause and resume playback
        videoElement.pause();
        setTimeout(() => {
            videoElement.play().catch(err => {
                showVideoDebugOverlay(userId, `Failed to resume playback: ${err.message}`, "error");
            });
        }, 300);
        
        // Try second approach: Create a new MediaStream from the existing tracks
        setTimeout(() => {
            if (!videoElement.srcObject) return;
            
            const newStream = new MediaStream();
            const tracks = currentStream.getTracks();
            
            // Check if we have any tracks before proceeding
            if (tracks.length === 0) {
                showVideoDebugOverlay(userId, "Stream has no tracks to refresh", "error");
                return;
            }
            
            // Add all tracks to the new stream
            tracks.forEach(track => {
                if (track.readyState === 'live') {
                    newStream.addTrack(track);
                } else {
                    showVideoDebugOverlay(userId, `Track is in ${track.readyState} state, can't use`, "warn");
                }
            });
            
            // Only replace if we have tracks in the new stream
            if (newStream.getTracks().length > 0) {
                videoElement.srcObject = newStream;
                
                videoElement.play()
                    .then(() => showVideoDebugOverlay(userId, "Stream refreshed successfully", "success"))
                    .catch(e => showVideoDebugOverlay(userId, `Error playing refreshed stream: ${e.message}`, "error"));
            }
        }, 1000);
        
        // Try third approach: Request the stream be restarted from source
        // (requires implementation in the WebRTC connection code)
        const refreshEvent = new CustomEvent('stream-refresh-request', {
            detail: { userId: userId }
        });
        document.dispatchEvent(refreshEvent);
        
    } catch (e) {
        showVideoDebugOverlay(userId, `Error refreshing video: ${e.message}`, "error");
    }
}

// Collects and provides WebRTC diagnostics
function collectRTCDiagnostics(userId) {
    const container = document.getElementById(`container-${userId}`);
    const videoElement = container ? container.querySelector('video') : null;
    
    if (!videoElement) return { error: 'No video element found' };
    
    const stream = videoElement.srcObject;
    const diagnostics = {
        userId: userId,
        timestamp: new Date().toISOString(),
        videoElementState: {
            paused: videoElement.paused,
            currentTime: videoElement.currentTime,
            videoWidth: videoElement.videoWidth,
            videoHeight: videoElement.videoHeight,
            muted: videoElement.muted,
            volume: videoElement.volume,
            playbackRate: videoElement.playbackRate
        },
        stream: stream ? {
            active: stream.active,
            id: stream.id,
            tracks: stream.getTracks().map(track => ({
                kind: track.kind,
                id: track.id,
                enabled: track.enabled,
                muted: track.muted,
                readyState: track.readyState
            }))
        } : null
    };
    
    return diagnostics;
}

// Export functions to the global WebRTCDebug object
window.WebRTCDebug = {
    showOverlay: showVideoDebugOverlay,
    setupAnalyzer: setupVideoAnalyzer,
    triggerRefresh: triggerVideoRefresh,
    collectDiagnostics: collectRTCDiagnostics,
    isDebugMode: () => debugMode
}; 
