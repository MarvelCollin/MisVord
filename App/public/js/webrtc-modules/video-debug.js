/**
 * WebRTC Video Debug Module
 * Provides tools for debugging video playback issues
 */


const debugMode = true;


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
    
    
    let bgColor = 'bg-yellow-600';
    if (type === 'error') bgColor = 'bg-red-600';
    if (type === 'info') bgColor = 'bg-blue-600';
    if (type === 'success') bgColor = 'bg-green-600';
    
    
    const msgElement = document.createElement('div');
    msgElement.className = `${bgColor} bg-opacity-90 mb-1 p-1 rounded`;
    msgElement.textContent = message;
    
    
    overlay.appendChild(msgElement);
    
    
    setTimeout(() => {
        if (msgElement.parentNode) {
            msgElement.parentNode.removeChild(msgElement);
        }
    }, 10000);
    
    
    console.log(`[VIDEO DEBUG] ${userId}: ${message}`);
}


function setupVideoAnalyzer(videoElement, userId) {
    if (!videoElement || !debugMode) return;
    
    
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    
    
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
        
        
        if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
            return;
        }
        
        try {
            
            const indicator = document.getElementById(`frame-indicator-${userId}`);
            if (indicator) {
                indicator.style.opacity = indicator.style.opacity === '1' ? '0.3' : '1';
            }
            
            
            ctx.drawImage(
                videoElement, 
                0, 0, videoElement.videoWidth, videoElement.videoHeight,
                0, 0, canvas.width, canvas.height
            );
            
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            
            let blackCount = 0;
            let totalSampled = 0;
            
            for (let i = 0; i < data.length; i += 200) { 
                totalSampled++;
                
                if (data[i] < 10 && data[i+1] < 10 && data[i+2] < 10) {
                    blackCount++;
                }
            }
            
            
            if (totalSampled > 0 && (blackCount / totalSampled) > 0.95) {
                showVideoDebugOverlay(userId, `Black screen detected (${blackCount}/${totalSampled} dark pixels)`, "error");
                
                
                triggerVideoRefresh(videoElement, userId);
            }
        } catch (e) {
            console.error(`Error analyzing video for ${userId}:`, e);
        }
    }, 2000);
}


function triggerVideoRefresh(videoElement, userId) {
    if (!videoElement) return;
    
    
    const currentStream = videoElement.srcObject;
    if (!currentStream) return;
    
    showVideoDebugOverlay(userId, "Attempting to refresh video stream...", "info");
    
    
    videoElement.pause();
    
    
    const newStream = new MediaStream();
    
    
    currentStream.getTracks().forEach(track => {
        newStream.addTrack(track);
    });
    
    
    videoElement.srcObject = newStream;
    
    
    if (window.WebRTCPlayer && typeof window.WebRTCPlayer.playWithUnmuteSequence === 'function') {
        window.WebRTCPlayer.playWithUnmuteSequence(videoElement, userId);
    } else {
        
        videoElement.play().catch(e => console.error(`Error playing video: ${e.message}`));
    }
}


window.WebRTCDebug = {
    showOverlay: showVideoDebugOverlay,
    setupAnalyzer: setupVideoAnalyzer,
    triggerRefresh: triggerVideoRefresh,
    isDebugMode: () => debugMode
}; 