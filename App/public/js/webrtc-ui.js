/**
 * WebRTC UI and Utilities Module
 * Consolidated UI management, debugging, monitoring, and utility functions
 * Combines: ui-manager, connection-monitor, diagnostics, video-handling, ping-system, and other utilities
 */

// =====================================
// UI MANAGEMENT AND LOGGING
// =====================================

// UI state and logging
let logEntries = [];
const MAX_LOG_ENTRIES = 100;

// UI Manager namespace
window.WebRTCUI = {
    /**
     * Add a log entry
     */
    addLogEntry: function(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const entry = {
            timestamp: timestamp,
            message: message,
            type: type
        };
        
        // Add to log entries array
        logEntries.unshift(entry);
        if (logEntries.length > MAX_LOG_ENTRIES) {
            logEntries.pop();
        }
        
        // Console output with color coding
        const styles = {
            error: 'color: #ff6b6b; font-weight: bold;',
            warn: 'color: #ffa726; font-weight: bold;',
            success: 'color: #66bb6a; font-weight: bold;',
            info: 'color: #42a5f5;',
            system: 'color: #ab47bc; font-weight: bold;',
            socket: 'color: #26c6da; font-weight: bold;'
        };
        
        console.log(`%c[WebRTC ${type.toUpperCase()}] ${timestamp}: ${message}`, 
                   styles[type] || styles.info);
        
        // Update UI log display if available
        this.updateLogDisplay();
    },
    
    /**
     * Update log display in UI
     */
    updateLogDisplay: function() {
        const logContainer = document.getElementById('debugLog') || 
                           document.getElementById('logContainer');
        
        if (logContainer) {
            const logHtml = logEntries.slice(0, 20).map(entry => 
                `<div class="log-entry log-${entry.type}">
                    <span class="log-time">${entry.timestamp}</span>
                    <span class="log-message">${entry.message}</span>
                </div>`
            ).join('');
            
            logContainer.innerHTML = logHtml;
        }
    },
    
    /**
     * Update connection status
     */
    updateConnectionStatus: function(status, type = 'info') {
        console.log(`[WebRTC UI] Status: ${status} (${type})`);
        
        // Update status elements
        const statusElements = document.querySelectorAll('.connection-status, .status-display');
        statusElements.forEach(el => {
            el.textContent = status;
            el.className = el.className.replace(/\b(info|success|error|warning|connecting)\b/g, '');
            el.classList.add(type);
        });
        
        // Update permission status specifically
        const permissionStatus = document.getElementById('permissionStatus');
        if (permissionStatus) {
            permissionStatus.innerHTML = status;
            permissionStatus.className = `p-3 rounded mb-4 text-center ${this.getStatusClass(type)}`;
        }
        
        // Add to log
        this.addLogEntry(status, type);
    },
    
    /**
     * Get CSS class for status type
     */
    getStatusClass: function(type) {
        const classes = {
            info: 'bg-blue-700 text-white',
            success: 'bg-green-700 text-white',
            error: 'bg-red-700 text-white',
            warning: 'bg-yellow-700 text-white',
            connecting: 'bg-gray-700 text-yellow-300'
        };
        return classes[type] || classes.info;
    },
    
    /**
     * Show notification
     */
    showNotification: function(message, type = 'info', duration = 5000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type} fixed top-4 right-4 p-4 rounded shadow-lg z-50 max-w-sm`;
        notification.style.backgroundColor = type === 'error' ? '#ef4444' : 
                                           type === 'success' ? '#10b981' : 
                                           type === 'warning' ? '#f59e0b' : '#3b82f6';
        notification.style.color = 'white';
        notification.innerHTML = `
            <div class="flex items-center">
                <span class="flex-1">${message}</span>
                <button class="ml-2 text-white hover:text-gray-200">&times;</button>
            </div>
        `;
        
        // Add close functionality
        notification.querySelector('button').addEventListener('click', () => {
            notification.remove();
        });
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto-remove after duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);
    },
    
    /**
     * Update participant list
     */
    updateParticipantsList: function(participants) {
        const participantsList = document.getElementById('participantsList');
        if (!participantsList) return;
        
        if (!participants || participants.length === 0) {
            participantsList.innerHTML = '<div class="text-gray-400">No other participants</div>';
            return;
        }
        
        const participantsHtml = participants.map(participant => `
            <div class="participant-item p-2 bg-gray-700 rounded mb-2">
                <div class="font-medium">${participant.userName}</div>
                <div class="text-sm text-gray-400">ID: ${participant.socketId.slice(-8)}</div>
            </div>
        `).join('');
        
        participantsList.innerHTML = participantsHtml;
    }
};

// =====================================
// CONNECTION MONITORING
// =====================================

// Connection monitoring state
let connectionMonitor = {
    isMonitoring: false,
    stats: {
        packetsLost: 0,
        packetsReceived: 0,
        bytesReceived: 0,
        bytesSent: 0,
        roundTripTime: 0
    },
    intervals: []
};

window.WebRTCMonitor = {
    /**
     * Start connection monitoring
     */
    startMonitoring: function() {
        if (connectionMonitor.isMonitoring) return;
        
        console.log('[WebRTC Monitor] Starting connection monitoring');
        connectionMonitor.isMonitoring = true;
        
        // Monitor socket connection
        this.monitorSocketConnection();
        
        // Monitor peer connections
        this.monitorPeerConnections();
        
        // Monitor network quality
        this.monitorNetworkQuality();
    },
    
    /**
     * Stop connection monitoring
     */
    stopMonitoring: function() {
        console.log('[WebRTC Monitor] Stopping connection monitoring');
        connectionMonitor.isMonitoring = false;
        
        // Clear all intervals
        connectionMonitor.intervals.forEach(interval => clearInterval(interval));
        connectionMonitor.intervals = [];
    },
    
    /**
     * Monitor socket connection
     */
    monitorSocketConnection: function() {
        const interval = setInterval(() => {
            if (!window.socket) return;
            
            const isConnected = window.socket.connected;
            const transport = window.socket.io?.engine?.transport?.name || 'unknown';
            
            // Update debug info if available
            this.updateDebugInfo('socket', {
                connected: isConnected,
                transport: transport,
                id: window.socket.id
            });
            
            // Check for disconnection
            if (!isConnected && connectionMonitor.isMonitoring) {
                window.WebRTCUI.addLogEntry('Socket disconnected, attempting reconnection', 'warn');
                this.retryConnection();
            }
            
        }, 5000); // Check every 5 seconds
        
        connectionMonitor.intervals.push(interval);
    },
    
    /**
     * Monitor peer connections
     */
    monitorPeerConnections: function() {
        const interval = setInterval(async () => {
            if (!window.WebRTCPeerConnection?.peers) return;
            
            for (const [peerId, peer] of Object.entries(window.WebRTCPeerConnection.peers)) {
                if (peer.connection) {
                    try {
                        const stats = await peer.connection.getStats();
                        this.processPeerStats(peerId, stats);
                    } catch (error) {
                        console.warn(`[WebRTC Monitor] Failed to get stats for peer ${peerId}:`, error);
                    }
                }
            }
        }, 10000); // Check every 10 seconds
        
        connectionMonitor.intervals.push(interval);
    },
    
    /**
     * Process peer connection statistics
     */
    processPeerStats: function(peerId, stats) {
        let inboundStats = null;
        let outboundStats = null;
        
        stats.forEach(report => {
            if (report.type === 'inbound-rtp' && report.kind === 'video') {
                inboundStats = report;
            } else if (report.type === 'outbound-rtp' && report.kind === 'video') {
                outboundStats = report;
            }
        });
        
        if (inboundStats) {
            connectionMonitor.stats.packetsReceived = inboundStats.packetsReceived || 0;
            connectionMonitor.stats.packetsLost = inboundStats.packetsLost || 0;
            connectionMonitor.stats.bytesReceived = inboundStats.bytesReceived || 0;
        }
        
        if (outboundStats) {
            connectionMonitor.stats.bytesSent = outboundStats.bytesSent || 0;
        }
        
        // Update UI if available
        this.updateStatsDisplay();
    },
    
    /**
     * Monitor network quality
     */
    monitorNetworkQuality: function() {
        const interval = setInterval(() => {
            // Simple network quality assessment
            const packetLossRate = connectionMonitor.stats.packetsReceived > 0 ? 
                (connectionMonitor.stats.packetsLost / connectionMonitor.stats.packetsReceived) * 100 : 0;
            
            let quality = 'Good';
            let qualityClass = 'text-green-400';
            
            if (packetLossRate > 5) {
                quality = 'Poor';
                qualityClass = 'text-red-400';
            } else if (packetLossRate > 2) {
                quality = 'Fair';
                qualityClass = 'text-yellow-400';
            }
            
            // Update quality display
            const qualityElement = document.getElementById('networkQuality');
            if (qualityElement) {
                qualityElement.textContent = quality;
                qualityElement.className = qualityClass;
            }
            
        }, 15000); // Check every 15 seconds
        
        connectionMonitor.intervals.push(interval);
    },
    
    /**
     * Update statistics display
     */
    updateStatsDisplay: function() {
        const elements = {
            packetsReceived: document.getElementById('packetsReceived'),
            packetsLost: document.getElementById('packetsLost'),
            bytesReceived: document.getElementById('bytesReceived'),
            bytesSent: document.getElementById('bytesSent')
        };
        
        if (elements.packetsReceived) {
            elements.packetsReceived.textContent = connectionMonitor.stats.packetsReceived.toLocaleString();
        }
        if (elements.packetsLost) {
            elements.packetsLost.textContent = connectionMonitor.stats.packetsLost.toLocaleString();
        }
        if (elements.bytesReceived) {
            elements.bytesReceived.textContent = this.formatBytes(connectionMonitor.stats.bytesReceived);
        }
        if (elements.bytesSent) {
            elements.bytesSent.textContent = this.formatBytes(connectionMonitor.stats.bytesSent);
        }
    },
    
    /**
     * Format bytes for display
     */
    formatBytes: function(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    /**
     * Retry connection
     */
    retryConnection: function() {
        console.log('[WebRTC Monitor] Attempting connection recovery');
        
        if (window.WebRTCSignaling?.reconnect) {
            window.WebRTCSignaling.reconnect();
        } else if (window.socket) {
            try {
                window.socket.connect();
            } catch (error) {
                console.error('[WebRTC Monitor] Manual reconnection failed:', error);
            }
        }
    },
    
    /**
     * Update debug information
     */
    updateDebugInfo: function(type, data) {
        if (type === 'socket') {
            const elements = {
                status: document.getElementById('debugSocketStatus'),
                transport: document.getElementById('debugSocketTransport'),
                id: document.getElementById('debugSocketId')
            };
            
            if (elements.status) {
                elements.status.textContent = data.connected ? 'Connected' : 'Disconnected';
                elements.status.className = data.connected ? 'text-green-400' : 'text-red-400';
            }
            if (elements.transport) {
                elements.transport.textContent = data.transport;
            }
            if (elements.id) {
                elements.id.textContent = data.id || 'Unknown';
            }
        }
    }
};

// =====================================
// VIDEO HANDLING AND AUTOPLAY
// =====================================

window.WebRTCVideoHandler = {
    /**
     * Enable media playback (unlock autoplay)
     */
    enableMediaPlayback: function() {
        console.log('[WebRTC Video] Enabling media playback');
        
        // Try to unlock audio context
        this.unlockAudioContext();
        
        // Try to play all video elements
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            this.tryPlayVideo(video);
        });
    },
    
    /**
     * Unlock audio context for autoplay
     */
    unlockAudioContext: function() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                const audioContext = new AudioContext();
                const source = audioContext.createBufferSource();
                source.buffer = audioContext.createBuffer(1, 1, 22050);
                source.connect(audioContext.destination);
                source.start(0);
                console.log('[WebRTC Video] Audio context unlocked');
            }
        } catch (error) {
            console.warn('[WebRTC Video] Could not unlock audio context:', error);
        }
    },
    
    /**
     * Try to play a video element
     */
    tryPlayVideo: function(video) {
        if (!video || !video.srcObject) return;
        
        const playPromise = video.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('[WebRTC Video] Video playing successfully');
                })
                .catch(error => {
                    console.warn('[WebRTC Video] Video autoplay prevented:', error);
                    
                    // Add click handler to play on user interaction
                    const playOnClick = () => {
                        video.play();
                        video.removeEventListener('click', playOnClick);
                    };
                    video.addEventListener('click', playOnClick);
                });
        }
    },
    
    /**
     * Setup video element with proper attributes
     */
    setupVideoElement: function(video, isLocal = false) {
        if (!video) return;
        
        video.autoplay = true;
        video.playsinline = true;
        
        if (isLocal) {
            video.muted = true; // Prevent feedback for local video
        }
        
        // Add error handling
        video.onerror = (error) => {
            console.error('[WebRTC Video] Video error:', error);
        };
        
        // Add load handler
        video.onloadedmetadata = () => {
            console.log('[WebRTC Video] Video metadata loaded');
            this.tryPlayVideo(video);
        };
    }
};

// =====================================
// DIAGNOSTICS AND NETWORK TESTING
// =====================================

window.WebRTCDiagnostics = {
    /**
     * Run comprehensive diagnostics
     */
    runDiagnostics: function() {
        console.log('[WebRTC Diagnostics] Running comprehensive diagnostics');
        
        const results = {
            browser: this.checkBrowserSupport(),
            network: this.checkNetworkConditions(),
            media: this.checkMediaDevices(),
            socket: this.checkSocketConnection()
        };
        
        this.displayDiagnosticResults(results);
        return results;
    },
    
    /**
     * Check browser support
     */
    checkBrowserSupport: function() {
        const support = {
            webrtc: !!(window.RTCPeerConnection),
            mediaDevices: !!(navigator.mediaDevices),
            getUserMedia: !!(navigator.mediaDevices?.getUserMedia),
            socketIO: typeof io === 'function',
            secureContext: window.location.protocol === 'https:' || window.location.hostname === 'localhost'
        };
        
        support.overall = Object.values(support).every(Boolean);
        
        return support;
    },
    
    /**
     * Check network conditions
     */
    checkNetworkConditions: function() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        return {
            online: navigator.onLine,
            connectionType: connection?.type || 'unknown',
            effectiveType: connection?.effectiveType || 'unknown',
            downlink: connection?.downlink || 'unknown',
            rtt: connection?.rtt || 'unknown'
        };
    },
    
    /**
     * Check media devices
     */
    checkMediaDevices: async function() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            
            return {
                total: devices.length,
                videoInputs: devices.filter(d => d.kind === 'videoinput').length,
                audioInputs: devices.filter(d => d.kind === 'audioinput').length,
                audioOutputs: devices.filter(d => d.kind === 'audiooutput').length
            };
        } catch (error) {
            return { error: error.message };
        }
    },
    
    /**
     * Check socket connection
     */
    checkSocketConnection: function() {
        if (!window.socket) {
            return { connected: false, error: 'Socket not initialized' };
        }
        
        return {
            connected: window.socket.connected,
            id: window.socket.id,
            transport: window.socket.io?.engine?.transport?.name || 'unknown',
            url: window.socket.io?.uri || 'unknown'
        };
    },
    
    /**
     * Display diagnostic results
     */
    displayDiagnosticResults: function(results) {
        console.group('[WebRTC Diagnostics] Results');
        console.table(results.browser);
        console.table(results.network);
        console.table(results.media);
        console.table(results.socket);
        console.groupEnd();
        
        // Show in UI if diagnostic panel exists
        const diagnosticPanel = document.getElementById('diagnosticResults');
        if (diagnosticPanel) {
            diagnosticPanel.innerHTML = this.formatDiagnosticResults(results);
        }
    },
    
    /**
     * Format diagnostic results for display
     */
    formatDiagnosticResults: function(results) {
        return `
            <div class="diagnostic-section">
                <h4>Browser Support</h4>
                <ul>
                    ${Object.entries(results.browser).map(([key, value]) => 
                        `<li class="${value ? 'text-green-400' : 'text-red-400'}">
                            ${key}: ${value ? '✓' : '✗'}
                        </li>`
                    ).join('')}
                </ul>
            </div>
            <div class="diagnostic-section">
                <h4>Network</h4>
                <ul>
                    ${Object.entries(results.network).map(([key, value]) => 
                        `<li>${key}: ${value}</li>`
                    ).join('')}
                </ul>
            </div>
            <div class="diagnostic-section">
                <h4>Media Devices</h4>
                <ul>
                    ${Object.entries(results.media).map(([key, value]) => 
                        `<li>${key}: ${value}</li>`
                    ).join('')}
                </ul>
            </div>
            <div class="diagnostic-section">
                <h4>Socket Connection</h4>
                <ul>
                    ${Object.entries(results.socket).map(([key, value]) => 
                        `<li class="${key === 'connected' && value ? 'text-green-400' : ''}">
                            ${key}: ${value}
                        </li>`
                    ).join('')}
                </ul>
            </div>
        `;
    }
};

// =====================================
// PING SYSTEM AND USER INTERACTION
// =====================================

window.WebRTCPing = {
    pingHistory: [],
    
    /**
     * Send ping to user
     */
    sendPing: function(targetSocketId, message = 'Ping!') {
        if (!window.socket || !window.socket.connected) {
            window.WebRTCUI.showNotification('Cannot send ping: Not connected to server', 'error');
            return;
        }
        
        const pingData = {
            to: targetSocketId,
            from: window.socket.id,
            message: message,
            timestamp: Date.now()
        };
        
        window.socket.emit('user-ping', pingData);
        
        window.WebRTCUI.addLogEntry(`Ping sent to user ${targetSocketId.slice(-8)}`, 'info');
        window.WebRTCUI.showNotification('Ping sent!', 'success', 2000);
    },
    
    /**
     * Handle incoming ping
     */
    handleIncomingPing: function(data) {
        const { from, message, timestamp } = data;
        
        this.pingHistory.unshift({
            from: from,
            message: message,
            timestamp: timestamp,
            received: Date.now()
        });
        
        // Keep only last 10 pings
        if (this.pingHistory.length > 10) {
            this.pingHistory.pop();
        }
        
        window.WebRTCUI.addLogEntry(`Ping received from user ${from.slice(-8)}: ${message}`, 'info');
        window.WebRTCUI.showNotification(`Ping from user: ${message}`, 'info', 3000);
        
        // Update ping display if available
        this.updatePingDisplay();
    },
    
    /**
     * Update ping display in UI
     */
    updatePingDisplay: function() {
        const pingContainer = document.getElementById('pingHistory');
        if (!pingContainer) return;
        
        const pingHtml = this.pingHistory.map(ping => {
            const delay = ping.received - ping.timestamp;
            return `
                <div class="ping-item p-2 bg-gray-700 rounded mb-2">
                    <div class="text-sm text-gray-300">From: ${ping.from.slice(-8)}</div>
                    <div class="font-medium">${ping.message}</div>
                    <div class="text-xs text-gray-400">Delay: ${delay}ms</div>
                </div>
            `;
        }).join('');
        
        pingContainer.innerHTML = pingHtml || '<div class="text-gray-400">No pings received</div>';
    },
    
    /**
     * Setup ping system
     */
    setupPingSystem: function() {
        if (!window.socket) return;
        
        // Listen for incoming pings
        window.socket.on('user-ping', (data) => {
            this.handleIncomingPing(data);
        });
        
        // Setup ping buttons
        const pingButtons = document.querySelectorAll('.ping-user-btn');
        pingButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const targetId = e.target.dataset.socketId;
                if (targetId) {
                    this.sendPing(targetId);
                }
            });
        });
    }
};

// =====================================
// BROWSER COMPATIBILITY
// =====================================

window.WebRTCCompatibility = {
    /**
     * Detect browser information
     */
    detectBrowser: function() {
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
        } else if (/Mac/.test(ua)) {
            os = "macOS";
        } else if (/Linux/.test(ua)) {
            os = "Linux";
        } else if (/Android/.test(ua)) {
            os = "Android";
            mobile = true;
        } else if (/iOS|iPhone|iPad/.test(ua)) {
            os = "iOS";
            mobile = true;
        }
        
        // Mobile detection
        mobile = mobile || /Mobi|Android/i.test(ua);
        
        return { browser, version, os, mobile };
    },
    
    /**
     * Check WebRTC support
     */
    checkWebRTCSupport: function() {
        const support = {
            webrtc: !!(window.RTCPeerConnection),
            mediaDevices: !!(navigator.mediaDevices),
            getUserMedia: !!(navigator.mediaDevices?.getUserMedia),
            displayMedia: !!(navigator.mediaDevices?.getDisplayMedia),
            dataChannels: true
        };
        
        // Test data channels
        try {
            const pc = new RTCPeerConnection();
            pc.createDataChannel('test');
            pc.close();
        } catch (e) {
            support.dataChannels = false;
        }
        
        return support;
    },
    
    /**
     * Apply browser-specific fixes
     */
    applyBrowserFixes: function() {
        const browserInfo = this.detectBrowser();
        
        if (browserInfo.browser === 'Safari') {
            this.applySafariFixes();
        } else if (browserInfo.browser === 'Firefox') {
            this.applyFirefoxFixes();
        } else if (browserInfo.browser === 'Chrome') {
            this.applyChromeFixes();
        }
        
        if (browserInfo.mobile) {
            this.applyMobileFixes();
        }
    },
    
    /**
     * Safari-specific fixes
     */
    applySafariFixes: function() {
        console.log('[WebRTC Compatibility] Applying Safari fixes');
        
        // Safari needs user interaction for autoplay
        window.needsUserInteraction = true;
        
        // Fix for Safari getUserMedia
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
            navigator.mediaDevices.getUserMedia = function(constraints) {
                return originalGetUserMedia(constraints).catch(error => {
                    if (error.name === 'NotAllowedError') {
                        throw new Error('Safari requires user interaction before camera access');
                    }
                    throw error;
                });
            };
        }
    },
    
    /**
     * Firefox-specific fixes
     */
    applyFirefoxFixes: function() {
        console.log('[WebRTC Compatibility] Applying Firefox fixes');
        
        // Firefox specific constraints
        window.firefoxConstraints = true;
    },
    
    /**
     * Chrome-specific fixes
     */
    applyChromeFixes: function() {
        console.log('[WebRTC Compatibility] Applying Chrome fixes');
        
        // Chrome autoplay policy
        window.needsAutoplayUnlock = true;
    },
    
    /**
     * Mobile-specific fixes
     */
    applyMobileFixes: function() {
        console.log('[WebRTC Compatibility] Applying mobile fixes');
        
        // Mobile constraints
        window.mobileConstraints = true;
        window.needsUserInteraction = true;
    }
};

// =====================================
// MODAL ADAPTER
// =====================================

window.WebRTCModalAdapter = {
    /**
     * Initialize modal adapter
     */
    init: function() {
        console.log('[WebRTC Modal Adapter] Initializing');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupAdapter());
        } else {
            this.setupAdapter();
        }
    },
    
    /**
     * Setup the modal adapter
     */
    setupAdapter: function() {
        // Give the DOM a moment to fully initialize
        setTimeout(() => {
            try {
                const simpleCameraModal = document.querySelector('#simpleCameraModal');
                if (simpleCameraModal) {
                    console.log('[WebRTC Modal Adapter] Found simpleCameraModal');
                    this.bindModalEvents(simpleCameraModal);
                }
            } catch (error) {
                console.error('[WebRTC Modal Adapter] Error setting up adapter:', error);
            }
        }, 500);
    },
    
    /**
     * Bind modal events
     */
    bindModalEvents: function(modal) {
        // Handle modal open/close events
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const isVisible = !modal.classList.contains('hidden');
                    this.handleModalVisibility(isVisible);
                }
            });
        });
        
        observer.observe(modal, { attributes: true });
    },
    
    /**
     * Handle modal visibility changes
     */
    handleModalVisibility: function(isVisible) {
        if (isVisible) {
            console.log('[WebRTC Modal Adapter] Modal opened');
            // Apply browser fixes when modal opens
            window.WebRTCCompatibility.applyBrowserFixes();
        } else {
            console.log('[WebRTC Modal Adapter] Modal closed');
        }
    }
};

// =====================================
// INITIALIZATION AND SETUP
// =====================================

// Auto-setup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('[WebRTC UI] UI and utilities module loaded');
    
    // Start connection monitoring if socket is available
    if (window.socket) {
        window.WebRTCMonitor.startMonitoring();
    }
    
    // Setup video autoplay unlock on user interaction
    const unlockAutoplay = () => {
        window.WebRTCVideoHandler.enableMediaPlayback();
        
        // Remove listeners after first interaction
        document.removeEventListener('click', unlockAutoplay);
        document.removeEventListener('touchstart', unlockAutoplay);
        document.removeEventListener('keydown', unlockAutoplay);
    };
    
    document.addEventListener('click', unlockAutoplay);
    document.addEventListener('touchstart', unlockAutoplay);
    document.addEventListener('keydown', unlockAutoplay);
    
    // Setup ping system if socket becomes available
    const checkSocketForPing = () => {
        if (window.socket) {
            window.WebRTCPing.setupPingSystem();
        } else {
            setTimeout(checkSocketForPing, 1000);
        }
    };
    checkSocketForPing();
    
    // Setup debug panel toggle if available
    const toggleDebugBtn = document.getElementById('toggleDebugPanel');
    const debugPanel = document.getElementById('webrtcDebugPanel');
    
    if (toggleDebugBtn && debugPanel) {
        toggleDebugBtn.addEventListener('click', () => {
            debugPanel.classList.toggle('-translate-x-full');
            
            // Update debug info when panel is opened
            if (!debugPanel.classList.contains('-translate-x-full')) {
                window.WebRTCMonitor.updateDebugInfo('socket', {
                    connected: window.socket?.connected || false,
                    transport: window.socket?.io?.engine?.transport?.name || 'unknown',
                    id: window.socket?.id || 'unknown'
                });
            }
        });
    }
    
    // Setup diagnostics button
    const diagnosticsBtn = document.getElementById('runDiagnostics');
    if (diagnosticsBtn) {
        diagnosticsBtn.addEventListener('click', () => {
            window.WebRTCDiagnostics.runDiagnostics();
        });
    }
});

// Auto-initialize browser compatibility and modal adapter
document.addEventListener('DOMContentLoaded', () => {
    window.WebRTCCompatibility.applyBrowserFixes();
    window.WebRTCModalAdapter.init();
});

// Export utilities for global access
window.WebRTCUI.log = (message, type) => window.WebRTCUI.addLogEntry(message, type);
window.WebRTCUtils = {
    formatBytes: window.WebRTCMonitor.formatBytes,
    checkSupport: window.WebRTCDiagnostics.checkBrowserSupport,
    runDiagnostics: window.WebRTCDiagnostics.runDiagnostics
};

console.log('[WebRTC UI] Consolidated UI and utilities module loaded successfully');
