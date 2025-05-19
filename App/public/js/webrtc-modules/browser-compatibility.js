/**
 * Enhanced WebRTC Browser Compatibility Module
 * 
 * Provides comprehensive browser compatibility checking for WebRTC features.
 * Detects issues with browser versions, permissions, and network configuration
 * that could affect video call quality.
 */

function checkBrowserCompatibility() {
    const browserInfo = {
        name: getBrowserName(),
        version: getBrowserVersion(),
        isCompatible: true,
        issues: [],
        warnings: [],
        permissions: {
            camera: 'unknown',
            microphone: 'unknown'
        },
        network: {
            relaySupported: true,
            reflexiveSupported: true,
            natType: 'unknown'
        },
        mediaConstraintsSupport: {
            h264: testCodecSupport('video/h264'),
            vp8: testCodecSupport('video/VP8'),
            vp9: testCodecSupport('video/VP9'),
            opus: testCodecSupport('audio/opus'),
            echoCancellation: true,
            noiseSuppression: true
        }
    };
    
    // Check for basic WebRTC support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        browserInfo.isCompatible = false;
        browserInfo.issues.push('WebRTC API not supported');
    }
    
    if (!window.RTCPeerConnection) {
        browserInfo.isCompatible = false;
        browserInfo.issues.push('RTCPeerConnection not supported');
    }
    
    // Check specific browser versions
    if (browserInfo.name === 'Safari' && parseInt(getBrowserVersion()) < 13) {
        browserInfo.warnings.push('Safari < 13 has limited WebRTC support');
    }
    
    if (browserInfo.name === 'Firefox' && parseInt(getBrowserVersion()) < 60) {
        browserInfo.warnings.push('Firefox < 60 has outdated WebRTC support');
    }
    
    if (browserInfo.name === 'Chrome' && parseInt(getBrowserVersion()) < 72) {
        browserInfo.warnings.push('Chrome < 72 has outdated WebRTC support');
    }
    
    if (browserInfo.name === 'Internet Explorer') {
        browserInfo.isCompatible = false;
        browserInfo.issues.push('Internet Explorer does not support WebRTC');
    }
    
    // Check for mobile browsers with limited support
    if (isMobile()) {
        browserInfo.warnings.push('Mobile browsers may have limited WebRTC performance');
        
        // iOS Safari has specific limitations
        if (isIOS() && browserInfo.name === 'Safari') {
            browserInfo.warnings.push('iOS Safari has media autoplay restrictions');
        }
        
        // WebView or in-app browsers often have issues
        if (isWebView()) {
            browserInfo.warnings.push('In-app browsers may have limited WebRTC support');
        }
    }
    
    // Check for insecure context
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        browserInfo.issues.push('WebRTC requires secure context (HTTPS) except on localhost');
        
        // In many browsers, getUserMedia is blocked on insecure origins
        if (browserInfo.name === 'Chrome' || browserInfo.name === 'Edge') {
            browserInfo.isCompatible = false;
        }
    }
    
    // Check for known browser bugs
    if (browserInfo.name === 'Safari' && isIOS() && typeof window.orientation !== 'undefined') {
        browserInfo.warnings.push('iOS Safari may freeze video after device orientation changes');
    }
    
    // Check device memory if available (limited RAM can cause performance issues)
    if (navigator.deviceMemory) {
        if (navigator.deviceMemory < 4) {
            browserInfo.warnings.push(`Device has limited memory (${navigator.deviceMemory}GB), which may affect performance`);
        }
    }
    
    // Check permissions if available in this browser
    checkMediaPermissions(browserInfo);
    
    // Check for network connectivity requirements
    testICEConnectivity(browserInfo);
    
    return browserInfo;
}

// Test if a specific codec is supported
function testCodecSupport(mimeType) {
    try {
        return RTCRtpSender.getCapabilities && 
               RTCRtpSender.getCapabilities('video')?.codecs.some(codec => 
                   codec.mimeType.toLowerCase() === mimeType.toLowerCase());
    } catch (e) {
        console.warn(`Could not test codec support for ${mimeType}:`, e);
        return false;
    }
}

// Check for mobile browser
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Check if running on iOS
function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

