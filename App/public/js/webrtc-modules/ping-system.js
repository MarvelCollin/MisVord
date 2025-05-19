/**
 * WebRTC Ping System Module
 * Handles functionality for pinging users and displaying ping results
 */

const WebRTCPingSystem = {
    // Module configuration
    config: {
        pingTimeout: 5000,         // How long to wait for ping response
        showNotifications: true,   // Whether to show ping notifications
        logResults: true           // Whether to log ping results
    },
    
    // State tracking
    state: {
        pendingPings: {},          // Map of pending pings by user ID
        pingResults: {},           // Map of ping results by session
        pingWindowOpen: false,     // Whether the ping results window is open
        lastSessionId: null        // Last ping session ID
    },
    
    /**
     * Initialize the ping system
     * @param {Object} config - Configuration options
     */
    init(config = {}) {
        this.config = {...this.config, ...config};
        
        // Setup event listeners for ping functionality
        this.setupEventListeners();
        
        return this;
    },
    
    /**
     * Set up event listeners for ping-related UI elements
     */
    setupEventListeners() {
        // Find ping button if it exists
        const pingBtn = document.getElementById('pingBtn');
        if (pingBtn) {
            pingBtn.addEventListener('click', () => {
                this.pingAllUsers();
            });
        }
        
        // Close button for ping results window
        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('close-ping-results')) {
                const pingResults = document.getElementById('pingResultsWindow');
                if (pingResults) {
                    pingResults.remove();
                    this.state.pingWindowOpen = false;
                }
            }
        });
    },
    
    /**
     * Send a ping request to a specific user
     * @param {string} userId - The user ID to ping
     * @returns {Promise<Object>} - A promise that resolves with the ping result
     */
    pingUser(userId) {
        return new Promise((resolve, reject) => {
            if (!window.WebRTCSignaling || !window.WebRTCSignaling.isConnected()) {
                if (window.WebRTCUI) {
                    window.WebRTCUI.addLogEntry('Cannot ping: No signaling connection', 'error');
                }
                reject(new Error('No signaling connection'));
                return;
            }
            
            const pingStartTime = Date.now();
            
            // Register this ping in pending pings
            this.state.pendingPings[userId] = {
                startTime: pingStartTime,
                timeoutId: setTimeout(() => {
                    delete this.state.pendingPings[userId];
                    resolve({ 
                        userId, 
                        success: false, 
                        error: 'timeout',
                        latency: this.config.pingTimeout
                    });
                }, this.config.pingTimeout)
            };
            
            // Send ping via signaling channel
            window.WebRTCSignaling.sendPingRequest(userId);
            
            if (window.WebRTCUI) {
                window.WebRTCUI.addLogEntry(`Sent ping to user ${userId}`, 'ping');
            }
        });
    },
    
    /**
     * Handle a ping response from a user
     * @param {string} userId - The user ID who responded
     * @param {Object} data - Response data with timestamp
     */
    handlePingResponse(userId, data) {
        const pendingPing = this.state.pendingPings[userId];
        
        if (!pendingPing) {
            if (window.WebRTCUI) {
                window.WebRTCUI.addLogEntry(`Received unexpected ping response from ${userId}`, 'warn');
            }
            return;
        }
        
        // Calculate round-trip time
        const latency = Date.now() - pendingPing.startTime;
        
        // Clear timeout
        clearTimeout(pendingPing.timeoutId);
        delete this.state.pendingPings[userId];
        
        // Store result
        const result = {
            userId,
            success: true,
            latency,
            timestamp: Date.now(),
            responseData: data
        };
        
        if (this.config.logResults && window.WebRTCUI) {
            window.WebRTCUI.addLogEntry(`Ping response from ${userId}: ${latency}ms`, 'ping');
        }
        
        // If we have an active results window, update it
        if (this.state.pingWindowOpen && this.state.lastSessionId) {
            this.updatePingResult(userId, result);
        }
        
        return result;
    },
    
    /**
     * Ping all users in the room
     */
    pingAllUsers() {
        // Get list of peers from the peer connection module
        const peers = window.WebRTCPeerConnection?.getPeers() || {};
        
        if (Object.keys(peers).length === 0) {
            if (window.WebRTCUI) {
                window.WebRTCUI.addLogEntry('No peers to ping', 'ping');
            }
            return;
        }
        
        // Generate a session ID for this ping batch
        const sessionId = Date.now().toString();
        this.state.lastSessionId = sessionId;
        
        // Initialize empty results for all users
        this.state.pingResults[sessionId] = {};
        
        // Create ping results UI
        const timestamp = new Date().toLocaleString();
        this.showPingResultsWindow(peers, timestamp);
        
        // Ping each peer
        for (const peerId in peers) {
            const peer = peers[peerId];
            
            // Set initial state in the UI
            this.state.pingResults[sessionId][peerId] = {
                userId: peerId,
                userName: peer.userName || 'Unknown user',
                pending: true,
                success: null,
                latency: null,
                timestamp: Date.now()
            };
            
            this.updatePingResult(peerId, this.state.pingResults[sessionId][peerId]);
            
            // Send the actual ping
            this.pingUser(peerId).then(result => {
                this.state.pingResults[sessionId][peerId] = {
                    ...this.state.pingResults[sessionId][peerId],
                    pending: false,
                    success: result.success,
                    latency: result.latency,
                    error: result.error
                };
                this.updatePingResult(peerId, this.state.pingResults[sessionId][peerId]);
            }).catch(error => {
                this.state.pingResults[sessionId][peerId] = {
                    ...this.state.pingResults[sessionId][peerId],
                    pending: false,
                    success: false,
                    error: error.message
                };
                this.updatePingResult(peerId, this.state.pingResults[sessionId][peerId]);
            });
        }
    },
    
    /**
     * Show a notification that a user has pinged you
     * @param {string} fromUserName - The name of the user who pinged you
     */
    showPingNotification(fromUserName) {
        if (!this.config.showNotifications) return;
        
        // Remove existing notifications first
        const existingNotification = document.getElementById('ping-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notificationElement = document.createElement('div');
        notificationElement.id = 'ping-notification';
        notificationElement.className = 'fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center space-x-2 animate-fadeIn';
        
        // Add notification content
        notificationElement.innerHTML = `
            <i class="fas fa-bell text-xl"></i>
            <div>
                <div class="font-bold">Ping from ${fromUserName}</div>
                <div class="text-sm">They are checking if you're available</div>
            </div>
            <button class="ml-4 bg-blue-700 hover:bg-blue-800 rounded px-2 py-1 text-sm" id="ping-reply-btn">
                Reply
            </button>
            <button class="ml-2 text-white opacity-70 hover:opacity-100" onclick="this.parentElement.remove();">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add to document
        document.body.appendChild(notificationElement);
        
        // Reply button handler
        document.getElementById('ping-reply-btn').addEventListener('click', () => {
            // Find the user's socket ID from their name
            const peers = window.WebRTCPeerConnection?.getPeers() || {};
            const targetPeer = Object.values(peers).find(peer => peer.userName === fromUserName);
            
            if (targetPeer && targetPeer.socketId) {
                this.pingUser(targetPeer.socketId);
            }
            
            notificationElement.remove();
        });
        
        // Auto-dismiss after 10 seconds
        setTimeout(() => {
            if (notificationElement.parentNode) {
                notificationElement.classList.add('animate-fadeOut');
                setTimeout(() => notificationElement.remove(), 500);
            }
        }, 10000);
    },
    
    /**
     * Show the ping results window with all users
     * @param {Object} users - The users to display in the results window
     * @param {string} timestamp - The timestamp for the ping session
     */
    showPingResultsWindow(users, timestamp) {
        // Remove existing window if exists
        const existingWindow = document.getElementById('pingResultsWindow');
        if (existingWindow) {
            existingWindow.remove();
        }
        
        // Create results window
        const resultsWindow = document.createElement('div');
        resultsWindow.id = 'pingResultsWindow';
        resultsWindow.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 text-white p-4 rounded-lg shadow-lg z-50 animate-scaleIn';
        resultsWindow.style.minWidth = '300px';
        
        // Add header
        resultsWindow.innerHTML = `
            <div class="flex justify-between items-center border-b border-gray-700 pb-2 mb-3">
                <h3 class="text-lg font-bold">Connection Status</h3>
                <button class="close-ping-results text-gray-400 hover:text-white">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="text-sm text-gray-400 mb-4">
                Checking connection to ${Object.keys(users).length} user(s) - ${timestamp}
            </div>
            <div id="pingResultsList" class="space-y-2 max-h-60 overflow-y-auto pr-2">
                <!-- Results will be inserted here -->
            </div>
            <div class="mt-4 pt-2 border-t border-gray-700 flex justify-between">
                <button id="refreshPingsBtn" class="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm">
                    Refresh
                </button>
                <div class="text-xs text-gray-500">
                    Ping measures round-trip time
                </div>
            </div>
        `;
        
        // Add to document
        document.body.appendChild(resultsWindow);
        
        // Set state
        this.state.pingWindowOpen = true;
        
        // Add event listener for refresh
        document.getElementById('refreshPingsBtn').addEventListener('click', () => {
            this.pingAllUsers();
        });
    },
    
    /**
     * Update a specific ping result in the UI
     * @param {string} userId - The user ID to update
     * @param {Object} resultData - The ping result data
     */
    updatePingResult(userId, resultData) {
        const pingResultsList = document.getElementById('pingResultsList');
        if (!pingResultsList) return;
        
        // Check if element already exists
        let resultItem = document.getElementById(`ping-result-${userId}`);
        
        if (!resultItem) {
            // Create new result item
            resultItem = document.createElement('div');
            resultItem.id = `ping-result-${userId}`;
            resultItem.className = 'flex justify-between items-center bg-gray-700 p-2 rounded';
            pingResultsList.appendChild(resultItem);
        }
        
        // Determine status display
        let statusDisplay, latencyDisplay, statusClass;
        
        if (resultData.pending) {
            statusDisplay = '<i class="fas fa-spinner fa-spin"></i> Testing...';
            latencyDisplay = '--';
            statusClass = 'text-blue-400';
        } else if (resultData.success) {
            statusDisplay = '<i class="fas fa-check"></i> OK';
            latencyDisplay = `${resultData.latency}ms`;
            statusClass = 'text-green-400';
        } else {
            statusDisplay = '<i class="fas fa-exclamation-triangle"></i> Failed';
            latencyDisplay = resultData.error === 'timeout' ? 'Timeout' : 'Error';
            statusClass = 'text-red-400';
        }
        
        // Update content
        resultItem.innerHTML = `
            <div>
                <div class="font-semibold">${resultData.userName || userId}</div>
                <div class="text-xs text-gray-400">${userId.substring(0, 8)}...</div>
            </div>
            <div>
                <div class="${statusClass} text-sm">${statusDisplay}</div>
                <div class="text-xs text-right">${latencyDisplay}</div>
            </div>
        `;
    },
    
    /**
     * Update all ping results at once
     * @param {Object} users - The updated user data
     */
    updatePingResults(users) {
        for (const userId in users) {
            this.updatePingResult(userId, users[userId]);
        }
    }
};

// Export the ping system module
window.WebRTCPingSystem = WebRTCPingSystem; 