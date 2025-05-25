/**
 * WebRTC Controller Module
 * Main controller that coordinates all WebRTC modules
 */

const WebRTCController = {
    // App state
    state: {
        initialized: false,
        userName: '',
        roomId: '',
        localSocketId: null,
        isCallActive: false
    },

    /**
     * Initialize the WebRTC application
     * @param {Object} config - Configuration options
     */
    init(config = {}) {
        // Set defaults merged with provided config
        this.config = {
            debugMode: window.debugMode || false,
            roomId: 'global-video-chat',
            userName: 'User_' + Math.floor(Math.random() * 10000),
            autoJoin: true,
            ...config
        };

        // Check if Socket.IO is loaded
        if (typeof io !== 'function') {
            console.error("[WebRTCController] Socket.IO library not available! Attempting to load from CDN...");
            
            // Add Socket.IO connection diagnostics button to the debug panel
            this.addSocketDiagnosticsButton();
            
            const script = document.createElement('script');
            script.src = 'https://cdn.socket.io/4.6.0/socket.io.min.js';
            script.onload = () => {
                console.log("[WebRTCController] Socket.IO loaded from CDN successfully, continuing initialization");
                this.continueInitialization();
            };
            script.onerror = () => {
                console.error("[WebRTCController] Failed to load Socket.IO from CDN!");
                alert("Critical library failed to load. Please refresh the page or check your internet connection.");
            };
            document.head.appendChild(script);
            return;
        }
        
        this.continueInitialization();
    },
    
    /**
     * Add Socket.IO diagnostics button to the debug panel
     */
    addSocketDiagnosticsButton() {
        // Check if there's a debug panel to add the button to
        const debugPanel = document.getElementById('webrtcDebugPanel');
        if (!debugPanel) return;
        
        // Create a button for diagnostics
        const diagButton = document.createElement('button');
        diagButton.textContent = 'Test Socket Connection';
        diagButton.className = 'bg-blue-500 text-white px-2 py-1 rounded text-sm';
        diagButton.style.margin = '5px';
        
        diagButton.onclick = () => {
            this.testSocketConnection();
        };
        
        // Add to debug panel
        debugPanel.appendChild(diagButton);
    },
    
    /**
     * Test Socket.IO connection and show results
     */
    testSocketConnection() {
        // Show testing message
        window.WebRTCUI.addLogEntry('Testing Socket.IO connection...', 'system');

        // Ensure ENV_CONFIG is available
        if (!window.ENV_CONFIG) {
            window.WebRTCUI.addLogEntry('❌ ENV_CONFIG not found. Cannot test socket connection.', 'error');
            console.error("ENV_CONFIG not found. Could not determine socket connection parameters.");
            return;
        }

        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const socketUrl = isLocal ? window.ENV_CONFIG.SOCKET_BASE_URL_LOCAL : window.ENV_CONFIG.SOCKET_BASE_URL_PROD;
        const socketPath = isLocal ? '/socket.io' : '/misvord/socket/socket.io';

        if (!socketUrl) {
            window.WebRTCUI.addLogEntry('❌ Socket URL could not be determined.', 'error');
            console.error("Socket URL could not be determined from ENV_CONFIG");
            return;
        }
        
        window.WebRTCUI.addLogEntry(`Socket.IO settings - URL: ${socketUrl}, Path: ${socketPath}`, 'info');
        
        // Try to establish a test connection
        try {
            const testSocket = io(socketUrl, {
                path: socketPath,
                transports: ['websocket', 'polling'],
                timeout: 5000,
                autoConnect: true
            });
            
            testSocket.on('connect', () => {
                window.WebRTCUI.addLogEntry(`✅ Socket.IO connected successfully (ID: ${testSocket.id})`, 'success');
                testSocket.disconnect();
            });
            
            testSocket.on('connect_error', (error) => {
                window.WebRTCUI.addLogEntry(`❌ Socket.IO connection error: ${error.message}`, 'error');
                testSocket.disconnect();
            });
            
            testSocket.on('disconnect', () => {
                window.WebRTCUI.addLogEntry('Socket.IO test connection closed', 'info');
            });
        } catch (error) {
            window.WebRTCUI.addLogEntry(`❌ Socket.IO test failed: ${error.message}`, 'error');
        }
    },

    /**
     * Continue initialization after Socket.IO check
     * @private
     */
    continueInitialization() {
        // Store config values in state
        this.state.roomId = this.config.roomId;
        this.state.userName = this.config.userName;

        // Make sure all module namespaces exist
        window.WebRTCUI = window.WebRTCUI || {};
        window.WebRTCDiagnostics = window.WebRTCDiagnostics || {};
        window.WebRTCPingSystem = window.WebRTCPingSystem || {};
        window.WebRTCVideoHandler = window.WebRTCVideoHandler || {};
        window.WebRTCSignaling = window.WebRTCSignaling || {};
        window.WebRTCMedia = window.WebRTCMedia || {};
        window.WebRTCPeerConnection = window.WebRTCPeerConnection || {};
        window.WebRTCMonitor = window.WebRTCMonitor || {};
        window.VideoDebug = window.VideoDebug || {};

        // Initialize all modules
        window.WebRTCUI.init({
            debugMode: this.config.debugMode
        });

        window.WebRTCDiagnostics.init({
            debugMode: this.config.debugMode
        });

        window.WebRTCPingSystem.init({
            showNotifications: true
        });

        window.WebRTCVideoHandler.init({
            useUnmuteButtons: true,
            usePlayButtons: true
        });

        // Set up UI event listeners
        this.setupEventListeners();

        // Detect network conditions
        const networkConditions = window.WebRTCDiagnostics.detectNetworkConditions();
        window.isMobileNetwork = networkConditions.isMobile;
        window.isLowBandwidthConnection = networkConditions.isLowBandwidth;

        // Log initialization
        window.WebRTCUI.addLogEntry('WebRTC Controller initialized', 'system');

        // Auto-join if configured
        if (this.config.autoJoin) {
            this.startCall();
        }

        this.state.initialized = true;
        return this;
    },

    /**
     * Set up event listeners for UI elements
     */
    setupEventListeners() {
        // Media control buttons
        const toggleVideoBtn = document.getElementById('toggleVideoBtn');
        if (toggleVideoBtn) {
            toggleVideoBtn.addEventListener('click', () => {
                window.WebRTCMedia.toggleLocalVideo();
            });
        }

        const toggleAudioBtn = document.getElementById('toggleAudioBtn');
        if (toggleAudioBtn) {
            toggleAudioBtn.addEventListener('click', () => {
                window.WebRTCMedia.toggleLocalAudio();
            });
        }

        const toggleScreenBtn = document.getElementById('toggleScreenBtn');
        if (toggleScreenBtn) {
            toggleScreenBtn.addEventListener('click', () => {
                this.toggleScreenSharing();
            });
        }

        const hangupBtn = document.getElementById('hangupBtn');
        if (hangupBtn) {
            hangupBtn.addEventListener('click', () => {
                this.hangUpCall();
            });
        }

        // Connection retry button
        const retryConnection = document.getElementById('retryConnection');
        if (retryConnection) {
            retryConnection.addEventListener('click', () => {
                this.reconnect();
            });
        }

        // Log toggle button
        const toggleLogsBtn = document.getElementById('toggleLogs');
        if (toggleLogsBtn) {
            toggleLogsBtn.addEventListener('click', () => {
                const socketLogs = document.getElementById('socketLogs');
                if (socketLogs) {
                    socketLogs.style.display = socketLogs.style.display === 'none' ? 'block' : 'none';
                }
            });
        }

        // Clear logs button
        const clearLogsBtn = document.getElementById('clearLogs');
        if (clearLogsBtn) {
            clearLogsBtn.addEventListener('click', () => {
                const logEntries = document.getElementById('logEntries');
                if (logEntries) {
                    logEntries.innerHTML = '';
                }
            });
        }
        
        // We don't need to add event listeners for permission buttons here
        // They are handled in webrtc.js through the setupRetryPermissionHandler function
        // This avoids potential timing issues with modules loading

        // Network status monitoring
        setInterval(() => {
            window.WebRTCDiagnostics.checkNetworkConnectivity();
        }, window.WebRTCDiagnostics.config.networkCheckInterval);
    },

    /**
     * Start the video call
     */
    async startCall() {
        if (this.state.isCallActive) {
            window.WebRTCUI.addLogEntry('Call already active', 'warn');
            return;
        }

        // Make sure the WebRTCMedia module is available
        if (!window.WebRTCMedia || typeof window.WebRTCMedia.initLocalStream !== 'function') {
            window.WebRTCUI.addLogEntry('Media module not loaded yet. Please try again.', 'error');
            return;
        }

        // Initialize local media
        const mediaSuccess = await window.WebRTCMedia.initLocalStream(true, true);
        if (!mediaSuccess) {
            window.WebRTCUI.addLogEntry('Failed to initialize local media', 'error');
            return;
        }

        // Connect to signaling server
        window.WebRTCSignaling.connectToSignalingServer(
            this.state.roomId,
            this.state.userName,
            this.handleRoomJoined.bind(this),
            this.handleConnectionError.bind(this)
        );

        // Setup signaling event handlers
        this.setupSignalingEvents();

        this.state.isCallActive = true;
        window.WebRTCUI.addLogEntry('Starting video call...', 'system');
    },

    /**
     * Handle successful room join
     * @param {Array} users - List of users already in the room
     */
    handleRoomJoined(users) {
        console.log('handleRoomJoined called with users:', users);
        window.WebRTCUI.addLogEntry(`Joined room with ${users ? users.length : 0} users`, 'success');

        // Store our socket ID
        this.state.localSocketId = window.WebRTCSignaling.getSocketId();

        // Start global connection monitoring
        this.startConnectionMonitoring();

        // Create peer connections for existing users
        if (users && Array.isArray(users)) {
            users.forEach(async user => {
                if (user && user.socketId && user.socketId !== this.state.localSocketId) {
                    window.WebRTCUI.addLogEntry(`Creating connection to existing user: ${user.userName} (${user.socketId})`, 'peer');
                    
                    // Create peer connection for this user
                    const pc = this.createPeerConnection(user.socketId, user.userName);
                    
                    // Initiate WebRTC connection by creating an offer
                    if (pc) {
                        try {
                            // Slight delay to ensure everything is initialized properly
                            setTimeout(async () => {
                                // Create and send offer
                                const offer = await window.WebRTCPeerConnection.createOffer(user.socketId);
                                if (offer) {
                                    window.WebRTCSignaling.sendWebRTCOffer(user.socketId, offer, {
                                        fromUserName: this.state.userName
                                    });
                                    window.WebRTCUI.addLogEntry(`Sent offer to existing user: ${user.userName}`, 'signal');
                                }
                            }, 500);
                        } catch (error) {
                            window.WebRTCUI.addLogEntry(`Error creating offer for ${user.userName}: ${error.message}`, 'error');
                        }
                    }
                }
            });
        }

        // Update participants UI
        window.WebRTCUI.updateParticipantsList(
            window.WebRTCPeerConnection.getAllPeers(),
            this.state.userName,
            this.state.localSocketId
        );
    },

    /**
     * Handle connection error
     * @param {string} error - Error message
     */
    handleConnectionError(error) {
        window.WebRTCUI.addLogEntry(`Connection error: ${error}`, 'error');
        window.WebRTCUI.updateConnectionStatus('disconnected', `Connection failed: ${error}`);
    },

    /**
     * Set up signaling event handlers
     */
    setupSignalingEvents() {
        const socket = window.WebRTCSignaling.getSocket();
        if (!socket) return;

        // Remove any existing event handlers
        socket.off('user-joined-video-room');
        socket.off('user-left-video-room');
        socket.off('webrtc-offer');
        socket.off('webrtc-answer');
        socket.off('webrtc-ice-candidate');
        socket.off('ping-user-request');
        socket.off('ping-response');

        // User joined
        socket.on('user-joined-video-room', async (data) => {
            const { socketId, userName } = data;
            window.WebRTCUI.addLogEntry(`User joined: ${userName} (${socketId})`, 'user');

            // Create peer connection for new user
            const pc = this.createPeerConnection(socketId, userName);
            if (!pc) return;

            // Create and send offer to the new user
            const offer = await window.WebRTCPeerConnection.createOffer(socketId);
            if (offer) {
                window.WebRTCSignaling.sendWebRTCOffer(socketId, offer, {
                    fromUserName: this.state.userName
                });
                window.WebRTCUI.addLogEntry(`Sent offer to ${userName}`, 'signal');
            }

            // Update UI
            window.WebRTCUI.updateParticipantsList(
                window.WebRTCPeerConnection.getAllPeers(),
                this.state.userName,
                this.state.localSocketId
            );
        });

        // User left
        socket.on('user-left-video-room', (data) => {
            const { socketId, userName } = data;
            window.WebRTCUI.addLogEntry(`User left: ${userName} (${socketId})`, 'user');

            // Remove peer connection
            window.WebRTCPeerConnection.removePeer(socketId);

            // Update UI
            window.WebRTCUI.updateParticipantsList(
                window.WebRTCPeerConnection.getAllPeers(),
                this.state.userName,
                this.state.localSocketId
            );
        });

        // Received offer
        socket.on('webrtc-offer', async (data) => {
            const { from: peerId, offer, fromUserName, isIceRestart, isReconnect } = data;
            window.WebRTCUI.addLogEntry(`Received offer from ${fromUserName} (${peerId})${isIceRestart ? ' (ICE restart)' : ''}`, 'signal');

            // Create peer connection if it doesn't exist
            let pc = window.WebRTCPeerConnection.getPeer(peerId)?.pc;
            if (!pc) {
                pc = this.createPeerConnection(peerId, fromUserName)?.pc;
            }

            if (!pc) {
                window.WebRTCUI.addLogEntry(`Cannot process offer: No peer connection for ${fromUserName}`, 'error');
                return;
            }

            // Process the offer and create answer
            const answer = await window.WebRTCPeerConnection.applyRemoteOffer(peerId, offer, isIceRestart);
            if (answer) {
                window.WebRTCSignaling.sendWebRTCAnswer(peerId, answer, {
                    fromUserName: this.state.userName,
                    isIceRestart
                });
                window.WebRTCUI.addLogEntry(`Sent answer to ${fromUserName}`, 'signal');
            }
        });

        // Received answer
        socket.on('webrtc-answer', async (data) => {
            const { from: peerId, answer, fromUserName, isIceRestart } = data;
            window.WebRTCUI.addLogEntry(`Received answer from ${fromUserName} (${peerId})`, 'signal');

            // Get peer connection
            if (!window.WebRTCPeerConnection.hasPeer(peerId)) {
                window.WebRTCUI.addLogEntry(`Cannot process answer: No peer connection for ${fromUserName}`, 'error');
                return;
            }

            // Apply the answer
            const success = await window.WebRTCPeerConnection.applyRemoteAnswer(peerId, answer);
            if (success) {
                window.WebRTCUI.addLogEntry(`Applied answer from ${fromUserName}`, 'signal');
            } else {
                window.WebRTCUI.addLogEntry(`Failed to apply answer from ${fromUserName}`, 'error');
            }
        });

        // Received ICE candidate
        socket.on('webrtc-ice-candidate', (data) => {
            const { from: peerId, candidate } = data;
            const peerData = window.WebRTCPeerConnection.getPeer(peerId);
            const peerName = peerData?.userName || peerId;

            if (window.appDebugMode) {
                window.WebRTCUI.addLogEntry(`Received ICE candidate from ${peerName}`, 'signal');
            }

            // Add the candidate
            window.WebRTCPeerConnection.addIceCandidateWithCheck(peerId, candidate);
        });

        // Ping request
        socket.on('ping-user-request', (data) => {
            const { userId, timestamp } = data;
            const peerData = window.WebRTCPeerConnection.getPeer(userId);
            const userName = peerData?.userName || 'Unknown user';

            window.WebRTCUI.addLogEntry(`Ping request from ${userName}`, 'ping');

            // Show notification
            window.WebRTCPingSystem.showPingNotification(userName);

            // Send response
            socket.emit('ping-response', {
                to: userId,
                timestamp,
                responseTime: Date.now()
            });
        });

        // Ping response
        socket.on('ping-response', (data) => {
            const { from: userId, timestamp, responseTime } = data;
            window.WebRTCPingSystem.handlePingResponse(userId, { timestamp, responseTime });
        });
    },

    /**
     * Create a peer connection
     * @param {string} peerSocketId - Peer's socket ID
     * @param {string} peerUserName - Peer's username
     * @returns {RTCPeerConnection} The created peer connection
     */
    createPeerConnection(peerSocketId, peerUserName) {
        return window.WebRTCPeerConnection.createPeerConnection(
            peerSocketId,
            peerUserName,
            this.handleIceCandidate.bind(this),
            this.handleTrack.bind(this),
            this.handleConnectionStateChange.bind(this),
            window.WebRTCMedia.getLocalStream()
        );
    },

    /**
     * Handle ICE candidate generation
     * @param {string} peerSocketId - Peer's socket ID
     * @param {RTCIceCandidate} candidate - The ICE candidate
     */
    handleIceCandidate(peerSocketId, candidate) {
        window.WebRTCSignaling.sendICECandidate(peerSocketId, candidate);
    },

    /**
     * Handle incoming media tracks
     * @param {string} peerSocketId - Peer's socket ID
     * @param {string} peerUserName - Peer's username
     * @param {MediaStream} stream - The media stream
     */
    handleTrack(peerSocketId, peerUserName, stream) {
        window.WebRTCUI.addLogEntry(`Received track from ${peerUserName}`, 'media');

        // Create or get video element for this peer
        let remoteVideo = document.getElementById(`remote-video-${peerSocketId}`);

        if (!remoteVideo) {
            // Create video grid item
            const videoGrid = document.getElementById('videoGrid');
            if (!videoGrid) {
                window.WebRTCUI.addLogEntry('Video grid element not found', 'error');
                return;
            }

            const videoContainer = document.createElement('div');
            videoContainer.className = 'video-container';
            videoContainer.id = `video-container-${peerSocketId}`;

            // Create video element
            remoteVideo = document.createElement('video');
            remoteVideo.id = `remote-video-${peerSocketId}`;
            remoteVideo.className = 'remote-video';
            remoteVideo.playsInline = true;
            
            // Add username label
            const userLabel = document.createElement('div');
            userLabel.className = 'user-label';
            userLabel.textContent = peerUserName;
            
            videoContainer.appendChild(remoteVideo);
            videoContainer.appendChild(userLabel);
            videoGrid.appendChild(videoContainer);
        }

        // Update the video element with the stream
        window.WebRTCVideoHandler.updateRemoteVideoElement(remoteVideo, peerSocketId, stream);
    },

    /**
     * Handle connection state changes
     * @param {string} peerSocketId - Peer's socket ID
     * @param {string} peerUserName - Peer's username
     * @param {string} state - Connection state
     * @param {Object} peerData - Additional peer data
     */
    handleConnectionStateChange(peerSocketId, peerUserName, state, peerData) {
        window.WebRTCUI.addLogEntry(`Connection state for ${peerUserName}: ${state}`, 'peer');

        // Update UI
        window.WebRTCUI.updateParticipantsList(
            window.WebRTCPeerConnection.getAllPeers(),
            this.state.userName,
            this.state.localSocketId
        );

        // Handle disconnected state
        if (state === 'disconnected' || state === 'failed' || state === 'closed') {
            const videoContainer = document.getElementById(`video-container-${peerSocketId}`);
            if (videoContainer) {
                // Add reconnecting overlay
                let reconnectingMsg = videoContainer.querySelector('.reconnecting-message');
                if (!reconnectingMsg && state !== 'closed') {
                    reconnectingMsg = document.createElement('div');
                    reconnectingMsg.className = 'reconnecting-message';
                    reconnectingMsg.innerHTML = '<div>Reconnecting...</div>';
                    videoContainer.appendChild(reconnectingMsg);
                }

                // Remove container if closed
                if (state === 'closed') {
                    videoContainer.remove();
                }
            }
        } else if (state === 'connected') {
            // Remove reconnecting message if connected
            const videoContainer = document.getElementById(`video-container-${peerSocketId}`);
            if (videoContainer) {
                const reconnectingMsg = videoContainer.querySelector('.reconnecting-message');
                if (reconnectingMsg) {
                    reconnectingMsg.remove();
                }
            }
        }
    },

    /**
     * Toggle screen sharing
     */
    async toggleScreenSharing() {
        if (window.WebRTCMedia.isScreenSharingActive()) {
            // Stop screen sharing
            window.WebRTCMedia.stopScreenSharing();
            
            // Update UI
            window.WebRTCUI.updateMediaToggleButtons(
                window.WebRTCMedia.isVideoActive(),
                window.WebRTCMedia.isAudioActive(),
                false
            );
            
            // Replace all peer connections with camera stream
            const peers = window.WebRTCPeerConnection.getAllPeers();
            for (const peerId in peers) {
                const peer = peers[peerId];
                if (!peer || !peer.pc) continue;
                
                // Replace tracks with camera tracks
                const senders = peer.pc.getSenders();
                const videoTrack = window.WebRTCMedia.getLocalStream()?.getVideoTracks()[0];
                
                if (videoTrack) {
                    for (const sender of senders) {
                        if (sender.track && sender.track.kind === 'video') {
                            sender.replaceTrack(videoTrack);
                        }
                    }
                }
            }
        } else {
            // Start screen sharing
            const success = await window.WebRTCMedia.startScreenSharing(
                (stream) => {
                    // Screen sharing started successfully
                    window.WebRTCUI.updateMediaToggleButtons(
                        window.WebRTCMedia.isVideoActive(),
                        window.WebRTCMedia.isAudioActive(),
                        true
                    );
                    
                    // Replace tracks in all peer connections
                    const peers = window.WebRTCPeerConnection.getAllPeers();
                    const screenVideoTrack = stream.getVideoTracks()[0];
                    
                    for (const peerId in peers) {
                        const peer = peers[peerId];
                        if (!peer || !peer.pc) continue;
                        
                        const senders = peer.pc.getSenders();
                        for (const sender of senders) {
                            if (sender.track && sender.track.kind === 'video') {
                                sender.replaceTrack(screenVideoTrack);
                            }
                        }
                    }
                },
                (error) => {
                    // Screen sharing failed
                    window.WebRTCUI.addLogEntry(`Screen sharing error: ${error}`, 'error');
                },
                () => {
                    // Screen sharing ended by user
                    this.toggleScreenSharing();
                }
            );
            
            if (!success) {
                window.WebRTCUI.addLogEntry('Failed to start screen sharing', 'error');
            }
        }
    },

    /**
     * Hang up the call
     */
    hangUpCall() {
        window.WebRTCUI.addLogEntry('Hanging up call', 'system');
        
        // Leave the room
        window.WebRTCSignaling.leaveVideoRoom();
        
        // Stop local media
        if (window.WebRTCMedia.getLocalStream()) {
            window.WebRTCMedia.getLocalStream().getTracks().forEach(track => track.stop());
        }
        
        // Stop screen sharing if active
        if (window.WebRTCMedia.isScreenSharingActive()) {
            window.WebRTCMedia.stopScreenSharing();
        }
        
        // Close all peer connections
        const peers = window.WebRTCPeerConnection.getAllPeers();
        for (const peerId in peers) {
            window.WebRTCPeerConnection.removePeer(peerId);
        }
        
        // Clear video grid
        const videoGrid = document.getElementById('videoGrid');
        if (videoGrid) {
            const localVideoContainer = document.getElementById('local-video-container');
            videoGrid.innerHTML = '';
            if (localVideoContainer) {
                videoGrid.appendChild(localVideoContainer);
            }
        }
        
        // Update state
        this.state.isCallActive = false;
        
        // Update UI
        window.WebRTCUI.updateConnectionStatus('disconnected', 'Call ended');
        window.WebRTCUI.updateParticipantsList({}, this.state.userName, this.state.localSocketId);
    },

    /**
     * Reconnect to the call
     */
    reconnect() {
        window.WebRTCUI.addLogEntry('Reconnecting to call', 'system');
        
        // End current call
        this.hangUpCall();
        
        // Start new call
        setTimeout(() => {
            this.startCall();
        }, 1000);
    },

    /**
     * Start global connection monitoring
     */
    startConnectionMonitoring() {
        // Check connection health periodically
        setInterval(() => {
            this.checkAllConnectionsHealth();
        }, 30000); // Every 30 seconds
    },

    /**
     * Check health of all peer connections
     */
    checkAllConnectionsHealth() {
        if (!this.state.isCallActive) return;
        
        const peers = window.WebRTCPeerConnection.getAllPeers();
        let problematicConnections = 0;
        
        for (const peerId in peers) {
            const peer = peers[peerId];
            if (!peer || !peer.pc) continue;
            
            const connectionState = peer.pc.connectionState;
            const iceConnectionState = peer.pc.iceConnectionState;
            
            if (connectionState === 'disconnected' || connectionState === 'failed' ||
                iceConnectionState === 'disconnected' || iceConnectionState === 'failed') {
                problematicConnections++;
                
                // Try to recover the connection
                this.recoverConnection(peerId, peer.userName);
            }
        }
        
        // If all connections are problematic, check internet
        if (problematicConnections > 0 && problematicConnections === Object.keys(peers).length) {
            window.WebRTCDiagnostics.checkNetworkConnectivity();
        }
    },

    /**
     * Try to recover a problematic connection
     * @param {string} peerId - Peer's socket ID
     * @param {string} peerName - Peer's username
     */
    async recoverConnection(peerId, peerName) {
        window.WebRTCUI.addLogEntry(`Attempting to recover connection with ${peerName}`, 'system');
        
        const peer = window.WebRTCPeerConnection.getPeer(peerId);
        if (!peer || !peer.pc) return;
        
        // Create a new offer with ICE restart
        const offer = await window.WebRTCPeerConnection.createOffer(peerId, { iceRestart: true });
        if (offer) {
            window.WebRTCSignaling.sendWebRTCOffer(peerId, offer, {
                fromUserName: this.state.userName,
                isIceRestart: true,
                isReconnect: true
            });
            window.WebRTCUI.addLogEntry(`Sent ICE restart offer to ${peerName}`, 'signal');
        }
    }
};

// Export the controller to the global scope
window.WebRTCController = WebRTCController;

// If the module is loaded in a Node.js environment, export it
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebRTCController;
}