// Detect if running in a WebView
function isWebView() {
    const userAgent = navigator.userAgent;
    // Android WebView
    if (userAgent.includes('wv')) return true;
    // iOS WebView
    if (/(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(userAgent)) return true;
    return false;
}

// Get browser name from user agent
function getBrowserName() {
    const userAgent = navigator.userAgent;
    let browserName;
    
    if (userAgent.match(/edg/i)) {
        browserName = "Edge"; // Must check before Chrome
    } else if (userAgent.match(/chrome|chromium|crios/i)) {
        browserName = "Chrome";
    } else if (userAgent.match(/firefox|fxios/i)) {
        browserName = "Firefox";
    } else if (userAgent.match(/safari/i)) {
        browserName = "Safari";
    } else if (userAgent.match(/opr\//i)) {
        browserName = "Opera";
    } else if (userAgent.match(/msie|trident/i)) {
        browserName = "Internet Explorer";
    } else {
        browserName = "Unknown";
    }
    
    return browserName;
}

// Get browser version
function getBrowserVersion() {
    const userAgent = navigator.userAgent;
    let version = "Unknown";
    
    try {
        if (userAgent.match(/edg/i)) {
            version = userAgent.match(/edg\/([\d.]+)/i)[1];
        } else if (userAgent.match(/chrome|chromium|crios/i)) {
            version = userAgent.match(/(?:chrome|chromium|crios)\/([\d.]+)/i)[1];
        } else if (userAgent.match(/firefox|fxios/i)) {
            version = userAgent.match(/(?:firefox|fxios)\/([\d.]+)/i)[1];
        } else if (userAgent.match(/safari/i)) {
            version = userAgent.match(/version\/([\d.]+)/i)[1];
        } else if (userAgent.match(/opr\//i)) {
            version = userAgent.match(/opr\/([\d.]+)/i)[1];
        } else if (userAgent.match(/msie|trident/i)) {
            const msieMatch = userAgent.match(/msie\s([\d.]+)/i);
            const tridentMatch = userAgent.match(/trident.*rv:([\d.]+)/i);
            version = (msieMatch || tridentMatch) ? (msieMatch ? msieMatch[1] : tridentMatch[1]) : "Unknown";
        }
    } catch (e) {
        console.warn("Error extracting browser version:", e);
    }
    
    return version;
}

// Check media device permissions
function checkMediaPermissions(browserInfo) {
    if (!navigator.permissions) {
        browserInfo.warnings.push('Cannot check media permissions - Permissions API not supported');
        return;
    }
    
        // Check camera permission
    try {
        navigator.permissions.query({ name: 'camera' })
            .then(permissionStatus => {
                browserInfo.permissions.camera = permissionStatus.state;
                
                if (permissionStatus.state === 'denied') {
                    browserInfo.issues.push('Camera access is denied');
                } else if (permissionStatus.state === 'prompt') {
                    browserInfo.warnings.push('Camera permission will be requested when needed');
                }
                
                // Listen for permission changes
                permissionStatus.onchange = () => {
                    console.log('Camera permission changed to:', permissionStatus.state);
                    browserInfo.permissions.camera = permissionStatus.state;
                    
                    // Refresh if permissions are now granted
                    if (permissionStatus.state === 'granted' && 
                        (browserInfo.permissions.camera !== 'granted' || 
                         browserInfo.permissions.microphone !== 'granted')) {
                        window.location.reload();
                    }
                };
            })
            .catch(err => {
                console.warn('Could not query camera permission:', err);
                browserInfo.permissions.camera = 'error';
                browserInfo.warnings.push('Error checking camera permission');
            });
            
        // Check microphone permission
        navigator.permissions.query({ name: 'microphone' })
            .then(permissionStatus => {
                browserInfo.permissions.microphone = permissionStatus.state;
                
                if (permissionStatus.state === 'denied') {
                    browserInfo.issues.push('Microphone access is denied');
                } else if (permissionStatus.state === 'prompt') {
                    browserInfo.warnings.push('Microphone permission will be requested when needed');
                }
                
                // Listen for permission changes
                permissionStatus.onchange = () => {
                    console.log('Microphone permission changed to:', permissionStatus.state);
                    browserInfo.permissions.microphone = permissionStatus.state;
                    
                    // Refresh if permissions are now granted
                    if (permissionStatus.state === 'granted' && 
                        (browserInfo.permissions.camera !== 'granted' || 
                         browserInfo.permissions.microphone !== 'granted')) {
                        window.location.reload();
                    }
                };
            })
            .catch(err => {
                console.warn('Could not query microphone permission:', err);
                browserInfo.permissions.microphone = 'error';
                browserInfo.warnings.push('Error checking microphone permission');
            });
    } catch (e) {
        console.warn('Error checking media permissions:', e);
        browserInfo.warnings.push('Error accessing the Permissions API');
    }
}

// Test ICE connectivity (STUN/TURN)
function testICEConnectivity(browserInfo) {
    if (!window.RTCPeerConnection) return;
    
    try {
        // Create a temporary peer connection to test ICE gathering
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { 
                    urls: 'turn:openrelay.metered.ca:80',
                    username: 'openrelayproject',
                    credential: 'openrelayproject'
                }
            ]
        });
        
        // Set timeout to prevent hanging if ICE gathering fails
        const timeout = setTimeout(() => {
            browserInfo.network.reflexiveSupported = false;
            browserInfo.warnings.push('ICE gathering timed out - network may be restricted');
            if (pc && pc.signalingState !== 'closed') pc.close();
        }, 8000); // Longer timeout for more thorough testing
        
        // Track ICE candidates to determine NAT traversal capabilities
        let hasReflexive = false;
        let hasRelay = false;
        let candidateTypes = { host: 0, srflx: 0, prflx: 0, relay: 0 };
        
        pc.addEventListener('icecandidate', event => {
            if (event.candidate) {
                // Count candidate types
                if (event.candidate.candidate.indexOf('typ host') !== -1) {
                    candidateTypes.host++;
                } else if (event.candidate.candidate.indexOf('typ srflx') !== -1) {
                    // Found a server reflexive candidate (STUN is working)
                    hasReflexive = true;
                    candidateTypes.srflx++;
                    browserInfo.network.reflexiveSupported = true;
                } else if (event.candidate.candidate.indexOf('typ prflx') !== -1) {
                    // Peer reflexive candidate
                    candidateTypes.prflx++;
                } else if (event.candidate.candidate.indexOf('typ relay') !== -1) {
                    // Found a relay candidate (TURN is working)
                    hasRelay = true;
                    candidateTypes.relay++;
                    browserInfo.network.relaySupported = true;
                }
                
                // Log advanced network details
                console.log("ICE candidate:", event.candidate.candidate);
            } else {
                // ICE gathering complete
                clearTimeout(timeout);
                
                // Calculate the total candidates found
                const totalCandidates = Object.values(candidateTypes).reduce((sum, count) => sum + count, 0);
                
                // Store candidate stats in browserInfo
                browserInfo.network.candidateStats = candidateTypes;
                browserInfo.network.totalCandidates = totalCandidates;
                
                if (!hasReflexive) {
                    browserInfo.warnings.push('Could not establish STUN connection - firewall may be blocking UDP');
                    browserInfo.network.reflexiveSupported = false;
                }
                
                if (!hasRelay) {
                    browserInfo.warnings.push('Could not establish TURN connection - highly restrictive firewall may impair connectivity');
                    browserInfo.network.relaySupported = false;
                }
                
                if (totalCandidates < 2) {
                    browserInfo.warnings.push('Very few ICE candidates found - connectivity will be severely limited');
                }
                
                // Determine approximate NAT type based on gathered candidates
                if (hasRelay && !hasReflexive) {
                    browserInfo.network.natType = 'symmetric NAT (requires TURN)';
                    browserInfo.warnings.push('Your network appears to have a symmetric NAT - TURN server required');
                } else if (hasReflexive) {
                    browserInfo.network.natType = 'standard NAT (STUN sufficient)';
                } else if (candidateTypes.host > 0 && !hasReflexive && !hasRelay) {
                    browserInfo.network.natType = 'restricted NAT/firewall (may prevent connections)';
                    browserInfo.warnings.push('Network appears very restricted - video calls may not function properly');
                }
                
                // Test actual network throughput if possible
                testNetworkSpeed(browserInfo);
                
                // Clean up
                if (pc && pc.signalingState !== 'closed') pc.close();
            }
        });
        
        // Create a data channel to trigger ICE gathering
        pc.createDataChannel('connectivity-test');
        
        // Create an offer to start ICE gathering
        pc.createOffer()
            .then(offer => pc.setLocalDescription(offer))
            .catch(err => {
                console.warn('Error during ICE connectivity test:', err);
                clearTimeout(timeout);
                browserInfo.warnings.push('Failed to test network connectivity');
                if (pc && pc.signalingState !== 'closed') pc.close();
            });
            
    } catch (e) {
        console.warn('ICE connectivity test error:', e);
        browserInfo.warnings.push('Could not test network connectivity');
    }
}

