/**
 * WebRTC Connection Diagnostics Module
 * Provides advanced diagnostic tools for WebRTC connection issues
 */

window.WebRTCDiagnostics = window.WebRTCDiagnostics || {};

/**
 * Initialize the diagnostics module
 * @param {Object} config - Configuration options
 */
window.WebRTCDiagnostics.init = function(config = {}) {
    this.config = {
        debugMode: config.debugMode || false,
        logToConsole: config.logToConsole || true
    };
    
    console.log('[WebRTC Diagnostics] Module initialized');
    return this;
};

/**
 * Run a complete connection diagnostic test
 * @param {Function} callback - Function to call with results
 */
window.WebRTCDiagnostics.runDiagnostics = function(callback) {
    const results = {
        browser: this.checkBrowserSupport(),
        network: this.checkNetworkConnection(),
        security: this.checkSecurityContext(),
        permissions: this.checkMediaPermissions(),
        socketConnection: { status: 'pending' }
    };
    
    // Test socket connection
    this.testSocketConnection((socketResult) => {
        results.socketConnection = socketResult;
        if (callback) callback(results);
    });
    
    return results;
};

/**
 * Check if WebRTC is fully supported in this browser
 */
window.WebRTCDiagnostics.checkBrowserSupport = function() {
    const result = {
        supported: true,
        issues: []
    };
    
    // Check for required WebRTC APIs
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        result.supported = false;
        result.issues.push('MediaDevices API not supported');
    }
    
    if (!window.RTCPeerConnection) {
        result.supported = false;
        result.issues.push('RTCPeerConnection not supported');
    }
    
    // Check browser info
    const userAgent = navigator.userAgent;
    if (userAgent.match(/edg/i)) {
        result.browser = 'Edge';
    } else if (userAgent.match(/chrome|chromium|crios/i)) {
        result.browser = 'Chrome';
    } else if (userAgent.match(/firefox|fxios/i)) {
        result.browser = 'Firefox';
    } else if (userAgent.match(/safari/i)) {
        result.browser = 'Safari';
    } else if (userAgent.match(/opr\//i)) {
        result.browser = 'Opera';
    } else if (userAgent.match(/msie|trident/i)) {
        result.browser = 'Internet Explorer';
        result.supported = false;
        result.issues.push('Internet Explorer does not support WebRTC');
    } else {
        result.browser = 'Unknown';
    }
    
    // Check for mobile browsers with limitations
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
        result.isMobile = true;
        result.issues.push('Mobile browser detected - limited WebRTC performance');
        
        // iOS Safari has specific limitations
        if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
            result.issues.push('iOS Safari has media autoplay restrictions');
        }
    }
    
    return result;
};

/**
 * Check if we have a secure context (required for WebRTC)
 */
window.WebRTCDiagnostics.checkSecurityContext = function() {
    const result = {
        secure: true,
        issues: []
    };
    
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
                       
    if (!isLocalhost && window.location.protocol !== 'https:') {
        result.secure = false;
        result.issues.push('WebRTC requires HTTPS except on localhost');
    }
    
    return result;
};

/**
 * Check for network issues
 */
window.WebRTCDiagnostics.checkNetworkConnection = function() {
    const result = {
        connected: navigator.onLine,
        issues: []
    };
    
    if (!navigator.onLine) {
        result.issues.push('Device is offline');
    }
    
    // Check connection type if available
    if (navigator.connection) {
        result.connectionType = navigator.connection.effectiveType || navigator.connection.type;
        
        if (navigator.connection.saveData) {
            result.issues.push('Data saver mode is enabled');
        }
        
        if (result.connectionType === '2g' || result.connectionType === 'slow-2g') {
            result.issues.push('Connection is very slow (2G)');
        }
    }
    
    return result;
};

/**
 * Check media device permissions
 */
window.WebRTCDiagnostics.checkMediaPermissions = function() {
    const result = {
        camera: 'unknown',
        microphone: 'unknown',
        issues: []
    };
    
    // Use Permissions API if available
    if (navigator.permissions) {
        navigator.permissions.query({ name: 'camera' })
            .then(status => {
                result.camera = status.state;
                if (status.state === 'denied') {
                    result.issues.push('Camera permission denied');
                }
            })
            .catch(err => {
                result.issues.push(`Camera permission check error: ${err.message}`);
            });
            
        navigator.permissions.query({ name: 'microphone' })
            .then(status => {
                result.microphone = status.state;
                if (status.state === 'denied') {
                    result.issues.push('Microphone permission denied');
                }
            })
            .catch(err => {
                result.issues.push(`Microphone permission check error: ${err.message}`);
            });
    }
    
    return result;
};

/**
 * Test socket connection
 * @param {Function} callback - Function to call with result
 */
