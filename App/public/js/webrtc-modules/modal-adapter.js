/**
 * WebRTC Modal Adapter
 * Bridges the gap between the old WebRTC modal system and the new simplified modal
 */

(function() {
    console.log('[ModalAdapter] Initializing WebRTC modal adapter');
    
    // Create a safe timer for waiting for elements
    function waitForElement(selector, maxAttempts = 20, interval = 200) {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            
            const checkElement = () => {
                const element = document.querySelector(selector);
                if (element) {
                    resolve(element);
                    return;
                }
                
                attempts++;
                if (attempts >= maxAttempts) {
                    reject(new Error(`Element ${selector} not found after ${maxAttempts} attempts`));
                    return;
                }
                
                setTimeout(checkElement, interval);
            };
            
            checkElement();
        });
    }
    
    // Wait for document to be ready
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[ModalAdapter] Document ready, initializing');
        
        // Give the DOM a moment to fully initialize
        setTimeout(async function() {
            try {
                // Check for the new simplified modal
                const simpleCameraModal = await waitForElement('#simpleCameraModal');
                console.log('[ModalAdapter] Found simpleCameraModal');
                
                // Set up the adapter
                setupAdapter(simpleCameraModal);
            } catch (error) {
                console.error('[ModalAdapter] Error initializing adapter:', error);
            }
        }, 500);
    });
    
    // Setup the adapter with the modal element
    function setupAdapter(simpleCameraModal) {
        console.log('[ModalAdapter] Setting up adapter');
        
        // Intercept all references to the old permission modal
        const originalGetElementById = document.getElementById;
        document.getElementById = function(id) {
            // Remap old element IDs to new ones
            const idMapping = {
                'permissionRequest': 'simpleCameraModal',
                'permissionStatus': 'cameraStatus',
                'retryPermissionBtn': 'startCameraBtn',
                'audioOnlyBtn': 'startAudioBtn'
            };
            
            if (idMapping[id]) {
                const newId = idMapping[id];
                const element = originalGetElementById.call(document, newId);
                
                if (element) {
                    console.log(`[ModalAdapter] Remapped '${id}' to '${newId}'`);
                    return element;
                }
                console.warn(`[ModalAdapter] Failed to remap '${id}' to '${newId}' - element not found`);
            }
            
            // Default behavior for other IDs
            return originalGetElementById.call(document, id);
        };
        
        // Patch WebRTCMedia (now or wait for it)
        patchWebRTCMedia();
        
        // Set up global helper for stream sharing
        window.ModalAdapter = {
            getLocalStream: function() {
                return window.localStream;
            },
            setLocalStream: function(stream) {
                window.localStream = stream;
                
                // Also update WebRTCMedia if available
                if (window.WebRTCMedia) {
                    // Create a method to update all internal references
                    window.WebRTCMedia.setLocalStreamFromAdapter = function(stream) {
                        if (!stream) return;
                        console.log('[ModalAdapter] Setting stream in WebRTCMedia');
                        
                        // Ensure all tracks are enabled according to current state
                        const videoTracks = stream.getVideoTracks();
                        const audioTracks = stream.getAudioTracks();
                        
                        // Enable/disable based on current UI state
                        if (videoTracks.length > 0) {
                            const videoEnabled = window.WebRTCMedia.isVideoActive !== undefined ? 
                                window.WebRTCMedia.isVideoActive() : true;
                            videoTracks[0].enabled = videoEnabled;
                        }
                        
                        if (audioTracks.length > 0) {
                            const audioEnabled = window.WebRTCMedia.isAudioActive !== undefined ?
                                window.WebRTCMedia.isAudioActive() : true;
                            audioTracks[0].enabled = audioEnabled;
                        }
                        
                        // Update reference
                        window.WebRTCMedia.localStream = stream;
                    };
                    
                    // Call the method
                    window.WebRTCMedia.setLocalStreamFromAdapter(stream);
                }
            }
        };
    }
    
    // Patch WebRTCMedia if it exists or wait for it
    function patchWebRTCMedia() {
        if (window.WebRTCMedia) {
            console.log('[ModalAdapter] Patching WebRTCMedia functions');
            
            // Store original functions for fallback
            const originalUpdatePermissionUI = window.WebRTCMedia.updatePermissionUI;
            const originalRetryMediaAccess = window.WebRTCMedia.retryMediaAccess;
            const originalGetLocalStream = window.WebRTCMedia.getLocalStream;
            
            // Override updatePermissionUI
            window.WebRTCMedia.updatePermissionUI = function(status, message) {
                console.log('[ModalAdapter] updatePermissionUI called:', status);
                
                const statusEl = document.querySelector('#cameraStatus');
                const modal = document.querySelector('#simpleCameraModal');
                
                if (!statusEl || !modal) {
                    console.warn('[ModalAdapter] Elements not found, falling back to original');
                    return originalUpdatePermissionUI(status, message);
                }
                
                // Handle different status types
                switch (status) {
                    case 'requesting':
                        statusEl.textContent = 'Requesting camera & microphone access...';
                        statusEl.style.color = '#ffc107';
                        statusEl.style.background = '#374151';
                        modal.style.display = 'flex';
                        break;
                        
                    case 'granted':
                        statusEl.textContent = 'Permission granted! Starting video chat...';
                        statusEl.style.color = '#10b981';
                        statusEl.style.background = '#064e3b';
                        
                        // Make sure stream is shared between systems
                        if (window.localStream) {
                            window.WebRTCMedia.localStream = window.localStream;
                        }
                        
                        setTimeout(() => { modal.style.display = 'none'; }, 1500);
                        break;
                        
                    case 'hiding':
                    case 'hidden':
                        modal.style.display = 'none';
                        break;
                        
                    case 'denied':
                    case 'error':
                    case 'notfound':
                    case 'inuse':
                        // Format error message
                        statusEl.textContent = message || 'Error accessing camera/microphone';
                        statusEl.style.color = '#ef4444';
                        statusEl.style.background = '#7f1d1d';
                        
                        // Make sure buttons are visible
                        const startCameraBtn = document.querySelector('#startCameraBtn');
                        const startAudioBtn = document.querySelector('#startAudioBtn');
                        
                        if (startCameraBtn) startCameraBtn.style.display = 'block';
                        if (startAudioBtn) startAudioBtn.style.display = 'block';
                        break;
                        
                    default:
                        console.warn('[ModalAdapter] Unhandled status:', status);
                        if (message) {
                            statusEl.textContent = message;
                        }
                }
            };
            
            // Override retryMediaAccess
            window.WebRTCMedia.retryMediaAccess = function(videoEnabled) {
                console.log('[ModalAdapter] retryMediaAccess called, videoEnabled:', videoEnabled);
                
                const startCameraBtn = document.querySelector('#startCameraBtn');
                const startAudioBtn = document.querySelector('#startAudioBtn');
                
                try {
                    if (videoEnabled && startCameraBtn) {
                        console.log('[ModalAdapter] Triggering startCameraBtn');
                        startCameraBtn.click();
                        return true;
                    } else if (!videoEnabled && startAudioBtn) {
                        console.log('[ModalAdapter] Triggering startAudioBtn');
                        startAudioBtn.click();
                        return true;
                    }
                } catch (e) {
                    console.error('[ModalAdapter] Error triggering button click:', e);
                }
                
                console.warn('[ModalAdapter] Fallback to original retryMediaAccess');
                return originalRetryMediaAccess(videoEnabled);
            };
            
            // Override getLocalStream to ensure it always returns the latest stream
            window.WebRTCMedia.getLocalStream = function() {
                // Prioritize the simple camera's stream if available
                if (window.localStream) {
                    return window.localStream;
                }
                
                // Fall back to original implementation
                return originalGetLocalStream();
            };
            
            console.log('[ModalAdapter] WebRTCMedia functions successfully patched');
        } else {
            console.log('[ModalAdapter] WebRTCMedia not available yet, will try again in 100ms');
            setTimeout(patchWebRTCMedia, 100);
        }
    }
})(); 