// Test network speed (download and upload capabilities)
function testNetworkSpeed(browserInfo) {
    if (!browserInfo.network) browserInfo.network = {};
    
    // Initialize network speed properties
    browserInfo.network.speedTest = {
        downloadSpeed: 'unknown',
        uploadSpeed: 'unknown',
        latency: 'unknown',
        adequate: true
    };
    
    try {
        // Simple download speed test using a small image
        const startTime = performance.now();
        const img = new Image();
        const testImageSize = 100000; // ~100KB test image
        
        img.onload = function() {
            const endTime = performance.now();
            const durationSeconds = (endTime - startTime) / 1000;
            const downloadSpeedKbps = Math.round((testImageSize * 8) / durationSeconds / 1024);
            
            browserInfo.network.speedTest.downloadSpeed = downloadSpeedKbps;
            browserInfo.network.speedTest.latency = Math.round(endTime - startTime);
            
            // Basic assessment
            if (downloadSpeedKbps < 300) { // Less than 300 Kbps
                browserInfo.network.speedTest.adequate = false;
                browserInfo.warnings.push(`Low network bandwidth detected (~${downloadSpeedKbps}Kbps) - video quality may be poor`);
            }
            
            // Test upload speed using a beacon (not perfectly accurate but gives approximation)
            testUploadSpeed(browserInfo);
        };
        
        img.onerror = function() {
            browserInfo.network.speedTest.downloadSpeed = 'error';
            browserInfo.warnings.push('Could not test download speed - network may be restricted');
        };
        
        // Use a public test image
        img.src = 'https://cdn.jsdelivr.net/gh/mathiasbynens/small/jpeg/1x1.jpg?nocache=' + new Date().getTime();
    } catch(e) {
        console.warn('Network speed test error:', e);
    }
}

