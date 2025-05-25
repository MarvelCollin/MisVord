/**
 * Browser Compatibility Module for WebRTC
 * Provides compatibility layer and browser-specific fixes
 */

// Create namespace for browser compatibility functions
window.WebRTCCompatibility = window.WebRTCCompatibility || {};

// Browser detection
const browserInfo = (function() {
    const ua = navigator.userAgent;
    let browser = "Unknown";
    let version = "Unknown";
    let os = "Unknown";
    let mobile = false;
    
    // Detect browser
    if (/MSIE|Trident/.test(ua)) {
        browser = "IE";
        version = /MSIE\s(\d+\.\d+)/.exec(ua) ? 
            parseFloat(RegExp.$1) : 
            /Trident\/(\d+\.\d+)/.exec(ua) ? 
                parseFloat(RegExp.$1) + 4 : 
                "Unknown";
    } else if (/Edge\/(\d+)/.test(ua)) {
        browser = "Edge Legacy";
        version = RegExp.$1;
    } else if (/Edg\/(\d+)/.test(ua)) {
        browser = "Edge Chromium";
        version = RegExp.$1;
    } else if (/Chrome\/(\d+)/.test(ua)) {
        browser = "Chrome";
        version = RegExp.$1;
    } else if (/Firefox\/(\d+)/.test(ua)) {
        browser = "Firefox";
        version = RegExp.$1;
    } else if (/Safari\/(\d+)/.test(ua)) {
        if (/Version\/(\d+\.\d+)/.test(ua)) {
            browser = "Safari";
            version = RegExp.$1;
        } else {
            browser = "Safari";
            version = "Unknown";
        }
    } else if (/Opera\/(\d+\.\d+)/.test(ua)) {
        browser = "Opera";
        version = RegExp.$1;
    }
    
    // Detect OS
    if (/Windows/.test(ua)) {
        os = "Windows";
    } else if (/Macintosh/.test(ua)) {
        os = "MacOS";
    } else if (/Linux/.test(ua)) {
        os = "Linux";
    } else if (/Android/.test(ua)) {
        os = "Android";
        mobile = true;
    } else if (/iPhone|iPad|iPod/.test(ua)) {
        os = "iOS";
        mobile = true;
    }
    
    return {
        name: browser,
        version: version,
        os: os,
        isMobile: mobile,
        userAgent: ua
    };
})();

/**
 * Check if the current browser fully supports WebRTC
 * @returns {Object} Support information object
 */
window.WebRTCCompatibility.checkSupport = function() {
    const mediaDevicesSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const rtcPeerConnectionSupported = !!window.RTCPeerConnection;
    const webSocketsSupported = 'WebSocket' in window;
    const getUserMediaSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const secureContext = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';
    
    // Check getStats support safely with error handling
    let getStatsSupported = false;
    if (rtcPeerConnectionSupported) {
        try {
            const tempPc = new RTCPeerConnection();
            getStatsSupported = typeof tempPc.getStats === 'function';
            // Clean up the temporary connection
            tempPc.close();
        } catch (e) {
            console.warn('[WebRTC Compatibility] Error testing getStats support:', e);
            getStatsSupported = false;
        }
    }
    
    return {
        browser: browserInfo,
        fullSupport: mediaDevicesSupported && rtcPeerConnectionSupported && webSocketsSupported && secureContext,
        mediaDevices: mediaDevicesSupported,
        rtcPeerConnection: rtcPeerConnectionSupported,
        getUserMedia: getUserMediaSupported,
        webSockets: webSocketsSupported,
        secureContext: secureContext,
        warnings: getWarnings(),
        getStatsSupported: getStatsSupported
    };
};

/**
 * Apply browser-specific patches for WebRTC compatibility
 */
window.WebRTCCompatibility.applyBrowserFixes = function() {
    // Fix for Safari/iOS
    if (browserInfo.name === "Safari" || browserInfo.os === "iOS") {
        applyAppleFixes();
    }
    
    // Fix for Firefox
    if (browserInfo.name === "Firefox") {
        applyFirefoxFixes();
    }
    
    // Apply specific fixes for mobile
    if (browserInfo.isMobile) {
        applyMobileFixes();
    }
    
    console.log(`[WebRTC Compatibility] Applied browser-specific fixes for ${browserInfo.name} ${browserInfo.version} on ${browserInfo.os}`);
};

/**
 * Get browser-specific constraints for getUserMedia
 * @param {Object} baseConstraints - Base constraints to modify
 * @returns {Object} Modified constraints
 */
