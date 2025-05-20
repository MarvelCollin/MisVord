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
     * Diagnose WebSocket connectivity issues
     * Identifies and reports potential connection problems
     * @returns {Promise<Object>} Diagnosis results
     */
    async diagnoseWebSocketIssues() {
        const results = {
            errors: [],
            warnings: [],
            success: [],
            details: {}
        };
        
        try {
            // Determine the socket connection URL
            const protocolMap = {
                'http:': 'ws://',
                'https:': 'wss://'
            };
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            
            // Generate all URLs to test
            const urlsToTest = [];
            
            if (isLocalhost) {
                // For localhost: Test both direct port and pathname
                const wsProto = protocolMap[window.location.protocol] || 'ws://';
                urlsToTest.push({
                    url: `${wsProto}localhost:1001/socket.io/?EIO=4&transport=websocket`,
                    desc: 'App port (1001)'
                });
                urlsToTest.push({
                    url: `${wsProto}localhost:1002/socket.io/?EIO=4&transport=websocket`,
                    desc: 'Socket port (1002)'
                });
            } else {
                // For production/VPS
                const wsProto = protocolMap[window.location.protocol] || 'wss://';
                const host = window.location.host;
                
                // Check if we're in a subdirectory deployment
                const pathParts = window.location.pathname.split('/');
                const isSubpathDeployment = pathParts.length > 1 && pathParts[1].length > 0;
                const subpath = isSubpathDeployment ? pathParts[1] : 'misvord';
                
                // Test default path
                urlsToTest.push({
                    url: `${wsProto}${host}/socket.io/?EIO=4&transport=websocket`,
                    desc: 'Root path'
                });
                
                // Test subpath
                urlsToTest.push({
                    url: `${wsProto}${host}/${subpath}/socket/socket.io/?EIO=4&transport=websocket`,
                    desc: 'Subpath with socket'
                });
            }
            
            // Record environment information
            results.details.environment = {
                hostname: window.location.hostname,
                protocol: window.location.protocol,
                port: window.location.port,
                pathname: window.location.pathname,
                isLocalhost,
                urlsToTest
            };
            
            // Test each URL
            const testPromises = urlsToTest.map(async (testConfig) => {
                const result = await this.testWebSocketConnection(testConfig.url);
                return {
                    ...result,
                    url: testConfig.url,
                    desc: testConfig.desc
                };
            });
            
            results.details.connectionTests = await Promise.all(testPromises);
            
            // Check results
            const anySuccessful = results.details.connectionTests.some(test => test.success);
            
            if (anySuccessful) {
                // At least one connection worked
                results.success.push('WebSocket connection successful on at least one endpoint');
                
                const workingUrls = results.details.connectionTests
                    .filter(test => test.success)
                    .map(test => test.desc);
                
                results.details.workingEndpoints = workingUrls;
            } else {
                // All connections failed
                results.errors.push('WebSocket connection failed on all tested endpoints');
                
                // Add specific error details
                results.details.connectionTests.forEach(test => {
                    if (test.error === 'WebSocket error') {
                        results.errors.push(`Connection to ${test.desc} failed with a WebSocket error`);
                    } else if (test.error === 'Connection timed out') {
                        results.errors.push(`Connection to ${test.desc} timed out`);
                    }
                });
                
                // Check for common issues
                if (isLocalhost) {
                    results.warnings.push('When using localhost, make sure the socket server is running on port 1002');
                    results.warnings.push('Try using direct port URLs for localhost: ws://localhost:1002/socket.io/');
                } else {
                    results.warnings.push('For production deployments, check your NGINX/proxy configuration');
                    results.warnings.push('Ensure WebSocket upgrade headers are properly configured in your proxy');
                    results.warnings.push('Verify the namespace path matches between client and server configuration');
                }
            }
            
            // Check Socket.IO library
            if (typeof io === 'undefined') {
                results.errors.push('Socket.IO library is not loaded');
            } else {
                results.success.push('Socket.IO library is properly loaded');
            }
            
            return results;
        } catch (e) {
            results.errors.push(`Error during diagnosis: ${e.message}`);
            return results;
        }
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