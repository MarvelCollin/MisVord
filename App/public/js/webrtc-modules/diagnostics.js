/**
 * WebRTC Diagnostics Module
 * Handles network testing, diagnostics, and performance optimization
 */

const WebRTCDiagnostics = {
    // Configuration properties
    config: {
        networkCheckInterval: 30000,    // 30 seconds between network checks
        bandwidthThreshold: 500,        // 500 kbps as low bandwidth threshold
        pingTimeout: 5000,              // 5 seconds ping timeout
        detectionSensitivity: 'medium', // Sensitivity for network detection
        debugMode: false                // Whether to output debug info
    },

    // Network status tracking
    networkStatus: {
        lastCheck: 0,
        isOnline: true,
        connectionType: null,
        effectiveBandwidth: null,
        latencies: {}
    },
    
    /**
     * Initialize the diagnostics module
     * @param {Object} config - Configuration options
     */
    init(config = {}) {
        // Merge provided config with defaults
        this.config = {...this.config, ...config};
        
        // Get network connection type if available
        if ('connection' in navigator) {
            this.networkStatus.connectionType = navigator.connection.effectiveType;
            
            // Listen to connection changes
            navigator.connection.addEventListener('change', () => {
                const oldType = this.networkStatus.connectionType;
                const newType = navigator.connection.effectiveType;
                this.networkStatus.connectionType = newType;
                
                if (this.config.debugMode) {
                    console.log(`[NETWORK] Connection type changed from ${oldType} to ${newType}`);
                }
                
                // Detect if we should apply optimizations based on network type
                if (newType === '2g' || newType === 'slow-2g') {
                    this.applyLowBandwidthOptimizations();
                }
            });
        }
        
        return this;
    },
    
    /**
     * Check the current network connectivity status
     * @returns {boolean} Whether the network appears online
     */
    checkNetworkConnectivity() {
        // Don't check too frequently
        const now = Date.now();
        if (now - this.networkStatus.lastCheck < 5000) {
            return this.networkStatus.isOnline;
        }
        
        this.networkStatus.lastCheck = now;
        
        // Use Navigator.onLine as primary check (not fully reliable but fast)
        const wasOnline = this.networkStatus.isOnline;
        this.networkStatus.isOnline = navigator.onLine;
        
        // If status changed from online to offline, notify
        if (wasOnline && !this.networkStatus.isOnline) {
            if (window.WebRTCUI) {
                window.WebRTCUI.addLogEntry("Network connection appears to be offline", 'error');
                window.WebRTCUI.showNetworkConnectivityAlert(
                    "Your internet connection appears to be offline. This will affect your video call."
                );
            } else {
                console.error("Network connection appears to be offline");
            }
        }
        
        // If changed from offline to online, check actual connectivity
        if (!wasOnline && this.networkStatus.isOnline) {
            this.testActualConnectivity();
        }
        
        return this.networkStatus.isOnline;
    },
    
    /**
     * Test actual connectivity by making a small network request
     * @returns {Promise<boolean>} Whether the network is truly connected
     */
    async testActualConnectivity() {
        try {
            // Fetch a tiny resource with cache busting to test connectivity
            const testUrl = `/favicon.ico?_=${Date.now()}`;
            const response = await fetch(testUrl, {
                method: 'HEAD',
                cache: 'no-cache',
                timeout: 3000
            });
            
            const isConnected = response.ok;
            
            if (window.WebRTCUI) {
                window.WebRTCUI.addLogEntry(
                    `Connectivity test result: ${isConnected ? 'Connected' : 'Failed'}`, 
                    isConnected ? 'success' : 'error'
                );
            }
            
            return isConnected;
        } catch (error) {
            if (window.WebRTCUI) {
                window.WebRTCUI.addLogEntry(`Connectivity test failed: ${error.message}`, 'error');
                window.WebRTCUI.showNetworkConnectivityAlert(
                    "Connection test failed. You may experience issues with your call."
                );
            }
            return false;
        }
    },
    
    /**
     * Test WebSocket connections specifically
     * @param {string} url - The WebSocket URL to test
     * @returns {Promise<object>} Results of the WebSocket test
     */
    testWebSocketConnection(url) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            let testSocket;
            
            try {
                testSocket = new WebSocket(url);
            } catch (e) {
                resolve({
                    success: false,
                    error: e.message,
                    time: 0
                });
                return;
            }
            
            // Set a timeout for the connection
            const timeout = setTimeout(() => {
                if (testSocket && testSocket.readyState !== WebSocket.OPEN) {
                    testSocket.close();
                    resolve({
                        success: false,
                        error: 'Connection timed out',
                        time: Date.now() - startTime
                    });
                }
            }, 5000);
            
            testSocket.onopen = () => {
                clearTimeout(timeout);
                const connectionTime = Date.now() - startTime;
                
                testSocket.close();
                resolve({
                    success: true,
                    error: null,
                    time: connectionTime
                });
            };
            
            testSocket.onerror = (event) => {
                clearTimeout(timeout);
                resolve({
                    success: false,
                    error: 'WebSocket error',
                    time: Date.now() - startTime,
                    event
                });
            };
        });
    },
    
    /**
     * Diagnose WebSocket issues with comprehensive tests
     * @param {string} socketUrl - The socket server URL
     * @param {string} socketPath - The socket server path
     * @param {string} envType - The environment type (local, staging, production)
     * @param {boolean} isSecurePage - Whether the page is loaded over HTTPS
     * @returns {Promise<object>} Comprehensive diagnostic results
     */
    async diagnoseWebSocketIssues(socketUrl, socketPath, envType, isSecurePage) {
        const results = {
            environment: {
                type: envType,
                isSecurePage,
                browser: navigator.userAgent,
                timestamp: new Date().toISOString()
            },
            tests: {},
            recommendations: []
        };
        
        // Log start of diagnostics
        if (window.WebRTCUI) {
            window.WebRTCUI.addLogEntry(`Starting WebSocket diagnostics for ${socketUrl}${socketPath}`, 'system');
        }
        
        // Check basic online status
        results.tests.navigatorOnline = navigator.onLine;
        
        // Construct WebSocket URL early for use throughout the function
        const wsProtocol = isSecurePage ? 'wss:' : 'ws:';
        let wsUrl;
        
        try {
            const urlObject = new URL(socketUrl);
            wsUrl = `${wsProtocol}//${urlObject.host}${socketPath || ''}`;
        } catch (e) {
            wsUrl = null;
            results.tests.urlParsing = {
                success: false,
                error: e.message
            };
        }
        
        // Test direct WebSocket connection if URL parsing succeeded
        if (wsUrl) {
            results.tests.directWebSocket = await this.testWebSocketConnection(wsUrl);
            
            // If direct WebSocket failed but we're on HTTPS, try secure WebSocket explicitly
            if (!results.tests.directWebSocket.success && isSecurePage) {
                const wssUrl = wsUrl.replace('ws:', 'wss:');
                results.tests.secureWebSocket = await this.testWebSocketConnection(wssUrl);
            }
        }
        
        // Test XHR connectivity to verify basic HTTP works
        try {
            const fetchStart = Date.now();
            const response = await fetch(`${socketUrl}/socket.io/`, { 
                method: 'HEAD', 
                cache: 'no-cache' 
            });
            results.tests.httpConnectivity = {
                success: response.ok,
                status: response.status,
                time: Date.now() - fetchStart
            };
        } catch (e) {
            results.tests.httpConnectivity = {
                success: false,
                error: e.message
            };
        }
        
        // Generate recommendations based on test results
        if (!results.tests.navigatorOnline) {
            results.recommendations.push('Your device reports no internet connection. Check your network connection.');
        }
        
        if (results.tests.directWebSocket && !results.tests.directWebSocket.success) {
            if (isSecurePage && !wsUrl.startsWith('wss:')) {
                results.recommendations.push('Secure pages require secure WebSocket connections (wss://). Try using a secure WebSocket URL.');
            }
            
            if (results.tests.httpConnectivity && results.tests.httpConnectivity.success) {
                results.recommendations.push('HTTP works but WebSocket fails. This could indicate a proxy or firewall issue blocking WebSocket connections.');
            }
        }
        
        // Log completion
        if (window.WebRTCUI) {
            window.WebRTCUI.addLogEntry('WebSocket diagnostics completed', 'success');
            
            if (results.recommendations.length > 0) {
                window.WebRTCUI.addLogEntry(`Recommendations: ${results.recommendations.join(' ')}`, 'info');
            }
        }
        
        return results;
    },
    
    /**
     * Detect network conditions and optimize for them
     * @returns {Object} Information about detected network conditions
     */
    detectNetworkConditions() {
        const conditions = {
            isMobile: /iPhone|iPad|iPod|Android|webOS|BlackBerry|Windows Phone/i.test(navigator.userAgent),
            isLowBandwidth: false,
            estimatedBandwidth: null,
            latency: null,
            connectionType: null
        };
        
        // Check for Network Information API support
        if ('connection' in navigator) {
            const connection = navigator.connection;
            conditions.connectionType = connection.effectiveType;
            conditions.isLowBandwidth = connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g';
            conditions.downlink = connection.downlink; // Mbps
            
            // Apply optimizations for mobile connections
            if (conditions.isMobile) {
                this.applyMobileOptimizations();
            }
            
            // Apply optimizations for low bandwidth
            if (conditions.isLowBandwidth) {
                this.applyLowBandwidthOptimizations();
            }
        }
        
        return conditions;
    },
    
    /**
     * Estimate available bandwidth
     * This is a simplified implementation - for accurate results,
     * consider using specialized bandwidth estimation libraries
     */
    async estimateBandwidth() {
        try {
            const startTime = Date.now();
            // Fetch a moderate-sized file to estimate bandwidth
            // Adjust the URL to point to an appropriate test file in your application
            const response = await fetch('/assets/bandwidth-test.jpg?_=' + startTime, { cache: 'no-cache' });
            const reader = response.body.getReader();
            
            let bytesReceived = 0;
            
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;
                bytesReceived += value.length;
            }
            
            const endTime = Date.now();
            const durationSeconds = (endTime - startTime) / 1000;
            const bandwidth = (bytesReceived / durationSeconds) / 1024; // kB/s
            
            this.networkStatus.effectiveBandwidth = bandwidth;
            
            if (bandwidth < this.config.bandwidthThreshold) {
                this.applyLowBandwidthOptimizations();
            }
            
            return bandwidth;
            
        } catch (error) {
            console.error('Error estimating bandwidth:', error);
            return null;
        }
    },
    
    /**
     * Apply optimizations for mobile devices
     */
    applyMobileOptimizations() {
        // Log the application of mobile optimizations
        if (window.WebRTCUI) {
            window.WebRTCUI.addLogEntry('Applying mobile device optimizations', 'system');
        }
        
        // Adjust media constraints for mobile
        if (window.WebRTCMedia) {
            // Suggest lower video resolution for mobile devices
            window.WebRTCMedia.setVideoConstraints({
                width: { ideal: 640 },
                height: { ideal: 360 },
                frameRate: { max: 15 }
            });
        }
        
        // Adjust UI for mobile if necessary
        // Add mobile-specific CSS class to body for responsive adjustments
        document.body.classList.add('mobile-device');
    },
    
    /**
     * Apply optimizations for low bandwidth conditions
     */
    applyLowBandwidthOptimizations() {
        if (window.WebRTCUI) {
            window.WebRTCUI.addLogEntry('Applying low bandwidth optimizations', 'system');
            window.WebRTCUI.showLowBandwidthWarning();
        }
        
        // Reduce video quality to preserve call
        if (window.WebRTCMedia) {
            // Set lower video constraints
            window.WebRTCMedia.setVideoConstraints({
                width: { ideal: 320 },
                height: { ideal: 240 },
                frameRate: { max: 10 }
            });
            
            // Reduce bandwidth usage for all peer connections
            if (window.WebRTCPeerConnection) {
                window.WebRTCPeerConnection.setMaxBitrate(150); // 150 kbps
            }
        }
        
        // Disable screen sharing option if UI manager exists
        const toggleScreenBtn = document.getElementById('toggleScreenBtn');
        if (toggleScreenBtn) {
            toggleScreenBtn.disabled = true;
            toggleScreenBtn.title = 'Screen sharing disabled due to low bandwidth';
            toggleScreenBtn.classList.add('opacity-50');
        }
    }
};

// Export the diagnostics module
window.WebRTCDiagnostics = WebRTCDiagnostics; 