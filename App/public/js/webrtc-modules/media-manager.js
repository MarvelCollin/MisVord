/**
 * WebRTC Media Manager Module
 * Handles media streams for WebRTC connections
 */

// Create namespace for media management
window.WebRTCMediaManager = window.WebRTCMediaManager || {};

// Track active streams to ensure proper cleanup
const activeStreams = new Map();
const activeVideoTracks = new Map();
const activeAudioTracks = new Map();

/**
 * Initialize media manager
 */
window.WebRTCMediaManager.initialize = function() {
    console.log('[WebRTC MediaManager] Initializing...');
    
    // Set up cleanup on page unload/navigation
    window.addEventListener('beforeunload', function() {
        window.WebRTCMediaManager.stopAllStreams();
    });
    
    return window.WebRTCMediaManager;
};

/**
 * Get user media with error handling and browser compatibility
 * @param {Object} constraints - Media constraints
 * @param {Function} onSuccess - Success callback
 * @param {Function} onError - Error callback
 */
window.WebRTCMediaManager.getUserMedia = function(constraints, onSuccess, onError) {
    // Use browser compatibility module for constraints if available
    if (window.WebRTCCompatibility && typeof window.WebRTCCompatibility.getConstraints === 'function') {
        constraints = window.WebRTCCompatibility.getConstraints(constraints);
    }
    
    console.log('[WebRTC MediaManager] Getting user media with constraints:', constraints);
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const error = new Error('getUserMedia not supported in this browser');
        console.error('[WebRTC MediaManager]', error);
        if (onError) onError(error);
        return;
    }
    
    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            // Track the stream for cleanup
            const streamId = stream.id;
            activeStreams.set(streamId, stream);
            
            // Track individual tracks
            stream.getTracks().forEach(track => {
                if (track.kind === 'video') {
                    activeVideoTracks.set(track.id, track);
                } else if (track.kind === 'audio') {
                    activeAudioTracks.set(track.id, track);
                }
                
                // Set up automatic cleanup when track ends
                track.onended = function() {
                    console.log(`[WebRTC MediaManager] Track ended: ${track.kind}/${track.id}`);
                    if (track.kind === 'video') {
                        activeVideoTracks.delete(track.id);
                    } else if (track.kind === 'audio') {
                        activeAudioTracks.delete(track.id);
                    }
                };
            });
            
            console.log(`[WebRTC MediaManager] Got media stream: ${streamId} with ${stream.getVideoTracks().length} video and ${stream.getAudioTracks().length} audio tracks`);
            if (onSuccess) onSuccess(stream);
        })
        .catch(error => {
            console.error('[WebRTC MediaManager] Error getting user media:', error);
            if (onError) onError(error);
        });
};

/**
 * Stop a specific media stream
 * @param {MediaStream} stream - The stream to stop
 */
window.WebRTCMediaManager.stopStream = function(stream) {
    if (!stream) return false;
    
    try {
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => {
            track.stop();
            if (track.kind === 'video') {
                activeVideoTracks.delete(track.id);
            } else if (track.kind === 'audio') {
                activeAudioTracks.delete(track.id);
            }
        });
        
        // Remove from active streams
        activeStreams.delete(stream.id);
        console.log(`[WebRTC MediaManager] Stopped stream: ${stream.id}`);
        return true;
    } catch (e) {
        console.error('[WebRTC MediaManager] Error stopping stream:', e);
        return false;
    }
};

/**
 * Stop all active media streams
 */
window.WebRTCMediaManager.stopAllStreams = function() {
    console.log(`[WebRTC MediaManager] Stopping all streams: ${activeStreams.size} streams, ${activeVideoTracks.size} video tracks, ${activeAudioTracks.size} audio tracks`);
    
    // Stop each stream
    activeStreams.forEach((stream, id) => {
        try {
            stream.getTracks().forEach(track => track.stop());
        } catch (e) {
            console.warn(`[WebRTC MediaManager] Error stopping stream ${id}:`, e);
        }
    });
    
    // Clear tracking maps
    activeStreams.clear();
    activeVideoTracks.clear();
    activeAudioTracks.clear();
    
    console.log('[WebRTC MediaManager] All streams stopped');
};