// Test upload capabilities
function testUploadSpeed(browserInfo) {
    try {
        // Create a small blob for testing upload
        const blob = new Blob([new ArrayBuffer(50000)]); // 50KB test data
        const startTime = performance.now();
        
        // Use navigator.sendBeacon which is an asynchronous upload method
        if (navigator.sendBeacon) {
            // Send a POST request to a public echo service
            navigator.sendBeacon('https://httpbin.org/post', blob);
            
            // Since sendBeacon is async and doesn't report completion,
            // we'll use a conservative estimate based on time taken to queue the request
            setTimeout(() => {
                const endTime = performance.now();
                const approximateTimeMs = Math.min(endTime - startTime, 3000); // Cap at 3 seconds
                
                if (approximateTimeMs < 3000) {
                    // Simple approximation - actual speed would require a proper echo test
                    const estimatedUploadKbps = Math.round((50000 * 8) / (approximateTimeMs / 1000) / 1024);
                    browserInfo.network.speedTest.uploadSpeed = estimatedUploadKbps;
                    
                    // Basic assessment
                    if (estimatedUploadKbps < 200) { // Less than 200 Kbps upload
                        browserInfo.network.speedTest.adequate = false;
                        browserInfo.warnings.push(`Low upload bandwidth detected (~${estimatedUploadKbps}Kbps) - sending video may be difficult`);
                    }
                } else {
                    browserInfo.network.speedTest.uploadSpeed = 'timeout';
                    browserInfo.warnings.push('Upload test timed out - network may be very slow');
                }
            }, 3000);
        } else {
            browserInfo.network.speedTest.uploadSpeed = 'unsupported';
        }
    } catch(e) {
        console.warn('Upload speed test error:', e);
        browserInfo.network.speedTest.uploadSpeed = 'error';
    }
}