window.WebRTCDiagnostics.testSocketConnection = function(callback) {
    const result = {
        status: 'testing',
        issues: []
    };
    
    if (!window.WebRTCConfig) {
        result.status = 'failed';
        result.issues.push('WebRTCConfig not available');
        if (callback) callback(result);
        return result;
    }
    
    const socketUrl = window.WebRTCConfig.getSocketUrl();
    const socketOptions = window.WebRTCConfig.getSocketOptions();
    
    console.log(`[WebRTC Diagnostics] Testing socket connection to: ${socketUrl}`);
    
    try {
        const testSocket = io(socketUrl, {
            ...socketOptions,
            timeout: 5000,
            forceNew: true
        });
        
        // Set timeout for connection
        const connectionTimeout = setTimeout(() => {
            result.status = 'timeout';
            result.issues.push('Connection timed out after 5 seconds');
            testSocket.disconnect();
            if (callback) callback(result);
        }, 5000);
        
        testSocket.on('connect', () => {
            clearTimeout(connectionTimeout);
            result.status = 'connected';
            result.socketId = testSocket.id;
            result.transport = testSocket.io.engine.transport.name;
            console.log(`[WebRTC Diagnostics] Socket connected: ${result.socketId} using ${result.transport}`);
            
            // Disconnect after successful test
            setTimeout(() => {
                testSocket.disconnect();
                if (callback) callback(result);
            }, 500);
        });
        
        testSocket.on('connect_error', (error) => {
            clearTimeout(connectionTimeout);
            result.status = 'error';
            result.issues.push(`Connection error: ${error.message}`);
            console.error(`[WebRTC Diagnostics] Socket connection error: ${error.message}`);
            testSocket.disconnect();
            if (callback) callback(result);
        });
        
    } catch (error) {
        result.status = 'error';
        result.issues.push(`Socket initialization error: ${error.message}`);
        console.error(`[WebRTC Diagnostics] Socket test failed: ${error.message}`);
        if (callback) callback(result);
    }
    
    return result;
};

/**
 * Display diagnostic results on the page
 */
window.WebRTCDiagnostics.displayResults = function(targetElement) {
    const element = typeof targetElement === 'string' ? 
        document.getElementById(targetElement) : targetElement;
    
    if (!element) {
        console.error('[WebRTC Diagnostics] Target element not found');
        return;
    }
    
    element.innerHTML = '<h3>WebRTC Connection Diagnostics</h3><div id="diagResults">Running tests...</div>';
    const resultsElement = document.getElementById('diagResults');
    
    this.runDiagnostics(results => {
        let html = '<div class="diag-results">';
        
        // Browser support
        html += `<div class="diag-section">
            <h4>Browser Support: ${results.browser.supported ? '✅' : '❌'}</h4>
            <p>Browser: ${results.browser.browser}${results.browser.isMobile ? ' (Mobile)' : ''}</p>
            ${results.browser.issues.length > 0 ? 
                `<ul class="issues">${results.browser.issues.map(issue => `<li>${issue}</li>`).join('')}</ul>` : 
                '<p>No browser compatibility issues</p>'}
        </div>`;
        
        // Security context
        html += `<div class="diag-section">
            <h4>Security Context: ${results.security.secure ? '✅' : '❌'}</h4>
            ${results.security.issues.length > 0 ? 
                `<ul class="issues">${results.security.issues.map(issue => `<li>${issue}</li>`).join('')}</ul>` : 
                '<p>Secure context verified</p>'}
        </div>`;
        
        // Network connection
        html += `<div class="diag-section">
            <h4>Network Connection: ${results.network.connected ? '✅' : '❌'}</h4>
            ${results.network.connectionType ? `<p>Connection type: ${results.network.connectionType}</p>` : ''}
            ${results.network.issues.length > 0 ? 
                `<ul class="issues">${results.network.issues.map(issue => `<li>${issue}</li>`).join('')}</ul>` : 
                '<p>Network connection looks good</p>'}
        </div>`;
        
        // Socket connection
        const socketStatus = {
            'connected': '✅',
            'error': '❌',
            'timeout': '⚠️',
            'pending': '⏳'
        };
        
        html += `<div class="diag-section">
            <h4>Socket Connection: ${socketStatus[results.socketConnection.status] || '❓'}</h4>
            ${results.socketConnection.socketId ? `<p>Connected with ID: ${results.socketConnection.socketId}</p>` : ''}
            ${results.socketConnection.transport ? `<p>Transport: ${results.socketConnection.transport}</p>` : ''}
            ${results.socketConnection.issues && results.socketConnection.issues.length > 0 ? 
                `<ul class="issues">${results.socketConnection.issues.map(issue => `<li>${issue}</li>`).join('')}</ul>` : 
                results.socketConnection.status === 'connected' ? '<p>Socket connection successful</p>' : ''}
        </div>`;
        
        html += '</div>';
        resultsElement.innerHTML = html;
    });
}; 