/**
 * Get display media for screen sharing
 * @param {Object} constraints - Media constraints
 * @param {Function} onSuccess - Success callback
 * @param {Function} onError - Error callback
 */
window.WebRTCMediaManager.getDisplayMedia = function(constraints, onSuccess, onError) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        const error = new Error('Screen sharing not supported in this browser');
        console.error('[WebRTC MediaManager]', error);
        if (onError) onError(error);
        return;
    }
    
    console.log('[WebRTC MediaManager] Starting screen sharing with constraints:', constraints);
    
    navigator.mediaDevices.getDisplayMedia(constraints)
        .then(stream => {
            // Track the stream for cleanup
            const streamId = stream.id;
            activeStreams.set(streamId, stream);
            
            // Set up automatic cleanup when user stops sharing
            stream.getVideoTracks().forEach(track => {
                activeVideoTracks.set(track.id, track);
                
                track.onended = function() {
                    console.log('[WebRTC MediaManager] Screen sharing stopped by user');
                    activeVideoTracks.delete(track.id);
                    activeStreams.delete(streamId);
                };
            });
            
            console.log(`[WebRTC MediaManager] Screen sharing started: ${streamId}`);
            if (onSuccess) onSuccess(stream);
        })
        .catch(error => {
            console.error('[WebRTC MediaManager] Error starting screen sharing:', error);
            if (onError) onError(error);
        });
};

/**
 * Replace a track in an RTCPeerConnection
 * @param {RTCPeerConnection} peerConnection - The peer connection
 * @param {MediaStreamTrack} newTrack - The new track to use
 * @param {string} kind - The kind of track ('audio' or 'video')
 */
window.WebRTCMediaManager.replaceTrack = function(peerConnection, newTrack, kind) {
    if (!peerConnection || !peerConnection.getSenders) {
        console.error('[WebRTC MediaManager] Invalid peer connection for track replacement');
        return Promise.reject(new Error('Invalid peer connection'));
    }
    
    console.log(`[WebRTC MediaManager] Replacing ${kind} track`);
    
    const sender = peerConnection.getSenders().find(s => s.track && s.track.kind === kind);
    
    if (!sender) {
        console.error(`[WebRTC MediaManager] No ${kind} sender found in peer connection`);
        return Promise.reject(new Error(`No ${kind} sender found`));
    }
    
    return sender.replaceTrack(newTrack)
        .then(() => {
            console.log(`[WebRTC MediaManager] ${kind} track replaced successfully`);
            // Track the new track
            if (kind === 'video') {
                activeVideoTracks.set(newTrack.id, newTrack);
            } else if (kind === 'audio') {
                activeAudioTracks.set(newTrack.id, newTrack);
            }
            return newTrack;
        });
};

/**
 * Check if a device has specific media capabilities
 * @param {string} kind - The kind of device ('videoinput', 'audioinput', 'audiooutput')
 * @returns {Promise<boolean>} - Promise resolving to true if device type is available
 */
window.WebRTCMediaManager.hasMediaDevices = function(kind) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return Promise.resolve(false);
    }
    
    return navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            return devices.some(device => device.kind === kind);
        })
        .catch(err => {
            console.error('[WebRTC MediaManager] Error checking media devices:', err);
            return false;
        });
};

/**
 * Get statistics about active media
 * @returns {Object} - Statistics about active media
 */
window.WebRTCMediaManager.getMediaStats = function() {
    return {
        activeStreams: activeStreams.size,
        activeVideoTracks: activeVideoTracks.size,
        activeAudioTracks: activeAudioTracks.size
    };
};

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    window.WebRTCMediaManager.initialize();
}); 