// Display compatibility warnings to the user
function showBrowserCompatibilityWarning(browserInfo) {
    // Don't show if there are no issues or warnings
    if (browserInfo.isCompatible && browserInfo.issues.length === 0 && browserInfo.warnings.length === 0) {
        return;
    }
    
    const warningEl = document.createElement('div');
    warningEl.className = 'fixed top-4 left-4 right-4 bg-yellow-600 text-white p-4 rounded shadow-lg z-50';
    
    let message = `<h3 class="text-lg font-bold mb-2">Browser Compatibility Warning</h3>`;
    
    if (!browserInfo.isCompatible) {
        message += `<p class="mb-2">Your browser (${browserInfo.name} ${browserInfo.version}) does not fully support WebRTC.</p>`;
    } else if (browserInfo.issues.length > 0) {
        message += `<p class="mb-2">Your browser (${browserInfo.name} ${browserInfo.version}) has issues that may prevent video calls from working:</p>`;
    } else if (browserInfo.warnings.length > 0) {
        message += `<p class="mb-2">Your browser (${browserInfo.name} ${browserInfo.version}) has potential limitations:</p>`;
    }
    
    // Show critical issues first
    if (browserInfo.issues.length > 0) {
        message += '<ul class="list-disc pl-5 mb-2 bg-red-700 p-2 rounded">';
        browserInfo.issues.forEach(issue => {
            message += `<li>${issue}</li>`;
        });
        message += '</ul>';
    }
    
    // Then show warnings
    if (browserInfo.warnings.length > 0) {
        message += '<ul class="list-disc pl-5 mb-2 bg-yellow-700 p-2 rounded">';
        browserInfo.warnings.forEach(warning => {
            message += `<li>${warning}</li>`;
        });
        message += '</ul>';
    }
    
    // Add permission status if available
    if (browserInfo.permissions.camera !== 'unknown' || browserInfo.permissions.microphone !== 'unknown') {
        message += '<div class="mt-2 p-2 bg-black bg-opacity-30 rounded">';
        message += '<p class="font-semibold">Current Permissions:</p>';
        message += `<p>Camera: <span class="${browserInfo.permissions.camera === 'granted' ? 'text-green-300' : 'text-red-300'}">${browserInfo.permissions.camera}</span></p>`;
        message += `<p>Microphone: <span class="${browserInfo.permissions.microphone === 'granted' ? 'text-green-300' : 'text-red-300'}">${browserInfo.permissions.microphone}</span></p>`;
        message += '</div>';
    }
    
    message += `<p class="mt-2">For best results, please use the latest version of Chrome, Firefox, or Safari.</p>`;
    
    if (browserInfo.permissions.camera === 'denied' || browserInfo.permissions.microphone === 'denied') {
        message += `<p class="mt-2 bg-red-800 p-2 rounded">You have denied camera or microphone access. Please reset permissions in your browser settings.</p>`;
        
        // Add browser-specific instructions
        if (browserInfo.name === 'Chrome') {
            message += `<p class="text-xs mt-1">To reset: Click the lock/info icon in the address bar, then change camera and microphone permissions to "Allow".</p>`;
        } else if (browserInfo.name === 'Firefox') {
            message += `<p class="text-xs mt-1">To reset: Click the lock icon in the address bar, clear the permission, then reload the page.</p>`;
        } else if (browserInfo.name === 'Safari') {
            message += `<p class="text-xs mt-1">To reset: Go to Safari Preferences > Websites > Camera/Microphone and change the permission.</p>`;
        }
    }
    
    message += `<div class="flex gap-2 mt-3">
        <button id="dismiss-compat-warning" class="px-3 py-1 bg-white text-yellow-700 rounded hover:bg-gray-100">Dismiss</button>
        <button id="reload-page-btn" class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">Reload Page</button>
        <button id="test-devices-btn" class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">Test Devices</button>
    </div>`;
    
    warningEl.innerHTML = message;
    document.body.appendChild(warningEl);
    
    // Add button event listeners
    setTimeout(() => {
        const dismissBtn = document.getElementById('dismiss-compat-warning');
        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => {
                warningEl.style.display = 'none';
            });
        }
        
        const reloadBtn = document.getElementById('reload-page-btn');
        if (reloadBtn) {
            reloadBtn.addEventListener('click', () => {
                window.location.reload();
            });
        }
        
        const testDevicesBtn = document.getElementById('test-devices-btn');
        if (testDevicesBtn) {
            testDevicesBtn.addEventListener('click', () => {
                forcePermissionRequest()
                    .then(success => {
                        if (success) {
                            warningEl.innerHTML = '<div class="text-lg">✅ Permissions granted successfully! Reloading...</div>';
                            setTimeout(() => window.location.reload(), 1000);
                        } else {
                            warningEl.innerHTML = '<div class="text-lg">❌ Permission request failed. Please check your browser settings.</div>';
                        }
                    });
            });
        }
    }, 100);
}