window.WebRTCCompatibility.getConstraints = function(baseConstraints = {}) {
    const constraints = {...baseConstraints};
    
    // Default video constraints if none provided
    if (!constraints.video || constraints.video === true) {
        constraints.video = {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 }
        };
    }
    
    // Default audio constraints if none provided
    if (!constraints.audio || constraints.audio === true) {
        constraints.audio = {
            echoCancellation: true,
            noiseSuppression: true
        };
    }
    
    // Modify for specific browsers
    if (browserInfo.name === "Safari" || browserInfo.os === "iOS") {
        // Lower quality for iOS devices
        if (browserInfo.os === "iOS") {
            constraints.video.width = { ideal: 320 };
            constraints.video.height = { ideal: 240 };
            constraints.video.frameRate = { max: 15 };
        }
        
        // Safari requires specific audio constraints
        constraints.audio.autoGainControl = false;
    }
    
    // Optimize for mobile devices
    if (browserInfo.isMobile) {
        constraints.video.facingMode = { ideal: "user" };
        
        // Reduce quality on mobile
        constraints.video.width = { ideal: 320 };
        constraints.video.height = { ideal: 240 };
    }
    
    return constraints;
};

/**
 * Fixes and workarounds for Safari and iOS
 */
function applyAppleFixes() {
    // Fix for getStats in Safari
    const origGetStats = RTCPeerConnection.prototype.getStats;
    RTCPeerConnection.prototype.getStats = function() {
        const pc = this;
        const args = arguments;
        
        // Fix Safari not supporting empty getStats() call
        if (args.length === 0) {
            return origGetStats.apply(pc).then(function(stats) {
                // Process stats if needed
                return stats;
            });
        }
        
        return origGetStats.apply(pc, args);
    };
    
    // Enable Safari's experimental WebRTC features
    if (window.RTCRtpSender && !window.RTCRtpSender.prototype.replaceTrack) {
        window.RTCRtpSender.prototype.replaceTrack = function(track) {
            const sender = this;
            return new Promise((resolve, reject) => {
                try {
                    sender.track = track;
                    resolve();
                } catch(e) {
                    reject(e);
                }
            });
        };
    }
}

/**
 * Fixes and workarounds for Firefox
 */
function applyFirefoxFixes() {
    // Firefox has several quirks with SDP and ICE handling
    const origCreateOffer = RTCPeerConnection.prototype.createOffer;
    RTCPeerConnection.prototype.createOffer = function(options) {
        const pc = this;
        
        // Firefox needs specific options for ICE restart
        if (options && options.iceRestart) {
            options.offerToReceiveAudio = true;
            options.offerToReceiveVideo = true;
        }
        
        return origCreateOffer.apply(pc, [options]);
    };
}

/**
 * Fixes and optimizations for mobile browsers
 */
function applyMobileFixes() {
    // Detect iOS for specific fixes
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    // iOS Safari requires user gesture to play audio/video
    if (isIOS) {
        // Add automatic play/pause fix for iOS
        document.addEventListener('click', function iosClickFix() {
            // Create and play a silent audio element to enable audio
            const audioElement = document.createElement('audio');
            audioElement.setAttribute('playsinline', '');
            audioElement.setAttribute('controls', '');
            audioElement.style.display = 'none';
            document.body.appendChild(audioElement);
            
            const playPromise = audioElement.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    audioElement.pause();
                    document.body.removeChild(audioElement);
                }).catch(error => {
                    console.warn('iOS audio permission not granted:', error);
                });
            }
            
            // Remove the event listener after first click
            document.removeEventListener('click', iosClickFix);
        });
    }
    
    // Add battery/power saving optimizations
    if (navigator.getBattery) {
        navigator.getBattery().then(battery => {
            if (battery.level < 0.2 && !battery.charging) {
                console.log('[WebRTC Compatibility] Low battery detected, applying power saving mode');
                
                // Override the default constraints to save power
                const origGetConstraints = window.WebRTCCompatibility.getConstraints;
                window.WebRTCCompatibility.getConstraints = function(baseConstraints) {
                    const constraints = origGetConstraints(baseConstraints);
                    
                    // Reduce quality significantly
                    constraints.video.frameRate = { ideal: 10, max: 15 };
                    constraints.video.width = { ideal: 240 };
                    constraints.video.height = { ideal: 180 };
                    
                    return constraints;
                };
            }
        }).catch(error => {
            console.warn('Battery status not available:', error);
        });
    }
}

/**
 * Get browser-specific warnings and issues
 * @returns {Array} List of warning messages
 */
