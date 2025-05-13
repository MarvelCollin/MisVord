/**
 * WebRTC Video Debug Module
 * Provides tools for debugging video playback issues
 */

// Debug mode flag
const debugMode = true;

// Show debug overlay on video element
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
    
    // Set color based on type
    let bgColor = 'bg-yellow-600';
    if (type === 'error') bgColor = 'bg-red-600';
    if (type === 'info') bgColor = 'bg-blue-600';
    if (type === 'success') bgColor = 'bg-green-600';
    
    // Create new message element
    const msgElement = document.createElement('div');
    msgElement.className = `${bgColor} bg-opacity-90 mb-1 p-1 rounded`;
    msgElement.textContent = message;
    
    // Add to overlay
    overlay.appendChild(msgElement);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (msgElement.parentNode) {
            msgElement.parentNode.removeChild(msgElement);
        }
    }, 10000);
    
    // Also log to console
    console.log(`[VIDEO DEBUG] ${userId}: ${message}`);
}

// Setup video analyzer to detect black screens
function setupVideoAnalyzer(videoElement, userId) {
    if (!videoElement || !debugMode) return;
    
    // Create canvas for analyzing video frames
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    
    // Add a small visual indicator showing frames are being analyzed
    const container = document.getElementById(`container-${userId}`);
    if (container) {
        const indicator = document.createElement('div');
        indicator.className = 'absolute bottom-4 right-2 w-2 h-2 bg-green-500 rounded-full z-20';
        indicator.id = `frame-indicator-${userId}`;
        container.appendChild(indicator);
    }
    
    const analyzeInterval = setInterval(() => {
        if (!document.contains(videoElement)) {
            clearInterval(analyzeInterval);
            return;
        }
        
        // Skip if video dimensions are zero
        if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
            return;
        }
        
        try {
            // Blink the indicator
            const indicator = document.getElementById(`frame-indicator-${userId}`);
            if (indicator) {
                indicator.style.opacity = indicator.style.opacity === '1' ? '0.3' : '1';
            }
            
            // Draw current frame to canvas
            ctx.drawImage(
                videoElement, 
                0, 0, videoElement.videoWidth, videoElement.videoHeight,
                0, 0, canvas.width, canvas.height
            );
            
            // Check if the frame is black or frozen
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // Sample pixels to detect black frames (check every 50th pixel)
            let blackCount = 0;
            let totalSampled = 0;
            
            for (let i = 0; i < data.length; i += 200) { // Skip to check every 50th pixel
                totalSampled++;
                // Check if pixel is very dark (nearly black)
                if (data[i] < 10 && data[i+1] < 10 && data[i+2] < 10) {
                    blackCount++;
                }
            }
            
            // If more than 95% of sampled pixels are black, we likely have a black frame
            if (totalSampled > 0 && (blackCount / totalSampled) > 0.95) {
                showVideoDebugOverlay(userId, `Black screen detected (${blackCount}/${totalSampled} dark pixels)`, "error");
                
                // Trigger frame reset
                triggerVideoRefresh(videoElement, userId);
            }
        } catch (e) {
            console.error(`Error analyzing video for ${userId}:`, e);
        }
    }, 2000);
}

// Refresh video stream to try to recover from black screen
function triggerVideoRefresh(videoElement, userId) {
    if (!videoElement) return;
    
    // Get current stream
    const currentStream = videoElement.srcObject;
    if (!currentStream) return;
    
    showVideoDebugOverlay(userId, "Attempting to refresh video stream...", "info");
    
    // Temporarily pause
    videoElement.pause();
    
    // Create a new MediaStream with the same tracks
    const newStream = new MediaStream();
    
    // Add all tracks from current stream
    currentStream.getTracks().forEach(track => {
        newStream.addTrack(track);
    });
    
    // Replace stream
    videoElement.srcObject = newStream;
    
    // Try to play again with the utility function from the player module
    if (window.WebRTCPlayer && typeof window.WebRTCPlayer.playWithUnmuteSequence === 'function') {
        window.WebRTCPlayer.playWithUnmuteSequence(videoElement, userId);
    } else {
        // Fallback if player module isn't available
        videoElement.play().catch(e => console.error(`Error playing video: ${e.message}`));
    }
}

// Export functions for use in other modules
window.WebRTCDebug = {
    showOverlay: showVideoDebugOverlay,
    setupAnalyzer: setupVideoAnalyzer,
    triggerRefresh: triggerVideoRefresh,
    isDebugMode: () => debugMode
}; 