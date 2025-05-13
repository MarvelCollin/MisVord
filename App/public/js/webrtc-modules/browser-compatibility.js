/**
 * WebRTC Browser Compatibility Module
 * Handles browser feature detection and compatibility warnings
 */

// Check browser compatibility and permission status
function checkBrowserCompatibility() {
    const browserInfo = {
        name: getBrowserName(),
        isCompatible: true,
        issues: []
    };
    
    // WebRTC API checks
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        browserInfo.isCompatible = false;
        browserInfo.issues.push('WebRTC API not supported');
    }
    
    if (!window.RTCPeerConnection) {
        browserInfo.isCompatible = false;
        browserInfo.issues.push('RTCPeerConnection not supported');
    }
    
    // Detect problematic browsers or versions
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
    
    return browserInfo;
}

// Helper to detect browser name
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

// Helper to get browser version
function getBrowserVersion() {
    const userAgent = navigator.userAgent;
    let version = "Unknown";
    
    // Extract version for common browsers
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

// Function to show browser compatibility warnings
function showBrowserCompatibilityWarning(browserInfo) {
    // Create warning UI
    const warningEl = document.createElement('div');
    warningEl.className = 'fixed top-4 left-4 right-4 bg-yellow-600 text-white p-4 rounded shadow-lg z-50';
    
    let message = `<h3 class="text-lg font-bold mb-2">Browser Compatibility Warning</h3>`;
    
    if (!browserInfo.isCompatible) {
        message += `<p class="mb-2">Your browser (${browserInfo.name}) does not fully support WebRTC.</p>`;
    } else if (browserInfo.issues.length > 0) {
        message += `<p class="mb-2">Your browser (${browserInfo.name}) has limited WebRTC support:</p>`;
    }
    
    if (browserInfo.issues.length > 0) {
        message += '<ul class="list-disc pl-5 mb-2">';
        browserInfo.issues.forEach(issue => {
            message += `<li>${issue}</li>`;
        });
        message += '</ul>';
    }
    
    message += `<p class="mt-2">For best results, please use the latest version of Chrome, Firefox, or Safari.</p>`;
    
    // Add dismiss button
    message += `<button id="dismiss-compat-warning" class="mt-2 px-3 py-1 bg-white text-yellow-700 rounded hover:bg-gray-100">Dismiss</button>`;
    
    warningEl.innerHTML = message;
    document.body.appendChild(warningEl);
    
    // Add dismiss functionality
    setTimeout(() => {
        const dismissBtn = document.getElementById('dismiss-compat-warning');
        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => {
                warningEl.style.display = 'none';
            });
        }
    }, 100);
}

// Export functions for use in the main module
window.WebRTCCompat = {
    check: checkBrowserCompatibility,
    showWarning: showBrowserCompatibilityWarning
}; 