function getWarnings() {
    const warnings = [];
    
    // Check for browsers with known WebRTC issues
    if (browserInfo.name === "IE") {
        warnings.push("Internet Explorer does not support WebRTC.");
    }
    
    if (browserInfo.name === "Safari" && parseInt(browserInfo.version) < 13) {
        warnings.push("Your Safari version has limited WebRTC support. Consider upgrading.");
    }
    
    if (browserInfo.name === "Firefox" && parseInt(browserInfo.version) < 60) {
        warnings.push("Your Firefox version has outdated WebRTC support. Consider upgrading.");
    }
    
    if (!window.isSecureContext && location.hostname !== 'localhost') {
        warnings.push("WebRTC requires a secure context (HTTPS) to function properly.");
    }
    
    // iOS specific warnings
    if (browserInfo.os === "iOS") {
        warnings.push("iOS devices may experience limitations with WebRTC. Tap the screen once to enable audio.");
    }
    
    return warnings;
}

/**
 * Add network connection monitoring
 * This helps recover from temporary network interruptions
 */
window.WebRTCCompatibility.monitorNetworkConnectivity = function() {
    // Flag to track if we're currently recovering from network interruption
    let isRecovering = false;
    
    // Rate limiting for reconnection attempts
    const reconnectHistory = {
        lastAttempt: 0,
        attemptCount: 0,
        maxFrequency: 5000, // Minimum 5 seconds between reconnection attempts
        maxAttempts: 10,    // Maximum 10 attempts in rapid succession
        cooldownPeriod: 30000, // 30 second cooldown after max attempts
        cooldownStart: 0
    };
    
    // Network status change handler
    const handleNetworkChange = () => {
        const isOnline = navigator.onLine;
        const status = isOnline ? 'online' : 'offline';
        
        console.log(`[WebRTC Compatibility] Network status changed: ${status}`);
        
        if (isOnline && isRecovering) {
            // We're back online after being offline
            isRecovering = false;
            
            // Apply rate limiting for reconnection
            const now = Date.now();
            
            // Check if we're in a cooldown period
            if (reconnectHistory.cooldownStart > 0 && 
                (now - reconnectHistory.cooldownStart) < reconnectHistory.cooldownPeriod) {
                console.log('[WebRTC Compatibility] In reconnection cooldown period, delaying recovery');
                
                // Schedule a single recovery attempt after cooldown
                setTimeout(() => {
                    console.log('[WebRTC Compatibility] Cooldown complete, attempting recovery');
                    attemptConnectionRecovery();
                    // Reset cooldown and attempt count after cooldown period
                    reconnectHistory.cooldownStart = 0;
                    reconnectHistory.attemptCount = 0;
                }, reconnectHistory.cooldownPeriod - (now - reconnectHistory.cooldownStart));
                
                return;
            }
            
            // Check if we're reconnecting too frequently
            if ((now - reconnectHistory.lastAttempt) < reconnectHistory.maxFrequency) {
                reconnectHistory.attemptCount++;
                console.log(`[WebRTC Compatibility] Rapid reconnection attempt ${reconnectHistory.attemptCount}/${reconnectHistory.maxAttempts}`);
                
                // If too many rapid attempts, enter cooldown
                if (reconnectHistory.attemptCount >= reconnectHistory.maxAttempts) {
                    console.log('[WebRTC Compatibility] Too many reconnection attempts, entering cooldown period');
                    reconnectHistory.cooldownStart = now;
                    
                    // Show user-friendly notification
                    if (window.WebRTCUI && typeof window.WebRTCUI.addLogEntry === 'function') {
                        window.WebRTCUI.addLogEntry('Network unstable. Taking a short break before reconnecting...', 'warn');
                    }
                    
                    return;
                }
        } else {
                // Reset attempt count if enough time has passed since last attempt
                reconnectHistory.attemptCount = 0;
            }
            
            // Update last attempt timestamp
            reconnectHistory.lastAttempt = now;
            
            // Give the network connection a moment to stabilize
            setTimeout(() => {
                attemptConnectionRecovery();
            }, 2000);
        } else if (!isOnline) {
            isRecovering = true;
            // Log the offline status - recovery will happen when back online
            console.log('[WebRTC Compatibility] Network is offline. Will attempt recovery when back online.');
            
            // Show user-friendly notification if WebRTCUI is available
            if (window.WebRTCUI && typeof window.WebRTCUI.addLogEntry === 'function') {
                window.WebRTCUI.addLogEntry('Network connection lost. Waiting for reconnection...', 'warn');
                window.WebRTCUI.updateConnectionStatus('disconnected', 'Network offline');
            }
        }
    };
    
    // Add network status listeners
    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);
    
    // Track connection quality if Performance API is available
    if (window.navigator.connection) {
        const connection = window.navigator.connection;
        
        connection.addEventListener('change', () => {
            console.log(`[WebRTC Compatibility] Network type changed: ${connection.effectiveType}, rtt: ${connection.rtt}`);
            
            if (connection.rtt > 1000) {
                // High latency detected, might affect WebRTC
                if (window.WebRTCUI && typeof window.WebRTCUI.addLogEntry === 'function') {
                    window.WebRTCUI.addLogEntry('High network latency detected. Video quality may be affected.', 'warn');
                }
                
                // Automatically adjust video quality based on network conditions
                if (window.peers) {
                    // For each peer connection, adjust the video bitrate
                    Object.values(window.peers).forEach(peer => {
                        if (peer.pc && peer.pc.getSenders) {
                            peer.pc.getSenders().forEach(sender => {
                                if (sender.track && sender.track.kind === 'video' && sender.getParameters) {
                                    try {
                                        const params = sender.getParameters();
                                        // If encodings exists and has bitrate settings
                                        if (params.encodings && params.encodings.length > 0) {
                                            // Reduce bitrate for poor connections
                                            params.encodings.forEach(encoding => {
                                                encoding.maxBitrate = 150000; // 150kbps
                                            });
                                            sender.setParameters(params);
                                            console.log('[WebRTC Compatibility] Reduced video bitrate due to poor connection');
                                        }
                                    } catch (e) {
                                        console.warn('[WebRTC Compatibility] Error adjusting video bitrate:', e);
                                    }
                                }
                            });
                        }
                    });
                }
            }
        });
    }
    
    console.log('[WebRTC Compatibility] Network connectivity monitoring enabled');
    return true;
};