// Force permission request function
function forcePermissionRequest() {
    // Show the permission request UI
    if (window.WebRTCMedia && typeof window.WebRTCMedia.updatePermissionUI === 'function') {
        window.WebRTCMedia.updatePermissionUI('requesting');
    }
    
    const permissionRequest = document.getElementById('permissionRequest');
    if (permissionRequest) {
        permissionRequest.style.display = 'flex';
    }
    
    // Create temporary audio and video tracks to trigger browser permission prompt
    return navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        .then(stream => {
            // Stop all tracks immediately after getting permissions
            stream.getTracks().forEach(track => track.stop());
            
            // Update the UI
            if (window.WebRTCMedia && typeof window.WebRTCMedia.updatePermissionUI === 'function') {
                window.WebRTCMedia.updatePermissionUI('granted');
                
                // Hide permission dialog after delay
                setTimeout(() => {
                    const permissionRequest = document.getElementById('permissionRequest');
                    if (permissionRequest) {
                        permissionRequest.style.display = 'none';
                    }
                }, 1000);
            }
            
            return true;
        })
        .catch(error => {
            console.warn('Permission request failed:', error.name);
            
            // Update UI based on error type
            if (window.WebRTCMedia && typeof window.WebRTCMedia.updatePermissionUI === 'function') {
                if (error.name === 'NotAllowedError') {
                    window.WebRTCMedia.updatePermissionUI('denied');
                } else if (error.name === 'NotFoundError') {
                    window.WebRTCMedia.updatePermissionUI('notfound');
                } else if (error.name === 'NotReadableError') {
                    window.WebRTCMedia.updatePermissionUI('inuse');
                } else {
                    window.WebRTCMedia.updatePermissionUI('error', error.message);
                }
            }
            
            return false;
        });
}

// Get instructions for resetting permissions based on browser
function getResetPermissionInstructions() {
        const browserName = getBrowserName();
        
    let instructions = 'To reset permissions in your browser:\n\n';
        
        if (browserName === 'Chrome') {
        instructions += '1. Click the lock/info icon in the address bar\n' +
                        '2. Click "Site settings"\n' + 
                        '3. Change Camera and Microphone settings to "Allow"\n' +
                        '4. Reload the page';
        } else if (browserName === 'Firefox') {
        instructions += '1. Click the lock icon in the address bar\n' +
                        '2. Click the "x" next to "Use the Camera" and "Use the Microphone"\n' + 
                        '3. Reload the page and allow when prompted';
        } else if (browserName === 'Safari') {
        instructions += '1. Go to Safari menu > Preferences\n' +
                        '2. Select "Websites" tab\n' + 
                        '3. Select "Camera" and "Microphone" from the left sidebar\n' + 
                        '4. Find this website and change setting to "Allow"\n' +
                        '5. Reload the page';
    } else if (browserName === 'Edge') {
        instructions += '1. Click the lock/info icon in the address bar\n' +
                        '2. Click "Site permissions"\n' + 
                        '3. Change Camera and Microphone settings to "Allow"\n' +
                        '4. Reload the page';
    } else {
        instructions += '1. Check your browser settings for Camera and Microphone permissions\n' +
                        '2. Make sure this website is allowed to access your camera and microphone\n' +
                        '3. Reload the page after changing settings';
        }
        
        return instructions;
    }
    
// Export all functions
window.WebRTCCompatibility = {
    check: checkBrowserCompatibility,
    showWarning: showBrowserCompatibilityWarning,
    getBrowserName: getBrowserName,
    getBrowserVersion: getBrowserVersion,
    requestPermissions: forcePermissionRequest,
    getResetInstructions: getResetPermissionInstructions
}; 
