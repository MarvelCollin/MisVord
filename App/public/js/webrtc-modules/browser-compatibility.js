function checkBrowserCompatibility() {
    const browserInfo = {
        name: getBrowserName(),
        version: getBrowserVersion(),
        isCompatible: true,
        issues: [],
        permissions: {
            camera: 'unknown',
            microphone: 'unknown'
        }
    };
    
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        browserInfo.isCompatible = false;
        browserInfo.issues.push('WebRTC API not supported');
    }
    
    if (!window.RTCPeerConnection) {
        browserInfo.isCompatible = false;
        browserInfo.issues.push('RTCPeerConnection not supported');
    }
    
    
    if (browserInfo.name === 'Safari' && parseInt(getBrowserVersion()) < 13) {
        browserInfo.issues.push('Safari < 13 has limited WebRTC support');
    }
    
    if (browserInfo.name === 'Firefox' && parseInt(getBrowserVersion()) < 60) {
        browserInfo.issues.push('Firefox < 60 has outdated WebRTC support');
    }
    
    if (browserInfo.name === 'Internet Explorer') {
        browserInfo.isCompatible = false;
        browserInfo.issues.push('Internet Explorer does not support WebRTC');
    }
    
    // Check for insecure context
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        browserInfo.issues.push('WebRTC works best in secure contexts (HTTPS)');
    }
    
    // Check permissions if available in this browser
    if (navigator.permissions && navigator.permissions.query) {
        // Check camera permission
        navigator.permissions.query({ name: 'camera' })
            .then(permissionStatus => {
                browserInfo.permissions.camera = permissionStatus.state;
                
                // Listen for permission changes
                permissionStatus.onchange = () => {
                    console.log('Camera permission changed to:', permissionStatus.state);
                    
                    // Refresh if permissions are now granted
                    if (permissionStatus.state === 'granted' && 
                        (browserInfo.permissions.camera !== 'granted' || 
                         browserInfo.permissions.microphone !== 'granted')) {
                        window.location.reload();
                    }
                    
                    browserInfo.permissions.camera = permissionStatus.state;
                };
            })
            .catch(err => {
                console.warn('Could not query camera permission:', err);
                browserInfo.permissions.camera = 'error';
            });
            
        // Check microphone permission
        navigator.permissions.query({ name: 'microphone' })
            .then(permissionStatus => {
                browserInfo.permissions.microphone = permissionStatus.state;
                
                // Listen for permission changes
                permissionStatus.onchange = () => {
                    console.log('Microphone permission changed to:', permissionStatus.state);
                    
                    // Refresh if permissions are now granted
                    if (permissionStatus.state === 'granted' && 
                        (browserInfo.permissions.camera !== 'granted' || 
                         browserInfo.permissions.microphone !== 'granted')) {
                        window.location.reload();
                    }
                    
                    browserInfo.permissions.microphone = permissionStatus.state;
                };
            })
            .catch(err => {
                console.warn('Could not query microphone permission:', err);
                browserInfo.permissions.microphone = 'error';
            });
    }
    
    return browserInfo;
}


function getBrowserName() {
    const userAgent = navigator.userAgent;
    let browserName;
    
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
    } else if (userAgent.match(/msie|trident/i)) {
        browserName = "Internet Explorer";
    } else {
        browserName = "Unknown";
    }
    
    return browserName;
}


function getBrowserVersion() {
    const userAgent = navigator.userAgent;
    let version = "Unknown";
    
    
    if (userAgent.match(/chrome|chromium|crios/i)) {
        version = userAgent.match(/(?:chrome|chromium|crios)\/([\d.]+)/i)[1];
    } else if (userAgent.match(/firefox|fxios/i)) {
        version = userAgent.match(/(?:firefox|fxios)\/([\d.]+)/i)[1];
    } else if (userAgent.match(/safari/i)) {
        version = userAgent.match(/version\/([\d.]+)/i)[1];
    } else if (userAgent.match(/opr\//i)) {
        version = userAgent.match(/opr\/([\d.]+)/i)[1];
    } else if (userAgent.match(/edg/i)) {
        version = userAgent.match(/edg\/([\d.]+)/i)[1];
    }
    
    return version;
}


function showBrowserCompatibilityWarning(browserInfo) {
    
    const warningEl = document.createElement('div');
    warningEl.className = 'fixed top-4 left-4 right-4 bg-yellow-600 text-white p-4 rounded shadow-lg z-50';
    
    let message = `<h3 class="text-lg font-bold mb-2">Browser Compatibility Warning</h3>`;
    
    if (!browserInfo.isCompatible) {
        message += `<p class="mb-2">Your browser (${browserInfo.name} ${browserInfo.version}) does not fully support WebRTC.</p>`;
    } else if (browserInfo.issues.length > 0) {
        message += `<p class="mb-2">Your browser (${browserInfo.name} ${browserInfo.version}) has limited WebRTC support:</p>`;
    }
    
    if (browserInfo.issues.length > 0) {
        message += '<ul class="list-disc pl-5 mb-2">';
        browserInfo.issues.forEach(issue => {
            message += `<li>${issue}</li>`;
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
    </div>`;
    
    warningEl.innerHTML = message;
    document.body.appendChild(warningEl);
    
    
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
    }, 100);
}

// Force permission request function
function forcePermissionRequest() {
    // Create temporary audio and video tracks to trigger browser permission prompt
    return navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        .then(stream => {
            // Stop all tracks immediately after getting permissions
            stream.getTracks().forEach(track => track.stop());
            return true;
        })
        .catch(error => {
            console.warn('Permission request failed:', error.name);
            return false;
        });
}

// Reset permissions in supported browsers
function resetPermissions() {
    if (navigator.permissions) {
        // Unfortunately, we can't programmatically reset permissions
        // but we can inform the user how to do it
        const browserName = getBrowserName();
        
        let instructions = 'Please reset permissions in your browser settings:';
        
        if (browserName === 'Chrome') {
            instructions += '\n1. Click the lock/info icon in the address bar\n2. Site settings\n3. Reset permissions';
        } else if (browserName === 'Firefox') {
            instructions += '\n1. Click the lock icon in the address bar\n2. Clear permissions';
        } else if (browserName === 'Safari') {
            instructions += '\n1. Safari Preferences > Websites > Camera/Microphone\n2. Change permission for this site';
        }
        
        return instructions;
    }
    
    return 'Cannot reset permissions programmatically';
}

window.WebRTCCompat = {
    check: checkBrowserCompatibility,
    showWarning: showBrowserCompatibilityWarning,
    forceRequest: forcePermissionRequest,
    resetPermissions: resetPermissions
}; 