/**
 * Connection recovery logic
 */
function attemptConnectionRecovery() {
    console.log('[WebRTC Compatibility] Attempting connection recovery after network interruption');
    
    // Show recovery message to user
    if (window.WebRTCUI && typeof window.WebRTCUI.addLogEntry === 'function') {
        window.WebRTCUI.addLogEntry('Network connection restored. Attempting to recover connections...', 'info');
        window.WebRTCUI.updateConnectionStatus('connecting', 'Reconnecting...');
    }
    
    // First, check socket connection and try to reconnect
    if (window.WebRTCSignaling && typeof window.WebRTCSignaling.isConnected === 'function') {
        if (!window.WebRTCSignaling.isConnected()) {
            console.log('[WebRTC Compatibility] Socket connection lost, attempting to reconnect');
            
            // Try to reconnect signaling
            if (typeof window.WebRTCSignaling.reconnect === 'function') {
                window.WebRTCSignaling.reconnect();
            }
        } else {
            console.log('[WebRTC Compatibility] Socket connection is active');
        }
    }
    
    // Next, check all peer connections and try to recover them
    if (window.peers) {
        Object.entries(window.peers).forEach(([peerId, peer]) => {
            if (peer.pc && (
                peer.pc.connectionState === 'failed' || 
                peer.pc.connectionState === 'disconnected' ||
                peer.pc.iceConnectionState === 'failed' ||
                peer.pc.iceConnectionState === 'disconnected'
            )) {
                console.log(`[WebRTC Compatibility] Attempting to recover peer connection: ${peerId}`);
                
                // Attempt ICE restart if the connection is failed
                if (typeof peer.pc.restartIce === 'function') {
                    peer.pc.restartIce();
                    
                    // Create new offer with ICE restart
                    peer.pc.createOffer({ iceRestart: true })
                        .then(offer => peer.pc.setLocalDescription(offer))
                        .then(() => {
                            // If we have a signaling channel, send the offer
                            if (window.WebRTCSignaling && typeof window.WebRTCSignaling.sendWebRTCOffer === 'function') {
                                window.WebRTCSignaling.sendWebRTCOffer(
                                    peerId, 
                                    peer.pc.localDescription, 
                                    { isIceRestart: true }
                                );
                            }
                        })
                        .catch(err => console.error('[WebRTC Compatibility] Error creating recovery offer:', err));
                }
            }
        });
    }
}

// Initialize compatibility module
(function() {
    console.log(`[WebRTC Compatibility] Browser detected: ${browserInfo.name} ${browserInfo.version} on ${browserInfo.os}`);
    
    // Apply fixes automatically
    window.WebRTCCompatibility.applyBrowserFixes();
    
    // Check support and report issues
    const support = window.WebRTCCompatibility.checkSupport();
    if (!support.fullSupport) {
        console.warn('[WebRTC Compatibility] Browser has limited WebRTC support:', support);
    }
    
    // Log warnings
    support.warnings.forEach(warning => {
        console.warn('[WebRTC Compatibility] Warning:', warning);
    });
})();

// Initialize the network monitoring
window.addEventListener('DOMContentLoaded', () => {
    // Add small delay to ensure all modules are loaded
    setTimeout(() => {
        window.WebRTCCompatibility.monitorNetworkConnectivity();
        
        // Show environment info in console
        const support = window.WebRTCCompatibility.checkSupport();
        console.log('[WebRTCCompatibility] Environment information:', {
            browser: support.browser,
            fullSupport: support.fullSupport,
            warnings: support.warnings
        });
    }, 1000);
}); 
